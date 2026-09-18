import { db } from './index.js';
import * as schema from './schema.js';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

export async function seed() {
  console.log('🌱 Memulai proses seeding database Liga Korupsi Indonesia (LKI)...');

  // 1. Clean existing data (in reverse dependency order)
  await db.delete(schema.auditLogs);
  await db.delete(schema.publicReports);
  await db.delete(schema.caseDocuments);
  await db.delete(schema.caseTimelineEvents);
  await db.delete(schema.caseCompanies);
  await db.delete(schema.caseOfficials);
  await db.delete(schema.cases);
  await db.delete(schema.companies);
  await db.delete(schema.officials);
  await db.delete(schema.parties);
  await db.delete(schema.presidentialEras);
  await db.delete(schema.provinces);
  await db.delete(schema.adminUsers);

  console.log('✓ Membersihkan tabel lama selesai.');

  // 2. Admin Users
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

  // 3. Presidential Eras
  const erasData = [
    {
      id: 'era-orba',
      name: 'Era Orde Baru (1966 - 1998)',
      start_date: new Date('1966-03-11'),
      end_date: new Date('1998-05-21'),
      context_summary: 'Sentralisasi kekuasaan dan monopoli tata kelola ekonomi nasional.',
      cabinet_name: 'Kabinet Pembangunan I-VII'
    },
    {
      id: 'era-reformasi',
      name: 'Era Reformasi Awal (1998 - 2004)',
      start_date: new Date('1998-05-21'),
      end_date: new Date('2004-10-20'),
      context_summary: 'Masa transisi pasca krisis moneter 1998 dan pembentukan cikal bakal KPK.',
      cabinet_name: 'Kabinet Reformasi Pembangunan & Gotong Royong'
    },
    {
      id: 'era-sby-1',
      name: 'Era Susilo Bambang Yudhoyono I (2004 - 2009)',
      start_date: new Date('2004-10-20'),
      end_date: new Date('2009-10-20'),
      context_summary: 'Penguatan institusi KPK dan intensifikasi pemberantasan korupsi yudisial.',
      cabinet_name: 'Kabinet Indonesia Bersatu I'
    },
    {
      id: 'era-sby-2',
      name: 'Era Susilo Bambang Yudhoyono II (2009 - 2014)',
      start_date: new Date('2009-10-20'),
      end_date: new Date('2014-10-20'),
      context_summary: 'Maraknya kasus korupsi proyek infrastruktur dan pengadaan barang skala besar.',
      cabinet_name: 'Kabinet Indonesia Bersatu II'
    },
    {
      id: 'era-jokowi-1',
      name: 'Era Joko Widodo I (2014 - 2019)',
      start_date: new Date('2014-10-20'),
      end_date: new Date('2019-10-20'),
      context_summary: 'Fokus percepatan proyek infrastruktur strategis nasional dan digitalisasi.',
      cabinet_name: 'Kabinet Kerja'
    },
    {
      id: 'era-jokowi-2',
      name: 'Era Joko Widodo II (2019 - 2024)',
      start_date: new Date('2019-10-20'),
      end_date: new Date('2024-10-20'),
      context_summary: 'Periode penanganan pandemi COVID-19, bansos, tata kelola komoditas tambang dan revisi UU KPK.',
      cabinet_name: 'Kabinet Indonesia Maju'
    },
    {
      id: 'era-prabowo',
      name: 'Era Prabowo Subianto (2024 - Sekarang)',
      start_date: new Date('2024-10-20'),
      end_date: null,
      context_summary: 'Pemerintahan Kabinet Merah Putih dengan penekanan penertiban kebocoran anggaran negara.',
      cabinet_name: 'Kabinet Merah Putih'
    }
  ];
  await db.insert(schema.presidentialEras).values(erasData);

  // 4. Provinces of Indonesia (38 Provinsi)
  const provincesData = [
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
    provincesData.map(p => ({
      ...p,
      total_loss_amount: 0,
      total_cases: 0,
      created_at: new Date('2025-01-01'),
      updated_at: new Date('2025-01-01')
    }))
  );

  // 5. Political Parties
  const partiesData = [
    { id: 'pdi-p', name: 'PDI Perjuangan', logo_url: '/logos/pdi.png' },
    { id: 'golkar', name: 'Partai Golkar', logo_url: '/logos/golkar.png' },
    { id: 'gerindra', name: 'Partai Gerindra', logo_url: '/logos/gerindra.png' },
    { id: 'nasdem', name: 'Partai NasDem', logo_url: '/logos/nasdem.png' },
    { id: 'demokrat', name: 'Partai Demokrat', logo_url: '/logos/demokrat.png' },
    { id: 'pkb', name: 'Partai Kebangkitan Bangsa (PKB)', logo_url: '/logos/pkb.png' },
    { id: 'pks', name: 'Partai Keadilan Sejahtera (PKS)', logo_url: '/logos/pks.png' },
    { id: 'pan', name: 'Partai Amanat Nasional (PAN)', logo_url: '/logos/pan.png' },
    { id: 'ppp', name: 'Partai Persatuan Pembangunan (PPP)', logo_url: '/logos/ppp.png' },
    { id: 'non-partai', name: 'Non-Partai / Independen / Birokrat', logo_url: '/logos/independent.png' }
  ];

  await db.insert(schema.parties).values(
    partiesData.map(p => ({
      ...p,
      total_loss_amount: 0,
      total_cases: 0
    }))
  );

  // 6. Companies (Rekanan Korporasi)
  const companiesData = [
    {
      id: 'comp-01',
      name: 'PT Timah Sejahtera Semesta (CONTOH/DUMMY)',
      sector: 'Pertambangan Logam & Mineral',
      description: 'Konsorsium swasta pemegang IUP tata niaga komoditas pertambangan wilayah kepulauan.'
    },
    {
      id: 'comp-02',
      name: 'PT Surya Sawit Makmur Indah (CONTOH/DUMMY)',
      sector: 'Perkebunan & Kehutanan',
      description: 'Korporasi agroindustri kelapa sawit dalam konsesi kawasan hutan lindung.'
    },
    {
      id: 'comp-03',
      name: 'PT Menara Telekomunikasi Solusindo (CONTOH/DUMMY)',
      sector: 'Telekomunikasi & IT',
      description: 'Penyedia infrastruktur menara transmisi sinyal wilayah 3T.'
    },
    {
      id: 'comp-04',
      name: 'PT Duta Graha Logistik Nusantara (CONTOH/DUMMY)',
      sector: 'Logistik & Bansos Pangan',
      description: 'Distributor paket bantuan sembako dan logistik darurat.'
    },
    {
      id: 'comp-05',
      name: 'PT Konstruksi Jaya Bahari (CONTOH/DUMMY)',
      sector: 'Infrastruktur Pelabuhan & Jalan',
      description: 'Kontraktor pelaksana proyek dermaga kontainer dan jalan lingkar provinsi.'
    },
    {
      id: 'comp-06',
      name: 'PT Asuransi Jiwa Megatama (CONTOH/DUMMY)',
      sector: 'Keuangan & Investasi Negara',
      description: 'Manajemen investasi portofolio reksa dana saham berisiko tinggi BUMN.'
    }
  ];

  await db.insert(schema.companies).values(companiesData);

  // 7. Officials (12 Pejabat Dummy Realistis dengan penanda jelas)
  const officialsData = [
    {
      id: 'off-01',
      full_name: 'Harvey T. (CONTOH/DUMMY)',
      photo_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300',
      position_title: 'Perwakilan Konsorsium Niaga Komoditas Tambang',
      province_id: 'babel',
      party_id: 'non-partai',
      total_loss_amount: 300003000000000, // 300 T
      current_legal_status: 'divonis_inkrah' as const
    },
    {
      id: 'off-02',
      full_name: 'Surya D. (CONTOH/DUMMY)',
      photo_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300',
      position_title: 'Pemilik Konglomerasi Sawit & Kawasan Hutan',
      province_id: 'riau',
      party_id: 'non-partai',
      total_loss_amount: 78000000000000, // 78 T
      current_legal_status: 'divonis_inkrah' as const
    },
    {
      id: 'off-03',
      full_name: 'Johnny P. (CONTOH/DUMMY)',
      photo_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300',
      position_title: 'Menteri Komunikasi & Informatika RI',
      province_id: 'dki-jakarta',
      party_id: 'nasdem',
      total_loss_amount: 8032000000000, // 8.032 T
      current_legal_status: 'divonis_inkrah' as const
    },
    {
      id: 'off-04',
      full_name: 'Juliari B. (CONTOH/DUMMY)',
      photo_url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300',
      position_title: 'Menteri Sosial RI',
      province_id: 'dki-jakarta',
      party_id: 'pdi-p',
      total_loss_amount: 32400000000, // 32.4 M
      current_legal_status: 'divonis_inkrah' as const
    },
    {
      id: 'off-05',
      full_name: 'Syahrul L. (CONTOH/DUMMY)',
      photo_url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300',
      position_title: 'Menteri Pertanian RI',
      province_id: 'sulsel',
      party_id: 'nasdem',
      total_loss_amount: 44500000000, // 44.5 M
      current_legal_status: 'divonis_inkrah' as const
    },
    {
      id: 'off-06',
      full_name: 'Setya N. (CONTOH/DUMMY)',
      photo_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300',
      position_title: 'Ketua DPR RI',
      province_id: 'ntt',
      party_id: 'golkar',
      total_loss_amount: 2314000000000, // 2.31 T
      current_legal_status: 'divonis_inkrah' as const
    },
    {
      id: 'off-07',
      full_name: 'Benny T. (CONTOH/DUMMY)',
      photo_url: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=300',
      position_title: 'Direktur Utama Pengelola Investasi Jiwasraya',
      province_id: 'dki-jakarta',
      party_id: 'non-partai',
      total_loss_amount: 16800000000000, // 16.8 T
      current_legal_status: 'divonis_inkrah' as const
    },
    {
      id: 'off-08',
      full_name: 'Ratu Atut C. (CONTOH/DUMMY)',
      photo_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300',
      position_title: 'Gubernur Banten',
      province_id: 'banten',
      party_id: 'golkar',
      total_loss_amount: 114000000000, // 114 M
      current_legal_status: 'divonis_inkrah' as const
    },
    {
      id: 'off-09',
      full_name: 'Gatot P. (CONTOH/DUMMY)',
      photo_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300',
      position_title: 'Gubernur Sumatera Utara',
      province_id: 'sumut',
      party_id: 'pks',
      total_loss_amount: 61000000000, // 61 M
      current_legal_status: 'divonis_inkrah' as const
    },
    {
      id: 'off-10',
      full_name: 'Anas U. (CONTOH/DUMMY)',
      photo_url: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=300',
      position_title: 'Ketua Umum Partai & Anggota DPR RI',
      province_id: 'jabar',
      party_id: 'demokrat',
      total_loss_amount: 464000000000, // 464 M
      current_legal_status: 'divonis_inkrah' as const
    },
    {
      id: 'off-11',
      full_name: 'Irvanto H. (CONTOH/DUMMY - SIDANG AKTIF)',
      photo_url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300',
      position_title: 'Kepala Dinas ESDM Provinsi Kalimantan Timur',
      province_id: 'kaltim',
      party_id: 'non-partai',
      total_loss_amount: 125000000000, // 125 M
      current_legal_status: 'terdakwa' as const
    },
    {
      id: 'off-12',
      full_name: 'Bambang S. (CONTOH/DUMMY - PENYIDIKAN)',
      photo_url: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=300',
      position_title: 'Bupati Kabupaten Pesisir Barat',
      province_id: 'lampung',
      party_id: 'gerindra',
      total_loss_amount: 45000000000, // 45 M
      current_legal_status: 'tersangka' as const
    }
  ];

  await db.insert(schema.officials).values(
    officialsData.map(o => ({
      ...o,
      created_at: new Date('2025-01-01'),
      updated_at: new Date('2025-01-01')
    }))
  );

  // 8. Cases (12 Kasus Lengkap Sesuai Master Prompt)
  const casesData = [
    {
      id: 'kasus-01',
      title: 'Skandal Tata Niaga IUP Komoditas Tambang Wilayah Babel [CONTOH/DUMMY]',
      primary_official_id: 'off-01',
      province_id: 'babel',
      era_id: 'era-jokowi-2',
      sector_category: 'perizinan_sda_tambang' as const,
      loss_amount: 300003000000000,
      fine_amount: 1000000000,
      restitution_amount: 4200000000000,
      prison_sentence_months: 240, // 20 tahun
      legal_status: 'divonis_inkrah' as const,
      court_decision_number: 'Putusan MA RI No. 1234 K/Pid.Sus/2024 (CONTOH/DUMMY)',
      chronology: '[CONTOH/DUMMY - BUKAN DATA NYATA] Pemufakatan jahat pengakomodiran penambangan timah ilegal melalui cangkang perusahaan boneka seolah-olah sewa peralatan peleburan logam timah.',
      charges_articles: 'Pasal 2 ayat (1) jo. Pasal 18 UU Tipikor jo. Pasal 55 ayat (1) ke-1 KUHP',
      source_url: 'https://putusan3.mahkamahagung.go.id/direktori/putusan/contoh-dummy-01.html',
      verified_by: 'admin-super-01',
      verified_at: new Date('2025-01-10'),
      case_date: new Date('2024-03-27')
    },
    {
      id: 'kasus-02',
      title: 'Penyerobotan Kawasan Hutan Lindung Indragiri Hulu Riau [CONTOH/DUMMY]',
      primary_official_id: 'off-02',
      province_id: 'riau',
      era_id: 'era-jokowi-2',
      sector_category: 'perizinan_sda_tambang' as const,
      loss_amount: 78000000000000,
      fine_amount: 1000000000,
      restitution_amount: 41995000000000,
      prison_sentence_months: 180, // 15 tahun
      legal_status: 'divonis_inkrah' as const,
      court_decision_number: 'Putusan Kasasi MA RI No. 848 K/Pid.Sus/2023 (CONTOH/DUMMY)',
      chronology: '[CONTOH/DUMMY - BUKAN DATA NYATA] Pembukaan lahan kelapa sawit seluas 37.095 hektare di dalam kawasan hutan lindung tanpa izin pelepasan kawasan hutan.',
      charges_articles: 'Pasal 2 ayat (1) UU No. 31/1999 jo. UU No. 20/2001 tentang Pemberantasan Tindak Pidana Korupsi',
      source_url: 'https://putusan3.mahkamahagung.go.id/direktori/putusan/contoh-dummy-02.html',
      verified_by: 'admin-super-01',
      verified_at: new Date('2025-01-10'),
      case_date: new Date('2022-08-01')
    },
    {
      id: 'kasus-03',
      title: 'Pengadaan Menara Transmisi BTS 4G Wilayah Terluar BAKTI [CONTOH/DUMMY]',
      primary_official_id: 'off-03',
      province_id: 'dki-jakarta',
      era_id: 'era-jokowi-2',
      sector_category: 'pengadaan_barang_jasa' as const,
      loss_amount: 8032000000000,
      fine_amount: 500000000,
      restitution_amount: 15500000000,
      prison_sentence_months: 180, // 15 tahun
      legal_status: 'divonis_inkrah' as const,
      court_decision_number: 'Putusan PN Jakarta Pusat No. 42/Pid.Sus-TPK/2023 (CONTOH/DUMMY)',
      chronology: '[CONTOH/DUMMY - BUKAN DATA NYATA] Permufakatan penggelembungan anggaran proyek menara BTS 4G dan rekayasa tender pengadaan bersama konsorsium rekanan.',
      charges_articles: 'Pasal 2 ayat (1) jo. Pasal 18 UU No. 31/1999 jo. Pasal 55 ayat (1) ke-1 KUHP',
      source_url: 'https://putusan3.mahkamahagung.go.id/direktori/putusan/contoh-dummy-03.html',
      verified_by: 'admin-super-01',
      verified_at: new Date('2025-01-10'),
      case_date: new Date('2023-05-17')
    },
    {
      id: 'kasus-04',
      title: 'Korupsi Fee Bantuan Sosial Paket Sembako COVID-19 Jabodetabek [CONTOH/DUMMY]',
      primary_official_id: 'off-04',
      province_id: 'dki-jakarta',
      era_id: 'era-jokowi-2',
      sector_category: 'bansos_bencana' as const,
      loss_amount: 32400000000,
      fine_amount: 500000000,
      restitution_amount: 14500000000,
      prison_sentence_months: 144, // 12 tahun
      legal_status: 'divonis_inkrah' as const,
      court_decision_number: 'Putusan PN Jakarta Pusat No. 29/Pid.Sus-TPK/2021 (CONTOH/DUMMY)',
      chronology: '[CONTOH/DUMMY - BUKAN DATA NYATA] Pemotongan komitmen fee sebesar Rp 10.000 per paket sembako bantuan penanganan darurat pandemi COVID-19.',
      charges_articles: 'Pasal 12 huruf b jo. Pasal 18 UU No. 31/1999 jo. Pasal 55 ayat (1) ke-1 KUHP',
      source_url: 'https://putusan3.mahkamahagung.go.id/direktori/putusan/contoh-dummy-04.html',
      verified_by: 'admin-super-01',
      verified_at: new Date('2025-01-10'),
      case_date: new Date('2020-12-06')
    },
    {
      id: 'kasus-05',
      title: 'Pemerasan Pejabat Eselon I & Gratifikasi Kementan RI [CONTOH/DUMMY]',
      primary_official_id: 'off-05',
      province_id: 'sulsel',
      era_id: 'era-jokowi-2',
      sector_category: 'suap_gratifikasi' as const,
      loss_amount: 44500000000,
      fine_amount: 500000000,
      restitution_amount: 44500000000,
      prison_sentence_months: 120, // 10 tahun
      legal_status: 'divonis_inkrah' as const,
      court_decision_number: 'Putusan Pengadilan Tipikor Jakarta No. 19/Pid.Sus-TPK/2024 (CONTOH/DUMMY)',
      chronology: '[CONTOH/DUMMY - BUKAN DATA NYATA] Pemungutan iuran paksa berkala dari pejabat eselon I kementerian untuk kepentingan operasional pribadi dan keluarga.',
      charges_articles: 'Pasal 12 huruf e jo. Pasal 18 UU No. 31/1999 jo. UU No. 20/2001',
      source_url: 'https://putusan3.mahkamahagung.go.id/direktori/putusan/contoh-dummy-05.html',
      verified_by: 'admin-super-01',
      verified_at: new Date('2025-01-10'),
      case_date: new Date('2023-10-11')
    },
    {
      id: 'kasus-06',
      title: 'Mega Korupsi Proyek Nasional KTP Elektronik (e-KTP) [CONTOH/DUMMY]',
      primary_official_id: 'off-06',
      province_id: 'ntt',
      era_id: 'era-sby-2',
      sector_category: 'pengadaan_barang_jasa' as const,
      loss_amount: 2314000000000,
      fine_amount: 500000000,
      restitution_amount: 100000000000,
      prison_sentence_months: 180, // 15 tahun
      legal_status: 'divonis_inkrah' as const,
      court_decision_number: 'Putusan Kasasi MA RI No. 2221 K/PID.SUS/2018 (CONTOH/DUMMY)',
      chronology: '[CONTOH/DUMMY - BUKAN DATA NYATA] Pengaturan kuota anggaran dan mark-up harga pengadaan blanko kartu tanda penduduk berbasis chip secara masif.',
      charges_articles: 'Pasal 3 UU No. 31/1999 jo. UU No. 20/2001 jo. Pasal 55 ayat (1) ke-1 KUHP',
      source_url: 'https://putusan3.mahkamahagung.go.id/direktori/putusan/contoh-dummy-06.html',
      verified_by: 'admin-super-01',
      verified_at: new Date('2025-01-10'),
      case_date: new Date('2017-11-17')
    },
    {
      id: 'kasus-07',
      title: 'Gagal Bayar & Penyimpangan Pengelolaan Portofolio Jiwasraya [CONTOH/DUMMY]',
      primary_official_id: 'off-07',
      province_id: 'dki-jakarta',
      era_id: 'era-jokowi-1',
      sector_category: 'mafia_peradilan' as const,
      loss_amount: 16800000000000,
      fine_amount: 1000000000,
      restitution_amount: 6078000000000,
      prison_sentence_months: 0, // seumur hidup
      legal_status: 'divonis_inkrah' as const,
      court_decision_number: 'Putusan Kasasi MA RI No. 2937 K/Pid.Sus/2021 (CONTOH/DUMMY)',
      chronology: '[CONTOH/DUMMY - BUKAN DATA NYATA] Transaksi saham repo fiktif dan manipulasi portofolio investasi reksa dana perusahaan asuransi milik negara.',
      charges_articles: 'Pasal 2 ayat (1) jo. Pasal 18 UU Tipikor jo. UU TPPU',
      source_url: 'https://putusan3.mahkamahagung.go.id/direktori/putusan/contoh-dummy-07.html',
      verified_by: 'admin-super-01',
      verified_at: new Date('2025-01-10'),
      case_date: new Date('2020-01-14')
    },
    {
      id: 'kasus-08',
      title: 'Pengadaan Alat Kesehatan & Suap Pilkada Lebak MK [CONTOH/DUMMY]',
      primary_official_id: 'off-08',
      province_id: 'banten',
      era_id: 'era-sby-2',
      sector_category: 'pengadaan_barang_jasa' as const,
      loss_amount: 114000000000,
      fine_amount: 250000000,
      restitution_amount: 3800000000,
      prison_sentence_months: 84, // 7 tahun
      legal_status: 'divonis_inkrah' as const,
      court_decision_number: 'Putusan Kasasi MA RI No. 285 K/Pid.Sus/2015 (CONTOH/DUMMY)',
      chronology: '[CONTOH/DUMMY - BUKAN DATA NYATA] Pengaturan pemenang lelang proyek alkes RS rujukan Banten dan penyuapan kepada hakim Mahkamah Konstitusi terkait sengketa pilkada.',
      charges_articles: 'Pasal 12 huruf a UU Tipikor dan Pasal 3 UU Tipikor',
      source_url: 'https://putusan3.mahkamahagung.go.id/direktori/putusan/contoh-dummy-08.html',
      verified_by: 'admin-super-01',
      verified_at: new Date('2025-01-10'),
      case_date: new Date('2013-12-17')
    },
    {
      id: 'kasus-09',
      title: 'Suap Interpelasi DPRD Sumut & Pengesahan APBD Provinsi [CONTOH/DUMMY]',
      primary_official_id: 'off-09',
      province_id: 'sumut',
      era_id: 'era-jokowi-1',
      sector_category: 'suap_gratifikasi' as const,
      loss_amount: 61000000000,
      fine_amount: 250000000,
      restitution_amount: 2800000000,
      prison_sentence_months: 72, // 6 tahun
      legal_status: 'divonis_inkrah' as const,
      court_decision_number: 'Putusan PN Medan No. 104/Pid.Sus-TPK/2016 (CONTOH/DUMMY)',
      chronology: '[CONTOH/DUMMY - BUKAN DATA NYATA] Pemberian suap uang ketok palu kepada puluhan anggota legislatif daerah demi persetujuan LPJ dan pembatalan hak interpelasi.',
      charges_articles: 'Pasal 5 ayat (1) huruf a UU No. 31/1999 jo. Pasal 55 ayat (1) ke-1 KUHP',
      source_url: 'https://putusan3.mahkamahagung.go.id/direktori/putusan/contoh-dummy-09.html',
      verified_by: 'admin-super-01',
      verified_at: new Date('2025-01-10'),
      case_date: new Date('2015-08-03')
    },
    {
      id: 'kasus-10',
      title: 'Pembangunan Pusat Olahraga Hambalang & Kongres Partai [CONTOH/DUMMY]',
      primary_official_id: 'off-10',
      province_id: 'jabar',
      era_id: 'era-sby-2',
      sector_category: 'pengadaan_barang_jasa' as const,
      loss_amount: 464000000000,
      fine_amount: 300000000,
      restitution_amount: 57000000000,
      prison_sentence_months: 96, // 8 tahun (PK)
      legal_status: 'divonis_inkrah' as const,
      court_decision_number: 'Putusan PK Mahkamah Agung No. 107 PK/Pid.Sus/2018 (CONTOH/DUMMY)',
      chronology: '[CONTOH/DUMMY - BUKAN DATA NYATA] Penerimaan fasilitas dan gratifikasi proyek pembangunan sarana olahraga terpadu Hambalang Bogor.',
      charges_articles: 'Pasal 12 huruf a UU Tipikor jo. UU No. 20/2001',
      source_url: 'https://putusan3.mahkamahagung.go.id/direktori/putusan/contoh-dummy-10.html',
      verified_by: 'admin-super-01',
      verified_at: new Date('2025-01-10'),
      case_date: new Date('2014-01-10')
    },
    {
      id: 'kasus-11',
      title: 'Penerbitan Izin Usaha Pertambangan Batu Bara Ilegal Kaltim [CONTOH/DUMMY - SIDANG AKTIF]',
      primary_official_id: 'off-11',
      province_id: 'kaltim',
      era_id: 'era-prabowo',
      sector_category: 'perizinan_sda_tambang' as const,
      loss_amount: 125000000000,
      fine_amount: 0,
      restitution_amount: 0,
      prison_sentence_months: 0,
      legal_status: 'terdakwa' as const,
      court_decision_number: 'Perkara Sidang Tipikor No. 77/Pid.Sus-TPK/2025 (CONTOH/DUMMY)',
      chronology: '[CONTOH/DUMMY - BUKAN DATA NYATA] Dugaan manipulasi peta tumpang tindih kawasan konservasi untuk penerbitan izin tambang batu bara korporasi swasta.',
      charges_articles: 'Pasal 2 ayat (1) dan Pasal 3 UU Tipikor jo. Pasal 55 KUHP',
      source_url: 'https://sipp.pn-samarinda.go.id/perkara/contoh-dummy-11.html',
      verified_by: 'admin-editor-02',
      verified_at: new Date('2025-02-01'),
      case_date: new Date('2025-01-15')
    },
    {
      id: 'kasus-12',
      title: 'Dugaan Penyelewengan Dana Alokasi Khusus Infrastruktur Jalan Lampung [CONTOH/DUMMY - PENYIDIKAN]',
      primary_official_id: 'off-12',
      province_id: 'lampung',
      era_id: 'era-prabowo',
      sector_category: 'pengadaan_barang_jasa' as const,
      loss_amount: 45000000000,
      fine_amount: 0,
      restitution_amount: 0,
      prison_sentence_months: 0,
      legal_status: 'tersangka' as const,
      court_decision_number: 'Sprindik No. Print-19/Fd.2/02/2025 (CONTOH/DUMMY)',
      chronology: '[CONTOH/DUMMY - BUKAN DATA NYATA] Dugaan pengaturan pemenang tender proyek perbaikan jalan kabupaten dengan pengurangan spesifikasi tebal aspal.',
      charges_articles: 'Pasal 2 ayat (1) dan/atau Pasal 3 UU No. 31/1999',
      source_url: 'https://kejaksaan.go.id/siaran-pers/contoh-dummy-12.html',
      verified_by: 'admin-editor-02',
      verified_at: new Date('2025-02-10'),
      case_date: new Date('2025-02-05')
    }
  ];

  await db.insert(schema.cases).values(
    casesData.map(c => ({
      ...c,
      created_at: new Date('2025-01-01'),
      updated_at: new Date('2025-01-01')
    }))
  );

  // 9. Case Officials & Case Companies linkings
  await db.insert(schema.caseOfficials).values(
    casesData.map(c => ({
      case_id: c.id,
      official_id: c.primary_official_id,
      role_in_case: 'Terdakwa Utama / Pengambil Keputusan'
    }))
  );

  await db.insert(schema.caseCompanies).values([
    {
      case_id: 'kasus-01',
      company_id: 'comp-01',
      transaction_date: new Date('2020-06-01'),
      transaction_role: 'Konsorsium smelter dan sewa peralatan pengolahan timah ilegal'
    },
    {
      case_id: 'kasus-02',
      company_id: 'comp-02',
      transaction_date: new Date('2018-04-12'),
      transaction_role: 'Penguasaan perkebunan kelapa sawit dalam kawasan hutan tanpa izin'
    },
    {
      case_id: 'kasus-03',
      company_id: 'comp-03',
      transaction_date: new Date('2021-03-20'),
      transaction_role: 'Pemenang paket tender infrastruktur menara pemancar transmisi sinyal'
    },
    {
      case_id: 'kasus-04',
      company_id: 'comp-04',
      transaction_date: new Date('2020-05-15'),
      transaction_role: 'Distributor pengemasan sembako bansos darurat penanganan pandemi'
    },
    {
      case_id: 'kasus-07',
      company_id: 'comp-06',
      transaction_date: new Date('2019-02-10'),
      transaction_role: 'Manajemen investasi portofolio reksa dana saham berisiko tinggi'
    }
  ]);

  // 10. Timeline Events
  await db.insert(schema.caseTimelineEvents).values([
    {
      id: 'event-01-1',
      case_id: 'kasus-01',
      event_date: new Date('2018-01-10'),
      event_description: 'Pertemuan perdana perwakilan korporasi swasta dengan pejabat regulator tata niaga pertambangan.',
      event_type: 'Permufakatan Awal'
    },
    {
      id: 'event-01-2',
      case_id: 'kasus-01',
      event_date: new Date('2024-03-27'),
      event_description: 'Kejaksaan Agung resmi menetapkan status tersangka dan penahanan di Rutan Salemba.',
      event_type: 'Penetapan Tersangka'
    },
    {
      id: 'event-01-3',
      case_id: 'kasus-01',
      event_date: new Date('2024-12-20'),
      event_description: 'Majelis hakim membacakan vonis bersalah dengan hukuman 20 tahun penjara dan uang pengganti triliunan rupiah.',
      event_type: 'Pembacaan Putusan Akhir'
    },
    {
      id: 'event-03-1',
      case_id: 'kasus-03',
      event_date: new Date('2020-11-01'),
      event_description: 'Rapat pimpinan BAKTI untuk percepatan kontrak penyediaan infrastruktur 4G wilayah 3T.',
      event_type: 'Perencanaan Proyek'
    },
    {
      id: 'event-03-2',
      case_id: 'kasus-03',
      event_date: new Date('2023-05-17'),
      event_description: 'Penyidik menetapkan status tersangka setelah pemeriksaan maraton ketiga di Gedung Bundar.',
      event_type: 'Penahanan & Sprindik'
    }
  ]);

  // 11. Case Documents
  await db.insert(schema.caseDocuments).values([
    {
      id: 'doc-01',
      case_id: 'kasus-01',
      document_type: 'Salinan Putusan Pengadilan',
      storage_url: 'https://putusan3.mahkamahagung.go.id/direktori/putusan/contoh-dummy-01.pdf',
      uploaded_at: new Date('2025-01-10')
    },
    {
      id: 'doc-02',
      case_id: 'kasus-02',
      document_type: 'Ikhtisar Dakwaan JPU',
      storage_url: 'https://kejaksaan.go.id/dokumen/dakwaan-contoh-02.pdf',
      uploaded_at: new Date('2025-01-10')
    },
    {
      id: 'doc-03',
      case_id: 'kasus-03',
      document_type: 'Resume Audit BPKP',
      storage_url: 'https://bpkp.go.id/laporan/contoh-audit-03.pdf',
      uploaded_at: new Date('2025-01-10')
    }
  ]);

  // 12. Public Reports (Contoh)
  await db.insert(schema.publicReports).values([
    {
      id: 'rep-01',
      case_id: 'kasus-01',
      report_type: 'rujukan_putusan_baru',
      description: 'Mohon update nomor registrasi putusan tingkat kasasi pada berkas ini karena telah keluar salinan resmi MA.',
      reference_url: 'https://kepaniteraan.mahkamahagung.go.id/perkara/dummy-check-1',
      submitter_contact: 'jurnalis.hukum@contoh-media.id',
      status: 'pending_review',
      created_at: new Date('2025-02-15')
    },
    {
      id: 'rep-02',
      case_id: 'kasus-05',
      report_type: 'koreksi_data',
      description: 'Terdapat kesalahan penulisan nama jabatan lama saat kejadian perkara di kementerian.',
      reference_url: 'https://kementan.go.id/profil-pejabat-lama',
      submitter_contact: 'warga.peduli@gmail.com',
      status: 'approved',
      reviewed_by: 'admin-super-01',
      created_at: new Date('2025-02-10'),
      reviewed_at: new Date('2025-02-12')
    }
  ]);

  // 13. Audit Logs
  await db.insert(schema.auditLogs).values([
    {
      id: 'audit-01',
      admin_user_id: 'admin-super-01',
      entity_type: 'cases',
      entity_id: 'kasus-01',
      action: 'create',
      diff_snapshot: { title: 'Skandal Tata Niaga IUP Komoditas Tambang Wilayah Babel [CONTOH/DUMMY]' },
      created_at: new Date('2025-01-10')
    },
    {
      id: 'audit-02',
      admin_user_id: 'admin-super-01',
      entity_type: 'public_reports',
      entity_id: 'rep-02',
      action: 'approve_report',
      diff_snapshot: { status: 'approved', previous: 'pending_review' },
      created_at: new Date('2025-02-12')
    }
  ]);

  // 14. Synchronize aggregate counters on provinces and parties
  console.log('🔄 Menghitung agregat nilai kerugian dan jumlah kasus per provinsi & partai...');
  
  // Update provinces aggregates
  for (const prov of provincesData) {
    const provCases = casesData.filter(c => c.province_id === prov.id);
    const totalLoss = provCases.reduce((acc, c) => acc + c.loss_amount, 0);
    const totalCount = provCases.length;
    await db
      .update(schema.provinces)
      .set({
        total_loss_amount: totalLoss,
        total_cases: totalCount,
        updated_at: new Date()
      })
      .where(eq(schema.provinces.id, prov.id));
  }

  // Update parties aggregates
  for (const party of partiesData) {
    const partyOfficials = officialsData.filter(o => o.party_id === party.id);
    const partyOfficialIds = partyOfficials.map(o => o.id);
    const partyCases = casesData.filter(c => partyOfficialIds.includes(c.primary_official_id));
    const totalLoss = partyCases.reduce((acc, c) => acc + c.loss_amount, 0);
    const totalCount = partyCases.length;
    await db
      .update(schema.parties)
      .set({
        total_loss_amount: totalLoss,
        total_cases: totalCount
      })
      .where(eq(schema.parties.id, party.id));
  }

  console.log('✅ Seeding database LKI berhasil selesai dengan sempurna!');
  process.exit(0);
}

seed().catch(err => {
  console.error('❌ Terjadi kesalahan saat seeding database:', err);
  process.exit(1);
});
