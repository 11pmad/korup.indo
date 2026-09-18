import React, { useState, useMemo, useRef, useEffect } from 'react';
import { RegionSummary, CorruptionCase } from '../types.js';
import { formatRupiah } from '../utils/formatters.js';
import { sound } from '../utils/audio.js';
import { getOfficialPhoto, handleImageError } from '../utils/photo.js';
import { INDONESIA_PROVINCES_GEO, ProvincePolygon } from '../data/provincesGeo.js';
import { WatercolorLadder } from './WatercolorLadder.js';
import { 
  MapPin, 
  Sparkles, 
  AlertCircle, 
  Eye, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Layers, 
  Search, 
  ChevronRight,
  TrendingUp,
  X,
  ShieldAlert,
  Loader2,
  RefreshCw
} from 'lucide-react';

interface IndonesiaMapProps {
  regions: RegionSummary[];
  cases: CorruptionCase[];
  selectedProvince: string | null;
  onSelectProvince: (province: string | null) => void;
  onSelectCase: (caseId: string) => void;
  onOpenReport?: (provinceName?: string) => void;
}

function normalizeName(name: string): string {
  const n = name.trim().toLowerCase();
  if (n.includes('yogyakarta') || n.includes('jogja')) return 'Daerah Istimewa Yogyakarta';
  if (n.includes('bangka')) return 'Kepulauan Bangka Belitung';
  if (n.includes('jakarta')) return 'DKI Jakarta';
  if (n.includes('aceh')) return 'Aceh';
  return name.trim();
}

export const IndonesiaMap: React.FC<IndonesiaMapProps> = ({
  regions,
  cases,
  selectedProvince,
  onSelectProvince,
  onSelectCase,
  onOpenReport,
}) => {
  const [colorMode, setColorMode] = useState<'kerugian' | 'kasus' | 'scrapbook'>('kerugian');
  const [hoveredProvince, setHoveredProvince] = useState<ProvincePolygon | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [activeLadderTier, setActiveLadderTier] = useState<string | null>(null);
  const [hoveredLadderTier, setHoveredLadderTier] = useState<string | null>(null);

  // Live database fetching state for selected province
  const [liveData, setLiveData] = useState<{
    province: {
      id: string;
      name: string;
      island_cluster: string;
      total_cases: number;
      total_loss_amount: number;
    };
    stats: {
      total_cases: number;
      total_loss_amount: number;
      sector_breakdown: Record<string, number>;
      status_breakdown: Record<string, number>;
    };
    cases: CorruptionCase[];
  } | null>(null);
  const [loadingLive, setLoadingLive] = useState<boolean>(false);

  useEffect(() => {
    if (!selectedProvince) {
      setLiveData(null);
      return;
    }

    let active = true;
    const fetchProvinceLive = async () => {
      setLoadingLive(true);
      try {
        const res = await fetch(`/api/provinces/${encodeURIComponent(selectedProvince)}`);
        if (res.ok) {
          const json = await res.json();
          if (active) {
            setLiveData(json);
          }
        }
      } catch (err) {
        console.error('Gagal mengambil data live provinsi:', err);
      } finally {
        if (active) setLoadingLive(false);
      }
    };

    fetchProvinceLive();
    return () => { active = false; };
  }, [selectedProvince]);

  const svgRef = useRef<SVGSVGElement | null>(null);

  // Map regions lookup by normalized province name
  const regionMap = useMemo(() => {
    const map = new Map<string, RegionSummary>();
    regions.forEach(r => {
      map.set(normalizeName(r.provinsi).toLowerCase(), r);
    });
    return map;
  }, [regions]);

  // Max kerugian and max cases for choropleth scale calculation
  const { maxKerugian, maxKasus } = useMemo(() => {
    let mk = 1;
    let mc = 1;
    regions.forEach(r => {
      if (r.total_kerugian > mk) mk = r.total_kerugian;
      if (r.total_kasus > mc) mc = r.total_kasus;
    });
    return { maxKerugian: mk, maxKasus: mc };
  }, [regions]);

  // Helper to determine severity tier ID for any province polygon
  const getProvinceTierId = (prov: ProvincePolygon): string => {
    const summary = regionMap.get(normalizeName(prov.name).toLowerCase());
    if (colorMode === 'scrapbook') {
      return prov.island;
    }
    if (!summary || summary.total_kasus === 0) {
      return 'none';
    }
    if (colorMode === 'kerugian') {
      const ratio = Math.min(1, summary.total_kerugian / (maxKerugian * 0.75));
      if (ratio > 0.8) return 'critical';
      if (ratio > 0.5) return 'high';
      if (ratio > 0.25) return 'medium';
      return 'low';
    }
    if (colorMode === 'kasus') {
      const ratio = summary.total_kasus / maxKasus;
      if (ratio > 0.75) return 'critical';
      if (ratio > 0.45) return 'high';
      if (ratio > 0.2) return 'medium';
      return 'low';
    }
    return 'none';
  };

  // Precompute how many provinces belong to each tier
  const tierCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    INDONESIA_PROVINCES_GEO.forEach(p => {
      const tier = getProvinceTierId(p);
      counts[tier] = (counts[tier] || 0) + 1;
    });
    return counts;
  }, [regionMap, colorMode, maxKerugian, maxKasus]);

  // Cases for currently selected province (prioritizing live PostgreSQL database data)
  const selectedProvinceCases = useMemo(() => {
    if (!selectedProvince) return [];
    if (liveData && Array.isArray(liveData.cases)) {
      return liveData.cases;
    }
    const norm = normalizeName(selectedProvince).toLowerCase();
    return cases.filter(c => {
      const caseProv = c.official?.provinsi || c.province_name || '';
      return normalizeName(caseProv).toLowerCase() === norm;
    });
  }, [cases, selectedProvince, liveData]);

  // Sort provinces so hovered, selected, and active ladder matches are rendered last (on top in SVG layer stack)
  const sortedProvinces = useMemo(() => {
    const effectiveTier = hoveredLadderTier || activeLadderTier;
    return [...INDONESIA_PROVINCES_GEO].sort((a, b) => {
      if (a.name === selectedProvince) return 1;
      if (b.name === selectedProvince) return -1;
      if (a.name === hoveredProvince?.name) return 1;
      if (b.name === hoveredProvince?.name) return -1;
      if (effectiveTier) {
        const aMatch = getProvinceTierId(a) === effectiveTier;
        const bMatch = getProvinceTierId(b) === effectiveTier;
        if (aMatch && !bMatch) return 1;
        if (!aMatch && bMatch) return -1;
      }
      return 0;
    });
  }, [selectedProvince, hoveredProvince, hoveredLadderTier, activeLadderTier, colorMode, regionMap, maxKerugian, maxKasus]);

  // Get color for a province polygon
  const getProvinceFill = (prov: ProvincePolygon, isSelected: boolean, isHovered: boolean) => {
    if (isSelected) return '#DC2626'; // Bold red for selected
    if (isHovered) return '#F97316';  // Bright orange on hover

    const summary = regionMap.get(normalizeName(prov.name).toLowerCase());

    if (colorMode === 'scrapbook') {
      return prov.defaultColor;
    }

    if (!summary || summary.total_kasus === 0) {
      return '#FAF5E8'; // Very light cream paper for 0 cases
    }

    if (colorMode === 'kerugian') {
      const ratio = Math.min(1, summary.total_kerugian / (maxKerugian * 0.75));
      if (ratio > 0.8) return '#991B1B'; // Dark ink crimson
      if (ratio > 0.5) return '#DC2626'; // Vivid crimson
      if (ratio > 0.25) return '#F97316'; // Vivid orange
      if (ratio > 0.08) return '#FBBF24'; // Warm amber
      return '#FEF08A'; // Soft butter yellow
    }

    if (colorMode === 'kasus') {
      const ratio = summary.total_kasus / maxKasus;
      if (ratio > 0.75) return '#1E3A8A'; // Deep navy
      if (ratio > 0.45) return '#2563EB'; // Royal blue
      if (ratio > 0.2) return '#38BDF8';  // Bright cyan
      return '#BAE6FD'; // Light sky blue
    }

    return prov.defaultColor;
  };

  const handleZoom = (delta: number) => {
    sound.playPop();
    setZoomLevel(prev => Math.min(3.5, Math.max(0.8, prev + delta)));
  };

  const handleReset = () => {
    sound.playPop();
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
    onSelectProvince(null);
    setActiveLadderTier(null);
    setHoveredLadderTier(null);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPanOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const filteredProvinces = INDONESIA_PROVINCES_GEO;

  const selectedSummary = useMemo(() => {
    if (!selectedProvince) return null;
    if (liveData && liveData.province) {
      return {
        provinsi: liveData.province.name,
        total_kasus: liveData.province.total_cases,
        total_kerugian: liveData.province.total_loss_amount,
        island_group: liveData.province.island_cluster
      };
    }
    return regionMap.get(normalizeName(selectedProvince).toLowerCase()) || null;
  }, [selectedProvince, liveData, regionMap]);

  return (
    <div id="peta-nusantara-section" className="space-y-6">
      
      {/* Map Control Header Card */}
      <div className="relative bg-[#FFFDF9] border-2 border-[#E7DECB] rounded-3xl p-5 sm:p-7 shadow-sm space-y-4">
        <div className="washi-tape washi-tape-yellow -top-3 left-10"></div>
        <div className="washi-tape washi-tape-blue -top-3 right-10"></div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-marker text-2xl sm:text-3xl text-[#1E293B]">
                Peta Korupsi 38 Provinsi Nusantara
              </h2>

            </div>
            <p className="text-xs sm:text-sm text-[#64748B] mt-0.5">
              Visualisasi sebaran kasus korupsi di 38 provinsi berdasarkan data berkas perkara peradilan resmi.
            </p>
          </div>

          {/* Choropleth Switcher Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-[#57534E] flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-[#EA580C]" /> Mode Pewarnaan:
            </span>
            <div className="flex items-center bg-[#FAF5E8] p-1 rounded-2xl border border-[#D5C9AB] gap-1">
              <button
                onClick={() => {
                  sound.playPop();
                  setColorMode('kerugian');
                }}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                  colorMode === 'kerugian'
                    ? 'bg-[#DC2626] text-white shadow-xs'
                    : 'text-[#57534E] hover:bg-[#F2E8D3]'
                }`}
              >
                💰 Nilai Kerugian
              </button>
              <button
                onClick={() => {
                  sound.playPop();
                  setColorMode('kasus');
                }}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                  colorMode === 'kasus'
                    ? 'bg-[#0284C7] text-white shadow-xs'
                    : 'text-[#57534E] hover:bg-[#F2E8D3]'
                }`}
              >
                📊 Jumlah Kasus
              </button>
              <button
                onClick={() => {
                  sound.playPop();
                  setColorMode('scrapbook');
                }}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                  colorMode === 'scrapbook'
                    ? 'bg-[#16A34A] text-white shadow-xs'
                    : 'text-[#57534E] hover:bg-[#F2E8D3]'
                }`}
              >
                🎨 Kertas Pulau
              </button>
            </div>
          </div>
        </div>

        {/* Province Quick Jump */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-end gap-3 pt-2 border-t border-[#F1EBD9]">
          
          {/* Search Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#57534E] flex items-center gap-1">
              <Search className="w-3.5 h-3.5 text-[#DC2626]" /> Cari / Sorot Provinsi:
            </span>
            <select
              value={selectedProvince || ''}
              onChange={e => {
                sound.playPop();
                onSelectProvince(e.target.value || null);
              }}
              className="bg-[#FAF5E8] border border-[#D5C9AB] rounded-xl px-3 py-1.5 text-xs font-bold text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#DC2626]"
            >
              <option value="">-- Sorot Provinsi --</option>
              {INDONESIA_PROVINCES_GEO.map(p => (
                <option key={p.name} value={p.name}>
                  {p.name} ({regionMap.get(normalizeName(p.name).toLowerCase())?.total_kasus || 0} kasus)
                </option>
              ))}
            </select>
            {selectedProvince && (
              <button
                onClick={() => onSelectProvince(null)}
                className="p-1.5 bg-[#FEE2E2] text-[#991B1B] rounded-xl hover:bg-[#FECACA] cursor-pointer"
                title="Hapus pilihan"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

        </div>

      </div>

      {/* Main Interactive Map Canvas */}
      <div className="relative bg-[#FFFDF9] border-2 border-[#E7DECB] rounded-3xl p-3 sm:p-6 shadow-md overflow-hidden select-none">
        
        {/* Scrapbook corner tapes */}
        <div className="washi-tape washi-tape-pink -top-3 left-16"></div>
        <div className="washi-tape washi-tape-green -top-3 right-16"></div>

        {/* Ocean background pattern & coordinate lines */}
        <div className="absolute inset-0 bg-[#F9F7EE] opacity-60 pointer-events-none"></div>

        {/* Zoom & Pan Toolbar */}
        <div className="absolute top-6 left-6 z-20 flex flex-col gap-1.5 bg-[#FFFDF8] border border-[#D5C9AB] p-1.5 rounded-2xl shadow-md">
          <button
            onClick={() => handleZoom(0.25)}
            className="p-2 hover:bg-[#FAF5E8] text-[#1E293B] rounded-xl transition-colors"
            title="Perbesar Peta (+)"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleZoom(-0.25)}
            className="p-2 hover:bg-[#FAF5E8] text-[#1E293B] rounded-xl transition-colors"
            title="Perkecil Peta (-)"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={handleReset}
            className="p-2 hover:bg-[#FAF5E8] text-[#1E293B] rounded-xl transition-colors border-t border-[#EAE0CD]"
            title="Reset Posisi (1x)"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Watercolor Ladder Visual Legend Overlay */}
        <div className="absolute bottom-4 sm:bottom-6 left-4 sm:left-6 z-20">
          <WatercolorLadder
            colorMode={colorMode}
            activeTier={activeLadderTier}
            hoveredTier={hoveredLadderTier}
            onSelectTier={(tierId) => {
              setActiveLadderTier(tierId);
            }}
            onHoverTier={(tierId) => {
              setHoveredLadderTier(tierId);
            }}
            tierCounts={tierCounts}
            zoomLevel={zoomLevel}
          />
        </div>

        {/* SVG Viewport */}
        <div 
          className={`w-full overflow-hidden cursor-${isDragging ? 'grabbing' : 'grab'}`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <svg
            ref={svgRef}
            viewBox="0 0 1100 480"
            className="w-full h-auto min-h-[360px] sm:min-h-[480px] transition-transform duration-75"
            style={{
              transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
              transformOrigin: 'center center'
            }}
          >
            <defs>
              {/* Default Flat Cutout Paper Shadow */}
              <filter id="paperShadow" x="-25%" y="-25%" width="150%" height="150%">
                <feDropShadow dx="0.6" dy="1.8" stdDeviation="1.5" floodColor="#3B2F1D" floodOpacity="0.22" />
              </filter>

              {/* Hover: Paper Lifted Up with deeper, softer paper shadow */}
              <filter id="hoverLiftedShadow" x="-50%" y="-50%" width="200%" height="200%">
                <feDropShadow dx="1.5" dy="8" stdDeviation="5.5" floodColor="#261A0C" floodOpacity="0.36" />
                <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="#EA580C" floodOpacity="0.3" />
              </filter>

              {/* Selected: Strongly Lifted & Tacked with warm crimson glow and deep paper drop shadow */}
              <filter id="selectedLiftedShadow" x="-60%" y="-60%" width="220%" height="220%">
                <feDropShadow dx="2" dy="12" stdDeviation="7" floodColor="#1C1208" floodOpacity="0.46" />
                <feDropShadow dx="0" dy="0" stdDeviation="3.5" floodColor="#DC2626" floodOpacity="0.5" />
              </filter>

              {/* Active Ladder Highlight: Warm watercolor aura drop shadow */}
              <filter id="activeLadderShadow" x="-50%" y="-50%" width="200%" height="200%">
                <feDropShadow dx="1" dy="6" stdDeviation="4.5" floodColor="#B45309" floodOpacity="0.4" />
                <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#F59E0B" floodOpacity="0.55" />
              </filter>

              {/* Dotted pattern for ocean */}
              <pattern id="scrapDots" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="0.8" fill="#E4DAC1" />
              </pattern>
            </defs>

            {/* Ocean Texture */}
            <rect x="0" y="0" width="1100" height="480" fill="url(#scrapDots)" />

            {/* Equator & Meridian Guide Lines (Scrapbook Pencil Style) */}
            <line x1="20" y1="216" x2="1080" y2="216" stroke="#DCD3BA" strokeWidth="1" strokeDasharray="6 6" />
            <text x="35" y="210" fill="#9E947B" fontSize="9" fontFamily="Patrick Hand">Khatulistiwa (0° Lat)</text>

            {/* Render 38 Individual Province Polygons (Sorted so active/hovered floats on top) */}
            <g id="provinces-layer">
              {sortedProvinces.map(prov => {
                const isSelected = selectedProvince === prov.name;
                const isHovered = hoveredProvince?.name === prov.name;
                const fill = getProvinceFill(prov, isSelected, isHovered);
                const summary = regionMap.get(normalizeName(prov.name).toLowerCase());
                const hasCases = summary && summary.total_kasus > 0;

                const provTier = getProvinceTierId(prov);
                const effectiveLadderTier = hoveredLadderTier || activeLadderTier;
                const isMatchingLadder = !effectiveLadderTier || provTier === effectiveLadderTier;

                const transformStyle = isSelected
                  ? 'scale(1.08) translate(0px, -6px)'
                  : isHovered
                  ? 'scale(1.05) translate(0px, -3px)'
                  : effectiveLadderTier && isMatchingLadder
                  ? 'scale(1.04) translate(0px, -3px)'
                  : 'scale(1) translate(0px, 0px)';

                const filterEffect = isSelected
                  ? 'url(#selectedLiftedShadow)'
                  : isHovered
                  ? 'url(#hoverLiftedShadow)'
                  : effectiveLadderTier && isMatchingLadder
                  ? 'url(#activeLadderShadow)'
                  : 'url(#paperShadow)';

                const opacityStyle = effectiveLadderTier
                  ? isMatchingLadder ? 1 : 0.22
                  : 1;

                return (
                  <g
                    key={prov.name}
                    className="province-group cursor-pointer"
                    style={{
                      transform: transformStyle,
                      transformOrigin: `${prov.cx}px ${prov.cy}px`,
                      transition: 'transform 0.28s cubic-bezier(0.34, 1.56, 0.64, 1), filter 0.28s ease, opacity 0.25s ease',
                      filter: filterEffect,
                      opacity: opacityStyle,
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      sound.playSticker();
                      onSelectProvince(prov.name === selectedProvince ? null : prov.name);
                    }}
                    onMouseEnter={() => {
                      sound.playPop();
                      setHoveredProvince(prov);
                    }}
                    onMouseLeave={() => {
                      if (hoveredProvince?.name === prov.name) {
                        setHoveredProvince(null);
                      }
                    }}
                  >
                    <path
                      d={prov.path}
                      fill={fill}
                      stroke={isSelected ? '#7F1D1D' : isHovered ? '#C2410C' : '#6B5E45'}
                      strokeWidth={isSelected ? 2.5 : isHovered ? 2.2 : 1}
                      strokeDasharray={isSelected ? 'none' : isHovered ? 'none' : '4 2'}
                      strokeLinejoin="round"
                      strokeLinecap="round"
                      className="transition-colors duration-150"
                    />

                    {/* Cute mini washi tape tacked when selected */}
                    {isSelected && prov.cx > 0 && prov.cy > 0 && (
                      <g
                        transform={`translate(${prov.cx - 16}, ${prov.cy - 18})`}
                        className="pointer-events-none"
                      >
                        <rect
                          width="32"
                          height="9"
                          rx="2"
                          fill="#FDE047"
                          stroke="#CA8A04"
                          strokeWidth="0.8"
                          opacity="0.95"
                          transform="rotate(-5 16 4.5)"
                        />
                        <circle cx="16" cy="4.5" r="2.2" fill="#DC2626" />
                      </g>
                    )}

                    {/* Hover subtle glowing tactile ring if not selected */}
                    {isHovered && !isSelected && prov.cx > 0 && prov.cy > 0 && (
                      <circle
                        cx={prov.cx}
                        cy={prov.cy}
                        r="3.5"
                        fill="#EA580C"
                        stroke="#FFFFFF"
                        strokeWidth="1.2"
                        className="pointer-events-none animate-pulse"
                      />
                    )}

                    {/* Small Landmark Pushpin if province has cases */}
                    {hasCases && !isSelected && prov.cx > 0 && prov.cy > 0 && (
                      <g
                        transform={`translate(${prov.cx}, ${prov.cy})`}
                        className="pointer-events-none"
                      >
                        {/* Little pushpin head */}
                        <circle cx="0" cy="0" r="5" fill="#DC2626" stroke="#FFFFFF" strokeWidth="1.5" />
                        <circle cx="-1.5" cy="-1.5" r="1.5" fill="#FFFFFF" opacity="0.8" />
                        {/* Number of cases badge */}
                        <rect x="-8" y="-18" width="16" height="11" rx="4" fill="#1E293B" />
                        <text
                          x="0"
                          y="-10"
                          textAnchor="middle"
                          fill="#FFFFFF"
                          fontSize="8"
                          fontWeight="bold"
                          fontFamily="sans-serif"
                        >
                          {summary.total_kasus}
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}
            </g>

            {/* Labels for Major Regions in Scrapbook Marker Style */}
            <g id="region-labels" className="pointer-events-none select-none">
              <text x="110" y="160" fill="#786D58" fontSize="13" fontFamily="Patrick Hand" fontWeight="bold">Sumatera</text>
              <text x="330" y="380" fill="#786D58" fontSize="13" fontFamily="Patrick Hand" fontWeight="bold">Jawa</text>
              <text x="440" y="210" fill="#786D58" fontSize="13" fontFamily="Patrick Hand" fontWeight="bold">Kalimantan</text>
              <text x="630" y="240" fill="#786D58" fontSize="13" fontFamily="Patrick Hand" fontWeight="bold">Sulawesi</text>
              <text x="540" y="425" fill="#786D58" fontSize="11" fontFamily="Patrick Hand">Bali &amp; Nusa</text>
              <text x="800" y="220" fill="#786D58" fontSize="12" fontFamily="Patrick Hand">Maluku</text>
              <text x="960" y="270" fill="#786D58" fontSize="13" fontFamily="Patrick Hand" fontWeight="bold">Papua</text>
            </g>
          </svg>
        </div>

        {/* Fixed Top-Right Province Detail Card on Hover */}
        {hoveredProvince && (
          <div
            id="fixed-map-hover-card"
            className="absolute top-4 sm:top-6 right-4 sm:right-6 z-30 pointer-events-none bg-[#FFFDF8]/95 backdrop-blur-md border-2 border-[#D5C9AB] rounded-2xl p-3.5 sm:p-4 shadow-xl w-64 sm:w-72 max-w-[calc(100%-3rem)] transition-all duration-200 animate-in fade-in zoom-in-95 space-y-2 select-none"
            style={{
              boxShadow: '0 8px 24px -4px rgba(60, 40, 15, 0.2), 0 2px 6px rgba(0,0,0,0.06)'
            }}
          >
            <div className="washi-tape washi-tape-yellow -top-2.5 right-6 !h-4 !w-16"></div>

            {/* Header: Province Name & Island Tag */}
            <div className="flex items-center justify-between gap-2 border-b border-[#F0E6D0] pb-1.5">
              <div className="min-w-0">
                <span className="text-[10px] text-[#78716C] font-hand block leading-none mb-0.5">
                  Sorot Wilayah
                </span>
                <h4 className="font-marker text-base sm:text-lg text-[#1E293B] truncate leading-tight">
                  {hoveredProvince.name}
                </h4>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-[#FEF3C7] text-[#92400E] rounded-full shrink-0 border border-[#FDE68A]">
                {hoveredProvince.island}
              </span>
            </div>

            {(() => {
              const sum = regionMap.get(normalizeName(hoveredProvince.name).toLowerCase());
              if (!sum || sum.total_kasus === 0) {
                return (
                  <div className="py-1">
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200">
                      🌿 Belum Ada Kasus Terverifikasi
                    </span>
                    <p className="text-[11px] text-gray-500 italic mt-1 leading-snug">
                      Belum ada data perkara korupsi yang terverifikasi di database untuk provinsi ini.
                    </p>
                  </div>
                );
              }

              const tierId = getProvinceTierId(hoveredProvince);
              const tierBadge = 
                tierId === 'critical' ? { label: 'Tingkat Kritis (> Rp 1T)', color: 'bg-rose-100 text-rose-800 border-rose-200' } :
                tierId === 'high' ? { label: 'Tingkat Tinggi', color: 'bg-red-100 text-red-800 border-red-200' } :
                tierId === 'medium' ? { label: 'Tingkat Sedang', color: 'bg-amber-100 text-amber-800 border-amber-200' } :
                { label: 'Tingkat Rendah', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' };

              return (
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Jumlah Kasus:</span>
                    <span className="font-bold text-[#1E293B] bg-[#FAF5E8] px-2 py-0.5 rounded-md border border-[#E7DECB]">
                      {sum.total_kasus} Perkara
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Total Kerugian:</span>
                    <span className="font-marker font-bold text-sm text-[#DC2626]">
                      {formatRupiah(sum.total_kerugian)}
                    </span>
                  </div>
                  <div className="pt-1 flex items-center justify-between border-t border-[#F0E6D0]">
                    <span className={`text-[9.5px] font-bold px-1.5 py-0.5 rounded-md border ${tierBadge.color}`}>
                      {tierBadge.label}
                    </span>
                    <span className="text-[10px] text-blue-600 font-bold">
                      👆 Klik untuk buka berkas
                    </span>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

      </div>

      {/* Selected Province Cases Bottom Panel */}
      {selectedProvince && (
        <div className="relative bg-[#FFFDF8] border-3 border-[#E7DECB] rounded-3xl p-6 sm:p-8 shadow-md space-y-6">
          <div className="washi-tape washi-tape-pink -top-3 left-12"></div>
          <div className="washi-tape washi-tape-yellow -top-3 right-12"></div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#EAE0CD] gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-2xl">📍</span>
                <h3 className="font-marker text-2xl sm:text-3xl text-[#1E293B]">
                  Berkas Perkara di Provinsi {selectedProvince}
                </h3>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-full text-[11px] font-bold shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>Data Terverifikasi</span>
                </span>
                {loadingLive && (
                  <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 font-semibold bg-slate-100 px-2 py-0.5 rounded-full">
                    <Loader2 className="w-3 h-3 animate-spin text-amber-600" />
                    <span>Sinkronisasi...</span>
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-[#64748B] mt-0.5">
                Ditemukan <strong>{selectedProvinceCases.length}</strong> perkara tercatat dengan total akumulasi kerugian negara{' '}
                <span className="font-marker text-[#DC2626] font-bold">
                  {formatRupiah(selectedSummary?.total_kerugian || 0)}
                </span>
              </p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              {onOpenReport && (
                <button
                  onClick={() => {
                    sound.playPop();
                    onOpenReport(selectedProvince);
                  }}
                  className="px-3.5 py-1.5 bg-[#DC2626] hover:bg-[#B91C1C] text-white rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
                  title="Usulkan kasus korupsi baru di provinsi ini"
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>+ Usul Kasus di {selectedProvince}</span>
                </button>
              )}
              <button
                onClick={() => onSelectProvince(null)}
                className="px-3.5 py-1.5 bg-[#F4EDE0] text-[#44403C] hover:bg-[#E8DDC6] rounded-xl text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
              >
                <X className="w-4 h-4" /> Tutup
              </button>
            </div>
          </div>

          {/* List of cases in selected province */}
          {loadingLive ? (
            <div className="py-12 text-center bg-[#FAF5E8] rounded-2xl border-2 border-dashed border-[#E3D7BD] space-y-3">
              <Loader2 className="w-8 h-8 text-amber-600 animate-spin mx-auto" />
              <p className="font-hand text-base text-slate-700 font-bold">
                Memuat berkas perkara peradilan...
              </p>
            </div>
          ) : selectedProvinceCases.length === 0 ? (
            <div className="p-8 text-center bg-[#FAF5E8] rounded-3xl border-2 border-dashed border-[#E3D7BD] space-y-3">
              <div className="text-3xl">🌿</div>
              <h4 className="font-bold text-base text-slate-800 font-sans">
                Belum Ada Berkas Kasus yang Tercatat di {selectedProvince}
              </h4>
              <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                Basis data LKI belum mencatat berkas perkara peradilan resmi berkekuatan hukum tetap untuk wilayah {selectedProvince}. Anda mengetahui adanya dugaan kasus yang sudah terbit di media massa atau direktori putusan pengadilan?
              </p>
              {onOpenReport && (
                <button
                  onClick={() => {
                    sound.playPop();
                    onOpenReport(selectedProvince);
                  }}
                  className="px-4 py-2 bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-bold rounded-xl shadow-sm transition-all inline-flex items-center gap-2 cursor-pointer"
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Usulkan Berkas Kasus Baru di {selectedProvince}</span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {selectedProvinceCases.map((item, idx) => (
                <div
                  key={item.id}
                  onClick={() => {
                    sound.playSticker();
                    onSelectCase(item.id);
                  }}
                  className={`polaroid-card cursor-pointer group hover:scale-[1.02] transition-transform ${
                    idx % 2 === 0 ? 'rotate-[-0.8deg]' : 'rotate-[0.8deg]'
                  }`}
                >
                  <div className="washi-tape washi-tape-yellow -top-2 left-8"></div>
                  
                  <div className="space-y-2.5 pt-2">
                    <div className="flex items-start gap-3">
                      <img
                        src={getOfficialPhoto(item.official?.foto_url)}
                        alt={item.official?.nama || 'Foto Pejabat'}
                        referrerPolicy="no-referrer"
                        onError={handleImageError}
                        className="w-14 h-14 rounded-xl object-cover border border-[#E2D6B8] shrink-0 bg-[#F5EFE1]"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between text-[10px] font-mono text-gray-500 font-bold">
                          <span>{item.tahun_putusan || item.tahun_kejadian}</span>
                          <span className="px-1.5 py-0.2 bg-[#FEF08A] text-[#854D0E] rounded-md uppercase">
                            {item.official?.kota_kabupaten || selectedProvince}
                          </span>
                        </div>
                        <h4 className="font-bold text-sm text-[#1E293B] truncate group-hover:text-[#0284C7] transition-colors mt-0.5">
                          {item.official?.nama}
                        </h4>
                        <p className="text-[11px] text-[#64748B] truncate">
                          {item.official?.jabatan}
                        </p>
                      </div>
                    </div>

                    <div className="p-2 bg-[#FFF7ED] border border-[#FDBA74] rounded-xl flex items-center justify-between">
                      <span className="text-[10px] font-bold text-[#C2410C]">Kerugian/Suap:</span>
                      <span className="font-marker text-xs font-bold text-[#EA580C]">
                        {formatRupiah(item.nilai_kerugian_negara)}
                      </span>
                    </div>

                    <p className="text-xs text-[#475569] line-clamp-2 leading-relaxed">
                      {item.ringkasan_kasus}
                    </p>

                    <div className="pt-2 border-t border-[#F1EBD9] flex items-center justify-between text-xs">
                      <span className="font-bold text-[10px] px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                        {item.status_hukum}
                      </span>
                      <span className="text-[#0284C7] font-bold group-hover:underline flex items-center gap-1 text-[11px]">
                        <Eye className="w-3 h-3" /> Berkas Lengkap
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      )}

    </div>
  );
};
