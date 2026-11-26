import { NextRequest } from 'next/server';
import { apiSuccess, applyRateLimit } from '@/server/auth';
import { queryStatsOverview } from '@/server/queries';

export async function GET(req: NextRequest) {
  const limited = await applyRateLimit(req, 'public_read', 120, 60);
  if (limited) return limited;

  const stats = await queryStatsOverview();
  return apiSuccess({
    trends_by_year: stats.trends_by_year,
    by_era: stats.by_era,
    by_sector: stats.by_sector,
    asset_recovery_rate: stats.asset_recovery_rate,
  });
}
