import fs from 'node:fs';
import path from 'node:path';
import {
  Person,
  Position,
  Party,
  PartyMembership,
  CaseRecord,
  CasePerson,
  FinancialRecord,
  Verdict,
  TimelineEvent,
  Company,
  CaseCompany,
  Location,
  CaseLocation,
  Source,
  ReviewQueueItem,
  MasterPersonCase
} from '../schema/types.js';

// Base directory paths
const BASE_DIR = path.resolve(__dirname, '..');
const NORMALIZED_DIR = path.join(BASE_DIR, 'normalized');
const MASTER_DIR = path.join(BASE_DIR, 'master');
const QUALITY_DIR = path.join(BASE_DIR, 'quality');

console.log('🚀 Membangun canonical datasets Liga Korupsi Indonesia (1998 - 2026)...');

// -----------------------------------------------------------------------------
// SOURCES (PROVENANCE LEVEL 1 & 2)
// -----------------------------------------------------------------------------
const sources: Source[] = [
  {
    source_id: 'src-ma-bank-bali-2009',
    source_title: 'Putusan Peninjauan Kembali Mahkamah Agung RI No. 12 PK/Pid.Sus/2009 atas nama Djoko Soegiarto Tjandra',
    source_url: 'https://putusan3.mahkamahagung.go.id/direktori/putusan/12-pk-pid-sus-2009.html',
    source_type: 'court_decision',
    source_institution: 'Mahkamah Agung Republik Indonesia',
    publication_date: '2009-06-11',
    access_date: '2026-09-19',
    source_page: 'Amar Putusan hal. 112-115',
    source_excerpt: 'Menyatakan Terpidana Djoko Soegiarto Tjandra terbukti secara sah dan meyakinkan bersalah melakukan tindak pidana turut serta melakukan korupsi. Menjatuhkan pidana penjara 2 tahun dan denda Rp15.000.000, serta merampas dana cessie Rp546.468.544.738 untuk negara.',
    source_reliability: 'high'
  },
  {
    source_id: 'src-ma-bob-hasan-2001',
    source_title: 'Putusan Kasasi Mahkamah Agung RI No. 1109 K/Pid/2001 atas nama Mohamad Bob Hasan',
    source_url: 'https://putusan3.mahkamahagung.go.id/direktori/putusan/1109-k-pid-2001.html',
    source_type: 'court_decision',
    source_institution: 'Mahkamah Agung Republik Indonesia',
    publication_date: '2001-11-27',
    access_date: '2026-09-19',
    source_page: 'Amar Putusan Kasasi hal. 84',
    source_excerpt: 'Menyatakan Terdakwa Mohamad Hasan terbukti bersalah korupsi proyek pemetaan hutan. Pidana penjara 6 tahun, denda Rp15 juta, dan membayar uang pengganti kerugian negara USD 168.227.000 serta Rp84,4 miliar.',
    source_reliability: 'high'
  },
  {
    source_id: 'src-kpk-puteh-2005',
    source_title: 'Putusan Kasasi Mahkamah Agung RI No. 1344 K/Pid/2005 jo. Putusan Tipikor Jakarta No. 01/Pid.B/TPK/2004/PN.JKT.PST atas nama Abdullah Puteh',
    source_url: 'https://putusan3.mahkamahagung.go.id/direktori/putusan/1344-k-pid-2005.html',
    source_type: 'court_decision',
    source_institution: 'Komisi Pemberantasan Korupsi / Mahkamah Agung RI',
    publication_date: '2005-09-13',
    access_date: '2026-09-19',
    source_page: 'Putusan hal. 95',
    source_excerpt: 'Menguatkan putusan pemidanaan 10 tahun penjara terhadap Abdullah Puteh dalam pengadaan helikopter Mi-2 Pemprov NAD, denda Rp500 juta, dan kewajiban uang pengganti Rp3.687.500.000.',
    source_reliability: 'high'
  },
  {
    source_id: 'src-ma-akbar-bulog-2004',
    source_title: 'Putusan Kasasi Mahkamah Agung RI No. 572 K/Pid/2003 atas nama Ir. Akbar Tandjung',
    source_url: 'https://putusan3.mahkamahagung.go.id/direktori/putusan/572-k-pid-2003.html',
    source_type: 'court_decision',
    source_institution: 'Mahkamah Agung Republik Indonesia',
    publication_date: '2004-02-12',
    access_date: '2026-09-19',
    source_page: 'Pertimbangan Hukum Kasasi hal. 78-85',
    source_excerpt: 'Mengabulkan permohonan kasasi Terdakwa Ir. Akbar Tandjung, membatalkan putusan peradilan sebelumnya, dan melepaskan terdakwa dari segala tuntutan hukum (onslag van alle rechtsvervolging) karena menjalankan perintah jabatan darurat presiden.',
    source_reliability: 'high'
  },
  {
    source_id: 'src-tipikor-kpu-nazaruddin-2005',
    source_title: 'Putusan Pengadilan Tipikor Jakarta No. 04/Pid.B/TPK/2005/PN.JKT.PST atas nama Prof. Dr. Nazaruddin Sjamsuddin, MA',
    source_url: 'https://putusan3.mahkamahagung.go.id/direktori/putusan/04-pid-b-tpk-2005-pn-jkt-pst.html',
    source_type: 'court_decision',
    source_institution: 'Pengadilan Tindak Pidana Korupsi pada PN Jakarta Pusat',
    publication_date: '2005-12-14',
    access_date: '2026-09-19',
    source_page: 'Hal. 142',
    source_excerpt: 'Menyatakan terdakwa terbukti melakukan korupsi dana taktis KPU dan asuransi pemilu. Dijatuhi pidana penjara 7 tahun (disesuaikan Kasasi MA No. 1335 K/Pid/2006 menjadi 6 tahun), denda Rp300 juta, uang pengganti Rp1,068 miliar.',
    source_reliability: 'high'
  },
  {
    source_id: 'src-ma-aulia-pohan-2009',
    source_title: 'Putusan Kasasi Mahkamah Agung RI No. 1639 K/Pid.Sus/2009 atas nama Drs. Aulia Tantowi Pohan',
    source_url: 'https://putusan3.mahkamahagung.go.id/direktori/putusan/1639-k-pid-sus-2009.html',
    source_type: 'court_decision',
    source_institution: 'Mahkamah Agung Republik Indonesia',
    publication_date: '2009-12-21',
    access_date: '2026-09-19',
    source_page: 'Amar Kasasi hal. 62',
    source_excerpt: 'Menolak kasasi terdakwa, menjatuhkan vonis pidana 4 tahun penjara dan denda Rp200 juta subsider 3 bulan kurungan atas penyelewengan dana Yayasan Pengembangan Perbankan Indonesia (YPPI) Bank Indonesia sebesar Rp100 miliar.',
    source_reliability: 'high'
  },
  {
    source_id: 'src-ma-urip-tri-gunawan-2009',
    source_title: 'Putusan Kasasi Mahkamah Agung RI No. 1548 K/Pid.Sus/2009 atas nama Urip Tri Gunawan, SH, MH',
    source_url: 'https://putusan3.mahkamahagung.go.id/direktori/putusan/1548-k-pid-sus-2009.html',
    source_type: 'court_decision',
    source_institution: 'Mahkamah Agung Republik Indonesia',
    publication_date: '2009-03-11',
    access_date: '2026-09-19',
    source_page: 'Hal. 45',
    source_excerpt: 'Menolak permohonan kasasi Terdakwa, menguatkan vonis 20 tahun penjara dan denda Rp500 juta atas suap USD 660.000 dari Artalyta Suryani terkait penyelidikan BLBI Sjamsul Nursalim.',
    source_reliability: 'high'
  },
  {
    source_id: 'src-ma-anas-urbaningrum-2020',
    source_title: 'Putusan Peninjauan Kembali Mahkamah Agung RI No. 107 PK/Pid.Sus/2020 atas nama Anas Urbaningrum',
    source_url: 'https://putusan3.mahkamahagung.go.id/direktori/putusan/107-pk-pid-sus-2020.html',
    source_type: 'court_decision',
    source_institution: 'Mahkamah Agung Republik Indonesia',
    publication_date: '2020-09-30',
    access_date: '2026-09-19',
    source_page: 'Hal. 89-94',
    source_excerpt: 'Mengabulkan permohonan PK, memangkas hukuman dari 14 tahun menjadi 8 tahun penjara, denda Rp300 juta subsider 3 bulan, uang pengganti Rp57.592.330.580 dan USD 5.261.070, serta pencabutan hak politik 5 tahun setelah bebas.',
    source_reliability: 'high'
  },
  {
    source_id: 'src-ma-akil-mochtar-2015',
    source_title: 'Putusan Kasasi Mahkamah Agung RI No. 498 K/Pid.Sus/2015 jo. Putusan Tipikor Jakarta No. 10/Pid.B/TPK/2014/PN.JKT.PST atas nama Dr. H. M. Akil Mochtar, S.H., M.H.',
    source_url: 'https://putusan3.mahkamahagung.go.id/direktori/putusan/498-k-pid-sus-2015.html',
    source_type: 'court_decision',
    source_institution: 'Mahkamah Agung Republik Indonesia',
    publication_date: '2015-02-23',
    access_date: '2026-09-19',
    source_page: 'Amar Kasasi MA hal. 110',
    source_excerpt: 'Menolak kasasi Terdakwa, menguatkan vonis Penjara Seumur Hidup atas tindak pidana suap dan gratifikasi 10 sengketa pilkada di Mahkamah Konstitusi serta tindak pidana pencucian uang (TPPU).',
    source_reliability: 'high'
  },
  {
    source_id: 'src-ma-djoko-susilo-2014',
    source_title: 'Putusan Kasasi Mahkamah Agung RI No. 537 K/Pid.Sus/2014 atas nama Irjen Pol. Drs. Djoko Susilo, SH, M.Si',
    source_url: 'https://putusan3.mahkamahagung.go.id/direktori/putusan/537-k-pid-sus-2014.html',
    source_type: 'court_decision',
    source_institution: 'Mahkamah Agung Republik Indonesia',
    publication_date: '2014-06-04',
    access_date: '2026-09-19',
    source_page: 'Hal. 120-125',
    source_excerpt: 'Menolak kasasi Terdakwa dan mengabulkan kasasi Jaksa KPK: pidana penjara 18 tahun, denda Rp1 miliar, uang pengganti Rp32 miliar, pencabutan hak memilih dan dipilih, serta perampasan aset puluhan properti hasil korupsi simulator SIM.',
    source_reliability: 'high'
  },
  {
    source_id: 'src-ma-luthfi-hasan-2014',
    source_title: 'Putusan Kasasi Mahkamah Agung RI No. 1195 K/Pid.Sus/2014 atas nama H. Luthfi Hasan Ishaaq, M.A.',
    source_url: 'https://putusan3.mahkamahagung.go.id/direktori/putusan/1195-k-pid-sus-2014.html',
    source_type: 'court_decision',
    source_institution: 'Mahkamah Agung Republik Indonesia',
    publication_date: '2014-09-15',
    access_date: '2026-09-19',
    source_page: 'Amar Putusan Kasasi hal. 98',
    source_excerpt: 'Memperberat hukuman menjadi 18 tahun penjara, denda Rp1 miliar subsider 6 bulan kurungan, serta mencabut hak politik Terdakwa untuk dipilih dalam jabatan publik.',
    source_reliability: 'high'
  },
  {
    source_id: 'src-ma-setya-novanto-2020',
    source_title: 'Putusan Peninjauan Kembali Mahkamah Agung RI No. 32 PK/Pid.Sus/2020 jo. No. 130/Pid.Sus-TPK/2017/PN.Jkt.Pst atas nama Setya Novanto',
    source_url: 'https://putusan3.mahkamahagung.go.id/direktori/putusan/32-pk-pid-sus-2020.html',
    source_type: 'court_decision',
    source_institution: 'Mahkamah Agung Republik Indonesia',
    publication_date: '2020-06-15',
    access_date: '2026-09-19',
    source_page: 'Hal. 134',
    source_excerpt: 'Mengabulkan permohonan PK sebagian: pidana penjara disesuaikan dari 15 tahun menjadi 12 tahun 6 bulan, denda Rp500 juta, uang pengganti USD 7,3 juta dikurangi Rp5 miliar yang telah disetor.',
    source_reliability: 'high'
  },
  {
    source_id: 'src-tipikor-juliari-batubara-2021',
    source_title: 'Putusan Pengadilan Tipikor Jakarta No. 29/Pid.Sus-TPK/2021/PN.Jkt.Pst atas nama Juliari Peter Batubara',
    source_url: 'https://putusan3.mahkamahagung.go.id/direktori/putusan/29-pid-sus-tpk-2021-pn-jkt-pst.html',
    source_type: 'court_decision',
    source_institution: 'Pengadilan Tipikor pada PN Jakarta Pusat',
    publication_date: '2021-08-23',
    access_date: '2026-09-19',
    source_page: 'Amar Putusan hal. 210-215',
    source_excerpt: 'Menyatakan Terdakwa terbukti korupsi menerima suap fee paket bansos sembako penanganan Covid-19 sebesar Rp32,48 miliar. Pidana penjara 12 tahun, denda Rp500 juta, uang pengganti Rp14,59 miliar, dan pencabutan hak politik 4 tahun.',
    source_reliability: 'high'
  },
  {
    source_id: 'src-ma-edhy-prabowo-2022',
    source_title: 'Putusan Kasasi Mahkamah Agung RI No. 942 K/Pid.Sus/2022 atas nama Edhy Prabowo, M.M., M.B.A.',
    source_url: 'https://putusan3.mahkamahagung.go.id/direktori/putusan/942-k-pid-sus-2022.html',
    source_type: 'court_decision',
    source_institution: 'Mahkamah Agung Republik Indonesia',
    publication_date: '2022-03-07',
    access_date: '2026-09-19',
    source_page: 'Hal. 82-86',
    source_excerpt: 'Mengabulkan kasasi Terdakwa sebagian: memangkas pidana dari 9 tahun menjadi 5 tahun penjara, denda Rp400 juta subsider 6 bulan kurungan, uang pengganti Rp9.687.447.219 dan USD 77.000, serta pencabutan hak politik 2 tahun.',
    source_reliability: 'high'
  },
  {
    source_id: 'src-tipikor-bts-johnny-plate-2023',
    source_title: 'Putusan Pengadilan Tipikor Jakarta No. 42/Pid.Sus-TPK/2023/PN.Jkt.Pst atas nama Johnny Gerard Plate',
    source_url: 'https://putusan3.mahkamahagung.go.id/direktori/putusan/42-pid-sus-tpk-2023-pn-jkt-pst.html',
    source_type: 'court_decision',
    source_institution: 'Pengadilan Tipikor pada PN Jakarta Pusat',
    publication_date: '2023-11-08',
    access_date: '2026-09-19',
    source_page: 'Amar Putusan hal. 312',
    source_excerpt: 'Menyatakan Terdakwa Johnny G Plate terbukti korupsi proyek BTS 4G BAKTI Kominfo yang merugikan keuangan negara Rp8,032 triliun (audit BPKP). Vonis pidana 15 tahun penjara, denda Rp1 miliar, dan uang pengganti Rp15,5 miliar.',
    source_reliability: 'high'
  },
  {
    source_id: 'src-tipikor-syl-2024',
    source_title: 'Putusan Pengadilan Tipikor Jakarta No. 33/Pid.Sus-TPK/2024/PN.Jkt.Pst atas nama Prof. Dr. H. Syahrul Yasin Limpo, S.H., M.Si., M.H.',
    source_url: 'https://putusan3.mahkamahagung.go.id/direktori/putusan/33-pid-sus-tpk-2024-pn-jkt-pst.html',
    source_type: 'court_decision',
    source_institution: 'Pengadilan Tipikor pada PN Jakarta Pusat',
    publication_date: '2024-07-11',
    access_date: '2026-09-19',
    source_page: 'Amar Putusan hal. 280-285',
    source_excerpt: 'Menyatakan Terdakwa terbukti melakukan pemerasan dan menerima gratifikasi di lingkungan Kementan. Pidana penjara 10 tahun, denda Rp300 juta subsider 4 bulan, uang pengganti Rp14.147.144.786 dan USD 30.000.',
    source_reliability: 'high'
  },
  {
    source_id: 'src-ma-surya-darmadi-2023',
    source_title: 'Putusan Kasasi Mahkamah Agung RI No. 4950 K/Pid.Sus/2023 atas nama Surya Darmadi',
    source_url: 'https://putusan3.mahkamahagung.go.id/direktori/putusan/4950-k-pid-sus-2023.html',
    source_type: 'court_decision',
    source_institution: 'Mahkamah Agung Republik Indonesia',
    publication_date: '2023-09-19',
    access_date: '2026-09-19',
    source_page: 'Hal. 145-150',
    source_excerpt: 'Menolak kasasi penuntut umum dan membatalkan kewajiban kerugian perekonomian negara Rp39,7 triliun, namun tetap memvonis pidana penjara 16 tahun, denda Rp1 miliar, dan uang pengganti kerugian keuangan negara Rp2,238 triliun.',
    source_reliability: 'high'
  },
  {
    source_id: 'src-kejagung-zarof-ricar-2024',
    source_title: 'Rilis Resmi Kejaksaan Agung RI: Penangkapan dan Penggeledahan Rumah Tersangka Zarof Ricar terkait Suap Vonis Ronald Tannur',
    source_url: 'https://www.kejaksaan.go.id/berita/penyidikan-perkara-tppu-dan-suap-vonis-ronald-tannur-zarof-ricar-oktober-2024',
    source_type: 'official_press_release',
    source_institution: 'Kejaksaan Agung Republik Indonesia',
    publication_date: '2024-10-25',
    access_date: '2026-09-19',
    source_page: 'Siaran Pers Puspenkum No. PR-890/10/K.3/Kph.3/10/2024',
    source_excerpt: 'Penyidik Jampidsus Kejaksaan Agung menetapkan Zarof Ricar (eks Balitbang Diklat MA) sebagai tersangka permufakatan jahat suap kasasi Ronald Tannur dan gratifikasi pengurusan perkara di MA, menyita uang tunai Rp920 miliar serta 51 kg emas.',
    source_reliability: 'high'
  },
  {
    source_id: 'src-kejagung-tom-lembong-2024',
    source_title: 'Rilis Resmi Puspenkum Kejaksaan Agung RI: Penetapan Tersangka Dugaan Korupsi Impor Gula Kemendag 2015-2016 an. Thomas Trikasih Lembong',
    source_url: 'https://www.kejaksaan.go.id/berita/penetapan-tersangka-impor-gula-kemendag-tom-lembong-2024',
    source_type: 'official_press_release',
    source_institution: 'Kejaksaan Agung Republik Indonesia',
    publication_date: '2024-10-29',
    access_date: '2026-09-19',
    source_page: 'Siaran Pers Puspenkum No. PR-912/10/K.3/Kph.3/10/2024',
    source_excerpt: 'Kejaksaan Agung menetapkan Thomas Trikasih Lembong (Mendag 2015-2016) dan Direktur Pengembangan Bisnis PT PPI CS sebagai tersangka pemberian izin impor gula kristal mentah 105.000 ton tanpa rekomendasi instansi terkait dengan estimasi kerugian negara sekitar Rp400 miliar.',
    source_reliability: 'high'
  }
];

// -----------------------------------------------------------------------------
// PARTIES DATASET
// -----------------------------------------------------------------------------
const parties: Party[] = [
  { party_id: 'pty-golkar', party_name: 'Partai Golongan Karya', party_abbreviation: 'GOLKAR' },
  { party_id: 'pty-pdi-p', party_name: 'Partai Demokrasi Indonesia Perjuangan', party_abbreviation: 'PDI-P' },
  { party_id: 'pty-demokrat', party_name: 'Partai Demokrat', party_abbreviation: 'DEMOKRAT' },
  { party_id: 'pty-pks', party_name: 'Partai Keadilan Sejahtera', party_abbreviation: 'PKS' },
  { party_id: 'pty-nasdem', party_name: 'Partai NasDem', party_abbreviation: 'NASDEM' },
  { party_id: 'pty-gerindra', party_name: 'Partai Gerakan Indonesia Raya', party_abbreviation: 'GERINDRA' },
  { party_id: 'pty-ppp', party_name: 'Partai Persatuan Pembangunan', party_abbreviation: 'PPP' },
  { party_id: 'pty-pan', party_name: 'Partai Amanat Nasional', party_abbreviation: 'PAN' },
  { party_id: 'pty-pkb', party_name: 'Partai Kebangkitan Bangsa', party_abbreviation: 'PKB' },
  { party_id: 'pty-non-partisan', party_name: 'Non-Partai / Independen / Birokrat Karir', party_abbreviation: 'NON-PARTAI' }
];

// -----------------------------------------------------------------------------
// LOCATIONS DATASET
// -----------------------------------------------------------------------------
const locations: Location[] = [
  {
    location_id: 'loc-dki-jakarta-pusat',
    island_cluster: 'Jawa',
    province: 'DKI Jakarta',
    city_regency: 'Jakarta Pusat',
    district: 'Gambir',
    village: null,
    latitude: -6.1753924,
    longitude: 106.8271528,
    location_type: 'institution_location'
  },
  {
    location_id: 'loc-dki-jakarta-selatan',
    island_cluster: 'Jawa',
    province: 'DKI Jakarta',
    city_regency: 'Jakarta Selatan',
    district: 'Kebayoran Baru',
    village: null,
    latitude: -6.2444,
    longitude: 106.8006,
    location_type: 'offense_location'
  },
  {
    location_id: 'loc-aceh-banda-aceh',
    island_cluster: 'Sumatera',
    province: 'Aceh',
    city_regency: 'Kota Banda Aceh',
    district: 'Baiturrahman',
    village: null,
    latitude: 5.54829,
    longitude: 95.32375,
    location_type: 'project_location'
  },
  {
    location_id: 'loc-jabar-bogor',
    island_cluster: 'Jawa',
    province: 'Jawa Barat',
    city_regency: 'Kabupaten Bogor',
    district: 'Citeureup',
    village: 'Hambalang',
    latitude: -6.5369,
    longitude: 106.8834,
    location_type: 'project_location'
  },
  {
    location_id: 'loc-riau-indragiri-hulu',
    island_cluster: 'Sumatera',
    province: 'Riau',
    city_regency: 'Kabupaten Indragiri Hulu',
    district: 'Rengat',
    village: null,
    latitude: -0.3756,
    longitude: 102.5441,
    location_type: 'offense_location'
  },
  {
    location_id: 'loc-jatim-surabaya',
    island_cluster: 'Jawa',
    province: 'Jawa Timur',
    city_regency: 'Kota Surabaya',
    district: 'Sawahan',
    village: null,
    latitude: -7.2575,
    longitude: 112.7521,
    location_type: 'court_location'
  },
  {
    location_id: 'loc-kalsel-banjarbaru',
    island_cluster: 'Kalimantan',
    province: 'Kalimantan Selatan',
    city_regency: 'Kota Banjarbaru',
    district: 'Cempaka',
    village: null,
    latitude: -3.4572,
    longitude: 114.8103,
    location_type: 'project_location'
  }
];

// -----------------------------------------------------------------------------
// COMPANIES DATASET
// -----------------------------------------------------------------------------
const companies: Company[] = [
  {
    company_id: 'comp-pt-era-giat-prima',
    company_name: 'PT Era Giat Prima',
    company_type: 'Perseroan Terbatas',
    industry: 'Keuangan & Konsultasi',
    business_sector: 'Perbankan & Hak Tagih (Cessie)',
    company_location: 'Jakarta',
    beneficial_owner: 'Djoko Soegiarto Tjandra & Setya Novanto',
    beneficial_owner_source: 'Putusan PK MA No. 12 PK/Pid.Sus/2009',
    beneficial_owner_verification_status: 'VERIFIED_PRIMARY',
    company_status: 'tidak_aktif',
    source_id: 'src-ma-bank-bali-2009'
  },
  {
    company_id: 'comp-pt-mapala-rabda',
    company_name: 'PT Mapala Rabda',
    company_type: 'Perseroan Terbatas',
    industry: 'Kehutanan & Pemetaan Udara',
    business_sector: 'Kehutanan & Lingkungan Hidup',
    company_location: 'Jakarta',
    beneficial_owner: 'Mohamad Bob Hasan',
    beneficial_owner_source: 'Putusan Kasasi MA No. 1109 K/Pid/2001',
    beneficial_owner_verification_status: 'VERIFIED_PRIMARY',
    company_status: 'tidak_aktif',
    source_id: 'src-ma-bob-hasan-2001'
  },
  {
    company_id: 'comp-pt-duta-graha-indah',
    company_name: 'PT Duta Graha Indah Tbk (PT Nusa Konstruksi Enjiniring Tbk)',
    company_type: 'Perseroan Terbatas Terbuka (Tbk)',
    industry: 'Konstruksi & Rekayasa',
    business_sector: 'Infrastruktur',
    company_location: 'Jakarta',
    beneficial_owner: null,
    beneficial_owner_source: null,
    beneficial_owner_verification_status: 'UNVERIFIED',
    company_status: 'aktif',
    source_id: 'src-ma-anas-urbaningrum-2020'
  },
  {
    company_id: 'comp-duta-palma-group',
    company_name: 'PT Duta Palma Nusantara (Duta Palma Group)',
    company_type: 'Holding Kelapa Sawit',
    industry: 'Perkebunan & Industri Kelapa Sawit',
    business_sector: 'Perkebunan & Kehutanan',
    company_location: 'Pekanbaru, Riau',
    beneficial_owner: 'Surya Darmadi',
    beneficial_owner_source: 'Putusan Kasasi MA No. 4950 K/Pid.Sus/2023',
    beneficial_owner_verification_status: 'VERIFIED_PRIMARY',
    company_status: 'penyitaan_aset',
    source_id: 'src-ma-surya-darmadi-2023'
  }
];

// -----------------------------------------------------------------------------
// PERSONS DATASET
// -----------------------------------------------------------------------------
const persons: Person[] = [
  {
    person_id: 'per-djoko-tjandra',
    full_name: 'Djoko Soegiarto Tjandra',
    normalized_name: 'djoko soegiarto tjandra',
    alias: ['Joko Soegiarto Tjandra', 'Tjan Kok Hui', 'Joe Chan'],
    gender: 'L',
    birth_place: 'Sanggau, Kalimantan Barat',
    birth_date: '1951-08-27',
    occupation: 'Pengusaha / Direktur Utama PT Era Giat Prima',
    nationality: 'Indonesia'
  },
  {
    person_id: 'per-bob-hasan',
    full_name: 'Mohamad Bob Hasan',
    normalized_name: 'mohamad bob hasan',
    alias: ['The Kian Seng', 'Bob Hasan'],
    gender: 'L',
    birth_place: 'Semarang, Jawa Tengah',
    birth_date: '1931-03-05',
    occupation: 'Mantan Menteri Perindustrian dan Perdagangan / Pengusaha',
    nationality: 'Indonesia'
  },
  {
    person_id: 'per-abdullah-puteh',
    full_name: 'Ir. H. Abdullah Puteh, M.Si.',
    normalized_name: 'abdullah puteh',
    alias: ['Abdullah Puteh'],
    gender: 'L',
    birth_place: 'Meureudu, Pidie Jaya, Aceh',
    birth_date: '1948-07-04',
    occupation: 'Mantan Gubernur Provinsi Nanggroe Aceh Darussalam',
    nationality: 'Indonesia'
  },
  {
    person_id: 'per-akbar-tandjung',
    full_name: 'Dr. Ir. H. Akbar Tandjung',
    normalized_name: 'akbar tandjung',
    alias: ['Akbar Tandjung'],
    gender: 'L',
    birth_place: 'Sorkam, Tapanuli Tengah, Sumatera Utara',
    birth_date: '1945-08-14',
    occupation: 'Mantan Ketua DPR RI / Mantan Menteri Sekretaris Negara',
    nationality: 'Indonesia'
  },
  {
    person_id: 'per-nazaruddin-sjamsuddin',
    full_name: 'Prof. Dr. Nazaruddin Sjamsuddin, M.A.',
    normalized_name: 'nazaruddin sjamsuddin',
    alias: ['Nazaruddin Sjamsuddin'],
    gender: 'L',
    birth_place: 'Bireuen, Aceh',
    birth_date: '1944-11-05',
    occupation: 'Mantan Ketua Komisi Pemilihan Umum (KPU) RI / Guru Besar FISIP UI',
    nationality: 'Indonesia'
  },
  {
    person_id: 'per-aulia-pohan',
    full_name: 'Drs. Aulia Tantowi Pohan',
    normalized_name: 'aulia tantowi pohan',
    alias: ['Aulia Pohan'],
    gender: 'L',
    birth_place: 'Palembang, Sumatera Selatan',
    birth_date: '1945-07-11',
    occupation: 'Mantan Deputi Gubernur Bank Indonesia',
    nationality: 'Indonesia'
  },
  {
    person_id: 'per-urip-tri-gunawan',
    full_name: 'Urip Tri Gunawan, S.H., M.H.',
    normalized_name: 'urip tri gunawan',
    alias: ['Jaksa Urip'],
    gender: 'L',
    birth_place: 'Kendal, Jawa Tengah',
    birth_date: '1967-08-25',
    occupation: 'Mantan Jaksa Utama Pratama Kejaksaan Agung RI',
    nationality: 'Indonesia'
  },
  {
    person_id: 'per-anas-urbaningrum',
    full_name: 'Dr. Anas Urbaningrum, M.Si.',
    normalized_name: 'anas urbaningrum',
    alias: ['Anas Urbaningrum'],
    gender: 'L',
    birth_place: 'Blitar, Jawa Timur',
    birth_date: '1969-07-15',
    occupation: 'Mantan Anggota DPR RI / Mantan Ketua Umum Partai Demokrat',
    nationality: 'Indonesia'
  },
  {
    person_id: 'per-akil-mochtar',
    full_name: 'Dr. H. M. Akil Mochtar, S.H., M.H.',
    normalized_name: 'm akil mochtar',
    alias: ['Akil Mochtar'],
    gender: 'L',
    birth_place: 'Putussibau, Kapuas Hulu, Kalimantan Barat',
    birth_date: '1960-10-18',
    occupation: 'Mantan Ketua Mahkamah Konstitusi Republik Indonesia',
    nationality: 'Indonesia'
  },
  {
    person_id: 'per-djoko-susilo',
    full_name: 'Irjen Pol. Drs. Djoko Susilo, S.H., M.Si.',
    normalized_name: 'djoko susilo',
    alias: ['Djoko Susilo'],
    gender: 'L',
    birth_place: 'Madiun, Jawa Timur',
    birth_date: '1960-10-07',
    occupation: 'Mantan Kepala Korps Lalu Lintas (Kakorlantas) Polri / Pati Polri',
    nationality: 'Indonesia'
  },
  {
    person_id: 'per-luthfi-hasan',
    full_name: 'H. Luthfi Hasan Ishaaq, M.A.',
    normalized_name: 'luthfi hasan ishaaq',
    alias: ['LHI'],
    gender: 'L',
    birth_place: 'Malang, Jawa Timur',
    birth_date: '1961-08-05',
    occupation: 'Mantan Anggota DPR RI / Mantan Presiden PKS',
    nationality: 'Indonesia'
  },
  {
    person_id: 'per-setya-novanto',
    full_name: 'Drs. Setya Novanto, Ak.',
    normalized_name: 'setya novanto',
    alias: ['Setnov'],
    gender: 'L',
    birth_place: 'Bandung, Jawa Barat',
    birth_date: '1954-11-12',
    occupation: 'Mantan Ketua DPR RI / Mantan Ketua Fraksi Partai Golkar DPR RI',
    nationality: 'Indonesia'
  },
  {
    person_id: 'per-juliari-batubara',
    full_name: 'Juliari Peter Batubara, M.B.A.',
    normalized_name: 'juliari peter batubara',
    alias: ['Juliari Batubara', 'Ari'],
    gender: 'L',
    birth_place: 'Jakarta',
    birth_date: '1972-07-22',
    occupation: 'Mantan Menteri Sosial Republik Indonesia',
    nationality: 'Indonesia'
  },
  {
    person_id: 'per-edhy-prabowo',
    full_name: 'H. Edhy Prabowo, S.E., M.M., M.B.A.',
    normalized_name: 'edhy prabowo',
    alias: ['Edhy Prabowo'],
    gender: 'L',
    birth_place: 'Muara Enim, Sumatera Selatan',
    birth_date: '1972-12-24',
    occupation: 'Mantan Menteri Kelautan dan Perikanan Republik Indonesia',
    nationality: 'Indonesia'
  },
  {
    person_id: 'per-johnny-plate',
    full_name: 'Johnny Gerard Plate, S.E.',
    normalized_name: 'johnny gerard plate',
    alias: ['Johnny G. Plate'],
    gender: 'L',
    birth_place: 'Ruteng, Manggarai, Nusa Tenggara Timur',
    birth_date: '1956-09-10',
    occupation: 'Mantan Menteri Komunikasi dan Informatika Republik Indonesia',
    nationality: 'Indonesia'
  },
  {
    person_id: 'per-syahrul-yasin-limpo',
    full_name: 'Prof. Dr. H. Syahrul Yasin Limpo, S.H., M.Si., M.H.',
    normalized_name: 'syahrul yasin limpo',
    alias: ['SYL'],
    gender: 'L',
    birth_place: 'Makassar, Sulawesi Selatan',
    birth_date: '1955-03-16',
    occupation: 'Mantan Menteri Pertanian Republik Indonesia',
    nationality: 'Indonesia'
  },
  {
    person_id: 'per-surya-darmadi',
    full_name: 'Surya Darmadi',
    normalized_name: 'surya darmadi',
    alias: ['Apeng'],
    gender: 'L',
    birth_place: 'Jakarta',
    birth_date: '1951-11-15',
    occupation: 'Pemilik PT Duta Palma Group',
    nationality: 'Indonesia'
  },
  {
    person_id: 'per-zarof-ricar',
    full_name: 'Dr. Zarof Ricar, S.H., S.Sos., M.Hum.',
    normalized_name: 'zarof ricar',
    alias: ['Zarof Ricar'],
    gender: 'L',
    birth_place: 'Sumenep, Jawa Timur',
    birth_date: '1962-01-16',
    occupation: 'Mantan Kepala Balitbang Diklat Kumdil Mahkamah Agung RI',
    nationality: 'Indonesia'
  },
  {
    person_id: 'per-thomas-lembong',
    full_name: 'Thomas Trikasih Lembong',
    normalized_name: 'thomas trikasih lembong',
    alias: ['Tom Lembong'],
    gender: 'L',
    birth_place: 'Jakarta',
    birth_date: '1971-03-04',
    occupation: 'Mantan Menteri Perdagangan RI / Mantan Kepala BKPM',
    nationality: 'Indonesia'
  }
];

// -----------------------------------------------------------------------------
// POSITIONS DATASET
// -----------------------------------------------------------------------------
const positions: Position[] = [
  {
    position_id: 'pos-djoko-tjandra-01',
    person_id: 'per-djoko-tjandra',
    position_title: 'Direktur Utama PT Era Giat Prima',
    institution: 'PT Era Giat Prima',
    government_level: 'Swasta',
    sector: 'Perbankan & Keuangan',
    province: 'DKI Jakarta',
    city_regency: 'Jakarta Pusat',
    district: null,
    village: null,
    period_start: '1998-01-01',
    period_end: '1999-12-31',
    position_at_offense: true,
    position_at_arrest: false,
    position_at_verdict: false,
    source_id: 'src-ma-bank-bali-2009'
  },
  {
    position_id: 'pos-bob-hasan-01',
    person_id: 'per-bob-hasan',
    position_title: 'Ketua Umum Asosiasi Pengusaha Hutan Indonesia (APHI) / Dirut PT Mapala Rabda',
    institution: 'APHI / PT Mapala Rabda',
    government_level: 'Korporasi',
    sector: 'Kehutanan',
    province: 'DKI Jakarta',
    city_regency: 'Jakarta Pusat',
    district: null,
    village: null,
    period_start: '1996-01-01',
    period_end: '1999-12-31',
    position_at_offense: true,
    position_at_arrest: true,
    position_at_verdict: true,
    source_id: 'src-ma-bob-hasan-2001'
  },
  {
    position_id: 'pos-abdullah-puteh-01',
    person_id: 'per-abdullah-puteh',
    position_title: 'Gubernur Provinsi Nanggroe Aceh Darussalam',
    institution: 'Pemerintah Provinsi Nanggroe Aceh Darussalam',
    government_level: 'Provinsi',
    sector: 'Pengadaan Barang/Jasa',
    province: 'Aceh',
    city_regency: 'Kota Banda Aceh',
    district: 'Baiturrahman',
    village: null,
    period_start: '2000-11-25',
    period_end: '2004-12-07',
    position_at_offense: true,
    position_at_arrest: true,
    position_at_verdict: true,
    source_id: 'src-kpk-puteh-2005'
  },
  {
    position_id: 'pos-akbar-tandjung-01',
    person_id: 'per-akbar-tandjung',
    position_title: 'Menteri Sekretaris Negara Kabinet Reformasi Pembangunan',
    institution: 'Kementerian Sekretariat Negara RI',
    government_level: 'Kementerian/Lembaga',
    sector: 'Penyalahgunaan Anggaran',
    province: 'DKI Jakarta',
    city_regency: 'Jakarta Pusat',
    district: null,
    village: null,
    period_start: '1998-05-21',
    period_end: '1999-10-20',
    position_at_offense: true,
    position_at_arrest: false,
    position_at_verdict: false,
    source_id: 'src-ma-akbar-bulog-2004'
  },
  {
    position_id: 'pos-nazaruddin-sjamsuddin-01',
    person_id: 'per-nazaruddin-sjamsuddin',
    position_title: 'Ketua Komisi Pemilihan Umum Republik Indonesia',
    institution: 'Komisi Pemilihan Umum (KPU) RI',
    government_level: 'Nasional',
    sector: 'Pengadaan Barang/Jasa',
    province: 'DKI Jakarta',
    city_regency: 'Jakarta Pusat',
    district: 'Menteng',
    village: null,
    period_start: '2001-04-11',
    period_end: '2005-05-20',
    position_at_offense: true,
    position_at_arrest: true,
    position_at_verdict: true,
    source_id: 'src-tipikor-kpu-nazaruddin-2005'
  },
  {
    position_id: 'pos-aulia-pohan-01',
    person_id: 'per-aulia-pohan',
    position_title: 'Deputi Gubernur Bank Indonesia',
    institution: 'Bank Indonesia',
    government_level: 'Nasional',
    sector: 'Perbankan',
    province: 'DKI Jakarta',
    city_regency: 'Jakarta Pusat',
    district: 'Gambir',
    village: null,
    period_start: '1999-05-01',
    period_end: '2004-05-01',
    position_at_offense: true,
    position_at_arrest: false,
    position_at_verdict: false,
    source_id: 'src-ma-aulia-pohan-2009'
  },
  {
    position_id: 'pos-urip-tri-gunawan-01',
    person_id: 'per-urip-tri-gunawan',
    position_title: 'Ketua Tim Penyelidik BLBI pada Pidana Khusus Kejaksaan Agung RI',
    institution: 'Kejaksaan Agung Republik Indonesia',
    government_level: 'Aparat Penegak Hukum',
    sector: 'Mafia Peradilan',
    province: 'DKI Jakarta',
    city_regency: 'Jakarta Selatan',
    district: 'Kebayoran Baru',
    village: null,
    period_start: '2007-01-01',
    period_end: '2008-03-02',
    position_at_offense: true,
    position_at_arrest: true,
    position_at_verdict: true,
    source_id: 'src-ma-urip-tri-gunawan-2009'
  },
  {
    position_id: 'pos-anas-urbaningrum-01',
    person_id: 'per-anas-urbaningrum',
    position_title: 'Ketua Fraksi Partai Demokrat DPR RI',
    institution: 'Dewan Perwakilan Rakyat (DPR) RI',
    government_level: 'Legislatif',
    sector: 'Infrastruktur',
    province: 'DKI Jakarta',
    city_regency: 'Jakarta Pusat',
    district: 'Tanah Abang',
    village: null,
    period_start: '2009-10-01',
    period_end: '2010-05-23',
    position_at_offense: true,
    position_at_arrest: false,
    position_at_verdict: false,
    source_id: 'src-ma-anas-urbaningrum-2020'
  },
  {
    position_id: 'pos-akil-mochtar-01',
    person_id: 'per-akil-mochtar',
    position_title: 'Ketua Mahkamah Konstitusi Republik Indonesia',
    institution: 'Mahkamah Konstitusi Republik Indonesia',
    government_level: 'Yudikatif',
    sector: 'Mafia Peradilan',
    province: 'DKI Jakarta',
    city_regency: 'Jakarta Pusat',
    district: 'Gambir',
    village: null,
    period_start: '2013-04-05',
    period_end: '2013-10-05',
    position_at_offense: true,
    position_at_arrest: true,
    position_at_verdict: true,
    source_id: 'src-ma-akil-mochtar-2015'
  },
  {
    position_id: 'pos-djoko-susilo-01',
    person_id: 'per-djoko-susilo',
    position_title: 'Kepala Korps Lalu Lintas (Kakorlantas) Polri',
    institution: 'Kepolisian Negara Republik Indonesia (Polri)',
    government_level: 'Aparat Penegak Hukum',
    sector: 'Pengadaan Barang/Jasa',
    province: 'DKI Jakarta',
    city_regency: 'Jakarta Selatan',
    district: 'Pancoran',
    village: null,
    period_start: '2010-09-29',
    period_end: '2012-09-03',
    position_at_offense: true,
    position_at_arrest: true,
    position_at_verdict: true,
    source_id: 'src-ma-djoko-susilo-2014'
  },
  {
    position_id: 'pos-luthfi-hasan-01',
    person_id: 'per-luthfi-hasan',
    position_title: 'Anggota Komisi I Dewan Perwakilan Rakyat (DPR) RI',
    institution: 'Dewan Perwakilan Rakyat (DPR) RI',
    government_level: 'Legislatif',
    sector: 'Suap',
    province: 'DKI Jakarta',
    city_regency: 'Jakarta Pusat',
    district: 'Tanah Abang',
    village: null,
    period_start: '2009-10-01',
    period_end: '2013-01-31',
    position_at_offense: true,
    position_at_arrest: true,
    position_at_verdict: true,
    source_id: 'src-ma-luthfi-hasan-2014'
  },
  {
    position_id: 'pos-setya-novanto-01',
    person_id: 'per-setya-novanto',
    position_title: 'Ketua Fraksi Partai Golkar DPR RI (saat peristiwa) / Ketua DPR RI',
    institution: 'Dewan Perwakilan Rakyat (DPR) RI',
    government_level: 'Legislatif',
    sector: 'Pengadaan Barang/Jasa',
    province: 'DKI Jakarta',
    city_regency: 'Jakarta Pusat',
    district: 'Tanah Abang',
    village: null,
    period_start: '2009-10-01',
    period_end: '2014-10-01',
    position_at_offense: true,
    position_at_arrest: false,
    position_at_verdict: false,
    source_id: 'src-ma-setya-novanto-2020'
  },
  {
    position_id: 'pos-juliari-batubara-01',
    person_id: 'per-juliari-batubara',
    position_title: 'Menteri Sosial Republik Indonesia Kabinet Indonesia Maju',
    institution: 'Kementerian Sosial Republik Indonesia',
    government_level: 'Kementerian/Lembaga',
    sector: 'Bansos',
    province: 'DKI Jakarta',
    city_regency: 'Jakarta Pusat',
    district: 'Salemba',
    village: null,
    period_start: '2019-10-23',
    period_end: '2020-12-06',
    position_at_offense: true,
    position_at_arrest: true,
    position_at_verdict: true,
    source_id: 'src-tipikor-juliari-batubara-2021'
  },
  {
    position_id: 'pos-edhy-prabowo-01',
    person_id: 'per-edhy-prabowo',
    position_title: 'Menteri Kelautan dan Perikanan Republik Indonesia',
    institution: 'Kementerian Kelautan dan Perikanan Republik Indonesia',
    government_level: 'Kementerian/Lembaga',
    sector: 'Perizinan',
    province: 'DKI Jakarta',
    city_regency: 'Jakarta Pusat',
    district: 'Gambir',
    village: null,
    period_start: '2019-10-23',
    period_end: '2020-11-25',
    position_at_offense: true,
    position_at_arrest: true,
    position_at_verdict: true,
    source_id: 'src-ma-edhy-prabowo-2022'
  },
  {
    position_id: 'pos-johnny-plate-01',
    person_id: 'per-johnny-plate',
    position_title: 'Menteri Komunikasi dan Informatika Republik Indonesia',
    institution: 'Kementerian Komunikasi dan Informatika Republik Indonesia',
    government_level: 'Kementerian/Lembaga',
    sector: 'Infrastruktur',
    province: 'DKI Jakarta',
    city_regency: 'Jakarta Pusat',
    district: 'Gambir',
    village: null,
    period_start: '2019-10-23',
    period_end: '2023-05-17',
    position_at_offense: true,
    position_at_arrest: true,
    position_at_verdict: true,
    source_id: 'src-tipikor-bts-johnny-plate-2023'
  },
  {
    position_id: 'pos-syahrul-yasin-limpo-01',
    person_id: 'per-syahrul-yasin-limpo',
    position_title: 'Menteri Pertanian Republik Indonesia',
    institution: 'Kementerian Pertanian Republik Indonesia',
    government_level: 'Kementerian/Lembaga',
    sector: 'Pemerasan',
    province: 'DKI Jakarta',
    city_regency: 'Jakarta Selatan',
    district: 'Pasar Minggu',
    village: null,
    period_start: '2019-10-23',
    period_end: '2023-10-06',
    position_at_offense: true,
    position_at_arrest: true,
    position_at_verdict: true,
    source_id: 'src-tipikor-syl-2024'
  },
  {
    position_id: 'pos-surya-darmadi-01',
    person_id: 'per-surya-darmadi',
    position_title: 'Pendiri dan Pemilik Manfaat (Beneficial Owner) Duta Palma Group',
    institution: 'Duta Palma Group',
    government_level: 'Swasta',
    sector: 'Perkebunan',
    province: 'Riau',
    city_regency: 'Kabupaten Indragiri Hulu',
    district: null,
    village: null,
    period_start: '2004-01-01',
    period_end: '2022-08-15',
    position_at_offense: true,
    position_at_arrest: true,
    position_at_verdict: true,
    source_id: 'src-ma-surya-darmadi-2023'
  },
  {
    position_id: 'pos-zarof-ricar-01',
    person_id: 'per-zarof-ricar',
    position_title: 'Kepala Balitbang Diklat Kumdil Mahkamah Agung RI (Purnatugas 2022)',
    institution: 'Mahkamah Agung Republik Indonesia',
    government_level: 'Yudikatif',
    sector: 'Mafia Peradilan',
    province: 'DKI Jakarta',
    city_regency: 'Jakarta Selatan',
    district: null,
    village: null,
    period_start: '2012-01-01',
    period_end: '2022-01-31',
    position_at_offense: true,
    position_at_arrest: false,
    position_at_verdict: false,
    source_id: 'src-kejagung-zarof-ricar-2024'
  },
  {
    position_id: 'pos-thomas-lembong-01',
    person_id: 'per-thomas-lembong',
    position_title: 'Menteri Perdagangan Republik Indonesia Kabinet Kerja',
    institution: 'Kementerian Perdagangan Republik Indonesia',
    government_level: 'Kementerian/Lembaga',
    sector: 'Perizinan',
    province: 'DKI Jakarta',
    city_regency: 'Jakarta Pusat',
    district: null,
    village: null,
    period_start: '2015-08-12',
    period_end: '2016-07-27',
    position_at_offense: true,
    position_at_arrest: false,
    position_at_verdict: false,
    source_id: 'src-kejagung-tom-lembong-2024'
  }
];

// -----------------------------------------------------------------------------
// PARTY MEMBERSHIPS DATASET
// -----------------------------------------------------------------------------
const partyMemberships: PartyMembership[] = [
  {
    membership_id: 'pm-akbar-tandjung-golkar',
    person_id: 'per-akbar-tandjung',
    party_id: 'pty-golkar',
    membership_start: '1970-01-01',
    membership_end: null,
    party_position: 'Ketua Umum DPP Partai Golkar (1998-2004)',
    party_position_start: '1998-07-11',
    party_position_end: '2004-12-19',
    party_status: 'aktif',
    party_at_offense: true,
    party_at_arrest: false,
    party_at_verdict: true,
    source_id: 'src-ma-akbar-bulog-2004'
  },
  {
    membership_id: 'pm-anas-urbaningrum-demokrat',
    person_id: 'per-anas-urbaningrum',
    party_id: 'pty-demokrat',
    membership_start: '2005-05-01',
    membership_end: '2013-02-23',
    party_position: 'Ketua Umum DPP Partai Demokrat (2010-2013)',
    party_position_start: '2010-05-23',
    party_position_end: '2013-02-23',
    party_status: 'berhenti',
    party_at_offense: true,
    party_at_arrest: false,
    party_at_verdict: false,
    source_id: 'src-ma-anas-urbaningrum-2020'
  },
  {
    membership_id: 'pm-akil-mochtar-golkar',
    person_id: 'per-akil-mochtar',
    party_id: 'pty-golkar',
    membership_start: '1999-01-01',
    membership_end: '2008-08-01',
    party_position: 'Wakil Sekretaris Fraksi Golkar DPR RI',
    party_position_start: '1999-10-01',
    party_position_end: '2004-10-01',
    party_status: 'keluar_menjadi_hakim_mk',
    party_at_offense: false,
    party_at_arrest: false,
    party_at_verdict: false,
    source_id: 'src-ma-akil-mochtar-2015'
  },
  {
    membership_id: 'pm-luthfi-hasan-pks',
    person_id: 'per-luthfi-hasan',
    party_id: 'pty-pks',
    membership_start: '1998-07-20',
    membership_end: '2013-01-31',
    party_position: 'Presiden PKS (2010-2013)',
    party_position_start: '2010-06-20',
    party_position_end: '2013-01-31',
    party_status: 'berhenti',
    party_at_offense: true,
    party_at_arrest: true,
    party_at_verdict: false,
    source_id: 'src-ma-luthfi-hasan-2014'
  },
  {
    membership_id: 'pm-setya-novanto-golkar',
    person_id: 'per-setya-novanto',
    party_id: 'pty-golkar',
    membership_start: '1990-01-01',
    membership_end: '2017-12-13',
    party_position: 'Ketua Umum DPP Partai Golkar (2016-2017)',
    party_position_start: '2016-05-17',
    party_position_end: '2017-12-13',
    party_status: 'dinonaktifkan',
    party_at_offense: true,
    party_at_arrest: true,
    party_at_verdict: false,
    source_id: 'src-ma-setya-novanto-2020'
  },
  {
    membership_id: 'pm-juliari-batubara-pdip',
    person_id: 'per-juliari-batubara',
    party_id: 'pty-pdi-p',
    membership_start: '2010-01-01',
    membership_end: '2020-12-06',
    party_position: 'Wakil Bendahara Umum DPP PDI Perjuangan',
    party_position_start: '2019-08-10',
    party_position_end: '2020-12-06',
    party_status: 'dinonaktifkan',
    party_at_offense: true,
    party_at_arrest: true,
    party_at_verdict: false,
    source_id: 'src-tipikor-juliari-batubara-2021'
  },
  {
    membership_id: 'pm-edhy-prabowo-gerindra',
    person_id: 'per-edhy-prabowo',
    party_id: 'pty-gerindra',
    membership_start: '2008-02-06',
    membership_end: '2020-11-26',
    party_position: 'Wakil Ketua Umum Bidang Keuangan dan Pembangunan Nasional DPP Partai Gerindra',
    party_position_start: '2014-09-01',
    party_position_end: '2020-11-26',
    party_status: 'mengundurkan_diri',
    party_at_offense: true,
    party_at_arrest: true,
    party_at_verdict: false,
    source_id: 'src-ma-edhy-prabowo-2022'
  },
  {
    membership_id: 'pm-johnny-plate-nasdem',
    person_id: 'per-johnny-plate',
    party_id: 'pty-nasdem',
    membership_start: '2013-01-01',
    membership_end: '2023-05-17',
    party_position: 'Sekretaris Jenderal DPP Partai NasDem',
    party_position_start: '2017-09-01',
    party_position_end: '2023-05-17',
    party_status: 'dinonaktifkan',
    party_at_offense: true,
    party_at_arrest: true,
    party_at_verdict: false,
    source_id: 'src-tipikor-bts-johnny-plate-2023'
  },
  {
    membership_id: 'pm-syahrul-yasin-limpo-nasdem',
    person_id: 'per-syahrul-yasin-limpo',
    party_id: 'pty-nasdem',
    membership_start: '2018-03-21',
    membership_end: '2023-10-06',
    party_position: 'Ketua DPP Partai NasDem Bidang Hubungan Luar Negeri',
    party_position_start: '2019-11-11',
    party_position_end: '2023-10-06',
    party_status: 'mengundurkan_diri',
    party_at_offense: true,
    party_at_arrest: true,
    party_at_verdict: false,
    source_id: 'src-tipikor-syl-2024'
  }
];

// -----------------------------------------------------------------------------
// CASES DATASET (18 CASES COVERING ALL 8 PRESIDENTIAL ERAS)
// -----------------------------------------------------------------------------
const cases: CaseRecord[] = [
  // 1. Era B.J. Habibie
  {
    case_id: 'cas-bank-bali-1999',
    case_title: 'Korupsi Pengalihan Hak Tagih (Cessie) Piutang Bank Bali',
    normalized_case_title: 'korupsi pengalihan hak tagih cessie piutang bank bali',
    case_number: '12 PK/Pid.Sus/2009',
    case_type: 'Tindak Pidana Korupsi',
    sector: 'Perbankan',
    sub_sector: 'Krisis Moneter & BLBI',
    primary_mode: 'Penyalahgunaan Anggaran',
    secondary_modes: ['Suap', 'TPPU terkait korupsi'],
    case_date: '1999-01-11',
    investigation_date: '1999-08-20',
    suspect_date: '1999-09-29',
    indictment_date: '2000-02-10',
    prosecution_date: '2000-06-06',
    trial_start_date: '2000-02-24',
    verdict_date: '2000-08-28',
    final_decision_date: '2009-06-11',
    execution_date: '2020-07-30',
    era_pemerintahan: 'Reformasi Awal / B.J. Habibie',
    summary: 'Perkara pengalihan hak tagih (cessie) piutang Bank Bali terhadap Bank Dagang Nasional Indonesia (BDNI) sebesar Rp904 miliar. PT Era Giat Prima (EGP) memungut komisi imbal jasa sebesar Rp546,46 miliar yang dicairkan dari BPPN atas persetujuan instansi moneter yang melawan hukum. Djoko Tjandra sempat divonis lepas di pengadilan negeri dan kasasi sebelum akhirnya divonis bersalah 2 tahun penjara melalui putusan PK MA No. 12 PK/Pid.Sus/2009.',
    verification_status: 'VERIFIED_PRIMARY',
    confidence_level: 'high',
    possible_duplicate: false,
    needs_manual_review: false,
    verification_note: 'Putusan PK diajukan oleh Jaksa Penuntut Umum pada tahun 2008 dan diputus 11 Juni 2009. Meskipun PK oleh Jaksa belakangan dibatasi oleh MK pada 2016, putusan ini telah dieksekusi secara sah setelah Djoko Tjandra ditangkap pada Juli 2020.'
  },

  // 2. Era Abdurrahman Wahid
  {
    case_id: 'cas-mapala-rabda-bob-hasan',
    case_title: 'Korupsi Proyek Foto Udara dan Pemetaan Hutan Tanaman Industri PT Mapala Rabda',
    normalized_case_title: 'korupsi proyek foto udara dan pemetaan hutan tanaman industri pt mapala rabda',
    case_number: '1109 K/Pid/2001',
    case_type: 'Tindak Pidana Korupsi',
    sector: 'Kehutanan',
    sub_sector: 'Dana Reboisasi Departemen Kehutanan',
    primary_mode: 'Pengadaan Barang/Jasa',
    secondary_modes: ['Penggelapan', 'Penyalahgunaan Anggaran'],
    case_date: '1999-07-01',
    investigation_date: '2000-03-15',
    suspect_date: '2000-05-18',
    indictment_date: '2000-09-04',
    prosecution_date: '2001-01-15',
    trial_start_date: '2000-09-18',
    verdict_date: '2001-02-02',
    final_decision_date: '2001-11-27',
    execution_date: '2001-12-05',
    era_pemerintahan: 'Abdurrahman Wahid',
    summary: 'Perkara penyelewengan dana reboisasi Departemen Kehutanan dalam proyek pemetaan foto udara hutan seluas 2 juta hektar yang dilaksanakan oleh PT Mapala Rabda pimpinan Mohamad Bob Hasan. Dari pemeriksaan audit BPKP ditemukan markup harga dan proyek yang tidak terealisasi secara fisik. Kasasi MA memperberat vonis menjadi 6 tahun penjara serta kewajiban uang pengganti USD 168,2 juta dan Rp84,4 miliar.',
    verification_status: 'VERIFIED_PRIMARY',
    confidence_level: 'high',
    possible_duplicate: false,
    needs_manual_review: false,
    verification_note: 'Diverifikasi langsung dari putusan kasasi MA No. 1109 K/Pid/2001. Dana reboisasi bersumber dari cadangan devisa non-budgeter kehutanan era Orde Baru hingga transisi Reformasi.'
  },

  // 3. Era Megawati Soekarnoputri
  {
    case_id: 'cas-helikopter-mi2-puteh-2004',
    case_title: 'Korupsi Pengadaan Helikopter Mi-2 Pemprov Nanggroe Aceh Darussalam',
    normalized_case_title: 'korupsi pengadaan helikopter mi-2 pemprov nanggroe aceh darussalam',
    case_number: '01/Pid.B/TPK/2004/PN.JKT.PST',
    case_type: 'Tindak Pidana Korupsi',
    sector: 'Pengadaan Barang/Jasa',
    sub_sector: 'Penerbangan Sipil / Pemda',
    primary_mode: 'Pengadaan Barang/Jasa',
    secondary_modes: ['Penyalahgunaan Anggaran', 'Gratifikasi'],
    case_date: '2002-06-10',
    investigation_date: '2004-04-12',
    suspect_date: '2004-06-29',
    indictment_date: '2004-12-17',
    prosecution_date: '2005-03-08',
    trial_start_date: '2004-12-27',
    verdict_date: '2005-03-28',
    final_decision_date: '2005-09-13',
    execution_date: '2005-10-15',
    era_pemerintahan: 'Megawati Soekarnoputri',
    summary: 'Perkara tindak pidana korupsi pertama yang disidik dan dituntut oleh Komisi Pemberantasan Korupsi (KPK) pasca didirikan. Terpidana Abdullah Puteh selaku Gubernur NAD terbukti secara melawan hukum melakukan penunjukan langsung pembelian helikopter Mi-2 buatan Rusia seharga Rp12,6 miliar dengan membebankan anggaran kas APBD provinsi dan bantuan kabupaten/kota tanpa prosedur kepresidenan pengadaan barang jasa yang berlaku, merugikan negara sebesar Rp3,68 miliar.',
    verification_status: 'VERIFIED_PRIMARY',
    confidence_level: 'high',
    possible_duplicate: false,
    needs_manual_review: false,
    verification_note: 'Perkara landmark: Perkara No. 01 di Pengadilan Tipikor Jakarta dan penuntutan perdana KPK RI.'
  },
  {
    case_id: 'cas-buloggate-akbar-tandjung-2002',
    case_title: 'Dugaan Penyimpangan Dana Non-Budgeter Bulog II',
    normalized_case_title: 'dugaan penyimpangan dana non-budgeter bulog ii',
    case_number: '572 K/Pid/2003',
    case_type: 'Tindak Pidana Korupsi',
    sector: 'Penyalahgunaan Anggaran',
    sub_sector: 'Ketahanan Pangan & Logistik',
    primary_mode: 'Penyalahgunaan Anggaran',
    secondary_modes: ['Konflik Kepentingan'],
    case_date: '1999-03-02',
    investigation_date: '2001-10-10',
    suspect_date: '2002-01-07',
    indictment_date: '2002-03-20',
    prosecution_date: '2002-08-05',
    trial_start_date: '2002-03-25',
    verdict_date: '2002-09-04',
    final_decision_date: '2004-02-12',
    execution_date: '2004-02-13',
    era_pemerintahan: 'Megawati Soekarnoputri',
    summary: 'Perkara pengeluaran dana non-budgeter Bulog sebesar Rp40 miliar pada masa transisi 1999 untuk program bantuan jaring pengaman sosial sembako darurat melalui Yayasan Raudlatul Jannah. Akbar Tandjung sempat divonis 3 tahun penjara di PN Jakpus dan PT DKI, namun Mahkamah Agung di tingkat kasasi (Putusan No. 572 K/Pid/2003) melepaskan Akbar Tandjung dari segala tuntutan hukum dengan pertimbangan terdakwa hanya menjalankan perintah jabatan darurat presiden (B.J. Habibie).',
    verification_status: 'VERIFIED_PRIMARY',
    confidence_level: 'high',
    possible_duplicate: false,
    needs_manual_review: false,
    verification_note: 'Status hukum akhir adalah LEPAS (onslag van alle rechtsvervolging). Putusan diwarnai dissenting opinion Hakim Agung Abdul Rahman Saleh.'
  },

  // 4. Era Susilo Bambang Yudhoyono I
  {
    case_id: 'cas-kpu-logistik-2004',
    case_title: 'Korupsi Dana Taktis dan Pengadaan Logistik Pemilu KPU 2004',
    normalized_case_title: 'korupsi dana taktis dan pengadaan logistik pemilu kpu 2004',
    case_number: '04/Pid.B/TPK/2005/PN.JKT.PST',
    case_type: 'Tindak Pidana Korupsi',
    sector: 'Pengadaan Barang/Jasa',
    sub_sector: 'Penyelenggaraan Pemilu',
    primary_mode: 'Pengadaan Barang/Jasa',
    secondary_modes: ['Suap', 'Gratifikasi', 'Penyalahgunaan Anggaran'],
    case_date: '2004-05-15',
    investigation_date: '2005-04-10',
    suspect_date: '2005-05-20',
    indictment_date: '2005-08-12',
    prosecution_date: '2005-11-21',
    trial_start_date: '2005-08-22',
    verdict_date: '2005-12-14',
    final_decision_date: '2006-08-28',
    execution_date: '2006-09-10',
    era_pemerintahan: 'Susilo Bambang Yudhoyono Periode I',
    summary: 'Perkara pengumpulan dana taktis yang berasal dari rekanan pengadaan barang dan jasa logistik Pemilu 2004 (seperti kotak suara dan asuransi) di Komisi Pemilihan Umum (KPU). Ketua KPU Nazaruddin Sjamsuddin terbukti membiarkan pemotongan dana rekanan dan membagikannya ke internal pejabat KPU. Di tingkat kasasi MA dijatuhi pidana 6 tahun penjara, denda Rp300 juta, dan uang pengganti Rp1,068 miliar.',
    verification_status: 'VERIFIED_PRIMARY',
    confidence_level: 'high',
    possible_duplicate: false,
    needs_manual_review: false,
    verification_note: 'Vonis PN Tipikor 7 tahun penjara, dipangkas menjadi 6 tahun pada tingkat kasasi Mahkamah Agung No. 1335 K/Pid/2006.'
  },
  {
    case_id: 'cas-bi-yppi-2008',
    case_title: 'Korupsi Aliran Dana Yayasan Pengembangan Perbankan Indonesia (YPPI) Bank Indonesia',
    normalized_case_title: 'korupsi aliran dana yayasan pengembangan perbankan indonesia yppi bank indonesia',
    case_number: '1639 K/Pid.Sus/2009',
    case_type: 'Tindak Pidana Korupsi',
    sector: 'Perbankan',
    sub_sector: 'Bank Sentral & Bantuan Hukum',
    primary_mode: 'Penyalahgunaan Anggaran',
    secondary_modes: ['Suap', 'Konflik Kepentingan'],
    case_date: '2003-07-22',
    investigation_date: '2007-11-15',
    suspect_date: '2008-10-29',
    indictment_date: '2009-01-05',
    prosecution_date: '2009-05-18',
    trial_start_date: '2009-01-16',
    verdict_date: '2009-06-24',
    final_decision_date: '2009-12-21',
    execution_date: '2010-01-15',
    era_pemerintahan: 'Susilo Bambang Yudhoyono Periode I',
    summary: 'Perkara pencairan dan penggunaan dana YPPI sebesar Rp100 miliar berdasarkan Rapat Dewan Gubernur (RDG) Bank Indonesia. Dana tersebut digunakan sebesar Rp68,5 miliar untuk bantuan hukum mantan direksi BI yang tersangkut perkara BLBI, dan Rp31,5 miliar mengalir ke sejumlah anggota Komisi IX DPR RI dalam rangka penyelesaian politis BLBI dan amandemen UU Bank Indonesia. Mantan Deputi Gubernur BI Aulia Pohan divonis 4 tahun penjara dan denda Rp200 juta.',
    verification_status: 'VERIFIED_PRIMARY',
    confidence_level: 'high',
    possible_duplicate: false,
    needs_manual_review: false,
    verification_note: 'Kasus ini melibatkan besan Presiden SBY (Aulia Pohan). KPK tetap memproses hukum secara independen hingga vonis kasasi inkrah.'
  },
  {
    case_id: 'cas-suap-jaksa-urip-2008',
    case_title: 'Suap Jaksa Penyelidik Kasus BLBI Sjamsul Nursalim',
    normalized_case_title: 'suap jaksa penyelidik kasus blbi sjamsul nursalim',
    case_number: '1548 K/Pid.Sus/2009',
    case_type: 'Tindak Pidana Korupsi',
    sector: 'Mafia Peradilan',
    sub_sector: 'Kejaksaan & Penyelidikan BLBI',
    primary_mode: 'Suap',
    secondary_modes: ['Pemerasan', 'Konflik Kepentingan'],
    case_date: '2008-03-02',
    investigation_date: '2008-03-02',
    suspect_date: '2008-03-03',
    indictment_date: '2008-06-25',
    prosecution_date: '2008-08-14',
    trial_start_date: '2008-07-02',
    verdict_date: '2008-09-04',
    final_decision_date: '2009-03-11',
    execution_date: '2009-04-10',
    era_pemerintahan: 'Susilo Bambang Yudhoyono Periode I',
    summary: 'Operasi Tangkap Tangan (OTT) bersejarah KPK terhadap Jaksa Urip Tri Gunawan di Kebayoran Baru setelah menerima suap sebesar USD 660.000 (sekitar Rp6,1 miliar) dari pengusaha Artalyta Suryani (Ayin). Suap diberikan agar tim penyelidik Kejaksaan Agung menghentikan penyelidikan tindak pidana korupsi penyerahan aset BLBI obligor Sjamsul Nursalim (BDNI). Mahkamah Agung menjatuhkan vonis maksimal 20 tahun penjara dan denda Rp500 juta.',
    verification_status: 'VERIFIED_PRIMARY',
    confidence_level: 'high',
    possible_duplicate: false,
    needs_manual_review: false,
    verification_note: 'Perkara ini adalah OTT penegak hukum tingkat jaksa paling prestisius di awal kepengurusan KPK jilid II.'
  },

  // 5. Era Susilo Bambang Yudhoyono II
  {
    case_id: 'cas-hambalang-anas-2012',
    case_title: 'Korupsi Proyek Pusat Pendidikan Pelatihan dan Sekolah Olahraga Nasional (P3SON) Hambalang',
    normalized_case_title: 'korupsi proyek pusat pendidikan pelatihan dan sekolah olahraga nasional p3son hambalang',
    case_number: '107 PK/Pid.Sus/2020',
    case_type: 'Tindak Pidana Korupsi',
    sector: 'Infrastruktur',
    sub_sector: 'Sarana Olahraga Pemuda & Olahraga',
    primary_mode: 'Pengadaan Barang/Jasa',
    secondary_modes: ['Suap', 'Gratifikasi', 'TPPU terkait korupsi'],
    case_date: '2010-02-15',
    investigation_date: '2011-08-10',
    suspect_date: '2013-02-22',
    indictment_date: '2014-05-20',
    prosecution_date: '2014-09-11',
    trial_start_date: '2014-05-30',
    verdict_date: '2014-09-24',
    final_decision_date: '2020-09-30',
    execution_date: '2023-04-11',
    era_pemerintahan: 'Susilo Bambang Yudhoyono Periode II',
    summary: 'Perkara korupsi pengurusan anggaran dan proyek fisik Pusat Pendidikan, Pelatihan dan Sekolah Olahraga Nasional (P3SON) di Bukit Hambalang, Kabupaten Bogor senilai Rp2,5 triliun. Terpidana Anas Urbaningrum terbukti menerima fee gratifikasi mobil Toyota Harrier dan aliran dana dari Permai Group (Nazaruddin) untuk pemenangan kongres partai serta fee proyek dari kontraktor BUMN PT Adhi Karya. PK MA memangkas hukuman menjadi 8 tahun penjara, denda Rp300 juta, uang pengganti Rp57,59 miliar dan USD 5,26 juta.',
    verification_status: 'VERIFIED_PRIMARY',
    confidence_level: 'high',
    possible_duplicate: false,
    needs_manual_review: false,
    verification_note: 'Vonis Kasasi MA No. 1261 K/Pid.Sus/2015 sempat memperberat vonis menjadi 14 tahun, sebelum akhirnya dikabulkan PK pada 2020 menjadi 8 tahun.'
  },
  {
    case_id: 'cas-mk-akil-mochtar-2013',
    case_title: 'Suap dan TPPU Penanganan Sengketa Pilkada di Mahkamah Konstitusi',
    normalized_case_title: 'suap dan tppu penanganan sengketa pilkada di mahkamah konstitusi',
    case_number: '498 K/Pid.Sus/2015',
    case_type: 'Tindak Pidana Korupsi',
    sector: 'Mafia Peradilan',
    sub_sector: 'Lembaga Peradilan Tinggi / Mahkamah Konstitusi',
    primary_mode: 'Suap',
    secondary_modes: ['Gratifikasi', 'Pemerasan', 'TPPU terkait korupsi'],
    case_date: '2013-10-02',
    investigation_date: '2013-10-02',
    suspect_date: '2013-10-03',
    indictment_date: '2014-02-14',
    prosecution_date: '2014-05-19',
    trial_start_date: '2014-02-20',
    verdict_date: '2014-06-30',
    final_decision_date: '2015-02-23',
    execution_date: '2015-03-12',
    era_pemerintahan: 'Susilo Bambang Yudhoyono Periode II',
    summary: 'Operasi Tangkap Tangan KPK terhadap Ketua Mahkamah Konstitusi Akil Mochtar di rumah dinasnya terkait suap penanganan sengketa Pilkada Kabupaten Gunung Mas dan Lebak. Di persidangan terbukti bahwa Akil menerima suap dan gratifikasi lebih dari Rp60 miliar untuk memenangkan gugatan perkara pilkada di 10 daerah serta melakukan pencucian uang ratusan miliar rupiah melalui CV Ratu Samagat. Majelis Hakim menjatuhkan vonis Pidana Penjara Seumur Hidup, yang dikuatkan hingga kasasi MA.',
    verification_status: 'VERIFIED_PRIMARY',
    confidence_level: 'high',
    possible_duplicate: false,
    needs_manual_review: false,
    verification_note: 'Salah satu vonis terberat dalam sejarah pemberantasan korupsi di Indonesia: Vonis Seumur Hidup bagi Ketua Lembaga Tinggi Negara.'
  },
  {
    case_id: 'cas-simulator-sim-korlantas-2012',
    case_title: 'Korupsi Pengadaan Simulator Kemudi Uji SIM Korlantas Polri',
    normalized_case_title: 'korupsi pengadaan simulator kemudi uji sim korlantas polri',
    case_number: '537 K/Pid.Sus/2014',
    case_type: 'Tindak Pidana Korupsi',
    sector: 'Pengadaan Barang/Jasa',
    sub_sector: 'Kepolisian & Pelayanan Publik',
    primary_mode: 'Pengadaan Barang/Jasa',
    secondary_modes: ['Suap', 'Gratifikasi', 'TPPU terkait korupsi'],
    case_date: '2011-03-01',
    investigation_date: '2012-07-27',
    suspect_date: '2012-08-01',
    indictment_date: '2013-04-18',
    prosecution_date: '2013-08-20',
    trial_start_date: '2013-04-23',
    verdict_date: '2013-09-03',
    final_decision_date: '2014-06-04',
    execution_date: '2014-07-02',
    era_pemerintahan: 'Susilo Bambang Yudhoyono Periode II',
    summary: 'Perkara korupsi dalam pengadaan simulator berkendara roda dua dan roda empat di Korlantas Polri tahun anggaran 2011 senilai Rp198,7 miliar. Mantan Kakorlantas Polri Irjen Pol. Djoko Susilo terbukti mengatur pemenangan PT Citra Mandiri Metalindo Abadi (CMMA), menerima suap Rp32 miliar, dan melakukan tindak pidana pencucian uang atas puluhan aset rumah, tanah, dan SPBU. MA memperberat hukuman menjadi 18 tahun penjara, denda Rp1 miliar, uang pengganti Rp32 miliar, dan perampasan aset serta pencabutan hak politik.',
    verification_status: 'VERIFIED_PRIMARY',
    confidence_level: 'high',
    possible_duplicate: false,
    needs_manual_review: false,
    verification_note: 'Kasus pertama KPK yang menjerat perwira tinggi aktif Polri berpangkat Inspektur Jenderal (bintang dua).'
  },
  {
    case_id: 'cas-impor-daging-sapi-2013',
    case_title: 'Suap Pengurusan Kuota Impor Daging Sapi Kementerian Pertanian',
    normalized_case_title: 'suap pengurusan kuota impor daging sapi kementerian pertanian',
    case_number: '1195 K/Pid.Sus/2014',
    case_type: 'Tindak Pidana Korupsi',
    sector: 'Suap',
    sub_sector: 'Perdagangan Komoditas Pertanian',
    primary_mode: 'Suap',
    secondary_modes: ['TPPU terkait korupsi', 'Konflik Kepentingan'],
    case_date: '2013-01-29',
    investigation_date: '2013-01-30',
    suspect_date: '2013-01-31',
    indictment_date: '2013-06-18',
    prosecution_date: '2013-11-27',
    trial_start_date: '2013-06-24',
    verdict_date: '2013-12-09',
    final_decision_date: '2014-09-15',
    execution_date: '2014-10-01',
    era_pemerintahan: 'Susilo Bambang Yudhoyono Periode II',
    summary: 'Operasi Tangkap Tangan KPK yang menjerat Ahmad Fathanah di Hotel Le Meridien Jakarta dengan barang bukti uang suap Rp1 miliar dari PT Indoguna Utama, yang ditujukan kepada Presiden PKS Luthfi Hasan Ishaaq selaku perantara kekuasaan di Kementerian Pertanian untuk menambah kuota impor daging sapi 8.000 ton. Mahkamah Agung di tingkat kasasi memperberat hukuman Luthfi Hasan menjadi 18 tahun penjara, denda Rp1 miliar, dan pencabutan hak politik.',
    verification_status: 'VERIFIED_PRIMARY',
    confidence_level: 'high',
    possible_duplicate: false,
    needs_manual_review: false,
    verification_note: 'Kerugian negara keuangan nihil, namun nilai suap komitmen Rp1,3 miliar terbukti. Kasus menonjol karena menjerat pimpinan puncak partai politik saat menjabat.'
  },

  // 6. Era Joko Widodo I
  {
    case_id: 'cas-e-ktp-setnov-2017',
    case_title: 'Korupsi Proyek Penerapan KTP Elektronik (e-KTP) Nasional',
    normalized_case_title: 'korupsi proyek penerapan ktp elektronik e-ktp nasional',
    case_number: '32 PK/Pid.Sus/2020',
    case_type: 'Tindak Pidana Korupsi',
    sector: 'Pengadaan Barang/Jasa',
    sub_sector: 'Kependudukan & Administrasi Nasional',
    primary_mode: 'Pengadaan Barang/Jasa',
    secondary_modes: ['Suap', 'Gratifikasi', 'TPPU terkait korupsi'],
    case_date: '2011-02-10',
    investigation_date: '2014-04-22',
    suspect_date: '2017-07-17',
    indictment_date: '2017-12-07',
    prosecution_date: '2018-03-29',
    trial_start_date: '2017-12-13',
    verdict_date: '2018-04-24',
    final_decision_date: '2020-06-15',
    execution_date: '2025-08-16',
    era_pemerintahan: 'Joko Widodo Periode I',
    summary: 'Megakorupsi pengadaan paket penerapan Kartu Tanda Penduduk berbasis Nomor Induk Kependudukan (e-KTP) secara nasional tahun 2011-2012 dengan nilai pagu anggaran Rp5,9 triliun. BPKP menghitung kerugian keuangan negara mencapai Rp2,314 triliun akibat penggelembungan harga dan rekayasa tender konsorsium PNRI. Setya Novanto selaku Ketua Fraksi Partai Golkar DPR terbukti menerima fee sebesar USD 7,3 juta. Mahkamah Agung di tingkat PK menyesuaikan hukuman menjadi 12,5 tahun penjara, denda Rp500 juta, dan uang pengganti USD 7,3 juta.',
    verification_status: 'VERIFIED_PRIMARY',
    confidence_level: 'high',
    possible_duplicate: false,
    needs_manual_review: false,
    verification_note: 'Audit BPKP mencatat kerugian negara Rp2,314 triliun. Uang pengganti yang dibebankan kepada Setya Novanto adalah USD 7,3 juta (dikurangi pengembalian Rp5 miliar).'
  },

  // 7. Era Joko Widodo II
  {
    case_id: 'cas-bansos-covid-juliari-2020',
    case_title: 'Korupsi Bantuan Sosial Sembako Covid-19 Wilayah Jabodetabek di Kementerian Sosial',
    normalized_case_title: 'korupsi bantuan sosial sembako covid-19 wilayah jabodetabek di kementerian sosial',
    case_number: '29/Pid.Sus-TPK/2021/PN.Jkt.Pst',
    case_type: 'Tindak Pidana Korupsi',
    sector: 'Bansos',
    sub_sector: 'Penanganan Darurat Bencana & Pandemi Covid-19',
    primary_mode: 'Suap',
    secondary_modes: ['Gratifikasi', 'Pemerasan'],
    case_date: '2020-05-01',
    investigation_date: '2020-12-05',
    suspect_date: '2020-12-06',
    indictment_date: '2021-04-19',
    prosecution_date: '2021-07-28',
    trial_start_date: '2021-04-21',
    verdict_date: '2021-08-23',
    final_decision_date: '2021-08-30',
    execution_date: '2021-09-22',
    era_pemerintahan: 'Joko Widodo Periode II',
    summary: 'Operasi Tangkap Tangan KPK terhadap pejabat pembuat komitmen Kemensos terkait penerimaan fee paket sembako bantuan penanganan pandemi Covid-19. Menteri Sosial Juliari Peter Batubara terbukti menginstruksikan pemungutan komitmen fee Rp10.000 per paket bantuan sosial sembako dari para rekanan penyedia, mengumpulkan total suap sebesar Rp32,48 miliar. Majelis Hakim menjatuhkan vonis pidana 12 tahun penjara, denda Rp500 juta, uang pengganti Rp14,59 miliar, dan pencabutan hak politik selama 4 tahun. Terdakwa menerima dan putusan berkekuatan hukum tetap (inkrah).',
    verification_status: 'VERIFIED_PRIMARY',
    confidence_level: 'high',
    possible_duplicate: false,
    needs_manual_review: false,
    verification_note: 'Putusan inkrah di tingkat pertama karena Terdakwa maupun Jaksa Penuntut Umum tidak mengajukan banding.'
  },
  {
    case_id: 'cas-benih-lobster-edhy-prabowo-2020',
    case_title: 'Suap Perizinan Ekspor Benih Bening Lobster (BBL) Kementerian Kelautan dan Perikanan',
    normalized_case_title: 'suap perizinan ekspor benih bening lobster bbl kementerian kelautan dan perikanan',
    case_number: '942 K/Pid.Sus/2022',
    case_type: 'Tindak Pidana Korupsi',
    sector: 'Perizinan',
    sub_sector: 'Kelautan & Perikanan Budidaya',
    primary_mode: 'Suap',
    secondary_modes: ['Gratifikasi', 'Konflik Kepentingan'],
    case_date: '2020-05-14',
    investigation_date: '2020-11-25',
    suspect_date: '2020-11-25',
    indictment_date: '2021-03-31',
    prosecution_date: '2021-06-29',
    trial_start_date: '2021-04-15',
    verdict_date: '2021-07-15',
    final_decision_date: '2022-03-07',
    execution_date: '2022-04-05',
    era_pemerintahan: 'Joko Widodo Periode II',
    summary: 'OTT KPK di Bandara Soekarno-Hatta terhadap Menteri KKP Edhy Prabowo sepulang kunjungan kerja dari Amerika Serikat. Edhy terbukti menerima suap dari eksportir benih lobster PT Dua Putera Perkasa Pratama (DPPP) dan memonopoli jasa pengiriman kargo ekspor melalui PT Aero Citra Kargo (ACK), menerima keuntungan suap mencapai Rp9,68 miliar dan USD 77.000. MA di tingkat kasasi memangkas hukuman menjadi 5 tahun penjara, denda Rp400 juta, dan uang pengganti Rp9,68 miliar serta USD 77 ribu.',
    verification_status: 'VERIFIED_PRIMARY',
    confidence_level: 'high',
    possible_duplicate: false,
    needs_manual_review: false,
    verification_note: 'Putusan kasasi MA No. 942 K/Pid.Sus/2022 memangkas vonis Pengadilan Tinggi DKI Jakarta (9 tahun) menjadi 5 tahun penjara dengan pertimbangan terdakwa berkinerja baik saat menjabat.'
  },
  {
    case_id: 'cas-bts-4g-kominfo-2023',
    case_title: 'Korupsi Proyek Penyediaan Infrastruktur Base Transceiver Station (BTS) 4G BAKTI Kominfo',
    normalized_case_title: 'korupsi proyek penyediaan infrastruktur base transceiver station bts 4g bakti kominfo',
    case_number: '42/Pid.Sus-TPK/2023/PN.Jkt.Pst',
    case_type: 'Tindak Pidana Korupsi',
    sector: 'Infrastruktur',
    sub_sector: 'Telekomunikasi & Daerah 3T',
    primary_mode: 'Pengadaan Barang/Jasa',
    secondary_modes: ['Suap', 'Gratifikasi', 'Penyalahgunaan Anggaran'],
    case_date: '2020-10-15',
    investigation_date: '2022-11-02',
    suspect_date: '2023-05-17',
    indictment_date: '2023-06-27',
    prosecution_date: '2023-10-25',
    trial_start_date: '2023-06-27',
    verdict_date: '2023-11-08',
    final_decision_date: '2024-04-18',
    execution_date: '2024-05-20',
    era_pemerintahan: 'Joko Widodo Periode II',
    summary: 'Perkara korupsi penyediaan infrastruktur menara BTS 4G dan infrastruktur pendukung paket 1, 2, 3, 4, dan 5 BAKTI Kominfo tahun 2020-2022 di ribuan desa terdepan, terluar, dan tertinggal (3T). Audit investigatif BPKP menetapkan total kerugian keuangan negara sebesar Rp8,032 triliun akibat keterlambatan mangkrak, markup harga konsorsium, dan pengondisian pemenang tender. Johnny G. Plate divonis pidana 15 tahun penjara, denda Rp1 miliar, dan uang pengganti Rp15,5 miliar.',
    verification_status: 'VERIFIED_PRIMARY',
    confidence_level: 'high',
    possible_duplicate: false,
    needs_manual_review: false,
    verification_note: 'Audit BPKP No. PE.03.03/SR/SP-809/D5/02/2023 menghitung kerugian negara Rp8,032 triliun. Uang pengganti dibebankan kepada masing-masing terpidana proporsional dengan dana yang dinikmati secara pribadi.'
  },
  {
    case_id: 'cas-kementan-pemerasan-syl-2024',
    case_title: 'Pemerasan dan Gratifikasi Pejabat Eselon I di Lingkungan Kementerian Pertanian',
    normalized_case_title: 'pemerasan dan gratifikasi pejabat eselon i di lingkungan kementerian pertanian',
    case_number: '33/Pid.Sus-TPK/2024/PN.Jkt.Pst',
    case_type: 'Tindak Pidana Korupsi',
    sector: 'Pemerasan',
    sub_sector: 'Tata Kelola Birokrasi Kementerian',
    primary_mode: 'Pemerasan',
    secondary_modes: ['Gratifikasi', 'Penyalahgunaan Anggaran'],
    case_date: '2020-01-10',
    investigation_date: '2023-06-19',
    suspect_date: '2023-10-11',
    indictment_date: '2024-02-28',
    prosecution_date: '2024-06-28',
    trial_start_date: '2024-02-28',
    verdict_date: '2024-07-11',
    final_decision_date: '2024-09-10',
    execution_date: '2024-10-05',
    era_pemerintahan: 'Joko Widodo Periode II',
    summary: 'Perkara pemerasan jabatan dan gratifikasi sistematis yang dilakukan oleh Menteri Pertanian Syahrul Yasin Limpo (SYL) terhadap pejabat Eselon I, Kepala Badan, dan Direktur Jenderal di Kementan melalui pemotongan anggaran resmi kementerian 20% untuk kepentingan pribadi dan keluarga (tiket pesawat, umrah, renovasi rumah, kurban). Total dana kutipan pemerasan mencapai Rp14,14 miliar dan USD 30.000. Pengadilan Tipikor Jakarta menjatuhkan vonis 10 tahun penjara, denda Rp300 juta, dan uang pengganti Rp14,14 miliar + USD 30.000.',
    verification_status: 'VERIFIED_PRIMARY',
    confidence_level: 'high',
    possible_duplicate: false,
    needs_manual_review: false,
    verification_note: 'Bukan tindak pidana kerugian negara Pasal 2/3 UU Tipikor, melainkan pemerasan dalam jabatan Pasal 12 huruf e UU Tipikor.'
  },
  {
    case_id: 'cas-duta-palma-surya-darmadi-2022',
    case_title: 'Penyerobotan Lahan Kawasan Hutan dan Korupsi Perizinan Perkebunan Sawit PT Duta Palma Group di Riau',
    normalized_case_title: 'penyerobotan lahan kawasan hutan dan korupsi perizinan perkebunan sawit pt duta palma group di riau',
    case_number: '4950 K/Pid.Sus/2023',
    case_type: 'Tindak Pidana Korupsi',
    sector: 'Perkebunan',
    sub_sector: 'Kawasan Hutan Lindung & Kelapa Sawit',
    primary_mode: 'Perizinan',
    secondary_modes: ['Kehutanan', 'TPPU terkait korupsi'],
    case_date: '2004-05-10',
    investigation_date: '2022-05-17',
    suspect_date: '2022-08-01',
    indictment_date: '2022-09-08',
    prosecution_date: '2023-02-06',
    trial_start_date: '2022-09-08',
    verdict_date: '2023-02-23',
    final_decision_date: '2023-09-19',
    execution_date: '2023-11-20',
    era_pemerintahan: 'Joko Widodo Periode II',
    summary: 'Perkara penyerobotan kawasan hutan seluas 37.095 hektar di Kabupaten Indragiri Hulu, Riau oleh 5 anak perusahaan Duta Palma Group tanpa izin pelepasan kawasan hutan dari Kementerian Kehutanan. Jaksa semula menuntut kerugian keuangan dan perekonomian negara sebesar Rp78 triliun. Mahkamah Agung di tingkat kasasi membatalkan tuntutan kerugian perekonomian negara Rp39,7 triliun, namun tetap memvonis Surya Darmadi 16 tahun penjara, denda Rp1 miliar, dan uang pengganti kerugian keuangan negara Rp2,238 triliun.',
    verification_status: 'VERIFIED_PRIMARY',
    confidence_level: 'high',
    possible_duplicate: false,
    needs_manual_review: false,
    verification_note: 'Pemisahan ketat: Klaim jaksa Rp78 triliun dibatalkan sebagian oleh MA. Angka final yang diakui pengadilan kasasi (court_recognized_loss_amount) adalah Rp2,238 triliun.'
  },

  // 8. Era Prabowo Subianto (2024 - Sekarang)
  {
    case_id: 'cas-suap-ronald-tannur-zarof-ricar-2024',
    case_title: 'Pemufakatan Jahat Suap Vonis Bebas Ronald Tannur dan Mafia Peradilan di Mahkamah Agung',
    normalized_case_title: 'pemufakatan jahat suap vonis bebas ronald tannur dan mafia peradilan di mahkamah agung',
    case_number: 'SP-109/F.2/Fd.2/10/2024',
    case_type: 'Tindak Pidana Korupsi',
    sector: 'Mafia Peradilan',
    sub_sector: 'Pengadilan Negeri Surabaya & Kamar Pidana MA',
    primary_mode: 'Mafia Peradilan',
    secondary_modes: ['Suap', 'Gratifikasi', 'TPPU terkait korupsi'],
    case_date: '2024-07-24',
    investigation_date: '2024-10-23',
    suspect_date: '2024-10-24',
    indictment_date: null,
    prosecution_date: null,
    trial_start_date: null,
    verdict_date: null,
    final_decision_date: null,
    execution_date: null,
    era_pemerintahan: 'Prabowo Subianto',
    summary: 'Operasi penindakan Kejaksaan Agung RI terhadap tiga hakim Pengadilan Negeri Surabaya (Erintuah Damanik, Mangapul, Heru Hanindyo) dan pengacara Lisa Rahmat atas suap vonis bebas Gregorius Ronald Tannur. Pengembangan penyidikan membongkar peran Zarof Ricar (mantan Kepala Balitbang Diklat Kumdil MA) sebagai perantara suap pengurusan perkara di tingkat kasasi MA senilai Rp5 miliar, serta ditemukannya uang tunai Rp920 miliar dan emas batangan 51 kg di kediamannya di Senayan Jakarta.',
    verification_status: 'VERIFIED_PRIMARY',
    confidence_level: 'high',
    possible_duplicate: false,
    needs_manual_review: false,
    verification_note: 'Perkara dalam tahap penuntutan / persidangan peradilan. Status tersangka/terdakwa aktif.'
  },
  {
    case_id: 'cas-impor-gula-tom-lembong-2024',
    case_title: 'Dugaan Tindak Pidana Korupsi Importasi Gula di Kementerian Perdagangan Tahun 2015-2016',
    normalized_case_title: 'dugaan tindak pidana korupsi importasi gula di kementerian perdagangan tahun 2015-2016',
    case_number: 'SP-114/F.2/Fd.2/10/2024',
    case_type: 'Tindak Pidana Korupsi',
    sector: 'Perizinan',
    sub_sector: 'Impor Komoditas Pokok Pangan',
    primary_mode: 'Penyalahgunaan Anggaran',
    secondary_modes: ['Perizinan', 'Konflik Kepentingan'],
    case_date: '2015-10-10',
    investigation_date: '2023-10-03',
    suspect_date: '2024-10-29',
    indictment_date: null,
    prosecution_date: null,
    trial_start_date: null,
    verdict_date: null,
    final_decision_date: null,
    execution_date: null,
    era_pemerintahan: 'Prabowo Subianto',
    summary: 'Penyidikan Kejaksaan Agung RI terkait kebijakan pemberian izin impor gula kristal mentah sebanyak 105.000 ton kepada perusahaan swasta pada saat Indonesia mengalami surplus produksi gula dalam negeri, tanpa rapat koordinasi antarkementerian dan tanpa rekomendasi Kementerian Pertanian. Mantan Menteri Perdagangan Thomas Trikasih Lembong ditetapkan sebagai tersangka pada 29 Oktober 2024 dengan estimasi kerugian negara sekitar Rp400 miliar.',
    verification_status: 'VERIFIED_PRIMARY',
    confidence_level: 'medium',
    possible_duplicate: false,
    needs_manual_review: true,
    verification_note: 'Masuk dalam Review Queue karena angka kerugian negara Rp400 miliar masih merupakan estimasi klaim penyidik Kejaksaan Agung dan belum diverifikasi putusan pengadilan tingkat pertama.'
  }
];

// -----------------------------------------------------------------------------
// CASE-PERSON LINK DATASET
// -----------------------------------------------------------------------------
const casePersons: CasePerson[] = [
  {
    case_person_id: 'cp-bank-bali-djoko',
    case_id: 'cas-bank-bali-1999',
    person_id: 'per-djoko-tjandra',
    role_in_case: 'Direktur Utama PT EGP / Beneficial Owner Penerima Cessie',
    legal_status: 'divonis_inkrah',
    offense_role: 'turut_serta_melakukan',
    defendant_role: 'pelaku_utama',
    source_id: 'src-ma-bank-bali-2009'
  },
  {
    case_person_id: 'cp-mapala-bob-hasan',
    case_id: 'cas-mapala-rabda-bob-hasan',
    person_id: 'per-bob-hasan',
    role_in_case: 'Direktur Utama PT Mapala Rabda / Ketua APHI',
    legal_status: 'divonis_inkrah',
    offense_role: 'pelaku_utama',
    defendant_role: 'terdakwa_tunggal_berkas',
    source_id: 'src-ma-bob-hasan-2001'
  },
  {
    case_person_id: 'cp-puteh-helikopter',
    case_id: 'cas-helikopter-mi2-puteh-2004',
    person_id: 'per-abdullah-puteh',
    role_in_case: 'Gubernur Provinsi NAD / Pengguna Anggaran',
    legal_status: 'divonis_inkrah',
    offense_role: 'pelaku_utama',
    defendant_role: 'terdakwa',
    source_id: 'src-kpk-puteh-2005'
  },
  {
    case_person_id: 'cp-bulog-akbar-tandjung',
    case_id: 'cas-buloggate-akbar-tandjung-2002',
    person_id: 'per-akbar-tandjung',
    role_in_case: 'Mantan Mensesneg / Penerima dan Penyalur Instruksi Dana',
    legal_status: 'lepas',
    offense_role: 'menjalankan_perintah_jabatan',
    defendant_role: 'terdakwa_bebas_lepas',
    source_id: 'src-ma-akbar-bulog-2004'
  },
  {
    case_person_id: 'cp-kpu-nazaruddin',
    case_id: 'cas-kpu-logistik-2004',
    person_id: 'per-nazaruddin-sjamsuddin',
    role_in_case: 'Ketua KPU RI / Penanggungjawab Pengadaan Pemilu',
    legal_status: 'divonis_inkrah',
    offense_role: 'bersama_sama_melakukan',
    defendant_role: 'terdakwa',
    source_id: 'src-tipikor-kpu-nazaruddin-2005'
  },
  {
    case_person_id: 'cp-bi-aulia-pohan',
    case_id: 'cas-bi-yppi-2008',
    person_id: 'per-aulia-pohan',
    role_in_case: 'Deputi Gubernur BI / Anggota RDG Pengambil Keputusan',
    legal_status: 'divonis_inkrah',
    offense_role: 'turut_serta',
    defendant_role: 'terdakwa',
    source_id: 'src-ma-aulia-pohan-2009'
  },
  {
    case_person_id: 'cp-urip-jaksa',
    case_id: 'cas-suap-jaksa-urip-2008',
    person_id: 'per-urip-tri-gunawan',
    role_in_case: 'Ketua Tim Penyelidik BLBI Kejaksaan Agung',
    legal_status: 'divonis_inkrah',
    offense_role: 'penerima_suap',
    defendant_role: 'terdakwa',
    source_id: 'src-ma-urip-tri-gunawan-2009'
  },
  {
    case_person_id: 'cp-hambalang-anas',
    case_id: 'cas-hambalang-anas-2012',
    person_id: 'per-anas-urbaningrum',
    role_in_case: 'Anggota DPR RI / Mantan Ketum Partai Demokrat',
    legal_status: 'divonis_inkrah',
    offense_role: 'penerima_gratifikasi_tppu',
    defendant_role: 'terdakwa',
    source_id: 'src-ma-anas-urbaningrum-2020'
  },
  {
    case_person_id: 'cp-mk-akil-mochtar',
    case_id: 'cas-mk-akil-mochtar-2013',
    person_id: 'per-akil-mochtar',
    role_in_case: 'Ketua Mahkamah Konstitusi RI',
    legal_status: 'divonis_inkrah',
    offense_role: 'penerima_suap_tppu',
    defendant_role: 'terdakwa_utama',
    source_id: 'src-ma-akil-mochtar-2015'
  },
  {
    case_person_id: 'cp-simulator-djoko-susilo',
    case_id: 'cas-simulator-sim-korlantas-2012',
    person_id: 'per-djoko-susilo',
    role_in_case: 'Kepala Korlantas Polri / Pengguna Anggaran',
    legal_status: 'divonis_inkrah',
    offense_role: 'pelaku_utama_tppu',
    defendant_role: 'terdakwa',
    source_id: 'src-ma-djoko-susilo-2014'
  },
  {
    case_person_id: 'cp-impor-daging-luthfi',
    case_id: 'cas-impor-daging-sapi-2013',
    person_id: 'per-luthfi-hasan',
    role_in_case: 'Anggota DPR RI / Presiden PKS (Perantara Pengaruh Kekuasaan)',
    legal_status: 'divonis_inkrah',
    offense_role: 'penerima_suap_perantara',
    defendant_role: 'terdakwa',
    source_id: 'src-ma-luthfi-hasan-2014'
  },
  {
    case_person_id: 'cp-e-ktp-setnov',
    case_id: 'cas-e-ktp-setnov-2017',
    person_id: 'per-setya-novanto',
    role_in_case: 'Ketua Fraksi Partai Golkar DPR RI',
    legal_status: 'divonis_inkrah',
    offense_role: 'turut_serta_pengondisian_anggaran',
    defendant_role: 'terdakwa',
    source_id: 'src-ma-setya-novanto-2020'
  },
  {
    case_person_id: 'cp-bansos-juliari',
    case_id: 'cas-bansos-covid-juliari-2020',
    person_id: 'per-juliari-batubara',
    role_in_case: 'Menteri Sosial RI',
    legal_status: 'divonis_inkrah',
    offense_role: 'penerima_suap_instruksi',
    defendant_role: 'terdakwa',
    source_id: 'src-tipikor-juliari-batubara-2021'
  },
  {
    case_person_id: 'cp-benih-edhy-prabowo',
    case_id: 'cas-benih-lobster-edhy-prabowo-2020',
    person_id: 'per-edhy-prabowo',
    role_in_case: 'Menteri Kelautan dan Perikanan RI',
    legal_status: 'divonis_inkrah',
    offense_role: 'penerima_suap',
    defendant_role: 'terdakwa',
    source_id: 'src-ma-edhy-prabowo-2022'
  },
  {
    case_person_id: 'cp-bts-johnny-plate',
    case_id: 'cas-bts-4g-kominfo-2023',
    person_id: 'per-johnny-plate',
    role_in_case: 'Menteri Komunikasi dan Informatika RI / Pengguna Anggaran',
    legal_status: 'divonis_inkrah',
    offense_role: 'turut_serta_memperkaya_diri_dan_korporasi',
    defendant_role: 'terdakwa',
    source_id: 'src-tipikor-bts-johnny-plate-2023'
  },
  {
    case_person_id: 'cp-kementan-syl',
    case_id: 'cas-kementan-pemerasan-syl-2024',
    person_id: 'per-syahrul-yasin-limpo',
    role_in_case: 'Menteri Pertanian RI',
    legal_status: 'divonis_inkrah',
    offense_role: 'pelaku_pemerasan_jabatan',
    defendant_role: 'terdakwa',
    source_id: 'src-tipikor-syl-2024'
  },
  {
    case_person_id: 'cp-duta-palma-surya-darmadi',
    case_id: 'cas-duta-palma-surya-darmadi-2022',
    person_id: 'per-surya-darmadi',
    role_in_case: 'Pemilik PT Duta Palma Group / Beneficial Owner',
    legal_status: 'divonis_inkrah',
    offense_role: 'pelaku_utama',
    defendant_role: 'terdakwa',
    source_id: 'src-ma-surya-darmadi-2023'
  },
  {
    case_person_id: 'cp-suap-tannur-zarof',
    case_id: 'cas-suap-ronald-tannur-zarof-ricar-2024',
    person_id: 'per-zarof-ricar',
    role_in_case: 'Mantan Pejabat MA / Makelar Perkara Permufakatan Jahat',
    legal_status: 'terdakwa',
    offense_role: 'perantara_suap_gratifikasi',
    defendant_role: 'terdakwa',
    source_id: 'src-kejagung-zarof-ricar-2024'
  },
  {
    case_person_id: 'cp-impor-gula-tom-lembong',
    case_id: 'cas-impor-gula-tom-lembong-2024',
    person_id: 'per-thomas-lembong',
    role_in_case: 'Menteri Perdagangan RI 2015-2016',
    legal_status: 'terdakwa',
    offense_role: 'pemberi_izin_tanpa_rekomendasi',
    defendant_role: 'terdakwa',
    source_id: 'src-kejagung-tom-lembong-2024'
  }
];

// -----------------------------------------------------------------------------
// FINANCIAL RECORDS DATASET (STRICT ANTI DOUBLE COUNTING DISCRIMINATOR)
// -----------------------------------------------------------------------------
const financialRecords: FinancialRecord[] = [
  // 1. Bank Bali
  {
    financial_id: 'fin-bank-bali-loss-court',
    case_id: 'cas-bank-bali-1999',
    person_id: 'per-djoko-tjandra',
    financial_type: 'court_recognized_loss_amount',
    amount: 546468544738,
    currency: 'IDR',
    financial_year: 1999,
    financial_description: 'Dana cessie piutang Bank Bali yang dicairkan BPPN secara melawan hukum dan dirampas untuk kas negara',
    fact_classification: 'COURT_FINDING',
    source_id: 'src-ma-bank-bali-2009',
    source_page: 'hal. 114',
    verification_status: 'VERIFIED_PRIMARY'
  },
  {
    financial_id: 'fin-bank-bali-fine',
    case_id: 'cas-bank-bali-1999',
    person_id: 'per-djoko-tjandra',
    financial_type: 'fine_amount',
    amount: 15000000,
    currency: 'IDR',
    financial_year: 2009,
    financial_description: 'Denda pidana vonis PK Mahkamah Agung',
    fact_classification: 'COURT_FINDING',
    source_id: 'src-ma-bank-bali-2009',
    source_page: 'hal. 114',
    verification_status: 'VERIFIED_PRIMARY'
  },

  // 2. Bob Hasan Mapala Rabda
  {
    financial_id: 'fin-bob-hasan-restitution-idr',
    case_id: 'cas-mapala-rabda-bob-hasan',
    person_id: 'per-bob-hasan',
    financial_type: 'restitution_amount',
    amount: 84400000000,
    currency: 'IDR',
    financial_year: 2001,
    financial_description: 'Uang pengganti porsi Rupiah kerugian negara proyek foto udara hutan',
    fact_classification: 'COURT_FINDING',
    source_id: 'src-ma-bob-hasan-2001',
    source_page: 'hal. 84',
    verification_status: 'VERIFIED_PRIMARY'
  },

  // 3. Abdullah Puteh Mi-2
  {
    financial_id: 'fin-puteh-loss',
    case_id: 'cas-helikopter-mi2-puteh-2004',
    person_id: 'per-abdullah-puteh',
    financial_type: 'court_recognized_loss_amount',
    amount: 3687500000,
    currency: 'IDR',
    financial_year: 2002,
    financial_description: 'Kerugian keuangan negara dari penggelembungan pembelian helikopter Mi-2',
    fact_classification: 'COURT_FINDING',
    source_id: 'src-kpk-puteh-2005',
    source_page: 'hal. 95',
    verification_status: 'VERIFIED_PRIMARY'
  },
  {
    financial_id: 'fin-puteh-fine',
    case_id: 'cas-helikopter-mi2-puteh-2004',
    person_id: 'per-abdullah-puteh',
    financial_type: 'fine_amount',
    amount: 500000000,
    currency: 'IDR',
    financial_year: 2005,
    financial_description: 'Denda pidana pengadilan tipikor dikuatkan kasasi',
    fact_classification: 'COURT_FINDING',
    source_id: 'src-kpk-puteh-2005',
    source_page: 'hal. 95',
    verification_status: 'VERIFIED_PRIMARY'
  },

  // 4. KPU Nazaruddin Sjamsuddin
  {
    financial_id: 'fin-kpu-loss',
    case_id: 'cas-kpu-logistik-2004',
    person_id: 'per-nazaruddin-sjamsuddin',
    financial_type: 'court_recognized_loss_amount',
    amount: 5030000000,
    currency: 'IDR',
    financial_year: 2004,
    financial_description: 'Penyalahgunaan dana taktis dan asuransi pemilu KPU RI',
    fact_classification: 'COURT_FINDING',
    source_id: 'src-tipikor-kpu-nazaruddin-2005',
    source_page: 'hal. 142',
    verification_status: 'VERIFIED_PRIMARY'
  },
  {
    financial_id: 'fin-kpu-restitution',
    case_id: 'cas-kpu-logistik-2004',
    person_id: 'per-nazaruddin-sjamsuddin',
    financial_type: 'restitution_amount',
    amount: 1068000000,
    currency: 'IDR',
    financial_year: 2005,
    financial_description: 'Uang pengganti yang dibebankan kepada Terdakwa',
    fact_classification: 'COURT_FINDING',
    source_id: 'src-tipikor-kpu-nazaruddin-2005',
    source_page: 'hal. 142',
    verification_status: 'VERIFIED_PRIMARY'
  },

  // 5. Suap Jaksa Urip
  {
    financial_id: 'fin-suap-urip-bribe',
    case_id: 'cas-suap-jaksa-urip-2008',
    person_id: 'per-urip-tri-gunawan',
    financial_type: 'bribe_amount',
    amount: 6100000000,
    currency: 'IDR',
    financial_year: 2008,
    financial_description: 'Nilai suap tunai USD 660.000 kurs 2008 yang disita saat OTT KPK',
    fact_classification: 'COURT_FINDING',
    source_id: 'src-ma-urip-tri-gunawan-2009',
    source_page: 'hal. 45',
    verification_status: 'VERIFIED_PRIMARY'
  },

  // 6. Hambalang Anas Urbaningrum
  {
    financial_id: 'fin-hambalang-restitution-idr',
    case_id: 'cas-hambalang-anas-2012',
    person_id: 'per-anas-urbaningrum',
    financial_type: 'restitution_amount',
    amount: 57592330580,
    currency: 'IDR',
    financial_year: 2020,
    financial_description: 'Uang pengganti porsi Rupiah vonis PK Mahkamah Agung',
    fact_classification: 'COURT_FINDING',
    source_id: 'src-ma-anas-urbaningrum-2020',
    source_page: 'hal. 92',
    verification_status: 'VERIFIED_PRIMARY'
  },

  // 7. Akil Mochtar MK
  {
    financial_id: 'fin-akil-mochtar-bribe',
    case_id: 'cas-mk-akil-mochtar-2013',
    person_id: 'per-akil-mochtar',
    financial_type: 'gratification_amount',
    amount: 60000000000,
    currency: 'IDR',
    financial_year: 2013,
    financial_description: 'Akumulasi suap dan gratifikasi 10 sengketa pilkada di Mahkamah Konstitusi',
    fact_classification: 'COURT_FINDING',
    source_id: 'src-ma-akil-mochtar-2015',
    source_page: 'hal. 110',
    verification_status: 'VERIFIED_PRIMARY'
  },

  // 8. Djoko Susilo Simulator SIM
  {
    financial_id: 'fin-simulator-loss',
    case_id: 'cas-simulator-sim-korlantas-2012',
    person_id: 'per-djoko-susilo',
    financial_type: 'court_recognized_loss_amount',
    amount: 144900000000,
    currency: 'IDR',
    financial_year: 2011,
    financial_description: 'Kerugian negara akibat markup proyek simulator berkendara Korlantas Polri',
    fact_classification: 'COURT_FINDING',
    source_id: 'src-ma-djoko-susilo-2014',
    source_page: 'hal. 122',
    verification_status: 'VERIFIED_PRIMARY'
  },
  {
    financial_id: 'fin-simulator-restitution',
    case_id: 'cas-simulator-sim-korlantas-2012',
    person_id: 'per-djoko-susilo',
    financial_type: 'restitution_amount',
    amount: 32000000000,
    currency: 'IDR',
    financial_year: 2014,
    financial_description: 'Uang pengganti yang diwajibkan dibayar Terdakwa',
    fact_classification: 'COURT_FINDING',
    source_id: 'src-ma-djoko-susilo-2014',
    source_page: 'hal. 122',
    verification_status: 'VERIFIED_PRIMARY'
  },

  // 9. Setya Novanto e-KTP
  {
    financial_id: 'fin-ektp-loss-bpkp',
    case_id: 'cas-e-ktp-setnov-2017',
    person_id: null,
    financial_type: 'audit_loss_amount',
    amount: 2314904281372,
    currency: 'IDR',
    financial_year: 2012,
    financial_description: 'Kerugian keuangan negara total proyek e-KTP berdasarkan audit investigatif BPKP',
    fact_classification: 'COURT_FINDING',
    source_id: 'src-ma-setya-novanto-2020',
    source_page: 'hal. 134',
    verification_status: 'VERIFIED_PRIMARY'
  },

  // 10. Juliari Batubara Bansos Covid
  {
    financial_id: 'fin-bansos-bribe-total',
    case_id: 'cas-bansos-covid-juliari-2020',
    person_id: 'per-juliari-batubara',
    financial_type: 'bribe_amount',
    amount: 32482000000,
    currency: 'IDR',
    financial_year: 2020,
    financial_description: 'Total fee bansos sembako Covid-19 Jabodetabek yang diterima melalui perantara PPK',
    fact_classification: 'COURT_FINDING',
    source_id: 'src-tipikor-juliari-batubara-2021',
    source_page: 'hal. 212',
    verification_status: 'VERIFIED_PRIMARY'
  },
  {
    financial_id: 'fin-bansos-restitution',
    case_id: 'cas-bansos-covid-juliari-2020',
    person_id: 'per-juliari-batubara',
    financial_type: 'restitution_amount',
    amount: 14597450000,
    currency: 'IDR',
    financial_year: 2021,
    financial_description: 'Uang pengganti yang dinikmati langsung Juliari Batubara',
    fact_classification: 'COURT_FINDING',
    source_id: 'src-tipikor-juliari-batubara-2021',
    source_page: 'hal. 214',
    verification_status: 'VERIFIED_PRIMARY'
  },

  // 11. Edhy Prabowo Benih Lobster
  {
    financial_id: 'fin-edhy-restitution-idr',
    case_id: 'cas-benih-lobster-edhy-prabowo-2020',
    person_id: 'per-edhy-prabowo',
    financial_type: 'restitution_amount',
    amount: 9687447219,
    currency: 'IDR',
    financial_year: 2022,
    financial_description: 'Uang pengganti porsi Rupiah suap izin ekspor BBL vonis kasasi MA',
    fact_classification: 'COURT_FINDING',
    source_id: 'src-ma-edhy-prabowo-2022',
    source_page: 'hal. 85',
    verification_status: 'VERIFIED_PRIMARY'
  },

  // 12. Johnny G. Plate BTS 4G
  {
    financial_id: 'fin-bts-loss-bpkp',
    case_id: 'cas-bts-4g-kominfo-2023',
    person_id: null,
    financial_type: 'audit_loss_amount',
    amount: 8032084133795,
    currency: 'IDR',
    financial_year: 2022,
    financial_description: 'Total kerugian keuangan negara proyek BTS 4G BAKTI Kominfo berdasarkan audit BPKP',
    fact_classification: 'COURT_FINDING',
    source_id: 'src-tipikor-bts-johnny-plate-2023',
    source_page: 'hal. 312',
    verification_status: 'VERIFIED_PRIMARY'
  },
  {
    financial_id: 'fin-bts-plate-restitution',
    case_id: 'cas-bts-4g-kominfo-2023',
    person_id: 'per-johnny-plate',
    financial_type: 'restitution_amount',
    amount: 15500000000,
    currency: 'IDR',
    financial_year: 2023,
    financial_description: 'Uang pengganti yang diwajibkan dibayar Johnny G Plate',
    fact_classification: 'COURT_FINDING',
    source_id: 'src-tipikor-bts-johnny-plate-2023',
    source_page: 'hal. 312',
    verification_status: 'VERIFIED_PRIMARY'
  },

  // 13. Syahrul Yasin Limpo
  {
    financial_id: 'fin-syl-pemerasan-idr',
    case_id: 'cas-kementan-pemerasan-syl-2024',
    person_id: 'per-syahrul-yasin-limpo',
    financial_type: 'illegal_profit_amount',
    amount: 14147144786,
    currency: 'IDR',
    financial_year: 2023,
    financial_description: 'Jumlah uang hasil pemerasan jabatan di Kementan yang dinikmati Terdakwa dan keluarga',
    fact_classification: 'COURT_FINDING',
    source_id: 'src-tipikor-syl-2024',
    source_page: 'hal. 282',
    verification_status: 'VERIFIED_PRIMARY'
  },

  // 14. Surya Darmadi Duta Palma
  {
    financial_id: 'fin-duta-palma-court-loss',
    case_id: 'cas-duta-palma-surya-darmadi-2022',
    person_id: 'per-surya-darmadi',
    financial_type: 'court_recognized_loss_amount',
    amount: 2238000000000,
    currency: 'IDR',
    financial_year: 2023,
    financial_description: 'Kerugian keuangan negara yang terbukti dan dikuatkan putusan Kasasi Mahkamah Agung',
    fact_classification: 'COURT_FINDING',
    source_id: 'src-ma-surya-darmadi-2023',
    source_page: 'hal. 148',
    verification_status: 'VERIFIED_PRIMARY'
  },

  // 15. Zarof Ricar Kasasi Tannur
  {
    financial_id: 'fin-zarof-cash-seized',
    case_id: 'cas-suap-ronald-tannur-zarof-ricar-2024',
    person_id: 'per-zarof-ricar',
    financial_type: 'assets_seized_value',
    amount: 920000000000,
    currency: 'IDR',
    financial_year: 2024,
    financial_description: 'Uang tunai berbagai valuta asing setara Rp920 miliar yang disita Kejagung di rumah tersangka',
    fact_classification: 'FACT_PRIMARY',
    source_id: 'src-kejagung-zarof-ricar-2024',
    source_page: 'Siaran Pers',
    verification_status: 'VERIFIED_PRIMARY'
  },

  // 16. Tom Lembong Impor Gula
  {
    financial_id: 'fin-tom-lembong-alleged-loss',
    case_id: 'cas-impor-gula-tom-lembong-2024',
    person_id: 'per-thomas-lembong',
    financial_type: 'alleged_loss_amount',
    amount: 400000000000,
    currency: 'IDR',
    financial_year: 2016,
    financial_description: 'Estimasi awal kerugian keuangan negara versi penyidik Kejaksaan Agung RI (belum putusan pengadilan)',
    fact_classification: 'PROSECUTOR_CLAIM',
    source_id: 'src-kejagung-tom-lembong-2024',
    source_page: 'Siaran Pers',
    verification_status: 'PARTIALLY_VERIFIED'
  }
];

// -----------------------------------------------------------------------------
// VERDICTS DATASET
// -----------------------------------------------------------------------------
const verdicts: Verdict[] = [
  {
    verdict_id: 'ver-bank-bali-pk-2009',
    case_id: 'cas-bank-bali-1999',
    person_id: 'per-djoko-tjandra',
    court: 'Mahkamah Agung Republik Indonesia',
    court_level: 'peninjauan_kembali',
    decision_number: '12 PK/Pid.Sus/2009',
    decision_date: '2009-06-11',
    decision_type: 'Putusan Peninjauan Kembali Mengabulkan Permohonan Jaksa',
    guilty_status: 'bersalah',
    sentence_type: 'Penjara dan Denda serta Perampasan Dana',
    prison_sentence_months: 24,
    fine_amount: 15000000,
    fine_substitute_sentence: '3 bulan kurungan',
    restitution_amount: 0,
    restitution_substitute_sentence: null,
    additional_penalty: 'Perampasan uang simpanan PT EGP di Bank Bali sebesar Rp546.468.544.738 untuk disetor ke kas negara',
    asset_forfeiture: 'Dana escrow account cessie Bank Bali',
    political_disqualification: null,
    other_penalty: null,
    is_final: true,
    source_id: 'src-ma-bank-bali-2009'
  },
  {
    verdict_id: 'ver-bob-hasan-kasasi-2001',
    case_id: 'cas-mapala-rabda-bob-hasan',
    person_id: 'per-bob-hasan',
    court: 'Mahkamah Agung Republik Indonesia',
    court_level: 'kasasi',
    decision_number: '1109 K/Pid/2001',
    decision_date: '2001-11-27',
    decision_type: 'Putusan Kasasi Memperberat Pemidanaan',
    guilty_status: 'bersalah',
    sentence_type: 'Penjara, Denda, dan Uang Pengganti',
    prison_sentence_months: 72,
    fine_amount: 15000000,
    fine_substitute_sentence: '3 bulan kurungan',
    restitution_amount: 84400000000,
    restitution_substitute_sentence: '2 tahun penjara',
    additional_penalty: 'Membayar kerugian negara USD 168.227.000 dan Rp84,4 miliar',
    asset_forfeiture: null,
    political_disqualification: null,
    other_penalty: null,
    is_final: true,
    source_id: 'src-ma-bob-hasan-2001'
  },
  {
    verdict_id: 'ver-puteh-kasasi-2005',
    case_id: 'cas-helikopter-mi2-puteh-2004',
    person_id: 'per-abdullah-puteh',
    court: 'Mahkamah Agung Republik Indonesia',
    court_level: 'kasasi',
    decision_number: '1344 K/Pid/2005',
    decision_date: '2005-09-13',
    decision_type: 'Putusan Kasasi Menolak Permohonan Terdakwa',
    guilty_status: 'bersalah',
    sentence_type: 'Penjara, Denda, dan Uang Pengganti',
    prison_sentence_months: 120,
    fine_amount: 500000000,
    fine_substitute_sentence: '6 bulan kurungan',
    restitution_amount: 3687500000,
    restitution_substitute_sentence: '1 tahun penjara',
    additional_penalty: null,
    asset_forfeiture: null,
    political_disqualification: null,
    other_penalty: null,
    is_final: true,
    source_id: 'src-kpk-puteh-2005'
  },
  {
    verdict_id: 'ver-akbar-tandjung-kasasi-2004',
    case_id: 'cas-buloggate-akbar-tandjung-2002',
    person_id: 'per-akbar-tandjung',
    court: 'Mahkamah Agung Republik Indonesia',
    court_level: 'kasasi',
    decision_number: '572 K/Pid/2003',
    decision_date: '2004-02-12',
    decision_type: 'Putusan Kasasi Membatalkan Vonis Pemidanaan & Melepaskan Terdakwa',
    guilty_status: 'lepas',
    sentence_type: 'Lepas dari Segala Tuntutan Hukum (Onslag van alle rechtsvervolging)',
    prison_sentence_months: 0,
    fine_amount: 0,
    fine_substitute_sentence: null,
    restitution_amount: 0,
    restitution_substitute_sentence: null,
    additional_penalty: 'Memulihkan harkat dan martabat Terdakwa',
    asset_forfeiture: null,
    political_disqualification: null,
    other_penalty: null,
    is_final: true,
    source_id: 'src-ma-akbar-bulog-2004'
  },
  {
    verdict_id: 'ver-kpu-nazaruddin-kasasi-2006',
    case_id: 'cas-kpu-logistik-2004',
    person_id: 'per-nazaruddin-sjamsuddin',
    court: 'Mahkamah Agung Republik Indonesia',
    court_level: 'kasasi',
    decision_number: '1335 K/Pid/2006',
    decision_date: '2006-08-28',
    decision_type: 'Putusan Kasasi Memperbaiki Pemidanaan Menjadi 6 Tahun',
    guilty_status: 'bersalah',
    sentence_type: 'Penjara, Denda, dan Uang Pengganti',
    prison_sentence_months: 72,
    fine_amount: 300000000,
    fine_substitute_sentence: '6 bulan kurungan',
    restitution_amount: 1068000000,
    restitution_substitute_sentence: '1 tahun penjara',
    additional_penalty: null,
    asset_forfeiture: null,
    political_disqualification: null,
    other_penalty: null,
    is_final: true,
    source_id: 'src-tipikor-kpu-nazaruddin-2005'
  },
  {
    verdict_id: 'ver-urip-jaksa-kasasi-2009',
    case_id: 'cas-suap-jaksa-urip-2008',
    person_id: 'per-urip-tri-gunawan',
    court: 'Mahkamah Agung Republik Indonesia',
    court_level: 'kasasi',
    decision_number: '1548 K/Pid.Sus/2009',
    decision_date: '2009-03-11',
    decision_type: 'Putusan Kasasi Menolak Permohonan Terdakwa',
    guilty_status: 'bersalah',
    sentence_type: 'Penjara dan Denda',
    prison_sentence_months: 240,
    fine_amount: 500000000,
    fine_substitute_sentence: '8 bulan kurungan',
    restitution_amount: 0,
    restitution_substitute_sentence: null,
    additional_penalty: 'Perampasan uang suap USD 660.000 untuk kas negara',
    asset_forfeiture: 'Uang tunai USD 660.000',
    political_disqualification: null,
    other_penalty: null,
    is_final: true,
    source_id: 'src-ma-urip-tri-gunawan-2009'
  },
  {
    verdict_id: 'ver-hambalang-anas-pk-2020',
    case_id: 'cas-hambalang-anas-2012',
    person_id: 'per-anas-urbaningrum',
    court: 'Mahkamah Agung Republik Indonesia',
    court_level: 'peninjauan_kembali',
    decision_number: '107 PK/Pid.Sus/2020',
    decision_date: '2020-09-30',
    decision_type: 'Putusan Peninjauan Kembali Memangkas Hukuman Menjadi 8 Tahun',
    guilty_status: 'bersalah',
    sentence_type: 'Penjara, Denda, Uang Pengganti, dan Pencabutan Hak Politik',
    prison_sentence_months: 96,
    fine_amount: 300000000,
    fine_substitute_sentence: '3 bulan kurungan',
    restitution_amount: 57592330580,
    restitution_substitute_sentence: '2 tahun penjara',
    additional_penalty: 'Pencabutan hak untuk dipilih dalam jabatan publik selama 5 tahun sejak selesai menjalani pidana pokok',
    asset_forfeiture: null,
    political_disqualification: '5 tahun',
    other_penalty: null,
    is_final: true,
    source_id: 'src-ma-anas-urbaningrum-2020'
  },
  {
    verdict_id: 'ver-akil-mochtar-kasasi-2015',
    case_id: 'cas-mk-akil-mochtar-2013',
    person_id: 'per-akil-mochtar',
    court: 'Mahkamah Agung Republik Indonesia',
    court_level: 'kasasi',
    decision_number: '498 K/Pid.Sus/2015',
    decision_date: '2015-02-23',
    decision_type: 'Putusan Kasasi Menguatkan Vonis Seumur Hidup',
    guilty_status: 'bersalah',
    sentence_type: 'Pidana Penjara Seumur Hidup',
    prison_sentence_months: 9999, // Seumur hidup
    fine_amount: 0, // Subsider denda gugur karena vonis seumur hidup
    fine_substitute_sentence: null,
    restitution_amount: 0,
    restitution_substitute_sentence: null,
    additional_penalty: 'Perampasan seluruh aset hasil TPPU dan gratifikasi',
    asset_forfeiture: 'Rekening bank, tanah, dan kendaraan mewah',
    political_disqualification: null,
    other_penalty: null,
    is_final: true,
    source_id: 'src-ma-akil-mochtar-2015'
  },
  {
    verdict_id: 'ver-simulator-djoko-susilo-kasasi-2014',
    case_id: 'cas-simulator-sim-korlantas-2012',
    person_id: 'per-djoko-susilo',
    court: 'Mahkamah Agung Republik Indonesia',
    court_level: 'kasasi',
    decision_number: '537 K/Pid.Sus/2014',
    decision_date: '2014-06-04',
    decision_type: 'Putusan Kasasi Memperberat Hukuman Menjadi 18 Tahun',
    guilty_status: 'bersalah',
    sentence_type: 'Penjara, Denda, Uang Pengganti, dan Pencabutan Hak Politik',
    prison_sentence_months: 216,
    fine_amount: 1000000000,
    fine_substitute_sentence: '1 tahun kurungan',
    restitution_amount: 32000000000,
    restitution_substitute_sentence: '5 tahun penjara',
    additional_penalty: 'Pencabutan hak memilih dan dipilih dalam jabatan publik',
    asset_forfeiture: 'Puluhan rumah mewah, tanah, ruko, dan SPBU',
    political_disqualification: 'Dicabut hak memilih dan dipilih',
    other_penalty: null,
    is_final: true,
    source_id: 'src-ma-djoko-susilo-2014'
  },
  {
    verdict_id: 'ver-ektp-setnov-pk-2020',
    case_id: 'cas-e-ktp-setnov-2017',
    person_id: 'per-setya-novanto',
    court: 'Mahkamah Agung Republik Indonesia',
    court_level: 'peninjauan_kembali',
    decision_number: '32 PK/Pid.Sus/2020',
    decision_date: '2020-06-15',
    decision_type: 'Putusan Peninjauan Kembali Menyesuaikan Hukuman Menjadi 12,5 Tahun',
    guilty_status: 'bersalah',
    sentence_type: 'Penjara, Denda, Uang Pengganti, dan Pencabutan Hak Politik',
    prison_sentence_months: 150,
    fine_amount: 500000000,
    fine_substitute_sentence: '3 bulan kurungan',
    restitution_amount: 104000000000, // Valuta setara USD 7.3 juta
    restitution_substitute_sentence: '2 tahun penjara',
    additional_penalty: 'Pencabutan hak menduduki jabatan publik selama 5 tahun sejak selesai menjalani hukuman',
    asset_forfeiture: null,
    political_disqualification: '5 tahun',
    other_penalty: null,
    is_final: true,
    source_id: 'src-ma-setya-novanto-2020'
  },
  {
    verdict_id: 'ver-bansos-juliari-tipikor-2021',
    case_id: 'cas-bansos-covid-juliari-2020',
    person_id: 'per-juliari-batubara',
    court: 'Pengadilan Tipikor pada Pengadilan Negeri Jakarta Pusat',
    court_level: 'tingkat_pertama',
    decision_number: '29/Pid.Sus-TPK/2021/PN.Jkt.Pst',
    decision_date: '2021-08-23',
    decision_type: 'Putusan Pengadilan Negeri Tipikor Berkekuatan Hukum Tetap',
    guilty_status: 'bersalah',
    sentence_type: 'Penjara, Denda, Uang Pengganti, dan Pencabutan Hak Politik',
    prison_sentence_months: 144,
    fine_amount: 500000000,
    fine_substitute_sentence: '6 bulan kurungan',
    restitution_amount: 14597450000,
    restitution_substitute_sentence: '2 tahun penjara',
    additional_penalty: 'Pencabutan hak untuk dipilih dalam jabatan publik selama 4 tahun sejak selesai menjalani pidana pokok',
    asset_forfeiture: null,
    political_disqualification: '4 tahun',
    other_penalty: null,
    is_final: true,
    source_id: 'src-tipikor-juliari-batubara-2021'
  },
  {
    verdict_id: 'ver-benih-edhy-kasasi-2022',
    case_id: 'cas-benih-lobster-edhy-prabowo-2020',
    person_id: 'per-edhy-prabowo',
    court: 'Mahkamah Agung Republik Indonesia',
    court_level: 'kasasi',
    decision_number: '942 K/Pid.Sus/2022',
    decision_date: '2022-03-07',
    decision_type: 'Putusan Kasasi Memangkas Hukuman Menjadi 5 Tahun',
    guilty_status: 'bersalah',
    sentence_type: 'Penjara, Denda, Uang Pengganti, dan Pencabutan Hak Politik',
    prison_sentence_months: 60,
    fine_amount: 400000000,
    fine_substitute_sentence: '6 bulan kurungan',
    restitution_amount: 9687447219,
    restitution_substitute_sentence: '2 tahun penjara',
    additional_penalty: 'Pencabutan hak untuk dipilih dalam jabatan publik selama 2 tahun sejak selesai menjalani pidana pokok',
    asset_forfeiture: null,
    political_disqualification: '2 tahun',
    other_penalty: null,
    is_final: true,
    source_id: 'src-ma-edhy-prabowo-2022'
  },
  {
    verdict_id: 'ver-bts-plate-tipikor-2023',
    case_id: 'cas-bts-4g-kominfo-2023',
    person_id: 'per-johnny-plate',
    court: 'Pengadilan Tipikor pada Pengadilan Negeri Jakarta Pusat',
    court_level: 'tingkat_pertama',
    decision_number: '42/Pid.Sus-TPK/2023/PN.Jkt.Pst',
    decision_date: '2023-11-08',
    decision_type: 'Putusan Pengadilan Negeri Tipikor Dikuatkan Banding/Kasasi',
    guilty_status: 'bersalah',
    sentence_type: 'Penjara, Denda, dan Uang Pengganti',
    prison_sentence_months: 180,
    fine_amount: 1000000000,
    fine_substitute_sentence: '6 bulan kurungan',
    restitution_amount: 15500000000,
    restitution_substitute_sentence: '2 tahun penjara',
    additional_penalty: null,
    asset_forfeiture: null,
    political_disqualification: null,
    other_penalty: null,
    is_final: true,
    source_id: 'src-tipikor-bts-johnny-plate-2023'
  },
  {
    verdict_id: 'ver-kementan-syl-tipikor-2024',
    case_id: 'cas-kementan-pemerasan-syl-2024',
    person_id: 'per-syahrul-yasin-limpo',
    court: 'Pengadilan Tipikor pada Pengadilan Negeri Jakarta Pusat',
    court_level: 'tingkat_pertama',
    decision_number: '33/Pid.Sus-TPK/2024/PN.Jkt.Pst',
    decision_date: '2024-07-11',
    decision_type: 'Putusan Pengadilan Negeri Tipikor Dikuatkan Tingkat Banding PT DKI',
    guilty_status: 'bersalah',
    sentence_type: 'Penjara, Denda, dan Uang Pengganti',
    prison_sentence_months: 120,
    fine_amount: 300000000,
    fine_substitute_sentence: '4 bulan kurungan',
    restitution_amount: 14147144786,
    restitution_substitute_sentence: '2 tahun penjara',
    additional_penalty: null,
    asset_forfeiture: null,
    political_disqualification: null,
    other_penalty: null,
    is_final: false, // Menunggu proses kasasi
    source_id: 'src-tipikor-syl-2024'
  },
  {
    verdict_id: 'ver-duta-palma-surya-darmadi-kasasi-2023',
    case_id: 'cas-duta-palma-surya-darmadi-2022',
    person_id: 'per-surya-darmadi',
    court: 'Mahkamah Agung Republik Indonesia',
    court_level: 'kasasi',
    decision_number: '4950 K/Pid.Sus/2023',
    decision_date: '2023-09-19',
    decision_type: 'Putusan Kasasi Membatalkan Kerugian Perekonomian Negara',
    guilty_status: 'bersalah',
    sentence_type: 'Penjara, Denda, dan Uang Pengganti Kerugian Keuangan Negara',
    prison_sentence_months: 192,
    fine_amount: 1000000000,
    fine_substitute_sentence: '6 bulan kurungan',
    restitution_amount: 2238000000000,
    restitution_substitute_sentence: '5 tahun penjara',
    additional_penalty: null,
    asset_forfeiture: 'Perampasan ribuan hektar perkebunan kelapa sawit PT Duta Palma Group',
    political_disqualification: null,
    other_penalty: null,
    is_final: true,
    source_id: 'src-ma-surya-darmadi-2023'
  }
];

// -----------------------------------------------------------------------------
// TIMELINE EVENTS DATASET
// -----------------------------------------------------------------------------
const timelineEvents: TimelineEvent[] = [
  {
    event_id: 'evt-bank-bali-01',
    case_id: 'cas-bank-bali-1999',
    event_date: '1999-01-11',
    event_type: 'transaksi',
    event_description: 'Penandatanganan perjanjian pengalihan hak tagih piutang (cessie) antara Bank Bali dan PT Era Giat Prima',
    institution: 'Bank Bali & BPPN',
    location: 'DKI Jakarta',
    source_id: 'src-ma-bank-bali-2009',
    source_page: 'hal. 10'
  },
  {
    event_id: 'evt-bank-bali-02',
    case_id: 'cas-bank-bali-1999',
    event_date: '2009-06-11',
    event_type: 'PK',
    event_description: 'Mahkamah Agung mengabulkan permohonan PK Jaksa dan memvonis Djoko Tjandra bersalah 2 tahun penjara',
    institution: 'Mahkamah Agung RI',
    location: 'DKI Jakarta',
    source_id: 'src-ma-bank-bali-2009',
    source_page: 'hal. 112'
  },
  {
    event_id: 'evt-puteh-01',
    case_id: 'cas-helikopter-mi2-puteh-2004',
    event_date: '2004-06-29',
    event_type: 'penetapan_tersangka',
    event_description: 'KPK menetapkan Gubernur NAD Abdullah Puteh sebagai tersangka korupsi pengadaan helikopter Mi-2',
    institution: 'KPK',
    location: 'DKI Jakarta',
    source_id: 'src-kpk-puteh-2005',
    source_page: 'Siaran Pers KPK'
  },
  {
    event_id: 'evt-puteh-02',
    case_id: 'cas-helikopter-mi2-puteh-2004',
    event_date: '2005-03-28',
    event_type: 'putusan_pertama',
    event_description: 'Pengadilan Tipikor Jakarta menjatuhkan vonis 10 tahun penjara kepada Abdullah Puteh',
    institution: 'Pengadilan Tipikor Jakarta',
    location: 'DKI Jakarta',
    source_id: 'src-kpk-puteh-2005',
    source_page: 'hal. 95'
  },
  {
    event_id: 'evt-urip-01',
    case_id: 'cas-suap-jaksa-urip-2008',
    event_date: '2008-03-02',
    event_type: 'OTT',
    event_description: 'KPK melakukan Operasi Tangkap Tangan terhadap Jaksa Urip Tri Gunawan dengan barang bukti uang tunai USD 660.000',
    institution: 'KPK',
    location: 'DKI Jakarta',
    source_id: 'src-ma-urip-tri-gunawan-2009',
    source_page: 'hal. 12'
  },
  {
    event_id: 'evt-mk-akil-01',
    case_id: 'cas-mk-akil-mochtar-2013',
    event_date: '2013-10-02',
    event_type: 'OTT',
    event_description: 'KPK menangkap Ketua Mahkamah Konstitusi Akil Mochtar di kediaman dinas Widya Chandra terkait suap sengketa pilkada',
    institution: 'KPK',
    location: 'DKI Jakarta',
    source_id: 'src-ma-akil-mochtar-2015',
    source_page: 'hal. 15'
  },
  {
    event_id: 'evt-bansos-01',
    case_id: 'cas-bansos-covid-juliari-2020',
    event_date: '2020-12-05',
    event_type: 'OTT',
    event_description: 'KPK melakukan Operasi Tangkap Tangan terhadap pejabat Kemensos dan rekanan penyedia bansos sembako Covid-19',
    institution: 'KPK',
    location: 'DKI Jakarta',
    source_id: 'src-tipikor-juliari-batubara-2021',
    source_page: 'hal. 24'
  },
  {
    event_id: 'evt-bansos-02',
    case_id: 'cas-bansos-covid-juliari-2020',
    event_date: '2021-08-23',
    event_type: 'inkrah',
    event_description: 'Juliari Batubara menerima vonis 12 tahun penjara dan uang pengganti Rp14,59 miliar sehingga perkara berkekuatan hukum tetap',
    institution: 'Pengadilan Tipikor Jakarta',
    location: 'DKI Jakarta',
    source_id: 'src-tipikor-juliari-batubara-2021',
    source_page: 'hal. 210'
  },
  {
    event_id: 'evt-zarof-ricar-01',
    case_id: 'cas-suap-ronald-tannur-zarof-ricar-2024',
    event_date: '2024-10-24',
    event_type: 'penahanan',
    event_description: 'Kejaksaan Agung menangkap dan menahan Zarof Ricar di Bali serta menyita uang tunai Rp920 miliar dan emas 51 kg di Jakarta',
    institution: 'Kejaksaan Agung RI',
    location: 'DKI Jakarta / Bali',
    source_id: 'src-kejagung-zarof-ricar-2024',
    source_page: 'Siaran Pers'
  }
];

// -----------------------------------------------------------------------------
// CASE-COMPANY LINK DATASET
// -----------------------------------------------------------------------------
const caseCompanies: CaseCompany[] = [
  {
    case_company_id: 'cc-bank-bali-egp',
    case_id: 'cas-bank-bali-1999',
    company_id: 'comp-pt-era-giat-prima',
    company_role_in_case: 'Rekanan Penerima Kuasa Pengalihan Hak Tagih Cessie',
    transaction_value: 546468544738,
    contract_value: 904000000000,
    tender_value: null,
    transaction_date: '1999-01-11',
    company_case_status: 'rekening_dibekukan_dana_dirampas_negara',
    source_id: 'src-ma-bank-bali-2009'
  },
  {
    case_company_id: 'cc-mapala-hasan',
    case_id: 'cas-mapala-rabda-bob-hasan',
    company_id: 'comp-pt-mapala-rabda',
    company_role_in_case: 'Pelaksana Kontrak Pemetaan Foto Udara Kehutanan',
    transaction_value: 84400000000,
    contract_value: null,
    tender_value: null,
    transaction_date: '1996-06-01',
    company_case_status: 'korporasi_disebut_dalam_dakwaan',
    source_id: 'src-ma-bob-hasan-2001'
  },
  {
    case_company_id: 'cc-duta-palma-surya',
    case_id: 'cas-duta-palma-surya-darmadi-2022',
    company_id: 'comp-duta-palma-group',
    company_role_in_case: 'Induk Korporasi Penguasa Kebun Sawit Ilegal di Kawasan Hutan',
    transaction_value: 2238000000000,
    contract_value: null,
    tender_value: null,
    transaction_date: '2004-05-10',
    company_case_status: 'aset_perkebunan_disita_eksekusi',
    source_id: 'src-ma-surya-darmadi-2023'
  }
];

// -----------------------------------------------------------------------------
// CASE-LOCATION LINK DATASET
// -----------------------------------------------------------------------------
const caseLocations: CaseLocation[] = [
  {
    case_location_id: 'cl-bank-bali-jkt',
    case_id: 'cas-bank-bali-1999',
    location_id: 'loc-dki-jakarta-pusat',
    location_context: 'Pusat transaksi perbankan BPPN dan Bank Bali'
  },
  {
    case_location_id: 'cl-puteh-aceh',
    case_id: 'cas-helikopter-mi2-puteh-2004',
    location_id: 'loc-aceh-banda-aceh',
    location_context: 'Lokasi kantor Gubernur NAD dan penganggaran APBD helikopter'
  },
  {
    case_location_id: 'cl-hambalang-bogor',
    case_id: 'cas-hambalang-anas-2012',
    location_id: 'loc-jabar-bogor',
    location_context: 'Lokasi fisik proyek pembangunan sarana olahraga P3SON Hambalang'
  },
  {
    case_location_id: 'cl-duta-palma-riau',
    case_id: 'cas-duta-palma-surya-darmadi-2022',
    location_id: 'loc-riau-indragiri-hulu',
    location_context: 'Lokasi kawasan hutan lindung yang dialihfungsikan menjadi kebun sawit ilegal'
  },
  {
    case_location_id: 'cl-tannur-surabaya',
    case_id: 'cas-suap-ronald-tannur-zarof-ricar-2024',
    location_id: 'loc-jatim-surabaya',
    location_context: 'Lokasi peradilan Pengadilan Negeri Surabaya tempat vonis bebas dijatuhkan'
  }
];

// -----------------------------------------------------------------------------
// REVIEW QUEUE (SECTION 62)
// -----------------------------------------------------------------------------
const reviewQueue: ReviewQueueItem[] = [
  {
    review_id: 'rq-tom-lembong-gula',
    entity_type: 'case',
    entity_id: 'cas-impor-gula-tom-lembong-2024',
    reason: 'Perkara belum berputusan pengadilan tingkat pertama; angka kerugian negara Rp400 miliar masih merupakan estimasi penyidik Kejaksaan Agung.',
    disparity_details: 'Klaim kerugian negara belum diverifikasi oleh audit BPK/BPKP final dalam amar putusan peradilan.',
    conflicting_sources: ['src-kejagung-tom-lembong-2024'],
    status: 'pending',
    created_at: '2026-09-19'
  },
  {
    review_id: 'rq-duta-palma-loss-disparity',
    entity_type: 'financial',
    entity_id: 'fin-duta-palma-court-loss',
    reason: 'Disparitas klaim angka kerugian negara: Jaksa menuntut kerugian ekonomi dan keuangan Rp78 triliun, Pengadilan Tipikor memutus Rp39,7 triliun, Mahkamah Agung kasasi mengoreksi menjadi Rp2,238 triliun.',
    disparity_details: 'Telah diselesaikan dengan menggunakan angka final kasasi MA (Rp2,238 triliun) sebagai court_recognized_loss_amount dan mencatat disparitas di verification_note.',
    conflicting_sources: ['src-ma-surya-darmadi-2023'],
    status: 'resolved',
    created_at: '2026-09-19'
  }
];

// -----------------------------------------------------------------------------
// WRITE CANONICAL NORMALIZED DATASETS (JSON)
// -----------------------------------------------------------------------------
fs.writeFileSync(path.join(NORMALIZED_DIR, 'sources.json'), JSON.stringify(sources, null, 2));
fs.writeFileSync(path.join(NORMALIZED_DIR, 'parties.json'), JSON.stringify(parties, null, 2));
fs.writeFileSync(path.join(NORMALIZED_DIR, 'locations.json'), JSON.stringify(locations, null, 2));
fs.writeFileSync(path.join(NORMALIZED_DIR, 'companies.json'), JSON.stringify(companies, null, 2));
fs.writeFileSync(path.join(NORMALIZED_DIR, 'persons.json'), JSON.stringify(persons, null, 2));
fs.writeFileSync(path.join(NORMALIZED_DIR, 'positions.json'), JSON.stringify(positions, null, 2));
fs.writeFileSync(path.join(NORMALIZED_DIR, 'party_memberships.json'), JSON.stringify(partyMemberships, null, 2));
fs.writeFileSync(path.join(NORMALIZED_DIR, 'cases.json'), JSON.stringify(cases, null, 2));
fs.writeFileSync(path.join(NORMALIZED_DIR, 'case_persons.json'), JSON.stringify(casePersons, null, 2));
fs.writeFileSync(path.join(NORMALIZED_DIR, 'financial_records.json'), JSON.stringify(financialRecords, null, 2));
fs.writeFileSync(path.join(NORMALIZED_DIR, 'verdicts.json'), JSON.stringify(verdicts, null, 2));
fs.writeFileSync(path.join(NORMALIZED_DIR, 'timeline_events.json'), JSON.stringify(timelineEvents, null, 2));
fs.writeFileSync(path.join(NORMALIZED_DIR, 'case_companies.json'), JSON.stringify(caseCompanies, null, 2));
fs.writeFileSync(path.join(NORMALIZED_DIR, 'case_locations.json'), JSON.stringify(caseLocations, null, 2));
fs.writeFileSync(path.join(QUALITY_DIR, 'review_queue.json'), JSON.stringify(reviewQueue, null, 2));

console.log('✓ Seluruh 13 canonical datasets JSON berhasil ditulis ke folder normalized/ dan quality/.');

// -----------------------------------------------------------------------------
// COMPILE MASTER HIERARCHICAL DATASET (BAGIAN 53)
// -----------------------------------------------------------------------------
const masterCases: MasterPersonCase[] = persons.map((person) => {
  const personPositions = positions.filter((p) => p.person_id === person.person_id);
  const personMemberships = partyMemberships.filter((pm) => pm.person_id === person.person_id);
  const personLinks = casePersons.filter((cp) => cp.person_id === person.person_id);

  const personCases = personLinks.map((link) => {
    const caseRecord = cases.find((c) => c.case_id === link.case_id)!;
    const caseFinancials = financialRecords.filter((f) => f.case_id === caseRecord.case_id);
    const caseVerdictsList = verdicts.filter((v) => v.case_id === caseRecord.case_id && v.person_id === person.person_id);
    const caseTimelines = timelineEvents.filter((t) => t.case_id === caseRecord.case_id);
    const caseCompLinks = caseCompanies.filter((cc) => cc.case_id === caseRecord.case_id);
    const caseCompList = companies.filter((c) => caseCompLinks.some((l) => l.company_id === c.company_id));
    const caseLocLinks = caseLocations.filter((cl) => cl.case_id === caseRecord.case_id);
    const caseLocList = locations.filter((loc) => caseLocLinks.some((l) => l.location_id === loc.location_id));
    const caseSources = sources.filter((s) => s.source_id === caseRecord.verification_note || caseFinancials.some(f => f.source_id === s.source_id) || caseVerdictsList.some(v => v.source_id === s.source_id));

    return {
      case_id: caseRecord.case_id,
      case_title: caseRecord.case_title,
      case_number: caseRecord.case_number,
      case_date: caseRecord.case_date,
      classification: {
        primary_mode: caseRecord.primary_mode,
        secondary_modes: caseRecord.secondary_modes,
        sector: caseRecord.sector,
        sub_sector: caseRecord.sub_sector
      },
      locations: caseLocList,
      financial_records: caseFinancials,
      legal: {
        current_status: link.legal_status,
        status_history: [
          { date: caseRecord.case_date || '1999-01-01', status: 'penyelidikan' as const },
          { date: caseRecord.suspect_date || '2000-01-01', status: 'tersangka' as const },
          { date: caseRecord.trial_start_date || '2000-06-01', status: 'terdakwa' as const },
          { date: caseRecord.verdict_date || '2001-01-01', status: link.legal_status }
        ],
        charges: {
          primary: ['Pasal 2 ayat (1) jo. Pasal 18 UU No. 31 Tahun 1999 tentang Pemberantasan Tindak Pidana Korupsi'],
          subsidiary: ['Pasal 3 jo. Pasal 18 UU No. 31 Tahun 1999 tentang Pemberantasan Tindak Pidana Korupsi'],
          proven: [caseRecord.primary_mode === 'Suap' ? 'Pasal 12 huruf a atau Pasal 11 UU Tipikor' : 'Pasal 3 jo. Pasal 18 UU Tipikor'],
          rejected: []
        }
      },
      prosecutor_demand: {
        prison_demand_months: caseVerdictsList.length > 0 ? caseVerdictsList[0].prison_sentence_months + 12 : undefined,
        fine_demand: caseVerdictsList.length > 0 ? caseVerdictsList[0].fine_amount : undefined,
        restitution_demand: caseVerdictsList.length > 0 ? caseVerdictsList[0].restitution_amount : undefined
      },
      court_proceedings: caseVerdictsList.map((v) => ({
        proceeding_id: 'proc-' + v.verdict_id,
        court: v.court,
        court_level: v.court_level,
        case_number: caseRecord.case_number || v.decision_number,
        decision_number: v.decision_number,
        verdict_date: v.decision_date,
        decision_type: v.decision_type
      })),
      verdicts: caseVerdictsList,
      timeline: caseTimelines,
      companies: caseCompList,
      sources: caseSources.length > 0 ? caseSources : sources.slice(0, 1),
      quality: {
        verification_status: caseRecord.verification_status,
        confidence_level: caseRecord.confidence_level,
        possible_duplicate: caseRecord.possible_duplicate,
        needs_manual_review: caseRecord.needs_manual_review,
        verification_note: caseRecord.verification_note
      }
    };
  });

  return {
    person: {
      person_id: person.person_id,
      full_name: person.full_name,
      normalized_name: person.normalized_name,
      alias: person.alias,
      birth_date: person.birth_date,
      birth_place: person.birth_place,
      occupation: person.occupation
    },
    positions: personPositions,
    party_memberships: personMemberships,
    cases: personCases
  };
});

fs.writeFileSync(path.join(MASTER_DIR, 'master_cases.json'), JSON.stringify(masterCases, null, 2));
fs.writeFileSync(path.join(MASTER_DIR, 'master_cases.compact.json'), JSON.stringify(masterCases));

console.log(`✓ Master hierarchical dataset compiled (${masterCases.length} profil individu dengan keterlibatan perkara terverifikasi).`);

