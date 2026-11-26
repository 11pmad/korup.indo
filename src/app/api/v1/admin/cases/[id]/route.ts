import { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import {
  apiError,
  apiSuccess,
  getClientIp,
  hashIp,
  recordAuditLog,
  requireAdminApi,
} from '@/server/auth';
import { db, schema } from '@/server/db';
import { adminCasePatchSchema } from '@/server/validators';
import { recomputeCaseAndGlobalAggregates } from '@/server/services/financials';

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { error, session } = await requireAdminApi('manage_cases');
  if (error || !session) return error!;

  const { id } = await context.params;
  const [existing] = await db
    .select()
    .from(schema.cases)
    .where(eq(schema.cases.id, id))
    .limit(1);

  if (!existing) return apiError('NOT_FOUND', 'Perkara tidak ditemukan.', 404);

  const body = await req.json().catch(() => null);
  const parsed = adminCasePatchSchema.safeParse(body);
  if (!parsed.success) {
    return apiError('VALIDATION_ERROR', parsed.error.issues[0]?.message || 'Payload tidak valid.', 400);
  }

  const updates: Record<string, unknown> = { updated_at: new Date() };
  if (parsed.data.caseTitle) {
    updates.case_title = parsed.data.caseTitle;
    updates.normalized_case_title = parsed.data.caseTitle.toLowerCase();
  }
  if (parsed.data.currentLegalStatus) updates.current_legal_status = parsed.data.currentLegalStatus;
  if (parsed.data.summary) updates.summary = parsed.data.summary;
  if (parsed.data.verificationNote !== undefined) updates.verification_note = parsed.data.verificationNote;
  if (parsed.data.needsManualReview !== undefined) updates.needs_manual_review = parsed.data.needsManualReview;
  if (parsed.data.primaryProvinceId) updates.primary_province_id = parsed.data.primaryProvinceId;
  if (parsed.data.eraId) updates.era_id = parsed.data.eraId;

  await db.update(schema.cases).set(updates).where(eq(schema.cases.id, id));
  if (parsed.data.currentLegalStatus) {
    await db
      .update(schema.casePersons)
      .set({ legal_status: parsed.data.currentLegalStatus })
      .where(eq(schema.casePersons.case_id, id));
  }

  await recomputeCaseAndGlobalAggregates(id);

  const ip = await getClientIp();
  await recordAuditLog({
    adminUserId: session.id,
    entityType: 'case',
    entityId: id,
    action: 'update',
    diffSnapshot: { before: { status: existing.current_legal_status }, after: parsed.data },
    ipHash: hashIp(ip),
  });

  revalidatePath('/');
  revalidatePath('/peta');
  revalidatePath('/klasemen');
  revalidatePath('/statistik');
  revalidatePath('/cari');
  revalidatePath(`/kasus/${existing.slug}`);

  return apiSuccess({ id, updated: true });
}

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { error, session } = await requireAdminApi('delete_cases');
  if (error || !session) return error!;

  const { id } = await context.params;
  const [existing] = await db
    .select({ id: schema.cases.id, slug: schema.cases.slug, case_title: schema.cases.case_title })
    .from(schema.cases)
    .where(eq(schema.cases.id, id))
    .limit(1);

  if (!existing) return apiError('NOT_FOUND', 'Perkara tidak ditemukan.', 404);

  await db.delete(schema.cases).where(eq(schema.cases.id, id));
  await recomputeCaseAndGlobalAggregates();

  const ip = await getClientIp();
  await recordAuditLog({
    adminUserId: session.id,
    entityType: 'case',
    entityId: id,
    action: 'delete',
    diffSnapshot: { deletedTitle: existing.case_title },
    ipHash: hashIp(ip),
  });

  revalidatePath('/');
  revalidatePath('/peta');
  revalidatePath('/klasemen');
  revalidatePath('/statistik');
  revalidatePath('/cari');

  return apiSuccess({ deleted: true });
}
