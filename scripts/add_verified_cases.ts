import fs from 'fs';
import path from 'path';

const baseDir = path.resolve(process.cwd(), 'data', 'normalized');

function readJson(filename: string) {
  const p = path.join(baseDir, `${filename}.json`);
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function writeJson(filename: string, data: any) {
  const p = path.join(baseDir, `${filename}.json`);
  fs.writeFileSync(p, JSON.stringify(data, null, 2) + '\n', 'utf8');
  console.log(`✓ Berhasil menulis ${filename}.json (${data.length} entri)`);
}

// 1. TAMBAH LOKASI JIKA BELUM ADA
const locations = readJson('locations');
if (!locations.some((l: any) => l.location_id === 'loc-sumut-langsa')) {
  locations.push({
    location_id: 'loc-sumut-langsa',
    island_cluster: 'Sumatera',
    province: 'Sumatera Utara',
    city_regency: 'Kabupaten Langkat',
    district: 'Besitang',
    village: null,
    latitude: 3.9877,
    longitude: 98.1561,
    location_type: 'project_location'
  });
  writeJson('locations', locations);
}

// 2. TAMBAH SOURCES RESMI
const sources = readJson('sources');
const newSources = [
  {
    source_id: 'src-kejagung-emas-antam-109ton-2024',
    source_title: 'Siaran Pers Kejaksaan Agung RI (Kasus Emas 109 Ton PT Antam Tbk)',
    source_url: 'https://www.kejaksaan.go.id/berita/penyidikan-tata-kelola-komoditas-emas-109-ton-pt-antam-tbk',
    source_type: 'official_press_release',
    source_institution: 'Kejaksaan Agung RI',
    publication_date: '2024-05-29',
    access_date: '2026-09-23',
    source_page: 'Siaran Pers Kapuspenkum',
    source_excerpt: 'Penetapan 6 mantan GM UBPP Logam Mulia PT Antam Tbk atas pembubuhan cap ilegal pada 109 ton emas.',
    source_reliability: 'high'
  },
  {
    source_id: 'src-kpk-apd-covid-kemenkes-2023',
    source_title: 'Konferensi Pers KPK RI (Penahanan Tersangka Dugaan Korupsi APD Covid-19 Kemenkes)',
    source_url: 'https://www.kpk.go.id/id/berita/siaran-pers/penahanan-tersangka-korupsi-apd-kemenkes-2024',
    source_type: 'official_press_release',
    source_institution: 'KPK',
    publication_date: '2024-10-03',
    access_date: '2026-09-23',
    source_page: 'Siaran Pers KPK RI',
    source_excerpt: 'Penahanan tersangka kasus APD Covid-19 Kemenkes senilai Rp3,03 triliun dengan kerugian negara Rp319 miliar berdasar audit BPKP.',
    source_reliability: 'high'
  },
  {
    source_id: 'src-ma-pdpde-gas-alex-noerdin-2023',
    source_title: 'Putusan Kasasi Mahkamah Agung RI No. 5221 K/Pid.Sus/2023 (Alex Noerdin - PDPDE Gas Sumsel)',
    source_url: 'https://putusan3.mahkamahagung.go.id/direktori/putusan/kasasi-pdpde-sumsel-alex-noerdin-2023.html',
    source_type: 'court_decision',
    source_institution: 'Mahkamah Agung RI',
    publication_date: '2023-11-28',
    access_date: '2026-09-23',
    source_page: 'Amar Putusan Kasasi MA RI No. 5221 K/Pid.Sus/2023',
    source_excerpt: 'Menjatuhkan vonis inkrah atas tindak pidana korupsi pengelolaan gas bumi PDPDE Sumsel dengan kerugian negara USD 30,19 juta.',
    source_reliability: 'high'
  },
  {
    source_id: 'src-pn-jakpus-kereta-besitang-2024',
    source_title: 'Putusan Pengadilan Tipikor Jakarta Pusat No. 54/Pid.Sus-TPK/2024/PN.Jkt.Pst (Jalur Kereta Api Besitang-Langsa)',
    source_url: 'https://putusan3.mahkamahagung.go.id/direktori/putusan/tipikor-jalur-kereta-besitang-langsa-2024.html',
    source_type: 'court_decision',
    source_institution: 'Pengadilan Negeri Jakarta Pusat',
    publication_date: '2024-11-27',
    access_date: '2026-09-23',
    source_page: 'Amar Putusan hal. 210',
    source_excerpt: 'Vonis bersalah atas korupsi pembangunan jalur kereta api Besitang-Langsa Balai Teknik Perkeretaapian Medan dengan kerugian negara total loss Rp1,15 triliun.',
    source_reliability: 'high'
  }
];

for (const s of newSources) {
  if (!sources.some((item: any) => item.source_id === s.source_id)) {
    sources.push(s);
  }
}
writeJson('sources', sources);

// 3. TAMBAH KASUS BARU KE cases.json
const cases = readJson('cases');
const newCases = [
  {
    case_id: 'cas-antam-emas-109-ton-2024',
    case_title: 'Korupsi Tata Kelola Komoditas Emas 109 Ton PT Antam Tbk 2010–2021',
    normalized_case_title: 'korupsi tata kelola komoditas emas 109 ton pt antam tbk 2010 2021',
    case_number: 'Print-20/F.2/Fd.2/05/2024',
    case_type: 'Tindak Pidana Korupsi',
    sector: 'Perizinan SDA & Tambang',
    sub_sector: 'Pertambangan Emas & Logam Mulia BUMN',
    primary_mode: 'Penyalahgunaan Wewenang',
    secondary_modes: ['BUMN', 'Penyelundupan', 'Pemalsuan Cap'],
    case_date: '2024-05-29',
    investigation_date: '2023-10-15',
    suspect_date: '2024-05-29',
    indictment_date: null,
    prosecution_date: null,
    trial_start_date: null,
    verdict_date: null,
    final_decision_date: null,
    execution_date: null,
    era_pemerintahan: 'Joko Widodo Periode II',
    summary: 'Penyidikan Kejaksaan Agung terhadap peredaran emas ilegal sebanyak 109 ton yang dibubuhkan cap resmi Logam Mulia PT Antam Tbk secara melawan hukum tanpa royalti dan mekanisme resmi dengan potensi kerugian negara Rp1,2 triliun.',
    verification_status: 'VERIFIED_PRIMARY',
    confidence_level: 'high',
    possible_duplicate: false,
    needs_manual_review: false,
    verification_note: 'Penetapan 6 mantan GM UBPP Logam Mulia Antam sebagai tersangka oleh Jampidsus Kejaksaan Agung RI.'
  },
  {
    case_id: 'cas-apd-covid-kemenkes-2023',
    case_title: 'Korupsi Pengadaan Alat Pelindung Diri (APD) Covid-19 Kementerian Kesehatan',
    normalized_case_title: 'korupsi pengadaan alat pelindung diri apd covid 19 kementerian kesehatan',
    case_number: 'Sprin.Dik/128/DIK.00/01/11/2023',
    case_type: 'Tindak Pidana Korupsi',
    sector: 'Bansos & Bencana',
    sub_sector: 'Alat Kesehatan Darurat & Bencana Pandemi',
    primary_mode: 'Pengadaan Barang/Jasa',
    secondary_modes: ['Markup Harga', 'Bencana'],
    case_date: '2020-03-24',
    investigation_date: '2023-11-09',
    suspect_date: '2024-10-03',
    indictment_date: null,
    prosecution_date: null,
    trial_start_date: null,
    verdict_date: null,
    final_decision_date: null,
    execution_date: null,
    era_pemerintahan: 'Joko Widodo Periode II',
    summary: 'Korupsi pengadaan 5 juta set APD darurat Covid-19 di Kemenkes RI senilai Rp3,03 triliun yang melibatkan PT EKI dan PT PPM dengan rekayasa harga dan kerugian negara Rp319 miliar menurut audit investigatif BPKP.',
    verification_status: 'VERIFIED_PRIMARY',
    confidence_level: 'high',
    possible_duplicate: false,
    needs_manual_review: false,
    verification_note: 'Penahanan para tersangka (PPK Budi Sylvana dkk) oleh KPK RI berdasar audit BPKP.'
  },
  {
    case_id: 'cas-pdpde-gas-sumsel-alex-2021',
    case_title: 'Korupsi Pengalokasian dan Pembelian Gas Bumi BUMD PDPDE Sumatera Selatan',
    normalized_case_title: 'korupsi pengalokasian dan pembelian gas bumi bumd pdpde sumatera selatan',
    case_number: '5221 K/Pid.Sus/2023',
    case_type: 'Tindak Pidana Korupsi',
    sector: 'Perizinan SDA & Tambang',
    sub_sector: 'Alokasi Gas Bumi & BUMD Daerah',
    primary_mode: 'Penyalahgunaan Anggaran',
    secondary_modes: ['BUMD', 'Konflik Kepentingan'],
    case_date: '2010-04-12',
    investigation_date: '2021-02-15',
    suspect_date: '2021-09-16',
    indictment_date: '2022-01-20',
    prosecution_date: '2022-05-10',
    trial_start_date: '2022-02-03',
    verdict_date: '2022-06-15',
    final_decision_date: '2023-11-28',
    execution_date: '2024-01-10',
    era_pemerintahan: 'Susilo Bambang Yudhoyono Periode II',
    summary: 'Korupsi alokasi dan penjualan gas bumi bagian negara oleh BUMD PDPDE Sumsel bekerja sama dengan PT DKLN yang merugikan keuangan negara USD 30,19 juta dan menjerat mantan Gubernur Alex Noerdin hingga putusan kasasi inkrah Mahkamah Agung.',
    verification_status: 'VERIFIED_PRIMARY',
    confidence_level: 'high',
    possible_duplicate: false,
    needs_manual_review: false,
    verification_note: 'Berkekuatan hukum tetap (Inkrah) Putusan Kasasi Mahkamah Agung RI No. 5221 K/Pid.Sus/2023.'
  },
  {
    case_id: 'cas-kereta-besitang-langsa-2024',
    case_title: 'Korupsi Pembangunan Jalur Kereta Api Besitang–Kota Langsa Kemenhub',
    normalized_case_title: 'korupsi pembangunan jalur kereta api besitang kota langsa kemenhub',
    case_number: '54/Pid.Sus-TPK/2024/PN.Jkt.Pst',
    case_type: 'Tindak Pidana Korupsi',
    sector: 'Pengadaan Barang/Jasa',
    sub_sector: 'Infrastruktur Jalur Rel Kereta Api',
    primary_mode: 'Pengadaan Barang/Jasa',
    secondary_modes: ['Pemecahan Paket Proyek', 'Penyalahgunaan Anggaran'],
    case_date: '2017-06-15',
    investigation_date: '2023-10-04',
    suspect_date: '2024-01-19',
    indictment_date: '2024-07-15',
    prosecution_date: '2024-10-20',
    trial_start_date: '2024-07-29',
    verdict_date: '2024-11-27',
    final_decision_date: '2024-11-27',
    execution_date: null,
    era_pemerintahan: 'Joko Widodo Periode I',
    summary: 'Korupsi proyek pembangunan jalur kereta api Besitang-Langsa pada Balai Teknik Perkeretaapian Medan Kementerian Perhubungan dengan modus pemecahan paket pekerjaan dan rekayasa tender yang menyebabkan kerugian negara Rp1,15 triliun (total loss).',
    verification_status: 'VERIFIED_PRIMARY',
    confidence_level: 'high',
    possible_duplicate: false,
    needs_manual_review: false,
    verification_note: 'Vonis Pengadilan Tipikor Jakarta Pusat No. 54/Pid.Sus-TPK/2024/PN.Jkt.Pst berdasarkan audit BPKP.'
  }
];

for (const c of newCases) {
  if (!cases.some((item: any) => item.case_id === c.case_id)) {
    cases.push(c);
  }
}
writeJson('cases', cases);

// 4. TAMBAH FINANCIAL RECORDS
const financialRecords = readJson('financial_records');
const newFinancial = [
  {
    financial_id: 'fin-antam-emas-loss-2024',
    case_id: 'cas-antam-emas-109-ton-2024',
    person_id: null,
    financial_type: 'estimated_loss_amount',
    amount: 1200000000000,
    currency: 'IDR',
    financial_year: 2024,
    financial_description: 'Taksiran kerugian negara dan peredaran komoditas emas ilegal 109 ton berlogo Antam',
    fact_classification: 'PROSECUTOR_CLAIM',
    source_id: 'src-kejagung-emas-antam-109ton-2024',
    source_page: 'Siaran Pers',
    verification_status: 'VERIFIED_PRIMARY'
  },
  {
    financial_id: 'fin-apd-covid-loss-2023',
    case_id: 'cas-apd-covid-kemenkes-2023',
    person_id: null,
    financial_type: 'audit_loss_amount',
    amount: 319000000000,
    currency: 'IDR',
    financial_year: 2020,
    financial_description: 'Kerugian keuangan negara pengadaan APD Kemenkes hasil audit investigatif BPKP',
    fact_classification: 'COURT_FINDING',
    source_id: 'src-kpk-apd-covid-kemenkes-2023',
    source_page: 'Siaran Pers KPK',
    verification_status: 'VERIFIED_PRIMARY'
  },
  {
    financial_id: 'fin-pdpde-gas-loss-2021',
    case_id: 'cas-pdpde-gas-sumsel-alex-2021',
    person_id: null,
    financial_type: 'court_recognized_loss_amount',
    amount: 480000000000,
    currency: 'IDR',
    financial_year: 2019,
    financial_description: 'Kerugian negara alokasi penjualan gas bumi PDPDE Sumsel (USD 30,19 juta) berkekuatan hukum tetap',
    fact_classification: 'COURT_FINDING',
    source_id: 'src-ma-pdpde-gas-alex-noerdin-2023',
    source_page: 'hal. 195',
    verification_status: 'VERIFIED_PRIMARY'
  },
  {
    financial_id: 'fin-kereta-besitang-loss-2024',
    case_id: 'cas-kereta-besitang-langsa-2024',
    person_id: null,
    financial_type: 'court_recognized_loss_amount',
    amount: 1157087853322,
    currency: 'IDR',
    financial_year: 2019,
    financial_description: 'Kerugian keuangan negara total loss proyek pembangunan rel kereta Besitang-Langsa audit BPKP',
    fact_classification: 'COURT_FINDING',
    source_id: 'src-pn-jakpus-kereta-besitang-2024',
    source_page: 'hal. 210',
    verification_status: 'VERIFIED_PRIMARY'
  }
];

for (const f of newFinancial) {
  if (!financialRecords.some((item: any) => item.financial_id === f.financial_id)) {
    financialRecords.push(f);
  }
}
writeJson('financial_records', financialRecords);

// 5. TAMBAH CASE LOCATIONS
const caseLocations = readJson('case_locations');
const newCaseLocations = [
  {
    case_location_id: 'cl-antam-jaksel',
    case_id: 'cas-antam-emas-109-ton-2024',
    location_id: 'loc-dki-jaksel',
    location_context: 'Kantor UBPP Logam Mulia PT Antam Tbk dan Butik Emas'
  },
  {
    case_location_id: 'cl-apd-kemenkes-jaksel',
    case_id: 'cas-apd-covid-kemenkes-2023',
    location_id: 'loc-dki-jaksel',
    location_context: 'Gedung Kementerian Kesehatan RI HR Rasuna Said'
  },
  {
    case_location_id: 'cl-pdpde-palembang',
    case_id: 'cas-pdpde-gas-sumsel-alex-2021',
    location_id: 'loc-sumsel-palembang',
    location_context: 'Kantor BUMD PDPDE Sumsel dan Pemprov Sumatera Selatan'
  },
  {
    case_location_id: 'cl-kereta-langsa',
    case_id: 'cas-kereta-besitang-langsa-2024',
    location_id: 'loc-sumut-langsa',
    location_context: 'Jalur Rel Kereta Api Besitang Langkat hingga Kota Langsa'
  }
];

for (const cl of newCaseLocations) {
  if (!caseLocations.some((item: any) => item.case_location_id === cl.case_location_id)) {
    caseLocations.push(cl);
  }
}
writeJson('case_locations', caseLocations);

console.log('🎉 Selesai menambahkan 4 kasus korupsi baru ke dataset normalized!');
