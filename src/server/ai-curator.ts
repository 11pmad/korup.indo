import { GoogleGenAI, Type } from '@google/genai';
import { env } from '@/env';
import { safeExternalUrlSchema } from './validators';

export interface AiChatMessage {
  role: 'admin' | 'ai';
  text: string;
}

export interface AiCuratorDraft {
  caseTitle: string;
  caseNumber?: string;
  personName: string;
  personPosition: string;
  provinceName: string;
  eraId: string;
  sectorCategory:
    | 'pengadaan_barang_jasa'
    | 'bansos_bencana'
    | 'suap_gratifikasi'
    | 'perizinan_sda_tambang'
    | 'mafia_peradilan'
    | 'perbankan_keuangan'
    | 'bumn_korporasi'
    | 'pajak_bea_cukai'
    | 'penyalahgunaan_anggaran';
  currentLegalStatus: 'tersangka' | 'terdakwa' | 'divonis_inkrah' | 'bebas' | 'lepas';
  financialType:
    | 'court_recognized_loss_amount'
    | 'audit_loss_amount'
    | 'alleged_loss_amount'
    | 'bribe_amount'
    | 'gratification_amount';
  amount: number;
  summary: string;
  sourceTitle: string;
  sourceUrl: string;
  sourceInstitution: string;
  sourceExcerpt: string;
  verdictDecisionNumber?: string;
  prisonMonths?: number;
}

export interface AiCuratorResponse {
  isDraftReady: boolean;
  message: string;
  missingFields: string[];
  draft?: AiCuratorDraft;
}

const SYSTEM_INSTRUCTION = `Kamu adalah Asisten Kurator Hukum untuk portal Liga Korupsi Indonesia (LKI).
ATURAN MUTLAK:
1. Dilarang membuat draft tanpa URL sumber hukum/berita resmi yang valid (https://). Jika URL tidak ada di input admin, wajib set isDraftReady=false dan minta URL sumber.
2. Patuhi Asas Praduga Tak Bersalah (Pasal 8 ayat 1 UU No. 48/2009): jangan pernah menyamakan Tersangka/Terdakwa dengan Terpidana Inkrah.
3. Patuhi Anti Double-Counting: pisahkan kerugian negara putusan/audit dengan suap atau nilai proyek.
4. Era ID valid: era-orla, era-orba, era-habibie, era-gusdur, era-megawati, era-sby-1, era-sby-2, era-jokowi-1, era-jokowi-2, era-prabowo.
5. Jangan pernah mengarang angka atau nomor putusan yang tidak ada dalam teks masukan admin.`;

function fallbackRuleParser(message: string, history: AiChatMessage[]): AiCuratorResponse {
  const combined = [...history.map((h) => h.text), message].join('\n');
  const urls = combined.match(/https?:\/\/[^\s)]+/gi) ?? [];
  const validUrl = urls.find((u) => safeExternalUrlSchema.safeParse(u).success);

  const missing: string[] = [];
  if (!validUrl) missing.push('sourceUrl (URL resmi Mahkamah Agung, KPK, Kejaksaan, atau media kredibel)');

  const hasStatus = /inkrah|vonis|terpidana|terdakwa|tersangka|bebas|lepas/i.test(combined);
  if (!hasStatus) missing.push('statusHukum (tersangka / terdakwa / divonis_inkrah / bebas / lepas)');

  const hasAmount = /\d+(?:[.,]\d+)?\s*(?:triliun|miliar|milyar|juta|rb|ribu)/i.test(combined);
  if (!hasAmount) missing.push('nominal (kerugian negara atau nilai suap dalam Rupiah)');

  if (missing.length > 0) {
    return {
      isDraftReady: false,
      missingFields: missing,
      message: `Data belum lengkap untuk dipublikasikan. Mohon lengkapi informasi berikut:\n${missing
        .map((m, i) => `${i + 1}. ${m}`)
        .join('\n')}`,
    };
  }

  let amount = 0;
  const tMatch = combined.match(/(\d+(?:[.,]\d+)?)\s*triliun/i);
  const mMatch = combined.match(/(\d+(?:[.,]\d+)?)\s*(?:miliar|milyar)/i);
  const jMatch = combined.match(/(\d+(?:[.,]\d+)?)\s*juta/i);
  if (tMatch) amount = parseFloat(tMatch[1].replace(',', '.')) * 1e12;
  else if (mMatch) amount = parseFloat(mMatch[1].replace(',', '.')) * 1e9;
  else if (jMatch) amount = parseFloat(jMatch[1].replace(',', '.')) * 1e6;

  const currentLegalStatus: AiCuratorDraft['currentLegalStatus'] = /inkrah/i.test(combined)
    ? 'divonis_inkrah'
    : /bebas/i.test(combined)
      ? 'bebas'
      : /lepas/i.test(combined)
        ? 'lepas'
        : /terdakwa|sidang/i.test(combined)
          ? 'terdakwa'
          : 'tersangka';

  const isBribe = /suap|gratifikasi|ott/i.test(combined);
  const financialType: AiCuratorDraft['financialType'] = isBribe
    ? 'bribe_amount'
    : currentLegalStatus === 'divonis_inkrah'
      ? 'court_recognized_loss_amount'
      : 'alleged_loss_amount';

  const urlObj = new URL(validUrl!);
  return {
    isDraftReady: true,
    missingFields: [],
    message:
      'Draf terstruktur berhasil disusun oleh parser kurasi. Mohon periksa kembali nominal, status hukum, dan tautan sumber sebelum menyimpan.',
    draft: {
      caseTitle: message.slice(0, 120).trim(),
      personName: 'Subjek Perkara (Harap Verifikasi)',
      personPosition: 'Pejabat / Pihak Terkait',
      provinceName: 'Nasional / Pusat',
      eraId: 'era-prabowo',
      sectorCategory: isBribe ? 'suap_gratifikasi' : 'pengadaan_barang_jasa',
      currentLegalStatus,
      financialType,
      amount,
      summary: combined.slice(0, 600),
      sourceTitle: `Rujukan Resmi (${urlObj.hostname})`,
      sourceUrl: validUrl!,
      sourceInstitution: urlObj.hostname,
      sourceExcerpt: message.slice(0, 300),
    },
  };
}

export async function runAiCurator(
  latestMessage: string,
  history: AiChatMessage[] = []
): Promise<AiCuratorResponse> {
  if (!env.GEMINI_API_KEY) {
    return fallbackRuleParser(latestMessage, history);
  }

  try {
    const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
    const prompt = [
      history.length > 0
        ? `Riwayat percakapan:\n${history.map((h) => `${h.role.toUpperCase()}: ${h.text}`).join('\n')}`
        : '',
      `Instruksi Admin terbaru:\n${latestMessage}`,
    ]
      .filter(Boolean)
      .join('\n\n');

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.1,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isDraftReady: { type: Type.BOOLEAN },
            message: { type: Type.STRING },
            missingFields: { type: Type.ARRAY, items: { type: Type.STRING } },
            draft: {
              type: Type.OBJECT,
              properties: {
                caseTitle: { type: Type.STRING },
                caseNumber: { type: Type.STRING },
                personName: { type: Type.STRING },
                personPosition: { type: Type.STRING },
                provinceName: { type: Type.STRING },
                eraId: { type: Type.STRING },
                sectorCategory: { type: Type.STRING },
                currentLegalStatus: { type: Type.STRING },
                financialType: { type: Type.STRING },
                amount: { type: Type.NUMBER },
                summary: { type: Type.STRING },
                sourceTitle: { type: Type.STRING },
                sourceUrl: { type: Type.STRING },
                sourceInstitution: { type: Type.STRING },
                sourceExcerpt: { type: Type.STRING },
                verdictDecisionNumber: { type: Type.STRING },
                prisonMonths: { type: Type.INTEGER },
              },
            },
          },
          required: ['isDraftReady', 'message', 'missingFields'],
        },
      },
    });

    const text = response.text?.trim();
    if (!text) return fallbackRuleParser(latestMessage, history);
    const parsed = JSON.parse(text) as AiCuratorResponse;

    // Enforce source URL safety in code regardless of model output
    if (parsed.isDraftReady && parsed.draft) {
      const urlCheck = safeExternalUrlSchema.safeParse(parsed.draft.sourceUrl);
      if (!urlCheck.success) {
        return {
          isDraftReady: false,
          missingFields: ['sourceUrl'],
          message:
            'Draf ditahan oleh guardrail sistem: URL sumber primer tidak valid atau belum disertakan.',
        };
      }
    }

    return parsed;
  } catch (err) {
    console.warn('Gemini AI Curator fallback triggered:', err);
    return fallbackRuleParser(latestMessage, history);
  }
}
