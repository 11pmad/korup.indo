import React from 'react';
import type { Metadata } from 'next';
import { queryCases, queryProvincesSummary } from '@/server/queries';
import { IndonesiaChoroplethMap } from '@/components/IndonesiaChoroplethMap';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Peta Spasial Korupsi 38 Provinsi',
  description:
    'Peta choropleth interaktif persebaran perkara korupsi di 38 provinsi Indonesia serta klaster perkara tingkat nasional.',
};

export default async function PetaPage() {
  const [provinces, casesRes] = await Promise.all([
    queryProvincesSummary(),
    queryCases({ limit: 100, page: 1 }),
  ]);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="font-hand text-4xl font-bold text-stone-900">
          Pemetaan Spasial Perkara Korupsi Indonesia
        </h1>
        <p className="text-sm text-stone-600">
          Distribusi geografis perkara terkurasi pada 38 provinsi beserta klaster lembaga tingkat pusat/nasional.
        </p>
      </div>

      <IndonesiaChoroplethMap provinces={provinces} cases={casesRes.items} />
    </div>
  );
}
