import {
  CorruptionCase,
  Official,
  Company,
  AuditLog,
  UserReport,
  RegionSummary,
  LeaderboardItem,
  StatsOverview,
  LegalStatus
} from '../src/types.js';
import {
  INITIAL_OFFICIALS,
  INITIAL_CASES,
  INITIAL_COMPANIES,
  INITIAL_AUDIT_LOGS,
  INITIAL_REPORTS
} from './data.js';

class InMemoryDB {
  private officials: Official[] = [...INITIAL_OFFICIALS];
  private cases: CorruptionCase[] = [...INITIAL_CASES];
  private companies: Company[] = [...INITIAL_COMPANIES];
  private auditLogs: AuditLog[] = [...INITIAL_AUDIT_LOGS];
  private reports: UserReport[] = [...INITIAL_REPORTS];

  // Cases with joined official
  public getCases(filters: {
    provinsi?: string;
    kota?: string;
    partai?: string;
    tahun?: number;
    status_hukum?: string;
    search?: string;
    sort_by?: 'kerugian' | 'tahun' | 'nama';
    order?: 'asc' | 'desc';
    page?: number;
    limit?: number;
  }) {
    let result = this.cases.map(c => {
      const official = this.officials.find(o => o.id === c.official_id);
      return {
        ...c,
        official
      };
    });

    if (filters.provinsi) {
      const provLower = filters.provinsi.toLowerCase();
      result = result.filter(c => c.official?.provinsi.toLowerCase() === provLower);
    }

    if (filters.kota) {
      const kotaLower = filters.kota.toLowerCase();
      result = result.filter(c => c.official?.kota_kabupaten.toLowerCase().includes(kotaLower));
    }

    if (filters.partai) {
      const partaiLower = filters.partai.toLowerCase();
      result = result.filter(c => c.official?.partai.toLowerCase().includes(partaiLower));
    }

    if (filters.tahun) {
      result = result.filter(c => c.tahun_kejadian === filters.tahun || c.tahun_putusan === filters.tahun);
    }

    if (filters.status_hukum) {
      const statusLower = filters.status_hukum.toLowerCase();
      result = result.filter(c => c.status_hukum.toLowerCase() === statusLower);
    }

    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(c => {
        return (
          c.official?.nama.toLowerCase().includes(q) ||
          c.official?.jabatan.toLowerCase().includes(q) ||
          c.official?.partai.toLowerCase().includes(q) ||
          c.official?.provinsi.toLowerCase().includes(q) ||
          c.official?.kota_kabupaten.toLowerCase().includes(q) ||
          c.ringkasan_kasus.toLowerCase().includes(q) ||
          c.jenis_kasus.toLowerCase().includes(q) ||
          (c.perusahaan_terkait && c.perusahaan_terkait.some(comp => comp.toLowerCase().includes(q)))
        );
      });
    }

    // Sort
    const sortField = filters.sort_by || 'kerugian';
    const isAsc = filters.order === 'asc';

    result.sort((a, b) => {
      if (sortField === 'kerugian') {
        return isAsc
          ? a.nilai_kerugian_negara - b.nilai_kerugian_negara
          : b.nilai_kerugian_negara - a.nilai_kerugian_negara;
      }
      if (sortField === 'tahun') {
        const yearA = a.tahun_putusan || a.tahun_kejadian;
        const yearB = b.tahun_putusan || b.tahun_kejadian;
        return isAsc ? yearA - yearB : yearB - yearA;
      }
      if (sortField === 'nama') {
        const nameA = a.official?.nama || '';
        const nameB = b.official?.nama || '';
        return isAsc ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
      }
      return 0;
    });

    const total = result.length;
    const page = Math.max(1, filters.page || 1);
    const limit = Math.max(1, filters.limit || 50);
    const startIndex = (page - 1) * limit;
    const paginated = result.slice(startIndex, startIndex + limit);

    return {
      cases: paginated,
      pagination: {
        total,
        page,
        limit,
        total_pages: Math.ceil(total / limit)
      }
    };
  }

  public getCaseById(id: string) {
    const found = this.cases.find(c => c.id === id);
    if (!found) return null;
    const official = this.officials.find(o => o.id === found.official_id);
    return {
      ...found,
      official
    };
  }

  public getOfficialById(id: string) {
    const official = this.officials.find(o => o.id === id);
    if (!official) return null;
    const cases = this.cases
      .filter(c => c.official_id === id)
      .map(c => ({ ...c, official }));
    return {
      ...official,
      cases
    };
  }

  public getRegionsSummary(): RegionSummary[] {
    const provinceMap: Record<
      string,
      { total_kasus: number; total_kerugian: number; island_group: string }
    > = {};

    const PROVINCE_ISLANDS: Record<string, string> = {
      'Aceh': 'Sumatera',
      'Sumatera Utara': 'Sumatera',
      'Sumatera Barat': 'Sumatera',
      'Riau': 'Sumatera',
      'Kepulauan Riau': 'Sumatera',
      'Jambi': 'Sumatera',
      'Sumatera Selatan': 'Sumatera',
      'Bangka Belitung': 'Sumatera',
      'Bengkulu': 'Sumatera',
      'Lampung': 'Sumatera',
      'DKI Jakarta': 'Jawa',
      'Jawa Barat': 'Jawa',
      'Banten': 'Jawa',
      'Jawa Tengah': 'Jawa',
      'DI Yogyakarta': 'Jawa',
      'Jawa Timur': 'Jawa',
      'Bali': 'Bali & Nusa Tenggara',
      'Nusa Tenggara Barat': 'Bali & Nusa Tenggara',
      'Nusa Tenggara Timur': 'Bali & Nusa Tenggara',
      'Kalimantan Barat': 'Kalimantan',
      'Kalimantan Tengah': 'Kalimantan',
      'Kalimantan Selatan': 'Kalimantan',
      'Kalimantan Timur': 'Kalimantan',
      'Kalimantan Utara': 'Kalimantan',
      'Sulawesi Utara': 'Sulawesi',
      'Gorontalo': 'Sulawesi',
      'Sulawesi Tengah': 'Sulawesi',
      'Sulawesi Barat': 'Sulawesi',
      'Sulawesi Selatan': 'Sulawesi',
      'Sulawesi Tenggara': 'Sulawesi',
      'Maluku': 'Maluku & Papua',
      'Maluku Utara': 'Maluku & Papua',
      'Papua': 'Maluku & Papua',
      'Papua Barat': 'Maluku & Papua',
      'Papua Selatan': 'Maluku & Papua',
      'Papua Tengah': 'Maluku & Papua',
      'Papua Pegunungan': 'Maluku & Papua',
      'Papua Barat Daya': 'Maluku & Papua'
    };

    // Pre-populate all provinces
    Object.keys(PROVINCE_ISLANDS).forEach(prov => {
      provinceMap[prov] = {
        total_kasus: 0,
        total_kerugian: 0,
        island_group: PROVINCE_ISLANDS[prov] || 'Lainnya'
      };
    });

    for (const c of this.cases) {
      const official = this.officials.find(o => o.id === c.official_id);
      if (official && official.provinsi) {
        if (!provinceMap[official.provinsi]) {
          provinceMap[official.provinsi] = {
            total_kasus: 0,
            total_kerugian: 0,
            island_group: PROVINCE_ISLANDS[official.provinsi] || 'Lainnya'
          };
        }
        provinceMap[official.provinsi].total_kasus += 1;
        provinceMap[official.provinsi].total_kerugian += c.nilai_kerugian_negara;
      }
    }

    return Object.entries(provinceMap).map(([provinsi, data]) => ({
      provinsi,
      total_kasus: data.total_kasus,
      total_kerugian: data.total_kerugian,
      island_group: data.island_group
    }));
  }

  public getLeaderboard(filters: {
    provinsi?: string;
    partai?: string;
    tahun?: number;
    status_hukum?: string;
    sort_by?: 'kerugian' | 'kasus';
  }): LeaderboardItem[] {
    const map = new Map<
      string,
      {
        official: Official;
        cases: CorruptionCase[];
        total_kerugian: number;
      }
    >();

    for (const c of this.cases) {
      const official = this.officials.find(o => o.id === c.official_id);
      if (!official) continue;

      if (filters.provinsi && official.provinsi.toLowerCase() !== filters.provinsi.toLowerCase()) {
        continue;
      }
      if (filters.partai && !official.partai.toLowerCase().includes(filters.partai.toLowerCase())) {
        continue;
      }
      if (filters.tahun && c.tahun_kejadian !== filters.tahun && c.tahun_putusan !== filters.tahun) {
        continue;
      }
      if (filters.status_hukum && c.status_hukum.toLowerCase() !== filters.status_hukum.toLowerCase()) {
        continue;
      }

      if (!map.has(official.id)) {
        map.set(official.id, {
          official,
          cases: [],
          total_kerugian: 0
        });
      }

      const item = map.get(official.id)!;
      item.cases.push(c);
      item.total_kerugian += c.nilai_kerugian_negara;
    }

    const items: LeaderboardItem[] = Array.from(map.values()).map(group => {
      // Find latest legal status & year
      const sortedCases = [...group.cases].sort(
        (a, b) => (b.tahun_putusan || b.tahun_kejadian) - (a.tahun_putusan || a.tahun_kejadian)
      );
      const latestCase = sortedCases[0];

      return {
        rank: 0,
        official_id: group.official.id,
        nama: group.official.nama,
        jabatan: group.official.jabatan,
        partai: group.official.partai,
        provinsi: group.official.provinsi,
        total_kasus: group.cases.length,
        total_kerugian_negara: group.total_kerugian,
        status_hukum_terkini: latestCase.status_hukum,
        tahun_terkini: latestCase.tahun_putusan || latestCase.tahun_kejadian,
        case_ids: group.cases.map(c => c.id)
      };
    });

    const sortType = filters.sort_by || 'kerugian';
    if (sortType === 'kasus') {
      items.sort((a, b) => b.total_kasus - a.total_kasus || b.total_kerugian_negara - a.total_kerugian_negara);
    } else {
      items.sort((a, b) => b.total_kerugian_negara - a.total_kerugian_negara || b.total_kasus - a.total_kasus);
    }

    items.forEach((it, idx) => {
      it.rank = idx + 1;
    });

    return items;
  }

  public getStatsOverview(): StatsOverview {
    const verifiedCases = this.cases.filter(c => !c.is_template);
    const total_kasus_nasional = verifiedCases.length;
    const total_kerugian_akumulasi = verifiedCases.reduce((sum, c) => sum + c.nilai_kerugian_negara, 0);

    // Most cases province
    const provCounts: Record<string, { count: number; loss: number }> = {};
    for (const c of verifiedCases) {
      const off = this.officials.find(o => o.id === c.official_id);
      if (off?.provinsi) {
        if (!provCounts[off.provinsi]) {
          provCounts[off.provinsi] = { count: 0, loss: 0 };
        }
        provCounts[off.provinsi].count += 1;
        provCounts[off.provinsi].loss += c.nilai_kerugian_negara;
      }
    }

    let maxProv = 'DKI Jakarta';
    let maxCount = 0;
    let maxLoss = 0;
    for (const [prov, data] of Object.entries(provCounts)) {
      if (data.count > maxCount) {
        maxCount = data.count;
        maxLoss = data.loss;
        maxProv = prov;
      }
    }

    // Top 10 kerugian
    const sortedByLoss = [...verifiedCases]
      .sort((a, b) => b.nilai_kerugian_negara - a.nilai_kerugian_negara)
      .slice(0, 10)
      .map(c => {
        const off = this.officials.find(o => o.id === c.official_id);
        return {
          case_id: c.id,
          nama: off?.nama || 'Anonim',
          jabatan: off?.jabatan || 'Pejabat Publik',
          nilai_kerugian_negara: c.nilai_kerugian_negara,
          status_hukum: c.status_hukum,
          tahun: c.tahun_putusan || c.tahun_kejadian
        };
      });

    // Partai distribution
    const partyStats: Record<string, { count: number; loss: number }> = {};
    const PARTY_COLORS: Record<string, string> = {
      'Partai Golkar': '#F59E0B', // Amber
      'PDI Perjuangan': '#EF4444', // Red
      'Partai NasDem': '#3B82F6', // Blue
      'Partai Gerindra': '#EA580C', // Orange
      'PKB': '#10B981', // Emerald
      'Partai Demokrat': '#0284C7', // Sky
      'PKS': '#F97316', // Orange-yellow
      'PPP': '#059669', // Green
      'PAN': '#2563EB', // Blue
      'Non-Partai': '#6B7280'
    };

    for (const c of verifiedCases) {
      const off = this.officials.find(o => o.id === c.official_id);
      const party = off?.partai || 'Lainnya';
      if (!partyStats[party]) {
        partyStats[party] = { count: 0, loss: 0 };
      }
      partyStats[party].count += 1;
      partyStats[party].loss += c.nilai_kerugian_negara;
    }

    const distribusi_partai = Object.entries(partyStats)
      .map(([partai, data]) => ({
        partai,
        total_kasus: data.count,
        total_kerugian: data.loss,
        color: PARTY_COLORS[partai] || '#8B5CF6'
      }))
      .sort((a, b) => b.total_kerugian - a.total_kerugian);

    // Companies stats
    const compStats: Record<string, { sektor: string; count: number }> = {};
    for (const comp of this.companies) {
      compStats[comp.nama_perusahaan] = {
        sektor: comp.sektor,
        count: comp.kasus_terkait.length
      };
    }
    for (const c of verifiedCases) {
      if (c.perusahaan_terkait) {
        for (const cpName of c.perusahaan_terkait) {
          if (!compStats[cpName]) {
            compStats[cpName] = { sektor: 'Rekanan Swasta', count: 0 };
          }
          compStats[cpName].count += 1;
        }
      }
    }

    const top_perusahaan = Object.entries(compStats)
      .map(([nama_perusahaan, d]) => ({
        nama_perusahaan,
        sektor: d.sektor,
        total_kasus: d.count
      }))
      .sort((a, b) => b.total_kasus - a.total_kasus)
      .slice(0, 5);

    return {
      total_kasus_nasional,
      total_kerugian_akumulasi,
      provinsi_terbanyak: {
        provinsi: maxProv,
        total_kasus: maxCount,
        total_kerugian: maxLoss
      },
      top_kerugian: sortedByLoss,
      distribusi_partai,
      top_perusahaan
    };
  }

  // Reports
  public addReport(data: {
    case_id: string;
    deskripsi_kesalahan: string;
    email_pelapor?: string;
  }): UserReport {
    if (!data.case_id || !data.deskripsi_kesalahan) {
      throw new Error('case_id dan deskripsi_kesalahan wajib diisi!');
    }
    const foundCase = this.cases.find(c => c.id === data.case_id);
    const foundOff = foundCase ? this.officials.find(o => o.id === foundCase.official_id) : null;
    const caseTitle = foundOff ? `${foundOff.nama} (${foundOff.jabatan})` : data.case_id;

    const newReport: UserReport = {
      id: `rep-${Date.now()}`,
      case_id: data.case_id,
      case_title: caseTitle,
      deskripsi_kesalahan: data.deskripsi_kesalahan,
      email_pelapor: data.email_pelapor || '',
      status: 'menunggu_review',
      created_at: new Date().toISOString()
    };
    this.reports.unshift(newReport);
    return newReport;
  }

  public getReports(): UserReport[] {
    return this.reports;
  }

  public updateReportStatus(id: string, status: 'disetujui' | 'ditolak'): boolean {
    const report = this.reports.find(r => r.id === id);
    if (!report) return false;
    report.status = status;
    return true;
  }

  // Audit Logs & AI Confirmation
  public addAuditLog(log: Omit<AuditLog, 'id' | 'timestamp'>): AuditLog {
    const newLog: AuditLog = {
      ...log,
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString()
    };
    this.auditLogs.unshift(newLog);
    return newLog;
  }

  public getAuditLogs(): AuditLog[] {
    return this.auditLogs;
  }

  public confirmDraft(logId: string, notes?: string): { case_id: string; official_id: string } {
    const log = this.auditLogs.find(l => l.id === logId);
    if (!log) {
      throw new Error(`Audit log dengan ID ${logId} tidak ditemukan.`);
    }
    if (log.status === 'disetujui' && log.created_case_id) {
      return { case_id: log.created_case_id, official_id: '' };
    }
    if (!log.hasil_ai) {
      throw new Error('Tidak ada draft hasil AI yang siap dikonfirmasi.');
    }

    const { official: offData, corruption_case: caseData, sources: srcData, companies } = log.hasil_ai;

    // Validation: AT LEAST 1 SOURCE
    if (!srcData || srcData.length === 0 || !srcData[0].url) {
      throw new Error('Validasi gagal: Setiap kasus HARUS memiliki minimal 1 sumber berita/hukum (URL) valid!');
    }

    // Validation: status_hukum
    const validStatuses: LegalStatus[] = ['Tersangka', 'Terdakwa', 'Divonis Inkrah', 'Bebas/Praperadilan'];
    if (!validStatuses.includes(caseData.status_hukum as LegalStatus)) {
      throw new Error(`Status hukum tidak valid: ${caseData.status_hukum}. Harus salah satu dari: ${validStatuses.join(', ')}`);
    }

    // Find or create official
    let existingOff = this.officials.find(
      o => o.nama.toLowerCase() === offData.nama.toLowerCase() && o.provinsi.toLowerCase() === offData.provinsi.toLowerCase()
    );

    let officialId = existingOff?.id;
    if (!existingOff) {
      officialId = `off-${Date.now()}`;
      const newOfficial: Official = {
        id: officialId,
        nama: offData.nama,
        jabatan: offData.jabatan || 'Pejabat Publik',
        partai: offData.partai || 'Non-Partai',
        provinsi: offData.provinsi,
        kota_kabupaten: offData.kota_kabupaten || offData.provinsi,
        daerah_pemilihan: offData.daerah_pemilihan || offData.provinsi,
        foto_url: offData.foto_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80'
      };
      this.officials.unshift(newOfficial);
    }

    const caseId = `case-${Date.now()}`;
    const newCase: CorruptionCase = {
      id: caseId,
      official_id: officialId!,
      ringkasan_kasus: caseData.ringkasan_kasus,
      nilai_kerugian_negara: Number(caseData.nilai_kerugian_negara) || 0,
      tahun_kejadian: Number(caseData.tahun_kejadian) || new Date().getFullYear(),
      tahun_putusan: caseData.tahun_putusan ? Number(caseData.tahun_putusan) : null,
      status_hukum: caseData.status_hukum as LegalStatus,
      jenis_kasus: caseData.jenis_kasus || 'Tindak Pidana Korupsi',
      perusahaan_terkait: companies || [],
      is_verified: true,
      is_template: false,
      created_at: new Date().toISOString(),
      sources: srcData.map((s, idx) => ({
        id: `src-${caseId}-${idx + 1}`,
        case_id: caseId,
        nama_media: s.nama_media || 'Sumber Terverifikasi',
        url: s.url,
        tanggal_publikasi: s.tanggal_publikasi || new Date().toISOString().split('T')[0]
      }))
    };

    this.cases.unshift(newCase);

    log.status = 'disetujui';
    log.created_case_id = caseId;
    if (notes) log.catatan_admin = notes;

    return { case_id: caseId, official_id: officialId! };
  }

  public rollback(logId: string): boolean {
    const log = this.auditLogs.find(l => l.id === logId);
    if (!log || !log.created_case_id) return false;

    const caseIndex = this.cases.findIndex(c => c.id === log.created_case_id);
    if (caseIndex !== -1) {
      this.cases.splice(caseIndex, 1);
    }
    log.status = 'ditolak';
    log.catatan_admin = `Di-rollback oleh admin pada ${new Date().toLocaleString('id-ID')}`;
    return true;
  }
}

export const db = new InMemoryDB();
