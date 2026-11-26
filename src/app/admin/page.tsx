import React from 'react';
import { redirect } from 'next/navigation';
import { getAdminSession } from '@/server/auth';
import { AdminPortalClient } from '@/components/AdminPortalClient';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const session = await getAdminSession();
  if (!session) {
    redirect('/admin/login');
  }

  return <AdminPortalClient admin={session} />;
}
