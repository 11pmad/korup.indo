import { NextRequest } from 'next/server';
import { asc } from 'drizzle-orm';
import { apiSuccess, applyRateLimit } from '@/server/auth';
import { db, schema } from '@/server/db';

export async function GET(req: NextRequest) {
  const limited = await applyRateLimit(req, 'public_read', 120, 60);
  if (limited) return limited;

  const eras = await db
    .select()
    .from(schema.presidentialEras)
    .orderBy(asc(schema.presidentialEras.sort_order));

  return apiSuccess(eras, { total: eras.length });
}
