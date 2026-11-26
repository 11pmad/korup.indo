import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import { env } from '@/env';

const isServerless = Boolean(process.env.VERCEL);

const globalForDb = globalThis as unknown as {
  lkiPgClient?: ReturnType<typeof postgres>;
};

export const pgClient =
  globalForDb.lkiPgClient ??
  postgres(env.DATABASE_URL, {
    max: isServerless ? 3 : 10,
    idle_timeout: 20,
    connect_timeout: 10,
    prepare: false, // Required for Supabase/Neon Transaction Poolers
  });

if (process.env.NODE_ENV !== 'production') {
  globalForDb.lkiPgClient = pgClient;
}

export const db = drizzle(pgClient, { schema });
export { schema };
