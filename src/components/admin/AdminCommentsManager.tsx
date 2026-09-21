import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Search, 
  RefreshCw, 
  Trash2, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertCircle, 
  ThumbsUp, 
  Clock, 
  ShieldAlert,
  User,
  Sparkles,
  ExternalLink,
  HelpCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { sound } from '../../utils/audio.js';
import { REACTION_DEFINITIONS } from '../CaseReactionsSection.js';
import { AVATAR_OPTIONS } from '../CitizenAuthModal.js';

interface AdminCommentUser {
  id: string;
  username: string;
  display_name: string;
  avatar_seed?: string;
}

interface AdminCommentItem {
  id: string;
  case_id: string;
  case_title: string;
  content: string;
  reaction_type: string | null;
  upvotes_count: number;
  is_hidden: number;
  created_at: string;
  user: AdminCommentUser;
}

interface AdminCommentsManagerProps {
  authToken: string;
  onRefreshGlobal?: () => void;
}

export const AdminCommentsManager: React.FC<AdminCommentsManagerProps> = ({
  authToken,
  onRefreshGlobal
}) => {
  const [comments, setComments] = useState<AdminCommentItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [filter, setFilter] = useState<'all' | 'visible' | 'hidden'>('all');
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    fetchComments();
  }, [authToken, filter]);

  useEffect(() => {
    setPage(1);
  }, [search, filter]);

  const fetchComments = async () => {
    setLoading(true);
    try {
      const url = filter === 'all' 
        ? '/api/admin/comments' 
        : `/api/admin/comments?filter=${filter}`;
      const res = await fetch(url, {
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : {}
      });
      if (res.ok) {
        const json = await res.json();
        setComments(json.data || []);
      }
    } catch (err) {
      console.error('Error fetching admin comments:', err);
      setNotification({
        type: 'error',
        message: 'Gagal memuat daftar komentar warga.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleHide = async (commentId: string, currentHidden: number) => {
    sound.playPop();
    setActionLoadingId(commentId);
    try {
      const res = await fetch(`/api/admin/comments/${commentId}/toggle-hide`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        }
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal mengubah visibilitas komentar.');
      }
      sound.playSuccess();
      setNotification({
        type: 'success',
        message: data.message || 'Status moderasi komentar berhasil diperbarui.'
      });
      // Update local state
      setComments(prev =>
        prev.map(c => c.id === commentId ? { ...c, is_hidden: data.is_hidden } : c)
      );
      if (onRefreshGlobal) onRefreshGlobal();
    } catch (err: any) {
      sound.playError();
      setNotification({
        type: 'error',
        message: err.message || 'Terjadi kesalahan sistem saat memperbarui status.'
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!window.confirm('PERINGATAN: Apakah Anda yakin ingin menghapus komentar ini secara permanen? Tindakan ini tidak dapat dibatalkan.')) {
      return;
    }

    sound.playPop();
    setActionLoadingId(commentId);
    try {
      const res = await fetch(`/api/admin/comments/${commentId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal menghapus komentar.');
      }
      sound.playSuccess();
      setNotification({
        type: 'success',
        message: 'Komentar warga berhasil dihapus permanen dari basis data.'
      });
      setComments(prev => prev.filter(c => c.id !== commentId));
      if (onRefreshGlobal) onRefreshGlobal();
    } catch (err: any) {
      sound.playError();
      setNotification({
        type: 'error',
        message: err.message || 'Gagal menghapus komentar.'
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredComments = comments.filter(c => {
    const q = search.toLowerCase();
    return (
      c.content.toLowerCase().includes(q) ||
      c.case_title.toLowerCase().includes(q) ||
      c.user.display_name.toLowerCase().includes(q) ||
      c.user.username.toLowerCase().includes(q)
    );
  });

  const effectivePageSize = pageSize >= 9999 ? Math.max(filteredComments.length, 1) : pageSize;
  const totalPages = Math.ceil(filteredComments.length / effectivePageSize) || 1;
  const paginatedComments = filteredComments.slice((page - 1) * effectivePageSize, page * effectivePageSize);

  const getAvatarEmoji = (seed?: string) => {
    const found = AVATAR_OPTIONS.find(a => a.id === seed);
    return found ? found.emoji : '👤';
  };

  const getReactionBadge = (reactionType: string | null) => {
    if (!reactionType || !REACTION_DEFINITIONS[reactionType]) return null;
    const def = REACTION_DEFINITIONS[reactionType];
    const isPemakluman = def.spectrum === 'pemakluman';
    const isKecaman = def.spectrum === 'kecaman';

    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
        isPemakluman
          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
          : isKecaman
          ? 'bg-rose-100 text-rose-800 border border-rose-300'
          : 'bg-amber-100 text-amber-800 border border-amber-300'
      }`}>
        <span>{def.emoji}</span>
        <span>{def.label}</span>
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Alert notification banner */}
      {notification && (
        <div className={`p-4 rounded-2xl flex items-center justify-between gap-3 text-xs font-semibold shadow-xs animate-fadeIn ${
          notification.type === 'success' 
            ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' 
            : 'bg-rose-50 text-rose-900 border border-rose-200'
        }`}>
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
          <button 
            onClick={() => setNotification(null)}
            className="text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header card with controls */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                <MessageSquare className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Moderasi Komentar Warga (Role Citizen)
                </h3>
                <p className="text-xs text-slate-500">
                  Kelola aspirasi, tanggapan, dan sikap publik lintas seluruh berkas perkara korupsi.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => {
                sound.playPop();
                fetchComments();
              }}
              disabled={loading}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Segarkan</span>
            </button>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => {
                sound.playPop();
                setFilter('all');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filter === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Semua ({comments.length})
            </button>
            <button
              onClick={() => {
                sound.playPop();
                setFilter('visible');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filter === 'visible'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
              }`}
            >
              Ditampilkan Publik
            </button>
            <button
              onClick={() => {
                sound.playPop();
                setFilter('hidden');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filter === 'hidden'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
              }`}
            >
              Disembunyikan (Sensor)
            </button>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari komentar, warga, perkara..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#DC2626] focus:bg-white"
            />
          </div>
        </div>
      </div>

      {/* Comment List */}
      <div className="space-y-3">
        {loading ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-slate-200">
            <RefreshCw className="w-8 h-8 text-slate-400 animate-spin mx-auto mb-3" />
            <p className="text-xs text-slate-500 font-semibold">Memuat data komentar warga...</p>
          </div>
        ) : filteredComments.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-slate-200">
            <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h4 className="text-sm font-bold text-slate-700">Tidak ada komentar yang ditemukan</h4>
            <p className="text-xs text-slate-400 mt-1">
              {search ? 'Coba ubah kata kunci pencarian Anda.' : 'Belum ada komentar warga pada kategori ini.'}
            </p>
          </div>
        ) : (
          paginatedComments.map((comment) => {
            const isActionLoading = actionLoadingId === comment.id;
            const isHidden = comment.is_hidden === 1;

            return (
              <div 
                key={comment.id}
                className={`p-5 bg-white rounded-3xl border transition-all ${
                  isHidden 
                    ? 'border-rose-200 bg-rose-50/20 shadow-none opacity-85' 
                    : 'border-slate-200 hover:border-slate-300 shadow-xs'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  {/* Left: User & Comment Content */}
                  <div className="space-y-3 flex-1 min-w-0">
                    {/* User header + Case title */}
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center text-sm">
                        {getAvatarEmoji(comment.user.avatar_seed)}
                      </div>
                      <span className="text-xs font-bold text-slate-900">
                        {comment.user.display_name}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">
                        @{comment.user.username}
                      </span>

                      <span className="text-slate-300">•</span>

                      {/* Stance / Reaction Badge */}
                      {getReactionBadge(comment.reaction_type)}

                      {/* Hidden status badge */}
                      {isHidden && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1">
                          <EyeOff className="w-3 h-3" />
                          <span>Disembunyikan Dari Publik</span>
                        </span>
                      )}
                    </div>

                    {/* Target Case Title */}
                    <div className="text-[11px] text-slate-500 flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                      <span className="font-semibold text-slate-600">Perkara:</span>
                      <span className="font-bold text-slate-800 truncate">{comment.case_title}</span>
                    </div>

                    {/* Comment Body */}
                    <div className="text-xs text-slate-700 leading-relaxed bg-[#FFFDF8] p-3.5 rounded-2xl border border-[#F0E8D7] whitespace-pre-wrap font-sans">
                      {comment.content}
                    </div>

                    {/* Metadata & Timestamp */}
                    <div className="flex items-center gap-4 text-[11px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{new Date(comment.created_at).toLocaleString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })} WIB</span>
                      </span>

                      <span className="flex items-center gap-1 text-slate-600 font-bold">
                        <ThumbsUp className="w-3.5 h-3.5 text-amber-500" />
                        <span>{comment.upvotes_count} Dukungan Warga</span>
                      </span>
                    </div>
                  </div>

                  {/* Right: Moderation Actions */}
                  <div className="flex md:flex-col items-center gap-2 shrink-0 self-end md:self-start pt-2 md:pt-0">
                    <button
                      onClick={() => handleToggleHide(comment.id, comment.is_hidden)}
                      disabled={isActionLoading}
                      className={`w-full px-3.5 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 ${
                        isHidden
                          ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-300'
                          : 'bg-amber-100 text-amber-900 hover:bg-amber-200 border border-amber-300'
                      }`}
                      title={isHidden ? 'Tampilkan kembali ke publik' : 'Sembunyikan dari publik'}
                    >
                      {isHidden ? (
                        <>
                          <Eye className="w-3.5 h-3.5" />
                          <span>Tampilkan Publik</span>
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-3.5 h-3.5" />
                          <span>Sembunyikan</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleDelete(comment.id)}
                      disabled={isActionLoading}
                      className="w-full px-3.5 py-2 rounded-xl text-xs font-bold bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                      title="Hapus komentar secara permanen"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Hapus Permanen</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination Footer */}
      {filteredComments.length > 0 && (
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
              <option value={9999}>Semua ({filteredComments.length})</option>
            </select>
            <span>
              Menampilkan <strong>{(page - 1) * effectivePageSize + 1}</strong> -{' '}
              <strong>{Math.min(filteredComments.length, page * effectivePageSize)}</strong> dari <strong>{filteredComments.length}</strong> komentar
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
