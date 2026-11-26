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

const createCompanySchema = z.object({
  name: z.string().trim().min(2).max(180),
  companyType: z.string().trim().min(2).max(80),
  industry: z.string().trim().min(2).max(120),
  businessSector: z.string().trim().min(2).max(120),
  beneficialOwner: z.string().trim().max(150).optional(),
});

export async function GET() {
  const { error } = await requireAdminApi('manage_cases');
  if (error) return error;

  const list = await db
    .select({
      id: schema.companies.id,
      slug: schema.companies.slug,
      name: schema.companies.name,
      company_type: schema.companies.company_type,
      industry: schema.companies.industry,
      beneficial_owner: schema.companies.beneficial_owner,
      company_status: schema.companies.company_status,
    })
    .from(schema.companies)
    .orderBy(asc(schema.companies.name))
    .limit(200);

  return apiSuccess(list);
}

export async function POST(req: NextRequest) {
  const { error, session } = await requireAdminApi('manage_cases');
  if (error || !session) return error!;

  const body = await req.json().catch(() => null);
  const parsed = createCompanySchema.safeParse(body);
  if (!parsed.success) {
    return apiError('VALIDATION_ERROR', parsed.error.issues[0]?.message || 'Data korporasi tidak valid.', 400);
  }

  const uid = crypto.randomUUID().slice(0, 8);
  const id = `comp-${uid}`;
  const slug = `${slugify(parsed.data.name) || id}-${uid.slice(0, 4)}`;

  await db.insert(schema.companies).values({
    id,
    slug,
    name: parsed.data.name,
    company_type: parsed.data.companyType,
    industry: parsed.data.industry,
    business_sector: parsed.data.businessSector,
    beneficial_owner: parsed.data.beneficialOwner ?? null,
  });

  const ip = await getClientIp();
  await recordAuditLog({
    adminUserId: session.id,
    entityType: 'company',
    entityId: id,
    action: 'create',
    diffSnapshot: { name: parsed.data.name },
    ipHash: hashIp(ip),
  });

  return apiSuccess({ id, slug }, undefined, 201);
}
