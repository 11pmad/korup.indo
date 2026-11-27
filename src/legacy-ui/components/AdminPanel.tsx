"use client";

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AuditLog, UserReport } from '../types';
import { sound } from '../utils/audio';
import { parseApiJson } from '../utils/safeJson';
import { invalidatePortalDataCache } from '../App';
import { Eye, EyeOff, Lock, Unlock } from 'lucide-react';
import { AdminLayout, AdminSubtab } from './admin/AdminLayout';
import {
  ADMIN_TAB_TITLES,
  adminTabToPath,
  pathnameToAdminTab,
} from './admin/adminRoutes';
import { AdminDashboardOverview } from './admin/AdminDashboardOverview';
import { AdminCasesManager } from './admin/AdminCasesManager';
import { AdminOfficialsManager } from './admin/AdminOfficialsManager';
import { AdminAnnouncementManager } from './admin/AdminAnnouncementManager';
import { AdminDonationManager } from './admin/AdminDonationManager';
import { AdminReportsManager } from './admin/AdminReportsManager';
import { AdminMonitoringManager } from './admin/AdminMonitoringManager';
import { AdminCommentsManager } from './admin/AdminCommentsManager';
import { AdminManualCaseManager } from './admin/AdminManualCaseManager';
import { AdminAuditManager } from './admin/AdminAuditManager';
import { AdminAiCurator } from './admin/AdminAiCurator';
import { AdminUsersManager } from './admin/AdminUsersManager';

interface AdminPanelProps {
  onRefreshData?: () => void;
  onBackToHome?: () => void;
}

interface CurrentAdminUser {
  id: string;
  username: string;
  full_name?: string | null;
  email?: string | null;
  role: string;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onRefreshData, onBackToHome }) => {
  const pathname = usePathname();
  const router = useRouter();

  // Simple auth gate with JWT
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return typeof window !== 'undefined' ? Boolean(sessionStorage.getItem('lki_admin_token')) : false;
  });
  const [authToken, setAuthToken] = useState<string>(() => {
    return typeof window !== 'undefined' ? sessionStorage.getItem('lki_admin_token') || '' : '';
  });
  const [currentUser, setCurrentUser] = useState<CurrentAdminUser | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const stored = sessionStorage.getItem('lki_admin_user');
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      return null;
    }
  });
  const [authUsername, setAuthUsername] = useState<string>('');
  const [authPassword, setAuthPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Active view tab derived from URL pathname
  const activeTab: AdminSubtab = pathnameToAdminTab(pathname) ?? 'dashboard';

  const navigateToAdminTab = (tab: AdminSubtab) => {
    const target = adminTabToPath(tab);
    if (pathname !== target) {
      router.push(target);
    }
  };

  const handleRefreshData = onRefreshData ?? invalidatePortalDataCache;
  const handleBackToHome =
    onBackToHome ??
    (() => {
      sound.playPop();
      router.push('/');
    });

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.title = `${ADMIN_TAB_TITLES[activeTab]} — Panel Admin LKI`;
    }
  }, [activeTab]);

  // Audit Logs state
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState<boolean>(false);

  // Reports state
  const [reports, setReports] = useState<UserReport[]>([]);
  const [loadingReports, setLoadingReports] = useState<boolean>(false);

  const fetchAuditLogs = async () => {
    setLoadingLogs(true);
    try {
      const res = await fetch('/api/admin/audit-logs', {
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : {}
      });
      const data = await parseApiJson(res);
      setAuditLogs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching audit logs:', err);
    } finally {
      setLoadingLogs(false);
    }
  };

  const fetchReports = async () => {
    setLoadingReports(true);
    try {
      const res = await fetch('/api/admin/reports', {
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : {}
      });
      const data = await parseApiJson(res);
      setReports(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching reports:', err);
    } finally {
      setLoadingReports(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchAuditLogs();
      fetchReports();
    }
  }, [isAuthenticated, authToken]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: authUsername,
          password: authPassword
        })
      });

      const data = await parseApiJson(res);
      if (!res.ok) {
        throw new Error(data.error || 'Autentikasi gagal');
      }

      sound.playCheer();
      sessionStorage.setItem('lki_admin_token', data.token);
      if (data.user) {
        sessionStorage.setItem('lki_admin_user', JSON.stringify(data.user));
        setCurrentUser(data.user);
      }
      setAuthToken(data.token);
      setIsAuthenticated(true);
      fetchAuditLogs();
      fetchReports();
    } catch (err: any) {
      sound.playError();
      setAuthError(err.message);
    }
  };

  const handleLogout = () => {
    sound.playPop();
    sessionStorage.removeItem('lki_admin_token');
    sessionStorage.removeItem('lki_admin_user');
    setAuthToken('');
    setCurrentUser(null);
    setIsAuthenticated(false);
  };

  // If not logged in, show modern dedicated login gate
  if (!isAuthenticated) {
    return (
      <div id="admin-login-screen" className="min-h-screen bg-[#0B0F19] flex items-center justify-center p-4 selection:bg-[#DC2626] selection:text-white">
        <div className="w-full max-w-md space-y-6">
          {/* Header Logo */}
          <div className="text-center space-y-2">
            <div className="w-14 h-14 bg-gradient-to-br from-[#DC2626] to-[#991B1B] text-white rounded-2xl mx-auto flex items-center justify-center shadow-lg border border-red-500/30">
              <Lock className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-wide">
              Portal Verifikator LKI
            </h1>
            <p className="text-xs text-slate-400">
              Area khusus tim kurator &amp; moderasi data putusan peradilan
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5">
            <div className="p-3 bg-slate-800/80 border border-slate-700 rounded-2xl text-xs text-slate-300 space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-amber-300">
                <Lock className="w-3.5 h-3.5 shrink-0" />
                <span>Akses Terbatas Staf Kurator</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Masuk menggunakan kredensial staf kurator resmi yang terdaftar oleh administrator sistem.
              </p>
            </div>

            {authError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-400">
                {authError}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  value={authUsername}
                  onChange={e => setAuthUsername(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-500 focus:ring-2 focus:ring-[#DC2626] focus:outline-none"
                  placeholder="admin"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={authPassword}
                    onChange={e => setAuthPassword(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-3 pr-10 py-2.5 text-xs text-white placeholder-slate-500 focus:ring-2 focus:ring-[#DC2626] focus:outline-none"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(prev => !prev)}
                    aria-label={showPassword ? 'Sembunyikan password' : 'Lihat password'}
                    title={showPassword ? 'Sembunyikan password' : 'Lihat password'}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-[#DC2626] hover:bg-[#B91C1C] text-white font-bold rounded-xl text-xs transition-colors shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <Unlock className="w-4 h-4" />
                <span>Masuk ke Panel Kurator</span>
              </button>
            </form>

            <div className="pt-3 border-t border-slate-800/80 text-center">
              <button
                type="button"
                onClick={handleBackToHome}
                className="text-xs text-slate-400 hover:text-white transition-colors cursor-pointer inline-flex items-center gap-1.5"
              >
                ← Kembali ke Portal Publik
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout
      activeSubtab={activeTab}
      setActiveSubtab={navigateToAdminTab}
      onLogout={handleLogout}
      onBackToPublic={handleBackToHome}
      pendingReportsCount={reports.filter(r => (r.status as string) === 'menunggu_review' || (r.status as string) === 'pending_review').length}
      adminUsername={currentUser?.username || authUsername || 'admin'}
      adminFullName={currentUser?.full_name}
      adminRole={currentUser?.role || 'super_admin'}
    >
      {/* TAB 1: DASHBOARD OVERVIEW */}
      {activeTab === 'dashboard' && (
        <AdminDashboardOverview
          authToken={authToken}
          auditLogs={auditLogs}
          reports={reports}
          onNavigate={navigateToAdminTab}
          onRefresh={handleRefreshData}
        />
      )}

      {/* TAB 2: CASES MANAGER */}
      {activeTab === 'cases' && (
        <AdminCasesManager
          authToken={authToken}
          onOpenCreate={() => navigateToAdminTab('manual')}
          onRefreshGlobal={handleRefreshData}
        />
      )}

      {/* TAB 3: OFFICIALS MANAGER */}
      {activeTab === 'officials' && (
        <AdminOfficialsManager
          authToken={authToken}
          onRefreshGlobal={handleRefreshData}
        />
      )}

      {/* TAB: ANNOUNCEMENT MANAGER */}
      {activeTab === 'announcement' && (
        <AdminAnnouncementManager
          authToken={authToken}
          onRefreshGlobal={handleRefreshData}
        />
      )}

      {/* TAB: DONATION & QRIS MANAGER */}
      {activeTab === 'donation' && (
        <AdminDonationManager
          authToken={authToken}
          onRefreshGlobal={handleRefreshData}
        />
      )}

      {/* TAB: AI ASSISTANT CHAT & DRAFT */}
      {activeTab === 'ai' && (
        <AdminAiCurator
          authToken={authToken}
          onRefreshGlobal={handleRefreshData}
          onRefreshAuditLogs={fetchAuditLogs}
        />
      )}

      {/* TAB: MANUAL FORM */}
      {activeTab === 'manual' && (
        <AdminManualCaseManager
          authToken={authToken}
          onRefreshGlobal={handleRefreshData}
          onRefreshAuditLogs={fetchAuditLogs}
        />
      )}

      {/* TAB: AUDIT TRAIL & ROLLBACK */}
      {activeTab === 'audit' && (
        <AdminAuditManager
          authToken={authToken}
          auditLogs={auditLogs}
          loadingLogs={loadingLogs}
          onRefreshLogs={fetchAuditLogs}
          onRefreshGlobal={handleRefreshData}
        />
      )}

      {/* TAB: USER REPORTS MODERATION */}
      {activeTab === 'reports' && (
        <AdminReportsManager
          authToken={authToken}
          onRefreshGlobal={() => {
            fetchReports();
            handleRefreshData();
          }}
        />
      )}

      {/* TAB: CITIZEN COMMENTS MODERATION */}
      {activeTab === 'comments' && (
        <AdminCommentsManager
          authToken={authToken}
          onRefreshGlobal={handleRefreshData}
        />
      )}

      {/* TAB: MONITORING & TRAFFIC LOGS */}
      {activeTab === 'monitoring' && (
        <AdminMonitoringManager
          authToken={authToken}
        />
      )}

      {/* TAB: USERS & RBAC MANAGEMENT */}
      {activeTab === 'users' && (
        <AdminUsersManager
          authToken={authToken}
          currentUserId={currentUser?.id}
          currentUserRole={currentUser?.role || 'super_admin'}
        />
      )}
    </AdminLayout>
  );
};
