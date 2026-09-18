import { db } from './index.js';
import * as schema from './schema.js';
import { eq, sql } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

// Resolvers & Mapping
const ERA_MAPPING: Record<string, string> = {
  'Era Kemerdekaan & Orde Lama (1945 - 1966)': 'era-orla',
  'Era Orde Baru (1966 - 1998)': 'era-orba',
  'Reformasi Awal / B.J. Habibie': 'era-habibie',
  'Abdurrahman Wahid': 'era-gusdur',
  'Megawati Soekarnoputri': 'era-megawati',
  'Susilo Bambang Yudhoyono Periode I': 'era-sby-1',
  'Susilo Bambang Yudhoyono Periode II': 'era-sby-2',
  'Joko Widodo Periode I': 'era-jokowi-1',
  'Joko Widodo Periode II': 'era-jokowi-2',
  'Prabowo Subianto': 'era-prabowo'
};

const PROVINCE_NAME_TO_ID: Record<string, string> = {
  'aceh': 'aceh',
  'sumatera utara': 'sumut',
  'sumatera barat': 'sumbar',
  'riau': 'riau',
  'kepulauan riau': 'kepri',
  'jambi': 'jambi',
  'sumatera selatan': 'sumsel',
  'kepulauan bangka belitung': 'babel',
  'bangka belitung': 'babel',
  'bengkulu': 'bengkulu',
  'lampung': 'lampung',
  'dki jakarta': 'dki-jakarta',
  'jawa barat': 'jabar',
  'banten': 'banten',
  'jawa tengah': 'jateng',
  'di yogyakarta': 'diy',
  'daerah istimewa yogyakarta': 'diy',
  'jawa timur': 'jatim',
  'bali': 'bali',
  'nusa tenggara barat': 'ntb',
  'nusa tenggara timur': 'ntt',
  'kalimantan barat': 'kalbar',
  'kalimantan tengah': 'kalteng',
  'kalimantan selatan': 'kalsel',
  'kalimantan timur': 'kaltim',
  'kalimantan utara': 'kaltara',
  'sulawesi utara': 'sulut',
  'gorontalo': 'gorontalo',
  'sulawesi tengah': 'sulteng',
  'sulawesi barat': 'sulbar',
  'sulawesi selatan': 'sulsel',
  'sulawesi tenggara': 'sultra',
  'maluku': 'maluku',
  'maluku utara': 'malut',
  'papua': 'papua',
  'papua barat': 'papbar',
  'papua selatan': 'papsel',
  'papua tengah': 'papteng',
  'papua pegunungan': 'papbd',
  'papua barat daya': 'papbd2'
};

function mapSectorCategory(sector: string): 'pengadaan_barang_jasa' | 'bansos_bencana' | 'suap_gratifikasi' | 'perizinan_sda_tambang' | 'mafia_peradilan' {
  const s = (sector || '').toLowerCase();
  if (s.includes('tambang') || s.includes('hutan') || s.includes('kebun') || s.includes('izin') || s.includes('lingkungan')) {
    return 'perizinan_sda_tambang';
  }
  if (s.includes('bansos') || s.includes('bencana')) {
    return 'bansos_bencana';
  }
  if (s.includes('suap') || s.includes('gratifikasi') || s.includes('pemerasan')) {
    return 'suap_gratifikasi';
  }
  if (s.includes('peradilan') || s.includes('bank') || s.includes('bumn') || s.includes('pajak') || s.includes('keuangan')) {
    return 'mafia_peradilan';
  }
  return 'pengadaan_barang_jasa';
}

function mapLegalStatus(status: string): 'tersangka' | 'terdakwa' | 'divonis_inkrah' | 'bebas' {
  const s = (status || '').toLowerCase();
  if (s.includes('inkrah') || s.includes('bersalah')) return 'divonis_inkrah';
  if (s.includes('terdakwa') || s.includes('dituntut')) return 'terdakwa';
  if (s.includes('tersangka') || s.includes('penyidikan') || s.includes('penyelidikan')) return 'tersangka';
  return 'bebas';
}

export async function seedFromData() {
  console.log('🌱 Memulai proses impor dataset canonical dari folder data/ ke PostgreSQL (lki_db)...');

  const baseDir = path.resolve(process.cwd(), 'data', 'normalized');

  function loadJSON<T>(file: string): T[] {
    const p = path.join(baseDir, `${file}.json`);
    if (!fs.existsSync(p)) return [];
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  }

  const sources = loadJSON<any>('sources');
  const partiesData = loadJSON<any>('parties');
  const locationsData = loadJSON<any>('locations');
  const companiesData = loadJSON<any>('companies');
  const personsData = loadJSON<any>('persons');
  const positionsData = loadJSON<any>('positions');
  const partyMemberships = loadJSON<any>('party_memberships');
  const casesData = loadJSON<any>('cases');
  const casePersonsData = loadJSON<any>('case_persons');
  const financialRecords = loadJSON<any>('financial_records');
  const verdictsData = loadJSON<any>('verdicts');
  const timelineEvents = loadJSON<any>('timeline_events');
  const caseCompaniesData = loadJSON<any>('case_companies');
  const caseLocationsData = loadJSON<any>('case_locations');

  console.log(`✓ Data termuat: ${casesData.length} kasus, ${personsData.length} tokoh, ${partiesData.length} partai, ${companiesData.length} perusahaan, ${sources.length} sumber.`);

  // 1. Clean existing data in reverse order
  await db.delete(schema.caseTimelineEvents);
  await db.delete(schema.caseCompanies);
  await db.delete(schema.caseOfficials);
  await db.delete(schema.cases);
  await db.delete(schema.officials);
  await db.delete(schema.companies);
  await db.delete(schema.parties);
  await db.delete(schema.presidentialEras);
  await db.delete(schema.provinces);

  console.log('✓ Pembersihan tabel lama selesai.');

  // 2. Admin Users (Pastikan super admin & editor aktif)
  const existingAdmins = await db.select().from(schema.adminUsers);
  if (existingAdmins.length === 0) {
    const adminPasswordHash = bcrypt.hashSync('admin123', 10);
    await db.insert(schema.adminUsers).values([
      {
        id: 'admin-super-01',
        username: 'admin',
        password_hash: adminPasswordHash,
        role: 'super_admin',
        created_at: new Date('2025-01-01')
      },
      {
        id: 'admin-editor-02',
        username: 'editor_hukum',
        password_hash: adminPasswordHash,
        role: 'editor',
        created_at: new Date('2025-01-15')
      }
    ]);
    console.log('✓ Admin users diinisialisasi.');
  }

  // 3. 10 Presidential Eras (1945 - Sekarang)
  const eras = [
    {
      id: 'era-orla',
      name: 'Era Kemerdekaan & Orde Lama (1945 - 1966)',
      start_date: new Date('1945-08-17'),
      end_date: new Date('1966-03-11'),
      context_summary: 'Masa perjuangan kemerdekaan, kabinet parlementer, hingga Demokrasi Terpimpin.',
      cabinet_name: 'Kabinet Presidensial s/d Dwikora'
    },
    {
      id: 'era-orba',
      name: 'Era Orde Baru (1966 - 1998)',
      start_date: new Date('1966-03-11'),
      end_date: new Date('1998-05-21'),
      context_summary: 'Sentralisasi kekuasaan, stabilitas politik, dan monopoli tata kelola ekonomi nasional.',
      cabinet_name: 'Kabinet Pembangunan I-VII'
    },
    {
      id: 'era-habibie',
      name: 'Reformasi Awal / B.J. Habibie (1998 - 1999)',
      start_date: new Date('1998-05-21'),
      end_date: new Date('1999-10-20'),
      context_summary: 'Masa transisi pasca-krisis moneter 1998 dan peletakan fondasi kebebasan pers & otonomi daerah.',
      cabinet_name: 'Kabinet Reformasi Pembangunan'
    },
    {
      id: 'era-gusdur',
      name: 'Era Abdurrahman Wahid (1999 - 2001)',
      start_date: new Date('1999-10-20'),
      end_date: new Date('2001-07-23'),
      context_summary: 'Demokratisasi dan reformasi birokrasi, masa pembentukan Tim Gabungan Pemberantasan Tindak Pidana Korupsi (TGPTPK).',
      cabinet_name: 'Kabinet Persatuan Nasional'
    },
    {
      id: 'era-megawati',
      name: 'Era Megawati Soekarnoputri (2001 - 2004)',
      start_date: new Date('2001-07-23'),
      end_date: new Date('2004-10-20'),
      context_summary: 'Restrukturisasi perbankan pasca krisis dan pembentukan institusi independen Komisi Pemberantasan Korupsi (UU No. 30 Tahun 2002).',
      cabinet_name: 'Kabinet Gotong Royong'
    },
    {
      id: 'era-sby-1',
      name: 'Era Susilo Bambang Yudhoyono I (2004 - 2009)',
      start_date: new Date('2004-10-20'),
      end_date: new Date('2009-10-20'),
      context_summary: 'Penguatan institusi KPK, intensifikasi penindakan korupsi pejabat publik, dan pengadilan tipikor.',
      cabinet_name: 'Kabinet Indonesia Bersatu I'
    },
    {
      id: 'era-sby-2',
      name: 'Era Susilo Bambang Yudhoyono II (2009 - 2014)',
      start_date: new Date('2009-10-20'),
      end_date: new Date('2014-10-20'),
      context_summary: 'Maraknya pengungkapan kasus korupsi proyek infrastruktur, pengadaan barang skala besar, dan mafia anggaran.',
      cabinet_name: 'Kabinet Indonesia Bersatu II'
    },
    {
      id: 'era-jokowi-1',
      name: 'Era Joko Widodo I (2014 - 2019)',
      start_date: new Date('2014-10-20'),
      end_date: new Date('2019-10-20'),
      context_summary: 'Fokus percepatan proyek infrastruktur strategis nasional, perizinan satu pintu, dan digitalisasi.',
      cabinet_name: 'Kabinet Kerja'
    },
    {
      id: 'era-jokowi-2',
      name: 'Era Joko Widodo II (2019 - 2024)',
      start_date: new Date('2019-10-20'),
      end_date: new Date('2024-10-20'),
      context_summary: 'Periode penanganan pandemi COVID-19, bansos, tata kelola komoditas tambang, dan revisi UU KPK.',
      cabinet_name: 'Kabinet Indonesia Maju'
    },
    {
      id: 'era-prabowo',
      name: 'Era Prabowo Subianto (2024 - Sekarang)',
      start_date: new Date('2024-10-20'),
      end_date: null,
      context_summary: 'Pemerintahan Kabinet Merah Putih dengan penekanan penertiban kebocoran anggaran negara dan penegakan hukum.',
      cabinet_name: 'Kabinet Merah Putih'
    }
  ];
  await db.insert(schema.presidentialEras).values(eras);
  console.log(`✓ ${eras.length} Era Kepresidenan berhasil diimpor.`);

  // 4. 38 Provinces of Indonesia
  const provincesList = [
    { id: 'aceh', name: 'Aceh', island_cluster: 'Sumatera', geojson_code: 'ID-AC' },
    { id: 'sumut', name: 'Sumatera Utara', island_cluster: 'Sumatera', geojson_code: 'ID-SU' },
    { id: 'sumbar', name: 'Sumatera Barat', island_cluster: 'Sumatera', geojson_code: 'ID-SB' },
    { id: 'riau', name: 'Riau', island_cluster: 'Sumatera', geojson_code: 'ID-RI' },
    { id: 'kepri', name: 'Kepulauan Riau', island_cluster: 'Sumatera', geojson_code: 'ID-KR' },
    { id: 'jambi', name: 'Jambi', island_cluster: 'Sumatera', geojson_code: 'ID-JA' },
    { id: 'sumsel', name: 'Sumatera Selatan', island_cluster: 'Sumatera', geojson_code: 'ID-SS' },
    { id: 'babel', name: 'Kepulauan Bangka Belitung', island_cluster: 'Sumatera', geojson_code: 'ID-BB' },
    { id: 'bengkulu', name: 'Bengkulu', island_cluster: 'Sumatera', geojson_code: 'ID-BE' },
    { id: 'lampung', name: 'Lampung', island_cluster: 'Sumatera', geojson_code: 'ID-LA' },
    { id: 'dki-jakarta', name: 'DKI Jakarta', island_cluster: 'Jawa', geojson_code: 'ID-JK' },
    { id: 'jabar', name: 'Jawa Barat', island_cluster: 'Jawa', geojson_code: 'ID-JB' },
    { id: 'banten', name: 'Banten', island_cluster: 'Jawa', geojson_code: 'ID-BT' },
    { id: 'jateng', name: 'Jawa Tengah', island_cluster: 'Jawa', geojson_code: 'ID-JT' },
    { id: 'diy', name: 'DI Yogyakarta', island_cluster: 'Jawa', geojson_code: 'ID-YO' },
    { id: 'jatim', name: 'Jawa Timur', island_cluster: 'Jawa', geojson_code: 'ID-JI' },
    { id: 'bali', name: 'Bali', island_cluster: 'Bali & Nusa Tenggara', geojson_code: 'ID-BA' },
    { id: 'ntb', name: 'Nusa Tenggara Barat', island_cluster: 'Bali & Nusa Tenggara', geojson_code: 'ID-NB' },
    { id: 'ntt', name: 'Nusa Tenggara Timur', island_cluster: 'Bali & Nusa Tenggara', geojson_code: 'ID-NT' },
    { id: 'kalbar', name: 'Kalimantan Barat', island_cluster: 'Kalimantan', geojson_code: 'ID-KB' },
    { id: 'kalteng', name: 'Kalimantan Tengah', island_cluster: 'Kalimantan', geojson_code: 'ID-KT' },
    { id: 'kalsel', name: 'Kalimantan Selatan', island_cluster: 'Kalimantan', geojson_code: 'ID-KS' },
    { id: 'kaltim', name: 'Kalimantan Timur', island_cluster: 'Kalimantan', geojson_code: 'ID-KI' },
    { id: 'kaltara', name: 'Kalimantan Utara', island_cluster: 'Kalimantan', geojson_code: 'ID-KU' },
    { id: 'sulut', name: 'Sulawesi Utara', island_cluster: 'Sulawesi', geojson_code: 'ID-SA' },
    { id: 'gorontalo', name: 'Gorontalo', island_cluster: 'Sulawesi', geojson_code: 'ID-GO' },
    { id: 'sulteng', name: 'Sulawesi Tengah', island_cluster: 'Sulawesi', geojson_code: 'ID-ST' },
    { id: 'sulbar', name: 'Sulawesi Barat', island_cluster: 'Sulawesi', geojson_code: 'ID-SR' },
    { id: 'sulsel', name: 'Sulawesi Selatan', island_cluster: 'Sulawesi', geojson_code: 'ID-SN' },
    { id: 'sultra', name: 'Sulawesi Tenggara', island_cluster: 'Sulawesi', geojson_code: 'ID-SG' },
    { id: 'maluku', name: 'Maluku', island_cluster: 'Maluku & Papua', geojson_code: 'ID-MA' },
    { id: 'malut', name: 'Maluku Utara', island_cluster: 'Maluku & Papua', geojson_code: 'ID-MU' },
    { id: 'papua', name: 'Papua', island_cluster: 'Maluku & Papua', geojson_code: 'ID-PA' },
    { id: 'papbar', name: 'Papua Barat', island_cluster: 'Maluku & Papua', geojson_code: 'ID-PB' },
    { id: 'papsel', name: 'Papua Selatan', island_cluster: 'Maluku & Papua', geojson_code: 'ID-PS' },
    { id: 'papteng', name: 'Papua Tengah', island_cluster: 'Maluku & Papua', geojson_code: 'ID-PT' },
    { id: 'papbd', name: 'Papua Pegunungan', island_cluster: 'Maluku & Papua', geojson_code: 'ID-PE' },
    { id: 'papbd2', name: 'Papua Barat Daya', island_cluster: 'Maluku & Papua', geojson_code: 'ID-PD' }
  ];
  await db.insert(schema.provinces).values(
    provincesList.map(p => ({
      ...p,
      total_loss_amount: 0,
      total_cases: 0,
      created_at: new Date('2025-01-01'),
      updated_at: new Date('2025-01-01')
    }))
  );
  console.log(`✓ ${provincesList.length} Provinsi diinisialisasi.`);

  // 5. Political Parties
  const partyInserts = partiesData.map(p => ({
    id: p.party_id,
    name: p.party_name,
    logo_url: `/logos/${p.party_abbreviation.toLowerCase()}.png`,
    total_loss_amount: 0,
    total_cases: 0
  }));
  await db.insert(schema.parties).values(partyInserts);
  console.log(`✓ ${partyInserts.length} Partai Politik diimpor.`);

  // 6. Companies
  const companyInserts = companiesData.map(c => ({
    id: c.company_id,
    name: c.company_name,
    sector: c.business_sector || c.industry || 'Korporasi Swasta',
    description: `${c.company_type || ''} - Lokasi: ${c.company_location || 'Indonesia'}. Status: ${c.company_status || 'aktif'}.`
  }));
  await db.insert(schema.companies).values(companyInserts);
  console.log(`✓ ${companyInserts.length} Korporasi diimpor.`);

  // Helper Maps
  const posMap = new Map<string, any>(positionsData.map(pos => [pos.person_id, pos]));
  const pmMap = new Map<string, any>(partyMemberships.map(pm => [pm.person_id, pm]));
  const cpMap = new Map<string, any>(casePersonsData.map(cp => [cp.person_id, cp]));
  const locMap = new Map<string, any>(locationsData.map(loc => [loc.location_id, loc]));

  // Case Locations Grouping
  const caseLocsMap = new Map<string, any[]>();
  for (const cl of caseLocationsData) {
    if (!caseLocsMap.has(cl.case_id)) caseLocsMap.set(cl.case_id, []);
    const l = locMap.get(cl.location_id);
    if (l) caseLocsMap.get(cl.case_id)!.push(l);
  }

  // 7. Officials (43 Figur Publik)
  const officialInserts = personsData.map(p => {
    const pos = posMap.get(p.person_id);
    const pm = pmMap.get(p.person_id);
    const cp = cpMap.get(p.person_id);

    // Resolve province
    let provId = 'dki-jakarta';
    if (pos?.province) {
      const pKey = pos.province.trim().toLowerCase();
      if (PROVINCE_NAME_TO_ID[pKey]) provId = PROVINCE_NAME_TO_ID[pKey];
    }

    const partyId = pm?.party_id || 'pty-non-partisan';
    const legalStatus = mapLegalStatus(cp?.legal_status || 'divonis_inkrah');

    return {
      id: p.person_id,
      full_name: p.full_name,
      photo_url: undefined,
      position_title: pos?.position_title || p.occupation || 'Pejabat Publik',
      province_id: provId,
      party_id: partyId,
      total_loss_amount: 0,
      current_legal_status: legalStatus,
      created_at: new Date('2025-01-01'),
      updated_at: new Date('2025-01-01')
    };
  });
  await db.insert(schema.officials).values(officialInserts);
  console.log(`✓ ${officialInserts.length} Pejabat Publik / Terdakwa diimpor.`);

  // 8. Cases (43 Perkara LKI)
  const casePersonsByCase = new Map<string, any>(casePersonsData.map(cp => [cp.case_id, cp]));
  const verdictsByCase = new Map<string, any>(verdictsData.map(v => [v.case_id, v]));
  const finByCase = new Map<string, any[]>();
  for (const fin of financialRecords) {
    if (!finByCase.has(fin.case_id)) finByCase.set(fin.case_id, []);
    finByCase.get(fin.case_id)!.push(fin);
  }
  const sourcesMap = new Map<string, any>(sources.map(s => [s.source_id, s]));

  const caseInserts = [];
  const caseOfficialLinks = [];

  for (const c of casesData) {
    const cp = casePersonsByCase.get(c.case_id);
    const primaryPersonId = cp ? cp.person_id : null;
    const v = verdictsByCase.get(c.case_id);
    const fins = finByCase.get(c.case_id) || [];

    // Resolve source
    const primarySrcId = v?.source_id || fins[0]?.source_id || cp?.source_id;
    const srcObj = primarySrcId ? sourcesMap.get(primarySrcId) : null;
    const sourceUrl = srcObj?.source_url || 'https://putusan3.mahkamahagung.go.id';

    // Resolve era
    const eraId = ERA_MAPPING[c.era_pemerintahan] || 'era-prabowo';

    // Resolve province
    const locs = caseLocsMap.get(c.case_id) || [];
    const pos = primaryPersonId ? posMap.get(primaryPersonId) : null;
    let provName = locs[0]?.province || pos?.province || 'DKI Jakarta';
    const provId = PROVINCE_NAME_TO_ID[provName.trim().toLowerCase()] || 'dki-jakarta';

    // Resolve financial amounts strictly complying with anti-double counting
    const courtLossRec = fins.find(f => f.financial_type === 'court_recognized_loss_amount');
    const auditLossRec = fins.find(f => f.financial_type === 'audit_loss_amount');
    const seizedLossRec = fins.find(f => f.financial_type === 'assets_seized_value');
    const illegalProfitRec = fins.find(f => f.financial_type === 'illegal_profit_amount');
    const allegedLossRec = fins.find(f => f.financial_type === 'alleged_loss_amount');
    const bribeLossRec = fins.find(f => f.financial_type === 'bribe_amount' || f.financial_type === 'gratification_amount');
    const restitutionRec = fins.find(f => f.financial_type === 'restitution_amount');

    let lossAmount = 0;
    if (courtLossRec) {
      lossAmount = courtLossRec.amount;
    } else if (auditLossRec) {
      lossAmount = auditLossRec.amount;
    } else if (seizedLossRec) {
      lossAmount = seizedLossRec.amount;
    } else if (illegalProfitRec) {
      lossAmount = illegalProfitRec.amount;
    } else if (allegedLossRec) {
      lossAmount = allegedLossRec.amount;
    } else if (bribeLossRec) {
      lossAmount = bribeLossRec.amount;
    } else if (restitutionRec) {
      lossAmount = restitutionRec.amount;
    }

    const fineAmount = v?.fine_amount || 0;
    const restitutionAmount = v?.restitution_amount || restitutionRec?.amount || 0;
    const prisonSentenceMonths = v?.prison_sentence_months || 0;
    const courtDecisionNumber = v?.decision_number || c.case_number || 'Perkara Resmi';
    const legalStatus = mapLegalStatus(v?.guilty_status === 'bersalah' ? 'divonis_inkrah' : (cp?.legal_status || 'divonis_inkrah'));
    const sectorCat = mapSectorCategory(c.sector);

    const caseDate = c.verdict_date || c.case_date || c.indictment_date || '2024-01-01';

    caseInserts.push({
      id: c.case_id,
      title: c.case_title,
      primary_official_id: primaryPersonId,
      province_id: provId,
      era_id: eraId,
      sector_category: sectorCat,
      loss_amount: lossAmount,
      fine_amount: fineAmount,
      restitution_amount: restitutionAmount,
      prison_sentence_months: prisonSentenceMonths,
      legal_status: legalStatus,
      court_decision_number: courtDecisionNumber,
      chronology: c.summary,
      charges_articles: c.verification_note ? `${c.secondary_modes?.join(', ') || ''}. Catatan: ${c.verification_note}` : c.secondary_modes?.join(', '),
      source_url: sourceUrl,
      verified_by: 'admin-super-01',
      verified_at: new Date(),
      case_date: new Date(caseDate),
      created_at: new Date('2025-01-01'),
      updated_at: new Date('2025-01-01')
    });

    if (primaryPersonId) {
      caseOfficialLinks.push({
        case_id: c.case_id,
        official_id: primaryPersonId,
        role_in_case: cp?.role_in_case || 'Terdakwa Utama'
      });
    }
  }

  await db.insert(schema.cases).values(caseInserts);
  console.log(`✓ ${caseInserts.length} Perkara Korupsi Faktual diimpor ke tabel cases.`);

  if (caseOfficialLinks.length > 0) {
    await db.insert(schema.caseOfficials).values(caseOfficialLinks);
    console.log(`✓ ${caseOfficialLinks.length} Relasi Perkara-Pejabat diimpor.`);
  }

  // 9. Case Companies (Relasi Korporasi)
  const caseCompanyLinks = caseCompaniesData.map(cc => ({
    case_id: cc.case_id,
    company_id: cc.company_id,
    transaction_date: cc.transaction_date ? new Date(cc.transaction_date) : null,
    transaction_role: cc.company_role_in_case
  }));
  if (caseCompanyLinks.length > 0) {
    await db.insert(schema.caseCompanies).values(caseCompanyLinks);
    console.log(`✓ ${caseCompanyLinks.length} Relasi Perkara-Korporasi diimpor.`);
  }

  // 10. Case Timeline Events
  const timelineInserts = timelineEvents.map(te => ({
    id: te.event_id,
    case_id: te.case_id,
    event_date: new Date(te.event_date),
    event_description: `${te.institution ? `[${te.institution}] ` : ''}${te.event_description}`,
    event_type: te.event_type
  }));
  if (timelineInserts.length > 0) {
    await db.insert(schema.caseTimelineEvents).values(timelineInserts);
    console.log(`✓ ${timelineInserts.length} Peristiwa Kronologi Kasus diimpor.`);
  }

  // 11. Recalculate Aggregates dynamically from imported cases
  console.log('🔄 Menghitung ulang agregasi total kerugian & jumlah perkara secara dinamis...');

  // Update Officials Total Loss
  for (const off of officialInserts) {
    const offCases = caseInserts.filter(c => c.primary_official_id === off.id);
    const sumLoss = offCases.reduce((acc, c) => acc + c.loss_amount, 0);
    await db
      .update(schema.officials)
      .set({ total_loss_amount: sumLoss })
      .where(eq(schema.officials.id, off.id));
  }

  // Update Provinces Aggregates
  for (const p of provincesList) {
    const pCases = caseInserts.filter(c => c.province_id === p.id);
    const sumLoss = pCases.reduce((acc, c) => acc + c.loss_amount, 0);
    await db
      .update(schema.provinces)
      .set({
        total_loss_amount: sumLoss,
        total_cases: pCases.length
      })
      .where(eq(schema.provinces.id, p.id));
  }

  // Update Parties Aggregates
  const officialPartyMap = new Map(officialInserts.map(o => [o.id, o.party_id]));
  for (const pty of partyInserts) {
    const ptyCases = caseInserts.filter(c => c.primary_official_id && officialPartyMap.get(c.primary_official_id) === pty.id);
    const sumLoss = ptyCases.reduce((acc, c) => acc + c.loss_amount, 0);
    await db
      .update(schema.parties)
      .set({
        total_loss_amount: sumLoss,
        total_cases: ptyCases.length
      })
      .where(eq(schema.parties.id, pty.id));
  }

  console.log('✅ SEEDING DARI FOLDER DATA/ SELESAI DENGAN SUKSES! Seluruh data faktual aktif.');
}

// Auto-run if executed as main script in Bun/Node
if (
  process.argv[1]?.includes('seedFromData') ||
  import.meta.main ||
  import.meta.url.endsWith(process.argv[1] || '')
) {
  seedFromData()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Terjadi kesalahan dalam proses seeding:', err);
      process.exit(1);
    });
}

