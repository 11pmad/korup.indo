import type { Metadata } from 'next';
import './globals.css';

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://korup-indo.vercel.app';

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: 'Liga Korupsi Indonesia (LKI) — Portal Transparansi Perkara & Putusan Hukum',
    template: '%s — Liga Korupsi Indonesia (LKI)',
  },
  description:
    'Portal transparansi & edukasi publik data perkara tindak pidana korupsi Indonesia (1945–sekarang) berbasis putusan pengadilan, peta 38 provinsi, klasemen, dan perlindungan asas praduga tak bersalah.',
  openGraph: {
    type: 'website',
    locale: 'id_ID',
    siteName: 'Liga Korupsi Indonesia (LKI)',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.png', type: 'image/png', sizes: '32x32' },
    ],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${baseUrl}/#website`,
        url: baseUrl,
        name: 'Liga Korupsi Indonesia (LKI)',
        inLanguage: 'id-ID',
        potentialAction: {
          '@type': 'SearchAction',
          target: `${baseUrl}/cari?q={search_term_string}`,
          'query-input': 'required name=search_term_string',
        },
      },
      {
        '@type': 'Dataset',
        '@id': `${baseUrl}/#dataset`,
        name: 'Basis Data Historis Perkara Korupsi Indonesia (1945–Sekarang)',
        description:
          'Dataset terkurasi perkara tindak pidana korupsi Indonesia dengan pemisahan kerugian negara, suap, uang pengganti, dan rujukan dokumen resmi.',
        license: 'https://creativecommons.org/licenses/by/4.0/',
        spatialCoverage: { '@type': 'Place', name: 'Indonesia' },
      },
    ],
  };

  return (
    <html lang="id">
      <body className="min-h-screen antialiased selection:bg-amber-200 selection:text-stone-900">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {children}
      </body>
    </html>
  );
}
