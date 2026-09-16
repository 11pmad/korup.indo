import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { db } from './server/db.js';
import { processAdminCommand, AiChatMessage } from './server/gemini.js';

const app = express();
const PORT = 3000;

app.use(express.json());

// API Routes

// 1. List cases with filtering & pagination
app.get('/api/cases', (req, res) => {
  try {
    const {
      provinsi,
      kota,
      partai,
      tahun,
      status_hukum,
      search,
      sort_by,
      order,
      page,
      limit
    } = req.query;

    const result = db.getCases({
      provinsi: provinsi ? String(provinsi) : undefined,
      kota: kota ? String(kota) : undefined,
      partai: partai ? String(partai) : undefined,
      tahun: tahun ? parseInt(String(tahun), 10) : undefined,
      status_hukum: status_hukum ? String(status_hukum) : undefined,
      search: search ? String(search) : undefined,
      sort_by: (sort_by as any) || 'kerugian',
      order: (order as any) || 'desc',
      page: page ? parseInt(String(page), 10) : 1,
      limit: limit ? parseInt(String(limit), 10) : 50
    });

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Case detail
app.get('/api/cases/:id', (req, res) => {
  try {
    const found = db.getCaseById(req.params.id);
    if (!found) {
      return res.status(404).json({ error: 'Kasus tidak ditemukan' });
    }
    res.json(found);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Official profile + case history
app.get('/api/officials/:id', (req, res) => {
  try {
    const found = db.getOfficialById(req.params.id);
    if (!found) {
      return res.status(404).json({ error: 'Data pejabat tidak ditemukan' });
    }
    res.json(found);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Regional summary for interactive choropleth map
app.get('/api/regions/summary', (req, res) => {
  try {
    const summary = db.getRegionsSummary();
    res.json(summary);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Leaderboard (klasemen liga)
app.get('/api/leaderboard', (req, res) => {
  try {
    const { provinsi, partai, tahun, status_hukum, sort_by } = req.query;
    const leaderboard = db.getLeaderboard({
      provinsi: provinsi ? String(provinsi) : undefined,
      partai: partai ? String(partai) : undefined,
      tahun: tahun ? parseInt(String(tahun), 10) : undefined,
      status_hukum: status_hukum ? String(status_hukum) : undefined,
      sort_by: (sort_by as any) || 'kerugian'
    });
    res.json(leaderboard);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Stats overview & Hall of Shame
app.get('/api/stats/overview', (req, res) => {
  try {
    const overview = db.getStatsOverview();
    res.json(overview);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 7. Public user error report submission
app.post('/api/reports', (req, res) => {
  try {
    const { case_id, deskripsi_kesalahan, email_pelapor } = req.body;
    if (!case_id || !deskripsi_kesalahan) {
      return res.status(400).json({ error: 'case_id dan deskripsi_kesalahan wajib disertakan' });
    }
    const report = db.addReport({
      case_id,
      deskripsi_kesalahan,
      email_pelapor
    });
    res.status(201).json({
      message: 'Laporan kesalahan berhasil dikirim dan masuk ke antrean moderasi admin.',
      report
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 8. Admin AI Command with multi-turn clarifying questions
app.post('/api/admin/ai-command', async (req, res) => {
  try {
    const { command, history = [] } = req.body;
    if (!command) {
      return res.status(400).json({ error: 'Teks perintah wajib disertakan' });
    }

    const aiResult = await processAdminCommand(command, history as AiChatMessage[]);

    // Save as audit log in pending state
    const savedLog = db.addAuditLog({
      admin_id: 'admin_petugas',
      perintah_asli: command,
      riwayat_klarifikasi: [
        ...(history as any[]),
        { role: 'admin', text: command, timestamp: new Date().toISOString() },
        { role: 'ai', text: aiResult.message, timestamp: new Date().toISOString() }
      ],
      hasil_ai: aiResult.is_draft_ready ? (aiResult.draft as any) : null,
      status: 'pending'
    });

    res.json({
      log_id: savedLog.id,
      ...aiResult
    });
  } catch (err: any) {
    console.error('Error in /api/admin/ai-command:', err);
    res.status(500).json({ error: err.message });
  }
});

// 9. Admin confirms draft -> publishes to public cases
app.post('/api/admin/cases/confirm', (req, res) => {
  try {
    const { log_id, catatan_admin } = req.body;
    if (!log_id) {
      return res.status(400).json({ error: 'log_id wajib disertakan untuk konfirmasi' });
    }

    const result = db.confirmDraft(log_id, catatan_admin);
    res.json({
      message: 'Data kasus korupsi berhasil diverifikasi dan dipublikasikan ke database resmi!',
      case_id: result.case_id,
      official_id: result.official_id
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// 10. Admin audit logs
app.get('/api/admin/audit-logs', (req, res) => {
  try {
    const logs = db.getAuditLogs();
    res.json(logs);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 11. Admin rollback
app.post('/api/admin/rollback/:log_id', (req, res) => {
  try {
    const success = db.rollback(req.params.log_id);
    if (!success) {
      return res.status(400).json({ error: 'Gagal melakukan rollback: data tidak ditemukan atau belum pernah dikonfirmasi' });
    }
    res.json({ message: 'Rollback berhasil. Data kasus telah ditarik dari database publik.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 12. Admin reports moderation list
app.get('/api/admin/reports', (req, res) => {
  try {
    res.json(db.getReports());
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/reports/:id/action', (req, res) => {
  try {
    const { action } = req.body; // 'disetujui' | 'ditolak'
    if (action !== 'disetujui' && action !== 'ditolak') {
      return res.status(400).json({ error: 'Aksi harus berupa disetujui atau ditolak' });
    }
    const ok = db.updateReportStatus(req.params.id, action);
    if (!ok) return res.status(404).json({ error: 'Laporan tidak ditemukan' });
    res.json({ message: `Status laporan berhasil diperbarui menjadi ${action}` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 13. SEO Sitemap & Robots.txt
app.get('/robots.txt', (req, res) => {
  res.type('text/plain');
  res.send(`User-agent: *
Allow: /
Disallow: /admin
Sitemap: ${req.protocol}://${req.get('host')}/sitemap.xml
`);
});

app.get('/sitemap.xml', (req, res) => {
  const host = `${req.protocol}://${req.get('host')}`;
  const casesData = db.getCases({ limit: 100 });
  const casesUrls = casesData.cases.map(c => `
  <url>
    <loc>${host}/kasus/${c.id}</loc>
    <lastmod>${c.created_at.split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`).join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${host}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${host}/peta</loc>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${host}/klasemen</loc>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${host}/statistik</loc>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  ${casesUrls}
</urlset>`;

  res.type('application/xml');
  res.send(xml);
});

// Vite middleware setup
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server Peta Korupsi running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
