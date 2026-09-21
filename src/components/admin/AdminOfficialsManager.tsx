import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Trash2, 
  RefreshCw, 
  ChevronLeft, 
  ChevronRight,
  Flag,
  MapPin,
  ShieldAlert,
  Camera,
  Upload,
  X,
  Check,
  Image as ImageIcon,
  Pencil,
  AlertCircle,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { formatRupiah, getStatusBadgeStyle } from '../../utils/formatters.js';
import { getOfficialPhoto, handleImageError } from '../../utils/photo.js';
import { PROVINCES_LIST } from '../ReportModal.js';
import { sound } from '../../utils/audio.js';

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
  const [pageSize, setPageSize] = useState<number>(10);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Sorting state
  const [sortField, setSortField] = useState<'full_name' | 'party_name' | 'total_loss_amount' | 'current_legal_status'>('total_loss_amount');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Edit photo modal state (quick photo edit)
  const [editingOfficial, setEditingOfficial] = useState<any | null>(null);
  const [editPhotoUrl, setEditPhotoUrl] = useState<string>('');
  const [savingPhoto, setSavingPhoto] = useState<boolean>(false);

  // Full Edit Official modal state
  const [editingFullOfficial, setEditingFullOfficial] = useState<any | null>(null);
  const [editOfficialForm, setEditOfficialForm] = useState<{
    full_name: string;
    position_title: string;
    province_id: string;
    party_id: string;
    current_legal_status: string;
    total_loss_amount: number | string;
    photo_url: string;
  }>({
    full_name: '',
    position_title: '',
    province_id: '',
    party_id: '',
    current_legal_status: 'tersangka',
    total_loss_amount: 0,
    photo_url: ''
  });
  const [savingOfficial, setSavingOfficial] = useState<boolean>(false);
  const [editOfficialError, setEditOfficialError] = useState<string | null>(null);
  const [partiesList, setPartiesList] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/parties')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setPartiesList(data);
        else if (data.data && Array.isArray(data.data)) setPartiesList(data.data);
      })
      .catch(err => console.warn('Could not load parties:', err));
  }, []);

  useEffect(() => {
    fetchOfficials();
  }, [page, pageSize, authToken, sortField, sortOrder]);

  const fetchOfficials = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/officials?page=${page}&limit=${pageSize}&sort_by=${sortField}&order=${sortOrder}`, {
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

  const handleSort = (field: 'full_name' | 'party_name' | 'total_loss_amount' | 'current_legal_status') => {
    sound.playPop();
    if (sortField === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder(field === 'total_loss_amount' ? 'desc' : 'asc');
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

  const handleOpenEditPhoto = (official: any) => {
    setEditingOfficial(official);
    setEditPhotoUrl(official.photo_url || '');
  };

  const handleSavePhoto = async () => {
    if (!editingOfficial) return;
    setSavingPhoto(true);
    try {
      const res = await fetch(`/api/admin/officials/${editingOfficial.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
        },
        body: JSON.stringify({
          full_name: editingOfficial.full_name,
          position_title: editingOfficial.position_title,
          province_id: editingOfficial.province_id,
          party_id: editingOfficial.party_id,
          current_legal_status: editingOfficial.current_legal_status,
          photo_url: editPhotoUrl.trim() || null
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Gagal memperbarui foto pejabat');
      }

      setEditingOfficial(null);
      fetchOfficials();
      onRefreshGlobal();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setSavingPhoto(false);
    }
  };

  const handleOpenEditOfficial = (official: any) => {
    sound.playPop();
    setEditingFullOfficial(official);
    setEditOfficialError(null);
    setEditOfficialForm({
      full_name: official.full_name || '',
      position_title: official.position_title || '',
      province_id: official.province_id || '',
      party_id: official.party_id || '',
      current_legal_status: official.current_legal_status || 'tersangka',
      total_loss_amount: official.total_loss_amount ?? 0,
      photo_url: official.photo_url || ''
    });
  };

  const handleSaveOfficial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFullOfficial) return;

    setSavingOfficial(true);
    setEditOfficialError(null);

    try {
      const payload: any = {
        full_name: editOfficialForm.full_name.trim(),
        position_title: editOfficialForm.position_title.trim(),
        province_id: editOfficialForm.province_id || null,
        party_id: editOfficialForm.party_id || null,
        current_legal_status: editOfficialForm.current_legal_status,
        total_loss_amount: Number(editOfficialForm.total_loss_amount) || 0,
        photo_url: editOfficialForm.photo_url.trim() || null
      };

      const res = await fetch(`/api/admin/officials/${editingFullOfficial.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal memperbarui data pejabat');
      }

      sound.playSuccess();
      setEditingFullOfficial(null);
      fetchOfficials();
      onRefreshGlobal();
    } catch (err: any) {
      sound.playError();
      setEditOfficialError(err.message || 'Terjadi kesalahan saat menyimpan data pejabat');
    } finally {
      setSavingOfficial(false);
    }
  };

  const filteredOfficials = officials
    .filter(o => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        o.full_name?.toLowerCase().includes(q) ||
        o.position_title?.toLowerCase().includes(q) ||
        o.party_name?.toLowerCase().includes(q) ||
        o.province_name?.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      let valA: any = a[sortField];
      let valB: any = b[sortField];

      if (sortField === 'total_loss_amount') {
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
      case 'full_name': return 'Nama Pejabat';
      case 'party_name': return 'Partai & Wilayah';
      case 'total_loss_amount': return 'Total Kerugian';
      case 'current_legal_status': return 'Status Hukum';
      default: return 'Total Kerugian';
    }
  };

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

      {/* Search Bar & Active Sort */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama pejabat, jabatan, partai, atau provinsi..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#DC2626]"
          />
        </div>

        {/* Active Sort Pill Indicator */}
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-50 border border-blue-200 text-blue-700 text-xs rounded-xl font-medium animate-fade-in shrink-0">
          <span>Urut: <strong>{getSortFieldLabel(sortField)}</strong> ({sortOrder === 'asc' ? 'A-Z / Terkecil' : 'Z-A / Terbesar'})</span>
          <button
            onClick={() => {
              sound.playPop();
              setSortField('total_loss_amount');
              setSortOrder('desc');
            }}
            className="p-0.5 hover:bg-blue-100 rounded-md text-blue-600 hover:text-blue-900 cursor-pointer"
            title="Reset urutan ke default (Kerugian Terbesar)"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th 
                  onClick={() => handleSort('full_name')}
                  className="py-3.5 px-4 cursor-pointer select-none hover:bg-slate-100 transition-colors group"
                  title="Klik untuk mengurutkan berdasarkan Nama Pejabat"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Nama Pejabat &amp; Foto</span>
                    {sortField === 'full_name' ? (
                      sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-blue-600 shrink-0" /> : <ArrowDown className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-300 group-hover:text-slate-500 shrink-0 transition-colors" />
                    )}
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('party_name')}
                  className="py-3.5 px-4 cursor-pointer select-none hover:bg-slate-100 transition-colors group"
                  title="Klik untuk mengurutkan berdasarkan Partai / Wilayah"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Partai &amp; Wilayah</span>
                    {sortField === 'party_name' ? (
                      sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-blue-600 shrink-0" /> : <ArrowDown className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-300 group-hover:text-slate-500 shrink-0 transition-colors" />
                    )}
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('total_loss_amount')}
                  className="py-3.5 px-4 cursor-pointer select-none hover:bg-slate-100 transition-colors group"
                  title="Klik untuk mengurutkan berdasarkan Total Kerugian Kasus"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Total Kerugian Kasus</span>
                    {sortField === 'total_loss_amount' ? (
                      sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-blue-600 shrink-0" /> : <ArrowDown className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-300 group-hover:text-slate-500 shrink-0 transition-colors" />
                    )}
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('current_legal_status')}
                  className="py-3.5 px-4 cursor-pointer select-none hover:bg-slate-100 transition-colors group"
                  title="Klik untuk mengurutkan berdasarkan Status Hukum Terkini"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Status Hukum Terkini</span>
                    {sortField === 'current_legal_status' ? (
                      sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-blue-600 shrink-0" /> : <ArrowDown className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-300 group-hover:text-slate-500 shrink-0 transition-colors" />
                    )}
                  </div>
                </th>
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
                        <div className="flex items-center gap-3">
                          <div className="relative group/avatar shrink-0">
                            <img
                              src={getOfficialPhoto(o.photo_url)}
                              alt={o.full_name}
                              onError={handleImageError}
                              className="w-11 h-11 rounded-xl object-cover border border-slate-200 bg-[#F4EFE6] shadow-2xs"
                            />
                            <button
                              type="button"
                              onClick={() => handleOpenEditPhoto(o)}
                              className="absolute inset-0 bg-black/50 hover:bg-black/70 text-white rounded-xl flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity cursor-pointer"
                              title="Ubah Foto"
                            >
                              <Camera className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 text-sm truncate">
                              {o.full_name}
                            </div>
                            <div className="text-slate-500 text-xs truncate">
                              {o.position_title}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                              ID: {o.id}
                            </div>
                          </div>
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
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEditOfficial(o)}
                            className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="Edit data pejabat"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEditPhoto(o)}
                            className="p-1.5 text-slate-600 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                            title="Ubah Foto Pejabat"
                          >
                            <Camera className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteOfficial(o.id, o.full_name)}
                            disabled={deletingId === o.id}
                            className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Hapus data pejabat"
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
              Halaman <span className="font-bold text-slate-800">{page}</span> dari <span className="font-bold text-slate-800">{totalPages}</span> (Total <span className="font-bold text-slate-800">{totalItems}</span> tokoh)
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

      {/* Edit Photo Modal */}
      {editingOfficial && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Camera className="w-4 h-4 text-[#EA580C]" />
                <span>Ubah Foto Pejabat Publik</span>
              </h3>
              <button
                onClick={() => setEditingOfficial(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="w-16 h-16 rounded-xl overflow-hidden border border-slate-200 bg-white shrink-0 shadow-2xs">
                  <img
                    src={getOfficialPhoto(editPhotoUrl)}
                    alt="Preview Foto"
                    onError={handleImageError}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-slate-800 text-sm truncate">
                    {editingOfficial.full_name}
                  </div>
                  <div className="text-xs text-slate-500 truncate">
                    {editingOfficial.position_title}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                    {editingOfficial.province_name || '-'}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tautan URL Foto
                </label>
                <input
                  type="url"
                  placeholder="https://contoh.com/foto.jpg"
                  value={editPhotoUrl}
                  onChange={e => setEditPhotoUrl(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#DC2626]"
                />
              </div>

              <div className="flex items-center gap-2">
                <label className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-semibold text-slate-700 cursor-pointer transition-colors">
                  <Upload className="w-3.5 h-3.5 text-[#EA580C]" />
                  <span>Unggah Berkas</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (file.size > 2 * 1024 * 1024) {
                          alert('Ukuran berkas maksimal 2MB');
                          return;
                        }
                        const reader = new FileReader();
                        reader.onload = () => {
                          if (typeof reader.result === 'string') {
                            setEditPhotoUrl(reader.result);
                          }
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </label>

                {editPhotoUrl && (
                  <button
                    type="button"
                    onClick={() => setEditPhotoUrl('')}
                    className="px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                  >
                    Reset ke Default
                  </button>
                )}
              </div>

              <p className="text-[11px] text-slate-500">
                Jika dikosongkan, sistem akan otomatis menggunakan siluet generik resmi LKI.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingOfficial(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSavePhoto}
                disabled={savingPhoto}
                className="px-4 py-2 text-xs font-bold bg-[#DC2626] hover:bg-[#B91C1C] text-white rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                {savingPhoto ? (
                  <span>Menyimpan...</span>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Simpan Perubahan</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Full Official Modal */}
      {editingFullOfficial && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                  <Pencil className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Edit Data Pejabat Publik</h3>
                  <p className="text-[11px] text-slate-500 font-mono">
                    ID: {editingFullOfficial.id}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingFullOfficial(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveOfficial} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {editOfficialError && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{editOfficialError}</span>
                </div>
              )}

              {/* Photo preview & file upload */}
              <div className="flex items-center gap-4 p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-slate-200 bg-white shrink-0 shadow-2xs">
                  <img
                    src={getOfficialPhoto(editOfficialForm.photo_url)}
                    alt="Preview"
                    onError={handleImageError}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="text-xs font-bold text-slate-700">Foto Pejabat Publik</div>
                  <div className="flex items-center gap-2">
                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl text-xs font-semibold text-slate-700 cursor-pointer transition-colors shadow-2xs">
                      <Upload className="w-3.5 h-3.5 text-[#EA580C]" />
                      <span>Unggah Berkas</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={e => {
                          const file = e.target.files?.[0];
                          if (file) {
                            if (file.size > 2 * 1024 * 1024) {
                              alert('Ukuran berkas foto maksimal 2MB');
                              return;
                            }
                            const reader = new FileReader();
                            reader.onload = () => {
                              if (typeof reader.result === 'string') {
                                setEditOfficialForm(prev => ({ ...prev, photo_url: reader.result as string }));
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                    {editOfficialForm.photo_url && (
                      <button
                        type="button"
                        onClick={() => setEditOfficialForm(prev => ({ ...prev, photo_url: '' }))}
                        className="px-2.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Lengkap Pejabat <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editOfficialForm.full_name}
                  onChange={e => setEditOfficialForm({ ...editOfficialForm, full_name: e.target.value })}
                  placeholder="Contoh: Drs. H. Nama Pejabat, M.Si"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Position */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Jabatan / Posisi Instansi <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editOfficialForm.position_title}
                  onChange={e => setEditOfficialForm({ ...editOfficialForm, position_title: e.target.value })}
                  placeholder="Contoh: Mantan Menteri Komunikasi dan Informatika"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Province / Wilayah & Party */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Cakupan Wilayah / Provinsi
                  </label>
                  <select
                    value={editOfficialForm.province_id}
                    onChange={e => setEditOfficialForm({ ...editOfficialForm, province_id: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="">- Pilih Wilayah -</option>
                    <optgroup label="🏛️ Tingkat Nasional / Pemerintah Pusat">
                      <option value="nasional">🏛️ Pusat / Nasional (Kementerian / Lembaga RI)</option>
                    </optgroup>
                    <optgroup label="📍 Tingkat Daerah (38 Provinsi Nusantara)">
                      {PROVINCES_LIST.filter(p => p.id !== 'pusat' && p.id !== 'nasional').map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Afiliasi Partai Politik
                  </label>
                  <select
                    value={editOfficialForm.party_id}
                    onChange={e => setEditOfficialForm({ ...editOfficialForm, party_id: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="">Non-Partai / Independen</option>
                    {partiesList.map((pty: any) => (
                      <option key={pty.id} value={pty.id}>
                        {pty.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Legal Status & Loss Amount */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Status Hukum Saat Ini <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={editOfficialForm.current_legal_status}
                    onChange={e => setEditOfficialForm({ ...editOfficialForm, current_legal_status: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="tersangka">Tersangka</option>
                    <option value="terdakwa">Terdakwa</option>
                    <option value="divonis_inkrah">Divonis Inkrah</option>
                    <option value="bebas">Bebas / Praperadilan</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Total Kerugian Negara Terkait (Rp)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editOfficialForm.total_loss_amount}
                    onChange={e => setEditOfficialForm({ ...editOfficialForm, total_loss_amount: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="text-[10px] text-slate-500 font-semibold mt-1">
                    {formatRupiah(Number(editOfficialForm.total_loss_amount) || 0)}
                  </div>
                </div>
              </div>

              {/* Photo URL manual input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tautan URL Foto Profil
                </label>
                <input
                  type="url"
                  placeholder="https://contoh.com/foto-pejabat.jpg"
                  value={editOfficialForm.photo_url}
                  onChange={e => setEditOfficialForm({ ...editOfficialForm, photo_url: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingFullOfficial(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingOfficial}
                  className="px-5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  {savingOfficial ? (
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
