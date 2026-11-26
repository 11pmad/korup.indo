import bcrypt from 'bcryptjs';
import 'dotenv/config';
import { eq } from 'drizzle-orm';
import { db, pgClient, schema } from './index';
import { env } from '@/env';

export async function bootstrapAdmin() {
  const username = (env.INITIAL_SUPERADMIN_USERNAME || 'superadmin').trim().toLowerCase();
  const password = env.INITIAL_SUPERADMIN_PASSWORD;

  if (!password || password.length < 14) {
    throw new Error(
      'INITIAL_SUPERADMIN_PASSWORD wajib diisi minimal 14 karakter di environment sebelum menjalankan bootstrap admin.'
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const existing = await db
    .select({ id: schema.adminUsers.id })
    .from(schema.adminUsers)
    .where(eq(schema.adminUsers.username, username))
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(schema.adminUsers)
      .set({
        password_hash: passwordHash,
        role: 'super_admin',
        is_active: true,
        failed_login_attempts: 0,
        locked_until: null,
      })
      .where(eq(schema.adminUsers.id, existing[0].id));
    console.log(`Super admin '${username}' diperbarui dengan aman.`);
  } else {
    await db.insert(schema.adminUsers).values({
      id: `adm-${crypto.randomUUID().slice(0, 8)}`,
      username,
      password_hash: passwordHash,
      full_name: 'Kurator Utama LKI',
      role: 'super_admin',
      is_active: true,
    });
    console.log(`Super admin '${username}' berhasil dibuat.`);
  }
}

if (import.meta.main) {
  bootstrapAdmin()
    .then(async () => {
      await pgClient.end();
      process.exit(0);
    })
    .catch(async (err) => {
      console.error('Bootstrap admin gagal:', err);
      await pgClient.end();
      process.exit(1);
    });
}
