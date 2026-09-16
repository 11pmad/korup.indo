import React, { useState } from 'react';
import { Scale, ShieldAlert, X } from 'lucide-react';
import { sound } from '../utils/audio.js';

interface Props {
  className?: string;
  variant?: 'banner' | 'compact' | 'footer';
}

export const DisclaimerBanner: React.FC<Props> = ({ className = '', variant = 'banner' }) => {
  const [isDismissed, setIsDismissed] = useState<boolean>(false);

  if (isDismissed) {
    return (
      <div className="flex justify-end">
        <button
          onClick={() => {
            sound.playPop();
            setIsDismissed(false);
          }}
          className="text-xs text-[#854D0E] hover:text-[#713F12] font-semibold flex items-center gap-1.5 px-3 py-1 bg-[#FEF9C3] border border-[#FDE047] rounded-xl hover:bg-[#FEF08A] transition-all cursor-pointer shadow-2xs"
          title="Tampilkan kembali pemberitahuan hukum"
        >
          <Scale className="w-3.5 h-3.5 text-[#B45309]" />
          <span>Buka Pemberitahuan Hukum &amp; Asas Praduga</span>
        </button>
      </div>
    );
  }

  return (
    <div
      id="disclaimer-banner"
      className={`relative bg-[#FEF9C3] border-2 border-dashed border-[#CA8A04] rounded-2xl p-4 sm:p-5 shadow-sm text-[#713F12] transition-all duration-300 ${className}`}
    >
      {/* Decorative Washi Tape */}
      <div className="washi-tape washi-tape-yellow -top-3 left-6 sm:left-12"></div>
      <div className="washi-tape washi-tape-pink -top-3 right-6 sm:right-12"></div>

      {/* Close Button */}
      <button
        onClick={() => {
          sound.playPop();
          setIsDismissed(true);
        }}
        className="absolute top-3 right-3 p-1.5 rounded-xl bg-white/60 hover:bg-white text-[#854D0E] hover:text-[#991B1B] transition-colors border border-[#CA8A04]/30 cursor-pointer shadow-2xs"
        aria-label="Tutup pemberitahuan"
        title="Tutup pemberitahuan ini"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex items-start gap-3 sm:gap-4 pr-7">
        <div className="p-2.5 bg-[#FDE047] text-[#854D0E] rounded-xl shadow-inner shrink-0 rotate-[-2deg]">
          <Scale className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-hand font-bold text-lg text-[#854D0E] tracking-wide">
              ⚖️ PEMBERITAHUAN ASAS HUKUM &amp; SUMBER RESMI:
            </span>
            <span className="px-2 py-0.5 bg-[#FACC15] text-[#713F12] text-xs font-semibold rounded-full uppercase tracking-wider">
              Wajib Dibaca
            </span>
          </div>
          <p className="text-sm sm:text-base leading-relaxed text-[#5F370E]">
            &ldquo;Data bersumber dari putusan pengadilan &amp; pemberitaan media yang tercantum. Setiap orang berhak atas asas praduga tak bersalah hingga ada putusan berkekuatan hukum tetap.&rdquo;
          </p>
          <p className="text-xs text-[#854D0E] opacity-90 flex items-center gap-1.5 pt-1">
            <ShieldAlert className="w-3.5 h-3.5 inline" />
            Setiap data diverifikasi dengan tautan resmi direktori putusan Mahkamah Agung RI, KPK.go.id, atau media nasional kredibel.
          </p>
        </div>
      </div>
    </div>
  );
};
