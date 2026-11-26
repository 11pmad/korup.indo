import { NextRequest } from 'next/server';
import { apiSuccess, applyRateLimit } from '@/server/auth';
import { queryStatsOverview } from '@/server/queries';

export async function GET(req: NextRequest) {
  const limited = await applyRateLimit(req, 'public_read', 120, 60);
  if (limited) return limited;

  const stats = await queryStatsOverview();
  return apiSuccess(stats);
}
