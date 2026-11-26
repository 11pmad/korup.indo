import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { queryCaseDetailBySlugOrId } from '@/server/queries';
import { LEGAL_STATUS_META, LegalStatusValue } from '@/lib/formatters';
import { V1AppShell } from '@/components/V1AppShell';

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
    title: `Berkas: ${detail.case_title} (${statusLabel})`,
    description: detail.summary.slice(0, 160),
    openGraph: {
      title: `${detail.case_title} (${statusLabel}) — LKI`,
      description: detail.summary.slice(0, 160),
    },
  };
}

export default async function CaseSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const detail = await queryCaseDetailBySlugOrId(slug);
  if (!detail) notFound();

  return <V1AppShell initialTab="cari" initialCaseId={detail.id} />;
}
