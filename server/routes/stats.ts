import { Router } from 'express';
import { db, schema } from '../db/index.js';
import { eq, desc, sql } from 'drizzle-orm';

const router = Router();

// GET /api/stats/trends ?metric=combined|loss_only|cases_only
router.get('/trends', async (req, res) => {
  try {
    const { metric = 'combined' } = req.query;

    const cases = await db
      .select({
        date: schema.cases.case_date,
        loss: schema.cases.loss_amount
      })
      .from(schema.cases);

    const yearStats: Record<number, { year: number; totalLoss: number; totalCases: number }> = {};

    for (let yr = 2011; yr <= 2025; yr++) {
      yearStats[yr] = { year: yr, totalLoss: 0, totalCases: 0 };
    }

    for (const c of cases) {
      if (c.date) {
        const yr = new Date(c.date).getFullYear();
        if (!yearStats[yr]) {
          yearStats[yr] = { year: yr, totalLoss: 0, totalCases: 0 };
        }
        yearStats[yr].totalLoss += c.loss;
        yearStats[yr].totalCases += 1;
      }
    }

    const trendData = Object.values(yearStats).sort((a, b) => a.year - b.year);

    if (metric === 'loss_only') {
      return res.json(trendData.map(t => ({ tahun: t.year, nilai_kerugian: t.totalLoss })));
    }
    if (metric === 'cases_only') {
      return res.json(trendData.map(t => ({ tahun: t.year, jumlah_kasus: t.totalCases })));
    }

    res.json(
      trendData.map(t => ({
        tahun: t.year,
        nilai_kerugian: t.totalLoss,
        jumlah_kasus: t.totalCases,
        label_kerugian: `Rp ${(t.totalLoss / 1e12).toFixed(1)} T`
      }))
    );
  } catch (err: any) {
    console.error('Error in /api/stats/trends:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/stats/sectors (komposisi untuk grafik donat)
router.get('/sectors', async (req, res) => {
  try {
    const sectorAgg = await db
      .select({
        sector: schema.cases.sector_category,
        total_loss: sql<number>`sum(${schema.cases.loss_amount})::double precision`,
        total_cases: sql<number>`count(*)::int`
      })
      .from(schema.cases)
      .groupBy(schema.cases.sector_category);

    const sectorLabels: Record<string, { label: string; color: string }> = {
      perizinan_sda_tambang: { label: 'Perizinan SDA & Tambang', color: '#B91C1C' },
      pengadaan_barang_jasa: { label: 'Pengadaan Barang & Jasa', color: '#EA580C' },
      mafia_peradilan: { label: 'Mafia Keuangan & BUMN', color: '#D97706' },
      suap_gratifikasi: { label: 'Suap & Gratifikasi Jabatan', color: '#CA8A04' },
      bansos_bencana: { label: 'Bansos & Bencana Alam', color: '#E11D48' }
    };

    const formatted = sectorAgg.map(s => {
      const conf = sectorLabels[s.sector] || { label: s.sector.replace(/_/g, ' '), color: '#78716C' };
      return {
        sector: s.sector,
        label: conf.label,
        total_loss: s.total_loss || 0,
        total_cases: s.total_cases || 0,
        color: conf.color
      };
    });

    res.json(formatted);
  } catch (err: any) {
    console.error('Error in /api/stats/sectors:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/stats/hall-of-shame (top 10 kasus kerugian terbesar)
router.get('/hall-of-shame', async (req, res) => {
  try {
    const topCases = await db
      .select({
        id: schema.cases.id,
        title: schema.cases.title,
        loss_amount: schema.cases.loss_amount,
        legal_status: schema.cases.legal_status,
        prison_sentence_months: schema.cases.prison_sentence_months,
        case_date: schema.cases.case_date,
        official_name: schema.officials.full_name,
        official_position: schema.officials.position_title,
        official_photo: schema.officials.photo_url,
        province_name: schema.provinces.name,
        party_name: schema.parties.name
      })
      .from(schema.cases)
      .leftJoin(schema.officials, eq(schema.cases.primary_official_id, schema.officials.id))
      .leftJoin(schema.provinces, eq(schema.cases.province_id, schema.provinces.id))
      .leftJoin(schema.parties, eq(schema.officials.party_id, schema.parties.id))
      .orderBy(desc(schema.cases.loss_amount))
      .limit(10);

    const formatted = topCases.map((c, idx) => ({
      rank: idx + 1,
      case_id: c.id,
      title: c.title,
      nama: c.official_name || 'Tidak Diketahui',
      jabatan: c.official_position || '-',
      partai: c.party_name || 'Non-Partai',
      provinsi: c.province_name || '-',
      nilai_kerugian_negara: c.loss_amount,
      status_hukum: c.legal_status === 'divonis_inkrah'
        ? 'Divonis Inkrah'
        : c.legal_status === 'terdakwa'
        ? 'Terdakwa'
        : 'Tersangka',
      vonis_penjara: c.prison_sentence_months ? `${Math.floor(c.prison_sentence_months / 12)} Tahun` : 'Seumur Hidup / Belum Vonis',
      tahun: c.case_date ? new Date(c.case_date).getFullYear() : 2024,
      foto_url: c.official_photo
    }));

    res.json(formatted);
  } catch (err: any) {
    console.error('Error in /api/stats/hall-of-shame:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/stats/overview (compatibility endpoint)
router.get('/overview', async (req, res) => {
  try {
    const totalCasesCount = await db.select({ count: sql<number>`count(*)::int` }).from(schema.cases);
    const totalLossSum = await db.select({ sum: sql<number>`sum(${schema.cases.loss_amount})::double precision` }).from(schema.cases);
    const totalOfficialsCount = await db.select({ count: sql<number>`count(*)::int` }).from(schema.officials);

    const topProvince = await db
      .select()
      .from(schema.provinces)
      .orderBy(desc(schema.provinces.total_loss_amount))
      .limit(1);

    const topCases = await db
      .select({
        case_id: schema.cases.id,
        nama: schema.officials.full_name,
        jabatan: schema.officials.position_title,
        nilai_kerugian_negara: schema.cases.loss_amount,
        legal_status: schema.cases.legal_status,
        case_date: schema.cases.case_date
      })
      .from(schema.cases)
      .leftJoin(schema.officials, eq(schema.cases.primary_official_id, schema.officials.id))
      .orderBy(desc(schema.cases.loss_amount))
      .limit(5);

    const partyDist = await db
      .select({
        partai: schema.parties.name,
        total_kasus: schema.parties.total_cases,
        total_kerugian: schema.parties.total_loss_amount
      })
      .from(schema.parties)
      .where(sql`${schema.parties.total_loss_amount} > 0`)
      .orderBy(desc(schema.parties.total_loss_amount));

    const partyColors: Record<string, string> = {
      'PDI Perjuangan': '#DC2626',
      'Partai Golkar': '#EAB308',
      'Partai Gerindra': '#EA580C',
      'Partai NasDem': '#1E3A8A',
      'Partai Demokrat': '#2563EB',
      'Partai Keadilan Sejahtera (PKS)': '#D97706',
      'Non-Partai / Independen / Birokrat': '#78716C'
    };

    const companies = await db
      .select({
        nama_perusahaan: schema.companies.name,
        sektor: schema.companies.sector
      })
      .from(schema.companies)
      .limit(5);

    res.json({
      total_kasus_nasional: totalCasesCount[0]?.count || 0,
      total_kasus: totalCasesCount[0]?.count || 0,
      total_kerugian_akumulasi: totalLossSum[0]?.sum || 0,
      total_kerugian_negara: totalLossSum[0]?.sum || 0,
      total_kerugian: totalLossSum[0]?.sum || 0,
      total_pejabat: totalOfficialsCount[0]?.count || 0,
      total_pejabat_terdata: totalOfficialsCount[0]?.count || 0,
      provinsi_terbanyak: topProvince[0]
        ? {
            provinsi: topProvince[0].name,
            total_kasus: topProvince[0].total_cases,
            total_kerugian: topProvince[0].total_loss_amount
          }
        : { provinsi: '-', total_kasus: 0, total_kerugian: 0 },
      top_kerugian: topCases.map(c => ({
        case_id: c.case_id,
        nama: c.nama || 'Tidak Diketahui',
        jabatan: c.jabatan || '-',
        nilai_kerugian_negara: c.nilai_kerugian_negara,
        status_hukum: c.legal_status === 'divonis_inkrah' ? 'Divonis Inkrah' : 'Tersangka',
        tahun: c.case_date ? new Date(c.case_date).getFullYear() : 2024
      })),
      distribusi_partai: partyDist.map(p => ({
        partai: p.partai,
        total_kasus: p.total_kasus,
        total_kerugian: p.total_kerugian,
        color: partyColors[p.partai] || '#9CA3AF'
      })),
      top_perusahaan: companies.map(c => ({
        ...c,
        total_kasus: 1
      }))
    });
  } catch (err: any) {
    console.error('Error in /api/stats/overview:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
