import React from 'react';
import { Navbar } from '@/components/Navbar';
import { DisclaimerBanner } from '@/components/DisclaimerBanner';
import { Footer } from '@/components/Footer';
import { queryPublicSettings } from '@/server/queries';

export const dynamic = 'force-dynamic';

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const settings = await queryPublicSettings().catch(() => ({
    announcement: null,
    donation: null,
  }));

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12 space-y-8">
        <DisclaimerBanner announcement={settings.announcement as any} />
        {children}
      </main>
      <Footer donation={settings.donation as any} />
    </div>
  );
}
