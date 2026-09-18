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
  Calendar
} from 'lucide-react';
import { formatRupiah, getStatusBadgeStyle } from '../../utils/formatters.js';
import { getOfficialPhoto, handleImageError } from '../../utils/photo.js';

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
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchCases();
  }, [page, authToken]);

  const fetchCases = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/cases?page=${page}&limit=15`, {
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

  const filteredCases = cases.filter(c => {
    const matchSearch = search.trim() === '' || 
      c.title?.toLowerCase().includes(search.toLowerCase()) ||
      c.official_name?.toLowerCase().includes(search.toLowerCase()) ||
      c.province_name?.toLowerCase().includes(search.toLowerCase());

    const matchStatus = filterStatus === 'all' || c.legal_status === filterStatus;
    return matchSearch && matchStatus;
  });

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

        <div className="flex items-center gap-2 w-full sm:w-auto">
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
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3.5 px-4">Judul Perkara</th>
                <th className="py-3.5 px-4">Pejabat &amp; Wilayah</th>
                <th className="py-3.5 px-4">Kerugian Negara</th>
                <th className="py-3.5 px-4">Status Hukum</th>
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
                        <button
                          onClick={() => handleDeleteCase(c.id, c.title)}
                          disabled={deletingId === c.id}
                          className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Hapus berkas kasus"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50 text-xs text-slate-600">
          <div>
            Menampilkan halaman <span className="font-bold">{page}</span> dari <span className="font-bold">{totalPages}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage(prev => Math.max(1, prev - 1))}
              disabled={page <= 1}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 disabled:opacity-40 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 disabled:opacity-40 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
