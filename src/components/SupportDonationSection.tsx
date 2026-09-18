import React, { useState, useEffect } from 'react';
import { 
  Heart, 
  QrCode, 
  Maximize2, 
  X, 
  ShieldCheck, 
  Smartphone, 
  Coffee,
  Sparkles
} from 'lucide-react';
import { sound } from '../utils/audio.js';

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

  if (!config || !config.is_active) {
    return null;
  }

  return (
    <>
      <section 
        id="support-donation-section"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-14 mb-4"
      >
        <div className="relative bg-[#FFFDF8] border-2 border-dashed border-[#CA8A04] rounded-3xl p-6 sm:p-8 md:p-10 shadow-md">
          
          {/* Decorative Washi Tapes */}
          <div className="washi-tape washi-tape-yellow -top-3.5 left-8 sm:left-16"></div>
          <div className="washi-tape washi-tape-pink -top-3.5 right-8 sm:right-16"></div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Left Column: Narrative & Purpose (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A] rounded-full text-xs font-bold uppercase tracking-wider">
                <Coffee className="w-3.5 h-3.5 text-[#B45309]" />
                <span>Dukungan Operasional Independen</span>
              </div>

              <h3 className="font-hand font-bold text-2xl sm:text-3xl text-[#78350F] leading-tight">
                {config.title || '☕ Dukung Independensi & Operasional LKI'}
              </h3>

              <p className="text-sm sm:text-base text-[#57534E] leading-relaxed">
                {config.description || 'Bantu operasional server, infrastruktur pangkalan data, verifikasi berkas direktori putusan peradilan, dan keterbukaan informasi korupsi Indonesia tanpa kompromi.'}
              </p>

              {/* Purpose Pillars */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-3 bg-[#FDFBF7] rounded-2xl border border-[#E7DECB] flex items-start gap-2.5">
                  <div className="p-1.5 bg-emerald-100 text-emerald-800 rounded-lg shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-[#1E293B]">100% Independen</h5>
                    <p className="text-[11px] text-[#64748B] leading-snug">
                      Bebas intervensi dan kepentingan partai manapun
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-[#FDFBF7] rounded-2xl border border-[#E7DECB] flex items-start gap-2.5">
                  <div className="p-1.5 bg-amber-100 text-amber-800 rounded-lg shrink-0">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-[#1E293B]">Server &amp; Database</h5>
                    <p className="text-[11px] text-[#64748B] leading-snug">
                      Menjaga portal tetap daring dan bebas diakses warga
                    </p>
                  </div>
                </div>
              </div>

              {/* Supported Apps List */}
              <div className="pt-2 flex items-center gap-2 flex-wrap text-[11px] text-[#78716C]">
                <Smartphone className="w-3.5 h-3.5 text-[#A8A29E]" />
                <span className="font-medium">Mendukung Pembayaran QRIS:</span>
                <span className="px-2 py-0.5 bg-[#F5F0E6] rounded-md font-semibold text-[#57534E]">BCA</span>
                <span className="px-2 py-0.5 bg-[#F5F0E6] rounded-md font-semibold text-[#57534E]">Mandiri</span>
                <span className="px-2 py-0.5 bg-[#F5F0E6] rounded-md font-semibold text-[#57534E]">BRI</span>
                <span className="px-2 py-0.5 bg-[#F5F0E6] rounded-md font-semibold text-[#57534E]">BNI</span>
                <span className="px-2 py-0.5 bg-[#F5F0E6] rounded-md font-semibold text-[#57534E]">GoPay</span>
                <span className="px-2 py-0.5 bg-[#F5F0E6] rounded-md font-semibold text-[#57534E]">OVO</span>
                <span className="px-2 py-0.5 bg-[#F5F0E6] rounded-md font-semibold text-[#57534E]">Dana</span>
                <span className="px-2 py-0.5 bg-[#F5F0E6] rounded-md font-semibold text-[#57534E]">ShopeePay</span>
              </div>

            </div>

            {/* Right Column: QRIS Card Presentation (5 cols) */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="w-full max-w-sm bg-white border-2 border-[#E7DECB] rounded-3xl p-5 sm:p-6 shadow-md text-center space-y-4 rotate-[1deg] hover:rotate-0 transition-transform">
                
                {/* Header of QRIS box */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                      <QrCode className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-slate-800 tracking-wide uppercase">
                      QRIS Pembayaran Nasional
                    </span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                    Resmi
                  </span>
                </div>

                {/* QR Code Container */}
                {config.qris_image_url ? (
                  <div 
                    onClick={() => {
                      sound.playPop();
                      setLightboxOpen(true);
                    }}
                    className="group relative cursor-pointer inline-block p-3 bg-[#FFFDF8] border-2 border-slate-200 rounded-2xl shadow-inner hover:border-[#DC2626] transition-all"
                    title="Klik untuk memperbesar kode QRIS"
                  >
                    <img 
                      src={config.qris_image_url} 
                      alt="Kode QRIS Donasi Pengelola LKI" 
                      className="w-48 h-48 sm:w-56 sm:h-56 object-contain mx-auto transition-transform group-hover:scale-102"
                    />
                    
                    {/* Hover Zoom Overlay */}
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-2xs rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white text-xs font-bold">
                      <Maximize2 className="w-4 h-4" />
                      <span>Perbesar Kode QR</span>
                    </div>
                  </div>
                ) : (
                  <div className="py-12 px-4 bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-center space-y-2">
                    <QrCode className="w-12 h-12 mx-auto text-slate-300 stroke-1" />
                    <p className="text-xs font-semibold text-slate-600">
                      QRIS Sedang Disiapkan
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Pengelola dapat mengunggah gambar QRIS melalui menu admin.
                    </p>
                  </div>
                )}

                {/* Account & Bank Info */}
                <div className="space-y-1 pt-1">
                  {config.account_name && (
                    <div className="text-xs sm:text-sm font-bold text-slate-800 tracking-wide">
                      A.N. {config.account_name}
                    </div>
                  )}

                  {config.bank_info && (
                    <p className="text-[11px] text-slate-500 bg-slate-50 py-1.5 px-3 rounded-xl border border-slate-100 leading-snug">
                      {config.bank_info}
                    </p>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-400 font-mono">
                  Bebas nominal donasi • Berapapun sangat berarti
                </div>

              </div>
            </div>

          </div>

        </div>
      </section>

      {/* Lightbox Modal for Large QRIS view */}
      {lightboxOpen && config.qris_image_url && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setLightboxOpen(false)}
        >
          <div 
            className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 text-center relative animate-in fade-in zoom-in duration-200"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => {
                sound.playPop();
                setLightboxOpen(false);
              }}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 cursor-pointer transition-colors"
              title="Tutup"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1 text-left">
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
                <h4 className="font-bold text-sm text-slate-900">
                  {config.title || 'Dukungan QRIS Admin LKI'}
                </h4>
              </div>
              <p className="text-xs text-slate-500">
                Pindai kode QRIS di bawah menggunakan kamera m-banking atau e-wallet.
              </p>
            </div>

            <div className="p-4 bg-[#FFFDF8] border-2 border-slate-200 rounded-2xl inline-block shadow-inner">
              <img 
                src={config.qris_image_url} 
                alt="QRIS Admin Full" 
                className="w-72 h-72 sm:w-80 sm:h-80 object-contain mx-auto"
              />
            </div>

            <div className="space-y-1">
              {config.account_name && (
                <div className="text-sm font-bold text-slate-900">
                  A.N. {config.account_name}
                </div>
              )}
              {config.bank_info && (
                <div className="text-xs text-slate-500">
                  {config.bank_info}
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-slate-100">
              <button
                onClick={() => setLightboxOpen(false)}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
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
