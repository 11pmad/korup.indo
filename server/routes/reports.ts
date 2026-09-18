import { Router } from 'express';
import { db, schema } from '../db/index.js';
import { reportRateLimiter } from '../middleware/rateLimit.js';
import { z } from 'zod';

const router = Router();

const reportSchema = z.object({
  case_id: z.string().optional().nullable(),
  report_type: z.enum(['koreksi_data', 'rujukan_putusan_baru']).default('koreksi_data'),
  description: z.string().min(5, 'Deskripsi laporan minimal 5 karakter'),
  reference_url: z.string().optional().nullable(),
  submitter_contact: z.string().optional().nullable()
});

// POST /api/reports (kirim laporan koreksi publik — validasi Zod, rate limited)
router.post('/', reportRateLimiter, async (req, res) => {
  try {
    // Support both new schema and legacy payload format
    const payload = {
      case_id: req.body.case_id || null,
      report_type: req.body.report_type || 'koreksi_data',
      description: req.body.description || req.body.deskripsi_kesalahan,
      reference_url: req.body.reference_url || req.body.url_rujukan || null,
      submitter_contact: req.body.submitter_contact || req.body.email_pelapor || null
    };

    const validated = reportSchema.parse(payload);

    const newId = `rep-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const [inserted] = await db
      .insert(schema.publicReports)
      .values({
        id: newId,
        case_id: validated.case_id,
        report_type: validated.report_type,
        description: validated.description,
        reference_url: validated.reference_url,
        submitter_contact: validated.submitter_contact,
        status: 'pending_review',
        created_at: new Date()
      })
      .returning();

    res.status(201).json({
      message: 'Laporan Anda telah berhasil diterima dan masuk ke antrean kurasi verifikator.',
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

export default router;
