import crypto from 'crypto';
import { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { apiError, apiSuccess, applyRateLimit } from '@/server/auth';
import { db, schema } from '@/server/db';
import { sendCitizenOtpEmail } from '@/server/mailer';

export async function POST(req: NextRequest) {
  const limited = await applyRateLimit(req, 'auth_strict', 5, 900);
  if (limited) return limited;

  const body = await req.json().catch(() => null);
  const parsed = z.object({ email: z.string().trim().email() }).safeParse(body);
  if (!parsed.success) return apiError('VALIDATION_ERROR', 'Format email tidak valid.', 400);

  const email = parsed.data.email.toLowerCase();
  const [user] = await db
    .select()
    .from(schema.citizenUsers)
    .where(eq(schema.citizenUsers.email, email))
    .limit(1);

  if (!user || user.is_email_verified) {
    return apiSuccess({ message: 'Jika email terdaftar dan belum terverifikasi, OTP baru telah dikirim.' });
  }

  const otpCode = String(crypto.randomInt(100000, 1000000));
  const otpHash = crypto.createHash('sha256').update(otpCode).digest('hex');

  await db
    .update(schema.citizenUsers)
    .set({
      email_verification_code_hash: otpHash,
      email_verification_expires: new Date(Date.now() + 15 * 60 * 1000),
      otp_attempts: 0,
      updated_at: new Date(),
    })
    .where(eq(schema.citizenUsers.id, user.id));

  await sendCitizenOtpEmail({ to: email, displayName: user.display_name, otpCode });
  return apiSuccess({ message: 'Kode OTP baru telah dikirim.' });
}
