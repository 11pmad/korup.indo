import React from 'react';
import { Gavel, Scale, ShieldCheck, Archive } from 'lucide-react';
import { LEGAL_STATUS_META, LegalStatusValue } from '@/lib/formatters';

export function LegalStatusStamp({
  status,
  compact = false,
}: {
  status: string;
  compact?: boolean;
}) {
  const meta =
    LEGAL_STATUS_META[status as LegalStatusValue] ?? LEGAL_STATUS_META.status_tidak_diketahui;

  const palette =
    meta.tone === 'crimson'
      ? 'text-[#B91C1C] bg-[#FEF2F2] border-[#B91C1C]/70'
      : meta.tone === 'amber'
        ? 'text-[#B45309] bg-[#FFFBEB] border-[#B45309]/70'
        : meta.tone === 'emerald'
          ? 'text-[#15803D] bg-[#F0FDF4] border-[#15803D]/70'
          : 'text-[#475569] bg-[#F1F5F9] border-[#475569]/60';

  const Icon =
    meta.tone === 'crimson'
      ? Gavel
      : meta.tone === 'amber'
        ? Scale
        : meta.tone === 'emerald'
          ? ShieldCheck
          : Archive;

  return (
    <span
      title={meta.description}
      className={`judicial-stamp ${palette} ${
        compact ? 'px-2 py-0.5 text-xs font-bold' : 'px-3 py-1 text-sm font-bold'
      }`}
    >
      <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
      <span>{compact ? meta.shortLabel : meta.label}</span>
    </span>
  );
}
