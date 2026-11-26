"use client";

import React from 'react';
import {
  Flame,
  Banknote,
  ShieldOff,
  Handshake,
  Lightbulb,
  HeartHandshake,
  Scale,
  Eye,
  Trophy,
  Award,
  Medal,
  HardHat,
  Package,
  Briefcase,
  Trees,
  Landmark,
  FolderOpen,
  Building2,
  Calendar,
  Crown,
  ShieldCheck,
  PenLine,
  MessageSquare,
  Search,
  Pickaxe
} from 'lucide-react';

/**
 * Strip leading Unicode emojis/pictographs from dynamic DB strings (e.g. announcement/donation titles)
 * so legacy stored titles render cleanly next to themed vector icons.
 */
export function stripLeadingEmoji(text?: string | null): string {
  if (!text) return '';
  return text
    .replace(/^[\p{Extended_Pictographic}\u2600-\u27BF\uFE0F\u200D]+\s*/gu, '')
    .trim();
}

/**
 * Merah-Putih emblem matching LKI's court-document stamp aesthetic (public/favicon.svg).
 */
export const FlagIdIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-3.5' }) => (
  <svg
    viewBox="0 0 20 16"
    className={`inline-block shrink-0 ${className}`}
    aria-hidden="true"
  >
    <path d="M1 1 L19 1 C19.5 1, 19.5 1.5, 19.5 2 L19.5 8 L0.5 8 L0.5 2 C0.5 1.5, 0.5 1, 1 1 Z" fill="#DC2626" />
    <path d="M0.5 8 L19.5 8 L19.5 14 C19.5 14.5, 19.5 15, 19 15 L1 15 C0.5 15, 0.5 14.5, 0.5 14 Z" fill="#FFFFFF" />
    <rect x="0.75" y="0.75" width="18.5" height="14.5" rx="2.5" fill="none" stroke="#991B1B" strokeWidth="1.2" />
  </svg>
);

/**
 * Top-3 leaderboard/podium rank icon matching LKI's warm scrapbook palette.
 */
export const MedalBadge: React.FC<{ rank: number; className?: string }> = ({
  rank,
  className = 'w-4 h-4'
}) => {
  if (rank === 0) {
    return (
      <span className="inline-flex items-center justify-center p-1 rounded-lg bg-amber-100 border border-amber-400 text-amber-700 shadow-2xs" title="Peringkat 1">
        <Trophy className={className} />
      </span>
    );
  }
  if (rank === 1) {
    return (
      <span className="inline-flex items-center justify-center p-1 rounded-lg bg-slate-100 border border-slate-300 text-slate-600 shadow-2xs" title="Peringkat 2">
        <Medal className={className} />
      </span>
    );
  }
  return (
    <span className="inline-flex items-center justify-center p-1 rounded-lg bg-orange-100 border border-orange-300 text-orange-800 shadow-2xs" title="Peringkat 3">
      <Award className={className} />
    </span>
  );
};

/**
 * Citizen reaction icon mapped by reaction key.
 */
export const ReactionIcon: React.FC<{
  type?: string | null;
  className?: string;
  withBadge?: boolean;
}> = ({ type, className = 'w-4 h-4', withBadge = false }) => {
  let Icon = Scale;
  let tone = 'text-amber-700 bg-amber-100 border-amber-300';

  switch (type) {
    case 'geram':
      Icon = Flame;
      tone = 'text-rose-700 bg-rose-100 border-rose-300';
      break;
    case 'rampok':
      Icon = Banknote;
      tone = 'text-rose-700 bg-rose-100 border-rose-300';
      break;
    case 'memalukan':
      Icon = ShieldOff;
      tone = 'text-rose-800 bg-rose-100 border-rose-300';
      break;
    case 'didukung':
      Icon = Handshake;
      tone = 'text-emerald-700 bg-emerald-100 border-emerald-300';
      break;
    case 'khilaf_administrasi':
      Icon = Lightbulb;
      tone = 'text-emerald-700 bg-emerald-100 border-emerald-300';
      break;
    case 'dimaklumi':
      Icon = HeartHandshake;
      tone = 'text-emerald-700 bg-emerald-100 border-emerald-300';
      break;
    case 'tebang_pilih':
      Icon = Scale;
      tone = 'text-amber-800 bg-amber-100 border-amber-300';
      break;
    case 'kawal_sidang':
      Icon = Eye;
      tone = 'text-amber-800 bg-amber-100 border-amber-300';
      break;
  }

  if (withBadge) {
    return (
      <span className={`inline-flex items-center justify-center p-2 rounded-xl border ${tone} shrink-0`}>
        <Icon className={className} />
      </span>
    );
  }

  return <Icon className={`inline-block shrink-0 ${className}`} />;
};

/**
 * Sentiment spectrum icon ('kecaman' | 'pemakluman' | 'skeptis' | 'netral').
 */
export const SpectrumIcon: React.FC<{
  spectrum?: string | null;
  className?: string;
}> = ({ spectrum, className = 'w-3.5 h-3.5' }) => {
  if (spectrum === 'kecaman') return <Flame className={`inline-block shrink-0 ${className}`} />;
  if (spectrum === 'pemakluman') return <Handshake className={`inline-block shrink-0 ${className}`} />;
  return <Scale className={`inline-block shrink-0 ${className}`} />;
};

/**
 * Corruption modus/sector & analytics drilldown category icon.
 */
export const SectorIcon: React.FC<{
  sector?: string | null;
  className?: string;
}> = ({ sector, className = 'w-4 h-4' }) => {
  const s = (sector || '').toLowerCase();
  if (s.includes('pengadaan') || s === 'hard-hat') {
    return <HardHat className={`inline-block shrink-0 ${className}`} />;
  }
  if (s.includes('bansos') || s.includes('bencana') || s === 'package') {
    return <Package className={`inline-block shrink-0 ${className}`} />;
  }
  if (s.includes('suap') || s.includes('gratifikasi') || s === 'handshake') {
    return <Handshake className={`inline-block shrink-0 ${className}`} />;
  }
  if (s.includes('tambang')) {
    return <Pickaxe className={`inline-block shrink-0 ${className}`} />;
  }
  if (s.includes('lahan') || s.includes('sda') || s === 'trees') {
    return <Trees className={`inline-block shrink-0 ${className}`} />;
  }
  if (s.includes('anggaran') || s.includes('instansi') || s === 'landmark') {
    return <Landmark className={`inline-block shrink-0 ${className}`} />;
  }
  if (s.includes('peradilan') || s.includes('status') || s === 'scale') {
    return <Scale className={`inline-block shrink-0 ${className}`} />;
  }
  if (s.includes('korporasi') || s === 'building') {
    return <Building2 className={`inline-block shrink-0 ${className}`} />;
  }
  if (s.includes('tahun') || s === 'calendar') {
    return <Calendar className={`inline-block shrink-0 ${className}`} />;
  }
  if (s === 'folder') {
    return <FolderOpen className={`inline-block shrink-0 ${className}`} />;
  }
  return <Briefcase className={`inline-block shrink-0 ${className}`} />;
};

/**
 * Admin staff role icon.
 */
export const RoleIcon: React.FC<{
  role?: string | null;
  className?: string;
}> = ({ role, className = 'w-3.5 h-3.5' }) => {
  switch (role) {
    case 'super_admin':
      return <Crown className={`inline-block shrink-0 ${className}`} />;
    case 'admin':
      return <ShieldCheck className={`inline-block shrink-0 ${className}`} />;
    case 'editor':
      return <PenLine className={`inline-block shrink-0 ${className}`} />;
    case 'moderator':
      return <MessageSquare className={`inline-block shrink-0 ${className}`} />;
    case 'auditor':
    case 'viewer':
    default:
      return <Search className={`inline-block shrink-0 ${className}`} />;
  }
};
