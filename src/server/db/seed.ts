import fs from 'fs';
import path from 'path';
import 'dotenv/config';
import { db, pgClient, schema } from './index';
import { CANONICAL_PROVINCES, resolveProvinceId } from '@/lib/provinces';
import {
  ERA_MAPPING_BY_NAME,
  LegalStatusValue,
  mapSectorToCategory,
  slugify,
} from '@/lib/formatters';
import { recomputeCaseAndGlobalAggregates } from '@/server/services/financials';

const ERAS_MASTER = [
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

const PARTY_COLORS: Record<string, string> = {
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
    // Prefer inkrah > bebas/lepas > terdakwa > tersangka
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

async function runInBatches<T>(items: T[], size: number, fn: (item: T) => Promise<unknown>) {
  for (let i = 0; i < items.length; i += size) {
    await Promise.all(items.slice(i, i + size).map(fn));
  }
}

export async function runSeed() {
  console.log('Memulai seeding terpadu LKI v2.0 dari data/normalized/...');

  // 1. Provinces (38 + nasional)
  await runInBatches(CANONICAL_PROVINCES, 15, (p) =>
    db
      .insert(schema.provinces)
      .values({
        id: p.id,
        name: p.name,
        island_cluster: p.island_cluster,
        bps_code: p.bps_code,
      })
      .onConflictDoUpdate({
        target: schema.provinces.id,
        set: { name: p.name, island_cluster: p.island_cluster, bps_code: p.bps_code },
      })
  );

  // 2. Presidential Eras (10)
  await runInBatches(ERAS_MASTER, 15, (e) =>
    db
      .insert(schema.presidentialEras)
      .values(e)
      .onConflictDoUpdate({
        target: schema.presidentialEras.id,
        set: {
          name: e.name,
          sort_order: e.sort_order,
          start_date: e.start_date,
          end_date: e.end_date,
          cabinet_name: e.cabinet_name,
          context_summary: e.context_summary,
        },
      })
  );

  // 3. Load all canonical JSON datasets
  const sourcesData = readNormalized<any>('sources');
  const partiesData = readNormalized<any>('parties');
  const locationsData = readNormalized<any>('locations');
  const companiesData = readNormalized<any>('companies');
  const personsData = readNormalized<any>('persons');
  const positionsData = readNormalized<any>('positions');
  const partyMembershipsData = readNormalized<any>('party_memberships');
  const casesData = readNormalized<any>('cases');
  const casePersonsData = readNormalized<any>('case_persons');
  const financialData = readNormalized<any>('financial_records');
  const verdictsData = readNormalized<any>('verdicts');
  const timelineData = readNormalized<any>('timeline_events');
  const caseCompaniesData = readNormalized<any>('case_companies');
  const caseLocationsData = readNormalized<any>('case_locations');

  // 4. Sources
  await runInBatches(sourcesData, 15, (s) =>
    db
      .insert(schema.sources)
      .values({
        id: s.source_id,
        source_title: s.source_title,
        source_url: s.source_url,
        source_type: s.source_type ?? 'court_decision',
        source_institution: s.source_institution,
        publication_date: s.publication_date,
        access_date: s.access_date ?? '2026-09-19',
        source_page: s.source_page,
        source_excerpt: s.source_excerpt,
        source_reliability: s.source_reliability ?? 'high',
      })
      .onConflictDoUpdate({
        target: schema.sources.id,
        set: {
          source_title: s.source_title,
          source_url: s.source_url,
          source_institution: s.source_institution,
          source_excerpt: s.source_excerpt,
        },
      })
  );

  // 5. Parties
  await runInBatches(partiesData, 15, (p) =>
    db
      .insert(schema.parties)
      .values({
        id: p.party_id,
        name: p.party_name,
        abbreviation: p.party_abbreviation,
        color_hex: PARTY_COLORS[p.party_id] ?? '#475569',
      })
      .onConflictDoUpdate({
        target: schema.parties.id,
        set: {
          name: p.party_name,
          abbreviation: p.party_abbreviation,
          color_hex: PARTY_COLORS[p.party_id] ?? '#475569',
        },
      })
  );

  // 6. Locations
  const locationRows = locationsData.map((l) => ({
    id: l.location_id,
    province_id: resolveProvinceId(l.province),
    city_regency: l.city_regency,
    district: l.district,
    latitude: l.latitude !== null && l.latitude !== undefined ? String(l.latitude) : null,
    longitude: l.longitude !== null && l.longitude !== undefined ? String(l.longitude) : null,
    location_type: l.location_type ?? 'offense_location',
  }));
  if (locationRows.length > 0) {
    await db.insert(schema.locations).values(locationRows).onConflictDoNothing();
  }

  // 7. Companies
  await runInBatches(companiesData, 15, (comp) => {
    const slug = slugify(comp.company_name) || comp.company_id;
    return db
      .insert(schema.companies)
      .values({
        id: comp.company_id,
        slug,
        name: comp.company_name,
        company_type: comp.company_type,
        industry: comp.industry,
        business_sector: comp.business_sector,
        company_location: comp.company_location,
        beneficial_owner: comp.beneficial_owner,
        beneficial_owner_source: comp.beneficial_owner_source,
        beneficial_owner_verification_status: comp.beneficial_owner_verification_status ?? 'UNVERIFIED',
        company_status: comp.company_status ?? 'aktif',
        source_id: comp.source_id,
      })
      .onConflictDoUpdate({
        target: schema.companies.id,
        set: {
          name: comp.company_name,
          beneficial_owner: comp.beneficial_owner,
          company_status: comp.company_status ?? 'aktif',
        },
      });
  });

  // 8. Persons
  await runInBatches(personsData, 15, (per) => {
    const slug = slugify(per.full_name) || per.person_id;
    return db
      .insert(schema.persons)
      .values({
        id: per.person_id,
        slug,
        full_name: per.full_name,
        normalized_name: per.normalized_name,
        aliases: per.alias ?? [],
        gender: per.gender,
        birth_place: per.birth_place,
        birth_date: per.birth_date,
        occupation: per.occupation,
        nationality: per.nationality ?? 'Indonesia',
      })
      .onConflictDoUpdate({
        target: schema.persons.id,
        set: {
          full_name: per.full_name,
          occupation: per.occupation,
          aliases: per.alias ?? [],
        },
      });
  });

  // 9. Positions
  const positionRows = positionsData.map((pos) => ({
    id: pos.position_id,
    person_id: pos.person_id,
    position_title: pos.position_title,
    institution: pos.institution,
    government_level: pos.government_level,
    sector: pos.sector,
    province_id: pos.province ? resolveProvinceId(pos.province) : null,
    city_regency: pos.city_regency,
    period_start: pos.period_start,
    period_end: pos.period_end,
    position_at_offense: Boolean(pos.position_at_offense),
    position_at_arrest: Boolean(pos.position_at_arrest),
    position_at_verdict: Boolean(pos.position_at_verdict),
    source_id: pos.source_id,
  }));
  if (positionRows.length > 0) {
    await db.insert(schema.positions).values(positionRows).onConflictDoNothing();
  }

  // 10. Party Memberships
  const partyMembershipRows = partyMembershipsData.map((pm) => ({
    id: pm.membership_id,
    person_id: pm.person_id,
    party_id: pm.party_id,
    party_position: pm.party_position,
    membership_start: pm.membership_start,
    membership_end: pm.membership_end,
    party_status: pm.party_status ?? 'aktif',
    party_at_offense: Boolean(pm.party_at_offense),
    party_at_arrest: Boolean(pm.party_at_arrest),
    party_at_verdict: Boolean(pm.party_at_verdict),
    source_id: pm.source_id,
  }));
  if (partyMembershipRows.length > 0) {
    await db.insert(schema.partyMemberships).values(partyMembershipRows).onConflictDoNothing();
  }

  // 11. Build lookup maps for case province & status
  const locationMap = new Map(locationsData.map((l: any) => [l.location_id, l]));
  const positionByPerson = new Map<string, any>();
  for (const pos of positionsData) {
    if (!positionByPerson.has(pos.person_id) || pos.position_at_offense) {
      positionByPerson.set(pos.person_id, pos);
    }
  }

  // 12. Cases
  await runInBatches(casesData, 15, (c) => {
    const eraId = ERA_MAPPING_BY_NAME[c.era_pemerintahan] ?? 'era-jokowi-2';
    const relatedCp = casePersonsData.filter((cp: any) => cp.case_id === c.case_id);
    const relatedVerdicts = verdictsData.filter((v: any) => v.case_id === c.case_id);
    const relatedLocs = caseLocationsData
      .filter((cl: any) => cl.case_id === c.case_id)
      .map((cl: any) => locationMap.get(cl.location_id))
      .filter(Boolean);

    let provinceName: string | null = relatedLocs[0]?.province ?? null;
    if (!provinceName && relatedCp[0]) {
      provinceName = positionByPerson.get(relatedCp[0].person_id)?.province ?? null;
    }
    const primaryProvinceId = resolveProvinceId(provinceName);
    const legalStatus = deriveCaseStatus(c, relatedCp, relatedVerdicts);
    const slug = slugify(c.case_title) || c.case_id;

    return db
      .insert(schema.cases)
      .values({
        id: c.case_id,
        slug,
        case_title: c.case_title,
        normalized_case_title: c.normalized_case_title,
        case_number: c.case_number,
        case_type: c.case_type ?? 'Tindak Pidana Korupsi',
        era_id: eraId,
        primary_province_id: primaryProvinceId,
        sector_category: mapSectorToCategory(c.sector),
        sector_label: c.sector,
        sub_sector: c.sub_sector,
        primary_mode: c.primary_mode,
        secondary_modes: c.secondary_modes ?? [],
        case_date: c.case_date,
        investigation_date: c.investigation_date,
        suspect_date: c.suspect_date,
        indictment_date: c.indictment_date,
        trial_start_date: c.trial_start_date,
        verdict_date: c.verdict_date,
        final_decision_date: c.final_decision_date,
        current_legal_status: legalStatus,
        summary: c.summary,
        verification_status: c.verification_status ?? 'VERIFIED_PRIMARY',
        confidence_level: c.confidence_level ?? 'high',
        possible_duplicate: Boolean(c.possible_duplicate),
        needs_manual_review: Boolean(c.needs_manual_review),
        verification_note: c.verification_note,
      })
      .onConflictDoUpdate({
        target: schema.cases.id,
        set: {
          case_title: c.case_title,
          summary: c.summary,
          current_legal_status: legalStatus,
          primary_province_id: primaryProvinceId,
          sector_category: mapSectorToCategory(c.sector),
          sector_label: c.sector,
        },
      });
  });

  // 13. Case Persons
  const casePersonRows = casePersonsData.map((cp) => ({
    id: cp.case_person_id,
    case_id: cp.case_id,
    person_id: cp.person_id,
    is_primary_subject: true,
    role_in_case: cp.role_in_case,
    legal_status: cp.legal_status,
    offense_role: cp.offense_role,
    defendant_role: cp.defendant_role,
    source_id: cp.source_id,
  }));
  if (casePersonRows.length > 0) {
    await db.insert(schema.casePersons).values(casePersonRows).onConflictDoNothing();
  }

  // 14. Case Companies & Case Locations
  const caseCompanyRows = caseCompaniesData.map((cc) => ({
    id: cc.case_company_id,
    case_id: cc.case_id,
    company_id: cc.company_id,
    company_role_in_case: cc.company_role_in_case,
    transaction_value: cc.transaction_value !== null ? String(cc.transaction_value) : null,
    contract_value: cc.contract_value !== null ? String(cc.contract_value) : null,
    tender_value: cc.tender_value !== null ? String(cc.tender_value) : null,
    transaction_date: cc.transaction_date,
    company_case_status: cc.company_case_status,
    source_id: cc.source_id,
  }));
  if (caseCompanyRows.length > 0) {
    await db.insert(schema.caseCompanies).values(caseCompanyRows).onConflictDoNothing();
  }

  const caseLocationRows = caseLocationsData.map((cl) => ({
    id: cl.case_location_id,
    case_id: cl.case_id,
    location_id: cl.location_id,
    location_context: cl.location_context,
  }));
  if (caseLocationRows.length > 0) {
    await db.insert(schema.caseLocations).values(caseLocationRows).onConflictDoNothing();
  }

  // 15. Financial Records, Verdicts, Timeline Events & Case-Sources linkage
  const caseSourcePairs = new Set<string>();
  const linkSource = (caseId: string, sourceId?: string | null) => {
    if (caseId && sourceId) caseSourcePairs.add(`${caseId}::${sourceId}`);
  };

  for (const cp of casePersonsData) linkSource(cp.case_id, cp.source_id);
  for (const cc of caseCompaniesData) linkSource(cc.case_id, cc.source_id);

  const financialRows = financialData.map((f) => {
    linkSource(f.case_id, f.source_id);
    return {
      id: f.financial_id,
      case_id: f.case_id,
      person_id: f.person_id,
      financial_type: f.financial_type,
      amount: String(f.amount),
      currency: f.currency ?? 'IDR',
      financial_year: f.financial_year,
      financial_description: f.financial_description,
      fact_classification: f.fact_classification,
      source_id: f.source_id,
      source_page: f.source_page,
      verification_status: f.verification_status ?? 'VERIFIED_PRIMARY',
    };
  });
  if (financialRows.length > 0) {
    await db.insert(schema.financialRecords).values(financialRows).onConflictDoNothing();
  }

  const verdictRows = verdictsData.map((v) => {
    linkSource(v.case_id, v.source_id);
    return {
      id: v.verdict_id,
      case_id: v.case_id,
      person_id: v.person_id,
      court: v.court,
      court_level: v.court_level,
      decision_number: v.decision_number,
      decision_date: v.decision_date,
      decision_type: v.decision_type,
      guilty_status: v.guilty_status,
      sentence_type: v.sentence_type,
      prison_sentence_months: v.prison_sentence_months ?? 0,
      fine_amount: String(v.fine_amount ?? 0),
      fine_substitute_sentence: v.fine_substitute_sentence,
      restitution_amount: String(v.restitution_amount ?? 0),
      restitution_substitute_sentence: v.restitution_substitute_sentence,
      additional_penalty: v.additional_penalty,
      asset_forfeiture: v.asset_forfeiture,
      political_disqualification: v.political_disqualification,
      is_final: Boolean(v.is_final),
      source_id: v.source_id,
    };
  });
  if (verdictRows.length > 0) {
    await db.insert(schema.verdicts).values(verdictRows).onConflictDoNothing();
  }

  const timelineRows = timelineData.map((t) => {
    linkSource(t.case_id, t.source_id);
    return {
      id: t.event_id,
      case_id: t.case_id,
      event_date: t.event_date,
      event_type: t.event_type,
      event_description: t.event_description,
      institution: t.institution,
      location: t.location,
      source_id: t.source_id,
      source_page: t.source_page,
    };
  });
  if (timelineRows.length > 0) {
    await db.insert(schema.timelineEvents).values(timelineRows).onConflictDoNothing();
  }

  const caseSourceRows = Array.from(caseSourcePairs).map((pair) => {
    const [case_id, source_id] = pair.split('::');
    return { case_id, source_id, is_primary: true };
  });
  if (caseSourceRows.length > 0) {
    await db.insert(schema.caseSources).values(caseSourceRows).onConflictDoNothing();
  }

  // 16. Review Queue from data/quality/review_queue.json
  const rqPath = path.resolve(process.cwd(), 'data', 'quality', 'review_queue.json');
  if (fs.existsSync(rqPath)) {
    const rqItems = JSON.parse(fs.readFileSync(rqPath, 'utf8')) as any[];
    const rqRows = rqItems.map((rq) => ({
      id: rq.review_id,
      entity_type: rq.entity_type,
      entity_id: rq.entity_id,
      reason: rq.reason,
      disparity_details: rq.disparity_details,
      conflicting_sources: rq.conflicting_sources ?? [],
      status: rq.status ?? 'pending',
    }));
    if (rqRows.length > 0) {
      await db.insert(schema.reviewQueue).values(rqRows).onConflictDoNothing();
    }
  }

  // 17. Default Site Settings (announcement & donation)
  await db
    .insert(schema.siteSettings)
    .values({
      key: 'announcement',
      value: {
        title: 'Pemberitahuan Asas Hukum & Integritas Sumber Primer',
        badge: 'Pasal 8 ayat (1) UU No. 48/2009',
        main_text:
          'Setiap orang yang disangka, dituntut, atau dihadapkan di depan pengadilan wajib dianggap tidak bersalah sebelum ada putusan pengadilan berkekuatan hukum tetap (inkrah).',
        sub_text:
          'Angka kerugian negara, nilai audit BPK/BPKP, nilai proyek, dan suap dipisahkan secara ketat (Anti Double-Counting) dengan tautan rujukan direktori hukum.',
        is_active: true,
      },
    })
    .onConflictDoNothing();

  await db
    .insert(schema.siteSettings)
    .values({
      key: 'donation',
      value: {
        title: 'Dukung Independensi Arsip Transparansi LKI',
        description:
          'Bantu operasional infrastruktur basis data publik, verifikasi dokumen putusan pengadilan, dan keterbukaan informasi perkara korupsi di Indonesia.',
        qris_image_url: '',
        account_name: 'Pengelola Liga Korupsi Indonesia',
        bank_info: 'Dukungan dapat disalurkan via QRIS resmi apabila gambar QRIS telah dikonfigurasi kurator.',
        is_active: true,
      },
    })
    .onConflictDoNothing();

  // 18. Recompute anti-double-counting aggregates across all cases and provinces
  await recomputeCaseAndGlobalAggregates();
  console.log(`Seeding selesai: ${casesData.length} perkara, ${personsData.length} tokoh, ${sourcesData.length} sumber.`);
}

if (import.meta.main) {
  runSeed()
    .then(async () => {
      await pgClient.end();
      process.exit(0);
    })
    .catch(async (err) => {
      console.error('Seed gagal:', err);
      await pgClient.end();
      process.exit(1);
    });
}
