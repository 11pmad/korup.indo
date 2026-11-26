import crypto from 'crypto';
import { cookies, headers } from 'next/headers';
import { sql } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { env } from '@/env';
import { db, schema } from '@/server/db';
import {
  AdminRole,
  AdminSessionPayload,
  CitizenSessionPayload,
  signAdminSession,
  signCitizenSession,
  verifyAdminToken,
  verifyCitizenToken,
} from '@/server/jwt';

export type { AdminRole, AdminSessionPayload, CitizenSessionPayload };
export { signAdminSession, signCitizenSession, verifyAdminToken, verifyCitizenToken };

export const ADMIN_COOKIE_NAME = 'lki_admin_session';
export const CITIZEN_COOKIE_NAME = 'lki_citizen_session';

export type AdminPermission =
  | 'manage_cases'
  | 'delete_cases'
  | 'use_ai_curator'
  | 'resolve_review_queue'
  | 'moderate_reports'
  | 'moderate_comments'
  | 'manage_settings'
  | 'manage_users'
  | 'view_audit_logs';

const ROLE_PERMISSIONS: Record<AdminRole, AdminPermission[]> = {
  super_admin: [
    'manage_cases',
    'delete_cases',
    'use_ai_curator',
    'resolve_review_queue',
    'moderate_reports',
    'moderate_comments',
    'manage_settings',
    'manage_users',
    'view_audit_logs',
  ],
  admin: [
    'manage_cases',
    'delete_cases',
    'use_ai_curator',
    'resolve_review_queue',
    'moderate_reports',
    'moderate_comments',
    'manage_settings',
    'view_audit_logs',
  ],
  editor: ['manage_cases', 'use_ai_curator'],
  reviewer: ['resolve_review_queue', 'moderate_reports'],
  moderator: ['moderate_reports', 'moderate_comments'],
  auditor: ['view_audit_logs'],
};

export function hasAdminPermission(role: AdminRole, permission: AdminPermission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export async function getAdminSession(): Promise<AdminSessionPayload | null> {
  const cookieStore = await cookies();
  let token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  if (!token) {
    const h = await headers();
    const auth = h.get('authorization');
    if (auth?.startsWith('Bearer ')) token = auth.slice(7).trim();
  }
  if (!token) return null;
  return verifyAdminToken(token);
}

export async function getCitizenSession(): Promise<CitizenSessionPayload | null> {
  const cookieStore = await cookies();
  let token = cookieStore.get(CITIZEN_COOKIE_NAME)?.value;
  if (!token) {
    const h = await headers();
    const auth = h.get('authorization');
    if (auth?.startsWith('Bearer ')) token = auth.slice(7).trim();
  }
  if (!token) return null;

  const citizen = await verifyCitizenToken(token);
  if (citizen) return citizen;

  const admin = await verifyAdminToken(token);
  if (admin) {
    return {
      id: admin.id,
      username: admin.username,
      displayName: `${admin.username} (Staf LKI)`,
      email: `${admin.username}@lki.local`,
      avatarSeed: 'garuda',
      isEmailVerified: true,
    };
  }
  return null;
}

export function cookieOptions(maxAgeSeconds: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: maxAgeSeconds,
  };
}

export async function getClientIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return h.get('x-real-ip') || '127.0.0.1';
}

export function hashIp(ip: string): string {
  const utcDay = new Date().toISOString().slice(0, 10);
  return crypto
    .createHash('sha256')
    .update(`${ip}:${env.IP_HASH_SALT}:${utcDay}`)
    .digest('hex')
    .slice(0, 32);
}

export async function checkRateLimit(
  tier: string,
  identifier: string,
  limit: number,
  windowSeconds: number
): Promise<{ allowed: boolean; remaining: number; retryAfterSeconds: number }> {
  const key = `${tier}:${identifier}`;
  const now = new Date();
  const nowIso = now.toISOString();
  const nextReset = new Date(now.getTime() + windowSeconds * 1000);
  const nextResetIso = nextReset.toISOString();

  const result = await db.execute(sql`
    INSERT INTO rate_limit_buckets (key, count, reset_at)
    VALUES (${key}, 1, ${nextResetIso}::timestamptz)
    ON CONFLICT (key) DO UPDATE SET
      count = CASE
        WHEN rate_limit_buckets.reset_at <= ${nowIso}::timestamptz THEN 1
        ELSE rate_limit_buckets.count + 1
      END,
      reset_at = CASE
        WHEN rate_limit_buckets.reset_at <= ${nowIso}::timestamptz THEN ${nextResetIso}::timestamptz
        ELSE rate_limit_buckets.reset_at
      END
    RETURNING count, reset_at;
  `);

  const row = result[0] as { count: number; reset_at: Date | string } | undefined;
  const count = Number(row?.count ?? 1);
  const resetAt = row?.reset_at ? new Date(row.reset_at) : nextReset;
  const retryAfterSeconds = Math.max(1, Math.ceil((resetAt.getTime() - now.getTime()) / 1000));

  return {
    allowed: count <= limit,
    remaining: Math.max(0, limit - count),
    retryAfterSeconds,
  };
}

export async function requireAdminApi(permission?: AdminPermission) {
  const session = await getAdminSession();
  if (!session) {
    return {
      error: NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Sesi kurator/admin diperlukan.' } },
        { status: 401 }
      ),
      session: null,
    };
  }
  if (permission && !hasAdminPermission(session.role, permission)) {
    return {
      error: NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: `Peran '${session.role}' tidak memiliki izin '${permission}'.`,
          },
        },
        { status: 403 }
      ),
      session: null,
    };
  }
  return { error: null, session };
}

export async function recordAuditLog(params: {
  adminUserId: string;
  entityType: string;
  entityId: string;
  action:
    | 'create'
    | 'update'
    | 'delete'
    | 'rollback'
    | 'approve_report'
    | 'reject_report'
    | 'update_setting'
    | 'moderate_comment';
  diffSnapshot?: Record<string, unknown>;
  ipHash?: string;
}) {
  await db.insert(schema.auditLogs).values({
    id: `aud-${crypto.randomUUID().slice(0, 12)}`,
    admin_user_id: params.adminUserId,
    entity_type: params.entityType,
    entity_id: params.entityId,
    action: params.action,
    diff_snapshot: params.diffSnapshot ?? null,
    ip_hash: params.ipHash ?? null,
  });
}

export function apiSuccess<T>(data: T, meta?: Record<string, unknown>, status = 200) {
  return NextResponse.json(
    {
      success: true,
      data,
      meta: {
        disclaimer:
          'Sesuai Pasal 8 ayat (1) UU No. 48/2009, subjek berstatus tersangka/terdakwa dilindungi asas praduga tak bersalah.',
        ...meta,
      },
    },
    { status }
  );
}

export function apiError(
  code: string,
  message: string,
  status = 400,
  details?: unknown,
  headersMap?: Record<string, string>
) {
  return NextResponse.json(
    {
      success: false,
      error: { code, message, ...(details ? { details } : {}) },
    },
    { status, headers: headersMap }
  );
}

export async function applyRateLimit(
  _req: NextRequest,
  tier: string,
  limit: number,
  windowSeconds: number,
  suffix = ''
) {
  const ip = await getClientIp();
  const id = `${hashIp(ip)}${suffix ? `:${suffix}` : ''}`;
  const res = await checkRateLimit(tier, id, limit, windowSeconds);
  if (!res.allowed) {
    return apiError(
      'RATE_LIMITED',
      'Terlalu banyak permintaan. Silakan coba beberapa saat lagi.',
      429,
      undefined,
      { 'Retry-After': String(res.retryAfterSeconds) }
    );
  }
  return null;
}
