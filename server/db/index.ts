import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema.js';
import 'dotenv/config';

const connectionString = process.env.DATABASE_URL || 'postgres://postgres@localhost:5432/lki_db';

const isServerless = Boolean(process.env.VERCEL);

// Client for queries (prepare: false supports Supabase/Neon transaction poolers)
export const client = postgres(connectionString, {
  max: isServerless ? 3 : 10,
  idle_timeout: 20,
  connect_timeout: 10,
  prepare: false,
});
export const db = drizzle(client, { schema });
export { schema };
