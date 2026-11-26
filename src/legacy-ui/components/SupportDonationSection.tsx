"use client";

import React, { useState, useEffect } from 'react';
import { 
  QrCode, 
  Maximize2, 
  X, 
  Heart,
  Download
} from 'lucide-react';
import { sound } from '../utils/audio';

interface DonationConfig {
  title: string;
  description: string;
  qris_image_url: string;
  account_name: string;
  bank_info: string;
  is_active: boolean;
}

export const SupportDonationSection: React.FC = () => {
  const [config, setConfig] = useState<DonationConfig | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    fetch('/api/settings/donation')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data && isMounted) {
          setConfig(data);
        }
      })
      .catch(() => {
        // fail silently
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && lightboxOpen) {
        setLightboxOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxOpen]);

  if (!config || !config.is_active) {
    return null;
  }

  // Short display title
  const displayTitle = config.title 
    ? (config.title.length > 20 ? 'Dukungan QRIS' : config.title)
    : 'Dukungan QRIS';

  return (
    <>
      <div 
        id="footer-qris-box"
        className="relative bg-[#FFFDF9] border-2 border-[#E5DAC4] hover:border-[#CA8A04] transition-all rounded-2xl p-3.5 shadow-sm text-center space-y-2.5 w-full max-w-[215px] sm:max-w-[230px] shrink-0 rotate-[1deg] hover:rotate-0 group"
      >
        {/* Decorative Mini Tape */}
        <div className="washi-tape washi-tape-yellow -top-2.5 left-1/2 -translate-x-1/2 !w-20 !h-4 !opacity-90 shadow-xs"></div>

        {/* Judul Sedikit */}
        <div className="pt-0.5 flex items-center justify-center gap-1.5 text-xs sm:text-sm font-bold text-[#78350F] font-hand">
          <QrCode className="w-4 h-4 text-[#CA8A04] shrink-0" />
          <span className="truncate" title={config.title || 'Dukungan QRIS'}>
            {displayTitle}
          </span>
        </div>

        {/* Gambar QRIS Preview Diperbesar */}
        {config.qris_image_url ? (
          <div 
            onClick={() => {
              sound.playPop();
              setLightboxOpen(true);
            }}
            className="group/img relative cursor-pointer bg-white p-2 border border-[#E7DECB] rounded-2xl inline-block hover:border-[#CA8A04] hover:shadow-md transition-all shadow-xs"
            title="Klik untuk memperbesar kode QRIS"
          >
            <img 
              src={config.qris_image_url} 
              alt="Kode QRIS Donasi Pengelola LKI" 
              className="w-40 h-40 sm:w-44 sm:h-44 object-contain rounded-xl mx-auto transition-transform group-hover/img:scale-102"
            />
            
            {/* Hover Overlay */}
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-2xs rounded-2xl opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white text-xs font-bold">
              <Maximize2 className="w-4 h-4" />
              <span>Perbesar</span>
            </div>
          </div>
        ) : (
          <div className="w-40 h-40 sm:w-44 sm:h-44 bg-slate-50 border border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-400 p-3 mx-auto">
            <QrCode className="w-8 h-8 mb-1 text-slate-300 stroke-1" />
            <span className="text-[10px] text-center leading-tight">
              QRIS belum dipasang
            </span>
          </div>
        )}

        {/* Info Sedikit di Bawah Gambar */}
        <div className="text-[11px] text-[#78716C] leading-tight space-y-1">
          {config.account_name ? (
            <p className="font-bold text-[#44403C] truncate max-w-[190px] mx-auto" title={config.account_name}>
              A.N. {config.account_name}
            </p>
          ) : (
            <p className="font-medium text-[#78716C]">Scan donasi QRIS</p>
          )}
          <span className="text-[10px] text-[#854D0E] font-medium block">
            🔍 Klik gambar untuk perbesar
          </span>
        </div>
      </div>

      {/* Lightbox Modal for Large QRIS view when clicked */}
      {lightboxOpen && config.qris_image_url && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
          onClick={() => setLightboxOpen(false)}
        >
          <div 
            className="bg-white rounded-3xl p-5 sm:p-7 max-w-xl md:max-w-2xl lg:max-w-3xl w-full max-h-[96vh] shadow-2xl space-y-4 text-center relative animate-in fade-in zoom-in duration-200 flex flex-col justify-between overflow-y-auto my-auto"
            onClick={e => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => {
                sound.playPop();
                setLightboxOpen(false);
              }}
              className="absolute top-4 right-4 sm:top-5 sm:right-5 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 cursor-pointer transition-colors shadow-xs z-10"
              title="Tutup (Esc)"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>

            {/* Modal Header */}
            <div className="space-y-1 text-left pr-10">
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-rose-500 fill-rose-500 shrink-0" />
                <h4 className="font-bold text-base sm:text-lg md:text-xl text-slate-900 truncate">
                  {config.title || 'Dukungan QRIS Pengelola LKI'}
                </h4>
              </div>
              <p className="text-xs sm:text-sm text-slate-500">
                Pindai kode QRIS di bawah melalui aplikasi m-banking atau dompet digital (GoPay, OVO, Dana, BCA, BRI, Mandiri, dll).
              </p>
            </div>

            {/* Giant QRIS Image Container */}
            <div className="w-full p-3 sm:p-6 bg-[#FFFDF8] border-2 border-[#E7DECB] rounded-3xl shadow-inner flex items-center justify-center overflow-hidden">
              <img 
                src={config.qris_image_url} 
                alt="QRIS Admin Full" 
                className="w-auto h-auto max-h-[58vh] sm:max-h-[64vh] md:max-h-[68vh] max-w-full object-contain mx-auto rounded-2xl drop-shadow-md transition-transform hover:scale-[1.01]"
              />
            </div>

            {/* Account & Bank Info */}
            <div className="space-y-1 text-center">
              {config.account_name && (
                <div className="text-sm sm:text-base font-extrabold text-slate-900">
                  A.N. {config.account_name}
                </div>
              )}
              {config.bank_info && (
                <div className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto leading-relaxed">
                  {config.bank_info}
                </div>
              )}
            </div>

            {/* Action Buttons: Download + Close */}
            <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-center gap-3">
              <a
                href={config.qris_image_url}
                download="QRIS_Donasi_LKI.png"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs sm:text-sm transition-all shadow-xs inline-flex items-center justify-center gap-2 cursor-pointer"
                title="Unduh file gambar QRIS ke perangkat Anda"
              >
                <Download className="w-4 h-4" />
                <span>Simpan Gambar QRIS</span>
              </a>
              <button
                onClick={() => setLightboxOpen(false)}
                className="w-full sm:w-auto px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs sm:text-sm font-bold transition-colors cursor-pointer shadow-xs"
              >
                Selesai / Tutup
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
};
