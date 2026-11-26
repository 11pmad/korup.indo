"use client";

import React, { useState } from 'react';
import { Palette, X, Sparkles, Filter, Check, Eye, EyeOff } from 'lucide-react';
import { sound } from '../utils/audio';

export interface SeverityTier {
  id: string;
  level: string; // 'V', 'IV', 'III', 'II', 'I'
  title: string;
  rangeLabel: string;
  gradient: string;
  textColor: string;
  borderColor: string;
  glowColor: string;
  sampleHex: string;
}

interface WatercolorLadderProps {
  colorMode: 'kerugian' | 'kasus' | 'scrapbook';
  activeTier: string | null;
  hoveredTier: string | null;
  onSelectTier: (tierId: string | null) => void;
  onHoverTier: (tierId: string | null) => void;
  tierCounts: Record<string, number>;
  zoomLevel: number;
}

export const KERUGIAN_TIERS: SeverityTier[] = [
  {
    id: 'critical',
    level: 'V',
    title: 'Sangat Parah',
    rangeLabel: '> Rp 1 Triliun',
    gradient: 'from-[#7F1D1D] via-[#991B1B] to-[#881337]',
    textColor: 'text-white',
    borderColor: '#4C0519',
    glowColor: 'rgba(153, 27, 27, 0.6)',
    sampleHex: '#991B1B'
  },
  {
    id: 'high',
    level: 'IV',
    title: 'Tinggi',
    rangeLabel: 'Rp 200M – 1T',
    gradient: 'from-[#DC2626] via-[#EF4444] to-[#B91C1C]',
    textColor: 'text-white',
    borderColor: '#991B1B',
    glowColor: 'rgba(220, 38, 38, 0.5)',
    sampleHex: '#DC2626'
  },
  {
    id: 'medium',
    level: 'III',
    title: 'Sedang',
    rangeLabel: 'Rp 50M – 200M',
    gradient: 'from-[#EA580C] via-[#F97316] to-[#FB923C]',
    textColor: 'text-white',
    borderColor: '#9A3412',
    glowColor: 'rgba(234, 88, 12, 0.5)',
    sampleHex: '#F97316'
  },
  {
    id: 'low',
    level: 'II',
    title: 'Rendah',
    rangeLabel: '< Rp 50 Miliar',
    gradient: 'from-[#FACC15] via-[#FDE047] to-[#FEF08A]',
    textColor: 'text-[#854D0E]',
    borderColor: '#CA8A04',
    glowColor: 'rgba(234, 179, 8, 0.4)',
    sampleHex: '#FEF08A'
  },
  {
    id: 'none',
    level: 'I',
    title: 'Nihil Catatan',
    rangeLabel: '0 Kasus Terverifikasi',
    gradient: 'from-[#FAF5E8] via-[#F5EED9] to-[#EFE4CB]',
    textColor: 'text-[#78716C]',
    borderColor: '#D7CCA8',
    glowColor: 'rgba(215, 204, 168, 0.4)',
    sampleHex: '#FAF5E8'
  }
];

export const KASUS_TIERS: SeverityTier[] = [
  {
    id: 'critical',
    level: 'V',
    title: 'Sangat Banyak',
    rangeLabel: '≥ 3 Berkas Kasus',
    gradient: 'from-[#1E3A8A] via-[#1E40AF] to-[#2563EB]',
    textColor: 'text-white',
    borderColor: '#172554',
    glowColor: 'rgba(30, 58, 138, 0.6)',
    sampleHex: '#1E3A8A'
  },
  {
    id: 'high',
    level: 'IV',
    title: 'Banyak',
    rangeLabel: '2 Berkas Kasus',
    gradient: 'from-[#2563EB] via-[#3B82F6] to-[#60A5FA]',
    textColor: 'text-white',
    borderColor: '#1D4ED8',
    glowColor: 'rgba(37, 99, 235, 0.5)',
    sampleHex: '#2563EB'
  },
  {
    id: 'medium',
    level: 'III',
    title: 'Sedang',
    rangeLabel: '1 Berkas Kasus',
    gradient: 'from-[#0284C7] via-[#38BDF8] to-[#BAE6FD]',
    textColor: 'text-[#075985]',
    borderColor: '#0369A1',
    glowColor: 'rgba(56, 189, 248, 0.4)',
    sampleHex: '#38BDF8'
  },
  {
    id: 'none',
    level: 'I',
    title: 'Nihil Catatan',
    rangeLabel: '0 Kasus Terverifikasi',
    gradient: 'from-[#FAF5E8] via-[#F5EED9] to-[#EFE4CB]',
    textColor: 'text-[#78716C]',
    borderColor: '#D7CCA8',
    glowColor: 'rgba(215, 204, 168, 0.4)',
    sampleHex: '#FAF5E8'
  }
];

export const ISLAND_TIERS: SeverityTier[] = [
  { id: 'Sumatera', level: '1', title: 'Sumatera', rangeLabel: '10 Provinsi', gradient: 'from-[#86EFAC] via-[#BBF7D0] to-[#DCFCE7]', textColor: 'text-[#166534]', borderColor: '#4ADE80', glowColor: 'rgba(134, 239, 172, 0.4)', sampleHex: '#BBF7D0' },
  { id: 'Jawa', level: '2', title: 'Jawa & Madura', rangeLabel: '6 Provinsi', gradient: 'from-[#FDE047] via-[#FEF08A] to-[#FEF9C3]', textColor: 'text-[#854D0E]', borderColor: '#EAB308', glowColor: 'rgba(253, 224, 71, 0.4)', sampleHex: '#FEF08A' },
  { id: 'Bali & Nusa Tenggara', level: '3', title: 'Bali & Nusa', rangeLabel: '3 Provinsi', gradient: 'from-[#FDBA74] via-[#FED7AA] to-[#FFEDD5]', textColor: 'text-[#9A3412]', borderColor: '#FB923C', glowColor: 'rgba(253, 186, 116, 0.4)', sampleHex: '#FED7AA' },
  { id: 'Kalimantan', level: '4', title: 'Kalimantan', rangeLabel: '5 Provinsi', gradient: 'from-[#6EE7B7] via-[#A7F3D0] to-[#D1FAE5]', textColor: 'text-[#065F46]', borderColor: '#34D399', glowColor: 'rgba(110, 231, 183, 0.4)', sampleHex: '#A7F3D0' },
  { id: 'Sulawesi', level: '5', title: 'Sulawesi', rangeLabel: '6 Provinsi', gradient: 'from-[#7DD3FC] via-[#BAE6FD] to-[#E0F2FE]', textColor: 'text-[#075985]', borderColor: '#38BDF8', glowColor: 'rgba(125, 211, 252, 0.4)', sampleHex: '#BAE6FD' },
  { id: 'Maluku', level: '6', title: 'Maluku', rangeLabel: '2 Provinsi', gradient: 'from-[#D8B4FE] via-[#E9D5FF] to-[#F3E8FF]', textColor: 'text-[#6B21A8]', borderColor: '#C084FC', glowColor: 'rgba(216, 180, 254, 0.4)', sampleHex: '#E9D5FF' },
  { id: 'Papua', level: '7', title: 'Papua', rangeLabel: '6 Provinsi', gradient: 'from-[#FDA4AF] via-[#FECDD3] to-[#FFE4E6]', textColor: 'text-[#9F1239]', borderColor: '#FB7185', glowColor: 'rgba(253, 164, 175, 0.4)', sampleHex: '#FECDD3' },
];

export const WatercolorLadder: React.FC<WatercolorLadderProps> = ({
  colorMode,
  activeTier,
  hoveredTier,
  onSelectTier,
  onHoverTier,
  tierCounts,
  zoomLevel
}) => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  const currentTiers =
    colorMode === 'kerugian'
      ? KERUGIAN_TIERS
      : colorMode === 'kasus'
      ? KASUS_TIERS
      : ISLAND_TIERS;

  const activeOrHovered = hoveredTier || activeTier;

  // Collapsed / Minimized Pill View
  if (isCollapsed) {
    return (
      <div id="watercolor-ladder-collapsed" className="relative z-20">
        <button
          onClick={() => {
            sound.playPop();
            setIsCollapsed(false);
          }}
          className="flex items-center gap-2 bg-[#FFFDF8]/95 hover:bg-white text-[#1E293B] border-2 border-dashed border-[#CA8A04]/60 px-3 py-2 rounded-2xl shadow-md backdrop-blur-md text-xs font-bold transition-all hover:scale-105 active:scale-95 group cursor-pointer"
          title="Tampilkan Legenda Cat Air (Show Legend)"
        >
          <span className="w-5 h-5 rounded-full bg-[#FEF08A] text-[#854D0E] flex items-center justify-center text-xs shadow-2xs rotate-[-6deg] group-hover:rotate-0 transition-transform">
            🎨
          </span>
          <span className="font-marker text-xs">Buka Legenda Peta</span>
          <Eye className="w-3.5 h-3.5 text-[#B45309]" />
          {activeTier && (
            <span className="w-2 h-2 rounded-full bg-[#DC2626] animate-ping" />
          )}
        </button>
      </div>
    );
  }

  return (
    <div
      id="watercolor-ladder-legend"
      className="relative z-20 bg-[#FFFDF8]/95 backdrop-blur-md border-2 border-dashed border-[#CA8A04]/50 rounded-2xl p-3.5 sm:p-4 shadow-lg max-w-[290px] text-xs space-y-2.5 transition-all select-none"
      style={{
        boxShadow: '0 8px 24px -4px rgba(60, 40, 15, 0.15), 0 2px 6px rgba(0,0,0,0.06)'
      }}
    >
      {/* Decorative Washi Tape at Top Corner */}
      <div className="washi-tape washi-tape-yellow -top-2.5 left-8 !h-4 !w-16"></div>

      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-[#F0E5CC] pb-2">
        <div className="flex items-center gap-1.5">
          <span className="w-5 h-5 rounded-full bg-[#FEF08A] text-[#854D0E] flex items-center justify-center text-xs shadow-xs rotate-[-6deg]">
            🎨
          </span>
          <div>
            <h4 className="font-marker text-sm text-[#1E293B] leading-none">
              Tangga Warna Cat Air
            </h4>
            <p className="text-[10px] text-[#78716C] font-hand mt-0.5">
              Tingkat Keparahan Wilayah
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-gray-500 font-mono bg-[#FAF5E8] px-1.5 py-0.5 rounded-md border border-[#EBE1CD]">
            {Math.round(zoomLevel * 100)}%
          </span>
          <button
            onClick={() => {
              sound.playPop();
              setIsCollapsed(true);
            }}
            className="p-1 hover:bg-[#F5EED9] text-[#78716C] hover:text-[#1E293B] rounded-lg transition-colors cursor-pointer flex items-center justify-center"
            title="Sembunyikan Legenda (Hide)"
            aria-label="Sembunyikan Legenda"
          >
            <EyeOff className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Active Filter Announcement & Reset Action */}
      {activeTier && (
        <div className="p-1.5 bg-[#FEF3C7] border border-[#FDE68A] rounded-xl flex items-center justify-between text-[11px] text-[#92400E]">
          <span className="truncate font-semibold flex items-center gap-1">
            <Check className="w-3 h-3 text-[#B45309]" />
            <span>Filter: {currentTiers.find(t => t.id === activeTier)?.title}</span>
          </span>
          <button
            onClick={() => {
              sound.playPop();
              onSelectTier(null);
            }}
            className="text-[10px] font-bold px-1.5 py-0.5 bg-white rounded-md text-[#92400E] hover:bg-amber-100 flex items-center gap-0.5 shrink-0 ml-1 shadow-2xs"
            title="Lepas filter tangga warna"
          >
            <X className="w-3 h-3" /> Reset
          </button>
        </div>
      )}

      {/* Interactive Watercolor Staircase / Ladder Swatches */}
      <div className="space-y-1.5 pt-0.5">
        {currentTiers.map((tier, idx) => {
          const isCurrentActive = activeTier === tier.id;
          const isCurrentHovered = hoveredTier === tier.id;
          const isHighlighted = isCurrentActive || isCurrentHovered;
          const count = tierCounts[tier.id] || 0;

          // Staircase width step effect (from wide at bottom to slightly inset or stepped)
          const stepWidth = 100; // full width for clean legibility

          return (
            <div
              key={tier.id}
              onClick={() => {
                sound.playSticker();
                onSelectTier(isCurrentActive ? null : tier.id);
              }}
              onMouseEnter={() => {
                sound.playPop();
                onHoverTier(tier.id);
              }}
              onMouseLeave={() => {
                onHoverTier(null);
              }}
              className={`group relative cursor-pointer transition-all duration-200 rounded-[7px_13px_6px_11px] p-1.5 sm:p-2 border ${
                isHighlighted
                  ? 'scale-[1.03] shadow-md -translate-y-0.5'
                  : 'hover:scale-[1.015] hover:-translate-y-0.2'
              }`}
              style={{
                width: `${stepWidth}%`,
                borderColor: isHighlighted ? tier.borderColor : '#E7DECB',
                boxShadow: isHighlighted ? `0 4px 12px ${tier.glowColor}` : 'none'
              }}
            >
              {/* Organic Watercolor Bleed Background Layer */}
              <div
                className={`absolute inset-0 rounded-[7px_13px_6px_11px] bg-gradient-to-r ${tier.gradient} opacity-90 transition-opacity`}
                style={{
                  filter: 'contrast(1.05)'
                }}
              ></div>

              {/* Watercolor Texture Stipple Overlay */}
              <div
                className="absolute inset-0 rounded-[7px_13px_6px_11px] opacity-25 pointer-events-none mix-blend-overlay"
                style={{
                  backgroundImage: 'radial-gradient(circle, #000000 0.8px, transparent 0.8px)',
                  backgroundSize: '4px 4px'
                }}
              ></div>

              {/* Content Inside Swatch Step */}
              <div className="relative z-10 flex items-center justify-between gap-2">
                
                {/* Left: Step Level & Title */}
                <div className="flex items-center gap-1.5 min-w-0">
                  {/* Step Roman Tag */}
                  <span
                    className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 shadow-2xs ${
                      tier.textColor.includes('white')
                        ? 'bg-black/30 text-white'
                        : 'bg-black/10 text-stone-800'
                    }`}
                  >
                    {tier.level}
                  </span>

                  <div className="min-w-0 leading-tight">
                    <span className={`block font-bold text-[11px] truncate ${tier.textColor}`}>
                      {tier.title}
                    </span>
                    <span className={`block text-[9.5px] opacity-90 font-mono truncate ${tier.textColor}`}>
                      {tier.rangeLabel}
                    </span>
                  </div>
                </div>

                {/* Right: Province Count Pill & Pin Icon */}
                <div className="flex items-center gap-1 shrink-0">
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold font-mono transition-transform ${
                      tier.textColor.includes('white')
                        ? 'bg-black/25 text-white'
                        : 'bg-amber-900/15 text-stone-800'
                    } ${isHighlighted ? 'scale-110 font-black' : ''}`}
                  >
                    {count} Prov
                  </span>

                  {isCurrentActive && (
                    <span className="text-white text-xs">📌</span>
                  )}
                </div>

              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Helper Note */}
      <div className="pt-1.5 border-t border-[#F0E5CC] text-[10px] text-[#78716C] flex items-center justify-between">
        <span>💡 Arahkan atau klik anak tangga</span>
        <span className="font-hand font-bold text-amber-800">Interaktif</span>
      </div>

    </div>
  );
};
