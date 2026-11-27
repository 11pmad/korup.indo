import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
  ADMIN_CANONICAL_SLUGS,
  ADMIN_TAB_TITLES,
  adminSlugToTab,
} from '@/legacy-ui/components/admin/adminRoutes';

export function generateStaticParams() {
  return ADMIN_CANONICAL_SLUGS.map((section) => ({ section }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ section: string }>;
}): Promise<Metadata> {
  const { section } = await params;
  const tab = adminSlugToTab(section);
  if (!tab) return {};
  return {
    title: ADMIN_TAB_TITLES[tab],
  };
}

export default async function AdminSectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  const tab = adminSlugToTab(section);
  if (!tab) {
    notFound();
  }
  return null;
}
