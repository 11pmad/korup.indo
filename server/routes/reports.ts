import { Router } from 'express';
import { db, schema } from '../db/index.js';
import { reportRateLimiter } from '../middleware/rateLimit.js';
import { z } from 'zod';
import { eq, or, ilike } from 'drizzle-orm';

const router = Router();

const reportSchema = z.object({
  case_id: z.string().optional().nullable(),
  report_type: z.enum(['koreksi_data', 'rujukan_putusan_baru', 'usulan_kasus_baru']).default('koreksi_data'),
  description: z.string().min(5, 'Deskripsi laporan minimal 5 karakter'),
  reference_url: z.string().optional().nullable(),
  submitter_contact: z.string().optional().nullable(),
  metadata: z.record(z.string(), z.any()).optional().nullable()
});

// POST /api/reports (kirim laporan koreksi atau usulan kasus baru publik — validasi Zod, rate limited)
router.post('/', reportRateLimiter, async (req, res) => {
  try {
    // Support both new schema and legacy payload format
    const payload = {
      case_id: req.body.case_id || null,
      report_type: req.body.report_type || 'koreksi_data',
      description: req.body.description || req.body.deskripsi_kesalahan,
      reference_url: req.body.reference_url || req.body.url_rujukan || null,
      submitter_contact: req.body.submitter_contact || req.body.email_pelapor || null,
      metadata: req.body.metadata || null
    };

    const validated = reportSchema.parse(payload);

    // Format ticket ID: LKI-NEW for new case submissions, LKI-REP for corrections
    const isNewCase = validated.report_type === 'usulan_kasus_baru';
    const prefix = isNewCase ? 'LKI-NEW' : 'LKI-REP';
    const timestampSuffix = Date.now().toString(36).toUpperCase();
    const randomSuffix = Math.random().toString(36).substr(2, 4).toUpperCase();
    const newId = `${prefix}-${timestampSuffix}-${randomSuffix}`;

    const [inserted] = await db
      .insert(schema.publicReports)
      .values({
        id: newId,
        case_id: validated.case_id,
        report_type: validated.report_type,
        description: validated.description,
        reference_url: validated.reference_url,
        submitter_contact: validated.submitter_contact,
        metadata: validated.metadata,
        status: 'pending_review',
        created_at: new Date()
      })
      .returning();

    const successMsg = isNewCase
      ? 'Usulan kasus korupsi baru berhasil dikirim dan masuk ke antrean verifikasi bukti kurator LKI.'
      : 'Laporan koreksi Anda telah berhasil diterima dan masuk ke antrean kurasi verifikator.';

    res.status(201).json({
      message: successMsg,
      ticket_id: inserted.id,
      data: inserted,
      report: inserted
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.issues.map(i => i.message).join(', ') });
    }
    console.error('Error in POST /api/reports:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/reports/status/:ticketId (pengecekan status publik menggunakan nomor tiket laporan)
router.get('/status/:ticketId', async (req, res) => {
  try {
    const rawTicketId = req.params.ticketId?.trim();
    if (!rawTicketId) {
      return res.status(400).json({ error: 'Nomor tiket wajib dicantumkan' });
    }

    // Query report with case details
    const result = await db
      .select({
        id: schema.publicReports.id,
        case_id: schema.publicReports.case_id,
        case_title: schema.cases.title,
        report_type: schema.publicReports.report_type,
        description: schema.publicReports.description,
        reference_url: schema.publicReports.reference_url,
        metadata: schema.publicReports.metadata,
        status: schema.publicReports.status,
        created_at: schema.publicReports.created_at,
        reviewed_at: schema.publicReports.reviewed_at
      })
      .from(schema.publicReports)
      .leftJoin(schema.cases, eq(schema.publicReports.case_id, schema.cases.id))
      .where(or(
        eq(schema.publicReports.id, rawTicketId),
        ilike(schema.publicReports.id, rawTicketId)
      ))
      .limit(1);

    if (!result || result.length === 0) {
      return res.status(404).json({ 
        error: `Tiket "${rawTicketId}" tidak ditemukan. Pastikan format nomor tiket sudah benar.` 
      });
    }

    const report = result[0];
    const meta = (report.metadata || {}) as any;
    const resolvedTitle = report.case_title || meta.case_title || (
      report.report_type === 'usulan_kasus_baru' ? 'Usulan Kasus Baru' : 'Kasus Terpilih / Umum'
    );

    res.json({
      success: true,
      ticket: {
        id: report.id,
        case_id: report.case_id,
        case_title: resolvedTitle,
        report_type: report.report_type,
        description: report.description,
        has_reference_url: !!report.reference_url,
        reference_url: report.reference_url,
        metadata: report.metadata,
        status: report.status, // 'pending_review' | 'approved' | 'rejected'
        created_at: report.created_at,
        reviewed_at: report.reviewed_at
      }
    });
  } catch (err: any) {
    console.error('Error in GET /api/reports/status:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
