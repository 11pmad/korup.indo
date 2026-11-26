import { NextRequest } from 'next/server';
import { asc } from 'drizzle-orm';
import { isDatabaseConfigured } from '@/env';
import { apiSuccess, applyRateLimit } from '@/server/auth';
import { db, schema } from '@/server/db';
import { getStaticDataset } from '@/server/static-dataset';

export async function GET(req: NextRequest) {
  const limited = await applyRateLimit(req, 'public_read', 120, 60);
  if (limited) return limited;

  if (!isDatabaseConfigured) {
    const eras = getStaticDataset().eras;
    return apiSuccess(eras, { total: eras.length });
  }

  try {
    const eras = await db
      .select()
      .from(schema.presidentialEras)
      .orderBy(asc(schema.presidentialEras.sort_order));

    return apiSuccess(eras, { total: eras.length });
  } catch {
    const eras = getStaticDataset().eras;
    return apiSuccess(eras, { total: eras.length });
  }
}
