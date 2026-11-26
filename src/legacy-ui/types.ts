export type LegalStatus = 'Tersangka' | 'Terdakwa' | 'Divonis Inkrah' | 'Bebas/Praperadilan';

export interface Official {
  id: string;
  nama: string;
  jabatan: string;
  partai: string;
  provinsi: string;
  kota_kabupaten: string;
  daerah_pemilihan: string;
  foto_url?: string;
}

export interface CaseSource {
  id: string;
  case_id: string;
  nama_media: string;
  url: string;
  tanggal_publikasi: string;
}

export interface Company {
  id: string;
  nama_perusahaan: string;
  sektor: string;
  kasus_terkait: string[];
}

export interface CorruptionCase {
  id: string;
  official_id: string;
  official?: Official;
  ringkasan_kasus: string;
  nilai_kerugian_negara: number; // in IDR Rupiah
  tahun_kejadian: number;
  tahun_putusan?: number | null;
  status_hukum: LegalStatus;
  jenis_kasus: string;
  perusahaan_terkait?: string[];
  sources: CaseSource[];
  is_verified: boolean;
  is_template?: boolean;
  province_name?: string;
  era_id?: string;
  era_name?: string;
  created_at: string;
}

export interface RegionSummary {
  provinsi: string;
  total_kasus: number;
  total_kerugian: number;
  island_group: string;
}

export interface LeaderboardItem {
  rank: number;
  official_id: string;
  nama: string;
  jabatan: string;
  partai: string;
  provinsi: string;
  total_kasus: number;
  total_kerugian_negara: number;
  status_hukum_terkini: LegalStatus;
  tahun_terkini: number;
  case_ids: string[];
}

export interface StatsOverview {
  total_kasus_nasional: number;
  total_kerugian_akumulasi: number;
  provinsi_terbanyak: {
    provinsi: string;
    total_kasus: number;
    total_kerugian: number;
  };
  top_kerugian: {
    case_id: string;
    nama: string;
    jabatan: string;
    nilai_kerugian_negara: number;
    status_hukum: LegalStatus;
    tahun: number;
  }[];
  distribusi_partai: {
    partai: string;
    total_kasus: number;
    total_kerugian: number;
    color: string;
  }[];
  top_perusahaan: {
    nama_perusahaan: string;
    sektor: string;
    total_kasus: number;
  }[];
}

export interface AuditLog {
  id: string;
  admin_id: string;
  perintah_asli: string;
  riwayat_klarifikasi: {
    role: 'admin' | 'ai';
    text: string;
    timestamp: string;
  }[];
  hasil_ai: {
    official: Omit<Official, 'id'>;
    corruption_case: Omit<CorruptionCase, 'id' | 'official_id' | 'official' | 'sources'>;
    sources: Omit<CaseSource, 'id' | 'case_id'>[];
    companies?: string[];
  } | null;
  status: 'pending' | 'disetujui' | 'ditolak';
  timestamp: string;
  created_case_id?: string;
  catatan_admin?: string;
}

export interface UserReport {
  id: string;
  case_id: string;
  case_title?: string;
  deskripsi_kesalahan: string;
  email_pelapor?: string;
  status: 'menunggu_review' | 'disetujui' | 'ditolak';
  created_at: string;
}
