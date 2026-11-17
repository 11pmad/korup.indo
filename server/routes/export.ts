import { Router } from 'express';
import { db, schema } from '../db/index.js';
import { eq, desc } from 'drizzle-orm';

const router = Router();

// Helper to prevent CSV Formula Injection (CWE-1236 / OWASP)
function sanitizeCsvCell(val: any): string {
  if (val === null || val === undefined) return '""';
  let str = String(val);
  // Prepend single quote if value begins with formula characters
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }
  return `"${str.replace(/"/g, '""')}"`;
}

// GET /api/export/catalog - Metadata & Katalog Dataset Terbuka LKI
router.get('/catalog', async (req, res) => {
  try {
    const casesCount = (await db.select().from(schema.cases)).length;
    const officialsCount = (await db.select().from(schema.officials)).length;
    const provincesCount = (await db.select().from(schema.provinces)).length;
    const partiesCount = (await db.select().from(schema.parties)).length;
    const sourcesCount = (await db.select().from(schema.caseDocuments)).length || 47;

    return res.json({
      portal_name: 'Liga Korupsi Indonesia (LKI) Open Data Portal',
      description: 'Pusat repositori dan dataset terbuka transparansi perkara korupsi Indonesia berbasis putusan pengadilan berkekuatan hukum tetap (inkrah) dan rujukan penegak hukum resmi.',
      license: 'Creative Commons Attribution 4.0 International (CC-BY 4.0)',
      attribution_text: 'Sumber: Liga Korupsi Indonesia (LKI) — Direktori Putusan Mahkamah Agung RI & KPK.go.id',
      last_updated: new Date().toISOString(),
      datasets: [
        {
          id: 'cases',
          title: 'Basis Data Perkara Tindak Pidana Korupsi Indonesia',
          description: 'Daftar perkara korupsi nasional dan daerah, sektor penyalahgunaan, nilai kerugian keuangan negara, nomor perkara resmi pengadilan, serta era pemerintahan.',
          total_records: casesCount,
          formats: ['CSV', 'JSON'],
          download_url_csv: '/api/export?type=cases&format=csv',
          download_url_json: '/api/export?type=cases&format=json'
        },
        {
          id: 'officials',
          title: 'Basis Data Profil Pejabat & Terdakwa Kasus Korupsi',
          description: 'Profil nama pejabat publik, jabatan terakhir, asal provinsi, afiliasi partai politik, total akumulasi kerugian negara, dan status hukum peradilan.',
          total_records: officialsCount,
          formats: ['CSV', 'JSON'],
          download_url_csv: '/api/export?type=officials&format=csv',
          download_url_json: '/api/export?type=officials&format=json'
        },
        {
          id: 'provinces',
          title: 'Agregasi Klasemen Kerugian Negara per 38 Provinsi',
          description: 'Peringkat dan nilai akumulasi kerugian keuangan negara di 38 provinsi Indonesia, kluster pulau, dan jumlah total perkara terpetakan.',
          total_records: provincesCount,
          formats: ['CSV', 'JSON'],
          download_url_csv: '/api/export?type=provinces&format=csv',
          download_url_json: '/api/export?type=provinces&format=json'
        },
        {
          id: 'parties',
          title: 'Statistik Afiliasi Partai Politik Terkait Kasus Korupsi',
          description: 'Agregasi akumulasi kerugian keuangan negara dan jumlah kasus yang melibatkan kader partai politik di Indonesia.',
          total_records: partiesCount,
          formats: ['CSV', 'JSON'],
          download_url_csv: '/api/export?type=parties&format=csv',
          download_url_json: '/api/export?type=parties&format=json'
        }
      ],
      official_sources: [
        {
          institution: 'Mahkamah Agung Republik Indonesia',
          url: 'https://putusan3.mahkamahagung.go.id',
          coverage: 'Putusan Inkrah PN Tipikor, Pengadilan Tinggi, Kasasi, dan Peninjauan Kembali (PK)'
        },
        {
          institution: 'Komisi Pemberantasan Korupsi (KPK RI)',
          url: 'https://www.kpk.go.id/statistik',
          coverage: 'Statistik Resmi Penyelidikan, Penyidikan, Penuntutan, dan LHKPN'
        },
        {
          institution: 'Kejaksaan Agung Republik Indonesia (Jampidsus)',
          url: 'https://www.kejaksaan.go.id',
          coverage: 'Rilis Penanganan Perkara Mega Korupsi dan Pemulihan Aset Negara'
        },
        {
          institution: 'Badan Pemeriksa Keuangan (BPK RI)',
          url: 'https://www.bpk.go.id/ihps',
          coverage: 'Ikhtisar Hasil Pemeriksaan Semester (IHPS) dan Temuan Kerugian Negara'
        },
        {
          institution: 'Indonesia Corruption Watch (ICW) & LKPP',
          url: 'https://opentender.net',
          coverage: 'Skor Indeks Risiko Fraud Tender Pengadaan Barang/Jasa Pemerintah'
        }
      ]
    });
  } catch (err: any) {
    console.error('Error fetching export catalog:', err);
    return res.status(500).json({ error: 'Gagal memuat katalog open data.' });
  }
});

// GET /api/export ?type=cases|officials|parties|provinces&format=csv|json
router.get('/', async (req, res) => {
  try {
    const { type = 'officials', format = 'csv' } = req.query;
    const isJson = String(format).toLowerCase() === 'json';
    const dateStr = new Date().toISOString().split('T')[0];

    // ==========================================
    // 1. DATASET: CASES (PERKARA KORUPSI)
    // ==========================================
    if (type === 'cases') {
      const caseList = await db
        .select({
          id: schema.cases.id,
          title: schema.cases.title,
          court_decision_number: schema.cases.court_decision_number,
          sector_category: schema.cases.sector_category,
          loss_amount: schema.cases.loss_amount,
          fine_amount: schema.cases.fine_amount,
          restitution_amount: schema.cases.restitution_amount,
          prison_sentence_months: schema.cases.prison_sentence_months,
          legal_status: schema.cases.legal_status,
          province_name: schema.provinces.name,
          era_name: schema.presidentialEras.name,
          official_name: schema.officials.full_name,
          charges_articles: schema.cases.charges_articles,
          source_url: schema.cases.source_url,
          case_date: schema.cases.case_date,
          chronology: schema.cases.chronology
        })
        .from(schema.cases)
        .leftJoin(schema.provinces, eq(schema.cases.province_id, schema.provinces.id))
        .leftJoin(schema.presidentialEras, eq(schema.cases.era_id, schema.presidentialEras.id))
        .leftJoin(schema.officials, eq(schema.cases.primary_official_id, schema.officials.id))
        .orderBy(desc(schema.cases.loss_amount));

      if (isJson) {
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="lki-cases-${dateStr}.json"`);
        return res.json({
          dataset: 'lki_corruption_cases',
          exported_at: new Date().toISOString(),
          license: 'CC-BY-4.0',
          total_records: caseList.length,
          data: caseList
        });
      }

      const headers = [
        'Peringkat',
        'Judul Perkara Korupsi',
        'Nomor Putusan Pengadilan',
        'Sektor Perkara',
        'Kerugian Negara (IDR)',
        'Denda (IDR)',
        'Uang Pengganti (IDR)',
        'Vonis Penjara (Bulan)',
        'Status Hukum',
        'Provinsi / Wilayah',
        'Era Pemerintahan',
        'Terdakwa / Pejabat Terkait',
        'Pasal Dakwaan',
        'Tautan Sumber Putusan',
        'Tanggal Kejadian',
        'Kronologi Singkat'
      ];

      const rows = caseList.map((c, idx) => [
        idx + 1,
        sanitizeCsvCell(c.title),
        sanitizeCsvCell(c.court_decision_number || 'Dalam Proses / Rilis Resmi'),
        sanitizeCsvCell(c.sector_category),
        c.loss_amount,
        c.fine_amount,
        c.restitution_amount,
        c.prison_sentence_months,
        sanitizeCsvCell(c.legal_status),
        sanitizeCsvCell(c.province_name || 'Nasional'),
        sanitizeCsvCell(c.era_name || '-'),
        sanitizeCsvCell(c.official_name || 'Korporasi / Rekanan'),
        sanitizeCsvCell(c.charges_articles || '-'),
        sanitizeCsvCell(c.source_url),
        sanitizeCsvCell(c.case_date ? new Date(c.case_date).toISOString().split('T')[0] : '-'),
        sanitizeCsvCell(c.chronology || '-')
      ]);

      const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="lki-cases-${dateStr}.csv"`);
      return res.status(200).send(csvContent);
    }

    // ==========================================
    // 2. DATASET: PARTIES
    // ==========================================
    if (type === 'parties') {
      const partyList = await db.select().from(schema.parties).orderBy(desc(schema.parties.total_loss_amount));

      if (isJson) {
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="lki-parties-${dateStr}.json"`);
        return res.json({
          dataset: 'lki_political_parties',
          exported_at: new Date().toISOString(),
          license: 'CC-BY-4.0',
          total_records: partyList.length,
          data: partyList
        });
      }

      const headers = ['Peringkat', 'Nama Partai', 'Total Kerugian Negara (IDR)', 'Jumlah Kasus'];
      const rows = partyList.map((p, idx) => [
        idx + 1,
        sanitizeCsvCell(p.name),
        p.total_loss_amount,
        p.total_cases
      ]);
      const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="lki-parties-${dateStr}.csv"`);
      return res.status(200).send(csvContent);
    }

    // ==========================================
    // 3. DATASET: PROVINCES
    // ==========================================
    if (type === 'provinces') {
      const provList = await db.select().from(schema.provinces).orderBy(desc(schema.provinces.total_loss_amount));

      if (isJson) {
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="lki-provinces-${dateStr}.json"`);
        return res.json({
          dataset: 'lki_provinces_standings',
          exported_at: new Date().toISOString(),
          license: 'CC-BY-4.0',
          total_records: provList.length,
          data: provList
        });
      }

      const headers = ['Peringkat', 'Provinsi', 'Kluster Pulau', 'Total Kerugian Negara (IDR)', 'Jumlah Kasus'];
      const rows = provList.map((p, idx) => [
        idx + 1,
        sanitizeCsvCell(p.name),
        sanitizeCsvCell(p.island_cluster),
        p.total_loss_amount,
        p.total_cases
      ]);
      const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="lki-provinces-${dateStr}.csv"`);
      return res.status(200).send(csvContent);
    }

    // ==========================================
    // 4. DATASET: OFFICIALS (DEFAULT)
    // ==========================================
    const officialList = await db
      .select({
        id: schema.officials.id,
        full_name: schema.officials.full_name,
        position: schema.officials.position_title,
        province_name: schema.provinces.name,
        party_name: schema.parties.name,
        loss: schema.officials.total_loss_amount,
        status: schema.officials.current_legal_status
      })
      .from(schema.officials)
      .leftJoin(schema.provinces, eq(schema.officials.province_id, schema.provinces.id))
      .leftJoin(schema.parties, eq(schema.officials.party_id, schema.parties.id))
      .orderBy(desc(schema.officials.total_loss_amount));

    if (isJson) {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="lki-officials-${dateStr}.json"`);
      return res.json({
        dataset: 'lki_officials',
        exported_at: new Date().toISOString(),
        license: 'CC-BY-4.0',
        total_records: officialList.length,
        data: officialList
      });
    }

    const headers = ['Peringkat', 'Nama Pejabat', 'Jabatan Terakhir', 'Provinsi', 'Partai Politik', 'Kerugian Negara (IDR)', 'Status Hukum'];
    const rows = officialList.map((o, idx) => [
      idx + 1,
      sanitizeCsvCell(o.full_name),
      sanitizeCsvCell(o.position || ''),
      sanitizeCsvCell(o.province_name || ''),
      sanitizeCsvCell(o.party_name || 'Non-Partai'),
      o.loss,
      sanitizeCsvCell(o.status)
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="lki-officials-${dateStr}.csv"`);
    res.status(200).send(csvContent);
  } catch (err: any) {
    console.error('Error in /api/export:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
