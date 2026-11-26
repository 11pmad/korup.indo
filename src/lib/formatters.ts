export type LegalStatusValue =
  | 'penyelidikan'
  | 'penyidikan'
  | 'tersangka'
  | 'terdakwa'
  | 'dituntut'
  | 'divonis_bersalah'
  | 'divonis_inkrah'
  | 'banding'
  | 'kasasi'
  | 'peninjauan_kembali'
  | 'bebas'
  | 'lepas'
  | 'meninggal'
  | 'status_tidak_diketahui';

export type SectorCategoryValue =
  | 'pengadaan_barang_jasa'
  | 'bansos_bencana'
  | 'suap_gratifikasi'
  | 'perizinan_sda_tambang'
  | 'mafia_peradilan'
  | 'perbankan_keuangan'
  | 'bumn_korporasi'
  | 'pajak_bea_cukai'
  | 'penyalahgunaan_anggaran';

export function toNum(val: string | number | null | undefined): number {
  if (val === null || val === undefined || val === '') return 0;
  const parsed = typeof val === 'number' ? val : Number(val);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function formatRupiah(amount: number, opts?: { compact?: boolean }): string {
  const safe = Number.isFinite(amount) ? amount : 0;
  if (opts?.compact) {
    const abs = Math.abs(safe);
    const sign = safe < 0 ? '-' : '';
    if (abs >= 1e12) return `${sign}Rp ${(abs / 1e12).toLocaleString('id-ID', { maximumFractionDigits: 2 })} T`;
    if (abs >= 1e9) return `${sign}Rp ${(abs / 1e9).toLocaleString('id-ID', { maximumFractionDigits: 2 })} M`;
    if (abs >= 1e6) return `${sign}Rp ${(abs / 1e6).toLocaleString('id-ID', { maximumFractionDigits: 1 })} Jt`;
  }
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(safe);
}

export function formatDateId(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return 'Belum tercatat';
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (Number.isNaN(d.getTime())) return 'Belum tercatat';
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(d);
}

export function formatSentence(months: number, sentenceType?: string | null): string {
  if (sentenceType && /mati|seumur hidup/i.test(sentenceType)) {
    return sentenceType;
  }
  if (!months || months <= 0) {
    return sentenceType || '-';
  }
  const years = Math.floor(months / 12);
  const rem = months % 12;
  const parts: string[] = [];
  if (years > 0) parts.push(`${years} tahun`);
  if (rem > 0) parts.push(`${rem} bulan`);
  return `${parts.join(' ')} penjara`;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 96);
}

export function isInkrahStatus(status: string): boolean {
  return status === 'divonis_inkrah' || status === 'divonis_bersalah';
}

export function isAcquittedStatus(status: string): boolean {
  return status === 'bebas' || status === 'lepas';
}

export function requiresPresumptionWarning(status: string): boolean {
  return !isInkrahStatus(status) && !isAcquittedStatus(status) && status !== 'meninggal';
}

export const LEGAL_STATUS_META: Record<
  LegalStatusValue,
  { label: string; shortLabel: string; tone: 'crimson' | 'amber' | 'emerald' | 'slate'; description: string }
> = {
  divonis_inkrah: {
    label: 'Divonis Inkrah',
    shortLabel: 'Inkrah',
    tone: 'crimson',
    description: 'Putusan pengadilan telah berkekuatan hukum tetap.',
  },
  divonis_bersalah: {
    label: 'Divonis Bersalah',
    shortLabel: 'Vonis PN/PT',
    tone: 'crimson',
    description: 'Telah diputus bersalah oleh majelis hakim.',
  },
  penyelidikan: {
    label: 'Penyelidikan',
    shortLabel: 'Lidik',
    tone: 'amber',
    description: 'Tahap penyelidikan awal — asas praduga tak bersalah berlaku penuh.',
  },
  penyidikan: {
    label: 'Penyidikan',
    shortLabel: 'Sidik',
    tone: 'amber',
    description: 'Tahap penyidikan — asas praduga tak bersalah berlaku penuh.',
  },
  tersangka: {
    label: 'Tersangka',
    shortLabel: 'Tersangka',
    tone: 'amber',
    description: 'Belum inkrah — dilindungi asas praduga tak bersalah (Pasal 8 ayat 1 UU 48/2009).',
  },
  terdakwa: {
    label: 'Terdakwa (Proses Sidang)',
    shortLabel: 'Terdakwa',
    tone: 'amber',
    description: 'Sedang diadili — belum ada putusan berkekuatan hukum tetap.',
  },
  dituntut: {
    label: 'Dituntut Jaksa',
    shortLabel: 'Dituntut',
    tone: 'amber',
    description: 'Tahap tuntutan penuntut umum — menunggu putusan hakim.',
  },
  banding: {
    label: 'Upaya Banding',
    shortLabel: 'Banding',
    tone: 'amber',
    description: 'Dalam pemeriksaan Pengadilan Tinggi — belum inkrah.',
  },
  kasasi: {
    label: 'Upaya Kasasi',
    shortLabel: 'Kasasi',
    tone: 'amber',
    description: 'Dalam pemeriksaan Mahkamah Agung — belum inkrah.',
  },
  peninjauan_kembali: {
    label: 'Peninjauan Kembali',
    shortLabel: 'PK',
    tone: 'amber',
    description: 'Upaya hukum luar biasa Peninjauan Kembali.',
  },
  bebas: {
    label: 'Putusan Bebas (Vrijspraak)',
    shortLabel: 'Bebas',
    tone: 'emerald',
    description: 'Dinyatakan bebas oleh pengadilan / komisi resmi.',
  },
  lepas: {
    label: 'Lepas dari Segala Tuntutan (Onslag)',
    shortLabel: 'Lepas',
    tone: 'emerald',
    description: 'Putusan lepas dari segala tuntutan hukum.',
  },
  meninggal: {
    label: 'Terdakwa/Terpidana Wafat',
    shortLabel: 'Wafat',
    tone: 'slate',
    description: 'Subjek hukum meninggal dunia dalam catatan arsip historis.',
  },
  status_tidak_diketahui: {
    label: 'Status Belum Terkonfirmasi',
    shortLabel: 'Belum Terkonfirmasi',
    tone: 'slate',
    description: 'Menunggu dokumen putusan atau rilis resmi terbaru.',
  },
};

export const SECTOR_LABELS: Record<SectorCategoryValue, string> = {
  pengadaan_barang_jasa: 'Pengadaan Barang & Jasa',
  bansos_bencana: 'Bansos & Penanganan Bencana',
  suap_gratifikasi: 'Suap, Gratifikasi & Pemerasan',
  perizinan_sda_tambang: 'Perizinan SDA, Tambang & Hutan',
  mafia_peradilan: 'Mafia Peradilan & Penegakan Hukum',
  perbankan_keuangan: 'Perbankan & Sektor Keuangan',
  bumn_korporasi: 'Tata Kelola BUMN & Korporasi',
  pajak_bea_cukai: 'Pajak & Bea Cukai',
  penyalahgunaan_anggaran: 'Penyalahgunaan Anggaran Negara',
};

export function mapSectorToCategory(rawSector: string | null | undefined): SectorCategoryValue {
  const s = (rawSector || '').toLowerCase();
  if (s.includes('tambang') || s.includes('hutan') || s.includes('kebun') || s.includes('izin') || s.includes('sda')) {
    return 'perizinan_sda_tambang';
  }
  if (s.includes('bansos') || s.includes('bencana')) {
    return 'bansos_bencana';
  }
  if (s.includes('peradilan')) {
    return 'mafia_peradilan';
  }
  if (s.includes('suap') || s.includes('gratifikasi') || s.includes('pemerasan')) {
    return 'suap_gratifikasi';
  }
  if (s.includes('bank') || s.includes('keuangan')) {
    return 'perbankan_keuangan';
  }
  if (s.includes('pajak') || s.includes('bea')) {
    return 'pajak_bea_cukai';
  }
  if (s.includes('bumn')) {
    return 'bumn_korporasi';
  }
  if (s.includes('anggaran')) {
    return 'penyalahgunaan_anggaran';
  }
  return 'pengadaan_barang_jasa';
}

export const REACTION_META = [
  { key: 'geram', label: 'Geram', emoji: '😡' },
  { key: 'rampok', label: 'Uang Rakyat!', emoji: '💸' },
  { key: 'memalukan', label: 'Memalukan', emoji: '🤦' },
  { key: 'kawal_sidang', label: 'Kawal Sidang', emoji: '⚖️' },
  { key: 'tebang_pilih', label: 'Usut Tuntas', emoji: '🔍' },
  { key: 'khilaf_administrasi', label: 'Celah Sistem', emoji: '📋' },
  { key: 'dimaklumi', label: 'Perlu Edukasi', emoji: '📚' },
  { key: 'didukung', label: 'Apresiasi Penindakan', emoji: '👏' },
] as const;

export const ERA_MAPPING_BY_NAME: Record<string, string> = {
  'Era Kemerdekaan & Orde Lama (1945 - 1966)': 'era-orla',
  'Era Orde Baru (1966 - 1998)': 'era-orba',
  'Reformasi Awal / B.J. Habibie': 'era-habibie',
  'Abdurrahman Wahid': 'era-gusdur',
  'Megawati Soekarnoputri': 'era-megawati',
  'Susilo Bambang Yudhoyono Periode I': 'era-sby-1',
  'Susilo Bambang Yudhoyono Periode II': 'era-sby-2',
  'Joko Widodo Periode I': 'era-jokowi-1',
  'Joko Widodo Periode II': 'era-jokowi-2',
  'Prabowo Subianto': 'era-prabowo',
};
