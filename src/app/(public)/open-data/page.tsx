import React from 'react';
import type { Metadata } from 'next';
import { Download, FileSpreadsheet, FileJson } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Open Data (CC BY 4.0)',
  description:
    'Unduh dataset terkurasi Liga Korupsi Indonesia dalam format CSV RFC 4180 dan JSON untuk riset akademik dan jurnalisme data.',
};

const DATASETS = [
  {
    type: 'cases',
    title: 'Dataset Berkas Perkara (Cases)',
    desc: '47+ perkara lintas 10 era pemerintahan lengkap dengan status hukum, kerugian negara anti double-counting, suap, dan pemulihan aset.',
  },
  {
    type: 'persons',
    title: 'Dataset Subjek Hukum / Pejabat (Persons)',
    desc: 'Peringkat subjek hukum, jabatan saat perkara, afiliasi partai saat kejadian, dan status hukum terkini.',
  },
  {
    type: 'parties',
    title: 'Dataset Agregat Partai Politik (Parties)',
    desc: 'Akumulasi perkara dan kerugian per partai politik berdasarkan kader aktif saat tindak pidana.',
  },
  {
    type: 'companies',
    title: 'Dataset Korporasi Rekanan (Companies)',
    desc: 'Perusahaan terkait perkara pengadaan/perizinan beserta data beneficial owner bila tersedia.',
  },
  {
    type: 'provinces',
    title: 'Dataset Spasial 38 Provinsi + Nasional (Provinces)',
    desc: 'Agregat jumlah perkara dan kerugian per provinsi beserta kode wilayah BPS.',
  },
];

export default function OpenDataPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <span className="inline-block rounded-full bg-emerald-100 px-3 py-0.5 text-xs font-bold text-emerald-900">
          Lisensi Terbuka: Creative Commons CC BY 4.0
        </span>
        <h1 className="font-hand text-4xl font-bold text-stone-900">
          Portal Open Data & Ekspor Riset
        </h1>
        <p className="text-sm text-stone-600">
          Unduh salinan data terstruktur untuk keperluan riset akademis, audit sipil, dan jurnalisme data dengan mencantumkan atribusi sumber primer.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {DATASETS.map((ds) => (
          <div key={ds.type} className="archival-card p-5 flex flex-col justify-between gap-4">
            <div className="space-y-1.5">
              <h2 className="text-lg font-bold text-stone-900">{ds.title}</h2>
              <p className="text-xs text-stone-600 leading-relaxed">{ds.desc}</p>
            </div>
            <div className="flex flex-wrap gap-2 pt-2 border-t border-stone-200">
              <a
                href={`/api/v1/export?type=${ds.type}&format=csv`}
                className="inline-flex items-center gap-1.5 rounded-lg bg-stone-900 px-3.5 py-2 text-xs font-bold text-white hover:bg-stone-800"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                Unduh CSV (UTF-8)
                <Download className="w-3 h-3" />
              </a>
              <a
                href={`/api/v1/export?type=${ds.type}&format=json`}
                className="inline-flex items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-3.5 py-2 text-xs font-bold text-stone-800 hover:bg-stone-100"
              >
                <FileJson className="w-3.5 h-3.5" />
                Unduh JSON
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
