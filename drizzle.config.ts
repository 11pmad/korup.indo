import { defineConfig } from 'drizzle-kit';
import 'dotenv/config';

export default defineConfig({
  schema: './src/server/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url:
      process.env.PROD_DATABASE_URL ||
      process.env.DIRECT_URL ||
      process.env.DATABASE_URL ||
      process.env.POSTGRES_URL ||
      'postgres://postgres@localhost:5432/lki_v2_db',
  },
});
