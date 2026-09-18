import { execSync } from 'node:child_process';
import path from 'node:path';

const SCRIPTS_DIR = __dirname;
console.log('🏁 Menjalankan Kompilasi Penuh Ekosistem Database Korupsi Indonesia (1945–2026)...');

const steps = [
  'build_datasets_part1.ts',
  'build_datasets_part2.ts',
  'build_datasets_part3.ts',
  'export_csv.ts',
  'validate.ts',
  'generate_sql.ts',
  'generate_quality_report.ts'
];

for (const s of steps) {
  console.log(`\n▶️ Menjalankan ${s}...`);
  const targetScript = path.join(SCRIPTS_DIR, s);
  execSync(`bun run "${targetScript}"`, { stdio: 'inherit' });
}

console.log('\n✨ Seluruh proses kompilasi, ekspor CSV, validasi integritas, SQL seed, dan pelaporan kualitas selesai dengan sukses!');

