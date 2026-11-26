import React from 'react';
import type { Metadata } from 'next';
import { V1AppShell } from '@/components/V1AppShell';

export const metadata: Metadata = {
  title: 'Panel Kurasi & Moderasi Verifikator',
};

export default function AdminPage() {
  return <V1AppShell initialTab="admin" />;
}
