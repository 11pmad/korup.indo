import { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import {
  apiError,
  apiSuccess,
  getClientIp,
  hashIp,
  recordAuditLog,
  requireAdminApi,
} from '@/server/auth';
import { db, schema } from '@/server/db';
import { adminReportModerateSchema } from '@/server/validators';

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { error, session } = await requireAdminApi('moderate_reports');
  if (error || !session) return error!;

  const { id } = await context.params;
  const [existing] = await db
    .select()
    .from(schema.publicReports)
    .where(eq(schema.publicReports.id, id))
    .limit(1);

  if (!existing) return apiError('NOT_FOUND', 'Laporan tidak ditemukan.', 404);

  const body = await req.json().catch(() => null);
  const parsed = adminReportModerateSchema.safeParse(body);
  if (!parsed.success) {
    return apiError('VALIDATION_ERROR', parsed.error.issues[0]?.message || 'Input moderasi tidak valid.', 400);
  }

  await db
    .update(schema.publicReports)
    .set({
      status: parsed.data.status,
      moderator_note: parsed.data.moderatorNote,
      reviewed_by: session.id,
      reviewed_at: new Date(),
    })
    .where(eq(schema.publicReports.id, id));

  const ip = await getClientIp();
  await recordAuditLog({
    adminUserId: session.id,
    entityType: 'public_report',
    entityId: id,
    action: parsed.data.status === 'approved' ? 'approve_report' : 'reject_report',
    diffSnapshot: { trackingCode: existing.tracking_code, moderatorNote: parsed.data.moderatorNote },
    ipHash: hashIp(ip),
  });

  return apiSuccess({ id, status: parsed.data.status });
}
