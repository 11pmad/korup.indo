"use client";

import React, { useState, useEffect } from 'react';
import { Scale, ShieldAlert, X, AlertTriangle } from 'lucide-react';
import { sound } from '../utils/audio';

interface Props {
  className?: string;
  forceShow?: boolean;
  status?: string;
}

export const PresumptionOfInnocenceBanner: React.FC<Props> = ({
  className = '',
  forceShow = false,
  status
}) => {
  const [isDismissed, setIsDismissed] = useState<boolean>(false);

  useEffect(() => {
    // Check sessionStorage (per-session dismiss only, NOT permanent localStorage)
    const dismissedInSession = sessionStorage.getItem('lki_presumption_dismissed');
    if (dismissedInSession === 'true' && !forceShow) {
      setIsDismissed(true);
    }
  }, [forceShow]);

  const handleDismiss = () => {
    sound.playPop();
    sessionStorage.setItem('lki_presumption_dismissed', 'true');
    setIsDismissed(true);
  };

  const handleRestore = () => {
    sound.playPop();
    sessionStorage.removeItem('lki_presumption_dismissed');
    setIsDismissed(false);
  };

  if (isDismissed && !forceShow) {
    return (
      <div className={`flex justify-end my-2 ${className}`}>
        <button
          onClick={handleRestore}
          className="text-xs text-[#854D0E] hover:text-[#713F12] font-semibold flex items-center gap-1.5 px-3 py-1 bg-[#FEF9C3] border border-[#FDE047] rounded-xl hover:bg-[#FEF08A] transition-all cursor-pointer shadow-xs"
          title="Tampilkan kembali pemberitahuan hukum praduga tak bersalah"
        >
          <Scale className="w-3.5 h-3.5 text-[#B45309]" />
          <span>Buka Asas Praduga Tak Bersalah</span>
        </button>
      </div>
    );
  }

  const isTersangkaOrTerdakwa = status && (status.toLowerCase().includes('tersangka') || status.toLowerCase().includes('terdakwa'));

  return (
    <div
      id="presumption-of-innocence-banner"
      className={`relative ${
        isTersangkaOrTerdakwa ? 'bg-[#FFF7ED] border-[#F97316]' : 'bg-[#FEF9C3] border-[#CA8A04]'
      } border-2 border-dashed rounded-2xl p-4 sm:p-5 shadow-sm text-[#713F12] transition-all duration-300 ${className}`}
    >
      {/* Decorative Washi Tape */}
      <div className="washi-tape washi-tape-yellow -top-3 left-6 sm:left-12"></div>
      <div className="washi-tape washi-tape-pink -top-3 right-6 sm:right-12"></div>

      {/* Close Button (Session Dismissible) */}
      <button
        onClick={handleDismiss}
        className="absolute top-3 right-3 p-1.5 rounded-xl bg-white/70 hover:bg-white text-[#854D0E] hover:text-[#991B1B] transition-colors border border-[#CA8A04]/30 cursor-pointer shadow-xs"
        aria-label="Tutup untuk sesi ini"
        title="Tutup untuk sesi kunjungan saat ini"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex items-start gap-3 sm:gap-4 pr-7">
        <div
          className={`p-2.5 ${
            isTersangkaOrTerdakwa ? 'bg-[#FFEDD5] text-[#C2410C]' : 'bg-[#FDE047] text-[#854D0E]'
          } rounded-xl shadow-inner shrink-0 rotate-[-2deg]`}
        >
          {isTersangkaOrTerdakwa ? (
            <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6" />
          ) : (
            <Scale className="w-5 h-5 sm:w-6 sm:h-6" />
          )}
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-hand font-bold text-lg text-[#854D0E] tracking-wide">
              PEMBERITAHUAN ASAS HUKUM &amp; PRADUGA TAK BERSALAH:
            </span>
            <span
              className={`px-2 py-0.5 ${
                isTersangkaOrTerdakwa ? 'bg-[#FDBA74] text-[#7C2D12]' : 'bg-[#FACC15] text-[#713F12]'
              } text-xs font-semibold rounded-full uppercase tracking-wider`}
            >
              Pasal 8 Ayat (1) UU Kekuasaan Kehakiman
            </span>
          </div>
          <p className="text-sm sm:text-base leading-relaxed text-[#5F370E]">
            &ldquo;Setiap orang yang disangka, ditangkap, ditahan, dituntut, atau dihadapkan di depan pengadilan
            <strong> wajib dianggap tidak bersalah</strong> sebelum ada putusan pengadilan yang menyatakan
            kesalahannya dan telah memperoleh kekuatan hukum tetap (<em>inkracht van gewijsde</em>).&rdquo;
          </p>
          <p className="text-xs text-[#854D0E] opacity-90 flex items-center gap-1.5 pt-1">
            <ShieldAlert className="w-3.5 h-3.5 inline shrink-0" />
            Semua data di LKI wajib menyertakan tautan sumber resmi Direktori Putusan Mahkamah Agung RI, KPK.go.id,
            atau rilis resmi Kejaksaan Agung RI.
          </p>
        </div>
      </div>
    </div>
  );
};
