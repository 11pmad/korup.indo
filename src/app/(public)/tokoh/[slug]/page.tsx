import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Briefcase, Flag } from 'lucide-react';
import { queryPersonDetailBySlugOrId } from '@/server/queries';
import { formatDateId, formatRupiah, formatSentence } from '@/lib/formatters';
import { LegalStatusStamp } from '@/components/LegalStatusStamp';

export const revalidate = 600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const person = await queryPersonDetailBySlugOrId(slug);
  if (!person) return { title: 'Tokoh Tidak Ditemukan' };
  return {
    title: `Profil Subjek Hukum: ${person.full_name}`,
    description: `Riwayat jabatan, afiliasi partai, dan berkas perkara terkait ${person.full_name}.`,
  };
}

export default async function TokohDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const person = await queryPersonDetailBySlugOrId(slug);
  if (!person) notFound();

  return (
    <div className="space-y-6">
      <Link
        href="/klasemen"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-700 hover:text-stone-950"
      >
        <ArrowLeft className="w-4 h-4" /> Kembali ke Klasemen
      </Link>

      <section className="archival-card washi-tape p-6 space-y-3">
        <h1 className="font-hand text-4xl font-bold text-stone-900">{person.full_name}</h1>
        <p className="text-sm font-medium text-stone-700">
          {person.occupation || 'Subjek Hukum'} • Kewarganegaraan: {person.nationality}
        </p>
        {person.birth_place && (
          <p className="text-xs text-stone-600">
            Lahir di {person.birth_place} ({formatDateId(person.birth_date)})
          </p>
        )}
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <section className="archival-card p-5 space-y-3">
          <h2 className="font-hand text-2xl font-bold text-stone-900 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-stone-700" /> Riwayat Jabatan
          </h2>
          {person.positions.length === 0 ? (
            <p className="text-xs text-stone-600">Tidak ada catatan jabatan terpisah.</p>
          ) : (
            <ul className="space-y-2.5">
              {person.positions.map((pos) => (
                <li key={pos.id} className="rounded-lg border border-stone-200 bg-[#FBF8F1] p-3 text-xs">
                  <p className="font-bold text-stone-900">{pos.position_title}</p>
                  <p className="text-stone-600">
                    {pos.institution} ({pos.government_level}) • {pos.province_name || 'Nasional'}
                  </p>
                  {pos.position_at_offense && (
                    <span className="inline-block mt-1 rounded bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-900">
                      Jabatan Saat Kejadian Perkara
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="archival-card p-5 space-y-3">
          <h2 className="font-hand text-2xl font-bold text-stone-900 flex items-center gap-2">
            <Flag className="w-5 h-5 text-red-700" /> Afiliasi Partai Politik
          </h2>
          {person.party_memberships.length === 0 ? (
            <p className="text-xs text-stone-600">Tidak berafiliasi partai politik / Non-Partai.</p>
          ) : (
            <ul className="space-y-2.5">
              {person.party_memberships.map((pm) => (
                <li key={pm.id} className="rounded-lg border border-stone-200 bg-[#FBF8F1] p-3 text-xs">
                  <p className="font-bold text-stone-900">
                    {pm.party_name} ({pm.party_abbr})
                  </p>
                  {pm.party_position && <p className="text-stone-600">Posisi: {pm.party_position}</p>}
                  {pm.party_at_offense && (
                    <span className="inline-block mt-1 rounded bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-900">
                      Aktif Saat Kejadian Perkara
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="archival-card p-5 space-y-3">
        <h2 className="font-hand text-2xl font-bold text-stone-900">
          Berkas Perkara Terkait ({person.cases.length})
        </h2>
        <div className="space-y-3">
          {person.cases.map((c) => (
            <Link
              key={c.id}
              href={`/kasus/${c.slug}`}
              className="block rounded-xl border border-stone-200 bg-[#FBF8F1] p-4 hover:border-stone-900 transition"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <LegalStatusStamp status={c.legal_status} compact />
                <span className="font-mono text-sm font-bold text-red-800 tabular-nums">
                  {c.display_loss_amount > 0
                    ? formatRupiah(c.display_loss_amount, { compact: true })
                    : formatRupiah(c.display_bribe_amount, { compact: true })}
                </span>
              </div>
              <h3 className="mt-2 text-base font-bold text-stone-900">{c.case_title}</h3>
              <p className="text-xs text-stone-600 mt-1">
                {c.role_in_case} • {c.province_name} • {c.era_name}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {person.verdicts.length > 0 && (
        <section className="archival-card p-5 space-y-3">
          <h2 className="font-hand text-2xl font-bold text-stone-900">Putusan Pengadilan</h2>
          <div className="space-y-2">
            {person.verdicts.map((v) => (
              <div key={v.id} className="rounded-lg border border-stone-200 bg-[#FBF8F1] p-3 text-xs flex flex-wrap justify-between gap-2">
                <div>
                  <p className="font-bold text-stone-900">
                    {v.court} — {v.decision_number}
                  </p>
                  <p className="text-stone-600">{formatDateId(v.decision_date)}</p>
                </div>
                <div className="text-right font-mono">
                  <p className="font-bold text-stone-900">{formatSentence(v.prison_sentence_months, v.sentence_type)}</p>
                  <p className="text-red-800">Uang Pengganti: {formatRupiah(v.restitution_amount)}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
