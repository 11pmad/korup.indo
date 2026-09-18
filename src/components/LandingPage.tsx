import React from 'react';
import { StatsOverview, CorruptionCase } from '../types.js';
import { formatRupiah } from '../utils/formatters.js';
import { sound } from '../utils/audio.js';
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
  BookOpen
} from 'lucide-react';

interface LandingPageProps {
  stats: StatsOverview | null;
  cases: CorruptionCase[];
  onNavigate: (tab: 'peta' | 'klasemen' | 'statistik' | 'cari' | 'admin') => void;
  onSelectCase: (caseId: string) => void;
  onOpenReport: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  stats,
  cases,
  onNavigate,
  onSelectCase,
  onOpenReport
}) => {
  // Top 3 Hall of Shame
  const top3 = cases
    .slice()
    .sort((a, b) => b.nilai_kerugian_negara - a.nilai_kerugian_negara)
    .slice(0, 3);

  const totalLoss = stats?.total_kerugian_akumulasi || cases.reduce((acc, c) => acc + c.nilai_kerugian_negara, 0);
  const totalCases = stats?.total_kasus_nasional || cases.length;

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

      {/* Ringkasan Angka Besar (Big Numbers Strip) */}
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
            Tercatat pada database perkara
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
            Dengan rujukan dokumen resmi
          </span>
        </div>

        <div className="relative bg-[#FFFDF8] border-2 border-[#E7DECB] rounded-3xl p-6 text-center shadow-xs space-y-1">
          <div className="washi-tape washi-tape-green -top-2 left-6"></div>
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
            Provinsi Terdampak
          </span>
          <div className="font-marker text-3xl sm:text-4xl text-[#D97706]">
            38 Provinsi
          </div>
          <span className="text-[11px] text-gray-500 font-mono block">
            Sebaran spasial nusantara
          </span>
        </div>
      </section>

      {/* Preview Top 3 Hall of Shame */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-[#DC2626]" />
            <h2 className="font-marker text-2xl text-[#1E293B]">
              Top 3 Hall of Shame (Kerugian Terbesar)
            </h2>
          </div>
          <button
            onClick={() => {
              sound.playPop();
              onNavigate('statistik');
            }}
            className="text-xs font-bold text-[#0284C7] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>Lihat Top 10 Lengkap</span>
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
                  src={
                    c.official?.foto_url ||
                    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200'
                  }
                  alt={c.official?.nama}
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
      </section>

      {/* Partisipasi Publik Call to Action */}
      <section className="bg-[#FAF5E8] border-2 border-dashed border-[#CA8A04] rounded-3xl p-6 sm:p-8 text-center space-y-3">
        <div className="w-10 h-10 bg-[#FEF08A] text-[#854D0E] rounded-2xl mx-auto flex items-center justify-center border border-[#FACC15]">
          <BookOpen className="w-5 h-5" />
        </div>
        <h3 className="font-marker text-xl sm:text-2xl text-[#1E293B]">
          Menemukan Kekeliruan Data atau Memiliki Rujukan Putusan Baru?
        </h3>
        <p className="text-xs sm:text-sm text-[#57534E] max-w-xl mx-auto">
          Integritas data adalah prioritas utama kami. Setiap warga dapat mengajukan permohonan koreksi atau
          menyertakan tautan putusan kasasi/PK terbaru untuk diverifikasi oleh tim verifikator.
        </p>
        <div>
          <button
            onClick={() => {
              sound.playPop();
              onOpenReport();
            }}
            className="px-5 py-2.5 bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer inline-flex items-center gap-2"
          >
            <span>Laporkan Koreksi / Rujukan Baru</span>
          </button>
        </div>
      </section>
    </div>
  );
};
