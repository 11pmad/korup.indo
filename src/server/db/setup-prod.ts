import { execSync } from 'child_process';
import crypto from 'crypto';
import postgres from 'postgres';

async function main() {
  const targetUrl = (process.env.PROD_DATABASE_URL || process.argv[2] || '').trim();

  if (!targetUrl || /localhost|127\.0\.0\.1/.test(targetUrl)) {
    console.error(
      [
        '❌ PROD_DATABASE_URL cloud wajib diberikan dan tidak boleh menunjuk localhost.',
        '',
        'Cara penggunaan:',
        '  PROD_DATABASE_URL="postgresql://user:pass@host/db?sslmode=require" bun run db:setup-prod',
        'atau:',
        '  bun run db:setup-prod "postgresql://user:pass@host/db?sslmode=require"',
      ].join('\n')
    );
    process.exit(1);
  }

  // Override env vars BEFORE dynamically importing db / seed / bootstrap modules
  process.env.DATABASE_URL = targetUrl;
  process.env.DIRECT_URL = targetUrl;

  if (!process.env.INITIAL_SUPERADMIN_PASSWORD || process.env.INITIAL_SUPERADMIN_PASSWORD.length < 14) {
    process.env.INITIAL_SUPERADMIN_PASSWORD = crypto.randomBytes(15).toString('base64url');
  }

  const adminPassword = process.env.INITIAL_SUPERADMIN_PASSWORD;
  const adminUsername = (process.env.INITIAL_SUPERADMIN_USERNAME || 'superadmin').trim().toLowerCase();

  console.log('1/4 Mengaktifkan ekstensi pg_trgm & pgcrypto pada database cloud...');
  const isLocal = /localhost|127\.0\.0\.1/.test(targetUrl);
  const hasSslMode = /[?&]sslmode=/i.test(targetUrl);
  const adminSql = postgres(targetUrl, {
    max: 1,
    connect_timeout: 15,
    prepare: false,
    ...(!isLocal && !hasSslMode ? { ssl: 'require' } : {}),
  });

  try {
    await adminSql.unsafe('CREATE EXTENSION IF NOT EXISTS pg_trgm;');
    await adminSql.unsafe('CREATE EXTENSION IF NOT EXISTS pgcrypto;');
  } finally {
    await adminSql.end();
  }

  console.log('2/4 Menjalankan drizzle-kit push ke database produksi...');
  execSync('bunx drizzle-kit push --force', {
    stdio: 'inherit',
    env: {
      ...process.env,
      PROD_DATABASE_URL: targetUrl,
      DATABASE_URL: targetUrl,
      DIRECT_URL: targetUrl,
    },
  });

  console.log('3/4 Melakukan seeding 47 perkara, tokoh, wilayah, dan agregasi finansial...');
  const { runSeed } = await import('./seed');
  await runSeed();

  console.log('4/4 Membuat / memperbarui akun superadmin produksi...');
  const { bootstrapAdmin } = await import('./bootstrap-admin');
  await bootstrapAdmin();

  const { pgClient } = await import('./index');
  await pgClient.end();

  const adminJwtSecret = crypto.randomBytes(32).toString('hex');
  const citizenJwtSecret = crypto.randomBytes(32).toString('hex');
  const cronSecret = crypto.randomBytes(24).toString('hex');
  const ipHashSalt = crypto.randomBytes(24).toString('hex');

  console.log('\n✅ Database PostgreSQL produksi siap digunakan!');
  console.log('==================================================================');
  console.log('Salin Environment Variables berikut ke Vercel -> Settings -> Environment Variables:\n');
  console.log(`DATABASE_URL=${targetUrl}`);
  console.log(`ADMIN_JWT_SECRET=${adminJwtSecret}`);
  console.log(`CITIZEN_JWT_SECRET=${citizenJwtSecret}`);
  console.log(`CRON_SECRET=${cronSecret}`);
  console.log(`IP_HASH_SALT=${ipHashSalt}`);
  console.log('\nKredensial Login Panel Admin (/admin):');
  console.log(`  Username : ${adminUsername}`);
  console.log(`  Password : ${adminPassword}`);
  console.log('==================================================================');
}

main().catch((err) => {
  console.error('Setup database produksi gagal:', err);
  process.exit(1);
});
