import { and, asc, desc, eq, ilike, inArray, or, sql } from 'drizzle-orm';
import { isDatabaseConfigured } from '@/env';
import { db, schema } from '@/server/db';
import { isInkrahStatus, toNum } from '@/lib/formatters';
import {
  getStaticDataset,
  PUBLIC_ANNOUNCEMENT_DEFAULT,
  PUBLIC_DONATION_DEFAULT,
} from '@/server/static-dataset';

async function withDbFallback<T>(dbFn: () => Promise<T>, staticFn: () => T): Promise<T> {
  if (!isDatabaseConfigured) return staticFn();
  try {
    return await dbFn();
  } catch {
    return staticFn();
  }
}

export interface CaseFilterParams {
  q?: string;
  province?: string;
  era?: string;
  status?: string;
  sector?: string;
  sort?: 'loss' | 'date' | 'title';
  order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export async function queryCases(params: CaseFilterParams = {}) {
  const staticQueryCases = () => {
    const ds = getStaticDataset();
    const page = Math.max(1, params.page ?? 1);
    const limit = Math.min(100, Math.max(1, params.limit ?? 20));
    const offset = (page - 1) * limit;

    const personById = new Map(ds.persons.map((p) => [p.id, p]));
    const companyById = new Map(ds.companies.map((c) => [c.id, c]));

    let filtered = ds.cases.filter((c) => {
      if (params.province && params.province !== 'all' && c.primary_province_id !== params.province) return false;
      if (params.era && params.era !== 'all' && c.era_id !== params.era) return false;
      if (params.status && params.status !== 'all' && c.current_legal_status !== params.status) return false;
      if (params.sector && params.sector !== 'all' && c.sector_category !== params.sector) return false;
      if (params.q && params.q.trim()) {
        const term = params.q.trim().toLowerCase();
        const inCase =
          c.case_title.toLowerCase().includes(term) ||
          c.summary.toLowerCase().includes(term) ||
          (c.case_number || '').toLowerCase().includes(term);
        const inPersons = ds.casePersons.some(
          (cp) => cp.case_id === c.id && personById.get(cp.person_id)?.full_name.toLowerCase().includes(term)
        );
        const inCompanies = ds.caseCompanies.some(
          (cc) => cc.case_id === c.id && companyById.get(cc.company_id)?.name.toLowerCase().includes(term)
        );
        if (!inCase && !inPersons && !inCompanies) return false;
      }
      return true;
    });

    const ascDir = params.order === 'asc' ? 1 : -1;
    filtered = filtered.slice().sort((a, b) => {
      let cmp = 0;
      if (params.sort === 'date') cmp = (a.case_date || '').localeCompare(b.case_date || '');
      else if (params.sort === 'title') cmp = a.case_title.localeCompare(b.case_title, 'id');
      else cmp = a.display_loss_amount - b.display_loss_amount;
      if (cmp !== 0) return cmp * ascDir;
      return (b.case_date || '').localeCompare(a.case_date || '');
    });

    const total = filtered.length;
    const paged = filtered.slice(offset, offset + limit);

    return {
      items: paged.map((c) => ({
        ...c,
        persons: ds.casePersons
          .filter((cp) => cp.case_id === c.id)
          .map((cp) => {
            const per = personById.get(cp.person_id);
            return {
              id: per?.id ?? cp.person_id,
              slug: per?.slug ?? cp.person_id,
              full_name: per?.full_name ?? '',
              role_in_case: cp.role_in_case,
              legal_status: cp.legal_status,
            };
          }),
      })),
      total,
      page,
      limit,
      total_pages: Math.max(1, Math.ceil(total / limit)),
    };
  };

  return withDbFallback(async () => {
  const page = Math.max(1, params.page ?? 1);
  const limit = Math.min(100, Math.max(1, params.limit ?? 20));
  const offset = (page - 1) * limit;

  const conditions = [];
  if (params.province && params.province !== 'all') {
    conditions.push(eq(schema.cases.primary_province_id, params.province));
  }
  if (params.era && params.era !== 'all') {
    conditions.push(eq(schema.cases.era_id, params.era));
  }
  if (params.status && params.status !== 'all') {
    conditions.push(eq(schema.cases.current_legal_status, params.status as any));
  }
  if (params.sector && params.sector !== 'all') {
    conditions.push(eq(schema.cases.sector_category, params.sector as any));
  }
  if (params.q && params.q.trim()) {
    const term = `%${params.q.trim()}%`;
    conditions.push(
      or(
        ilike(schema.cases.case_title, term),
        ilike(schema.cases.summary, term),
        ilike(schema.cases.case_number, term),
        sql`EXISTS (
          SELECT 1 FROM case_persons cp
          JOIN persons p ON p.id = cp.person_id
          WHERE cp.case_id = cases.id AND p.full_name ILIKE ${term}
        )`,
        sql`EXISTS (
          SELECT 1 FROM case_companies cc
          JOIN companies comp ON comp.id = cc.company_id
          WHERE cc.case_id = cases.id AND comp.name ILIKE ${term}
        )`
      )
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
  const sortDir = params.order === 'asc' ? asc : desc;
  const orderCol =
    params.sort === 'date'
      ? sortDir(schema.cases.case_date)
      : params.sort === 'title'
        ? sortDir(schema.cases.case_title)
        : sortDir(schema.cases.display_loss_amount);

  const [countRow] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(schema.cases)
    .where(whereClause);

  const rows = await db
    .select({
      id: schema.cases.id,
      slug: schema.cases.slug,
      case_title: schema.cases.case_title,
      case_number: schema.cases.case_number,
      era_id: schema.cases.era_id,
      era_name: schema.presidentialEras.name,
      primary_province_id: schema.cases.primary_province_id,
      province_name: schema.provinces.name,
      sector_category: schema.cases.sector_category,
      sector_label: schema.cases.sector_label,
      primary_mode: schema.cases.primary_mode,
      case_date: schema.cases.case_date,
      final_decision_date: schema.cases.final_decision_date,
      current_legal_status: schema.cases.current_legal_status,
      summary: schema.cases.summary,
      display_loss_amount: schema.cases.display_loss_amount,
      display_loss_basis: schema.cases.display_loss_basis,
      display_bribe_amount: schema.cases.display_bribe_amount,
      display_recovery_amount: schema.cases.display_recovery_amount,
      verification_status: schema.cases.verification_status,
      needs_manual_review: schema.cases.needs_manual_review,
    })
    .from(schema.cases)
    .leftJoin(schema.presidentialEras, eq(schema.cases.era_id, schema.presidentialEras.id))
    .leftJoin(schema.provinces, eq(schema.cases.primary_province_id, schema.provinces.id))
    .where(whereClause)
    .orderBy(orderCol, desc(schema.cases.case_date))
    .limit(limit)
    .offset(offset);

  const caseIds = rows.map((r) => r.id);
  const personsByCase = new Map<string, Array<{ id: string; slug: string; full_name: string; role_in_case: string; legal_status: string }>>();

  if (caseIds.length > 0) {
    const cpRows = await db
      .select({
        case_id: schema.casePersons.case_id,
        id: schema.persons.id,
        slug: schema.persons.slug,
        full_name: schema.persons.full_name,
        role_in_case: schema.casePersons.role_in_case,
        legal_status: schema.casePersons.legal_status,
      })
      .from(schema.casePersons)
      .innerJoin(schema.persons, eq(schema.casePersons.person_id, schema.persons.id))
      .where(inArray(schema.casePersons.case_id, caseIds));

    for (const cp of cpRows) {
      const arr = personsByCase.get(cp.case_id) ?? [];
      arr.push({
        id: cp.id,
        slug: cp.slug,
        full_name: cp.full_name,
        role_in_case: cp.role_in_case,
        legal_status: cp.legal_status,
      });
      personsByCase.set(cp.case_id, arr);
    }
  }

  return {
    items: rows.map((r) => ({
      ...r,
      display_loss_amount: toNum(r.display_loss_amount),
      display_bribe_amount: toNum(r.display_bribe_amount),
      display_recovery_amount: toNum(r.display_recovery_amount),
      persons: personsByCase.get(r.id) ?? [],
    })),
    total: countRow?.total ?? 0,
    page,
    limit,
    total_pages: Math.max(1, Math.ceil((countRow?.total ?? 0) / limit)),
  };
  }, staticQueryCases);
}

export async function queryCaseDetailBySlugOrId(slugOrId: string) {
  return withDbFallback(async () => {
  const [caseRow] = await db
    .select({
      id: schema.cases.id,
      slug: schema.cases.slug,
      case_title: schema.cases.case_title,
      case_number: schema.cases.case_number,
      case_type: schema.cases.case_type,
      era_id: schema.cases.era_id,
      era_name: schema.presidentialEras.name,
      primary_province_id: schema.cases.primary_province_id,
      province_name: schema.provinces.name,
      sector_category: schema.cases.sector_category,
      sector_label: schema.cases.sector_label,
      sub_sector: schema.cases.sub_sector,
      primary_mode: schema.cases.primary_mode,
      secondary_modes: schema.cases.secondary_modes,
      case_date: schema.cases.case_date,
      investigation_date: schema.cases.investigation_date,
      suspect_date: schema.cases.suspect_date,
      indictment_date: schema.cases.indictment_date,
      trial_start_date: schema.cases.trial_start_date,
      verdict_date: schema.cases.verdict_date,
      final_decision_date: schema.cases.final_decision_date,
      current_legal_status: schema.cases.current_legal_status,
      summary: schema.cases.summary,
      charges_articles: schema.cases.charges_articles,
      verification_status: schema.cases.verification_status,
      confidence_level: schema.cases.confidence_level,
      needs_manual_review: schema.cases.needs_manual_review,
      verification_note: schema.cases.verification_note,
      display_loss_amount: schema.cases.display_loss_amount,
      display_loss_basis: schema.cases.display_loss_basis,
      display_bribe_amount: schema.cases.display_bribe_amount,
      display_recovery_amount: schema.cases.display_recovery_amount,
      updated_at: schema.cases.updated_at,
    })
    .from(schema.cases)
    .leftJoin(schema.presidentialEras, eq(schema.cases.era_id, schema.presidentialEras.id))
    .leftJoin(schema.provinces, eq(schema.cases.primary_province_id, schema.provinces.id))
    .where(or(eq(schema.cases.slug, slugOrId), eq(schema.cases.id, slugOrId)))
    .limit(1);

  if (!caseRow) return null;

  const [personsRows, finRows, verdictRows, timelineRows, companyRows, sourceRows, reactionRows] =
    await Promise.all([
      db
        .select({
          id: schema.persons.id,
          slug: schema.persons.slug,
          full_name: schema.persons.full_name,
          occupation: schema.persons.occupation,
          photo_url: schema.persons.photo_url,
          role_in_case: schema.casePersons.role_in_case,
          legal_status: schema.casePersons.legal_status,
          offense_role: schema.casePersons.offense_role,
        })
        .from(schema.casePersons)
        .innerJoin(schema.persons, eq(schema.casePersons.person_id, schema.persons.id))
        .where(eq(schema.casePersons.case_id, caseRow.id)),
      db
        .select({
          id: schema.financialRecords.id,
          financial_type: schema.financialRecords.financial_type,
          amount: schema.financialRecords.amount,
          currency: schema.financialRecords.currency,
          financial_year: schema.financialRecords.financial_year,
          financial_description: schema.financialRecords.financial_description,
          fact_classification: schema.financialRecords.fact_classification,
          source_page: schema.financialRecords.source_page,
          source_title: schema.sources.source_title,
          source_url: schema.sources.source_url,
        })
        .from(schema.financialRecords)
        .leftJoin(schema.sources, eq(schema.financialRecords.source_id, schema.sources.id))
        .where(eq(schema.financialRecords.case_id, caseRow.id)),
      db
        .select({
          id: schema.verdicts.id,
          person_name: schema.persons.full_name,
          court: schema.verdicts.court,
          court_level: schema.verdicts.court_level,
          decision_number: schema.verdicts.decision_number,
          decision_date: schema.verdicts.decision_date,
          decision_type: schema.verdicts.decision_type,
          guilty_status: schema.verdicts.guilty_status,
          sentence_type: schema.verdicts.sentence_type,
          prison_sentence_months: schema.verdicts.prison_sentence_months,
          prosecutor_demand_months: schema.verdicts.prosecutor_demand_months,
          fine_amount: schema.verdicts.fine_amount,
          restitution_amount: schema.verdicts.restitution_amount,
          additional_penalty: schema.verdicts.additional_penalty,
          asset_forfeiture: schema.verdicts.asset_forfeiture,
          political_disqualification: schema.verdicts.political_disqualification,
          is_final: schema.verdicts.is_final,
          source_url: schema.sources.source_url,
        })
        .from(schema.verdicts)
        .innerJoin(schema.persons, eq(schema.verdicts.person_id, schema.persons.id))
        .leftJoin(schema.sources, eq(schema.verdicts.source_id, schema.sources.id))
        .where(eq(schema.verdicts.case_id, caseRow.id))
        .orderBy(asc(schema.verdicts.decision_date)),
      db
        .select({
          id: schema.timelineEvents.id,
          event_date: schema.timelineEvents.event_date,
          event_type: schema.timelineEvents.event_type,
          event_description: schema.timelineEvents.event_description,
          institution: schema.timelineEvents.institution,
          location: schema.timelineEvents.location,
          source_page: schema.timelineEvents.source_page,
        })
        .from(schema.timelineEvents)
        .where(eq(schema.timelineEvents.case_id, caseRow.id))
        .orderBy(asc(schema.timelineEvents.event_date)),
      db
        .select({
          id: schema.companies.id,
          slug: schema.companies.slug,
          name: schema.companies.name,
          company_type: schema.companies.company_type,
          industry: schema.companies.industry,
          beneficial_owner: schema.companies.beneficial_owner,
          company_role_in_case: schema.caseCompanies.company_role_in_case,
          transaction_value: schema.caseCompanies.transaction_value,
          contract_value: schema.caseCompanies.contract_value,
          company_case_status: schema.caseCompanies.company_case_status,
        })
        .from(schema.caseCompanies)
        .innerJoin(schema.companies, eq(schema.caseCompanies.company_id, schema.companies.id))
        .where(eq(schema.caseCompanies.case_id, caseRow.id)),
      db
        .select({
          id: schema.sources.id,
          source_title: schema.sources.source_title,
          source_url: schema.sources.source_url,
          source_type: schema.sources.source_type,
          source_institution: schema.sources.source_institution,
          publication_date: schema.sources.publication_date,
          source_page: schema.sources.source_page,
          source_excerpt: schema.sources.source_excerpt,
          source_reliability: schema.sources.source_reliability,
        })
        .from(schema.caseSources)
        .innerJoin(schema.sources, eq(schema.caseSources.source_id, schema.sources.id))
        .where(eq(schema.caseSources.case_id, caseRow.id)),
      db
        .select({
          reaction_type: schema.caseReactions.reaction_type,
          count: sql<number>`count(*)::int`,
        })
        .from(schema.caseReactions)
        .where(eq(schema.caseReactions.case_id, caseRow.id))
        .groupBy(schema.caseReactions.reaction_type),
    ]);

  return {
    ...caseRow,
    display_loss_amount: toNum(caseRow.display_loss_amount),
    display_bribe_amount: toNum(caseRow.display_bribe_amount),
    display_recovery_amount: toNum(caseRow.display_recovery_amount),
    persons: personsRows,
    financial_records: finRows.map((f) => ({ ...f, amount: toNum(f.amount) })),
    verdicts: verdictRows.map((v) => ({
      ...v,
      fine_amount: toNum(v.fine_amount),
      restitution_amount: toNum(v.restitution_amount),
    })),
    timeline_events: timelineRows,
    companies: companyRows.map((c) => ({
      ...c,
      transaction_value: c.transaction_value ? toNum(c.transaction_value) : null,
      contract_value: c.contract_value ? toNum(c.contract_value) : null,
    })),
    sources: sourceRows,
    reactions: reactionRows,
  };
  }, () => {
    const ds = getStaticDataset();
    const caseRow = ds.cases.find((c) => c.slug === slugOrId || c.id === slugOrId);
    if (!caseRow) return null;
    const personById = new Map(ds.persons.map((p) => [p.id, p]));
    const companyById = new Map(ds.companies.map((c) => [c.id, c]));

    return {
      ...caseRow,
      verification_status: caseRow.verification_status as any,
      confidence_level: caseRow.confidence_level,
      needs_manual_review: caseRow.needs_manual_review,
      verification_note: caseRow.verification_note,
      display_loss_amount: caseRow.display_loss_amount,
      display_loss_basis: caseRow.display_loss_basis,
      display_bribe_amount: caseRow.display_bribe_amount,
      display_recovery_amount: caseRow.display_recovery_amount,
      updated_at: caseRow.updated_at,
      persons: ds.casePersons
        .filter((cp) => cp.case_id === caseRow.id)
        .map((cp) => {
          const p = personById.get(cp.person_id);
          return {
            id: p?.id ?? cp.person_id,
            slug: p?.slug ?? cp.person_id,
            full_name: p?.full_name ?? '',
            occupation: p?.occupation ?? null,
            photo_url: p?.photo_url ?? null,
            role_in_case: cp.role_in_case,
            legal_status: cp.legal_status,
            offense_role: cp.offense_role,
          };
        }),
      financial_records: ds.financialRecords
        .filter((f) => f.case_id === caseRow.id)
        .map((f) => ({
          id: f.id,
          financial_type: f.financial_type as any,
          amount: f.amount,
          currency: f.currency,
          financial_year: f.financial_year,
          financial_description: f.financial_description ?? '',
          fact_classification: (f.fact_classification ?? 'UNVERIFIED') as any,
          source_page: f.source_page,
          source_title: f.source_title,
          source_url: f.source_url,
        })),
      verdicts: ds.verdicts
        .filter((v) => v.case_id === caseRow.id)
        .sort((a, b) => (a.decision_date || '').localeCompare(b.decision_date || ''))
        .map((v) => ({
          ...v,
          court_level: v.court_level as any,
          person_name: personById.get(v.person_id)?.full_name ?? '',
        })),
      timeline_events: ds.timelineEvents
        .filter((t) => t.case_id === caseRow.id)
        .sort((a, b) => (a.event_date || '').localeCompare(b.event_date || '')),
      companies: ds.caseCompanies
        .filter((cc) => cc.case_id === caseRow.id)
        .map((cc) => {
          const comp = companyById.get(cc.company_id);
          return {
            id: comp?.id ?? cc.company_id,
            slug: comp?.slug ?? cc.company_id,
            name: comp?.name ?? '',
            company_type: comp?.company_type ?? '',
            industry: comp?.industry ?? '',
            beneficial_owner: comp?.beneficial_owner ?? null,
            company_role_in_case: cc.company_role_in_case ?? '',
            transaction_value: cc.transaction_value,
            contract_value: cc.contract_value,
            company_case_status: cc.company_case_status ?? '',
          };
        }),
      sources: ds.caseSources
        .filter((cs) => cs.case_id === caseRow.id)
        .map((s) => ({
          id: s.id,
          source_title: s.source_title,
          source_url: s.source_url,
          source_type: s.source_type as any,
          source_institution: s.source_institution,
          publication_date: s.publication_date,
          source_page: s.source_page,
          source_excerpt: s.source_excerpt ?? '',
          source_reliability: s.source_reliability,
        })),
      reactions: [] as Array<{ reaction_type: any; count: number }>,
    };
  });
}

export async function queryOfficialsLeaderboard(params: {
  era?: string;
  province?: string;
  party?: string;
  status?: string;
  q?: string;
  sort?: 'loss' | 'cases' | 'name';
  page?: number;
  limit?: number;
} = {}) {
  const staticQueryOfficials = () => {
    const ds = getStaticDataset();
    const caseById = new Map(ds.cases.map((c) => [c.id, c]));
    const personById = new Map(ds.persons.map((p) => [p.id, p]));
    const allCases = ds.casePersons
      .map((cp) => {
        const c = caseById.get(cp.case_id);
        const p = personById.get(cp.person_id);
        if (!c || !p) return null;
        return {
          case_id: c.id,
          case_slug: c.slug,
          case_title: c.case_title,
          era_id: c.era_id,
          province_id: c.primary_province_id,
          province_name: c.province_name,
          current_legal_status: c.current_legal_status,
          display_loss_amount: String(c.display_loss_amount),
          display_bribe_amount: String(c.display_bribe_amount),
          case_date: c.case_date,
          person_id: p.id,
          person_slug: p.slug,
          full_name: p.full_name,
          occupation: p.occupation,
          photo_url: p.photo_url,
          role_in_case: cp.role_in_case,
          person_legal_status: cp.legal_status,
        };
      })
      .filter((x): x is NonNullable<typeof x> => Boolean(x));

    const partyById = new Map(ds.parties.map((pt) => [pt.id, pt]));
    const partyRows = ds.partyMemberships
      .map((pm) => {
        const pt = partyById.get(pm.party_id);
        if (!pt) return null;
        return {
          person_id: pm.person_id,
          party_id: pt.id,
          party_name: pt.name,
          party_abbr: pt.abbreviation,
          party_color: pt.color_hex,
          party_at_offense: pm.party_at_offense,
        };
      })
      .filter((x): x is NonNullable<typeof x> => Boolean(x));

    return buildOfficialsLeaderboardResult(allCases, partyRows, params);
  };

  return withDbFallback(async () => {
    const allCases = await db
      .select({
        case_id: schema.cases.id,
        case_slug: schema.cases.slug,
        case_title: schema.cases.case_title,
        era_id: schema.cases.era_id,
        province_id: schema.cases.primary_province_id,
        province_name: schema.provinces.name,
        current_legal_status: schema.cases.current_legal_status,
        display_loss_amount: schema.cases.display_loss_amount,
        display_bribe_amount: schema.cases.display_bribe_amount,
        case_date: schema.cases.case_date,
        person_id: schema.persons.id,
        person_slug: schema.persons.slug,
        full_name: schema.persons.full_name,
        occupation: schema.persons.occupation,
        photo_url: schema.persons.photo_url,
        role_in_case: schema.casePersons.role_in_case,
        person_legal_status: schema.casePersons.legal_status,
      })
      .from(schema.casePersons)
      .innerJoin(schema.cases, eq(schema.casePersons.case_id, schema.cases.id))
      .innerJoin(schema.persons, eq(schema.casePersons.person_id, schema.persons.id))
      .leftJoin(schema.provinces, eq(schema.cases.primary_province_id, schema.provinces.id));

    const partyRows = await db
      .select({
        person_id: schema.partyMemberships.person_id,
        party_id: schema.parties.id,
        party_name: schema.parties.name,
        party_abbr: schema.parties.abbreviation,
        party_color: schema.parties.color_hex,
        party_at_offense: schema.partyMemberships.party_at_offense,
      })
      .from(schema.partyMemberships)
      .innerJoin(schema.parties, eq(schema.partyMemberships.party_id, schema.parties.id));

    return buildOfficialsLeaderboardResult(allCases, partyRows, params);
  }, staticQueryOfficials);
}

function buildOfficialsLeaderboardResult(
  allCases: Array<{
    case_id: string;
    case_slug: string;
    case_title: string;
    era_id: string;
    province_id: string;
    province_name: string | null;
    current_legal_status: string;
    display_loss_amount: unknown;
    display_bribe_amount: unknown;
    case_date: string | null;
    person_id: string;
    person_slug: string;
    full_name: string;
    occupation: string | null;
    photo_url: string | null;
    role_in_case: string;
    person_legal_status: string;
  }>,
  partyRows: Array<{
    person_id: string;
    party_id: string;
    party_name: string;
    party_abbr: string;
    party_color: string;
    party_at_offense: boolean;
  }>,
  params: {
    era?: string;
    province?: string;
    party?: string;
    status?: string;
    q?: string;
    sort?: 'loss' | 'cases' | 'name';
    page?: number;
    limit?: number;
  }
) {
  const page = Math.max(1, params.page ?? 1);
  const limit = Math.min(100, Math.max(1, params.limit ?? 20));

  const partyByPerson = new Map<string, { id: string; name: string; abbr: string; color: string }>();
  for (const pr of partyRows) {
    if (!partyByPerson.has(pr.person_id) || pr.party_at_offense) {
      partyByPerson.set(pr.person_id, {
        id: pr.party_id,
        name: pr.party_name,
        abbr: pr.party_abbr,
        color: pr.party_color,
      });
    }
  }

  const byPerson = new Map<
    string,
    {
      person_id: string;
      slug: string;
      full_name: string;
      role_title: string;
      photo_url: string | null;
      province_id: string;
      province_name: string;
      party_id: string;
      party_name: string;
      party_abbr: string;
      party_color: string;
      legal_status: string;
      total_loss: number;
      total_bribe: number;
      total_cases: number;
      latest_year: number;
      primary_case_slug: string;
      primary_case_title: string;
    }
  >();

  for (const row of allCases) {
    if (params.era && params.era !== 'all' && row.era_id !== params.era) continue;
    if (params.province && params.province !== 'all' && row.province_id !== params.province) continue;
    if (params.status && params.status !== 'all' && row.person_legal_status !== params.status) continue;
    const party = partyByPerson.get(row.person_id);
    if (params.party && params.party !== 'all' && (party?.id ?? 'non-partai') !== params.party) continue;
    if (params.q && params.q.trim()) {
      const q = params.q.trim().toLowerCase();
      if (
        !row.full_name.toLowerCase().includes(q) &&
        !row.role_in_case.toLowerCase().includes(q) &&
        !row.case_title.toLowerCase().includes(q)
      ) {
        continue;
      }
    }

    const loss = toNum(row.display_loss_amount as string);
    const bribe = toNum(row.display_bribe_amount as string);
    const yr = row.case_date ? parseInt(row.case_date.slice(0, 4), 10) || 0 : 0;

    const existing = byPerson.get(row.person_id);
    if (!existing) {
      byPerson.set(row.person_id, {
        person_id: row.person_id,
        slug: row.person_slug,
        full_name: row.full_name,
        role_title: row.role_in_case || row.occupation || 'Subjek Hukum',
        photo_url: row.photo_url,
        province_id: row.province_id,
        province_name: row.province_name || 'Nasional / Pusat',
        party_id: party?.id ?? 'non-partai',
        party_name: party?.name ?? 'Non-Partai / Independen',
        party_abbr: party?.abbr ?? 'Non-Partai',
        party_color: party?.color ?? '#64748B',
        legal_status: row.person_legal_status,
        total_loss: loss,
        total_bribe: bribe,
        total_cases: 1,
        latest_year: yr,
        primary_case_slug: row.case_slug,
        primary_case_title: row.case_title,
      });
    } else {
      existing.total_loss += loss;
      existing.total_bribe += bribe;
      existing.total_cases += 1;
      if (yr > existing.latest_year) existing.latest_year = yr;
    }
  }

  const list = Array.from(byPerson.values()).sort((a, b) => {
    if (params.sort === 'cases') return b.total_cases - a.total_cases || b.total_loss - a.total_loss;
    if (params.sort === 'name') return a.full_name.localeCompare(b.full_name, 'id');
    return b.total_loss - a.total_loss || b.total_bribe - a.total_bribe;
  });

  const total = list.length;
  const start = (page - 1) * limit;
  return {
    items: list.slice(start, start + limit).map((item, idx) => ({
      rank: start + idx + 1,
      ...item,
    })),
    total,
    page,
    limit,
    total_pages: Math.max(1, Math.ceil(total / limit)),
  };
}

export async function queryPersonDetailBySlugOrId(slugOrId: string) {
  return withDbFallback(async () => {
  const [person] = await db
    .select()
    .from(schema.persons)
    .where(or(eq(schema.persons.slug, slugOrId), eq(schema.persons.id, slugOrId)))
    .limit(1);

  if (!person) return null;

  const [posRows, pmRows, caseRows, verdictRows] = await Promise.all([
    db
      .select({
        id: schema.positions.id,
        position_title: schema.positions.position_title,
        institution: schema.positions.institution,
        government_level: schema.positions.government_level,
        sector: schema.positions.sector,
        province_name: schema.provinces.name,
        period_start: schema.positions.period_start,
        period_end: schema.positions.period_end,
        position_at_offense: schema.positions.position_at_offense,
      })
      .from(schema.positions)
      .leftJoin(schema.provinces, eq(schema.positions.province_id, schema.provinces.id))
      .where(eq(schema.positions.person_id, person.id)),
    db
      .select({
        id: schema.partyMemberships.id,
        party_name: schema.parties.name,
        party_abbr: schema.parties.abbreviation,
        party_color: schema.parties.color_hex,
        party_position: schema.partyMemberships.party_position,
        party_at_offense: schema.partyMemberships.party_at_offense,
        membership_start: schema.partyMemberships.membership_start,
        membership_end: schema.partyMemberships.membership_end,
      })
      .from(schema.partyMemberships)
      .innerJoin(schema.parties, eq(schema.partyMemberships.party_id, schema.parties.id))
      .where(eq(schema.partyMemberships.person_id, person.id)),
    db
      .select({
        id: schema.cases.id,
        slug: schema.cases.slug,
        case_title: schema.cases.case_title,
        case_date: schema.cases.case_date,
        era_name: schema.presidentialEras.name,
        province_name: schema.provinces.name,
        role_in_case: schema.casePersons.role_in_case,
        legal_status: schema.casePersons.legal_status,
        display_loss_amount: schema.cases.display_loss_amount,
        display_loss_basis: schema.cases.display_loss_basis,
        display_bribe_amount: schema.cases.display_bribe_amount,
      })
      .from(schema.casePersons)
      .innerJoin(schema.cases, eq(schema.casePersons.case_id, schema.cases.id))
      .leftJoin(schema.presidentialEras, eq(schema.cases.era_id, schema.presidentialEras.id))
      .leftJoin(schema.provinces, eq(schema.cases.primary_province_id, schema.provinces.id))
      .where(eq(schema.casePersons.person_id, person.id)),
    db
      .select()
      .from(schema.verdicts)
      .where(eq(schema.verdicts.person_id, person.id))
      .orderBy(asc(schema.verdicts.decision_date)),
  ]);

  return {
    ...person,
    positions: posRows,
    party_memberships: pmRows,
    cases: caseRows.map((c) => ({
      ...c,
      display_loss_amount: toNum(c.display_loss_amount),
      display_bribe_amount: toNum(c.display_bribe_amount),
    })),
    verdicts: verdictRows.map((v) => ({
      ...v,
      fine_amount: toNum(v.fine_amount),
      restitution_amount: toNum(v.restitution_amount),
    })),
  };
  }, () => {
    const ds = getStaticDataset();
    const person = ds.persons.find((p) => p.slug === slugOrId || p.id === slugOrId);
    if (!person) return null;
    const partyById = new Map(ds.parties.map((pt) => [pt.id, pt]));
    const caseById = new Map(ds.cases.map((c) => [c.id, c]));

    return {
      ...person,
      created_at: new Date(),
      updated_at: new Date(),
      positions: ds.positions.filter((pos) => pos.person_id === person.id),
      party_memberships: ds.partyMemberships
        .filter((pm) => pm.person_id === person.id)
        .map((pm) => {
          const pt = partyById.get(pm.party_id);
          return {
            id: pm.id,
            party_name: pt?.name ?? 'Non-Partai',
            party_abbr: pt?.abbreviation ?? 'Non-Partai',
            party_color: pt?.color_hex ?? '#64748B',
            party_position: pm.party_position,
            party_at_offense: pm.party_at_offense,
            membership_start: pm.membership_start,
            membership_end: pm.membership_end,
          };
        }),
      cases: ds.casePersons
        .filter((cp) => cp.person_id === person.id)
        .map((cp) => {
          const c = caseById.get(cp.case_id);
          if (!c) return null;
          return {
            id: c.id,
            slug: c.slug,
            case_title: c.case_title,
            case_date: c.case_date,
            era_name: c.era_name,
            province_name: c.province_name,
            role_in_case: cp.role_in_case,
            legal_status: cp.legal_status,
            display_loss_amount: c.display_loss_amount,
            display_loss_basis: c.display_loss_basis,
            display_bribe_amount: c.display_bribe_amount,
          };
        })
        .filter((x): x is NonNullable<typeof x> => Boolean(x)),
      verdicts: ds.verdicts
        .filter((v) => v.person_id === person.id)
        .sort((a, b) => (a.decision_date || '').localeCompare(b.decision_date || '')),
    };
  });
}

export async function queryPartiesLeaderboard(eraFilter?: string) {
  const buildResult = (
    rows: Array<{
      party_id: string;
      party_name: string;
      abbreviation: string;
      color_hex: string;
      case_id: string | null;
      era_id: string | null;
      display_loss_amount: unknown;
      display_bribe_amount: unknown;
      person_id: string | null;
    }>
  ) => {
    const map = new Map<
      string,
      {
        id: string;
        name: string;
        abbreviation: string;
        color_hex: string;
        caseIds: Set<string>;
        personIds: Set<string>;
        total_loss: number;
        total_bribe: number;
      }
    >();

    for (const r of rows) {
      if (!map.has(r.party_id)) {
        map.set(r.party_id, {
          id: r.party_id,
          name: r.party_name,
          abbreviation: r.abbreviation,
          color_hex: r.color_hex,
          caseIds: new Set(),
          personIds: new Set(),
          total_loss: 0,
          total_bribe: 0,
        });
      }
      const entry = map.get(r.party_id)!;
      if (r.case_id && (!eraFilter || eraFilter === 'all' || r.era_id === eraFilter)) {
        if (!entry.caseIds.has(r.case_id)) {
          entry.caseIds.add(r.case_id);
          entry.total_loss += toNum(r.display_loss_amount as string);
          entry.total_bribe += toNum(r.display_bribe_amount as string);
        }
        if (r.person_id) entry.personIds.add(r.person_id);
      }
    }

    return Array.from(map.values())
      .map((p) => ({
        id: p.id,
        name: p.name,
        abbreviation: p.abbreviation,
        color_hex: p.color_hex,
        total_cases: p.caseIds.size,
        total_cadres: p.personIds.size,
        total_loss: p.total_loss,
        total_bribe: p.total_bribe,
      }))
      .sort((a, b) => b.total_loss - a.total_loss || b.total_cases - a.total_cases);
  };

  return withDbFallback(
    async () => {
      const rows = await db
        .select({
          party_id: schema.parties.id,
          party_name: schema.parties.name,
          abbreviation: schema.parties.abbreviation,
          color_hex: schema.parties.color_hex,
          case_id: schema.cases.id,
          era_id: schema.cases.era_id,
          display_loss_amount: schema.cases.display_loss_amount,
          display_bribe_amount: schema.cases.display_bribe_amount,
          person_id: schema.persons.id,
        })
        .from(schema.parties)
        .leftJoin(
          schema.partyMemberships,
          and(
            eq(schema.parties.id, schema.partyMemberships.party_id),
            eq(schema.partyMemberships.party_at_offense, true)
          )
        )
        .leftJoin(schema.persons, eq(schema.partyMemberships.person_id, schema.persons.id))
        .leftJoin(schema.casePersons, eq(schema.persons.id, schema.casePersons.person_id))
        .leftJoin(schema.cases, eq(schema.casePersons.case_id, schema.cases.id));
      return buildResult(rows);
    },
    () => {
      const ds = getStaticDataset();
      const caseById = new Map(ds.cases.map((c) => [c.id, c]));
      const rows: Parameters<typeof buildResult>[0] = [];
      for (const party of ds.parties) {
        const memberships = ds.partyMemberships.filter((pm) => pm.party_id === party.id && pm.party_at_offense);
        if (memberships.length === 0) {
          rows.push({
            party_id: party.id,
            party_name: party.name,
            abbreviation: party.abbreviation,
            color_hex: party.color_hex,
            case_id: null,
            era_id: null,
            display_loss_amount: 0,
            display_bribe_amount: 0,
            person_id: null,
          });
          continue;
        }
        for (const pm of memberships) {
          const cps = ds.casePersons.filter((cp) => cp.person_id === pm.person_id);
          if (cps.length === 0) {
            rows.push({
              party_id: party.id,
              party_name: party.name,
              abbreviation: party.abbreviation,
              color_hex: party.color_hex,
              case_id: null,
              era_id: null,
              display_loss_amount: 0,
              display_bribe_amount: 0,
              person_id: pm.person_id,
            });
          } else {
            for (const cp of cps) {
              const c = caseById.get(cp.case_id);
              rows.push({
                party_id: party.id,
                party_name: party.name,
                abbreviation: party.abbreviation,
                color_hex: party.color_hex,
                case_id: c?.id ?? null,
                era_id: c?.era_id ?? null,
                display_loss_amount: c?.display_loss_amount ?? 0,
                display_bribe_amount: c?.display_bribe_amount ?? 0,
                person_id: pm.person_id,
              });
            }
          }
        }
      }
      return buildResult(rows);
    }
  );
}

export async function queryCompaniesLeaderboard() {
  const buildResult = (
    rows: Array<{
      id: string;
      slug: string;
      name: string;
      company_type: string;
      industry: string | null;
      business_sector: string | null;
      company_location: string | null;
      beneficial_owner: string | null;
      company_status: string;
      case_id: string | null;
      case_slug: string | null;
      case_title: string | null;
      role: string | null;
      display_loss_amount: unknown;
    }>
  ) => {
    const map = new Map<string, any>();
    for (const r of rows) {
      if (!map.has(r.id)) {
        map.set(r.id, {
          id: r.id,
          slug: r.slug,
          name: r.name,
          company_type: r.company_type,
          industry: r.industry,
          business_sector: r.business_sector,
          company_location: r.company_location,
          beneficial_owner: r.beneficial_owner,
          company_status: r.company_status,
          total_cases: 0,
          total_linked_loss: 0,
          cases: [],
        });
      }
      const item = map.get(r.id);
      if (r.case_id) {
        item.total_cases += 1;
        item.total_linked_loss += toNum(r.display_loss_amount as string);
        item.cases.push({
          id: r.case_id,
          slug: r.case_slug,
          case_title: r.case_title,
          role: r.role,
        });
      }
    }

    return Array.from(map.values()).sort(
      (a, b) => b.total_linked_loss - a.total_linked_loss || b.total_cases - a.total_cases
    );
  };

  return withDbFallback(
    async () => {
      const rows = await db
        .select({
          id: schema.companies.id,
          slug: schema.companies.slug,
          name: schema.companies.name,
          company_type: schema.companies.company_type,
          industry: schema.companies.industry,
          business_sector: schema.companies.business_sector,
          company_location: schema.companies.company_location,
          beneficial_owner: schema.companies.beneficial_owner,
          company_status: schema.companies.company_status,
          case_id: schema.cases.id,
          case_slug: schema.cases.slug,
          case_title: schema.cases.case_title,
          role: schema.caseCompanies.company_role_in_case,
          display_loss_amount: schema.cases.display_loss_amount,
        })
        .from(schema.companies)
        .leftJoin(schema.caseCompanies, eq(schema.companies.id, schema.caseCompanies.company_id))
        .leftJoin(schema.cases, eq(schema.caseCompanies.case_id, schema.cases.id));
      return buildResult(rows);
    },
    () => {
      const ds = getStaticDataset();
      const caseById = new Map(ds.cases.map((c) => [c.id, c]));
      const rows: Parameters<typeof buildResult>[0] = [];
      for (const comp of ds.companies) {
        const links = ds.caseCompanies.filter((cc) => cc.company_id === comp.id);
        if (links.length === 0) {
          rows.push({ ...comp, case_id: null, case_slug: null, case_title: null, role: null, display_loss_amount: 0 });
        } else {
          for (const cc of links) {
            const c = caseById.get(cc.case_id);
            rows.push({
              ...comp,
              case_id: c?.id ?? null,
              case_slug: c?.slug ?? null,
              case_title: c?.case_title ?? null,
              role: cc.company_role_in_case,
              display_loss_amount: c?.display_loss_amount ?? 0,
            });
          }
        }
      }
      return buildResult(rows);
    }
  );
}

export async function queryProvincesSummary(filters?: { era?: string; sector?: string; status?: string }) {
  const hasFilter =
    (filters?.era && filters.era !== 'all') ||
    (filters?.sector && filters.sector !== 'all') ||
    (filters?.status && filters.status !== 'all');

  return withDbFallback(
    async () => {
      if (!hasFilter) {
        const provs = await db.select().from(schema.provinces).orderBy(asc(schema.provinces.bps_code));
        return provs.map((p) => ({
          id: p.id,
          name: p.name,
          island_cluster: p.island_cluster,
          bps_code: p.bps_code,
          total_cases: p.cached_total_cases,
          total_loss: toNum(p.cached_total_loss),
        }));
      }

      const provs = await db.select().from(schema.provinces).orderBy(asc(schema.provinces.bps_code));
      const conds = [];
      if (filters?.era && filters.era !== 'all') conds.push(eq(schema.cases.era_id, filters.era));
      if (filters?.sector && filters.sector !== 'all') conds.push(eq(schema.cases.sector_category, filters.sector as any));
      if (filters?.status && filters.status !== 'all') conds.push(eq(schema.cases.current_legal_status, filters.status as any));

      const agg = await db
        .select({
          province_id: schema.cases.primary_province_id,
          total_cases: sql<number>`count(*)::int`,
          total_loss: sql<string>`coalesce(sum(${schema.cases.display_loss_amount}), 0)`,
        })
        .from(schema.cases)
        .where(conds.length ? and(...conds) : undefined)
        .groupBy(schema.cases.primary_province_id);

      const aggMap = new Map(agg.map((a) => [a.province_id, a]));
      return provs.map((p) => {
        const found = aggMap.get(p.id);
        return {
          id: p.id,
          name: p.name,
          island_cluster: p.island_cluster,
          bps_code: p.bps_code,
          total_cases: found?.total_cases ?? 0,
          total_loss: toNum(found?.total_loss),
        };
      });
    },
    () => {
      const ds = getStaticDataset();
      const sortedProvs = ds.provinces.slice().sort((a, b) => a.bps_code.localeCompare(b.bps_code));
      if (!hasFilter) {
        return sortedProvs.map((p) => ({
          id: p.id,
          name: p.name,
          island_cluster: p.island_cluster,
          bps_code: p.bps_code,
          total_cases: p.cached_total_cases,
          total_loss: toNum(p.cached_total_loss),
        }));
      }
      const aggMap = new Map<string, { total_cases: number; total_loss: number }>();
      for (const c of ds.cases) {
        if (filters?.era && filters.era !== 'all' && c.era_id !== filters.era) continue;
        if (filters?.sector && filters.sector !== 'all' && c.sector_category !== filters.sector) continue;
        if (filters?.status && filters.status !== 'all' && c.current_legal_status !== filters.status) continue;
        const cur = aggMap.get(c.primary_province_id) ?? { total_cases: 0, total_loss: 0 };
        cur.total_cases += 1;
        cur.total_loss += c.display_loss_amount;
        aggMap.set(c.primary_province_id, cur);
      }
      return sortedProvs.map((p) => ({
        id: p.id,
        name: p.name,
        island_cluster: p.island_cluster,
        bps_code: p.bps_code,
        total_cases: aggMap.get(p.id)?.total_cases ?? 0,
        total_loss: aggMap.get(p.id)?.total_loss ?? 0,
      }));
    }
  );
}

function computeStatsOverviewResult(
  allCases: Array<{
    id: string;
    slug: string;
    case_title: string;
    era_id: string;
    era_name: string | null;
    province_id: string;
    province_name: string | null;
    sector_category: string;
    sector_label: string;
    case_date: string | null;
    current_legal_status: string;
    display_loss_amount: unknown;
    display_loss_basis: string;
    display_bribe_amount: unknown;
    display_recovery_amount: unknown;
  }>,
  erasRows: Array<{ id: string; name: string; sort_order: number; cabinet_name: string | null }>,
  provRows: Array<{ id: string; name: string; cached_total_cases: number; cached_total_loss: unknown }>
) {
  let totalCourtOrAuditLoss = 0;
  let totalInkrahLoss = 0;
  let totalBribe = 0;
  let totalRecovery = 0;
  let inkrahCount = 0;
  let nonInkrahCount = 0;
  let acquittedCount = 0;

  const yearMap = new Map<number, { year: number; cases: number; total_loss: number }>();
  const eraCountMap = new Map<string, { cases: number; total_loss: number }>();
  const sectorMap = new Map<string, { sector: string; label: string; cases: number; total_loss: number }>();

  for (const c of allCases) {
    const loss = toNum(c.display_loss_amount as string);
    const bribe = toNum(c.display_bribe_amount as string);
    const rec = toNum(c.display_recovery_amount as string);

    totalCourtOrAuditLoss += loss;
    totalBribe += bribe;
    totalRecovery += rec;

    if (isInkrahStatus(c.current_legal_status)) {
      inkrahCount += 1;
      totalInkrahLoss += loss;
    } else if (c.current_legal_status === 'bebas' || c.current_legal_status === 'lepas') {
      acquittedCount += 1;
    } else {
      nonInkrahCount += 1;
    }

    const yr = c.case_date ? parseInt(c.case_date.slice(0, 4), 10) : 0;
    if (yr >= 1945) {
      const yEntry = yearMap.get(yr) ?? { year: yr, cases: 0, total_loss: 0 };
      yEntry.cases += 1;
      yEntry.total_loss += loss;
      yearMap.set(yr, yEntry);
    }

    const eEntry = eraCountMap.get(c.era_id) ?? { cases: 0, total_loss: 0 };
    eEntry.cases += 1;
    eEntry.total_loss += loss;
    eraCountMap.set(c.era_id, eEntry);

    const sEntry = sectorMap.get(c.sector_category) ?? {
      sector: c.sector_category,
      label: c.sector_label,
      cases: 0,
      total_loss: 0,
    };
    sEntry.cases += 1;
    sEntry.total_loss += loss;
    sectorMap.set(c.sector_category, sEntry);
  }

  const hallOfShame = allCases
    .filter((c) => isInkrahStatus(c.current_legal_status))
    .sort((a, b) => toNum(b.display_loss_amount as string) - toNum(a.display_loss_amount as string))
    .slice(0, 10)
    .map((c) => ({
      id: c.id,
      slug: c.slug,
      case_title: c.case_title,
      era_name: c.era_name,
      province_name: c.province_name,
      case_date: c.case_date,
      current_legal_status: c.current_legal_status,
      display_loss_amount: toNum(c.display_loss_amount as string),
      display_loss_basis: c.display_loss_basis,
    }));

  const topProvince = provRows
    .filter((p) => p.id !== 'nasional')
    .sort(
      (a, b) =>
        b.cached_total_cases - a.cached_total_cases ||
        toNum(b.cached_total_loss as string) - toNum(a.cached_total_loss as string)
    )[0];

  const assetRecoveryRate =
    totalCourtOrAuditLoss > 0
      ? Math.min(100, Number(((totalRecovery / totalCourtOrAuditLoss) * 100).toFixed(2)))
      : 0;

  return {
    total_cases: allCases.length,
    inkrah_count: inkrahCount,
    non_inkrah_count: nonInkrahCount,
    acquitted_count: acquittedCount,
    total_loss_accumulated: totalCourtOrAuditLoss,
    total_inkrah_loss: totalInkrahLoss,
    total_bribe_accumulated: totalBribe,
    total_recovery_accumulated: totalRecovery,
    asset_recovery_rate: assetRecoveryRate,
    top_province: topProvince
      ? {
          id: topProvince.id,
          name: topProvince.name,
          total_cases: topProvince.cached_total_cases,
          total_loss: toNum(topProvince.cached_total_loss as string),
        }
      : null,
    hall_of_shame: hallOfShame,
    trends_by_year: Array.from(yearMap.values()).sort((a, b) => a.year - b.year),
    by_era: erasRows.map((e) => ({
      id: e.id,
      name: e.name,
      sort_order: e.sort_order,
      cabinet_name: e.cabinet_name,
      cases: eraCountMap.get(e.id)?.cases ?? 0,
      total_loss: eraCountMap.get(e.id)?.total_loss ?? 0,
    })),
    by_sector: Array.from(sectorMap.values()).sort((a, b) => b.cases - a.cases),
  };
}

export async function queryStatsOverview() {
  return withDbFallback(
    async () => {
      const [allCases, erasRows, provRows] = await Promise.all([
        db
          .select({
            id: schema.cases.id,
            slug: schema.cases.slug,
            case_title: schema.cases.case_title,
            era_id: schema.cases.era_id,
            era_name: schema.presidentialEras.name,
            province_id: schema.cases.primary_province_id,
            province_name: schema.provinces.name,
            sector_category: schema.cases.sector_category,
            sector_label: schema.cases.sector_label,
            case_date: schema.cases.case_date,
            current_legal_status: schema.cases.current_legal_status,
            display_loss_amount: schema.cases.display_loss_amount,
            display_loss_basis: schema.cases.display_loss_basis,
            display_bribe_amount: schema.cases.display_bribe_amount,
            display_recovery_amount: schema.cases.display_recovery_amount,
          })
          .from(schema.cases)
          .leftJoin(schema.presidentialEras, eq(schema.cases.era_id, schema.presidentialEras.id))
          .leftJoin(schema.provinces, eq(schema.cases.primary_province_id, schema.provinces.id)),
        db.select().from(schema.presidentialEras).orderBy(asc(schema.presidentialEras.sort_order)),
        db.select().from(schema.provinces),
      ]);
      return computeStatsOverviewResult(allCases, erasRows, provRows);
    },
    () => {
      const ds = getStaticDataset();
      return computeStatsOverviewResult(
        ds.cases.map((c) => ({ ...c, province_id: c.primary_province_id })),
        ds.eras,
        ds.provinces
      );
    }
  );
}

export async function queryPublicSettings() {
  return withDbFallback(
    async () => {
      const rows = await db.select().from(schema.siteSettings);
      const map = new Map(rows.map((r) => [r.key, r.value]));
      return {
        announcement: map.get('announcement') ?? PUBLIC_ANNOUNCEMENT_DEFAULT,
        donation: map.get('donation') ?? PUBLIC_DONATION_DEFAULT,
      };
    },
    () => ({
      announcement: PUBLIC_ANNOUNCEMENT_DEFAULT,
      donation: PUBLIC_DONATION_DEFAULT,
    })
  );
}
