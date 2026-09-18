import { Router } from 'express';
import { db, schema } from '../db/index.js';
import { eq, and, or, sql, desc, asc, ilike } from 'drizzle-orm';

const router = Router();

// GET /api/cases?q=&province=&era=&status=&sector=&page=&limit=
router.get('/', async (req, res) => {
  try {
    const {
      q,
      province,
      era,
      status,
      sector,
      sort_by = 'kerugian',
      order = 'desc',
      page = '1',
      limit = '20'
    } = req.query;

    const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(String(limit), 10) || 20));
    const offset = (pageNum - 1) * limitNum;

    const conditions = [];

    if (province) {
      conditions.push(eq(schema.cases.province_id, String(province)));
    }

    if (era) {
      conditions.push(eq(schema.cases.era_id, String(era)));
    }

    if (status) {
      conditions.push(eq(schema.cases.legal_status, status as any));
    }

    if (sector) {
      conditions.push(eq(schema.cases.sector_category, sector as any));
    }

    if (q) {
      const searchTerm = `%${String(q).trim()}%`;
      conditions.push(
        or(
          ilike(schema.cases.title, searchTerm),
          ilike(schema.cases.chronology, searchTerm),
          ilike(schema.officials.full_name, searchTerm),
          ilike(schema.officials.position_title, searchTerm),
          ilike(schema.provinces.name, searchTerm)
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Count
    const countResult = await db
      .select({ count: sql<number>`count(distinct ${schema.cases.id})::int` })
      .from(schema.cases)
      .leftJoin(schema.officials, eq(schema.cases.primary_official_id, schema.officials.id))
      .leftJoin(schema.provinces, eq(schema.cases.province_id, schema.provinces.id))
      .where(whereClause);

    const totalItems = countResult[0]?.count || 0;
    const totalPages = Math.ceil(totalItems / limitNum);

    // Sorting
    let orderByClause;
    const isAsc = order === 'asc';
    if (sort_by === 'tahun') {
      orderByClause = isAsc ? asc(schema.cases.case_date) : desc(schema.cases.case_date);
    } else if (sort_by === 'nama') {
      orderByClause = isAsc ? asc(schema.officials.full_name) : desc(schema.officials.full_name);
    } else {
      orderByClause = isAsc ? asc(schema.cases.loss_amount) : desc(schema.cases.loss_amount);
    }

    // Query rows
    const rows = await db
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
        party_id: schema.officials.party_id,
        party_name: schema.parties.name,
        // Province & Era
        province_id: schema.provinces.id,
        province_name: schema.provinces.name,
        era_id: schema.presidentialEras.id,
        era_name: schema.presidentialEras.name
      })
      .from(schema.cases)
      .leftJoin(schema.officials, eq(schema.cases.primary_official_id, schema.officials.id))
      .leftJoin(schema.parties, eq(schema.officials.party_id, schema.parties.id))
      .leftJoin(schema.provinces, eq(schema.cases.province_id, schema.provinces.id))
      .leftJoin(schema.presidentialEras, eq(schema.cases.era_id, schema.presidentialEras.id))
      .where(whereClause)
      .orderBy(orderByClause)
      .limit(limitNum)
      .offset(offset);

    // Get linked companies
    const caseIds = rows.map(r => r.id);
    let companiesByCase: Record<string, string[]> = {};
    if (caseIds.length > 0) {
      const caseComps = await db
        .select({
          case_id: schema.caseCompanies.case_id,
          company_name: schema.companies.name
        })
        .from(schema.caseCompanies)
        .leftJoin(schema.companies, eq(schema.caseCompanies.company_id, schema.companies.id))
        .where(sql`${schema.caseCompanies.case_id} IN ${caseIds}`);

      for (const cc of caseComps) {
        if (cc.company_name) {
          if (!companiesByCase[cc.case_id]) companiesByCase[cc.case_id] = [];
          companiesByCase[cc.case_id].push(cc.company_name);
        }
      }
    }

    // Transform to standard and legacy format
    const transformed = rows.map(r => ({
      ...r,
      perusahaan_terkait: companiesByCase[r.id] || [],
      // Compatibility fields for existing React components
      official: {
        id: r.official_id || '',
        nama: r.official_name || '',
        jabatan: r.official_position || '',
        partai: r.party_name || 'Non-Partai',
        party_id: r.party_id || 'pty-non-partisan',
        provinsi: r.province_name || '',
        kota_kabupaten: r.province_name || '',
        daerah_pemilihan: r.province_name || '',
        foto_url: r.official_photo || undefined
      },
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
      data: transformed,
      // Compatibility array for components expecting res.cases
      cases: transformed,
      pagination: {
        page: pageNum,
        total_pages: totalPages,
        total_items: totalItems
      }
    });
  } catch (err: any) {
    console.error('Error in /api/cases:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/cases/:id (detail berkas perkara lengkap)
router.get('/:id', async (req, res) => {
  try {
    const caseItem = await db.query.cases.findFirst({
      where: eq(schema.cases.id, req.params.id),
      with: {
        primaryOfficial: {
          with: {
            party: true,
            province: true
          }
        },
        province: true,
        era: true,
        timelineEvents: true,
        documents: true,
        caseCompanies: {
          with: {
            company: true
          }
        }
      }
    });

    if (!caseItem) {
      return res.status(404).json({ error: 'Berkas perkara tidak ditemukan' });
    }

    // Compatibility object for frontend
    const response = {
      ...caseItem,
      official: caseItem.primaryOfficial
        ? {
            id: caseItem.primaryOfficial.id,
            nama: caseItem.primaryOfficial.full_name,
            jabatan: caseItem.primaryOfficial.position_title,
            partai: caseItem.primaryOfficial.party?.name || 'Non-Partai',
            provinsi: caseItem.province?.name || '',
            kota_kabupaten: caseItem.province?.name || '',
            daerah_pemilihan: caseItem.province?.name || '',
            foto_url: caseItem.primaryOfficial.photo_url || undefined
          }
        : undefined,
      ringkasan_kasus: caseItem.chronology,
      nilai_kerugian_negara: caseItem.loss_amount,
      tahun_kejadian: caseItem.case_date ? new Date(caseItem.case_date).getFullYear() : 2024,
      tahun_putusan: caseItem.case_date ? new Date(caseItem.case_date).getFullYear() : 2024,
      status_hukum: caseItem.legal_status === 'divonis_inkrah'
        ? 'Divonis Inkrah'
        : caseItem.legal_status === 'terdakwa'
        ? 'Terdakwa'
        : caseItem.legal_status === 'tersangka'
        ? 'Tersangka'
        : 'Bebas/Praperadilan',
      jenis_kasus: caseItem.sector_category.replace(/_/g, ' ').toUpperCase(),
      perusahaan_terkait: caseItem.caseCompanies.map(cc => cc.company.name),
      sources: [
        {
          id: `src-${caseItem.id}`,
          case_id: caseItem.id,
          nama_media: 'Direktori Putusan Resmi',
          url: caseItem.source_url,
          tanggal_publikasi: caseItem.case_date ? new Date(caseItem.case_date).toISOString() : new Date().toISOString()
        }
      ],
      is_verified: true
    };

    res.json(response);
  } catch (err: any) {
    console.error('Error in /api/cases/:id:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
