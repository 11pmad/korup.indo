import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import { NextRequest, NextResponse } from 'next/server';
import { and, asc, desc, eq, ilike, inArray, lt, or, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { db, schema } from '@/server/db';
import { env, isDatabaseConfigured } from '@/env';
import {
  getStaticDataset,
  PUBLIC_ANNOUNCEMENT_DEFAULT,
  PUBLIC_DONATION_DEFAULT,
} from '@/server/static-dataset';
import {
  ADMIN_COOKIE_NAME,
  applyRateLimit,
  CITIZEN_COOKIE_NAME,
  cookieOptions,
  getCitizenSession,
  getClientIp,
  hashIp,
  recordAuditLog,
  requireAdminApi,
  signAdminSession,
  signCitizenSession,
} from '@/server/auth';
import { recomputeCaseAndGlobalAggregates } from '@/server/services/financials';
import { runAiCurator } from '@/server/ai-curator';
import { sendCitizenOtpEmail } from '@/server/mailer';
import { safeExternalUrlSchema } from '@/server/validators';
import { resolveProvinceId } from '@/lib/provinces';
import { mapSectorToCategory, slugify, toNum } from '@/lib/formatters';

const REACTION_DEFINITIONS = {
  geram: { emoji: '😡', label: 'Sangat Geram', spectrum: 'kecaman', description: 'Tindakan serakah dan tidak bermoral yang melukai rasa keadilan rakyat.' },
  rampok: { emoji: '💸', label: 'Rampok Uang Rakyat', spectrum: 'kecaman', description: 'Menguras anggaran negara demi kemewahan pribadi dan kroni.' },
  memalukan: { emoji: '🤮', label: 'Memalukan & Menjijikkan', spectrum: 'kecaman', description: 'Merusak kehormatan institusi dan moral bangsa.' },
  didukung: { emoji: '🤝', label: 'Didukung & Masuk Akal', spectrum: 'pemakluman', description: 'Kebijakan demi kepentingan rakyat atau fasilitas penunjang tugas dinas yang wajar.' },
  khilaf_administrasi: { emoji: '💡', label: 'Khilaf Administrasi (Niat Baik)', spectrum: 'pemakluman', description: 'Kesalahan prosedur tanpa niat korupsi; pejabat bersangkutan tidak menikmati sepeser pun.' },
  dimaklumi: { emoji: '🕊️', label: 'Dimaklumi & Dimaafkan', spectrum: 'pemakluman', description: 'Kerugian negara nihil/dipulihkan; dakwaan hukum terasa berlebihan.' },
  tebang_pilih: { emoji: '⚖️', label: 'Janggal / Tebang Pilih', spectrum: 'skeptis', description: 'Aroma politisasi hukum atau penargetan lawan politik secara selektif.' },
  kawal_sidang: { emoji: '🧐', label: 'Kawal Sidang Objektif', spectrum: 'skeptis', description: 'Fakta belum terang; masyarakat harus mengawal pembuktian di pengadilan.' },
} as const;

function toLegacyLegalStatus(status: string): 'divonis_inkrah' | 'terdakwa' | 'tersangka' | 'bebas' {
  if (status === 'divonis_inkrah' || status === 'divonis_bersalah') return 'divonis_inkrah';
  if (status === 'terdakwa' || status === 'dituntut' || status === 'banding' || status === 'kasasi' || status === 'peninjauan_kembali') {
    return 'terdakwa';
  }
  if (status === 'bebas' || status === 'lepas') return 'bebas';
  return 'tersangka';
}

function toDisplayLegalStatus(status: string): 'Divonis Inkrah' | 'Terdakwa' | 'Tersangka' | 'Bebas/Praperadilan' {
  const mapped = toLegacyLegalStatus(status);
  if (mapped === 'divonis_inkrah') return 'Divonis Inkrah';
  if (mapped === 'terdakwa') return 'Terdakwa';
  if (mapped === 'tersangka') return 'Tersangka';
  return 'Bebas/Praperadilan';
}

function toLegacySector(sector: string): string {
  if (sector === 'perbankan_keuangan' || sector === 'bumn_korporasi' || sector === 'pajak_bea_cukai') {
    return 'mafia_peradilan';
  }
  if (sector === 'penyalahgunaan_anggaran') return 'pengadaan_barang_jasa';
  return sector;
}

function effectiveLoss(c: {
  display_loss_amount: unknown;
  display_bribe_amount: unknown;
  display_recovery_amount: unknown;
}): number {
  const loss = toNum(c.display_loss_amount as string);
  if (loss > 0) return loss;
  const bribe = toNum(c.display_bribe_amount as string);
  if (bribe > 0) return bribe;
  return toNum(c.display_recovery_amount as string);
}

function getStaticLegacyRawRows() {
  const ds = getStaticDataset();
  const personById = new Map(ds.persons.map((p) => [p.id, p]));
  const partyById = new Map(ds.parties.map((p) => [p.id, p]));
  const compById = new Map(ds.companies.map((c) => [c.id, c]));

  return {
    rows: ds.cases.map((c) => ({
      id: c.id,
      slug: c.slug,
      title: c.case_title,
      case_number: c.case_number,
      era_id: c.era_id,
      era_name: c.era_name,
      province_id: c.primary_province_id,
      province_name: c.province_name,
      sector_category: c.sector_category,
      sector_label: c.sector_label,
      case_date: c.case_date,
      final_decision_date: c.final_decision_date,
      current_legal_status: c.current_legal_status,
      chronology: c.summary,
      charges_articles: c.charges_articles,
      display_loss_amount: String(c.display_loss_amount),
      display_bribe_amount: String(c.display_bribe_amount),
      display_recovery_amount: String(c.display_recovery_amount),
      created_at: c.created_at,
    })),
    cpRows: ds.casePersons.map((cp) => {
      const p = personById.get(cp.person_id);
      return {
        case_id: cp.case_id,
        person_id: cp.person_id,
        full_name: p?.full_name ?? '',
        occupation: p?.occupation ?? null,
        photo_url: p?.photo_url ?? null,
        role_in_case: cp.role_in_case,
      };
    }),
    partyRows: ds.partyMemberships.map((pm) => {
      const pt = partyById.get(pm.party_id);
      return {
        person_id: pm.person_id,
        party_id: pm.party_id,
        party_name: pt?.name ?? 'Non-Partai',
        party_at_offense: pm.party_at_offense,
      };
    }),
    ccRows: ds.caseCompanies.map((cc) => ({
      case_id: cc.case_id,
      company_name: compById.get(cc.company_id)?.name ?? '',
    })),
    csRows: ds.caseSources.map((cs) => ({
      case_id: cs.case_id,
      source_id: cs.source_id,
      source_title: cs.source_title,
      source_url: cs.source_url,
      source_institution: cs.source_institution,
      publication_date: cs.publication_date,
    })),
    verRows: ds.verdicts.map((v) => ({
      case_id: v.case_id,
      decision_number: v.decision_number,
      prison_sentence_months: v.prison_sentence_months,
      fine_amount: String(v.fine_amount),
      restitution_amount: String(v.restitution_amount),
      is_final: v.is_final,
    })),
  };
}

async function fetchRawLegacyRows() {
  if (!isDatabaseConfigured) return getStaticLegacyRawRows();
  try {
    const rows = await db
      .select({
        id: schema.cases.id,
        slug: schema.cases.slug,
        title: schema.cases.case_title,
        case_number: schema.cases.case_number,
        era_id: schema.cases.era_id,
        era_name: schema.presidentialEras.name,
        province_id: schema.cases.primary_province_id,
        province_name: schema.provinces.name,
        sector_category: schema.cases.sector_category,
        sector_label: schema.cases.sector_label,
        case_date: schema.cases.case_date,
        final_decision_date: schema.cases.final_decision_date,
        current_legal_status: schema.cases.current_legal_status,
        chronology: schema.cases.summary,
        charges_articles: schema.cases.charges_articles,
        display_loss_amount: schema.cases.display_loss_amount,
        display_bribe_amount: schema.cases.display_bribe_amount,
        display_recovery_amount: schema.cases.display_recovery_amount,
        created_at: schema.cases.created_at,
      })
      .from(schema.cases)
      .leftJoin(schema.presidentialEras, eq(schema.cases.era_id, schema.presidentialEras.id))
      .leftJoin(schema.provinces, eq(schema.cases.primary_province_id, schema.provinces.id));

    const [cpRows, partyRows, ccRows, csRows, verRows] = await Promise.all([
      db
        .select({
          case_id: schema.casePersons.case_id,
          person_id: schema.persons.id,
          full_name: schema.persons.full_name,
          occupation: schema.persons.occupation,
          photo_url: schema.persons.photo_url,
          role_in_case: schema.casePersons.role_in_case,
        })
        .from(schema.casePersons)
        .innerJoin(schema.persons, eq(schema.casePersons.person_id, schema.persons.id)),
      db
        .select({
          person_id: schema.partyMemberships.person_id,
          party_id: schema.parties.id,
          party_name: schema.parties.name,
          party_at_offense: schema.partyMemberships.party_at_offense,
        })
        .from(schema.partyMemberships)
        .innerJoin(schema.parties, eq(schema.partyMemberships.party_id, schema.parties.id)),
      db
        .select({
          case_id: schema.caseCompanies.case_id,
          company_name: schema.companies.name,
        })
        .from(schema.caseCompanies)
        .innerJoin(schema.companies, eq(schema.caseCompanies.company_id, schema.companies.id)),
      db
        .select({
          case_id: schema.caseSources.case_id,
          source_id: schema.sources.id,
          source_title: schema.sources.source_title,
          source_url: schema.sources.source_url,
          source_institution: schema.sources.source_institution,
          publication_date: schema.sources.publication_date,
        })
        .from(schema.caseSources)
        .innerJoin(schema.sources, eq(schema.caseSources.source_id, schema.sources.id)),
      db
        .select({
          case_id: schema.verdicts.case_id,
          decision_number: schema.verdicts.decision_number,
          prison_sentence_months: schema.verdicts.prison_sentence_months,
          fine_amount: schema.verdicts.fine_amount,
          restitution_amount: schema.verdicts.restitution_amount,
          is_final: schema.verdicts.is_final,
        })
        .from(schema.verdicts),
    ]);
    return { rows, cpRows, partyRows, ccRows, csRows, verRows };
  } catch {
    return getStaticLegacyRawRows();
  }
}

async function loadLegacyCases(filters?: {
  q?: string;
  province?: string;
  era?: string;
  status?: string;
  sector?: string;
  sort_by?: string;
  order?: string;
  page?: number;
  limit?: number;
}) {
  const { rows, cpRows, partyRows, ccRows, csRows, verRows } = await fetchRawLegacyRows();

  const partyByPerson = new Map<string, { party_id: string; party_name: string }>();
  for (const pr of partyRows) {
    if (!partyByPerson.has(pr.person_id) || pr.party_at_offense) {
      partyByPerson.set(pr.person_id, { party_id: pr.party_id, party_name: pr.party_name });
    }
  }
  const cpByCase = new Map<string, typeof cpRows[number]>();
  for (const cp of cpRows) {
    if (!cpByCase.has(cp.case_id)) cpByCase.set(cp.case_id, cp);
  }
  const compsByCase = new Map<string, string[]>();
  for (const cc of ccRows) {
    const arr = compsByCase.get(cc.case_id) ?? [];
    arr.push(cc.company_name);
    compsByCase.set(cc.case_id, arr);
  }
  const sourcesByCase = new Map<string, typeof csRows>();
  for (const cs of csRows) {
    const arr = sourcesByCase.get(cs.case_id) ?? [];
    arr.push(cs);
    sourcesByCase.set(cs.case_id, arr);
  }
  const verdictByCase = new Map<string, typeof verRows[number]>();
  for (const v of verRows) {
    if (!verdictByCase.has(v.case_id) || v.is_final) verdictByCase.set(v.case_id, v);
  }

  let mapped = rows.map((r) => {
    const cp = cpByCase.get(r.id);
    const party = cp ? partyByPerson.get(cp.person_id) : undefined;
    const srcs = sourcesByCase.get(r.id) ?? [];
    const verdict = verdictByCase.get(r.id);
    const lossAmount = effectiveLoss(r);
    const year = r.case_date ? parseInt(r.case_date.slice(0, 4), 10) || 2024 : 2024;
    const decisionYear = r.final_decision_date ? parseInt(r.final_decision_date.slice(0, 4), 10) || null : null;
    const legStatus = toLegacyLegalStatus(r.current_legal_status);
    const dispStatus = toDisplayLegalStatus(r.current_legal_status);

    return {
      id: r.id,
      slug: r.slug,
      title: r.title,
      loss_amount: lossAmount,
      fine_amount: verdict ? toNum(verdict.fine_amount) : 0,
      restitution_amount: verdict ? toNum(verdict.restitution_amount) : toNum(r.display_recovery_amount),
      prison_sentence_months: verdict?.prison_sentence_months ?? 0,
      legal_status: legStatus,
      court_decision_number: verdict?.decision_number || r.case_number || null,
      chronology: r.chronology,
      charges_articles: r.charges_articles,
      source_url: srcs[0]?.source_url || 'https://putusan3.mahkamahagung.go.id',
      sector_category: toLegacySector(r.sector_category),
      case_date: r.case_date,
      created_at: r.created_at,
      official_id: cp?.person_id || '',
      official_name: cp?.full_name || r.title.slice(0, 60),
      official_position: cp?.role_in_case || cp?.occupation || r.sector_label,
      official_photo: cp?.photo_url || null,
      party_id: party?.party_id || 'pty-nonpartai',
      party_name: party?.party_name || 'Non-Partai',
      province_id: r.province_id,
      province_name: r.province_name || 'Nasional / Pusat',
      era_id: r.era_id,
      era_name: r.era_name || '',
      perusahaan_terkait: compsByCase.get(r.id) ?? [],
      official: {
        id: cp?.person_id || '',
        nama: cp?.full_name || r.title.slice(0, 60),
        jabatan: cp?.role_in_case || cp?.occupation || r.sector_label,
        partai: party?.party_name || 'Non-Partai',
        party_id: party?.party_id || 'pty-nonpartai',
        provinsi: r.province_name || 'Nasional / Pusat',
        kota_kabupaten: r.province_name || 'Nasional / Pusat',
        daerah_pemilihan: r.province_name || 'Nasional / Pusat',
        foto_url: cp?.photo_url || undefined,
      },
      ringkasan_kasus: r.chronology,
      nilai_kerugian_negara: lossAmount,
      tahun_kejadian: year,
      tahun_putusan: decisionYear ?? (legStatus === 'divonis_inkrah' ? year : null),
      status_hukum: dispStatus,
      jenis_kasus: r.sector_label,
      sources: srcs.map((s) => ({
        id: s.source_id,
        case_id: r.id,
        nama_media: s.source_institution || s.source_title,
        url: s.source_url,
        tanggal_publikasi: s.publication_date || r.case_date || new Date().toISOString().slice(0, 10),
      })),
      is_verified: true,
    };
  });

  if (filters?.province) {
    const pid = resolveProvinceId(filters.province);
    const pLower = filters.province.toLowerCase();
    mapped = mapped.filter(
      (c) => c.province_id === pid || c.province_id === filters.province || c.province_name.toLowerCase().includes(pLower)
    );
  }
  if (filters?.era) mapped = mapped.filter((c) => c.era_id === filters.era);
  if (filters?.status) mapped = mapped.filter((c) => c.legal_status === filters.status);
  if (filters?.sector) mapped = mapped.filter((c) => c.sector_category === filters.sector);
  if (filters?.q) {
    const q = filters.q.toLowerCase();
    mapped = mapped.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.chronology.toLowerCase().includes(q) ||
        c.official.nama.toLowerCase().includes(q) ||
        c.province_name.toLowerCase().includes(q)
    );
  }

  const isAsc = filters?.order === 'asc';
  mapped.sort((a, b) => {
    let diff = 0;
    if (filters?.sort_by === 'tahun' || filters?.sort_by === 'created_at') {
      diff = (a.case_date || '').localeCompare(b.case_date || '');
    } else if (filters?.sort_by === 'nama' || filters?.sort_by === 'official_name') {
      diff = a.official.nama.localeCompare(b.official.nama, 'id');
    } else if (filters?.sort_by === 'title') {
      diff = a.title.localeCompare(b.title, 'id');
    } else {
      diff = a.loss_amount - b.loss_amount;
    }
    return isAsc ? diff : -diff;
  });

  const totalItems = mapped.length;
  const page = Math.max(1, filters?.page ?? 1);
  const limit = Math.min(100, Math.max(1, filters?.limit ?? 20));
  const offset = (page - 1) * limit;

  return {
    items: mapped.slice(offset, offset + limit),
    allItems: mapped,
    pagination: {
      page,
      total_pages: Math.max(1, Math.ceil(totalItems / limit)),
      total_items: totalItems,
    },
  };
}

function computeSentiment(rows: Array<{ reaction_type: string }>) {
  const counts: Record<string, number> = {
    geram: 0,
    rampok: 0,
    memalukan: 0,
    didukung: 0,
    khilaf_administrasi: 0,
    dimaklumi: 0,
    tebang_pilih: 0,
    kawal_sidang: 0,
  };
  for (const r of rows) {
    if (counts[r.reaction_type] !== undefined) counts[r.reaction_type]++;
  }
  const total = rows.length;
  const kecamanCount = counts.geram + counts.rampok + counts.memalukan;
  const pemaklumanCount = counts.didukung + counts.khilaf_administrasi + counts.dimaklumi;
  const skeptisCount = counts.tebang_pilih + counts.kawal_sidang;
  const kecamanPct = total > 0 ? Math.round((kecamanCount / total) * 100) : 0;
  const pemaklumanPct = total > 0 ? Math.round((pemaklumanCount / total) * 100) : 0;
  const skeptisPct = total > 0 ? Math.round((skeptisCount / total) * 100) : 0;

  let badgeType: 'kecaman' | 'pemakluman' | 'skeptis' | 'netral' = 'netral';
  let badgeLabel = 'Belum Cukup Suara';
  if (total >= 1) {
    if (pemaklumanPct >= 50) {
      badgeType = 'pemakluman';
      badgeLabel = `🤝 Mayoritas Warga Memaklumi (${pemaklumanPct}%)`;
    } else if (kecamanPct >= 50) {
      badgeType = 'kecaman';
      badgeLabel = `🔥 Dikecam Keras Rakyat (${kecamanPct}%)`;
    } else if (skeptisPct >= 40) {
      badgeType = 'skeptis';
      badgeLabel = `⚖️ Dinilai Tebang Pilih / Janggal (${skeptisPct}%)`;
    } else {
      badgeLabel = '⚖️ Perdebatan Publik Seimbang';
    }
  }

  return {
    total,
    counts,
    spectrum: {
      kecaman: { count: kecamanCount, percentage: kecamanPct },
      pemakluman: { count: pemaklumanCount, percentage: pemaklumanPct },
      skeptis: { count: skeptisCount, percentage: skeptisPct },
    },
    badge: { type: badgeType, label: badgeLabel },
  };
}

function sanitizeCsvCell(val: unknown): string {
  if (val === null || val === undefined) return '""';
  let str = String(val);
  if (/^[=+\-@\t\r]/.test(str)) str = `'${str}`;
  return `"${str.replace(/"/g, '""')}"`;
}

async function getProvincesFallback() {
  if (!isDatabaseConfigured) return getStaticDataset().provinces;
  try {
    return await db.select().from(schema.provinces);
  } catch {
    return getStaticDataset().provinces;
  }
}

async function getPartiesFallback() {
  if (!isDatabaseConfigured) return getStaticDataset().parties;
  try {
    return await db.select().from(schema.parties);
  } catch {
    return getStaticDataset().parties;
  }
}

async function getErasFallback() {
  if (!isDatabaseConfigured) return getStaticDataset().eras;
  try {
    return await db.select().from(schema.presidentialEras).orderBy(asc(schema.presidentialEras.sort_order));
  } catch {
    return getStaticDataset().eras;
  }
}

function dbUnavailableResponse() {
  return NextResponse.json(
    { error: 'Database PostgreSQL produksi (DATABASE_URL) belum dihubungkan pada environment Vercel.' },
    { status: 503 }
  );
}

export async function handleLegacyApi(req: NextRequest, segments: string[]): Promise<NextResponse> {
  const method = req.method.toUpperCase();
  const routePath = segments.join('/');
  const sp = req.nextUrl.searchParams;

  try {
    // 1. /api/cases & /api/cases/:id
    if (method === 'GET' && routePath === 'cases') {
      const limited = await applyRateLimit(req, 'public_read', 120, 60);
      if (limited) return limited;
      const res = await loadLegacyCases({
        q: sp.get('q') ?? undefined,
        province: sp.get('province') ?? undefined,
        era: sp.get('era') ?? undefined,
        status: sp.get('status') ?? undefined,
        sector: sp.get('sector') ?? undefined,
        sort_by: sp.get('sort_by') ?? undefined,
        order: sp.get('order') ?? undefined,
        page: Number(sp.get('page') || 1),
        limit: Number(sp.get('limit') || 20),
      });
      return NextResponse.json({ data: res.items, cases: res.items, pagination: res.pagination });
    }

    if (method === 'GET' && segments.length === 2 && segments[0] === 'cases') {
      const id = decodeURIComponent(segments[1]);
      const { allItems } = await loadLegacyCases({ limit: 100 });
      const found = allItems.find((c) => c.id === id || c.slug === id);
      if (!found) return NextResponse.json({ error: 'Berkas perkara tidak ditemukan' }, { status: 404 });
      return NextResponse.json(found);
    }

    // 2. /api/regions/summary, /api/provinces, /api/provinces/summary, /api/provinces/:identifier
    if (method === 'GET' && (routePath === 'regions/summary' || routePath === 'provinces/summary')) {
      const [{ allItems }, provs] = await Promise.all([
        loadLegacyCases({ limit: 100 }),
        getProvincesFallback(),
      ]);
      const agg = new Map<string, { count: number; loss: number }>();
      for (const c of allItems) {
        const cur = agg.get(c.province_id) ?? { count: 0, loss: 0 };
        cur.count += 1;
        cur.loss += c.loss_amount;
        agg.set(c.province_id, cur);
      }
      return NextResponse.json(
        provs.map((p) => ({
          id: p.id,
          provinsi: p.name,
          island_group: p.island_cluster,
          total_kasus: agg.get(p.id)?.count ?? 0,
          total_kerugian: agg.get(p.id)?.loss ?? 0,
        }))
      );
    }

    if (method === 'GET' && routePath === 'provinces') {
      const [{ allItems }, provs] = await Promise.all([
        loadLegacyCases({ era: sp.get('era') ?? undefined, limit: 100 }),
        getProvincesFallback(),
      ]);
      const agg = new Map<string, { count: number; loss: number }>();
      for (const c of allItems) {
        const cur = agg.get(c.province_id) ?? { count: 0, loss: 0 };
        cur.count += 1;
        cur.loss += c.loss_amount;
        agg.set(c.province_id, cur);
      }
      const rows = provs
        .map((p, idx) => ({
          id: p.id,
          name: p.name,
          island_cluster: p.island_cluster,
          total_loss_amount: agg.get(p.id)?.loss ?? 0,
          total_cases: agg.get(p.id)?.count ?? 0,
          provinsi: p.name,
          total_kerugian: agg.get(p.id)?.loss ?? 0,
          total_kasus: agg.get(p.id)?.count ?? 0,
          island_group: p.island_cluster,
          rank: idx + 1,
        }))
        .sort((a, b) => b.total_loss_amount - a.total_loss_amount);
      return NextResponse.json({ data: rows, pagination: { page: 1, total_pages: 1, total_items: rows.length } });
    }

    if (method === 'GET' && segments[0] === 'provinces' && segments.length >= 2) {
      const identifier = decodeURIComponent(segments[1]);
      const provId = resolveProvinceId(identifier);
      const provs = await getProvincesFallback();
      const prov = provs.find((p) => p.id === provId);
      if (!prov) return NextResponse.json({ error: `Provinsi '${identifier}' tidak ditemukan.` }, { status: 404 });
      const { allItems } = await loadLegacyCases({ limit: 100 });
      const casesList = allItems.filter((c) => c.province_id === prov.id).sort((a, b) => b.loss_amount - a.loss_amount);
      const totalLoss = casesList.reduce((s, c) => s + c.loss_amount, 0);
      if (segments[2] === 'cases') {
        return NextResponse.json({ province_id: prov.id, province_name: prov.name, total: casesList.length, cases: casesList });
      }
      return NextResponse.json({
        province: { id: prov.id, name: prov.name, island_cluster: prov.island_cluster, total_cases: casesList.length, total_loss_amount: totalLoss },
        stats: { total_cases: casesList.length, total_loss_amount: totalLoss },
        cases: casesList,
      });
    }

    // 3. /api/leaderboard & /api/officials & /api/parties & /api/eras & /api/companies
    if (method === 'GET' && routePath === 'leaderboard') {
      const { allItems } = await loadLegacyCases({ limit: 100 });
      const byOfficial = new Map<string, any>();
      for (const c of allItems) {
        const key = c.official_id || c.id;
        const cur = byOfficial.get(key);
        if (!cur) {
          byOfficial.set(key, {
            official_id: key,
            nama: c.official.nama,
            jabatan: c.official.jabatan,
            partai: c.official.partai,
            provinsi: c.province_name,
            total_kasus: 1,
            total_kerugian_negara: c.loss_amount,
            status_hukum_terkini: c.status_hukum,
            tahun_terkini: c.tahun_kejadian,
            case_ids: [c.id],
          });
        } else {
          cur.total_kasus += 1;
          cur.total_kerugian_negara += c.loss_amount;
          if (c.tahun_kejadian > cur.tahun_terkini) cur.tahun_terkini = c.tahun_kejadian;
          cur.case_ids.push(c.id);
        }
      }
      const list = Array.from(byOfficial.values())
        .sort((a, b) => b.total_kerugian_negara - a.total_kerugian_negara)
        .map((item, idx) => ({ rank: idx + 1, ...item }));
      return NextResponse.json(list);
    }

    if (method === 'GET' && routePath === 'parties') {
      const [partiesList, { allItems }] = await Promise.all([
        getPartiesFallback(),
        loadLegacyCases({ limit: 100 }),
      ]);
      const agg = new Map<string, { cases: number; loss: number }>();
      for (const c of allItems) {
        const cur = agg.get(c.party_id) ?? { cases: 0, loss: 0 };
        cur.cases += 1;
        cur.loss += c.loss_amount;
        agg.set(c.party_id, cur);
      }
      return NextResponse.json(
        partiesList.map((p) => ({
          id: p.id,
          name: p.name,
          abbreviation: p.abbreviation,
          total_cases: agg.get(p.id)?.cases ?? 0,
          total_loss_amount: agg.get(p.id)?.loss ?? 0,
        }))
      );
    }

    if (method === 'GET' && routePath === 'eras') {
      const eras = await getErasFallback();
      return NextResponse.json(eras);
    }

    // 4. /api/stats/*
    if (method === 'GET' && routePath === 'stats/trends') {
      const metric = sp.get('metric') || 'combined';
      const { allItems } = await loadLegacyCases({ limit: 100 });
      const byYear = new Map<number, { tahun: number; nilai_kerugian: number; jumlah_kasus: number }>();
      for (let yr = 2011; yr <= 2026; yr++) byYear.set(yr, { tahun: yr, nilai_kerugian: 0, jumlah_kasus: 0 });
      for (const c of allItems) {
        const yr = c.tahun_kejadian;
        const cur = byYear.get(yr) ?? { tahun: yr, nilai_kerugian: 0, jumlah_kasus: 0 };
        cur.nilai_kerugian += c.loss_amount;
        cur.jumlah_kasus += 1;
        byYear.set(yr, cur);
      }
      const sorted = Array.from(byYear.values()).sort((a, b) => a.tahun - b.tahun);
      if (metric === 'loss_only') return NextResponse.json(sorted.map((t) => ({ tahun: t.tahun, nilai_kerugian: t.nilai_kerugian })));
      if (metric === 'cases_only') return NextResponse.json(sorted.map((t) => ({ tahun: t.tahun, jumlah_kasus: t.jumlah_kasus })));
      return NextResponse.json(
        sorted.map((t) => ({ ...t, label_kerugian: `Rp ${(t.nilai_kerugian / 1e12).toFixed(1)} T` }))
      );
    }

    if (method === 'GET' && routePath === 'stats/sectors') {
      const { allItems } = await loadLegacyCases({ limit: 100 });
      const sectorMap = new Map<string, { total_loss: number; total_cases: number }>();
      for (const c of allItems) {
        const cur = sectorMap.get(c.sector_category) ?? { total_loss: 0, total_cases: 0 };
        cur.total_loss += c.loss_amount;
        cur.total_cases += 1;
        sectorMap.set(c.sector_category, cur);
      }
      const meta: Record<string, { label: string; color: string }> = {
        perizinan_sda_tambang: { label: 'Perizinan SDA & Tambang', color: '#B91C1C' },
        pengadaan_barang_jasa: { label: 'Pengadaan Barang & Jasa', color: '#EA580C' },
        mafia_peradilan: { label: 'Mafia Keuangan & BUMN', color: '#D97706' },
        suap_gratifikasi: { label: 'Suap & Gratifikasi Jabatan', color: '#CA8A04' },
        bansos_bencana: { label: 'Bansos & Bencana Alam', color: '#E11D48' },
      };
      return NextResponse.json(
        Array.from(sectorMap.entries()).map(([sector, s]) => ({
          sector,
          label: meta[sector]?.label ?? sector.replace(/_/g, ' '),
          color: meta[sector]?.color ?? '#78716C',
          total_loss: s.total_loss,
          total_cases: s.total_cases,
        }))
      );
    }

    if (method === 'GET' && routePath === 'stats/hall-of-shame') {
      const { allItems } = await loadLegacyCases({ limit: 100 });
      const top = allItems
        .filter((c) => c.legal_status === 'divonis_inkrah')
        .sort((a, b) => b.loss_amount - a.loss_amount)
        .slice(0, 10)
        .map((c, idx) => ({
          rank: idx + 1,
          case_id: c.id,
          title: c.title,
          nama: c.official.nama,
          jabatan: c.official.jabatan,
          partai: c.official.partai,
          provinsi: c.province_name,
          nilai_kerugian_negara: c.loss_amount,
          status_hukum: c.status_hukum,
          vonis_penjara: c.prison_sentence_months ? `${Math.floor(c.prison_sentence_months / 12)} Tahun` : 'Putusan Inkrah',
          tahun: c.tahun_kejadian,
          foto_url: c.official_photo,
        }));
      return NextResponse.json(top);
    }

    if (method === 'GET' && routePath === 'stats/overview') {
      const { allItems } = await loadLegacyCases({ limit: 100 });
      const totalLoss = allItems.reduce((s, c) => s + c.loss_amount, 0);
      const provAgg = new Map<string, { provinsi: string; total_kasus: number; total_kerugian: number }>();
      const partyAgg = new Map<string, { partai: string; total_kasus: number; total_kerugian: number }>();
      for (const c of allItems) {
        const pCur = provAgg.get(c.province_name) ?? { provinsi: c.province_name, total_kasus: 0, total_kerugian: 0 };
        pCur.total_kasus += 1;
        pCur.total_kerugian += c.loss_amount;
        provAgg.set(c.province_name, pCur);

        const ptCur = partyAgg.get(c.official.partai) ?? { partai: c.official.partai, total_kasus: 0, total_kerugian: 0 };
        ptCur.total_kasus += 1;
        ptCur.total_kerugian += c.loss_amount;
        partyAgg.set(c.official.partai, ptCur);
      }
      const topProv = Array.from(provAgg.values()).sort((a, b) => b.total_kerugian - a.total_kerugian)[0] ?? {
        provinsi: '-',
        total_kasus: 0,
        total_kerugian: 0,
      };
      const partyColors: Record<string, string> = {
        'PDI Perjuangan': '#DC2626',
        'Partai Golkar': '#EAB308',
        'Partai Gerindra': '#EA580C',
        'Partai NasDem': '#1E3A8A',
        'Partai Demokrat': '#2563EB',
        'Partai Keadilan Sejahtera (PKS)': '#D97706',
        'Non-Partai': '#78716C',
      };
      let companiesRows: Array<{ name: string; business_sector: string | null }> = [];
      if (isDatabaseConfigured) {
        try {
          companiesRows = await db.select({ name: schema.companies.name, business_sector: schema.companies.business_sector }).from(schema.companies).limit(5);
        } catch {
          companiesRows = getStaticDataset().companies.slice(0, 5);
        }
      } else {
        companiesRows = getStaticDataset().companies.slice(0, 5);
      }
      return NextResponse.json({
        total_kasus_nasional: allItems.length,
        total_kasus: allItems.length,
        total_kerugian_akumulasi: totalLoss,
        total_kerugian_negara: totalLoss,
        total_kerugian: totalLoss,
        provinsi_terbanyak: topProv,
        top_kerugian: allItems
          .slice()
          .sort((a, b) => b.loss_amount - a.loss_amount)
          .slice(0, 5)
          .map((c) => ({
            case_id: c.id,
            nama: c.official.nama,
            jabatan: c.official.jabatan,
            nilai_kerugian_negara: c.loss_amount,
            status_hukum: c.status_hukum,
            tahun: c.tahun_kejadian,
          })),
        distribusi_partai: Array.from(partyAgg.values())
          .sort((a, b) => b.total_kerugian - a.total_kerugian)
          .map((p) => ({ ...p, color: partyColors[p.partai] || '#64748B' })),
        top_perusahaan: companiesRows.map((c) => ({
          nama_perusahaan: c.name,
          sektor: c.business_sector,
          total_kasus: 1,
        })),
      });
    }

    // 5. /api/settings/announcement & /api/settings/donation
    if (method === 'GET' && routePath === 'settings/announcement') {
      if (!isDatabaseConfigured) return NextResponse.json(PUBLIC_ANNOUNCEMENT_DEFAULT);
      try {
        const [row] = await db.select().from(schema.siteSettings).where(eq(schema.siteSettings.key, 'announcement')).limit(1);
        return NextResponse.json(row?.value ?? PUBLIC_ANNOUNCEMENT_DEFAULT);
      } catch {
        return NextResponse.json(PUBLIC_ANNOUNCEMENT_DEFAULT);
      }
    }

    if (method === 'GET' && routePath === 'settings/donation') {
      if (!isDatabaseConfigured) return NextResponse.json(PUBLIC_DONATION_DEFAULT);
      try {
        const [row] = await db.select().from(schema.siteSettings).where(eq(schema.siteSettings.key, 'donation')).limit(1);
        return NextResponse.json(row?.value ?? PUBLIC_DONATION_DEFAULT);
      } catch {
        return NextResponse.json(PUBLIC_DONATION_DEFAULT);
      }
    }

    // 6. /api/export & /api/export/catalog
    if (method === 'GET' && routePath === 'export') {
      const limited = await applyRateLimit(req, 'export_heavy', 20, 3600);
      if (limited) return limited;
      const type = sp.get('type') || 'cases';
      const format = sp.get('format') || 'csv';
      const { allItems } = await loadLegacyCases({ limit: 100 });
      let rows: Record<string, unknown>[] = [];
      if (type === 'officials') {
        rows = allItems.map((c, idx) => ({
          rank: idx + 1,
          nama: c.official.nama,
          jabatan: c.official.jabatan,
          partai: c.official.partai,
          provinsi: c.province_name,
          kerugian_idr: c.loss_amount,
          status: c.status_hukum,
        }));
      } else if (type === 'provinces') {
        const provs = await getProvincesFallback();
        rows = provs.map((p) => ({
          id: p.id,
          provinsi: p.name,
          pulau: p.island_cluster,
          total_kasus: p.cached_total_cases,
          total_kerugian_idr: toNum(p.cached_total_loss),
        }));
      } else if (type === 'parties') {
        const partiesList = await getPartiesFallback();
        rows = partiesList.map((p) => ({ id: p.id, partai: p.name, singkatan: p.abbreviation }));
      } else {
        rows = allItems.map((c) => ({
          id: c.id,
          judul: c.title,
          tokoh: c.official.nama,
          provinsi: c.province_name,
          era: c.era_name,
          status: c.status_hukum,
          kerugian_idr: c.loss_amount,
          sumber: c.source_url,
        }));
      }

      if (format === 'json') {
        return new NextResponse(JSON.stringify({ license: 'CC-BY 4.0', data: rows }, null, 2), {
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Content-Disposition': `attachment; filename="lki-${type}.json"`,
          },
        });
      }
      const headers = rows.length ? Object.keys(rows[0]) : ['id'];
      const csv = '\uFEFF' + [headers.join(','), ...rows.map((r) => headers.map((h) => sanitizeCsvCell(r[h])).join(','))].join('\r\n');
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="lki-${type}.csv"`,
        },
      });
    }

    // 7. Reactions (/api/reactions/case/:caseId)
    if (segments[0] === 'reactions' && segments[1] === 'case' && segments[2]) {
      const caseId = decodeURIComponent(segments[2]);
      if (method === 'GET') {
        if (!isDatabaseConfigured) {
          return NextResponse.json({
            status: 'success',
            data: { ...computeSentiment([]), userReaction: null, definitions: REACTION_DEFINITIONS },
          });
        }
        try {
          const [rows, citizen] = await Promise.all([
            db.select({ reaction_type: schema.caseReactions.reaction_type }).from(schema.caseReactions).where(eq(schema.caseReactions.case_id, caseId)),
            getCitizenSession(),
          ]);
          let userReaction: string | null = null;
          if (citizen) {
            const [uRow] = await db
              .select({ reaction_type: schema.caseReactions.reaction_type })
              .from(schema.caseReactions)
              .where(and(eq(schema.caseReactions.case_id, caseId), eq(schema.caseReactions.user_id, citizen.id)))
              .limit(1);
            userReaction = uRow?.reaction_type ?? null;
          }
          return NextResponse.json({
            status: 'success',
            data: { ...computeSentiment(rows), userReaction, definitions: REACTION_DEFINITIONS },
          });
        } catch {
          return NextResponse.json({
            status: 'success',
            data: { ...computeSentiment([]), userReaction: null, definitions: REACTION_DEFINITIONS },
          });
        }
      }
      if (method === 'POST') {
        if (!isDatabaseConfigured) return dbUnavailableResponse();
        const citizen = await getCitizenSession();
        if (!citizen) return NextResponse.json({ error: 'Silakan masuk sebagai warga terlebih dahulu.' }, { status: 401 });
        const body = await req.json().catch(() => ({}));
        const reactionType = body?.reaction_type;
        if (!reactionType || !(reactionType in REACTION_DEFINITIONS)) {
          return NextResponse.json({ error: 'Jenis reaksi tidak valid.' }, { status: 400 });
        }
        const [existing] = await db
          .select()
          .from(schema.caseReactions)
          .where(and(eq(schema.caseReactions.case_id, caseId), eq(schema.caseReactions.user_id, citizen.id)))
          .limit(1);
        let userReaction: string | null = reactionType;
        let message = 'Reaksi Anda berhasil dicatat!';
        if (existing && existing.reaction_type === reactionType) {
          await db.delete(schema.caseReactions).where(eq(schema.caseReactions.id, existing.id));
          userReaction = null;
          message = 'Reaksi Anda telah dibatalkan.';
        } else if (existing) {
          await db.update(schema.caseReactions).set({ reaction_type: reactionType }).where(eq(schema.caseReactions.id, existing.id));
        } else {
          await db.insert(schema.caseReactions).values({
            id: `rxn-${crypto.randomUUID().slice(0, 10)}`,
            case_id: caseId,
            user_id: citizen.id,
            reaction_type: reactionType,
          });
        }
        const allRows = await db
          .select({ reaction_type: schema.caseReactions.reaction_type })
          .from(schema.caseReactions)
          .where(eq(schema.caseReactions.case_id, caseId));
        return NextResponse.json({
          status: 'success',
          message,
          data: { ...computeSentiment(allRows), userReaction, definitions: REACTION_DEFINITIONS },
        });
      }
    }

    // 8. Comments (/api/comments/case/:caseId & /api/comments/:commentId/upvote)
    if (segments[0] === 'comments' && segments[1] === 'case' && segments[2]) {
      const caseId = decodeURIComponent(segments[2]);
      if (method === 'GET') {
        if (!isDatabaseConfigured) {
          return NextResponse.json({ status: 'success', total: 0, data: [] });
        }
        const sort = sp.get('sort') || 'newest';
        const filter = sp.get('filter') || 'all';
        try {
          const [rows, citizen] = await Promise.all([
            db
              .select({
                id: schema.caseComments.id,
                case_id: schema.caseComments.case_id,
                content: schema.caseComments.content,
                reaction_type: schema.caseComments.reaction_type,
                upvotes_count: schema.caseComments.upvotes_count,
                created_at: schema.caseComments.created_at,
                user: {
                  id: schema.citizenUsers.id,
                  username: schema.citizenUsers.username,
                  display_name: schema.citizenUsers.display_name,
                  photo_url: schema.citizenUsers.photo_url,
                  origin_province: schema.citizenUsers.origin_province,
                  origin_city: schema.citizenUsers.origin_city,
                  avatar_seed: schema.citizenUsers.avatar_seed,
                },
              })
              .from(schema.caseComments)
              .innerJoin(schema.citizenUsers, eq(schema.caseComments.user_id, schema.citizenUsers.id))
              .where(and(eq(schema.caseComments.case_id, caseId), eq(schema.caseComments.is_hidden, false)))
              .orderBy(sort === 'popular' ? desc(schema.caseComments.upvotes_count) : desc(schema.caseComments.created_at)),
            getCitizenSession(),
          ]);

          let filtered = rows;
          if (filter === 'pemakluman') {
            filtered = rows.filter((c) => c.reaction_type && ['didukung', 'khilaf_administrasi', 'dimaklumi'].includes(c.reaction_type));
          } else if (filter === 'kecaman') {
            filtered = rows.filter((c) => c.reaction_type && ['geram', 'rampok', 'memalukan'].includes(c.reaction_type));
          } else if (filter === 'skeptis') {
            filtered = rows.filter((c) => c.reaction_type && ['tebang_pilih', 'kawal_sidang'].includes(c.reaction_type));
          }

          let upvotedSet = new Set<string>();
          if (citizen && filtered.length > 0) {
            const ups = await db
              .select({ comment_id: schema.commentUpvotes.comment_id })
              .from(schema.commentUpvotes)
              .where(and(eq(schema.commentUpvotes.user_id, citizen.id), inArray(schema.commentUpvotes.comment_id, filtered.map((f) => f.id))));
            upvotedSet = new Set(ups.map((u) => u.comment_id));
          }
          return NextResponse.json({
            status: 'success',
            total: filtered.length,
            data: filtered.map((c) => ({
              ...c,
              user: { ...c.user, role: 'citizen' },
              reaction_info: c.reaction_type ? (REACTION_DEFINITIONS as any)[c.reaction_type] ?? null : null,
              is_upvoted: upvotedSet.has(c.id),
            })),
          });
        } catch {
          return NextResponse.json({ status: 'success', total: 0, data: [] });
        }
      }

      if (method === 'POST') {
        if (!isDatabaseConfigured) return dbUnavailableResponse();
        const citizen = await getCitizenSession();
        if (!citizen) return NextResponse.json({ error: 'Silakan masuk sebagai warga terlebih dahulu.' }, { status: 401 });
        const body = await req.json().catch(() => ({}));
        const content = String(body?.content || '').trim();
        if (content.length < 5) return NextResponse.json({ error: 'Komentar minimal 5 karakter.' }, { status: 400 });
        const id = `cmt-${crypto.randomUUID().slice(0, 10)}`;
        await db.insert(schema.caseComments).values({
          id,
          case_id: caseId,
          user_id: citizen.id,
          reaction_type: body?.reaction_type || null,
          content,
          upvotes_count: 0,
          is_hidden: false,
        });
        return NextResponse.json({ status: 'success', message: 'Komentar dipublikasikan!', data: { id } }, { status: 201 });
      }
    }

    if (method === 'POST' && segments[0] === 'comments' && segments[2] === 'upvote') {
      if (!isDatabaseConfigured) return dbUnavailableResponse();
      const citizen = await getCitizenSession();
      if (!citizen) return NextResponse.json({ error: 'Silakan masuk sebagai warga terlebih dahulu.' }, { status: 401 });
      const commentId = decodeURIComponent(segments[1]);
      const [existing] = await db
        .select()
        .from(schema.commentUpvotes)
        .where(and(eq(schema.commentUpvotes.comment_id, commentId), eq(schema.commentUpvotes.user_id, citizen.id)))
        .limit(1);
      let isUpvoted = true;
      if (existing) {
        await db.delete(schema.commentUpvotes).where(eq(schema.commentUpvotes.id, existing.id));
        await db.update(schema.caseComments).set({ upvotes_count: sql`GREATEST(0, ${schema.caseComments.upvotes_count} - 1)` }).where(eq(schema.caseComments.id, commentId));
        isUpvoted = false;
      } else {
        await db.insert(schema.commentUpvotes).values({ id: `upv-${crypto.randomUUID().slice(0, 10)}`, comment_id: commentId, user_id: citizen.id });
        await db.update(schema.caseComments).set({ upvotes_count: sql`${schema.caseComments.upvotes_count} + 1` }).where(eq(schema.caseComments.id, commentId));
      }
      const [updated] = await db.select({ upvotes_count: schema.caseComments.upvotes_count }).from(schema.caseComments).where(eq(schema.caseComments.id, commentId)).limit(1);
      return NextResponse.json({ status: 'success', data: { commentId, upvotesCount: updated?.upvotes_count ?? 0, isUpvoted } });
    }

    // 9. Public Reports (/api/reports & /api/reports/status/:ticketId)
    if (method === 'POST' && routePath === 'reports') {
      if (!isDatabaseConfigured) return dbUnavailableResponse();
      const limited = await applyRateLimit(req, 'write_citizen', 15, 900);
      if (limited) return limited;
      const body = await req.json().catch(() => ({}));
      const description = String(body.description || body.deskripsi_kesalahan || '').trim();
      const refUrl = String(body.reference_url || body.url_rujukan || '').trim();
      if (description.length < 10) return NextResponse.json({ error: 'Deskripsi laporan minimal 10 karakter.' }, { status: 400 });
      if (refUrl && !safeExternalUrlSchema.safeParse(refUrl).success) {
        return NextResponse.json({ error: 'URL rujukan harus tautan publik https:// atau http:// yang valid.' }, { status: 400 });
      }
      const reportType = body.report_type || 'koreksi_data';
      const prefix = reportType === 'usulan_kasus_baru' ? 'LKI-NEW' : 'LKI-REP';
      const ticket = `${prefix}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
      const [inserted] = await db
        .insert(schema.publicReports)
        .values({
          id: ticket,
          tracking_code: ticket,
          case_id: body.case_id || null,
          report_type: reportType,
          description,
          reference_url: refUrl || 'https://putusan3.mahkamahagung.go.id',
          submitter_contact: body.submitter_contact || body.email_pelapor || null,
          metadata: body.metadata || null,
          status: 'pending_review',
        })
        .returning();
      return NextResponse.json({ message: 'Laporan berhasil dikirim!', ticket_id: ticket, data: inserted, report: inserted }, { status: 201 });
    }

    if (method === 'GET' && segments[0] === 'reports' && segments[1] === 'status' && segments[2]) {
      if (!isDatabaseConfigured) return dbUnavailableResponse();
      const ticketId = decodeURIComponent(segments[2]).trim().toUpperCase();
      const [row] = await db
        .select({
          id: schema.publicReports.id,
          tracking_code: schema.publicReports.tracking_code,
          case_id: schema.publicReports.case_id,
          case_title: schema.cases.case_title,
          report_type: schema.publicReports.report_type,
          description: schema.publicReports.description,
          reference_url: schema.publicReports.reference_url,
          metadata: schema.publicReports.metadata,
          status: schema.publicReports.status,
          created_at: schema.publicReports.created_at,
          reviewed_at: schema.publicReports.reviewed_at,
        })
        .from(schema.publicReports)
        .leftJoin(schema.cases, eq(schema.publicReports.case_id, schema.cases.id))
        .where(or(ilike(schema.publicReports.tracking_code, ticketId), ilike(schema.publicReports.id, ticketId)))
        .limit(1);
      if (!row) return NextResponse.json({ error: `Tiket "${ticketId}" tidak ditemukan.` }, { status: 404 });
      return NextResponse.json({
        success: true,
        ticket: { ...row, has_reference_url: Boolean(row.reference_url) },
      });
    }

    // 10. Citizen Auth (/api/auth/citizen/*)
    if (segments[0] === 'auth' && segments[1] === 'citizen') {
      const action = segments[2];
      if (!isDatabaseConfigured && action !== 'me') {
        return dbUnavailableResponse();
      }
      if (method === 'POST' && action === 'register') {
        const body = await req.json().catch(() => ({}));
        const username = String(body.username || '').trim().toLowerCase();
        const displayName = String(body.displayName || '').trim();
        const email = String(body.email || '').trim().toLowerCase();
        const password = String(body.password || '');
        if (username.length < 3 || displayName.length < 2 || !email.includes('@') || password.length < 6) {
          return NextResponse.json({ error: 'Data registrasi tidak lengkap atau tidak valid.' }, { status: 400 });
        }
        const dup = await db
          .select({ id: schema.citizenUsers.id })
          .from(schema.citizenUsers)
          .where(or(eq(schema.citizenUsers.username, username), eq(schema.citizenUsers.email, email)))
          .limit(1);
        if (dup.length > 0) return NextResponse.json({ error: 'Username atau email sudah terdaftar.' }, { status: 400 });

        const otpCode = String(crypto.randomInt(100000, 1000000));
        const otpHash = crypto.createHash('sha256').update(otpCode).digest('hex');
        const userId = `usr-${crypto.randomUUID().slice(0, 10)}`;
        await db.insert(schema.citizenUsers).values({
          id: userId,
          username,
          display_name: displayName,
          email,
          password_hash: await bcrypt.hash(password, 12),
          origin_province: body.originProvince || null,
          origin_city: body.originCity || null,
          bio: body.bio || null,
          avatar_seed: body.avatarSeed || 'garuda',
          is_email_verified: false,
          email_verification_code_hash: otpHash,
          email_verification_expires: new Date(Date.now() + 15 * 60 * 1000),
          auth_provider: 'local',
        });
        await sendCitizenOtpEmail({ to: email, displayName, otpCode });
        return NextResponse.json({ status: 'success', needsVerification: true, email, message: 'Kode OTP 6 digit telah dikirim.' }, { status: 201 });
      }

      if (method === 'POST' && action === 'verify-email') {
        const body = await req.json().catch(() => ({}));
        const email = String(body.email || '').trim().toLowerCase();
        const code = String(body.code || '').trim();
        const [user] = await db.select().from(schema.citizenUsers).where(eq(schema.citizenUsers.email, email)).limit(1);
        if (!user || !user.email_verification_expires || user.email_verification_expires < new Date()) {
          return NextResponse.json({ error: 'Kode OTP tidak valid atau sudah kedaluwarsa.' }, { status: 400 });
        }
        const hash = crypto.createHash('sha256').update(code).digest('hex');
        if (hash !== user.email_verification_code_hash) {
          return NextResponse.json({ error: 'Kode OTP salah.' }, { status: 400 });
        }
        await db
          .update(schema.citizenUsers)
          .set({ is_email_verified: true, email_verification_code_hash: null, email_verification_expires: null })
          .where(eq(schema.citizenUsers.id, user.id));
        const payload = {
          id: user.id,
          username: user.username,
          displayName: user.display_name,
          email: user.email,
          avatarSeed: user.avatar_seed,
          isEmailVerified: true,
        };
        const token = await signCitizenSession(payload);
        const res = NextResponse.json({ status: 'success', token, user: payload });
        res.cookies.set(CITIZEN_COOKIE_NAME, token, cookieOptions(7 * 24 * 3600));
        return res;
      }

      if (method === 'POST' && action === 'resend-code') {
        const body = await req.json().catch(() => ({}));
        const email = String(body.email || '').trim().toLowerCase();
        const [user] = await db.select().from(schema.citizenUsers).where(eq(schema.citizenUsers.email, email)).limit(1);
        if (user && !user.is_email_verified) {
          const otpCode = String(crypto.randomInt(100000, 1000000));
          await db
            .update(schema.citizenUsers)
            .set({
              email_verification_code_hash: crypto.createHash('sha256').update(otpCode).digest('hex'),
              email_verification_expires: new Date(Date.now() + 15 * 60 * 1000),
            })
            .where(eq(schema.citizenUsers.id, user.id));
          await sendCitizenOtpEmail({ to: email, displayName: user.display_name, otpCode });
        }
        return NextResponse.json({ status: 'success', message: 'Kode OTP baru dikirim jika akun terdaftar.' });
      }

      if (method === 'POST' && action === 'login') {
        const limited = await applyRateLimit(req, 'auth_strict', 10, 900);
        if (limited) return limited;
        const body = await req.json().catch(() => ({}));
        const idLower = String(body.identifier || '').trim().toLowerCase();
        const password = String(body.password || '');
        const [user] = await db
          .select()
          .from(schema.citizenUsers)
          .where(or(eq(schema.citizenUsers.username, idLower), eq(schema.citizenUsers.email, idLower)))
          .limit(1);
        if (!user || !user.password_hash || !(await bcrypt.compare(password, user.password_hash))) {
          return NextResponse.json({ error: 'Username/email atau kata sandi salah.' }, { status: 401 });
        }
        if (!user.is_email_verified) {
          return NextResponse.json({ error: 'Email belum diverifikasi OTP.', needsVerification: true, email: user.email }, { status: 403 });
        }
        const payload = {
          id: user.id,
          username: user.username,
          displayName: user.display_name,
          email: user.email,
          avatarSeed: user.avatar_seed,
          isEmailVerified: true,
        };
        const token = await signCitizenSession(payload);
        const res = NextResponse.json({ status: 'success', token, user: payload });
        res.cookies.set(CITIZEN_COOKIE_NAME, token, cookieOptions(7 * 24 * 3600));
        return res;
      }

      if (method === 'POST' && action === 'google') {
        if (!env.GOOGLE_CLIENT_ID) {
          return NextResponse.json({ error: 'Google OAuth belum dikonfigurasi pada server.' }, { status: 503 });
        }
        const body = await req.json().catch(() => ({}));
        let email = '';
        let googleId = '';
        let name = '';
        let picture = '';

        if (body.credential) {
          const client = new OAuth2Client(env.GOOGLE_CLIENT_ID);
          const ticket = await client.verifyIdToken({ idToken: body.credential, audience: env.GOOGLE_CLIENT_ID });
          const p = ticket.getPayload();
          if (!p?.email || !p.email_verified || !p.sub) {
            return NextResponse.json({ error: 'Token Google tidak valid.' }, { status: 401 });
          }
          email = p.email.toLowerCase();
          googleId = p.sub;
          name = p.name || email.split('@')[0];
          picture = p.picture || '';
        } else if (body.accessToken) {
          const gRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${body.accessToken}` },
          });
          if (!gRes.ok) return NextResponse.json({ error: 'Verifikasi token akses Google gagal.' }, { status: 401 });
          const info = (await gRes.json()) as any;
          if (!info.email || !info.email_verified || !info.sub) {
            return NextResponse.json({ error: 'Email akun Google tidak terverifikasi.' }, { status: 401 });
          }
          email = String(info.email).toLowerCase();
          googleId = String(info.sub);
          name = String(info.name || email.split('@')[0]);
          picture = String(info.picture || '');
        } else {
          return NextResponse.json({ error: 'Token Google wajib disertakan.' }, { status: 400 });
        }

        let [user] = await db
          .select()
          .from(schema.citizenUsers)
          .where(or(eq(schema.citizenUsers.google_id, googleId), eq(schema.citizenUsers.email, email)))
          .limit(1);

        if (!user) {
          const newId = `usr-${crypto.randomUUID().slice(0, 10)}`;
          const username = `${slugify(email.split('@')[0]).replace(/-/g, '_').slice(0, 18)}_${crypto.randomBytes(2).toString('hex')}`;
          await db.insert(schema.citizenUsers).values({
            id: newId,
            username,
            display_name: name,
            email,
            google_id: googleId,
            photo_url: picture || null,
            origin_province: body.originProvince || null,
            origin_city: body.originCity || null,
            avatar_seed: 'garuda',
            is_email_verified: true,
            auth_provider: 'google',
          });
          [user] = await db.select().from(schema.citizenUsers).where(eq(schema.citizenUsers.id, newId)).limit(1);
        }

        const payload = {
          id: user.id,
          username: user.username,
          displayName: user.display_name,
          email: user.email,
          avatarSeed: user.avatar_seed,
          isEmailVerified: true,
        };
        const token = await signCitizenSession(payload);
        const res = NextResponse.json({ status: 'success', token, user: { ...payload, photoUrl: user.photo_url } });
        res.cookies.set(CITIZEN_COOKIE_NAME, token, cookieOptions(7 * 24 * 3600));
        return res;
      }

      if (method === 'PUT' && action === 'profile') {
        const citizen = await getCitizenSession();
        if (!citizen) return NextResponse.json({ error: 'Sesi warga tidak valid.' }, { status: 401 });
        const body = await req.json().catch(() => ({}));
        const displayName = String(body.displayName || citizen.displayName).trim();
        await db
          .update(schema.citizenUsers)
          .set({
            display_name: displayName,
            origin_province: body.originProvince || null,
            origin_city: body.originCity || null,
            bio: body.bio || null,
            avatar_seed: body.avatarSeed || citizen.avatarSeed,
            updated_at: new Date(),
          })
          .where(eq(schema.citizenUsers.id, citizen.id));
        const updatedPayload = { ...citizen, displayName, avatarSeed: body.avatarSeed || citizen.avatarSeed };
        const token = await signCitizenSession(updatedPayload);
        return NextResponse.json({ status: 'success', token, user: updatedPayload });
      }

      if (method === 'GET' && action === 'me') {
        const citizen = await getCitizenSession();
        if (!citizen) return NextResponse.json({ error: 'Tidak ada sesi aktif.' }, { status: 401 });
        return NextResponse.json({ status: 'success', user: citizen });
      }

      if (method === 'POST' && action === 'quick') {
        return NextResponse.json({ error: 'Mode kilat dinonaktifkan.', needsVerification: true }, { status: 410 });
      }
    }

    // 11. Monitoring track (public pageview beacon)
    if (method === 'POST' && routePath === 'admin/monitoring/track') {
      if (!isDatabaseConfigured) return NextResponse.json({ ok: true });
      const body = await req.json().catch(() => ({}));
      const ip = await getClientIp();
      await db
        .insert(schema.visitorLogs)
        .values({
          id: `vis-${crypto.randomUUID().slice(0, 12)}`,
          method: 'PAGEVIEW',
          path: String(body?.path || '/').slice(0, 200),
          status_code: 200,
          duration_ms: 0,
          ip_hash: hashIp(ip),
          device_type: 'web',
          referrer: String(body?.referrer || 'Direct').slice(0, 200),
        })
        .catch(() => {});
      return NextResponse.json({ ok: true });
    }

    // 12. Admin Login (/api/admin/login)
    if (method === 'POST' && routePath === 'admin/login') {
      if (!isDatabaseConfigured) return dbUnavailableResponse();
      const limited = await applyRateLimit(req, 'auth_strict', 10, 900);
      if (limited) return limited;
      const body = await req.json().catch(() => ({}));
      const username = String(body.username || '').trim().toLowerCase();
      const password = String(body.password || '');
      const [admin] = await db.select().from(schema.adminUsers).where(eq(schema.adminUsers.username, username)).limit(1);
      if (!admin || !admin.is_active) {
        return NextResponse.json({ error: 'Kredensial login tidak cocok.' }, { status: 401 });
      }
      if (admin.locked_until && admin.locked_until > new Date()) {
        return NextResponse.json({ error: 'Akun terkunci sementara. Coba lagi 15 menit.' }, { status: 429 });
      }
      if (!(await bcrypt.compare(password, admin.password_hash))) {
        const attempts = admin.failed_login_attempts + 1;
        await db
          .update(schema.adminUsers)
          .set({
            failed_login_attempts: sql`${schema.adminUsers.failed_login_attempts} + 1`,
            ...(attempts >= 5 ? { locked_until: new Date(Date.now() + 15 * 60 * 1000) } : {}),
          })
          .where(eq(schema.adminUsers.id, admin.id));
        return NextResponse.json({ error: 'Kredensial login tidak cocok.' }, { status: 401 });
      }
      await db.update(schema.adminUsers).set({ failed_login_attempts: 0, locked_until: null, last_login: new Date() }).where(eq(schema.adminUsers.id, admin.id));
      const payload = { id: admin.id, username: admin.username, fullName: admin.full_name, role: admin.role };
      const token = await signAdminSession(payload);
      const res = NextResponse.json({
        token,
        user: { id: admin.id, username: admin.username, full_name: admin.full_name, email: admin.email, role: admin.role },
      });
      res.cookies.set(ADMIN_COOKIE_NAME, token, cookieOptions(12 * 3600));
      return res;
    }

    // 13. Protected /api/admin/* endpoints
    if (segments[0] === 'admin') {
      const { error, session } = await requireAdminApi();
      if (error || !session) {
        return NextResponse.json({ error: 'Sesi admin diperlukan.' }, { status: 401 });
      }
      if (!isDatabaseConfigured) return dbUnavailableResponse();
      const ipHash = hashIp(await getClientIp());

      if (method === 'GET' && routePath === 'admin/cases') {
        const res = await loadLegacyCases({
          sort_by: sp.get('sort_by') ?? 'created_at',
          order: sp.get('order') ?? 'desc',
          page: Number(sp.get('page') || 1),
          limit: Number(sp.get('limit') || 20),
        });
        return NextResponse.json({ data: res.items, pagination: res.pagination });
      }

      if (method === 'PUT' && segments[1] === 'cases' && segments[2]) {
        const body = await req.json().catch(() => ({}));
        const caseId = decodeURIComponent(segments[2]);
        await db
          .update(schema.cases)
          .set({
            ...(body.title ? { case_title: body.title, normalized_case_title: String(body.title).toLowerCase() } : {}),
            ...(body.legal_status ? { current_legal_status: body.legal_status } : {}),
            ...(body.chronology ? { summary: body.chronology } : {}),
            ...(body.charges_articles !== undefined ? { charges_articles: body.charges_articles } : {}),
            updated_at: new Date(),
          })
          .where(eq(schema.cases.id, caseId));
        if (body.loss_amount !== undefined) {
          await db
            .update(schema.cases)
            .set({ display_loss_amount: String(Number(body.loss_amount) || 0) })
            .where(eq(schema.cases.id, caseId));
        }
        await recordAuditLog({ adminUserId: session.id, entityType: 'cases', entityId: caseId, action: 'update', diffSnapshot: body, ipHash });
        return NextResponse.json({ message: 'Berkas kasus diperbarui' });
      }

      if (method === 'DELETE' && segments[1] === 'cases' && segments[2]) {
        const caseId = decodeURIComponent(segments[2]);
        await db.delete(schema.cases).where(eq(schema.cases.id, caseId));
        await recomputeCaseAndGlobalAggregates();
        await recordAuditLog({ adminUserId: session.id, entityType: 'cases', entityId: caseId, action: 'delete', ipHash });
        return NextResponse.json({ message: 'Berkas kasus dihapus' });
      }

      if (method === 'POST' && (routePath === 'admin/cases/manual' || routePath === 'admin/cases/confirm')) {
        const body = await req.json().catch(() => ({}));
        const data = body.draft || body;
        const officialName = data.official?.nama || data.nama || 'Subjek Perkara';
        const officialRole = data.official?.jabatan || data.jabatan || 'Pejabat Publik';
        const provName = data.official?.provinsi || data.provinsi || 'Nasional';
        const summary = data.corruption_case?.ringkasan_kasus || data.ringkasan_kasus || 'Ringkasan perkara.';
        const lossVal = Number(data.corruption_case?.nilai_kerugian_negara ?? data.nilai_kerugian_negara ?? 0);
        const srcUrl = data.sources?.[0]?.url || data.source_url || '';
        if (!safeExternalUrlSchema.safeParse(srcUrl).success) {
          return NextResponse.json({ error: 'URL sumber primer yang valid wajib disertakan.' }, { status: 400 });
        }
        const uid = crypto.randomUUID().slice(0, 8);
        const caseId = `cas-${uid}`;
        const personId = `per-${uid}`;
        const sourceId = `src-${uid}`;
        const title = data.title || `Perkara ${officialName}`;
        const legalStatus = toLegacyLegalStatus(
          data.corruption_case?.status_hukum?.toLowerCase().includes('inkrah')
            ? 'divonis_inkrah'
            : data.corruption_case?.status_hukum?.toLowerCase().includes('terdakwa')
              ? 'terdakwa'
              : 'tersangka'
        );

        await db.insert(schema.sources).values({
          id: sourceId,
          source_title: data.sources?.[0]?.nama_media || 'Rujukan Resmi',
          source_url: srcUrl,
          source_type: legalStatus === 'divonis_inkrah' ? 'court_decision' : 'official_press_release',
          source_institution: data.sources?.[0]?.nama_media || 'Instansi Terverifikasi',
          access_date: new Date().toISOString().slice(0, 10),
          source_excerpt: summary.slice(0, 280),
        });
        await db.insert(schema.persons).values({
          id: personId,
          slug: `${slugify(officialName)}-${uid.slice(0, 4)}`,
          full_name: officialName,
          normalized_name: officialName.toLowerCase(),
          occupation: officialRole,
        });
        await db.insert(schema.cases).values({
          id: caseId,
          slug: `${slugify(title)}-${uid.slice(0, 4)}`,
          case_title: title,
          normalized_case_title: title.toLowerCase(),
          era_id: data.era_id || 'era-prabowo',
          primary_province_id: resolveProvinceId(provName),
          sector_category: mapSectorToCategory(data.corruption_case?.jenis_kasus || data.jenis_kasus),
          sector_label: data.corruption_case?.jenis_kasus || data.jenis_kasus || 'Tindak Pidana Korupsi',
          primary_mode: 'Kurasi Admin',
          case_date: new Date().toISOString().slice(0, 10),
          current_legal_status: legalStatus,
          summary,
          verified_by: session.id,
          verified_at: new Date(),
        });
        await db.insert(schema.casePersons).values({
          id: `cp-${uid}`,
          case_id: caseId,
          person_id: personId,
          role_in_case: officialRole,
          legal_status: legalStatus,
          offense_role: 'Pelaku Utama',
          defendant_role: legalStatus,
          source_id: sourceId,
        });
        await db.insert(schema.caseSources).values({ case_id: caseId, source_id: sourceId, is_primary: true });
        await db.insert(schema.financialRecords).values({
          id: `fin-${uid}`,
          case_id: caseId,
          person_id: personId,
          financial_type: legalStatus === 'divonis_inkrah' ? 'court_recognized_loss_amount' : 'alleged_loss_amount',
          amount: String(lossVal),
          financial_description: title,
          fact_classification: legalStatus === 'divonis_inkrah' ? 'COURT_FINDING' : 'PROSECUTOR_CLAIM',
          source_id: sourceId,
        });
        await recomputeCaseAndGlobalAggregates(caseId);
        await recordAuditLog({ adminUserId: session.id, entityType: 'cases', entityId: caseId, action: 'create', diffSnapshot: { title }, ipHash });
        revalidatePath('/');
        return NextResponse.json({ message: 'Perkara berhasil disimpan', id: caseId }, { status: 201 });
      }

      if (method === 'POST' && routePath === 'admin/ai-command') {
        const body = await req.json().catch(() => ({}));
        const result = await runAiCurator(String(body.message || ''), body.history || []);
        return NextResponse.json({
          is_draft_ready: result.isDraftReady,
          message: result.message,
          missing_fields: result.missingFields,
          draft: result.draft
            ? {
                official: {
                  nama: result.draft.personName,
                  jabatan: result.draft.personPosition,
                  partai: 'Non-Partai',
                  provinsi: result.draft.provinceName,
                  kota_kabupaten: result.draft.provinceName,
                  daerah_pemilihan: result.draft.provinceName,
                },
                corruption_case: {
                  ringkasan_kasus: result.draft.summary,
                  nilai_kerugian_negara: result.draft.amount,
                  tahun_kejadian: new Date().getFullYear(),
                  tahun_putusan: null,
                  status_hukum: toDisplayLegalStatus(result.draft.currentLegalStatus),
                  jenis_kasus: result.draft.sectorCategory,
                },
                sources: [
                  {
                    nama_media: result.draft.sourceInstitution,
                    url: result.draft.sourceUrl,
                    tanggal_publikasi: new Date().toISOString().slice(0, 10),
                  },
                ],
              }
            : undefined,
        });
      }

      if (method === 'GET' && routePath === 'admin/officials') {
        const { allItems } = await loadLegacyCases({ limit: 100 });
        const list = allItems.map((c) => ({
          id: c.official_id || c.id,
          full_name: c.official.nama,
          position_title: c.official.jabatan,
          party_id: c.party_id,
          party_name: c.official.partai,
          province_id: c.province_id,
          province_name: c.province_name,
          total_loss_amount: c.loss_amount,
          current_legal_status: c.legal_status,
          photo_url: c.official_photo,
        }));
        return NextResponse.json({ data: list, pagination: { page: 1, total_pages: 1, total_items: list.length } });
      }

      if (method === 'PUT' && segments[1] === 'officials' && segments[2]) {
        const body = await req.json().catch(() => ({}));
        const pid = decodeURIComponent(segments[2]);
        await db
          .update(schema.persons)
          .set({
            ...(body.full_name ? { full_name: body.full_name, normalized_name: String(body.full_name).toLowerCase() } : {}),
            ...(body.position_title ? { occupation: body.position_title } : {}),
            ...(body.photo_url !== undefined ? { photo_url: body.photo_url || null } : {}),
            updated_at: new Date(),
          })
          .where(eq(schema.persons.id, pid));
        return NextResponse.json({ message: 'Data pejabat diperbarui' });
      }

      if (method === 'GET' && routePath === 'admin/reports') {
        const rows = await db
          .select({
            id: schema.publicReports.id,
            case_id: schema.publicReports.case_id,
            case_title: schema.cases.case_title,
            report_type: schema.publicReports.report_type,
            description: schema.publicReports.description,
            reference_url: schema.publicReports.reference_url,
            submitter_contact: schema.publicReports.submitter_contact,
            status: schema.publicReports.status,
            created_at: schema.publicReports.created_at,
          })
          .from(schema.publicReports)
          .leftJoin(schema.cases, eq(schema.publicReports.case_id, schema.cases.id))
          .orderBy(desc(schema.publicReports.created_at));
        return NextResponse.json(rows);
      }

      if ((method === 'PUT' || method === 'POST') && segments[1] === 'reports' && segments[2]) {
        const reportId = decodeURIComponent(segments[2]);
        const body = await req.json().catch(() => ({}));
        const nextStatus = body.status === 'approved' || body.action === 'approved' ? 'approved' : 'rejected';
        await db
          .update(schema.publicReports)
          .set({ status: nextStatus, moderator_note: body.moderator_note || null, reviewed_by: session.id, reviewed_at: new Date() })
          .where(eq(schema.publicReports.id, reportId));
        return NextResponse.json({ message: 'Status laporan diperbarui', status: nextStatus });
      }

      if (method === 'GET' && routePath === 'admin/comments') {
        const rows = await db
          .select({
            id: schema.caseComments.id,
            case_id: schema.caseComments.case_id,
            case_title: schema.cases.case_title,
            content: schema.caseComments.content,
            upvotes_count: schema.caseComments.upvotes_count,
            is_hidden: schema.caseComments.is_hidden,
            created_at: schema.caseComments.created_at,
            user: {
              id: schema.citizenUsers.id,
              username: schema.citizenUsers.username,
              display_name: schema.citizenUsers.display_name,
            },
          })
          .from(schema.caseComments)
          .innerJoin(schema.cases, eq(schema.caseComments.case_id, schema.cases.id))
          .innerJoin(schema.citizenUsers, eq(schema.caseComments.user_id, schema.citizenUsers.id))
          .orderBy(desc(schema.caseComments.created_at));
        return NextResponse.json({ data: rows.map((r) => ({ ...r, is_hidden: r.is_hidden ? 1 : 0 })) });
      }

      if (method === 'PUT' && segments[1] === 'comments' && segments[3] === 'toggle-hide') {
        const cId = decodeURIComponent(segments[2]);
        const [cur] = await db.select().from(schema.caseComments).where(eq(schema.caseComments.id, cId)).limit(1);
        if (!cur) return NextResponse.json({ error: 'Komentar tidak ditemukan' }, { status: 404 });
        const nextHidden = !cur.is_hidden;
        await db.update(schema.caseComments).set({ is_hidden: nextHidden, moderated_by: session.id }).where(eq(schema.caseComments.id, cId));
        return NextResponse.json({ is_hidden: nextHidden ? 1 : 0, message: nextHidden ? 'Disembunyikan' : 'Ditampilkan' });
      }

      if (method === 'DELETE' && segments[1] === 'comments' && segments[2]) {
        await db.delete(schema.caseComments).where(eq(schema.caseComments.id, decodeURIComponent(segments[2])));
        return NextResponse.json({ message: 'Komentar dihapus' });
      }

      if (routePath === 'admin/settings/announcement' || routePath === 'admin/settings/donation') {
        const key = routePath.endsWith('announcement') ? 'announcement' : 'donation';
        if (method === 'GET') {
          const [row] = await db.select().from(schema.siteSettings).where(eq(schema.siteSettings.key, key)).limit(1);
          return NextResponse.json(row?.value ?? {});
        }
        if (method === 'PUT') {
          const body = await req.json().catch(() => ({}));
          await db
            .insert(schema.siteSettings)
            .values({ key, value: body, updated_by: session.id, updated_at: new Date() })
            .onConflictDoUpdate({ target: schema.siteSettings.key, set: { value: body, updated_by: session.id, updated_at: new Date() } });
          return NextResponse.json({ message: 'Pengaturan tersimpan', data: body });
        }
      }

      if (method === 'GET' && routePath === 'admin/audit-logs') {
        const logs = await db.select().from(schema.auditLogs).orderBy(desc(schema.auditLogs.created_at)).limit(50);
        return NextResponse.json(
          logs.map((l) => ({
            id: l.id,
            admin_id: l.admin_user_id || 'system',
            perintah_asli: `${l.action.toUpperCase()} ${l.entity_type} (${l.entity_id})`,
            riwayat_klarifikasi: [],
            hasil_ai: null,
            status: 'disetujui',
            timestamp: l.created_at,
          }))
        );
      }

      if (method === 'GET' && routePath === 'admin/monitoring/stats') {
        const [agg] = await db.execute(sql`
          SELECT
            count(*)::int AS total_visits,
            count(distinct ip_hash)::int AS unique_visitors,
            coalesce(avg(duration_ms), 0)::int AS avg_latency_ms,
            count(*) filter (where status_code >= 400)::int AS error_count
          FROM visitor_logs
        `);
        const kpi = (agg as any) ?? { total_visits: 0, unique_visitors: 0, avg_latency_ms: 0, error_count: 0 };
        return NextResponse.json({
          kpi: {
            ...kpi,
            error_rate_pct: kpi.total_visits > 0 ? Number(((kpi.error_count / kpi.total_visits) * 100).toFixed(2)) : 0,
          },
          hourly_series: [],
          top_paths: [],
          devices: [{ name: 'DESKTOP', value: kpi.total_visits || 1 }],
          browsers: [{ name: 'Web', value: kpi.total_visits || 1 }],
          status_codes: [{ name: '2xx', value: kpi.total_visits || 1 }],
          system_health: { status: 'healthy', database: 'connected (PostgreSQL)', uptime_formatted: 'Active', memory_rss_mb: 128, memory_heap_mb: 64 },
        });
      }

      if (routePath === 'admin/monitoring/logs') {
        if (method === 'DELETE') {
          const days = Number(sp.get('days') || 7);
          const threshold = new Date(Date.now() - days * 24 * 3600 * 1000);
          await db.delete(schema.visitorLogs).where(lt(schema.visitorLogs.timestamp, threshold));
          return NextResponse.json({ message: `Log lebih lama dari ${days} hari dibersihkan.` });
        }
        const logs = await db.select().from(schema.visitorLogs).orderBy(desc(schema.visitorLogs.timestamp)).limit(30);
        return NextResponse.json({
          data: logs.map((l) => ({
            ...l,
            ip_address: l.ip_hash ? `anon-${l.ip_hash.slice(0, 8)}` : 'anon',
            user_agent: 'LKI Client',
            browser: 'Web',
            os: '-',
            session_id: l.ip_hash?.slice(0, 8) || '-',
          })),
          pagination: { page: 1, total_pages: 1, total_items: logs.length },
        });
      }

      if (routePath === 'admin/users' || routePath === 'admin/users/citizens') {
        if (routePath.endsWith('citizens')) {
          const citizens = await db.select().from(schema.citizenUsers).orderBy(desc(schema.citizenUsers.created_at));
          return NextResponse.json(
            citizens.map((c) => ({
              id: c.id,
              username: c.username,
              display_name: c.display_name,
              email: c.email,
              is_email_verified: c.is_email_verified ? 1 : 0,
              auth_provider: c.auth_provider,
              created_at: c.created_at,
            }))
          );
        }
        const admins = await db.select().from(schema.adminUsers).orderBy(desc(schema.adminUsers.created_at));
        return NextResponse.json(
          admins.map((a) => ({
            id: a.id,
            username: a.username,
            full_name: a.full_name,
            email: a.email,
            role: a.role,
            is_active: a.is_active ? 1 : 0,
            last_login: a.last_login,
          }))
        );
      }
    }

    return NextResponse.json({ error: `Endpoint '/api/${routePath}' tidak ditemukan.` }, { status: 404 });
  } catch (err: any) {
    console.error(`Error in /api/${routePath}:`, err);
    return NextResponse.json({ error: 'Terjadi kesalahan pada server.' }, { status: 500 });
  }
}
