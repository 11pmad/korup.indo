import React, { useState, useEffect, useRef } from 'react';
import { AuditLog, UserReport, LegalStatus } from '../types.js';
import { formatRupiah, getStatusBadgeStyle } from '../utils/formatters.js';
import { sound } from '../utils/audio.js';
import { 
  Sparkles, 
  Send, 
  CheckCircle2, 
  RotateCcw, 
  ExternalLink, 
  AlertCircle, 
  History, 
  FileEdit, 
  MessageSquare, 
  Scale, 
  ShieldCheck, 
  PlusCircle, 
  Trash2,
  Lock,
  Unlock,
  Check,
  X,
  Image as ImageIcon,
  Upload
} from 'lucide-react';
import { getOfficialPhoto, handleImageError } from '../utils/photo.js';
import { AdminLayout, AdminSubtab } from './admin/AdminLayout.js';
import { AdminDashboardOverview } from './admin/AdminDashboardOverview.js';
import { AdminCasesManager } from './admin/AdminCasesManager.js';
import { AdminOfficialsManager } from './admin/AdminOfficialsManager.js';
import { AdminAnnouncementManager } from './admin/AdminAnnouncementManager.js';
import { AdminDonationManager } from './admin/AdminDonationManager.js';
import { AdminReportsManager } from './admin/AdminReportsManager.js';
import { AdminMonitoringManager } from './admin/AdminMonitoringManager.js';
import { AdminCommentsManager } from './admin/AdminCommentsManager.js';
import { PROVINCES_LIST } from './ReportModal.js';

interface AdminPanelProps {
  onRefreshData: () => void;
  onBackToHome?: () => void;
}

interface ChatMessage {
  role: 'admin' | 'ai';
  text: string;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onRefreshData, onBackToHome }) => {
  // Simple auth gate with JWT
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return Boolean(sessionStorage.getItem('lki_admin_token'));
  });
  const [authToken, setAuthToken] = useState<string>(() => {
    return sessionStorage.getItem('lki_admin_token') || '';
  });
  const [authUsername, setAuthUsername] = useState<string>('admin');
  const [authPassword, setAuthPassword] = useState<string>('admin123');
  const [authError, setAuthError] = useState<string | null>(null);

  // Active view tab
  const [activeTab, setActiveTab] = useState<AdminSubtab>('dashboard');

  // AI Chat state
  const [chatInput, setChatInput] = useState<string>('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    {
      role: 'ai',
      text: 'Halo Admin Verifikator! Saya asisten AI kurasi data Liga Korupsi Indonesia (LKI). Silakan ketik perintah dalam bahasa alami (misal: "Tambahkan kasus suap pengadaan proyek oleh Bupati X senilai 5 miliar..."). Sesuai SOP integritas hukum, setiap data wajib menyertakan link sumber berita/putusan resmi dan status hukum yang tegas.'
    }
  ]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [activeDraft, setActiveDraft] = useState<any | null>(null);
  const [activeLogId, setActiveLogId] = useState<string | null>(null);
  const [publishSuccess, setPublishSuccess] = useState<string | null>(null);

  // Audit Logs state
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState<boolean>(false);

  // Reports state
  const [reports, setReports] = useState<UserReport[]>([]);
  const [loadingReports, setLoadingReports] = useState<boolean>(false);

  // Manual Form state
  const [manualForm, setManualForm] = useState({
    tingkat_wilayah: 'daerah' as 'nasional' | 'daerah',
    nama: '',
    jabatan: '',
    partai: 'Non-Partai',
    provinsi: 'DKI Jakarta',
    kota_kabupaten: '',
    daerah_pemilihan: '',
    ringkasan_kasus: '',
    nilai_kerugian_negara: '',
    tahun_kejadian: new Date().getFullYear().toString(),
    tahun_putusan: '',
    status_hukum: 'Tersangka' as LegalStatus,
    jenis_kasus: 'Suap / Gratifikasi',
    perusahaan: '',
    sumber_url: '',
    sumber_media: '',
    foto_url: ''
  });
  const [manualError, setManualError] = useState<string | null>(null);
  const [manualSuccess, setManualSuccess] = useState<string | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isAuthenticated && authToken) {
      fetchAuditLogs();
      fetchReports();
    }
  }, [isAuthenticated, authToken]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isProcessing]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: authUsername, password: authPassword })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Kredensial salah');
      }
      sound.playCheer();
      sessionStorage.setItem('lki_admin_token', data.token);
      setAuthToken(data.token);
      setIsAuthenticated(true);
    } catch (err: any) {
      setAuthError(err.message || 'Login gagal.');
    }
  };

  const handleLogout = () => {
    sound.playPop();
    sessionStorage.removeItem('lki_admin_token');
    setAuthToken('');
    setIsAuthenticated(false);
  };

  const fetchAuditLogs = async () => {
    setLoadingLogs(true);
    try {
      const res = await fetch('/api/admin/audit-logs', {
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : {}
      });
      const data = await res.json();
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
      const data = await res.json();
      setReports(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching reports:', err);
    } finally {
      setLoadingReports(false);
    }
  };

  const handleSendAiCommand = async (textToSend?: string) => {
    const message = textToSend || chatInput;
    if (!message.trim()) return;

    sound.playPop();
    const updatedHistory: ChatMessage[] = [
      ...chatHistory,
      { role: 'admin', text: message }
    ];
    setChatHistory(updatedHistory);
    setChatInput('');
    setIsProcessing(true);
    setPublishSuccess(null);

    try {
      const res = await fetch('/api/admin/ai-command', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
        },
        body: JSON.stringify({
          command: message,
          history: updatedHistory
        })
      });

      const data = await res.json();

      setChatHistory([
        ...updatedHistory,
        { role: 'ai', text: data.message }
      ]);

      if (data.is_draft_ready && data.draft) {
        sound.playSticker();
        setActiveDraft(data.draft);
        setActiveLogId(data.log_id);
      } else {
        setActiveDraft(null);
        setActiveLogId(null);
      }
    } catch (err: any) {
      setChatHistory([
        ...updatedHistory,
        { role: 'ai', text: `Terjadi kendala teknis: ${err.message}` }
      ]);
    } finally {
      setIsProcessing(false);
      fetchAuditLogs();
    }
  };

  const handleConfirmDraft = async () => {
    if (!activeLogId) return;
    sound.playCheer();
    setIsProcessing(true);

    try {
      const res = await fetch('/api/admin/cases/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
        },
        body: JSON.stringify({
          log_id: activeLogId,
          catatan_admin: 'Disetujui oleh kurator via AI Assistant'
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal mempublikasikan kasus');
      }

      setPublishSuccess(`Data kasus berhasil dipublikasikan ke peta & klasemen publik! (ID: ${data.case_id})`);
      setActiveDraft(null);
      setActiveLogId(null);
      onRefreshData();
      fetchAuditLogs();
    } catch (err: any) {
      alert(`Gagal konfirmasi: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRollback = async (logId: string) => {
    if (!confirm('Apakah Anda yakin ingin melakukan ROLLBACK dan mencabut data kasus ini dari database publik?')) {
      return;
    }

    sound.playPop();
    try {
      const res = await fetch(`/api/admin/rollback/${logId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
        }
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal rollback');
      }
      alert(data.message || 'Rollback berhasil! Data ditarik dari database publik.');
      onRefreshData();
      fetchAuditLogs();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleReportAction = async (reportId: string, action: 'disetujui' | 'ditolak') => {
    sound.playPop();
    try {
      const res = await fetch(`/api/admin/reports/${reportId}/action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
        },
        body: JSON.stringify({ action })
      });
      if (res.ok) {
        fetchReports();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setManualError(null);
    setManualSuccess(null);

    // Strict validation: At least 1 source URL
    if (!manualForm.sumber_url || !manualForm.sumber_url.startsWith('http')) {
      setManualError('Validasi Gagal: Setiap kasus HARUS memiliki minimal 1 link/URL sumber berita atau putusan resmi yang valid!');
      return;
    }

    try {
      const res = await fetch('/api/admin/cases/manual', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
        },
        body: JSON.stringify(manualForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal memproses data kasus');

      sound.playCheer();
      setManualSuccess('Data kasus dan pejabat publik berhasil disimpan dan dipublikasikan!');
      setManualForm({
        tingkat_wilayah: 'daerah',
        nama: '',
        jabatan: '',
        partai: 'Non-Partai',
        provinsi: 'DKI Jakarta',
        kota_kabupaten: '',
        daerah_pemilihan: '',
        ringkasan_kasus: '',
        nilai_kerugian_negara: '',
        tahun_kejadian: new Date().getFullYear().toString(),
        tahun_putusan: '',
        status_hukum: 'Tersangka' as LegalStatus,
        jenis_kasus: 'Suap / Gratifikasi',
        perusahaan: '',
        sumber_url: '',
        sumber_media: '',
        foto_url: ''
      });
      onRefreshData();
      fetchAuditLogs();
    } catch (err: any) {
      setManualError(err.message);
    }
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
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-xs text-amber-300 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <span>🔑 Kredensial Pengujian:</span>
              </div>
              <div className="flex items-center justify-between font-mono text-[11px]">
                <span>Username: <strong>admin</strong></span>
                <span>Password: <strong>admin123</strong></span>
              </div>
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
                <input
                  type="password"
                  value={authPassword}
                  onChange={e => setAuthPassword(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-500 focus:ring-2 focus:ring-[#DC2626] focus:outline-none"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-[#DC2626] hover:bg-[#B91C1C] text-white font-bold rounded-xl text-xs transition-colors shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <Unlock className="w-4 h-4" />
                <span>Masuk ke Panel Kurator</span>
              </button>
            </form>

            {onBackToHome && (
              <div className="pt-3 border-t border-slate-800/80 text-center">
                <button
                  type="button"
                  onClick={onBackToHome}
                  className="text-xs text-slate-400 hover:text-white transition-colors cursor-pointer inline-flex items-center gap-1.5"
                >
                  ← Kembali ke Portal Publik
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout
      activeSubtab={activeTab}
      setActiveSubtab={setActiveTab}
      onLogout={handleLogout}
      onBackToPublic={onBackToHome || (() => {})}
      pendingReportsCount={reports.filter(r => (r.status as string) === 'menunggu_review' || (r.status as string) === 'pending_review').length}
      adminUsername={authUsername || 'admin'}
    >
      {/* TAB 1: DASHBOARD OVERVIEW */}
      {activeTab === 'dashboard' && (
        <AdminDashboardOverview
          authToken={authToken}
          auditLogs={auditLogs}
          reports={reports}
          onNavigate={setActiveTab}
          onRefresh={onRefreshData}
        />
      )}

      {/* TAB 2: CASES MANAGER */}
      {activeTab === 'cases' && (
        <AdminCasesManager
          authToken={authToken}
          onOpenCreate={() => setActiveTab('manual')}
          onRefreshGlobal={onRefreshData}
        />
      )}

      {/* TAB 3: OFFICIALS MANAGER */}
      {activeTab === 'officials' && (
        <AdminOfficialsManager
          authToken={authToken}
          onRefreshGlobal={onRefreshData}
        />
      )}

      {/* TAB: ANNOUNCEMENT MANAGER */}
      {activeTab === 'announcement' && (
        <AdminAnnouncementManager
          authToken={authToken}
          onRefreshGlobal={onRefreshData}
        />
      )}

      {/* TAB: DONATION & QRIS MANAGER */}
      {activeTab === 'donation' && (
        <AdminDonationManager
          authToken={authToken}
          onRefreshGlobal={onRefreshData}
        />
      )}

      {/* TAB 4: AI ASSISTANT CHAT & DRAFT */}


      {activeTab === 'ai' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Chat Pane */}
          <div className="lg:col-span-7 bg-[#FFFDF8] border-2 border-[#E7DECB] rounded-3xl p-5 shadow-sm flex flex-col h-[620px]">
            <div className="flex items-center justify-between pb-3 border-b border-[#EFE5CF]">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-xs font-bold text-[#1E293B]">Percakapan Perintah &amp; Klarifikasi Fakta</span>
              </div>
              <span className="text-[11px] text-[#64748B] font-mono">Gemini 3.8 Flash • Strict Rule</span>
            </div>

            {/* Quick Prompt Chips */}
            <div className="py-2.5 flex items-center gap-1.5 overflow-x-auto border-b border-[#F4EDE0]">
              <span className="text-[11px] font-bold text-gray-500 whitespace-nowrap">Coba Cepat:</span>
              <button
                onClick={() => handleSendAiCommand('Tambahkan kasus korupsi Bupati X di Jawa Timur, kerugian 4 miliar')}
                className="px-2.5 py-1 bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A] rounded-xl text-[11px] font-semibold whitespace-nowrap hover:bg-[#FDE68A]"
              >
                1. Tanpa Sumber (Uji Penolakan AI)
              </button>
              <button
                onClick={() => handleSendAiCommand('Di Jawa Timur, tahun 2023, status Terdakwa, link sumber berita https://nasional.kompas.com/read/2023/10/kasus-bupati-x')}
                className="px-2.5 py-1 bg-[#DCFCE7] text-[#166534] border border-[#BBF7D0] rounded-xl text-[11px] font-semibold whitespace-nowrap hover:bg-[#BBF7D0]"
              >
                2. Lengkapi Sumber &amp; Status Hukum
              </button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto py-4 space-y-3.5 pr-2">
              {chatHistory.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex items-start gap-2.5 ${msg.role === 'admin' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'ai' && (
                    <div className="w-7 h-7 rounded-lg bg-[#FFE4E6] text-[#E11D48] flex items-center justify-center text-xs font-bold shrink-0 mt-1">
                      🤖
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap ${
                      msg.role === 'admin'
                        ? 'bg-[#1E293B] text-white rounded-br-xs'
                        : 'bg-[#FAF6EC] border border-[#EBE1CD] text-[#334155] rounded-bl-xs shadow-2xs'
                    }`}
                  >
                    {msg.text}
                  </div>

                  {msg.role === 'admin' && (
                    <div className="w-7 h-7 rounded-lg bg-[#0284C7] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-1">
                      👤
                    </div>
                  )}
                </div>
              ))}

              {isProcessing && (
                <div className="flex items-center gap-2 text-xs text-gray-500 font-semibold italic">
                  <span className="w-4 h-4 border-2 border-[#DC2626] border-t-transparent rounded-full animate-spin"></span>
                  <span>AI sedang menelaah kelengkapan fakta dan tautan sumber...</span>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Input Bar */}
            <form
              onSubmit={e => {
                e.preventDefault();
                handleSendAiCommand();
              }}
              className="pt-3 border-t border-[#EFE5CF] flex items-center gap-2"
            >
              <input
                type="text"
                placeholder="Ketik perintah atau jawaban klarifikasi (misal sertakan link sumber & status hukum)..."
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                disabled={isProcessing}
                className="flex-1 bg-[#FAF5E8] border border-[#D5C9AB] rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-[#1F2937] focus:ring-2 focus:ring-[#DC2626] focus:outline-none"
              />
              <button
                type="submit"
                disabled={isProcessing || !chatInput.trim()}
                className="p-2.5 bg-[#DC2626] text-white rounded-2xl hover:bg-[#B91C1C] disabled:opacity-40 transition-colors shadow-sm shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* Draft Preview & Review Pane */}
          <div className="lg:col-span-5 bg-[#FFFDF8] border-2 border-[#E7DECB] rounded-3xl p-5 shadow-sm flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#EFE5CF]">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-[#FEF08A] text-[#854D0E] rounded-lg">📋</span>
                  <span className="text-xs font-bold text-[#1E293B]">Pratinjau Draf Data (Human Review)</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full">
                  Belum Dipublikasi
                </span>
              </div>

              {publishSuccess && (
                <div className="p-4 bg-[#F0FDF4] border border-[#BBF7D0] rounded-2xl text-xs text-[#166534] space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
                    <span>Sukses Dipublikasikan!</span>
                  </div>
                  <p>{publishSuccess}</p>
                </div>
              )}

              {activeDraft ? (
                <div className="space-y-3.5 bg-[#FAF6EC] border border-[#E9DFCB] rounded-2xl p-4 text-xs">
                  {/* Official Header */}
                  <div>
                    <span className="text-[10px] font-bold text-gray-500 uppercase">Profil Pejabat</span>
                    <div className="font-bold text-base text-[#1E293B]">
                      {activeDraft.official.nama}
                    </div>
                    <div className="text-gray-600">
                      {activeDraft.official.jabatan} • {activeDraft.official.partai}
                    </div>
                    <div className="text-[11px] text-[#0284C7] font-semibold pt-0.5">
                      📍 {activeDraft.official.provinsi} ({activeDraft.official.kota_kabupaten})
                    </div>
                  </div>

                  {/* Legal Status & Loss */}
                  <div className="p-3 bg-white border border-[#E2D6BA] rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-gray-500 block">Status Hukum:</span>
                      <span className="font-bold text-[#B91C1C]">
                        ⚖️ {activeDraft.corruption_case.status_hukum}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-gray-500 block">Estimasi Kerugian:</span>
                      <span className="font-marker text-sm font-bold text-[#EA580C]">
                        {formatRupiah(activeDraft.corruption_case.nilai_kerugian_negara)}
                      </span>
                    </div>
                  </div>

                  {/* Summary */}
                  <div>
                    <span className="text-[10px] font-bold text-gray-500 uppercase">Ringkasan Kasus:</span>
                    <p className="text-gray-700 leading-relaxed mt-0.5">
                      {activeDraft.corruption_case.ringkasan_kasus}
                    </p>
                  </div>

                  {/* Sources (CRITICAL VALIDATION) */}
                  <div>
                    <span className="text-[10px] font-bold text-[#166534] uppercase flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-[#16A34A]" /> Tautan Sumber Berita Terverifikasi:
                    </span>
                    <div className="mt-1 space-y-1.5">
                      {activeDraft.sources.map((s: any, idx: number) => (
                        <a
                          key={idx}
                          href={s.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between p-2 bg-[#F0FDF4] border border-[#BBF7D0] rounded-lg text-[#166534] hover:underline"
                        >
                          <span className="truncate">{s.nama_media || s.url}</span>
                          <ExternalLink className="w-3 h-3 shrink-0 ml-1" />
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-gray-400 font-hand text-base space-y-2">
                  <div className="text-3xl">🗂️</div>
                  <p>Belum ada draft aktif.</p>
                  <p className="text-xs text-gray-500 font-normal">
                    Ketik instruksi di sebelah kiri. Setelah data wajib (termasuk link sumber berita) lengkap, draft akan muncul di sini untuk ditinjau.
                  </p>
                </div>
              )}
            </div>

            {/* Actions for active draft */}
            {activeDraft && (
              <div className="pt-4 border-t border-[#EFE5CF] space-y-2">
                <div className="p-2 bg-[#FEF9C3] rounded-xl text-[11px] text-[#713F12]">
                  ⚠️ <strong>Human Review SOP:</strong> Pastikan Anda telah mengklik link sumber di atas untuk mengonfirmasi keabsahan dokumen sebelum menekan tombol setujui.
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      sound.playPop();
                      setActiveDraft(null);
                      setActiveLogId(null);
                    }}
                    className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl"
                  >
                    Tolak Draf
                  </button>

                  <button
                    onClick={handleConfirmDraft}
                    disabled={isProcessing}
                    className="flex-2 py-2.5 bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-bold rounded-xl shadow-sm flex items-center justify-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>Setujui &amp; Publikasikan ke Database Resmi</span>
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      )}

      {/* TAB 2: MANUAL FORM */}
      {activeTab === 'manual' && (
        <div className="bg-[#FFFDF8] border-2 border-[#E7DECB] rounded-3xl p-6 sm:p-8 shadow-sm max-w-3xl mx-auto space-y-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#FFEDD5] text-[#EA580C] rounded-2xl">
              <FileEdit className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-marker text-2xl text-[#1E293B]">
                Formulir Input Kasus Manual
              </h3>
              <p className="text-xs text-[#64748B]">
                Masukkan data langsung ke dalam sistem dengan validasi integritas ketat.
              </p>
            </div>
          </div>

          {manualSuccess && (
            <div className="p-4 bg-[#F0FDF4] border border-[#BBF7D0] rounded-2xl text-xs text-[#166534] font-bold">
              ✓ {manualSuccess}
            </div>
          )}

          {manualError && (
            <div className="p-4 bg-[#FEF2F2] border border-[#FECACA] rounded-2xl text-xs text-[#991B1B]">
              ✕ {manualError}
            </div>
          )}

          <form onSubmit={handleManualSubmit} className="space-y-4">
            {/* Foto Pejabat / Pelaku Korupsi */}
            <div className="p-4 bg-[#FAF5E8] border border-[#D5C9AB] rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[#475569] uppercase tracking-wider flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-[#EA580C]" />
                  <span>Foto Pejabat / Pelaku Korupsi (Opsional)</span>
                </label>
                <span className="text-[11px] text-slate-500 font-medium">
                  Default otomatis: Siluet Berkas LKI
                </span>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                {/* Photo Preview */}
                <div className="relative shrink-0">
                  <div className="w-20 h-20 rounded-xl overflow-hidden border-2 border-[#D5C9AB] bg-white shadow-xs">
                    <img
                      src={getOfficialPhoto(manualForm.foto_url)}
                      alt="Preview Foto"
                      onError={handleImageError}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {manualForm.foto_url && (
                    <button
                      type="button"
                      onClick={() => setManualForm({ ...manualForm, foto_url: '' })}
                      className="absolute -top-1.5 -right-1.5 p-1 bg-rose-600 text-white rounded-full hover:bg-rose-700 shadow-xs cursor-pointer transition-colors"
                      title="Hapus foto (gunakan default)"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Input Controls */}
                <div className="flex-1 w-full space-y-2">
                  <input
                    type="url"
                    placeholder="Tempel URL Gambar (https://...)"
                    value={manualForm.foto_url}
                    onChange={e => setManualForm({ ...manualForm, foto_url: e.target.value })}
                    className="w-full bg-white border border-[#D5C9AB] rounded-xl px-3 py-2 text-xs text-[#1F2937] focus:ring-2 focus:ring-[#EA580C] focus:outline-none"
                  />
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#D5C9AB] hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-700 cursor-pointer transition-colors shadow-2xs">
                      <Upload className="w-3.5 h-3.5 text-[#EA580C]" />
                      <span>Unggah File Foto</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={e => {
                          const file = e.target.files?.[0];
                          if (file) {
                            if (file.size > 2 * 1024 * 1024) {
                              alert('Ukuran file maksimal 2MB');
                              return;
                            }
                            const reader = new FileReader();
                            reader.onload = () => {
                              if (typeof reader.result === 'string') {
                                setManualForm({ ...manualForm, foto_url: reader.result });
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                    <span className="text-[11px] text-slate-500">
                      Format JPG, PNG, WebP (maks. 2MB). Jika dikosongkan, siluet generik LKI akan ditampilkan otomatis.
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#475569] mb-1">
                  Nama Pejabat Publik (Wajib)
                </label>
                <input
                  type="text"
                  required
                  placeholder="Misal: H. Nama Pejabat, S.E."
                  value={manualForm.nama}
                  onChange={e => setManualForm({ ...manualForm, nama: e.target.value })}
                  className="w-full bg-[#FAF5E8] border border-[#D5C9AB] rounded-xl px-3 py-2 text-xs text-[#1F2937] focus:ring-2 focus:ring-[#EA580C] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#475569] mb-1">
                  Jabatan (Wajib)
                </label>
                <input
                  type="text"
                  required
                  placeholder="Misal: Bupati / Anggota DPRD / Kepala Dinas"
                  value={manualForm.jabatan}
                  onChange={e => setManualForm({ ...manualForm, jabatan: e.target.value })}
                  className="w-full bg-[#FAF5E8] border border-[#D5C9AB] rounded-xl px-3 py-2 text-xs text-[#1F2937] focus:ring-2 focus:ring-[#EA580C] focus:outline-none"
                />
              </div>
            </div>

            {/* Selector Tingkat Yurisdiksi / Cakupan Wilayah (Nasional vs Daerah) */}
            <div className="bg-[#FAF5E8] border border-[#D5C9AB] rounded-2xl p-4 space-y-3 shadow-2xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 pb-2 border-b border-[#E7DECB]">
                <label className="text-xs font-black text-[#1E293B] flex items-center gap-2">
                  <span className="text-base">⚖️</span>
                  <span>Tingkat Yurisdiksi Perkara:</span>
                </label>
                <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                  manualForm.tingkat_wilayah === 'nasional'
                    ? 'bg-amber-100 text-amber-900 border-amber-300'
                    : 'bg-emerald-100 text-emerald-900 border-emerald-300'
                }`}>
                  {manualForm.tingkat_wilayah === 'nasional' 
                    ? '🏛️ Skala Nasional (Instansi Pusat / APBN / BUMN)' 
                    : '📍 Skala Daerah (Pemerintah Daerah / APBD / BUMD)'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Opsi 1: Tingkat Nasional */}
                <button
                  type="button"
                  onClick={() => {
                    sound.playPop();
                    setManualForm({
                      ...manualForm,
                      tingkat_wilayah: 'nasional',
                      provinsi: 'Pusat / Nasional (Kementerian / Lembaga RI)'
                    });
                  }}
                  className={`p-3.5 rounded-2xl border-2 text-xs font-bold transition-all text-left flex items-start gap-3 cursor-pointer ${
                    manualForm.tingkat_wilayah === 'nasional'
                      ? 'bg-amber-50/90 border-amber-500 text-amber-950 shadow-sm ring-2 ring-amber-400/40'
                      : 'bg-white border-[#E2D8C0] text-[#57534E] hover:bg-[#F7F1E1]'
                  }`}
                >
                  <span className="text-2xl p-1 bg-amber-100/70 rounded-xl border border-amber-300/60 shrink-0">🏛️</span>
                  <div className="min-w-0">
                    <div className="font-black text-[13px] text-[#1E293B] flex items-center gap-1.5">
                      <span>Tingkat Nasional / Pemerintah Pusat</span>
                      {manualForm.tingkat_wilayah === 'nasional' && (
                        <span className="text-emerald-600 text-xs">✓ Aktif</span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-600 font-normal leading-relaxed mt-1">
                      Kementerian, DPR/DPD RI, Direksi BUMN Holding, Hakim MA/MK, Mabes TNI/Polri, dan Lembaga Tinggi Negara.
                    </p>
                  </div>
                </button>

                {/* Opsi 2: Tingkat Daerah */}
                <button
                  type="button"
                  onClick={() => {
                    sound.playPop();
                    setManualForm({
                      ...manualForm,
                      tingkat_wilayah: 'daerah',
                      provinsi: manualForm.provinsi.includes('Nasional') || manualForm.provinsi.includes('Pusat')
                        ? 'Jawa Timur'
                        : manualForm.provinsi
                    });
                  }}
                  className={`p-3.5 rounded-2xl border-2 text-xs font-bold transition-all text-left flex items-start gap-3 cursor-pointer ${
                    manualForm.tingkat_wilayah === 'daerah'
                      ? 'bg-emerald-50/90 border-emerald-500 text-emerald-950 shadow-sm ring-2 ring-emerald-400/40'
                      : 'bg-white border-[#E2D8C0] text-[#57534E] hover:bg-[#F7F1E1]'
                  }`}
                >
                  <span className="text-2xl p-1 bg-emerald-100/70 rounded-xl border border-emerald-300/60 shrink-0">📍</span>
                  <div className="min-w-0">
                    <div className="font-black text-[13px] text-[#1E293B] flex items-center gap-1.5">
                      <span>Tingkat Daerah / 38 Provinsi</span>
                      {manualForm.tingkat_wilayah === 'daerah' && (
                        <span className="text-emerald-600 text-xs">✓ Aktif</span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-600 font-normal leading-relaxed mt-1">
                      Pemerintah Provinsi, Pemkab / Pemkot, Anggota DPRD Daerah, Kepala Dinas, serta BUMD Provinsi/Kabupaten.
                    </p>
                  </div>
                </button>
              </div>

              {manualForm.tingkat_wilayah === 'nasional' ? (
                <div className="p-2.5 bg-amber-100/50 border border-amber-300/80 rounded-xl text-[11px] text-amber-900 flex items-start gap-2 leading-relaxed">
                  <span className="text-sm shrink-0">💡</span>
                  <span>
                    <strong>Pemberitahuan Sistem:</strong> Perkara korupsi skala nasional dicatat sebagai kewenangan <strong>Instansi Pusat (APBN / BUMN)</strong>. Perkara ini tidak akan membebani kuota statistik daerah DKI Jakarta atau provinsi daerah lainnya.
                  </span>
                </div>
              ) : (
                <div className="p-2.5 bg-emerald-100/50 border border-emerald-300/80 rounded-xl text-[11px] text-emerald-900 flex items-start gap-2 leading-relaxed">
                  <span className="text-sm shrink-0">📌</span>
                  <span>
                    <strong>Pemberitahuan Sistem:</strong> Perkara akan dihubungkan secara spasial dengan peta provinsi dan klasemen liga daerah terkait.
                  </span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#475569] mb-1">
                  Partai Politik
                </label>
                <input
                  type="text"
                  placeholder="Misal: Partai Golkar / PDI-P / Non-Partai"
                  value={manualForm.partai}
                  onChange={e => setManualForm({ ...manualForm, partai: e.target.value })}
                  className="w-full bg-[#FAF5E8] border border-[#D5C9AB] rounded-xl px-3 py-2 text-xs text-[#1F2937] focus:ring-2 focus:ring-[#EA580C] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#475569] mb-1 flex items-center justify-between">
                  <span>{manualForm.tingkat_wilayah === 'nasional' ? 'Cakupan Wilayah / Instansi' : 'Provinsi Wilayah (Wajib)'}</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                    manualForm.tingkat_wilayah === 'nasional' 
                      ? 'bg-amber-100 text-amber-800' 
                      : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {manualForm.tingkat_wilayah === 'nasional' ? 'Nasional' : 'Daerah'}
                  </span>
                </label>
                <select
                  required
                  value={manualForm.provinsi}
                  onChange={e => {
                    const val = e.target.value;
                    const isNasional = val.includes('Nasional') || val.includes('Pusat');
                    setManualForm({
                      ...manualForm,
                      provinsi: val,
                      tingkat_wilayah: isNasional ? 'nasional' : 'daerah'
                    });
                  }}
                  className="w-full bg-[#FAF5E8] border border-[#D5C9AB] rounded-xl px-3 py-2 text-xs font-bold text-[#1F2937] focus:ring-2 focus:ring-[#EA580C] focus:outline-none cursor-pointer"
                >
                  <optgroup label="🏛️ Tingkat Nasional / Pemerintah Pusat">
                    <option value="Pusat / Nasional (Kementerian / Lembaga RI)">
                      🏛️ Pusat / Nasional (Kementerian / Lembaga RI / BUMN)
                    </option>
                  </optgroup>
                  <optgroup label="📍 Tingkat Daerah (38 Provinsi Nusantara)">
                    {PROVINCES_LIST.filter(p => p.id !== 'pusat').map(p => (
                      <option key={p.id} value={p.name}>
                        {p.name}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#475569] mb-1">
                  Status Hukum (Tegas)
                </label>
                <select
                  value={manualForm.status_hukum}
                  onChange={e => setManualForm({ ...manualForm, status_hukum: e.target.value as any })}
                  className="w-full bg-[#FAF5E8] border border-[#D5C9AB] rounded-xl px-3 py-2 text-xs font-bold text-[#1F2937] focus:ring-2 focus:ring-[#EA580C] focus:outline-none cursor-pointer"
                >
                  <option value="Tersangka">Tersangka</option>
                  <option value="Terdakwa">Terdakwa</option>
                  <option value="Divonis Inkrah">Divonis Inkrah</option>
                  <option value="Bebas/Praperadilan">Bebas/Praperadilan</option>
                </select>
              </div>
            </div>

            {/* Kolom Spesifikasi Instansi Pusat / Kota Kabupaten */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#475569] mb-1 flex items-center justify-between">
                  <span>
                    {manualForm.tingkat_wilayah === 'nasional'
                      ? 'Kementerian / Lembaga / BUMN Pusat'
                      : 'Kabupaten / Kota Asal (Opsional)'}
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    {manualForm.tingkat_wilayah === 'nasional' ? 'Identifikasi Lembaga' : 'Lokasi Spesifik'}
                  </span>
                </label>
                <input
                  type="text"
                  placeholder={
                    manualForm.tingkat_wilayah === 'nasional'
                      ? 'Misal: Kementerian Kominfo / Komisi I DPR RI / PT Timah Tbk / Mahkamah Agung'
                      : 'Misal: Kota Surabaya / Kab. Bogor / Kota Medan'
                  }
                  value={manualForm.kota_kabupaten}
                  onChange={e => setManualForm({ ...manualForm, kota_kabupaten: e.target.value })}
                  className="w-full bg-[#FAF5E8] border border-[#D5C9AB] rounded-xl px-3 py-2 text-xs text-[#1F2937] focus:ring-2 focus:ring-[#EA580C] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#475569] mb-1 flex items-center justify-between">
                  <span>Daerah Pemilihan / Unit Kerja (Opsional)</span>
                  <span className="text-[10px] text-slate-400 font-normal">Konteks Pejabat</span>
                </label>
                <input
                  type="text"
                  placeholder={
                    manualForm.tingkat_wilayah === 'nasional'
                      ? 'Misal: Seluruh Indonesia / Dapil Jabar I / Direktorat Jenderal Pajak'
                      : 'Misal: Dapil 1 Kab. Bogor / Fraksi Partai'
                  }
                  value={manualForm.daerah_pemilihan}
                  onChange={e => setManualForm({ ...manualForm, daerah_pemilihan: e.target.value })}
                  className="w-full bg-[#FAF5E8] border border-[#D5C9AB] rounded-xl px-3 py-2 text-xs text-[#1F2937] focus:ring-2 focus:ring-[#EA580C] focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#475569] mb-1">
                  Estimasi Kerugian Keuangan Negara / Suap (Rp)
                </label>
                <input
                  type="number"
                  required
                  placeholder="Contoh: 5000000000 (5 Miliar)"
                  value={manualForm.nilai_kerugian_negara}
                  onChange={e => setManualForm({ ...manualForm, nilai_kerugian_negara: e.target.value })}
                  className="w-full bg-[#FAF5E8] border border-[#D5C9AB] rounded-xl px-3 py-2 text-xs text-[#1F2937] focus:ring-2 focus:ring-[#EA580C] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#475569] mb-1">
                  Tahun Kejadian
                </label>
                <input
                  type="number"
                  value={manualForm.tahun_kejadian}
                  onChange={e => setManualForm({ ...manualForm, tahun_kejadian: e.target.value })}
                  className="w-full bg-[#FAF5E8] border border-[#D5C9AB] rounded-xl px-3 py-2 text-xs text-[#1F2937] focus:ring-2 focus:ring-[#EA580C] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#475569] mb-1">
                Ringkasan Kasus (Objektif)
              </label>
              <textarea
                rows={3}
                required
                placeholder="Rincian perbuatan tindak pidana korupsi, barang bukti, dan modus operandi..."
                value={manualForm.ringkasan_kasus}
                onChange={e => setManualForm({ ...manualForm, ringkasan_kasus: e.target.value })}
                className="w-full bg-[#FAF5E8] border border-[#D5C9AB] rounded-xl p-3 text-xs text-[#1F2937] focus:ring-2 focus:ring-[#EA580C] focus:outline-none"
              ></textarea>
            </div>

            {/* WAJIB SUMBER BERITA LINK */}
            <div className="p-4 bg-[#F0FDF4] border-2 border-dashed border-[#86EFAC] rounded-2xl space-y-2">
              <label className="block text-xs font-bold text-[#166534] uppercase tracking-wider flex items-center gap-1.5">
                <Scale className="w-4 h-4 text-[#16A34A]" />
                <span>Tautan Sumber Berita / Putusan Resmi (WAJIB ADA LINK):</span>
              </label>
              <input
                type="url"
                required
                placeholder="https://putusan3.mahkamahagung.go.id/... atau https://kompas.com/..."
                value={manualForm.sumber_url}
                onChange={e => setManualForm({ ...manualForm, sumber_url: e.target.value })}
                className="w-full bg-white border border-[#86EFAC] rounded-xl px-3 py-2 text-xs font-mono text-[#1F2937] focus:ring-2 focus:ring-[#16A34A] focus:outline-none"
              />
              <p className="text-[11px] text-[#15803D]">
                Data tanpa tautan sumber yang dapat diverifikasi akan ditolak oleh sistem.
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="px-6 py-2.5 bg-[#EA580C] text-white font-bold rounded-xl text-xs hover:bg-[#C2410C] transition-colors shadow-sm flex items-center gap-1.5"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Simpan &amp; Publikasikan Kasus</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: AUDIT TRAIL & ROLLBACK */}
      {activeTab === 'audit' && (
        <div className="bg-[#FFFDF8] border-2 border-[#E7DECB] rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#BAE6FD] text-[#0369A1] rounded-xl">
                <History className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-marker text-2xl text-[#1E293B]">
                  Jejak Audit &amp; Fitur Rollback
                </h3>
                <p className="text-xs text-[#64748B]">
                  Setiap instruksi perintah admin, riwayat klarifikasi AI, dan hasil verifikasi tercatat secara permanen.
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                sound.playPop();
                fetchAuditLogs();
              }}
              className="px-3 py-1.5 bg-white border border-[#CBD5E1] rounded-xl text-xs font-bold text-[#475569] hover:bg-gray-50 flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Refresh Log
            </button>
          </div>

          <div className="divide-y divide-[#EFE5CF] border border-[#E7DECB] rounded-2xl overflow-hidden">
            {loadingLogs ? (
              <div className="p-8 text-center text-gray-500 text-xs flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-[#DC2626] border-t-transparent rounded-full animate-spin"></span>
                <span>Memuat jejak log audit...</span>
              </div>
            ) : auditLogs.length === 0 ? (
              <div className="p-8 text-center text-gray-500 text-xs">Belum ada riwayat log audit.</div>
            ) : (
              auditLogs.map(log => {
                const dateVal = log.timestamp || (log as any).created_at;
                const formattedDate = dateVal && !isNaN(new Date(dateVal).getTime())
                  ? new Date(dateVal).toLocaleString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })
                  : 'Waktu tercatat';

                const rawStatus = (log.status || (log as any).action || 'selesai').toLowerCase();
                const adminName = log.admin_id || (log as any).admin_username || 'Admin';
                const actionType = ((log as any).action || 'create').toUpperCase();
                const entityType = (log as any).entity_type || 'cases';
                const entityId = (log as any).entity_id || log.created_case_id || '-';
                
                const originalCommand = log.perintah_asli || 
                  (log as any).diff_snapshot?.title || 
                  (log as any).diff_snapshot?.perintah_asli || 
                  `Aksi ${actionType} pada ${entityType} (${entityId})`;

                const targetCaseId = log.created_case_id || (entityType === 'cases' && entityId !== 'pending' ? entityId : null);
                const canRollback = (rawStatus === 'disetujui' || (log as any).action === 'create') && targetCaseId && (log as any).action !== 'rollback';

                return (
                  <div key={log.id} className="p-4 bg-[#FAF6EC] hover:bg-[#F3EEDB] transition-colors space-y-2.5">
                    <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
                      <div className="flex items-center flex-wrap gap-2">
                        <span className="font-mono text-gray-600 font-bold bg-white px-2 py-0.5 rounded border border-[#E2D8C0]">
                          {log.id}
                        </span>
                        <span className="text-gray-400">•</span>
                        <span className="text-gray-600 font-mono text-[11px]">
                          {formattedDate}
                        </span>
                        <span className="text-gray-400">•</span>
                        <span className="font-bold text-[#334155] bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          👤 {adminName}
                        </span>
                        <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px] font-mono">
                          {entityType}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            rawStatus === 'disetujui' || (log as any).action === 'create'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : rawStatus === 'ditolak' || (log as any).action === 'rollback'
                              ? 'bg-rose-100 text-rose-800 border border-rose-300'
                              : 'bg-amber-100 text-amber-800 border border-amber-300'
                          }`}
                        >
                          {rawStatus.toUpperCase()}
                        </span>

                        {canRollback && (
                          <button
                            onClick={() => handleRollback(log.id)}
                            className="px-2.5 py-1 bg-[#FEE2E2] hover:bg-[#FCA5A5] text-[#991B1B] text-xs font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer border border-[#FECACA] shadow-xs"
                            title="Tarik kembali data perkara dari database publik"
                          >
                            <RotateCcw className="w-3 h-3" /> Rollback
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="text-xs bg-white p-3 rounded-xl border border-[#E5DCC6] space-y-1">
                      <div className="flex items-center justify-between text-gray-500 text-[11px] font-medium">
                        <span>Aksi: <strong className="text-gray-700">{actionType}</strong></span>
                        {targetCaseId && <span>Target Perkara: <strong className="font-mono text-[#0284C7]">{targetCaseId}</strong></span>}
                      </div>
                      <p className="text-gray-800 font-mono text-xs leading-relaxed">
                        {originalCommand}
                      </p>
                    </div>

                    {log.catatan_admin && (
                      <div className="text-[11px] text-[#854D0E] bg-[#FEF9C3] px-3 py-1.5 rounded-lg border border-[#FDE047] flex items-center gap-1.5">
                        <span className="font-bold">Catatan:</span>
                        <span>{log.catatan_admin}</span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 4: USER REPORTS MODERATION */}
      {activeTab === 'reports' && (
        <AdminReportsManager
          authToken={authToken}
          onRefreshGlobal={() => {
            fetchReports();
            onRefreshData();
          }}
        />
      )}

      {/* TAB: CITIZEN COMMENTS MODERATION */}
      {activeTab === 'comments' && (
        <AdminCommentsManager
          authToken={authToken}
          onRefreshGlobal={onRefreshData}
        />
      )}

      {/* TAB: MONITORING & TRAFFIC LOGS */}
      {activeTab === 'monitoring' && (
        <AdminMonitoringManager
          authToken={authToken}
        />
      )}

    </AdminLayout>
  );
};
