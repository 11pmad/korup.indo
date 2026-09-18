import { Router } from 'express';
import { db, schema } from '../db/index.js';
import { eq, desc, asc, or, ilike, sql } from 'drizzle-orm';

const router = Router();

// Helper to normalize province name / alias
function matchProvinceAlias(cleanId: string): string | null {
  const norm = cleanId.toLowerCase().trim();
  if (norm.includes('yogyakarta') || norm.includes('jogja')) return 'diy';
  if (norm.includes('bangka')) return 'babel';
  if (norm.includes('jakarta')) return 'dki-jakarta';
  if (norm.includes('aceh')) return 'aceh';
  if (norm.includes('sumatera utara') || norm.includes('sumut')) return 'sumut';
  if (norm.includes('sumatera barat') || norm.includes('sumbar')) return 'sumbar';
  if (norm.includes('sumatera selatan') || norm.includes('sumsel')) return 'sumsel';
  if (norm.includes('jawa barat') || norm.includes('jabar')) return 'jabar';
  if (norm.includes('jawa tengah') || norm.includes('jateng')) return 'jateng';
  if (norm.includes('jawa timur') || norm.includes('jatim')) return 'jatim';
  if (norm.includes('kalimantan timur') || norm.includes('kaltim')) return 'kaltim';
  if (norm.includes('kalimantan barat') || norm.includes('kalbar')) return 'kalbar';
  if (norm.includes('kalimantan selatan') || norm.includes('kalsel')) return 'kalsel';
  if (norm.includes('kalimantan tengah') || norm.includes('kalteng')) return 'kalteng';
  if (norm.includes('kalimantan utara') || norm.includes('kaltara')) return 'kaltara';
  if (norm.includes('sulawesi selatan') || norm.includes('sulsel')) return 'sulsel';
  if (norm.includes('sulawesi utara') || norm.includes('sulut')) return 'sulut';
  if (norm.includes('sulawesi tengah') || norm.includes('sulteng')) return 'sulteng';
  if (norm.includes('sulawesi tenggara') || norm.includes('sultra')) return 'sultra';
  if (norm.includes('sulawesi barat') || norm.includes('sulbar')) return 'sulbar';
  if (norm.includes('nusa tenggara barat') || norm.includes('ntb')) return 'ntb';
  if (norm.includes('nusa tenggara timur') || norm.includes('ntt')) return 'ntt';
  if (norm.includes('papua barat daya')) return 'papbd2';
  if (norm.includes('papua pegunungan')) return 'papbd';
  if (norm.includes('papua selatan')) return 'papsel';
  if (norm.includes('papua tengah')) return 'papteng';
  if (norm.includes('papua barat')) return 'papbar';
  if (norm.includes('papua')) return 'papua';
  return null;
}

// GET /api/provinces (agregat dinamis live dari database untuk peta choropleth)
router.get('/', async (req, res) => {
  try {
    const { era, island, sort = 'loss_desc', page, limit } = req.query;

    const baseProvinces = await db
      .select({
        id: schema.provinces.id,
        name: schema.provinces.name,
        island_cluster: schema.provinces.island_cluster,
        geojson_code: schema.provinces.geojson_code,
        created_at: schema.provinces.created_at,
        updated_at: schema.provinces.updated_at
      })
      .from(schema.provinces);

    // Live aggregation query from cases table
    const caseConditions = [];
    if (era) {
      caseConditions.push(eq(schema.cases.era_id, String(era)));
    }

    const caseStatsQuery = db
      .select({
        province_id: schema.cases.province_id,
        case_count: sql<number>`count(${schema.cases.id})::int`,
        total_loss: sql<number>`coalesce(sum(${schema.cases.loss_amount}), 0)::float8`
      })
      .from(schema.cases);

    const caseStats = era 
      ? await caseStatsQuery.where(eq(schema.cases.era_id, String(era))).groupBy(schema.cases.province_id)
      : await caseStatsQuery.groupBy(schema.cases.province_id);

    const statsMap: Record<string, { count: number; loss: number }> = {};
    for (const cs of caseStats) {
      if (cs.province_id) {
        statsMap[cs.province_id] = {
          count: Number(cs.case_count) || 0,
          loss: Number(cs.total_loss) || 0
        };
      }
    }

    let provinceRows = baseProvinces.map(p => {
      const st = statsMap[p.id] || { count: 0, loss: 0 };
      return {
        ...p,
        total_loss_amount: st.loss,
        total_cases: st.count,
        provinsi: p.name,
        total_kerugian: st.loss,
        total_kasus: st.count,
        island_group: p.island_cluster
      };
    });

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
      rank: offset + idx + 1
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

// GET /api/provinces/summary (agregat dinamis live untuk peta & widget)
router.get('/summary', async (req, res) => {
  try {
    const list = await db.select().from(schema.provinces);
    
    // Live aggregation directly from schema.cases
    const caseStats = await db
      .select({
        province_id: schema.cases.province_id,
        case_count: sql<number>`count(${schema.cases.id})::int`,
        total_loss: sql<number>`coalesce(sum(${schema.cases.loss_amount}), 0)::float8`
      })
      .from(schema.cases)
      .groupBy(schema.cases.province_id);

    const statsMap: Record<string, { count: number; loss: number }> = {};
    for (const cs of caseStats) {
      if (cs.province_id) {
        statsMap[cs.province_id] = {
          count: Number(cs.case_count) || 0,
          loss: Number(cs.total_loss) || 0
        };
      }
    }

    const summary = list.map(p => {
      const st = statsMap[p.id] || { count: 0, loss: 0 };
      return {
        id: p.id,
        provinsi: p.name,
        total_kasus: st.count,
        total_kerugian: st.loss,
        island_group: p.island_cluster
      };
    });

    // Also update schema.provinces in the background to ensure consistency
    try {
      for (const p of list) {
        const st = statsMap[p.id] || { count: 0, loss: 0 };
        if (p.total_cases !== st.count || p.total_loss_amount !== st.loss) {
          await db
            .update(schema.provinces)
            .set({ total_cases: st.count, total_loss_amount: st.loss, updated_at: new Date() })
            .where(eq(schema.provinces.id, p.id));
        }
      }
    } catch (syncErr) {
      console.warn('Background sync provinces error:', syncErr);
    }

    res.json(summary);
  } catch (err: any) {
    console.error('Error in /api/provinces/summary:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/provinces/:identifier (Rincian satu provinsi + data kasus live)
router.get('/:identifier', async (req, res) => {
  try {
    const { identifier } = req.params;
    const cleanId = decodeURIComponent(identifier).trim();

    // 1. Try finding by ID or exact Name or partial name
    let prov = await db.query.provinces.findFirst({
      where: or(
        eq(schema.provinces.id, cleanId),
        ilike(schema.provinces.name, cleanId),
        ilike(schema.provinces.name, `%${cleanId}%`)
      )
    });

    // 2. Try alias matching
    if (!prov) {
      const aliasId = matchProvinceAlias(cleanId);
      if (aliasId) {
        prov = await db.query.provinces.findFirst({
          where: eq(schema.provinces.id, aliasId)
        });
      }
    }

    if (!prov) {
      return res.status(404).json({ error: `Provinsi '${identifier}' tidak ditemukan di sistem.` });
    }

    // 3. Query all cases for this province from database
    const caseRows = await db
      .select({
        id: schema.cases.id,
        title: schema.cases.title,
        loss_amount: schema.cases.loss_amount,
        fine_amount: schema.cases.fine_amount,
        restitution_amount: schema.cases.restitution_amount,
        prison_sentence_months: schema.cases.prison_sentence_months,
        legal_status: schema.cases.legal_status,
        court_decision_number: schema.cases.court_decision_number,
        chronology: schema.cases.chronology,
        charges_articles: schema.cases.charges_articles,
        source_url: schema.cases.source_url,
        sector_category: schema.cases.sector_category,
        case_date: schema.cases.case_date,
        created_at: schema.cases.created_at,
        // Official
        official_id: schema.officials.id,
        official_name: schema.officials.full_name,
        official_position: schema.officials.position_title,
        official_photo: schema.officials.photo_url,
        party_name: schema.parties.name,
        // Era
        era_name: schema.presidentialEras.name
      })
      .from(schema.cases)
      .leftJoin(schema.officials, eq(schema.cases.primary_official_id, schema.officials.id))
      .leftJoin(schema.parties, eq(schema.officials.party_id, schema.parties.id))
      .leftJoin(schema.presidentialEras, eq(schema.cases.era_id, schema.presidentialEras.id))
      .where(eq(schema.cases.province_id, prov.id))
      .orderBy(desc(schema.cases.loss_amount));

    const totalCases = caseRows.length;
    const totalLoss = caseRows.reduce((sum, c) => sum + (c.loss_amount || 0), 0);

    // Calculate distributions
    const sectorStats: Record<string, number> = {};
    const statusStats: Record<string, number> = {};
    for (const c of caseRows) {
      const sec = c.sector_category || 'lainnya';
      sectorStats[sec] = (sectorStats[sec] || 0) + 1;
      const st = c.legal_status || 'tersangka';
      statusStats[st] = (statusStats[st] || 0) + 1;
    }

    const transformedCases = caseRows.map(r => ({
      ...r,
      ringkasan_kasus: r.chronology,
      nilai_kerugian_negara: r.loss_amount,
      tahun_kejadian: r.case_date ? new Date(r.case_date).getFullYear() : 2024,
      tahun_putusan: r.case_date ? new Date(r.case_date).getFullYear() : 2024,
      status_hukum: r.legal_status === 'divonis_inkrah'
        ? 'Divonis Inkrah'
        : r.legal_status === 'terdakwa'
        ? 'Terdakwa'
        : r.legal_status === 'tersangka'
        ? 'Tersangka'
        : 'Bebas/Praperadilan',
      jenis_kasus: r.sector_category.replace(/_/g, ' ').toUpperCase(),
      official: {
        id: r.official_id || '',
        nama: r.official_name || '',
        jabatan: r.official_position || '',
        partai: r.party_name || 'Non-Partai',
        provinsi: prov!.name,
        kota_kabupaten: prov!.name,
        daerah_pemilihan: prov!.name,
        foto_url: r.official_photo || undefined
      },
      sources: [
        {
          id: `src-${r.id}`,
          case_id: r.id,
          nama_media: 'Direktori Resmi Putusan / Mahkamah Agung',
          url: r.source_url,
          tanggal_publikasi: r.case_date ? new Date(r.case_date).toISOString() : new Date().toISOString()
        }
      ],
      is_verified: true
    }));

    return res.json({
      province: {
        id: prov.id,
        name: prov.name,
        island_cluster: prov.island_cluster,
        geojson_code: prov.geojson_code,
        total_cases: totalCases,
        total_loss_amount: totalLoss
      },
      stats: {
        total_cases: totalCases,
        total_loss_amount: totalLoss,
        sector_breakdown: sectorStats,
        status_breakdown: statusStats
      },
      cases: transformedCases
    });
  } catch (err: any) {
    console.error('Error in GET /api/provinces/:identifier:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/provinces/:identifier/cases (Daftar berkas perkara per wilayah)
router.get('/:identifier/cases', async (req, res) => {
  try {
    const { identifier } = req.params;
    const cleanId = decodeURIComponent(identifier).trim();

    let prov = await db.query.provinces.findFirst({
      where: or(
        eq(schema.provinces.id, cleanId),
        ilike(schema.provinces.name, cleanId),
        ilike(schema.provinces.name, `%${cleanId}%`)
      )
    });

    if (!prov) {
      const aliasId = matchProvinceAlias(cleanId);
      if (aliasId) {
        prov = await db.query.provinces.findFirst({
          where: eq(schema.provinces.id, aliasId)
        });
      }
    }

    if (!prov) {
      return res.status(404).json({ error: `Provinsi '${identifier}' tidak ditemukan.` });
    }

    const cases = await db
      .select({
        id: schema.cases.id,
        title: schema.cases.title,
        loss_amount: schema.cases.loss_amount,
        fine_amount: schema.cases.fine_amount,
        restitution_amount: schema.cases.restitution_amount,
        prison_sentence_months: schema.cases.prison_sentence_months,
        legal_status: schema.cases.legal_status,
        court_decision_number: schema.cases.court_decision_number,
        chronology: schema.cases.chronology,
        charges_articles: schema.cases.charges_articles,
        source_url: schema.cases.source_url,
        sector_category: schema.cases.sector_category,
        case_date: schema.cases.case_date,
        created_at: schema.cases.created_at,
        official_id: schema.officials.id,
        official_name: schema.officials.full_name,
        official_position: schema.officials.position_title,
        official_photo: schema.officials.photo_url,
        party_name: schema.parties.name
      })
      .from(schema.cases)
      .leftJoin(schema.officials, eq(schema.cases.primary_official_id, schema.officials.id))
      .leftJoin(schema.parties, eq(schema.officials.party_id, schema.parties.id))
      .where(eq(schema.cases.province_id, prov.id))
      .orderBy(desc(schema.cases.loss_amount));

    const transformed = cases.map(r => ({
      ...r,
      ringkasan_kasus: r.chronology,
      nilai_kerugian_negara: r.loss_amount,
      tahun_kejadian: r.case_date ? new Date(r.case_date).getFullYear() : 2024,
      tahun_putusan: r.case_date ? new Date(r.case_date).getFullYear() : 2024,
      status_hukum: r.legal_status === 'divonis_inkrah'
        ? 'Divonis Inkrah'
        : r.legal_status === 'terdakwa'
        ? 'Terdakwa'
        : r.legal_status === 'tersangka'
        ? 'Tersangka'
        : 'Bebas/Praperadilan',
      jenis_kasus: r.sector_category.replace(/_/g, ' ').toUpperCase(),
      official: {
        id: r.official_id || '',
        nama: r.official_name || '',
        jabatan: r.official_position || '',
        partai: r.party_name || 'Non-Partai',
        provinsi: prov!.name,
        kota_kabupaten: prov!.name,
        daerah_pemilihan: prov!.name,
        foto_url: r.official_photo || undefined
      },
      sources: [
        {
          id: `src-${r.id}`,
          case_id: r.id,
          nama_media: 'Direktori Resmi Putusan / Mahkamah Agung',
          url: r.source_url,
          tanggal_publikasi: r.case_date ? new Date(r.case_date).toISOString() : new Date().toISOString()
        }
      ],
      is_verified: true
    }));

    res.json({
      province_id: prov.id,
      province_name: prov.name,
      total: transformed.length,
      cases: transformed
    });
  } catch (err: any) {
    console.error('Error in GET /api/provinces/:identifier/cases:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
