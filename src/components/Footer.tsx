import React from 'react';
import Link from 'next/link';

interface DonationConfig {
  title?: string;
  description?: string;
  qris_image_url?: string;
  account_name?: string;
  bank_info?: string;
  is_active?: boolean;
}

export function Footer({ donation }: { donation?: DonationConfig | null }) {
  return (
    <footer className="mt-12 border-t-2 border-[#D6CBB5] bg-[#F3EDE0] text-stone-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="space-y-2">
          <h2 className="font-hand text-xl font-bold text-stone-900">
            Liga Korupsi Indonesia (LKI)
          </h2>
          <p className="text-xs leading-relaxed text-stone-600">
            Portal edukasi publik dan transparansi data perkara tindak pidana korupsi Indonesia (1945–2026) dengan kepatuhan pada asas praduga tak bersalah serta pemisahan fakta finansial.
          </p>
        </div>

        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-stone-800">
            Rujukan Primer & Akses
          </h3>
          <ul className="space-y-1 text-xs">
            <li>
              <Link href="/open-data" className="underline hover:text-stone-950">
                Portal Open Data (CSV / JSON — CC BY 4.0)
              </Link>
            </li>
            <li>
              <Link href="/lapor" className="underline hover:text-stone-950">
                Kanal Koreksi Data & Hak Jawab (SLA 2×24 Jam)
              </Link>
            </li>
            <li>
              <a
                href="https://putusan3.mahkamahagung.go.id/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-stone-950"
              >
                Direktori Putusan Mahkamah Agung RI
              </a>
            </li>
            <li>
              <a
                href="https://www.kpk.go.id/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-stone-950"
              >
                Komisi Pemberantasan Korupsi (KPK RI)
              </a>
            </li>
          </ul>
        </div>

        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-stone-800">
            {donation?.title || 'Dukung Independensi LKI'}
          </h3>
          <p className="text-xs text-stone-600 leading-relaxed">
            {donation?.description ||
              'Independen tanpa iklan komersial. Setiap entri diverifikasi melalui dokumen pengadilan dan rilis resmi lembaga penegak hukum.'}
          </p>
          {donation?.is_active && donation?.qris_image_url && (
            <div className="pt-1 flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={donation.qris_image_url}
                alt="QRIS Dukungan LKI"
                className="w-16 h-16 rounded border border-stone-300 bg-white object-contain"
              />
              <span className="text-[11px] text-stone-600">{donation.account_name}</span>
            </div>
          )}
        </div>
      </div>
      <div className="border-t border-[#D6CBB5] py-3 text-center text-[11px] text-stone-600">
        Liga Korupsi Indonesia v2.0 — Data Terbuka berlisensi CC BY 4.0 • Patuh Pasal 8 ayat (1) UU No. 48/2009 & UU PDP No. 27/2022
      </div>
    </footer>
  );
}
