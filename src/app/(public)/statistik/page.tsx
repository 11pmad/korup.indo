import React from 'react';
import type { Metadata } from 'next';
import { queryStatsOverview } from '@/server/queries';
import { formatRupiah } from '@/lib/formatters';
import { StatsChartsClient } from '@/components/StatsChartsClient';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Statistik & Analitik Perkara Korupsi Nasional',
  description:
    'Analisis tren tahunan, sebaran 10 era kepresidenan, proporsi sektor korupsi, dan rasio pemulihan aset negara.',
};

export default async function StatistikPage() {
  const stats = await queryStatsOverview();

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="font-hand text-4xl font-bold text-stone-900">
          Statistik & Analitik Makro (1945–2026)
        </h1>
        <p className="text-sm text-stone-600">
          Seluruh metrik dihitung dengan pemisahan tegas antara kerugian negara terbukti/audit, nilai suap, serta pemulihan aset.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="archival-card p-4">
          <p className="text-xs font-semibold text-stone-600">Kerugian Negara (Vonis + Audit)</p>
          <p className="mt-1 font-mono text-2xl font-bold text-red-800 tabular-nums">
            {formatRupiah(stats.total_loss_accumulated, { compact: true })}
          </p>
        </div>
        <div className="archival-card p-4">
          <p className="text-xs font-semibold text-stone-600">Khusus Putusan Inkrah</p>
          <p className="mt-1 font-mono text-2xl font-bold text-stone-900 tabular-nums">
            {formatRupiah(stats.total_inkrah_loss, { compact: true })}
          </p>
        </div>
        <div className="archival-card p-4">
          <p className="text-xs font-semibold text-stone-600">Total Pemulihan Aset & Denda</p>
          <p className="mt-1 font-mono text-2xl font-bold text-emerald-800 tabular-nums">
            {formatRupiah(stats.total_recovery_accumulated, { compact: true })}
          </p>
        </div>
        <div className="archival-card p-4">
          <p className="text-xs font-semibold text-stone-600">Asset Recovery Rate</p>
          <p className="mt-1 font-mono text-2xl font-bold text-stone-900 tabular-nums">
            {stats.asset_recovery_rate}%
          </p>
        </div>
      </div>

      <StatsChartsClient
        trends={stats.trends_by_year}
        eras={stats.by_era}
        sectors={stats.by_sector}
      />
    </div>
  );
}
