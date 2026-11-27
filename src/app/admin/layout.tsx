import React from 'react';
import type { Metadata } from 'next';
import { AdminRouteShell } from '@/components/AdminRouteShell';

export const metadata: Metadata = {
  title: {
    default: 'Panel Kurasi & Moderasi Verifikator',
    template: '%s — Panel Admin LKI',
  },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return <AdminRouteShell>{children}</AdminRouteShell>;
}
