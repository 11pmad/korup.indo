import { Router } from 'express';
import { db, schema } from '../db/index.js';
import { eq, and, or, sql, desc, asc, inArray, ilike } from 'drizzle-orm';

const router = Router();

// GET /api/officials?era=&province=&party=&status=&sort=&page=
router.get('/', async (req, res) => {
  try {
    const { era, province, party, status, sort = 'loss_desc', page = '1', limit = '20' } = req.query;

    const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(String(limit), 10) || 20));
    const offset = (pageNum - 1) * limitNum;

    // Conditions
    const conditions = [];

    if (province) {
      const pStr = String(province).trim();
      const norm = pStr.toLowerCase();
      let aliasId: string | null = null;
      if (norm.includes('yogyakarta') || norm.includes('jogja')) aliasId = 'diy';
      else if (norm.includes('bangka')) aliasId = 'babel';
      else if (norm.includes('jakarta')) aliasId = 'dki-jakarta';
      else if (norm.includes('sumatera utara') || norm.includes('sumut')) aliasId = 'sumut';
      else if (norm.includes('sumatera barat') || norm.includes('sumbar')) aliasId = 'sumbar';
      else if (norm.includes('sumatera selatan') || norm.includes('sumsel')) aliasId = 'sumsel';
      else if (norm.includes('jawa timur') || norm.includes('jatim')) aliasId = 'jatim';
      else if (norm.includes('jawa barat') || norm.includes('jabar')) aliasId = 'jabar';
      else if (norm.includes('jawa tengah') || norm.includes('jateng')) aliasId = 'jateng';

      const provConditions = [
        eq(schema.officials.province_id, pStr),
        ilike(schema.provinces.name, pStr),
        ilike(schema.provinces.name, `%${pStr}%`)
      ];
      if (aliasId) {
        provConditions.push(eq(schema.officials.province_id, aliasId));
      }
      conditions.push(or(...provConditions));
    }

    if (party) {
      conditions.push(eq(schema.officials.party_id, String(party)));
    }

    if (status) {
      conditions.push(eq(schema.officials.current_legal_status, status as any));
    }

    // Era filter: filter officials who have cases in that era
    if (era) {
      const eraCases = await db
        .select({ officialId: schema.cases.primary_official_id })
        .from(schema.cases)
        .where(eq(schema.cases.era_id, String(era)));

      const validOfficialIds = eraCases.map(c => c.officialId).filter(Boolean) as string[];
      if (validOfficialIds.length === 0) {
        return res.json({
          data: [],
          pagination: { page: pageNum, total_pages: 0, total_items: 0 }
        });
      }
      conditions.push(inArray(schema.officials.id, validOfficialIds));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Count total items
    const countResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(schema.officials)
      .leftJoin(schema.provinces, eq(schema.officials.province_id, schema.provinces.id))
      .where(whereClause);

    const totalItems = countResult[0]?.count || 0;
    const totalPages = Math.ceil(totalItems / limitNum);

    // Sorting
    let orderByClause;
    if (sort === 'loss_asc') {
      orderByClause = asc(schema.officials.total_loss_amount);
    } else if (sort === 'name_asc') {
      orderByClause = asc(schema.officials.full_name);
    } else if (sort === 'name_desc') {
      orderByClause = desc(schema.officials.full_name);
    } else {
      orderByClause = desc(schema.officials.total_loss_amount);
    }

    // Query with relations
    const rows = await db
      .select({
        id: schema.officials.id,
        full_name: schema.officials.full_name,
        photo_url: schema.officials.photo_url,
        position_title: schema.officials.position_title,
        province_id: schema.officials.province_id,
        province_name: schema.provinces.name,
        party_id: schema.officials.party_id,
        party_name: schema.parties.name,
        party_logo: schema.parties.logo_url,
        total_loss_amount: schema.officials.total_loss_amount,
        current_legal_status: schema.officials.current_legal_status,
        created_at: schema.officials.created_at,
        updated_at: schema.officials.updated_at
      })
      .from(schema.officials)
      .leftJoin(schema.provinces, eq(schema.officials.province_id, schema.provinces.id))
      .leftJoin(schema.parties, eq(schema.officials.party_id, schema.parties.id))
      .where(whereClause)
      .orderBy(orderByClause)
      .limit(limitNum)
      .offset(offset);

    // Also get cases list count for each official
    const officialIds = rows.map(r => r.id);
    let casesByOfficial: Record<string, any[]> = {};
    if (officialIds.length > 0) {
      const casesList = await db
        .select({
          id: schema.cases.id,
          title: schema.cases.title,
          official_id: schema.cases.primary_official_id,
          loss_amount: schema.cases.loss_amount
        })
        .from(schema.cases)
        .where(inArray(schema.cases.primary_official_id, officialIds));

      for (const c of casesList) {
        if (c.official_id) {
          if (!casesByOfficial[c.official_id]) casesByOfficial[c.official_id] = [];
          casesByOfficial[c.official_id].push(c);
        }
      }
    }

    const data = rows.map((r, index) => ({
      ...r,
      rank: offset + index + 1,
      total_cases: casesByOfficial[r.id]?.length || 1,
      cases: casesByOfficial[r.id] || []
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
    console.error('Error in /api/officials:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/officials/:id
router.get('/:id', async (req, res) => {
  try {
    const official = await db.query.officials.findFirst({
      where: eq(schema.officials.id, req.params.id),
      with: {
        province: true,
        party: true,
        primaryCases: {
          with: {
            era: true,
            timelineEvents: true,
            documents: true
          }
        }
      }
    });

    if (!official) {
      return res.status(404).json({ error: 'Data pejabat publik tidak ditemukan' });
    }

    res.json(official);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
