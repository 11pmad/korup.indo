import { Router } from 'express';
import { db, schema } from '../db/index.js';
import { eq, sql, desc, asc, inArray } from 'drizzle-orm';

const router = Router();

// GET /api/parties?era=&sort=&page=
router.get('/', async (req, res) => {
  try {
    const { era, sort = 'loss_desc', page = '1', limit = '20' } = req.query;

    const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(String(limit), 10) || 20));
    const offset = (pageNum - 1) * limitNum;

    let partiesList = await db.select().from(schema.parties);

    // If era is specified, compute dynamically from cases in that era
    if (era) {
      const eraCases = await db
        .select({
          officialId: schema.cases.primary_official_id,
          loss: schema.cases.loss_amount
        })
        .from(schema.cases)
        .where(eq(schema.cases.era_id, String(era)));

      const officialIds = eraCases.map(c => c.officialId).filter(Boolean) as string[];
      let partyLosses: Record<string, { loss: number; count: number }> = {};

      if (officialIds.length > 0) {
        const officialsWithParty = await db
          .select({
            id: schema.officials.id,
            partyId: schema.officials.party_id
          })
          .from(schema.officials)
          .where(inArray(schema.officials.id, officialIds));

        const officialToPartyMap = new Map(officialsWithParty.map(o => [o.id, o.partyId]));

        for (const c of eraCases) {
          if (c.officialId) {
            const pId = officialToPartyMap.get(c.officialId);
            if (pId) {
              if (!partyLosses[pId]) partyLosses[pId] = { loss: 0, count: 0 };
              partyLosses[pId].loss += c.loss;
              partyLosses[pId].count += 1;
            }
          }
        }
      }

      partiesList = partiesList.map(p => ({
        ...p,
        total_loss_amount: partyLosses[p.id]?.loss || 0,
        total_cases: partyLosses[p.id]?.count || 0
      }));
    }

    // Sort
    partiesList.sort((a, b) => {
      if (sort === 'loss_asc') return a.total_loss_amount - b.total_loss_amount;
      if (sort === 'cases_desc') return b.total_cases - a.total_cases;
      if (sort === 'name_asc') return a.name.localeCompare(b.name);
      return b.total_loss_amount - a.total_loss_amount;
    });

    const totalItems = partiesList.length;
    const totalPages = Math.ceil(totalItems / limitNum);
    const paginated = partiesList.slice(offset, offset + limitNum).map((p, idx) => ({
      ...p,
      rank: offset + idx + 1
    }));

    res.json({
      data: paginated,
      pagination: {
        page: pageNum,
        total_pages: totalPages,
        total_items: totalItems
      }
    });
  } catch (err: any) {
    console.error('Error in /api/parties:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
