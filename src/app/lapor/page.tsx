import React from 'react';
import type { Metadata } from 'next';
import { V1AppShell } from '@/components/V1AppShell';

export const metadata: Metadata = {
  title: 'Kanal Laporan Warga & Koreksi Data',
};

export default function LaporPage() {
  return <V1AppShell initialTab="beranda" initialOpenReport={true} />;
}
