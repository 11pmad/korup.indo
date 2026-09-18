import React, { useState } from 'react';
import { sound } from '../utils/audio.js';
import { X, Send, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseId: string | null;
  cases: { id: string; title: string }[];
}

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  caseId,
  cases
}) => {
  const [selectedCaseId, setSelectedCaseId] = useState<string>(caseId || (cases[0]?.id || ''));
  const [reportType, setReportType] = useState<'koreksi_data' | 'rujukan_putusan_baru'>('koreksi_data');
  const [description, setDescription] = useState<string>('');
  const [referenceUrl, setReferenceUrl] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setErrorMessage('Mohon berikan rincian koreksi data atau rujukan putusan.');
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          case_id: selectedCaseId || caseId,
          report_type: reportType,
          description: description,
          reference_url: referenceUrl || undefined,
          submitter_contact: email || undefined
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal mengirim laporan');
      }

      sound.playCheer();
      setSuccessMessage('Terima kasih! Laporan Anda telah berhasil diajukan dan masuk ke antrean kurasi verifikator.');
      setDescription('');
      setReferenceUrl('');
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      id="report-modal"
      className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6"
    >
      <div className="relative w-full max-w-lg bg-[#FFFDF8] border-3 border-[#E2D5B7] rounded-3xl shadow-2xl p-6 sm:p-8 space-y-5">
        <div className="washi-tape washi-tape-pink -top-3 left-8"></div>

        <button
          onClick={() => {
            sound.playPop();
            onClose();
          }}
          className="absolute top-4 right-4 p-2 rounded-full bg-[#F3EDE0] text-[#57534E] hover:bg-[#E5DAC0]"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#FEE2E2] text-[#DC2626] rounded-2xl">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-marker text-2xl text-[#1E293B]">
              Laporkan Koreksi Data
            </h3>
            <p className="text-xs text-[#64748B]">
              Bantu menjaga akurasi transparansi hukum publik Indonesia.
            </p>
          </div>
        </div>

        {successMessage ? (
          <div className="p-5 bg-[#F0FDF4] border border-[#BBF7D0] rounded-2xl text-center space-y-3">
            <CheckCircle2 className="w-10 h-10 text-[#16A34A] mx-auto" />
            <p className="text-sm font-bold text-[#166534]">{successMessage}</p>
            <p className="text-xs text-[#15803D]">
              Laporan masuk ke antrean moderasi dan tidak langsung menimpa data publik secara otomatis tanpa telaah dokumen.
            </p>
            <button
              onClick={() => {
                sound.playPop();
                setSuccessMessage(null);
                onClose();
              }}
              className="px-4 py-2 bg-[#16A34A] text-white font-bold rounded-xl text-xs"
            >
              Selesai
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMessage && (
              <div className="p-3 bg-[#FEF2F2] border border-[#FECACA] rounded-xl text-xs text-[#991B1B]">
                {errorMessage}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-[#475569] mb-1">
                Jenis Laporan / Partisipasi:
              </label>
              <select
                value={reportType}
                onChange={e => setReportType(e.target.value as any)}
                className="w-full bg-[#FAF5E8] border border-[#D5C9AB] rounded-xl px-3 py-2 text-xs font-semibold text-[#1F2937] focus:ring-2 focus:ring-[#FB923C] focus:outline-none"
              >
                <option value="koreksi_data">Koreksi Data (Nama, Jabatan, Nilai Kerugian, Typo)</option>
                <option value="rujukan_putusan_baru">Rujukan Putusan Baru / Vonis Kasasi / Peninjauan Kembali</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#475569] mb-1">
                Pilih Berkas Kasus Terkait:
              </label>
              <select
                value={selectedCaseId}
                onChange={e => setSelectedCaseId(e.target.value)}
                className="w-full bg-[#FAF5E8] border border-[#D5C9AB] rounded-xl px-3 py-2 text-xs font-semibold text-[#1F2937] focus:ring-2 focus:ring-[#FB923C] focus:outline-none"
              >
                {cases.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#475569] mb-1">
                Rincian Koreksi / Penjelasan (Wajib):
              </label>
              <textarea
                rows={3}
                required
                placeholder="Contoh: Status hukum Sdr. X telah berkekuatan hukum tetap (inkrah) berdasarkan putusan kasasi MA..."
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full bg-[#FAF5E8] border border-[#D5C9AB] rounded-xl p-3 text-xs text-[#1F2937] focus:ring-2 focus:ring-[#FB923C] focus:outline-none"
              ></textarea>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#475569] mb-1">
                Tautan Sumber Resmi / Putusan Pengadilan (URL):
              </label>
              <input
                type="url"
                placeholder="https://putusan3.mahkamahagung.go.id/direktori/putusan/..."
                value={referenceUrl}
                onChange={e => setReferenceUrl(e.target.value)}
                className="w-full bg-[#FAF5E8] border border-[#D5C9AB] rounded-xl px-3 py-2 text-xs text-[#1F2937] focus:ring-2 focus:ring-[#FB923C] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#475569] mb-1">
                Kontak Anda (Opsional, untuk konfirmasi perbaikan):
              </label>
              <input
                type="email"
                placeholder="nama@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-[#FAF5E8] border border-[#D5C9AB] rounded-xl px-3 py-2 text-xs text-[#1F2937] focus:ring-2 focus:ring-[#FB923C] focus:outline-none"
              />
            </div>

            <div className="p-3 bg-[#FEF9C3] rounded-xl text-[11px] text-[#713F12]">
              🛡️ Semua laporan warga diverifikasi silang dengan direktori Mahkamah Agung RI dan KPK sebelum pembaruan disetujui.
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  sound.playPop();
                  onClose();
                }}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-200"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-[#DC2626] text-white rounded-xl text-xs font-bold hover:bg-[#B91C1C] flex items-center gap-1.5 shadow-sm"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{submitting ? 'Mengirim...' : 'Kirim Laporan Koreksi'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
