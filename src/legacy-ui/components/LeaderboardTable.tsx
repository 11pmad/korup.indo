"use client";

import React, { useState, useMemo } from 'react';
import { LeaderboardItem, LegalStatus, CorruptionCase, Official } from '../types';
import { formatRupiah, getStatusBadgeStyle } from '../utils/formatters';
import { sound } from '../utils/audio';
import { 
  Trophy, 
  ArrowUp, 
  ArrowDown, 
  Filter, 
  FileText, 
  ChevronLeft, 
  ChevronRight, 
  Calendar, 
  Building2, 
  MapPin, 
  RotateCcw,
  Users,
  ShieldAlert,
  Flame,
  Landmark,
  Clock,
  Download,
  Scale,
  Star,
  Globe
} from 'lucide-react';
import { PresumptionOfInnocenceBanner } from './PresumptionOfInnocenceBanner';
import { MedalBadge } from './ThemeIcons';

export interface HistoricalEra {
  id: string;
  name: string;
  shortName: string;
  president: string;
  startYear: number;
  endYear: number;
  description: string;
}

export const HISTORICAL_ERAS: HistoricalEra[] = [
  {
    id: 'prabowo',
    name: 'Era Prabowo Subianto (2024 - Sekarang)',
    shortName: 'Era Prabowo (2024-Sekarang)',
    president: 'Prabowo Subianto',
    startYear: 2024,
    endYear: 2029,
    description: 'Pemerintahan Kabinet Merah Putih (2024-sekarang)'
  },
  {
    id: 'jokowi-2',
    name: 'Era Joko Widodo Periode II (2019 - 2024)',
    shortName: 'Era Jokowi II (2019-2024)',
    president: 'Joko Widodo',
    startYear: 2019,
    endYear: 2024,
    description: 'Kabinet Indonesia Maju'
  },
  {
    id: 'jokowi-1',
    name: 'Era Joko Widodo Periode I (2014 - 2019)',
    shortName: 'Era Jokowi I (2014-2019)',
    president: 'Joko Widodo',
    startYear: 2014,
    endYear: 2019,
    description: 'Kabinet Kerja'
  },
  {
    id: 'jokowi-all',
    name: 'Era Joko Widodo Penuh (2014 - 2024)',
    shortName: 'Era Jokowi (10 Tahun)',
    president: 'Joko Widodo',
    startYear: 2014,
    endYear: 2024,
    description: 'Keseluruhan 2 periode kepemimpinan Presiden Joko Widodo'
  },
  {
    id: 'sby-2',
    name: 'Era Susilo Bambang Yudhoyono Periode II (2009 - 2014)',
    shortName: 'Era SBY II (2009-2014)',
    president: 'Susilo Bambang Yudhoyono',
    startYear: 2009,
    endYear: 2014,
    description: 'Kabinet Indonesia Bersatu II'
  },
  {
    id: 'sby-1',
    name: 'Era Susilo Bambang Yudhoyono Periode I (2004 - 2009)',
    shortName: 'Era SBY I (2004-2009)',
    president: 'Susilo Bambang Yudhoyono',
    startYear: 2004,
    endYear: 2009,
    description: 'Kabinet Indonesia Bersatu I'
  },
  {
    id: 'sby-all',
    name: 'Era Susilo Bambang Yudhoyono Penuh (2004 - 2014)',
    shortName: 'Era SBY (10 Tahun)',
    president: 'Susilo Bambang Yudhoyono',
    startYear: 2004,
    endYear: 2014,
    description: 'Keseluruhan 2 periode kepemimpinan Presiden SBY'
  },
  {
    id: 'reformasi',
    name: 'Era Reformasi Awal (1998 - 2004)',
    shortName: 'Era Reformasi (1998-2004)',
    president: 'B.J. Habibie, Abdurrahman Wahid, Megawati Soekarnoputri',
    startYear: 1998,
    endYear: 2004,
    description: 'Masa transisi Reformasi pasca-Orde Baru hingga Pilpres langsung'
  },
  {
    id: 'orba',
    name: 'Era Orde Baru (1966 - 1998)',
    shortName: 'Era Orde Baru (1966-1998)',
    president: 'Soeharto',
    startYear: 1966,
    endYear: 1998,
    description: 'Pemerintahan Orde Baru Presiden Soeharto'
  },
  {
    id: 'orla',
    name: 'Era Kemerdekaan & Orde Lama (1945 - 1966)',
    shortName: 'Era Kemerdekaan & Orla (1945-1966)',
    president: 'Ir. Soekarno',
    startYear: 1945,
    endYear: 1966,
    description: 'Periode Kemerdekaan dan Demokrasi Terpimpin'
  }
];

interface LeaderboardProps {
  items: LeaderboardItem[];
  cases?: CorruptionCase[];
  onSelectCase: (caseId: string) => void;
  provinces: string[];
}

// Island clusters mapping
const PROVINCE_TO_ISLAND: Record<string, string> = {
  'Aceh': 'Sumatera',
  'Sumatera Utara': 'Sumatera',
  'Sumatera Barat': 'Sumatera',
  'Riau': 'Sumatera',
  'Kepulauan Riau': 'Sumatera',
  'Jambi': 'Sumatera',
  'Sumatera Selatan': 'Sumatera',
  'Kepulauan Bangka Belitung': 'Sumatera',
  'Bangka Belitung': 'Sumatera',
  'Bengkulu': 'Sumatera',
  'Lampung': 'Sumatera',
  'Pusat / Nasional (Kementerian / Lembaga RI)': 'Nasional / Pusat',
  'Pusat / Nasional (Kementerian & Lembaga)': 'Nasional / Pusat',
  'Pusat / Nasional': 'Nasional / Pusat',
  'Nasional': 'Nasional / Pusat',
  'pusat': 'Nasional / Pusat',
  'nasional': 'Nasional / Pusat',
  'DKI Jakarta': 'Jawa',
  'Jawa Barat': 'Jawa',
  'Banten': 'Jawa',
  'Jawa Tengah': 'Jawa',
  'DI Yogyakarta': 'Jawa',
  'Daerah Istimewa Yogyakarta': 'Jawa',
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

export const getProvinceIsland = (prov: string | undefined | null): string => {
  if (!prov) return 'Lainnya';
  if (PROVINCE_TO_ISLAND[prov]) return PROVINCE_TO_ISLAND[prov];
  const pLower = prov.toLowerCase();
  if (pLower.includes('nasional') || pLower.includes('pusat')) return 'Nasional / Pusat';
  return 'Lainnya';
};

export const matchProvince = (itemProv: string | undefined | null, filterProv: string): boolean => {
  if (!itemProv || !filterProv) return false;
  const p1 = itemProv.trim().toLowerCase();
  const p2 = filterProv.trim().toLowerCase();
  if (p1 === p2) return true;
  
  const isFilterNational = p2.includes('nasional') || p2.includes('pusat');
  const isItemNational = p1.includes('nasional') || p1.includes('pusat');
  if (isFilterNational && isItemNational) return true;

  return false;
};

const ISLAND_CLUSTERS = [
  'Semua Pulau',
  'Nasional / Pusat',
  'Jawa',
  'Sumatera',
  'Kalimantan',
  'Sulawesi',
  'Bali & Nusa Tenggara',
  'Maluku & Papua'
];

const POPULAR_PARTIES = [
  'Semua Partai',
  'Partai Golkar',
  'PDI Perjuangan',
  'Partai Gerindra',
  'Partai NasDem',
  'Partai Demokrat',
  'PKB',
  'PAN',
  'PKS',
  'Non-Partai / Independen'
];

type LigaViewMode = 'pejabat' | 'partai' | 'wilayah';

export const LeaderboardTable: React.FC<LeaderboardProps> = ({
  items,
  cases = [],
  onSelectCase,
  provinces
}) => {
  // Liga View Mode: Tokoh (Pejabat), Partai Politik, atau Wilayah / Provinsi
  const [viewMode, setViewMode] = useState<LigaViewMode>('pejabat');

  // Filter States: All-Time vs Tahun, Era Kasus, Partai, Wilayah (Pulau & Provinsi), Status Hukum
  const [selectedPeriod, setSelectedPeriod] = useState<string>('alltime'); // 'alltime' | '2024' | '2023' | ...
  const [selectedEra, setSelectedEra] = useState<string>(''); // Era Kepresidenan / Sejarah
  const [filterPulau, setFilterPulau] = useState<string>('Semua Pulau');
  const [filterProvinsi, setFilterProvinsi] = useState<string>('');
  const [filterPartai, setFilterPartai] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  
  // Sorting & Pagination
  const [sortBy, setSortBy] = useState<'kerugian' | 'kasus' | 'rank' | 'tahun'>('kerugian');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  const activeEraObj = useMemo(() => {
    return HISTORICAL_ERAS.find(e => e.id === selectedEra);
  }, [selectedEra]);

  // Extract all distinct years available in cases data
  const availableYears = useMemo(() => {
    const yearsSet = new Set<number>();
    cases.forEach(c => {
      if (c.tahun_kejadian) yearsSet.add(c.tahun_kejadian);
      if (c.tahun_putusan) yearsSet.add(c.tahun_putusan);
    });
    // Fallback if cases empty
    items.forEach(it => {
      if (it.tahun_terkini) yearsSet.add(it.tahun_terkini);
    });
    return Array.from(yearsSet).sort((a, b) => b - a);
  }, [cases, items]);

  // Extract all distinct parties available
  const allPartiesList = useMemo(() => {
    const partySet = new Set<string>();
    items.forEach(it => {
      if (it.partai) partySet.add(it.partai);
    });
    cases.forEach(c => {
      if (c.official?.partai) partySet.add(c.official.partai);
    });
    return Array.from(partySet).sort();
  }, [items, cases]);

  // 1. DYNAMICALLY RECALCULATE LEADERBOARD ITEMS BASED ON PERIOD & FILTERS
  const processedOfficials = useMemo(() => {
    // If cases are provided, aggregate dynamically based on selected period
    if (cases && cases.length > 0) {
      // Step A: Filter cases according to active filters
      let relevantCases = cases.filter(c => !c.is_template);

      // Period / Year Filter
      if (selectedPeriod !== 'alltime') {
        const yr = parseInt(selectedPeriod, 10);
        relevantCases = relevantCases.filter(
          c => c.tahun_putusan === yr || c.tahun_kejadian === yr
        );
      }

      // Era Kasus Filter (Presiden / Periode Sejarah)
      if (selectedEra) {
        const era = HISTORICAL_ERAS.find(e => e.id === selectedEra);
        if (era) {
          relevantCases = relevantCases.filter(c => {
            const yrKejadian = c.tahun_kejadian;
            const yrPutusan = c.tahun_putusan;
            const matchKejadian = Boolean(yrKejadian && yrKejadian >= era.startYear && yrKejadian <= era.endYear);
            const matchPutusan = Boolean(yrPutusan && yrPutusan >= era.startYear && yrPutusan <= era.endYear);
            return matchKejadian || matchPutusan;
          });
        }
      }

      // Island Cluster Filter
      if (filterPulau && filterPulau !== 'Semua Pulau') {
        relevantCases = relevantCases.filter(c => {
          const prov = c.official?.provinsi;
          const island = getProvinceIsland(prov);
          return island === filterPulau;
        });
      }

      // Specific Province Filter
      if (filterProvinsi) {
        relevantCases = relevantCases.filter(
          c => matchProvince(c.official?.provinsi, filterProvinsi)
        );
      }

      // Party Filter
      if (filterPartai) {
        relevantCases = relevantCases.filter(c => {
          const p = c.official?.partai || '';
          if (filterPartai === 'Non-Partai / Independen') {
            return p.toLowerCase().includes('non-partai') || p.toLowerCase().includes('independen');
          }
          return p.toLowerCase().includes(filterPartai.toLowerCase());
        });
      }

      // Status Filter
      if (filterStatus) {
        relevantCases = relevantCases.filter(
          c => c.status_hukum.toLowerCase() === filterStatus.toLowerCase()
        );
      }

      // Step B: Group by official
      const officialMap = new Map<
        string,
        {
          official: Official;
          cases: CorruptionCase[];
          total_kerugian: number;
        }
      >();

      for (const c of relevantCases) {
        if (!c.official) continue;
        const offId = c.official.id;
        if (!officialMap.has(offId)) {
          officialMap.set(offId, {
            official: c.official,
            cases: [],
            total_kerugian: 0
          });
        }
        const entry = officialMap.get(offId)!;
        entry.cases.push(c);
        entry.total_kerugian += c.nilai_kerugian_negara;
      }

      // Step C: Map into LeaderboardItem list
      const aggregated: LeaderboardItem[] = Array.from(officialMap.values()).map(group => {
        const sortedCases = [...group.cases].sort(
          (a, b) => (b.tahun_putusan || b.tahun_kejadian) - (a.tahun_putusan || a.tahun_kejadian)
        );
        const latest = sortedCases[0];

        return {
          rank: 0,
          official_id: group.official.id,
          nama: group.official.nama,
          jabatan: group.official.jabatan,
          partai: group.official.partai,
          provinsi: group.official.provinsi,
          total_kasus: group.cases.length,
          total_kerugian_negara: group.total_kerugian,
          status_hukum_terkini: latest.status_hukum,
          tahun_terkini: latest.tahun_putusan || latest.tahun_kejadian,
          case_ids: group.cases.map(c => c.id)
        };
      });

      return aggregated;
    }

    // Fallback if cases not passed: filter items array directly
    return items.filter(it => {
      if (selectedPeriod !== 'alltime') {
        const yr = parseInt(selectedPeriod, 10);
        if (it.tahun_terkini !== yr) return false;
      }
      if (selectedEra) {
        const era = HISTORICAL_ERAS.find(e => e.id === selectedEra);
        if (era) {
          if (!it.tahun_terkini || it.tahun_terkini < era.startYear || it.tahun_terkini > era.endYear) {
            return false;
          }
        }
      }
      if (filterPulau && filterPulau !== 'Semua Pulau') {
        const island = getProvinceIsland(it.provinsi);
        if (island !== filterPulau) return false;
      }
      if (filterProvinsi && !matchProvince(it.provinsi, filterProvinsi)) return false;
      if (filterPartai && !it.partai.toLowerCase().includes(filterPartai.toLowerCase())) return false;
      if (filterStatus && it.status_hukum_terkini !== filterStatus) return false;
      return true;
    });
  }, [cases, items, selectedPeriod, selectedEra, filterPulau, filterProvinsi, filterPartai, filterStatus]);

  // 2. SORTED OFFICIALS LIST
  const sortedOfficials = useMemo(() => {
    const list = [...processedOfficials];
    list.sort((a, b) => {
      let diff = 0;
      if (sortBy === 'kerugian') {
        diff = b.total_kerugian_negara - a.total_kerugian_negara;
      } else if (sortBy === 'kasus') {
        diff = b.total_kasus - a.total_kasus;
      } else if (sortBy === 'tahun') {
        diff = b.tahun_terkini - a.tahun_terkini;
      } else {
        diff = a.rank - b.rank;
      }
      return sortOrder === 'desc' ? diff : -diff;
    });

    // Assign sequential ranks
    return list.map((it, idx) => ({
      ...it,
      rank: idx + 1
    }));
  }, [processedOfficials, sortBy, sortOrder]);

  // 3. AGGREGATED LIGA PARTAI POLITIK
  const partyLeaderboard = useMemo(() => {
    const partyMap = new Map<
      string,
      {
        partai: string;
        total_kerugian: number;
        total_kasus: number;
        cadres: Set<string>;
        case_ids: string[];
      }
    >();

    processedOfficials.forEach(it => {
      const p = it.partai || 'Lainnya / Non-Partai';
      if (!partyMap.has(p)) {
        partyMap.set(p, {
          partai: p,
          total_kerugian: 0,
          total_kasus: 0,
          cadres: new Set(),
          case_ids: []
        });
      }
      const entry = partyMap.get(p)!;
      entry.total_kerugian += it.total_kerugian_negara;
      entry.total_kasus += it.total_kasus;
      entry.cadres.add(it.official_id);
      entry.case_ids.push(...it.case_ids);
    });

    const result = Array.from(partyMap.values()).map(p => ({
      partai: p.partai,
      total_kerugian: p.total_kerugian,
      total_kasus: p.total_kasus,
      total_pejabat: p.cadres.size,
      sample_case_id: p.case_ids[0] || ''
    }));

    result.sort((a, b) => b.total_kerugian - a.total_kerugian);
    return result;
  }, [processedOfficials]);

  // 4. AGGREGATED LIGA WILAYAH / PROVINSI (aggregated from cases, not officials)
  const regionLeaderboard = useMemo(() => {
    const regMap = new Map<
      string,
      {
        provinsi: string;
        island: string;
        total_kerugian: number;
        total_kasus: number;
        pejabat_count: Set<string>;
        sample_case_id: string;
      }
    >();

    // Use the same filtered cases as processedOfficials uses
    let relevantCases = (cases || []).filter(c => !c.is_template);
    if (selectedPeriod !== 'alltime') {
      const yr = parseInt(selectedPeriod, 10);
      relevantCases = relevantCases.filter(
        c => c.tahun_putusan === yr || c.tahun_kejadian === yr
      );
    }
    if (selectedEra) {
      const era = HISTORICAL_ERAS.find(e => e.id === selectedEra);
      if (era) {
        relevantCases = relevantCases.filter(c => {
          const yrK = c.tahun_kejadian;
          const yrP = c.tahun_putusan;
          return (yrK && yrK >= era.startYear && yrK <= era.endYear) ||
                 (yrP && yrP >= era.startYear && yrP <= era.endYear);
        });
      }
    }
    if (filterPulau && filterPulau !== 'Semua Pulau') {
      relevantCases = relevantCases.filter(c => {
        const prov = c.official?.provinsi;
        const island = getProvinceIsland(prov);
        return island === filterPulau;
      });
    }
    if (filterProvinsi) {
      relevantCases = relevantCases.filter(
        c => matchProvince(c.official?.provinsi, filterProvinsi)
      );
    }
    if (filterPartai) {
      relevantCases = relevantCases.filter(c => {
        const p = c.official?.partai || '';
        if (filterPartai === 'Non-Partai / Independen') {
          return p.toLowerCase().includes('non-partai') || p.toLowerCase().includes('independen');
        }
        return p.toLowerCase().includes(filterPartai.toLowerCase());
      });
    }
    if (filterStatus) {
      relevantCases = relevantCases.filter(
        c => c.status_hukum.toLowerCase() === filterStatus.toLowerCase()
      );
    }

    // Group by case province (not official province)
    for (const c of relevantCases) {
      const prov = c.official?.provinsi || 'Lainnya';
      if (!regMap.has(prov)) {
        regMap.set(prov, {
          provinsi: prov,
          island: PROVINCE_TO_ISLAND[prov] || 'Wilayah Lain',
          total_kerugian: 0,
          total_kasus: 0,
          pejabat_count: new Set(),
          sample_case_id: c.id
        });
      }
      const entry = regMap.get(prov)!;
      entry.total_kerugian += c.nilai_kerugian_negara;
      entry.total_kasus += 1;
      if (c.official?.id) entry.pejabat_count.add(c.official.id);
    }

    const result = Array.from(regMap.values()).map(r => ({
      provinsi: r.provinsi,
      island: r.island,
      total_kerugian: r.total_kerugian,
      total_kasus: r.total_kasus,
      total_pejabat: r.pejabat_count.size,
      sample_case_id: r.sample_case_id
    }));

    result.sort((a, b) => b.total_kerugian - a.total_kerugian);
    return result;
  }, [cases, selectedPeriod, selectedEra, filterPulau, filterProvinsi, filterPartai, filterStatus]);

  // Pagination for Officials view
  const effectivePageSize = pageSize >= 9999 ? Math.max(sortedOfficials.length, 1) : pageSize;
  const totalPages = Math.ceil(sortedOfficials.length / effectivePageSize) || 1;
  const paginatedOfficials = sortedOfficials.slice((currentPage - 1) * effectivePageSize, currentPage * effectivePageSize);

  // Overall Filter Metrics
  const totalFilteredLoss = useMemo(() => {
    return processedOfficials.reduce((acc, it) => acc + it.total_kerugian_negara, 0);
  }, [processedOfficials]);

  const totalFilteredCases = useMemo(() => {
    return processedOfficials.reduce((acc, it) => acc + it.total_kasus, 0);
  }, [processedOfficials]);

  const hasActiveFilters = 
    selectedPeriod !== 'alltime' || 
    Boolean(selectedEra) ||
    (filterPulau && filterPulau !== 'Semua Pulau') || 
    Boolean(filterProvinsi) || 
    Boolean(filterPartai) || 
    Boolean(filterStatus);

  const handleResetFilters = () => {
    sound.playPop();
    setSelectedPeriod('alltime');
    setSelectedEra('');
    setFilterPulau('Semua Pulau');
    setFilterProvinsi('');
    setFilterPartai('');
    setFilterStatus('');
    setCurrentPage(1);
  };

  const handleExportCsv = () => {
    sound.playPop();
    const exportType = viewMode === 'partai' ? 'parties' : viewMode === 'wilayah' ? 'provinces' : 'officials';
    const params = new URLSearchParams();
    params.set('type', exportType);
    if (selectedEra) params.set('era', selectedEra);
    if (filterProvinsi) params.set('province', filterProvinsi);
    if (filterPartai) params.set('party', filterPartai);
    if (filterStatus) params.set('status', filterStatus);
    window.open(`/api/export?${params.toString()}`, '_blank');
  };

  const handleSort = (field: 'kerugian' | 'kasus' | 'tahun' | 'rank') => {
    sound.playPop();
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const getRankMedal = (rank: number) => {
    if (rank >= 1 && rank <= 3) {
      return <MedalBadge rank={rank - 1} className="w-4 h-4" />;
    }
    return (
      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#F3EDE0] border border-[#D5C9A9] text-[#57534E] font-bold text-xs">
        #{rank}
      </span>
    );
  };

  return (
    <div id="leaderboard-section" className="space-y-6">
      
      {/* Title & Scrapbook Header Banner */}
      <div className="relative bg-[#FFFDF9] border-2 border-[#E7DECB] rounded-3xl p-5 sm:p-7 shadow-sm space-y-5 overflow-hidden">
        <div className="washi-tape washi-tape-pink -top-3 left-10"></div>
        <div className="washi-tape washi-tape-yellow -top-3 right-10"></div>

        {/* Header Top Row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#FEF08A] border-2 border-[#EAB308] flex items-center justify-center shadow-sm rotate-[-2deg] shrink-0">
              <Trophy className="w-6 h-6 text-[#854D0E]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-marker text-2xl sm:text-3xl text-[#1E293B]">
                  Klasemen Liga Korupsi Indonesia
                </h2>
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold bg-[#FEE2E2] text-[#991B1B] px-2.5 py-0.5 rounded-full border border-[#FECACA]">
                  <Flame className="w-3 h-3 text-[#DC2626]" /> Data Terverifikasi
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[#64748B] mt-0.5">
                Peringkat transparansi publik berdasarkan putusan hukum resmi pengadilan, KPK, &amp; kejaksaan.
              </p>
            </div>
          </div>

          {/* View Mode Tabs (Tokoh, Partai, Wilayah) & Ekspor CSV */}
          <div className="flex items-center gap-2.5 flex-wrap self-start md:self-auto">
            <div className="flex items-center bg-[#F3EDE0] p-1.5 rounded-2xl border border-[#E0D4BE] shadow-2xs">
              <button
                onClick={() => {
                  sound.playPop();
                  setViewMode('pejabat');
                  setCurrentPage(1);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'pejabat'
                    ? 'bg-white text-[#1E293B] shadow-xs scale-102 border border-[#E2D6C0]'
                    : 'text-[#64748B] hover:text-[#1E293B]'
                }`}
              >
                <Users className="w-3.5 h-3.5 text-[#E11D48]" />
                <span>Pejabat</span>
              </button>

              <button
                onClick={() => {
                  sound.playPop();
                  setViewMode('partai');
                  setCurrentPage(1);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'partai'
                    ? 'bg-white text-[#1E293B] shadow-xs scale-102 border border-[#E2D6C0]'
                    : 'text-[#64748B] hover:text-[#1E293B]'
                }`}
              >
                <Building2 className="w-3.5 h-3.5 text-[#D97706]" />
                <span>Partai Politik</span>
              </button>

              <button
                onClick={() => {
                  sound.playPop();
                  setViewMode('wilayah');
                  setCurrentPage(1);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'wilayah'
                    ? 'bg-white text-[#1E293B] shadow-xs scale-102 border border-[#E2D6C0]'
                    : 'text-[#64748B] hover:text-[#1E293B]'
                }`}
              >
                <MapPin className="w-3.5 h-3.5 text-[#0284C7]" />
                <span>Per Provinsi</span>
              </button>
            </div>

            {/* Tombol Ekspor CSV */}
            <button
              onClick={handleExportCsv}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-bold bg-[#15803D] hover:bg-[#166534] text-white shadow-xs transition-all cursor-pointer border border-[#14532D]"
              title="Ekspor data klasemen terfilter ke format CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Ekspor CSV</span>
            </button>
          </div>
        </div>

        {/* Comprehensive Filter Control Panel */}
        <div className="bg-[#FAF5E8] border border-[#E5DAC4] rounded-2xl p-4 sm:p-5 space-y-4">
          
          {/* SECTION 1: PERIODE FILTER (ALL-TIME vs TAHUN) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#44403C] flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-[#D97706]" />
                <span>Periode Waktu (All-Time / Tahun)</span>
              </label>
              <span className="text-[11px] font-mono text-[#78716C] inline-flex items-center gap-1">
                {selectedPeriod === 'alltime' ? (
                  <>
                    <Star className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span>Menampilkan Data Sepanjang Masa</span>
                  </>
                ) : (
                  <>
                    <Calendar className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>Tahun Aktif: {selectedPeriod}</span>
                  </>
                )}
              </span>
            </div>

            {/* Quick Period Buttons Bar */}
            <div className="flex flex-wrap items-center gap-2">
              {/* All Time Primary Button */}
              <button
                onClick={() => {
                  sound.playPop();
                  setSelectedPeriod('alltime');
                  setCurrentPage(1);
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 ${
                  selectedPeriod === 'alltime'
                    ? 'bg-[#E11D48] text-white border-[#BE123C] shadow-sm scale-105'
                    : 'bg-white text-[#44403C] border-[#D5C9AB] hover:bg-[#FFF9EE]'
                }`}
              >
                <Clock className="w-3.5 h-3.5 shrink-0" />
                <span>All-Time (Semua Tahun)</span>
              </button>

              {/* Dynamic Year Buttons */}
              {availableYears.slice(0, 6).map(year => (
                <button
                  key={year}
                  onClick={() => {
                    sound.playPop();
                    setSelectedPeriod(String(year));
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                    selectedPeriod === String(year)
                      ? 'bg-[#B45309] text-white border-[#92400E] shadow-sm scale-105'
                      : 'bg-white text-[#57534E] border-[#D5C9AB] hover:bg-[#FFF9EE]'
                  }`}
                >
                  {year}
                </button>
              ))}

              {/* Year Dropdown for other years */}
              {availableYears.length > 6 && (
                <select
                  value={selectedPeriod !== 'alltime' && !availableYears.slice(0, 6).includes(parseInt(selectedPeriod, 10)) ? selectedPeriod : ''}
                  onChange={(e) => {
                    if (e.target.value) {
                      sound.playPop();
                      setSelectedPeriod(e.target.value);
                      setCurrentPage(1);
                    }
                  }}
                  className="bg-white border border-[#D5C9AB] rounded-xl px-3 py-1.5 text-xs font-semibold text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#FB923C]"
                >
                  <option value="">Pilih Tahun Lainnya...</option>
                  {availableYears.slice(6).map(yr => (
                    <option key={yr} value={yr}>Tahun {yr}</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* SECTION 2: ERA, WILAYAH, PARTAI & STATUS GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 pt-3 border-t border-[#EAE0CD]">
            
            {/* 1. Filter Era Kasus (Presiden / Sejarah) */}
            <div>
              <label className="block text-xs font-bold text-[#57534E] mb-1 flex items-center gap-1">
                <Landmark className="w-3.5 h-3.5 text-[#B45309]" /> Era Kasus
              </label>
              <select
                value={selectedEra}
                onChange={e => {
                  sound.playPop();
                  setSelectedEra(e.target.value);
                  setCurrentPage(1);
                }}
                className={`w-full bg-white border rounded-xl px-3 py-2 text-xs font-semibold text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#FB923C] ${
                  selectedEra ? 'border-[#D97706] ring-1 ring-[#D97706] bg-[#FFFBEB]' : 'border-[#D5C9AB]'
                }`}
              >
                <option value="">Semua Era Kasus</option>
                <optgroup label="Era Kepresidenan & Sejarah">
                  {HISTORICAL_ERAS.map(era => (
                    <option key={era.id} value={era.id}>
                      {era.name}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            {/* 2. Filter Klaster Pulau */}
            <div>
              <label className="block text-xs font-bold text-[#57534E] mb-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-[#0284C7]" /> Klaster Pulau
              </label>
              <select
                value={filterPulau}
                onChange={e => {
                  sound.playPop();
                  setFilterPulau(e.target.value);
                  setFilterProvinsi(''); // Reset specific province when island changes
                  setCurrentPage(1);
                }}
                className="w-full bg-white border border-[#D5C9AB] rounded-xl px-3 py-2 text-xs font-semibold text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#FB923C]"
              >
                {ISLAND_CLUSTERS.map(island => (
                  <option key={island} value={island}>{island}</option>
                ))}
              </select>
            </div>

            {/* 3. Filter Spesifik Provinsi */}
            <div>
              <label className="block text-xs font-bold text-[#57534E] mb-1 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5 text-[#0284C7]" /> Spesifik Wilayah / Provinsi
              </label>
              <select
                value={filterProvinsi}
                onChange={e => {
                  sound.playPop();
                  setFilterProvinsi(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-white border border-[#D5C9AB] rounded-xl px-3 py-2 text-xs font-semibold text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#FB923C] cursor-pointer"
              >
                <option value="">Semua Wilayah &amp; Provinsi</option>
                
                {(filterPulau === 'Semua Pulau' || filterPulau === 'Nasional / Pusat') && (
                  <optgroup label="Tingkat Nasional / Pemerintah Pusat">
                    <option value="Pusat / Nasional (Kementerian / Lembaga RI)">
                      Pusat / Nasional (Kementerian / Lembaga RI / BUMN)
                    </option>
                  </optgroup>
                )}

                {filterPulau !== 'Nasional / Pusat' && (
                  <optgroup label="Tingkat Daerah (38 Provinsi Nusantara)">
                    {provinces
                      .filter(p => {
                        const isNat = p.toLowerCase().includes('nasional') || p.toLowerCase().includes('pusat');
                        if (isNat) return false;
                        return filterPulau === 'Semua Pulau' || getProvinceIsland(p) === filterPulau;
                      })
                      .map(p => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                  </optgroup>
                )}
              </select>
            </div>

            {/* 4. Filter Partai Politik */}
            <div>
              <label className="block text-xs font-bold text-[#57534E] mb-1 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-[#D97706]" /> Filter Partai Politik
              </label>
              <select
                value={filterPartai}
                onChange={e => {
                  sound.playPop();
                  setFilterPartai(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-white border border-[#D5C9AB] rounded-xl px-3 py-2 text-xs font-semibold text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#FB923C]"
              >
                <option value="">Semua Partai Politik</option>
                {POPULAR_PARTIES.slice(1).map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
                {allPartiesList
                  .filter(p => !POPULAR_PARTIES.includes(p))
                  .map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
              </select>
            </div>

            {/* 5. Filter Status Hukum */}
            <div>
              <label className="block text-xs font-bold text-[#57534E] mb-1 flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5 text-[#DC2626]" /> Status Hukum
              </label>
              <select
                value={filterStatus}
                onChange={e => {
                  sound.playPop();
                  setFilterStatus(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-white border border-[#D5C9AB] rounded-xl px-3 py-2 text-xs font-semibold text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#FB923C]"
              >
                <option value="">Semua Status Hukum</option>
                <option value="Divonis Inkrah">Divonis Inkrah</option>
                <option value="Terdakwa">Terdakwa</option>
                <option value="Tersangka">Tersangka</option>
                <option value="Bebas/Praperadilan">Bebas / Praperadilan</option>
              </select>
            </div>

          </div>

          {/* Era Context Information Banner */}
          {activeEraObj && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 bg-[#FEF9C3] border border-[#FDE047] rounded-xl text-xs text-[#854D0E] shadow-2xs">
              <div className="flex items-start sm:items-center gap-2.5">
                <Landmark className="w-4 h-4 shrink-0 text-[#B45309] mt-0.5 sm:mt-0" />
                <div>
                  <span className="font-bold text-[#92400E]">{activeEraObj.name}:</span>{' '}
                  <span className="text-[#78350F]">{activeEraObj.description} • Rentang waktu: <strong>{activeEraObj.startYear} s/d {activeEraObj.endYear}</strong>.</span>
                </div>
              </div>
              <button
                onClick={() => {
                  sound.playPop();
                  setSelectedEra('');
                  setCurrentPage(1);
                }}
                className="text-xs font-bold text-[#B45309] hover:text-[#78350F] underline cursor-pointer shrink-0 self-end sm:self-auto"
              >
                Reset Filter Era
              </button>
            </div>
          )}

          {/* Active Filter Badges & Reset Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#EAE0CD] text-xs">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[#78716C] font-semibold">Filter Aktif:</span>
              <span className="px-2 py-0.5 rounded-md bg-[#FFFDF8] border border-[#D5C9AB] text-[#1E293B] font-bold inline-flex items-center gap-1">
                <Clock className="w-3 h-3 text-amber-700 shrink-0" />
                <span>{selectedPeriod === 'alltime' ? 'All-Time' : `Tahun ${selectedPeriod}`}</span>
              </span>

              {selectedEra && activeEraObj && (
                <span className="px-2 py-0.5 rounded-md bg-[#FEF3C7] border border-[#FDE68A] text-[#92400E] font-bold inline-flex items-center gap-1">
                  <Landmark className="w-3 h-3 shrink-0" />
                  <span>Era: {activeEraObj.shortName}</span>
                  <button
                    onClick={() => {
                      sound.playPop();
                      setSelectedEra('');
                      setCurrentPage(1);
                    }}
                    className="ml-1 text-[#92400E] hover:text-[#B91C1C] font-bold text-xs"
                    title="Hapus Era"
                  >
                    ×
                  </button>
                </span>
              )}

              {filterPulau !== 'Semua Pulau' && (
                <span className="px-2 py-0.5 rounded-md bg-[#BAE6FD] border border-[#7DD3FC] text-[#0369A1] font-bold inline-flex items-center gap-1">
                  <Globe className="w-3 h-3 shrink-0" />
                  <span>Pulau: {filterPulau}</span>
                </span>
              )}

              {filterProvinsi && (
                <span className="px-2 py-0.5 rounded-md bg-[#E0F2FE] border border-[#BAE6FD] text-[#0284C7] font-bold inline-flex items-center gap-1">
                  {filterProvinsi.toLowerCase().includes('nasional') || filterProvinsi.toLowerCase().includes('pusat') ? (
                    <>
                      <Landmark className="w-3 h-3 shrink-0" />
                      <span>Nasional / Pusat</span>
                    </>
                  ) : (
                    <>
                      <MapPin className="w-3 h-3 shrink-0" />
                      <span>Prov: {filterProvinsi}</span>
                    </>
                  )}
                </span>
              )}

              {filterPartai && (
                <span className="px-2 py-0.5 rounded-md bg-[#FEF3C7] border border-[#FDE68A] text-[#92400E] font-bold inline-flex items-center gap-1">
                  <Landmark className="w-3 h-3 shrink-0" />
                  <span>{filterPartai}</span>
                </span>
              )}

              {filterStatus && (
                <span className="px-2 py-0.5 rounded-md bg-[#FEE2E2] border border-[#FECACA] text-[#991B1B] font-bold inline-flex items-center gap-1">
                  <Scale className="w-3 h-3 shrink-0" />
                  <span>{filterStatus}</span>
                </span>
              )}
            </div>

            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="flex items-center gap-1 text-[#DC2626] hover:text-[#991B1B] font-bold text-xs px-2.5 py-1 rounded-lg hover:bg-[#FEE2E2] transition-colors border border-transparent hover:border-[#FECACA]"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Semua Filter</span>
              </button>
            )}
          </div>

        </div>

        {/* Filter Summary Metric Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-[#FAF5E8] border border-[#E7DECB] rounded-xl p-3 text-center">
            <span className="text-[10px] text-gray-500 font-bold block">TOTAL ENTRI TERFILTER</span>
            <span className="font-marker text-lg text-[#1E293B]">
              {viewMode === 'pejabat' 
                ? `${processedOfficials.length} Pejabat` 
                : viewMode === 'partai' 
                ? `${partyLeaderboard.length} Partai` 
                : `${regionLeaderboard.length} Provinsi`}
            </span>
          </div>

          <div className="bg-[#FAF5E8] border border-[#E7DECB] rounded-xl p-3 text-center">
            <span className="text-[10px] text-gray-500 font-bold block">KERUGIAN NEGARA AKUMULASI</span>
            <span className="font-marker text-lg text-[#DC2626]">
              {formatRupiah(totalFilteredLoss)}
            </span>
          </div>

          <div className="bg-[#FAF5E8] border border-[#E7DECB] rounded-xl p-3 text-center">
            <span className="text-[10px] text-gray-500 font-bold block">JUMLAH PERKARA</span>
            <span className="font-marker text-lg text-[#0284C7]">
              {totalFilteredCases} Kasus
            </span>
          </div>

          <div className="bg-[#FAF5E8] border border-[#E7DECB] rounded-xl p-3 text-center">
            <span className="text-[10px] text-gray-500 font-bold block">PERIODE / ERA DATA</span>
            <span className="font-marker text-lg text-[#D97706] truncate block" title={activeEraObj ? activeEraObj.name : (selectedPeriod === 'alltime' ? 'Sepanjang Waktu' : `Tahun ${selectedPeriod}`)}>
              {activeEraObj 
                ? activeEraObj.shortName 
                : (selectedPeriod === 'alltime' ? 'Sepanjang Waktu' : `Tahun ${selectedPeriod}`)}
            </span>
          </div>
        </div>

      </div>

      {/* Asas Praduga Tak Bersalah Banner (Muncul bila filter atau entri berstatus Tersangka / Terdakwa) */}
      {(filterStatus.toLowerCase().includes('tersangka') || filterStatus.toLowerCase().includes('terdakwa')) && (
        <PresumptionOfInnocenceBanner status={filterStatus} />
      )}

      {/* VIEW MODE 1: KLASEMEN PEJABAT / TOKOH */}
      {viewMode === 'pejabat' && (
        <div className="bg-[#FFFDF8] border-2 border-[#E7DECB] rounded-3xl overflow-hidden shadow-sm">
          
          {/* Table Header */}
          <div className="hidden lg:grid grid-cols-12 gap-3 px-6 py-3.5 bg-[#F6F0E0] border-b border-[#E3D6BC] text-xs font-bold text-[#57534E]">
            <div 
              onClick={() => handleSort('rank')}
              className="col-span-1 flex items-center gap-1 cursor-pointer hover:text-[#0F172A]"
            >
              <span>Rank</span>
              {sortBy === 'rank' && (sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />)}
            </div>

            <div className="col-span-3">Nama &amp; Jabatan Pejabat</div>
            <div className="col-span-2">Wilayah / Dapil</div>
            <div className="col-span-1">Partai</div>
            
            <div 
              onClick={() => handleSort('kerugian')}
              className="col-span-2 flex items-center gap-1 cursor-pointer hover:text-[#0F172A] justify-end"
            >
              <span>Total Kerugian (Rp)</span>
              {sortBy === 'kerugian' && (sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />)}
            </div>

            <div className="col-span-2 text-center">Status Hukum</div>
            <div className="col-span-1 text-right">Berkas</div>
          </div>

          {/* Rows */}
          <div className="divide-y divide-[#F1E8D5]">
            {paginatedOfficials.length === 0 ? (
              <div className="p-12 text-center text-[#78716C] font-hand text-lg space-y-2">
                <p>Tidak ada data pejabat atau perkara yang sesuai dengan kombinasi filter ini.</p>
                <button
                  onClick={handleResetFilters}
                  className="px-4 py-2 bg-[#FEF3C7] text-[#92400E] rounded-xl font-bold text-xs border border-[#FDE68A] hover:bg-[#FDE68A] transition-colors"
                >
                  Reset Filter &amp; Tampilkan All-Time
                </button>
              </div>
            ) : (
              paginatedOfficials.map((item, idx) => {
                const statusStyle = getStatusBadgeStyle(item.status_hukum_terkini);
                const isEven = idx % 2 === 0;
                const rowBg = isEven ? 'bg-[#FFFDF8]' : 'bg-[#FAF6EC]';

                return (
                  <div
                    key={item.official_id}
                    className={`${rowBg} p-4 sm:px-6 hover:bg-[#F4EEDC] transition-colors`}
                  >
                    {/* Desktop Layout */}
                    <div className="hidden lg:grid grid-cols-12 gap-3 items-center">
                      <div className="col-span-1 flex items-center">
                        {getRankMedal(item.rank)}
                      </div>

                      <div className="col-span-3">
                        <div className="font-bold text-sm text-[#1E293B]">{item.nama}</div>
                        <div className="text-xs text-[#64748B] truncate">{item.jabatan}</div>
                      </div>

                      <div className="col-span-2">
                        <span className="px-2 py-0.5 bg-[#FEF08A] text-[#854D0E] text-[11px] font-bold rounded-md border border-[#FDE047] whitespace-nowrap inline-block">
                          {item.provinsi}
                        </span>
                        <div className="text-[10px] text-gray-500 mt-0.5">
                          {getProvinceIsland(item.provinsi)}
                        </div>
                      </div>

                      <div className="col-span-1 min-w-0">
                        <span className="text-xs font-semibold text-[#475569] truncate block" title={item.partai}>
                          {item.partai}
                        </span>
                      </div>

                      <div className="col-span-2 text-right">
                        <div className="font-marker text-sm font-bold text-[#EA580C]">
                          {formatRupiah(item.total_kerugian_negara)}
                        </div>
                        <div className="text-[10px] text-gray-500 font-mono">
                          {item.total_kasus} Kasus ({item.tahun_terkini})
                        </div>
                      </div>

                      <div className="col-span-2 flex items-center justify-center">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold border whitespace-nowrap shadow-2xs inline-flex items-center gap-1 ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}>
                          {item.status_hukum_terkini}
                        </span>
                      </div>

                      <div className="col-span-1 text-right">
                        <button
                          onClick={() => {
                            sound.playPop();
                            if (item.case_ids && item.case_ids.length > 0) {
                              onSelectCase(item.case_ids[0]);
                            }
                          }}
                          className="px-3 py-1 bg-white border border-[#CBD5E1] text-[#0284C7] hover:bg-[#E0F2FE] hover:border-[#38BDF8] rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer whitespace-nowrap"
                        >
                          Berkas
                        </button>
                      </div>
                    </div>

                    {/* Mobile Card Layout */}
                    <div className="lg:hidden space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getRankMedal(item.rank)}
                          <span className="font-bold text-base text-[#1E293B]">{item.nama}</span>
                        </div>
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border whitespace-nowrap ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}>
                          {item.status_hukum_terkini}
                        </span>
                      </div>

                      <div className="text-xs text-[#64748B]">{item.jabatan}</div>

                      <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-[#FEF08A] text-[#854D0E] text-[10px] font-bold rounded-md">
                            {item.provinsi}
                          </span>
                          <span className="text-xs text-gray-500 font-semibold">{item.partai}</span>
                        </div>
                        <div className="font-marker text-sm font-bold text-[#EA580C]">
                          {formatRupiah(item.total_kerugian_negara)}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-[#EDE4D0] flex justify-end">
                        <button
                          onClick={() => {
                            sound.playPop();
                            if (item.case_ids && item.case_ids.length > 0) {
                              onSelectCase(item.case_ids[0]);
                            }
                          }}
                          className="px-3 py-1 bg-white border border-[#CBD5E1] text-[#0284C7] rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5" /> Lihat Detail Berkas
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Pagination Footer */}
          <div className="px-6 py-3.5 bg-[#F6F0DF] border-t border-[#E4D7BC] flex flex-wrap items-center justify-between gap-3 text-xs text-[#57534E]">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="font-semibold text-[#78716C]">Tampilkan:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  sound.playPop();
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-white border border-[#D5C9A9] rounded-lg px-2.5 py-1 text-xs font-bold text-[#1E293B] shadow-2xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#D97706]"
              >
                <option value={10}>10 data (Default)</option>
                <option value={25}>25 data</option>
                <option value={50}>50 data</option>
                <option value={100}>100 data</option>
                <option value={9999}>Semua ({sortedOfficials.length})</option>
              </select>

              <span className="text-xs text-[#78716C]">
                Menampilkan <strong>{sortedOfficials.length === 0 ? 0 : (currentPage - 1) * effectivePageSize + 1}</strong> -{' '}
                <strong>{Math.min(sortedOfficials.length, currentPage * effectivePageSize)}</strong> dari <strong>{sortedOfficials.length}</strong> tokoh
              </span>
            </div>

            <div className="flex items-center gap-1.5 ml-auto">
              <button
                disabled={currentPage <= 1}
                onClick={() => {
                  sound.playPop();
                  setCurrentPage(p => p - 1);
                }}
                className="p-1.5 rounded-lg bg-white border border-[#D5C9A9] disabled:opacity-40 hover:bg-[#F4EEDC] cursor-pointer transition-colors"
                title="Halaman Sebelumnya"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2 font-bold font-mono">
                {currentPage} / {totalPages}
              </span>
              <button
                disabled={currentPage >= totalPages}
                onClick={() => {
                  sound.playPop();
                  setCurrentPage(p => p + 1);
                }}
                className="p-1.5 rounded-lg bg-white border border-[#D5C9A9] disabled:opacity-40 hover:bg-[#F4EEDC] cursor-pointer transition-colors"
                title="Halaman Selanjutnya"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>
      )}

      {/* VIEW MODE 2: KLASEMEN PARTAI POLITIK */}
      {viewMode === 'partai' && (
        <div className="bg-[#FFFDF8] border-2 border-[#E7DECB] rounded-3xl overflow-hidden shadow-sm">
          
          <div className="p-4 sm:p-5 bg-[#FBF7ED] border-b border-[#E3D6BC] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Building2 className="w-5 h-5 text-[#D97706]" />
              <h3 className="font-marker text-lg sm:text-xl text-[#1E293B]">
                Klasemen Akumulasi Kerugian Negara per Partai Politik
              </h3>
            </div>
            <span className="text-xs text-[#78716C] font-mono">
              Periode: {selectedPeriod === 'alltime' ? 'All-Time' : `Tahun ${selectedPeriod}`}
            </span>
          </div>

          <div className="divide-y divide-[#F1E8D5]">
            {partyLeaderboard.length === 0 ? (
              <div className="p-12 text-center text-[#78716C] font-hand text-lg">
                Tidak ada data partai pada filter yang dipilih.
              </div>
            ) : (
              partyLeaderboard.map((item, idx) => {
                const rank = idx + 1;
                const percentage = totalFilteredLoss > 0 ? (item.total_kerugian / totalFilteredLoss) * 100 : 0;

                return (
                  <div key={item.partai} className="p-4 sm:p-5 hover:bg-[#F4EEDC] transition-colors space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        {getRankMedal(rank)}
                        <div>
                          <h4 className="font-bold text-base text-[#1E293B]">{item.partai}</h4>
                          <span className="text-xs text-[#64748B]">
                            {item.total_pejabat} Kader Terlibat • {item.total_kasus} Perkara Terverifikasi
                          </span>
                        </div>
                      </div>

                      <div className="text-left sm:text-right">
                        <div className="font-marker text-base sm:text-lg font-bold text-[#DC2626]">
                          {formatRupiah(item.total_kerugian)}
                        </div>
                        <span className="text-[11px] text-[#78716C] font-mono">
                          {percentage.toFixed(1)}% dari total kerugian terfilter
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar of Loss Proportion */}
                    <div className="w-full bg-[#EADBBE] h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-[#EA580C] to-[#DC2626] h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(percentage, 2)}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* VIEW MODE 3: KLASEMEN WILAYAH / PROVINSI */}
      {viewMode === 'wilayah' && (
        <div className="bg-[#FFFDF8] border-2 border-[#E7DECB] rounded-3xl overflow-hidden shadow-sm">
          
          <div className="p-4 sm:p-5 bg-[#FBF7ED] border-b border-[#E3D6BC] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <MapPin className="w-5 h-5 text-[#0284C7]" />
              <h3 className="font-marker text-lg sm:text-xl text-[#1E293B]">
                Klasemen Kerugian Negara per Provinsi
              </h3>
            </div>
            <span className="text-xs text-[#78716C] font-mono">
              Periode: {selectedPeriod === 'alltime' ? 'All-Time' : `Tahun ${selectedPeriod}`}
            </span>
          </div>

          <div className="divide-y divide-[#F1E8D5]">
            {regionLeaderboard.length === 0 ? (
              <div className="p-12 text-center text-[#78716C] font-hand text-lg">
                Tidak ada data provinsi pada filter yang dipilih.
              </div>
            ) : (
              regionLeaderboard.map((item, idx) => {
                const rank = idx + 1;
                const percentage = totalFilteredLoss > 0 ? (item.total_kerugian / totalFilteredLoss) * 100 : 0;

                return (
                  <div key={item.provinsi} className="p-4 sm:p-5 hover:bg-[#F4EEDC] transition-colors space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        {getRankMedal(rank)}
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-base text-[#1E293B]">{item.provinsi}</h4>
                            <span className="text-[10px] font-bold bg-[#E0F2FE] text-[#0369A1] px-2 py-0.5 rounded-full border border-[#BAE6FD]">
                              {item.island}
                            </span>
                          </div>
                          <span className="text-xs text-[#64748B]">
                            {item.total_pejabat} Pejabat • {item.total_kasus} Perkara Terverifikasi
                          </span>
                        </div>
                      </div>

                      <div className="text-left sm:text-right">
                        <div className="font-marker text-base sm:text-lg font-bold text-[#EA580C]">
                          {formatRupiah(item.total_kerugian)}
                        </div>
                        <span className="text-[11px] text-[#78716C] font-mono">
                          {percentage.toFixed(1)}% dari total kerugian
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar of Loss Proportion */}
                    <div className="w-full bg-[#EADBBE] h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-[#0284C7] to-[#DC2626] h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(percentage, 2)}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

    </div>
  );
};
