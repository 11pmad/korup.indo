import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { NextRequest } from 'next/server';
import { eq, or } from 'drizzle-orm';
import { apiError, apiSuccess, applyRateLimit } from '@/server/auth';
import { db, schema } from '@/server/db';
import { citizenRegisterSchema } from '@/server/validators';
import { sendCitizenOtpEmail } from '@/server/mailer';

export async function POST(req: NextRequest) {
  const limited = await applyRateLimit(req, 'auth_strict', 10, 900);
  if (limited) return limited;

  const body = await req.json().catch(() => null);
  const parsed = citizenRegisterSchema.safeParse(body);
  if (!parsed.success) {
    return apiError('VALIDATION_ERROR', parsed.error.issues[0]?.message || 'Data registrasi tidak valid.', 400);
  }

  const username = parsed.data.username.toLowerCase();
  const email = parsed.data.email.toLowerCase();

  const existing = await db
    .select({ id: schema.citizenUsers.id, username: schema.citizenUsers.username })
    .from(schema.citizenUsers)
    .where(or(eq(schema.citizenUsers.username, username), eq(schema.citizenUsers.email, email)))
    .limit(1);

  if (existing.length > 0) {
    return apiError(
      'CONFLICT',
      existing[0].username === username
        ? 'Username sudah digunakan.'
        : 'Email sudah terdaftar. Silakan masuk atau verifikasi OTP.',
      409
    );
  }

  const otpCode = String(crypto.randomInt(100000, 1000000));
  const otpHash = crypto.createHash('sha256').update(otpCode).digest('hex');
  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  const avatarSeeds = ['garuda', 'merah', 'emas', 'banteng', 'padi'] as const;
  const avatarSeed = avatarSeeds[crypto.randomInt(0, avatarSeeds.length)];

  const userId = `usr-${crypto.randomUUID().slice(0, 12)}`;
  await db.insert(schema.citizenUsers).values({
    id: userId,
    username,
    display_name: parsed.data.displayName,
    email,
    password_hash: passwordHash,
    origin_province: parsed.data.originProvince || null,
    origin_city: parsed.data.originCity || null,
    avatar_seed: avatarSeed,
    is_email_verified: false,
    email_verification_code_hash: otpHash,
    email_verification_expires: new Date(Date.now() + 15 * 60 * 1000),
    auth_provider: 'local',
  });

  await sendCitizenOtpEmail({
    to: email,
    displayName: parsed.data.displayName,
    otpCode,
  });

  return apiSuccess(
    {
      email,
      requiresOtp: true,
      message: 'Registrasi berhasil. Masukkan kode OTP 6 digit yang dikirim ke email Anda.',
    },
    undefined,
    201
  );
}
