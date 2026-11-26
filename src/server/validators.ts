import { z } from 'zod';

const PRIVATE_HOST_REGEX =
  /^(localhost|127\.|0\.0\.0\.0|10\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.|169\.254\.|\[?::1\]?|\[?fe80:|.*\.local$)/i;

export const safeExternalUrlSchema = z
  .string()
  .trim()
  .url('URL sumber harus berupa tautan valid (contoh: https://putusan3.mahkamahagung.go.id/...)')
  .refine((val) => {
    try {
      const u = new URL(val);
      if (u.protocol !== 'https:' && u.protocol !== 'http:') return false;
      if (PRIVATE_HOST_REGEX.test(u.hostname)) return false;
      return u.hostname.includes('.');
    } catch {
      return false;
    }
  }, 'URL tidak boleh mengarah ke jaringan lokal/privat atau protokol non-HTTP');

export const legalStatusSchema = z.enum([
  'penyelidikan',
  'penyidikan',
  'tersangka',
  'terdakwa',
  'dituntut',
  'divonis_bersalah',
  'divonis_inkrah',
  'banding',
  'kasasi',
  'peninjauan_kembali',
  'bebas',
  'lepas',
  'meninggal',
  'status_tidak_diketahui',
]);

export const sectorCategorySchema = z.enum([
  'pengadaan_barang_jasa',
  'bansos_bencana',
  'suap_gratifikasi',
  'perizinan_sda_tambang',
  'mafia_peradilan',
  'perbankan_keuangan',
  'bumn_korporasi',
  'pajak_bea_cukai',
  'penyalahgunaan_anggaran',
]);

export const reactionTypeSchema = z.enum([
  'geram',
  'rampok',
  'memalukan',
  'didukung',
  'khilaf_administrasi',
  'dimaklumi',
  'tebang_pilih',
  'kawal_sidang',
]);

export const reportSubmissionSchema = z.object({
  caseId: z.string().trim().optional().nullable(),
  reportType: z.enum(['koreksi_data', 'rujukan_putusan_baru', 'usulan_kasus_baru', 'hak_jawab']),
  description: z
    .string()
    .trim()
    .min(20, 'Jelaskan koreksi/usulan minimal 20 karakter')
    .max(3000, 'Deskripsi maksimal 3000 karakter'),
  referenceUrl: safeExternalUrlSchema,
  submitterContact: z.string().trim().max(120).optional().or(z.literal('')),
});

export const citizenRegisterSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, 'Username minimal 3 karakter')
    .max(30)
    .regex(/^[a-zA-Z0-9_]+$/, 'Username hanya boleh huruf, angka, dan underscore'),
  displayName: z.string().trim().min(2, 'Nama tampilan minimal 2 karakter').max(50),
  email: z.string().trim().email('Format email tidak valid'),
  password: z.string().min(8, 'Kata sandi minimal 8 karakter').max(100),
  originProvince: z.string().trim().max(60).optional().or(z.literal('')),
  originCity: z.string().trim().max(60).optional().or(z.literal('')),
});

export const citizenVerifyOtpSchema = z.object({
  email: z.string().trim().email('Format email tidak valid'),
  code: z.string().trim().regex(/^\d{6}$/, 'Kode OTP harus 6 digit angka'),
});

export const citizenLoginSchema = z.object({
  identifier: z.string().trim().min(1, 'Username atau email wajib diisi'),
  password: z.string().min(1, 'Kata sandi wajib diisi'),
});

export const citizenProfilePatchSchema = z.object({
  displayName: z.string().trim().min(2).max(50),
  originProvince: z.string().trim().max(60).optional().or(z.literal('')),
  originCity: z.string().trim().max(60).optional().or(z.literal('')),
  bio: z.string().trim().max(250).optional().or(z.literal('')),
  avatarSeed: z.enum(['garuda', 'merah', 'emas', 'banteng', 'padi']).optional(),
});

export const commentCreateSchema = z.object({
  content: z.string().trim().min(5, 'Komentar minimal 5 karakter').max(1200, 'Komentar maksimal 1200 karakter'),
  reactionType: reactionTypeSchema.optional().nullable(),
});

export const adminCaseCreateSchema = z
  .object({
    caseTitle: z.string().trim().min(8, 'Judul perkara minimal 8 karakter').max(250),
    caseNumber: z.string().trim().max(120).optional().or(z.literal('')),
    eraId: z.string().trim().min(1),
    primaryProvinceId: z.string().trim().min(1),
    sectorCategory: sectorCategorySchema,
    sectorLabel: z.string().trim().min(2).max(100),
    primaryMode: z.string().trim().min(2).max(100),
    caseDate: z.string().trim().optional().or(z.literal('')),
    currentLegalStatus: legalStatusSchema,
    summary: z.string().trim().min(25, 'Ringkasan kasus minimal 25 karakter').max(4000),
    chargesArticles: z.string().trim().max(500).optional().or(z.literal('')),
    personName: z.string().trim().min(2, 'Nama tokoh/subjek wajib diisi').max(150),
    personPosition: z.string().trim().min(2, 'Jabatan wajib diisi').max(150),
    partyId: z.string().trim().optional().or(z.literal('')),
    companyName: z.string().trim().max(150).optional().or(z.literal('')),
    financialType: z.enum([
      'court_recognized_loss_amount',
      'audit_loss_amount',
      'prosecutor_loss_amount',
      'alleged_loss_amount',
      'estimated_loss_amount',
      'bribe_amount',
      'gratification_amount',
    ]),
    amount: z.number().min(0, 'Nominal tidak boleh negatif'),
    sourceTitle: z.string().trim().min(4, 'Judul sumber rujukan wajib diisi').max(250),
    sourceUrl: safeExternalUrlSchema,
    sourceInstitution: z.string().trim().min(2, 'Lembaga sumber wajib diisi').max(150),
    sourceExcerpt: z.string().trim().min(10, 'Kutipan fakta sumber wajib diisi').max(1000),
    verdictDecisionNumber: z.string().trim().max(120).optional().or(z.literal('')),
    verdictCourt: z.string().trim().max(150).optional().or(z.literal('')),
    verdictDate: z.string().trim().optional().or(z.literal('')),
    prisonMonths: z.number().int().min(0).max(1200).optional(),
    fineAmount: z.number().min(0).optional(),
    restitutionAmount: z.number().min(0).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.currentLegalStatus === 'divonis_inkrah' && !data.verdictDecisionNumber?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['verdictDecisionNumber'],
        message: 'Perkara berstatus Divonis Inkrah wajib menyertakan nomor putusan pengadilan.',
      });
    }
  });

export const adminCasePatchSchema = z.object({
  caseTitle: z.string().trim().min(8).max(250).optional(),
  currentLegalStatus: legalStatusSchema.optional(),
  summary: z.string().trim().min(20).max(4000).optional(),
  verificationNote: z.string().trim().max(1000).optional(),
  needsManualReview: z.boolean().optional(),
  primaryProvinceId: z.string().trim().optional(),
  eraId: z.string().trim().optional(),
});

export const adminReportModerateSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  moderatorNote: z.string().trim().min(3, 'Catatan moderator wajib diisi').max(1000),
});

export const adminSiteSettingsSchema = z.object({
  key: z.enum(['announcement', 'donation']),
  value: z.record(z.string(), z.unknown()),
});
