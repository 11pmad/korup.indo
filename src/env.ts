import { z } from 'zod';

const isProd = process.env.NODE_ENV === 'production';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DATABASE_URL: isProd
    ? z.string().min(1, 'DATABASE_URL wajib diisi di produksi')
    : z.string().default('postgres://postgres@localhost:5432/lki_v2_db'),
  DIRECT_URL: z.string().optional(),
  NEXT_PUBLIC_APP_URL: z.string().default('http://localhost:3000'),
  ADMIN_JWT_SECRET: isProd
    ? z.string().min(32, 'ADMIN_JWT_SECRET minimal 32 karakter di produksi')
    : z.string().min(16).default('dev-admin-secret-only-not-for-prod-use-32ch'),
  CITIZEN_JWT_SECRET: isProd
    ? z.string().min(32, 'CITIZEN_JWT_SECRET minimal 32 karakter di produksi')
    : z.string().min(16).default('dev-citizen-secret-only-not-for-prod-32ch'),
  CRON_SECRET: isProd
    ? z.string().min(16, 'CRON_SECRET wajib diisi di produksi')
    : z.string().default('dev-cron-secret-local'),
  IP_HASH_SALT: isProd
    ? z.string().min(16, 'IP_HASH_SALT wajib diisi di produksi')
    : z.string().default('dev-ip-hash-salt-local'),
  INITIAL_SUPERADMIN_USERNAME: z.string().default('superadmin'),
  INITIAL_SUPERADMIN_PASSWORD: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  NEXT_PUBLIC_GOOGLE_CLIENT_ID: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().default('LKI Transparansi <noreply@localhost>'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const details = parsed.error.issues
    .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
    .join('; ');
  throw new Error(`Konfigurasi Environment LKI tidak valid: ${details}`);
}

export const env = parsed.data;
