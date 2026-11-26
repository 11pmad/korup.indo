import { NextRequest } from 'next/server';
import { apiSuccess, applyRateLimit } from '@/server/auth';
import { queryProvincesSummary } from '@/server/queries';

export async function GET(req: NextRequest) {
  const limited = await applyRateLimit(req, 'public_read', 120, 60);
  if (limited) return limited;

  const sp = req.nextUrl.searchParams;
  const items = await queryProvincesSummary({
    era: sp.get('era') ?? undefined,
    sector: sp.get('sector') ?? undefined,
    status: sp.get('status') ?? undefined,
  });
  return apiSuccess(items, { total: items.length });
}
