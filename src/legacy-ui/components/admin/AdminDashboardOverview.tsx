"use client";

import React, { useState, useEffect } from 'react';
import { 
  Briefcase, 
  Users, 
  ShieldAlert, 
  History, 
  TrendingUp, 
  Sparkles, 
  FilePlus, 
  ExternalLink,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  Activity
} from 'lucide-react';
import { formatRupiah, formatRupiahFull } from '../../utils/formatters';

interface DashboardOverviewProps {
  authToken: string;
  auditLogs: any[];
  reports: any[];
  onNavigate: (tab: any) => void;
  onRefresh: () => void;
}

export const AdminDashboardOverview: React.FC<DashboardOverviewProps> = ({
  authToken,
  auditLogs,
  reports,
  onNavigate,
  onRefresh
}) => {
  const [stats, setStats] = useState<{
    totalCases: number;
    totalLoss: number;
    totalOfficials: number;
    loading: boolean;
  }>({
    totalCases: 0,
    totalLoss: 0,
    totalOfficials: 0,
    loading: true
  });

  useEffect(() => {
    fetchStats();
  }, [authToken]);

  const fetchStats = async () => {
    try {
      const [casesRes, statsRes] = await Promise.all([
        fetch('/api/admin/cases?limit=1', {
          headers: authToken ? { Authorization: `Bearer ${authToken}` } : {}
        }),
        fetch('/api/stats/overview')
      ]);

      const casesData = await casesRes.json();
      const statsData = await statsRes.json();

      const totalLoss = Number(
        statsData.total_kerugian_negara ??
        statsData.total_kerugian_akumulasi ??
        statsData.total_kerugian ??
        0
      );

      const totalCases = Number(
        casesData.pagination?.total_items ??
        statsData.total_kasus_nasional ??
        statsData.total_kasus ??
        0
      );

      const totalOfficials = Number(
        statsData.total_pejabat ??
        statsData.total_pejabat_terdata ??
        0
      );

      setStats({
        totalCases,
        totalLoss,
        totalOfficials,
        loading: false
      });
    } catch (err) {
      console.error('Error fetching admin dashboard stats:', err);
      setStats(prev => ({ ...prev, loading: false }));
    }
  };

  const pendingReportsCount = reports.filter(
    r => (r.status as string) === 'menunggu_review' || (r.status as string) === 'pending_review'
  ).length;

  const recentAudits = auditLogs.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Top Banner Greeting */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#1E293B] via-[#0F172A] to-[#1E1B4B] p-6 text-white shadow-md border border-[#334155]">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#DC2626]/80 text-white uppercase tracking-wider">
                Verifikator Resmi LKI
              </span>
              <span className="text-xs text-slate-400 font-mono">Database PostgreSQL Online</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-sans">
              Selamat Bertugas, Tim Kurator
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
              Portal manajemen perkara korupsi Indonesia dengan standar verifikasi berkas peradilan resmi, integrasi model AI bantuan, dan audit log permanen.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => onNavigate('ai')}
              className="px-4 py-2.5 bg-[#DC2626] hover:bg-[#B91C1C] text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Kurasi via AI</span>
            </button>
            <button
              onClick={() => onNavigate('manual')}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all border border-slate-700 flex items-center gap-2 cursor-pointer"
            >
              <FilePlus className="w-4 h-4 text-slate-300" />
              <span>Input Manual</span>
            </button>
            <button
              onClick={() => onNavigate('monitoring')}
              className="px-4 py-2.5 bg-blue-900/60 hover:bg-blue-800/80 text-blue-200 hover:text-white rounded-xl text-xs font-bold transition-all border border-blue-700/60 flex items-center gap-2 cursor-pointer"
            >
              <Activity className="w-4 h-4 text-blue-400" />
              <span>Trafik & Monitoring</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Perkara */}
        <div 
          onClick={() => onNavigate('cases')}
          className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:border-[#DC2626] hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Kasus Terdata</span>
            <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-[#DC2626] group-hover:scale-110 transition-transform">
              <Briefcase className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-slate-900 font-mono">
              {stats.loading ? '...' : stats.totalCases.toLocaleString('id-ID')}
            </div>
            <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
              <span>Perkara terverifikasi publik</span>
              <span className="text-emerald-600 font-bold">Aktif</span>
            </p>
          </div>
        </div>

        {/* Card 2: Total Kerugian Negara */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Kerugian Negara</span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-lg sm:text-xl font-extrabold text-slate-900 truncate font-mono" title={formatRupiahFull(stats.totalLoss)}>
              {stats.loading ? '...' : formatRupiah(stats.totalLoss)}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Akumulasi taksiran putusan &amp; dakwaan
            </p>
          </div>
        </div>

        {/* Card 3: Laporan Belum Ditinjau */}
        <div 
          onClick={() => onNavigate('reports')}
          className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:border-amber-400 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Moderasi Warga</span>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 ${
              pendingReportsCount > 0 
                ? 'bg-amber-100 text-amber-700 border border-amber-300 animate-pulse' 
                : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
            }`}>
              <ShieldAlert className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-slate-900 font-mono">
              {pendingReportsCount}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              {pendingReportsCount > 0 ? (
                <span className="text-amber-600 font-bold">Butuh verifikasi kurator</span>
              ) : (
                <span className="text-emerald-600 font-bold">Semua laporan tertangani</span>
              )}
            </p>
          </div>
        </div>

        {/* Card 4: Total Log Audit */}
        <div 
          onClick={() => onNavigate('audit')}
          className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:border-blue-400 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Aktivitas Audit Log</span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
              <History className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-slate-900 font-mono">
              {auditLogs.length}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Catatan mutasi &amp; rollback riwayat
            </p>
          </div>
        </div>
      </div>

      {/* Grid: Quick Actions & Recent Audit Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Quick Workflow Guide (5 Cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-[#DC2626]" />
              <span>SOP Verifikasi Data Resmi</span>
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">Praduga Tak Bersalah</span>
          </div>

          <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <strong className="text-slate-800 block">1. Wajib Tautan Sumber Sah (URL)</strong>
              <p className="text-slate-500 text-[11px]">
                Setiap berkas wajib memiliki link sumber berita media kredibel atau Direktori Putusan Mahkamah Agung RI. Kasus tanpa sumber URL akan ditolak otomatis.
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <strong className="text-slate-800 block">2. Status Hukum Jelas</strong>
              <p className="text-slate-500 text-[11px]">
                Gunakan klasifikasi hukum yang tegas: <code>Tersangka</code>, <code>Terdakwa</code>, <code>Divonis Inkrah</code>, atau <code>Bebas/Praperadilan</code>.
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <strong className="text-slate-800 block">3. Human-in-the-Loop &amp; Rollback</strong>
              <p className="text-slate-500 text-[11px]">
                Hasil ekstraksi AI tidak otomatis terbit. Kurator manusia wajib meninjau draf. Data yang salah dapat ditarik kembali via tombol Rollback di menu Log Audit.
              </p>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={() => onNavigate('cases')}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Buka Manajemen Berkas Perkara</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right Column: Recent Audit Log Feed (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-blue-600" />
              <h3 className="font-bold text-sm text-slate-800">Riwayat Mutasi Terkini</h3>
            </div>
            <button
              onClick={() => onNavigate('audit')}
              className="text-xs font-bold text-[#DC2626] hover:underline cursor-pointer"
            >
              Lihat Semua →
            </button>
          </div>

          {recentAudits.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              Belum ada aktivitas audit log yang tercatat.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentAudits.map(log => {
                const action = ((log as any).action || 'create').toUpperCase();
                const status = (log.status || (log as any).action || 'selesai').toLowerCase();
                const dateStr = log.timestamp || (log as any).created_at;
                const formattedDate = dateStr && !isNaN(new Date(dateStr).getTime())
                  ? new Date(dateStr).toLocaleString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit'
                    })
                  : '-';

                const title = log.perintah_asli || 
                  (log as any).diff_snapshot?.title || 
                  `Aksi ${action} pada ${log.entity_type || 'data'}`;

                return (
                  <div key={log.id} className="py-3 flex items-start justify-between gap-3 text-xs">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          action === 'CREATE'
                            ? 'bg-emerald-100 text-emerald-800'
                            : action === 'ROLLBACK'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {action}
                        </span>
                        <span className="font-mono text-slate-500 text-[11px]">{formattedDate}</span>
                        <span className="text-slate-400">•</span>
                        <span className="font-bold text-slate-700">{log.admin_id || 'admin'}</span>
                      </div>
                      <p className="text-slate-700 font-medium truncate max-w-md">
                        {title}
                      </p>
                    </div>

                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                      status === 'disetujui' || action === 'CREATE'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : status === 'ditolak' || action === 'ROLLBACK'
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      {status.toUpperCase()}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
