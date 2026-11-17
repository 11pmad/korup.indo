import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  Database, 
  Download, 
  FileSpreadsheet, 
  FileCode, 
  ExternalLink, 
  ShieldCheck, 
  CheckCircle2, 
  Copy, 
  Sparkles,
  Info,
  Scale,
  Building2,
  MapPin,
  Users
} from 'lucide-react';
import { sound } from '../utils/audio.js';

interface OpenDataModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OpenDataModal: React.FC<OpenDataModalProps> = ({ isOpen, onClose }) => {
  const [copiedEndpoint, setCopiedEndpoint] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedEndpoint(label);
    sound.playPop();
    setTimeout(() => setCopiedEndpoint(null), 2500);
  };

  const datasets = [
    {
      id: 'cases',
      title: 'Basis Data Perkara Korupsi Nasional & Daerah',
      description: 'Seluruh berkas perkara, nomor putusan pengadilan MA/PN Tipikor, sektor perkara, nilai kerugian negara, uang pengganti, dan status peradilan.',
      count: '47 Perkara Lengkap',
      badgeColor: 'bg-rose-100 text-rose-800 border-rose-300',
      icon: Scale,
      csvUrl: '/api/export?type=cases&format=csv',
      jsonUrl: '/api/export?type=cases&format=json'
    },
    {
      id: 'officials',
      title: 'Profil Pejabat Publik & Terpidana Korupsi',
      description: 'Nama pejabat terpidana/terdakwa, jabatan saat perkara, asal provinsi, afiliasi partai politik, total kerugian negara, dan status hukum inkrah.',
      count: '43 Tokoh Pejabat',
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
      icon: Users,
      csvUrl: '/api/export?type=officials&format=csv',
      jsonUrl: '/api/export?type=officials&format=json'
    },
    {
      id: 'provinces',
      title: 'Klasemen Kerugian Negara per 38 Provinsi',
      description: 'Peringkat wilayah, kluster pulau, akumulasi kerugian keuangan negara tiap provinsi, dan jumlah total perkara korupsi yang terpetakan.',
      count: '38 Provinsi + Nasional',
      badgeColor: 'bg-blue-100 text-blue-800 border-blue-300',
      icon: MapPin,
      csvUrl: '/api/export?type=provinces&format=csv',
      jsonUrl: '/api/export?type=provinces&format=json'
    },
    {
      id: 'parties',
      title: 'Afiliasi Partai Politik Terkait Kasus Korupsi',
      description: 'Agregasi akumulasi kerugian keuangan negara serta total perkara yang melibatkan kader partai politik di Indonesia.',
      count: '11 Partai Politik',
      badgeColor: 'bg-purple-100 text-purple-800 border-purple-300',
      icon: Building2,
      csvUrl: '/api/export?type=parties&format=csv',
      jsonUrl: '/api/export?type=parties&format=json'
    }
  ];

  const officialSources = [
    {
      name: 'Mahkamah Agung RI',
      url: 'https://putusan3.mahkamahagung.go.id',
      desc: 'Direktori Putusan Kasasi, PK, dan Pengadilan Tipikor'
    },
    {
      name: 'KPK RI',
      url: 'https://www.kpk.go.id/statistik',
      desc: 'Statistik Penindakan, Penyidikan, dan Pelaporan LHKPN'
    },
    {
      name: 'Kejaksaan Agung RI',
      url: 'https://www.kejaksaan.go.id',
      desc: 'Rilis Penanganan Perkara Korupsi Skala Mega Jampidsus'
    },
    {
      name: 'BPK RI',
      url: 'https://www.bpk.go.id/ihps',
      desc: 'Ikhtisar Hasil Pemeriksaan Semester (IHPS) Kerugian Negara'
    },
    {
      name: 'Opentender.net',
      url: 'https://opentender.net',
      desc: 'Indeks Potensi Fraud Tender Pengadaan LKPP & ICW'
    }
  ];

  const modalContent = (
    <div 
      id="open-data-modal"
      className="fixed inset-0 z-9999 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="relative bg-[#FFFDF8] border-3 border-[#E2D5B7] rounded-3xl p-5 sm:p-7 max-w-3xl w-full shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200 my-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Scrapbook Dual Washi Tapes */}
        <div className="washi-tape washi-tape-yellow -top-3 left-10 !w-28 !h-4.5 !opacity-90 shadow-xs"></div>
        <div className="washi-tape washi-tape-pink -top-3 right-10 !w-24 !h-4.5 !opacity-90 shadow-xs"></div>

        {/* Close Button */}
        <button
          onClick={() => {
            sound.playPop();
            onClose();
          }}
          className="absolute top-4 right-4 p-2 rounded-full bg-[#F3EDE0] text-[#57534E] hover:bg-[#E5DAC0] hover:text-[#1F2937] transition-colors cursor-pointer"
          title="Tutup Katalog Dataset"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="pt-1 border-b border-[#EAE1CD] pb-4 space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FEF3C7] border border-[#FDE68A] text-[#92400E] text-[11px] font-bold shadow-2xs">
            <Database className="w-3.5 h-3.5 text-amber-600" />
            <span>PORTAL DATA TERBUKA &amp; REPOSITORI PUBLIK</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-marker text-[#1E293B]">
            Katalog &amp; Unduh Dataset Terpercaya
          </h2>
          <p className="text-xs text-[#64748B] max-w-2xl leading-relaxed">
            Akses bebas data perkara korupsi Indonesia dalam format mesin (CSV &amp; JSON) berbasis nomor putusan pengadilan inkrah, rujukan resmi Mahkamah Agung RI, audit BPKP/BPK, dan KPK.go.id.
          </p>
          <div className="flex items-center gap-2 pt-1">
            <span className="px-2 py-0.5 rounded-md bg-emerald-100 border border-emerald-300 text-emerald-800 text-[10px] font-bold">
              Lisensi: CC-BY 4.0 (Bebas Riset &amp; Publikasi)
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              Pembaruan Terakhir: September 2026
            </span>
          </div>
        </div>

        {/* Grid 4 Dataset Siap Unduh */}
        <div className="space-y-2.5">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Pilih Dataset untuk Diunduh</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {datasets.map(d => {
              const IconComp = d.icon;
              return (
                <div 
                  key={d.id}
                  className="bg-white border-2 border-[#E7DECB] hover:border-amber-400 rounded-2xl p-4 shadow-xs flex flex-col justify-between transition-all space-y-3"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-[#FAF5E8] border border-[#E7DECB] flex items-center justify-center text-slate-700">
                          <IconComp className="w-4 h-4 text-amber-700" />
                        </div>
                        <h4 className="font-bold text-xs text-[#1E293B] leading-tight">
                          {d.title}
                        </h4>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border shrink-0 ${d.badgeColor}`}>
                        {d.count}
                      </span>
                    </div>

                    <p className="text-[11px] text-[#64748B] leading-relaxed">
                      {d.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                    <a
                      href={d.csvUrl}
                      download
                      onClick={() => sound.playSuccess()}
                      className="flex-1 py-1.5 px-2.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                      title="Unduh format spreadsheet CSV"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Unduh CSV</span>
                    </a>

                    <a
                      href={d.jsonUrl}
                      download
                      onClick={() => sound.playSuccess()}
                      className="flex-1 py-1.5 px-2.5 bg-blue-50 hover:bg-blue-100 border border-blue-300 text-blue-800 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                      title="Unduh format pengembang JSON"
                    >
                      <FileCode className="w-3.5 h-3.5 text-blue-700" />
                      <span>Unduh JSON</span>
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tautan Rujukan Sumber Lembaga Resmi */}
        <div className="p-3.5 bg-[#FAF5E8] border border-[#E7DECB] rounded-2xl space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-[#713F12] flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-amber-700" />
              <span>Verifikasi Silang Sumber Resmi Negara (Primary Sources)</span>
            </h4>
            <span className="text-[10px] text-slate-500 font-medium">100% Tautan Resmi</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
            {officialSources.map(s => (
              <a
                key={s.name}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => sound.playPop()}
                className="p-2 bg-white rounded-xl border border-[#E7DECB] hover:border-amber-500 hover:shadow-xs transition-all flex flex-col justify-between group"
              >
                <div className="font-bold text-[#1E293B] group-hover:text-amber-800 flex items-center justify-between">
                  <span>{s.name}</span>
                  <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-amber-600" />
                </div>
                <span className="text-[9.5px] text-[#78716C] mt-1 leading-tight line-clamp-2">
                  {s.desc}
                </span>
              </a>
            ))}
          </div>
        </div>

        {/* Developer Quick API Access */}
        <div className="p-3 bg-slate-900 rounded-2xl text-slate-200 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-mono font-bold text-amber-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>REST API Akses Pengembang / Peneliti</span>
            </span>
            <button
              type="button"
              onClick={() => copyToClipboard('curl -s "https://ligakorupsi.id/api/export?type=cases&format=json"', 'curl')}
              className="text-[10px] font-bold px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded cursor-pointer flex items-center gap-1"
            >
              {copiedEndpoint === 'curl' ? (
                <>
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span>Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Salin cURL</span>
                </>
              )}
            </button>
          </div>
          <pre className="text-[10.5px] font-mono bg-slate-950 p-2.5 rounded-xl overflow-x-auto text-emerald-400">
            <code>curl -s "https://ligakorupsi.id/api/export?type=cases&amp;format=json"</code>
          </pre>
        </div>

        {/* Footer Tombol Tutup */}
        <div className="pt-1 flex items-center justify-end border-t border-[#EAE1CD]">
          <button
            type="button"
            onClick={() => {
              sound.playPop();
              onClose();
            }}
            className="px-5 py-2 bg-[#1E293B] hover:bg-[#334155] text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
          >
            Tutup Katalog
          </button>
        </div>

      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
};
