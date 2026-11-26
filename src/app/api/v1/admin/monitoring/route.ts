import { sql } from 'drizzle-orm';
import { apiSuccess, requireAdminApi } from '@/server/auth';
import { db } from '@/server/db';

export async function GET() {
  const { error } = await requireAdminApi('view_audit_logs');
  if (error) return error;

  const [counts] = await db.execute(sql`
    SELECT
      (SELECT count(*)::int FROM cases) AS cases,
      (SELECT count(*)::int FROM persons) AS persons,
      (SELECT count(*)::int FROM companies) AS companies,
      (SELECT count(*)::int FROM citizen_users) AS citizens,
      (SELECT count(*)::int FROM public_reports) AS reports,
      (SELECT count(*)::int FROM visitor_logs) AS visitor_logs,
      (SELECT count(*)::int FROM rate_limit_buckets) AS rate_limit_buckets
  `);

  return apiSuccess({
    counts: counts ?? {},
    timestamp: new Date().toISOString(),
  });
}
