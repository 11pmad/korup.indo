import React from 'react';
import type { Metadata } from 'next';
import { V1AppShell } from '@/components/V1AppShell';

export const metadata: Metadata = {
  title: 'Statistik & Analisis Tren Perkara Korupsi Nasional',
};

export default function StatistikPage() {
  return <V1AppShell initialTab="statistik" />;
}
