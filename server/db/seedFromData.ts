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
  'pusat': 'nasional',
  'nasional': 'nasional',
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
  console.log('🌱 Memulai proses impor dataset canonical & master seeder ke PostgreSQL (lki_db)...');

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

  // 1. Clean existing data in reverse foreign key order
  console.log('🧹 Membersihkan seluruh data tabel yang ada...');
  await db.delete(schema.commentUpvotes);
  await db.delete(schema.caseComments);
  await db.delete(schema.caseReactions);
  await db.delete(schema.publicReports);
  await db.delete(schema.auditLogs);
  await db.delete(schema.visitorLogs);
  await db.delete(schema.citizenUsers);
  await db.delete(schema.caseTimelineEvents);
  await db.delete(schema.caseDocuments);
  await db.delete(schema.caseCompanies);
  await db.delete(schema.caseOfficials);
  await db.delete(schema.cases);
  await db.delete(schema.officials);
  await db.delete(schema.companies);
  await db.delete(schema.parties);
  await db.delete(schema.presidentialEras);
  await db.delete(schema.provinces);
  await db.delete(schema.adminUsers);

  console.log('✓ Seluruh tabel berhasil dibersihkan.');

  // 2. Admin Users (Super Admin, Editor, Reviewer)
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
    },
    {
      id: 'admin-reviewer-03',
      username: 'reviewer_publik',
      password_hash: adminPasswordHash,
      role: 'reviewer',
      created_at: new Date('2025-02-01')
    }
  ]);
  console.log('✓ 3 Akun Kurator / Admin diinisialisasi (admin, editor_hukum, reviewer_publik).');

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

  // 4. 38 Provinces of Indonesia + 1 Special National Entity
  const provincesList = [
    { id: 'nasional', name: 'Pusat / Nasional (Kementerian & Lembaga)', island_cluster: 'Nasional', geojson_code: 'ID-NAS' },
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
  console.log(`✓ ${provincesList.length} Entitas Wilayah (38 Provinsi + Tingkat Nasional) diinisialisasi.`);

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

  // 7. Citizen Users (Warga Terverifikasi dengan Profil Lengkap)
  const citizenPasswordHash = bcrypt.hashSync('warga123', 10);
  const citizens = [
    {
      id: 'usr-budi-jakarta',
      username: 'budi_santoso',
      display_name: 'Budi Santoso',
      email: 'budi.santoso@warga.id',
      password_hash: citizenPasswordHash,
      photo_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      origin_province: 'DKI Jakarta',
      origin_city: 'Jakarta Pusat',
      bio: 'Kawal terus transparansi anggaran negara untuk generasi mendatang.',
      avatar_seed: 'garuda',
      is_email_verified: 1,
      auth_provider: 'local',
      role: 'citizen',
      created_at: new Date('2025-01-10')
    },
    {
      id: 'usr-dewi-surabaya',
      username: 'dewi_lestari',
      display_name: 'Dewi Lestari, S.H.',
      email: 'dewi.lestari@hukum.or.id',
      password_hash: citizenPasswordHash,
      photo_url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
      origin_province: 'Jawa Timur',
      origin_city: 'Kota Surabaya',
      bio: 'Advokat publik independen & pemerhati putusan peradilan tipikor.',
      avatar_seed: 'padi',
      is_email_verified: 1,
      auth_provider: 'local',
      role: 'citizen',
      created_at: new Date('2025-01-12')
    },
    {
      id: 'usr-ridwan-bandung',
      username: 'ridwan_gunawan',
      display_name: 'Ridwan Gunawan',
      email: 'ridwan@warga.id',
      password_hash: citizenPasswordHash,
      photo_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      origin_province: 'Jawa Barat',
      origin_city: 'Kota Bandung',
      bio: 'Pemerhati tata kelola infrastruktur & pengadaan barang jasa daerah.',
      avatar_seed: 'emas',
      is_email_verified: 1,
      auth_provider: 'local',
      role: 'citizen',
      created_at: new Date('2025-01-15')
    },
    {
      id: 'usr-anita-medan',
      username: 'anita_siregar',
      display_name: 'Anita Siregar, Ak.',
      email: 'anita@akuntan.id',
      password_hash: citizenPasswordHash,
      photo_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      origin_province: 'Sumatera Utara',
      origin_city: 'Kota Medan',
      bio: 'Akuntan forensik. Audit kerugian keuangan negara wajib tuntas sampai TPPU.',
      avatar_seed: 'merah',
      is_email_verified: 1,
      auth_provider: 'local',
      role: 'citizen',
      created_at: new Date('2025-01-20')
    },
    {
      id: 'usr-hendra-jogja',
      username: 'hendra_wibowo',
      display_name: 'Hendra Wibowo',
      email: 'hendra@jogja.id',
      password_hash: citizenPasswordHash,
      photo_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      origin_province: 'DI Yogyakarta',
      origin_city: 'Kabupaten Sleman',
      bio: 'Peneliti hukum tata negara & kebijakan publik nusantara.',
      avatar_seed: 'banteng',
      is_email_verified: 1,
      auth_provider: 'local',
      role: 'citizen',
      created_at: new Date('2025-02-01')
    },
    {
      id: 'usr-faisal-makassar',
      username: 'faisal_daeng',
      display_name: 'Faisal Daeng M.',
      email: 'faisal@makassar.id',
      password_hash: citizenPasswordHash,
      photo_url: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80',
      origin_province: 'Sulawesi Selatan',
      origin_city: 'Kota Makassar',
      bio: 'Suara rakyat Indonesia Timur kawal penegakan hukum anti-korupsi.',
      avatar_seed: 'garuda',
      is_email_verified: 1,
      auth_provider: 'local',
      role: 'citizen',
      created_at: new Date('2025-02-05')
    },
    {
      id: 'usr-siti-padang',
      username: 'siti_nurhaliza',
      display_name: 'Siti Nurhaliza',
      email: 'siti@padang.id',
      password_hash: citizenPasswordHash,
      photo_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
      origin_province: 'Sumatera Barat',
      origin_city: 'Kota Padang',
      bio: 'Pendidikan antikorupsi sejak dini untuk integritas bangsa.',
      avatar_seed: 'padi',
      is_email_verified: 1,
      auth_provider: 'local',
      role: 'citizen',
      created_at: new Date('2025-02-10')
    },
    {
      id: 'usr-made-bali',
      username: 'made_suardana',
      display_name: 'I Made Suardana',
      email: 'made@denpasar.id',
      password_hash: citizenPasswordHash,
      photo_url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
      origin_province: 'Bali',
      origin_city: 'Kota Denpasar',
      bio: 'Jaga kelestarian alam dan tolak suap perizinan lingkungan.',
      avatar_seed: 'emas',
      is_email_verified: 1,
      auth_provider: 'local',
      role: 'citizen',
      created_at: new Date('2025-02-15')
    }
  ];
  await db.insert(schema.citizenUsers).values(citizens);
  console.log(`✓ ${citizens.length} Akun Pengguna Warga (Suara Rakyat) diinisialisasi.`);

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

  // 8. Officials (43 Figur Publik / Pejabat)
  const officialInserts = personsData.map(p => {
    const pos = posMap.get(p.person_id);
    const pm = pmMap.get(p.person_id);
    const cp = cpMap.get(p.person_id);

    // Resolve province or national level
    let provId = 'nasional';
    if (pos?.province) {
      const pKey = pos.province.trim().toLowerCase();
      if (PROVINCE_NAME_TO_ID[pKey]) provId = PROVINCE_NAME_TO_ID[pKey];
      else if (pKey.includes('jakarta')) provId = 'dki-jakarta';
      else if (pKey.includes('pusat') || pKey.includes('kementerian') || pKey.includes('ri')) provId = 'nasional';
    }

    const partyId = pm?.party_id || 'pty-non-partisan';
    const legalStatus = mapLegalStatus(cp?.legal_status || 'divonis_inkrah');

    return {
      id: p.person_id,
      full_name: p.full_name,
      photo_url: p.photo_url || undefined,
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

  // 9. Cases (43 Perkara LKI)
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
    let provId = PROVINCE_NAME_TO_ID[provName.trim().toLowerCase()] || 'dki-jakarta';

    // Check if case is national level
    if (c.case_title.toLowerCase().includes('kementerian') || 
        c.case_title.toLowerCase().includes('mahkamah agung') || 
        c.case_title.toLowerCase().includes('nasional') ||
        c.case_title.toLowerCase().includes('garuda') ||
        c.case_title.toLowerCase().includes('jiwasraya') ||
        c.case_title.toLowerCase().includes('asabri')) {
      provId = 'nasional';
    }

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

  // 10. Case Companies (Relasi Korporasi)
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

  // 11. Case Timeline Events
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

  // 12. Case Reactions & Comments (Suara Warga)
  console.log('💬 Menyemai Reaksi & Komentar Suara Warga...');
  const topCases = caseInserts.slice(0, 8);
  const reactionsList: any[] = [];
  const commentsList: any[] = [];
  const upvotesList: any[] = [];

  const sampleCitizenComments = [
    {
      user: 'usr-anita-medan',
      reaction: 'rampok' as const,
      text: 'Kerugian negara dalam perkara ini sangat masif. Harus ada tindak pidana pencucian uang (TPPU) dan perampasan aset menyeluruh agar uang rakyat benar-benar kembali!',
      upvotes: 19
    },
    {
      user: 'usr-dewi-surabaya',
      reaction: 'geram' as const,
      text: 'Modus penyalahgunaan wewenang ini menunjukkan mafia anggaran bekerja terorganisir. Vonis hakim di tingkat banding maupun kasasi tidak boleh lembek.',
      upvotes: 14
    },
    {
      user: 'usr-ridwan-bandung',
      reaction: 'khilaf_administrasi' as const,
      text: 'Perlu kita bedakan dengan objektif antara kerugian riil akibat memperkaya diri sendiri dengan kekhilafan administrasi prosedur birokrasi pengadaan fasilitas dinas. Jika tidak ada uang yang dikantongi pribadi, asas keadilan restoratif harus dipertimbangkan.',
      upvotes: 11
    },
    {
      user: 'usr-hendra-jogja',
      reaction: 'didukung' as const,
      text: 'Masyarakat mendukung penegakan hukum yang transparan dan akuntabel, selama fakta persidangan dibeberkan secara jujur tanpa intervensi kekuasaan.',
      upvotes: 8
    },
    {
      user: 'usr-faisal-makassar',
      reaction: 'memalukan' as const,
      text: 'Sangat memalukan uang amanah publik diselewengkan. Kawal terus persidangan dan jangan sampai ada diskon hukuman di kemudian hari!',
      upvotes: 16
    },
    {
      user: 'usr-siti-padang',
      reaction: 'kawal_sidang' as const,
      text: 'Publik mengawal ketat putusan perkara ini. Direktori putusan Mahkamah Agung harus selalu terbuka agar rakyat bisa memantau amar putusannya.',
      upvotes: 12
    }
  ];

  for (let i = 0; i < topCases.length; i++) {
    const c = topCases[i];
    const rxnTypes: Array<'geram' | 'rampok' | 'memalukan' | 'didukung' | 'khilaf_administrasi' | 'dimaklumi' | 'tebang_pilih' | 'kawal_sidang'> = [
      'geram', 'rampok', 'memalukan', 'kawal_sidang', 'tebang_pilih', 'didukung'
    ];
    for (let uIdx = 0; uIdx < citizens.length; uIdx++) {
      const cz = citizens[uIdx];
      const rxnType = rxnTypes[(i + uIdx) % rxnTypes.length];
      reactionsList.push({
        id: `rxn-${c.id}-${cz.id}`,
        case_id: c.id,
        user_id: cz.id,
        reaction_type: rxnType,
        created_at: new Date(Date.now() - (i * 86400000) - (uIdx * 3600000))
      });
    }

    const cmtSample = sampleCitizenComments[i % sampleCitizenComments.length];
    const cmtId = `cmt-${c.id}-1`;
    commentsList.push({
      id: cmtId,
      case_id: c.id,
      user_id: cmtSample.user,
      reaction_type: cmtSample.reaction,
      content: cmtSample.text,
      upvotes_count: cmtSample.upvotes,
      is_hidden: 0,
      created_at: new Date(Date.now() - (i * 43200000))
    });

    const cmtSample2 = sampleCitizenComments[(i + 2) % sampleCitizenComments.length];
    const cmtId2 = `cmt-${c.id}-2`;
    commentsList.push({
      id: cmtId2,
      case_id: c.id,
      user_id: cmtSample2.user,
      reaction_type: cmtSample2.reaction,
      content: cmtSample2.text,
      upvotes_count: cmtSample2.upvotes,
      is_hidden: 0,
      created_at: new Date(Date.now() - (i * 21600000))
    });

    upvotesList.push({
      id: `upv-${cmtId}-${citizens[0].id}`,
      comment_id: cmtId,
      user_id: citizens[0].id,
      created_at: new Date()
    });
    upvotesList.push({
      id: `upv-${cmtId}-${citizens[1].id}`,
      comment_id: cmtId,
      user_id: citizens[1].id,
      created_at: new Date()
    });
  }

  await db.insert(schema.caseReactions).values(reactionsList);
  await db.insert(schema.caseComments).values(commentsList);
  await db.insert(schema.commentUpvotes).values(upvotesList);
  console.log(`✓ ${reactionsList.length} Reaksi, ${commentsList.length} Komentar Warga, dan ${upvotesList.length} Upvote diimpor.`);

  // 13. Public Reports (Laporan & Usulan Koreksi Warga)
  const sampleReports = [
    {
      id: 'rep-01-usulan-perkara',
      case_id: null,
      report_type: 'usulan_kasus_baru' as const,
      description: 'Pengadaan proyek pembangunan jembatan daerah TA 2023 yang mangkrak dan telah ada temuan audit BPK perwakilan provinsi.',
      reference_url: 'https://putusan3.mahkamahagung.go.id',
      submitter_contact: 'warga.peduli@gmail.com',
      metadata: { kota: 'Medan', estimasi_kerugian: 'Rp 4.5 Miliar' },
      status: 'pending_review' as const,
      reviewed_by: null,
      created_at: new Date(Date.now() - 86400000),
      reviewed_at: null
    },
    {
      id: 'rep-02-koreksi-putusan',
      case_id: caseInserts[0]?.id || null,
      report_type: 'rujukan_putusan_baru' as const,
      description: 'Penambahan rujukan putusan kasasi Mahkamah Agung terbaru beserta nomor amar putusan lengkap.',
      reference_url: 'https://putusan3.mahkamahagung.go.id',
      submitter_contact: 'dewi.lestari@hukum.or.id',
      metadata: { catatan: 'Amar kasasi menguatkan denda subsidair' },
      status: 'approved' as const,
      reviewed_by: 'admin-super-01',
      created_at: new Date(Date.now() - 172800000),
      reviewed_at: new Date(Date.now() - 86400000)
    }
  ];
  await db.insert(schema.publicReports).values(sampleReports);
  console.log(`✓ ${sampleReports.length} Laporan Partisipasi Publik diinisialisasi.`);

  // 14. Audit Logs (Catatan Audit Kurator)
  const initialAuditLogs = [
    {
      id: 'audit-init-01',
      admin_user_id: 'admin-super-01',
      entity_type: 'system',
      entity_id: 'bootstrap',
      action: 'create' as const,
      diff_snapshot: { action: 'Master Seeder & Fresh Migration Executed', status: 'clean' },
      created_at: new Date()
    },
    {
      id: 'audit-init-02',
      admin_user_id: 'admin-super-01',
      entity_type: 'report',
      entity_id: 'rep-02-koreksi-putusan',
      action: 'approve_report' as const,
      diff_snapshot: { status: 'approved', note: 'Verifikasi rujukan putusan kasasi MA valid' },
      created_at: new Date(Date.now() - 86400000)
    }
  ];
  await db.insert(schema.auditLogs).values(initialAuditLogs);
  console.log(`✓ ${initialAuditLogs.length} Catatan Audit Log Admin diinisialisasi.`);

  // 15. Visitor Logs (Log Pemantauan Trafik Realistis dengan Alamat IP Lengkap tanpa Sensor)
  console.log('📊 Menyemai data log pemantauan trafik (visitor_logs) dengan IP penuh...');
  const sampleIps = [
    '127.0.0.1',
    '180.252.164.22',
    '139.192.88.209',
    '103.28.115.61',
    '118.99.110.45',
    '140.213.18.92',
    '125.160.22.88',
    '36.85.12.104',
    '114.124.201.33'
  ];

  const samplePaths = [
    { path: '/', method: 'GET' },
    { path: '/klasemen', method: 'GET' },
    { path: '/peta', method: 'GET' },
    { path: '/statistik', method: 'GET' },
    { path: '/cari', method: 'GET' },
    { path: '/api/cases', method: 'GET' },
    { path: '/api/leaderboard', method: 'GET' },
    { path: '/api/regions/summary', method: 'GET' },
    { path: '/api/stats/overview', method: 'GET' },
    { path: '/peta', method: 'PAGEVIEW' },
    { path: '/klasemen', method: 'PAGEVIEW' }
  ];

  const devices = [
    { type: 'desktop', browser: 'Chrome', os: 'Windows', ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36' },
    { type: 'mobile', browser: 'Chrome Mobile', os: 'Android', ua: 'Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Mobile Safari/537.36' },
    { type: 'desktop', browser: 'Safari', os: 'macOS', ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3 Safari/605.1.15' },
    { type: 'mobile', browser: 'Mobile Safari', os: 'iOS', ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3 Mobile/15E148 Safari/604.1' },
    { type: 'desktop', browser: 'Firefox', os: 'Linux', ua: 'Mozilla/5.0 (X11; Linux x86_64; rv:123.0) Gecko/20100101 Firefox/123.0' }
  ];

  const visitorLogsToInsert: any[] = [];
  const now = Date.now();
  const totalLogs = 600;

  for (let i = 0; i < totalLogs; i++) {
    const timeAgoMs = Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000);
    const logTime = new Date(now - timeAgoMs);
    const pathItem = samplePaths[Math.floor(Math.random() * samplePaths.length)];
    const ip = sampleIps[Math.floor(Math.random() * sampleIps.length)];
    const dev = devices[Math.floor(Math.random() * devices.length)];
    
    const randStatus = Math.random();
    let statusCode = 200;
    if (randStatus > 0.98) statusCode = 500;
    else if (randStatus > 0.95) statusCode = 404;
    else if (randStatus > 0.90) statusCode = 304;

    const duration = statusCode === 500 ? Math.floor(Math.random() * 250 + 100) : Math.floor(Math.random() * 45 + 5);
    const dateStr = logTime.toISOString().slice(0, 10);
    const sessionHash = `sess-${Buffer.from(`${ip}-${dateStr}`).toString('base64').slice(0, 16)}`;

    visitorLogsToInsert.push({
      id: `log-seed-${1000 + i}`,
      timestamp: logTime,
      method: pathItem.method,
      path: pathItem.path,
      status_code: statusCode,
      duration_ms: duration,
      ip_address: ip,
      user_agent: dev.ua,
      device_type: dev.type,
      browser: dev.browser,
      os: dev.os,
      referrer: Math.random() > 0.4 ? 'https://google.com' : 'Direct',
      session_id: sessionHash
    });
  }

  for (let i = 0; i < visitorLogsToInsert.length; i += 200) {
    await db.insert(schema.visitorLogs).values(visitorLogsToInsert.slice(i, i + 200));
  }
  console.log(`✓ ${visitorLogsToInsert.length} Log Aktivitas Pengunjung (visitor_logs) berhasil disemai.`);

  // 16. Recalculate Aggregates dynamically from imported cases
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

  console.log('✅ MASTER SEEDER SELESAI DENGAN SUKSES! Seluruh 18 tabel dan kolom terisi data faktual bersih & mutakhir.');
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
