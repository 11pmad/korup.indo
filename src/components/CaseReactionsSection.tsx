import React, { useState, useEffect } from 'react';
import { 
  Heart, 
  ShieldAlert, 
  HelpCircle, 
  CheckCircle, 
  AlertTriangle,
  Info,
  Scale,
  Sparkles
} from 'lucide-react';
import { sound } from '../utils/audio.js';
import { CitizenAuthModal } from './CitizenAuthModal.js';

export interface ReactionDefinition {
  emoji: string;
  label: string;
  spectrum: 'kecaman' | 'pemakluman' | 'skeptis';
  description: string;
}

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
}

export const CaseReactionsSection: React.FC<CaseReactionsSectionProps> = ({
  caseId,
  caseTitle
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
      if (res.ok) {
        const json = await res.json();
        setData(json.data);
        sound.playSuccess();
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
      <div className="p-6 bg-[#FAF6EC] border border-[#EBE1CD] rounded-2xl animate-pulse text-center text-xs text-slate-500">
        Memuat barometer sentimen masyarakat...
      </div>
    );
  }

  if (!data) return null;

  const { total, counts, spectrum, badge, userReaction, definitions } = data;

  const reactionKeys = Object.keys(definitions || {}) as Array<keyof typeof definitions>;
  const filteredKeys = activeFilter === 'all' 
    ? reactionKeys 
    : reactionKeys.filter(k => definitions[k]?.spectrum === activeFilter);

  return (
    <div className="space-y-4 pt-1">
      {/* Container Barometer */}
      <div className="bg-[#FFFDF9] border-2 border-[#E7DECB] rounded-3xl p-4 sm:p-6 shadow-sm space-y-4">
        
        {/* Header Barometer */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-dashed border-[#DFD3BA]">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-base">📊</span>
              <h3 className="font-hand font-bold text-base sm:text-lg text-[#1E293B]">
                Barometer Sentimen &amp; Sikap Masyarakat
              </h3>
            </div>
            <p className="text-xs text-[#78716C]">
              Apakah publik mengecam keras tindakan ini atau memaklumi karena konteks dinas / nihil niat korupsi?
            </p>
          </div>

          {/* Badge Sentimen */}
          <div className="self-start sm:self-auto">
            <span className={`px-3 py-1.5 rounded-full text-xs font-bold inline-flex items-center gap-1.5 shadow-2xs ${
              badge.type === 'pemakluman'
                ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                : badge.type === 'kecaman'
                ? 'bg-rose-100 text-rose-900 border border-rose-300 animate-pulse'
                : badge.type === 'skeptis'
                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                : 'bg-slate-100 text-slate-800 border border-slate-300'
            }`}>
              <span>{badge.label}</span>
            </span>
          </div>
        </div>

        {/* Bar Persentase Spektrum Visual (3 Segments) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-[#44403C]">
            <span className="flex items-center gap-1 text-rose-700">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span>
              <span>Kecaman Rakyat: {spectrum.kecaman.percentage}% ({spectrum.kecaman.count})</span>
            </span>
            <span className="flex items-center gap-1 text-emerald-700">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
              <span>Pemakluman / Niat Baik: {spectrum.pemakluman.percentage}% ({spectrum.pemakluman.count})</span>
            </span>
            <span className="flex items-center gap-1 text-amber-700">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
              <span>Tebang Pilih / Kawal: {spectrum.skeptis.percentage}% ({spectrum.skeptis.count})</span>
            </span>
          </div>

          {/* The Multi-Segment Bar */}
          <div className="w-full h-3.5 bg-slate-100 rounded-full overflow-hidden flex border border-[#CBD5E1] shadow-inner">
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

          <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono pt-0.5">
            <span>Total Partisipasi: <strong>{total}</strong> suara warga</span>
            {userReaction && (
              <span className="text-[#854D0E] font-sans font-bold">
                ✓ Reaksi Anda: {definitions[userReaction]?.emoji} {definitions[userReaction]?.label}
              </span>
            )}
          </div>
        </div>

        {/* Filter Spektrum Reaksi */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-xs font-bold text-slate-600 mr-1">Tampilkan Pilihan:</span>
          <button
            type="button"
            onClick={() => setActiveFilter('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeFilter === 'all' 
                ? 'bg-slate-800 text-white shadow-xs' 
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Semua (8 Reaksi)
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('pemakluman')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeFilter === 'pemakluman' 
                ? 'bg-emerald-700 text-white shadow-xs' 
                : 'bg-emerald-50 border border-emerald-200 text-emerald-800 hover:bg-emerald-100'
            }`}
          >
            🤝 Pemakluman / Niat Baik
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('kecaman')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeFilter === 'kecaman' 
                ? 'bg-rose-700 text-white shadow-xs' 
                : 'bg-rose-50 border border-rose-200 text-rose-800 hover:bg-rose-100'
            }`}
          >
            😡 Kecaman / Amarah
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('skeptis')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeFilter === 'skeptis' 
                ? 'bg-amber-600 text-white shadow-xs' 
                : 'bg-amber-50 border border-amber-200 text-amber-800 hover:bg-amber-100'
            }`}
          >
            ⚖️ Tebang Pilih / Kawal
          </button>
        </div>

        {/* Papan 8 Tombol Reaksi Interaktif */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
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
                className={`p-3 rounded-2xl border text-left transition-all relative flex flex-col justify-between cursor-pointer group/card ${
                  isSelected
                    ? 'border-amber-500 bg-amber-50/80 ring-2 ring-amber-400/50 shadow-sm'
                    : def.spectrum === 'pemakluman'
                    ? 'border-emerald-200 bg-white hover:border-emerald-400 hover:bg-emerald-50/30'
                    : def.spectrum === 'kecaman'
                    ? 'border-rose-200 bg-white hover:border-rose-400 hover:bg-rose-50/30'
                    : 'border-amber-200 bg-white hover:border-amber-400 hover:bg-amber-50/30'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-2xl transition-transform group-hover/card:scale-120">
                      {def.emoji}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold font-mono ${
                      isSelected 
                        ? 'bg-amber-500 text-white' 
                        : 'bg-slate-100 text-slate-700'
                    }`}>
                      {count}
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-slate-900 leading-snug">
                    {def.label}
                  </h4>
                  <p className="text-[10px] text-slate-500 leading-tight mt-1">
                    {def.description}
                  </p>
                </div>

                {isSelected && (
                  <span className="text-[10px] font-bold text-amber-800 mt-2 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3 text-amber-600" />
                    <span>Pilihan Anda</span>
                  </span>
                )}
              </button>
            );
          })}
        </div>

      </div>

      {/* Citizen Auth Modal Triggered When Needed */}
      <CitizenAuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
        initialMode="quick"
        contextMessage="Pilih nama panggilan Anda untuk langsung mencatat reaksi pada kasus ini."
      />
    </div>
  );
};
