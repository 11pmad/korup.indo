"use client";

import React, { useState, useEffect } from 'react';
import { 
  Heart, 
  ShieldAlert, 
  HelpCircle, 
  CheckCircle, 
  AlertTriangle,
  Info,
  Scale,
  Sparkles,
  BarChart3,
  X
} from 'lucide-react';
import { sound } from '../utils/audio';
import { CitizenAuthModal } from './CitizenAuthModal';
import { ReactionIcon, SpectrumIcon, stripLeadingEmoji } from './ThemeIcons';

export interface ReactionDefinition {
  emoji?: string;
  icon?: string;
  label: string;
  spectrum: 'kecaman' | 'pemakluman' | 'skeptis';
  description: string;
}

export const REACTION_DEFINITIONS: Record<string, ReactionDefinition> = {
  geram: {
    icon: 'geram',
    label: 'Sangat Geram',
    spectrum: 'kecaman',
    description: 'Tindakan serakah dan tidak bermoral yang melukai rasa keadilan rakyat.'
  },
  rampok: {
    icon: 'rampok',
    label: 'Rampok Uang Rakyat',
    spectrum: 'kecaman',
    description: 'Menguras anggaran negara demi kemewahan pribadi dan kroni.'
  },
  memalukan: {
    icon: 'memalukan',
    label: 'Memalukan & Menjijikkan',
    spectrum: 'kecaman',
    description: 'Merusak kehormatan institusi dan moral bangsa.'
  },
  didukung: {
    icon: 'didukung',
    label: 'Didukung & Masuk Akal',
    spectrum: 'pemakluman',
    description: 'Kebijakan demi kepentingan rakyat atau fasilitas penunjang tugas dinas yang wajar.'
  },
  khilaf_administrasi: {
    icon: 'khilaf_administrasi',
    label: 'Khilaf Administrasi (Niat Baik)',
    spectrum: 'pemakluman',
    description: 'Kesalahan prosedur tanpa niat korupsi; pejabat bersangkutan tidak menikmati sepeser pun.'
  },
  dimaklumi: {
    icon: 'dimaklumi',
    label: 'Dimaklumi & Dimaafkan',
    spectrum: 'pemakluman',
    description: 'Kerugian negara nihil/dipulihkan; dakwaan hukum terasa berlebihan.'
  },
  tebang_pilih: {
    icon: 'tebang_pilih',
    label: 'Janggal / Tebang Pilih',
    spectrum: 'skeptis',
    description: 'Aroma politisasi hukum atau penargetan lawan politik secara selektif.'
  },
  kawal_sidang: {
    icon: 'kawal_sidang',
    label: 'Kawal Sidang Objektif',
    spectrum: 'skeptis',
    description: 'Fakta belum terang; masyarakat harus mengawal pembuktian di pengadilan.'
  }
};

export type ReactionType = keyof typeof REACTION_DEFINITIONS;

interface SentimentSpectrum {
  count: number;
  percentage: number;
}

interface SentimentData {
  total: number;
  counts: Record<string, number>;
  spectrum: {
    kecaman: SentimentSpectrum;
    pemakluman: SentimentSpectrum;
    skeptis: SentimentSpectrum;
  };
  badge: {
    type: 'kecaman' | 'pemakluman' | 'skeptis' | 'netral';
    label: string;
  };
  userReaction: string | null;
  definitions: Record<string, ReactionDefinition>;
}

interface CaseReactionsSectionProps {
  caseId: string;
  caseTitle?: string;
  embedded?: boolean;
  onClose?: () => void;
  onCountChange?: (count: number) => void;
}

export const CaseReactionsSection: React.FC<CaseReactionsSectionProps> = ({
  caseId,
  caseTitle,
  embedded = false,
  onClose,
  onCountChange
}) => {
  const [data, setData] = useState<SentimentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [pendingReaction, setPendingReaction] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'kecaman' | 'pemakluman' | 'skeptis'>('all');

  useEffect(() => {
    fetchReactions();

    const handleAuthChange = () => {
      fetchReactions();
    };
    window.addEventListener('lki_citizen_auth_change', handleAuthChange);
    return () => window.removeEventListener('lki_citizen_auth_change', handleAuthChange);
  }, [caseId]);

  const fetchReactions = async () => {
    try {
      const token = localStorage.getItem('lki_citizen_token');
      const res = await fetch(`/api/reactions/case/${caseId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const json = await res.json();
        setData(json.data);
        if (json.data?.total !== undefined && onCountChange) {
          onCountChange(json.data.total);
        }
      }
    } catch (err) {
      console.error('Error fetching reactions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (reactionType: string) => {
    const token = localStorage.getItem('lki_citizen_token');
    if (!token) {
      setPendingReaction(reactionType);
      setAuthModalOpen(true);
      return;
    }

    sound.playPop();
    setSubmitting(true);
    try {
      const res = await fetch(`/api/reactions/case/${caseId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ reaction_type: reactionType })
      });
      if (res.status === 401 || res.status === 403) {
        localStorage.removeItem('lki_citizen_token');
        localStorage.removeItem('lki_citizen_user');
        setPendingReaction(reactionType);
        setAuthModalOpen(true);
        return;
      }
      if (res.ok) {
        const json = await res.json();
        setData(json.data);
        if (json.data?.total !== undefined && onCountChange) {
          onCountChange(json.data.total);
        }
        sound.playSuccess();
      } else {
        const errJson = await res.json().catch(() => null);
        console.error('Failed to submit reaction:', errJson?.error);
        sound.playError();
      }
    } catch (err) {
      console.error('Error submitting reaction:', err);
      sound.playError();
    } finally {
      setSubmitting(false);
    }
  };

  const handleAuthSuccess = () => {
    if (pendingReaction) {
      handleVote(pendingReaction);
      setPendingReaction(null);
    }
  };

  if (loading) {
    return (
      <div className="p-6 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
        <span className="w-4 h-4 border-2 border-amber-600 border-t-transparent rounded-full animate-spin"></span>
        <span>Memuat barometer suara warga...</span>
      </div>
    );
  }

  if (!data) return null;

  const { total, counts, spectrum, badge, userReaction, definitions } = data;

  const reactionKeys = Object.keys(definitions || {});
  const filteredKeys = activeFilter === 'all' 
    ? reactionKeys 
    : reactionKeys.filter(k => definitions[k]?.spectrum === activeFilter);

  const content = (
    <div className="space-y-4">
      {/* Header Barometer */}
      <div className="flex items-center justify-between gap-2 pb-3 border-b border-dashed border-[#DFD3BA]">
        <div className="space-y-0.5 min-w-0">
          <div className="flex items-center gap-1.5">
            <BarChart3 className="w-4 h-4 text-amber-700 shrink-0" />
            <h3 className="font-hand font-bold text-base sm:text-lg text-[#1E293B] truncate">
              Barometer Suara Warga
            </h3>
          </div>
          <p className="text-[11px] text-[#78716C] leading-snug">
            Total {total} partisipasi suara masyarakat.
          </p>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Badge Sentimen */}
          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1 shadow-2xs ${
            badge.type === 'pemakluman'
              ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
              : badge.type === 'kecaman'
              ? 'bg-rose-100 text-rose-900 border border-rose-300'
              : badge.type === 'skeptis'
              ? 'bg-amber-100 text-amber-900 border border-amber-300'
              : 'bg-slate-100 text-slate-800 border border-slate-300'
          }`}>
            <SpectrumIcon spectrum={badge.type} className="w-3 h-3" />
            <span>{stripLeadingEmoji(badge.label)}</span>
          </span>

          {embedded && onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Tutup Panel Reaksi"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Bar Persentase Spektrum Visual (3 Segments) */}
      <div className="space-y-2.5 bg-slate-50/70 border border-slate-200/80 p-3 rounded-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-xs sm:text-sm font-bold text-[#44403C]">
          <span className="flex items-center gap-1.5 text-rose-700">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span>
            <span>Kecaman: {spectrum.kecaman.percentage}% ({spectrum.kecaman.count})</span>
          </span>
          <span className="flex items-center gap-1.5 text-emerald-700">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
            <span>Didukung: {spectrum.pemakluman.percentage}% ({spectrum.pemakluman.count})</span>
          </span>
          <span className="flex items-center gap-1.5 text-amber-700">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
            <span>Kawal: {spectrum.skeptis.percentage}% ({spectrum.skeptis.count})</span>
          </span>
        </div>

        {/* The Multi-Segment Bar */}
        <div className="w-full h-4.5 bg-slate-200/70 rounded-xl overflow-hidden flex border border-[#CBD5E1] shadow-inner">
          <div 
            style={{ width: `${spectrum.kecaman.percentage}%` }} 
            className="bg-rose-500 transition-all duration-500" 
            title={`Kecaman Rakyat: ${spectrum.kecaman.percentage}%`}
          />
          <div 
            style={{ width: `${spectrum.pemakluman.percentage}%` }} 
            className="bg-emerald-500 transition-all duration-500" 
            title={`Pemakluman / Didukung: ${spectrum.pemakluman.percentage}%`}
          />
          <div 
            style={{ width: `${spectrum.skeptis.percentage}%` }} 
            className="bg-amber-400 transition-all duration-500" 
            title={`Tebang Pilih / Kawal: ${spectrum.skeptis.percentage}%`}
          />
        </div>

        {userReaction && (
          <div className="text-xs text-amber-900 font-bold bg-amber-100/70 border border-amber-300 rounded-xl px-3 py-1.5 flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Pilihan Anda:</span>
            <ReactionIcon type={userReaction} className="w-3.5 h-3.5 text-amber-800" />
            <span>{definitions[userReaction]?.label}</span>
          </div>
        )}
      </div>

      {/* Filter Spektrum Reaksi */}
      <div className="flex flex-wrap items-center gap-1.5 pt-1">
        <button
          type="button"
          onClick={() => setActiveFilter('all')}
          className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeFilter === 'all' 
              ? 'bg-slate-800 text-white shadow-xs' 
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          Semua
        </button>
        <button
          type="button"
          onClick={() => setActiveFilter('pemakluman')}
          className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5 ${
            activeFilter === 'pemakluman' 
              ? 'bg-emerald-700 text-white shadow-xs' 
              : 'bg-emerald-50 border border-emerald-200 text-emerald-800 hover:bg-emerald-100'
          }`}
        >
          <SpectrumIcon spectrum="pemakluman" className="w-3.5 h-3.5" />
          <span>Pemakluman</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveFilter('kecaman')}
          className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5 ${
            activeFilter === 'kecaman' 
              ? 'bg-rose-700 text-white shadow-xs' 
              : 'bg-rose-50 border border-rose-200 text-rose-800 hover:bg-rose-100'
          }`}
        >
          <SpectrumIcon spectrum="kecaman" className="w-3.5 h-3.5" />
          <span>Kecaman</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveFilter('skeptis')}
          className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5 ${
            activeFilter === 'skeptis' 
              ? 'bg-amber-600 text-white shadow-xs' 
              : 'bg-amber-50 border border-amber-200 text-amber-800 hover:bg-amber-100'
          }`}
        >
          <SpectrumIcon spectrum="skeptis" className="w-3.5 h-3.5" />
          <span>Kawal</span>
        </button>
      </div>

      {/* Papan Tombol Reaksi Interaktif */}
      <div className={`grid gap-2.5 pt-1.5 ${embedded ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'}`}>
        {filteredKeys.map(key => {
          const def = definitions[key];
          if (!def) return null;
          const count = counts[key] || 0;
          const isSelected = userReaction === key;

          return (
            <button
              key={key}
              type="button"
              onClick={() => handleVote(key)}
              disabled={submitting}
              className={`p-3.5 rounded-2xl border-2 text-left transition-all relative flex flex-col justify-between cursor-pointer group/card ${
                isSelected
                  ? 'border-amber-500 bg-amber-50 ring-2 ring-amber-400/50 shadow-sm'
                  : def.spectrum === 'pemakluman'
                  ? 'border-emerald-200 bg-white hover:border-emerald-400 hover:bg-emerald-50/40'
                  : def.spectrum === 'kecaman'
                  ? 'border-rose-200 bg-white hover:border-rose-400 hover:bg-rose-50/40'
                  : 'border-amber-200 bg-white hover:border-amber-400 hover:bg-amber-50/40'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-1 mb-1.5">
                  <span className="transition-transform group-hover/card:scale-110">
                    <ReactionIcon type={key} className="w-5 h-5" withBadge />
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold font-mono ${
                    isSelected 
                      ? 'bg-amber-500 text-white' 
                      : 'bg-slate-100 text-slate-700'
                  }`}>
                    {count}
                  </span>
                </div>

                <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                  {def.label}
                </h4>
                <p className="text-[11px] sm:text-xs text-slate-600 leading-relaxed mt-1 line-clamp-2">
                  {def.description}
                </p>
              </div>

              {isSelected && (
                <span className="text-[9px] font-bold text-amber-800 mt-1.5 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3 text-amber-600" />
                  <span>Pilihan Anda</span>
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className={embedded ? 'w-full' : 'space-y-4 pt-1'}>
      {embedded ? (
        content
      ) : (
        <div className="bg-[#FFFDF9] border-2 border-[#E7DECB] rounded-3xl p-4 sm:p-6 shadow-sm">
          {content}
        </div>
      )}

      {/* Citizen Auth Modal Triggered When Needed */}
      <CitizenAuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
        initialMode="login"
        contextMessage="Masuk dengan Akun Google atau verifikasi email Anda untuk memberikan reaksi sentimen pada kasus ini."
      />
    </div>
  );
};
