"use client";

import React from 'react';
import { 
  BookOpen, 
  ShieldAlert, 
  Heart, 
  Lock, 
  Scale, 
  ShieldCheck, 
  Compass, 
  Trophy, 
  MapPin, 
  BarChart3, 
  Search, 
  Flag,
  Sparkles
} from 'lucide-react';
import { SupportDonationSection } from './SupportDonationSection';

interface FooterProps {
  onNavigate?: (tab: 'beranda' | 'peta' | 'klasemen' | 'statistik' | 'cari') => void;
  onOpenReport?: (mode?: 'new_case' | 'correction' | 'track') => void;
  onOpenAdmin?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ 
  onNavigate, 
  onOpenReport, 
  onOpenAdmin 
}) => {
  return (
    <footer className="mt-20 relative bg-[#F7F2E7] border-t-2 border-[#DFD3BA] text-[#57534E] overflow-hidden">
      {/* Decorative Scrapbook Washi Tapes */}
      <div className="washi-tape washi-tape-yellow -top-3 left-10 sm:left-24"></div>
      <div className="washi-tape washi-tape-pink -top-3 right-10 sm:right-24"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-8 space-y-8">
        
        {/* Main Footer 4-Column Responsive Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-6 items-start">
          
          {/* Column 1: Brand & Visi Publik (3 cols) */}
          <div className="lg:col-span-3 space-y-3.5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#FDE047] border-2 border-[#EAB308] shadow-xs flex items-center justify-center rotate-[-3deg] text-[#854D0E] shrink-0">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-marker text-2xl text-[#1E293B] tracking-wide">
                    Liga Korupsi
                  </span>
                  <span className="px-2 py-0.5 bg-[#FEF08A] text-[#854D0E] font-hand font-bold text-xs rounded-md border border-[#EAB308] rotate-2">
                    Indonesia
                  </span>
                </div>
                <span className="text-[11px] text-[#78716C] font-semibold block">
                  Pangkalan Data Transparansi &amp; Integritas Peradilan
                </span>
              </div>
            </div>

            <p className="text-xs leading-relaxed text-[#57534E]">
              Inisiatif keterbukaan data sipil independen yang mendokumentasikan perkara korupsi di Indonesia (1945–2026) berbasis putusan hukum inkrah, dakwaan jaksa, dan investigasi jurnalisme terverifikasi Dewan Pers.
            </p>

            {/* Civic Trust Badges */}
            <div className="flex flex-wrap gap-2 pt-0.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-[#E5DBCA] rounded-full text-[11px] font-semibold text-[#44403C] shadow-2xs">
                <Scale className="w-3.5 h-3.5 text-amber-600" />
                <span>43 Kasus Terverifikasi</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-[#E5DBCA] rounded-full text-[11px] font-semibold text-[#44403C] shadow-2xs">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Non-Partisan &amp; Terbuka</span>
              </span>
            </div>
          </div>

          {/* Column 2: Navigasi Cepat (3 cols) */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="font-hand font-bold text-base text-[#1E293B] uppercase tracking-wider flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-[#854D0E]" />
              <span>Eksplorasi Portal</span>
            </h4>
            <ul className="text-xs space-y-2 text-[#64748B]">
              <li>
                <button
                  onClick={() => {
                    onNavigate?.('klasemen');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="hover:text-[#DC2626] hover:translate-x-1 transition-all inline-flex items-center gap-2 cursor-pointer text-left"
                >
                  <Trophy className="w-3.5 h-3.5 text-amber-500" />
                  <span>Klasemen Liga Pejabat &amp; Partai</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    onNavigate?.('peta');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="hover:text-[#DC2626] hover:translate-x-1 transition-all inline-flex items-center gap-2 cursor-pointer text-left"
                >
                  <MapPin className="w-3.5 h-3.5 text-rose-500" />
                  <span>Peta Sebaran 38 Provinsi</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    onNavigate?.('statistik');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="hover:text-[#DC2626] hover:translate-x-1 transition-all inline-flex items-center gap-2 cursor-pointer text-left"
                >
                  <BarChart3 className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Statistik &amp; Hall of Shame</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    onNavigate?.('cari');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="hover:text-[#DC2626] hover:translate-x-1 transition-all inline-flex items-center gap-2 cursor-pointer text-left"
                >
                  <Search className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Pencarian Berkas &amp; Terdakwa</span>
                </button>
              </li>
              {onOpenReport && (
                <>
                  <li className="pt-1">
                    <button
                      onClick={() => onOpenReport('new_case')}
                      className="text-amber-900 font-bold hover:text-amber-950 inline-flex items-center gap-1.5 bg-[#FEF3C7] hover:bg-[#FDE68A] border border-[#FCD34D] px-2.5 py-1 rounded-lg transition-colors cursor-pointer text-[11px]"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                      <span>Usulkan Kasus Baru</span>
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => onOpenReport('correction')}
                      className="text-slate-600 hover:text-rose-700 inline-flex items-center gap-1.5 transition-colors cursor-pointer text-[11px]"
                    >
                      <Flag className="w-3 h-3 text-rose-500" />
                      <span>Laporkan Koreksi Data</span>
                    </button>
                  </li>
                </>
              )}
            </ul>
          </div>

          {/* Column 3: Landasan Sumber & Asas Hukum (3 cols) */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="font-hand font-bold text-base text-[#1E293B] uppercase tracking-wider flex items-center gap-1.5">
              <Scale className="w-4 h-4 text-[#854D0E]" />
              <span>Landasan &amp; Rujukan</span>
            </h4>
            <ul className="text-xs space-y-1.5 text-[#64748B]">
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                <span>Direktori Putusan Mahkamah Agung RI</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                <span>Komisi Pemberantasan Korupsi (KPK)</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                <span>Kejaksaan RI &amp; PN Tipikor</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                <span>Media Terverifikasi Dewan Pers</span>
              </li>
            </ul>

            {/* Asas Praduga Tak Bersalah Ticket Card */}
            <div className="bg-[#FFFDF9] border border-dashed border-[#CA8A04]/70 rounded-2xl p-2.5 space-y-1 text-[#713F12] shadow-2xs">
              <div className="flex items-center gap-1.5 font-bold text-[11px] text-[#854D0E]">
                <ShieldAlert className="w-3.5 h-3.5 text-[#CA8A04] shrink-0" />
                <span>Asas Praduga Tak Bersalah</span>
              </div>
              <p className="text-[10px] leading-snug text-[#78716C]">
                Pihak yang masih berstatus Tersangka atau Terdakwa tetap dilindungi hak asas praduga tak bersalah sampai adanya putusan berkekuatan hukum tetap (inkrah).
              </p>
            </div>
          </div>

          {/* Column 4: Kotak Minimalis QRIS Donasi (3 cols) */}
          <div className="lg:col-span-3 flex justify-start lg:justify-end">
            <SupportDonationSection />
          </div>

        </div>

        {/* Bottom Sub-footer Bar */}
        <div className="pt-5 border-t border-dashed border-[#DFD3BA] flex flex-col sm:flex-row items-center justify-between text-xs text-[#78716C] gap-3">
          <div className="flex items-center gap-2 text-center sm:text-left">
            <p>© {new Date().getFullYear()} Liga Korupsi Indonesia (LKI).</p>
            <span className="text-[#D5C9AB] hidden sm:inline">•</span>
            <span className="hidden sm:inline text-[11px]">Portal Sipil Terbuka untuk Integritas Bangsa</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <div className="flex items-center gap-1 text-[11px] text-[#78716C]">
              <span>Dibuat demi Indonesia yang lebih bersih</span>
              <Heart className="w-3.5 h-3.5 text-rose-500 inline fill-rose-500" />
            </div>

            {onOpenAdmin && (
              <>
                <span className="text-[#D5C9AB] hidden sm:inline">•</span>
                <button
                  id="footer-admin-login-btn"
                  onClick={() => {
                    onOpenAdmin();
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#78716C] hover:text-[#DC2626] transition-colors py-1 px-2.5 rounded-lg hover:bg-[#EDE3CB] cursor-pointer"
                  title="Akses Masuk Khusus Tim Pengelola & Kurator"
                >
                  <Lock className="w-3 h-3 opacity-75" />
                  <span>Login Pengelola</span>
                </button>
              </>
            )}
          </div>
        </div>

      </div>
    </footer>
  );
};
