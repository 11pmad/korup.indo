import crypto from 'crypto';
import { NextRequest } from 'next/server';
import { OAuth2Client } from 'google-auth-library';
import { eq, or } from 'drizzle-orm';
import { z } from 'zod';
import { env } from '@/env';
import {
  apiError,
  apiSuccess,
  applyRateLimit,
  CITIZEN_COOKIE_NAME,
  cookieOptions,
  signCitizenSession,
} from '@/server/auth';
import { db, schema } from '@/server/db';
import { slugify } from '@/lib/formatters';

export async function POST(req: NextRequest) {
  const limited = await applyRateLimit(req, 'auth_strict', 10, 900);
  if (limited) return limited;

  if (!env.GOOGLE_CLIENT_ID) {
    return apiError('CONFLICT', 'Login Google belum diaktifkan pada konfigurasi server.', 503);
  }

  const body = await req.json().catch(() => null);
  const parsed = z.object({ idToken: z.string().min(20) }).safeParse(body);
  if (!parsed.success) {
    return apiError('VALIDATION_ERROR', 'ID Token Google wajib disertakan.', 400);
  }

  try {
    const client = new OAuth2Client(env.GOOGLE_CLIENT_ID);
    const ticket = await client.verifyIdToken({
      idToken: parsed.data.idToken,
      audience: env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload?.email || !payload.email_verified || !payload.sub) {
      return apiError('UNAUTHORIZED', 'Token Google tidak valid atau email belum terverifikasi.', 401);
    }

    const email = payload.email.toLowerCase();
    const googleId = payload.sub;

    let [user] = await db
      .select()
      .from(schema.citizenUsers)
      .where(or(eq(schema.citizenUsers.google_id, googleId), eq(schema.citizenUsers.email, email)))
      .limit(1);

    if (!user) {
      const baseUsername = slugify(email.split('@')[0]).replace(/-/g, '_') || 'warga';
      const username = `${baseUsername.slice(0, 20)}_${crypto.randomBytes(2).toString('hex')}`;
      const newId = `usr-${crypto.randomUUID().slice(0, 12)}`;
      await db.insert(schema.citizenUsers).values({
        id: newId,
        username,
        display_name: payload.name || baseUsername,
        email,
        google_id: googleId,
        photo_url: payload.picture || null,
        avatar_seed: 'garuda',
        is_email_verified: true,
        auth_provider: 'google',
      });
      [user] = await db
        .select()
        .from(schema.citizenUsers)
        .where(eq(schema.citizenUsers.id, newId))
        .limit(1);
    } else if (!user.google_id || !user.is_email_verified) {
      await db
        .update(schema.citizenUsers)
        .set({ google_id: googleId, is_email_verified: true, updated_at: new Date() })
        .where(eq(schema.citizenUsers.id, user.id));
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
  } catch {
    return apiError('UNAUTHORIZED', 'Verifikasi Google Sign-In gagal.', 401);
  }
}
