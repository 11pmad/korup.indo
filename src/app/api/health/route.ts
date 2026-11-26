import { NextResponse } from 'next/server';
import { sql } from 'drizzle-orm';
import { isDatabaseConfigured } from '@/env';
import { db } from '@/server/db';
import { getStaticDataset } from '@/server/static-dataset';

export async function GET() {
  if (!isDatabaseConfigured) {
    return NextResponse.json({
      status: 'ok',
      db: 'static_fallback',
      cases_loaded: getStaticDataset().cases.length,
      timestamp: new Date().toISOString(),
    });
  }

  try {
    await db.execute(sql`SELECT 1`);
    return NextResponse.json({
      status: 'ok',
      db: 'connected',
      timestamp: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json({
      status: 'ok',
      db: 'static_fallback',
      cases_loaded: getStaticDataset().cases.length,
      timestamp: new Date().toISOString(),
    });
  }
}
