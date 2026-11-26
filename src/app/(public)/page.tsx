import React from 'react';
import Link from 'next/link';
import { ArrowRight, Gavel, Map, Search, Trophy, ShieldAlert, Scale } from 'lucide-react';
import { queryCases, queryStatsOverview } from '@/server/queries';
import { formatDateId, formatRupiah } from '@/lib/formatters';
import { LegalStatusStamp } from '@/components/LegalStatusStamp';

export const revalidate = 300;

export default async function HomePage() {
  const [stats, recentCases] = await Promise.all([
    queryStatsOverview(),
    queryCases({ sort: 'date', order: 'desc', limit: 6, page: 1 }),
  ]);

  return (
    <div className="space-y-10">
      {/* Hero Dossier Header */}
      <section className="archival-card washi-tape p-6 sm:p-8 space-y-6">
        <div className="max-w-3xl space-y-3">
          <span className="inline-block rounded-full border border-red-300 bg-red-50 px-3 py-1 text-xs font-bold text-red-900">
            Arsip Terverifikasi 1945 – 2026 • Lintas 10 Era Pemerintahan
          </span>
          <h1 className="font-hand text-4xl sm:text-5xl font-bold tracking-tight text-stone-900 leading-tight">
            Portal Transparansi & Rekam Jejak Perkara Korupsi Indonesia
          </h1>
          <p className="text-base text-stone-700 leading-relaxed">
            Mengemas dokumen putusan pengadilan, audit BPK/BPKP, dan rilis penegak hukum ke dalam klasemen terstruktur, peta 38 provinsi, serta rincian finansial <strong>anti double-counting</strong>.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/klasemen"
            className="inline-flex items-center gap-2 rounded-xl bg-stone-900 px-5 py-2.5 text-sm font-bold text-white hover:bg-stone-800 transition"
          >
            <Trophy className="w-4 h-4 text-amber-400" />
            Lihat Klasemen Liga
          </Link>
          <Link
            href="/peta"
            className="inline-flex items-center gap-2 rounded-xl border-2 border-stone-900 bg-white px-5 py-2.5 text-sm font-bold text-stone-900 hover:bg-stone-100 transition"
          >
            <Map className="w-4 h-4 text-red-700" />
            Jelajahi Peta 38 Provinsi
          </Link>
          <Link
            href="/cari"
            className="inline-flex items-center gap-2 rounded-xl border border-stone-300 bg-[#F3EDE0] px-5 py-2.5 text-sm font-bold text-stone-800 hover:bg-stone-200 transition"
          >
            <Search className="w-4 h-4" />
            Cari Berkas Perkara
          </Link>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          <div className="rounded-xl border border-stone-200 bg-[#FBF8F1] p-4">
            <p className="text-xs font-semibold text-stone-600">Total Perkara Terkurasi</p>
            <p className="mt-1 font-mono text-3xl font-bold text-stone-900 tabular-nums">
              {stats.total_cases}
            </p>
            <p className="mt-1 text-[11px] text-stone-500">
              {stats.inkrah_count} inkrah • {stats.non_inkrah_count} proses hukum • {stats.acquitted_count} bebas/lepas
            </p>
          </div>

          <div className="rounded-xl border border-red-200 bg-red-50/70 p-4">
            <p className="text-xs font-semibold text-red-900">Akumulasi Kerugian Tercatat</p>
            <p className="mt-1 font-mono text-2xl font-bold text-red-800 tabular-nums">
              {formatRupiah(stats.total_loss_accumulated, { compact: true })}
            </p>
            <p className="mt-1 text-[11px] text-red-800/80">
              Vonis & Audit BPK/BPKP (tanpa nilai proyek)
            </p>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4">
            <p className="text-xs font-semibold text-amber-900">Suap & Gratifikasi Terpisah</p>
            <p className="mt-1 font-mono text-2xl font-bold text-amber-800 tabular-nums">
              {formatRupiah(stats.total_bribe_accumulated, { compact: true })}
            </p>
            <p className="mt-1 text-[11px] text-amber-800/80">
              Dicatat terpisah dari kerugian keuangan negara
            </p>
          </div>

          <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4">
            <p className="text-xs font-semibold text-emerald-900">Pemulihan Aset & Pengganti</p>
            <p className="mt-1 font-mono text-2xl font-bold text-emerald-800 tabular-nums">
              {formatRupiah(stats.total_recovery_accumulated, { compact: true })}
            </p>
            <p className="mt-1 text-[11px] text-emerald-800/80">
              Rasio pemulihan tercatat: {stats.asset_recovery_rate}%
            </p>
          </div>
        </div>
      </section>

      {/* Hall of Shame (Strictly Divonis Inkrah) */}
      <section aria-labelledby="hall-of-shame-heading" className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-red-700">
              <Gavel className="w-4 h-4" />
              Khusus Putusan Berkekuatan Hukum Tetap (Inkrah)
            </div>
            <h2 id="hall-of-shame-heading" className="font-hand text-3xl font-bold text-stone-900">
              Peringkat Teratas Kerugian Negara (Vonis Inkrah)
            </h2>
          </div>
          <Link
            href="/klasemen"
            className="inline-flex items-center gap-1 text-sm font-bold text-red-800 hover:underline"
          >
            Klasemen Lengkap <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {stats.hall_of_shame.slice(0, 6).map((item, idx) => (
            <Link
              key={item.id}
              href={`/kasus/${item.slug}`}
              className="archival-card p-4 hover:border-red-700 transition flex items-start gap-4"
            >
              <div className="h-10 w-10 shrink-0 rounded-lg bg-stone-900 text-white font-mono text-base font-bold flex items-center justify-center tabular-nums">
                #{idx + 1}
              </div>
              <div className="flex-1 min-w-0 space-y-1.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <LegalStatusStamp status={item.current_legal_status} compact />
                  <span className="font-mono text-sm font-bold text-red-800 tabular-nums">
                    {formatRupiah(item.display_loss_amount, { compact: true })}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-stone-900 line-clamp-2">{item.case_title}</h3>
                <p className="text-xs text-stone-600">
                  {item.province_name || 'Nasional'} • {item.era_name} • {item.display_loss_basis}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Recent / Ongoing Cases with Presumption of Innocence Note */}
      <section aria-labelledby="recent-cases-heading" className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-800">
              <Scale className="w-4 h-4" />
              Pembaruan Arsip Terkini
            </div>
            <h2 id="recent-cases-heading" className="font-hand text-3xl font-bold text-stone-900">
              Perkara Terbaru dalam Pemantauan
            </h2>
          </div>
          <Link href="/cari" className="inline-flex items-center gap-1 text-sm font-bold text-stone-900 hover:underline">
            Eksplorasi Semua ({stats.total_cases}) <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {recentCases.items.map((c) => (
            <Link
              key={c.id}
              href={`/kasus/${c.slug}`}
              className="archival-card p-4 hover:border-amber-700 transition flex flex-col justify-between gap-3"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <LegalStatusStamp status={c.current_legal_status} compact />
                  <span className="font-mono text-xs text-stone-500">{formatDateId(c.case_date)}</span>
                </div>
                <h3 className="text-sm font-bold text-stone-900 line-clamp-2">{c.case_title}</h3>
                <p className="text-xs text-stone-600 line-clamp-3">{c.summary}</p>
              </div>
              <div className="border-t border-stone-200 pt-2.5 flex items-center justify-between text-xs">
                <span className="text-stone-600 truncate max-w-[140px]">{c.province_name}</span>
                <span className="font-mono font-bold text-stone-900 tabular-nums">
                  {c.display_loss_amount > 0
                    ? formatRupiah(c.display_loss_amount, { compact: true })
                    : formatRupiah(c.display_bribe_amount, { compact: true })}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Civic Participation Callout */}
      <section className="stitched-panel p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-red-800 uppercase">
            <ShieldAlert className="w-4 h-4" /> Koreksi Data & Hak Jawab
          </div>
          <h2 className="font-hand text-2xl font-bold text-stone-900">
            Temukan Putusan Kasasi/PK Terbaru atau Kekeliruan Fakta?
          </h2>
          <p className="text-xs text-stone-600 max-w-2xl">
            Ajukan pembaruan berkas perkara, usulan kasus baru dengan tautan resmi, atau Hak Jawab sesuai UU Pers dan UU Kekuasaan Kehakiman. Setiap pengajuan mendapat kode tiket pelacakan publik.
          </p>
        </div>
        <Link
          href="/lapor"
          className="shrink-0 rounded-xl bg-red-700 px-5 py-3 text-sm font-bold text-white hover:bg-red-800 transition"
        >
          Buka Kanal Lapor / Hak Jawab
        </Link>
      </section>
    </div>
  );
}
