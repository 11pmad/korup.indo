import { NextRequest } from 'next/server';
import { desc, eq, sql } from 'drizzle-orm';
import { apiSuccess, requireAdminApi } from '@/server/auth';
import { db, schema } from '@/server/db';

export async function GET(req: NextRequest) {
  const { error } = await requireAdminApi('moderate_reports');
  if (error) return error;

  const statusFilter = req.nextUrl.searchParams.get('status');
  const rows = await db
    .select({
      id: schema.publicReports.id,
      tracking_code: schema.publicReports.tracking_code,
      case_id: schema.publicReports.case_id,
      case_title: schema.cases.case_title,
      report_type: schema.publicReports.report_type,
      description: schema.publicReports.description,
      reference_url: schema.publicReports.reference_url,
      submitter_contact: schema.publicReports.submitter_contact,
      status: schema.publicReports.status,
      moderator_note: schema.publicReports.moderator_note,
      created_at: schema.publicReports.created_at,
      reviewed_at: schema.publicReports.reviewed_at,
    })
    .from(schema.publicReports)
    .leftJoin(schema.cases, eq(schema.publicReports.case_id, schema.cases.id))
    .where(statusFilter && statusFilter !== 'all' ? eq(schema.publicReports.status, statusFilter as any) : undefined)
    .orderBy(
      sql`CASE WHEN ${schema.publicReports.report_type} = 'hak_jawab' THEN 0 ELSE 1 END`,
      desc(schema.publicReports.created_at)
    )
    .limit(100);

  return apiSuccess(rows);
}
