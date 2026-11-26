import { NextRequest } from 'next/server';
import { apiSuccess, applyRateLimit } from '@/server/auth';
import { queryCases } from '@/server/queries';

export async function GET(req: NextRequest) {
  const limited = await applyRateLimit(req, 'public_read', 120, 60);
  if (limited) return limited;

  const sp = req.nextUrl.searchParams;
  const result = await queryCases({
    q: sp.get('q') ?? undefined,
    province: sp.get('province') ?? undefined,
    era: sp.get('era') ?? undefined,
    status: sp.get('status') ?? undefined,
    sector: sp.get('sector') ?? undefined,
    sort: (sp.get('sort') as 'loss' | 'date' | 'title') || 'loss',
    order: (sp.get('order') as 'asc' | 'desc') || 'desc',
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
