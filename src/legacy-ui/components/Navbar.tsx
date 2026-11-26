"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
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
  User,
  UserCheck,
  LogOut,
  UserCog,
  CreditCard,
  MapPin as MapPinIcon
} from 'lucide-react';
import { sound } from '../utils/audio';
import { CitizenAuthModal, CitizenUser } from './CitizenAuthModal';
import { CitizenProfileModal } from './CitizenProfileModal';
import { OpenDataModal } from './OpenDataModal';

interface NavbarProps {
  activeTab: 'beranda' | 'peta' | 'klasemen' | 'statistik' | 'cari' | 'admin';
  setActiveTab?: (tab: 'beranda' | 'peta' | 'klasemen' | 'statistik' | 'cari' | 'admin') => void;
  onOpenReport?: () => void;
  initialOpenData?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  initialOpenData = false,
}) => {
  const pathname = usePathname();
  const router = useRouter();
  const isLaporRoute = pathname === '/lapor';
  const isOpenDataRoute = pathname === '/open-data';
  const currentTab: 'beranda' | 'peta' | 'klasemen' | 'statistik' | 'cari' | 'admin' =
    pathname === '/klasemen' || pathname?.startsWith('/tokoh')
      ? 'klasemen'
      : pathname === '/peta'
        ? 'peta'
        : pathname === '/statistik'
          ? 'statistik'
          : pathname === '/cari' || pathname?.startsWith('/kasus')
            ? 'cari'
            : pathname === '/admin'
              ? 'admin'
              : pathname === '/'
                ? 'beranda'
                : activeTab;

  const [soundOn, setSoundOn] = useState(sound.isEnabled);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [citizenUser, setCitizenUser] = useState<CitizenUser | null>(null);
  const [citizenModalOpen, setCitizenModalOpen] = useState(false);
  const [citizenProfileModalOpen, setCitizenProfileModalOpen] = useState(false);
  const [citizenDropdownOpen, setCitizenDropdownOpen] = useState(false);
  const [openDataModalOpen, setOpenDataModalOpen] = useState(Boolean(initialOpenData || isOpenDataRoute));

  useEffect(() => {
    setOpenDataModalOpen(Boolean(initialOpenData || pathname === '/open-data'));
  }, [pathname, initialOpenData]);

  useEffect(() => {
    loadCitizen();
    const handler = () => loadCitizen();
    window.addEventListener('lki_citizen_auth_change', handler);
    return () => window.removeEventListener('lki_citizen_auth_change', handler);
  }, []);

  const loadCitizen = () => {
    try {
      const stored = localStorage.getItem('lki_citizen_user');
      const token = localStorage.getItem('lki_citizen_token');
      if (stored && token) {
        const u = JSON.parse(stored);
        if (u.isEmailVerified === false || (!u.email && u.authProvider !== 'google')) {
          localStorage.removeItem('lki_citizen_token');
          localStorage.removeItem('lki_citizen_user');
          setCitizenUser(null);
        } else {
          setCitizenUser(u);
        }
      } else {
        setCitizenUser(null);
      }
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

  const handleMenuLinkClick = () => {
    sound.playPop();
    setMobileMenuOpen(false);
  };

  const navItems: Array<{
    id: 'beranda' | 'klasemen' | 'peta' | 'statistik' | 'cari';
    href: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    activeBg: string;
    activeText: string;
    activeBorder: string;
    hoverTilt: string;
    activeTilt: string;
  }> = [
    {
      id: 'beranda',
      href: '/',
      label: 'Beranda',
      icon: Home,
      activeBg: 'bg-[#FDE047]',
      activeText: 'text-[#854D0E]',
      activeBorder: 'border-[#EAB308]',
      hoverTilt: 'hover:-rotate-1',
      activeTilt: '-rotate-1'
    },
    {
      id: 'klasemen',
      href: '/klasemen',
      label: 'Klasemen Liga',
      icon: Trophy,
      activeBg: 'bg-[#FB923C]',
      activeText: 'text-white',
      activeBorder: 'border-[#EA580C]',
      hoverTilt: 'hover:rotate-1',
      activeTilt: 'rotate-1'
    },
    {
      id: 'peta',
      href: '/peta',
      label: 'Peta Wilayah',
      icon: MapPin,
      activeBg: 'bg-[#38BDF8]',
      activeText: 'text-white',
      activeBorder: 'border-[#0284C7]',
      hoverTilt: 'hover:-rotate-1',
      activeTilt: '-rotate-1'
    },
    {
      id: 'statistik',
      href: '/statistik',
      label: 'Statistik',
      icon: BarChart3,
      activeBg: 'bg-[#4ADE80]',
      activeText: 'text-[#064E3B]',
      activeBorder: 'border-[#16A34A]',
      hoverTilt: 'hover:rotate-1',
      activeTilt: 'rotate-1'
    },
    {
      id: 'cari',
      href: '/cari',
      label: 'Cari Kasus',
      icon: Search,
      activeBg: 'bg-[#C084FC]',
      activeText: 'text-white',
      activeBorder: 'border-[#9333EA]',
      hoverTilt: 'hover:-rotate-1',
      activeTilt: '-rotate-1'
    }
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#FFFDF8]/95 backdrop-blur-md border-b-2 border-[#E7DFCC] shadow-sm">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-2 lg:gap-3 xl:gap-4">
          
          {/* Kolom 1: Logo & Brand (Kiri) */}
          <Link
            href="/"
            className="flex items-center gap-2 sm:gap-3 cursor-pointer group shrink-0 min-w-0"
            onClick={handleMenuLinkClick}
          >
            <div className="relative shrink-0">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-[#FDE047] border-2 border-[#EAB308] shadow-md flex items-center justify-center rotate-[-4deg] group-hover:rotate-0 transition-transform">
                <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-[#854D0E]" />
              </div>
              <span className="absolute -top-2 -right-2 px-1.5 py-0.5 bg-[#DC2626] text-white text-[10px] font-bold rounded-full rotate-6 shadow-sm">
                LKI 🇮🇩
              </span>
            </div>
            
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-marker text-lg sm:text-2xl xl:text-[26px] text-[#1E293B] tracking-wide whitespace-nowrap">
                  Liga Korupsi
                </span>
                <span className="hidden sm:inline-block lg:hidden xl:inline-block px-2 py-0.5 bg-[#FEF08A] text-[#854D0E] font-hand font-bold text-xs rounded-md border border-[#EAB308] rotate-2 shrink-0">
                  Indonesia
                </span>
              </div>
              <p className="text-xs text-[#64748B] font-medium hidden xl:block truncate">
                Portal Transparansi Perkara &amp; Putusan Hukum Terbuka
              </p>
            </div>
          </Link>

          {/* Kolom 2: Navigasi Menu Utama (Tengah - Responsif tanpa min-width kaku) */}
          <nav className="hidden lg:flex items-center bg-[#F5EEDC]/90 border border-[#E2D6BD] p-1 xl:p-1.5 rounded-2xl shadow-2xs shrink-0">
            <div className="flex items-center gap-1 xl:gap-1.5">
              {navItems.map(item => {
                const Icon = item.icon;
                const isActive = !isLaporRoute && !isOpenDataRoute && currentTab === item.id;
                return (
                  <Link
                    key={item.id}
                    id={`nav-${item.id}-btn`}
                    href={item.href}
                    onClick={handleMenuLinkClick}
                    aria-current={isActive ? 'page' : undefined}
                    className={`
                      px-2.5 xl:px-3 py-1.5 xl:py-2 rounded-xl text-xs xl:text-sm font-bold flex items-center justify-center gap-1.5 
                      transition-all duration-150 cursor-pointer whitespace-nowrap transform select-none
                      ${item.hoverTilt} hover:-translate-y-0.5 hover:shadow-xs
                      active:scale-95 active:translate-y-0 active:rotate-0
                      ${isActive
                        ? `${item.activeBg} ${item.activeText} ${item.activeTilt} shadow-sm border ${item.activeBorder} scale-[1.02]`
                        : 'text-[#475569] hover:bg-[#EBE2CC] hover:text-[#0F172A]'}
                    `}
                  >
                    <Icon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* Kolom 3: Right Action Icons & Suara Rakyat (Kanan - Dalam Normal Flex Flow) */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Sound Toggle */}
            <button
              id="sound-toggle-btn"
              onClick={toggleSound}
              title={soundOn ? 'Matikan Efek Suara' : 'Nyalakan Efek Suara'}
              className="p-2 rounded-xl bg-[#F6F0DF] border border-[#E3D7BD] text-[#78716C] hover:text-[#1C1917] hover:bg-[#ECE3CD] transition-all duration-150 cursor-pointer transform hover:rotate-6 hover:-translate-y-0.5 active:scale-90 active:rotate-0 shrink-0"
            >
              {soundOn ? <Volume2 className="w-4 h-4 text-[#EA580C]" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Lapor Kasus Baru */}
            <Link
              id="report-new-case-btn"
              href="/lapor"
              onClick={handleMenuLinkClick}
              aria-current={isLaporRoute ? 'page' : undefined}
              className={`hidden sm:flex items-center gap-1.5 px-2.5 xl:px-3 py-1.5 rounded-xl border text-xs font-bold transition-all duration-150 shadow-2xs cursor-pointer whitespace-nowrap transform hover:-rotate-1 hover:-translate-y-0.5 hover:shadow-xs active:scale-95 active:rotate-0 shrink-0 ${
                isLaporRoute
                  ? 'bg-[#FDE68A] border-amber-400 text-[#92400E] ring-2 ring-amber-400 -rotate-1'
                  : 'bg-[#FEF3C7] border-[#FDE68A] text-[#92400E] hover:bg-[#FDE68A]'
              }`}
              title="Laporkan Kasus Korupsi Baru"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span className="hidden lg:inline xl:hidden">Lapor</span>
              <span className="lg:hidden xl:inline">Lapor Kasus Baru</span>
            </Link>

            {/* Tombol Login / Suara Rakyat */}
            <div className="relative shrink-0">
              {citizenUser ? (
                <div>
                  <button
                    type="button"
                    onClick={() => setCitizenDropdownOpen(!citizenDropdownOpen)}
                    className="group flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 bg-white/95 hover:bg-white border-2 border-amber-400 hover:border-amber-500 rounded-2xl text-xs font-bold text-slate-800 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
                    title="Akun Suara Rakyat"
                  >
                    {citizenUser.photoUrl ? (
                      <img 
                        src={citizenUser.photoUrl} 
                        alt={citizenUser.displayName} 
                        className="w-6 h-6 sm:w-7 sm:h-7 rounded-xl object-cover border-2 border-amber-400 shrink-0 shadow-2xs" 
                      />
                    ) : (
                      <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center shrink-0">
                        <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-800" />
                      </div>
                    )}
                    <div className="text-left hidden sm:block">
                      <div className="font-black text-slate-900 text-xs leading-tight truncate max-w-[85px] xl:max-w-[110px]">
                        {citizenUser.displayName}
                      </div>
                      <div className="text-[10px] text-amber-700 font-semibold leading-none truncate max-w-[85px] xl:max-w-[110px]">
                        {citizenUser.originCity || citizenUser.originProvince || 'Suara Rakyat'}
                      </div>
                    </div>
                    <span className="hidden xl:inline-block px-1.5 py-0.5 bg-gradient-to-r from-amber-500 to-[#EA580C] text-white rounded-md text-[9px] font-mono font-black shrink-0 shadow-2xs">
                      WARGA
                    </span>
                  </button>

                  {citizenDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-2xl p-2 shadow-xl z-50 space-y-1.5 animate-in fade-in zoom-in-95 duration-150">
                      <div className="px-3 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs">
                        <div className="flex items-center gap-2.5">
                          {citizenUser.photoUrl ? (
                            <img src={citizenUser.photoUrl} alt="Avatar" className="w-8 h-8 rounded-full object-cover border border-slate-300 shrink-0" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center shrink-0">
                              <User className="w-4 h-4 text-amber-800" />
                            </div>
                          )}
                          <div className="overflow-hidden">
                            <p className="font-bold text-slate-900 truncate">{citizenUser.displayName}</p>
                            <p className="text-[10px] text-slate-500 font-mono truncate">@{citizenUser.username}</p>
                          </div>
                        </div>

                        {(citizenUser.originCity || citizenUser.originProvince) && (
                          <div className="mt-2 pt-1.5 border-t border-slate-200/60 flex items-center gap-1 text-[10px] text-slate-600 font-medium">
                            <MapPinIcon className="w-3 h-3 text-amber-600 shrink-0" />
                            <span className="truncate">{[citizenUser.originCity, citizenUser.originProvince].filter(Boolean).join(', ')}</span>
                          </div>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          sound.playPop();
                          setCitizenDropdownOpen(false);
                          setCitizenProfileModalOpen(true);
                        }}
                        className="w-full px-3 py-2 text-left text-xs font-bold text-slate-700 hover:bg-amber-50 hover:text-amber-900 rounded-xl transition-colors flex items-center gap-2 cursor-pointer"
                      >
                        <CreditCard className="w-3.5 h-3.5 text-amber-600" />
                        <span>Profil Warga (e-KTP)</span>
                      </button>

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
                  className="group flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-gradient-to-r from-amber-500 via-orange-500 to-[#EA580C] hover:from-amber-600 hover:to-[#C2410C] text-white rounded-2xl text-xs font-bold shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
                  title="Masuk / Daftar Suara Rakyat (Beri Aspirasi, Reaksi & Komentar)"
                >
                  <span className="p-1 rounded-lg bg-white/20 text-white shrink-0">
                    <UserCheck className="w-3.5 h-3.5" />
                  </span>
                  <div className="flex flex-col text-left leading-none">
                    <span className="text-[9px] uppercase tracking-wider font-extrabold text-amber-100 leading-none">
                      LOGIN
                    </span>
                    <span className="text-[11px] sm:text-xs font-black tracking-tight leading-tight whitespace-nowrap">
                      Suara Rakyat
                    </span>
                  </div>
                </button>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <button
              id="mobile-menu-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl bg-[#F6F0DF] text-[#44403C] hover:bg-[#ECE3CD] transition-all duration-150 cursor-pointer transform hover:rotate-3 active:scale-90 shrink-0"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden px-4 pt-2 pb-4 space-y-2 bg-[#FFFDF8] border-b border-[#E7DFCC]">
          <Link
            href="/"
            onClick={handleMenuLinkClick}
            className={`w-full text-left px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-3 ${
              !isLaporRoute && !isOpenDataRoute && currentTab === 'beranda' ? 'bg-[#FDE047] text-[#854D0E]' : 'text-[#334155]'
            }`}
          >
            <Home className="w-4 h-4" /> Beranda Utama
          </Link>
          <Link
            href="/peta"
            onClick={handleMenuLinkClick}
            className={`w-full text-left px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-3 ${
              !isLaporRoute && !isOpenDataRoute && currentTab === 'peta' ? 'bg-[#38BDF8] text-white' : 'text-[#334155]'
            }`}
          >
            <MapPin className="w-4 h-4" /> Peta Interaktif
          </Link>
          <Link
            href="/klasemen"
            onClick={handleMenuLinkClick}
            className={`w-full text-left px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-3 ${
              !isLaporRoute && !isOpenDataRoute && currentTab === 'klasemen' ? 'bg-[#FB923C] text-white' : 'text-[#334155]'
            }`}
          >
            <Trophy className="w-4 h-4" /> Klasemen Liga Korupsi
          </Link>
          <Link
            href="/statistik"
            onClick={handleMenuLinkClick}
            className={`w-full text-left px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-3 ${
              !isLaporRoute && !isOpenDataRoute && currentTab === 'statistik' ? 'bg-[#4ADE80] text-[#064E3B]' : 'text-[#334155]'
            }`}
          >
            <BarChart3 className="w-4 h-4" /> Statistik &amp; Grafik
          </Link>
          <Link
            href="/cari"
            onClick={handleMenuLinkClick}
            className={`w-full text-left px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-3 ${
              !isLaporRoute && !isOpenDataRoute && currentTab === 'cari' ? 'bg-[#C084FC] text-white' : 'text-[#334155]'
            }`}
          >
            <Search className="w-4 h-4" /> Cari Kasus Pejabat
          </Link>
          <Link
            href="/lapor"
            onClick={handleMenuLinkClick}
            className={`w-full text-left px-4 py-2.5 rounded-xl font-bold text-sm text-[#92400E] flex items-center gap-3 ${
              isLaporRoute ? 'bg-[#FDE68A] ring-2 ring-amber-400' : 'bg-[#FEF3C7]'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-600" /> Laporkan Kasus Baru
          </Link>

          {/* Mobile Citizen Account */}
          <div className="pt-2 border-t border-[#DFD3BA]">
            {citizenUser ? (
              <div className="flex flex-col gap-2 p-3 bg-white rounded-xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    {citizenUser.photoUrl ? (
                      <img src={citizenUser.photoUrl} alt="Avatar" className="w-7 h-7 rounded-full object-cover border border-slate-300 shrink-0" />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center shrink-0">
                        <User className="w-4 h-4 text-amber-800" />
                      </div>
                    )}
                    <div>
                      <div className="text-xs font-bold text-slate-800">{citizenUser.displayName}</div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {[citizenUser.originCity, citizenUser.originProvince].filter(Boolean).join(', ') || 'Warga LKI'}
                      </div>
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
                <button
                  type="button"
                  onClick={() => {
                    sound.playPop();
                    setMobileMenuOpen(false);
                    setCitizenProfileModalOpen(true);
                  }}
                  className="w-full py-1.5 px-3 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-[#92400E] rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <CreditCard className="w-3.5 h-3.5 text-amber-700" />
                  <span>Profil Warga (e-KTP)</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setCitizenModalOpen(true);
                }}
                className="w-full text-left px-4 py-2.5 rounded-xl font-bold text-sm text-[#78350F] bg-amber-50 border border-amber-200 flex items-center gap-3 cursor-pointer"
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

      {/* Modal Edit Profil Warga */}
      {citizenUser && (
        <CitizenProfileModal
          isOpen={citizenProfileModalOpen}
          onClose={() => setCitizenProfileModalOpen(false)}
          user={citizenUser}
          onProfileUpdated={(updated) => setCitizenUser(updated)}
        />
      )}

      {/* Modal Pusat Katalog & Unduh Dataset Terbuka (Open Data) */}
      <OpenDataModal
        isOpen={openDataModalOpen}
        onClose={() => {
          setOpenDataModalOpen(false);
          if (pathname === '/open-data') {
            router.push('/');
          }
        }}
      />
    </header>
  );
};
