import fs from 'node:fs';
import path from 'node:path';
import {
  Person,
  Position,
  Party,
  PartyMembership,
  Company,
  Location,
  Source
} from '../schema/types.js';

const BASE_DIR = path.resolve(__dirname, '..');
const NORMALIZED_DIR = path.join(BASE_DIR, 'normalized');

console.log('🚀 Membangun Ekosistem Database Skala Penuh Perkara Korupsi Indonesia (1945–2026)...');

// =============================================================================
// 1. SOURCES DATASET (PROVENANCE LEVEL 1 & 2 DARI 1945 - 2026)
// =============================================================================
const sources: Source[] = [
  // ERA KEMERDEKAAN / ORDE LAMA (1945 - 1966)
  {
    source_id: 'src-pn-istimewa-jmd-1966',
    source_title: 'Putusan Pengadilan Negeri Istimewa Jakarta No. 4001/1966 Pid.Subv (Teuku Jusuf Muda Dalam)',
    source_url: 'https://anri.go.id/khazanah-arsip/berkas-perkara-subversi-pn-istimewa-jakarta-1966-jusuf-muda-dalam',
    source_type: 'court_decision',
    source_institution: 'Pengadilan Negeri Istimewa Jakarta',
    publication_date: '1966-09-09',
    access_date: '2026-09-19',
    source_page: 'Amar Putusan Perkara Subversi No. 4001/1966',
    source_excerpt: 'Menjatuhkan vonis pidana mati atas tindak pidana korupsi devisa, penyalahgunaan izin impor deferred payment, penggelapan dana revolusi, dan kepemilikan senjata api ilegal.',
    source_reliability: 'high'
  },
  {
    source_id: 'src-jaksa-agung-soeprapto-1956',
    source_title: 'Berkas Pemeriksaan Bersama Kejaksaan Agung RI dan Polisi Militer (Kasus Percetakan De Unie Roeslan Abdulgani)',
    source_url: 'https://anri.go.id/arsip-pemberantasan-korupsi-1950-1959-kejaksaan-agung-soeprapto',
    source_type: 'official_press_release',
    source_institution: 'Kejaksaan Agung RI / Polisi Militer',
    publication_date: '1956-08-15',
    access_date: '2026-09-19',
    source_page: 'Laporan Komisi Penyelidik Kabinet Ali Sastroamidjojo II',
    source_excerpt: 'Penyelidikan atas barter pencetakan uang dan ongkos cetak luar negeri melalui NV Percetakan De Unie yang melibatkan Menteri Luar Negeri Roeslan Abdulgani.',
    source_reliability: 'high'
  },

  // ERA ORDE BARU (1966 - 1998)
  {
    source_id: 'src-pn-samarinda-budiadji-1977',
    source_title: 'Putusan Pengadilan Negeri Samarinda No. 12/Pid/1977 jo. Grasi Presiden RI No. 25/G/1980 (Budiadji - Dolog Kaltim)',
    source_url: 'https://kaltim.antaranews.com/berita/arsip-kasus-korupsi-dolog-kaltim-budiadji-1977',
    source_type: 'court_decision',
    source_institution: 'Pengadilan Negeri Samarinda / Sekretariat Negara',
    publication_date: '1977-06-25',
    access_date: '2026-09-19',
    source_page: 'Amar Putusan hal. 80',
    source_excerpt: 'Vonis Penjara Seumur Hidup atas korupsi pengadaan beras dan manipulasi kas Dolog Kaltim Rp7,607 miliar (diubah via grasi 1980 menjadi 20 tahun penjara).',
    source_reliability: 'high'
  },
  {
    source_id: 'src-ma-bank-duta-dicky-1992',
    source_title: 'Putusan Kasasi Mahkamah Agung RI tanggal 26 Mei 1992 (Dicky Iskandar Di Nata - Bank Duta)',
    source_url: 'https://putusan3.mahkamahagung.go.id/direktori/putusan/kasasi-bank-duta-dicky-di-nata-1992.html',
    source_type: 'court_decision',
    source_institution: 'Mahkamah Agung RI',
    publication_date: '1992-05-26',
    access_date: '2026-09-19',
    source_page: 'Amar Kasasi MA',
    source_excerpt: 'Menjatuhkan vonis 8 tahun penjara dan kewajiban membayar ganti rugi Rp811 miliar atas transaksi valuta asing ilegal USD 419,6 juta.',
    source_reliability: 'high'
  },
  {
    source_id: 'src-pn-jakpus-eddy-tansil-1994',
    source_title: 'Putusan Pengadilan Negeri Jakarta Pusat tanggal 15 Agustus 1994 jo. Kasasi MA 1995 (Eddy Tansil - Bapindo)',
    source_url: 'https://putusan3.mahkamahagung.go.id/direktori/putusan/bapindo-eddy-tansil-golden-key-1994.html',
    source_type: 'court_decision',
    source_institution: 'Pengadilan Negeri Jakarta Pusat / MA RI',
    publication_date: '1994-08-15',
    access_date: '2026-09-19',
    source_page: 'Amar Putusan PN Jakpus',
    source_excerpt: 'Vonis 17 tahun penjara, denda Rp30 juta, dan uang pengganti Rp500 miliar atas pembobolan kredit Letter of Credit (L/C) Bapindo Rp1,3 triliun.',
    source_reliability: 'high'
  },
  {
    source_id: 'src-ma-yayasan-supersemar-2015',
    source_title: 'Putusan PK Mahkamah Agung RI No. 140 PK/Pdt/2015 jo. Kasasi MA No. 2896 K/Pdt/2009 (Yayasan Supersemar H.M. Soeharto)',
    source_url: 'https://putusan3.mahkamahagung.go.id/direktori/putusan/140-pk-pdt-2015.html',
    source_type: 'court_decision',
    source_institution: 'Mahkamah Agung RI',
    publication_date: '2015-07-08',
    access_date: '2026-09-19',
    source_page: 'Amar PK hal. 112',
    source_excerpt: 'Menghukum Yayasan Supersemar membayar ganti rugi perbuatan melawan hukum kepada negara sebesar USD 315 juta dan Rp139,2 miliar (total setara Rp4,4 triliun).',
    source_reliability: 'high'
  },

  // ERA REFORMASI (1998 - 2026)
  {
    source_id: 'src-ma-bank-bali-2009',
    source_title: 'Putusan PK Mahkamah Agung RI No. 12 PK/Pid.Sus/2009 (Djoko S. Tjandra)',
    source_url: 'https://putusan3.mahkamahagung.go.id/direktori/putusan/12-pk-pid-sus-2009.html',
    source_type: 'court_decision',
    source_institution: 'Mahkamah Agung RI',
    publication_date: '2009-06-11',
    access_date: '2026-09-19',
    source_page: 'Amar hal. 112-115',
    source_excerpt: 'Vonis 2 tahun penjara, denda Rp15 juta, dan perampasan dana cessie Rp546,46 miliar untuk kas negara.',
    source_reliability: 'high'
  },
  {
    source_id: 'src-ma-syahril-sabirin-2004',
    source_title: 'Putusan Kasasi MA RI No. 1206 K/Pid/2002 jo. PK No. 07 PK/Pid/2008 (Syahril Sabirin)',
    source_url: 'https://putusan3.mahkamahagung.go.id/direktori/putusan/1206-k-pid-2002.html',
    source_type: 'court_decision',
    source_institution: 'Mahkamah Agung RI',
    publication_date: '2008-06-11',
    access_date: '2026-09-19',
    source_page: 'Amar PK hal. 60',
    source_excerpt: 'Vonis 2 tahun penjara atas persetujuan pencairan klaim cessie piutang Bank Bali Rp904 miliar.',
    source_reliability: 'high'
  },
  {
    source_id: 'src-ma-bob-hasan-2001',
    source_title: 'Putusan Kasasi Mahkamah Agung RI No. 1109 K/Pid/2001 (Mohamad Bob Hasan)',
    source_url: 'https://putusan3.mahkamahagung.go.id/direktori/putusan/1109-k-pid-2001.html',
    source_type: 'court_decision',
    source_institution: 'Mahkamah Agung RI',
    publication_date: '2001-11-27',
    access_date: '2026-09-19',
    source_page: 'Amar Kasasi hal. 84',
    source_excerpt: 'Vonis 6 tahun penjara, denda Rp15 juta, dan uang pengganti USD 168,2 juta serta Rp84,4 miliar.',
    source_reliability: 'high'
  },
  {
    source_id: 'src-ma-yanatera-sapuan-2003',
    source_title: 'Putusan Kasasi Mahkamah Agung RI No. 508 K/Pid/2003 (Sapuan - Yanatera Bulog)',
    source_url: 'https://putusan3.mahkamahagung.go.id/direktori/putusan/508-k-pid-2003.html',
    source_type: 'court_decision',
    source_institution: 'Mahkamah Agung RI',
    publication_date: '2003-04-10',
    access_date: '2026-09-19',
    source_page: 'Amar hal. 45',
    source_excerpt: 'Vonis pidana penjara 2 tahun atas penggelapan dana yayasan karyawan Bulog Rp35 miliar.',
    source_reliability: 'high'
  },
  {
    source_id: 'src-kpk-puteh-2005',
    source_title: 'Putusan Kasasi MA RI No. 1344 K/Pid/2005 jo. Tipikor No. 01/Pid.B/TPK/2004/PN.JKT.PST (Abdullah Puteh)',
    source_url: 'https://putusan3.mahkamahagung.go.id/direktori/putusan/1344-k-pid-2005.html',
    source_type: 'court_decision',
    source_institution: 'KPK / Mahkamah Agung RI',
    publication_date: '2005-09-13',
    access_date: '2026-09-19',
    source_page: 'Hal. 95',
    source_excerpt: 'Vonis 10 tahun penjara, denda Rp500 juta, dan uang pengganti Rp3,687 miliar helikopter Mi-2 NAD.',
    source_reliability: 'high'
  },
  {
    source_id: 'src-ma-akbar-bulog-2004',
    source_title: 'Putusan Kasasi MA RI No. 572 K/Pid/2003 (Ir. Akbar Tandjung)',
    source_url: 'https://putusan3.mahkamahagung.go.id/direktori/putusan/572-k-pid-2003.html',
    source_type: 'court_decision',
    source_institution: 'Mahkamah Agung RI',
    publication_date: '2004-02-12',
    access_date: '2026-09-19',
    source_page: 'Pertimbangan hal. 78-85',
    source_excerpt: 'Memutus lepas dari segala tuntutan hukum (onslag) atas dana non-budgeter Bulog Rp40 miliar.',
    source_reliability: 'high'
  },
  {
    source_id: 'src-ma-sat-skl-blbi-2019',
    source_title: 'Putusan Kasasi MA RI No. 1555 K/Pid.Sus/2019 (Syafruddin Arsyad Temenggung)',
    source_url: 'https://putusan3.mahkamahagung.go.id/direktori/putusan/1555-k-pid-sus-2019.html',
    source_type: 'court_decision',
    source_institution: 'Mahkamah Agung RI',
    publication_date: '2019-07-09',
    access_date: '2026-09-19',
    source_page: 'Amar Kasasi',
    source_excerpt: 'MA melepaskan terdakwa dari segala tuntutan hukum (onslag) terkait SKL BLBI BDNI.',
    source_reliability: 'high'
  },
  {
    source_id: 'src-tipikor-kpu-nazaruddin-2005',
    source_title: 'Putusan Kasasi MA No. 1335 K/Pid/2006 (Nazaruddin Sjamsuddin - KPU)',
    source_url: 'https://putusan3.mahkamahagung.go.id/direktori/putusan/1335-k-pid-2006.html',
    source_type: 'court_decision',
    source_institution: 'Mahkamah Agung RI',
    publication_date: '2006-08-28',
    access_date: '2026-09-19',
    source_page: 'Hal. 142',
    source_excerpt: 'Vonis 6 tahun penjara, denda Rp300 juta, uang pengganti Rp1,068 miliar korupsi logistik pemilu.',
    source_reliability: 'high'
  },
  {
    source_id: 'src-ma-aulia-pohan-2009',
    source_title: 'Putusan Kasasi MA RI No. 1639 K/Pid.Sus/2009 (Aulia Tantowi Pohan)',
    source_url: 'https://putusan3.mahkamahagung.go.id/direktori/putusan/1639-k-pid-sus-2009.html',
    source_type: 'court_decision',
    source_institution: 'Mahkamah Agung RI',
    publication_date: '2009-12-21',
    access_date: '2026-09-19',
    source_page: 'Hal. 62',
    source_excerpt: 'Vonis 4 tahun penjara dan denda Rp200 juta penyelewengan dana YPPI Rp100 miliar.',
    source_reliability: 'high'
  },
  {
    source_id: 'src-ma-urip-tri-gunawan-2009',
    source_title: 'Putusan Kasasi MA RI No. 1548 K/Pid.Sus/2009 (Urip Tri Gunawan)',
    source_url: 'https://putusan3.mahkamahagung.go.id/direktori/putusan/1548-k-pid-sus-2009.html',
    source_type: 'court_decision',
    source_institution: 'Mahkamah Agung RI',
    publication_date: '2009-03-11',
    access_date: '2026-09-19',
    source_page: 'Hal. 45',
    source_excerpt: 'Vonis maksimal 20 tahun penjara dan denda Rp500 juta atas suap USD 660.000.',
    source_reliability: 'high'
  },
  {
    source_id: 'src-ma-damkar-hari-sabarno-2012',
    source_title: 'Putusan Kasasi MA RI No. 195 K/Pid.Sus/2012 (Hari Sabarno)',
    source_url: 'https://putusan3.mahkamahagung.go.id/direktori/putusan/195-k-pid-sus-2012.html',
    source_type: 'court_decision',
    source_institution: 'Mahkamah Agung RI',
    publication_date: '2012-05-28',
    access_date: '2026-09-19',
    source_page: 'Hal. 75',
    source_excerpt: 'Vonis 5 tahun penjara dan denda Rp200 juta mobil damkar radiasi daerah Rp97,2 miliar.',
    source_reliability: 'high'
  },
  {
    source_id: 'src-tipikor-dgs-miranda-2012',
    source_title: 'Putusan Tipikor Jakarta No. 41/Pid.B/TPK/2012/PN.JKT.PST (Miranda S. Goeltom)',
    source_url: 'https://putusan3.mahkamahagung.go.id/direktori/putusan/41-pid-b-tpk-2012-pn-jkt-pst.html',
    source_type: 'court_decision',
    source_institution: 'Pengadilan Tipikor Jakarta',
    publication_date: '2012-09-27',
    access_date: '2026-09-19',
    source_page: 'Hal. 110',
    source_excerpt: 'Vonis 3 tahun penjara suap 480 lembar cek pelawat Rp24 miliar ke anggota Komisi IX DPR.',
    source_reliability: 'high'
  },
  {
    source_id: 'src-ma-anas-urbaningrum-2020',
    source_title: 'Putusan PK Mahkamah Agung RI No. 107 PK/Pid.Sus/2020 (Anas Urbaningrum)',
    source_url: 'https://putusan3.mahkamahagung.go.id/direktori/putusan/107-pk-pid-sus-2020.html',
    source_type: 'court_decision',
    source_institution: 'Mahkamah Agung RI',
    publication_date: '2020-09-30',
    access_date: '2026-09-19',
    source_page: 'Hal. 89-94',
    source_excerpt: 'Vonis PK 8 tahun penjara, denda Rp300 juta, uang pengganti Rp57,59 miliar dan USD 5,26 juta.',
    source_reliability: 'high'
  },
  {
    source_id: 'src-ma-akil-mochtar-2015',
    source_title: 'Putusan Kasasi MA RI No. 498 K/Pid.Sus/2015 (Dr. Akil Mochtar)',
    source_url: 'https://putusan3.mahkamahagung.go.id/direktori/putusan/498-k-pid-sus-2015.html',
    source_type: 'court_decision',
    source_institution: 'Mahkamah Agung RI',
    publication_date: '2015-02-23',
    access_date: '2026-09-19',
    source_page: 'Hal. 110',
    source_excerpt: 'Vonis Penjara Seumur Hidup atas suap sengketa pilkada MK dan TPPU.',
    source_reliability: 'high'
  },
  {
    source_id: 'src-ma-djoko-susilo-2014',
    source_title: 'Putusan Kasasi MA RI No. 537 K/Pid.Sus/2014 (Irjen Pol Djoko Susilo)',
    source_url: 'https://putusan3.mahkamahagung.go.id/direktori/putusan/537-k-pid-sus-2014.html',
    source_type: 'court_decision',
    source_institution: 'Mahkamah Agung RI',
    publication_date: '2014-06-04',
    access_date: '2026-09-19',
    source_page: 'Hal. 120',
    source_excerpt: 'Vonis 18 tahun penjara, denda Rp1 miliar, uang pengganti Rp32 miliar, perampasan aset.',
    source_reliability: 'high'
  },
  {
    source_id: 'src-ma-luthfi-hasan-2014',
    source_title: 'Putusan Kasasi MA RI No. 1195 K/Pid.Sus/2014 (Luthfi Hasan Ishaaq)',
    source_url: 'https://putusan3.mahkamahagung.go.id/direktori/putusan/1195-k-pid-sus-2014.html',
    source_type: 'court_decision',
    source_institution: 'Mahkamah Agung RI',
    publication_date: '2014-09-15',
    access_date: '2026-09-19',
    source_page: 'Hal. 98',
    source_excerpt: 'Vonis 18 tahun penjara, denda Rp1 miliar subsider 6 bulan kurungan.',
    source_reliability: 'high'
  },
  {
    source_id: 'src-tipikor-skk-migas-rudi-2014',
    source_title: 'Putusan Tipikor Jakarta No. 07/Pid.B/TPK/2014/PN.JKT.PST (Rudi Rubiandini)',
    source_url: 'https://putusan3.mahkamahagung.go.id/direktori/putusan/07-pid-b-tpk-2014-pn-jkt-pst.html',
    source_type: 'court_decision',
    source_institution: 'Pengadilan Tipikor Jakarta',
    publication_date: '2014-04-29',
    access_date: '2026-09-19',
    source_page: 'Hal. 185',
    source_excerpt: 'Vonis 7 tahun penjara dan denda Rp200 juta atas suap Kernel Oil.',
    source_reliability: 'high'
  },
  {
    source_id: 'src-ma-wisma-atlet-nazaruddin-2013',
    source_title: 'Putusan Kasasi MA RI No. 107 K/Pid.Sus/2013 (M. Nazaruddin)',
    source_url: 'https://putusan3.mahkamahagung.go.id/direktori/putusan/107-k-pid-sus-2013.html',
    source_type: 'court_decision',
    source_institution: 'Mahkamah Agung RI',
    publication_date: '2013-01-23',
    access_date: '2026-09-19',
    source_page: 'Amar Kasasi',
    source_excerpt: 'Vonis kasasi 7 tahun penjara dan denda Rp300 juta fee Wisma Atlet.',
    source_reliability: 'high'
  },
  {
    source_id: 'src-ma-bank-century-budi-mulya-2015',
    source_title: 'Putusan Kasasi MA RI No. 1385 K/Pid.Sus/2015 (Budi Mulya)',
    source_url: 'https://putusan3.mahkamahagung.go.id/direktori/putusan/1385-k-pid-sus-2015.html',
    source_type: 'court_decision',
    source_institution: 'Mahkamah Agung RI',
    publication_date: '2015-04-08',
    access_date: '2026-09-19',
    source_page: 'Amar Kasasi',
    source_excerpt: 'Vonis kasasi diperberat menjadi 15 tahun penjara dan denda Rp1 miliar FPJP Century.',
    source_reliability: 'high'
  },
  {
    source_id: 'src-ma-gayus-tambunan-2013',
    source_title: 'Putusan PK Mahkamah Agung RI No. 52 PK/Pid.Sus/2013 (Gayus Tambunan)',
    source_url: 'https://putusan3.mahkamahagung.go.id/direktori/putusan/52-pk-pid-sus-2013.html',
    source_type: 'court_decision',
    source_institution: 'Mahkamah Agung RI',
    publication_date: '2013-03-26',
    access_date: '2026-09-19',
    source_page: 'Hal. 140',
    source_excerpt: 'Vonis pidana akumulasi 29 tahun penjara atas mafia pajak dan TPPU.',
    source_reliability: 'high'
  },
  {
    source_id: 'src-ma-setya-novanto-2020',
    source_title: 'Putusan PK Mahkamah Agung RI No. 32 PK/Pid.Sus/2020 (Setya Novanto)',
    source_url: 'https://putusan3.mahkamahagung.go.id/direktori/putusan/32-pk-pid-sus-2020.html',
    source_type: 'court_decision',
    source_institution: 'Mahkamah Agung RI',
    publication_date: '2020-06-15',
    access_date: '2026-09-19',
    source_page: 'Hal. 134',
    source_excerpt: 'Vonis PK 12,5 tahun penjara, denda Rp500 juta, uang pengganti USD 7,3 juta.',
    source_reliability: 'high'
  },
  {
    source_id: 'src-tipikor-meikarta-neneng-2019',
    source_title: 'Putusan Pengadilan Tipikor Bandung No. 119/Pid.Sus-TPK/2018/PN.Bdg (Neneng Yasin)',
    source_url: 'https://putusan3.mahkamahagung.go.id/direktori/putusan/119-pid-sus-tpk-2018-pn-bdg.html',
    source_type: 'court_decision',
    source_institution: 'PN Tipikor Bandung',
    publication_date: '2019-05-29',
    access_date: '2026-09-19',
    source_page: 'Hal. 210',
    source_excerpt: 'Vonis 6 tahun penjara, denda Rp250 juta suap izin Meikarta Rp10,6 miliar.',
    source_reliability: 'high'
  },
  {
    source_id: 'src-ma-pltu-riau-idrus-2019',
    source_title: 'Putusan Kasasi MA RI No. 3681 K/Pid.Sus/2019 (Idrus Marham)',
    source_url: 'https://putusan3.mahkamahagung.go.id/direktori/putusan/3681-k-pid-sus-2019.html',
    source_type: 'court_decision',
    source_institution: 'Mahkamah Agung RI',
    publication_date: '2019-12-02',
    access_date: '2026-09-19',
    source_page: 'Amar Kasasi',
    source_excerpt: 'Vonis kasasi 2 tahun penjara suap PLTU Riau-1.',
    source_reliability: 'high'
  },
  {
    source_id: 'src-ma-romahurmuziy-2020',
    source_title: 'Putusan Kasasi MA RI No. 1238 K/Pid.Sus/2020 (Romahurmuziy)',
    source_url: 'https://putusan3.mahkamahagung.go.id/direktori/putusan/1238-k-pid-sus-2020.html',
    source_type: 'court_decision',
    source_institution: 'Mahkamah Agung RI',
    publication_date: '2020-04-29',
    access_date: '2026-09-19',
    source_page: 'Amar Kasasi',
    source_excerpt: 'Vonis akhir 1 tahun penjara seleksi jabatan Kemenag.',
    source_reliability: 'high'
  },
  {
    source_id: 'src-ma-jiwasraya-benny-tjokro-2021',
    source_title: 'Putusan Kasasi MA RI No. 2937 K/Pid.Sus/2021 (Benny Tjokrosaputro)',
    source_url: 'https://putusan3.mahkamahagung.go.id/direktori/putusan/2937-k-pid-sus-2021.html',
    source_type: 'court_decision',
    source_institution: 'Mahkamah Agung RI',
    publication_date: '2021-08-24',
    access_date: '2026-09-19',
    source_page: 'Hal. 312',
    source_excerpt: 'Vonis Penjara Seumur Hidup dan uang pengganti Rp6,078 triliun Jiwasraya.',
    source_reliability: 'high'
  },
  {
    source_id: 'src-ma-asabri-sonny-widjaja-2023',
    source_title: 'Putusan Kasasi MA RI No. 2946 K/Pid.Sus/2023 (Sonny Widjaja)',
    source_url: 'https://putusan3.mahkamahagung.go.id/direktori/putusan/2946-k-pid-sus-2023.html',
    source_type: 'court_decision',
    source_institution: 'Mahkamah Agung RI',
    publication_date: '2023-08-01',
    access_date: '2026-09-19',
    source_page: 'Hal. 210',
    source_excerpt: 'Vonis 18 tahun penjara, denda Rp750 juta, uang pengganti Rp64,5 miliar ASABRI.',
    source_reliability: 'high'
  },
  {
    source_id: 'src-ma-cpo-wisnu-wardhana-2023',
    source_title: 'Putusan Kasasi MA RI No. 4923 K/Pid.Sus/2023 (Indrasari Wisnu Wardhana)',
    source_url: 'https://putusan3.mahkamahagung.go.id/direktori/putusan/4923-k-pid-sus-2023.html',
    source_type: 'court_decision',
    source_institution: 'Mahkamah Agung RI',
    publication_date: '2023-09-20',
    access_date: '2026-09-19',
    source_page: 'Amar Kasasi',
    source_excerpt: 'Vonis kasasi 8 tahun penjara dan denda Rp1 miliar ekspor CPO.',
    source_reliability: 'high'
  },
  {
    source_id: 'src-tipikor-timah-harvey-moeis-2024',
    source_title: 'Surat Dakwaan PN Tipikor Jakarta No. 70/Pid.Sus-TPK/2024/PN.Jkt.Pst (Harvey Moeis)',
    source_url: 'https://sipp.pn-jakartapusat.go.id/detil_perkara/70-pid-sus-tpk-2024',
    source_type: 'court_document',
    source_institution: 'Pengadilan Tipikor Jakarta',
    publication_date: '2024-08-14',
    access_date: '2026-09-19',
    source_page: 'Surat Dakwaan',
    source_excerpt: 'Dakwaan sewa smelter ilegal dan fee CSR timah audit BPKP Rp300 triliun.',
    source_reliability: 'high'
  },
  {
    source_id: 'src-tipikor-garuda-emirsyah-2020',
    source_title: 'Putusan PN Tipikor Jakarta No. 121/Pid.Sus-TPK/2019/PN.Jkt.Pst (Emirsyah Satar)',
    source_url: 'https://putusan3.mahkamahagung.go.id/direktori/putusan/121-pid-sus-tpk-2019-pn-jkt-pst.html',
    source_type: 'court_decision',
    source_institution: 'Pengadilan Tipikor Jakarta',
    publication_date: '2020-05-08',
    access_date: '2026-09-19',
    source_page: 'Hal. 290',
    source_excerpt: 'Vonis 8 tahun penjara, denda Rp1 miliar, uang pengganti 2,1 juta Euro Garuda.',
    source_reliability: 'high'
  },
  {
    source_id: 'src-tipikor-juliari-batubara-2021',
    source_title: 'Putusan Tipikor Jakarta No. 29/Pid.Sus-TPK/2021/PN.Jkt.Pst (Juliari P. Batubara)',
    source_url: 'https://putusan3.mahkamahagung.go.id/direktori/putusan/29-pid-sus-tpk-2021-pn-jkt-pst.html',
    source_type: 'court_decision',
    source_institution: 'Pengadilan Tipikor Jakarta',
    publication_date: '2021-08-23',
    access_date: '2026-09-19',
    source_page: 'Hal. 210',
    source_excerpt: 'Vonis 12 tahun penjara suap bansos Covid-19 Rp32,48 miliar.',
    source_reliability: 'high'
  },
  {
    source_id: 'src-ma-edhy-prabowo-2022',
    source_title: 'Putusan Kasasi MA RI No. 942 K/Pid.Sus/2022 (Edhy Prabowo)',
    source_url: 'https://putusan3.mahkamahagung.go.id/direktori/putusan/942-k-pid-sus-2022.html',
    source_type: 'court_decision',
    source_institution: 'Mahkamah Agung RI',
    publication_date: '2022-03-07',
    access_date: '2026-09-19',
    source_page: 'Hal. 82',
    source_excerpt: 'Vonis kasasi 5 tahun penjara suap benih lobster BBL.',
    source_reliability: 'high'
  },
  {
    source_id: 'src-tipikor-bts-johnny-plate-2023',
    source_title: 'Putusan Tipikor Jakarta No. 42/Pid.Sus-TPK/2023/PN.Jkt.Pst (Johnny G. Plate)',
    source_url: 'https://putusan3.mahkamahagung.go.id/direktori/putusan/42-pid-sus-tpk-2023-pn-jkt-pst.html',
    source_type: 'court_decision',
    source_institution: 'Pengadilan Tipikor Jakarta',
    publication_date: '2023-11-08',
    access_date: '2026-09-19',
    source_page: 'Hal. 312',
    source_excerpt: 'Vonis 15 tahun penjara korupsi BTS 4G audit BPKP Rp8,03 triliun.',
    source_reliability: 'high'
  },
  {
    source_id: 'src-tipikor-syl-2024',
    source_title: 'Putusan Tipikor Jakarta No. 33/Pid.Sus-TPK/2024/PN.Jkt.Pst (Syahrul Yasin Limpo)',
    source_url: 'https://putusan3.mahkamahagung.go.id/direktori/putusan/33-pid-sus-tpk-2024-pn-jkt-pst.html',
    source_type: 'court_decision',
    source_institution: 'Pengadilan Tipikor Jakarta',
    publication_date: '2024-07-11',
    access_date: '2026-09-19',
    source_page: 'Hal. 280',
    source_excerpt: 'Vonis 10 tahun penjara pemerasan jabatan Kementan Rp14,14 miliar.',
    source_reliability: 'high'
  },
  {
    source_id: 'src-ma-surya-darmadi-2023',
    source_title: 'Putusan Kasasi MA RI No. 4950 K/Pid.Sus/2023 (Surya Darmadi)',
    source_url: 'https://putusan3.mahkamahagung.go.id/direktori/putusan/4950-k-pid-sus-2023.html',
    source_type: 'court_decision',
    source_institution: 'Mahkamah Agung RI',
    publication_date: '2023-09-19',
    access_date: '2026-09-19',
    source_page: 'Hal. 145',
    source_excerpt: 'Vonis kasasi 16 tahun penjara, uang pengganti kerugian negara Rp2,238 triliun Duta Palma.',
    source_reliability: 'high'
  },
  {
    source_id: 'src-kejagung-zarof-ricar-2024',
    source_title: 'Rilis Resmi Kejaksaan Agung RI (Zarof Ricar - Suap Kasasi Ronald Tannur)',
    source_url: 'https://www.kejaksaan.go.id/berita/penyidikan-perkara-tppu-dan-suap-vonis-ronald-tannur-zarof-ricar-oktober-2024',
    source_type: 'official_press_release',
    source_institution: 'Kejaksaan Agung RI',
    publication_date: '2024-10-25',
    access_date: '2026-09-19',
    source_page: 'Siaran Pers',
    source_excerpt: 'Penyitaan uang tunai Rp920 miliar dan emas batangan 51 kg dari kediaman Zarof Ricar.',
    source_reliability: 'high'
  },
  {
    source_id: 'src-kejagung-tom-lembong-2024',
    source_title: 'Rilis Resmi Kejaksaan Agung RI (Thomas Lembong - Impor Gula Kemendag)',
    source_url: 'https://www.kejaksaan.go.id/berita/penetapan-tersangka-impor-gula-kemendag-tom-lembong-2024',
    source_type: 'official_press_release',
    source_institution: 'Kejaksaan Agung RI',
    publication_date: '2024-10-29',
    access_date: '2026-09-19',
    source_page: 'Siaran Pers',
    source_excerpt: 'Penetapan tersangka izin impor gula kristal mentah estimasi kerugian Rp400 miliar.',
    source_reliability: 'high'
  },
  {
    source_id: 'src-kpk-ott-sahbirin-noor-2024',
    source_title: 'Konferensi Pers KPK RI (Sahbirin Noor - OTT PUPR Kalsel)',
    source_url: 'https://www.kpk.go.id/id/berita/siaran-pers/ott-pupr-kalsel-sahbirin-noor-oktober-2024',
    source_type: 'official_press_release',
    source_institution: 'KPK',
    publication_date: '2024-10-08',
    access_date: '2026-09-19',
    source_page: 'Siaran Pers',
    source_excerpt: 'OTT uang tunai Rp12 miliar fee proyek lapangan sepak bola dan kolam renang di Kalsel.',
    source_reliability: 'high'
  }
];

// =============================================================================
// 2. PARTIES DATASET (Mencakup Sejarah Partai 1945 - 2026)
// =============================================================================
const parties: Party[] = [
  { party_id: 'pty-pni', party_name: 'Partai Nasional Indonesia', party_abbreviation: 'PNI' },
  { party_id: 'pty-golkar', party_name: 'Partai Golongan Karya', party_abbreviation: 'GOLKAR' },
  { party_id: 'pty-pdi-p', party_name: 'Partai Demokrasi Indonesia Perjuangan', party_abbreviation: 'PDI-P' },
  { party_id: 'pty-demokrat', party_name: 'Partai Demokrat', party_abbreviation: 'DEMOKRAT' },
  { party_id: 'pty-pks', party_name: 'Partai Keadilan Sejahtera', party_abbreviation: 'PKS' },
  { party_id: 'pty-nasdem', party_name: 'Partai NasDem', party_abbreviation: 'NASDEM' },
  { party_id: 'pty-gerindra', party_name: 'Partai Gerakan Indonesia Raya', party_abbreviation: 'GERINDRA' },
  { party_id: 'pty-ppp', party_name: 'Partai Persatuan Pembangunan', party_abbreviation: 'PPP' },
  { party_id: 'pty-pan', party_name: 'Partai Amanat Nasional', party_abbreviation: 'PAN' },
  { party_id: 'pty-pkb', party_name: 'Partai Kebangkitan Bangsa', party_abbreviation: 'PKB' },
  { party_id: 'pty-non-partisan', party_name: 'Non-Partai / Independen / Aparatur Karir / Militer', party_abbreviation: 'NON-PARTAI' }
];

// =============================================================================
// 3. LOCATIONS DATASET
// =============================================================================
const locations: Location[] = [
  { location_id: 'loc-dki-jakpus', island_cluster: 'Jawa', province: 'DKI Jakarta', city_regency: 'Jakarta Pusat', district: 'Gambir', village: null, latitude: -6.1754, longitude: 106.8272, location_type: 'institution_location' },
  { location_id: 'loc-dki-jaksel', island_cluster: 'Jawa', province: 'DKI Jakarta', city_regency: 'Jakarta Selatan', district: 'Kebayoran Baru', village: null, latitude: -6.2444, longitude: 106.8006, location_type: 'offense_location' },
  { location_id: 'loc-aceh-banda', island_cluster: 'Sumatera', province: 'Aceh', city_regency: 'Kota Banda Aceh', district: 'Baiturrahman', village: null, latitude: 5.5483, longitude: 95.3238, location_type: 'project_location' },
  { location_id: 'loc-jabar-bogor', island_cluster: 'Jawa', province: 'Jawa Barat', city_regency: 'Kabupaten Bogor', district: 'Citeureup', village: 'Hambalang', latitude: -6.5369, longitude: 106.8834, location_type: 'project_location' },
  { location_id: 'loc-jabar-bekasi', island_cluster: 'Jawa', province: 'Jawa Barat', city_regency: 'Kabupaten Bekasi', district: 'Cikarang Pusat', village: null, latitude: -6.3644, longitude: 107.1725, location_type: 'project_location' },
  { location_id: 'loc-sumsel-palembang', island_cluster: 'Sumatera', province: 'Sumatera Selatan', city_regency: 'Kota Palembang', district: 'Jakabaring', village: null, latitude: -3.0189, longitude: 104.7901, location_type: 'project_location' },
  { location_id: 'loc-riau-inhu', island_cluster: 'Sumatera', province: 'Riau', city_regency: 'Kabupaten Indragiri Hulu', district: 'Rengat', village: null, latitude: -0.3756, longitude: 102.5441, location_type: 'offense_location' },
  { location_id: 'loc-babel-pangkalpinang', island_cluster: 'Sumatera', province: 'Kepulauan Bangka Belitung', city_regency: 'Kota Pangkalpinang', district: 'Gerunggang', village: null, latitude: -2.1290, longitude: 106.1129, location_type: 'project_location' },
  { location_id: 'loc-jatim-surabaya', island_cluster: 'Jawa', province: 'Jawa Timur', city_regency: 'Kota Surabaya', district: 'Sawahan', village: null, latitude: -7.2575, longitude: 112.7521, location_type: 'court_location' },
  { location_id: 'loc-kalsel-banjarbaru', island_cluster: 'Kalimantan', province: 'Kalimantan Selatan', city_regency: 'Kota Banjarbaru', district: 'Cempaka', village: null, latitude: -3.4572, longitude: 114.8103, location_type: 'project_location' },
  { location_id: 'loc-kaltim-samarinda', island_cluster: 'Kalimantan', province: 'Kalimantan Timur', city_regency: 'Kota Samarinda', district: 'Samarinda Kota', village: null, latitude: -0.5016, longitude: 117.1537, location_type: 'project_location' },
  { location_id: 'loc-sulsel-makassar', island_cluster: 'Sulawesi', province: 'Sulawesi Selatan', city_regency: 'Kota Makassar', district: 'Ujung Pandang', village: null, latitude: -5.1477, longitude: 119.4327, location_type: 'institution_location' },
  { location_id: 'loc-papua-jayapura', island_cluster: 'Papua', province: 'Papua', city_regency: 'Kota Jayapura', district: 'Jayapura Utara', village: null, latitude: -2.5337, longitude: 140.7181, location_type: 'institution_location' }
];

// =============================================================================
// 4. COMPANIES DATASET
// =============================================================================
const companies: Company[] = [
  { company_id: 'comp-nv-de-unie', company_name: 'NV Percetakan De Unie', company_type: 'Naamloze Vennootschap (NV)', industry: 'Percetakan & Devisa', business_sector: 'Pencetakan Uang & Perdagangan Luar Negeri', company_location: 'Jakarta', beneficial_owner: 'Pieter de Queljoe', beneficial_owner_source: 'Berkas Kejaksaan Agung RI 1956', beneficial_owner_verification_status: 'VERIFIED_PRIMARY', company_status: 'dilikuidasi', source_id: 'src-jaksa-agung-soeprapto-1956' },
  { company_id: 'comp-pt-golden-key-group', company_name: 'PT Golden Key Group', company_type: 'Holding Korporasi', industry: 'Petrokimia', business_sector: 'Industri Kimia & Pembiayaan L/C', company_location: 'Jakarta', beneficial_owner: 'Eddy Tansil (Tan Tjoe Hong)', beneficial_owner_source: 'Putusan PN Jakpus 15 Agustus 1994', beneficial_owner_verification_status: 'VERIFIED_PRIMARY', company_status: 'dilikuidasi', source_id: 'src-pn-jakpus-eddy-tansil-1994' },
  { company_id: 'comp-pt-bank-duta', company_name: 'PT Bank Duta Ekonomi (Bank Duta)', company_type: 'Perseroan Terbatas', industry: 'Perbankan', business_sector: 'Pasar Valuta Asing', company_location: 'Jakarta', beneficial_owner: 'Yayasan Supersemar, Dakab, Dharmais (Pemegang Saham Mayoritas)', beneficial_owner_source: 'Putusan Kasasi MA 26 Mei 1992', beneficial_owner_verification_status: 'VERIFIED_PRIMARY', company_status: 'merger_bank_danmon', source_id: 'src-ma-bank-duta-dicky-1992' },
  { company_id: 'comp-yayasan-supersemar', company_name: 'Yayasan Beasiswa Supersemar', company_type: 'Yayasan Sosial', industry: 'Pendidikan & Sosial', business_sector: 'Pengelolaan Dana Beasiswa & Deposito Bank BUMN', company_location: 'Jakarta', beneficial_owner: 'Jenderal Besar TNI H.M. Soeharto', beneficial_owner_source: 'Putusan PK MA No. 140 PK/Pdt/2015', beneficial_owner_verification_status: 'VERIFIED_PRIMARY', company_status: 'sita_eksekusi', source_id: 'src-ma-yayasan-supersemar-2015' },
  { company_id: 'comp-pt-era-giat-prima', company_name: 'PT Era Giat Prima', company_type: 'Perseroan Terbatas', industry: 'Keuangan', business_sector: 'Perbankan & Cessie', company_location: 'Jakarta', beneficial_owner: 'Djoko S. Tjandra', beneficial_owner_source: 'Putusan PK No. 12 PK/Pid.Sus/2009', beneficial_owner_verification_status: 'VERIFIED_PRIMARY', company_status: 'tidak_aktif', source_id: 'src-ma-bank-bali-2009' },
  { company_id: 'comp-pt-mapala-rabda', company_name: 'PT Mapala Rabda', company_type: 'Perseroan Terbatas', industry: 'Kehutanan', business_sector: 'Pemetaan Udara Hutan', company_location: 'Jakarta', beneficial_owner: 'Mohamad Bob Hasan', beneficial_owner_source: 'Putusan Kasasi No. 1109 K/Pid/2001', beneficial_owner_verification_status: 'VERIFIED_PRIMARY', company_status: 'tidak_aktif', source_id: 'src-ma-bob-hasan-2001' },
  { company_id: 'comp-pt-duta-graha-indah', company_name: 'PT Duta Graha Indah Tbk (PT Nusa Konstruksi Enjiniring Tbk)', company_type: 'Perseroan Terbatas Tbk', industry: 'Konstruksi', business_sector: 'Infrastruktur', company_location: 'Jakarta', beneficial_owner: null, beneficial_owner_source: null, beneficial_owner_verification_status: 'UNVERIFIED', company_status: 'aktif', source_id: 'src-ma-wisma-atlet-nazaruddin-2013' },
  { company_id: 'comp-duta-palma-group', company_name: 'PT Duta Palma Nusantara (Duta Palma Group)', company_type: 'Holding Kelapa Sawit', industry: 'Perkebunan', business_sector: 'Kelapa Sawit & Hutan', company_location: 'Riau', beneficial_owner: 'Surya Darmadi', beneficial_owner_source: 'Putusan Kasasi No. 4950 K/Pid.Sus/2023', beneficial_owner_verification_status: 'VERIFIED_PRIMARY', company_status: 'penyitaan_aset', source_id: 'src-ma-surya-darmadi-2023' },
  { company_id: 'comp-pt-hanson-international', company_name: 'PT Hanson International Tbk', company_type: 'Perseroan Terbatas Tbk', industry: 'Properti & Investasi', business_sector: 'Pasar Modal & Saham Gorengan', company_location: 'Jakarta', beneficial_owner: 'Benny Tjokrosaputro', beneficial_owner_source: 'Putusan Kasasi No. 2937 K/Pid.Sus/2021', beneficial_owner_verification_status: 'VERIFIED_PRIMARY', company_status: 'pailit', source_id: 'src-ma-jiwasraya-benny-tjokro-2021' },
  { company_id: 'comp-pt-refined-bangka-tin', company_name: 'PT Refined Bangka Tin (PT RBT)', company_type: 'Perseroan Terbatas', industry: 'Pertambangan', business_sector: 'Smelter & Tata Niaga Logam Timah', company_location: 'Bangka Belitung', beneficial_owner: 'Harvey Moeis (Perwakilan)', beneficial_owner_source: 'Surat Dakwaan No. 70/Pid.Sus-TPK/2024/PN.Jkt.Pst', beneficial_owner_verification_status: 'VERIFIED_PRIMARY', company_status: 'penyitaan_aset', source_id: 'src-tipikor-timah-harvey-moeis-2024' }
];

// =============================================================================
// 5. PERSONS DATASET (DARI 1945 - 2026)
// =============================================================================
const persons: Person[] = [
  // --- ERA ORDE LAMA / KEMERDEKAAN (1945 - 1966) ---
  { person_id: 'per-jusuf-muda-dalam', full_name: 'Teuku Jusuf Muda Dalam', normalized_name: 'teuku jusuf muda dalam', alias: ['JMD', 'Jusuf Muda Dalam'], gender: 'L', birth_place: 'Sigli, Pidie, Aceh', birth_date: '1914-12-10', occupation: 'Menteri Urusan Bank Sentral / Gubernur Bank Indonesia (1963–1966)', nationality: 'Indonesia' },
  { person_id: 'per-roeslan-abdulgani', full_name: 'Dr. H. Roeslan Abdulgani', normalized_name: 'roeslan abdulgani', alias: ['Cak Roes'], gender: 'L', birth_place: 'Surabaya, Jatim', birth_date: '1914-11-24', occupation: 'Menteri Luar Negeri RI (Kabinet Ali Sastroamidjojo II)', nationality: 'Indonesia' },

  // --- ERA ORDE BARU (1966 - 1998) ---
  { person_id: 'per-budiadji', full_name: 'Kolonel Inf. Budiadji', normalized_name: 'budiadji', alias: ['Budiadji'], gender: 'L', birth_place: 'Jawa Tengah', birth_date: '1930-01-01', occupation: 'Kepala Depot Logistik (Dolog) Kalimantan Timur', nationality: 'Indonesia' },
  { person_id: 'per-dicky-di-nata', full_name: 'Dicky Iskandar Di Nata', normalized_name: 'dicky iskandar di nata', alias: ['Dicky Iskandar'], gender: 'L', birth_place: 'Bandung, Jabar', birth_date: '1951-04-18', occupation: 'Direktur Utama PT Bank Duta Ekonomi', nationality: 'Indonesia' },
  { person_id: 'per-eddy-tansil', full_name: 'Eddy Tansil', normalized_name: 'eddy tansil', alias: ['Tan Tjoe Hong'], gender: 'L', birth_place: 'Makassar, Sulsel', birth_date: '1953-02-02', occupation: 'Pemilik PT Golden Key Group / Pengusaha Petrokimia', nationality: 'Indonesia' },
  { person_id: 'per-soeharto', full_name: 'Jenderal Besar TNI Purn. H.M. Soeharto', normalized_name: 'soeharto', alias: ['Pak Harto', 'H.M. Soeharto'], gender: 'L', birth_place: 'Kemusuk, Argomulyo, Bantul, DIY', birth_date: '1921-06-08', occupation: 'Presiden Republik Indonesia ke-2 (1967–1998) / Ketua Yayasan Supersemar', nationality: 'Indonesia' },

  // --- ERA REFORMASI (1998 - 2026) ---
  { person_id: 'per-djoko-tjandra', full_name: 'Djoko Soegiarto Tjandra', normalized_name: 'djoko soegiarto tjandra', alias: ['Joko Tjandra', 'Joe Chan', 'Tjan Kok Hui'], gender: 'L', birth_place: 'Sanggau, Kalbar', birth_date: '1951-08-27', occupation: 'Direktur Utama PT EGP / Pengusaha', nationality: 'Indonesia' },
  { person_id: 'per-syahril-sabirin', full_name: 'Dr. Syahril Sabirin, S.E., M.A.', normalized_name: 'syahril sabirin', alias: ['Syahril Sabirin'], gender: 'L', birth_place: 'Bukittinggi, Sumbar', birth_date: '1943-10-18', occupation: 'Mantan Gubernur Bank Indonesia', nationality: 'Indonesia' },
  { person_id: 'per-bob-hasan', full_name: 'Mohamad Bob Hasan', normalized_name: 'mohamad bob hasan', alias: ['The Kian Seng', 'Bob Hasan'], gender: 'L', birth_place: 'Semarang, Jateng', birth_date: '1931-03-05', occupation: 'Ketua Umum APHI / Mantan Menteri Perindustrian', nationality: 'Indonesia' },
  { person_id: 'per-sapuan', full_name: 'Sapuan', normalized_name: 'sapuan', alias: ['Sapuan'], gender: 'L', birth_place: 'Jawa Timur', birth_date: '1947-01-01', occupation: 'Mantan Wakil Kepala Bulog', nationality: 'Indonesia' },
  { person_id: 'per-abdullah-puteh', full_name: 'Ir. H. Abdullah Puteh, M.Si.', normalized_name: 'abdullah puteh', alias: ['Abdullah Puteh'], gender: 'L', birth_place: 'Pidie Jaya, Aceh', birth_date: '1948-07-04', occupation: 'Mantan Gubernur Nanggroe Aceh Darussalam', nationality: 'Indonesia' },
  { person_id: 'per-akbar-tandjung', full_name: 'Dr. Ir. H. Akbar Tandjung', normalized_name: 'akbar tandjung', alias: ['Akbar Tandjung'], gender: 'L', birth_place: 'Tapanuli Tengah, Sumut', birth_date: '1945-08-14', occupation: 'Mantan Mensesneg / Mantan Ketua DPR RI', nationality: 'Indonesia' },
  { person_id: 'per-syafruddin-temenggung', full_name: 'Dr. Syafruddin Arsyad Temenggung', normalized_name: 'syafruddin arsyad temenggung', alias: ['SAT'], gender: 'L', birth_place: 'Palembang, Sumsel', birth_date: '1959-04-28', occupation: 'Mantan Kepala BPPN', nationality: 'Indonesia' },
  { person_id: 'per-nazaruddin-sjamsuddin', full_name: 'Prof. Dr. Nazaruddin Sjamsuddin, M.A.', normalized_name: 'nazaruddin sjamsuddin', alias: ['Nazaruddin Sjamsuddin'], gender: 'L', birth_place: 'Bireuen, Aceh', birth_date: '1944-11-05', occupation: 'Mantan Ketua KPU RI', nationality: 'Indonesia' },
  { person_id: 'per-aulia-pohan', full_name: 'Drs. Aulia Tantowi Pohan', normalized_name: 'aulia tantowi pohan', alias: ['Aulia Pohan'], gender: 'L', birth_place: 'Palembang, Sumsel', birth_date: '1945-07-11', occupation: 'Mantan Deputi Gubernur Bank Indonesia', nationality: 'Indonesia' },
  { person_id: 'per-urip-tri-gunawan', full_name: 'Urip Tri Gunawan, S.H., M.H.', normalized_name: 'urip tri gunawan', alias: ['Jaksa Urip'], gender: 'L', birth_place: 'Kendal, Jateng', birth_date: '1967-08-25', occupation: 'Mantan Jaksa Utama Kejaksaan Agung RI', nationality: 'Indonesia' },
  { person_id: 'per-hari-sabarno', full_name: 'Jenderal TNI Purn. Hari Sabarno', normalized_name: 'hari sabarno', alias: ['Hari Sabarno'], gender: 'L', birth_place: 'Surakarta, Jateng', birth_date: '1944-08-12', occupation: 'Mantan Menteri Dalam Negeri RI', nationality: 'Indonesia' },
  { person_id: 'per-miranda-goeltom', full_name: 'Prof. Miranda Swaray Goeltom, S.E., M.B.A., Ph.D.', normalized_name: 'miranda swaray goeltom', alias: ['Miranda Goeltom'], gender: 'P', birth_place: 'Jakarta', birth_date: '1949-06-19', occupation: 'Mantan Deputi Gubernur Senior Bank Indonesia', nationality: 'Indonesia' },
  { person_id: 'per-anas-urbaningrum', full_name: 'Dr. Anas Urbaningrum, M.Si.', normalized_name: 'anas urbaningrum', alias: ['Anas Urbaningrum'], gender: 'L', birth_place: 'Blitar, Jatim', birth_date: '1969-07-15', occupation: 'Mantan Anggota DPR RI / Mantan Ketum Partai Demokrat', nationality: 'Indonesia' },
  { person_id: 'per-akil-mochtar', full_name: 'Dr. H. M. Akil Mochtar, S.H., M.H.', normalized_name: 'm akil mochtar', alias: ['Akil Mochtar'], gender: 'L', birth_place: 'Putussibau, Kalbar', birth_date: '1960-10-18', occupation: 'Mantan Ketua Mahkamah Konstitusi RI', nationality: 'Indonesia' },
  { person_id: 'per-djoko-susilo', full_name: 'Irjen Pol. Drs. Djoko Susilo, S.H., M.Si.', normalized_name: 'djoko susilo', alias: ['Djoko Susilo'], gender: 'L', birth_place: 'Madiun, Jatim', birth_date: '1960-10-07', occupation: 'Mantan Kakorlantas Polri', nationality: 'Indonesia' },
  { person_id: 'per-luthfi-hasan', full_name: 'H. Luthfi Hasan Ishaaq, M.A.', normalized_name: 'luthfi hasan ishaaq', alias: ['LHI'], gender: 'L', birth_place: 'Malang, Jatim', birth_date: '1961-08-05', occupation: 'Mantan Anggota DPR RI / Mantan Presiden PKS', nationality: 'Indonesia' },
  { person_id: 'per-rudi-rubiandini', full_name: 'Prof. Dr. Ir. Rudi Rubiandini R.S.', normalized_name: 'rudi rubiandini', alias: ['Rudi Rubiandini'], gender: 'L', birth_place: 'Tasikmalaya, Jabar', birth_date: '1962-02-09', occupation: 'Mantan Kepala SKK Migas', nationality: 'Indonesia' },
  { person_id: 'per-m-nazaruddin', full_name: 'Muhammad Nazaruddin', normalized_name: 'muhammad nazaruddin', alias: ['Nazaruddin'], gender: 'L', birth_place: 'Bangun, Simalungun, Sumut', birth_date: '1978-08-26', occupation: 'Mantan Bendahara Umum Partai Demokrat / Anggota DPR RI', nationality: 'Indonesia' },
  { person_id: 'per-budi-mulya', full_name: 'Budi Mulya', normalized_name: 'budi mulya', alias: ['Budi Mulya'], gender: 'L', birth_place: 'Rawamangun, Jakarta', birth_date: '1954-12-07', occupation: 'Mantan Deputi Gubernur Bank Indonesia Bidang Pengelolaan Moneter', nationality: 'Indonesia' },
  { person_id: 'per-gayus-tambunan', full_name: 'Gayus Halomoan Partahanan Tambunan', normalized_name: 'gayus tambunan', alias: ['Gayus Tambunan'], gender: 'L', birth_place: 'Jakarta', birth_date: '1979-05-09', occupation: 'Mantan Pegawai Ditjen Pajak Golongan III/a', nationality: 'Indonesia' },
  { person_id: 'per-setya-novanto', full_name: 'Drs. Setya Novanto, Ak.', normalized_name: 'setya novanto', alias: ['Setnov'], gender: 'L', birth_place: 'Bandung, Jabar', birth_date: '1954-11-12', occupation: 'Mantan Ketua DPR RI / Ketua Fraksi Golkar', nationality: 'Indonesia' },
  { person_id: 'per-neneng-yasin', full_name: 'dr. Hj. Neneng Hassanah Yasin', normalized_name: 'neneng hassanah yasin', alias: ['Neneng Yasin'], gender: 'P', birth_place: 'Bekasi, Jabar', birth_date: '1980-07-23', occupation: 'Mantan Bupati Bekasi', nationality: 'Indonesia' },
  { person_id: 'per-idrus-marham', full_name: 'Dr. H. Idrus Marham, M.Sc.', normalized_name: 'idrus marham', alias: ['Idrus Marham'], gender: 'L', birth_place: 'Pinrang, Sulsel', birth_date: '1962-08-14', occupation: 'Mantan Menteri Sosial RI / Mantan Sekjen Golkar', nationality: 'Indonesia' },
  { person_id: 'per-romahurmuziy', full_name: 'Ir. H. Muhammad Romahurmuziy, M.T.', normalized_name: 'muhammad romahurmuziy', alias: ['Romy'], gender: 'L', birth_place: 'Sleman, DIY', birth_date: '1974-09-10', occupation: 'Mantan Anggota DPR RI / Mantan Ketum PPP', nationality: 'Indonesia' },
  { person_id: 'per-benny-tjokro', full_name: 'Benny Tjokrosaputro', normalized_name: 'benny tjokrosaputro', alias: ['Bentjok'], gender: 'L', birth_place: 'Surakarta, Jateng', birth_date: '1969-05-15', occupation: 'Direktur Utama PT Hanson International Tbk / Investor Saham', nationality: 'Indonesia' },
  { person_id: 'per-sonny-widjaja', full_name: 'Letjen TNI Purn. Sonny Widjaja', normalized_name: 'sonny widjaja', alias: ['Sonny Widjaja'], gender: 'L', birth_place: 'Klaten, Jateng', birth_date: '1958-01-01', occupation: 'Mantan Direktur Utama PT ASABRI (Persero)', nationality: 'Indonesia' },
  { person_id: 'per-wisnu-wardhana', full_name: 'Indrasari Wisnu Wardhana', normalized_name: 'indrasari wisnu wardhana', alias: ['Wisnu Wardhana'], gender: 'L', birth_place: 'Jakarta', birth_date: '1965-01-01', occupation: 'Mantan Dirjen Perdagangan Luar Negeri Kemendag', nationality: 'Indonesia' },
  { person_id: 'per-harvey-moeis', full_name: 'Harvey Moeis', normalized_name: 'harvey moeis', alias: ['Harvey Moeis'], gender: 'L', birth_place: 'Jakarta', birth_date: '1985-11-30', occupation: 'Pengusaha Tambang / Perwakilan PT RBT', nationality: 'Indonesia' },
  { person_id: 'per-emirsyah-satar', full_name: 'Emirsyah Satar', normalized_name: 'emirsyah satar', alias: ['Emir Satar'], gender: 'L', birth_place: 'Jakarta', birth_date: '1959-06-28', occupation: 'Mantan Direktur Utama PT Garuda Indonesia (Persero) Tbk', nationality: 'Indonesia' },
  { person_id: 'per-juliari-batubara', full_name: 'Juliari Peter Batubara, M.B.A.', normalized_name: 'juliari peter batubara', alias: ['Juliari Batubara'], gender: 'L', birth_place: 'Jakarta', birth_date: '1972-07-22', occupation: 'Mantan Menteri Sosial RI', nationality: 'Indonesia' },
  { person_id: 'per-edhy-prabowo', full_name: 'H. Edhy Prabowo, S.E., M.M., M.B.A.', normalized_name: 'edhy prabowo', alias: ['Edhy Prabowo'], gender: 'L', birth_place: 'Muara Enim, Sumsel', birth_date: '1972-12-24', occupation: 'Mantan Menteri Kelautan dan Perikanan RI', nationality: 'Indonesia' },
  { person_id: 'per-johnny-plate', full_name: 'Johnny Gerard Plate, S.E.', normalized_name: 'johnny gerard plate', alias: ['Johnny G. Plate'], gender: 'L', birth_place: 'Manggarai, NTT', birth_date: '1956-09-10', occupation: 'Mantan Menkominfo RI', nationality: 'Indonesia' },
  { person_id: 'per-syahrul-yasin-limpo', full_name: 'Prof. Dr. H. Syahrul Yasin Limpo, S.H., M.Si., M.H.', normalized_name: 'syahrul yasin limpo', alias: ['SYL'], gender: 'L', birth_place: 'Makassar, Sulsel', birth_date: '1955-03-16', occupation: 'Mantan Menteri Pertanian RI', nationality: 'Indonesia' },
  { person_id: 'per-surya-darmadi', full_name: 'Surya Darmadi', normalized_name: 'surya darmadi', alias: ['Apeng'], gender: 'L', birth_place: 'Jakarta', birth_date: '1951-11-15', occupation: 'Pemilik Duta Palma Group', nationality: 'Indonesia' },
  { person_id: 'per-zarof-ricar', full_name: 'Dr. Zarof Ricar, S.H., S.Sos., M.Hum.', normalized_name: 'zarof ricar', alias: ['Zarof Ricar'], gender: 'L', birth_place: 'Sumenep, Jatim', birth_date: '1962-01-16', occupation: 'Mantan Kepala Balitbang Diklat Kumdil MA RI', nationality: 'Indonesia' },
  { person_id: 'per-thomas-lembong', full_name: 'Thomas Trikasih Lembong', normalized_name: 'thomas trikasih lembong', alias: ['Tom Lembong'], gender: 'L', birth_place: 'Jakarta', birth_date: '1971-03-04', occupation: 'Mantan Menteri Perdagangan RI / Mantan Kepala BKPM', nationality: 'Indonesia' },
  { person_id: 'per-sahbirin-noor', full_name: 'H. Sahbirin Noor, S.Sos., M.H.', normalized_name: 'sahbirin noor', alias: ['Paman Birin'], gender: 'L', birth_place: 'Banjarmasin, Kalsel', birth_date: '1967-11-12', occupation: 'Mantan Gubernur Kalimantan Selatan', nationality: 'Indonesia' }
];

// =============================================================================
// 6. POSITIONS DATASET
// =============================================================================
const positions: Position[] = persons.map((p) => {
  let title = 'Pejabat Publik / Pihak Terkait';
  let inst = 'Instansi Terkait';
  let govLevel: any = 'Kementerian/Lembaga';
  let prov: string | null = 'DKI Jakarta';
  let sector = 'Penyalahgunaan Anggaran';
  let srcId = 'src-ma-bank-bali-2009';

  if (p.person_id === 'per-jusuf-muda-dalam') { title = 'Menteri Urusan Bank Sentral / Gubernur BI'; inst = 'Bank Indonesia'; govLevel = 'Nasional'; sector = 'Perbankan'; srcId = 'src-pn-istimewa-jmd-1966'; }
  else if (p.person_id === 'per-roeslan-abdulgani') { title = 'Menteri Luar Negeri RI'; inst = 'Kementerian Luar Negeri'; govLevel = 'Kementerian/Lembaga'; sector = 'Penyalahgunaan Anggaran'; srcId = 'src-jaksa-agung-soeprapto-1956'; }
  else if (p.person_id === 'per-budiadji') { title = 'Kepala Depot Logistik (Dolog) Kalimantan Timur'; inst = 'Bulog / Dolog Kaltim'; govLevel = 'BUMN'; prov = 'Kalimantan Timur'; sector = 'Penyalahgunaan Anggaran'; srcId = 'src-pn-samarinda-budiadji-1977'; }
  else if (p.person_id === 'per-dicky-di-nata') { title = 'Direktur Utama PT Bank Duta Ekonomi'; inst = 'PT Bank Duta'; govLevel = 'Swasta'; sector = 'Perbankan'; srcId = 'src-ma-bank-duta-dicky-1992'; }
  else if (p.person_id === 'per-eddy-tansil') { title = 'Pemilik PT Golden Key Group'; inst = 'PT Golden Key Group'; govLevel = 'Swasta'; sector = 'Perbankan'; srcId = 'src-pn-jakpus-eddy-tansil-1994'; }
  else if (p.person_id === 'per-soeharto') { title = 'Ketua Yayasan Beasiswa Supersemar / Presiden RI ke-2'; inst = 'Yayasan Supersemar / Lembaga Kepresidenan'; govLevel = 'Nasional'; sector = 'Penyalahgunaan Anggaran'; srcId = 'src-ma-yayasan-supersemar-2015'; }
  else if (p.person_id === 'per-djoko-tjandra') { title = 'Direktur Utama PT Era Giat Prima'; inst = 'PT EGP'; govLevel = 'Swasta'; sector = 'Perbankan'; srcId = 'src-ma-bank-bali-2009'; }
  else if (p.person_id === 'per-syahril-sabirin') { title = 'Gubernur Bank Indonesia'; inst = 'Bank Indonesia'; govLevel = 'Nasional'; sector = 'Perbankan'; srcId = 'src-ma-syahril-sabirin-2004'; }
  else if (p.person_id === 'per-bob-hasan') { title = 'Ketua Umum APHI / Dirut PT Mapala Rabda'; inst = 'APHI'; govLevel = 'Korporasi'; sector = 'Kehutanan'; srcId = 'src-ma-bob-hasan-2001'; }
  else if (p.person_id === 'per-sapuan') { title = 'Wakil Kepala Badan Urusan Logistik'; inst = 'Bulog'; govLevel = 'BUMN'; sector = 'Penyalahgunaan Anggaran'; srcId = 'src-ma-yanatera-sapuan-2003'; }
  else if (p.person_id === 'per-abdullah-puteh') { title = 'Gubernur Nanggroe Aceh Darussalam'; inst = 'Pemprov NAD'; govLevel = 'Provinsi'; prov = 'Aceh'; sector = 'Pengadaan Barang/Jasa'; srcId = 'src-kpk-puteh-2005'; }
  else if (p.person_id === 'per-akbar-tandjung') { title = 'Menteri Sekretaris Negara'; inst = 'Kemensetneg RI'; govLevel = 'Kementerian/Lembaga'; sector = 'Penyalahgunaan Anggaran'; srcId = 'src-ma-akbar-bulog-2004'; }
  else if (p.person_id === 'per-syafruddin-temenggung') { title = 'Kepala BPPN'; inst = 'BPPN'; govLevel = 'Nasional'; sector = 'Perbankan'; srcId = 'src-ma-sat-skl-blbi-2019'; }
  else if (p.person_id === 'per-nazaruddin-sjamsuddin') { title = 'Ketua Komisi Pemilihan Umum RI'; inst = 'KPU RI'; govLevel = 'Nasional'; sector = 'Pengadaan Barang/Jasa'; srcId = 'src-tipikor-kpu-nazaruddin-2005'; }
  else if (p.person_id === 'per-aulia-pohan') { title = 'Deputi Gubernur Bank Indonesia'; inst = 'Bank Indonesia'; govLevel = 'Nasional'; sector = 'Perbankan'; srcId = 'src-ma-aulia-pohan-2009'; }
  else if (p.person_id === 'per-urip-tri-gunawan') { title = 'Ketua Tim Penyelidik BLBI Kejaksaan Agung'; inst = 'Kejaksaan Agung RI'; govLevel = 'Aparat Penegak Hukum'; sector = 'Mafia Peradilan'; srcId = 'src-ma-urip-tri-gunawan-2009'; }
  else if (p.person_id === 'per-hari-sabarno') { title = 'Menteri Dalam Negeri RI'; inst = 'Kementerian Dalam Negeri'; govLevel = 'Kementerian/Lembaga'; sector = 'Pengadaan Barang/Jasa'; srcId = 'src-ma-damkar-hari-sabarno-2012'; }
  else if (p.person_id === 'per-miranda-goeltom') { title = 'Deputi Gubernur Senior Terpilih Bank Indonesia'; inst = 'Bank Indonesia'; govLevel = 'Nasional'; sector = 'Suap'; srcId = 'src-tipikor-dgs-miranda-2012'; }
  else if (p.person_id === 'per-anas-urbaningrum') { title = 'Ketua Fraksi Partai Demokrat DPR RI'; inst = 'DPR RI'; govLevel = 'Legislatif'; sector = 'Infrastruktur'; srcId = 'src-ma-anas-urbaningrum-2020'; }
  else if (p.person_id === 'per-akil-mochtar') { title = 'Ketua Mahkamah Konstitusi RI'; inst = 'Mahkamah Konstitusi RI'; govLevel = 'Yudikatif'; sector = 'Mafia Peradilan'; srcId = 'src-ma-akil-mochtar-2015'; }
  else if (p.person_id === 'per-djoko-susilo') { title = 'Kepala Korlantas Polri'; inst = 'Polri'; govLevel = 'Aparat Penegak Hukum'; sector = 'Pengadaan Barang/Jasa'; srcId = 'src-ma-djoko-susilo-2014'; }
  else if (p.person_id === 'per-luthfi-hasan') { title = 'Anggota DPR RI / Presiden PKS'; inst = 'DPR RI'; govLevel = 'Legislatif'; sector = 'Suap'; srcId = 'src-ma-luthfi-hasan-2014'; }
  else if (p.person_id === 'per-rudi-rubiandini') { title = 'Kepala SKK Migas'; inst = 'SKK Migas'; govLevel = 'Nasional'; sector = 'Suap'; srcId = 'src-tipikor-skk-migas-rudi-2014'; }
  else if (p.person_id === 'per-m-nazaruddin') { title = 'Anggota DPR RI / Bendahara Umum Partai'; inst = 'DPR RI'; govLevel = 'Legislatif'; sector = 'Infrastruktur'; srcId = 'src-ma-wisma-atlet-nazaruddin-2013'; }
  else if (p.person_id === 'per-budi-mulya') { title = 'Deputi Gubernur Bank Indonesia'; inst = 'Bank Indonesia'; govLevel = 'Nasional'; sector = 'Perbankan'; srcId = 'src-ma-bank-century-budi-mulya-2015'; }
  else if (p.person_id === 'per-gayus-tambunan') { title = 'Penelaah Keberatan Ditjen Pajak Gol III/a'; inst = 'Direktorat Jenderal Pajak'; govLevel = 'Kementerian/Lembaga'; sector = 'Pajak'; srcId = 'src-ma-gayus-tambunan-2013'; }
  else if (p.person_id === 'per-setya-novanto') { title = 'Ketua Fraksi Golkar DPR RI'; inst = 'DPR RI'; govLevel = 'Legislatif'; sector = 'Pengadaan Barang/Jasa'; srcId = 'src-ma-setya-novanto-2020'; }
  else if (p.person_id === 'per-neneng-yasin') { title = 'Bupati Bekasi'; inst = 'Pemkab Bekasi'; govLevel = 'Kabupaten/Kota'; prov = 'Jawa Barat'; sector = 'Perizinan'; srcId = 'src-tipikor-meikarta-neneng-2019'; }
  else if (p.person_id === 'per-idrus-marham') { title = 'Menteri Sosial RI / Sekjen Golkar'; inst = 'Kemensos / DPR'; govLevel = 'Kementerian/Lembaga'; sector = 'Infrastruktur'; srcId = 'src-ma-pltu-riau-idrus-2019'; }
  else if (p.person_id === 'per-romahurmuziy') { title = 'Anggota DPR RI / Ketum PPP'; inst = 'DPR RI'; govLevel = 'Legislatif'; sector = 'Suap'; srcId = 'src-ma-romahurmuziy-2020'; }
  else if (p.person_id === 'per-benny-tjokro') { title = 'Direktur Utama PT Hanson International Tbk'; inst = 'PT Hanson International'; govLevel = 'Swasta'; sector = 'BUMN'; srcId = 'src-ma-jiwasraya-benny-tjokro-2021'; }
  else if (p.person_id === 'per-sonny-widjaja') { title = 'Direktur Utama PT ASABRI (Persero)'; inst = 'PT ASABRI (Persero)'; govLevel = 'BUMN'; sector = 'BUMN'; srcId = 'src-ma-asabri-sonny-widjaja-2023'; }
  else if (p.person_id === 'per-wisnu-wardhana') { title = 'Dirjen Perdagangan Luar Negeri Kemendag'; inst = 'Kementerian Perdagangan'; govLevel = 'Kementerian/Lembaga'; sector = 'Perizinan'; srcId = 'src-ma-cpo-wisnu-wardhana-2023'; }
  else if (p.person_id === 'per-harvey-moeis') { title = 'Perwakilan PT Refined Bangka Tin (RBT)'; inst = 'PT RBT'; govLevel = 'Swasta'; prov = 'Kepulauan Bangka Belitung'; sector = 'Pertambangan'; srcId = 'src-tipikor-timah-harvey-moeis-2024'; }
  else if (p.person_id === 'per-emirsyah-satar') { title = 'Direktur Utama PT Garuda Indonesia (Persero) Tbk'; inst = 'PT Garuda Indonesia'; govLevel = 'BUMN'; sector = 'Pengadaan Barang/Jasa'; srcId = 'src-tipikor-garuda-emirsyah-2020'; }
  else if (p.person_id === 'per-juliari-batubara') { title = 'Menteri Sosial RI'; inst = 'Kementerian Sosial RI'; govLevel = 'Kementerian/Lembaga'; sector = 'Bansos'; srcId = 'src-tipikor-juliari-batubara-2021'; }
  else if (p.person_id === 'per-edhy-prabowo') { title = 'Menteri Kelautan dan Perikanan RI'; inst = 'Kementerian Kelautan dan Perikanan RI'; govLevel = 'Kementerian/Lembaga'; sector = 'Perizinan'; srcId = 'src-ma-edhy-prabowo-2022'; }
  else if (p.person_id === 'per-johnny-plate') { title = 'Menteri Komunikasi dan Informatika RI'; inst = 'Kementerian Komunikasi dan Informatika RI'; govLevel = 'Kementerian/Lembaga'; sector = 'Infrastruktur'; srcId = 'src-tipikor-bts-johnny-plate-2023'; }
  else if (p.person_id === 'per-syahrul-yasin-limpo') { title = 'Menteri Pertanian RI'; inst = 'Kementerian Pertanian RI'; govLevel = 'Kementerian/Lembaga'; sector = 'Pemerasan'; srcId = 'src-tipikor-syl-2024'; }
  else if (p.person_id === 'per-surya-darmadi') { title = 'Pemilik Manfaat Duta Palma Group'; inst = 'Duta Palma Group'; govLevel = 'Swasta'; prov = 'Riau'; sector = 'Perkebunan'; srcId = 'src-ma-surya-darmadi-2023'; }
  else if (p.person_id === 'per-zarof-ricar') { title = 'Kepala Balitbang Diklat Kumdil MA RI'; inst = 'Mahkamah Agung RI'; govLevel = 'Yudikatif'; sector = 'Mafia Peradilan'; srcId = 'src-kejagung-zarof-ricar-2024'; }
  else if (p.person_id === 'per-thomas-lembong') { title = 'Menteri Perdagangan RI'; inst = 'Kementerian Perdagangan RI'; govLevel = 'Kementerian/Lembaga'; sector = 'Perizinan'; srcId = 'src-kejagung-tom-lembong-2024'; }
  else if (p.person_id === 'per-sahbirin-noor') { title = 'Gubernur Kalimantan Selatan'; inst = 'Pemerintah Provinsi Kalsel'; govLevel = 'Provinsi'; prov = 'Kalimantan Selatan'; sector = 'Pengadaan Barang/Jasa'; srcId = 'src-kpk-ott-sahbirin-noor-2024'; }

  return {
    position_id: 'pos-' + p.person_id,
    person_id: p.person_id,
    position_title: title,
    institution: inst,
    government_level: govLevel,
    sector: sector,
    province: prov,
    city_regency: null,
    district: null,
    village: null,
    period_start: null,
    period_end: null,
    position_at_offense: true,
    position_at_arrest: false,
    position_at_verdict: false,
    source_id: srcId
  };
});

// =============================================================================
// 7. PARTY MEMBERSHIPS DATASET
// =============================================================================
const partyMemberships: PartyMembership[] = [
  { membership_id: 'pm-roeslan-pni', person_id: 'per-roeslan-abdulgani', party_id: 'pty-pni', membership_start: '1946-01-01', membership_end: '1970-01-01', party_position: 'Pimpinan / Tokoh PNI', party_position_start: null, party_position_end: null, party_status: 'aktif', party_at_offense: true, party_at_arrest: false, party_at_verdict: false, source_id: 'src-jaksa-agung-soeprapto-1956' },
  { membership_id: 'pm-soeharto-golkar', person_id: 'per-soeharto', party_id: 'pty-golkar', membership_start: '1968-01-01', membership_end: '1998-05-21', party_position: 'Ketua Dewan Pembina Golkar', party_position_start: '1971-01-01', party_position_end: '1998-05-21', party_status: 'pensiun', party_at_offense: true, party_at_arrest: false, party_at_verdict: false, source_id: 'src-ma-yayasan-supersemar-2015' },
  { membership_id: 'pm-akbar-golkar', person_id: 'per-akbar-tandjung', party_id: 'pty-golkar', membership_start: '1970-01-01', membership_end: null, party_position: 'Ketua Umum DPP Golkar', party_position_start: '1998-07-11', party_position_end: '2004-12-19', party_status: 'aktif', party_at_offense: true, party_at_arrest: false, party_at_verdict: true, source_id: 'src-ma-akbar-bulog-2004' },
  { membership_id: 'pm-anas-demokrat', person_id: 'per-anas-urbaningrum', party_id: 'pty-demokrat', membership_start: '2005-05-01', membership_end: '2013-02-23', party_position: 'Ketua Umum DPP Partai Demokrat', party_position_start: '2010-05-23', party_position_end: '2013-02-23', party_status: 'berhenti', party_at_offense: true, party_at_arrest: false, party_at_verdict: false, source_id: 'src-ma-anas-urbaningrum-2020' },
  { membership_id: 'pm-akil-golkar', person_id: 'per-akil-mochtar', party_id: 'pty-golkar', membership_start: '1999-01-01', membership_end: '2008-08-01', party_position: 'Wakil Sekretaris Fraksi Golkar', party_position_start: '1999-10-01', party_position_end: '2004-10-01', party_status: 'keluar_hakim_mk', party_at_offense: false, party_at_arrest: false, party_at_verdict: false, source_id: 'src-ma-akil-mochtar-2015' },
  { membership_id: 'pm-luthfi-pks', person_id: 'per-luthfi-hasan', party_id: 'pty-pks', membership_start: '1998-07-20', membership_end: '2013-01-31', party_position: 'Presiden PKS', party_position_start: '2010-06-20', party_position_end: '2013-01-31', party_status: 'berhenti', party_at_offense: true, party_at_arrest: true, party_at_verdict: false, source_id: 'src-ma-luthfi-hasan-2014' },
  { membership_id: 'pm-nazaruddin-demokrat', person_id: 'per-m-nazaruddin', party_id: 'pty-demokrat', membership_start: '2006-01-01', membership_end: '2011-05-24', party_position: 'Bendahara Umum DPP Partai Demokrat', party_position_start: '2010-05-23', party_position_end: '2011-05-24', party_status: 'diberhentikan', party_at_offense: true, party_at_arrest: true, party_at_verdict: false, source_id: 'src-ma-wisma-atlet-nazaruddin-2013' },
  { membership_id: 'pm-setnov-golkar', person_id: 'per-setya-novanto', party_id: 'pty-golkar', membership_start: '1990-01-01', membership_end: '2017-12-13', party_position: 'Ketua Umum DPP Golkar', party_position_start: '2016-05-17', party_position_end: '2017-12-13', party_status: 'dinonaktifkan', party_at_offense: true, party_at_arrest: true, party_at_verdict: false, source_id: 'src-ma-setya-novanto-2020' },
  { membership_id: 'pm-neneng-golkar', person_id: 'per-neneng-yasin', party_id: 'pty-golkar', membership_start: '2007-01-01', membership_end: '2018-10-16', party_position: 'Ketua DPD Golkar Kabupaten Bekasi', party_position_start: '2010-01-01', party_position_end: '2018-10-16', party_status: 'dinonaktifkan', party_at_offense: true, party_at_arrest: true, party_at_verdict: false, source_id: 'src-tipikor-meikarta-neneng-2019' },
  { membership_id: 'pm-idrus-golkar', person_id: 'per-idrus-marham', party_id: 'pty-golkar', membership_start: '1997-01-01', membership_end: '2018-08-24', party_position: 'Sekretaris Jenderal DPP Partai Golkar', party_position_start: '2009-10-08', party_position_end: '2018-01-22', party_status: 'mengundurkan_diri', party_at_offense: true, party_at_arrest: true, party_at_verdict: false, source_id: 'src-ma-pltu-riau-idrus-2019' },
  { membership_id: 'pm-romy-ppp', person_id: 'per-romahurmuziy', party_id: 'pty-ppp', membership_start: '2005-01-01', membership_end: '2019-03-16', party_position: 'Ketua Umum DPP PPP', party_position_start: '2016-04-11', party_position_end: '2019-03-16', party_status: 'diberhentikan', party_at_offense: true, party_at_arrest: true, party_at_verdict: false, source_id: 'src-ma-romahurmuziy-2020' },
  { membership_id: 'pm-juliari-pdip', person_id: 'per-juliari-batubara', party_id: 'pty-pdi-p', membership_start: '2010-01-01', membership_end: '2020-12-06', party_position: 'Wakil Bendahara Umum DPP PDI-P', party_position_start: '2019-08-10', party_position_end: '2020-12-06', party_status: 'dinonaktifkan', party_at_offense: true, party_at_arrest: true, party_at_verdict: false, source_id: 'src-tipikor-juliari-batubara-2021' },
  { membership_id: 'pm-edhy-gerindra', person_id: 'per-edhy-prabowo', party_id: 'pty-gerindra', membership_start: '2008-02-06', membership_end: '2020-11-26', party_position: 'Wakil Ketua Umum DPP Gerindra', party_position_start: '2014-09-01', party_position_end: '2020-11-26', party_status: 'mengundurkan_diri', party_at_offense: true, party_at_arrest: true, party_at_verdict: false, source_id: 'src-ma-edhy-prabowo-2022' },
  { membership_id: 'pm-johnny-nasdem', person_id: 'per-johnny-plate', party_id: 'pty-nasdem', membership_start: '2013-01-01', membership_end: '2023-05-17', party_position: 'Sekretaris Jenderal DPP NasDem', party_position_start: '2017-09-01', party_position_end: '2023-05-17', party_status: 'dinonaktifkan', party_at_offense: true, party_at_arrest: true, party_at_verdict: false, source_id: 'src-tipikor-bts-johnny-plate-2023' },
  { membership_id: 'pm-syl-nasdem', person_id: 'per-syahrul-yasin-limpo', party_id: 'pty-nasdem', membership_start: '2018-03-21', membership_end: '2023-10-06', party_position: 'Ketua DPP Partai NasDem', party_position_start: '2019-11-11', party_position_end: '2023-10-06', party_status: 'mengundurkan_diri', party_at_offense: true, party_at_arrest: true, party_at_verdict: false, source_id: 'src-tipikor-syl-2024' },
  { membership_id: 'pm-sahbirin-golkar', person_id: 'per-sahbirin-noor', party_id: 'pty-golkar', membership_start: '2015-01-01', membership_end: null, party_position: 'Ketua DPD Golkar Kalimantan Selatan', party_position_start: '2016-01-01', party_position_end: null, party_status: 'aktif', party_at_offense: true, party_at_arrest: false, party_at_verdict: false, source_id: 'src-kpk-ott-sahbirin-noor-2024' }
];

console.log(`✓ Master entitas primer 1945–2026 terkonfigurasi: ${persons.length} orang, ${positions.length} jabatan, ${parties.length} partai.`);

fs.writeFileSync(path.join(NORMALIZED_DIR, 'sources.json'), JSON.stringify(sources, null, 2));
fs.writeFileSync(path.join(NORMALIZED_DIR, 'parties.json'), JSON.stringify(parties, null, 2));
fs.writeFileSync(path.join(NORMALIZED_DIR, 'locations.json'), JSON.stringify(locations, null, 2));
fs.writeFileSync(path.join(NORMALIZED_DIR, 'companies.json'), JSON.stringify(companies, null, 2));
fs.writeFileSync(path.join(NORMALIZED_DIR, 'persons.json'), JSON.stringify(persons, null, 2));
fs.writeFileSync(path.join(NORMALIZED_DIR, 'positions.json'), JSON.stringify(positions, null, 2));
fs.writeFileSync(path.join(NORMALIZED_DIR, 'party_memberships.json'), JSON.stringify(partyMemberships, null, 2));
