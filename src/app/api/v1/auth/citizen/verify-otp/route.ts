import crypto from 'crypto';
import { NextRequest } from 'next/server';
import { eq, sql } from 'drizzle-orm';
import {
  apiError,
  apiSuccess,
  applyRateLimit,
  CITIZEN_COOKIE_NAME,
  cookieOptions,
  signCitizenSession,
} from '@/server/auth';
import { db, schema } from '@/server/db';
import { citizenVerifyOtpSchema } from '@/server/validators';

export async function POST(req: NextRequest) {
  const limited = await applyRateLimit(req, 'auth_strict', 10, 900);
  if (limited) return limited;

  const body = await req.json().catch(() => null);
  const parsed = citizenVerifyOtpSchema.safeParse(body);
  if (!parsed.success) {
    return apiError('VALIDATION_ERROR', parsed.error.issues[0]?.message || 'Format OTP tidak valid.', 400);
  }

  const email = parsed.data.email.toLowerCase();
  const [user] = await db
    .select()
    .from(schema.citizenUsers)
    .where(eq(schema.citizenUsers.email, email))
    .limit(1);

  if (!user) {
    return apiError('NOT_FOUND', 'Akun dengan email tersebut tidak ditemukan.', 404);
  }
  if (user.is_email_verified) {
    return apiError('CONFLICT', 'Email sudah terverifikasi sebelumnya. Silakan langsung masuk.', 409);
  }
  if (user.otp_attempts >= 5) {
    return apiError('RATE_LIMITED', 'Batas percobaan OTP terlampaui. Silakan kirim ulang kode baru.', 429);
  }
  if (!user.email_verification_expires || user.email_verification_expires < new Date()) {
    return apiError('VALIDATION_ERROR', 'Kode OTP sudah kedaluwarsa. Silakan kirim ulang kode baru.', 400);
  }

  const incomingHash = crypto.createHash('sha256').update(parsed.data.code).digest('hex');
  if (incomingHash !== user.email_verification_code_hash) {
    await db
      .update(schema.citizenUsers)
      .set({ otp_attempts: sql`${schema.citizenUsers.otp_attempts} + 1` })
      .where(eq(schema.citizenUsers.id, user.id));
    return apiError('VALIDATION_ERROR', 'Kode OTP tidak cocok.', 400);
  }

  await db
    .update(schema.citizenUsers)
    .set({
      is_email_verified: true,
      email_verification_code_hash: null,
      email_verification_expires: null,
      otp_attempts: 0,
      updated_at: new Date(),
    })
    .where(eq(schema.citizenUsers.id, user.id));

  const sessionPayload = {
    id: user.id,
    username: user.username,
    displayName: user.display_name,
    email: user.email,
    avatarSeed: user.avatar_seed,
    isEmailVerified: true,
  };

  const token = await signCitizenSession(sessionPayload);
  const res = apiSuccess({ user: sessionPayload });
  res.cookies.set(CITIZEN_COOKIE_NAME, token, cookieOptions(7 * 24 * 3600));
  return res;
}
