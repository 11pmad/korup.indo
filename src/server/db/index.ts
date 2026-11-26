import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import { env } from '@/env';

const isServerless = Boolean(process.env.VERCEL);
const PASSIVE_FALLBACK_URL = 'postgres://postgres@127.0.0.1:5432/lki_fallback_disabled';

const globalForDb = globalThis as unknown as {
  lkiPgClient?: ReturnType<typeof postgres>;
};

function createSafePgClient(url: string): ReturnType<typeof postgres> {
  const isLocal = /localhost|127\.0\.0\.1/.test(url);
  const hasSslMode = /[?&]sslmode=/i.test(url);
  const opts: Parameters<typeof postgres>[1] = {
    max: isServerless ? 3 : 10,
    idle_timeout: 20,
    connect_timeout: 10,
    prepare: false, // Required for Supabase/Neon Transaction Poolers
    ...(!isLocal && !hasSslMode ? { ssl: 'require' } : {}),
  };
  try {
    return postgres(url, opts);
  } catch (err) {
    console.warn('[LKI DB] DATABASE_URL tidak valid, beralih ke fallback pasif:', err);
    return postgres(PASSIVE_FALLBACK_URL, {
      max: isServerless ? 3 : 10,
      idle_timeout: 20,
      connect_timeout: 10,
      prepare: false,
    });
  }
}

export const pgClient = globalForDb.lkiPgClient ?? createSafePgClient(env.DATABASE_URL);

if (process.env.NODE_ENV !== 'production') {
  globalForDb.lkiPgClient = pgClient;
}

export const db = drizzle(pgClient, { schema });
export { schema };
