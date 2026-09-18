import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Sparkles, 
  Briefcase, 
  Users, 
  ShieldCheck, 
  History, 
  FileEdit, 
  Globe, 
  LogOut, 
  Menu, 
  X, 
  Shield, 
  ChevronRight,
  Database,
  Bell
} from 'lucide-react';
import { sound } from '../../utils/audio.js';

export type AdminSubtab = 'dashboard' | 'ai' | 'cases' | 'officials' | 'reports' | 'audit' | 'manual' | 'announcement';

interface AdminLayoutProps {
  activeSubtab: AdminSubtab;
  setActiveSubtab: (tab: AdminSubtab) => void;
  onLogout: () => void;
  onBackToPublic: () => void;
  pendingReportsCount: number;
  adminUsername: string;
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  activeSubtab,
  setActiveSubtab,
  onLogout,
  onBackToPublic,
  pendingReportsCount,
  adminUsername,
  children
}) => {
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);

  const navItems = [
    { id: 'dashboard' as AdminSubtab, label: 'Dashboard Ringkasan', icon: LayoutDashboard },
    { id: 'ai' as AdminSubtab, label: 'Kurasi AI Assistant', icon: Sparkles, badge: 'AI Flash' },
    { id: 'cases' as AdminSubtab, label: 'Kelola Berkas Perkara', icon: Briefcase },
    { id: 'officials' as AdminSubtab, label: 'Kelola Pejabat Publik', icon: Users },
    { 
      id: 'reports' as AdminSubtab, 
      label: 'Moderasi Laporan Warga', 
      icon: ShieldCheck, 
      badge: pendingReportsCount > 0 ? String(pendingReportsCount) : undefined,
      badgeColor: 'bg-amber-500 text-white'
    },
    { id: 'audit' as AdminSubtab, label: 'Log Audit & Rollback', icon: History },
    { id: 'manual' as AdminSubtab, label: 'Formulir Input Manual', icon: FileEdit },
    { id: 'announcement' as AdminSubtab, label: 'Teks Pemberitahuan', icon: Bell }
  ];

  const handleNav = (tab: AdminSubtab) => {
    sound.playPop();
    setActiveSubtab(tab);
    setSidebarOpen(false);
  };

  const getSubtabTitle = () => {
    switch (activeSubtab) {
      case 'dashboard': return 'Ringkasan & Metrik Eksekutif';
      case 'ai': return 'Kurasi Perkara via AI Assistant';
      case 'cases': return 'Direktori Berkas Perkara Korupsi';
      case 'officials': return 'Pangkalan Data Pejabat Publik';
      case 'reports': return 'Antrean Moderasi Laporan Warga';
      case 'audit': return 'Jejak Audit & Rollback Mutasi';
      case 'manual': return 'Formulir Input Manual';
      case 'announcement': return 'Pengaturan Teks Pemberitahuan Hukum';
      default: return 'Panel Kurasi LKI';
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row text-slate-800 font-sans">
      
      {/* Mobile Header Bar */}
      <div className="md:hidden flex items-center justify-between p-4 bg-[#0F172A] text-white border-b border-slate-800 sticky top-0 z-50">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#DC2626] flex items-center justify-center font-bold text-white text-xs">
            LKI
          </div>
          <span className="font-bold text-sm tracking-wide">Portal Admin Kurasi</span>
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-lg bg-slate-800 text-slate-200 hover:text-white"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar Overlay for Mobile */}
      {sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)}
          className="md:hidden fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40"
        />
      )}

      {/* Modern Fixed Sidebar */}
      <aside className={`
        fixed md:sticky top-0 bottom-0 left-0 z-50
        w-64 bg-[#0F172A] text-slate-300 flex flex-col
        transition-transform duration-200 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        h-screen border-r border-slate-800
      `}>
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#DC2626] to-[#991B1B] flex items-center justify-center text-white shadow-md">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm text-white tracking-wide">Liga Korupsi</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-bold border border-amber-500/30">
                  ADMIN
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Verifikator &amp; Kurasi</p>
            </div>
          </div>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
          <div className="px-3 py-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Menu Utama
          </div>

          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeSubtab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                className={`
                  w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold
                  transition-all cursor-pointer group
                  ${isActive 
                    ? 'bg-[#DC2626] text-white shadow-sm font-bold' 
                    : 'text-slate-400 hover:bg-slate-800/70 hover:text-slate-200'}
                `}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`} />
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${item.badgeColor || 'bg-slate-800 text-slate-300 border border-slate-700'}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom User Profile & Actions */}
        <div className="p-3 border-t border-slate-800/80 space-y-2 bg-[#0A0F1D]">
          {/* User badge */}
          <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-900/90 border border-slate-800">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-[#DC2626]">
                {adminUsername.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-white truncate">{adminUsername}</div>
                <div className="text-[10px] text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>Super Admin</span>
                </div>
              </div>
            </div>

            <button
              onClick={onLogout}
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="Keluar / Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          {/* Return to Public Portal */}
          <button
            onClick={onBackToPublic}
            className="w-full py-2 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-medium flex items-center justify-center gap-2 border border-slate-700 transition-colors cursor-pointer"
          >
            <Globe className="w-3.5 h-3.5 text-slate-400" />
            <span>← Buka Portal Publik</span>
          </button>
        </div>
      </aside>

      {/* Main Right Content Layout */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        
        {/* Top Navbar */}
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <span>Admin</span>
                <ChevronRight className="w-3 h-3" />
                <span className="text-slate-600 font-medium capitalize">{activeSubtab}</span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 leading-tight">
                {getSubtabTitle()}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Database indicator */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-medium">
              <Database className="w-3.5 h-3.5" />
              <span>PostgreSQL Online</span>
            </div>

            {/* Quick public portal link */}
            <button
              onClick={onBackToPublic}
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Lihat Web Publik</span>
            </button>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

    </div>
  );
};
