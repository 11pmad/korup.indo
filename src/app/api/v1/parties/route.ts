import { NextRequest } from 'next/server';
import { apiSuccess, applyRateLimit } from '@/server/auth';
import { queryPartiesLeaderboard } from '@/server/queries';

export async function GET(req: NextRequest) {
  const limited = await applyRateLimit(req, 'public_read', 120, 60);
  if (limited) return limited;

  const era = req.nextUrl.searchParams.get('era') ?? undefined;
  const items = await queryPartiesLeaderboard(era);
  return apiSuccess(items, { total: items.length });
}
