'use client';

import React, { useState } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { formatRupiah } from '@/lib/formatters';

interface TrendYear {
  year: number;
  cases: number;
  total_loss: number;
}

interface EraStat {
  id: string;
  name: string;
  cases: number;
  total_loss: number;
}

interface SectorStat {
  sector: string;
  label: string;
  cases: number;
  total_loss: number;
}

const SECTOR_COLORS = ['#B91C1C', '#EA580C', '#D97706', '#2563EB', '#0D9488', '#7C3AED', '#475569'];

export function StatsChartsClient({
  trends,
  eras,
  sectors,
}: {
  trends: TrendYear[];
  eras: EraStat[];
  sectors: SectorStat[];
}) {
  const [metric, setMetric] = useState<'combined' | 'cases_only' | 'loss_only'>('combined');

  const eraData = eras.map((e) => ({
    ...e,
    shortName: e.name
      .replace('Era Kemerdekaan & Orde Lama (1945 - 1966)', 'Orla (45-66)')
      .replace('Era Orde Baru (1966 - 1998)', 'Orba (66-98)')
      .replace('Reformasi Awal / B.J. Habibie', 'Habibie')
      .replace('Susilo Bambang Yudhoyono Periode I', 'SBY I')
      .replace('Susilo Bambang Yudhoyono Periode II', 'SBY II')
      .replace('Joko Widodo Periode I', 'Jokowi I')
      .replace('Joko Widodo Periode II', 'Jokowi II')
      .replace('Megawati Soekarnoputri', 'Megawati')
      .replace('Abdurrahman Wahid', 'Gus Dur')
      .replace('Prabowo Subianto', 'Prabowo'),
    lossTrillion: Number((e.total_loss / 1e12).toFixed(2)),
  }));

  const yearData = trends.map((t) => ({
    ...t,
    lossTrillion: Number((t.total_loss / 1e12).toFixed(2)),
  }));

  return (
    <div className="space-y-6">
      {/* Yearly Trend */}
      <section className="archival-card p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-hand text-2xl font-bold text-stone-900">
              Tren Historis Perkara & Kerugian Negara
            </h2>
            <p className="text-xs text-stone-600">
              Berdasarkan tahun perkara/penetapan dalam basis data terverifikasi (satuan Triliun Rupiah).
            </p>
          </div>
          <div className="flex items-center gap-1 rounded-lg bg-stone-100 p-1 border border-stone-200">
            {[
              { id: 'combined', label: 'Gabungan' },
              { id: 'cases_only', label: 'Volume Kasus' },
              { id: 'loss_only', label: 'Kerugian (T)' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setMetric(tab.id as any)}
                className={`rounded-md px-3 py-1 text-xs font-semibold transition ${
                  metric === tab.id ? 'bg-stone-900 text-white' : 'text-stone-700 hover:bg-stone-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={yearData} margin={{ top: 10, right: 16, left: 0, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E7E0D0" />
              <XAxis dataKey="year" tick={{ fontSize: 12, fill: '#57534E' }} />
              <YAxis yAxisId="left" tick={{ fontSize: 12, fill: '#57534E' }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12, fill: '#B91C1C' }} />
              <Tooltip
                formatter={(value: any, name: any) =>
                  name === 'lossTrillion'
                    ? [`Rp ${value} Triliun`, 'Kerugian Tercatat']
                    : [`${value} Perkara`, 'Jumlah Perkara']
                }
              />
              {(metric === 'combined' || metric === 'cases_only') && (
                <Bar yAxisId="left" dataKey="cases" name="cases" fill="#D97706" radius={[4, 4, 0, 0]} />
              )}
              {(metric === 'combined' || metric === 'loss_only') && (
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="lossTrillion"
                  name="lossTrillion"
                  stroke="#B91C1C"
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Era & Sector Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section className="lg:col-span-7 archival-card p-5 space-y-3">
          <div>
            <h2 className="font-hand text-2xl font-bold text-stone-900">
              Distribusi Lintas 10 Era Kepresidenan
            </h2>
            <p className="text-xs text-stone-600">
              Klasifikasi kronologis netral (1945–sekarang) berdasarkan tanggal peristiwa hukum utama.
            </p>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={eraData} margin={{ top: 10, right: 10, left: 0, bottom: 32 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E7E0D0" />
                <XAxis
                  dataKey="shortName"
                  angle={-25}
                  textAnchor="end"
                  interval={0}
                  tick={{ fontSize: 11, fill: '#57534E' }}
                />
                <YAxis tick={{ fontSize: 12, fill: '#57534E' }} />
                <Tooltip
                  formatter={(value: any, name: any) =>
                    name === 'cases' ? [`${value} Perkara`, 'Perkara'] : [`Rp ${value} T`, 'Kerugian']
                  }
                />
                <Bar dataKey="cases" fill="#1C1917" radius={[4, 4, 0, 0]} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="lg:col-span-5 archival-card p-5 space-y-3">
          <div>
            <h2 className="font-hand text-2xl font-bold text-stone-900">
              Proporsi Sektor & Modus Perkara
            </h2>
            <p className="text-xs text-stone-600">
              Sebaran klaster sektor berdasarkan berkas terverifikasi.
            </p>
          </div>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sectors}
                  dataKey="cases"
                  nameKey="label"
                  cx="50%"
                  cy="50%"
                  innerRadius={48}
                  outerRadius={82}
                  paddingAngle={2}
                >
                  {sectors.map((entry, idx) => (
                    <Cell key={entry.sector} fill={SECTOR_COLORS[idx % SECTOR_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any, _name: any, props: any) => [
                    `${val} perkara (${formatRupiah(props?.payload?.total_loss ?? 0, { compact: true })})`,
                    props?.payload?.label ?? '',
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="space-y-1.5 text-xs">
            {sectors.slice(0, 6).map((s, idx) => (
              <li key={s.sector} className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 text-stone-800 truncate">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: SECTOR_COLORS[idx % SECTOR_COLORS.length] }}
                  />
                  {s.label}
                </span>
                <span className="font-mono font-semibold text-stone-700 tabular-nums shrink-0">
                  {s.cases} kasus
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
