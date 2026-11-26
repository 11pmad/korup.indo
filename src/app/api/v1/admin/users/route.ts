import bcrypt from 'bcryptjs';
import { NextRequest } from 'next/server';
import { desc, eq } from 'drizzle-orm';
import { z } from 'zod';
import {
  apiError,
  apiSuccess,
  getClientIp,
  hashIp,
  recordAuditLog,
  requireAdminApi,
} from '@/server/auth';
import { db, schema } from '@/server/db';

const createStaffSchema = z.object({
  username: z.string().trim().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/),
  fullName: z.string().trim().min(2).max(80),
  password: z.string().min(12, 'Password staf minimal 12 karakter'),
  role: z.enum(['super_admin', 'admin', 'editor', 'moderator', 'auditor', 'reviewer']),
});

export async function GET() {
  const { error } = await requireAdminApi('manage_users');
  if (error) return error;

  const users = await db
    .select({
      id: schema.adminUsers.id,
      username: schema.adminUsers.username,
      full_name: schema.adminUsers.full_name,
      role: schema.adminUsers.role,
      is_active: schema.adminUsers.is_active,
      last_login: schema.adminUsers.last_login,
      created_at: schema.adminUsers.created_at,
    })
    .from(schema.adminUsers)
    .orderBy(desc(schema.adminUsers.created_at));

  return apiSuccess(users);
}

export async function POST(req: NextRequest) {
  const { error, session } = await requireAdminApi('manage_users');
  if (error || !session) return error!;

  const body = await req.json().catch(() => null);
  const parsed = createStaffSchema.safeParse(body);
  if (!parsed.success) {
    return apiError('VALIDATION_ERROR', parsed.error.issues[0]?.message || 'Data staf tidak valid.', 400);
  }

  const username = parsed.data.username.toLowerCase();
  const [dup] = await db
    .select({ id: schema.adminUsers.id })
    .from(schema.adminUsers)
    .where(eq(schema.adminUsers.username, username))
    .limit(1);

  if (dup) return apiError('CONFLICT', 'Username staf sudah terdaftar.', 409);

  const id = `adm-${crypto.randomUUID().slice(0, 8)}`;
  const passwordHash = await bcrypt.hash(parsed.data.password, 12);

  await db.insert(schema.adminUsers).values({
    id,
    username,
    full_name: parsed.data.fullName,
    password_hash: passwordHash,
    role: parsed.data.role,
    is_active: true,
  });

  const ip = await getClientIp();
  await recordAuditLog({
    adminUserId: session.id,
    entityType: 'admin_user',
    entityId: id,
    action: 'create',
    diffSnapshot: { username, role: parsed.data.role },
    ipHash: hashIp(ip),
  });

  return apiSuccess({ id, username, role: parsed.data.role }, undefined, 201);
}

export async function PATCH(req: NextRequest) {
  const { error, session } = await requireAdminApi('manage_users');
  if (error || !session) return error!;

  const body = await req.json().catch(() => null);
  const parsed = z
    .object({
      id: z.string().min(1),
      isActive: z.boolean().optional(),
      role: z.enum(['super_admin', 'admin', 'editor', 'moderator', 'auditor', 'reviewer']).optional(),
    })
    .safeParse(body);

  if (!parsed.success) return apiError('VALIDATION_ERROR', 'Input tidak valid.', 400);
  if (parsed.data.id === session.id && parsed.data.isActive === false) {
    return apiError('CONFLICT', 'Tidak dapat menonaktifkan akun Anda sendiri.', 409);
  }

  await db
    .update(schema.adminUsers)
    .set({
      ...(parsed.data.isActive !== undefined ? { is_active: parsed.data.isActive } : {}),
      ...(parsed.data.role ? { role: parsed.data.role } : {}),
    })
    .where(eq(schema.adminUsers.id, parsed.data.id));

  return apiSuccess({ updated: true });
}
