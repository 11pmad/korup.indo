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

export async function GET() {
  const { error } = await requireAdminApi('resolve_review_queue');
  if (error) return error;

  const items = await db
    .select()
    .from(schema.reviewQueue)
    .orderBy(desc(schema.reviewQueue.created_at))
    .limit(100);

  return apiSuccess(items);
}

export async function PATCH(req: NextRequest) {
  const { error, session } = await requireAdminApi('resolve_review_queue');
  if (error || !session) return error!;

  const body = await req.json().catch(() => null);
  const parsed = z
    .object({
      id: z.string().min(1),
      status: z.enum(['pending', 'resolved', 'needs_field_inquiry']),
    })
    .safeParse(body);

  if (!parsed.success) return apiError('VALIDATION_ERROR', 'Input review queue tidak valid.', 400);

  await db
    .update(schema.reviewQueue)
    .set({
      status: parsed.data.status,
      resolved_by: parsed.data.status === 'resolved' ? session.id : null,
      resolved_at: parsed.data.status === 'resolved' ? new Date() : null,
    })
    .where(eq(schema.reviewQueue.id, parsed.data.id));

  const ip = await getClientIp();
  await recordAuditLog({
    adminUserId: session.id,
    entityType: 'review_queue',
    entityId: parsed.data.id,
    action: 'update',
    diffSnapshot: { status: parsed.data.status },
    ipHash: hashIp(ip),
  });

  return apiSuccess({ id: parsed.data.id, status: parsed.data.status });
}
