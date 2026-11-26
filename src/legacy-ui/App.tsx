"use client";

import React, { useState, useEffect, Suspense, lazy } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Navbar } from './components/Navbar';
import { DisclaimerBanner } from './components/DisclaimerBanner';
import { LandingPage } from './components/LandingPage';
import { CaseDetailModal } from './components/CaseDetailModal';
import { Footer } from './components/Footer';
import { 
  CorruptionCase, 
  RegionSummary, 
  LeaderboardItem, 
  StatsOverview 
} from './types';
import { sound } from './utils/audio';
import { parseApiJson } from './utils/safeJson';
import { Loader2 } from 'lucide-react';

// Code-split heavy components for faster initial load & lower memory footprint
const IndonesiaMap = lazy(() => import('./components/IndonesiaMap').then(m => ({ default: m.IndonesiaMap })));
const LeaderboardTable = lazy(() => import('./components/LeaderboardTable').then(m => ({ default: m.LeaderboardTable })));
const StatsDashboard = lazy(() => import('./components/StatsDashboard').then(m => ({ default: m.StatsDashboard })));
const SearchCasesView = lazy(() => import('./components/SearchCasesView').then(m => ({ default: m.SearchCasesView })));
const AdminPanel = lazy(() => import('./components/AdminPanel').then(m => ({ default: m.AdminPanel })));
const ReportModal = lazy(() => import('./components/ReportModal').then(m => ({ default: m.ReportModal })));

export type PortalTab = 'beranda' | 'peta' | 'klasemen' | 'statistik' | 'cari' | 'admin';

interface PortalDataSnapshot {
  cases: CorruptionCase[];
  regions: RegionSummary[];
  leaderboard: LeaderboardItem[];
  stats: StatsOverview | null;
}

let portalDataCache: PortalDataSnapshot | null = null;
let portalDataPromise: Promise<PortalDataSnapshot> | null = null;

function tabToHref(tab: PortalTab): string {
  return tab === 'beranda' ? '/' : `/${tab}`;
}

function pathnameToTab(pathname: string | null, fallback: PortalTab = 'beranda'): PortalTab {
  if (!pathname) return fallback;
  if (pathname === '/admin') return 'admin';
  if (pathname === '/peta') return 'peta';
  if (pathname === '/klasemen' || pathname.startsWith('/tokoh')) return 'klasemen';
  if (pathname === '/statistik') return 'statistik';
  if (pathname === '/cari' || pathname.startsWith('/kasus')) return 'cari';
  if (pathname === '/' || pathname === '/lapor' || pathname === '/open-data') return 'beranda';
  return fallback;
}

export interface AppProps {
  initialTab?: PortalTab;
  initialCaseId?: string | null;
  initialOpenReport?: boolean;
  initialOpenData?: boolean;
}

export default function App({
  initialTab,
  initialCaseId = null,
  initialOpenReport = false,
  initialOpenData = false,
}: AppProps = {}) {
  const pathname = usePathname();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<PortalTab>(() =>
    pathnameToTab(pathname, initialTab || 'beranda')
  );
  
  // Data states (hydrated immediately from module cache across route changes)
  const [cases, setCases] = useState<CorruptionCase[]>(() => portalDataCache?.cases ?? []);
  const [regions, setRegions] = useState<RegionSummary[]>(() => portalDataCache?.regions ?? []);
  const [leaderboard, setLeaderboard] = useState<LeaderboardItem[]>(() => portalDataCache?.leaderboard ?? []);
  const [stats, setStats] = useState<StatsOverview | null>(() => portalDataCache?.stats ?? null);
  const [isLoading, setIsLoading] = useState<boolean>(() => !portalDataCache);

  // Selected item states
  const [selectedProvince, setSelectedProvince] = useState<string | null>(null);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(initialCaseId);
  const [reportModalOpen, setReportModalOpen] = useState<boolean>(
    Boolean(initialOpenReport || pathname === '/lapor')
  );
  const [reportTargetCaseId, setReportTargetCaseId] = useState<string | null>(null);
  const [reportInitialMode, setReportInitialMode] = useState<'new_case' | 'correction' | 'track'>('new_case');

  // Sync route pathname changes with UI state
  useEffect(() => {
    setActiveTab(pathnameToTab(pathname, initialTab || 'beranda'));
  }, [pathname, initialTab]);

  useEffect(() => {
    if (pathname === '/lapor') {
      setReportTargetCaseId(null);
      setReportInitialMode('new_case');
      setReportModalOpen(true);
    } else if (!initialOpenReport) {
      setReportModalOpen(false);
    }
  }, [pathname, initialOpenReport]);

  useEffect(() => {
    setSelectedCaseId(initialCaseId);
  }, [initialCaseId]);

  const navigateToTab = (tab: PortalTab) => {
    const href = tabToHref(tab);
    setActiveTab(tab);
    if (pathname !== href) {
      router.push(href);
    }
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Track SPA/Route pageview in monitoring
  useEffect(() => {
    try {
      const pagePath = pathname || tabToHref(activeTab);
      fetch('/api/admin/monitoring/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: pagePath,
          referrer: document.referrer || 'Direct'
        })
      }).catch(() => {});
    } catch (e) {}
  }, [pathname, activeTab]);

  const loadAllData = async (forceRefresh = false) => {
    if (!forceRefresh && portalDataCache) {
      setCases(portalDataCache.cases);
      setRegions(portalDataCache.regions);
      setLeaderboard(portalDataCache.leaderboard);
      setStats(portalDataCache.stats);
      setIsLoading(false);
      return;
    }

    if (forceRefresh) {
      portalDataPromise = null;
    }
    if (!portalDataCache) {
      setIsLoading(true);
    }

    try {
      if (!portalDataPromise) {
        portalDataPromise = (async () => {
          const [casesRes, regionsRes, leaderRes, statsRes] = await Promise.all([
            fetch('/api/cases?limit=100'),
            fetch('/api/regions/summary'),
            fetch('/api/leaderboard'),
            fetch('/api/stats/overview')
          ]);

          const [casesData, regionsData, leaderData, statsData] = await Promise.all([
            parseApiJson(casesRes),
            parseApiJson(regionsRes),
            parseApiJson(leaderRes),
            parseApiJson(statsRes)
          ]);

          const snapshot: PortalDataSnapshot = {
            cases: Array.isArray(casesData?.cases) ? casesData.cases : [],
            regions: Array.isArray(regionsData) ? regionsData : [],
            leaderboard: Array.isArray(leaderData) ? leaderData : [],
            stats: statsData && !statsData.error ? statsData : null,
          };
          portalDataCache = snapshot;
          return snapshot;
        })();
      }

      const snapshot = await portalDataPromise;
      setCases(snapshot.cases);
      setRegions(snapshot.regions);
      setLeaderboard(snapshot.leaderboard);
      setStats(snapshot.stats);
    } catch (err) {
      portalDataPromise = null;
      console.error('Error fetching data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const activeCaseDetail = selectedCaseId
    ? cases.find(c => c.id === selectedCaseId) || null
    : null;

  const provincesList = Array.from(new Set(regions.map(r => r.provinsi))).sort();

  // Dynamic SEO Page Title update
  useEffect(() => {
    if (activeCaseDetail) {
      document.title = `Berkas: ${activeCaseDetail.official?.nama || 'Perkara'} (${activeCaseDetail.status_hukum}) — Liga Korupsi Indonesia`;
      return;
    }

    const titles: Record<string, string> = {
      beranda: 'Liga Korupsi Indonesia (LKI) — Portal Transparansi Perkara & Putusan Hukum',
      klasemen: 'Klasemen Liga Korupsi Indonesia — Peringkat Pejabat & Partai | LKI',
      peta: 'Peta Spasial Korupsi 38 Provinsi Indonesia | LKI',
      statistik: 'Statistik & Analisis Tren Perkara Korupsi Nasional | LKI',
      cari: 'Eksplorasi & Cari Berkas Kasus Korupsi | LKI',
      admin: 'Panel Kurasi & Moderasi Verifikator | LKI'
    };

    document.title = titles[activeTab] || 'Liga Korupsi Indonesia (LKI)';
  }, [activeTab, activeCaseDetail]);

  const handleOpenReport = (caseId?: string, mode?: 'new_case' | 'correction' | 'track') => {
    setReportTargetCaseId(caseId || null);
    setReportInitialMode(mode || (caseId ? 'correction' : 'new_case'));
    setReportModalOpen(true);
  };

  // DEDICATED ADMIN PORTAL VIEW (Page layout with sidebar)
  if (activeTab === 'admin') {
    return (
      <Suspense fallback={
        <div className="min-h-screen bg-[#0B0F19] flex flex-col items-center justify-center space-y-4">
          <Loader2 className="w-10 h-10 text-[#DC2626] animate-spin" />
          <p className="font-mono text-sm text-[#94A3B8]">Memuat Portal Admin...</p>
        </div>
      }>
        <AdminPanel 
          onRefreshData={() => loadAllData(true)} 
          onBackToHome={() => {
            sound.playPop();
            navigateToTab('beranda');
          }}
        />
      </Suspense>
    );
  }

  return (
    <div className="min-h-screen flex flex-col selection:bg-[#FDE047] selection:text-[#713F12]">
      
      {/* Top Scrapbook Header Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={navigateToTab}
        onOpenReport={() => router.push('/lapor')}
        initialOpenData={initialOpenData}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12 space-y-8">
        
        {/* Mandatory Permanent Legal Disclaimer */}
        <DisclaimerBanner />

        {/* Loading Spinner */}
        {isLoading ? (
          <div className="py-24 text-center space-y-3">
            <Loader2 className="w-10 h-10 text-[#EA580C] animate-spin mx-auto" />
            <p className="font-marker text-xl text-[#57534E]">
              Membuka Lembaran Buku Catatan Korupsi...
            </p>
          </div>
        ) : (
          <Suspense fallback={
            <div className="py-24 text-center space-y-3">
              <Loader2 className="w-10 h-10 text-[#EA580C] animate-spin mx-auto" />
              <p className="font-marker text-xl text-[#57534E]">
                Memuat Tampilan...
              </p>
            </div>
          }>
            {/* TAB: BERANDA / LANDING PAGE */}
            {activeTab === 'beranda' && (
              <LandingPage
                stats={stats}
                cases={cases}
                onNavigate={navigateToTab}
                onSelectCase={(id) => setSelectedCaseId(id)}
                onOpenReport={() => router.push('/lapor')}
              />
            )}

            {/* TAB: PETA INTERAKTIF */}
            {activeTab === 'peta' && (
              <IndonesiaMap
                regions={regions}
                cases={cases}
                selectedProvince={selectedProvince}
                onSelectProvince={setSelectedProvince}
                onSelectCase={(id) => setSelectedCaseId(id)}
                onOpenReport={() => router.push('/lapor')}
              />
            )}

            {/* TAB: KLASEMEN LIGA */}
            {activeTab === 'klasemen' && (
              <LeaderboardTable
                items={leaderboard}
                cases={cases}
                onSelectCase={(id) => setSelectedCaseId(id)}
                provinces={provincesList}
              />
            )}

            {/* TAB: STATISTIK & FAKTA */}
            {activeTab === 'statistik' && stats && (
              <StatsDashboard
                stats={stats}
                cases={cases}
                onSelectCase={(id) => setSelectedCaseId(id)}
              />
            )}

            {/* TAB: CARI KASUS */}
            {activeTab === 'cari' && (
              <SearchCasesView
                cases={cases}
                provinces={provincesList}
                onSelectCase={(id) => setSelectedCaseId(id)}
                onOpenReport={(cId, mode) => handleOpenReport(cId, mode)}
              />
            )}
          </Suspense>
        )}

      </main>

      {/* Case Detail Modal */}
      <CaseDetailModal
        caseData={activeCaseDetail}
        onClose={() => {
          setSelectedCaseId(null);
          if (pathname?.startsWith('/kasus/')) {
            router.push('/cari');
          } else if (pathname?.startsWith('/tokoh/')) {
            router.push('/klasemen');
          }
        }}
        onOpenReport={(cId) => handleOpenReport(cId, 'correction')}
      />

      {/* Report Mistake Modal */}
      {reportModalOpen && (
        <Suspense fallback={null}>
          <ReportModal
            isOpen={reportModalOpen}
            onClose={() => {
              setReportModalOpen(false);
              if (pathname === '/lapor') {
                router.push('/');
              }
            }}
            caseId={reportTargetCaseId}
            initialMode={reportInitialMode}
            cases={cases.map(c => ({
              id: c.id,
              title: `${c.official?.nama} (${c.official?.jabatan}) - ${c.official?.provinsi}`
            }))}
          />
        </Suspense>
      )}

      {/* Scrapbook Footer (Memuat Kartu QRIS & Info Landasan Sumber) */}
      <Footer 
        onNavigate={(tab) => {
          sound.playPop();
          navigateToTab(tab);
        }}
        onOpenReport={(mode) => {
          sound.playPop();
          handleOpenReport(undefined, typeof mode === 'string' ? mode as any : 'new_case');
        }}
        onOpenAdmin={() => {
          sound.playPop();
          navigateToTab('admin');
        }} 
      />

    </div>
  );
}
