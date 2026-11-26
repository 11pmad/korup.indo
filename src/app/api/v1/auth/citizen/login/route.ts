import bcrypt from 'bcryptjs';
import { NextRequest } from 'next/server';
import { eq, or } from 'drizzle-orm';
import {
  apiError,
  apiSuccess,
  applyRateLimit,
  CITIZEN_COOKIE_NAME,
  cookieOptions,
  signCitizenSession,
} from '@/server/auth';
import { db, schema } from '@/server/db';
import { citizenLoginSchema } from '@/server/validators';

export async function POST(req: NextRequest) {
  const limited = await applyRateLimit(req, 'auth_strict', 10, 900);
  if (limited) return limited;

  const body = await req.json().catch(() => null);
  const parsed = citizenLoginSchema.safeParse(body);
  if (!parsed.success) {
    return apiError('VALIDATION_ERROR', parsed.error.issues[0]?.message || 'Input login tidak valid.', 400);
  }

  const idLower = parsed.data.identifier.toLowerCase();
  const [user] = await db
    .select()
    .from(schema.citizenUsers)
    .where(or(eq(schema.citizenUsers.username, idLower), eq(schema.citizenUsers.email, idLower)))
    .limit(1);

  if (!user || !user.password_hash) {
    return apiError('UNAUTHORIZED', 'Username/email atau kata sandi salah.', 401);
  }

  const valid = await bcrypt.compare(parsed.data.password, user.password_hash);
  if (!valid) {
    return apiError('UNAUTHORIZED', 'Username/email atau kata sandi salah.', 401);
  }

  if (!user.is_email_verified) {
    return apiError('FORBIDDEN', 'Email Anda belum diverifikasi OTP.', 403, {
      needsVerification: true,
      email: user.email,
    });
  }

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
