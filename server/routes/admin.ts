import { Router } from 'express';
import { db, schema } from '../db/index.js';
import { eq, desc, sql } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { generateToken, verifyAdminJwt } from '../middleware/auth.js';
import { z } from 'zod';

const router = Router();

// POST /api/admin/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username dan password wajib diisi.' });
    }

    const user = await db.query.adminUsers.findFirst({
      where: eq(schema.adminUsers.username, String(username))
    });

    if (!user) {
      return res.status(401).json({ error: 'Kredensial login tidak cocok.' });
    }

    const isValid = bcrypt.compareSync(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Kredensial login tidak cocok.' });
    }

    const token = generateToken({
      id: user.id,
      username: user.username,
      role: user.role
    });

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    });
  } catch (err: any) {
    console.error('Error in /api/admin/login:', err);
    res.status(500).json({ error: err.message });
  }
});

// All routes below require JWT auth
router.use(verifyAdminJwt);

// --- CASES CRUD ---

// GET /api/admin/cases
router.get('/cases', async (req, res) => {
  try {
    const { page = '1', limit = '20' } = req.query;
    const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(String(limit), 10) || 20));
    const offset = (pageNum - 1) * limitNum;

    const countRes = await db.select({ count: sql<number>`count(*)::int` }).from(schema.cases);
    const totalItems = countRes[0]?.count || 0;

    const casesList = await db
      .select({
        id: schema.cases.id,
        title: schema.cases.title,
        loss_amount: schema.cases.loss_amount,
        legal_status: schema.cases.legal_status,
        sector_category: schema.cases.sector_category,
        source_url: schema.cases.source_url,
        official_name: schema.officials.full_name,
        province_name: schema.provinces.name,
        created_at: schema.cases.created_at
      })
      .from(schema.cases)
      .leftJoin(schema.officials, eq(schema.cases.primary_official_id, schema.officials.id))
      .leftJoin(schema.provinces, eq(schema.cases.province_id, schema.provinces.id))
      .orderBy(desc(schema.cases.created_at))
      .limit(limitNum)
      .offset(offset);

    res.json({
      data: casesList,
      pagination: {
        page: pageNum,
        total_pages: Math.ceil(totalItems / limitNum),
        total_items: totalItems
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

const caseInputSchema = z.object({
  title: z.string().min(5),
  primary_official_id: z.string().min(1),
  province_id: z.string().min(1),
  era_id: z.string().min(1),
  sector_category: z.enum([
    'pengadaan_barang_jasa',
    'bansos_bencana',
    'suap_gratifikasi',
    'perizinan_sda_tambang',
    'mafia_peradilan'
  ]),
  loss_amount: z.number().default(0),
  fine_amount: z.number().default(0),
  restitution_amount: z.number().default(0),
  prison_sentence_months: z.number().default(0),
  legal_status: z.enum(['tersangka', 'terdakwa', 'divonis_inkrah', 'bebas']),
  court_decision_number: z.string().optional(),
  chronology: z.string().min(10),
  charges_articles: z.string().optional(),
  source_url: z.string().url('source_url wajib berupa URL rujukan resmi valid')
});

// POST /api/admin/cases
router.post('/cases', async (req, res) => {
  try {
    const validated = caseInputSchema.parse(req.body);
    const id = `kasus-${Date.now()}`;

    const [inserted] = await db
      .insert(schema.cases)
      .values({
        id,
        ...validated,
        verified_by: req.admin?.id,
        verified_at: new Date(),
        case_date: new Date(),
        created_at: new Date(),
        updated_at: new Date()
      })
      .returning();

    // Log audit
    await db.insert(schema.auditLogs).values({
      id: `audit-${Date.now()}`,
      admin_user_id: req.admin?.id,
      entity_type: 'cases',
      entity_id: id,
      action: 'create',
      diff_snapshot: inserted,
      created_at: new Date()
    });

    res.status(201).json({ message: 'Berkas kasus berhasil dibuat', data: inserted });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.issues.map(i => i.message).join(', ') });
    }
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/admin/cases/:id
router.put('/cases/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const validated = caseInputSchema.partial().parse(req.body);

    const [updated] = await db
      .update(schema.cases)
      .set({
        ...validated,
        updated_at: new Date()
      })
      .where(eq(schema.cases.id, id))
      .returning();

    if (!updated) {
      return res.status(404).json({ error: 'Kasus tidak ditemukan' });
    }

    await db.insert(schema.auditLogs).values({
      id: `audit-${Date.now()}`,
      admin_user_id: req.admin?.id,
      entity_type: 'cases',
      entity_id: id,
      action: 'update',
      diff_snapshot: updated,
      created_at: new Date()
    });

    res.json({ message: 'Berkas kasus berhasil diperbarui', data: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/admin/cases/:id
router.delete('/cases/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [deleted] = await db.delete(schema.cases).where(eq(schema.cases.id, id)).returning();

    if (!deleted) {
      return res.status(404).json({ error: 'Kasus tidak ditemukan' });
    }

    await db.insert(schema.auditLogs).values({
      id: `audit-${Date.now()}`,
      admin_user_id: req.admin?.id,
      entity_type: 'cases',
      entity_id: id,
      action: 'delete',
      diff_snapshot: deleted,
      created_at: new Date()
    });

    res.json({ message: 'Kasus berhasil dihapus' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- OFFICIALS CRUD ---

// GET /api/admin/officials
router.get('/officials', async (req, res) => {
  try {
    const { page = '1', limit = '20' } = req.query;
    const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(String(limit), 10) || 20));
    const offset = (pageNum - 1) * limitNum;

    const countRes = await db.select({ count: sql<number>`count(*)::int` }).from(schema.officials);
    const totalItems = countRes[0]?.count || 0;

    const list = await db
      .select({
        id: schema.officials.id,
        full_name: schema.officials.full_name,
        position_title: schema.officials.position_title,
        province_name: schema.provinces.name,
        party_name: schema.parties.name,
        total_loss_amount: schema.officials.total_loss_amount,
        current_legal_status: schema.officials.current_legal_status
      })
      .from(schema.officials)
      .leftJoin(schema.provinces, eq(schema.officials.province_id, schema.provinces.id))
      .leftJoin(schema.parties, eq(schema.officials.party_id, schema.parties.id))
      .orderBy(desc(schema.officials.total_loss_amount))
      .limit(limitNum)
      .offset(offset);

    res.json({
      data: list,
      pagination: {
        page: pageNum,
        total_pages: Math.ceil(totalItems / limitNum),
        total_items: totalItems
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/officials
router.post('/officials', async (req, res) => {
  try {
    const { full_name, photo_url, position_title, province_id, party_id, current_legal_status } = req.body;
    if (!full_name || !position_title || !current_legal_status) {
      return res.status(400).json({ error: 'Nama, jabatan, dan status hukum wajib diisi' });
    }

    const id = `off-${Date.now()}`;
    const [inserted] = await db
      .insert(schema.officials)
      .values({
        id,
        full_name,
        photo_url,
        position_title,
        province_id,
        party_id,
        current_legal_status,
        total_loss_amount: 0,
        created_at: new Date(),
        updated_at: new Date()
      })
      .returning();

    await db.insert(schema.auditLogs).values({
      id: `audit-${Date.now()}`,
      admin_user_id: req.admin?.id,
      entity_type: 'officials',
      entity_id: id,
      action: 'create',
      diff_snapshot: inserted,
      created_at: new Date()
    });

    res.status(201).json({ message: 'Data pejabat publik berhasil ditambahkan', data: inserted });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/admin/officials/:id
router.put('/officials/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [updated] = await db
      .update(schema.officials)
      .set({
        ...req.body,
        updated_at: new Date()
      })
      .where(eq(schema.officials.id, id))
      .returning();

    if (!updated) return res.status(404).json({ error: 'Data pejabat tidak ditemukan' });

    await db.insert(schema.auditLogs).values({
      id: `audit-${Date.now()}`,
      admin_user_id: req.admin?.id,
      entity_type: 'officials',
      entity_id: id,
      action: 'update',
      diff_snapshot: updated,
      created_at: new Date()
    });

    res.json({ message: 'Data pejabat berhasil diperbarui', data: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/admin/officials/:id
router.delete('/officials/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [deleted] = await db.delete(schema.officials).where(eq(schema.officials.id, id)).returning();
    if (!deleted) return res.status(404).json({ error: 'Pejabat tidak ditemukan' });

    await db.insert(schema.auditLogs).values({
      id: `audit-${Date.now()}`,
      admin_user_id: req.admin?.id,
      entity_type: 'officials',
      entity_id: id,
      action: 'delete',
      diff_snapshot: deleted,
      created_at: new Date()
    });

    res.json({ message: 'Data pejabat berhasil dihapus' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- PUBLIC REPORTS MODERATION ---

// GET /api/admin/reports
router.get('/reports', async (req, res) => {
  try {
    const reports = await db
      .select({
        id: schema.publicReports.id,
        case_id: schema.publicReports.case_id,
        case_title: schema.cases.title,
        report_type: schema.publicReports.report_type,
        description: schema.publicReports.description,
        reference_url: schema.publicReports.reference_url,
        submitter_contact: schema.publicReports.submitter_contact,
        status: schema.publicReports.status,
        created_at: schema.publicReports.created_at,
        reviewed_at: schema.publicReports.reviewed_at
      })
      .from(schema.publicReports)
      .leftJoin(schema.cases, eq(schema.publicReports.case_id, schema.cases.id))
      .orderBy(desc(schema.publicReports.created_at));

    res.json(reports);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/reports/:id
router.get('/reports/:id', async (req, res) => {
  try {
    const report = await db.query.publicReports.findFirst({
      where: eq(schema.publicReports.id, req.params.id)
    });
    if (!report) return res.status(404).json({ error: 'Laporan tidak ditemukan' });
    res.json(report);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/admin/reports/:id (approve / reject laporan publik)
router.put('/reports/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'approved' | 'rejected'

    if (status !== 'approved' && status !== 'rejected') {
      return res.status(400).json({ error: 'Status harus berupa "approved" atau "rejected"' });
    }

    const [updated] = await db
      .update(schema.publicReports)
      .set({
        status,
        reviewed_by: req.admin?.id,
        reviewed_at: new Date()
      })
      .where(eq(schema.publicReports.id, id))
      .returning();

    if (!updated) return res.status(404).json({ error: 'Laporan tidak ditemukan' });

    await db.insert(schema.auditLogs).values({
      id: `audit-${Date.now()}`,
      admin_user_id: req.admin?.id,
      entity_type: 'public_reports',
      entity_id: id,
      action: status === 'approved' ? 'approve_report' : 'reject_report',
      diff_snapshot: updated,
      created_at: new Date()
    });

    res.json({ message: `Laporan berhasil diubah status menjadi ${status}`, data: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/audit-logs
router.get('/audit-logs', async (req, res) => {
  try {
    const logs = await db
      .select({
        id: schema.auditLogs.id,
        admin_username: schema.adminUsers.username,
        entity_type: schema.auditLogs.entity_type,
        entity_id: schema.auditLogs.entity_id,
        action: schema.auditLogs.action,
        diff_snapshot: schema.auditLogs.diff_snapshot,
        created_at: schema.auditLogs.created_at
      })
      .from(schema.auditLogs)
      .leftJoin(schema.adminUsers, eq(schema.auditLogs.admin_user_id, schema.adminUsers.id))
      .orderBy(desc(schema.auditLogs.created_at))
      .limit(50);

    res.json(logs);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
