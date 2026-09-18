import React, { useState, useMemo } from 'react';
import { StatsOverview, CorruptionCase } from '../types.js';
import { formatRupiah } from '../utils/formatters.js';
import { sound } from '../utils/audio.js';
import { getOfficialPhoto, handleImageError } from '../utils/photo.js';
import { 
  Trophy, 
  MapPin, 
  Search, 
  BarChart3, 
  ShieldAlert, 
  ArrowRight, 
  Flame, 
  Scale, 
  Building2,
  ExternalLink,
  BookOpen,
  Sparkles,
  Calendar
} from 'lucide-react';

interface LandingPageProps {
  stats: StatsOverview | null;
  cases: CorruptionCase[];
  onNavigate: (tab: 'peta' | 'klasemen' | 'statistik' | 'cari' | 'admin') => void;
  onSelectCase: (caseId: string) => void;
  onOpenReport: (mode?: 'new_case' | 'correction' | 'track') => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  stats,
  cases,
  onNavigate,
  onSelectCase,
  onOpenReport
}) => {
  type EraFilterMode = 'prabowo' | 'recent_years';
  const [selectedEraFilter, setSelectedEraFilter] = useState<EraFilterMode>('prabowo');

  // Filter cases strictly for the latest era / current years (data akurat terverifikasi)
  const activeCases = useMemo(() => {
    return cases.filter(c => {
      const year = c.tahun_kejadian || (c.sources?.[0]?.tanggal_publikasi ? new Date(c.sources[0].tanggal_publikasi).getFullYear() : 0);
      if (selectedEraFilter === 'prabowo') {
        return c.era_id === 'era-prabowo' || (c as any).era_name?.toLowerCase().includes('prabowo');
      }
      // 'recent_years' -> Tahun 2024 - sekarang
      return (c.era_id === 'era-prabowo') || (year >= 2024);
    });
  }, [cases, selectedEraFilter]);

  // Dynamic calculations based on activeCases
  const totalLoss = useMemo(() => {
    return activeCases.reduce((acc, c) => acc + (c.nilai_kerugian_negara || 0), 0);
  }, [activeCases]);

  const totalCases = activeCases.length;

  const affectedProvinces = useMemo(() => {
    const provSet = new Set<string>();
    activeCases.forEach(c => {
      if (c.official?.provinsi && c.official.provinsi !== '-') {
        provSet.add(c.official.provinsi);
      }
    });
    return provSet.size;
  }, [activeCases]);

  // Top 3 Hall of Shame strictly from activeCases
  const top3 = useMemo(() => {
    return activeCases
      .slice()
      .sort((a, b) => b.nilai_kerugian_negara - a.nilai_kerugian_negara)
      .slice(0, 3);
  }, [activeCases]);

  return (
    <div className="space-y-10 animate-in fade-in duration-300">
      {/* Hero Section */}
      <section className="relative bg-[#FFFDF9] border-3 border-[#E7DECB] rounded-3xl p-6 sm:p-10 shadow-md overflow-hidden">
        {/* Washi Tapes */}
        <div className="washi-tape washi-tape-yellow -top-3 left-10"></div>
        <div className="washi-tape washi-tape-pink -top-3 right-10"></div>

        <div className="max-w-4xl mx-auto text-center space-y-5">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-[#FEF3C7] border border-[#FDE68A] text-[#92400E] rounded-full text-xs font-bold uppercase tracking-wider shadow-2xs">
            <Scale className="w-3.5 h-3.5 text-[#D97706]" />
            <span>Portal Edukasi &amp; Transparansi Hukum Terbuka</span>
          </div>

          <h1 className="font-marker text-4xl sm:text-5xl lg:text-6xl text-[#1E293B] leading-tight">
            LIGA KORUPSI <span className="text-[#DC2626]">INDONESIA</span>
          </h1>

          <p className="text-base sm:text-lg text-[#57534E] leading-relaxed max-w-2xl mx-auto font-sans">
            Mengemas data perkara korupsi bersumber dari putusan pengadilan berkekuatan hukum tetap (inkrah),
            dakwaan resmi, dan audit negara ke dalam format klasemen liga &amp; peta spasial interaktif.
          </p>

          {/* Primary Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
            <button
              onClick={() => {
                sound.playPop();
                onNavigate('klasemen');
              }}
              className="px-6 py-3 bg-[#DC2626] hover:bg-[#B91C1C] text-white font-bold rounded-2xl text-sm shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer border border-[#991B1B]"
            >
              <Trophy className="w-4 h-4 text-[#FDE047]" />
              <span>Lihat Klasemen Liga</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                sound.playPop();
                onNavigate('peta');
              }}
              className="px-6 py-3 bg-[#0284C7] hover:bg-[#0369A1] text-white font-bold rounded-2xl text-sm shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer border border-[#075985]"
            >
              <MapPin className="w-4 h-4 text-[#BAE6FD]" />
              <span>Jelajahi Peta Spasial</span>
            </button>

            <button
              onClick={() => {
                sound.playPop();
                onNavigate('cari');
              }}
              className="px-5 py-3 bg-[#FAF5E8] hover:bg-[#EFE5D3] text-[#44403C] font-bold rounded-2xl text-sm border-2 border-[#D5C9AB] transition-all flex items-center gap-2 cursor-pointer"
            >
              <Search className="w-4 h-4 text-[#78716C]" />
              <span>Cari Kasus</span>
            </button>
          </div>
        </div>
      </section>

      {/* Focused Era Selector & Accuracy Notice */}
      <div className="bg-[#FFFDF8] border-2 border-[#E7DECB] rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-500/20">
            <Sparkles className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-[#1E293B]">
                Fokus Data Akurat Terverifikasi:
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                ✓ Era Terkini
              </span>
            </div>
            <p className="text-[11px] text-[#78716C] leading-snug">
              Halaman ini difokuskan hanya menampilkan data era terbaru yang telah terverifikasi berkasnya secara akurat.
            </p>
          </div>
        </div>

        {/* Filter Toggle Pills */}
        <div className="flex items-center gap-1.5 bg-[#F5F0E6] p-1 rounded-xl border border-[#E7DECB] shrink-0">
          <button
            type="button"
            onClick={() => {
              sound.playPop();
              setSelectedEraFilter('prabowo');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              selectedEraFilter === 'prabowo'
                ? 'bg-[#DC2626] text-white shadow-xs'
                : 'text-[#78716C] hover:text-[#1E293B]'
            }`}
          >
            🇮🇩 Era Terbaru (2024 - Sekarang)
          </button>
          <button
            type="button"
            onClick={() => {
              sound.playPop();
              setSelectedEraFilter('recent_years');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              selectedEraFilter === 'recent_years'
                ? 'bg-[#DC2626] text-white shadow-xs'
                : 'text-[#78716C] hover:text-[#1E293B]'
            }`}
          >
            📅 Tahun 2024 - 2025
          </button>
        </div>
      </div>

      {/* Ringkasan Angka Besar (Big Numbers Strip - Filtered Era) */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="relative bg-[#FFFDF8] border-2 border-[#E7DECB] rounded-3xl p-6 text-center shadow-xs space-y-1">
          <div className="washi-tape washi-tape-purple -top-2 left-6"></div>
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
            Total Kerugian Terakumulasi
          </span>
          <div className="font-marker text-3xl sm:text-4xl text-[#DC2626]">
            {formatRupiah(totalLoss)}
          </div>
          <span className="text-[11px] text-gray-500 font-mono block">
            {selectedEraFilter === 'prabowo' ? 'Era Prabowo (2024 - Sekarang)' : 'Perkara Tahun 2024 - 2025'}
          </span>
        </div>

        <div className="relative bg-[#FFFDF8] border-2 border-[#E7DECB] rounded-3xl p-6 text-center shadow-xs space-y-1">
          <div className="washi-tape washi-tape-yellow -top-2 left-6"></div>
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
            Total Kasus Terindeks
          </span>
          <div className="font-marker text-3xl sm:text-4xl text-[#0284C7]">
            {totalCases} Perkara
          </div>
          <span className="text-[11px] text-gray-500 font-mono block">
            Rujukan berkas resmi terverifikasi
          </span>
        </div>

        <div className="relative bg-[#FFFDF8] border-2 border-[#E7DECB] rounded-3xl p-6 text-center shadow-xs space-y-1">
          <div className="washi-tape washi-tape-green -top-2 left-6"></div>
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
            Provinsi Terdampak
          </span>
          <div className="font-marker text-3xl sm:text-4xl text-[#D97706]">
            {affectedProvinces} Wilayah / Provinsi
          </div>
          <span className="text-[11px] text-gray-500 font-mono block">
            Sebaran wilayah perkara aktif
          </span>
        </div>
      </section>

      {/* Preview Top Hall of Shame Era Terkini */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-[#DC2626]" />
            <div>
              <h2 className="font-marker text-2xl text-[#1E293B]">
                Top Perkara Era Terbaru (Kerugian Terbesar)
              </h2>
            </div>
          </div>
          <button
            onClick={() => {
              sound.playPop();
              onNavigate('klasemen');
            }}
            className="text-xs font-bold text-[#0284C7] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>Buka Klasemen Lengkap</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

          {top3.map((c, idx) => (
            <div
              key={c.id}
              onClick={() => {
                sound.playSticker();
                onSelectCase(c.id);
              }}
              className="relative bg-[#FFFDF8] border-2 border-[#E7DECB] hover:border-[#DC2626] rounded-3xl p-5 shadow-sm hover:shadow-md transition-all cursor-pointer group space-y-3"
            >
              <div
                className={`washi-tape ${
                  idx === 0 ? 'washi-tape-pink' : idx === 1 ? 'washi-tape-yellow' : 'washi-tape-purple'
                } -top-2 left-6`}
              ></div>

              <div className="flex items-center justify-between">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[#FEF08A] border-2 border-[#EAB308] text-[#854D0E] font-marker text-base shadow-2xs">
                  {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FEE2E2] text-[#991B1B] border border-[#FECACA]">
                  {c.status_hukum}
                </span>
              </div>

              <div className="flex items-start gap-3">
                <img
                  src={getOfficialPhoto(c.official?.foto_url)}
                  alt={c.official?.nama || 'Foto Pejabat'}
                  onError={handleImageError}
                  className="w-14 h-14 rounded-xl object-cover border border-[#E7DECB] shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-sm text-[#1E293B] group-hover:text-[#DC2626] transition-colors truncate">
                    {c.official?.nama}
                  </h3>
                  <p className="text-xs text-gray-500 truncate">{c.official?.jabatan}</p>
                  <span className="text-[11px] font-semibold text-[#854D0E]">
                    📍 {c.official?.provinsi}
                  </span>
                </div>
              </div>

              <div className="p-2.5 bg-[#FFF7ED] border border-[#FED7AA] rounded-xl">
                <span className="text-[10px] font-bold text-[#C2410C] uppercase block">
                  Kerugian Negara:
                </span>
                <span className="font-marker text-lg text-[#EA580C]">
                  {formatRupiah(c.nilai_kerugian_negara)}
                </span>
              </div>

              <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                {c.ringkasan_kasus}
              </p>

              <div className="pt-2 border-t border-[#F1EBD9] flex items-center justify-between text-xs font-bold text-[#0284C7]">
                <span>Buka Berkas Perkara</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </div>
            </div>
          ))}
        </div>

        {/* Historical eras exploration banner */}
        <div className="pt-2 text-center">
          <button
            type="button"
            onClick={() => {
              sound.playPop();
              onNavigate('klasemen');
            }}
            className="inline-flex items-center gap-2 text-xs font-semibold text-[#0284C7] hover:text-[#0369A1] hover:underline cursor-pointer bg-white/70 px-4 py-2 rounded-xl border border-slate-200 shadow-2xs transition-all"
          >
            <span>Ingin melihat data dari era sebelumnya (SBY, Jokowi, Reformasi, Orde Baru)? Buka Arsip Historis di Klasemen Liga</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </section>


      {/* Partisipasi Publik Call to Action */}
      <section className="bg-[#FAF5E8] border-2 border-dashed border-[#CA8A04] rounded-3xl p-6 sm:p-8 text-center space-y-4">
        <div className="w-12 h-12 bg-[#FEF08A] text-[#854D0E] rounded-2xl mx-auto flex items-center justify-center border border-[#FACC15] rotate-[-2deg] shadow-2xs">
          <BookOpen className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h3 className="font-marker text-xl sm:text-2xl text-[#1E293B]">
            Mengetahui Perkara Korupsi Baru atau Menemukan Kekeliruan Data?
          </h3>
          <p className="text-xs sm:text-sm text-[#57534E] max-w-xl mx-auto">
            Integritas dan transparansi data adalah komitmen utama kami. Setiap warga dapat mengusulkan kasus terbaru yang belum tercatat atau mengajukan koreksi berkas berdasarkan rujukan putusan pengadilan resmi.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
          <button
            type="button"
            onClick={() => {
              sound.playPop();
              onOpenReport('new_case');
            }}
            className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer inline-flex items-center gap-2"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Usulkan Kasus Korupsi Baru</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sound.playPop();
              onOpenReport('correction');
            }}
            className="px-5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer inline-flex items-center gap-2"
          >
            <Scale className="w-3.5 h-3.5 text-slate-500" />
            <span>Koreksi Berkas / Putusan Baru</span>
          </button>
        </div>
      </section>
    </div>
  );
};
