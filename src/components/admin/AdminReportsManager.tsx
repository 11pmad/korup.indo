import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Search, 
  RefreshCw, 
  ExternalLink, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Mail, 
  FileText, 
  AlertCircle,
  Copy,
  Check,
  Scale,
  Sparkles,
  Building2,
  MapPin,
  Send,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { sound } from '../../utils/audio.js';
import { formatRupiah } from '../../utils/formatters.js';

interface AdminReportsManagerProps {
  authToken: string;
  onRefreshGlobal?: () => void;
}

export interface PublicReportItem {
  id: string;
  case_id: string | null;
  case_title?: string;
  report_type: 'koreksi_data' | 'rujukan_putusan_baru' | 'usulan_kasus_baru' | string;
  description: string;
  reference_url: string | null;
  submitter_contact: string | null;
  metadata?: {
    case_title?: string;
    suspect_name?: string;
    institution?: string;
    province_id?: string;
    province_name?: string;
    sector_category?: string;
    loss_amount?: number;
    legal_status?: string;
    incident_year?: string | number;
    chronology?: string;
    [key: string]: any;
  } | null;
  status: 'pending_review' | 'approved' | 'rejected' | 'menunggu_review' | 'disetujui' | 'ditolak';
  created_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
}

export const AdminReportsManager: React.FC<AdminReportsManagerProps> = ({
  authToken,
  onRefreshGlobal
}) => {
  const [reports, setReports] = useState<PublicReportItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [typeFilter, setTypeFilter] = useState<'all' | 'usulan' | 'koreksi'>('all');
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    fetchReports();
  }, [authToken]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, typeFilter, search]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/reports', {
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : {}
      });
      if (res.ok) {
        const data = await res.json();
        setReports(data || []);
      }
    } catch (err) {
      console.error('Error fetching admin reports:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (reportId: string, status: 'approved' | 'rejected') => {
    const actionLabel = status === 'approved' ? 'menyetujui' : 'menolak';
    if (!confirm(`Apakah Anda yakin ingin ${actionLabel} laporan ini? Tindakan akan dicatat pada audit log.`)) {
      return;
    }

    setActionLoadingId(reportId);
    try {
      const res = await fetch(`/api/admin/reports/${reportId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
        },
        body: JSON.stringify({ status })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || `Gagal mengubah status laporan`);
      }

      if (status === 'approved') {
        sound.playCheer();
      } else {
        sound.playPop();
      }

      setNotification({
        type: 'success',
        message: `Laporan ${reportId} berhasil ${status === 'approved' ? 'disetujui' : 'ditolak'}.`
      });

      setTimeout(() => setNotification(null), 4000);

      await fetchReports();
      if (onRefreshGlobal) {
        onRefreshGlobal();
      }
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: err.message
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Convert proposed case directly to official case
  const handleConvertToCase = async (reportId: string) => {
    if (!confirm('Terbitkan usulan kasus ini menjadi berkas perkara resmi di pangkalan data LKI? Berkas akan otomatis tampil di Klasemen & Peta Wilayah.')) {
      return;
    }

    setActionLoadingId(reportId);
    try {
      const res = await fetch(`/api/admin/reports/${reportId}/convert-to-case`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
        }
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal menerbitkan kasus');
      }

      sound.playCheer();
      setNotification({
        type: 'success',
        message: 'Kasus berhasil diterbitkan langsung ke pangkalan data publik LKI!'
      });

      setTimeout(() => setNotification(null), 4000);

      await fetchReports();
      if (onRefreshGlobal) {
        onRefreshGlobal();
      }
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: err.message
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCopyTicket = (ticketId: string) => {
    navigator.clipboard.writeText(ticketId);
    setCopiedId(ticketId);
    sound.playPop();
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Status mapping helper
  const isPending = (status: string) => status === 'pending_review' || status === 'menunggu_review';
  const isApproved = (status: string) => status === 'approved' || status === 'disetujui';
  const isRejected = (status: string) => status === 'rejected' || status === 'ditolak';

  // KPI counts
  const totalCount = reports.length;
  const pendingCount = reports.filter(r => isPending(r.status)).length;
  const approvedCount = reports.filter(r => isApproved(r.status)).length;
  const rejectedCount = reports.filter(r => isRejected(r.status)).length;
  const newCaseCount = reports.filter(r => r.report_type === 'usulan_kasus_baru').length;

  // Filtered reports
  const filteredReports = reports.filter(rep => {
    // Type filter
    if (typeFilter === 'usulan' && rep.report_type !== 'usulan_kasus_baru') return false;
    if (typeFilter === 'koreksi' && rep.report_type === 'usulan_kasus_baru') return false;

    // Status tab filter
    if (statusFilter === 'pending' && !isPending(rep.status)) return false;
    if (statusFilter === 'approved' && !isApproved(rep.status)) return false;
    if (statusFilter === 'rejected' && !isRejected(rep.status)) return false;

    // Search query
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchId = rep.id.toLowerCase().includes(q);
      const matchDesc = rep.description?.toLowerCase().includes(q);
      const matchCase = rep.case_title?.toLowerCase().includes(q);
      const matchContact = rep.submitter_contact?.toLowerCase().includes(q);
      const matchSuspect = rep.metadata?.suspect_name?.toLowerCase().includes(q);
      const matchInst = rep.metadata?.institution?.toLowerCase().includes(q);
      return matchId || matchDesc || matchCase || matchContact || matchSuspect || matchInst;
    }

    return true;
  });

  const effectivePageSize = pageSize >= 9999 ? Math.max(filteredReports.length, 1) : pageSize;
  const totalPages = Math.ceil(filteredReports.length / effectivePageSize) || 1;
  const paginatedReports = filteredReports.slice((page - 1) * effectivePageSize, page * effectivePageSize);

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 shadow-2xs">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <span>Antrean Moderasi Laporan &amp; Usulan Warga</span>
              {pendingCount > 0 && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                  {pendingCount} Perlu Ditinjau
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-500">
              Verifikasi usulan kasus korupsi baru dan koreksi berkas putusan sebelum dipublikasikan ke pangkalan data publik.
            </p>
          </div>
        </div>

        {/* Refresh button */}
        <button
          onClick={() => {
            sound.playPop();
            fetchReports();
          }}
          disabled={loading}
          className="self-start sm:self-auto px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-2 shadow-2xs cursor-pointer transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Muat Ulang</span>
        </button>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div className={`p-4 rounded-2xl border flex items-center gap-3 text-xs font-bold animate-in fade-in slide-in-from-top-2 duration-200 ${
          notification.type === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
            : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* 4 Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Laporan</span>
            <FileText className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-black text-slate-900">{totalCount}</div>
          <span className="text-[10px] text-slate-400 block font-medium">
            {newCaseCount} Usulan Kasus Baru
          </span>
        </div>

        <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-2xl shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-amber-700">
            <span className="text-[11px] font-bold uppercase tracking-wider">Menunggu Review</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-900">{pendingCount}</div>
          <span className="text-[10px] text-amber-700 block font-medium">
            Prioritas telaah kurator
          </span>
        </div>

        <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-2xl shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-emerald-700">
            <span className="text-[11px] font-bold uppercase tracking-wider">Disetujui</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-900">{approvedCount}</div>
          <span className="text-[10px] text-emerald-700 block font-medium">
            Diterapkan ke portal
          </span>
        </div>

        <div className="p-4 bg-rose-50/60 border border-rose-200 rounded-2xl shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-rose-700">
            <span className="text-[11px] font-bold uppercase tracking-wider">Ditolak</span>
            <XCircle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-black text-rose-900">{rejectedCount}</div>
          <span className="text-[10px] text-rose-700 block font-medium">
            Bukti tidak memadai
          </span>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-white border border-slate-200 rounded-2xl shadow-2xs">
        
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => {
              sound.playPop();
              setStatusFilter('all');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
              statusFilter === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Semua ({totalCount})
          </button>
          <button
            onClick={() => {
              sound.playPop();
              setStatusFilter('pending');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
              statusFilter === 'pending'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-amber-700 hover:bg-amber-50'
            }`}
          >
            Menunggu ({pendingCount})
          </button>
          <button
            onClick={() => {
              sound.playPop();
              setStatusFilter('approved');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
              statusFilter === 'approved'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-emerald-700 hover:bg-emerald-50'
            }`}
          >
            Disetujui ({approvedCount})
          </button>
          <button
            onClick={() => {
              sound.playPop();
              setStatusFilter('rejected');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
              statusFilter === 'rejected'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-rose-700 hover:bg-rose-50'
            }`}
          >
            Ditolak ({rejectedCount})
          </button>
        </div>

        {/* Type Filter Chips & Search Box */}
        <div className="flex items-center gap-2">
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value as any)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-hidden"
          >
            <option value="all">Semua Tipe</option>
            <option value="usulan">🌟 Usulan Kasus Baru</option>
            <option value="koreksi">📝 Koreksi Berkas</option>
          </select>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Cari tiket, kasus, tersangka..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:border-indigo-600 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Reports Feed List */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-12 text-center bg-white border border-slate-200 rounded-3xl space-y-3">
            <RefreshCw className="w-8 h-8 mx-auto text-indigo-600 animate-spin" />
            <p className="text-xs text-slate-500 font-medium">Memuat antrean laporan...</p>
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="p-12 text-center bg-white border border-dashed border-slate-300 rounded-3xl space-y-2">
            <FileText className="w-10 h-10 mx-auto text-slate-300" />
            <p className="text-sm font-bold text-slate-700">Tidak ada laporan pada kategori ini</p>
            <p className="text-xs text-slate-400">
              {search ? 'Coba ubah kata kunci pencarian Anda.' : 'Belum ada antrean laporan warga yang sesuai filter.'}
            </p>
          </div>
        ) : (
          paginatedReports.map(rep => {
            const pending = isPending(rep.status);
            const approved = isApproved(rep.status);
            const rejected = isRejected(rep.status);
            const isNewCase = rep.report_type === 'usulan_kasus_baru';

            return (
              <div 
                key={rep.id}
                className={`bg-white border rounded-3xl p-5 sm:p-6 shadow-2xs space-y-4 transition-all ${
                  isNewCase && pending
                    ? 'border-amber-300 bg-[#FFFDF9] ring-2 ring-amber-400/20'
                    : pending 
                    ? 'border-amber-200 hover:border-amber-300 bg-[#FFFDF9]' 
                    : approved 
                    ? 'border-emerald-200 bg-white' 
                    : 'border-slate-200 opacity-80 bg-slate-50/50'
                }`}
              >
                {/* Card Top Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Ticket ID Pill */}
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-800">
                      <span>{rep.id}</span>
                      <button
                        onClick={() => handleCopyTicket(rep.id)}
                        className="text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                        title="Salin Nomor Tiket"
                      >
                        {copiedId === rep.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>

                    {/* Report Type Badge */}
                    {isNewCase ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold border bg-amber-100 text-amber-900 border-amber-300 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-amber-600" />
                        <span>Usulan Kasus Baru</span>
                      </span>
                    ) : rep.report_type === 'rujukan_putusan_baru' ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold border bg-purple-50 text-purple-800 border-purple-200">
                        ⚖️ Putusan Baru / Kasasi MA
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold border bg-blue-50 text-blue-800 border-blue-200">
                        📝 Koreksi Data Perkara
                      </span>
                    )}
                  </div>

                  {/* Status Indicator */}
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1.5 ${
                      pending
                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                        : approved
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-rose-100 text-rose-800 border border-rose-300'
                    }`}>
                      {pending && <Clock className="w-3 h-3 text-amber-600" />}
                      {approved && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                      {rejected && <XCircle className="w-3 h-3 text-rose-600" />}
                      <span>
                        {pending ? 'Menunggu Telaah Kurator' : approved ? 'Disetujui' : 'Ditolak'}
                      </span>
                    </span>

                    <span className="text-[11px] text-slate-400 font-mono">
                      {new Date(rep.created_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>

                {/* Target Case Info */}
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                    {isNewCase ? 'Judul Perkara yang Diusulkan:' : 'Berkas Perkara Terkait:'}
                  </span>
                  <div className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                    <Scale className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span>{rep.metadata?.case_title || rep.case_title || (rep.case_id ? `Perkara ID: ${rep.case_id}` : 'Usulan Kasus Belum Terindeks')}</span>
                  </div>
                </div>

                {/* Structured Metadata Box for New Case Proposals */}
                {rep.metadata && (
                  <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-2xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                    {rep.metadata.suspect_name && (
                      <div>
                        <span className="text-[10px] text-slate-500 font-bold block uppercase">Pihak Terduga:</span>
                        <span className="font-bold text-slate-900">{rep.metadata.suspect_name}</span>
                      </div>
                    )}
                    {(rep.metadata.institution || rep.metadata.sector_category) && (
                      <div>
                        <span className="text-[10px] text-slate-500 font-bold block uppercase">Instansi / Sektor:</span>
                        <span className="font-bold text-slate-900">
                          {rep.metadata.institution || '-'}
                          {rep.metadata.sector_category && ` (${rep.metadata.sector_category})`}
                        </span>
                      </div>
                    )}
                    {rep.metadata.province_name && (
                      <div>
                        <span className="text-[10px] text-slate-500 font-bold block uppercase">Wilayah / Provinsi:</span>
                        <span className="font-bold text-slate-900">{rep.metadata.province_name}</span>
                      </div>
                    )}
                    {rep.metadata.loss_amount > 0 && (
                      <div>
                        <span className="text-[10px] text-slate-500 font-bold block uppercase">Dugaan Kerugian:</span>
                        <span className="font-bold text-amber-800">{formatRupiah(rep.metadata.loss_amount)}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Description Box */}
                <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-1 shadow-2xs">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    {isNewCase ? 'Kronologi & Uraian Fakta Perkara:' : 'Uraian Masukan dari Warga:'}
                  </span>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                    {rep.description}
                  </p>
                </div>

                {/* Reference URL & Submitter Details */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 text-xs text-slate-600">
                  {/* Reference URL Link */}
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="font-bold text-slate-500 shrink-0">Bukti Rujukan:</span>
                    {rep.reference_url ? (
                      <a
                        href={rep.reference_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-semibold truncate hover:underline"
                        title={rep.reference_url}
                      >
                        <span className="truncate max-w-xs">{rep.reference_url}</span>
                        <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                      </a>
                    ) : (
                      <span className="text-slate-400 italic">Tidak melampirkan tautan URL</span>
                    )}
                  </div>

                  {/* Submitter Contact */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-bold text-slate-500">Kontak:</span>
                    {rep.submitter_contact ? (
                      <a 
                        href={`mailto:${rep.submitter_contact}`}
                        className="text-slate-700 hover:text-indigo-600 font-semibold hover:underline"
                      >
                        {rep.submitter_contact}
                      </a>
                    ) : (
                      <span className="text-slate-400 italic">Anonim</span>
                    )}
                  </div>
                </div>

                {/* Moderation Actions Footer */}
                <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {/* Status Notes */}
                  <div className="text-[11px] text-slate-400">
                    {rep.reviewed_at && (
                      <span>
                        Ditinjau pada {new Date(rep.reviewed_at).toLocaleDateString('id-ID')}
                        {rep.reviewed_by && ` oleh ${rep.reviewed_by}`}
                      </span>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
                    {pending ? (
                      <>
                        <button
                          onClick={() => handleAction(rep.id, 'rejected')}
                          disabled={actionLoadingId === rep.id}
                          className="px-3.5 py-1.5 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                        >
                          <XCircle className="w-3.5 h-3.5 text-rose-500" />
                          <span>Tolak Laporan</span>
                        </button>

                        {isNewCase && (
                          <button
                            onClick={() => handleConvertToCase(rep.id)}
                            disabled={actionLoadingId === rep.id}
                            className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                            title="Terbitkan usulan kasus ini menjadi berkas perkara resmi"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>{actionLoadingId === rep.id ? 'Menerbitkan...' : '⚡ Terbitkan Kasus ke LKI'}</span>
                          </button>
                        )}

                        <button
                          onClick={() => handleAction(rep.id, 'approved')}
                          disabled={actionLoadingId === rep.id}
                          className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{actionLoadingId === rep.id ? 'Memproses...' : 'Setujui Saja'}</span>
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleAction(rep.id, approved ? 'rejected' : 'approved')}
                        disabled={actionLoadingId === rep.id}
                        className="px-3 py-1 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer"
                      >
                        Ubah Status ke {approved ? 'Ditolak' : 'Disetujui'}
                      </button>
                    )}
                  </div>
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* Pagination Footer */}
      {filteredReports.length > 0 && (
        <div className="bg-white rounded-2xl p-4 border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600 shadow-2xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-slate-500">Tampilkan:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                sound.playPop();
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-700 shadow-2xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value={10}>10 data (Default)</option>
              <option value={25}>25 data</option>
              <option value={50}>50 data</option>
              <option value={100}>100 data</option>
              <option value={9999}>Semua ({filteredReports.length})</option>
            </select>
            <span>
              Menampilkan <strong>{(page - 1) * effectivePageSize + 1}</strong> -{' '}
              <strong>{Math.min(filteredReports.length, page * effectivePageSize)}</strong> dari <strong>{filteredReports.length}</strong> laporan
            </span>
          </div>

          <div className="flex items-center gap-1.5 ml-auto">
            <button
              onClick={() => {
                sound.playPop();
                setPage(p => Math.max(1, p - 1));
              }}
              disabled={page <= 1}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 disabled:opacity-40 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Halaman Sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 font-bold font-mono text-slate-700">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => {
                sound.playPop();
                setPage(p => Math.min(totalPages, p + 1));
              }}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 disabled:opacity-40 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Halaman Selanjutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
