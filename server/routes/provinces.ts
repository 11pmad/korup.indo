import { Router } from 'express';
import { db, schema } from '../db/index.js';
import { eq, desc } from 'drizzle-orm';

const router = Router();

// GET /api/provinces (agregat untuk peta choropleth)
router.get('/', async (req, res) => {
  try {
    const { era, island, sort = 'loss_desc', page, limit } = req.query;

    let provinceRows = await db
      .select({
        id: schema.provinces.id,
        name: schema.provinces.name,
        island_cluster: schema.provinces.island_cluster,
        geojson_code: schema.provinces.geojson_code,
        total_loss_amount: schema.provinces.total_loss_amount,
        total_cases: schema.provinces.total_cases,
        created_at: schema.provinces.created_at,
        updated_at: schema.provinces.updated_at
      })
      .from(schema.provinces);

    // If era specified, compute era-specific loss
    if (era) {
      const eraCases = await db
        .select({
          provinceId: schema.cases.province_id,
          loss: schema.cases.loss_amount
        })
        .from(schema.cases)
        .where(eq(schema.cases.era_id, String(era)));

      const lossByProv: Record<string, { loss: number; count: number }> = {};
      for (const c of eraCases) {
        if (c.provinceId) {
          if (!lossByProv[c.provinceId]) lossByProv[c.provinceId] = { loss: 0, count: 0 };
          lossByProv[c.provinceId].loss += c.loss;
          lossByProv[c.provinceId].count += 1;
        }
      }

      provinceRows = provinceRows.map(p => ({
        ...p,
        total_loss_amount: lossByProv[p.id]?.loss || 0,
        total_cases: lossByProv[p.id]?.count || 0
      }));
    }

    if (island) {
      provinceRows = provinceRows.filter(p => p.island_cluster.toLowerCase() === String(island).toLowerCase());
    }

    // Sort
    provinceRows.sort((a, b) => {
      if (sort === 'loss_asc') return a.total_loss_amount - b.total_loss_amount;
      if (sort === 'cases_desc') return b.total_cases - a.total_cases;
      if (sort === 'name_asc') return a.name.localeCompare(b.name);
      return b.total_loss_amount - a.total_loss_amount;
    });

    const totalItems = provinceRows.length;
    const pageNum = page ? Math.max(1, parseInt(String(page), 10) || 1) : 1;
    const limitNum = limit ? Math.min(100, Math.max(1, parseInt(String(limit), 10) || 38)) : 38;
    const offset = (pageNum - 1) * limitNum;
    const paginated = provinceRows.slice(offset, offset + limitNum).map((p, idx) => ({
      ...p,
      rank: offset + idx + 1,
      // Provide compatibility fields for frontend map & table
      provinsi: p.name,
      total_kerugian: p.total_loss_amount,
      total_kasus: p.total_cases,
      island_group: p.island_cluster
    }));

    res.json({
      data: paginated,
      pagination: {
        page: pageNum,
        total_pages: Math.ceil(totalItems / limitNum),
        total_items: totalItems
      }
    });
  } catch (err: any) {
    console.error('Error in /api/provinces:', err);
    res.status(500).json({ error: err.message });
  }
});

// Backward-compatible endpoint for /api/regions/summary
router.get('/summary', async (req, res) => {
  try {
    const list = await db.select().from(schema.provinces);
    const summary = list.map(p => ({
      provinsi: p.name,
      total_kasus: p.total_cases,
      total_kerugian: p.total_loss_amount,
      island_group: p.island_cluster
    }));
    res.json(summary);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
