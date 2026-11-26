import React from 'react';
import type { Metadata } from 'next';
import { V1AppShell } from '@/components/V1AppShell';

export const metadata: Metadata = {
  title: 'Open Data Perkara Korupsi Indonesia (CC BY 4.0)',
};

export default function OpenDataPage() {
  return <V1AppShell initialTab="beranda" />;
}
