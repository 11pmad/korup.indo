import { Router } from 'express';
import { db, schema } from '../db/index.js';
import { eq, desc } from 'drizzle-orm';

const router = Router();

// GET /api/export ?type=officials|parties|provinces&filters...
router.get('/', async (req, res) => {
  try {
    const { type = 'officials', era, province, party, status } = req.query;

    let filename = `lki-${type}-${new Date().toISOString().split('T')[0]}.csv`;
    let csvContent = '';

    if (type === 'parties') {
      const partyList = await db.select().from(schema.parties).orderBy(desc(schema.parties.total_loss_amount));
      const headers = ['Peringkat', 'Nama Partai', 'Total Kerugian Negara (IDR)', 'Jumlah Kasus'];
      const rows = partyList.map((p, idx) => [
        idx + 1,
        `"${p.name.replace(/"/g, '""')}"`,
        p.total_loss_amount,
        p.total_cases
      ]);
      csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    } else if (type === 'provinces') {
      const provList = await db.select().from(schema.provinces).orderBy(desc(schema.provinces.total_loss_amount));
      const headers = ['Peringkat', 'Provinsi', 'Kluster Pulau', 'Total Kerugian Negara (IDR)', 'Jumlah Kasus'];
      const rows = provList.map((p, idx) => [
        idx + 1,
        `"${p.name.replace(/"/g, '""')}"`,
        `"${p.island_cluster}"`,
        p.total_loss_amount,
        p.total_cases
      ]);
      csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    } else {
      // Officials (default)
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

      const headers = ['Peringkat', 'Nama Pejabat', 'Jabatan Terakhir', 'Provinsi', 'Partai Politik', 'Kerugian Negara (IDR)', 'Status Hukum'];
      const rows = officialList.map((o, idx) => [
        idx + 1,
        `"${o.full_name.replace(/"/g, '""')}"`,
        `"${(o.position || '').replace(/"/g, '""')}"`,
        `"${(o.province_name || '').replace(/"/g, '""')}"`,
        `"${(o.party_name || 'Non-Partai').replace(/"/g, '""')}"`,
        o.loss,
        `"${o.status}"`
      ]);
      csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    }

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(200).send(csvContent);
  } catch (err: any) {
    console.error('Error in /api/export:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
