import React, { useState, useEffect } from 'react';
import { 
  Briefcase, 
  Search, 
  Trash2, 
  ExternalLink, 
  Plus, 
  RefreshCw, 
  Filter, 
  ChevronLeft, 
  ChevronRight,
  Scale,
  MapPin,
  Calendar,
  Pencil,
  X,
  Check,
  AlertCircle,
  FileText,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { formatRupiah, getStatusBadgeStyle } from '../../utils/formatters.js';
import { getOfficialPhoto, handleImageError } from '../../utils/photo.js';
import { sound } from '../../utils/audio.js';

interface CasesManagerProps {
  authToken: string;
  onOpenCreate: () => void;
  onRefreshGlobal: () => void;
}

export const AdminCasesManager: React.FC<CasesManagerProps> = ({
  authToken,
  onOpenCreate,
  onRefreshGlobal
}) => {
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Sorting state
  const [sortField, setSortField] = useState<'title' | 'official_name' | 'loss_amount' | 'legal_status' | 'created_at'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Edit Case Modal State
  const [editingCase, setEditingCase] = useState<any | null>(null);
  const [editForm, setEditForm] = useState<{
    title: string;
    sector_category: string;
    legal_status: string;
    loss_amount: number | string;
    fine_amount: number | string;
    restitution_amount: number | string;
    prison_sentence_months: number | string;
    court_decision_number: string;
    chronology: string;
    charges_articles: string;
    source_url: string;
  }>({
    title: '',
    sector_category: 'pengadaan_barang_jasa',
    legal_status: 'tersangka',
    loss_amount: 0,
    fine_amount: 0,
    restitution_amount: 0,
    prison_sentence_months: 0,
    court_decision_number: '',
    chronology: '',
    charges_articles: '',
    source_url: ''
  });
  const [savingEdit, setSavingEdit] = useState<boolean>(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [loadingCaseDetail, setLoadingCaseDetail] = useState<boolean>(false);

  useEffect(() => {
    fetchCases();
  }, [page, pageSize, authToken, sortField, sortOrder]);

  const fetchCases = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/cases?page=${page}&limit=${pageSize}&sort_by=${sortField}&order=${sortOrder}`, {
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : {}
      });
      const data = await res.json();
      setCases(data.data || []);
      if (data.pagination) {
        setTotalPages(data.pagination.total_pages || 1);
        setTotalItems(data.pagination.total_items || 0);
      }
    } catch (err) {
      console.error('Error fetching admin cases:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: 'title' | 'official_name' | 'loss_amount' | 'legal_status' | 'created_at') => {
    sound.playPop();
    if (sortField === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder(field === 'loss_amount' || field === 'created_at' ? 'desc' : 'asc');
    }
  };

  const handleDeleteCase = async (id: string, title: string) => {
    if (!confirm(`Apakah Anda yakin ingin MENGHAPUS berkas perkara "${title}"? Tindakan ini akan dicatat ke audit log.`)) {
      return;
    }

    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/cases/${id}`, {
        method: 'DELETE',
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : {}
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Gagal menghapus kasus');
      }

      alert('Kasus berhasil dihapus dari database.');
      fetchCases();
      onRefreshGlobal();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  const handleOpenEdit = async (c: any) => {
    sound.playPop();
    setEditingCase(c);
    setEditError(null);

    setEditForm({
      title: c.title || '',
      sector_category: c.sector_category || 'pengadaan_barang_jasa',
      legal_status: c.legal_status || 'tersangka',
      loss_amount: c.loss_amount ?? 0,
      fine_amount: c.fine_amount ?? 0,
      restitution_amount: c.restitution_amount ?? 0,
      prison_sentence_months: c.prison_sentence_months ?? 0,
      court_decision_number: c.court_decision_number || '',
      chronology: c.chronology || '',
      charges_articles: c.charges_articles || '',
      source_url: c.source_url || ''
    });

    if (!c.chronology) {
      try {
        setLoadingCaseDetail(true);
        const res = await fetch(`/api/cases/${c.id}`);
        if (res.ok) {
          const detail = await res.json();
          setEditForm(prev => ({
            ...prev,
            title: detail.title || prev.title,
            sector_category: detail.sector_category || prev.sector_category,
            legal_status: detail.legal_status || prev.legal_status,
            loss_amount: detail.loss_amount ?? prev.loss_amount,
            fine_amount: detail.fine_amount ?? prev.fine_amount,
            restitution_amount: detail.restitution_amount ?? prev.restitution_amount,
            prison_sentence_months: detail.prison_sentence_months ?? prev.prison_sentence_months,
            court_decision_number: detail.court_decision_number || prev.court_decision_number,
            chronology: detail.chronology || detail.ringkasan_kasus || prev.chronology,
            charges_articles: detail.charges_articles || prev.charges_articles,
            source_url: detail.source_url || (detail.sources && detail.sources[0]?.url) || prev.source_url
          }));
        }
      } catch (err) {
        console.warn('Could not fetch full case detail:', err);
      } finally {
        setLoadingCaseDetail(false);
      }
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCase) return;

    setSavingEdit(true);
    setEditError(null);

    try {
      const payload: any = {
        title: editForm.title.trim(),
        sector_category: editForm.sector_category,
        legal_status: editForm.legal_status,
        loss_amount: Number(editForm.loss_amount) || 0,
        fine_amount: Number(editForm.fine_amount) || 0,
        restitution_amount: Number(editForm.restitution_amount) || 0,
        prison_sentence_months: Number(editForm.prison_sentence_months) || 0,
        court_decision_number: editForm.court_decision_number.trim() || undefined,
        chronology: editForm.chronology.trim(),
        charges_articles: editForm.charges_articles.trim() || undefined,
        source_url: editForm.source_url.trim() || undefined
      };

      const res = await fetch(`/api/admin/cases/${editingCase.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal menyimpan perubahan berkas perkara');
      }

      sound.playSuccess();
      setEditingCase(null);
      fetchCases();
      onRefreshGlobal();
    } catch (err: any) {
      sound.playError();
      setEditError(err.message || 'Terjadi kesalahan saat menyimpan perubahan');
    } finally {
      setSavingEdit(false);
    }
  };

  const filteredCases = cases
    .filter(c => {
      const matchSearch = search.trim() === '' || 
        c.title?.toLowerCase().includes(search.toLowerCase()) ||
        c.official_name?.toLowerCase().includes(search.toLowerCase()) ||
        c.province_name?.toLowerCase().includes(search.toLowerCase());

      const matchStatus = filterStatus === 'all' || c.legal_status === filterStatus;
      return matchSearch && matchStatus;
    })
    .sort((a, b) => {
      let valA: any = a[sortField];
      let valB: any = b[sortField];

      if (sortField === 'loss_amount') {
        valA = Number(valA) || 0;
        valB = Number(valB) || 0;
        return sortOrder === 'asc' ? valA - valB : valB - valA;
      }

      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();
      if (valA == null) return 1;
      if (valB == null) return -1;

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

  const getSortFieldLabel = (field: string) => {
    switch (field) {
      case 'title': return 'Judul Perkara';
      case 'official_name': return 'Pejabat & Wilayah';
      case 'loss_amount': return 'Kerugian Negara';
      case 'legal_status': return 'Status Hukum';
      default: return 'Waktu Input';
    }
  };

  return (
    <div className="space-y-4">
      {/* Top action header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-[#DC2626]" />
            <span>Manajemen Berkas Perkara Korupsi</span>
          </h2>
          <p className="text-xs text-slate-500">
            Total {totalItems} berkas perkara terverifikasi dalam direktori publik.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchCases()}
            className="p-2 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            title="Refresh tabel"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={onOpenCreate}
            className="px-3.5 py-2 bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Kasus Baru</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari judul kasus, nama pejabat, atau provinsi..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#DC2626]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="w-full sm:w-auto px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#DC2626]"
            >
              <option value="all">Semua Status Hukum</option>
              <option value="tersangka">Tersangka</option>
              <option value="terdakwa">Terdakwa</option>
              <option value="divonis_inkrah">Divonis Inkrah</option>
              <option value="bebas">Bebas/Praperadilan</option>
            </select>
          </div>

          {/* Active Sort Pill Indicator */}
          {sortField !== 'created_at' && (
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-50 border border-blue-200 text-blue-700 text-xs rounded-xl font-medium animate-fade-in">
              <span>Urut: <strong>{getSortFieldLabel(sortField)}</strong> ({sortOrder === 'asc' ? 'A-Z / Terkecil' : 'Z-A / Terbesar'})</span>
              <button
                onClick={() => {
                  sound.playPop();
                  setSortField('created_at');
                  setSortOrder('desc');
                }}
                className="p-0.5 hover:bg-blue-100 rounded-md text-blue-600 hover:text-blue-900 cursor-pointer"
                title="Reset urutan ke default"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th 
                  onClick={() => handleSort('title')}
                  className="py-3.5 px-4 cursor-pointer select-none hover:bg-slate-100 transition-colors group"
                  title="Klik untuk mengurutkan berdasarkan Judul Perkara"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Judul Perkara</span>
                    {sortField === 'title' ? (
                      sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-blue-600 shrink-0" /> : <ArrowDown className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-300 group-hover:text-slate-500 shrink-0 transition-colors" />
                    )}
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('official_name')}
                  className="py-3.5 px-4 cursor-pointer select-none hover:bg-slate-100 transition-colors group"
                  title="Klik untuk mengurutkan berdasarkan Pejabat & Wilayah"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Pejabat &amp; Wilayah</span>
                    {sortField === 'official_name' ? (
                      sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-blue-600 shrink-0" /> : <ArrowDown className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-300 group-hover:text-slate-500 shrink-0 transition-colors" />
                    )}
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('loss_amount')}
                  className="py-3.5 px-4 cursor-pointer select-none hover:bg-slate-100 transition-colors group"
                  title="Klik untuk mengurutkan berdasarkan Kerugian Negara"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Kerugian Negara</span>
                    {sortField === 'loss_amount' ? (
                      sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-blue-600 shrink-0" /> : <ArrowDown className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-300 group-hover:text-slate-500 shrink-0 transition-colors" />
                    )}
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('legal_status')}
                  className="py-3.5 px-4 cursor-pointer select-none hover:bg-slate-100 transition-colors group"
                  title="Klik untuk mengurutkan berdasarkan Status Hukum"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Status Hukum</span>
                    {sortField === 'legal_status' ? (
                      sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-blue-600 shrink-0" /> : <ArrowDown className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-300 group-hover:text-slate-500 shrink-0 transition-colors" />
                    )}
                  </div>
                </th>
                <th className="py-3.5 px-4">Sumber Bukti</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="inline-flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-[#DC2626] border-t-transparent rounded-full animate-spin"></span>
                      <span>Memuat data berkas perkara...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredCases.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Tidak ada berkas perkara yang sesuai dengan pencarian / filter.
                  </td>
                </tr>
              ) : (
                filteredCases.map(c => {
                  const statusBadge = getStatusBadgeStyle(
                    c.legal_status === 'divonis_inkrah' 
                      ? 'Divonis Inkrah' 
                      : c.legal_status === 'terdakwa' 
                      ? 'Terdakwa' 
                      : c.legal_status === 'bebas' 
                      ? 'Bebas/Praperadilan' 
                      : 'Tersangka'
                  );

                  return (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="font-bold text-slate-900 leading-snug truncate" title={c.title}>
                          {c.title}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                          ID: {c.id}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={getOfficialPhoto(c.official_photo)}
                            alt={c.official_name || 'Pejabat'}
                            onError={handleImageError}
                            className="w-8 h-8 rounded-lg object-cover border border-slate-200 shrink-0 bg-slate-100"
                          />
                          <div className="min-w-0">
                            <div className="font-semibold text-slate-800 truncate">
                              {c.official_name || 'Tidak Terhubung'}
                            </div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                              <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate">{c.province_name || '-'}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                        {formatRupiah(c.loss_amount || 0)}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${statusBadge.bg} ${statusBadge.text} border ${statusBadge.border}`}>
                          {c.legal_status?.toUpperCase()}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 max-w-[180px]">
                        {c.source_url ? (
                          <a
                            href={c.source_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[#0284C7] hover:underline truncate max-w-[160px] text-[11px]"
                            title={c.source_url}
                          >
                            <span className="truncate">{c.source_url}</span>
                            <ExternalLink className="w-3 h-3 shrink-0" />
                          </a>
                        ) : (
                          <span className="text-slate-400 text-[11px]">-</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(c)}
                            className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="Edit berkas perkara"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCase(c.id, c.title)}
                            disabled={deletingId === c.id}
                            className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Hapus berkas kasus"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t border-slate-200 bg-slate-50 text-xs text-slate-600">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-slate-500">Tampilkan:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                sound.playPop();
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-700 shadow-2xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={10}>10 data (Default)</option>
              <option value={25}>25 data</option>
              <option value={50}>50 data</option>
              <option value={100}>100 data</option>
            </select>
            <span>
              Halaman <span className="font-bold text-slate-800">{page}</span> dari <span className="font-bold text-slate-800">{totalPages}</span> (Total <span className="font-bold text-slate-800">{totalItems}</span> berkas perkara)
            </span>
          </div>

          <div className="flex items-center gap-1.5 ml-auto">
            <button
              onClick={() => {
                sound.playPop();
                setPage(prev => Math.max(1, prev - 1));
              }}
              disabled={page <= 1 || loading}
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
                setPage(prev => Math.min(totalPages, prev + 1));
              }}
              disabled={page >= totalPages || loading}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 disabled:opacity-40 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Halaman Selanjutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Edit Case Modal */}
      {editingCase && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                  <Pencil className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Edit Berkas Perkara Korupsi</h3>
                  <p className="text-[11px] text-slate-500 font-mono">
                    ID: {editingCase.id} • {editingCase.official_name || 'Tanpa Pejabat'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingCase(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSaveEdit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {loadingCaseDetail && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-700 text-xs flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin shrink-0" />
                  <span>Mengambil data detail berkas perkara dari database...</span>
                </div>
              )}

              {editError && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{editError}</span>
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Judul Perkara Korupsi <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editForm.title}
                  onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                  placeholder="Contoh: Korupsi Pengadaan Proyek Menara BTS 4G Kominfo"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Category & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Kategori / Sektor Kasus <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={editForm.sector_category}
                    onChange={e => setEditForm({ ...editForm, sector_category: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="pengadaan_barang_jasa">Pengadaan Barang & Jasa</option>
                    <option value="bansos_bencana">Bansos & Kebencanaan</option>
                    <option value="suap_gratifikasi">Suap & Gratifikasi</option>
                    <option value="perizinan_sda_tambang">Perizinan SDA & Tambang</option>
                    <option value="mafia_peradilan">Mafia Peradilan</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Status Hukum <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={editForm.legal_status}
                    onChange={e => setEditForm({ ...editForm, legal_status: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="tersangka">Tersangka</option>
                    <option value="terdakwa">Terdakwa</option>
                    <option value="divonis_inkrah">Divonis Inkrah</option>
                    <option value="bebas">Bebas / Praperadilan</option>
                  </select>
                </div>
              </div>

              {/* Financials */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Kerugian Negara (Rp)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editForm.loss_amount}
                    onChange={e => setEditForm({ ...editForm, loss_amount: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="text-[10px] text-slate-500 font-semibold mt-1">
                    {formatRupiah(Number(editForm.loss_amount) || 0)}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Denda (Rp)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editForm.fine_amount}
                    onChange={e => setEditForm({ ...editForm, fine_amount: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="text-[10px] text-slate-500 font-semibold mt-1">
                    {formatRupiah(Number(editForm.fine_amount) || 0)}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Uang Pengganti (Rp)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editForm.restitution_amount}
                    onChange={e => setEditForm({ ...editForm, restitution_amount: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="text-[10px] text-slate-500 font-semibold mt-1">
                    {formatRupiah(Number(editForm.restitution_amount) || 0)}
                  </div>
                </div>
              </div>

              {/* Prison months & Court decision */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Vonis Penjara (Bulan)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editForm.prison_sentence_months}
                    onChange={e => setEditForm({ ...editForm, prison_sentence_months: e.target.value })}
                    placeholder="Contoh: 144 (12 tahun)"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="text-[10px] text-slate-500 mt-1">
                    {Number(editForm.prison_sentence_months) > 0
                      ? `${Math.floor(Number(editForm.prison_sentence_months) / 12)} Tahun ${Number(editForm.prison_sentence_months) % 12} Bulan`
                      : 'Belum ada vonis kurungan'}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nomor Putusan Pengadilan
                  </label>
                  <input
                    type="text"
                    value={editForm.court_decision_number}
                    onChange={e => setEditForm({ ...editForm, court_decision_number: e.target.value })}
                    placeholder="Contoh: 45/Pid.Sus-TPK/2023/PN.Jkt.Pst"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Chronology */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Kronologi &amp; Konstruksi Perkara <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  value={editForm.chronology}
                  onChange={e => setEditForm({ ...editForm, chronology: e.target.value })}
                  placeholder="Uraian singkat konstruksi perkara korupsi..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed"
                />
              </div>

              {/* Charges Articles */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Pasal Dakwaan / Tuntutan
                </label>
                <input
                  type="text"
                  value={editForm.charges_articles}
                  onChange={e => setEditForm({ ...editForm, charges_articles: e.target.value })}
                  placeholder="Contoh: Pasal 2 ayat (1) jo Pasal 18 UU Tipikor jo Pasal 55 ayat (1) ke-1 KUHP"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Source URL */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  URL Tautan Rujukan Resmi
                </label>
                <input
                  type="url"
                  value={editForm.source_url}
                  onChange={e => setEditForm({ ...editForm, source_url: e.target.value })}
                  placeholder="https://putusan3.mahkamahagung.go.id/..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingCase(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  {savingEdit ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Menyimpan Perubahan...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Simpan Perubahan</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
