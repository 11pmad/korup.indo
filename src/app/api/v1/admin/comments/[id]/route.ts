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
  const { error } = await requireAdminApi('moderate_comments');
  if (error) return error;

  const rows = await db
    .select({
      id: schema.caseComments.id,
      case_id: schema.caseComments.case_id,
      case_title: schema.cases.case_title,
      content: schema.caseComments.content,
      upvotes_count: schema.caseComments.upvotes_count,
      is_hidden: schema.caseComments.is_hidden,
      moderation_reason: schema.caseComments.moderation_reason,
      created_at: schema.caseComments.created_at,
      username: schema.citizenUsers.username,
    })
    .from(schema.caseComments)
    .innerJoin(schema.cases, eq(schema.caseComments.case_id, schema.cases.id))
    .innerJoin(schema.citizenUsers, eq(schema.caseComments.user_id, schema.citizenUsers.id))
    .orderBy(desc(schema.caseComments.created_at))
    .limit(100);

  return apiSuccess(rows);
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { error, session } = await requireAdminApi('moderate_comments');
  if (error || !session) return error!;

  const { id } = await context.params;
  const body = await req.json().catch(() => null);
  const parsed = z
    .object({
      isHidden: z.boolean(),
      reason: z.string().trim().max(300).optional(),
    })
    .safeParse(body);

  if (!parsed.success) return apiError('VALIDATION_ERROR', 'Payload moderasi komentar tidak valid.', 400);

  await db
    .update(schema.caseComments)
    .set({
      is_hidden: parsed.data.isHidden,
      moderated_by: session.id,
      moderation_reason: parsed.data.reason || null,
    })
    .where(eq(schema.caseComments.id, id));

  const ip = await getClientIp();
  await recordAuditLog({
    adminUserId: session.id,
    entityType: 'comment',
    entityId: id,
    action: 'moderate_comment',
    diffSnapshot: parsed.data,
    ipHash: hashIp(ip),
  });

  return apiSuccess({ id, isHidden: parsed.data.isHidden });
}
