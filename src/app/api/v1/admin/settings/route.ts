import { NextRequest } from 'next/server';
import { revalidatePath } from 'next/cache';
import {
  apiError,
  apiSuccess,
  getClientIp,
  hashIp,
  recordAuditLog,
  requireAdminApi,
} from '@/server/auth';
import { db, schema } from '@/server/db';
import { queryPublicSettings } from '@/server/queries';
import { adminSiteSettingsSchema } from '@/server/validators';

export async function GET() {
  const { error } = await requireAdminApi('manage_settings');
  if (error) return error;

  const settings = await queryPublicSettings();
  return apiSuccess(settings);
}

export async function PUT(req: NextRequest) {
  const { error, session } = await requireAdminApi('manage_settings');
  if (error || !session) return error!;

  const body = await req.json().catch(() => null);
  const parsed = adminSiteSettingsSchema.safeParse(body);
  if (!parsed.success) {
    return apiError('VALIDATION_ERROR', 'Pengaturan situs tidak valid.', 400);
  }

  await db
    .insert(schema.siteSettings)
    .values({
      key: parsed.data.key,
      value: parsed.data.value,
      updated_by: session.id,
      updated_at: new Date(),
    })
    .onConflictDoUpdate({
      target: schema.siteSettings.key,
      set: {
        value: parsed.data.value,
        updated_by: session.id,
        updated_at: new Date(),
      },
    });

  const ip = await getClientIp();
  await recordAuditLog({
    adminUserId: session.id,
    entityType: 'site_settings',
    entityId: parsed.data.key,
    action: 'update_setting',
    diffSnapshot: { key: parsed.data.key },
    ipHash: hashIp(ip),
  });

  revalidatePath('/');
  revalidatePath('/peta');
  revalidatePath('/klasemen');
  revalidatePath('/statistik');
  revalidatePath('/cari');

  return apiSuccess({ key: parsed.data.key, saved: true });
}
