import crypto from 'crypto';
import { NextRequest } from 'next/server';
import { asc } from 'drizzle-orm';
import { z } from 'zod';
import {
  apiError,
  apiSuccess,
  getClientIp,
  hashIp,
  recordAuditLog,
  requireAdminApi,
} from '@/server/auth';
import { db, schema } from '@/server/db';
import { slugify } from '@/lib/formatters';

const createPersonSchema = z.object({
  fullName: z.string().trim().min(2).max(150),
  occupation: z.string().trim().min(2).max(150),
  gender: z.enum(['L', 'P']).optional(),
  birthPlace: z.string().trim().max(100).optional(),
});

export async function GET() {
  const { error } = await requireAdminApi('manage_cases');
  if (error) return error;

  const list = await db
    .select({
      id: schema.persons.id,
      slug: schema.persons.slug,
      full_name: schema.persons.full_name,
      occupation: schema.persons.occupation,
      nationality: schema.persons.nationality,
    })
    .from(schema.persons)
    .orderBy(asc(schema.persons.full_name))
    .limit(200);

  return apiSuccess(list);
}

export async function POST(req: NextRequest) {
  const { error, session } = await requireAdminApi('manage_cases');
  if (error || !session) return error!;

  const body = await req.json().catch(() => null);
  const parsed = createPersonSchema.safeParse(body);
  if (!parsed.success) {
    return apiError('VALIDATION_ERROR', parsed.error.issues[0]?.message || 'Data tokoh tidak valid.', 400);
  }

  const uid = crypto.randomUUID().slice(0, 8);
  const id = `per-${uid}`;
  const slug = `${slugify(parsed.data.fullName) || id}-${uid.slice(0, 4)}`;

  await db.insert(schema.persons).values({
    id,
    slug,
    full_name: parsed.data.fullName,
    normalized_name: parsed.data.fullName.toLowerCase(),
    occupation: parsed.data.occupation,
    gender: parsed.data.gender ?? null,
    birth_place: parsed.data.birthPlace ?? null,
  });

  const ip = await getClientIp();
  await recordAuditLog({
    adminUserId: session.id,
    entityType: 'person',
    entityId: id,
    action: 'create',
    diffSnapshot: { fullName: parsed.data.fullName },
    ipHash: hashIp(ip),
  });

  return apiSuccess({ id, slug }, undefined, 201);
}
