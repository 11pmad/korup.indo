import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ExternalLink, Building2, Calendar, FileText, ArrowLeft, Scale } from 'lucide-react';
import { queryCaseDetailBySlugOrId } from '@/server/queries';
import {
  formatDateId,
  formatRupiah,
  formatSentence,
  LEGAL_STATUS_META,
  LegalStatusValue,
  requiresPresumptionWarning,
} from '@/lib/formatters';
import { LegalStatusStamp } from '@/components/LegalStatusStamp';
import { FinancialBreakdownCard } from '@/components/FinancialBreakdownCard';
import { CaseCommunitySection } from '@/components/CaseCommunitySection';

export const revalidate = 600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const detail = await queryCaseDetailBySlugOrId(slug);
  if (!detail) return { title: 'Perkara Tidak Ditemukan' };

  const statusLabel =
    LEGAL_STATUS_META[detail.current_legal_status as LegalStatusValue]?.shortLabel ??
    detail.current_legal_status;

  return {
    title: `${detail.case_title} (${statusLabel})`,
    description: detail.summary.slice(0, 160),
    openGraph: {
      title: `${detail.case_title} (${statusLabel}) — LKI`,
      description: detail.summary.slice(0, 160),
    },
  };
}

export default async function CaseDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const detail = await queryCaseDetailBySlugOrId(slug);
  if (!detail) notFound();

  const showPresumptionNote = requiresPresumptionWarning(detail.current_legal_status);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link
          href="/cari"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-700 hover:text-stone-950"
        >
          <ArrowLeft className="w-4 h-4" /> Kembali ke Eksplorasi Perkara
        </Link>
        <Link
          href={`/lapor?caseId=${detail.id}&type=koreksi_data`}
          className="text-xs font-semibold text-red-800 underline hover:text-red-700"
        >
          Laporkan Koreksi / Ajukan Hak Jawab atas Berkas Ini
        </Link>
      </div>

      {/* Main Case Header Dossier */}
      <article className="archival-card washi-tape p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <LegalStatusStamp status={detail.current_legal_status} />
          <div className="flex flex-wrap items-center gap-2 text-xs text-stone-600">
            <span className="rounded bg-stone-100 px-2.5 py-1 font-semibold text-stone-800">
              {detail.sector_label}
            </span>
            <span>•</span>
            <span>{detail.province_name}</span>
            <span>•</span>
            <span>{detail.era_name}</span>
          </div>
        </div>

        <h1 className="font-hand text-3xl sm:text-4xl font-bold text-stone-900 leading-tight">
          {detail.case_title}
        </h1>

        {detail.case_number && (
          <p className="font-mono text-xs text-stone-600">
            Nomor Perkara: <strong className="text-stone-900">{detail.case_number}</strong> • Tanggal Perkara: {formatDateId(detail.case_date)}
          </p>
        )}

        {showPresumptionNote && (
          <div className="rounded-lg border border-amber-400 bg-amber-50 p-3.5 text-xs text-amber-950 flex items-start gap-2.5">
            <Scale className="w-4 h-4 shrink-0 mt-0.5 text-amber-800" />
            <p>
              <strong>Perlindungan Asas Praduga Tak Bersalah:</strong> Perkara ini belum berputusan pengadilan berkekuatan hukum tetap (inkrah). Seluruh subjek hukum terkait wajib dianggap tidak bersalah sebelum ada putusan inkrah sesuai Pasal 8 ayat (1) UU No. 48/2009.
            </p>
          </div>
        )}

        <p className="text-base text-stone-800 leading-relaxed whitespace-pre-line">
          {detail.summary}
        </p>

        {detail.verification_note && (
          <p className="rounded-lg bg-[#F3EDE0] p-3 text-xs text-stone-700 border border-stone-200">
            <strong>Catatan Verifikasi Kurator:</strong> {detail.verification_note}
          </p>
        )}
      </article>

      {/* Financial Breakdown */}
      <FinancialBreakdownCard
        displayLossAmount={detail.display_loss_amount}
        displayLossBasis={detail.display_loss_basis}
        displayBribeAmount={detail.display_bribe_amount}
        displayRecoveryAmount={detail.display_recovery_amount}
        records={detail.financial_records}
      />

      {/* Persons Involved */}
      {detail.persons.length > 0 && (
        <section className="archival-card p-5 space-y-3">
          <h2 className="font-hand text-2xl font-bold text-stone-900">
            Subjek Hukum Terlibat ({detail.persons.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {detail.persons.map((p) => (
              <Link
                key={p.id}
                href={`/tokoh/${p.slug}`}
                className="rounded-xl border border-stone-200 bg-[#FBF8F1] p-4 hover:border-stone-900 transition flex items-start justify-between gap-3"
              >
                <div>
                  <h3 className="text-sm font-bold text-stone-900">{p.full_name}</h3>
                  <p className="text-xs text-stone-600">{p.role_in_case}</p>
                  <p className="text-[11px] text-stone-500 mt-1">Peran: {p.offense_role}</p>
                </div>
                <LegalStatusStamp status={p.legal_status} compact />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Verdicts & Prosecutor Demands */}
      {detail.verdicts.length > 0 && (
        <section className="archival-card p-5 space-y-3">
          <h2 className="font-hand text-2xl font-bold text-stone-900">
            Riwayat Putusan Pengadilan ({detail.verdicts.length})
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F3EDE0] border-b border-stone-300 font-bold uppercase text-stone-700">
                <tr>
                  <th className="px-3 py-2.5">Tingkat & Nomor Putusan</th>
                  <th className="px-3 py-2.5">Terpidana/Terdakwa</th>
                  <th className="px-3 py-2.5">Amar Pidana</th>
                  <th className="px-3 py-2.5 text-right">Denda & Uang Pengganti</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {detail.verdicts.map((v) => (
                  <tr key={v.id}>
                    <td className="px-3 py-3">
                      <p className="font-bold text-stone-900">{v.court}</p>
                      <p className="font-mono text-stone-700">{v.decision_number}</p>
                      <p className="text-stone-500">
                        {formatDateId(v.decision_date)} • {v.is_final ? 'Inkrah (Final)' : v.court_level}
                      </p>
                    </td>
                    <td className="px-3 py-3 font-semibold text-stone-800">
                      {v.person_name}
                      <span className="block text-[11px] text-stone-500 capitalize">
                        Status: {v.guilty_status}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <p className="font-semibold text-stone-900">
                        {formatSentence(v.prison_sentence_months, v.sentence_type)}
                      </p>
                      {v.prosecutor_demand_months !== null && (
                        <p className="text-stone-500">
                          Tuntutan Jaksa: {formatSentence(v.prosecutor_demand_months)}
                        </p>
                      )}
                      {v.political_disqualification && (
                        <p className="text-red-800 mt-0.5">{v.political_disqualification}</p>
                      )}
                    </td>
                    <td className="px-3 py-3 text-right font-mono tabular-nums">
                      <p>Denda: {formatRupiah(v.fine_amount)}</p>
                      <p className="text-red-800">Uang Pengganti: {formatRupiah(v.restitution_amount)}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Timeline & Companies */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="archival-card p-5 space-y-3">
          <h2 className="font-hand text-2xl font-bold text-stone-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-amber-700" /> Linimasa Peristiwa Hukum
          </h2>
          {detail.timeline_events.length === 0 ? (
            <p className="text-xs text-stone-600">
              Tanggal kunci: Penyelidikan ({formatDateId(detail.investigation_date)}), Penetapan Tersangka ({formatDateId(detail.suspect_date)}), Dakwaan ({formatDateId(detail.indictment_date)}), Putusan Akhir ({formatDateId(detail.final_decision_date)}).
            </p>
          ) : (
            <ol className="space-y-3 border-l-2 border-stone-300 pl-4">
              {detail.timeline_events.map((evt) => (
                <li key={evt.id} className="space-y-0.5">
                  <p className="font-mono text-xs font-bold text-amber-900">
                    {formatDateId(evt.event_date)} • {evt.institution}
                  </p>
                  <p className="text-xs text-stone-800">{evt.event_description}</p>
                </li>
              ))}
            </ol>
          )}
        </section>

        <section className="archival-card p-5 space-y-3">
          <h2 className="font-hand text-2xl font-bold text-stone-900 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-stone-700" /> Korporasi Terkait ({detail.companies.length})
          </h2>
          {detail.companies.length === 0 ? (
            <p className="text-xs text-stone-600">Tidak ada entitas korporasi rekanan yang tercatat terpisah pada perkara ini.</p>
          ) : (
            <div className="space-y-2.5">
              {detail.companies.map((comp) => (
                <div key={comp.id} className="rounded-lg border border-stone-200 bg-[#FBF8F1] p-3 text-xs space-y-1">
                  <p className="font-bold text-stone-900">{comp.name}</p>
                  <p className="text-stone-600">
                    Peran: {comp.company_role_in_case} • Status: {comp.company_case_status}
                  </p>
                  {comp.beneficial_owner && (
                    <p className="text-stone-700">Beneficial Owner: {comp.beneficial_owner}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Primary Sources */}
      <section className="archival-card p-5 space-y-3">
        <h2 className="font-hand text-2xl font-bold text-stone-900 flex items-center gap-2">
          <FileText className="w-5 h-5 text-red-700" /> Rujukan Sumber Primer ({detail.sources.length})
        </h2>
        <div className="space-y-3">
          {detail.sources.map((src) => (
            <div key={src.id} className="rounded-lg border border-stone-200 bg-[#FBF8F1] p-4 space-y-1.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-bold text-stone-900">{src.source_title}</span>
                <span className="rounded bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-900">
                  {src.source_institution}
                </span>
              </div>
              <blockquote className="border-l-2 border-amber-600 pl-3 text-xs italic text-stone-700">
                “{src.source_excerpt}”
              </blockquote>
              <a
                href={src.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-bold text-red-800 underline hover:text-red-700"
              >
                Buka Dokumen Rujukan <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* Citizen Community Reactions & Comments */}
      <CaseCommunitySection caseSlug={detail.slug} initialReactions={detail.reactions} />
    </div>
  );
}
