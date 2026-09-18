import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  ThumbsUp, 
  Send, 
  Filter, 
  Sparkles, 
  ShieldCheck, 
  UserCheck, 
  HeartHandshake,
  AlertOctagon,
  HelpCircle,
  Clock,
  TrendingUp,
  LogIn,
  X
} from 'lucide-react';
import { sound } from '../utils/audio.js';
import { CitizenAuthModal, AVATAR_OPTIONS } from './CitizenAuthModal.js';
import { REACTION_DEFINITIONS, ReactionType } from './CaseReactionsSection.js';

interface CommentUser {
  id: string;
  username: string;
  display_name: string;
  avatar_seed?: string;
  role: string;
}

interface CaseComment {
  id: string;
  case_id: string;
  content: string;
  reaction_type: string | null;
  upvotes_count: number;
  created_at: string;
  user: CommentUser;
  reaction_info: {
    emoji: string;
    label: string;
    spectrum: 'kecaman' | 'pemakluman' | 'skeptis';
    description: string;
  } | null;
  is_upvoted: boolean;
}

interface CaseCommentsSectionProps {
  caseId: string;
  caseTitle?: string;
  embedded?: boolean;
  onClose?: () => void;
  onCountChange?: (count: number) => void;
}

export const CaseCommentsSection: React.FC<CaseCommentsSectionProps> = ({
  caseId,
  caseTitle,
  embedded = false,
  onClose,
  onCountChange
}) => {
  const [comments, setComments] = useState<CaseComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [content, setContent] = useState('');
  const [selectedReaction, setSelectedReaction] = useState<string>('');
  const [filter, setFilter] = useState<'all' | 'pemakluman' | 'kecaman' | 'skeptis'>('all');
  const [sort, setSort] = useState<'newest' | 'popular'>('newest');

  // Auth state
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  useEffect(() => {
    loadCurrentUser();
    fetchComments();

    const handleAuthChange = () => {
      loadCurrentUser();
      fetchComments();
    };
    window.addEventListener('lki_citizen_auth_change', handleAuthChange);
    return () => window.removeEventListener('lki_citizen_auth_change', handleAuthChange);
  }, [caseId, filter, sort]);

  const loadCurrentUser = () => {
    try {
      const stored = localStorage.getItem('lki_citizen_user');
      if (stored) {
        setCurrentUser(JSON.parse(stored));
      } else {
        setCurrentUser(null);
      }
    } catch {
      setCurrentUser(null);
    }
  };

  const fetchComments = async () => {
    try {
      const token = localStorage.getItem('lki_citizen_token');
      const res = await fetch(`/api/comments/case/${caseId}?filter=${filter}&sort=${sort}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const json = await res.json();
        const list = json.data || [];
        setComments(list);
        if (onCountChange) {
          onCountChange(list.length);
        }
      }
    } catch (err) {
      console.error('Error fetching comments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('lki_citizen_token');
    if (!token) {
      setAuthModalOpen(true);
      return;
    }

    if (!content.trim() || content.trim().length < 5) {
      alert('Komentar minimal 5 karakter.');
      return;
    }

    sound.playPop();
    setSubmitting(true);
    try {
      const res = await fetch(`/api/comments/case/${caseId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          content: content.trim(),
          reaction_type: selectedReaction || undefined
        })
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Gagal mengirim komentar.');
      }

      sound.playSuccess();
      setContent('');
      setSelectedReaction('');
      setComments(prev => {
        const updated = [json.data, ...prev];
        if (onCountChange) onCountChange(updated.length);
        return updated;
      });
    } catch (err: any) {
      sound.playError();
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpvote = async (commentId: string) => {
    const token = localStorage.getItem('lki_citizen_token');
    if (!token) {
      setAuthModalOpen(true);
      return;
    }

    sound.playPop();
    try {
      const res = await fetch(`/api/comments/${commentId}/upvote`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (res.ok) {
        const json = await res.json();
        setComments(prev =>
          prev.map(c =>
            c.id === commentId
              ? { ...c, upvotes_count: json.data.upvotesCount, is_upvoted: json.data.isUpvoted }
              : c
          )
        );
      }
    } catch (err) {
      console.error('Error upvoting comment:', err);
    }
  };

  const getAvatarEmoji = (seed?: string) => {
    const found = AVATAR_OPTIONS.find(a => a.id === seed);
    return found ? found.emoji : '👤';
  };

  const mainContent = (
    <div className="space-y-4">
      {/* Header Section */}
      <div className="flex items-center justify-between gap-2 pb-3 border-b border-dashed border-[#DFD3BA]">
        <div className="space-y-0.5 min-w-0">
          <div className="flex items-center gap-1.5">
            <MessageSquare className="w-4 h-4 text-[#854D0E]" />
            <h3 className="font-hand font-bold text-base sm:text-lg text-[#1E293B] truncate">
              Diskusi Warga ({comments.length})
            </h3>
          </div>
          <p className="text-[11px] text-[#78716C] leading-snug truncate">
            Komentar &amp; aspirasi masyarakat terbuka.
          </p>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {currentUser ? (
            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-900 text-[11px] font-bold shadow-2xs">
              <span>{getAvatarEmoji(currentUser.avatarSeed)}</span>
              <span className="truncate max-w-[80px]">{currentUser.displayName}</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setAuthModalOpen(true)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 hover:bg-amber-200 text-amber-900 text-[11px] font-bold transition-colors cursor-pointer border border-amber-300 shadow-2xs"
            >
              <LogIn className="w-3 h-3" />
              <span>Masuk</span>
            </button>
          )}

          {embedded && onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Tutup Komentar"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

        {/* Form Komentar Baru */}
        <form onSubmit={handlePostComment} className="p-4 bg-[#FAF6EC] border border-[#EBE1CD] rounded-2xl space-y-3 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <span>✍️ Tulis Komentar / Telaah Kasus</span>
            </label>

            {/* Selector Sikap Reaksi */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-slate-500 text-[11px] font-medium hidden sm:inline">Sikap Anda:</span>
              <select
                value={selectedReaction}
                onChange={e => setSelectedReaction(e.target.value)}
                className="px-2.5 py-1.5 bg-white border border-[#CBD5E1] rounded-xl text-xs font-bold text-slate-800 outline-hidden cursor-pointer"
              >
                <option value="">-- Sertakan Sikap (Opsional) --</option>
                <optgroup label="🤝 Pemakluman &amp; Niat Baik">
                  <option value="khilaf_administrasi">💡 Khilaf Administrasi (Niat Baik)</option>
                  <option value="didukung">🤝 Didukung &amp; Masuk Akal</option>
                  <option value="dimaklumi">🕊️ Dimaklumi &amp; Dimaafkan</option>
                </optgroup>
                <optgroup label="😡 Kecaman &amp; Amarah Rakyat">
                  <option value="geram">😡 Sangat Geram</option>
                  <option value="rampok">💸 Rampok Uang Rakyat</option>
                  <option value="memalukan">🤮 Memalukan &amp; Menjijikkan</option>
                </optgroup>
                <optgroup label="⚖️ Skeptisisme &amp; Kawal Sidang">
                  <option value="tebang_pilih">⚖️ Janggal / Tebang Pilih</option>
                  <option value="kawal_sidang">🧐 Kawal Sidang Objektif</option>
                </optgroup>
              </select>
            </div>
          </div>

          <div className="relative">
            <textarea
              required
              rows={3}
              maxLength={1000}
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Contoh: Perlu kita bedakan dengan jernih antara korupsi yang memperkaya diri pribadi dengan pengadaan fasilitas kerja seperti notebook/komputer dinas. Jika pejabat bersangkutan tidak menerima uang sepeser pun dan semata-mata demi tugas pelayanan publik..."
              className="w-full p-3 bg-white border border-[#CBD5E1] focus:border-amber-500 rounded-xl text-xs text-slate-900 leading-relaxed outline-hidden transition-all shadow-xs resize-none"
            />
            <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
              <span>Gunakan bahasa yang santun, objektif, dan berlandaskan fakta.</span>
              <span>{content.length} / 1000 karakter</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="text-[11px] text-slate-500 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Komentar publik terlindungi asas praduga tak bersalah.</span>
            </div>

            <button
              type="submit"
              disabled={submitting || content.trim().length < 5}
              className="px-4 py-2 bg-[#78350F] hover:bg-[#5E2B0C] text-white font-bold rounded-xl text-xs transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{submitting ? 'Mengirim...' : 'Kirim Suara Warga'}</span>
            </button>
          </div>
        </form>

        {/* Filter & Sorting Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1">
          {/* Tabs Filter */}
          <div className="flex flex-wrap items-center gap-1">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filter === 'all' 
                  ? 'bg-slate-900 text-white shadow-xs' 
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              Semua ({comments.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('pemakluman')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filter === 'pemakluman' 
                  ? 'bg-emerald-700 text-white shadow-xs' 
                  : 'bg-emerald-50 border border-emerald-200 text-emerald-800 hover:bg-emerald-100'
              }`}
            >
              🤝 Pemakluman / Niat Baik
            </button>
            <button
              type="button"
              onClick={() => setFilter('kecaman')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filter === 'kecaman' 
                  ? 'bg-rose-700 text-white shadow-xs' 
                  : 'bg-rose-50 border border-rose-200 text-rose-800 hover:bg-rose-100'
              }`}
            >
              😡 Kecaman
            </button>
            <button
              type="button"
              onClick={() => setFilter('skeptis')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filter === 'skeptis' 
                  ? 'bg-amber-600 text-white shadow-xs' 
                  : 'bg-amber-50 border border-amber-200 text-amber-800 hover:bg-amber-100'
              }`}
            >
              ⚖️ Tebang Pilih / Kawal
            </button>
          </div>

          {/* Sort Buttons */}
          <div className="flex items-center gap-1 self-start sm:self-auto text-xs">
            <button
              type="button"
              onClick={() => setSort('newest')}
              className={`px-2 py-1 rounded-lg font-semibold transition-colors cursor-pointer flex items-center gap-1 ${
                sort === 'newest' ? 'bg-amber-100 text-amber-900 font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Clock className="w-3 h-3" />
              <span>Terbaru</span>
            </button>
            <span className="text-slate-300">•</span>
            <button
              type="button"
              onClick={() => setSort('popular')}
              className={`px-2 py-1 rounded-lg font-semibold transition-colors cursor-pointer flex items-center gap-1 ${
                sort === 'popular' ? 'bg-amber-100 text-amber-900 font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <TrendingUp className="w-3 h-3" />
              <span>Terpopuler</span>
            </button>
          </div>
        </div>

        {/* Comments Feed List */}
        {comments.length === 0 ? (
          <div className="p-8 text-center text-slate-400 space-y-2 bg-[#FAF6EC] rounded-2xl border border-dashed border-[#E5DAC4]">
            <MessageSquare className="w-8 h-8 mx-auto text-slate-300 stroke-1" />
            <p className="text-xs font-semibold text-slate-600">
              Belum ada tanggapan warga pada berkas ini.
            </p>
            <p className="text-[11px] text-slate-400">
              Jadilah warga pertama yang menyampaikan telaah dan pandangan Anda.
            </p>
          </div>
        ) : (
          <div className="space-y-3 divide-y divide-[#EFE5D3]">
            {comments.map(c => {
              const dateStr = c.created_at ? new Date(c.created_at).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              }) : '-';

              return (
                <div key={c.id} className="pt-3 first:pt-0 space-y-2">
                  {/* Comment Author Header */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center text-sm shadow-2xs shrink-0">
                        {getAvatarEmoji(c.user.avatar_seed)}
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <strong className="text-xs font-bold text-slate-900">
                          {c.user.display_name}
                        </strong>
                        <span className="px-1.5 py-0.2 rounded-md bg-slate-100 text-slate-600 text-[10px] font-mono">
                          Warga
                        </span>
                        <span className="text-slate-300 text-xs">•</span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {dateStr}
                        </span>
                      </div>
                    </div>

                    {/* Stance Pill if attached */}
                    {c.reaction_info && (
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1 shrink-0 ${
                        c.reaction_info.spectrum === 'pemakluman'
                          ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                          : c.reaction_info.spectrum === 'kecaman'
                          ? 'bg-rose-100 text-rose-900 border border-rose-300'
                          : 'bg-amber-100 text-amber-900 border border-amber-300'
                      }`}>
                        <span>{c.reaction_info.emoji}</span>
                        <span>{c.reaction_info.label}</span>
                      </span>
                    )}
                  </div>

                  {/* Comment Body */}
                  <p className="text-xs text-slate-700 leading-relaxed pl-9">
                    {c.content}
                  </p>

                  {/* Action Bar (Upvote) */}
                  <div className="pl-9 flex items-center gap-3 pt-0.5">
                    <button
                      type="button"
                      onClick={() => handleUpvote(c.id)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        c.is_upvoted
                          ? 'bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs'
                          : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                      title="Dukung komentar ini jika bermanfaat bagi publik"
                    >
                      <ThumbsUp className={`w-3.5 h-3.5 ${c.is_upvoted ? 'text-amber-700 fill-amber-700' : 'text-slate-400'}`} />
                      <span>{c.upvotes_count > 0 ? c.upvotes_count : 'Berguna'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
  );

  return (
    <div className={embedded ? 'w-full' : 'space-y-5 pt-2'}>
      {embedded ? (
        <div className="space-y-4">{mainContent}</div>
      ) : (
        <div className="bg-[#FFFDF9] border-2 border-[#E7DECB] rounded-3xl p-4 sm:p-6 shadow-sm space-y-5">
          {mainContent}
        </div>
      )}

      {/* Citizen Auth Modal */}
      <CitizenAuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={() => {
          loadCurrentUser();
          fetchComments();
        }}
        initialMode="quick"
        contextMessage="Gunakan nama panggilan untuk menuliskan tanggapan dan mendukung suara warga lainnya."
      />
    </div>
  );
};
