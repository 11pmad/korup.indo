'use client';

import React, { Suspense, lazy } from 'react';
import { usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { pathnameToAdminTab } from '@/legacy-ui/components/admin/adminRoutes';

const AdminPanel = lazy(() =>
  import('@/legacy-ui/components/AdminPanel').then((m) => ({ default: m.AdminPanel }))
);

function AdminLoadingFallback() {
  return (
    <div className="min-h-screen bg-[#0B0F19] flex flex-col items-center justify-center space-y-4">
      <Loader2 className="w-10 h-10 text-[#DC2626] animate-spin" />
      <p className="font-mono text-sm text-[#94A3B8]">Memuat Portal Admin...</p>
    </div>
  );
}

export function AdminRouteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const activeTab = pathnameToAdminTab(pathname);

  if (activeTab === null) {
    return <>{children}</>;
  }

  return (
    <Suspense fallback={<AdminLoadingFallback />}>
      <AdminPanel />
      {children}
    </Suspense>
  );
}
