import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { queryPersonDetailBySlugOrId } from '@/server/queries';
import { V1AppShell } from '@/components/V1AppShell';

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
    title: `Profil: ${person.full_name}`,
    description: `Riwayat perkara dan jabatan ${person.full_name}.`,
  };
}

export default async function TokohSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const person = await queryPersonDetailBySlugOrId(slug);
  if (!person) notFound();

  return <V1AppShell initialTab="klasemen" initialCaseId={person.cases[0]?.id ?? null} />;
}
