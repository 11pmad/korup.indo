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
  Image as ImageIcon
} from 'lucide-react';
import { formatRupiah, getStatusBadgeStyle } from '../../utils/formatters.js';
import { getOfficialPhoto, handleImageError } from '../../utils/photo.js';

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

  // Edit photo modal state
  const [editingOfficial, setEditingOfficial] = useState<any | null>(null);
  const [editPhotoUrl, setEditPhotoUrl] = useState<string>('');
  const [savingPhoto, setSavingPhoto] = useState<boolean>(false);

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
                <th className="py-3.5 px-4">Nama Pejabat &amp; Foto</th>
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
    </div>
  );
};
