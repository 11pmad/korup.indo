import crypto from 'crypto';
import { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { apiError, apiSuccess, applyRateLimit } from '@/server/auth';
import { db, schema } from '@/server/db';
import { reportSubmissionSchema } from '@/server/validators';

function makeTrackingCode(): string {
  const year = new Date().getFullYear();
  const suffix = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `LKI-${year}-${suffix}`;
}

export async function POST(req: NextRequest) {
  const limited = await applyRateLimit(req, 'write_citizen', 15, 900);
  if (limited) return limited;

  const body = await req.json().catch(() => null);
  const parsed = reportSubmissionSchema.safeParse(body);
  if (!parsed.success) {
    return apiError('VALIDATION_ERROR', parsed.error.issues[0]?.message || 'Laporan tidak valid.', 400);
  }

  let validCaseId: string | null = null;
  if (parsed.data.caseId) {
    const [found] = await db
      .select({ id: schema.cases.id })
      .from(schema.cases)
      .where(eq(schema.cases.id, parsed.data.caseId))
      .limit(1);
    if (found) validCaseId = found.id;
  }

  const trackingCode = makeTrackingCode();
  const id = `rep-${crypto.randomUUID().slice(0, 12)}`;

  await db.insert(schema.publicReports).values({
    id,
    tracking_code: trackingCode,
    case_id: validCaseId,
    report_type: parsed.data.reportType,
    description: parsed.data.description,
    reference_url: parsed.data.referenceUrl,
    submitter_contact: parsed.data.submitterContact || null,
    status: 'pending_review',
  });

  return apiSuccess(
    {
      id,
      trackingCode,
      status: 'pending_review',
      reportType: parsed.data.reportType,
    },
    undefined,
    201
  );
}
