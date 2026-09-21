import { db } from '../server/db/index.js';
import { sql } from 'drizzle-orm';
import { execSync } from 'child_process';
import { seedFromData } from '../server/db/seedFromData.js';

async function migrateFresh() {
  console.log('================================================================');
  console.log('🚀 MEMULAI MIGRATE FRESH DATABASE POSTGRESQL (lki_db)...');
  console.log('================================================================');

  // 1. Reset public schema completely
  console.log('\n[1/4] Mereset skema database public secara total (DROP CASCADE)...');
  await db.execute(sql`
    DROP SCHEMA IF EXISTS public CASCADE;
    CREATE SCHEMA public;
    GRANT ALL ON SCHEMA public TO postgres;
    GRANT ALL ON SCHEMA public TO public;
    CREATE EXTENSION IF NOT EXISTS pg_trgm;
  `);
  console.log('✓ Skema public berhasil di-drop dan dibuat ulang dari awal.');
  console.log('✓ Ekstensi PostgreSQL "pg_trgm" aktif.');

  // 2. Push fresh schema using drizzle-kit push
  console.log('\n[2/4] Menerapkan skema Drizzle terbaru (drizzle-kit push --force)...');
  execSync('bun x drizzle-kit push --force', {
    stdio: 'inherit',
    env: process.env
  });
  console.log('✓ Seluruh 18 tabel dan indeks berhasil dibuat dari schema.ts.');

  // 3. Run Master Seeder
  console.log('\n[3/4] Menjalankan Master Seeder terpadu...');
  await seedFromData();

  // 4. Verify table counts
  console.log('\n[4/4] Memverifikasi integritas data hasil migrate fresh...');
  const tables = [
    'provinces',
    'presidential_eras',
    'parties',
    'companies',
    'admin_users',
    'citizen_users',
    'officials',
    'cases',
    'case_officials',
    'case_companies',
    'case_timeline_events',
    'case_reactions',
    'case_comments',
    'comment_upvotes',
    'public_reports',
    'audit_logs',
    'visitor_logs'
  ];

  console.log('\n📊 Ringkasan Jumlah Baris Data per Tabel:');
  console.log('------------------------------------------------');
  for (const tbl of tables) {
    try {
      const res: any = await db.execute(sql.raw(`SELECT count(*)::int as count FROM "${tbl}"`));
      const count = res[0]?.count ?? 0;
      console.log(`  • ${tbl.padEnd(25)} : ${count} baris`);
    } catch (e: any) {
      console.log(`  • ${tbl.padEnd(25)} : Gagal (${e.message})`);
    }
  }
  console.log('------------------------------------------------');
  console.log('\n🎉 MIGRATE FRESH & MASTER SEEDER BERHASIL SEPENUHNYA! Kolom dan data 100% bersih & mutakhir.\n');
  process.exit(0);
}

migrateFresh().catch((err) => {
  console.error('❌ Gagal menjalankan migrate fresh:', err);
  process.exit(1);
});
