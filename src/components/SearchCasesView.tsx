import React, { useState, useEffect, useMemo } from 'react';
import { CorruptionCase } from '../types.js';
import { formatRupiah, getStatusBadgeStyle } from '../utils/formatters.js';
import { sound } from '../utils/audio.js';
import { Search, Filter, Calendar, ExternalLink, Building2, Eye, Loader2 } from 'lucide-react';

interface SearchProps {
  cases: CorruptionCase[];
  provinces: string[];
  onSelectCase: (caseId: string) => void;
}

export const SearchCasesView: React.FC<SearchProps> = ({
  cases,
  provinces,
  onSelectCase
}) => {
  const [inputQuery, setInputQuery] = useState<string>('');
  const [debouncedQuery, setDebouncedQuery] = useState<string>('');
  const [isDebouncing, setIsDebouncing] = useState<boolean>(false);
  const [selectedProvince, setSelectedProvince] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [sortBy, setSortBy] = useState<'kerugian' | 'tahun' | 'nama'>('kerugian');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Debounce search query by 300ms
  useEffect(() => {
    setIsDebouncing(true);
    const timer = setTimeout(() => {
      setDebouncedQuery(inputQuery);
      setIsDebouncing(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [inputQuery]);

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
          <div className="col-span-full p-12 text-center text-[#78716C] font-hand text-xl bg-[#FFFDF9] rounded-3xl border-2 border-dashed border-[#E3D6BC]">
            Tidak ada perkara yang cocok dengan kata kunci atau filter yang dipilih.
          </div>
        ) : (
          filtered.map((item, idx) => {
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
                      src={
                        item.official?.foto_url ||
                        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80'
                      }
                      alt={item.official?.nama}
                      referrerPolicy="no-referrer"
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

    </div>
  );
};
