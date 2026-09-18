import { Router } from 'express';
import { db, schema } from '../db/index.js';
import { eq, desc, sql } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { generateToken, verifyAdminJwt } from '../middleware/auth.js';
import { z } from 'zod';
import { processAdminCommand } from '../gemini.js';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const DEFAULT_ANNOUNCEMENT = {
  title: '⚖️ PEMBERITAHUAN ASAS HUKUM & SUMBER RESMI:',
  badge: 'Wajib Dibaca',
  main_text: 'Data bersumber dari putusan pengadilan & pemberitaan media yang tercantum. Setiap orang berhak atas asas praduga tak bersalah hingga ada putusan berkekuatan hukum tetap.',
  sub_text: 'Setiap data diverifikasi dengan tautan resmi direktori putusan Mahkamah Agung RI, KPK.go.id, atau media nasional kredibel.',
  is_active: true,
  updated_at: new Date().toISOString(),
  updated_by: 'system'
};

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

// POST /api/admin/reports/:id/action (compatibility)
router.post('/reports/:id/action', async (req, res) => {
  try {
    const { id } = req.params;
    const action = req.body.action; // 'disetujui' | 'ditolak' | 'approved' | 'rejected'
    const status = action === 'disetujui' || action === 'approved' ? 'approved' : 'rejected';

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

    res.json({ message: `Status laporan berhasil diperbarui menjadi ${status}`, data: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Helper mapping functions
const mapSectorCategory = (val?: string): 'pengadaan_barang_jasa' | 'bansos_bencana' | 'suap_gratifikasi' | 'perizinan_sda_tambang' | 'mafia_peradilan' => {
  if (!val) return 'suap_gratifikasi';
  const lower = val.toLowerCase();
  if (lower.includes('bansos') || lower.includes('bencana')) return 'bansos_bencana';
  if (lower.includes('tambang') || lower.includes('sda') || lower.includes('izin') || lower.includes('lingkungan')) return 'perizinan_sda_tambang';
  if (lower.includes('peradilan') || lower.includes('hakim') || lower.includes('jaksa') || lower.includes('polisi') || lower.includes('mafia')) return 'mafia_peradilan';
  if (lower.includes('pengadaan') || lower.includes('proyek') || lower.includes('jasa')) return 'pengadaan_barang_jasa';
  return 'suap_gratifikasi';
};

const mapLegalStatus = (val?: string): 'tersangka' | 'terdakwa' | 'divonis_inkrah' | 'bebas' => {
  if (!val) return 'tersangka';
  const lower = val.toLowerCase();
  if (lower.includes('inkrah') || lower.includes('vonis') || lower.includes('terpidana')) return 'divonis_inkrah';
  if (lower.includes('terdakwa') || lower.includes('sidang')) return 'terdakwa';
  if (lower.includes('bebas') || lower.includes('praperadilan')) return 'bebas';
  return 'tersangka';
};

// POST /api/admin/ai-command
router.post('/ai-command', async (req, res) => {
  try {
    const { command, history = [] } = req.body;
    if (!command || typeof command !== 'string' || !command.trim()) {
      return res.status(400).json({ error: 'Teks perintah wajib disertakan' });
    }

    const aiResult = await processAdminCommand(command, history);

    const logId = `audit-${Date.now()}`;
    await db.insert(schema.auditLogs).values({
      id: logId,
      admin_user_id: req.admin?.id,
      entity_type: 'cases',
      entity_id: 'pending',
      action: 'create',
      diff_snapshot: {
        perintah_asli: command,
        status: 'pending',
        riwayat_klarifikasi: [
          ...history,
          { role: 'admin', text: command, timestamp: new Date().toISOString() },
          { role: 'ai', text: aiResult.message, timestamp: new Date().toISOString() }
        ],
        hasil_ai: aiResult.is_draft_ready ? aiResult.draft : null
      },
      created_at: new Date()
    });

    res.json({
      log_id: logId,
      ...aiResult
    });
  } catch (err: any) {
    console.error('Error in /api/admin/ai-command:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/cases/confirm
router.post('/cases/confirm', async (req, res) => {
  try {
    const { log_id, catatan_admin } = req.body;
    if (!log_id) {
      return res.status(400).json({ error: 'log_id wajib disertakan untuk konfirmasi' });
    }

    const [log] = await db
      .select()
      .from(schema.auditLogs)
      .where(eq(schema.auditLogs.id, log_id));

    if (!log) {
      return res.status(404).json({ error: 'Log audit tidak ditemukan' });
    }

    const diff = (log.diff_snapshot as any) || {};
    const draft = diff.hasil_ai;
    if (!draft || !draft.corruption_case || !draft.official) {
      return res.status(400).json({ error: 'Draft belum lengkap atau belum siap dikonfirmasi' });
    }

    const provName = draft.official.provinsi || 'DKI Jakarta';
    const provList = await db
      .select()
      .from(schema.provinces)
      .where(sql`lower(${schema.provinces.name}) = lower(${provName})`)
      .limit(1);
    const prov = provList[0] || (await db.select().from(schema.provinces).limit(1))[0];
    const provinceId = prov?.id || 'id-jk';

    const year = Number(draft.corruption_case.tahun_kejadian) || new Date().getFullYear();
    const allEras = await db.select().from(schema.presidentialEras);
    const era = allEras.find(e => {
      const start = new Date(e.start_date).getFullYear();
      const end = e.end_date ? new Date(e.end_date).getFullYear() : 9999;
      return year >= start && year <= end;
    }) || allEras[0];
    const eraId = era?.id || 'era-jokowi-2';

    const lossAmount = Number(draft.corruption_case.nilai_kerugian_negara) || 0;
    const legalStatus = mapLegalStatus(draft.corruption_case.status_hukum);
    const sectorCategory = mapSectorCategory(draft.corruption_case.jenis_kasus);

    // Official
    let existingOfficial = await db.query.officials.findFirst({
      where: sql`lower(${schema.officials.full_name}) = lower(${draft.official.nama})`
    });

    let officialId = existingOfficial?.id;
    if (!existingOfficial) {
      officialId = `off-${Date.now()}`;
      await db.insert(schema.officials).values({
        id: officialId,
        full_name: draft.official.nama,
        photo_url: draft.official.foto_url || null,
        position_title: draft.official.jabatan || 'Pejabat Publik',
        province_id: provinceId,
        party_id: null,
        total_loss_amount: lossAmount,
        current_legal_status: legalStatus,
        created_at: new Date(),
        updated_at: new Date()
      });
    } else {
      await db.update(schema.officials)
        .set({
          total_loss_amount: sql`${schema.officials.total_loss_amount} + ${lossAmount}`,
          current_legal_status: legalStatus,
          updated_at: new Date()
        })
        .where(eq(schema.officials.id, existingOfficial.id));
    }

    // Province counters
    if (prov) {
      await db.update(schema.provinces)
        .set({
          total_cases: sql`${schema.provinces.total_cases} + 1`,
          total_loss_amount: sql`${schema.provinces.total_loss_amount} + ${lossAmount}`,
          updated_at: new Date()
        })
        .where(eq(schema.provinces.id, prov.id));
    }

    // Create case
    const caseId = `case-${Date.now()}`;
    const sourceUrl = draft.sources?.[0]?.url || 'https://putusan3.mahkamahagung.go.id';

    const [insertedCase] = await db.insert(schema.cases).values({
      id: caseId,
      title: `${draft.corruption_case.jenis_kasus || 'Tindak Pidana Korupsi'} - ${draft.official.nama}`,
      primary_official_id: officialId!,
      province_id: provinceId,
      era_id: eraId,
      sector_category: sectorCategory,
      loss_amount: lossAmount,
      fine_amount: 0,
      restitution_amount: 0,
      prison_sentence_months: legalStatus === 'divonis_inkrah' ? 48 : 0,
      legal_status: legalStatus,
      chronology: draft.corruption_case.ringkasan_kasus || 'Ringkasan perkara terverifikasi oleh tim kurator LKI.',
      source_url: sourceUrl,
      verified_by: req.admin?.id,
      verified_at: new Date(),
      case_date: new Date(year, 0, 1),
      created_at: new Date(),
      updated_at: new Date()
    }).returning();

    // Update the Audit Log
    await db.update(schema.auditLogs)
      .set({
        entity_id: caseId,
        action: 'create',
        diff_snapshot: {
          ...diff,
          status: 'disetujui',
          created_case_id: caseId,
          title: insertedCase.title,
          catatan_admin: catatan_admin || 'Disetujui oleh kurator via Panel Admin',
          confirmed_at: new Date().toISOString()
        }
      })
      .where(eq(schema.auditLogs.id, log_id));

    res.json({
      message: 'Data perkara korupsi berhasil diverifikasi dan dipublikasikan ke database resmi!',
      case_id: caseId,
      official_id: officialId
    });
  } catch (err: any) {
    console.error('Error in /api/admin/cases/confirm:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/rollback/:log_id
router.post('/rollback/:log_id', async (req, res) => {
  try {
    const { log_id } = req.params;

    const [log] = await db
      .select()
      .from(schema.auditLogs)
      .where(eq(schema.auditLogs.id, log_id));

    if (!log) {
      return res.status(404).json({ error: 'Log audit tidak ditemukan' });
    }

    const diff = (log.diff_snapshot as any) || {};
    const caseId = (log.entity_type === 'cases' && log.entity_id !== 'pending') 
      ? log.entity_id 
      : diff.created_case_id;

    if (!caseId) {
      return res.status(400).json({ error: 'Tidak ada data perkara yang terhubung dengan log audit ini untuk di-rollback' });
    }

    const targetCase = await db.query.cases.findFirst({
      where: eq(schema.cases.id, caseId)
    });

    if (targetCase) {
      // Revert official's loss amount
      if (targetCase.primary_official_id && targetCase.loss_amount > 0) {
        await db.update(schema.officials)
          .set({
            total_loss_amount: sql`GREATEST(0, ${schema.officials.total_loss_amount} - ${targetCase.loss_amount})`,
            updated_at: new Date()
          })
          .where(eq(schema.officials.id, targetCase.primary_official_id));
      }

      // Revert province loss & count
      if (targetCase.province_id) {
        await db.update(schema.provinces)
          .set({
            total_cases: sql`GREATEST(0, ${schema.provinces.total_cases} - 1)`,
            total_loss_amount: sql`GREATEST(0, ${schema.provinces.total_loss_amount} - ${targetCase.loss_amount})`,
            updated_at: new Date()
          })
          .where(eq(schema.provinces.id, targetCase.province_id));
      }

      // Delete the case
      await db.delete(schema.cases).where(eq(schema.cases.id, caseId));
    }

    // Insert a new rollback record in auditLogs
    const rollbackLogId = `audit-rollback-${Date.now()}`;
    await db.insert(schema.auditLogs).values({
      id: rollbackLogId,
      admin_user_id: req.admin?.id,
      entity_type: 'cases',
      entity_id: caseId,
      action: 'rollback',
      diff_snapshot: {
        original_log_id: log_id,
        reverted_case_id: caseId,
        title: targetCase?.title || diff.title || 'Perkara ditarik (rollback)',
        perintah_asli: `Rollback perkara: ${targetCase?.title || caseId}`,
        catatan_admin: `Data ditarik oleh ${req.admin?.username || 'admin'} pada ${new Date().toLocaleString('id-ID')}`,
        status: 'ditolak'
      },
      created_at: new Date()
    });

    // Also update original log status
    await db.update(schema.auditLogs)
      .set({
        action: 'rollback',
        diff_snapshot: {
          ...diff,
          status: 'ditolak',
          catatan_admin: `Di-rollback oleh ${req.admin?.username || 'admin'} pada ${new Date().toLocaleString('id-ID')}`
        }
      })
      .where(eq(schema.auditLogs.id, log_id));

    res.json({
      message: 'Rollback berhasil! Data perkara telah ditarik dari database publik.'
    });
  } catch (err: any) {
    console.error('Error in /api/admin/rollback:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/audit-logs
router.get('/audit-logs', async (req, res) => {
  try {
    const rawLogs = await db
      .select({
        id: schema.auditLogs.id,
        admin_user_id: schema.auditLogs.admin_user_id,
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
      .limit(100);

    const logs = rawLogs.map(l => {
      const diff = (l.diff_snapshot as any) || {};
      const status = diff.status || (
        l.action === 'create' || l.action === 'approve_report' 
          ? 'disetujui' 
          : l.action === 'rollback' || l.action === 'reject_report' 
          ? 'ditolak' 
          : 'selesai'
      );
      const originalCommand = diff.perintah_asli || diff.command || diff.title || (
        l.action === 'rollback' 
          ? `Rollback perkara: ${l.entity_id}` 
          : l.action === 'approve_report' 
          ? `Menyetujui laporan warga untuk perkara: ${l.entity_id}` 
          : l.action === 'reject_report'
          ? `Menolak laporan warga untuk perkara: ${l.entity_id}`
          : `Aksi ${l.action} pada ${l.entity_type} (${l.entity_id})`
      );

      return {
        id: l.id,
        admin_id: l.admin_username || l.admin_user_id || 'Admin',
        admin_username: l.admin_username || 'admin',
        entity_type: l.entity_type,
        entity_id: l.entity_id,
        action: l.action,
        status: status,
        perintah_asli: originalCommand,
        riwayat_klarifikasi: diff.riwayat_klarifikasi || [],
        hasil_ai: diff.hasil_ai || null,
        created_case_id: (l.entity_type === 'cases' && l.entity_id !== 'pending') ? l.entity_id : diff.created_case_id || null,
        catatan_admin: diff.catatan_admin || diff.notes || null,
        diff_snapshot: l.diff_snapshot,
        created_at: l.created_at,
        timestamp: l.created_at ? new Date(l.created_at).toISOString() : new Date().toISOString()
      };
    });

    res.json(logs);
  } catch (err: any) {
    console.error('Error in /api/admin/audit-logs:', err);
    res.status(500).json({ error: err.message });
  }
});

// --- SETTINGS: ANNOUNCEMENT ---
const announcementInputSchema = z.object({
  title: z.string().min(3, 'Judul minimal 3 karakter').max(150, 'Judul maksimal 150 karakter'),
  badge: z.string().min(1, 'Badge minimal 1 karakter').max(50, 'Badge maksimal 50 karakter'),
  main_text: z.string().min(10, 'Teks utama minimal 10 karakter').max(1000, 'Teks utama maksimal 1000 karakter'),
  sub_text: z.string().max(500, 'Subteks maksimal 500 karakter').optional().default(''),
  is_active: z.boolean().default(true)
});

// GET /api/admin/settings/announcement
router.get('/settings/announcement', async (req, res) => {
  try {
    const filePath = path.join(process.cwd(), 'data', 'announcement.json');
    if (fs.existsSync(filePath)) {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      return res.json(data);
    }
    res.json(DEFAULT_ANNOUNCEMENT);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/admin/settings/announcement
router.put('/settings/announcement', async (req, res) => {
  try {
    const parsed = announcementInputSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Format data pemberitahuan tidak valid.',
        details: parsed.error.issues
      });
    }

    const filePath = path.join(process.cwd(), 'data', 'announcement.json');
    let prevConfig = DEFAULT_ANNOUNCEMENT;
    if (fs.existsSync(filePath)) {
      try {
        prevConfig = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      } catch (e) {
        // use default
      }
    }

    const updatedConfig = {
      title: parsed.data.title,
      badge: parsed.data.badge,
      main_text: parsed.data.main_text,
      sub_text: parsed.data.sub_text,
      is_active: parsed.data.is_active,
      updated_at: new Date().toISOString(),
      updated_by: req.admin?.username || 'admin'
    };

    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(updatedConfig, null, 2), 'utf8');

    // Catat ke audit_logs
    try {
      await db.insert(schema.auditLogs).values({
        id: crypto.randomUUID(),
        admin_user_id: req.admin?.id || null,
        entity_type: 'settings',
        entity_id: 'announcement',
        action: 'update',
        diff_snapshot: {
          action_name: 'Perbarui Teks Pemberitahuan Hukum',
          perintah_asli: `Admin ${req.admin?.username || 'admin'} memperbarui teks pemberitahuan portal publik [Badge: ${updatedConfig.badge}]`,
          previous: prevConfig,
          updated: updatedConfig,
          status: 'selesai'
        },
        created_at: new Date()
      });
    } catch (auditErr) {
      console.warn('Gagal mencatat audit log announcement:', auditErr);
    }

    res.json({
      message: 'Teks pemberitahuan berhasil diperbarui dan dipublikasikan!',
      data: updatedConfig
    });
  } catch (err: any) {
    console.error('Error in PUT /api/admin/settings/announcement:', err);
    res.status(500).json({ error: err.message });
  }
});

// --- SETTINGS: DONATION & QRIS ---
const DEFAULT_DONATION = {
  title: '☕ Dukung Independensi & Operasional LKI',
  description: 'Bantu operasional server, infrastruktur pangkalan data, verifikasi berkas direktori putusan peradilan, dan keterbukaan informasi korupsi Indonesia tanpa kompromi.',
  qris_image_url: '',
  account_name: 'Pengelola Liga Korupsi Indonesia',
  bank_info: 'Bisa discan melalui seluruh aplikasi Mobile Banking (BCA, Mandiri, BRI, BNI) & E-Wallet (GoPay, OVO, Dana, ShopeePay, LinkAja)',
  is_active: true,
  updated_at: new Date().toISOString(),
  updated_by: 'system'
};

const donationInputSchema = z.object({
  title: z.string().min(2, 'Judul minimal 2 karakter').max(150, 'Judul maksimal 150 karakter'),
  description: z.string().max(1000, 'Deskripsi maksimal 1000 karakter').optional().default(''),
  qris_image_url: z.string().max(10000000, 'Ukuran gambar/URL melebihi batas').optional().default(''),
  account_name: z.string().max(100, 'Nama akun maksimal 100 karakter').optional().default(''),
  bank_info: z.string().max(500, 'Info bank maksimal 500 karakter').optional().default(''),
  is_active: z.boolean().default(true)
});

// GET /api/admin/settings/donation
router.get('/settings/donation', async (req, res) => {
  try {
    const filePath = path.join(process.cwd(), 'data', 'donation.json');
    if (fs.existsSync(filePath)) {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      return res.json(data);
    }
    res.json(DEFAULT_DONATION);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/admin/settings/donation
router.put('/settings/donation', async (req, res) => {
  try {
    const parsed = donationInputSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Format data donasi / QRIS tidak valid.',
        details: parsed.error.issues
      });
    }

    const filePath = path.join(process.cwd(), 'data', 'donation.json');
    let prevConfig = DEFAULT_DONATION;
    if (fs.existsSync(filePath)) {
      try {
        prevConfig = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      } catch (e) {
        // use default
      }
    }

    const updatedConfig = {
      title: parsed.data.title,
      description: parsed.data.description,
      qris_image_url: parsed.data.qris_image_url,
      account_name: parsed.data.account_name,
      bank_info: parsed.data.bank_info,
      is_active: parsed.data.is_active,
      updated_at: new Date().toISOString(),
      updated_by: req.admin?.username || 'admin'
    };

    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(updatedConfig, null, 2), 'utf8');

    // Catat ke audit_logs
    try {
      await db.insert(schema.auditLogs).values({
        id: crypto.randomUUID(),
        admin_user_id: req.admin?.id || null,
        entity_type: 'settings',
        entity_id: 'donation',
        action: 'update',
        diff_snapshot: {
          action_name: 'Perbarui Pengaturan Donasi & QRIS Admin',
          perintah_asli: `Admin ${req.admin?.username || 'admin'} memperbarui data QRIS / donasi [a.n ${updatedConfig.account_name || 'Admin'}]`,
          previous: {
            ...prevConfig,
            qris_image_url: prevConfig.qris_image_url ? (prevConfig.qris_image_url.startsWith('data:') ? '[Base64 Image]' : prevConfig.qris_image_url) : ''
          },
          updated: {
            ...updatedConfig,
            qris_image_url: updatedConfig.qris_image_url ? (updatedConfig.qris_image_url.startsWith('data:') ? '[Base64 Image]' : updatedConfig.qris_image_url) : ''
          },
          status: 'selesai'
        },
        created_at: new Date()
      });
    } catch (auditErr) {
      console.warn('Gagal mencatat audit log donation:', auditErr);
    }

    res.json({
      message: 'Pengaturan donasi & QRIS berhasil diperbarui!',
      data: updatedConfig
    });
  } catch (err: any) {
    console.error('Error in PUT /api/admin/settings/donation:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;


