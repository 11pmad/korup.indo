import React from 'react';
import Link from 'next/link';
import { Scale } from 'lucide-react';

interface AnnouncementConfig {
  title?: string;
  badge?: string;
  main_text?: string;
  sub_text?: string;
  is_active?: boolean;
}

export function DisclaimerBanner({ announcement }: { announcement?: AnnouncementConfig | null }) {
  const active = announcement?.is_active !== false;
  if (!active) return null;

  return (
    <aside
      aria-label="Pemberitahuan Asas Hukum Praduga Tak Bersalah"
      className="rounded-xl border-2 border-amber-700/30 bg-[#FFFBEB] px-4 py-3.5 text-stone-800 shadow-xs"
    >
      <div className="flex flex-col sm:flex-row sm:items-start gap-3">
        <div className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-800 border border-amber-300">
          <Scale className="h-4 w-4" aria-hidden="true" />
        </div>
        <div className="flex-1 text-sm leading-relaxed">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="font-bold text-amber-950">
              {announcement?.title || 'Pemberitahuan Asas Hukum & Integritas Sumber Primer'}
            </span>
            <span className="inline-block rounded-full bg-amber-200/80 px-2.5 py-0.5 text-xs font-semibold text-amber-900">
              {announcement?.badge || 'Pasal 8 ayat (1) UU No. 48/2009'}
            </span>
          </div>
          <p className="text-stone-700">
            {announcement?.main_text ||
              'Setiap orang yang disangka, dituntut, atau dihadapkan di depan pengadilan wajib dianggap tidak bersalah sebelum ada putusan pengadilan berkekuatan hukum tetap (inkrah).'}
          </p>
          <p className="mt-1 text-xs text-stone-600">
            {announcement?.sub_text ||
              'Angka kerugian negara, audit BPK/BPKP, nilai proyek, dan suap dipisahkan secara ketat (Anti Double-Counting).'}{' '}
            <Link href="/lapor?type=hak_jawab" className="font-semibold text-amber-900 underline underline-offset-2 hover:text-amber-700">
              Ajukan Koreksi / Hak Jawab
            </Link>
          </p>
        </div>
      </div>
    </aside>
  );
}
