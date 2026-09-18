import React, { useState } from 'react';
import { 
  Home,
  MapPin, 
  Trophy, 
  BarChart3, 
  Search, 
  Sparkles, 
  Volume2, 
  VolumeX, 
  Flag,
  Menu,
  X,
  BookOpen
} from 'lucide-react';
import { sound } from '../utils/audio.js';

interface NavbarProps {
  activeTab: 'beranda' | 'peta' | 'klasemen' | 'statistik' | 'cari' | 'admin';
  setActiveTab: (tab: 'beranda' | 'peta' | 'klasemen' | 'statistik' | 'cari' | 'admin') => void;
  onOpenReport: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenReport
}) => {
  const [soundOn, setSoundOn] = useState(sound.isEnabled);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleSound = () => {
    sound.isEnabled = !sound.isEnabled;
    setSoundOn(sound.isEnabled);
    if (sound.isEnabled) {
      sound.playPop();
    }
  };

  const handleNavClick = (tab: 'beranda' | 'peta' | 'klasemen' | 'statistik' | 'cari' | 'admin') => {
    sound.playPop();
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#FFFDF8]/95 backdrop-blur-md border-b-2 border-[#E7DFCC] shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo & Brand in Scrapbook Style */}
          <div 
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => handleNavClick('beranda')}
          >
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl bg-[#FDE047] border-2 border-[#EAB308] shadow-md flex items-center justify-center rotate-[-4deg] group-hover:rotate-0 transition-transform">
                <BookOpen className="w-7 h-7 text-[#854D0E]" />
              </div>
              <span className="absolute -top-2 -right-2 px-1.5 py-0.5 bg-[#DC2626] text-white text-[10px] font-bold rounded-full rotate-6 shadow-sm">
                LKI 🇮🇩
              </span>
            </div>
            
            <div>
              <div className="flex items-center gap-2">
                <span className="font-marker text-2xl sm:text-3xl text-[#1E293B] tracking-wide">
                  Liga Korupsi
                </span>
                <span className="px-2 py-0.5 bg-[#FEF08A] text-[#854D0E] font-hand font-bold text-xs rounded-md border border-[#EAB308] rotate-2">
                  Indonesia
                </span>
              </div>
              <p className="text-xs text-[#64748B] font-medium hidden sm:block">
                Portal Transparansi Perkara &amp; Putusan Hukum Terbuka
              </p>
            </div>
          </div>

          {/* Desktop Nav Items */}
          <nav className="hidden lg:flex items-center gap-1.5">
            <button
              id="nav-beranda-btn"
              onClick={() => handleNavClick('beranda')}
              className={`px-3 py-2 rounded-xl text-sm font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'beranda'
                  ? 'bg-[#FDE047] text-[#854D0E] shadow-sm border border-[#EAB308]'
                  : 'text-[#475569] hover:bg-[#F1EBD9] hover:text-[#0F172A]'
              }`}
            >
              <Home className="w-4 h-4" />
              <span>Beranda</span>
            </button>

            <button
              id="nav-klasemen-btn"
              onClick={() => handleNavClick('klasemen')}
              className={`px-3 py-2 rounded-xl text-sm font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'klasemen'
                  ? 'bg-[#FB923C] text-white shadow-md border border-[#EA580C]'
                  : 'text-[#475569] hover:bg-[#F1EBD9] hover:text-[#0F172A]'
              }`}
            >
              <Trophy className="w-4 h-4" />
              <span>Klasemen Liga</span>
            </button>

            <button
              id="nav-peta-btn"
              onClick={() => handleNavClick('peta')}
              className={`px-3 py-2 rounded-xl text-sm font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'peta'
                  ? 'bg-[#38BDF8] text-white shadow-md border border-[#0284C7]'
                  : 'text-[#475569] hover:bg-[#F1EBD9] hover:text-[#0F172A]'
              }`}
            >
              <MapPin className="w-4 h-4" />
              <span>Peta Wilayah</span>
            </button>

            <button
              id="nav-statistik-btn"
              onClick={() => handleNavClick('statistik')}
              className={`px-3 py-2 rounded-xl text-sm font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'statistik'
                  ? 'bg-[#4ADE80] text-[#064E3B] shadow-md border border-[#16A34A]'
                  : 'text-[#475569] hover:bg-[#F1EBD9] hover:text-[#0F172A]'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Statistik</span>
            </button>

            <button
              id="nav-cari-btn"
              onClick={() => handleNavClick('cari')}
              className={`px-3 py-2 rounded-xl text-sm font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'cari'
                  ? 'bg-[#C084FC] text-white shadow-md border border-[#9333EA]'
                  : 'text-[#475569] hover:bg-[#F1EBD9] hover:text-[#0F172A]'
              }`}
            >
              <Search className="w-4 h-4" />
              <span>Cari Kasus</span>
            </button>

            <button
              id="nav-admin-btn"
              onClick={() => handleNavClick('admin')}
              className={`px-3 py-2 rounded-xl text-sm font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'admin'
                  ? 'bg-[#DC2626] text-white shadow-md border border-[#991B1B]'
                  : 'text-[#475569] hover:bg-[#FDE2E4] hover:text-[#9F1239]'
              }`}
            >
              <Sparkles className="w-4 h-4 text-[#FDE047]" />
              <span>Admin Kurasi</span>
            </button>
          </nav>

          {/* Right Action Icons */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Sound Toggle */}
            <button
              id="sound-toggle-btn"
              onClick={toggleSound}
              title={soundOn ? 'Matikan Efek Suara' : 'Nyalakan Efek Suara'}
              className="p-2 rounded-xl bg-[#F6F0DF] border border-[#E3D7BD] text-[#78716C] hover:text-[#1C1917] hover:bg-[#ECE3CD] transition-colors"
            >
              {soundOn ? <Volume2 className="w-4 h-4 text-[#EA580C]" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Laporkan Kesalahan Data */}
            <button
              id="report-mistake-btn"
              onClick={() => {
                sound.playPop();
                onOpenReport();
              }}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] hover:bg-[#FEE2E2] text-xs font-bold transition-all shadow-xs"
            >
              <Flag className="w-3.5 h-3.5" />
              <span>Lapor Kesalahan</span>
            </button>

            {/* Mobile Menu Toggle */}
            <button
              id="mobile-menu-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl bg-[#F6F0DF] text-[#44403C] hover:bg-[#ECE3CD]"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden px-4 pt-2 pb-4 space-y-2 bg-[#FFFDF8] border-b border-[#E7DFCC]">
          <button
            onClick={() => handleNavClick('peta')}
            className={`w-full text-left px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-3 ${
              activeTab === 'peta' ? 'bg-[#38BDF8] text-white' : 'text-[#334155]'
            }`}
          >
            <MapPin className="w-4 h-4" /> Peta Interaktif
          </button>
          <button
            onClick={() => handleNavClick('klasemen')}
            className={`w-full text-left px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-3 ${
              activeTab === 'klasemen' ? 'bg-[#FB923C] text-white' : 'text-[#334155]'
            }`}
          >
            <Trophy className="w-4 h-4" /> Klasemen Liga Korupsi
          </button>
          <button
            onClick={() => handleNavClick('statistik')}
            className={`w-full text-left px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-3 ${
              activeTab === 'statistik' ? 'bg-[#4ADE80] text-[#064E3B]' : 'text-[#334155]'
            }`}
          >
            <BarChart3 className="w-4 h-4" /> Statistik &amp; Grafik
          </button>
          <button
            onClick={() => handleNavClick('cari')}
            className={`w-full text-left px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-3 ${
              activeTab === 'cari' ? 'bg-[#C084FC] text-white' : 'text-[#334155]'
            }`}
          >
            <Search className="w-4 h-4" /> Cari Kasus Pejabat
          </button>
          <button
            onClick={() => handleNavClick('admin')}
            className={`w-full text-left px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-3 ${
              activeTab === 'admin' ? 'bg-[#F43F5E] text-white' : 'text-[#334155]'
            }`}
          >
            <Sparkles className="w-4 h-4 text-[#FDE047]" /> Admin AI Assistant
          </button>
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              onOpenReport();
            }}
            className="w-full text-left px-4 py-2.5 rounded-xl font-bold text-sm text-[#DC2626] bg-[#FEF2F2] flex items-center gap-3"
          >
            <Flag className="w-4 h-4" /> Laporkan Kesalahan Data
          </button>
        </div>
      )}
    </header>
  );
};
