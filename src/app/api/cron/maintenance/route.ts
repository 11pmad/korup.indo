import { NextRequest, NextResponse } from 'next/server';
import { lt } from 'drizzle-orm';
import { env } from '@/env';
import { db, schema } from '@/server/db';

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!env.CRON_SECRET || authHeader !== `Bearer ${env.CRON_SECRET}`) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  await db.delete(schema.rateLimitBuckets).where(lt(schema.rateLimitBuckets.reset_at, now));
  await db.delete(schema.visitorLogs).where(lt(schema.visitorLogs.timestamp, thirtyDaysAgo));

  return NextResponse.json({
    success: true,
    cleanedAt: now.toISOString(),
  });
}
