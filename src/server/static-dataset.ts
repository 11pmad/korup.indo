import fs from 'fs';
import path from 'path';
import { CANONICAL_PROVINCES, resolveProvinceId } from '@/lib/provinces';
import {
  ERA_MAPPING_BY_NAME,
  LegalStatusValue,
  mapSectorToCategory,
  slugify,
  toNum,
} from '@/lib/formatters';
import { calculateAntiDoubleCounting } from '@/server/services/financials';

export const ERAS_MASTER = [
  { id: 'era-orla', name: 'Era Kemerdekaan & Orde Lama (1945 - 1966)', sort_order: 1, start_date: new Date('1945-08-17'), end_date: new Date('1966-03-11'), cabinet_name: 'Kabinet Awal Kemerdekaan & Dwikora', context_summary: 'Periode awal pembentukan tata kelola keuangan negara pasca-kemerdekaan dan Orde Lama.' },
  { id: 'era-orba', name: 'Era Orde Baru (1966 - 1998)', sort_order: 2, start_date: new Date('1966-03-12'), end_date: new Date('1998-05-21'), cabinet_name: 'Kabinet Pembangunan I - VII', context_summary: 'Periode pembangunan sentralistik hingga krisis moneter 1997-1998.' },
  { id: 'era-habibie', name: 'Reformasi Awal / B.J. Habibie', sort_order: 3, start_date: new Date('1998-05-21'), end_date: new Date('1999-10-20'), cabinet_name: 'Kabinet Reformasi Pembangunan', context_summary: 'Masa transisi demokrasi dan lahirnya UU Pemberantasan Tipikor 1999.' },
  { id: 'era-gusdur', name: 'Abdurrahman Wahid', sort_order: 4, start_date: new Date('1999-10-20'), end_date: new Date('2001-07-23'), cabinet_name: 'Kabinet Persatuan Nasional', context_summary: 'Periode awal otonomi daerah dan pengawasan lembaga perbankan pasca-krisis.' },
  { id: 'era-megawati', name: 'Megawati Soekarnoputri', sort_order: 5, start_date: new Date('2001-07-23'), end_date: new Date('2004-10-20'), cabinet_name: 'Kabinet Gotong Royong', context_summary: 'Pendirian Komisi Pemberantasan Korupsi (KPK) berdasarkan UU No. 30/2002.' },
  { id: 'era-sby-1', name: 'Susilo Bambang Yudhoyono Periode I', sort_order: 6, start_date: new Date('2004-10-20'), end_date: new Date('2009-10-20'), cabinet_name: 'Kabinet Indonesia Bersatu I', context_summary: 'Penguatan operasi penindakan KPK dan Pengadilan Tipikor pertama.' },
  { id: 'era-sby-2', name: 'Susilo Bambang Yudhoyono Periode II', sort_order: 7, start_date: new Date('2009-10-20'), end_date: new Date('2014-10-20'), cabinet_name: 'Kabinet Indonesia Bersatu II', context_summary: 'Pengungkapan perkara pengadaan proyek strategis nasional dan suap lintas lembaga.' },
  { id: 'era-jokowi-1', name: 'Joko Widodo Periode I', sort_order: 8, start_date: new Date('2014-10-20'), end_date: new Date('2019-10-20'), cabinet_name: 'Kabinet Kerja', context_summary: 'Digitalisasi pengadaan dan penindakan perkara infrastruktur serta kepala daerah.' },
  { id: 'era-jokowi-2', name: 'Joko Widodo Periode II', sort_order: 9, start_date: new Date('2019-10-20'), end_date: new Date('2024-10-20'), cabinet_name: 'Kabinet Indonesia Maju', context_summary: 'Pengungkapan perkara sektor SDA, tambang, asuransi BUMN, dan pengadaan darurat.' },
  { id: 'era-prabowo', name: 'Prabowo Subianto', sort_order: 10, start_date: new Date('2024-10-20'), end_date: null, cabinet_name: 'Kabinet Merah Putih', context_summary: 'Periode pemerintahan berjalan (Oktober 2024 - sekarang).' },
];

export const PARTY_COLORS: Record<string, string> = {
  'pty-golkar': '#EAB308',
  'pty-pdip': '#DC2626',
  'pty-demokrat': '#2563EB',
  'pty-gerindra': '#991B1B',
  'pty-nasdem': '#1E3A8A',
  'pty-pks': '#EA580C',
  'pty-pkb': '#16A34A',
  'pty-pan': '#0284C7',
  'pty-ppp': '#15803D',
  'pty-pni': '#7F1D1D',
  'pty-nonpartai': '#64748B',
};

export const PUBLIC_ANNOUNCEMENT_DEFAULT = {
  title: 'PEMBERITAHUAN ASAS HUKUM & SUMBER RESMI:',
  badge: 'Wajib Dibaca',
  main_text:
    'Data bersumber dari putusan pengadilan & pemberitaan media yang tercantum. Setiap orang berhak atas asas praduga tak bersalah hingga ada putusan berkekuatan hukum tetap.',
  sub_text:
    'Setiap data diverifikasi dengan tautan resmi direktori putusan Mahkamah Agung RI, KPK.go.id, atau media nasional kredibel.',
  is_active: true,
};

export const PUBLIC_DONATION_DEFAULT = {
  title: 'Dukung Independensi & Operasional LKI',
  description:
    'Bantu operasional server, infrastruktur pangkalan data, dan verifikasi berkas direktori putusan peradilan.',
  qris_image_url: '',
  account_name: 'Pengelola Liga Korupsi Indonesia',
  bank_info: 'Dukungan dapat discan melalui aplikasi Mobile Banking & E-Wallet.',
  is_active: true,
};

function readNormalized<T>(name: string): T[] {
  const filePath = path.resolve(process.cwd(), 'data', 'normalized', `${name}.json`);
  if (!fs.existsSync(filePath)) return [];
  return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T[];
}

function deriveCaseStatus(
  caseRecord: any,
  cpList: any[],
  verdictList: any[]
): LegalStatusValue {
  if (cpList.length > 0) {
    const statuses = cpList.map((cp) => cp.legal_status as LegalStatusValue);
    if (statuses.includes('divonis_inkrah')) return 'divonis_inkrah';
    if (statuses.includes('bebas')) return 'bebas';
    if (statuses.includes('lepas')) return 'lepas';
    if (statuses.includes('terdakwa')) return 'terdakwa';
    if (statuses.includes('tersangka')) return 'tersangka';
    return statuses[0];
  }
  if (verdictList.some((v) => v.is_final)) return 'divonis_inkrah';
  if (caseRecord.final_decision_date || caseRecord.verdict_date) return 'divonis_inkrah';
  if (caseRecord.indictment_date || caseRecord.trial_start_date) return 'terdakwa';
  if (caseRecord.suspect_date) return 'tersangka';
  return 'penyidikan';
}

export interface StaticDataset {
  provinces: Array<{
    id: string;
    name: string;
    island_cluster: string;
    bps_code: string;
    cached_total_cases: number;
    cached_total_loss: string;
  }>;
  eras: typeof ERAS_MASTER;
  parties: Array<{ id: string; name: string; abbreviation: string; color_hex: string }>;
  companies: Array<{
    id: string;
    slug: string;
    name: string;
    company_type: string;
    industry: string | null;
    business_sector: string | null;
    company_location: string | null;
    beneficial_owner: string | null;
    company_status: string;
  }>;
  persons: Array<{
    id: string;
    slug: string;
    full_name: string;
    normalized_name: string;
    aliases: string[];
    gender: string | null;
    birth_place: string | null;
    birth_date: string | null;
    occupation: string | null;
    photo_url: string | null;
    nationality: string;
  }>;
  positions: Array<{
    id: string;
    person_id: string;
    position_title: string;
    institution: string;
    government_level: string;
    sector: string;
    province_id: string | null;
    province_name: string | null;
    period_start: string | null;
    period_end: string | null;
    position_at_offense: boolean;
  }>;
  partyMemberships: Array<{
    id: string;
    person_id: string;
    party_id: string;
    party_position: string | null;
    membership_start: string | null;
    membership_end: string | null;
    party_at_offense: boolean;
  }>;
  cases: Array<{
    id: string;
    slug: string;
    case_title: string;
    case_number: string | null;
    case_type: string;
    era_id: string;
    era_name: string;
    primary_province_id: string;
    province_name: string;
    sector_category: ReturnType<typeof mapSectorToCategory>;
    sector_label: string;
    sub_sector: string | null;
    primary_mode: string;
    secondary_modes: string[];
    case_date: string | null;
    investigation_date: string | null;
    suspect_date: string | null;
    indictment_date: string | null;
    trial_start_date: string | null;
    verdict_date: string | null;
    final_decision_date: string | null;
    current_legal_status: LegalStatusValue;
    summary: string;
    charges_articles: string | null;
    verification_status: 'VERIFIED_PRIMARY' | 'VERIFIED_MULTIPLE_SOURCES' | 'VERIFIED_SECONDARY' | 'PARTIALLY_VERIFIED' | 'NEEDS_REVIEW' | 'UNVERIFIED';
    confidence_level: string;
    needs_manual_review: boolean;
    verification_note: string | null;
    display_loss_amount: number;
    display_loss_basis: string;
    display_bribe_amount: number;
    display_recovery_amount: number;
    created_at: Date;
    updated_at: Date;
  }>;
  casePersons: Array<{
    id: string;
    case_id: string;
    person_id: string;
    role_in_case: string;
    legal_status: LegalStatusValue;
    offense_role: string;
  }>;
  caseCompanies: Array<{
    id: string;
    case_id: string;
    company_id: string;
    company_role_in_case: string | null;
    transaction_value: number | null;
    contract_value: number | null;
    company_case_status: string | null;
  }>;
  caseSources: Array<{
    case_id: string;
    source_id: string;
    id: string;
    source_title: string;
    source_url: string;
    source_type: string;
    source_institution: string;
    publication_date: string | null;
    source_page: string | null;
    source_excerpt: string | null;
    source_reliability: string;
  }>;
  financialRecords: Array<{
    id: string;
    case_id: string;
    financial_type: string;
    amount: number;
    currency: string;
    financial_year: number | null;
    financial_description: string | null;
    fact_classification: string | null;
    source_page: string | null;
    source_title: string | null;
    source_url: string | null;
  }>;
  verdicts: Array<{
    id: string;
    case_id: string;
    person_id: string;
    court: string;
    court_level: 'tingkat_pertama' | 'banding' | 'kasasi' | 'peninjauan_kembali';
    decision_number: string;
    decision_date: string;
    decision_type: string;
    guilty_status: string;
    sentence_type: string;
    prison_sentence_months: number;
    prosecutor_demand_months: number | null;
    fine_amount: number;
    fine_substitute_sentence: string | null;
    restitution_amount: number;
    restitution_substitute_sentence: string | null;
    additional_penalty: string | null;
    asset_forfeiture: string | null;
    political_disqualification: string | null;
    is_final: boolean;
    source_id: string;
    source_url: string | null;
    created_at: Date;
  }>;
  timelineEvents: Array<{
    id: string;
    case_id: string;
    event_date: string;
    event_type: string;
    event_description: string;
    institution: string;
    location: string | null;
    source_page: string | null;
  }>;
}

let cachedDataset: StaticDataset | null = null;

export function getStaticDataset(): StaticDataset {
  if (cachedDataset) return cachedDataset;

  const sourcesRaw = readNormalized<any>('sources');
  const partiesRaw = readNormalized<any>('parties');
  const locationsRaw = readNormalized<any>('locations');
  const companiesRaw = readNormalized<any>('companies');
  const personsRaw = readNormalized<any>('persons');
  const positionsRaw = readNormalized<any>('positions');
  const partyMembershipsRaw = readNormalized<any>('party_memberships');
  const casesRaw = readNormalized<any>('cases');
  const casePersonsRaw = readNormalized<any>('case_persons');
  const financialRaw = readNormalized<any>('financial_records');
  const verdictsRaw = readNormalized<any>('verdicts');
  const timelineRaw = readNormalized<any>('timeline_events');
  const caseCompaniesRaw = readNormalized<any>('case_companies');
  const caseLocationsRaw = readNormalized<any>('case_locations');

  const sourceMap = new Map<string, any>();
  for (const s of sourcesRaw) {
    sourceMap.set(s.source_id, {
      id: s.source_id,
      source_title: s.source_title,
      source_url: s.source_url,
      source_type: s.source_type ?? 'court_decision',
      source_institution: s.source_institution,
      publication_date: s.publication_date ?? null,
      source_page: s.source_page ?? null,
      source_excerpt: s.source_excerpt ?? null,
      source_reliability: s.source_reliability ?? 'high',
    });
  }

  const provinceMap = new Map(CANONICAL_PROVINCES.map((p) => [p.id, p]));
  const eraMap = new Map(ERAS_MASTER.map((e) => [e.id, e]));
  const locationMap = new Map(locationsRaw.map((l) => [l.location_id, l]));

  const positionByPerson = new Map<string, any>();
  for (const pos of positionsRaw) {
    if (!positionByPerson.has(pos.person_id) || pos.position_at_offense) {
      positionByPerson.set(pos.person_id, pos);
    }
  }

  const financialByCase = new Map<string, any[]>();
  for (const f of financialRaw) {
    const arr = financialByCase.get(f.case_id) ?? [];
    arr.push(f);
    financialByCase.set(f.case_id, arr);
  }

  const casePersons = casePersonsRaw.map((cp) => ({
    id: cp.case_person_id,
    case_id: cp.case_id,
    person_id: cp.person_id,
    role_in_case: cp.role_in_case,
    legal_status: (cp.legal_status || 'tersangka') as LegalStatusValue,
    offense_role: cp.offense_role ?? 'Pelaku Utama',
  }));

  const verdicts = verdictsRaw.map((v) => {
    const src = v.source_id ? sourceMap.get(v.source_id) : null;
    return {
      id: v.verdict_id,
      case_id: v.case_id,
      person_id: v.person_id,
      court: v.court,
      court_level: (v.court_level || 'tingkat_pertama') as 'tingkat_pertama' | 'banding' | 'kasasi' | 'peninjauan_kembali',
      decision_number: v.decision_number ?? '',
      decision_date: v.decision_date ?? '',
      decision_type: v.decision_type ?? '',
      guilty_status: v.guilty_status ?? '',
      sentence_type: v.sentence_type ?? '',
      prison_sentence_months: Number(v.prison_sentence_months ?? 0),
      prosecutor_demand_months: v.prosecutor_demand_months ?? null,
      fine_amount: toNum(v.fine_amount),
      fine_substitute_sentence: v.fine_substitute_sentence ?? null,
      restitution_amount: toNum(v.restitution_amount),
      restitution_substitute_sentence: v.restitution_substitute_sentence ?? null,
      additional_penalty: v.additional_penalty ?? null,
      asset_forfeiture: v.asset_forfeiture ?? null,
      political_disqualification: v.political_disqualification ?? null,
      is_final: Boolean(v.is_final),
      source_id: v.source_id ?? '',
      source_url: src?.source_url ?? null,
      created_at: new Date(),
    };
  });

  const cases = casesRaw.map((c) => {
    const eraId = ERA_MAPPING_BY_NAME[c.era_pemerintahan] ?? 'era-jokowi-2';
    const relatedCp = casePersonsRaw.filter((cp) => cp.case_id === c.case_id);
    const relatedVerdicts = verdictsRaw.filter((v) => v.case_id === c.case_id);
    const relatedLocs = caseLocationsRaw
      .filter((cl) => cl.case_id === c.case_id)
      .map((cl) => locationMap.get(cl.location_id))
      .filter(Boolean);

    let provinceName: string | null = relatedLocs[0]?.province ?? null;
    if (!provinceName && relatedCp[0]) {
      provinceName = positionByPerson.get(relatedCp[0].person_id)?.province ?? null;
    }
    const primaryProvinceId = resolveProvinceId(provinceName);
    const legalStatus = deriveCaseStatus(c, relatedCp, relatedVerdicts);
    const finForCase = financialByCase.get(c.case_id) ?? [];
    const computed = calculateAntiDoubleCounting(finForCase, legalStatus);
    const caseDateObj = c.case_date ? new Date(c.case_date) : new Date('2024-01-01');

    return {
      id: c.case_id,
      slug: slugify(c.case_title) || c.case_id,
      case_title: c.case_title,
      case_number: c.case_number ?? null,
      case_type: c.case_type ?? 'Tindak Pidana Korupsi',
      era_id: eraId,
      era_name: eraMap.get(eraId)?.name ?? c.era_pemerintahan ?? '',
      primary_province_id: primaryProvinceId,
      province_name: provinceMap.get(primaryProvinceId)?.name ?? 'Nasional / Pusat',
      sector_category: mapSectorToCategory(c.sector),
      sector_label: c.sector,
      sub_sector: c.sub_sector ?? null,
      primary_mode: c.primary_mode ?? '',
      secondary_modes: Array.isArray(c.secondary_modes) ? c.secondary_modes : [],
      case_date: c.case_date ?? null,
      investigation_date: c.investigation_date ?? null,
      suspect_date: c.suspect_date ?? null,
      indictment_date: c.indictment_date ?? null,
      trial_start_date: c.trial_start_date ?? null,
      verdict_date: c.verdict_date ?? null,
      final_decision_date: c.final_decision_date ?? null,
      current_legal_status: legalStatus,
      summary: c.summary,
      charges_articles: null,
      verification_status: (c.verification_status ?? 'VERIFIED_PRIMARY') as StaticDataset['cases'][number]['verification_status'],
      confidence_level: c.confidence_level ?? 'high',
      needs_manual_review: Boolean(c.needs_manual_review),
      verification_note: c.verification_note ?? null,
      display_loss_amount: computed.displayLossAmount,
      display_loss_basis: computed.displayLossBasis,
      display_bribe_amount: computed.displayBribeAmount,
      display_recovery_amount: computed.displayRecoveryAmount,
      created_at: caseDateObj,
      updated_at: caseDateObj,
    };
  });

  const provAgg = new Map<string, { cases: number; loss: number }>();
  for (const c of cases) {
    const cur = provAgg.get(c.primary_province_id) ?? { cases: 0, loss: 0 };
    cur.cases += 1;
    cur.loss += c.display_loss_amount;
    provAgg.set(c.primary_province_id, cur);
  }

  const provinces = CANONICAL_PROVINCES.map((p) => {
    const agg = provAgg.get(p.id);
    return {
      ...p,
      cached_total_cases: agg?.cases ?? 0,
      cached_total_loss: (agg?.loss ?? 0).toFixed(2),
    };
  });

  const caseSourcePairs = new Set<string>();
  const caseSources: StaticDataset['caseSources'] = [];
  const addCaseSource = (caseId: string, sourceId?: string | null) => {
    if (!caseId || !sourceId) return;
    const key = `${caseId}::${sourceId}`;
    if (caseSourcePairs.has(key)) return;
    const src = sourceMap.get(sourceId);
    if (!src) return;
    caseSourcePairs.add(key);
    caseSources.push({ case_id: caseId, source_id: sourceId, ...src });
  };

  for (const cp of casePersonsRaw) addCaseSource(cp.case_id, cp.source_id);
  for (const cc of caseCompaniesRaw) addCaseSource(cc.case_id, cc.source_id);
  for (const f of financialRaw) addCaseSource(f.case_id, f.source_id);
  for (const v of verdictsRaw) addCaseSource(v.case_id, v.source_id);
  for (const t of timelineRaw) addCaseSource(t.case_id, t.source_id);

  cachedDataset = {
    provinces,
    eras: ERAS_MASTER,
    parties: partiesRaw.map((p) => ({
      id: p.party_id,
      name: p.party_name,
      abbreviation: p.party_abbreviation,
      color_hex: PARTY_COLORS[p.party_id] ?? '#475569',
    })),
    companies: companiesRaw.map((comp) => ({
      id: comp.company_id,
      slug: slugify(comp.company_name) || comp.company_id,
      name: comp.company_name,
      company_type: comp.company_type,
      industry: comp.industry ?? null,
      business_sector: comp.business_sector ?? null,
      company_location: comp.company_location ?? null,
      beneficial_owner: comp.beneficial_owner ?? null,
      company_status: comp.company_status ?? 'aktif',
    })),
    persons: personsRaw.map((per) => ({
      id: per.person_id,
      slug: slugify(per.full_name) || per.person_id,
      full_name: per.full_name,
      normalized_name: per.normalized_name,
      aliases: Array.isArray(per.alias) ? per.alias : [],
      gender: per.gender ?? null,
      birth_place: per.birth_place ?? null,
      birth_date: per.birth_date ?? null,
      occupation: per.occupation ?? null,
      photo_url: per.photo_url ?? null,
      nationality: per.nationality ?? 'Indonesia',
    })),
    positions: positionsRaw.map((pos) => {
      const pid = pos.province ? resolveProvinceId(pos.province) : null;
      return {
        id: pos.position_id,
        person_id: pos.person_id,
        position_title: pos.position_title,
        institution: pos.institution,
        government_level: pos.government_level ?? '',
        sector: pos.sector ?? '',
        province_id: pid,
        province_name: pid ? (provinceMap.get(pid)?.name ?? pos.province) : null,
        period_start: pos.period_start ?? null,
        period_end: pos.period_end ?? null,
        position_at_offense: Boolean(pos.position_at_offense),
      };
    }),
    partyMemberships: partyMembershipsRaw.map((pm) => ({
      id: pm.membership_id,
      person_id: pm.person_id,
      party_id: pm.party_id,
      party_position: pm.party_position ?? null,
      membership_start: pm.membership_start ?? null,
      membership_end: pm.membership_end ?? null,
      party_at_offense: Boolean(pm.party_at_offense),
    })),
    cases,
    casePersons,
    caseCompanies: caseCompaniesRaw.map((cc) => ({
      id: cc.case_company_id,
      case_id: cc.case_id,
      company_id: cc.company_id,
      company_role_in_case: cc.company_role_in_case ?? null,
      transaction_value: cc.transaction_value !== null && cc.transaction_value !== undefined ? toNum(cc.transaction_value) : null,
      contract_value: cc.contract_value !== null && cc.contract_value !== undefined ? toNum(cc.contract_value) : null,
      company_case_status: cc.company_case_status ?? null,
    })),
    caseSources,
    financialRecords: financialRaw.map((f) => {
      const src = f.source_id ? sourceMap.get(f.source_id) : null;
      return {
        id: f.financial_id,
        case_id: f.case_id,
        financial_type: f.financial_type,
        amount: toNum(f.amount),
        currency: f.currency ?? 'IDR',
        financial_year: f.financial_year ?? null,
        financial_description: f.financial_description ?? null,
        fact_classification: f.fact_classification ?? null,
        source_page: f.source_page ?? null,
        source_title: src?.source_title ?? null,
        source_url: src?.source_url ?? null,
      };
    }),
    verdicts,
    timelineEvents: timelineRaw.map((t) => ({
      id: t.event_id,
      case_id: t.case_id,
      event_date: t.event_date ?? '',
      event_type: t.event_type,
      event_description: t.event_description,
      institution: t.institution ?? '',
      location: t.location ?? null,
      source_page: t.source_page ?? null,
    })),
  };

  return cachedDataset;
}
