import React, { useState } from 'react';
import { LeaderboardItem, LegalStatus } from '../types.js';
import { formatRupiah, getStatusBadgeStyle } from '../utils/formatters.js';
import { sound } from '../utils/audio.js';
import { Trophy, ArrowUpDown, ArrowUp, ArrowDown, Filter, FileText, ChevronLeft, ChevronRight } from 'lucide-react';

interface LeaderboardProps {
  items: LeaderboardItem[];
  onSelectCase: (caseId: string) => void;
  provinces: string[];
}

export const LeaderboardTable: React.FC<LeaderboardProps> = ({
  items,
  onSelectCase,
  provinces
}) => {
  const [filterProvinsi, setFilterProvinsi] = useState<string>('');
  const [filterPartai, setFilterPartai] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [sortBy, setSortBy] = useState<'kerugian' | 'kasus' | 'tahun' | 'rank'>('rank');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 8;

  // Filtering
  const filtered = items.filter(it => {
    if (filterProvinsi && it.provinsi !== filterProvinsi) return false;
    if (filterPartai && !it.partai.toLowerCase().includes(filterPartai.toLowerCase())) return false;
    if (filterStatus && it.status_hukum_terkini !== filterStatus) return false;
    return true;
  });

  // Sorting
  filtered.sort((a, b) => {
    let diff = 0;
    if (sortBy === 'kerugian') {
      diff = a.total_kerugian_negara - b.total_kerugian_negara;
    } else if (sortBy === 'kasus') {
      diff = a.total_kasus - b.total_kasus;
    } else if (sortBy === 'tahun') {
      diff = a.tahun_terkini - b.tahun_terkini;
    } else {
      diff = a.rank - b.rank;
    }
    return sortOrder === 'asc' ? diff : -diff;
  });

  // Pagination
  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const pageItems = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleSort = (field: 'kerugian' | 'kasus' | 'tahun' | 'rank') => {
    sound.playPop();
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder(field === 'rank' ? 'asc' : 'desc');
    }
  };

  const getRankMedal = (rank: number) => {
    if (rank === 1) {
      return (
        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[#FEF08A] border-2 border-[#EAB308] text-[#854D0E] font-marker text-lg shadow-sm rotate-[-4deg]">
          🥇
        </span>
      );
    }
    if (rank === 2) {
      return (
        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[#E2E8F0] border-2 border-[#94A3B8] text-[#334155] font-marker text-lg shadow-sm rotate-[3deg]">
          🥈
        </span>
      );
    }
    if (rank === 3) {
      return (
        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[#FFEDD5] border-2 border-[#F97316] text-[#9A3412] font-marker text-lg shadow-sm rotate-[-2deg]">
          🥉
        </span>
      );
    }
    return (
      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#F3EDE0] border border-[#D5C9A9] text-[#57534E] font-bold text-xs">
        #{rank}
      </span>
    );
  };

  return (
    <div id="leaderboard-section" className="space-y-6">
      
      {/* Title & Filter Bar */}
      <div className="relative bg-[#FFFDF9] border-2 border-[#E7DECB] rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
        <div className="washi-tape washi-tape-pink -top-3 left-10"></div>
        <div className="washi-tape washi-tape-yellow -top-3 right-10"></div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#FEF08A] border-2 border-[#EAB308] flex items-center justify-center shadow-sm rotate-[-2deg]">
              <Trophy className="w-6 h-6 text-[#854D0E]" />
            </div>
            <div>
              <h2 className="font-marker text-2xl sm:text-3xl text-[#1E293B]">
                Klasemen Terbanyak &amp; Terbesar
              </h2>
              <p className="text-xs sm:text-sm text-[#64748B]">
                Peringkat pejabat publik berdasarkan akumulasi kerugian negara dan frekuensi perkara terverifikasi.
              </p>
            </div>
          </div>

          <div className="text-xs font-hand font-bold text-[#854D0E] bg-[#FEF9C3] px-3 py-1.5 rounded-xl border border-[#FACC15] self-start md:self-auto">
            ⭐ Diurutkan Secara Transparan Sesuai Putusan Resmi
          </div>
        </div>

        {/* Filters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-[#F0E6D2]">
          <div>
            <label className="block text-xs font-bold text-[#57534E] mb-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Filter Wilayah / Provinsi
            </label>
            <select
              value={filterProvinsi}
              onChange={e => {
                sound.playPop();
                setFilterProvinsi(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-[#FAF5E8] border border-[#D5C9AB] rounded-xl px-3 py-2 text-xs font-semibold text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#FB923C]"
            >
              <option value="">Semua Provinsi</option>
              {provinces.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#57534E] mb-1">
              Filter Partai / Instansi
            </label>
            <input
              type="text"
              placeholder="Misal: Golkar, PDI, NasDem..."
              value={filterPartai}
              onChange={e => {
                setFilterPartai(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-[#FAF5E8] border border-[#D5C9AB] rounded-xl px-3 py-2 text-xs font-semibold text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#FB923C]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#57534E] mb-1">
              Filter Status Hukum
            </label>
            <select
              value={filterStatus}
              onChange={e => {
                sound.playPop();
                setFilterStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-[#FAF5E8] border border-[#D5C9AB] rounded-xl px-3 py-2 text-xs font-semibold text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#FB923C]"
            >
              <option value="">Semua Status Hukum</option>
              <option value="Divonis Inkrah">Divonis Inkrah</option>
              <option value="Terdakwa">Terdakwa</option>
              <option value="Tersangka">Tersangka</option>
              <option value="Bebas/Praperadilan">Bebas / Praperadilan</option>
            </select>
          </div>
        </div>
      </div>

      {/* Leaderboard Table styled as trading cards / scrap roster */}
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

          <div className="col-span-3">Nama &amp; Jabatan</div>
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
          <div className="col-span-1 text-right">Aksi</div>
        </div>

        {/* Rows */}
        <div className="divide-y divide-[#F1E8D5]">
          {pageItems.length === 0 ? (
            <div className="p-8 text-center text-[#78716C] font-hand text-lg">
              Tidak ada data yang sesuai dengan filter pencarian.
            </div>
          ) : (
            pageItems.map((item, idx) => {
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
                      <span className="px-2 py-0.5 bg-[#FEF08A] text-[#854D0E] text-[11px] font-bold rounded-md">
                        {item.provinsi}
                      </span>
                    </div>

                    <div className="col-span-1">
                      <span className="text-xs font-semibold text-[#475569]">{item.partai}</span>
                    </div>

                    <div className="col-span-2 text-right">
                      <div className="font-marker text-sm font-bold text-[#EA580C]">
                        {formatRupiah(item.total_kerugian_negara)}
                      </div>
                      <div className="text-[10px] text-gray-500 font-mono">
                        {item.total_kasus} Perkara Terverifikasi
                      </div>
                    </div>

                    <div className="col-span-2 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}>
                        {item.status_hukum_terkini}
                      </span>
                    </div>

                    <div className="col-span-1 text-right">
                      <button
                        onClick={() => {
                          sound.playPop();
                          onSelectCase(item.case_ids[0]);
                        }}
                        className="px-2.5 py-1 bg-white border border-[#CBD5E1] text-[#0284C7] rounded-xl hover:bg-[#E0F2FE] text-xs font-bold transition-all shadow-2xs"
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
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}>
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
                          onSelectCase(item.case_ids[0]);
                        }}
                        className="px-3 py-1 bg-white border border-[#CBD5E1] text-[#0284C7] rounded-xl text-xs font-bold flex items-center gap-1.5"
                      >
                        <FileText className="w-3.5 h-3.5" /> Lihat Detail Kasus
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pagination Footer */}
        <div className="px-6 py-3 bg-[#F6F0DF] border-t border-[#E4D7BC] flex items-center justify-between text-xs text-[#57534E]">
          <div>
            Menampilkan <strong>{Math.min(filtered.length, (currentPage - 1) * pageSize + 1)}</strong> -{' '}
            <strong>{Math.min(filtered.length, currentPage * pageSize)}</strong> dari <strong>{filtered.length}</strong> pejabat
          </div>

          <div className="flex items-center gap-1.5">
            <button
              disabled={currentPage <= 1}
              onClick={() => {
                sound.playPop();
                setCurrentPage(p => p - 1);
              }}
              className="p-1.5 rounded-lg bg-white border border-[#D5C9A9] disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 font-bold">
              {currentPage} / {totalPages}
            </span>
            <button
              disabled={currentPage >= totalPages}
              onClick={() => {
                sound.playPop();
                setCurrentPage(p => p + 1);
              }}
              className="p-1.5 rounded-lg bg-white border border-[#D5C9A9] disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
