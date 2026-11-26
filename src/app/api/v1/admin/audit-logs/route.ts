import { desc, eq, sql } from 'drizzle-orm';
import { apiSuccess, requireAdminApi } from '@/server/auth';
import { db, schema } from '@/server/db';

export async function GET() {
  const { error } = await requireAdminApi('view_audit_logs');
  if (error) return error;

  const [logs, statsRows, comments] = await Promise.all([
    db
      .select({
        id: schema.auditLogs.id,
        entity_type: schema.auditLogs.entity_type,
        entity_id: schema.auditLogs.entity_id,
        action: schema.auditLogs.action,
        diff_snapshot: schema.auditLogs.diff_snapshot,
        created_at: schema.auditLogs.created_at,
        admin_username: schema.adminUsers.username,
      })
      .from(schema.auditLogs)
      .leftJoin(schema.adminUsers, eq(schema.auditLogs.admin_user_id, schema.adminUsers.id))
      .orderBy(desc(schema.auditLogs.created_at))
      .limit(100),
    db.execute(sql`
      SELECT
        (SELECT count(*)::int FROM cases) AS total_cases,
        (SELECT count(*)::int FROM public_reports WHERE status = 'pending_review') AS pending_reports,
        (SELECT count(*)::int FROM public_reports WHERE status = 'pending_review' AND report_type = 'hak_jawab') AS pending_hak_jawab,
        (SELECT count(*)::int FROM review_queue WHERE status = 'pending') AS pending_review_queue,
        (SELECT count(*)::int FROM citizen_users) AS total_citizens,
        (SELECT count(*)::int FROM case_comments) AS total_comments
    `),
    db
      .select({
        id: schema.caseComments.id,
        case_title: schema.cases.case_title,
        content: schema.caseComments.content,
        upvotes_count: schema.caseComments.upvotes_count,
        is_hidden: schema.caseComments.is_hidden,
        created_at: schema.caseComments.created_at,
        username: schema.citizenUsers.username,
      })
      .from(schema.caseComments)
      .innerJoin(schema.cases, eq(schema.caseComments.case_id, schema.cases.id))
      .innerJoin(schema.citizenUsers, eq(schema.caseComments.user_id, schema.citizenUsers.id))
      .orderBy(desc(schema.caseComments.created_at))
      .limit(50),
  ]);

  return apiSuccess({
    logs,
    kpis: statsRows[0] ?? {},
    comments,
  });
}
