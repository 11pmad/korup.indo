import { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import {
  apiError,
  apiSuccess,
  CITIZEN_COOKIE_NAME,
  cookieOptions,
  getCitizenSession,
  signCitizenSession,
} from '@/server/auth';
import { db, schema } from '@/server/db';
import { citizenProfilePatchSchema } from '@/server/validators';

export async function GET() {
  const session = await getCitizenSession();
  if (!session) return apiSuccess({ user: null });

  const [user] = await db
    .select({
      id: schema.citizenUsers.id,
      username: schema.citizenUsers.username,
      displayName: schema.citizenUsers.display_name,
      email: schema.citizenUsers.email,
      originProvince: schema.citizenUsers.origin_province,
      originCity: schema.citizenUsers.origin_city,
      bio: schema.citizenUsers.bio,
      avatarSeed: schema.citizenUsers.avatar_seed,
      isEmailVerified: schema.citizenUsers.is_email_verified,
      authProvider: schema.citizenUsers.auth_provider,
    })
    .from(schema.citizenUsers)
    .where(eq(schema.citizenUsers.id, session.id))
    .limit(1);

  return apiSuccess({ user: user ?? null });
}

export async function PATCH(req: NextRequest) {
  const session = await getCitizenSession();
  if (!session) return apiError('UNAUTHORIZED', 'Sesi warga tidak ditemukan.', 401);

  const body = await req.json().catch(() => null);
  const parsed = citizenProfilePatchSchema.safeParse(body);
  if (!parsed.success) {
    return apiError('VALIDATION_ERROR', parsed.error.issues[0]?.message || 'Profil tidak valid.', 400);
  }

  await db
    .update(schema.citizenUsers)
    .set({
      display_name: parsed.data.displayName,
      origin_province: parsed.data.originProvince || null,
      origin_city: parsed.data.originCity || null,
      bio: parsed.data.bio || null,
      ...(parsed.data.avatarSeed ? { avatar_seed: parsed.data.avatarSeed } : {}),
      updated_at: new Date(),
    })
    .where(eq(schema.citizenUsers.id, session.id));

  const updatedSession = {
    ...session,
    displayName: parsed.data.displayName,
    avatarSeed: parsed.data.avatarSeed ?? session.avatarSeed,
  };
  const token = await signCitizenSession(updatedSession);
  const res = apiSuccess({ user: updatedSession });
  res.cookies.set(CITIZEN_COOKIE_NAME, token, cookieOptions(7 * 24 * 3600));
  return res;
}

export async function DELETE() {
  const session = await getCitizenSession();
  if (!session) return apiError('UNAUTHORIZED', 'Sesi warga tidak ditemukan.', 401);

  await db.delete(schema.citizenUsers).where(eq(schema.citizenUsers.id, session.id));
  const res = apiSuccess({ deleted: true });
  res.cookies.delete(CITIZEN_COOKIE_NAME);
  return res;
}
