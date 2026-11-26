import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import {
  queryCompaniesLeaderboard,
  queryOfficialsLeaderboard,
  queryPartiesLeaderboard,
} from '@/server/queries';
import { CANONICAL_PROVINCES } from '@/lib/provinces';
import { formatRupiah, LEGAL_STATUS_META } from '@/lib/formatters';
import { LegalStatusStamp } from '@/components/LegalStatusStamp';
import { db, schema } from '@/server/db';
import { asc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Klasemen Liga Korupsi — Pejabat, Partai & Korporasi',
  description:
    'Peringkat akumulasi kerugian negara berdasarkan berkas perkara terverifikasi per subjek hukum, partai politik, dan korporasi rekanan.',
};

export default async function KlasemenPage({
  searchParams,
}: {
  searchParams: Promise<{
    tab?: string;
    era?: string;
    province?: string;
    status?: string;
    sort?: string;
    page?: string;
  }>;
}) {
  const sp = await searchParams;
  const tab = sp.tab === 'partai' || sp.tab === 'korporasi' ? sp.tab : 'pejabat';
  const era = sp.era || 'all';
  const province = sp.province || 'all';
  const status = sp.status || 'all';
  const sort = (sp.sort as 'loss' | 'cases' | 'name') || 'loss';
  const page = Math.max(1, Number(sp.page || 1));

  const [eras, officialsRes, partiesList, companiesList] = await Promise.all([
    db.select().from(schema.presidentialEras).orderBy(asc(schema.presidentialEras.sort_order)),
    queryOfficialsLeaderboard({ era, province, status, sort, page, limit: 20 }),
    queryPartiesLeaderboard(era),
    queryCompaniesLeaderboard(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-hand text-4xl font-bold text-stone-900">
            Klasemen Liga Korupsi Indonesia
          </h1>
          <p className="text-sm text-stone-600">
            Pemeringkatan berbasis berkas resmi dengan pemisahan ketat status hukum (Inkrah vs Proses Sidang).
          </p>
        </div>

        {/* Mode Tabs */}
        <div className="flex rounded-xl border border-stone-300 bg-white p-1 gap-1">
          {[
            { id: 'pejabat', label: 'Subjek Hukum / Pejabat' },
            { id: 'partai', label: 'Partai Politik' },
            { id: 'korporasi', label: 'Korporasi Rekanan' },
          ].map((t) => (
            <Link
              key={t.id}
              href={`/klasemen?tab=${t.id}`}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition ${
                tab === t.id ? 'bg-stone-900 text-white' : 'text-stone-700 hover:bg-stone-100'
              }`}
            >
              {t.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Filters for Pejabat / Partai */}
      {tab !== 'korporasi' && (
        <form method="GET" action="/klasemen" className="archival-card p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <input type="hidden" name="tab" value={tab} />
          <div>
            <label htmlFor="flt-era" className="block text-[11px] font-bold text-stone-600 mb-1">
              Era Pemerintahan
            </label>
            <select
              id="flt-era"
              name="era"
              defaultValue={era}
              className="w-full rounded-lg border border-stone-300 bg-white px-2.5 py-2 text-xs"
            >
              <option value="all">Semua 10 Era (1945–2026)</option>
              {eras.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </select>
          </div>

          {tab === 'pejabat' && (
            <>
              <div>
                <label htmlFor="flt-prov" className="block text-[11px] font-bold text-stone-600 mb-1">
                  Provinsi / Wilayah
                </label>
                <select
                  id="flt-prov"
                  name="province"
                  defaultValue={province}
                  className="w-full rounded-lg border border-stone-300 bg-white px-2.5 py-2 text-xs"
                >
                  <option value="all">Seluruh Wilayah</option>
                  {CANONICAL_PROVINCES.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="flt-status" className="block text-[11px] font-bold text-stone-600 mb-1">
                  Status Hukum
                </label>
                <select
                  id="flt-status"
                  name="status"
                  defaultValue={status}
                  className="w-full rounded-lg border border-stone-300 bg-white px-2.5 py-2 text-xs"
                >
                  <option value="all">Semua Status</option>
                  {Object.entries(LEGAL_STATUS_META).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v.shortLabel}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="flt-sort" className="block text-[11px] font-bold text-stone-600 mb-1">
                  Urutkan
                </label>
                <select
                  id="flt-sort"
                  name="sort"
                  defaultValue={sort}
                  className="w-full rounded-lg border border-stone-300 bg-white px-2.5 py-2 text-xs"
                >
                  <option value="loss">Kerugian Tertinggi</option>
                  <option value="cases">Jumlah Perkara</option>
                  <option value="name">Abjad Nama</option>
                </select>
              </div>
            </>
          )}

          <div className="flex items-end">
            <button
              type="submit"
              className="w-full rounded-lg bg-stone-900 py-2 text-xs font-bold text-white hover:bg-stone-800"
            >
              Terapkan Filter
            </button>
          </div>
        </form>
      )}

      {/* Tab 1: Officials */}
      {tab === 'pejabat' && (
        <div className="archival-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#F3EDE0] border-b border-stone-300 text-xs font-bold uppercase text-stone-700">
                <tr>
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">Nama & Jabatan Saat Kejadian</th>
                  <th className="px-4 py-3">Afiliasi Partai</th>
                  <th className="px-4 py-3">Wilayah</th>
                  <th className="px-4 py-3">Status Hukum</th>
                  <th className="px-4 py-3 text-right">Kerugian / Suap Tercatat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {officialsRes.items.map((item) => (
                  <tr key={item.person_id} className="hover:bg-amber-50/40">
                    <td className="px-4 py-3 font-mono font-bold text-stone-700 tabular-nums">
                      {item.rank}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/tokoh/${item.slug}`}
                        className="font-bold text-stone-900 hover:text-red-800 hover:underline"
                      >
                        {item.full_name}
                      </Link>
                      <p className="text-xs text-stone-600">{item.role_title}</p>
                      <Link
                        href={`/kasus/${item.primary_case_slug}`}
                        className="text-[11px] text-amber-800 hover:underline line-clamp-1"
                      >
                        Berkas: {item.primary_case_title}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-xs font-semibold text-stone-700">
                      <span
                        className="inline-block w-2 h-2 rounded-full mr-1.5"
                        style={{ backgroundColor: item.party_color }}
                      />
                      {item.party_abbr}
                    </td>
                    <td className="px-4 py-3 text-xs text-stone-700">{item.province_name}</td>
                    <td className="px-4 py-3">
                      <LegalStatusStamp status={item.legal_status} compact />
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums">
                      <span className="font-bold text-red-800 block">
                        {item.total_loss > 0 ? formatRupiah(item.total_loss, { compact: true }) : '-'}
                      </span>
                      {item.total_bribe > 0 && (
                        <span className="text-[11px] text-amber-800">
                          Suap: {formatRupiah(item.total_bribe, { compact: true })}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {officialsRes.total_pages > 1 && (
            <div className="border-t border-stone-200 px-4 py-3 flex items-center justify-between text-xs">
              <span>
                Halaman {officialsRes.page} dari {officialsRes.total_pages} ({officialsRes.total} subjek)
              </span>
              <div className="flex gap-2">
                {page > 1 && (
                  <Link
                    href={`/klasemen?tab=pejabat&era=${era}&province=${province}&status=${status}&sort=${sort}&page=${page - 1}`}
                    className="rounded border border-stone-300 bg-white px-3 py-1 font-semibold"
                  >
                    Sebelumnya
                  </Link>
                )}
                {page < officialsRes.total_pages && (
                  <Link
                    href={`/klasemen?tab=pejabat&era=${era}&province=${province}&status=${status}&sort=${sort}&page=${page + 1}`}
                    className="rounded border border-stone-300 bg-white px-3 py-1 font-semibold"
                  >
                    Berikutnya
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Parties */}
      {tab === 'partai' && (
        <div className="archival-card overflow-hidden">
          <p className="px-4 py-3 text-xs text-stone-600 bg-[#FBF8F1] border-b border-stone-200">
            Catatan Metodologi: Afiliasi partai dihitung berdasarkan keanggotaan aktif pada saat tindak pidana terjadi (<code>party_at_offense = true</code>).
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#F3EDE0] border-b border-stone-300 text-xs font-bold uppercase text-stone-700">
                <tr>
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">Partai Politik</th>
                  <th className="px-4 py-3 text-center">Kader Terlibat</th>
                  <th className="px-4 py-3 text-center">Perkara Terkait</th>
                  <th className="px-4 py-3 text-right">Akumulasi Kerugian</th>
                  <th className="px-4 py-3 text-right">Suap/Gratifikasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {partiesList.map((p, idx) => (
                  <tr key={p.id} className="hover:bg-amber-50/40">
                    <td className="px-4 py-3 font-mono font-bold tabular-nums">{idx + 1}</td>
                    <td className="px-4 py-3 font-bold text-stone-900">
                      <span
                        className="inline-block w-3 h-3 rounded-full mr-2 align-middle"
                        style={{ backgroundColor: p.color_hex }}
                      />
                      {p.name} ({p.abbreviation})
                    </td>
                    <td className="px-4 py-3 text-center font-mono tabular-nums">{p.total_cadres}</td>
                    <td className="px-4 py-3 text-center font-mono tabular-nums">{p.total_cases}</td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-red-800 tabular-nums">
                      {formatRupiah(p.total_loss, { compact: true })}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-amber-800 tabular-nums">
                      {formatRupiah(p.total_bribe, { compact: true })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Companies */}
      {tab === 'korporasi' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {companiesList.map((comp) => (
            <div key={comp.id} className="archival-card p-5 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="text-base font-bold text-stone-900">{comp.name}</h2>
                  <p className="text-xs text-stone-600">
                    {comp.company_type} • {comp.industry}
                  </p>
                </div>
                <span className="rounded bg-stone-100 px-2.5 py-1 text-xs font-bold text-stone-800">
                  {comp.company_status}
                </span>
              </div>
              {comp.beneficial_owner && (
                <p className="text-xs text-stone-700">
                  <strong>Pemilik Manfaat (Beneficial Owner):</strong> {comp.beneficial_owner}
                </p>
              )}
              <div className="flex items-center justify-between text-xs border-t border-stone-200 pt-2.5">
                <span className="font-semibold text-stone-700">{comp.total_cases} perkara tercatat</span>
                <span className="font-mono font-bold text-red-800 tabular-nums">
                  {formatRupiah(comp.total_linked_loss, { compact: true })}
                </span>
              </div>
              {comp.cases.length > 0 && (
                <div className="space-y-1">
                  {comp.cases.map((c: any) => (
                    <Link
                      key={c.id}
                      href={`/kasus/${c.slug}`}
                      className="block text-xs text-amber-900 underline hover:text-amber-700 truncate"
                    >
                      → {c.case_title} ({c.role})
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
