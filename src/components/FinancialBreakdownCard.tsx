import React from 'react';
import { formatRupiah } from '@/lib/formatters';
import { Info } from 'lucide-react';

interface FinancialRecordItem {
  id: string;
  financial_type: string;
  amount: number;
  currency: string;
  financial_year: number | null;
  financial_description: string;
  fact_classification: string;
  source_page: string | null;
  source_title: string | null;
  source_url: string | null;
}

const TYPE_LABELS: Record<string, { label: string; group: 'loss' | 'bribe' | 'recovery' | 'context' }> = {
  court_recognized_loss_amount: { label: 'Kerugian Negara (Putusan Pengadilan)', group: 'loss' },
  audit_loss_amount: { label: 'Kerugian Negara (Audit Resmi BPK/BPKP)', group: 'loss' },
  prosecutor_loss_amount: { label: 'Kerugian Versi Dakwaan/Tuntutan Jaksa', group: 'loss' },
  alleged_loss_amount: { label: 'Dugaan Kerugian Awal Penyidik', group: 'loss' },
  estimated_loss_amount: { label: 'Taksiran Kerugian Penyidikan', group: 'loss' },
  bribe_amount: { label: 'Nilai Suap Terbukti/Terkait', group: 'bribe' },
  gratification_amount: { label: 'Nilai Gratifikasi', group: 'bribe' },
  illegal_profit_amount: { label: 'Keuntungan Ilegal / Pemerasan', group: 'bribe' },
  restitution_amount: { label: 'Uang Pengganti (Restitution)', group: 'recovery' },
  fine_amount: { label: 'Pidana Denda', group: 'recovery' },
  assets_seized_value: { label: 'Nilai Aset Disita Penyidik', group: 'recovery' },
  assets_recovered_value: { label: 'Nilai Aset Dipulihkan ke Kas Negara', group: 'recovery' },
  project_value: { label: 'Nilai Proyek (Konteks — Bukan Kerugian)', group: 'context' },
  contract_value: { label: 'Nilai Kontrak (Konteks — Bukan Kerugian)', group: 'context' },
};

export function FinancialBreakdownCard({
  displayLossAmount,
  displayLossBasis,
  displayBribeAmount,
  displayRecoveryAmount,
  records,
}: {
  displayLossAmount: number;
  displayLossBasis: string;
  displayBribeAmount: number;
  displayRecoveryAmount: number;
  records: FinancialRecordItem[];
}) {
  return (
    <section aria-labelledby="financial-breakdown-heading" className="archival-card p-5 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-200 pb-3">
        <div>
          <h2 id="financial-breakdown-heading" className="font-hand text-2xl font-bold text-stone-900">
            Rincian Finansial (Anti Double-Counting)
          </h2>
          <p className="text-xs text-stone-600">
            Kerugian negara, suap/gratifikasi, pemulihan aset, dan nilai proyek dipisahkan secara tegas dan tidak dijumlahkan silang.
          </p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-700 border border-stone-200">
          <Info className="w-3.5 h-3.5" aria-hidden="true" />
          Basis: {displayLossBasis}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-lg border border-red-200 bg-red-50/60 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-red-900">
            Kerugian Keuangan Negara
          </p>
          <p className="mt-1 font-mono text-2xl font-bold text-red-800 tabular-nums">
            {formatRupiah(displayLossAmount, { compact: true })}
          </p>
          <p className="mt-1 font-mono text-xs text-red-700/80 tabular-nums">
            {formatRupiah(displayLossAmount)}
          </p>
        </div>

        <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-900">
            Suap / Gratifikasi / Pemerasan
          </p>
          <p className="mt-1 font-mono text-2xl font-bold text-amber-800 tabular-nums">
            {formatRupiah(displayBribeAmount, { compact: true })}
          </p>
          <p className="mt-1 font-mono text-xs text-amber-700/80 tabular-nums">
            {formatRupiah(displayBribeAmount)}
          </p>
        </div>

        <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-900">
            Uang Pengganti, Denda & Aset Disita
          </p>
          <p className="mt-1 font-mono text-2xl font-bold text-emerald-800 tabular-nums">
            {formatRupiah(displayRecoveryAmount, { compact: true })}
          </p>
          <p className="mt-1 font-mono text-xs text-emerald-700/80 tabular-nums">
            {formatRupiah(displayRecoveryAmount)}
          </p>
        </div>
      </div>

      {records.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-stone-600">
            Catatan Terverifikasi per Pos Keuangan ({records.length})
          </h3>
          <div className="divide-y divide-stone-200 rounded-lg border border-stone-200 bg-[#FBF8F1]">
            {records.map((rec) => {
              const info = TYPE_LABELS[rec.financial_type] ?? {
                label: rec.financial_type,
                group: 'context',
              };
              return (
                <div key={rec.id} className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-stone-900">{info.label}</span>
                      <span className="rounded bg-stone-200/80 px-1.5 py-0.5 font-mono text-[11px] text-stone-700">
                        {rec.fact_classification}
                      </span>
                    </div>
                    <p className="text-xs text-stone-600 mt-0.5">{rec.financial_description}</p>
                    {rec.source_url && (
                      <a
                        href={rec.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block mt-1 text-xs font-medium text-amber-800 underline hover:text-amber-700"
                      >
                        Sumber: {rec.source_title || rec.source_url}
                        {rec.source_page ? ` (${rec.source_page})` : ''}
                      </a>
                    )}
                  </div>
                  <div className="font-mono text-sm font-bold text-stone-900 tabular-nums shrink-0">
                    {formatRupiah(rec.amount)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
