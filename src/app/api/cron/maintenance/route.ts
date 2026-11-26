import path from 'path';
import { NextRequest, NextResponse } from 'next/server';
import { lt } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { env, isDatabaseConfigured } from '@/env';
import { db, schema } from '@/server/db';
import { bootstrapAdmin } from '@/server/db/bootstrap-admin';
import { runSeed } from '@/server/db/seed';

export const maxDuration = 60;

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

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!env.CRON_SECRET || authHeader !== `Bearer ${env.CRON_SECRET}`) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  if (!isDatabaseConfigured) {
    return NextResponse.json(
      { success: false, error: 'Database PostgreSQL produksi belum dikonfigurasi.' },
      { status: 503 }
    );
  }

  const step = req.nextUrl.searchParams.get('step') || 'all';

  if (step === 'all' || step === 'migrate') {
    const ddlUrl = (process.env.DATABASE_URL_UNPOOLED || env.DATABASE_URL).trim();
    const isLocal = /localhost|127\.0\.0\.1/.test(ddlUrl);
    const hasSslMode = /[?&]sslmode=/i.test(ddlUrl);

    const ddlClient = postgres(ddlUrl, {
      max: 1,
      connect_timeout: 15,
      prepare: false,
      ...(!isLocal && !hasSslMode ? { ssl: 'require' } : {}),
    });

    try {
      await ddlClient.unsafe('CREATE EXTENSION IF NOT EXISTS pg_trgm;');
      await ddlClient.unsafe('CREATE EXTENSION IF NOT EXISTS pgcrypto;');
      await migrate(drizzle(ddlClient), {
        migrationsFolder: path.resolve(process.cwd(), 'drizzle'),
      });
    } catch (err) {
      await ddlClient.end().catch(() => {});
      return NextResponse.json(
        {
          success: false,
          error: err instanceof Error ? err.message : 'Migrasi database gagal',
        },
        { status: 500 }
      );
    } finally {
      await ddlClient.end().catch(() => {});
    }
  }

  try {
    if (step === 'all' || step === 'admin') {
      await bootstrapAdmin();
    }
    if (step === 'all' || step === 'seed') {
      await runSeed();
    }

    return NextResponse.json({
      success: true,
      step,
      bootstrapped: step === 'all' || step === 'admin',
      seeded: step === 'all' || step === 'seed',
      admin_username: env.INITIAL_SUPERADMIN_USERNAME,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : 'Bootstrap gagal',
      },
      { status: 500 }
    );
  }
}
