import React from 'react';
import type { Metadata } from 'next';
import { V1AppShell } from '@/components/V1AppShell';

export const metadata: Metadata = {
  title: 'Klasemen Liga Korupsi Indonesia — Peringkat Pejabat & Partai',
};

export default function KlasemenPage() {
  return <V1AppShell initialTab="klasemen" />;
}
