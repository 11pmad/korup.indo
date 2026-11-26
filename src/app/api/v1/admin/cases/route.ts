import crypto from 'crypto';
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
import { queryCases } from '@/server/queries';
import { adminCaseCreateSchema } from '@/server/validators';
import { recomputeCaseAndGlobalAggregates } from '@/server/services/financials';
import { slugify } from '@/lib/formatters';

export async function GET(req: NextRequest) {
  const { error } = await requireAdminApi();
  if (error) return error;

  const sp = req.nextUrl.searchParams;
  const result = await queryCases({
    q: sp.get('q') ?? undefined,
    status: sp.get('status') ?? undefined,
    era: sp.get('era') ?? undefined,
    page: Number(sp.get('page') || 1),
    limit: Number(sp.get('limit') || 30),
  });

  return apiSuccess(result.items, {
    total: result.total,
    page: result.page,
    total_pages: result.total_pages,
  });
}

export async function POST(req: NextRequest) {
  const { error, session } = await requireAdminApi('manage_cases');
  if (error || !session) return error!;

  const body = await req.json().catch(() => null);
  const parsed = adminCaseCreateSchema.safeParse(body);
  if (!parsed.success) {
    return apiError('VALIDATION_ERROR', parsed.error.issues[0]?.message || 'Data perkara tidak valid.', 400);
  }

  const d = parsed.data;
  const uid = crypto.randomUUID().slice(0, 8);
  const caseId = `cas-${uid}`;
  const personId = `per-${uid}`;
  const sourceId = `src-${uid}`;
  const caseSlug = `${slugify(d.caseTitle) || caseId}-${uid.slice(0, 4)}`;
  const personSlug = `${slugify(d.personName) || personId}-${uid.slice(0, 4)}`;

  await db.insert(schema.sources).values({
    id: sourceId,
    source_title: d.sourceTitle,
    source_url: d.sourceUrl,
    source_type: d.currentLegalStatus === 'divonis_inkrah' ? 'court_decision' : 'official_press_release',
    source_institution: d.sourceInstitution,
    access_date: new Date().toISOString().slice(0, 10),
    source_excerpt: d.sourceExcerpt,
    source_reliability: 'high',
  });

  await db.insert(schema.persons).values({
    id: personId,
    slug: personSlug,
    full_name: d.personName,
    normalized_name: d.personName.toLowerCase(),
    occupation: d.personPosition,
  });

  if (d.partyId) {
    await db
      .insert(schema.partyMemberships)
      .values({
        id: `pm-${uid}`,
        person_id: personId,
        party_id: d.partyId,
        party_at_offense: true,
        source_id: sourceId,
      })
      .onConflictDoNothing();
  }

  await db.insert(schema.cases).values({
    id: caseId,
    slug: caseSlug,
    case_title: d.caseTitle,
    normalized_case_title: d.caseTitle.toLowerCase(),
    case_number: d.caseNumber || null,
    era_id: d.eraId,
    primary_province_id: d.primaryProvinceId,
    sector_category: d.sectorCategory,
    sector_label: d.sectorLabel,
    primary_mode: d.primaryMode,
    case_date: d.caseDate || new Date().toISOString().slice(0, 10),
    current_legal_status: d.currentLegalStatus,
    summary: d.summary,
    charges_articles: d.chargesArticles || null,
    verified_by: session.id,
    verified_at: new Date(),
  });

  await db.insert(schema.casePersons).values({
    id: `cp-${uid}`,
    case_id: caseId,
    person_id: personId,
    is_primary_subject: true,
    role_in_case: d.personPosition,
    legal_status: d.currentLegalStatus,
    offense_role: 'Pelaku Utama',
    defendant_role: d.currentLegalStatus === 'divonis_inkrah' ? 'terpidana' : d.currentLegalStatus,
    source_id: sourceId,
  });

  await db.insert(schema.caseSources).values({
    case_id: caseId,
    source_id: sourceId,
    is_primary: true,
  });

  await db.insert(schema.financialRecords).values({
    id: `fin-${uid}`,
    case_id: caseId,
    person_id: personId,
    financial_type: d.financialType,
    amount: String(d.amount),
    currency: 'IDR',
    financial_year: d.caseDate ? parseInt(d.caseDate.slice(0, 4), 10) || null : new Date().getFullYear(),
    financial_description: `Catatan finansial utama perkara ${d.caseTitle}`,
    fact_classification:
      d.financialType === 'court_recognized_loss_amount'
        ? 'COURT_FINDING'
        : d.financialType === 'audit_loss_amount'
          ? 'FACT_PRIMARY'
          : 'PROSECUTOR_CLAIM',
    source_id: sourceId,
    verification_status: 'VERIFIED_PRIMARY',
  });

  if (d.verdictDecisionNumber) {
    await db.insert(schema.verdicts).values({
      id: `ver-${uid}`,
      case_id: caseId,
      person_id: personId,
      court: d.verdictCourt || 'Pengadilan Tipikor',
      court_level: 'tingkat_pertama',
      decision_number: d.verdictDecisionNumber,
      decision_date: d.verdictDate || new Date().toISOString().slice(0, 10),
      decision_type: 'Putusan Pengadilan',
      guilty_status:
        d.currentLegalStatus === 'bebas'
          ? 'bebas'
          : d.currentLegalStatus === 'lepas'
            ? 'lepas'
            : 'bersalah',
      sentence_type: 'Pidana Penjara',
      prison_sentence_months: d.prisonMonths ?? 0,
      fine_amount: String(d.fineAmount ?? 0),
      restitution_amount: String(d.restitutionAmount ?? 0),
      is_final: d.currentLegalStatus === 'divonis_inkrah',
      source_id: sourceId,
    });
  }

  if (d.companyName?.trim()) {
    const compId = `comp-${uid}`;
    await db.insert(schema.companies).values({
      id: compId,
      slug: `${slugify(d.companyName)}-${uid.slice(0, 4)}`,
      name: d.companyName.trim(),
      company_type: 'Perseroan Terbatas',
      industry: d.sectorLabel,
      business_sector: d.sectorLabel,
      source_id: sourceId,
    });
    await db.insert(schema.caseCompanies).values({
      id: `cc-${uid}`,
      case_id: caseId,
      company_id: compId,
      company_role_in_case: 'Rekanan / Pihak Terkait',
      company_case_status: 'Tercatat dalam Berkas',
      source_id: sourceId,
    });
  }

  await recomputeCaseAndGlobalAggregates(caseId);

  const ip = await getClientIp();
  await recordAuditLog({
    adminUserId: session.id,
    entityType: 'case',
    entityId: caseId,
    action: 'create',
    diffSnapshot: { caseTitle: d.caseTitle, status: d.currentLegalStatus, sourceUrl: d.sourceUrl },
    ipHash: hashIp(ip),
  });

  revalidatePath('/');
  revalidatePath('/peta');
  revalidatePath('/klasemen');
  revalidatePath('/statistik');
  revalidatePath('/cari');
  revalidatePath(`/kasus/${caseSlug}`);

  return apiSuccess({ id: caseId, slug: caseSlug }, undefined, 201);
}
