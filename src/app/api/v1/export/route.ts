import { NextRequest, NextResponse } from 'next/server';
import { apiError, applyRateLimit } from '@/server/auth';
import {
  queryCases,
  queryCompaniesLeaderboard,
  queryOfficialsLeaderboard,
  queryPartiesLeaderboard,
  queryProvincesSummary,
} from '@/server/queries';

function csvEscape(val: unknown): string {
  const str = val === null || val === undefined ? '' : String(val);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return '';
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(',')];
  for (const row of rows) {
    lines.push(headers.map((h) => csvEscape(row[h])).join(','));
  }
  return '\uFEFF' + lines.join('\r\n');
}

export async function GET(req: NextRequest) {
  const limited = await applyRateLimit(req, 'export_heavy', 15, 3600);
  if (limited) return limited;

  const sp = req.nextUrl.searchParams;
  const type = sp.get('type') || 'cases';
  const format = sp.get('format') || 'csv';
  const era = sp.get('era') ?? undefined;
  const status = sp.get('status') ?? undefined;

  let records: Record<string, unknown>[] = [];

  if (type === 'cases') {
    const res = await queryCases({ era, status, limit: 100, page: 1 });
    records = res.items.map((c) => ({
      id: c.id,
      slug: c.slug,
      case_title: c.case_title,
      case_number: c.case_number ?? '',
      era_name: c.era_name ?? '',
      province_name: c.province_name ?? '',
      sector_label: c.sector_label,
      legal_status: c.current_legal_status,
      case_date: c.case_date ?? '',
      display_loss_idr: c.display_loss_amount,
      display_loss_basis: c.display_loss_basis,
      display_bribe_idr: c.display_bribe_amount,
      display_recovery_idr: c.display_recovery_amount,
      subjects: c.persons.map((p) => p.full_name).join('; '),
    }));
  } else if (type === 'persons') {
    const res = await queryOfficialsLeaderboard({ era, status, limit: 100, page: 1 });
    records = res.items.map((p) => ({
      rank: p.rank,
      full_name: p.full_name,
      role_title: p.role_title,
      party: p.party_name,
      province: p.province_name,
      legal_status: p.legal_status,
      total_cases: p.total_cases,
      total_loss_idr: p.total_loss,
      total_bribe_idr: p.total_bribe,
    }));
  } else if (type === 'parties') {
    const list = await queryPartiesLeaderboard(era);
    records = list.map((p) => ({
      id: p.id,
      name: p.name,
      abbreviation: p.abbreviation,
      total_cases: p.total_cases,
      total_cadres: p.total_cadres,
      total_loss_idr: p.total_loss,
      total_bribe_idr: p.total_bribe,
    }));
  } else if (type === 'companies') {
    const list = await queryCompaniesLeaderboard();
    records = list.map((c) => ({
      id: c.id,
      name: c.name,
      company_type: c.company_type,
      industry: c.industry,
      beneficial_owner: c.beneficial_owner ?? '',
      company_status: c.company_status,
      total_cases: c.total_cases,
      total_linked_loss_idr: c.total_linked_loss,
    }));
  } else if (type === 'provinces') {
    const list = await queryProvincesSummary({ era, status });
    records = list.map((p) => ({
      id: p.id,
      bps_code: p.bps_code,
      name: p.name,
      island_cluster: p.island_cluster,
      total_cases: p.total_cases,
      total_loss_idr: p.total_loss,
    }));
  } else {
    return apiError('VALIDATION_ERROR', 'Parameter type tidak dikenal.', 400);
  }

  if (format === 'json') {
    return new NextResponse(JSON.stringify({ license: 'CC BY 4.0', exported_at: new Date().toISOString(), count: records.length, data: records }, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="lki-${type}.json"`,
      },
    });
  }

  const csv = toCsv(records);
  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="lki-${type}.csv"`,
    },
  });
}
