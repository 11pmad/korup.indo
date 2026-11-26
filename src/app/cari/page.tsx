import React from 'react';
import type { Metadata } from 'next';
import { V1AppShell } from '@/components/V1AppShell';

export const metadata: Metadata = {
  title: 'Eksplorasi & Cari Berkas Kasus Korupsi',
};

export default function CariPage() {
  return <V1AppShell initialTab="cari" />;
}
