import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Trash2, 
  RefreshCw, 
  ChevronLeft, 
  ChevronRight,
  MapPin,
  Flag,
  ShieldAlert
} from 'lucide-react';
import { formatRupiah, getStatusBadgeStyle } from '../../utils/formatters.js';

interface OfficialsManagerProps {
  authToken: string;
  onRefreshGlobal: () => void;
}

export const AdminOfficialsManager: React.FC<OfficialsManagerProps> = ({
  authToken,
  onRefreshGlobal
}) => {
  const [officials, setOfficials] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchOfficials();
  }, [page, authToken]);

  const fetchOfficials = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/officials?page=${page}&limit=15`, {
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : {}
      });
      const data = await res.json();
      setOfficials(data.data || []);
      if (data.pagination) {
        setTotalPages(data.pagination.total_pages || 1);
        setTotalItems(data.pagination.total_items || 0);
      }
    } catch (err) {
      console.error('Error fetching admin officials:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteOfficial = async (id: string, name: string) => {
    if (!confirm(`Hapus data pejabat "${name}"? Seluruh berkas perkara yang terhubung akan tetap ada namun relasi pejabat akan ditarik.`)) {
      return;
    }

    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/officials/${id}`, {
        method: 'DELETE',
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : {}
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Gagal menghapus data pejabat');
      }

      alert('Data pejabat berhasil dihapus.');
      fetchOfficials();
      onRefreshGlobal();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  const filteredOfficials = officials.filter(o => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      o.full_name?.toLowerCase().includes(q) ||
      o.position_title?.toLowerCase().includes(q) ||
      o.party_name?.toLowerCase().includes(q) ||
      o.province_name?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4">
      {/* Top action header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-[#DC2626]" />
            <span>Manajemen Pejabat Publik</span>
          </h2>
          <p className="text-xs text-slate-500">
            Total {totalItems} pejabat publik terdokumentasi dalam pangkalan data.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchOfficials()}
            className="p-2 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            title="Refresh tabel"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama pejabat, jabatan, partai, atau provinsi..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#DC2626]"
          />
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3.5 px-4">Nama Pejabat &amp; Jabatan</th>
                <th className="py-3.5 px-4">Partai &amp; Wilayah</th>
                <th className="py-3.5 px-4">Total Kerugian Kasus</th>
                <th className="py-3.5 px-4">Status Hukum Terkini</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <div className="inline-flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-[#DC2626] border-t-transparent rounded-full animate-spin"></span>
                      <span>Memuat data pejabat...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredOfficials.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    Tidak ada pejabat yang sesuai dengan kata kunci pencarian.
                  </td>
                </tr>
              ) : (
                filteredOfficials.map(o => {
                  const statusBadge = getStatusBadgeStyle(
                    o.current_legal_status === 'divonis_inkrah' 
                      ? 'Divonis Inkrah' 
                      : o.current_legal_status === 'terdakwa' 
                      ? 'Terdakwa' 
                      : o.current_legal_status === 'bebas' 
                      ? 'Bebas/Praperadilan' 
                      : 'Tersangka'
                  );

                  return (
                    <tr key={o.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 text-sm">
                          {o.full_name}
                        </div>
                        <div className="text-slate-500 text-xs">
                          {o.position_title}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          ID: {o.id}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-700 flex items-center gap-1.5">
                          <Flag className="w-3.5 h-3.5 text-amber-500" />
                          <span>{o.party_name || 'Non-Partai'}</span>
                        </div>
                        <div className="text-slate-500 text-[11px] flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span>{o.province_name || '-'}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                        {formatRupiah(o.total_loss_amount || 0)}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${statusBadge.bg} ${statusBadge.text} border ${statusBadge.border}`}>
                          {o.current_legal_status?.toUpperCase()}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => handleDeleteOfficial(o.id, o.full_name)}
                          disabled={deletingId === o.id}
                          className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Hapus data pejabat"
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
