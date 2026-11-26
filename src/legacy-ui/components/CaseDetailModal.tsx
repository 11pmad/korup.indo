"use client";

import React, { useState, useEffect } from 'react';
import { CorruptionCase } from '../types';
import { formatRupiah, formatRupiahFull, getStatusBadgeStyle } from '../utils/formatters';
import { sound } from '../utils/audio';
import { getOfficialPhoto, handleImageError } from '../utils/photo';
import { 
  X, 
  ExternalLink, 
  Calendar, 
  Scale, 
  Building2, 
  Flag, 
  ShieldAlert, 
  Share2,
  Flame,
  MessageSquare
} from 'lucide-react';
import { CaseReactionsSection } from './CaseReactionsSection';
import { CaseCommentsSection } from './CaseCommentsSection';

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

  const [showReactions, setShowReactions] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [reactionCount, setReactionCount] = useState(0);
  const [commentCount, setCommentCount] = useState(0);

  useEffect(() => {
    if (!caseData?.id) return;
    
    // Fetch initial reaction count
    fetch(`/api/reactions/case/${caseData.id}`)
      .then(res => res.json())
      .then(json => {
        if (json.data && typeof json.data.total === 'number') {
          setReactionCount(json.data.total);
        }
      })
      .catch(() => {});

    // Fetch initial comment count
    fetch(`/api/comments/case/${caseData.id}`)
      .then(res => res.json())
      .then(json => {
        if (typeof json.total === 'number') {
          setCommentCount(json.total);
        } else if (Array.isArray(json.data)) {
          setCommentCount(json.data.length);
        }
      })
      .catch(() => {});
  }, [caseData?.id]);

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
      className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 lg:p-6"
    >
      <div className="relative flex items-start justify-center gap-6 xl:gap-8 w-full max-w-[1720px] my-auto transition-all duration-300">
        
        {/* === LEFT DRAWER: REACTION / SENTIMENT PANEL === */}
        {showReactions && (
          <>
            {/* Desktop Companion Column (xl+) */}
            <div className="hidden xl:block w-[460px] 2xl:w-[490px] shrink-0 sticky top-6 bg-[#FFFDF8] border-3 border-[#E2D5B7] rounded-3xl shadow-2xl p-5 max-h-[88vh] overflow-y-auto animate-in slide-in-from-left duration-200">
              <CaseReactionsSection 
                caseId={caseData.id} 
                caseTitle={caseData.official?.nama ? `${caseData.official.nama} - ${caseData.jenis_kasus}` : undefined}
                embedded={true}
                onClose={() => setShowReactions(false)}
                onCountChange={setReactionCount}
              />
            </div>

            {/* Mobile / Tablet Slide-in Drawer (< xl) */}
            <div 
              className="xl:hidden fixed inset-0 z-60 bg-black/50 backdrop-blur-xs flex justify-start animate-in fade-in duration-200"
              onClick={() => setShowReactions(false)}
            >
              <div 
                className="w-[94vw] max-w-xl h-full bg-[#FFFDF8] border-r-3 border-[#E2D5B7] shadow-2xl p-5 overflow-y-auto animate-in slide-in-from-left duration-200"
                onClick={e => e.stopPropagation()}
              >
                <CaseReactionsSection 
                  caseId={caseData.id} 
                  caseTitle={caseData.official?.nama ? `${caseData.official.nama} - ${caseData.jenis_kasus}` : undefined}
                  embedded={true}
                  onClose={() => setShowReactions(false)}
                  onCountChange={setReactionCount}
                />
              </div>
            </div>
          </>
        )}

        {/* === CENTER DOSSIER CARD === */}
        <div 
          className="relative w-full max-w-3xl bg-[#FFFDF8] border-3 border-[#E2D5B7] rounded-3xl shadow-2xl p-5 sm:p-8 space-y-6 animate-in fade-in zoom-in-95 duration-200 shrink-1"
        >
          {/* Scrapbook Corner Tapes */}
          <div className="washi-tape washi-tape-yellow -top-3 left-8"></div>
          <div className="washi-tape washi-tape-pink -top-3 right-16"></div>

          {/* Top Header Close Button */}
          <div className="absolute top-4 right-4 flex items-center gap-1.5 sm:gap-2">
            {/* Close Modal Button */}
            <button
              onClick={() => {
                sound.playPop();
                onClose();
              }}
              className="p-2 rounded-full bg-[#F3EDE0] text-[#57534E] hover:bg-[#E5DAC0] hover:text-[#1F2937] transition-colors cursor-pointer shadow-xs"
              title="Tutup Berkas Kasus"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

        {/* Top Header: Official Profile */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 pt-2">
          {/* Polaroid Photo Frame */}
          <div className="relative polaroid-card shrink-0 rotate-[-2deg] self-center sm:self-auto">
            <div className="w-24 h-24 sm:w-28 sm:h-28 overflow-hidden rounded-md bg-[#FAF6EC] border border-[#EBE1CD]">
              <img
                src={getOfficialPhoto(caseData.official?.foto_url)}
                alt={caseData.official?.nama || 'Foto Pejabat'}
                referrerPolicy="no-referrer"
                onError={handleImageError}
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

          {/* Minimal Interactive Actions: Reaksi & Komentar */}
          <div className="pt-2.5 pb-1 border-t border-[#EBE1CD] flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  sound.playPop();
                  setShowReactions(prev => !prev);
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer ${
                  showReactions 
                    ? 'bg-amber-500 text-white shadow-xs' 
                    : 'bg-amber-50/90 hover:bg-amber-100 text-amber-900 border border-amber-200'
                }`}
                title="Buka / Tutup Panel Reaksi"
              >
                <Flame className={`w-3.5 h-3.5 ${showReactions ? 'text-white' : 'text-amber-600'}`} />
                <span>Reaksi</span>
                <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono font-bold ${
                  showReactions ? 'bg-white/25 text-white' : 'bg-amber-200/80 text-amber-950'
                }`}>
                  {reactionCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  sound.playPop();
                  setShowComments(prev => !prev);
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer ${
                  showComments 
                    ? 'bg-sky-600 text-white shadow-xs' 
                    : 'bg-sky-50/90 hover:bg-sky-100 text-sky-900 border border-sky-200'
                }`}
                title="Buka / Tutup Panel Komentar"
              >
                <MessageSquare className={`w-3.5 h-3.5 ${showComments ? 'text-white' : 'text-sky-600'}`} />
                <span>Komentar</span>
                <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono font-bold ${
                  showComments ? 'bg-white/25 text-white' : 'bg-sky-200/80 text-sky-950'
                }`}>
                  {commentCount}
                </span>
              </button>
            </div>

            {(showReactions || showComments) && (
              <button
                type="button"
                onClick={() => {
                  sound.playPop();
                  setShowReactions(false);
                  setShowComments(false);
                }}
                className="text-[11px] text-slate-500 hover:text-slate-800 font-semibold cursor-pointer transition-colors"
              >
                Tutup Panel ✕
              </button>
            )}
          </div>

          {/* Permanent Legal Disclaimer */}
          <div className="p-3.5 bg-[#FEF9C3] border border-[#FACC15] rounded-xl text-xs text-[#713F12] flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-[#A16207]" />
            <div>
              <strong>Asas Praduga Tak Bersalah:</strong> Data ini disusun demi kepentingan transparansi publik berdasarkan dokumen hukum terbuka. Setiap pihak yang berstatus Tersangka atau Terdakwa tetap berhak atas asas praduga tak bersalah hingga adanya vonis berkekuatan hukum tetap (inkrah).
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 flex items-center justify-between flex-wrap gap-2.5 border-t border-[#EFE5CE]">
            <button
              onClick={() => {
                sound.playPop();
                onOpenReport(caseData.id);
              }}
              className="px-3.5 py-2 bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] rounded-xl hover:bg-[#FEE2E2] text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Flag className="w-3.5 h-3.5" />
              <span>Laporkan Kesalahan Berkas</span>
            </button>

            <div className="flex items-center flex-wrap gap-2.5">
              <button
                onClick={handleShare}
                className="p-2.5 rounded-xl bg-white border border-[#CBD5E1] text-[#475569] hover:bg-gray-50 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
                title="Bagikan Tautan Kasus"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Bagikan</span>
              </button>

              <button
                onClick={() => {
                  sound.playPop();
                  onClose();
                }}
                className="px-4 py-2.5 bg-[#1E293B] text-white rounded-xl hover:bg-[#334155] text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                Tutup ✕
              </button>
            </div>
          </div>

        </div>

        {/* === RIGHT DRAWER: COMMENTS PANEL === */}
        {showComments && (
          <>
            {/* Desktop Companion Column (xl+) */}
            <div className="hidden xl:block w-[490px] 2xl:w-[540px] shrink-0 sticky top-6 bg-[#FFFDF8] border-3 border-[#E2D5B7] rounded-3xl shadow-2xl p-5 max-h-[88vh] overflow-y-auto animate-in slide-in-from-right duration-200">
              <CaseCommentsSection 
                caseId={caseData.id} 
                caseTitle={caseData.official?.nama ? `${caseData.official.nama} - ${caseData.jenis_kasus}` : undefined}
                embedded={true}
                onClose={() => setShowComments(false)}
                onCountChange={setCommentCount}
              />
            </div>

            {/* Mobile / Tablet Slide-in Drawer (< xl) */}
            <div 
              className="xl:hidden fixed inset-0 z-60 bg-black/50 backdrop-blur-xs flex justify-end animate-in fade-in duration-200"
              onClick={() => setShowComments(false)}
            >
              <div 
                className="w-[94vw] max-w-xl h-full bg-[#FFFDF8] border-l-3 border-[#E2D5B7] shadow-2xl p-5 overflow-y-auto animate-in slide-in-from-right duration-200"
                onClick={e => e.stopPropagation()}
              >
                <CaseCommentsSection 
                  caseId={caseData.id} 
                  caseTitle={caseData.official?.nama ? `${caseData.official.nama} - ${caseData.jenis_kasus}` : undefined}
                  embedded={true}
                  onClose={() => setShowComments(false)}
                  onCountChange={setCommentCount}
                />
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  );
};
