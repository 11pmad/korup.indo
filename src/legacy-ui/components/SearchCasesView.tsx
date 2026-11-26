"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { CorruptionCase } from '../types';
import { formatRupiah, getStatusBadgeStyle } from '../utils/formatters';
import { sound } from '../utils/audio';
import { getOfficialPhoto, handleImageError } from '../utils/photo';
import { Search, Filter, Calendar, ExternalLink, Building2, Eye, Loader2, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';

interface SearchProps {
  cases: CorruptionCase[];
  provinces: string[];
  onSelectCase: (caseId: string) => void;
  onOpenReport?: (caseId?: string, mode?: 'new_case' | 'correction' | 'track') => void;
}

export const SearchCasesView: React.FC<SearchProps> = ({
  cases,
  provinces,
  onSelectCase,
  onOpenReport
}) => {
  const [inputQuery, setInputQuery] = useState<string>('');
  const [debouncedQuery, setDebouncedQuery] = useState<string>('');
  const [isDebouncing, setIsDebouncing] = useState<boolean>(false);
  const [selectedProvince, setSelectedProvince] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [sortBy, setSortBy] = useState<'kerugian' | 'tahun' | 'nama'>('kerugian');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Debounce search query by 300ms
  useEffect(() => {
    setIsDebouncing(true);
    const timer = setTimeout(() => {
      setDebouncedQuery(inputQuery);
      setIsDebouncing(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [inputQuery]);

  // Reset pagination when query or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedQuery, selectedProvince, selectedStatus, sortBy, sortOrder]);

  const highlightKeyword = (text: string, query: string) => {
    if (!query.trim()) return text;
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark key={i} className="bg-[#FEF08A] text-[#854D0E] font-bold px-0.5 rounded-sm">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  const filtered = cases.filter(c => {
    if (selectedProvince && c.official?.provinsi !== selectedProvince) return false;
    if (selectedStatus && c.status_hukum !== selectedStatus) return false;
    if (debouncedQuery) {
      const q = debouncedQuery.toLowerCase();
      const match =
        c.official?.nama.toLowerCase().includes(q) ||
        c.official?.jabatan.toLowerCase().includes(q) ||
        c.official?.partai.toLowerCase().includes(q) ||
        c.ringkasan_kasus.toLowerCase().includes(q) ||
        c.jenis_kasus.toLowerCase().includes(q) ||
        (c.perusahaan_terkait && c.perusahaan_terkait.some(cp => cp.toLowerCase().includes(q)));
      if (!match) return false;
    }
    return true;
  });

  filtered.sort((a, b) => {
    let diff = 0;
    if (sortBy === 'kerugian') {
      diff = a.nilai_kerugian_negara - b.nilai_kerugian_negara;
    } else if (sortBy === 'tahun') {
      const yA = a.tahun_putusan || a.tahun_kejadian;
      const yB = b.tahun_putusan || b.tahun_kejadian;
      diff = yA - yB;
    } else {
      diff = (a.official?.nama || '').localeCompare(b.official?.nama || '');
    }
    return sortOrder === 'asc' ? diff : -diff;
  });

  const effectivePageSize = pageSize >= 9999 ? Math.max(filtered.length, 1) : pageSize;
  const totalPages = Math.ceil(filtered.length / effectivePageSize) || 1;
  const paginatedCases = filtered.slice((currentPage - 1) * effectivePageSize, currentPage * effectivePageSize);

  return (
    <div id="search-cases-section" className="space-y-6">
      
      {/* Search & Filter Header Box */}
      <div className="relative bg-[#FFFDF9] border-2 border-[#E7DECB] rounded-3xl p-5 sm:p-7 shadow-sm space-y-4">
        <div className="washi-tape washi-tape-purple -top-3 left-8"></div>
        <div className="washi-tape washi-tape-yellow -top-3 right-8"></div>

        <div>
          <h2 className="font-marker text-2xl sm:text-3xl text-[#1E293B] flex items-center gap-2">
            <span>🔍 Eksplorasi &amp; Cari Berkas Kasus</span>
          </h2>
          <p className="text-xs sm:text-sm text-[#64748B]">
            Telusuri perkara berdasarkan nama pejabat, korporasi swasta terkait, daerah pemilihan, atau kata kunci kasus.
          </p>
        </div>

        {/* Search Input with debouncing */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Cari nama pejabat, partai, daerah, perusahaan rekanan, atau kata kunci..."
            value={inputQuery}
            onChange={e => setInputQuery(e.target.value)}
            className="w-full bg-[#FAF5E8] border-2 border-[#D5C9AB] rounded-2xl pl-12 pr-10 py-3 text-sm text-[#1F2937] focus:ring-2 focus:ring-[#C084FC] focus:outline-none shadow-inner"
          />
          {isDebouncing && (
            <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-orange-500 animate-spin" />
          )}
        </div>

        {/* Filter Controls Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div>
            <label className="block text-xs font-bold text-[#57534E] mb-1">
              Provinsi
            </label>
            <select
              value={selectedProvince}
              onChange={e => {
                sound.playPop();
                setSelectedProvince(e.target.value);
              }}
              className="w-full bg-[#FAF5E8] border border-[#D5C9AB] rounded-xl px-3 py-2 text-xs font-semibold text-[#1F2937] focus:ring-2 focus:ring-[#C084FC] focus:outline-none"
            >
              <option value="">Semua Provinsi</option>
              {provinces.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#57534E] mb-1">
              Status Hukum
            </label>
            <select
              value={selectedStatus}
              onChange={e => {
                sound.playPop();
                setSelectedStatus(e.target.value);
              }}
              className="w-full bg-[#FAF5E8] border border-[#D5C9AB] rounded-xl px-3 py-2 text-xs font-semibold text-[#1F2937] focus:ring-2 focus:ring-[#C084FC] focus:outline-none"
            >
              <option value="">Semua Status Hukum</option>
              <option value="Divonis Inkrah">Divonis Inkrah</option>
              <option value="Terdakwa">Terdakwa</option>
              <option value="Tersangka">Tersangka</option>
              <option value="Bebas/Praperadilan">Bebas/Praperadilan</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#57534E] mb-1">
              Urutkan Berdasarkan
            </label>
            <div className="flex gap-1.5">
              <select
                value={sortBy}
                onChange={e => {
                  sound.playPop();
                  setSortBy(e.target.value as any);
                }}
                className="flex-1 bg-[#FAF5E8] border border-[#D5C9AB] rounded-xl px-3 py-2 text-xs font-semibold text-[#1F2937] focus:ring-2 focus:ring-[#C084FC] focus:outline-none"
              >
                <option value="kerugian">Nilai Kerugian (Rp)</option>
                <option value="tahun">Tahun Putusan</option>
                <option value="nama">Nama Pejabat</option>
              </select>
              <button
                onClick={() => {
                  sound.playPop();
                  setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                }}
                className="px-3 py-2 bg-white border border-[#D5C9AB] rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50"
              >
                {sortOrder === 'asc' ? '↑ Naik' : '↓ Turun'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Results Count & Badges */}
      <div className="flex items-center justify-between text-xs text-[#64748B]">
        <span>
          Ditemukan <strong>{filtered.length}</strong> berkas perkara
        </span>
      </div>

      {/* Grid of Polaroid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.length === 0 ? (
          <div className="col-span-full p-10 text-center bg-[#FFFDF9] rounded-3xl border-2 border-dashed border-[#E3D6BC] space-y-3">
            <p className="font-marker text-xl text-[#1E293B]">Tidak ada perkara yang cocok dengan pencarian</p>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Mengetahui adanya dugaan perkara korupsi baru ini dan memiliki tautan berita atau putusan resminya? Bantu keterbukaan data dengan mengusulkan kasus baru ke kurator LKI.
            </p>
            {onOpenReport && (
              <button
                type="button"
                onClick={() => {
                  sound.playPop();
                  onOpenReport(undefined, 'new_case');
                }}
                className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer inline-flex items-center gap-2"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Laporkan Kasus Baru Ini ke Kurator LKI</span>
              </button>
            )}
          </div>
        ) : (
          paginatedCases.map((item, idx) => {
            const statusStyle = getStatusBadgeStyle(item.status_hukum);
            const rotationClass =
              idx % 4 === 0
                ? 'rotate-[-1deg]'
                : idx % 4 === 1
                ? 'rotate-[1deg]'
                : idx % 4 === 2
                ? 'rotate-[-0.5deg]'
                : 'rotate-[0.5deg]';

            return (
              <div
                key={item.id}
                onClick={() => {
                  sound.playSticker();
                  onSelectCase(item.id);
                }}
                className={`polaroid-card cursor-pointer group ${rotationClass} relative`}
              >
                <div className="washi-tape washi-tape-yellow -top-2 left-8"></div>

                <div className="space-y-3 pt-2">
                  {/* Photo & Profile */}
                  <div className="flex items-start gap-3">
                    <img
                      src={getOfficialPhoto(item.official?.foto_url)}
                      alt={item.official?.nama || 'Foto Pejabat'}
                      referrerPolicy="no-referrer"
                      onError={handleImageError}
                      className="w-16 h-16 rounded-xl object-cover border border-[#E2D6B8] shrink-0 bg-[#F5EFE1]"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.2 bg-[#FEF08A] text-[#854D0E] text-[10px] font-bold rounded-md uppercase">
                          {item.official?.provinsi}
                        </span>
                        <span className="text-xs font-mono font-bold text-gray-500">
                          {item.tahun_putusan || item.tahun_kejadian}
                        </span>
                      </div>
                      <h4 className="font-bold text-base text-[#1E293B] truncate group-hover:text-[#0284C7] transition-colors mt-0.5">
                        {highlightKeyword(item.official?.nama || '', debouncedQuery)}
                      </h4>
                      <p className="text-xs text-[#64748B] truncate">
                        {item.official?.jabatan}
                      </p>
                      <p className="text-[11px] text-gray-500 font-semibold">
                        {item.official?.partai}
                      </p>
                    </div>
                  </div>

                  {/* Stamped Kerugian */}
                  <div className="p-2.5 bg-[#FFF7ED] border border-[#FDBA74] rounded-xl flex items-center justify-between">
                    <span className="text-[10px] font-bold text-[#C2410C] uppercase">
                      Nilai Kerugian / Suap:
                    </span>
                    <span className="font-marker text-sm font-bold text-[#EA580C]">
                      {formatRupiah(item.nilai_kerugian_negara)}
                    </span>
                  </div>

                  {/* Summary */}
                  <p className="text-xs text-[#475569] line-clamp-2 leading-relaxed">
                    {highlightKeyword(item.ringkasan_kasus, debouncedQuery)}
                  </p>

                  {/* Companies if any */}
                  {item.perusahaan_terkait && item.perusahaan_terkait.length > 0 && (
                    <div className="flex items-center gap-1.5 text-[11px] text-[#475569] truncate">
                      <Building2 className="w-3.5 h-3.5 text-[#EA580C] shrink-0" />
                      <span className="truncate">{item.perusahaan_terkait.join(', ')}</span>
                    </div>
                  )}

                  {/* Footer Status & Action */}
                  <div className="pt-2 border-t border-[#F1EBD9] flex items-center justify-between text-xs">
                    <span
                      className={`px-2 py-0.5 rounded-full font-bold text-[10px] border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}
                    >
                      {item.status_hukum}
                    </span>
                    <span className="text-[#0284C7] font-bold group-hover:underline flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5" /> Buka Berkas Lengkap
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination Footer */}
      {filtered.length > 0 && (
        <div className="bg-[#FFFDF9] border-2 border-[#E7DECB] rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs text-[#57534E] shadow-2xs">
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
              <option value={9999}>Semua ({filtered.length})</option>
            </select>

            <span className="text-xs text-[#78716C]">
              Menampilkan <strong>{filtered.length === 0 ? 0 : (currentPage - 1) * effectivePageSize + 1}</strong> -{' '}
              <strong>{Math.min(filtered.length, currentPage * effectivePageSize)}</strong> dari <strong>{filtered.length}</strong> berkas perkara
            </span>
          </div>

          <div className="flex items-center gap-1.5 ml-auto">
            <button
              disabled={currentPage <= 1}
              onClick={() => {
                sound.playPop();
                setCurrentPage(p => p - 1);
                document.getElementById('search-cases-section')?.scrollIntoView({ behavior: 'smooth' });
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
                document.getElementById('search-cases-section')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="p-1.5 rounded-lg bg-white border border-[#D5C9A9] disabled:opacity-40 hover:bg-[#F4EEDC] cursor-pointer transition-colors"
              title="Halaman Selanjutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
