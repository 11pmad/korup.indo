import { CorruptionCase, Official, CaseSource, Company, AuditLog, UserReport } from '../src/types.js';

export const INITIAL_OFFICIALS: Official[] = [
  {
    id: 'off-1',
    nama: 'Setya Novanto',
    jabatan: 'Ketua DPR RI (2014-2015, 2016-2017)',
    partai: 'Partai Golkar',
    provinsi: 'Nusa Tenggara Timur',
    kota_kabupaten: 'Kota Kupang',
    daerah_pemilihan: 'NTT II',
    foto_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80'
  },
  {
    id: 'off-2',
    nama: 'Juliari Peter Batubara',
    jabatan: 'Menteri Sosial RI / Anggota DPR RI (2014-2019)',
    partai: 'PDI Perjuangan',
    provinsi: 'DKI Jakarta',
    kota_kabupaten: 'Jakarta Pusat',
    daerah_pemilihan: 'Jawa Tengah I',
    foto_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80'
  },
  {
    id: 'off-3',
    nama: 'Syahrul Yasin Limpo',
    jabatan: 'Menteri Pertanian / Mantan Gubernur Sulawesi Selatan (2008-2018)',
    partai: 'Partai NasDem',
    provinsi: 'Sulawesi Selatan',
    kota_kabupaten: 'Kota Makassar',
    daerah_pemilihan: 'Sulawesi Selatan I',
    foto_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&auto=format&fit=crop&q=80'
  },
  {
    id: 'off-4',
    nama: 'Abdul Gani Kasuba',
    jabatan: 'Gubernur Maluku Utara (2014-2023)',
    partai: 'PKS (Mantan Kader / Non-Partai)',
    provinsi: 'Maluku Utara',
    kota_kabupaten: 'Kota Sofifi',
    daerah_pemilihan: 'Maluku Utara',
    foto_url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&auto=format&fit=crop&q=80'
  },
  {
    id: 'off-5',
    nama: 'Rahmat Effendi',
    jabatan: 'Walikota Bekasi (2012-2022)',
    partai: 'Partai Golkar',
    provinsi: 'Jawa Barat',
    kota_kabupaten: 'Kota Bekasi',
    daerah_pemilihan: 'Kota Bekasi',
    foto_url: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=300&auto=format&fit=crop&q=80'
  },
  {
    id: 'off-6',
    nama: 'Edhy Prabowo',
    jabatan: 'Menteri Kelautan & Perikanan / Anggota DPR RI (2009-2019)',
    partai: 'Partai Gerindra',
    provinsi: 'Sumatera Selatan',
    kota_kabupaten: 'Palembang',
    daerah_pemilihan: 'Sumatera Selatan I',
    foto_url: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=300&auto=format&fit=crop&q=80'
  },
  {
    id: 'off-7',
    nama: 'Sahat Tua P. Simanjuntak',
    jabatan: 'Wakil Ketua DPRD Provinsi Jawa Timur (2019-2022)',
    partai: 'Partai Golkar',
    provinsi: 'Jawa Timur',
    kota_kabupaten: 'Kota Surabaya',
    daerah_pemilihan: 'Jawa Timur IX',
    foto_url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&auto=format&fit=crop&q=80'
  },
  {
    id: 'off-8',
    nama: 'Nurdin Abdullah',
    jabatan: 'Gubernur Sulawesi Selatan (2018-2021) / Mantan Bupati Bantaeng',
    partai: 'PDI Perjuangan (Diusung)',
    provinsi: 'Sulawesi Selatan',
    kota_kabupaten: 'Kabupaten Bantaeng',
    daerah_pemilihan: 'Sulawesi Selatan',
    foto_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80'
  },
  {
    id: 'off-9',
    nama: 'Harun Masiku',
    jabatan: 'Calon Anggota DPR RI Pemilu 2019 Dapil Sumsel I',
    partai: 'PDI Perjuangan',
    provinsi: 'Sumatera Selatan',
    kota_kabupaten: 'Kota Palembang',
    daerah_pemilihan: 'Sumatera Selatan I',
    foto_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80'
  },
  {
    id: 'off-10',
    nama: 'Ilham Arief Sirajuddin',
    jabatan: 'Mantan Walikota Makassar (2004-2014)',
    partai: 'Partai Demokrat',
    provinsi: 'Sulawesi Selatan',
    kota_kabupaten: 'Kota Makassar',
    daerah_pemilihan: 'Sulawesi Selatan',
    foto_url: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=300&auto=format&fit=crop&q=80'
  },
  {
    id: 'off-11',
    nama: 'Imam Nahrawi',
    jabatan: 'Menteri Pemuda dan Olahraga / Anggota DPR RI (2004-2014)',
    partai: 'PKB',
    provinsi: 'Jawa Timur',
    kota_kabupaten: 'Kabupaten Bangkalan',
    daerah_pemilihan: 'Jawa Timur XI (Madura)',
    foto_url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300&auto=format&fit=crop&q=80'
  },
  {
    id: 'off-12',
    nama: 'Budi Budiman',
    jabatan: 'Walikota Tasikmalaya (2012-2020)',
    partai: 'PPP',
    provinsi: 'Jawa Barat',
    kota_kabupaten: 'Kota Tasikmalaya',
    daerah_pemilihan: 'Kota Tasikmalaya',
    foto_url: 'https://images.unsplash.com/photo-1528892952291-009c663ce843?w=300&auto=format&fit=crop&q=80'
  },
  {
    id: 'off-template',
    nama: 'Nama Pejabat (Contoh Input Admin)',
    jabatan: 'Anggota DPRD Provinsi / Kepala Daerah Contoh',
    partai: 'Partai Contoh',
    provinsi: 'Kalimantan Timur',
    kota_kabupaten: 'Kota Samarinda',
    daerah_pemilihan: 'Kaltim I',
    foto_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80'
  }
];

export const INITIAL_COMPANIES: Company[] = [
  {
    id: 'comp-1',
    nama_perusahaan: 'Konsorsium PNRI & PT Quadra Solution',
    sektor: 'Teknologi Informasi & Percetakan Dokumen Negara',
    kasus_terkait: ['case-1']
  },
  {
    id: 'comp-2',
    nama_perusahaan: 'PT Ardila Berkah Mandiri & PT Rajawali Parama',
    sektor: 'Penyedia Logistik & Pengadaan Pangan',
    kasus_terkait: ['case-2']
  },
  {
    id: 'comp-3',
    nama_perusahaan: 'PT Aero Citra Cargo (ACC)',
    sektor: 'Kargo & Forwarding Ekspor Kelautan',
    kasus_terkait: ['case-6']
  },
  {
    id: 'comp-4',
    nama_perusahaan: 'PT Agung Perdana Bulukumba',
    sektor: 'Konstruksi & Infrastruktur Jalan',
    kasus_terkait: ['case-8']
  },
  {
    id: 'comp-5',
    nama_perusahaan: 'PT Trimegah Bangun Persada (Mitra Izin Rekanan)',
    sektor: 'Pertambangan Nikel & Mineral',
    kasus_terkait: ['case-4']
  }
];

export const INITIAL_CASES: CorruptionCase[] = [
  {
    id: 'case-1',
    official_id: 'off-1',
    ringkasan_kasus: 'Intervensi pembahasan anggaran dan pengadaan paket penerapan KTP Elektronik (e-KTP) nasional secara melawan hukum bersama sejumlah pihak.',
    nilai_kerugian_negara: 2300000000000, // Rp 2.3 Triliun
    tahun_kejadian: 2011,
    tahun_putusan: 2018,
    status_hukum: 'Divonis Inkrah',
    jenis_kasus: 'Korupsi Pengadaan Barang/Jasa Negara',
    perusahaan_terkait: ['Konsorsium PNRI & PT Quadra Solution'],
    is_verified: true,
    is_template: false,
    created_at: '2024-01-10T10:00:00Z',
    sources: [
      {
        id: 'src-1-1',
        case_id: 'case-1',
        nama_media: 'Mahkamah Agung Republik Indonesia',
        url: 'https://putusan3.mahkamahagung.go.id/direktori/putusan/2061-k-pid-sus-2018.html',
        tanggal_publikasi: '2018-04-24'
      },
      {
        id: 'src-1-2',
        case_id: 'case-1',
        nama_media: 'KPK.go.id (Siaran Pers Eksekusi Setya Novanto)',
        url: 'https://www.kpk.go.id/id/berita/siaran-pers/385-kpk-eksekusi-setya-novanto-ke-lapas-sukamiskin',
        tanggal_publikasi: '2018-05-04'
      },
      {
        id: 'src-1-3',
        case_id: 'case-1',
        nama_media: 'Kompas.com',
        url: 'https://nasional.kompas.com/read/2018/04/24/16281641/setya-novanto-divonis-15-tahun-penjara',
        tanggal_publikasi: '2018-04-24'
      }
    ]
  },
  {
    id: 'case-2',
    official_id: 'off-2',
    ringkasan_kasus: 'Penerimaan suap pengadaan bantuan sosial (Bansos) sembako penanganan pandemi Covid-19 se-Jabodetabek tahun 2020 melalui pemotongan kuota vendor Rp 10.000 per paket sembako.',
    nilai_kerugian_negara: 32482000000, // Rp 32.48 Miliar
    tahun_kejadian: 2020,
    tahun_putusan: 2021,
    status_hukum: 'Divonis Inkrah',
    jenis_kasus: 'Suap & Gratifikasi Pengadaan Bansos Bencana',
    perusahaan_terkait: ['PT Ardila Berkah Mandiri & PT Rajawali Parama'],
    is_verified: true,
    is_template: false,
    created_at: '2024-01-12T11:00:00Z',
    sources: [
      {
        id: 'src-2-1',
        case_id: 'case-2',
        nama_media: 'Pengadilan Tipikor Jakarta / Mahkamah Agung',
        url: 'https://putusan3.mahkamahagung.go.id/direktori/putusan/29-pid-sus-tpk-2021-pn-jkt-pst.html',
        tanggal_publikasi: '2021-08-23'
      },
      {
        id: 'src-2-2',
        case_id: 'case-2',
        nama_media: 'Kompas.com',
        url: 'https://nasional.kompas.com/read/2021/08/23/15103641/eks-mensos-juliari-batubara-divonis-12-tahun-penjara',
        tanggal_publikasi: '2021-08-23'
      },
      {
        id: 'src-2-3',
        case_id: 'case-2',
        nama_media: 'KPK.go.id',
        url: 'https://www.kpk.go.id/id/berita/siaran-pers/2275-vonis-juliari-batubara-inkrah-kpk-segera-eksekusi',
        tanggal_publikasi: '2021-09-01'
      }
    ]
  },
  {
    id: 'case-3',
    official_id: 'off-3',
    ringkasan_kasus: 'Pemerasan terhadap para pejabat eselon I di lingkungan Kementerian Pertanian RI serta penerimaan gratifikasi untuk kepentingan pribadi dan keluarga.',
    nilai_kerugian_negara: 44270000000, // Rp 44.27 Miliar
    tahun_kejadian: 2020,
    tahun_putusan: 2024,
    status_hukum: 'Divonis Inkrah',
    jenis_kasus: 'Pemerasan Jabatan & Gratifikasi',
    perusahaan_terkait: [],
    is_verified: true,
    is_template: false,
    created_at: '2024-07-15T09:30:00Z',
    sources: [
      {
        id: 'src-3-1',
        case_id: 'case-3',
        nama_media: 'Pengadilan Tinggi DKI Jakarta (Putusan Banding)',
        url: 'https://putusan3.mahkamahagung.go.id/direktori/putusan/46-pid-sus-tpk-2024-pt-dki.html',
        tanggal_publikasi: '2024-09-10'
      },
      {
        id: 'src-3-2',
        case_id: 'case-3',
        nama_media: 'Detikcom',
        url: 'https://news.detik.com/berita/d-7533830/pengadilan-tinggi-dki-perberat-vonis-syl-jadi-12-tahun-penjara',
        tanggal_publikasi: '2024-09-10'
      },
      {
        id: 'src-3-3',
        case_id: 'case-3',
        nama_media: 'Antaranews',
        url: 'https://www.antaranews.com/berita/4320495/pt-dki-perberat-hukuman-syl-menjadi-12-tahun-penjara',
        tanggal_publikasi: '2024-09-10'
      }
    ]
  },
  {
    id: 'case-4',
    official_id: 'off-4',
    ringkasan_kasus: 'Penerimaan suap dan gratifikasi terkait lelang jabatan pimpinan SKPD serta rekomendasi teknis perizinan usaha pertambangan di Provinsi Maluku Utara.',
    nilai_kerugian_negara: 109700000000, // Rp 109.7 Miliar
    tahun_kejadian: 2021,
    tahun_putusan: 2024,
    status_hukum: 'Divonis Inkrah',
    jenis_kasus: 'Suap Jual Beli Jabatan & Izin Tambang',
    perusahaan_terkait: ['PT Trimegah Bangun Persada (Mitra Izin Rekanan)'],
    is_verified: true,
    is_template: false,
    created_at: '2024-09-27T14:00:00Z',
    sources: [
      {
        id: 'src-4-1',
        case_id: 'case-4',
        nama_media: 'Pengadilan Tipikor Ternate',
        url: 'https://putusan3.mahkamahagung.go.id/direktori/putusan/11-pid-sus-tpk-2024-pn-tte.html',
        tanggal_publikasi: '2024-09-26'
      },
      {
        id: 'src-4-2',
        case_id: 'case-4',
        nama_media: 'Kompas.com',
        url: 'https://regional.kompas.com/read/2024/09/26/163000178/eks-gubernur-maluku-utara-abdul-gani-kasuba-divonis-8-tahun-penjara',
        tanggal_publikasi: '2024-09-26'
      },
      {
        id: 'src-4-3',
        case_id: 'case-4',
        nama_media: 'Tempo.co',
        url: 'https://nasional.tempo.co/read/1921319/hakim-vonis-abdul-gani-kasuba-8-tahun-penjara-kasus-suap-izin-tambang',
        tanggal_publikasi: '2024-09-26'
      }
    ]
  },
  {
    id: 'case-5',
    official_id: 'off-5',
    ringkasan_kasus: 'Penerimaan suap pengadaan barang dan jasa serta lelang jabatan di lingkungan Pemerintah Kota Bekasi dan ganti rugi pembebasan lahan.',
    nilai_kerugian_negara: 10000000000, // Rp 10 Miliar
    tahun_kejadian: 2021,
    tahun_putusan: 2023,
    status_hukum: 'Divonis Inkrah',
    jenis_kasus: 'Suap Lelang Jabatan & Proyek Daerah',
    perusahaan_terkait: [],
    is_verified: true,
    is_template: false,
    created_at: '2023-06-15T08:00:00Z',
    sources: [
      {
        id: 'src-5-1',
        case_id: 'case-5',
        nama_media: 'Mahkamah Agung RI (Putusan Kasasi)',
        url: 'https://putusan3.mahkamahagung.go.id/direktori/putusan/1899-k-pid-sus-2023.html',
        tanggal_publikasi: '2023-05-24'
      },
      {
        id: 'src-5-2',
        case_id: 'case-5',
        nama_media: 'KPK.go.id',
        url: 'https://www.kpk.go.id/id/berita/siaran-pers/2965-kasasi-ditolak-kpk-eksekusi-rahmat-effendi-ke-lapas-sukamiskin',
        tanggal_publikasi: '2023-06-07'
      },
      {
        id: 'src-5-3',
        case_id: 'case-5',
        nama_media: 'Detikcom',
        url: 'https://news.detik.com/berita/d-6738980/kasasi-ditolak-ma-hukuman-eks-walkot-bekasi-pepen-tetap-12-tahun-bui',
        tanggal_publikasi: '2023-05-25'
      }
    ]
  },
  {
    id: 'case-6',
    official_id: 'off-6',
    ringkasan_kasus: 'Penerimaan suap dari eksportir benih bening lobster (benur) dengan memanfaatkan jasa forwarding kargo tunggal serta pembelian barang mewah.',
    nilai_kerugian_negara: 25700000000, // Rp 25.7 Miliar
    tahun_kejadian: 2020,
    tahun_putusan: 2022,
    status_hukum: 'Divonis Inkrah',
    jenis_kasus: 'Suap Perizinan Ekspor Sumber Daya Alam',
    perusahaan_terkait: ['PT Aero Citra Cargo (ACC)'],
    is_verified: true,
    is_template: false,
    created_at: '2023-04-10T09:00:00Z',
    sources: [
      {
        id: 'src-6-1',
        case_id: 'case-6',
        nama_media: 'Mahkamah Agung RI (Putusan Kasasi)',
        url: 'https://putusan3.mahkamahagung.go.id/direktori/putusan/942-k-pid-sus-2022.html',
        tanggal_publikasi: '2022-03-07'
      },
      {
        id: 'src-6-2',
        case_id: 'case-6',
        nama_media: 'Kompas.com',
        url: 'https://nasional.kompas.com/read/2022/03/09/17094001/ma-pangkas-vonis-edhy-prabowo-jadi-5-tahun-penjara',
        tanggal_publikasi: '2022-03-09'
      },
      {
        id: 'src-6-3',
        case_id: 'case-6',
        nama_media: 'KPK.go.id',
        url: 'https://www.kpk.go.id/id/berita/siaran-pers/2537-kpk-eksekusi-edhy-prabowo-ke-lapas-kelas-i-tangerang',
        tanggal_publikasi: '2022-04-06'
      }
    ]
  },
  {
    id: 'case-7',
    official_id: 'off-7',
    ringkasan_kasus: 'Penerimaan ijon suap dana hibah pokok-pokok pikiran (Pokir) kelompok masyarakat (Pokmas) yang dialokasikan dalam APBD Jawa Timur.',
    nilai_kerugian_negara: 39500000000, // Rp 39.5 Miliar
    tahun_kejadian: 2020,
    tahun_putusan: 2023,
    status_hukum: 'Divonis Inkrah',
    jenis_kasus: 'Suap Pengurusan Alokasi Dana Hibah APBD (Pokir)',
    perusahaan_terkait: [],
    is_verified: true,
    is_template: false,
    created_at: '2023-10-01T12:00:00Z',
    sources: [
      {
        id: 'src-7-1',
        case_id: 'case-7',
        nama_media: 'Pengadilan Tipikor Surabaya',
        url: 'https://putusan3.mahkamahagung.go.id/direktori/putusan/52-pid-sus-tpk-2023-pn-sby.html',
        tanggal_publikasi: '2023-09-26'
      },
      {
        id: 'src-7-2',
        case_id: 'case-7',
        nama_media: 'Tempo.co',
        url: 'https://nasional.tempo.co/read/1776510/wakil-ketua-dprd-jatim-sahat-tua-simanjuntak-divonis-9-tahun-penjara-kasus-suap-hibah-pokir',
        tanggal_publikasi: '2023-09-26'
      },
      {
        id: 'src-7-3',
        case_id: 'case-7',
        nama_media: 'KPK.go.id',
        url: 'https://www.kpk.go.id/id/berita/siaran-pers/3150-kpk-tahan-wakil-ketua-dprd-jatim-terkait-dugaan-suap-dana-hibah',
        tanggal_publikasi: '2022-12-16'
      }
    ]
  },
  {
    id: 'case-8',
    official_id: 'off-8',
    ringkasan_kasus: 'Penerimaan suap dan gratifikasi pelaksanaan proyek pembangunan infrastruktur jalan dan kawasan wisata di Sulawesi Selatan.',
    nilai_kerugian_negara: 13000000000, // Rp 13 Miliar
    tahun_kejadian: 2020,
    tahun_putusan: 2021,
    status_hukum: 'Divonis Inkrah',
    jenis_kasus: 'Suap Pengadaan Proyek Infrastruktur Daerah',
    perusahaan_terkait: ['PT Agung Perdana Bulukumba'],
    is_verified: true,
    is_template: false,
    created_at: '2023-01-20T10:00:00Z',
    sources: [
      {
        id: 'src-8-1',
        case_id: 'case-8',
        nama_media: 'Pengadilan Tipikor Makassar',
        url: 'https://putusan3.mahkamahagung.go.id/direktori/putusan/45-pid-sus-tpk-2021-pn-mks.html',
        tanggal_publikasi: '2021-11-29'
      },
      {
        id: 'src-8-2',
        case_id: 'case-8',
        nama_media: 'Detikcom',
        url: 'https://news.detik.com/berita/d-5833446/nurdin-abdullah-divonis-5-tahun-penjara',
        tanggal_publikasi: '2021-11-29'
      }
    ]
  },
  {
    id: 'case-9',
    official_id: 'off-9',
    ringkasan_kasus: 'Dugaan pemberian suap kepada Komisioner Komisi Pemilihan Umum (KPU) Wahyu Setiawan untuk meloloskan penetapan Pengganti Antarwaktu (PAW) anggota DPR RI Dapil Sumsel I periode 2019-2024.',
    nilai_kerugian_negara: 850000000, // Rp 850 Juta
    tahun_kejadian: 2019,
    tahun_putusan: null,
    status_hukum: 'Tersangka',
    jenis_kasus: 'Suap Penetapan PAW Anggota Legislatif DPR RI',
    perusahaan_terkait: [],
    is_verified: true,
    is_template: false,
    created_at: '2023-02-01T15:00:00Z',
    sources: [
      {
        id: 'src-9-1',
        case_id: 'case-9',
        nama_media: 'KPK.go.id (Daftar Pencarian Orang KPK)',
        url: 'https://www.kpk.go.id/id/dpo/1614-harun-masiku',
        tanggal_publikasi: '2020-01-09'
      },
      {
        id: 'src-9-2',
        case_id: 'case-9',
        nama_media: 'Kompas.com',
        url: 'https://nasional.kompas.com/read/2020/01/09/21443441/kpk-tetapkan-wahyu-setiawan-dan-harun-masiku-sebagai-tersangka-suap',
        tanggal_publikasi: '2020-01-09'
      }
    ]
  },
  {
    id: 'case-10',
    official_id: 'off-10',
    ringkasan_kasus: 'Penyelidikan kasus dugaan korupsi pengelolaan instalasi pengolahan air PDAM Kota Makassar. Gugatan praperadilan mantan walikota dikabulkan oleh Pengadilan Negeri Jakarta Selatan yang membatalkan penetapan status tersangkanya.',
    nilai_kerugian_negara: 38100000000, // Rp 38.1 Miliar (Dugaan semula)
    tahun_kejadian: 2012,
    tahun_putusan: 2015,
    status_hukum: 'Bebas/Praperadilan',
    jenis_kasus: 'Gugatan Penetapan Tersangka / Praperadilan',
    perusahaan_terkait: [],
    is_verified: true,
    is_template: false,
    created_at: '2023-03-10T12:00:00Z',
    sources: [
      {
        id: 'src-10-1',
        case_id: 'case-10',
        nama_media: 'Pengadilan Negeri Jakarta Selatan (Putusan Praperadilan)',
        url: 'https://putusan3.mahkamahagung.go.id/direktori/putusan/17-pid-prap-2015-pn-jkt-sel.html',
        tanggal_publikasi: '2015-05-12'
      },
      {
        id: 'src-10-2',
        case_id: 'case-10',
        nama_media: 'Detikcom',
        url: 'https://news.detik.com/berita/d-2912445/hakim-kabulkan-praperadilan-status-tersangka-ilham-arief-sirajuddin-batal',
        tanggal_publikasi: '2015-05-12'
      }
    ]
  },
  {
    id: 'case-11',
    official_id: 'off-11',
    ringkasan_kasus: 'Penerimaan suap dan gratifikasi penyaluran dana hibah dari Kementerian Pemuda dan Olahraga kepada Komite Olahraga Nasional Indonesia (KONI) Pusat Tahun Anggaran 2018.',
    nilai_kerugian_negara: 11500000000, // Rp 11.5 Miliar
    tahun_kejadian: 2018,
    tahun_putusan: 2021,
    status_hukum: 'Divonis Inkrah',
    jenis_kasus: 'Suap Penyaluran Dana Hibah Olahraga',
    perusahaan_terkait: [],
    is_verified: true,
    is_template: false,
    created_at: '2023-04-15T14:00:00Z',
    sources: [
      {
        id: 'src-11-1',
        case_id: 'case-11',
        nama_media: 'Mahkamah Agung RI (Putusan Kasasi)',
        url: 'https://putusan3.mahkamahagung.go.id/direktori/putusan/485-k-pid-sus-2021.html',
        tanggal_publikasi: '2021-03-15'
      },
      {
        id: 'src-11-2',
        case_id: 'case-11',
        nama_media: 'CNN Indonesia',
        url: 'https://www.cnnindonesia.com/nasional/20210316104845-12-617942/ma-tolak-kasasi-eks-menpora-imam-nahrawi-tetap-bui-7-tahun',
        tanggal_publikasi: '2021-03-16'
      }
    ]
  },
  {
    id: 'case-12',
    official_id: 'off-12',
    ringkasan_kasus: 'Pemberian suap kepada pejabat Kementerian Keuangan untuk melancarkan perolehan alokasi Dana Alokasi Khusus (DAK) dan Dana Insentif Daerah (DID) Kota Tasikmalaya.',
    nilai_kerugian_negara: 1000000000, // Rp 1 Miliar
    tahun_kejadian: 2017,
    tahun_putusan: 2021,
    status_hukum: 'Divonis Inkrah',
    jenis_kasus: 'Suap Pengurusan Anggaran DAK/DID Daerah',
    perusahaan_terkait: [],
    is_verified: true,
    is_template: false,
    created_at: '2023-05-12T16:00:00Z',
    sources: [
      {
        id: 'src-12-1',
        case_id: 'case-12',
        nama_media: 'Pengadilan Tipikor Bandung',
        url: 'https://putusan3.mahkamahagung.go.id/direktori/putusan/59-pid-sus-tpk-2020-pn-bdg.html',
        tanggal_publikasi: '2021-02-24'
      },
      {
        id: 'src-12-2',
        case_id: 'case-12',
        nama_media: 'Detikcom',
        url: 'https://news.detik.com/berita-jawa-barat/d-5402422/terbukti-suap-pejabat-kemenkeu-walkot-tasikmalaya-divonis-1-tahun-bui',
        tanggal_publikasi: '2021-02-24'
      }
    ]
  },
  {
    id: 'case-template',
    official_id: 'off-template',
    ringkasan_kasus: 'CONTOH TEMPLATE DUMMY: Dugaan suap perizinan lahan proyek strategis daerah (Template ini disediakan sebagai contoh formulir terverifikasi sebelum data resmi diinputkan).',
    nilai_kerugian_negara: 5000000000, // Rp 5 Miliar
    tahun_kejadian: 2023,
    tahun_putusan: null,
    status_hukum: 'Terdakwa',
    jenis_kasus: 'CONTOH TEMPLATE — GANTI DENGAN DATA VERIFIKASI',
    perusahaan_terkait: [],
    is_verified: false,
    is_template: true,
    created_at: '2024-01-01T00:00:00Z',
    sources: [
      {
        id: 'src-tmpl-1',
        case_id: 'case-template',
        nama_media: 'Humas Kejaksaan Agung RI (Contoh Link Verifikasi)',
        url: 'https://kejaksaan.go.id/berita-terverifikasi-contoh',
        tanggal_publikasi: '2023-11-20'
      }
    ]
  }
];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'log-1',
    admin_id: 'admin_utama',
    perintah_asli: 'Tambahkan kasus korupsi mantan Walikota Bekasi Rahmat Effendi suap pengadaan barang jasa 10 Miliar tahun 2021, vonis inkrah 2023',
    riwayat_klarifikasi: [
      {
        role: 'admin',
        text: 'Tambahkan kasus korupsi mantan Walikota Bekasi Rahmat Effendi suap pengadaan barang jasa 10 Miliar tahun 2021, vonis inkrah 2023',
        timestamp: '2024-02-01T09:12:00Z'
      },
      {
        role: 'ai',
        text: 'Terima kasih. Sebelum saya menyusun draft terstruktur:\n1. Bisa sertakan link putusan Mahkamah Agung atau siaran pers KPK resmi?\n2. Mohon konfirmasi partai politik dan status hukumnya.',
        timestamp: '2024-02-01T09:12:05Z'
      },
      {
        role: 'admin',
        text: 'Partai Golkar, status Divonis Inkrah, sumber https://putusan3.mahkamahagung.go.id/direktori/putusan/1899-k-pid-sus-2023.html dan berita Detikcom',
        timestamp: '2024-02-01T09:13:20Z'
      },
      {
        role: 'ai',
        text: 'Informasi lengkap dan terverifikasi. Draft siap ditinjau.',
        timestamp: '2024-02-01T09:13:25Z'
      }
    ],
    hasil_ai: {
      official: {
        nama: 'Rahmat Effendi',
        jabatan: 'Walikota Bekasi (2012-2022)',
        partai: 'Partai Golkar',
        provinsi: 'Jawa Barat',
        kota_kabupaten: 'Kota Bekasi',
        daerah_pemilihan: 'Kota Bekasi'
      },
      corruption_case: {
        ringkasan_kasus: 'Penerimaan suap pengadaan barang dan jasa serta lelang jabatan di lingkungan Pemerintah Kota Bekasi dan ganti rugi pembebasan lahan.',
        nilai_kerugian_negara: 10000000000,
        tahun_kejadian: 2021,
        tahun_putusan: 2023,
        status_hukum: 'Divonis Inkrah',
        jenis_kasus: 'Suap Lelang Jabatan & Proyek Daerah',
        is_verified: true,
        is_template: false,
        created_at: '2024-02-01T09:14:00Z'
      },
      sources: [
        {
          nama_media: 'Mahkamah Agung RI',
          url: 'https://putusan3.mahkamahagung.go.id/direktori/putusan/1899-k-pid-sus-2023.html',
          tanggal_publikasi: '2023-05-24'
        }
      ]
    },
    status: 'disetujui',
    timestamp: '2024-02-01T09:15:00Z',
    created_case_id: 'case-5',
    catatan_admin: 'Data terverifikasi salinan putusan MA nomor 1899 K/Pid.Sus/2023.'
  }
];

export const INITIAL_REPORTS: UserReport[] = [
  {
    id: 'rep-1',
    case_id: 'case-3',
    case_title: 'Syahrul Yasin Limpo',
    deskripsi_kesalahan: 'Catatan tambahan: Pengadilan Tinggi DKI Jakarta telah menaikkan vonis menjadi 12 tahun penjara pada 10 September 2024.',
    email_pelapor: 'advokat.publik@gmail.com',
    status: 'disetujui',
    created_at: '2024-09-12T10:00:00Z'
  }
];
