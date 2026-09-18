import React from 'react';
import { BookOpen, ShieldAlert, Heart, Lock } from 'lucide-react';

interface FooterProps {
  onOpenAdmin?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenAdmin }) => {
  return (
    <footer className="mt-16 bg-[#F4EDE0] border-t-2 border-[#E1D4B8] pt-12 pb-10 text-[#57534E]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Brand Info */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-[#FDE047] border border-[#EAB308] flex items-center justify-center text-[#854D0E] font-marker text-lg rotate-[-2deg]">
                <BookOpen className="w-5 h-5" />
              </div>
              <span className="font-marker text-2xl text-[#1E293B]">
                Liga Korupsi Indonesia (LKI)
              </span>
            </div>
            <p className="text-xs leading-relaxed text-[#64748B]">
              Inisiatif transparansi publik independen yang mendokumentasikan perkara korupsi di lingkungan legislatif, eksekutif daerah, dan pejabat publik terkait berdasarkan direktori putusan peradilan resmi &amp; media terverifikasi.
            </p>
          </div>

          {/* Data Sources */}
          <div className="space-y-2">
            <h4 className="font-bold text-sm text-[#1E293B] uppercase tracking-wider font-hand">
              📚 Landasan Sumber Data
            </h4>
            <ul className="text-xs space-y-1.5 text-[#64748B]">
              <li>• Direktori Putusan Mahkamah Agung RI (putusan3.mahkamahagung.go.id)</li>
              <li>• Komisi Pemberantasan Korupsi (KPK.go.id)</li>
              <li>• Kejaksaan Republik Indonesia (kejaksaan.go.id)</li>
              <li>• Kantor Berita &amp; Media Terverifikasi Dewan Pers (Kompas, Detik, Tempo, dll)</li>
            </ul>
          </div>

          {/* Legal Reminder Note */}
          <div className="bg-[#FFFDF8] border-2 border-dashed border-[#CA8A04] rounded-2xl p-4 space-y-2 text-[#713F12]">
            <div className="flex items-center gap-1.5 font-bold text-xs text-[#854D0E]">
              <ShieldAlert className="w-4 h-4 text-[#CA8A04]" />
              <span>Prinsip Asas Praduga Tak Bersalah</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              Pemberitaan dan ringkasan perkara ini bertujuan untuk edukasi hak masyarakat sipil. Seluruh pihak yang masih berstatus Tersangka atau Terdakwa tetap diposisikan berhak atas asas praduga tak bersalah sampai adanya vonis yang berkekuatan hukum tetap (inkrah).
            </p>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-[#E3D7BA] flex flex-col sm:flex-row items-center justify-between text-xs text-[#78716C] gap-3">
          <p>© {new Date().getFullYear()} Liga Korupsi Indonesia (LKI). Terbuka untuk kepentingan advokasi publik &amp; integritas bangsa.</p>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1">
              <span>Dibuat demi Indonesia yang lebih bersih &amp; berintegritas</span>
              <Heart className="w-3.5 h-3.5 text-rose-500 inline fill-rose-500" />
            </div>
            {onOpenAdmin && (
              <>
                <span className="text-[#D5C9AB] hidden sm:inline">•</span>
                <button
                  id="footer-admin-login-btn"
                  onClick={() => {
                    onOpenAdmin();
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="inline-flex items-center gap-1.5 text-[11px] text-[#8C827A] hover:text-[#DC2626] transition-colors py-0.5 px-2 rounded hover:bg-[#EBE0C8] cursor-pointer"
                  title="Akses Masuk Khusus Tim Pengelola & Kurator"
                >
                  <Lock className="w-3 h-3 opacity-70" />
                  <span>Login Pengelola</span>
                </button>
              </>
            )}
          </div>
        </div>

      </div>
    </footer>
  );
};
