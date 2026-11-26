import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Search } from 'lucide-react';
import { queryCases } from '@/server/queries';
import { CANONICAL_PROVINCES } from '@/lib/provinces';
import { formatDateId, formatRupiah, LEGAL_STATUS_META, SECTOR_LABELS } from '@/lib/formatters';
import { LegalStatusStamp } from '@/components/LegalStatusStamp';
import { db, schema } from '@/server/db';
import { asc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Cari & Eksplorasi Berkas Perkara',
  description:
    'Mesin pencari berkas perkara tindak pidana korupsi berdasarkan nama tokoh, perusahaan, nomor putusan, era, dan sektor.',
};

export default async function CariPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    province?: string;
    era?: string;
    status?: string;
    sector?: string;
    page?: string;
  }>;
}) {
  const sp = await searchParams;
  const q = sp.q || '';
  const province = sp.province || 'all';
  const era = sp.era || 'all';
  const status = sp.status || 'all';
  const sector = sp.sector || 'all';
  const page = Math.max(1, Number(sp.page || 1));

  const [eras, results] = await Promise.all([
    db.select().from(schema.presidentialEras).orderBy(asc(schema.presidentialEras.sort_order)),
    queryCases({ q, province, era, status, sector, page, limit: 15 }),
  ]);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="font-hand text-4xl font-bold text-stone-900">
          Eksplorasi & Mesin Pencari Berkas Perkara
        </h1>
        <p className="text-sm text-stone-600">
          Telusuri berdasarkan nama tokoh, judul perkara, nomor putusan, korporasi rekanan, atau ringkasan kronologi.
        </p>
      </div>

      <form method="GET" action="/cari" className="archival-card p-5 space-y-4">
        <div className="relative">
          <Search className="w-4 h-4 text-stone-500 absolute left-3.5 top-3" aria-hidden="true" />
          <input
            type="search"
            name="q"
            defaultValue={q}
            aria-label="Kata kunci pencarian berkas perkara"
            placeholder="Cari nama pejabat, korporasi, nomor putusan, atau kata kunci (misal: Timah, Jiwasraya, BTS)..."
            className="w-full rounded-xl border border-stone-300 bg-white pl-10 pr-4 py-2.5 text-sm focus:border-stone-900 focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <select name="era" defaultValue={era} aria-label="Filter Era" className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs">
            <option value="all">Semua 10 Era</option>
            {eras.map((e) => (
              <option key={e.id} value={e.id}>{e.name}</option>
            ))}
          </select>

          <select name="province" defaultValue={province} aria-label="Filter Provinsi" className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs">
            <option value="all">Seluruh Provinsi & Pusat</option>
            {CANONICAL_PROVINCES.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>

          <select name="sector" defaultValue={sector} aria-label="Filter Sektor" className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs">
            <option value="all">Semua Sektor</option>
            {Object.entries(SECTOR_LABELS).map(([k, label]) => (
              <option key={k} value={k}>{label}</option>
            ))}
          </select>

          <select name="status" defaultValue={status} aria-label="Filter Status Hukum" className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs">
            <option value="all">Semua Status Hukum</option>
            {Object.entries(LEGAL_STATUS_META).map(([k, meta]) => (
              <option key={k} value={k}>{meta.shortLabel}</option>
            ))}
          </select>

          <button type="submit" className="rounded-lg bg-stone-900 py-2 text-xs font-bold text-white hover:bg-stone-800">
            Cari Berkas
          </button>
        </div>
      </form>

      <div className="flex items-center justify-between text-xs text-stone-600">
        <span>
          Ditemukan <strong>{results.total}</strong> berkas perkara terverifikasi
        </span>
        {(q || era !== 'all' || province !== 'all' || sector !== 'all' || status !== 'all') && (
          <Link href="/cari" className="font-semibold text-red-700 underline">
            Reset Pencarian
          </Link>
        )}
      </div>

      {results.items.length === 0 ? (
        <div className="archival-card p-10 text-center space-y-2">
          <p className="font-hand text-2xl font-bold text-stone-800">Tidak Ada Berkas Cocok</p>
          <p className="text-sm text-stone-600">
            Coba ubah kata kunci atau lepaskan sebagian filter pencarian Anda.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {results.items.map((c) => (
            <Link
              key={c.id}
              href={`/kasus/${c.slug}`}
              className="archival-card p-5 block hover:border-stone-900 transition space-y-2.5"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <LegalStatusStamp status={c.current_legal_status} compact />
                  <span className="rounded bg-stone-100 px-2 py-0.5 text-[11px] font-semibold text-stone-700">
                    {c.sector_label}
                  </span>
                  {c.case_number && (
                    <span className="font-mono text-[11px] text-stone-500">{c.case_number}</span>
                  )}
                </div>
                <span className="font-mono text-sm font-bold text-red-800 tabular-nums">
                  {c.display_loss_amount > 0
                    ? formatRupiah(c.display_loss_amount, { compact: true })
                    : c.display_bribe_amount > 0
                      ? `Suap: ${formatRupiah(c.display_bribe_amount, { compact: true })}`
                      : 'Non-Loss'}
                </span>
              </div>

              <h2 className="text-lg font-bold text-stone-900">{c.case_title}</h2>
              <p className="text-sm text-stone-700 line-clamp-2">{c.summary}</p>

              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-stone-600 pt-1">
                <span>
                  {c.province_name} • {c.era_name} • {formatDateId(c.case_date)}
                </span>
                {c.persons.length > 0 && (
                  <span className="font-semibold text-stone-800">
                    Subjek: {c.persons.map((p) => p.full_name).join(', ')}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      {results.total_pages > 1 && (
        <div className="flex items-center justify-between text-xs pt-2">
          <span>
            Halaman {results.page} dari {results.total_pages}
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={`/cari?q=${encodeURIComponent(q)}&era=${era}&province=${province}&sector=${sector}&status=${status}&page=${page - 1}`}
                className="rounded-lg border border-stone-300 bg-white px-3 py-1.5 font-semibold"
              >
                Sebelumnya
              </Link>
            )}
            {page < results.total_pages && (
              <Link
                href={`/cari?q=${encodeURIComponent(q)}&era=${era}&province=${province}&sector=${sector}&status=${status}&page=${page + 1}`}
                className="rounded-lg border border-stone-300 bg-white px-3 py-1.5 font-semibold"
              >
                Berikutnya
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
