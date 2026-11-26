import type { Metadata } from 'next';
import './globals.css';
import { ClientProviders } from '@/components/ClientProviders';

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://korup-indo.vercel.app';

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: 'Liga Korupsi Indonesia (LKI) — Portal Transparansi Perkara & Putusan Hukum',
    template: '%s — Liga Korupsi Indonesia (LKI)',
  },
  description:
    'Portal transparansi & edukasi data perkara korupsi Indonesia berbasis putusan pengadilan inkrah, klasemen liga interaktif, peta spasial 38 provinsi, analitik korporasi rekanan, dan asas praduga tak bersalah.',
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
        name: 'Basis Data Perkara Korupsi Indonesia Terverifikasi',
        description:
          'Agregasi data kerugian keuangan negara, profil pejabat terpidana/terdakwa, amar putusan berkekuatan hukum tetap (inkrah), dan pemetaan 38 provinsi.',
        license: 'https://creativecommons.org/licenses/by/4.0/',
        spatialCoverage: { '@type': 'Place', name: 'Indonesia' },
      },
    ],
  };

  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@500;600;700;800&family=Caveat:wght@600;700&family=Chewy&family=Comic+Neue:ital,wght@0,400;0,700;1,400&family=Patrick+Hand&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-[#FFFDF6] text-[#2D2A26] antialiased selection:bg-[#FDE047] selection:text-[#1E1B18]">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
