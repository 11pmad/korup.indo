import React from 'react';
import type { Metadata } from 'next';
import { V1AppShell } from '@/components/V1AppShell';

export const metadata: Metadata = {
  title: 'Peta Spasial Korupsi 38 Provinsi Indonesia',
};

export default function PetaPage() {
  return <V1AppShell initialTab="peta" />;
}
