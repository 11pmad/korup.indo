import { z } from 'zod';

const rawDbUrl = process.env.DATABASE_URL?.trim() || '';
const isVercel = Boolean(process.env.VERCEL);
const pointsToLocalhost = /localhost|127\.0\.0\.1/.test(rawDbUrl);

/**
 * False on Vercel when DATABASE_URL is missing or still points to localhost.
 * Public read endpoints automatically fall back to data/normalized/*.json when false.
 */
export const isDatabaseConfigured = isVercel
  ? Boolean(rawDbUrl) && !pointsToLocalhost
  : rawDbUrl
    ? true
    : process.env.NODE_ENV !== 'production';

const defaultDbUrl = 'postgres://postgres@localhost:5432/lki_v2_db';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DATABASE_URL: z
    .string()
    .optional()
    .transform((v) => v?.trim() || defaultDbUrl),
  DIRECT_URL: z.string().optional(),
  NEXT_PUBLIC_APP_URL: z.string().default(
    process.env.NODE_ENV === 'production'
      ? 'https://korup-indo.vercel.app'
      : 'http://localhost:3000'
  ),
  ADMIN_JWT_SECRET: z.string().optional(),
  CITIZEN_JWT_SECRET: z.string().optional(),
  CRON_SECRET: z.string().optional(),
  IP_HASH_SALT: z
    .string()
    .optional()
    .transform(
      (v) => v?.trim() || process.env.VERCEL_PROJECT_ID || 'lki-anon-ip-salt-v2'
    ),
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
