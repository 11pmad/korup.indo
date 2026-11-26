import { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { apiError, apiSuccess, applyRateLimit } from '@/server/auth';
import { db, schema } from '@/server/db';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ code: string }> }
) {
  const limited = await applyRateLimit(req, 'public_read', 60, 60);
  if (limited) return limited;

  const { code } = await context.params;
  const normalized = code.trim().toUpperCase();

  const [report] = await db
    .select({
      tracking_code: schema.publicReports.tracking_code,
      report_type: schema.publicReports.report_type,
      status: schema.publicReports.status,
      moderator_note: schema.publicReports.moderator_note,
      created_at: schema.publicReports.created_at,
      reviewed_at: schema.publicReports.reviewed_at,
      case_title: schema.cases.case_title,
      case_slug: schema.cases.slug,
    })
    .from(schema.publicReports)
    .leftJoin(schema.cases, eq(schema.publicReports.case_id, schema.cases.id))
    .where(eq(schema.publicReports.tracking_code, normalized))
    .limit(1);

  if (!report) {
    return apiError('NOT_FOUND', `Tiket laporan '${normalized}' tidak ditemukan.`, 404);
  }

  // Never expose submitter_contact publicly
  return apiSuccess(report);
}
