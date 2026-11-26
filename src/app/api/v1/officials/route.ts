import { NextRequest } from 'next/server';
import { apiSuccess, applyRateLimit } from '@/server/auth';
import { queryOfficialsLeaderboard } from '@/server/queries';

export async function GET(req: NextRequest) {
  const limited = await applyRateLimit(req, 'public_read', 120, 60);
  if (limited) return limited;

  const sp = req.nextUrl.searchParams;
  const result = await queryOfficialsLeaderboard({
    era: sp.get('era') ?? undefined,
    province: sp.get('province') ?? undefined,
    party: sp.get('party') ?? undefined,
    status: sp.get('status') ?? undefined,
    q: sp.get('q') ?? undefined,
    sort: (sp.get('sort') as 'loss' | 'cases' | 'name') || 'loss',
    page: Number(sp.get('page') || 1),
    limit: Number(sp.get('limit') || 20),
  });

  return apiSuccess(result.items, {
    page: result.page,
    limit: result.limit,
    total: result.total,
    total_pages: result.total_pages,
  });
}
