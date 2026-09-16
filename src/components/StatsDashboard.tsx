import React from 'react';
import { StatsOverview } from '../types.js';
import { formatRupiah } from '../utils/formatters.js';
import { sound } from '../utils/audio.js';
import { 
  BarChart3, 
  Building2, 
  Flame, 
  FolderKanban, 
  PieChart, 
  ShieldCheck, 
  ExternalLink 
} from 'lucide-react';

interface StatsProps {
  stats: StatsOverview;
  onSelectCase: (caseId: string) => void;
}

export const StatsDashboard: React.FC<StatsProps> = ({ stats, onSelectCase }) => {
  const maxLoss = stats.top_kerugian.length > 0 ? stats.top_kerugian[0].nilai_kerugian_negara : 1;
  const maxPartyLoss = Math.max(...stats.distribusi_partai.map(p => p.total_kerugian), 1);

  return (
    <div id="stats-dashboard-section" className="space-y-6">
      
      {/* Overview Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        {/* Card 1: Total Kasus */}
        <div className="relative bg-[#FFFDF9] border-2 border-[#E8DFC8] rounded-3xl p-5 shadow-sm overflow-hidden rotate-[-0.5deg]">
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
        <div className="relative bg-[#FFFDF9] border-2 border-[#FDBA74] rounded-3xl p-5 shadow-sm overflow-hidden rotate-[0.5deg]">
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

        {/* Card 3: Provinsi Kasus Terbanyak */}
        <div className="relative bg-[#FFFDF9] border-2 border-[#E8DFC8] rounded-3xl p-5 shadow-sm overflow-hidden rotate-[-0.5deg]">
          <div className="washi-tape washi-tape-pink -top-3 right-6"></div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#FBCFE8] text-[#BE185D] flex items-center justify-center shadow-inner">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider">
                Wilayah Kasus Terbanyak
              </span>
              <div className="font-bold text-xl text-[#BE185D] truncate">
                {stats.provinsi_terbanyak.provinsi}
              </div>
              <div className="text-xs font-semibold text-[#831843]">
                {stats.provinsi_terbanyak.total_kasus} Perkara ({formatRupiah(stats.provinsi_terbanyak.total_kerugian)})
              </div>
            </div>
          </div>
          <p className="text-[11px] text-[#64748B] mt-2 pt-2 border-t border-[#F1E8D5]">
            Provinsi dengan volume perkara terbanyak dalam sistem kami.
          </p>
        </div>

      </div>

      {/* Top 10 Hall of Shame Section */}
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
                Perkara dengan dampak kerugian keuangan negara / suap paling masif.
              </p>
            </div>
          </div>
          <span className="px-3 py-1 bg-[#FEF3C7] text-[#92400E] font-hand font-bold text-xs rounded-full border border-[#FCD34D]">
            ⚖️ Putusan Hukum &amp; Tuntutan Resmi
          </span>
        </div>

        {/* Bar Visualizer */}
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
                className="group p-3 rounded-2xl bg-[#FAF6EC] border border-[#E9DFCE] hover:bg-[#F2ECD9] cursor-pointer transition-all space-y-1.5"
              >
                <div className="flex items-center justify-between text-xs sm:text-sm font-bold gap-2">
                  <div className="flex items-center gap-2 truncate">
                    <span className="w-6 h-6 rounded-full bg-white border border-[#D5C9AB] flex items-center justify-center font-marker text-xs text-[#57534E]">
                      #{idx + 1}
                    </span>
                    <span className="text-[#1E293B] group-hover:text-[#0284C7] truncate">
                      {item.nama}
                    </span>
                    <span className="text-xs font-normal text-gray-500 hidden sm:inline">
                      ({item.jabatan})
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-marker text-sm sm:text-base text-[#DC2626]">
                      {formatRupiah(item.nilai_kerugian_negara)}
                    </span>
                    <ExternalLink className="w-3.5 h-3.5 text-gray-400 group-hover:text-[#0284C7]" />
                  </div>
                </div>

                {/* Toy-block Styled Bar */}
                <div className="w-full bg-[#EAE2CE] h-3.5 rounded-full overflow-hidden p-0.5 shadow-inner">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${color}`}
                    style={{ width: `${barPercent}%` }}
                  ></div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-gray-500">
                  <span className="px-2 py-0.2 bg-white rounded-md border border-[#E2D5BA] text-[10px] font-semibold">
                    {item.status_hukum} ({item.tahun})
                  </span>
                  <span className="text-[#0284C7] font-semibold text-[11px] group-hover:underline">
                    Lihat Berkas Perkara →
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Grid: Partai Politik & Perusahaan Rekanan */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Kasus per Partai Politik */}
        <div className="relative bg-[#FFFDF8] border-2 border-[#E7DECB] rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
          <div className="washi-tape washi-tape-purple -top-3 left-8"></div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-[#F3E8FF] text-[#9333EA] rounded-xl">
              <PieChart className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-marker text-xl text-[#1E293B]">
                Distribusi Partai Politik
              </h3>
              <p className="text-xs text-[#64748B]">
                Sebaran perkara &amp; kerugian menurut afiliasi politik pelaku.
              </p>
            </div>
          </div>

          <div className="space-y-2.5 pt-2">
            {stats.distribusi_partai.map(party => {
              const widthRatio = Math.max(12, Math.round((party.total_kerugian / maxPartyLoss) * 100));
              return (
                <div key={party.partai} className="p-2.5 bg-[#FAF6EC] rounded-xl border border-[#EBE2D0] space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-[#1E293B]">{party.partai}</span>
                    <span className="font-marker text-[#B45309]">
                      {formatRupiah(party.total_kerugian)}
                    </span>
                  </div>
                  <div className="w-full bg-[#E5DCC6] h-2.5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        backgroundColor: party.color,
                        width: `${widthRatio}%`
                      }}
                    ></div>
                  </div>
                  <div className="text-[10px] text-gray-500 flex justify-between">
                    <span>{party.total_kasus} Perkara Terdata</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Perusahaan Terkait (Rekanan Swasta) */}
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
                Perusahaan rekanan dalam proyek suap dan pengadaan tender bermasalah.
              </p>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            {stats.top_perusahaan.map((comp, idx) => (
              <div
                key={comp.nama_perusahaan}
                className="p-3 bg-[#FAF6EC] border border-[#E9E0CE] rounded-2xl flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-xl bg-[#FEF08A] text-[#854D0E] font-marker flex items-center justify-center text-sm border border-[#EAB308]">
                    🏢
                  </span>
                  <div>
                    <div className="font-bold text-sm text-[#1E293B]">{comp.nama_perusahaan}</div>
                    <div className="text-[11px] text-[#64748B]">{comp.sektor}</div>
                  </div>
                </div>
                <span className="px-2.5 py-1 bg-[#E0F2FE] text-[#0369A1] font-bold text-xs rounded-full border border-[#BAE6FD]">
                  {comp.total_kasus} Kasus
                </span>
              </div>
            ))}
          </div>

          <div className="p-3 bg-[#FEF2F2] border border-[#FECACA] rounded-2xl text-xs text-[#991B1B] flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 shrink-0 text-[#DC2626]" />
            <span>Keterlibatan korporasi mengacu pada dakwaan Jaksa Penuntut Umum KPK &amp; fakta persidangan Tipikor.</span>
          </div>
        </div>

      </div>

    </div>
  );
};
