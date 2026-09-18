import { Router } from 'express';
import { db, schema } from '../db/index.js';
import { eq, and, sql, desc, asc, ilike } from 'drizzle-orm';

const router = Router();

// GET /api/companies?sector=&page=
router.get('/', async (req, res) => {
  try {
    const { sector, page = '1', limit = '20' } = req.query;

    const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(String(limit), 10) || 20));
    const offset = (pageNum - 1) * limitNum;

    const conditions = [];
    if (sector) {
      conditions.push(ilike(schema.companies.sector, `%${String(sector)}%`));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const countResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(schema.companies)
      .where(whereClause);

    const totalItems = countResult[0]?.count || 0;
    const totalPages = Math.ceil(totalItems / limitNum);

    const rows = await db
      .select()
      .from(schema.companies)
      .where(whereClause)
      .limit(limitNum)
      .offset(offset);

    // Get count of cases and total loss associated
    const companyIds = rows.map(r => r.id);
    let casesByCompany: Record<string, { count: number; totalLoss: number }> = {};
    if (companyIds.length > 0) {
      const caseLinks = await db
        .select({
          companyId: schema.caseCompanies.company_id,
          loss: schema.cases.loss_amount
        })
        .from(schema.caseCompanies)
        .leftJoin(schema.cases, eq(schema.caseCompanies.case_id, schema.cases.id))
        .where(sql`${schema.caseCompanies.company_id} IN ${companyIds}`);

      for (const cl of caseLinks) {
        if (!casesByCompany[cl.companyId]) {
          casesByCompany[cl.companyId] = { count: 0, totalLoss: 0 };
        }
        casesByCompany[cl.companyId].count += 1;
        casesByCompany[cl.companyId].totalLoss += cl.loss || 0;
      }
    }

    const data = rows.map(r => ({
      ...r,
      total_cases: casesByCompany[r.id]?.count || 0,
      total_loss_amount: casesByCompany[r.id]?.totalLoss || 0,
      // Compatibility fields for existing React dashboard
      nama_perusahaan: r.name,
      kasus_terkait: []
    }));

    res.json({
      data,
      pagination: {
        page: pageNum,
        total_pages: totalPages,
        total_items: totalItems
      }
    });
  } catch (err: any) {
    console.error('Error in /api/companies:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/companies/:id (drill-down, termasuk cases terkait)
router.get('/:id', async (req, res) => {
  try {
    const company = await db.query.companies.findFirst({
      where: eq(schema.companies.id, req.params.id),
      with: {
        caseCompanies: {
          with: {
            case: {
              with: {
                primaryOfficial: true,
                province: true
              }
            }
          }
        }
      }
    });

    if (!company) {
      return res.status(404).json({ error: 'Data korporasi tidak ditemukan' });
    }

    const linkedCases = company.caseCompanies.map(cc => ({
      case_id: cc.case.id,
      title: cc.case.title,
      loss_amount: cc.case.loss_amount,
      legal_status: cc.case.legal_status,
      charges_articles: cc.case.charges_articles,
      transaction_date: cc.transaction_date,
      transaction_role: cc.transaction_role,
      official: cc.case.primaryOfficial
        ? {
            id: cc.case.primaryOfficial.id,
            nama: cc.case.primaryOfficial.full_name,
            jabatan: cc.case.primaryOfficial.position_title
          }
        : null,
      province: cc.case.province?.name
    }));

    const totalLoss = linkedCases.reduce((acc, c) => acc + c.loss_amount, 0);

    res.json({
      ...company,
      nama_perusahaan: company.name,
      total_loss_amount: totalLoss,
      total_cases: linkedCases.length,
      cases: linkedCases
    });
  } catch (err: any) {
    console.error('Error in /api/companies/:id:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
