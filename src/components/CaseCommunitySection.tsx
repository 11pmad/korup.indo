'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { ThumbsUp, MessageSquare, Send } from 'lucide-react';
import { REACTION_META, formatDateId } from '@/lib/formatters';
import { CitizenAuthModal, CitizenUserClient } from './CitizenAuthModal';

interface ReactionCount {
  reaction_type: string;
  count: number;
}

interface CommentItem {
  id: string;
  content: string;
  reaction_type: string | null;
  upvotes_count: number;
  created_at: string;
  username: string;
  display_name: string;
  origin_province: string | null;
  has_upvoted: boolean;
}

export function CaseCommunitySection({
  caseSlug,
  initialReactions,
}: {
  caseSlug: string;
  initialReactions: ReactionCount[];
}) {
  const [user, setUser] = useState<CitizenUserClient | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [counts, setCounts] = useState<ReactionCount[]>(initialReactions);
  const [userReaction, setUserReaction] = useState<string | null>(null);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState('');

  const loadCommunity = useCallback(async () => {
    try {
      const [meRes, rxRes, cmtRes] = await Promise.all([
        fetch('/api/v1/auth/citizen/me'),
        fetch(`/api/v1/cases/${caseSlug}/reactions`),
        fetch(`/api/v1/cases/${caseSlug}/comments`),
      ]);
      const meJson = await meRes.json();
      const rxJson = await rxRes.json();
      const cmtJson = await cmtRes.json();

      if (meJson?.data?.user) setUser(meJson.data.user);
      if (rxJson?.data?.counts) {
        setCounts(rxJson.data.counts);
        setUserReaction(rxJson.data.userReaction ?? null);
      }
      if (Array.isArray(cmtJson?.data)) setComments(cmtJson.data);
    } catch {
      // ignore initial hydration error
    }
  }, [caseSlug]);

  useEffect(() => {
    loadCommunity();
  }, [loadCommunity]);

  async function handleReact(reactionType: string) {
    if (!user) {
      setAuthOpen(true);
      return;
    }
    const res = await fetch(`/api/v1/cases/${caseSlug}/reactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reactionType }),
    });
    const json = await res.json();
    if (res.ok && json?.data) {
      setCounts(json.data.counts);
      setUserReaction(json.data.userReaction);
    }
  }

  async function handleCommentSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) {
      setAuthOpen(true);
      return;
    }
    setErr('');
    setSubmitting(true);
    try {
      const res = await fetch(`/api/v1/cases/${caseSlug}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, reactionType: userReaction }),
      });
      const json = await res.json();
      if (!res.ok) {
        setErr(json?.error?.message || 'Gagal mengirim komentar.');
        return;
      }
      setContent('');
      await loadCommunity();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpvote(commentId: string) {
    if (!user) {
      setAuthOpen(true);
      return;
    }
    const res = await fetch(`/api/v1/comments/${commentId}/upvote`, { method: 'POST' });
    const json = await res.json();
    if (res.ok && json?.data) {
      setComments((prev) =>
        prev.map((c) =>
          c.id === commentId
            ? { ...c, upvotes_count: json.data.upvotes_count, has_upvoted: json.data.upvoted }
            : c
        )
      );
    }
  }

  const countMap = new Map(counts.map((c) => [c.reaction_type, c.count]));

  return (
    <section aria-labelledby="community-heading" className="archival-card p-5 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-200 pb-3">
        <div>
          <h2 id="community-heading" className="font-hand text-2xl font-bold text-stone-900">
            Partisipasi & Diskusi Warga
          </h2>
          <p className="text-xs text-stone-600">
            Sampaikan sikap sipil dan diskusi konstruktif berdasarkan fakta persidangan.
          </p>
        </div>
        {user ? (
          <span className="rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-900">
            Masuk sebagai {user.displayName}
          </span>
        ) : (
          <button
            type="button"
            onClick={() => setAuthOpen(true)}
            className="rounded-lg bg-stone-900 px-3 py-1.5 text-xs font-bold text-white hover:bg-stone-800"
          >
            Masuk / Daftar untuk Berpartisipasi
          </button>
        )}
      </div>

      {/* 8 Sentiment Reactions */}
      <div className="flex flex-wrap gap-2">
        {REACTION_META.map((rx) => {
          const active = userReaction === rx.key;
          const cnt = countMap.get(rx.key) ?? 0;
          return (
            <button
              key={rx.key}
              type="button"
              onClick={() => handleReact(rx.key)}
              aria-pressed={active}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                active
                  ? 'border-red-700 bg-red-50 text-red-900'
                  : 'border-stone-200 bg-white text-stone-800 hover:bg-stone-100'
              }`}
            >
              <span aria-hidden="true">{rx.emoji}</span>
              <span>{rx.label}</span>
              <span className="font-mono text-[11px] opacity-75 tabular-nums">{cnt}</span>
            </button>
          );
        })}
      </div>

      {/* Comment Form */}
      <form onSubmit={handleCommentSubmit} className="space-y-2">
        <label htmlFor="case-comment-input" className="block text-xs font-bold text-stone-700">
          Komentar Publik ({comments.length})
        </label>
        <textarea
          id="case-comment-input"
          rows={3}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={
            user
              ? 'Tulis tanggapan objektif Anda tentang perkara ini...'
              : 'Masuk akun warga terlebih dahulu untuk menulis komentar...'
          }
          className="w-full rounded-lg border border-stone-300 bg-white p-3 text-sm focus:border-stone-900 focus:outline-none"
        />
        {err && <p className="text-xs font-semibold text-red-700">{err}</p>}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={submitting || !content.trim()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-stone-900 px-4 py-2 text-xs font-bold text-white hover:bg-stone-800 disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            {submitting ? 'Mengirim...' : 'Kirim Komentar'}
          </button>
        </div>
      </form>

      {/* Comments List */}
      <div className="space-y-3">
        {comments.length === 0 ? (
          <div className="rounded-lg border border-dashed border-stone-300 bg-stone-50 p-4 text-center text-xs text-stone-600 flex items-center justify-center gap-2">
            <MessageSquare className="w-4 h-4" /> Belum ada komentar. Jadilah warga pertama yang berdiskusi.
          </div>
        ) : (
          comments.map((cmt) => (
            <article key={cmt.id} className="rounded-lg border border-stone-200 bg-[#FBF8F1] p-3.5 space-y-2">
              <div className="flex items-center justify-between gap-2 text-xs">
                <div>
                  <span className="font-bold text-stone-900">{cmt.display_name}</span>
                  <span className="text-stone-500 ml-1.5">@{cmt.username}</span>
                  {cmt.origin_province && (
                    <span className="text-stone-500 ml-1.5">• {cmt.origin_province}</span>
                  )}
                </div>
                <span className="text-stone-500">{formatDateId(cmt.created_at)}</span>
              </div>
              <p className="text-sm text-stone-800 leading-relaxed whitespace-pre-line">{cmt.content}</p>
              <div className="flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => handleUpvote(cmt.id)}
                  className={`inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-semibold ${
                    cmt.has_upvoted
                      ? 'border-amber-600 bg-amber-50 text-amber-900'
                      : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  <ThumbsUp className="w-3 h-3" />
                  <span className="font-mono tabular-nums">{cmt.upvotes_count}</span>
                </button>
              </div>
            </article>
          ))
        )}
      </div>

      <CitizenAuthModal
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
        onAuthChange={(u) => {
          setUser(u);
          loadCommunity();
        }}
      />
    </section>
  );
}
