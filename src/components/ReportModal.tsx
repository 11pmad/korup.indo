import React, { useState, useEffect } from 'react';
import { sound } from '../utils/audio.js';
import { formatRupiah } from '../utils/formatters.js';
import { 
  X, 
  Send, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Copy, 
  Check, 
  Search, 
  Scale, 
  ExternalLink, 
  ChevronRight, 
  ChevronLeft, 
  FileText, 
  ShieldCheck, 
  Mail, 
  HelpCircle,
  XCircle,
  Sparkles,
  Building2,
  MapPin,
  DollarSign,
  Calendar,
  Layers,
  Info,
  Image as ImageIcon,
  Upload
} from 'lucide-react';
import { getOfficialPhoto, handleImageError } from '../utils/photo.js';

import { PROVINCES_LIST, SECTORS_LIST } from '../constants/provinces.js';
export { PROVINCES_LIST, SECTORS_LIST };

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseId: string | null;
  cases: { id: string; title: string }[];
  initialMode?: 'new_case' | 'correction' | 'track';
}

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  caseId,
  cases,
  initialMode = 'new_case'
}) => {
  // Navigation modes: 'new_case' | 'correction' | 'track'
  const [activeMode, setActiveMode] = useState<'new_case' | 'correction' | 'track'>('new_case');

  // ==================== STATE: USULAN KASUS BARU ====================
  const [newTitle, setNewTitle] = useState<string>('');
  const [newSuspect, setNewSuspect] = useState<string>('');
  const [newSuspectPhotoUrl, setNewSuspectPhotoUrl] = useState<string>('');
  const [newInstitution, setNewInstitution] = useState<string>('');
  const [newProvinceId, setNewProvinceId] = useState<string>('dki-jakarta');
  const [newSector, setNewSector] = useState<string>('suap_gratifikasi');
  const [newLossInput, setNewLossInput] = useState<string>('');
  const [newLegalStatus, setNewLegalStatus] = useState<string>('tersangka');
  const [newIncidentYear, setNewIncidentYear] = useState<string>(new Date().getFullYear().toString());
  const [newSourceUrl, setNewSourceUrl] = useState<string>('');
  const [newChronology, setNewChronology] = useState<string>('');
  const [newContact, setNewContact] = useState<string>('');
  const [newIntegrityAgreed, setNewIntegrityAgreed] = useState<boolean>(false);

  // ==================== STATE: KOREKSI DATA KASUS ====================
  const [correctionStep, setCorrectionStep] = useState<1 | 2 | 3>(1);
  const [correctionType, setCorrectionType] = useState<'koreksi_data' | 'rujukan_putusan_baru'>('koreksi_data');
  const [selectedCaseId, setSelectedCaseId] = useState<string>(caseId || (cases[0]?.id || ''));
  const [isGeneralCase, setIsGeneralCase] = useState<boolean>(false);
  const [correctionDesc, setCorrectionDesc] = useState<string>('');
  const [correctionRefUrl, setCorrectionRefUrl] = useState<string>('');
  const [correctionContact, setCorrectionContact] = useState<string>('');

  // ==================== SHARED SUBMISSION & TICKET STATE ====================
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [issuedTicketId, setIssuedTicketId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedTicket, setCopiedTicket] = useState<boolean>(false);

  // ==================== STATE: TRACKING TIKET ====================
  const [trackInput, setTrackInput] = useState<string>('');
  const [trackLoading, setTrackLoading] = useState<boolean>(false);
  const [trackResult, setTrackResult] = useState<any | null>(null);
  const [trackError, setTrackError] = useState<string | null>(null);

  // Setup initial mode when opened
  useEffect(() => {
    if (isOpen) {
      if (initialMode) {
        setActiveMode(initialMode);
      } else if (caseId) {
        setActiveMode('correction');
      } else {
        setActiveMode('new_case');
      }
    }
  }, [isOpen, initialMode, caseId]);

  // Auto-fill case if provided via props
  useEffect(() => {
    if (caseId) {
      setSelectedCaseId(caseId);
      setIsGeneralCase(false);
    }
  }, [caseId]);

  if (!isOpen) return null;

  // Numeric loss calculation helper
  const parsedNewLoss = parseFloat(newLossInput.replace(/[^0-9]/g, '')) || 0;

  // SUBMIT: USULAN KASUS BARU
  const handleSubmitNewCase = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!newTitle.trim() || newTitle.trim().length < 5) {
      setErrorMessage('Judul perkara wajib diisi minimal 5 karakter.');
      return;
    }
    if (!newSuspect.trim() || newSuspect.trim().length < 2) {
      setErrorMessage('Nama pihak terduga / pejabat wajib dicantumkan.');
      return;
    }
    if (!newSourceUrl.trim() || (!newSourceUrl.startsWith('http://') && !newSourceUrl.startsWith('https://'))) {
      setErrorMessage('Tautan sumber rujukan wajib berupa URL valid yang diawali http:// atau https://');
      return;
    }
    if (!newChronology.trim() || newChronology.trim().length < 15) {
      setErrorMessage('Uraian kronologi / modus dugaan korupsi wajib minimal 15 karakter.');
      return;
    }
    if (!newIntegrityAgreed) {
      setErrorMessage('Mohon setujui pernyataan kepatuhan asas hukum dan integritas laporan.');
      return;
    }

    setSubmitting(true);
    const selectedProvObj = PROVINCES_LIST.find(p => p.id === newProvinceId);
    const selectedSectorObj = SECTORS_LIST.find(s => s.id === newSector);

    const fullDescription = `[USULAN KASUS BARU]\nJudul Kasus: ${newTitle.trim()}\nTerduga: ${newSuspect.trim()}\nInstansi: ${newInstitution.trim() || '-'}\nWilayah: ${selectedProvObj?.name || newProvinceId}\nSektor: ${selectedSectorObj?.label || newSector}\nEstimasi Kerugian: ${formatRupiah(parsedNewLoss)}\nStatus Hukum: ${newLegalStatus}\nTahun Kejadian: ${newIncidentYear}${newSuspectPhotoUrl.trim() ? `\nFoto Terduga: ${newSuspectPhotoUrl.trim()}` : ''}\n\nKronologi Perkara:\n${newChronology.trim()}`;

    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          case_id: null,
          report_type: 'usulan_kasus_baru',
          description: fullDescription,
          reference_url: newSourceUrl.trim(),
          submitter_contact: newContact.trim() || undefined,
          metadata: {
            case_title: newTitle.trim(),
            suspect_name: newSuspect.trim(),
            suspect_photo_url: newSuspectPhotoUrl.trim() || undefined,
            institution: newInstitution.trim(),
            province_id: newProvinceId,
            province_name: selectedProvObj?.name || newProvinceId,
            sector_category: newSector,
            loss_amount: parsedNewLoss,
            legal_status: newLegalStatus,
            incident_year: newIncidentYear,
            chronology: newChronology.trim()
          }
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal mengirimkan usulan kasus');
      }

      sound.playCheer();
      setIssuedTicketId(data.ticket_id || data.data?.id || `LKI-NEW-${Date.now().toString(36).toUpperCase()}`);
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // SUBMIT: KOREKSI KASUS LAMA
  const handleSubmitCorrection = async () => {
    setSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          case_id: isGeneralCase ? null : (selectedCaseId || caseId),
          report_type: correctionType,
          description: correctionDesc.trim(),
          reference_url: correctionRefUrl.trim() || undefined,
          submitter_contact: correctionContact.trim() || undefined
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal mengirimkan koreksi');
      }

      sound.playCheer();
      setIssuedTicketId(data.ticket_id || data.data?.id || `LKI-REP-${Date.now().toString(36).toUpperCase()}`);
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // TRACK QUERY
  const handleTrackQuery = async (ticketToSearch?: string) => {
    const q = (ticketToSearch || trackInput).trim();
    if (!q) {
      setTrackError('Silakan masukkan nomor tiket laporan Anda.');
      return;
    }

    setTrackLoading(true);
    setTrackError(null);
    setTrackResult(null);

    try {
      const res = await fetch(`/api/reports/status/${encodeURIComponent(q)}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Tiket laporan tidak ditemukan.');
      }
      sound.playPop();
      setTrackResult(data.ticket);
    } catch (err: any) {
      setTrackError(err.message);
    } finally {
      setTrackLoading(false);
    }
  };

  const handleCopyTicket = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTicket(true);
    sound.playPop();
    setTimeout(() => setCopiedTicket(false), 2000);
  };

  const handleResetForm = () => {
    setIssuedTicketId(null);
    setErrorMessage(null);
    // Reset new case
    setNewTitle('');
    setNewSuspect('');
    setNewSuspectPhotoUrl('');
    setNewInstitution('');
    setNewLossInput('');
    setNewSourceUrl('');
    setNewChronology('');
    setNewContact('');
    setNewIntegrityAgreed(false);
    // Reset correction
    setCorrectionStep(1);
    setCorrectionDesc('');
    setCorrectionRefUrl('');
    setCorrectionContact('');
  };

  const selectedCaseObj = cases.find(c => c.id === selectedCaseId);

  return (
    <div
      id="report-modal"
      className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-2xl bg-[#FFFDF8] border-3 border-[#E2D5B7] rounded-3xl shadow-2xl p-5 sm:p-7 space-y-4 max-h-[92vh] overflow-y-auto">
        
        {/* Scrapbook Decor */}
        <div className="washi-tape washi-tape-yellow -top-3 left-8"></div>
        <div className="washi-tape washi-tape-pink -top-3 right-8"></div>

        {/* Close Button */}
        <button
          onClick={() => {
            sound.playPop();
            onClose();
          }}
          className="absolute top-4 right-4 p-2 rounded-full bg-[#F3EDE0] text-[#57534E] hover:bg-[#E5DAC0] transition-colors cursor-pointer"
          title="Tutup Modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="space-y-3 pt-1">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-100 border border-amber-300 text-[#B45309] flex items-center justify-center shrink-0 shadow-2xs rotate-[-2deg]">
              <Scale className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-marker text-2xl text-[#1E293B] tracking-wide">
                Kanal Partisipasi &amp; Laporan Warga
              </h3>
              <p className="text-xs text-[#64748B]">
                Mendukung transparansi hukum berbasis rujukan resmi peradilan &amp; media kredibel.
              </p>
            </div>
          </div>

          {/* 3-Mode Switcher Tabs */}
          <div className="flex items-center gap-1 bg-[#F1EBD9] p-1 rounded-2xl border border-[#E2D5B7]">
            <button
              type="button"
              onClick={() => {
                sound.playPop();
                setActiveMode('new_case');
                setIssuedTicketId(null);
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeMode === 'new_case'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Usulkan Kasus Baru</span>
            </button>

            <button
              type="button"
              onClick={() => {
                sound.playPop();
                setActiveMode('correction');
                setIssuedTicketId(null);
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeMode === 'correction'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Koreksi Berkas</span>
            </button>

            <button
              type="button"
              onClick={() => {
                sound.playPop();
                setActiveMode('track');
                setIssuedTicketId(null);
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeMode === 'track'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              <span>Lacak Tiket</span>
            </button>
          </div>
        </div>

        {/* Global Error Banner */}
        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-semibold flex items-center gap-2">
            <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SUCCESS / TICKET ISSUED SCREEN (FOR BOTH MODES)                           */}
        {/* ========================================================================= */}
        {issuedTicketId ? (
          <div className="space-y-5 py-2 animate-in zoom-in-95 duration-200">
            <div className="p-6 bg-[#F0FDF4] border-2 border-[#BBF7D0] rounded-3xl text-center space-y-4 shadow-sm">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto border border-emerald-200 shadow-xs rotate-[-2deg]">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-1">
                <h4 className="font-bold text-lg text-emerald-900">
                  {activeMode === 'new_case' ? 'Usulan Kasus Baru Berhasil Dikirim!' : 'Laporan Koreksi Berhasil Diajukan!'}
                </h4>
                <p className="text-xs text-emerald-800 leading-relaxed max-w-md mx-auto">
                  Terima kasih telah berpartisipasi menjaga keterbukaan data. Berkas usulan Anda kini masuk ke antrean kurasi verifikator independen LKI.
                </p>
              </div>

              {/* Ticket ID Box */}
              <div className="p-4 bg-white border border-emerald-200 rounded-2xl shadow-2xs space-y-1.5 max-w-md mx-auto">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                  Nomor Tiket Bukti Pelaporan Anda
                </span>
                <div className="flex items-center justify-center gap-2">
                  <span className="font-mono text-base sm:text-xl font-black text-slate-900 tracking-wide">
                    {issuedTicketId}
                  </span>
                  <button
                    onClick={() => handleCopyTicket(issuedTicketId)}
                    className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                    title="Salin Nomor Tiket"
                  >
                    {copiedTicket ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <span className="text-[10px] text-slate-500 block">
                  Gunakan tiket ini kapan saja pada tab <strong>Lacak Tiket</strong> untuk memeriksa hasil telaah.
                </span>
              </div>

              {/* 3-Stage Public Verification Flow */}
              <div className="pt-2 text-left border-t border-emerald-100 space-y-2">
                <span className="text-[11px] font-bold text-emerald-900 block uppercase tracking-wider">
                  Alur Verifikasi oleh Tim Kurator:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                  <div className="p-2.5 bg-white rounded-xl border border-emerald-200 flex items-start gap-2">
                    <span className="font-bold text-emerald-700 font-mono">1.</span>
                    <div>
                      <strong className="block text-slate-800">Tercatat</strong>
                      <span className="text-slate-500 text-[10px]">Masuk antrean sistem</span>
                    </div>
                  </div>
                  <div className="p-2.5 bg-white rounded-xl border border-amber-200 flex items-start gap-2">
                    <span className="font-bold text-amber-700 font-mono">2.</span>
                    <div>
                      <strong className="block text-slate-800">Uji Bukti</strong>
                      <span className="text-slate-500 text-[10px]">Cek silang MA / KPK / BPKP</span>
                    </div>
                  </div>
                  <div className="p-2.5 bg-white rounded-xl border border-blue-200 flex items-start gap-2">
                    <span className="font-bold text-blue-700 font-mono">3.</span>
                    <div>
                      <strong className="block text-slate-800">Terbit Resmi</strong>
                      <span className="text-slate-500 text-[10px]">Tampil di Klasemen &amp; Peta</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-1">
              <button
                onClick={() => {
                  sound.playPop();
                  setTrackInput(issuedTicketId);
                  setActiveMode('track');
                  handleTrackQuery(issuedTicketId);
                }}
                className="w-full sm:w-auto px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-indigo-200"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Lacak Status Tiket Ini Sekarang</span>
              </button>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  onClick={handleResetForm}
                  className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Kirim Laporan Lain
                </button>
                <button
                  onClick={() => {
                    sound.playPop();
                    onClose();
                    handleResetForm();
                  }}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Selesai
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* ========================================================================= */}
            {/* MODE 1: USULKAN KASUS KORUPSI BARU (DEDICATED CITIZEN SUBMISSION FORM)    */}
            {/* ========================================================================= */}
            {activeMode === 'new_case' && (
              <form onSubmit={handleSubmitNewCase} className="space-y-4">
                
                {/* Intro Notice Banner */}
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-2.5 text-xs text-amber-900 leading-relaxed">
                  <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-bold">Laporkan Perkara yang Belum Terdaftar di LKI</strong>
                    <span>
                      Setiap usulan warga wajib melampirkan tautan rujukan resmi (KPK, Kejaksaan, Putusan MA, atau media pers kredibel) guna memastikan independensi dan praduga tak bersalah.
                    </span>
                  </div>
                </div>

                {/* Form Inputs Grid */}
                <div className="space-y-3.5">
                  {/* Field 1: Judul Kasus */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Judul Kasus / Dugaan Perkara <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newTitle}
                      onChange={e => setNewTitle(e.target.value)}
                      placeholder="Contoh: Dugaan Korupsi Pengadaan Alat Kesehatan RSUD Kab. X"
                      required
                      className="w-full px-3.5 py-2.5 bg-white border border-[#D5C9AB] rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                    />
                  </div>

                  {/* Field 2: Nama Pihak & Instansi (2 Cols) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Nama Terduga / Pejabat Terlibat <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={newSuspect}
                        onChange={e => setNewSuspect(e.target.value)}
                        placeholder="Nama tersangka/terdakwa/korporasi"
                        required
                        className="w-full px-3.5 py-2.5 bg-white border border-[#D5C9AB] rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Instansi / Lembaga / BUMN
                      </label>
                      <input
                        type="text"
                        value={newInstitution}
                        onChange={e => setNewInstitution(e.target.value)}
                        placeholder="Contoh: Dinas PU / Kementerian ESDM"
                        className="w-full px-3.5 py-2.5 bg-white border border-[#D5C9AB] rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                      />
                    </div>
                  </div>

                  {/* Field: Foto Terduga / Pejabat (Opsional) */}
                  <div className="p-3.5 bg-[#FAF5E8] border border-[#D5C9AB] rounded-2xl space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <ImageIcon className="w-3.5 h-3.5 text-amber-600" />
                        <span>Foto Terduga / Pejabat (Opsional)</span>
                      </label>
                      <span className="text-[10px] text-slate-500">
                        Default: Siluet Berkas LKI
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="relative shrink-0">
                        <div className="w-14 h-14 rounded-xl overflow-hidden border border-[#D5C9AB] bg-white shadow-2xs">
                          <img
                            src={getOfficialPhoto(newSuspectPhotoUrl)}
                            alt="Pratinjau Foto"
                            onError={handleImageError}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        {newSuspectPhotoUrl && (
                          <button
                            type="button"
                            onClick={() => setNewSuspectPhotoUrl('')}
                            className="absolute -top-1 -right-1 p-0.5 bg-rose-600 text-white rounded-full hover:bg-rose-700 shadow-xs cursor-pointer transition-colors"
                            title="Hapus foto"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>

                      <div className="flex-1 space-y-1.5">
                        <input
                          type="url"
                          value={newSuspectPhotoUrl}
                          onChange={e => setNewSuspectPhotoUrl(e.target.value)}
                          placeholder="Tempel tautan URL foto (https://...)"
                          className="w-full px-3 py-1.5 bg-white border border-[#D5C9AB] rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-amber-500"
                        />
                        <div className="flex items-center gap-2">
                          <label className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-[#D5C9AB] hover:bg-slate-50 rounded-lg text-[11px] font-semibold text-slate-700 cursor-pointer shadow-2xs transition-colors">
                            <Upload className="w-3 h-3 text-amber-600" />
                            <span>Unggah Foto</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={e => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  if (file.size > 2 * 1024 * 1024) {
                                    alert('Ukuran file maksimal 2MB');
                                    return;
                                  }
                                  const reader = new FileReader();
                                  reader.onload = () => {
                                    if (typeof reader.result === 'string') {
                                      setNewSuspectPhotoUrl(reader.result);
                                    }
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                            />
                          </label>
                          <span className="text-[10px] text-slate-500">
                            JPG, PNG, WebP (maks. 2MB)
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Field 3: Wilayah Provinsi & Sektor (2 Cols) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Wilayah / Provinsi <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={newProvinceId}
                        onChange={e => setNewProvinceId(e.target.value)}
                        className="w-full px-3 py-2.5 bg-white border border-[#D5C9AB] rounded-xl text-xs text-slate-900 focus:outline-hidden focus:border-amber-500"
                      >
                        {PROVINCES_LIST.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Sektor Dugaan Korupsi
                      </label>
                      <select
                        value={newSector}
                        onChange={e => setNewSector(e.target.value)}
                        className="w-full px-3 py-2.5 bg-white border border-[#D5C9AB] rounded-xl text-xs text-slate-900 focus:outline-hidden focus:border-amber-500"
                      >
                        {SECTORS_LIST.map(s => (
                          <option key={s.id} value={s.id}>{s.icon} {s.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Field 4: Estimasi Kerugian & Status Hukum (2 Cols) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-bold text-slate-700">
                          Estimasi Kerugian Negara (Rp)
                        </label>
                        {parsedNewLoss > 0 && (
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                            {formatRupiah(parsedNewLoss)}
                          </span>
                        )}
                      </div>
                      <input
                        type="text"
                        value={newLossInput}
                        onChange={e => setNewLossInput(e.target.value)}
                        placeholder="Contoh: 15.000.000.000 (boleh kosong)"
                        className="w-full px-3.5 py-2.5 bg-white border border-[#D5C9AB] rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Status Penanganan Hukum
                      </label>
                      <select
                        value={newLegalStatus}
                        onChange={e => setNewLegalStatus(e.target.value)}
                        className="w-full px-3 py-2.5 bg-white border border-[#D5C9AB] rounded-xl text-xs text-slate-900 focus:outline-hidden focus:border-amber-500"
                      >
                        <option value="tersangka">Tersangka (Sprindik KPK / Kejaksaan)</option>
                        <option value="terdakwa">Terdakwa (Sedang Sidang Tipikor)</option>
                        <option value="divonis_inkrah">Vonis Pengadilan / Kasasi MA (Inkrah)</option>
                        <option value="bebas">Bebas / Menang Praperadilan</option>
                      </select>
                    </div>
                  </div>

                  {/* Field 5: Tautan Sumber Rujukan Resmi (Wajib) */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Tautan URL Berita Resmi / Putusan Pengadilan <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <ExternalLink className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="url"
                        value={newSourceUrl}
                        onChange={e => setNewSourceUrl(e.target.value)}
                        placeholder="https://kpk.go.id/... atau https://putusan3.mahkamahagung.go.id/..."
                        required
                        className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-[#D5C9AB] rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-amber-500"
                      />
                    </div>
                    <span className="text-[10px] text-slate-500 block mt-0.5">
                      Wajib melampirkan tautan rilis KPK/Kejaksaan, Direktori Putusan MA, atau media terdaftar Dewan Pers.
                    </span>
                  </div>

                  {/* Field 6: Kronologi Singkat */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Kronologi Singkat &amp; Modus Dugaan Korupsi <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      rows={3}
                      value={newChronology}
                      onChange={e => setNewChronology(e.target.value)}
                      placeholder="Jelaskan ringkasan fakta perkara, tahun kejadian, proyek yang dikorupsi, dan pasal yang disangkakan..."
                      required
                      className="w-full px-3.5 py-2.5 bg-white border border-[#D5C9AB] rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-amber-500"
                    />
                  </div>

                  {/* Field 7: Kontak Pelapor (Opsional) */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Kontak Pelapor (Email / WhatsApp — Opsional)
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        value={newContact}
                        onChange={e => setNewContact(e.target.value)}
                        placeholder="nama@email.com (untuk menerima status telaah kasus)"
                        className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-[#D5C9AB] rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-amber-500"
                      />
                    </div>
                  </div>

                  {/* Checkbox: Integritas & Asas Hukum */}
                  <label className="flex items-start gap-2.5 p-3 bg-[#FAF6EC] border border-[#E7DECB] rounded-2xl cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newIntegrityAgreed}
                      onChange={e => setNewIntegrityAgreed(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                    />
                    <span className="text-[11px] text-slate-700 leading-snug">
                      Saya menyatakan bahwa usulan kasus ini didasarkan pada fakta rujukan publik resmi, diajukan dengan itikad baik untuk transparansi, serta menjunjung tinggi <strong>asas praduga tak bersalah</strong>.
                    </span>
                  </label>
                </div>

                {/* Submit Action Buttons */}
                <div className="pt-2 flex items-center justify-between border-t border-[#E7DECB]">
                  <button
                    type="button"
                    onClick={() => {
                      sound.playPop();
                      onClose();
                    }}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                  >
                    Batal
                  </button>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{submitting ? 'Mengirimkan Usulan...' : 'Kirim Usulan Kasus Baru'}</span>
                  </button>
                </div>

              </form>
            )}

            {/* ========================================================================= */}
            {/* MODE 2: KOREKSI DATA KASUS TERDAFTAR (3-STEP WIZARD)                      */}
            {/* ========================================================================= */}
            {activeMode === 'correction' && (
              <div className="space-y-4">
                
                {/* Stepper Progress Indicator */}
                <div className="flex items-center justify-between pb-2 border-b border-[#E7DECB]">
                  <div className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold font-mono ${
                      correctionStep === 1 ? 'bg-rose-600 text-white shadow-xs' : 'bg-emerald-600 text-white'
                    }`}>
                      {correctionStep > 1 ? '✓' : '1'}
                    </div>
                    <span className={`text-xs font-bold ${correctionStep === 1 ? 'text-slate-900' : 'text-slate-500'}`}>
                      Kategori &amp; Kasus
                    </span>
                  </div>

                  <div className="w-8 h-0.5 bg-slate-200"></div>

                  <div className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold font-mono ${
                      correctionStep === 2 ? 'bg-rose-600 text-white shadow-xs' : correctionStep > 2 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                    }`}>
                      {correctionStep > 2 ? '✓' : '2'}
                    </div>
                    <span className={`text-xs font-bold ${correctionStep === 2 ? 'text-slate-900' : 'text-slate-500'}`}>
                      Bukti &amp; Rincian
                    </span>
                  </div>

                  <div className="w-8 h-0.5 bg-slate-200"></div>

                  <div className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold font-mono ${
                      correctionStep === 3 ? 'bg-rose-600 text-white shadow-xs' : 'bg-slate-200 text-slate-600'
                    }`}>
                      3
                    </div>
                    <span className={`text-xs font-bold ${correctionStep === 3 ? 'text-slate-900' : 'text-slate-500'}`}>
                      Konfirmasi
                    </span>
                  </div>
                </div>

                {/* STEP 1: PILIH KASUS & KATEGORI */}
                {correctionStep === 1 && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Jenis Permohonan Koreksi:
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setCorrectionType('koreksi_data')}
                          className={`p-3 rounded-2xl border text-left text-xs space-y-1 transition-all cursor-pointer ${
                            correctionType === 'koreksi_data'
                              ? 'bg-rose-50/70 border-rose-400 text-rose-900 font-bold'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <span className="block font-bold">📝 Koreksi Data Perkara</span>
                          <span className="text-[11px] text-slate-500 font-normal">
                            Kesalahan nama, jabatan, nilai kerugian, atau kronologi.
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setCorrectionType('rujukan_putusan_baru')}
                          className={`p-3 rounded-2xl border text-left text-xs space-y-1 transition-all cursor-pointer ${
                            correctionType === 'rujukan_putusan_baru'
                              ? 'bg-rose-50/70 border-rose-400 text-rose-900 font-bold'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <span className="block font-bold">⚖️ Putusan Baru / Kasasi MA</span>
                          <span className="text-[11px] text-slate-500 font-normal">
                            Pembaruan vonis kasasi, peninjauan kembali (PK), atau vonis bebas.
                          </span>
                        </button>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-bold text-slate-700">
                          Target Berkas Perkara:
                        </label>
                        <label className="flex items-center gap-1.5 text-xs text-slate-500 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isGeneralCase}
                            onChange={e => setIsGeneralCase(e.target.checked)}
                            className="rounded border-slate-300 text-rose-600 focus:ring-rose-500 cursor-pointer"
                          />
                          <span>Masukan Umum</span>
                        </label>
                      </div>

                      {!isGeneralCase ? (
                        <select
                          value={selectedCaseId}
                          onChange={e => setSelectedCaseId(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-white border border-[#D5C9AB] rounded-xl text-xs text-slate-900 focus:outline-hidden focus:border-rose-500"
                        >
                          {cases.map(c => (
                            <option key={c.id} value={c.id}>
                              {c.title}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className="p-3 bg-slate-100 rounded-xl text-xs text-slate-600 italic">
                          Laporan akan ditujukan ke basis data umum LKI tanpa terikat berkas spesifik.
                        </div>
                      )}
                    </div>

                    <div className="pt-2 flex justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          sound.playPop();
                          setCorrectionStep(2);
                        }}
                        className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <span>Lanjut ke Bukti &amp; Uraian</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 2: RINCIAN & BUKTI URL */}
                {correctionStep === 2 && (
                  <div className="space-y-3.5">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Uraian Masukan / Koreksi Kesalahan <span className="text-rose-500">*</span>
                      </label>
                      <textarea
                        rows={3}
                        value={correctionDesc}
                        onChange={e => setCorrectionDesc(e.target.value)}
                        placeholder="Jelaskan bagian data yang keliru serta perbaikan data yang benar..."
                        required
                        className="w-full px-3.5 py-2.5 bg-white border border-[#D5C9AB] rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-rose-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Tautan Bukti / Putusan Resmi (URL Rujukan)
                      </label>
                      <div className="relative">
                        <ExternalLink className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                        <input
                          type="url"
                          value={correctionRefUrl}
                          onChange={e => setCorrectionRefUrl(e.target.value)}
                          placeholder="https://putusan3.mahkamahagung.go.id/... atau rilis berita media"
                          className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-[#D5C9AB] rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-rose-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Kontak Pelapor (Opsional)
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                        <input
                          type="text"
                          value={correctionContact}
                          onChange={e => setCorrectionContact(e.target.value)}
                          placeholder="nama@email.com"
                          className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-[#D5C9AB] rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-rose-500"
                        />
                      </div>
                    </div>

                    <div className="pt-2 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => {
                          sound.playPop();
                          setCorrectionStep(1);
                        }}
                        className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        <span>Kembali</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (!correctionDesc.trim() || correctionDesc.trim().length < 5) {
                            setErrorMessage('Uraian koreksi minimal 5 karakter.');
                            return;
                          }
                          setErrorMessage(null);
                          sound.playPop();
                          setCorrectionStep(3);
                        }}
                        className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <span>Lanjut ke Review</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 3: KONFIRMASI & KIRIM */}
                {correctionStep === 3 && (
                  <div className="space-y-4">
                    <div className="p-4 bg-[#FAF6EC] border border-[#E7DECB] rounded-2xl space-y-2 text-xs">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        Ringkasan Pengajuan Koreksi:
                      </span>
                      <div className="space-y-1">
                        <p><strong>Target Kasus:</strong> {isGeneralCase ? 'Masukan Umum' : selectedCaseObj?.title || selectedCaseId}</p>
                        <p><strong>Jenis Koreksi:</strong> {correctionType === 'rujukan_putusan_baru' ? 'Putusan Baru / Kasasi MA' : 'Koreksi Data Perkara'}</p>
                        <p><strong>Uraian:</strong> {correctionDesc}</p>
                        {correctionRefUrl && <p><strong>Bukti:</strong> <span className="text-rose-700 break-all">{correctionRefUrl}</span></p>}
                        {correctionContact && <p><strong>Kontak:</strong> {correctionContact}</p>}
                      </div>
                    </div>

                    <div className="pt-2 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => {
                          sound.playPop();
                          setCorrectionStep(2);
                        }}
                        className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        <span>Kembali</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleSubmitCorrection}
                        disabled={submitting}
                        className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>{submitting ? 'Mengirimkan...' : 'Kirim Laporan Koreksi'}</span>
                      </button>
                    </div>
                  </div>
                )}

              </div>
            )}

            {/* ========================================================================= */}
            {/* MODE 3: LACAK STATUS TIKET LAPORAN                                        */}
            {/* ========================================================================= */}
            {activeMode === 'track' && (
              <div className="space-y-4">
                
                {/* Search Box */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    Masukkan Nomor Tiket Laporan (LKI-NEW-... atau LKI-REP-...):
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={trackInput}
                      onChange={e => setTrackInput(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleTrackQuery();
                        }
                      }}
                      placeholder="Contoh: LKI-NEW-MU7D5SAR-QWUH"
                      className="flex-1 px-3.5 py-2.5 bg-white border border-[#D5C9AB] rounded-xl text-xs font-mono font-bold text-slate-900 placeholder:font-normal focus:outline-hidden focus:border-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() => handleTrackQuery()}
                      disabled={trackLoading}
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {trackLoading ? <Clock className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                      <span>{trackLoading ? 'Mencari...' : 'Lacak Tiket'}</span>
                    </button>
                  </div>
                </div>

                {trackError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-semibold flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                    <span>{trackError}</span>
                  </div>
                )}

                {/* Tracking Result Card */}
                {trackResult && (
                  <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-3 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <div>
                        <span className="font-mono text-xs font-black text-slate-800">
                          {trackResult.id}
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          Diajukan pada {new Date(trackResult.created_at).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </span>
                      </div>

                      {/* Status Badge */}
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1.5 ${
                        trackResult.status === 'approved'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : trackResult.status === 'rejected'
                          ? 'bg-rose-100 text-rose-800 border border-rose-300'
                          : 'bg-amber-100 text-amber-800 border border-amber-300'
                      }`}>
                        {trackResult.status === 'approved' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                        {trackResult.status === 'rejected' && <XCircle className="w-3.5 h-3.5 text-rose-600" />}
                        {trackResult.status === 'pending_review' && <Clock className="w-3.5 h-3.5 text-amber-600" />}
                        <span>
                          {trackResult.status === 'approved' ? 'Disetujui & Diterbitkan' : trackResult.status === 'rejected' ? 'Ditolak' : 'Menunggu Review'}
                        </span>
                      </span>
                    </div>

                    {/* Target Case / Proposal */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          trackResult.report_type === 'usulan_kasus_baru'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}>
                          {trackResult.report_type === 'usulan_kasus_baru' ? '🌟 Usulan Kasus Baru' : '📝 Koreksi Berkas'}
                        </span>
                        <h5 className="font-bold text-sm text-slate-900">
                          {trackResult.case_title}
                        </h5>
                      </div>

                      {trackResult.metadata && (
                        <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                          {trackResult.metadata.suspect_name && (
                            <div>
                              <strong className="text-slate-700 block">Pihak Terduga:</strong>
                              <span>{trackResult.metadata.suspect_name}</span>
                            </div>
                          )}
                          {trackResult.metadata.institution && (
                            <div>
                              <strong className="text-slate-700 block">Instansi:</strong>
                              <span>{trackResult.metadata.institution}</span>
                            </div>
                          )}
                          {trackResult.metadata.province_name && (
                            <div>
                              <strong className="text-slate-700 block">Wilayah:</strong>
                              <span>{trackResult.metadata.province_name}</span>
                            </div>
                          )}
                          {trackResult.metadata.loss_amount > 0 && (
                            <div>
                              <strong className="text-slate-700 block">Dugaan Kerugian:</strong>
                              <span className="text-amber-700 font-bold">{formatRupiah(trackResult.metadata.loss_amount)}</span>
                            </div>
                          )}
                        </div>
                      )}

                      <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line pt-1">
                        {trackResult.description}
                      </p>

                      {trackResult.reference_url && (
                        <div className="pt-1">
                          <a
                            href={trackResult.reference_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 hover:underline font-semibold"
                          >
                            <span>Buka Sumber Rujukan Terlampir</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}

      </div>
    </div>
  );
};
