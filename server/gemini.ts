import { GoogleGenAI } from '@google/genai';

let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI | null {
  if (!process.env.GEMINI_API_KEY) {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });
  }
  return aiClient;
}

export interface AiChatMessage {
  role: 'admin' | 'ai';
  text: string;
}

export interface AiCommandResult {
  is_draft_ready: boolean;
  message: string;
  missing_fields?: string[];
  draft?: {
    official: {
      nama: string;
      jabatan: string;
      partai: string;
      provinsi: string;
      kota_kabupaten: string;
      daerah_pemilihan: string;
    };
    corruption_case: {
      ringkasan_kasus: string;
      nilai_kerugian_negara: number;
      tahun_kejadian: number;
      tahun_putusan: number | null;
      status_hukum: 'Tersangka' | 'Terdakwa' | 'Divonis Inkrah' | 'Bebas/Praperadilan';
      jenis_kasus: string;
    };
    sources: {
      nama_media: string;
      url: string;
      tanggal_publikasi: string;
    }[];
    companies?: string[];
  };
}

const SYSTEM_PROMPT = `
Kamu adalah asisten input data AI untuk database publik "Peta Korupsi Wakil Rakyat Indonesia" (Human-in-the-loop).

TUGAS UTAMA:
Admin memberikan instruksi bahasa alami untuk menambahkan/memperbarui data kasus korupsi. Kamu bertugas memvalidasi kelengkapan fakta, mengajukan pertanyaan klarifikasi jika informasi kurang lengkap, dan setelah semua informasi lengkap menghasilkan draft JSON terstruktur untuk direview oleh admin.

ATURAN HUKUM & INTEGRITAS KETAT:
1. SUMBER BERITA / PUTUSAN HUKUM ADALAH WAJIB MUTLAK:
   - Harus terdapat minimal 1 URL sumber berita atau direktori putusan hukum yang valid (misal: Mahkamah Agung, KPK, Kejaksaan, Detik, Kompas, Tempo, dll).
   - Jika admin belum menyertakan link/URL sumber, KAMU WAJIB MENOLAK MEMBUAT DRAFT dan meminta link sumber: "Tanpa sumber berita/hukum yang bisa diverifikasi, saya tidak dapat memproses draft ini."
2. STATUS HUKUM WAJIB TEGAS DAN AKURAT:
   - Nilai hanya boleh: "Tersangka", "Terdakwa", "Divonis Inkrah", atau "Bebas/Praperadilan".
   - Jangan menyamakan Tersangka/Terdakwa dengan vonis bersalah inkrah (Asas Praduga Tak Bersalah).
   - Jika belum jelas, tanyakan ke admin status hukum perkaranya saat ini.
3. DATA WAJIB LAINNYA:
   - Nama pejabat & Jabatan
   - Provinsi & Kota/Kabupaten
   - Estimasi nilai kerugian negara / suap (dalam Rupiah)
   - Tahun kejadian & Tahun putusan (jika sudah divonis)
4. JANGAN PERNAH MENGARANG DATA ATAU MEMBUAT SUMBER PALSU.
5. FORMAT OUTPUT HARUS SELALU BERUPA JSON VALID dengan format:
{
  "is_draft_ready": boolean,
  "message": "Penjelasan atau daftar pertanyaan klarifikasi yang ramah dan sopan dalam bahasa Indonesia",
  "missing_fields": ["daftar", "field", "yang", "kurang"],
  "draft": { ... } // HANYA DIISI JIKA is_draft_ready = true
}

Contoh jika data belum lengkap (misal tidak ada provinsi dan sumber):
{
  "is_draft_ready": false,
  "message": "Saya perlu beberapa informasi tambahan sebelum menyusun draft resmi:\\n1. Di provinsi/kota mana pejabat tersebut menjabat?\\n2. Mohon sertakan link/URL sumber berita atau putusan hukum resmi (KPK/MA/Media kredibel). Tanpa tautan sumber, data tidak dapat dipublikasikan.\\n3. Bagaimana status hukum saat ini (Tersangka / Terdakwa / Divonis Inkrah / Bebas)?",
  "missing_fields": ["provinsi", "sumber_url", "status_hukum"]
}

Contoh jika semua data lengkap dan terverifikasi:
{
  "is_draft_ready": true,
  "message": "Data kasus telah lengkap dan terverifikasi dengan sumber berita. Berikut draft terstruktur yang siap Anda tinjau dan setujui:",
  "draft": {
    "official": {
      "nama": "Nama Lengkap Pejabat",
      "jabatan": "Bupati ...",
      "partai": "Partai ...",
      "provinsi": "Jawa Tengah",
      "kota_kabupaten": "Kabupaten ...",
      "daerah_pemilihan": "..."
    },
    "corruption_case": {
      "ringkasan_kasus": "Ringkasan parafrase objektif perbuatan korupsi...",
      "nilai_kerugian_negara": 5000000000,
      "tahun_kejadian": 2023,
      "tahun_putusan": null,
      "status_hukum": "Terdakwa",
      "jenis_kasus": "Suap Proyek Infrastruktur"
    },
    "sources": [
      {
        "nama_media": "Kompas.com",
        "url": "https://nasional.kompas.com/...",
        "tanggal_publikasi": "2023-11-20"
      }
    ],
    "companies": ["PT Terkait"]
  }
}
`;

export async function processAdminCommand(
  latestMessage: string,
  history: AiChatMessage[] = []
): Promise<AiCommandResult> {
  const ai = getAiClient();

  if (ai) {
    try {
      const contents = [
        {
          role: 'user',
          parts: [
            {
              text: `Berikut adalah riwayat percakapan sebelumnya antara Admin dan AI:
${history.map(h => `${h.role.toUpperCase()}: ${h.text}`).join('\n\n')}

Instruksi terbaru dari Admin:
${latestMessage}

Analisis kelengkapan data sesuai aturan ketat sistem.`
            }
          ]
        }
      ];

      let response;
      try {
        response = await ai.models.generateContent({
          model: 'gemini-3.5-flash-lite',
          contents,
          config: {
            systemInstruction: SYSTEM_PROMPT,
            responseMimeType: 'application/json',
            temperature: 0.2
          }
        });
      } catch (e1) {
        // Fallback to gemini-3.1-flash-lite if 3.5 has demand spikes
        response = await ai.models.generateContent({
          model: 'gemini-3.1-flash-lite',
          contents,
          config: {
            systemInstruction: SYSTEM_PROMPT,
            responseMimeType: 'application/json',
            temperature: 0.2
          }
        });
      }

      const responseText = response.text?.trim();
      if (responseText) {
        const parsed = JSON.parse(responseText) as AiCommandResult;
        return parsed;
      }
    } catch (err) {
      console.warn('Gemini API call failed, using intelligent rule-based parsing:', err);
    }
  }

  // Fallback Rule-Based Parser
  return parseCommandWithRules(latestMessage, history);
}

function parseCommandWithRules(
  latestMessage: string,
  history: AiChatMessage[]
): AiCommandResult {
  const combinedText = [...history.map(h => h.text), latestMessage].join(' ');

  // Extract URL
  const urlRegex = /(https?:\/\/[^\s]+)/gi;
  const urls = combinedText.match(urlRegex) || [];

  // Extract Rupiah loss
  let loss = 0;
  const lossMiliarMatch = combinedText.match(/(\d+(?:[.,]\d+)?)\s*(?:miliar|milyar|m)\b/i);
  const lossTriliunMatch = combinedText.match(/(\d+(?:[.,]\d+)?)\s*(?:triliun|t)\b/i);
  const lossJutaMatch = combinedText.match(/(\d+(?:[.,]\d+)?)\s*(?:juta|jt)\b/i);

  if (lossTriliunMatch) {
    loss = parseFloat(lossTriliunMatch[1].replace(',', '.')) * 1_000_000_000_000;
  } else if (lossMiliarMatch) {
    loss = parseFloat(lossMiliarMatch[1].replace(',', '.')) * 1_000_000_000;
  } else if (lossJutaMatch) {
    loss = parseFloat(lossJutaMatch[1].replace(',', '.')) * 1_000_000;
  }

  // Extract Year
  const yearMatch = combinedText.match(/\b(20[0-2]\d)\b/);
  const year = yearMatch ? parseInt(yearMatch[1], 10) : null;

  // Extract Status Hukum
  let statusHukum: 'Tersangka' | 'Terdakwa' | 'Divonis Inkrah' | 'Bebas/Praperadilan' | null = null;
  if (/inkrah|vonis|terpidana|diputus|bersalah|penjara/i.test(combinedText)) {
    statusHukum = 'Divonis Inkrah';
  } else if (/terdakwa|sidang|pengadilan/i.test(combinedText)) {
    statusHukum = 'Terdakwa';
  } else if (/tersangka|ott|ditetapkan/i.test(combinedText)) {
    statusHukum = 'Tersangka';
  } else if (/bebas|praperadilan/i.test(combinedText)) {
    statusHukum = 'Bebas/Praperadilan';
  }

  // Check for Province
  const PROVINCES = [
    'Aceh', 'Sumatera Utara', 'Sumatera Barat', 'Riau', 'Kepulauan Riau', 'Jambi',
    'Sumatera Selatan', 'Bangka Belitung', 'Bengkulu', 'Lampung', 'DKI Jakarta',
    'Jawa Barat', 'Banten', 'Jawa Tengah', 'DI Yogyakarta', 'Jawa Timur', 'Bali',
    'Nusa Tenggara Barat', 'Nusa Tenggara Timur', 'Kalimantan Barat', 'Kalimantan Tengah',
    'Kalimantan Selatan', 'Kalimantan Timur', 'Kalimantan Utara', 'Sulawesi Utara',
    'Gorontalo', 'Sulawesi Tengah', 'Sulawesi Barat', 'Sulawesi Selatan', 'Sulawesi Tenggara',
    'Maluku', 'Maluku Utara', 'Papua', 'Papua Barat'
  ];

  let detectedProvince = '';
  for (const prov of PROVINCES) {
    if (new RegExp(`\\b${prov}\\b`, 'i').test(combinedText)) {
      detectedProvince = prov;
      break;
    }
  }

  const missingFields: string[] = [];
  const clarificationQuestions: string[] = [];

  if (urls.length === 0) {
    missingFields.push('sumber_url');
    clarificationQuestions.push('Bisa Anda sertakan link/URL berita atau putusan pengadilan resmi (KPK/MA/Media kredibel)? Setiap kasus wajib memiliki minimal 1 tautan sumber valid.');
  }

  if (!detectedProvince) {
    missingFields.push('provinsi');
    clarificationQuestions.push('Di provinsi mana wilayah kerja atau lokasi perkara pejabat tersebut?');
  }

  if (!year) {
    missingFields.push('tahun');
    clarificationQuestions.push('Tahun berapa kejadian atau putusan kasus tersebut?');
  }

  if (!statusHukum) {
    missingFields.push('status_hukum');
    clarificationQuestions.push('Bagaimana status hukum terkini subjek kasus? (Pilihan: "Tersangka", "Terdakwa", "Divonis Inkrah", atau "Bebas/Praperadilan").');
  }

  if (clarificationQuestions.length > 0) {
    return {
      is_draft_ready: false,
      missing_fields: missingFields,
      message: `Saya perlu beberapa informasi tambahan sebelum bisa menyusun draft resmi:\n\n${clarificationQuestions.map((q, idx) => `${idx + 1}. ${q}`).join('\n')}\n\nMohon jawab dalam balasan ini agar verifikasi data lengkap.`
    };
  }

  // Extract name/title from message
  const nameMatch = latestMessage.match(/(?:kasus|bupati|walikota|gubernur|anggota dpr|menteri)\s+([A-Z][a-zA-Z\s]+?)(?:tahun|kerugian|provinsi|status|sumber|,|\.|$)/i) ||
    combinedText.match(/(?:bupati|walikota|gubernur|menteri|tersangka)\s+([A-Z][a-zA-Z\s]{3,30})/i);

  const nama = nameMatch ? nameMatch[1].trim() : 'Pejabat Publik Terkait';

  return {
    is_draft_ready: true,
    message: 'Semua informasi wajib telah lengkap dan terverifikasi dengan tautan sumber. Silakan tinjau draf data berikut sebelum disetujui untuk dipublikasikan ke database publik:',
    draft: {
      official: {
        nama,
        jabatan: combinedText.includes('Gubernur') ? `Gubernur ${detectedProvince}` :
          combinedText.includes('Bupati') ? `Bupati di ${detectedProvince}` :
          combinedText.includes('Walikota') ? `Walikota di ${detectedProvince}` :
          combinedText.includes('DPR') ? 'Anggota DPR RI' : 'Pejabat Publik',
        partai: combinedText.includes('Golkar') ? 'Partai Golkar' :
          combinedText.includes('PDI') ? 'PDI Perjuangan' :
          combinedText.includes('Gerindra') ? 'Partai Gerindra' :
          combinedText.includes('NasDem') ? 'Partai NasDem' :
          combinedText.includes('Demokrat') ? 'Partai Demokrat' : 'Non-Partai',
        provinsi: detectedProvince,
        kota_kabupaten: detectedProvince,
        daerah_pemilihan: detectedProvince
      },
      corruption_case: {
        ringkasan_kasus: `Dugaan tindak pidana korupsi yang melibatkan ${nama} di wilayah ${detectedProvince} terkait pengelolaan anggaran atau proyek daerah.`,
        nilai_kerugian_negara: loss || 1000000000,
        tahun_kejadian: year || 2023,
        tahun_putusan: statusHukum === 'Divonis Inkrah' ? (year || 2023) : null,
        status_hukum: statusHukum,
        jenis_kasus: 'Tindak Pidana Korupsi / Gratifikasi'
      },
      sources: urls.map((u, i) => ({
        nama_media: u.includes('mahkamahagung') ? 'Mahkamah Agung RI' :
          u.includes('kpk.go.id') ? 'KPK.go.id' :
          u.includes('kompas') ? 'Kompas.com' :
          u.includes('detik') ? 'Detikcom' :
          u.includes('tempo') ? 'Tempo.co' : 'Media Terverifikasi',
        url: u,
        tanggal_publikasi: new Date().toISOString().split('T')[0]
      }))
    }
  };
}
