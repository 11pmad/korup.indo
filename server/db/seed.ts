import { seedFromData } from './seedFromData.js';

export async function seed() {
  await seedFromData();
}

// Auto-run when executed directly
if (
  process.argv[1]?.includes('seed.ts') ||
  import.meta.main ||
  import.meta.url.endsWith(process.argv[1] || '')
) {
  seed()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Terjadi kesalahan dalam proses seeding:', err);
      process.exit(1);
    });
}
