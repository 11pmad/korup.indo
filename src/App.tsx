import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar.js';
import { DisclaimerBanner } from './components/DisclaimerBanner.js';
import { LandingPage } from './components/LandingPage.js';
import { IndonesiaMap } from './components/IndonesiaMap.js';
import { LeaderboardTable } from './components/LeaderboardTable.js';
import { StatsDashboard } from './components/StatsDashboard.js';
import { SearchCasesView } from './components/SearchCasesView.js';
import { AdminPanel } from './components/AdminPanel.js';
import { CaseDetailModal } from './components/CaseDetailModal.js';
import { ReportModal } from './components/ReportModal.js';
import { Footer } from './components/Footer.js';
import { 
  CorruptionCase, 
  RegionSummary, 
  LeaderboardItem, 
  StatsOverview 
} from './types.js';
import { sound } from './utils/audio.js';
import { Loader2 } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'beranda' | 'peta' | 'klasemen' | 'statistik' | 'cari' | 'admin'>(() => {
    if (typeof window !== 'undefined' && (window.location.pathname === '/admin' || window.location.hash === '#admin')) {
      return 'admin';
    }
    return 'beranda';
  });
  
  // Data states
  const [cases, setCases] = useState<CorruptionCase[]>([]);
  const [regions, setRegions] = useState<RegionSummary[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardItem[]>([]);
  const [stats, setStats] = useState<StatsOverview | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Selected item states
  const [selectedProvince, setSelectedProvince] = useState<string | null>(null);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [reportModalOpen, setReportModalOpen] = useState<boolean>(false);
  const [reportTargetCaseId, setReportTargetCaseId] = useState<string | null>(null);
  const [reportInitialMode, setReportInitialMode] = useState<'new_case' | 'correction' | 'track'>('new_case');

  // Sync browser back/forward history
  useEffect(() => {
    const handlePopState = () => {
      if (window.location.pathname === '/admin' || window.location.hash === '#admin') {
        setActiveTab('admin');
      } else {
        setActiveTab('beranda');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Track SPA pageview in monitoring
  useEffect(() => {
    try {
      const pagePath = activeTab === 'beranda' ? '/' : `/${activeTab}`;
      fetch('/api/admin/monitoring/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: pagePath,
          referrer: document.referrer || 'Direct'
        })
      }).catch(() => {});
    } catch (e) {}
  }, [activeTab]);

  const loadAllData = async () => {
    setIsLoading(true);
    try {
      const [casesRes, regionsRes, leaderRes, statsRes] = await Promise.all([
        fetch('/api/cases?limit=100'),
        fetch('/api/regions/summary'),
        fetch('/api/leaderboard'),
        fetch('/api/stats/overview')
      ]);

      const casesData = await casesRes.json();
      const regionsData = await regionsRes.json();
      const leaderData = await leaderRes.json();
      const statsData = await statsRes.json();

      setCases(Array.isArray(casesData?.cases) ? casesData.cases : []);
      setRegions(Array.isArray(regionsData) ? regionsData : []);
      setLeaderboard(Array.isArray(leaderData) ? leaderData : []);
      setStats(statsData && !statsData.error ? statsData : null);
    } catch (err) {
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
      <AdminPanel 
        onRefreshData={loadAllData} 
        onBackToHome={() => {
          sound.playPop();
          setActiveTab('beranda');
          if (typeof window !== 'undefined' && window.location.pathname === '/admin') {
            window.history.pushState({}, '', '/');
          }
        }}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col selection:bg-[#FDE047] selection:text-[#713F12]">
      
      {/* Top Scrapbook Header Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenReport={() => handleOpenReport()}
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
          <>
            {/* TAB: BERANDA / LANDING PAGE */}
            {activeTab === 'beranda' && (
              <LandingPage
                stats={stats}
                cases={cases}
                onNavigate={(tab) => {
                  setActiveTab(tab);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                onSelectCase={(id) => setSelectedCaseId(id)}
                onOpenReport={() => handleOpenReport()}
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
                onOpenReport={() => handleOpenReport(undefined, 'new_case')}
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
          </>
        )}

      </main>

      {/* Case Detail Modal */}
      <CaseDetailModal
        caseData={activeCaseDetail}
        onClose={() => setSelectedCaseId(null)}
        onOpenReport={(cId) => handleOpenReport(cId, 'correction')}
      />

      {/* Report Mistake Modal */}
      <ReportModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        caseId={reportTargetCaseId}
        initialMode={reportInitialMode}
        cases={cases.map(c => ({
          id: c.id,
          title: `${c.official?.nama} (${c.official?.jabatan}) - ${c.official?.provinsi}`
        }))}
      />

      {/* Scrapbook Footer (Memuat Kartu QRIS & Info Landasan Sumber) */}
      <Footer 
        onNavigate={(tab) => {
          sound.playPop();
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenReport={(mode) => {
          sound.playPop();
          handleOpenReport(undefined, typeof mode === 'string' ? mode as any : 'new_case');
        }}
        onOpenAdmin={() => {
          sound.playPop();
          setActiveTab('admin');
          if (typeof window !== 'undefined') {
            window.history.pushState({}, '', '/admin');
          }
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }} 
      />

    </div>
  );
}
