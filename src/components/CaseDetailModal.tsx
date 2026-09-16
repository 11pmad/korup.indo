import React from 'react';
import { CorruptionCase } from '../types.js';
import { formatRupiah, formatRupiahFull, getStatusBadgeStyle } from '../utils/formatters.js';
import { sound } from '../utils/audio.js';
import { 
  X, 
  ExternalLink, 
  Calendar, 
  Scale, 
  Building2, 
  Flag, 
  ShieldAlert, 
  Share2 
} from 'lucide-react';

interface ModalProps {
  caseData: CorruptionCase | null;
  onClose: () => void;
  onOpenReport: (caseId: string) => void;
}

export const CaseDetailModal: React.FC<ModalProps> = ({
  caseData,
  onClose,
  onOpenReport
}) => {
  if (!caseData) return null;

  const statusStyle = getStatusBadgeStyle(caseData.status_hukum);

  const handleShare = () => {
    sound.playPop();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      alert('Tautan berkas berhasil disalin ke clipboard!');
    }
  };

  return (
    <div
      id="case-detail-modal"
      className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6"
    >
      <div 
        className="relative w-full max-w-3xl bg-[#FFFDF8] border-3 border-[#E2D5B7] rounded-3xl shadow-2xl p-5 sm:p-8 space-y-6 animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Scrapbook Corner Tapes */}
        <div className="washi-tape washi-tape-yellow -top-3 left-8"></div>
        <div className="washi-tape washi-tape-pink -top-3 right-16"></div>

        {/* Close Button */}
        <button
          onClick={() => {
            sound.playPop();
            onClose();
          }}
          className="absolute top-4 right-4 p-2 rounded-full bg-[#F3EDE0] text-[#57534E] hover:bg-[#E5DAC0] hover:text-[#1F2937] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Top Header: Official Profile */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 pt-2">
          {/* Polaroid Photo Frame */}
          <div className="relative polaroid-card shrink-0 rotate-[-2deg] self-center sm:self-auto">
            <div className="w-24 h-24 sm:w-28 sm:h-28 overflow-hidden rounded-md bg-[#FAF6EC] border border-[#EBE1CD]">
              <img
                src={caseData.official?.foto_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80'}
                alt={caseData.official?.nama}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="text-[10px] text-center font-note font-bold text-gray-500 pt-1">
              {caseData.official?.partai}
            </div>
          </div>

          {/* Info Details */}
          <div className="space-y-2 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 bg-[#FEF08A] text-[#854D0E] font-bold text-xs rounded-md border border-[#FACC15]">
                📍 {caseData.official?.provinsi}
              </span>
              <span className="px-2.5 py-0.5 bg-[#F1F5F9] text-[#475569] font-bold text-xs rounded-md">
                {caseData.official?.kota_kabupaten}
              </span>
              <span className="px-2.5 py-0.5 bg-[#E2E8F0] text-[#334155] font-semibold text-xs rounded-md">
                Dapil: {caseData.official?.daerah_pemilihan}
              </span>
            </div>

            <h2 className="font-marker text-2xl sm:text-3xl text-[#1E293B]">
              {caseData.official?.nama}
            </h2>

            <p className="text-sm font-semibold text-[#475569]">
              {caseData.official?.jabatan}
            </p>

            <div className="flex items-center gap-3 pt-1">
              <span className={`scrapbook-stamp text-xs ${statusStyle.stampBg}`}>
                ★ {caseData.status_hukum}
              </span>

              <div className="text-xs text-gray-500 flex items-center gap-1 font-mono">
                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                <span>Kejadian: {caseData.tahun_kejadian}</span>
                {caseData.tahun_putusan && <span> • Putusan: {caseData.tahun_putusan}</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Rupiah Loss Banner */}
        <div className="p-4 sm:p-5 bg-[#FFF7ED] border-2 border-dashed border-[#FDBA74] rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="text-xs font-bold text-[#C2410C] uppercase tracking-wider block">
              Nilai Kerugian Keuangan Negara / Suap
            </span>
            <div className="font-marker text-2xl sm:text-3xl text-[#EA580C]">
              {formatRupiah(caseData.nilai_kerugian_negara)}
            </div>
            <div className="text-xs font-mono text-[#9A3412]">
              Nominal Terhitung: {formatRupiahFull(caseData.nilai_kerugian_negara)}
            </div>
          </div>

          <div className="self-start sm:self-auto px-3 py-1.5 bg-[#FFEDD5] text-[#9A3412] text-xs font-bold rounded-xl border border-[#FDBA74]">
            Kategori: {caseData.jenis_kasus}
          </div>
        </div>

        {/* Ringkasan Kasus */}
        <div className="space-y-2">
          <h3 className="font-bold text-sm text-[#334155] uppercase tracking-wider flex items-center gap-1.5">
            <span>📝 Ringkasan Kasus &amp; Modus Perbuatan</span>
          </h3>
          <div className="p-4 bg-[#FAF6EC] border border-[#EFE5D3] rounded-2xl text-sm leading-relaxed text-[#334155]">
            {caseData.ringkasan_kasus}
          </div>
        </div>

        {/* Perusahaan Rekanan Terkait */}
        {caseData.perusahaan_terkait && caseData.perusahaan_terkait.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-bold text-xs text-[#475569] uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-[#EA580C]" />
              <span>Perusahaan / Korporasi Rekanan Terkait</span>
            </h3>
            <div className="flex flex-wrap gap-2">
              {caseData.perusahaan_terkait.map(comp => (
                <span
                  key={comp}
                  className="px-3 py-1 bg-white border border-[#CBD5E1] rounded-xl text-xs font-bold text-[#1E293B] shadow-2xs"
                >
                  🏢 {comp}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Sumber Berita & Hukum (WAJIB TERVERIFIKASI) */}
        <div className="space-y-2">
          <h3 className="font-bold text-xs text-[#065F46] uppercase tracking-wider flex items-center gap-1.5">
            <Scale className="w-4 h-4 text-[#059669]" />
            <span>Sumber Hukum &amp; Berita Terverifikasi (Wajib Ada Link)</span>
          </h3>
          <div className="space-y-2">
            {caseData.sources && caseData.sources.length > 0 ? (
              caseData.sources.map(src => (
                <a
                  key={src.id}
                  href={src.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 bg-[#F0FDF4] border border-[#BBF7D0] hover:bg-[#DCFCE7] rounded-xl text-xs font-semibold text-[#166534] transition-all group"
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="p-1 bg-[#86EFAC] text-[#14532D] rounded-md">🔗</span>
                    <span className="font-bold underline group-hover:text-[#15803D] truncate">
                      {src.nama_media}
                    </span>
                    <span className="text-[10px] text-gray-500 hidden sm:inline">
                      ({src.tanggal_publikasi})
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[#059669] shrink-0 font-bold">
                    <span>Buka Tautan Resmi</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </div>
                </a>
              ))
            ) : (
              <div className="p-3 bg-[#FEF2F2] border border-[#FECACA] rounded-xl text-xs text-[#991B1B]">
                Belum ada sumber tercantum (Status: Draft Belum Terverifikasi).
              </div>
            )}
          </div>
        </div>

        {/* Permanent Legal Disclaimer */}
        <div className="p-3.5 bg-[#FEF9C3] border border-[#FACC15] rounded-xl text-xs text-[#713F12] flex items-start gap-2.5">
          <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-[#A16207]" />
          <div>
            <strong>Asas Praduga Tak Bersalah:</strong> Data ini disusun demi kepentingan transparansi publik berdasarkan dokumen hukum terbuka. Setiap pihak yang berstatus Tersangka atau Terdakwa tetap berhak atas asas praduga tak bersalah hingga adanya vonis berkekuatan hukum tetap (inkrah).
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-2 flex items-center justify-between flex-wrap gap-2 border-t border-[#EFE5CE]">
          <button
            onClick={() => {
              sound.playPop();
              onOpenReport(caseData.id);
            }}
            className="px-3.5 py-2 bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] rounded-xl hover:bg-[#FEE2E2] text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <Flag className="w-3.5 h-3.5" />
            <span>Laporkan Kesalahan pada Berkas Ini</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="p-2 rounded-xl bg-white border border-[#CBD5E1] text-[#475569] hover:bg-gray-50 text-xs font-bold flex items-center gap-1.5"
              title="Bagikan Tautan Kasus"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Bagikan</span>
            </button>

            <button
              onClick={() => {
                sound.playPop();
                onClose();
              }}
              className="px-4 py-2 bg-[#1E293B] text-white rounded-xl hover:bg-[#334155] text-xs font-bold transition-all shadow-xs"
            >
              Tutup Berkas ✕
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
