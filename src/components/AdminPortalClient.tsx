'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  FolderKanban,
  Bot,
  Flag,
  MessageSquareOff,
  Settings,
  Users,
  History,
  LogOut,
  CheckSquare,
  Plus,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import { CANONICAL_PROVINCES } from '@/lib/provinces';
import { formatDateId, formatRupiah, LEGAL_STATUS_META, SECTOR_LABELS } from '@/lib/formatters';
import type { AdminSessionPayload } from '@/server/auth';

type AdminTab =
  | 'overview'
  | 'cases'
  | 'ai'
  | 'reports'
  | 'review_queue'
  | 'comments'
  | 'settings'
  | 'users'
  | 'audit';

export function AdminPortalClient({ admin }: { admin: AdminSessionPayload }) {
  const router = useRouter();
  const [tab, setTab] = useState<AdminTab>('overview');
  const [cases, setCases] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [reviewItems, setReviewItems] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [kpis, setKpis] = useState<any>({});
  const [staffUsers, setStaffUsers] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({ announcement: {}, donation: {} });
  const [notice, setNotice] = useState('');

  // AI Curator state
  const [aiInput, setAiInput] = useState('');
  const [aiHistory, setAiHistory] = useState<Array<{ role: 'admin' | 'ai'; text: string }>>([]);
  const [aiDraft, setAiDraft] = useState<any>(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Manual case creation form
  const [newCase, setNewCase] = useState({
    caseTitle: '',
    caseNumber: '',
    eraId: 'era-prabowo',
    primaryProvinceId: 'dki-jakarta',
    sectorCategory: 'pengadaan_barang_jasa',
    sectorLabel: 'Pengadaan Barang/Jasa',
    primaryMode: 'Mark-up & Pengadaan',
    currentLegalStatus: 'tersangka',
    summary: '',
    personName: '',
    personPosition: '',
    financialType: 'alleged_loss_amount',
    amount: 0,
    sourceTitle: '',
    sourceUrl: '',
    sourceInstitution: '',
    sourceExcerpt: '',
    verdictDecisionNumber: '',
    prisonMonths: 0,
  });

  // New staff form
  const [newStaff, setNewStaff] = useState({
    username: '',
    fullName: '',
    password: '',
    role: 'editor',
  });

  const loadData = useCallback(async () => {
    const [casesRes, auditRes, repRes, rqRes, setRes] = await Promise.all([
      fetch('/api/v1/admin/cases?limit=50'),
      fetch('/api/v1/admin/audit-logs').catch(() => null),
      fetch('/api/v1/admin/reports').catch(() => null),
      fetch('/api/v1/admin/review-queue').catch(() => null),
      fetch('/api/v1/admin/settings').catch(() => null),
    ]);

    const casesJson = await casesRes.json().catch(() => null);
    if (casesJson?.data) setCases(casesJson.data);

    if (auditRes?.ok) {
      const aj = await auditRes.json();
      setAuditLogs(aj.data?.logs ?? []);
      setKpis(aj.data?.kpis ?? {});
      setComments(aj.data?.comments ?? []);
    }
    if (repRes?.ok) {
      const rj = await repRes.json();
      setReports(rj.data ?? []);
    }
    if (rqRes?.ok) {
      const qj = await rqRes.json();
      setReviewItems(qj.data ?? []);
    }
    if (setRes?.ok) {
      const sj = await setRes.json();
      setSettings(sj.data ?? { announcement: {}, donation: {} });
    }
    if (admin.role === 'super_admin') {
      const uRes = await fetch('/api/v1/admin/users').catch(() => null);
      if (uRes?.ok) {
        const uj = await uRes.json();
        setStaffUsers(uj.data ?? []);
      }
    }
  }, [admin.role]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleLogout() {
    await fetch('/api/v1/admin/auth/logout', { method: 'POST' });
    router.push('/admin/login');
    router.refresh();
  }

  async function handleCreateCase(e: React.FormEvent) {
    e.preventDefault();
    setNotice('');
    const res = await fetch('/api/v1/admin/cases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...newCase, amount: Number(newCase.amount), prisonMonths: Number(newCase.prisonMonths) }),
    });
    const json = await res.json();
    if (!res.ok) {
      setNotice(`Error: ${json?.error?.message || 'Gagal menambah perkara.'}`);
      return;
    }
    setNotice(`Perkara berhasil dipublikasikan (${json.data.slug}).`);
    setNewCase((prev) => ({ ...prev, caseTitle: '', summary: '', personName: '', sourceUrl: '', sourceExcerpt: '' }));
    loadData();
  }

  async function handleDeleteCase(id: string) {
    if (!confirm('Hapus perkara ini secara permanen? Tindakan ini dicatat di Audit Log.')) return;
    const res = await fetch(`/api/v1/admin/cases/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setNotice('Perkara dihapus.');
      loadData();
    }
  }

  async function handleAiSend(e: React.FormEvent) {
    e.preventDefault();
    if (!aiInput.trim()) return;
    setAiLoading(true);
    setNotice('');
    const msg = aiInput.trim();
    setAiInput('');
    const nextHist = [...aiHistory, { role: 'admin' as const, text: msg }];
    setAiHistory(nextHist);
    try {
      const res = await fetch('/api/v1/admin/ai-curator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, history: aiHistory }),
      });
      const json = await res.json();
      if (json?.data) {
        setAiHistory([...nextHist, { role: 'ai', text: json.data.message }]);
        if (json.data.isDraftReady && json.data.draft) {
          setAiDraft(json.data.draft);
        }
      }
    } finally {
      setAiLoading(false);
    }
  }

  async function handlePublishAiDraft() {
    if (!aiDraft) return;
    const res = await fetch('/api/v1/admin/cases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        caseTitle: aiDraft.caseTitle,
        caseNumber: aiDraft.caseNumber || '',
        eraId: aiDraft.eraId || 'era-prabowo',
        primaryProvinceId: 'nasional',
        sectorCategory: aiDraft.sectorCategory || 'pengadaan_barang_jasa',
        sectorLabel: aiDraft.sectorCategory || 'Pengadaan Barang/Jasa',
        primaryMode: 'Kurasi AI Terverifikasi',
        currentLegalStatus: aiDraft.currentLegalStatus || 'tersangka',
        summary: aiDraft.summary,
        personName: aiDraft.personName,
        personPosition: aiDraft.personPosition,
        financialType: aiDraft.financialType || 'alleged_loss_amount',
        amount: Number(aiDraft.amount || 0),
        sourceTitle: aiDraft.sourceTitle,
        sourceUrl: aiDraft.sourceUrl,
        sourceInstitution: aiDraft.sourceInstitution,
        sourceExcerpt: aiDraft.sourceExcerpt,
        verdictDecisionNumber: aiDraft.verdictDecisionNumber || '',
        prisonMonths: Number(aiDraft.prisonMonths || 0),
      }),
    });
    const json = await res.json();
    if (!res.ok) {
      setNotice(`Gagal menerbitkan draf AI: ${json?.error?.message}`);
      return;
    }
    setAiDraft(null);
    setNotice(`Draf AI diterbitkan ke database (${json.data.slug}).`);
    loadData();
  }

  async function handleModerateReport(id: string, status: 'approved' | 'rejected') {
    const moderatorNote = prompt(`Catatan moderator untuk status '${status}':`) || (status === 'approved' ? 'Terverifikasi sumber primer' : 'Bukti sumber belum mencukupi');
    const res = await fetch(`/api/v1/admin/reports/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, moderatorNote }),
    });
    if (res.ok) {
      setNotice(`Laporan ditandai ${status}.`);
      loadData();
    }
  }

  async function handleResolveReview(id: string) {
    const res = await fetch('/api/v1/admin/review-queue', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: 'resolved' }),
    });
    if (res.ok) {
      setNotice('Antrean review diselesaikan.');
      loadData();
    }
  }

  async function handleToggleComment(id: string, currentHidden: boolean) {
    const res = await fetch(`/api/v1/admin/comments/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isHidden: !currentHidden, reason: !currentHidden ? 'Moderasi kurator' : '' }),
    });
    if (res.ok) loadData();
  }

  async function handleSaveSettings(key: 'announcement' | 'donation') {
    const res = await fetch('/api/v1/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value: settings[key] }),
    });
    if (res.ok) setNotice(`Pengaturan '${key}' tersimpan ke database.`);
  }

  async function handleCreateStaff(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch('/api/v1/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newStaff),
    });
    const json = await res.json();
    if (!res.ok) {
      setNotice(`Error: ${json?.error?.message}`);
      return;
    }
    setNotice(`Akun staf '${newStaff.username}' ditambahkan.`);
    setNewStaff({ username: '', fullName: '', password: '', role: 'editor' });
    loadData();
  }

  const navItems: Array<{ id: AdminTab; label: string; icon: any }> = [
    { id: 'overview', label: 'Ringkasan', icon: LayoutDashboard },
    { id: 'cases', label: 'Kelola Perkara', icon: FolderKanban },
    { id: 'ai', label: 'AI Curator', icon: Bot },
    { id: 'reports', label: 'Laporan & Hak Jawab', icon: Flag },
    { id: 'review_queue', label: 'Review Queue', icon: CheckSquare },
    { id: 'comments', label: 'Moderasi Komentar', icon: MessageSquareOff },
    { id: 'settings', label: 'Pengaturan Situs', icon: Settings },
    ...(admin.role === 'super_admin' ? [{ id: 'users' as const, label: 'Staf Admin', icon: Users }] : []),
    { id: 'audit', label: 'Audit Logs', icon: History },
  ];

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col lg:flex-row">
      {/* Sidebar */}
      <aside className="w-full lg:w-64 border-b lg:border-b-0 lg:border-r border-slate-800 bg-[#111827] p-4 flex flex-col justify-between gap-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-white">LKI Kurasi v2.0</p>
              <p className="text-[11px] text-slate-400">
                @{admin.username} • <span className="text-amber-400 uppercase">{admin.role}</span>
              </p>
            </div>
            <Link href="/" className="text-xs text-slate-400 hover:text-white">
              Publik ↗
            </Link>
          </div>

          <nav className="flex lg:flex-col gap-1 overflow-x-auto pb-1 lg:pb-0">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTab(item.id)}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold whitespace-nowrap transition ${
                    tab === item.id
                      ? 'bg-red-600 text-white'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800"
        >
          <LogOut className="w-4 h-4" /> Keluar Portal
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-5 sm:p-8 space-y-6 overflow-y-auto">
        {notice && (
          <div className="rounded-lg border border-amber-500/50 bg-amber-950/50 px-4 py-2.5 text-xs font-semibold text-amber-200">
            {notice}
          </div>
        )}

        {tab === 'overview' && (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold text-white">Dashboard Kurasi & Kepatuhan</h1>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="rounded-xl border border-slate-800 bg-[#111827] p-4">
                <p className="text-xs text-slate-400">Total Perkara</p>
                <p className="mt-1 font-mono text-2xl font-bold text-white">{kpis.total_cases ?? cases.length}</p>
              </div>
              <div className="rounded-xl border border-red-800/60 bg-red-950/30 p-4">
                <p className="text-xs text-red-300">Hak Jawab Pending (SLA 2×24j)</p>
                <p className="mt-1 font-mono text-2xl font-bold text-red-400">{kpis.pending_hak_jawab ?? 0}</p>
              </div>
              <div className="rounded-xl border border-amber-800/60 bg-amber-950/30 p-4">
                <p className="text-xs text-amber-300">Laporan Warga Pending</p>
                <p className="mt-1 font-mono text-2xl font-bold text-amber-400">{kpis.pending_reports ?? 0}</p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-[#111827] p-4">
                <p className="text-xs text-slate-400">Antrean Review Disparitas</p>
                <p className="mt-1 font-mono text-2xl font-bold text-slate-200">{kpis.pending_review_queue ?? 0}</p>
              </div>
            </div>
          </div>
        )}

        {tab === 'cases' && (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold text-white">Kelola Berkas Perkara</h1>
            <form onSubmit={handleCreateCase} className="rounded-xl border border-slate-800 bg-[#111827] p-5 space-y-4">
              <h2 className="text-sm font-bold text-amber-400 flex items-center gap-1.5">
                <Plus className="w-4 h-4" /> Tambah Perkara Terverifikasi Sumber Primer
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <input
                  required
                  placeholder="Judul Perkara (min 8 karakter)"
                  value={newCase.caseTitle}
                  onChange={(e) => setNewCase({ ...newCase, caseTitle: e.target.value })}
                  className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white"
                />
                <input
                  placeholder="Nomor Perkara / Putusan (opsional kecuali Inkrah)"
                  value={newCase.verdictDecisionNumber}
                  onChange={(e) => setNewCase({ ...newCase, verdictDecisionNumber: e.target.value, caseNumber: e.target.value })}
                  className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white"
                />
                <input
                  required
                  placeholder="Nama Subjek Hukum / Pejabat"
                  value={newCase.personName}
                  onChange={(e) => setNewCase({ ...newCase, personName: e.target.value })}
                  className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white"
                />
                <input
                  required
                  placeholder="Jabatan Saat Kejadian"
                  value={newCase.personPosition}
                  onChange={(e) => setNewCase({ ...newCase, personPosition: e.target.value })}
                  className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white"
                />
                <select
                  value={newCase.primaryProvinceId}
                  onChange={(e) => setNewCase({ ...newCase, primaryProvinceId: e.target.value })}
                  className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white"
                >
                  {CANONICAL_PROVINCES.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                <select
                  value={newCase.currentLegalStatus}
                  onChange={(e) => setNewCase({ ...newCase, currentLegalStatus: e.target.value })}
                  className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white"
                >
                  {Object.entries(LEGAL_STATUS_META).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </select>
                <select
                  value={newCase.sectorCategory}
                  onChange={(e) => setNewCase({ ...newCase, sectorCategory: e.target.value, sectorLabel: SECTOR_LABELS[e.target.value as keyof typeof SECTOR_LABELS] })}
                  className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white"
                >
                  {Object.entries(SECTOR_LABELS).map(([k, label]) => (
                    <option key={k} value={k}>{label}</option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <select
                    value={newCase.financialType}
                    onChange={(e) => setNewCase({ ...newCase, financialType: e.target.value })}
                    className="w-1/2 rounded-lg border border-slate-700 bg-slate-900 px-2 py-2 text-white"
                  >
                    <option value="court_recognized_loss_amount">Kerugian Vonis</option>
                    <option value="audit_loss_amount">Audit BPK/BPKP</option>
                    <option value="alleged_loss_amount">Dugaan Penyidik</option>
                    <option value="bribe_amount">Nilai Suap</option>
                  </select>
                  <input
                    type="number"
                    min={0}
                    placeholder="Nominal (IDR)"
                    value={newCase.amount}
                    onChange={(e) => setNewCase({ ...newCase, amount: Number(e.target.value) })}
                    className="w-1/2 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white"
                  />
                </div>
                <input
                  required
                  placeholder="Judul Sumber Primer"
                  value={newCase.sourceTitle}
                  onChange={(e) => setNewCase({ ...newCase, sourceTitle: e.target.value })}
                  className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white"
                />
                <input
                  required
                  type="url"
                  placeholder="URL Sumber Resmi (https://...)"
                  value={newCase.sourceUrl}
                  onChange={(e) => setNewCase({ ...newCase, sourceUrl: e.target.value })}
                  className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white"
                />
                <input
                  required
                  placeholder="Lembaga Sumber (MA RI / KPK / Kejagung)"
                  value={newCase.sourceInstitution}
                  onChange={(e) => setNewCase({ ...newCase, sourceInstitution: e.target.value })}
                  className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white"
                />
                <input
                  required
                  placeholder="Kutipan Fakta dari Sumber (min 10 karakter)"
                  value={newCase.sourceExcerpt}
                  onChange={(e) => setNewCase({ ...newCase, sourceExcerpt: e.target.value })}
                  className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white"
                />
              </div>
              <textarea
                required
                minLength={25}
                rows={3}
                placeholder="Ringkasan kronologi objektif perkara..."
                value={newCase.summary}
                onChange={(e) => setNewCase({ ...newCase, summary: e.target.value })}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 p-3 text-xs text-white"
              />
              <button type="submit" className="rounded-lg bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700">
                Simpan & Publikasikan Perkara
              </button>
            </form>

            <div className="rounded-xl border border-slate-800 bg-[#111827] overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 text-slate-400 uppercase">
                  <tr>
                    <th className="px-4 py-3">Judul Perkara</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Nominal</th>
                    <th className="px-4 py-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {cases.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-800/40">
                      <td className="px-4 py-3">
                        <Link href={`/kasus/${c.slug}`} target="_blank" className="font-semibold text-white hover:underline inline-flex items-center gap-1">
                          {c.case_title} <ExternalLink className="w-3 h-3" />
                        </Link>
                        <p className="text-slate-400">{c.province_name} • {c.era_name}</p>
                      </td>
                      <td className="px-4 py-3 font-mono">{c.current_legal_status}</td>
                      <td className="px-4 py-3 text-right font-mono text-amber-400">
                        {formatRupiah(c.display_loss_amount, { compact: true })}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {(admin.role === 'super_admin' || admin.role === 'admin') && (
                          <button
                            type="button"
                            onClick={() => handleDeleteCase(c.id)}
                            aria-label={`Hapus ${c.case_title}`}
                            className="text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="w-4 h-4 inline" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'ai' && (
          <div className="space-y-4">
            <h1 className="text-2xl font-bold text-white">Asisten AI Curator (Human-in-the-Loop)</h1>
            <p className="text-xs text-slate-400">
              Tempel teks rilis resmi/putusan beserta tautan sumber. AI menolak menyusun draf tanpa URL sumber primer valid.
            </p>
            <div className="rounded-xl border border-slate-800 bg-[#111827] p-4 space-y-3">
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {aiHistory.map((h, i) => (
                  <div
                    key={i}
                    className={`rounded-lg p-3 text-xs whitespace-pre-line ${
                      h.role === 'admin' ? 'bg-slate-800 text-white ml-8' : 'bg-slate-900 border border-slate-700 text-slate-200 mr-8'
                    }`}
                  >
                    <strong className="uppercase text-[10px] text-amber-400 block mb-1">{h.role}</strong>
                    {h.text}
                  </div>
                ))}
              </div>
              <form onSubmit={handleAiSend} className="flex gap-2">
                <input
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  placeholder="Contoh: Tersangka Budi dalam kasus suap Rp 5 miliar di Jawa Barat, sumber https://www.kpk.go.id/..."
                  className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white"
                />
                <button
                  type="submit"
                  disabled={aiLoading}
                  className="rounded-lg bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {aiLoading ? 'Menganalisis...' : 'Kirim ke AI'}
                </button>
              </form>

              {aiDraft && (
                <div className="rounded-xl border border-emerald-600/50 bg-emerald-950/30 p-4 space-y-3">
                  <p className="text-xs font-bold text-emerald-300">Pratinjau Draf Terstruktur:</p>
                  <pre className="text-[11px] text-slate-200 overflow-x-auto">{JSON.stringify(aiDraft, null, 2)}</pre>
                  <button
                    type="button"
                    onClick={handlePublishAiDraft}
                    className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700"
                  >
                    Setujui & Terbitkan ke Database
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {tab === 'reports' && (
          <div className="space-y-4">
            <h1 className="text-2xl font-bold text-white">Moderasi Laporan Publik & Hak Jawab</h1>
            <div className="space-y-3">
              {reports.length === 0 ? (
                <p className="text-xs text-slate-400">Belum ada laporan warga masuk.</p>
              ) : (
                reports.map((r) => (
                  <div key={r.id} className="rounded-xl border border-slate-800 bg-[#111827] p-4 space-y-2 text-xs">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-mono font-bold text-amber-400">
                        {r.tracking_code} • {r.report_type}
                      </span>
                      <span className="rounded bg-slate-800 px-2 py-0.5 font-semibold">{r.status}</span>
                    </div>
                    <p className="text-slate-200">{r.description}</p>
                    <a href={r.reference_url} target="_blank" rel="noopener noreferrer" className="text-amber-300 underline block">
                      {r.reference_url}
                    </a>
                    {r.status === 'pending_review' && (
                      <div className="flex gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => handleModerateReport(r.id, 'approved')}
                          className="rounded bg-emerald-600 px-3 py-1 font-bold text-white"
                        >
                          Setujui
                        </button>
                        <button
                          type="button"
                          onClick={() => handleModerateReport(r.id, 'rejected')}
                          className="rounded bg-red-600 px-3 py-1 font-bold text-white"
                        >
                          Tolak
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {tab === 'review_queue' && (
          <div className="space-y-4">
            <h1 className="text-2xl font-bold text-white">Review Queue Disparitas Sumber</h1>
            <div className="space-y-3">
              {reviewItems.map((rq) => (
                <div key={rq.id} className="rounded-xl border border-slate-800 bg-[#111827] p-4 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <strong className="text-amber-400">{rq.entity_id}</strong>
                    <span className="rounded bg-slate-800 px-2 py-0.5">{rq.status}</span>
                  </div>
                  <p className="text-slate-200">{rq.reason}</p>
                  {rq.disparity_details && <p className="text-slate-400">{rq.disparity_details}</p>}
                  {rq.status !== 'resolved' && (
                    <button
                      type="button"
                      onClick={() => handleResolveReview(rq.id)}
                      className="rounded bg-emerald-600 px-3 py-1 font-bold text-white"
                    >
                      Tandai Selesai
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'comments' && (
          <div className="space-y-4">
            <h1 className="text-2xl font-bold text-white">Moderasi Komentar Warga</h1>
            <div className="space-y-2">
              {comments.map((c) => (
                <div key={c.id} className="rounded-xl border border-slate-800 bg-[#111827] p-4 flex justify-between gap-4 text-xs">
                  <div>
                    <p className="text-slate-400">@{c.username} • {c.case_title}</p>
                    <p className="text-slate-100 mt-1">{c.content}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleComment(c.id, c.is_hidden)}
                    className={`shrink-0 h-fit rounded px-3 py-1 font-bold ${
                      c.is_hidden ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
                    }`}
                  >
                    {c.is_hidden ? 'Tampilkan' : 'Sembunyikan'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'settings' && (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold text-white">Pengaturan Situs (PostgreSQL)</h1>
            <div className="rounded-xl border border-slate-800 bg-[#111827] p-5 space-y-3 text-xs">
              <h2 className="text-sm font-bold text-amber-400">Banner Pengumuman Hukum</h2>
              <input
                value={settings.announcement?.title || ''}
                onChange={(e) => setSettings({ ...settings, announcement: { ...settings.announcement, title: e.target.value } })}
                placeholder="Judul Banner"
                className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-white"
              />
              <textarea
                rows={3}
                value={settings.announcement?.main_text || ''}
                onChange={(e) => setSettings({ ...settings, announcement: { ...settings.announcement, main_text: e.target.value } })}
                placeholder="Teks Utama"
                className="w-full rounded border border-slate-700 bg-slate-900 p-3 text-white"
              />
              <button
                type="button"
                onClick={() => handleSaveSettings('announcement')}
                className="rounded bg-red-600 px-4 py-2 font-bold text-white"
              >
                Simpan Pengumuman
              </button>
            </div>
          </div>
        )}

        {tab === 'users' && admin.role === 'super_admin' && (
          <div className="space-y-4">
            <h1 className="text-2xl font-bold text-white">Manajemen Staf Admin</h1>
            <form onSubmit={handleCreateStaff} className="rounded-xl border border-slate-800 bg-[#111827] p-4 grid grid-cols-1 sm:grid-cols-5 gap-2 text-xs">
              <input
                required
                placeholder="Username"
                value={newStaff.username}
                onChange={(e) => setNewStaff({ ...newStaff, username: e.target.value })}
                className="rounded border border-slate-700 bg-slate-900 px-3 py-2 text-white"
              />
              <input
                required
                placeholder="Nama Lengkap"
                value={newStaff.fullName}
                onChange={(e) => setNewStaff({ ...newStaff, fullName: e.target.value })}
                className="rounded border border-slate-700 bg-slate-900 px-3 py-2 text-white"
              />
              <input
                required
                type="password"
                minLength={12}
                placeholder="Password (min 12)"
                value={newStaff.password}
                onChange={(e) => setNewStaff({ ...newStaff, password: e.target.value })}
                className="rounded border border-slate-700 bg-slate-900 px-3 py-2 text-white"
              />
              <select
                value={newStaff.role}
                onChange={(e) => setNewStaff({ ...newStaff, role: e.target.value })}
                className="rounded border border-slate-700 bg-slate-900 px-3 py-2 text-white"
              >
                <option value="editor">editor</option>
                <option value="reviewer">reviewer</option>
                <option value="moderator">moderator</option>
                <option value="auditor">auditor</option>
                <option value="admin">admin</option>
              </select>
              <button type="submit" className="rounded bg-red-600 font-bold text-white px-3 py-2">
                Tambah Staf
              </button>
            </form>
            <div className="rounded-xl border border-slate-800 bg-[#111827] divide-y divide-slate-800 text-xs">
              {staffUsers.map((u) => (
                <div key={u.id} className="p-3 flex justify-between">
                  <span>
                    <strong className="text-white">@{u.username}</strong> ({u.full_name})
                  </span>
                  <span className="font-mono text-amber-400">{u.role}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'audit' && (
          <div className="space-y-4">
            <h1 className="text-2xl font-bold text-white">Audit Logs Perubahan Data</h1>
            <div className="rounded-xl border border-slate-800 bg-[#111827] divide-y divide-slate-800 text-xs">
              {auditLogs.map((log) => (
                <div key={log.id} className="p-3 flex flex-wrap justify-between gap-2">
                  <div>
                    <span className="font-mono font-bold text-amber-400">{log.action}</span>{' '}
                    <span className="text-slate-300">
                      {log.entity_type} ({log.entity_id}) oleh @{log.admin_username || 'system'}
                    </span>
                  </div>
                  <span className="text-slate-500">{formatDateId(log.created_at)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
