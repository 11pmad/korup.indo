import { eq, sql } from 'drizzle-orm';
import { db, schema } from '@/server/db';
import { toNum } from '@/lib/formatters';

export interface FinancialItemInput {
  financial_type: string;
  amount: number | string;
}

export interface ComputedCaseFinancials {
  displayLossAmount: number;
  displayLossBasis: string;
  displayBribeAmount: number;
  displayRecoveryAmount: number;
}

/**
 * Pure Anti-Double-Counting financial aggregator.
 * Never sums project_value / contract_value into state loss,
 * and never stacks court loss + audit loss + alleged loss on the same case.
 */
export function calculateAntiDoubleCounting(
  records: FinancialItemInput[],
  currentLegalStatus: string
): ComputedCaseFinancials {
  let courtLoss = 0;
  let auditLoss = 0;
  let prosecutorOrEstimatedLoss = 0;
  let bribeTotal = 0;
  let restitutionTotal = 0;
  let fineTotal = 0;
  let seizedTotal = 0;
  let recoveredTotal = 0;

  for (const rec of records) {
    const amt = toNum(rec.amount);
    if (amt <= 0) continue;

    switch (rec.financial_type) {
      case 'court_recognized_loss_amount':
        courtLoss += amt;
        break;
      case 'audit_loss_amount':
        auditLoss += amt;
        break;
      case 'prosecutor_loss_amount':
      case 'alleged_loss_amount':
      case 'estimated_loss_amount':
        prosecutorOrEstimatedLoss += amt;
        break;
      case 'bribe_amount':
      case 'gratification_amount':
      case 'illegal_profit_amount':
        bribeTotal += amt;
        break;
      case 'restitution_amount':
        restitutionTotal += amt;
        break;
      case 'fine_amount':
        fineTotal += amt;
        break;
      case 'assets_seized_value':
        seizedTotal += amt;
        break;
      case 'assets_recovered_value':
        recoveredTotal += amt;
        break;
      // project_value and contract_value are intentionally excluded from loss/recovery totals
      default:
        break;
    }
  }

  let displayLossAmount = 0;
  let displayLossBasis = 'Perkara Suap / Non-Kerugian Keuangan Langsung';

  if (courtLoss > 0) {
    displayLossAmount = courtLoss;
    displayLossBasis = 'Putusan Pengadilan';
  } else if (auditLoss > 0) {
    displayLossAmount = auditLoss;
    displayLossBasis = 'Audit Resmi BPK/BPKP';
  } else if (prosecutorOrEstimatedLoss > 0) {
    displayLossAmount = prosecutorOrEstimatedLoss;
    displayLossBasis =
      currentLegalStatus === 'divonis_inkrah'
        ? 'Catatan Dakwaan/Tuntutan'
        : 'Taksiran Penyidik/Jaksa (Belum Inkrah)';
  } else if (bribeTotal > 0) {
    displayLossBasis = 'Suap / Gratifikasi / Pemerasan Terpisah';
  }

  const displayRecoveryAmount = restitutionTotal + fineTotal + Math.max(recoveredTotal, seizedTotal);

  return {
    displayLossAmount,
    displayLossBasis,
    displayBribeAmount: bribeTotal,
    displayRecoveryAmount,
  };
}

export async function recomputeCaseAndGlobalAggregates(caseId?: string): Promise<void> {
  const targetCases = caseId
    ? await db
        .select({ id: schema.cases.id, status: schema.cases.current_legal_status })
        .from(schema.cases)
        .where(eq(schema.cases.id, caseId))
    : await db
        .select({ id: schema.cases.id, status: schema.cases.current_legal_status })
        .from(schema.cases);

  const allFinancials = caseId
    ? await db
        .select()
        .from(schema.financialRecords)
        .where(eq(schema.financialRecords.case_id, caseId))
    : await db.select().from(schema.financialRecords);

  const byCase = new Map<string, FinancialItemInput[]>();
  for (const f of allFinancials) {
    const arr = byCase.get(f.case_id) ?? [];
    arr.push({ financial_type: f.financial_type, amount: f.amount });
    byCase.set(f.case_id, arr);
  }

  for (const c of targetCases) {
    const computed = calculateAntiDoubleCounting(byCase.get(c.id) ?? [], c.status);
    await db
      .update(schema.cases)
      .set({
        display_loss_amount: computed.displayLossAmount.toFixed(2),
        display_loss_basis: computed.displayLossBasis,
        display_bribe_amount: computed.displayBribeAmount.toFixed(2),
        display_recovery_amount: computed.displayRecoveryAmount.toFixed(2),
        updated_at: new Date(),
      })
      .where(eq(schema.cases.id, c.id));
  }

  // Recompute province caches directly via SQL
  await db.execute(sql`
    UPDATE provinces p
    SET
      cached_total_cases = COALESCE(agg.cnt, 0),
      cached_total_loss = COALESCE(agg.total_loss, 0),
      updated_at = NOW()
    FROM (
      SELECT
        primary_province_id,
        COUNT(*)::int AS cnt,
        COALESCE(SUM(display_loss_amount), 0) AS total_loss
      FROM cases
      GROUP BY primary_province_id
    ) agg
    WHERE p.id = agg.primary_province_id;
  `);

  await db.execute(sql`
    UPDATE provinces p
    SET cached_total_cases = 0, cached_total_loss = 0, updated_at = NOW()
    WHERE NOT EXISTS (
      SELECT 1 FROM cases c WHERE c.primary_province_id = p.id
    );
  `);
}
