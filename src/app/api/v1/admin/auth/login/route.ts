import bcrypt from 'bcryptjs';
import { NextRequest } from 'next/server';
import { eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import {
  ADMIN_COOKIE_NAME,
  apiError,
  apiSuccess,
  applyRateLimit,
  cookieOptions,
  getClientIp,
  hashIp,
  recordAuditLog,
  signAdminSession,
} from '@/server/auth';
import { db, schema } from '@/server/db';

const loginSchema = z.object({
  username: z.string().trim().min(1),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const limited = await applyRateLimit(req, 'auth_strict', 10, 900);
  if (limited) return limited;

  const body = await req.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return apiError('VALIDATION_ERROR', 'Username dan kata sandi wajib diisi.', 400);
  }

  const username = parsed.data.username.toLowerCase();
  const [admin] = await db
    .select()
    .from(schema.adminUsers)
    .where(eq(schema.adminUsers.username, username))
    .limit(1);

  if (!admin || !admin.is_active) {
    return apiError('UNAUTHORIZED', 'Kredensial staf tidak valid atau akun nonaktif.', 401);
  }

  if (admin.locked_until && admin.locked_until > new Date()) {
    return apiError(
      'RATE_LIMITED',
      'Akun terkunci sementara karena terlalu banyak percobaan gagal. Coba lagi 15 menit.',
      429
    );
  }

  const valid = await bcrypt.compare(parsed.data.password, admin.password_hash);
  if (!valid) {
    const attempts = admin.failed_login_attempts + 1;
    const lockedUntil = attempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null;
    await db
      .update(schema.adminUsers)
      .set({
        failed_login_attempts: sql`${schema.adminUsers.failed_login_attempts} + 1`,
        ...(lockedUntil ? { locked_until: lockedUntil } : {}),
      })
      .where(eq(schema.adminUsers.id, admin.id));
    return apiError('UNAUTHORIZED', 'Kredensial staf tidak valid.', 401);
  }

  await db
    .update(schema.adminUsers)
    .set({
      failed_login_attempts: 0,
      locked_until: null,
      last_login: new Date(),
    })
    .where(eq(schema.adminUsers.id, admin.id));

  const sessionPayload = {
    id: admin.id,
    username: admin.username,
    fullName: admin.full_name,
    role: admin.role,
  };

  const ip = await getClientIp();
  await recordAuditLog({
    adminUserId: admin.id,
    entityType: 'admin_session',
    entityId: admin.id,
    action: 'create',
    diffSnapshot: { event: 'admin_login' },
    ipHash: hashIp(ip),
  });

  const token = await signAdminSession(sessionPayload);
  const res = apiSuccess({ admin: sessionPayload });
  res.cookies.set(ADMIN_COOKIE_NAME, token, cookieOptions(12 * 3600));
  return res;
}
