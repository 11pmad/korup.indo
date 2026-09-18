import React from 'react';
import { CorruptionCase } from '../types.js';
import { formatRupiah } from '../utils/formatters.js';
import { sound } from '../utils/audio.js';
import { getOfficialPhoto, handleImageError } from '../utils/photo.js';
import { 
  X, 
  Building2, 
  Calendar, 
  User, 
  Flame, 
  ShieldAlert, 
  ExternalLink, 
  ChevronRight,
  FileText,
  MapPin,
  Clock
} from 'lucide-react';

export interface DrilldownTarget {
  type: 'company' | 'party' | 'year' | 'category';
  title: string;
  subtitle?: string;
  badgeText?: string;
  badgeColor?: string;
  icon?: string;
  cases: CorruptionCase[];
  totalLoss: number;
}

interface StatsDrilldownModalProps {
  target: DrilldownTarget | null;
  onClose: () => void;
  onSelectCase: (caseId: string) => void;
}

export const StatsDrilldownModal: React.FC<StatsDrilldownModalProps> = ({
  target,
  onClose,
  onSelectCase
}) => {
  if (!target) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-3xl max-h-[90vh] bg-[#FFFDF9] border-3 border-[#D5C9AB] rounded-3xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Decorative Tape */}
        <div className="washi-tape washi-tape-yellow -top-3 left-10"></div>
        <div className="washi-tape washi-tape-pink -top-3 right-10"></div>

        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-[#FAF5E8] border-b border-[#EAE0CD] flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="w-10 h-10 rounded-2xl bg-[#FEF08A] text-[#854D0E] border border-[#EAB308] flex items-center justify-center text-xl shadow-inner shrink-0">
              {target.icon || '📂'}
            </span>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#FFFDF8] border border-[#D5C9AB] text-[#57534E]">
                  {target.type === 'company' 
                    ? 'Rekanan Swasta / Korporasi Terlibat' 
                    : target.type === 'party' 
                    ? 'Afiliasi Partai Politik' 
                    : target.type === 'year' 
                    ? 'Perkara Berdasarkan Tahun' 
                    : 'Kategori / Modus Tipikor'}
                </span>
                {target.badgeText && (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-[#E0F2FE] text-[#0369A1] border border-[#BAE6FD]">
                    {target.badgeText}
                  </span>
                )}
              </div>
              <h2 className="font-marker text-2xl sm:text-3xl text-[#1E293B] mt-1">
                {target.title}
              </h2>
              {target.subtitle && (
                <p className="text-xs text-[#64748B] mt-0.5">
                  {target.subtitle}
                </p>
              )}
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={() => {
              sound.playPop();
              onClose();
            }}
            className="p-2 rounded-xl bg-white text-[#57534E] hover:text-[#DC2626] hover:bg-[#FEE2E2] border border-[#D5C9AB] transition-colors cursor-pointer shrink-0"
            aria-label="Tutup jendela rincian"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Highlight Metrics Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 px-5 py-3 bg-[#F4EDE0] border-b border-[#E7DECB] text-xs">
          <div>
            <span className="text-[10px] font-bold text-gray-500 uppercase block">Total Nilai Kerugian Terkait</span>
            <span className="font-marker text-base sm:text-lg text-[#DC2626]">
              {formatRupiah(target.totalLoss)}
            </span>
          </div>
          <div>
            <span className="text-[10px] font-bold text-gray-500 uppercase block">Jumlah Perkara</span>
            <span className="font-marker text-base sm:text-lg text-[#0369A1]">
              {target.cases.length} Perkara
            </span>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <span className="text-[10px] font-bold text-gray-500 uppercase block">Terdakwa / Terlibat</span>
            <span className="font-bold text-xs text-[#1E293B] truncate block">
              {Array.from(new Set(target.cases.map(c => c.official?.nama || 'Anonim'))).length} Tokoh / Pejabat
            </span>
          </div>
        </div>

        {/* Modal Body: Scrollable Cases & Defendants List */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 max-h-[60vh]">
          <div className="text-xs font-bold text-[#57534E] flex items-center justify-between">
            <span>DAFTAR TERDAKWA, PERKARA &amp; WAKTU KEJADIAN:</span>
            <span className="text-[11px] text-gray-500 font-normal">Klik entri untuk buka berkas lengkap</span>
          </div>

          {target.cases.length === 0 ? (
            <div className="py-12 text-center text-gray-500 text-sm">
              Tidak ada data perkara spesifik yang terhubung.
            </div>
          ) : (
            target.cases.map((c, index) => {
              const off = c.official;
              return (
                <div
                  key={c.id}
                  onClick={() => {
                    sound.playPop();
                    onSelectCase(c.id);
                  }}
                  className="group relative bg-white border-2 border-[#E7DECB] hover:border-[#FB923C] rounded-2xl p-4 transition-all duration-200 hover:shadow-md cursor-pointer space-y-3"
                >
                  {/* Row Top: Official & Status */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#F4EDE0] pb-2.5">
                    <div className="flex items-center gap-3">
                      <img 
                        src={getOfficialPhoto(off?.foto_url)} 
                        alt={off?.nama || 'Foto Pejabat'} 
                        onError={handleImageError}
                        className="w-11 h-11 rounded-xl object-cover border border-[#D5C9AB] shrink-0" 
                      />
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-sm text-[#1E293B] group-hover:text-[#0284C7] transition-colors">
                            {off?.nama || 'Pejabat Publik Terkait'}
                          </span>
                          {off?.partai && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FEF3C7] text-[#854D0E] border border-[#FCD34D]">
                              {off.partai}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-600">
                          {off?.jabatan || 'Pejabat Negara'}
                        </div>
                        {off?.provinsi && (
                          <div className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 text-[#0284C7]" />
                            <span>{off.kota_kabupaten ? `${off.kota_kabupaten}, ` : ''}{off.provinsi}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-end justify-between sm:justify-center gap-1 shrink-0">
                      <span className="font-marker text-base text-[#DC2626]">
                        {formatRupiah(c.nilai_kerugian_negara)}
                      </span>
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-md border ${
                        c.status_hukum === 'Divonis Inkrah'
                          ? 'bg-[#DCFCE7] text-[#166534] border-[#86EFAC]'
                          : c.status_hukum === 'Terdakwa'
                          ? 'bg-[#FEF3C7] text-[#92400E] border-[#FCD34D]'
                          : c.status_hukum === 'Tersangka'
                          ? 'bg-[#FEE2E2] text-[#991B1B] border-[#FECACA]'
                          : 'bg-[#F1F5F9] text-[#475569] border-[#CBD5E1]'
                      }`}>
                        ⚖️ {c.status_hukum}
                      </span>
                    </div>
                  </div>

                  {/* Row Middle: Apa yang terjadi (Ringkasan Kasus) */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#B45309]">
                      <FileText className="w-3.5 h-3.5" />
                      <span>{c.jenis_kasus || 'Perkara Tindak Pidana Korupsi'}</span>
                    </div>
                    <p className="text-xs leading-relaxed text-[#334155] bg-[#FFFDF8] p-2.5 rounded-xl border border-[#F1E8D5]">
                      {c.ringkasan_kasus}
                    </p>
                  </div>

                  {/* Row Bottom: Kapan Kejadian, Putusan & Perusahaan Terkait */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] text-gray-500">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="flex items-center gap-1 bg-[#FAF5E8] px-2 py-0.5 rounded-md border border-[#E7DECB]">
                        <Clock className="w-3 h-3 text-[#B45309]" />
                        <span>Tahun Kejadian: <strong>{c.tahun_kejadian}</strong></span>
                      </span>
                      {c.tahun_putusan && (
                        <span className="flex items-center gap-1 bg-[#FAF5E8] px-2 py-0.5 rounded-md border border-[#E7DECB]">
                          <Calendar className="w-3 h-3 text-[#166534]" />
                          <span>Tahun Putusan: <strong>{c.tahun_putusan}</strong></span>
                        </span>
                      )}
                      {c.perusahaan_terkait && c.perusahaan_terkait.length > 0 && (
                        <span className="flex items-center gap-1 text-[#475569]">
                          <Building2 className="w-3 h-3 text-[#EA580C]" />
                          <span>Mitra: {c.perusahaan_terkait.join(', ')}</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 text-[#0284C7] font-bold group-hover:translate-x-0.5 transition-transform">
                      <span>Buka Berkas Lengkap</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-[#FAF5E8] border-t border-[#EAE0CD] flex items-center justify-between flex-wrap gap-2 text-xs">
          <span className="text-[#64748B] flex items-center gap-1">
            <ShieldAlert className="w-3.5 h-3.5 text-[#DC2626]" />
            Data disarikan dari direktori putusan pengadilan &amp; rilis pers KPK resmi.
          </span>
          <button
            onClick={() => {
              sound.playPop();
              onClose();
            }}
            className="px-4 py-2 bg-[#1E293B] hover:bg-[#0F172A] text-white font-bold rounded-xl transition-colors cursor-pointer"
          >
            Tutup Rincian
          </button>
        </div>

      </div>
    </div>
  );
};
