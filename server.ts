import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
dotenv.config();

import officialsRouter from './server/routes/officials.js';
import partiesRouter from './server/routes/parties.js';
import provincesRouter from './server/routes/provinces.js';
import casesRouter from './server/routes/cases.js';
import companiesRouter from './server/routes/companies.js';
import statsRouter from './server/routes/stats.js';
import exportRouter from './server/routes/export.js';
import reportsRouter from './server/routes/reports.js';
import adminRouter from './server/routes/admin.js';
import erasRouter from './server/routes/eras.js';

import { db, schema } from './server/db/index.js';
import { eq, desc, sql } from 'drizzle-orm';
import { generalApiLimiter } from './server/middleware/rateLimit.js';

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// General rate limiter for API routes
app.use('/api/', generalApiLimiter);

// 1. Mount modular routes
app.use('/api/officials', officialsRouter);
app.use('/api/parties', partiesRouter);
app.use('/api/provinces', provincesRouter);
app.use('/api/cases', casesRouter);
app.use('/api/companies', companiesRouter);
app.use('/api/stats', statsRouter);
app.use('/api/export', exportRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/admin', adminRouter);
app.use('/api/eras', erasRouter);

// Public Settings: Announcement / Disclaimer Banner
const DEFAULT_ANNOUNCEMENT = {
  title: '⚖️ PEMBERITAHUAN ASAS HUKUM & SUMBER RESMI:',
  badge: 'Wajib Dibaca',
  main_text: 'Data bersumber dari putusan pengadilan & pemberitaan media yang tercantum. Setiap orang berhak atas asas praduga tak bersalah hingga ada putusan berkekuatan hukum tetap.',
  sub_text: 'Setiap data diverifikasi dengan tautan resmi direktori putusan Mahkamah Agung RI, KPK.go.id, atau media nasional kredibel.',
  is_active: true,
  updated_at: new Date().toISOString(),
  updated_by: 'system'
};

app.get('/api/settings/announcement', (req, res) => {
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

// Public Settings: Donation & Admin QRIS
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

app.get('/api/settings/donation', (req, res) => {
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


// 2. Compatibility Endpoints for existing frontend components


// Backward compatibility: GET /api/regions/summary
app.get('/api/regions/summary', async (req, res) => {
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

// Backward compatibility: GET /api/leaderboard
app.get('/api/leaderboard', async (req, res) => {
  try {
    const list = await db
      .select({
        id: schema.officials.id,
        full_name: schema.officials.full_name,
        position_title: schema.officials.position_title,
        province_name: schema.provinces.name,
        party_name: schema.parties.name,
        total_loss: schema.officials.total_loss_amount,
        current_legal_status: schema.officials.current_legal_status
      })
      .from(schema.officials)
      .leftJoin(schema.provinces, eq(schema.officials.province_id, schema.provinces.id))
      .leftJoin(schema.parties, eq(schema.officials.party_id, schema.parties.id))
      .orderBy(desc(schema.officials.total_loss_amount));

    // Get case IDs per official
    const cases = await db
      .select({
        id: schema.cases.id,
        official_id: schema.cases.primary_official_id,
        case_date: schema.cases.case_date
      })
      .from(schema.cases);

    const casesMap: Record<string, { ids: string[]; latestYear: number }> = {};
    for (const c of cases) {
      if (c.official_id) {
        if (!casesMap[c.official_id]) {
          casesMap[c.official_id] = { ids: [], latestYear: 2024 };
        }
        casesMap[c.official_id].ids.push(c.id);
        if (c.case_date) {
          const y = new Date(c.case_date).getFullYear();
          if (y > casesMap[c.official_id].latestYear) {
            casesMap[c.official_id].latestYear = y;
          }
        }
      }
    }

    const leaderboard = list.map((o, idx) => ({
      rank: idx + 1,
      official_id: o.id,
      nama: o.full_name,
      jabatan: o.position_title,
      partai: o.party_name || 'Non-Partai',
      provinsi: o.province_name || '-',
      total_kasus: casesMap[o.id]?.ids.length || 1,
      total_kerugian_negara: o.total_loss,
      status_hukum_terkini: o.current_legal_status === 'divonis_inkrah'
        ? 'Divonis Inkrah'
        : o.current_legal_status === 'terdakwa'
        ? 'Terdakwa'
        : o.current_legal_status === 'tersangka'
        ? 'Tersangka'
        : 'Bebas/Praperadilan',
      tahun_terkini: casesMap[o.id]?.latestYear || 2024,
      case_ids: casesMap[o.id]?.ids || []
    }));

    res.json(leaderboard);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 3. SEO Sitemap & Robots.txt
app.get('/robots.txt', (req, res) => {
  res.type('text/plain');
  res.send(`User-agent: *
Allow: /
Disallow: /admin
Sitemap: ${req.protocol}://${req.get('host')}/sitemap.xml
`);
});

app.get('/sitemap.xml', async (req, res) => {
  try {
    const host = `${req.protocol}://${req.get('host')}`;
    const allCases = await db.select({ id: schema.cases.id, updated_at: schema.cases.updated_at }).from(schema.cases);
    const casesUrls = allCases
      .map(
        c => `
  <url>
    <loc>${host}/kasus/${c.id}</loc>
    <lastmod>${c.updated_at ? new Date(c.updated_at).toISOString().split('T')[0] : '2025-01-01'}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`
      )
      .join('');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${host}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${host}/klasemen</loc>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${host}/peta</loc>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${host}/statistik</loc>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${host}/cari</loc>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${host}/lapor</loc>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  ${casesUrls}
</urlset>`;

    res.type('application/xml');
    res.send(xml);
  } catch (err) {
    res.status(500).send('Error generating sitemap');
  }
});

// 4. Vite & Static Asset Handling
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
    console.log(`🏛️ Server Liga Korupsi Indonesia (LKI) aktif di http://0.0.0.0:${PORT}`);
  });
}

startServer();
