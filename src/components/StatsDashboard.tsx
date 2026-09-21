import React, { useState, useMemo } from 'react';
import { StatsOverview, CorruptionCase, LegalStatus } from '../types.js';
import { formatRupiah } from '../utils/formatters.js';
import { sound } from '../utils/audio.js';
import { StatsDrilldownModal, DrilldownTarget } from './StatsDrilldownModal.js';
import { 
  BarChart3, 
  Building2, 
  Flame, 
  FolderKanban, 
  PieChart as PieChartIcon, 
  ShieldCheck, 
  ExternalLink,
  TrendingUp,
  Activity,
  Layers,
  Calendar,
  AlertCircle,
  X,
  Sparkles,
  Search,
  Users,
  ChevronRight,
  Info
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ComposedChart
} from 'recharts';

interface StatsProps {
  stats: StatsOverview;
  cases?: CorruptionCase[];
  onSelectCase: (caseId: string) => void;
}

const SECTOR_ICONS: Record<string, string> = {
  'Pengadaan Barang & Jasa': '🏗️',
  'Bansos & Bencana Alam': '📦',
  'Suap & Gratifikasi Jabatan': '🤝',
  'Perizinan Lahan & SDA': '🌲',
  'Pengelolaan Anggaran Daerah': '🏛️',
  'Mafia Peradilan': '⚖️',
  'Korupsi Lainnya': '💼'
};

export const StatsDashboard: React.FC<StatsProps> = ({ stats, cases = [], onSelectCase }) => {
  // Drill-down Modal State
  const [drilldownTarget, setDrilldownTarget] = useState<DrilldownTarget | null>(null);

  // Time-series Chart metric toggle
  const [timelineMetric, setTimelineMetric] = useState<'loss' | 'cases' | 'combined'>('combined');

  // Donut Chart Metric & Hover State
  const [donutMetric, setDonutMetric] = useState<'loss' | 'count'>('loss');
  const [donutHoverIndex, setDonutHoverIndex] = useState<number | null>(null);

  // Dismissable notice states
  const [noticeDismissed, setNoticeDismissed] = useState<boolean>(false);
  const [corporateNoteDismissed, setCorporateNoteDismissed] = useState<boolean>(false);

  // 1. Process Timeline Data for Line/Area Chart
  const timelineData = useMemo(() => {
    const yearMap: Record<number, { year: number; kerugian: number; total_kasus: number; cases: CorruptionCase[] }> = {};
    
    // Seed standard years 2011-2024
    for (let yr = 2011; yr <= 2024; yr++) {
      yearMap[yr] = { year: yr, kerugian: 0, total_kasus: 0, cases: [] };
    }

    cases.forEach(c => {
      const yr = c.tahun_kejadian || c.tahun_putusan || 2020;
      if (!yearMap[yr]) {
        yearMap[yr] = { year: yr, kerugian: 0, total_kasus: 0, cases: [] };
      }
      yearMap[yr].kerugian += c.nilai_kerugian_negara;
      yearMap[yr].total_kasus += 1;
      yearMap[yr].cases.push(c);
    });

    return Object.values(yearMap).sort((a, b) => a.year - b.year);
  }, [cases]);

  // 2. Process Modus / Category Distribution for Pie/Donut Chart
  const categoryData = useMemo(() => {
    const catMap: Record<string, { name: string; count: number; total_loss: number; cases: CorruptionCase[] }> = {};

    cases.forEach(c => {
      const rawCat = c.jenis_kasus || 'Korupsi Lainnya';
      let normCat = 'Pengadaan Barang & Jasa';
      if (rawCat.toLowerCase().includes('bansos')) {
        normCat = 'Bansos & Bencana Alam';
      } else if (rawCat.toLowerCase().includes('suap') || rawCat.toLowerCase().includes('gratifikasi')) {
        normCat = 'Suap & Gratifikasi Jabatan';
      } else if (rawCat.toLowerCase().includes('izin') || rawCat.toLowerCase().includes('tambang') || rawCat.toLowerCase().includes('lahan')) {
        normCat = 'Perizinan Lahan & SDA';
      } else if (rawCat.toLowerCase().includes('dak') || rawCat.toLowerCase().includes('anggaran') || rawCat.toLowerCase().includes('hibah')) {
        normCat = 'Pengelolaan Anggaran Daerah';
      } else if (rawCat.toLowerCase().includes('peradilan') || rawCat.toLowerCase().includes('suap perkara')) {
        normCat = 'Mafia Peradilan';
      }

      if (!catMap[normCat]) {
        catMap[normCat] = { name: normCat, count: 0, total_loss: 0, cases: [] };
      }
      catMap[normCat].count += 1;
      catMap[normCat].total_loss += c.nilai_kerugian_negara;
      catMap[normCat].cases.push(c);
    });

    const palette = [
      '#EF4444', // Red
      '#EA580C', // Orange
      '#F59E0B', // Amber
      '#0284C7', // Sky
      '#10B981', // Emerald
      '#8B5CF6'  // Purple
    ];

    return Object.values(catMap)
      .sort((a, b) => b.total_loss - a.total_loss)
      .map((item, idx) => ({
        ...item,
        color: palette[idx % palette.length]
      }));
  }, [cases]);

  const totalLossAll = useMemo(() => {
    return categoryData.reduce((acc, c) => acc + c.total_loss, 0);
  }, [categoryData]);

  const totalCasesAll = useMemo(() => {
    return categoryData.reduce((acc, c) => acc + c.count, 0);
  }, [categoryData]);

  // 3. Process Corporate / Private Partners with Linked Defendants and Cases
  const corporateList = useMemo(() => {
    const compMap: Record<string, {
      name: string;
      sektor: string;
      cases: CorruptionCase[];
      totalLoss: number;
      defendants: string[];
    }> = {};

    // Initial companies definition
    stats.top_perusahaan.forEach(p => {
      compMap[p.nama_perusahaan] = {
        name: p.nama_perusahaan,
        sektor: p.sektor,
        cases: [],
        totalLoss: 0,
        defendants: []
      };
    });

    // Populate from all cases
    cases.forEach(c => {
      if (c.perusahaan_terkait && c.perusahaan_terkait.length > 0) {
        c.perusahaan_terkait.forEach(compName => {
          if (!compMap[compName]) {
            compMap[compName] = {
              name: compName,
              sektor: 'Rekanan Swasta / Tender',
              cases: [],
              totalLoss: 0,
              defendants: []
            };
          }
          compMap[compName].cases.push(c);
          compMap[compName].totalLoss += c.nilai_kerugian_negara;
          if (c.official?.nama && !compMap[compName].defendants.includes(c.official.nama)) {
            compMap[compName].defendants.push(c.official.nama);
          }
        });
      }
    });

    return Object.values(compMap)
      .filter(c => c.cases.length > 0 || c.totalLoss > 0)
      .sort((a, b) => b.totalLoss - a.totalLoss || b.cases.length - a.cases.length);
  }, [cases, stats.top_perusahaan]);

  // Handlers for Row Interactivity
  const handleOpenCompanyDrilldown = (comp: typeof corporateList[0]) => {
    sound.playPop();
    setDrilldownTarget({
      type: 'company',
      title: comp.name,
      subtitle: `Sektor: ${comp.sektor} • ${comp.defendants.length} Tokoh Terlibat`,
      badgeText: `${comp.cases.length} Perkara Terdata`,
      icon: '🏢',
      cases: comp.cases,
      totalLoss: comp.totalLoss
    });
  };

  const handleOpenPartyDrilldown = (partyName: string, partyLoss: number) => {
    sound.playPop();
    const partyCases = cases.filter(c => c.official?.partai.toLowerCase() === partyName.toLowerCase());
    setDrilldownTarget({
      type: 'party',
      title: partyName,
      subtitle: `Sebaran kasus tindak pidana korupsi yang melibatkan kader ${partyName}`,
      badgeText: `${partyCases.length} Kasus Terdata`,
      icon: '🏛️',
      cases: partyCases,
      totalLoss: partyLoss
    });
  };

  const handleOpenYearDrilldown = (yr: number, yrCases: CorruptionCase[], yrLoss: number) => {
    sound.playPop();
    setDrilldownTarget({
      type: 'year',
      title: `Perkara Korupsi Tahun ${yr}`,
      subtitle: `Daftar seluruh perkara yang terjadi atau divonis pada tahun ${yr}`,
      badgeText: `${yrCases.length} Kasus`,
      icon: '📅',
      cases: yrCases,
      totalLoss: yrLoss
    });
  };

  const handleOpenCategoryDrilldown = (cat: typeof categoryData[0]) => {
    sound.playPop();
    setDrilldownTarget({
      type: 'category',
      title: cat.name,
      subtitle: `Daftar kasus dengan modus operandi ${cat.name}`,
      badgeText: `${cat.count} Kasus`,
      icon: '⚖️',
      cases: cat.cases,
      totalLoss: cat.total_loss
    });
  };

  const maxLoss = stats.top_kerugian.length > 0 ? stats.top_kerugian[0].nilai_kerugian_negara : 1;
  const maxPartyLoss = Math.max(...stats.distribusi_partai.map(p => p.total_kerugian), 1);

  return (
    <div id="stats-dashboard-section" className="space-y-6">
      
      {/* Overview Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Total Kasus */}
        <div className="relative bg-[#FFFDF9] border-2 border-[#E8DFC8] rounded-3xl p-5 shadow-sm overflow-hidden rotate-[-0.5deg] hover:rotate-0 transition-transform">
          <div className="washi-tape washi-tape-blue -top-3 left-6"></div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#BAE6FD] text-[#0369A1] flex items-center justify-center font-marker text-xl shadow-inner">
              <FolderKanban className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider">
                Total Perkara Terdata
              </span>
              <div className="font-marker text-3xl sm:text-4xl text-[#0369A1]">
                {stats.total_kasus_nasional} <span className="text-sm font-hand text-[#64748B]">Kasus</span>
              </div>
            </div>
          </div>
          <p className="text-[11px] text-[#64748B] mt-2 pt-2 border-t border-[#F1E8D5]">
            Terdokumentasi lengkap dengan putusan pengadilan &amp; media terverifikasi.
          </p>
        </div>

        {/* Card 2: Akumulasi Kerugian */}
        <div className="relative bg-[#FFFDF9] border-2 border-[#FDBA74] rounded-3xl p-5 shadow-sm overflow-hidden rotate-[0.5deg] hover:rotate-0 transition-transform">
          <div className="washi-tape washi-tape-yellow -top-3 left-8"></div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#FFEDD5] text-[#C2410C] flex items-center justify-center shadow-inner">
              <Flame className="w-6 h-6 text-[#EA580C]" />
            </div>
            <div>
              <span className="text-xs font-bold text-[#9A3412] uppercase tracking-wider">
                Akumulasi Kerugian Negara
              </span>
              <div className="font-marker text-2xl sm:text-3xl text-[#EA580C]">
                {formatRupiah(stats.total_kerugian_akumulasi)}
              </div>
            </div>
          </div>
          <p className="text-[11px] text-[#9A3412] mt-2 pt-2 border-t border-[#FED7AA]">
            Total nilai kerugian keuangan negara &amp; estimasi suap dalam database.
          </p>
        </div>

        {/* Card 3: Wilayah Kasus Terbanyak */}
        <div className="relative bg-[#FFFDF9] border-2 border-[#E8DFC8] rounded-3xl p-5 shadow-sm overflow-hidden rotate-[-0.5deg] hover:rotate-0 transition-transform">
          <div className="washi-tape washi-tape-pink -top-3 right-6"></div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#FBCFE8] text-[#BE185D] flex items-center justify-center shadow-inner">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider">
                Wilayah Kasus Terbanyak
              </span>
              <div className="font-bold text-lg text-[#BE185D] truncate">
                {stats.provinsi_terbanyak.provinsi}
              </div>
              <div className="text-xs font-semibold text-[#831843]">
                {stats.provinsi_terbanyak.total_kasus} Perkara ({formatRupiah(stats.provinsi_terbanyak.total_kerugian)})
              </div>
            </div>
          </div>
          <p className="text-[11px] text-[#64748B] mt-2 pt-2 border-t border-[#F1E8D5]">
            Provinsi dengan volume perkara terbanyak dalam sistem.
          </p>
        </div>

        {/* Card 4: Rekanan Swasta Terdata */}
        <div className="relative bg-[#FFFDF9] border-2 border-[#D8B4FE] rounded-3xl p-5 shadow-sm overflow-hidden rotate-[0.5deg] hover:rotate-0 transition-transform">
          <div className="washi-tape washi-tape-purple -top-3 left-6"></div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#F3E8FF] text-[#7E22CE] flex items-center justify-center shadow-inner font-marker text-xl">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold text-[#7E22CE] uppercase tracking-wider">
                Korporasi Rekanan
              </span>
              <div className="font-marker text-3xl text-[#7E22CE]">
                {corporateList.length} <span className="text-sm font-hand text-[#64748B]">Entitas</span>
              </div>
            </div>
          </div>
          <p className="text-[11px] text-[#6B21A8] mt-2 pt-2 border-t border-[#E9D5FF]">
            Perusahaan swasta &amp; konsorsium teridentifikasi dalam fakta persidangan.
          </p>
        </div>

      </div>

      {/* Dismissable Informative Guide Banner */}
      {!noticeDismissed && (
        <div className="relative p-4 bg-[#FEF9C3] border-2 border-[#FDE047] rounded-2xl text-xs text-[#854D0E] shadow-xs flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <Info className="w-4 h-4 text-[#B45309] shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-[#78350F]">Eksplorasi Statistik Interaktif:</span>{' '}
              Klik pada baris korporasi/rekanan swasta, diagram tahun, kategori, atau nama partai untuk melihat rincian nama terdakwa yang terlibat, kapan waktu kejadian, serta ringkasan dakwaan hukum lengkap.
            </div>
          </div>
          <button
            onClick={() => {
              sound.playPop();
              setNoticeDismissed(true);
            }}
            className="p-1 rounded-lg hover:bg-[#FEF08A] text-[#854D0E] hover:text-[#78350F] transition-colors cursor-pointer shrink-0"
            title="Tutup pemberitahuan ini"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* SECTION: TREN TAHUNAN (LINE & AREA CHART) */}
      <div className="relative bg-[#FFFDF8] border-2 border-[#E7DECB] rounded-3xl p-5 sm:p-7 shadow-sm space-y-4">
        <div className="washi-tape washi-tape-blue -top-3 left-10"></div>
        <div className="washi-tape washi-tape-green -top-3 right-10"></div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-[#E0F2FE] text-[#0284C7] rounded-xl">
              <TrendingUp className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-marker text-2xl text-[#1E293B]">
                Tren Kerugian Negara &amp; Volume Perkara per Tahun
              </h3>
              <p className="text-xs text-[#64748B]">
                Grafik garis kronologis pergerakan perkara tipikor. Klik titik tahun pada grafik untuk melihat daftar perkaranya.
              </p>
            </div>
          </div>

          {/* Metric Selector Buttons */}
          <div className="flex items-center gap-1 bg-[#F4EDE0] p-1 rounded-xl border border-[#DFD3BA] text-xs">
            <button
              onClick={() => {
                sound.playPop();
                setTimelineMetric('combined');
              }}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                timelineMetric === 'combined'
                  ? 'bg-white text-[#1E293B] shadow-xs'
                  : 'text-[#57534E] hover:text-[#1E293B]'
              }`}
            >
              Gabungan (Kerugian &amp; Kasus)
            </button>
            <button
              onClick={() => {
                sound.playPop();
                setTimelineMetric('loss');
              }}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                timelineMetric === 'loss'
                  ? 'bg-[#DC2626] text-white shadow-xs'
                  : 'text-[#57534E] hover:text-[#DC2626]'
              }`}
            >
              Nilai Kerugian Saja
            </button>
            <button
              onClick={() => {
                sound.playPop();
                setTimelineMetric('cases');
              }}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                timelineMetric === 'cases'
                  ? 'bg-[#0284C7] text-white shadow-xs'
                  : 'text-[#57534E] hover:text-[#0284C7]'
              }`}
            >
              Jumlah Kasus Saja
            </button>
          </div>
        </div>

        {/* Recharts Line / Area Chart Container */}
        <div className="h-72 sm:h-80 w-full pt-3">
          <ResponsiveContainer width="100%" height="100%">
            {timelineMetric === 'loss' ? (
              <AreaChart data={timelineData}>
                <defs>
                  <linearGradient id="lossGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EA580C" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#EA580C" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#EAE0CD" />
                <XAxis dataKey="year" stroke="#78716C" fontSize={11} tickLine={false} />
                <YAxis 
                  stroke="#78716C" 
                  fontSize={11} 
                  tickFormatter={(val) => `${(val / 1e12).toFixed(1)} T`} 
                  tickLine={false}
                />
                <Tooltip
                  formatter={(value: any) => [formatRupiah(Number(value)), 'Kerugian Negara']}
                  labelFormatter={(label) => `Tahun ${label} (Klik untuk rincian)`}
                  contentStyle={{
                    backgroundColor: '#FFFDF9',
                    borderColor: '#D5C9AB',
                    borderRadius: '12px',
                    fontSize: '12px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="kerugian" 
                  stroke="#EA580C" 
                  strokeWidth={3} 
                  fillOpacity={1} 
                  fill="url(#lossGradient)" 
                  activeDot={{ 
                    r: 6, 
                    onClick: (_, payload: any) => {
                      if (payload && payload.payload) {
                        handleOpenYearDrilldown(payload.payload.year, payload.payload.cases, payload.payload.kerugian);
                      }
                    } 
                  }}
                />
              </AreaChart>
            ) : timelineMetric === 'cases' ? (
              <LineChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EAE0CD" />
                <XAxis dataKey="year" stroke="#78716C" fontSize={11} tickLine={false} />
                <YAxis stroke="#78716C" fontSize={11} allowDecimals={false} tickLine={false} />
                <Tooltip
                  formatter={(value: any) => [`${value} Kasus Terdata`, 'Jumlah Perkara']}
                  labelFormatter={(label) => `Tahun ${label} (Klik untuk rincian)`}
                  contentStyle={{
                    backgroundColor: '#FFFDF9',
                    borderColor: '#D5C9AB',
                    borderRadius: '12px',
                    fontSize: '12px'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="total_kasus" 
                  stroke="#0284C7" 
                  strokeWidth={3} 
                  dot={{ r: 4, fill: '#0284C7' }} 
                  activeDot={{ 
                    r: 6, 
                    onClick: (_, payload: any) => {
                      if (payload && payload.payload) {
                        handleOpenYearDrilldown(payload.payload.year, payload.payload.cases, payload.payload.kerugian);
                      }
                    } 
                  }}
                />
              </LineChart>
            ) : (
              <ComposedChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EAE0CD" />
                <XAxis dataKey="year" stroke="#78716C" fontSize={11} tickLine={false} />
                <YAxis 
                  yAxisId="left" 
                  stroke="#EA580C" 
                  fontSize={11} 
                  tickFormatter={(val) => `${(val / 1e12).toFixed(1)} T`} 
                  tickLine={false}
                />
                <YAxis 
                  yAxisId="right" 
                  orientation="right" 
                  stroke="#0284C7" 
                  fontSize={11} 
                  allowDecimals={false} 
                  tickLine={false}
                />
                <Tooltip
                  formatter={(value: any, name: any) => {
                    if (name === 'Kerugian (Rp)') return [formatRupiah(Number(value)), 'Kerugian Negara'];
                    return [`${value} Kasus`, 'Jumlah Perkara'];
                  }}
                  labelFormatter={(label) => `Tahun ${label} (Klik untuk rincian perkara)`}
                  contentStyle={{
                    backgroundColor: '#FFFDF9',
                    borderColor: '#D5C9AB',
                    borderRadius: '12px',
                    fontSize: '12px'
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar 
                  yAxisId="right" 
                  dataKey="total_kasus" 
                  name="Jumlah Perkara" 
                  fill="#BAE6FD" 
                  radius={[4, 4, 0, 0]}
                  onClick={(data: any) => {
                    if (data && data.payload) {
                      handleOpenYearDrilldown(data.payload.year, data.payload.cases, data.payload.kerugian);
                    }
                  }}
                />
                <Line 
                  yAxisId="left" 
                  type="monotone" 
                  dataKey="kerugian" 
                  name="Kerugian (Rp)" 
                  stroke="#DC2626" 
                  strokeWidth={3} 
                  dot={{ r: 4, fill: '#DC2626' }}
                  activeDot={{ 
                    r: 6, 
                    onClick: (_, payload: any) => {
                      if (payload && payload.payload) {
                        handleOpenYearDrilldown(payload.payload.year, payload.payload.cases, payload.payload.kerugian);
                      }
                    } 
                  }}
                />
              </ComposedChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* Quick Year Chips for Direct Interactive Drill-down */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar pt-2 border-t border-[#EAE0CD]">
          <span className="font-bold text-[#78716C] whitespace-nowrap">Rincian Per Tahun:</span>
          {timelineData.filter(d => d.total_kasus > 0).map(d => (
            <button
              key={d.year}
              onClick={() => handleOpenYearDrilldown(d.year, d.cases, d.kerugian)}
              className="px-2.5 py-1 rounded-xl bg-[#FAF5E8] hover:bg-[#F3E8D5] text-[#1E293B] border border-[#D5C9AB] font-semibold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1"
            >
              <span>{d.year}</span>
              <span className="text-[10px] text-gray-500 font-normal">({d.total_kasus})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Top 10 Hall of Shame Section (Interactive Rows) */}
      <div className="relative bg-[#FFFDF8] border-2 border-[#E7DECB] rounded-3xl p-5 sm:p-7 shadow-sm space-y-4">
        <div className="washi-tape washi-tape-green -top-3 left-12"></div>
        <div className="washi-tape washi-tape-yellow -top-3 right-12"></div>

        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-[#FEE2E2] text-[#DC2626] rounded-xl">
              <Flame className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-marker text-2xl text-[#1E293B]">
                10 Kasus Kerugian Terbesar (Papan Catatan)
              </h3>
              <p className="text-xs text-[#64748B]">
                Perkara dengan dampak kerugian negara terbesar. Klik setiap baris untuk membuka detail putusan &amp; berkas perkara.
              </p>
            </div>
          </div>
          <span className="px-3 py-1 bg-[#FEF3C7] text-[#92400E] font-hand font-bold text-xs rounded-full border border-[#FCD34D]">
            ⚖️ Putusan Hukum &amp; Tuntutan Resmi
          </span>
        </div>

        {/* Bar Visualizer with Full Row Interaction */}
        <div className="space-y-3 pt-2">
          {stats.top_kerugian.map((item, idx) => {
            const barPercent = Math.max(10, Math.round((item.nilai_kerugian_negara / maxLoss) * 100));
            const barColors = [
              'bg-gradient-to-r from-[#EF4444] to-[#F87171]',
              'bg-gradient-to-r from-[#EA580C] to-[#FB923C]',
              'bg-gradient-to-r from-[#F59E0B] to-[#FBBF24]',
              'bg-gradient-to-r from-[#6366F1] to-[#818CF8]',
              'bg-gradient-to-r from-[#06B6D4] to-[#22D3EE]'
            ];
            const color = barColors[idx % barColors.length];

            return (
              <div
                key={item.case_id}
                onClick={() => {
                  sound.playPop();
                  onSelectCase(item.case_id);
                }}
                className="group p-3.5 rounded-2xl bg-[#FAF6EC] border border-[#E9DFCE] hover:border-[#FB923C] hover:bg-[#F2ECD9] cursor-pointer transition-all space-y-2 shadow-2xs"
              >
                <div className="flex items-center justify-between text-xs sm:text-sm font-bold gap-2">
                  <div className="flex items-center gap-2 truncate">
                    <span className="w-6 h-6 rounded-full bg-white border border-[#D5C9AB] flex items-center justify-center font-marker text-xs text-[#57534E] shrink-0">
                      #{idx + 1}
                    </span>
                    <span className="text-[#1E293B] group-hover:text-[#0284C7] font-bold text-sm truncate">
                      {item.nama}
                    </span>
                    <span className="text-xs font-normal text-gray-500 hidden sm:inline truncate">
                      ({item.jabatan})
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-marker text-sm sm:text-base text-[#DC2626]">
                      {formatRupiah(item.nilai_kerugian_negara)}
                    </span>
                    <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-[#0284C7]" />
                  </div>
                </div>

                {/* Styled Bar */}
                <div className="w-full bg-[#EAE2CE] h-3.5 rounded-full overflow-hidden p-0.5 shadow-inner">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${color}`}
                    style={{ width: `${barPercent}%` }}
                  ></div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-gray-500">
                  <span className="px-2 py-0.5 bg-white rounded-md border border-[#E2D5BA] text-[10px] font-semibold text-[#57534E]">
                    {item.status_hukum} • Tahun {item.tahun}
                  </span>
                  <span className="text-[#0284C7] font-semibold text-[11px] group-hover:underline flex items-center gap-1">
                    <span>Lihat Berkas Perkara Lengkap</span>
                    <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION: PIE / DONUT CHART MODUS & REKANAN SWASTA */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Komposisi Modus Tipikor (Donut / Pie Chart) */}
        <div className="relative bg-[#FFFDF8] border-2 border-[#E7DECB] rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
          <div className="washi-tape washi-tape-purple -top-3 left-8"></div>
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-[#EAE0CD]">
            <div className="flex items-center gap-2.5">
              <span className="p-2.5 bg-[#F3E8FF] text-[#9333EA] rounded-2xl shadow-2xs border border-[#E9D5FF]">
                <PieChartIcon className="w-5 h-5" />
              </span>
              <div>
                <h3 className="font-marker text-xl text-[#1E293B]">
                  Komposisi Sektor &amp; Modus Tipikor
                </h3>
                <p className="text-xs text-[#64748B]">
                  Sebaran kategori perkara korupsi di Indonesia
                </p>
              </div>
            </div>

            {/* Metric Toggle: Nilai Kerugian vs Jumlah Perkara */}
            <div className="inline-flex p-1 bg-[#FAF4E5] border border-[#E7DECB] rounded-2xl text-xs font-bold gap-1 shadow-2xs self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setDonutMetric('loss')}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                  donutMetric === 'loss'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-[#F3EBD8]'
                }`}
              >
                <span>💸 Kerugian (Rp)</span>
              </button>
              <button
                type="button"
                onClick={() => setDonutMetric('count')}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                  donutMetric === 'count'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-[#F3EBD8]'
                }`}
              >
                <span>📂 Jumlah Kasus</span>
              </button>
            </div>
          </div>

          {/* Donut Chart Visual with Dedicated Center Hub (Diameter Approaching Column Width) */}
          <div className="relative h-[360px] xs:h-[400px] sm:h-[440px] md:h-[480px] w-full flex items-center justify-center my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius="58%"
                  outerRadius="92%"
                  paddingAngle={3}
                  cornerRadius={7}
                  dataKey={donutMetric === 'loss' ? 'total_loss' : 'count'}
                  onMouseEnter={(_, index) => setDonutHoverIndex(index)}
                  onMouseLeave={() => setDonutHoverIndex(null)}
                  onClick={(data) => {
                    if (data && data.payload) {
                      handleOpenCategoryDrilldown(data.payload);
                    }
                  }}
                  cursor="pointer"
                  stroke="#FFFDF8"
                  strokeWidth={3.5}
                >
                  {categoryData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.color}
                      opacity={donutHoverIndex === null || donutHoverIndex === index ? 1 : 0.35}
                      className="transition-all duration-200"
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>

            {/* Dedicated Center Stat Hub (Spacious & Zero Overlap) */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-4 select-none">
              {donutHoverIndex !== null && categoryData[donutHoverIndex] ? (
                <div className="animate-in fade-in zoom-in-95 duration-150 flex flex-col items-center max-w-[210px] sm:max-w-[260px]">
                  <span className="text-3xl sm:text-4xl leading-none mb-1.5 drop-shadow-xs">
                    {SECTOR_ICONS[categoryData[donutHoverIndex].name] || '💼'}
                  </span>
                  <span className="text-xs sm:text-sm font-extrabold text-slate-800 uppercase tracking-tight line-clamp-2 px-1">
                    {categoryData[donutHoverIndex].name}
                  </span>
                  <span className="font-marker text-lg sm:text-2xl text-[#B45309] font-bold leading-tight mt-1">
                    {donutMetric === 'loss' 
                      ? formatRupiah(categoryData[donutHoverIndex].total_loss)
                      : `${categoryData[donutHoverIndex].count} Kasus`}
                  </span>
                  <div className="flex items-center gap-1.5 mt-1.5 flex-wrap justify-center">
                    <span 
                      className="text-xs font-bold px-3 py-0.5 rounded-full text-white shadow-2xs font-mono"
                      style={{ backgroundColor: categoryData[donutHoverIndex].color }}
                    >
                      {donutMetric === 'loss'
                        ? `${totalLossAll > 0 ? ((categoryData[donutHoverIndex].total_loss / totalLossAll) * 100).toFixed(1) : 0}%`
                        : `${totalCasesAll > 0 ? ((categoryData[donutHoverIndex].count / totalCasesAll) * 100).toFixed(1) : 0}%`}
                    </span>
                    <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 font-mono">
                      {categoryData[donutHoverIndex].count} Kasus
                    </span>
                  </div>
                  <span className="text-[10px] text-amber-700 font-medium mt-2 flex items-center gap-1">
                    <span>👆 Klik sektor untuk telaah berkas perkara</span>
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center max-w-[210px] sm:max-w-[260px]">
                  <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">
                    {donutMetric === 'loss' ? 'Akumulasi Kerugian Negara' : 'Total Berkas Perkara'}
                  </span>
                  <span className="font-marker text-xl sm:text-3xl text-slate-900 font-bold leading-tight mt-1">
                    {donutMetric === 'loss' ? formatRupiah(totalLossAll) : `${totalCasesAll} Kasus`}
                  </span>
                  <div className="flex items-center gap-1.5 mt-2">
                    <span className="text-xs font-semibold text-amber-800 bg-amber-100/90 border border-amber-300 px-3 py-1 rounded-full font-mono shadow-2xs">
                      {categoryData.length} Kategori Sektor
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-2">
                    Sorot irisan untuk melihat rincian sektor
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="text-[11px] text-slate-400 text-center flex items-center justify-center gap-1.5">
            <span>💡 Sorot diagram untuk melihat rincian • Klik sektor untuk membuka berkas perkara</span>
          </div>

          {/* Interactive Category Rows with Progress Indicators */}
          <div className="space-y-2 pt-2 border-t border-[#EAE0CD]">
            {categoryData.map((cat, idx) => {
              const isHovered = donutHoverIndex === idx;
              const pct = donutMetric === 'loss'
                ? (totalLossAll > 0 ? (cat.total_loss / totalLossAll) * 100 : 0)
                : (totalCasesAll > 0 ? (cat.count / totalCasesAll) * 100 : 0);
              const icon = SECTOR_ICONS[cat.name] || '💼';

              return (
                <div
                  key={cat.name}
                  onClick={() => handleOpenCategoryDrilldown(cat)}
                  onMouseEnter={() => setDonutHoverIndex(idx)}
                  onMouseLeave={() => setDonutHoverIndex(null)}
                  className={`group p-3 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
                    isHovered
                      ? 'bg-[#F2ECD9] border-[#FB923C] shadow-sm -translate-y-0.5'
                      : 'bg-[#FAF6EC] hover:bg-[#F2ECD9] border-[#E9E0CE] hover:border-[#FB923C]'
                  }`}
                >
                  {/* Visual background fill indicating proportional share */}
                  <div 
                    className="absolute left-0 top-0 bottom-0 opacity-15 transition-all duration-300 pointer-events-none rounded-r-xl"
                    style={{ width: `${pct}%`, backgroundColor: cat.color }}
                  />

                  <div className="relative flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-base shrink-0 p-1 bg-white rounded-lg border border-slate-200/70 shadow-2xs">
                        {icon}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-[#1E293B] truncate">{cat.name}</span>
                          <span 
                            className="px-1.5 py-0.2 rounded-md text-[10px] font-bold font-mono text-white shrink-0 shadow-2xs"
                            style={{ backgroundColor: cat.color }}
                          >
                            {pct.toFixed(1)}%
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 font-medium flex items-center gap-1 mt-0.5">
                          <span>{cat.count} Berkas Perkara</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-right">
                        <div className="font-marker text-[#B45309] text-xs sm:text-sm font-bold">
                          {formatRupiah(cat.total_loss)}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          Rata-rata: {formatRupiah(cat.count > 0 ? cat.total_loss / cat.count : 0)}
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 transition-colors" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Rekanan Swasta / Korporasi Terlibat (Interactive Rows) */}
        <div className="relative bg-[#FFFDF8] border-2 border-[#E7DECB] rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
          <div className="washi-tape washi-tape-yellow -top-3 right-8"></div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-[#FEF3C7] text-[#D97706] rounded-xl">
              <Building2 className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-marker text-xl text-[#1E293B]">
                Rekanan Swasta / Korporasi Terlibat
              </h3>
              <p className="text-xs text-[#64748B]">
                Perusahaan rekanan dalam proyek tender &amp; suap. Klik untuk melihat siapa saja terdakwa &amp; perkaranya.
              </p>
            </div>
          </div>

          {/* Corporate List Rows */}
          <div className="space-y-2.5 pt-1">
            {corporateList.map((comp) => (
              <div
                key={comp.name}
                onClick={() => handleOpenCompanyDrilldown(comp)}
                className="group p-3 bg-[#FAF6EC] hover:bg-[#F2ECD9] border border-[#E9E0CE] hover:border-[#EA580C] rounded-2xl flex flex-col gap-2 transition-all cursor-pointer shadow-2xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-xl bg-[#FEF08A] text-[#854D0E] font-marker flex items-center justify-center text-sm border border-[#EAB308] shrink-0">
                      🏢
                    </span>
                    <div>
                      <div className="font-bold text-sm text-[#1E293B] group-hover:text-[#0284C7] transition-colors">
                        {comp.name}
                      </div>
                      <div className="text-[11px] text-[#64748B]">{comp.sektor}</div>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 bg-[#E0F2FE] text-[#0369A1] font-bold text-xs rounded-full border border-[#BAE6FD] shrink-0">
                    {comp.cases.length} Perkara
                  </span>
                </div>

                {/* Sub-strip: Involved Defendants summary */}
                <div className="flex items-center justify-between text-[11px] pt-1 border-t border-[#F1E8D5] text-gray-500">
                  <div className="truncate max-w-[260px] sm:max-w-[320px]">
                    <span className="font-semibold text-[#57534E]">Terdakwa Terkait:</span>{' '}
                    <span className="text-[#92400E] font-medium">
                      {comp.defendants.length > 0 ? comp.defendants.join(', ') : 'Terdakwa terdata di berkas'}
                    </span>
                  </div>
                  <span className="text-[#0284C7] font-bold text-xs group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                    <span>Detail Kasus</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Dismissable Corporate Disclaimer Banner */}
          {!corporateNoteDismissed && (
            <div className="relative p-3 bg-[#FEF2F2] border border-[#FECACA] rounded-2xl text-xs text-[#991B1B] flex items-start justify-between gap-2">
              <div className="flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 shrink-0 text-[#DC2626] mt-0.5" />
                <span>Keterlibatan korporasi mengacu pada dakwaan resmi JPU KPK &amp; fakta persidangan Tipikor.</span>
              </div>
              <button
                onClick={() => {
                  sound.playPop();
                  setCorporateNoteDismissed(true);
                }}
                className="p-1 rounded hover:bg-[#FEE2E2] text-[#991B1B] transition-colors cursor-pointer shrink-0"
                title="Tutup catatan ini"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

      </div>

      {/* SECTION: DISTRIBUSI PARTAI POLITIK (Interactive Bars) */}
      <div className="relative bg-[#FFFDF8] border-2 border-[#E7DECB] rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
        <div className="washi-tape washi-tape-pink -top-3 left-10"></div>
        <div className="washi-tape washi-tape-blue -top-3 right-10"></div>

        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-[#FEF3C7] text-[#D97706] rounded-xl">
              <BarChart3 className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-marker text-xl text-[#1E293B]">
                Distribusi Afiliasi Partai Politik
              </h3>
              <p className="text-xs text-[#64748B]">
                Sebaran perkara &amp; kerugian menurut afiliasi politik pelaku. Klik setiap partai untuk melihat daftar kadernya yang terlibat.
              </p>
            </div>
          </div>
          <span className="text-xs text-gray-500 font-semibold">
            Klik baris partai untuk rincian
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
          {stats.distribusi_partai.map(party => {
            const widthRatio = Math.max(12, Math.round((party.total_kerugian / maxPartyLoss) * 100));
            return (
              <div
                key={party.partai}
                onClick={() => handleOpenPartyDrilldown(party.partai, party.total_kerugian)}
                className="group p-3 bg-[#FAF6EC] hover:bg-[#F2ECD9] rounded-2xl border border-[#EBE2D0] hover:border-[#FB923C] space-y-2 cursor-pointer transition-all shadow-2xs"
              >
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-[#1E293B] group-hover:text-[#0284C7] font-bold text-sm">
                    {party.partai}
                  </span>
                  <span className="font-marker text-[#B45309] text-sm">
                    {formatRupiah(party.total_kerugian)}
                  </span>
                </div>

                <div className="w-full bg-[#E5DCC6] h-2.5 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      backgroundColor: party.color,
                      width: `${widthRatio}%`
                    }}
                  ></div>
                </div>

                <div className="text-[11px] text-gray-500 flex items-center justify-between">
                  <span>{party.total_kasus} Perkara Terdata</span>
                  <span className="text-[#0284C7] font-semibold group-hover:underline flex items-center gap-0.5">
                    <span>Lihat Kader Terlibat</span>
                    <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Drilldown Modal (Corporate, Party, Year, Category) */}
      <StatsDrilldownModal
        target={drilldownTarget}
        onClose={() => setDrilldownTarget(null)}
        onSelectCase={(caseId) => {
          setDrilldownTarget(null);
          onSelectCase(caseId);
        }}
      />

    </div>
  );
};
