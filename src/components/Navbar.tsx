import React, { useState, useEffect } from 'react';
import { 
  Home,
  MapPin, 
  Trophy, 
  BarChart3, 
  Search, 
  Volume2, 
  VolumeX, 
  Flag,
  Menu,
  X,
  BookOpen,
  Sparkles,
  UserCheck,
  LogOut
} from 'lucide-react';
import { sound } from '../utils/audio.js';
import { CitizenAuthModal, AVATAR_OPTIONS } from './CitizenAuthModal.js';

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
  const [citizenUser, setCitizenUser] = useState<any>(null);
  const [citizenModalOpen, setCitizenModalOpen] = useState(false);
  const [citizenDropdownOpen, setCitizenDropdownOpen] = useState(false);

  useEffect(() => {
    loadCitizen();
    const handler = () => loadCitizen();
    window.addEventListener('lki_citizen_auth_change', handler);
    return () => window.removeEventListener('lki_citizen_auth_change', handler);
  }, []);

  const loadCitizen = () => {
    try {
      const stored = localStorage.getItem('lki_citizen_user');
      setCitizenUser(stored ? JSON.parse(stored) : null);
    } catch {
      setCitizenUser(null);
    }
  };

  const handleLogoutCitizen = () => {
    localStorage.removeItem('lki_citizen_token');
    localStorage.removeItem('lki_citizen_user');
    window.dispatchEvent(new Event('lki_citizen_auth_change'));
    setCitizenDropdownOpen(false);
  };

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
          </nav>

          {/* Right Action Icons (Sudut Kanan Atas) */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Sound Toggle */}
            <button
              id="sound-toggle-btn"
              onClick={toggleSound}
              title={soundOn ? 'Matikan Efek Suara' : 'Nyalakan Efek Suara'}
              className="p-2 rounded-xl bg-[#F6F0DF] border border-[#E3D7BD] text-[#78716C] hover:text-[#1C1917] hover:bg-[#ECE3CD] transition-colors cursor-pointer"
            >
              {soundOn ? <Volume2 className="w-4 h-4 text-[#EA580C]" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Lapor Kasus Baru */}
            <button
              id="report-new-case-btn"
              onClick={() => {
                sound.playPop();
                onOpenReport();
              }}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FEF3C7] border border-[#FDE68A] text-[#92400E] hover:bg-[#FDE68A] text-xs font-bold transition-all shadow-2xs cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Lapor Kasus Baru</span>
            </button>

            {/* Suara Warga (Citizen Account) - Sudut Kanan Atas */}
            <div className="flex items-center">
              {citizenUser ? (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setCitizenDropdownOpen(!citizenDropdownOpen)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#CBD5E1] hover:border-amber-400 rounded-xl text-xs font-bold text-slate-800 transition-all shadow-2xs cursor-pointer"
                    title="Akun Warga LKI"
                  >
                    <span>
                      {AVATAR_OPTIONS.find(a => a.id === citizenUser.avatarSeed)?.emoji || '👤'}
                    </span>
                    <span className="max-w-[100px] truncate hidden sm:inline">
                      {citizenUser.displayName}
                    </span>
                    <span className="px-1.5 py-0.2 bg-amber-100 text-amber-900 rounded text-[9px] font-mono">
                      Warga
                    </span>
                  </button>

                  {citizenDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-2xl p-2 shadow-xl z-50 space-y-1 animate-in fade-in zoom-in-95 duration-150">
                      <div className="px-3 py-2 border-b border-slate-100 text-xs">
                        <p className="font-bold text-slate-800 truncate">{citizenUser.displayName}</p>
                        <p className="text-[10px] text-slate-400 font-mono">@{citizenUser.username}</p>
                      </div>
                      <button
                        type="button"
                        onClick={handleLogoutCitizen}
                        className="w-full px-3 py-2 text-left text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors flex items-center gap-2 cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Keluar Akun Warga</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    sound.playPop();
                    setCitizenModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#CBD5E1] text-[#78350F] hover:bg-amber-50 hover:border-amber-400 text-xs font-bold transition-all shadow-2xs cursor-pointer"
                  title="Masuk sebagai Warga untuk bereaksi dan berkomentar"
                >
                  <UserCheck className="w-3.5 h-3.5 text-amber-600" />
                  <span>Suara Warga</span>
                </button>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <button
              id="mobile-menu-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl bg-[#F6F0DF] text-[#44403C] hover:bg-[#ECE3CD] cursor-pointer"
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
            onClick={() => {
              setMobileMenuOpen(false);
              onOpenReport();
            }}
            className="w-full text-left px-4 py-2.5 rounded-xl font-bold text-sm text-[#92400E] bg-[#FEF3C7] flex items-center gap-3"
          >
            <Sparkles className="w-4 h-4 text-amber-600" /> Laporkan Kasus Baru
          </button>

          {/* Mobile Citizen Account */}
          <div className="pt-2 border-t border-[#DFD3BA]">
            {citizenUser ? (
              <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200">
                <div className="flex items-center gap-2">
                  <span>{AVATAR_OPTIONS.find(a => a.id === citizenUser.avatarSeed)?.emoji || '👤'}</span>
                  <div>
                    <div className="text-xs font-bold text-slate-800">{citizenUser.displayName}</div>
                    <div className="text-[10px] text-slate-500 font-mono">Role: Warga</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleLogoutCitizen}
                  className="px-2.5 py-1 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                >
                  Keluar
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setCitizenModalOpen(true);
                }}
                className="w-full text-left px-4 py-2.5 rounded-xl font-bold text-sm text-[#78350F] bg-amber-50 border border-amber-200 flex items-center gap-3"
              >
                <UserCheck className="w-4 h-4 text-amber-700" /> Suara Warga / Masuk
              </button>
            )}
          </div>
        </div>
      )}

      {/* Modal Otentikasi Warga */}
      <CitizenAuthModal
        isOpen={citizenModalOpen}
        onClose={() => setCitizenModalOpen(false)}
        onSuccess={loadCitizen}
      />
    </header>
  );
};
