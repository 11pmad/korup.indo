import type { MetadataRoute } from 'next';
import { db, schema } from '@/server/db';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://korup-indo.vercel.app';
  const staticRoutes = ['', '/peta', '/klasemen', '/statistik', '/cari', '/lapor', '/open-data'].map(
    (route) => ({
      url: `${baseUrl}${route}`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: route === '' ? 1 : 0.85,
    })
  );

  try {
    const [caseRows, personRows] = await Promise.all([
      db.select({ slug: schema.cases.slug, updated_at: schema.cases.updated_at }).from(schema.cases),
      db.select({ slug: schema.persons.slug, updated_at: schema.persons.updated_at }).from(schema.persons),
    ]);

    return [
      ...staticRoutes,
      ...caseRows.map((c) => ({
        url: `${baseUrl}/kasus/${c.slug}`,
        lastModified: c.updated_at ?? new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      })),
      ...personRows.map((p) => ({
        url: `${baseUrl}/tokoh/${p.slug}`,
        lastModified: p.updated_at ?? new Date(),
        changeFrequency: 'monthly' as const,
        priority: 0.7,
      })),
    ];
  } catch {
    return staticRoutes;
  }
}
