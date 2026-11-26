"use client";

import React, { useState } from 'react';
import { LegalStatus } from '../../types';
import { sound } from '../../utils/audio';
import { getOfficialPhoto, handleImageError } from '../../utils/photo';
import { PROVINCES_LIST } from '../../constants/provinces';
import { 
  FileEdit, 
  Scale, 
  PlusCircle, 
  Image as ImageIcon, 
  Upload, 
  X 
} from 'lucide-react';

interface AdminManualCaseManagerProps {
  authToken: string;
  onRefreshGlobal?: () => void;
  onRefreshAuditLogs?: () => void;
}

export const AdminManualCaseManager: React.FC<AdminManualCaseManagerProps> = ({
  authToken,
  onRefreshGlobal,
  onRefreshAuditLogs
}) => {
  const [manualForm, setManualForm] = useState({
    tingkat_wilayah: 'daerah' as 'nasional' | 'daerah',
    nama: '',
    jabatan: '',
    partai: 'Non-Partai',
    provinsi: 'DKI Jakarta',
    kota_kabupaten: '',
    daerah_pemilihan: '',
    ringkasan_kasus: '',
    nilai_kerugian_negara: '',
    tahun_kejadian: new Date().getFullYear().toString(),
    tahun_putusan: '',
    status_hukum: 'Tersangka' as LegalStatus,
    jenis_kasus: 'Suap / Gratifikasi',
    perusahaan: '',
    sumber_url: '',
    sumber_media: '',
    foto_url: ''
  });
  const [manualSuccess, setManualSuccess] = useState<string | null>(null);
  const [manualError, setManualError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setManualError(null);
    setManualSuccess(null);

    // Strict validation: At least 1 source URL
    if (!manualForm.sumber_url || !manualForm.sumber_url.startsWith('http')) {
      setManualError('Validasi Gagal: Setiap kasus HARUS memiliki minimal 1 link/URL sumber berita atau putusan resmi yang valid!');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/admin/cases/manual', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
        },
        body: JSON.stringify(manualForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal memproses data kasus');

      sound.playCheer();
      setManualSuccess('Data kasus dan pejabat publik berhasil disimpan dan dipublikasikan!');
      setManualForm({
        tingkat_wilayah: 'daerah',
        nama: '',
        jabatan: '',
        partai: 'Non-Partai',
        provinsi: 'DKI Jakarta',
        kota_kabupaten: '',
        daerah_pemilihan: '',
        ringkasan_kasus: '',
        nilai_kerugian_negara: '',
        tahun_kejadian: new Date().getFullYear().toString(),
        tahun_putusan: '',
        status_hukum: 'Tersangka' as LegalStatus,
        jenis_kasus: 'Suap / Gratifikasi',
        perusahaan: '',
        sumber_url: '',
        sumber_media: '',
        foto_url: ''
      });
      if (onRefreshGlobal) onRefreshGlobal();
      if (onRefreshAuditLogs) onRefreshAuditLogs();
    } catch (err: any) {
      setManualError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-[#FFFDF8] border-2 border-[#E7DECB] rounded-3xl p-6 sm:p-8 shadow-sm max-w-3xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-[#FFEDD5] text-[#EA580C] rounded-2xl">
          <FileEdit className="w-6 h-6" />
        </div>
        <div>
          <h3 className="font-marker text-2xl text-[#1E293B]">
            Formulir Input Kasus Manual
          </h3>
          <p className="text-xs text-[#64748B]">
            Masukkan data langsung ke dalam sistem dengan validasi integritas ketat.
          </p>
        </div>
      </div>

      {manualSuccess && (
        <div className="p-4 bg-[#F0FDF4] border border-[#BBF7D0] rounded-2xl text-xs text-[#166534] font-bold">
          ✓ {manualSuccess}
        </div>
      )}

      {manualError && (
        <div className="p-4 bg-[#FEF2F2] border border-[#FECACA] rounded-2xl text-xs text-[#991B1B]">
          ✕ {manualError}
        </div>
      )}

      <form onSubmit={handleManualSubmit} className="space-y-4">
        {/* Foto Pejabat / Pelaku Korupsi */}
        <div className="p-4 bg-[#FAF5E8] border border-[#D5C9AB] rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-[#475569] uppercase tracking-wider flex items-center gap-1.5">
              <ImageIcon className="w-4 h-4 text-[#EA580C]" />
              <span>Foto Pejabat / Pelaku Korupsi (Opsional)</span>
            </label>
            <span className="text-[11px] text-slate-500 font-medium">
              Default otomatis: Siluet Berkas LKI
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {/* Photo Preview */}
            <div className="relative shrink-0">
              <div className="w-20 h-20 rounded-xl overflow-hidden border-2 border-[#D5C9AB] bg-white shadow-xs">
                <img
                  src={getOfficialPhoto(manualForm.foto_url)}
                  alt="Preview Foto"
                  onError={handleImageError}
                  className="w-full h-full object-cover"
                />
              </div>
              {manualForm.foto_url && (
                <button
                  type="button"
                  onClick={() => setManualForm({ ...manualForm, foto_url: '' })}
                  className="absolute -top-1.5 -right-1.5 p-1 bg-rose-600 text-white rounded-full hover:bg-rose-700 shadow-xs cursor-pointer transition-colors"
                  title="Hapus foto (gunakan default)"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Input Controls */}
            <div className="flex-1 w-full space-y-2">
              <input
                type="url"
                placeholder="Tempel URL Gambar (https://...)"
                value={manualForm.foto_url}
                onChange={e => setManualForm({ ...manualForm, foto_url: e.target.value })}
                className="w-full bg-white border border-[#D5C9AB] rounded-xl px-3 py-2 text-xs text-[#1F2937] focus:ring-2 focus:ring-[#EA580C] focus:outline-none"
              />
              <div className="flex flex-wrap items-center gap-2">
                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#D5C9AB] hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-700 cursor-pointer transition-colors shadow-2xs">
                  <Upload className="w-3.5 h-3.5 text-[#EA580C]" />
                  <span>Unggah File Foto</span>
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
                            setManualForm({ ...manualForm, foto_url: reader.result });
                          }
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </label>
                <span className="text-[11px] text-slate-500">
                  Format JPG, PNG, WebP (maks. 2MB). Jika dikosongkan, siluet generik LKI akan ditampilkan otomatis.
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-[#475569] mb-1">
              Nama Pejabat Publik (Wajib)
            </label>
            <input
              type="text"
              required
              placeholder="Misal: H. Nama Pejabat, S.E."
              value={manualForm.nama}
              onChange={e => setManualForm({ ...manualForm, nama: e.target.value })}
              className="w-full bg-[#FAF5E8] border border-[#D5C9AB] rounded-xl px-3 py-2 text-xs text-[#1F2937] focus:ring-2 focus:ring-[#EA580C] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#475569] mb-1">
              Jabatan Saat Perkara
            </label>
            <input
              type="text"
              required
              placeholder="Misal: Bupati / Menteri / Anggota DPR"
              value={manualForm.jabatan}
              onChange={e => setManualForm({ ...manualForm, jabatan: e.target.value })}
              className="w-full bg-[#FAF5E8] border border-[#D5C9AB] rounded-xl px-3 py-2 text-xs text-[#1F2937] focus:ring-2 focus:ring-[#EA580C] focus:outline-none"
            />
          </div>
        </div>

        {/* Pilihan Tingkat Wilayah: Nasional vs Daerah */}
        <div className="p-3.5 bg-[#FAF5E8] border border-[#D5C9AB] rounded-2xl space-y-3">
          <label className="block text-xs font-bold text-[#334155] uppercase tracking-wider">
            🏛️ Cakupan Yurisdiksi / Tingkat Perkara:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                sound.playPop();
                setManualForm({
                  ...manualForm,
                  tingkat_wilayah: 'nasional',
                  provinsi: 'Pusat / Nasional (Kementerian / Lembaga RI)'
                });
              }}
              className={`p-3.5 rounded-2xl border-2 text-xs font-bold transition-all text-left flex items-start gap-3 cursor-pointer ${
                manualForm.tingkat_wilayah === 'nasional'
                  ? 'bg-amber-50/90 border-amber-500 text-amber-950 shadow-sm ring-2 ring-amber-400/40'
                  : 'bg-white border-[#E2D8C0] text-[#57534E] hover:bg-[#F7F1E1]'
              }`}
            >
              <span className="text-2xl p-1 bg-amber-100/70 rounded-xl border border-amber-300/60 shrink-0">🏛️</span>
              <div className="min-w-0">
                <div className="font-black text-[13px] text-[#1E293B] flex items-center gap-1.5">
                  <span>Tingkat Nasional / Pemerintah Pusat</span>
                  {manualForm.tingkat_wilayah === 'nasional' && (
                    <span className="text-emerald-600 text-xs">✓ Aktif</span>
                  )}
                </div>
                <p className="text-[11px] text-slate-600 font-normal leading-relaxed mt-1">
                  Kementerian, DPR/DPD RI, Direksi BUMN Holding, Hakim MA/MK, Mabes TNI/Polri, dan Lembaga Tinggi Negara.
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                sound.playPop();
                setManualForm({
                  ...manualForm,
                  tingkat_wilayah: 'daerah',
                  provinsi: manualForm.provinsi.includes('Nasional') || manualForm.provinsi.includes('Pusat')
                    ? 'DKI Jakarta'
                    : manualForm.provinsi
                });
              }}
              className={`p-3.5 rounded-2xl border-2 text-xs font-bold transition-all text-left flex items-start gap-3 cursor-pointer ${
                manualForm.tingkat_wilayah === 'daerah'
                  ? 'bg-emerald-50/90 border-emerald-500 text-emerald-950 shadow-sm ring-2 ring-emerald-400/40'
                  : 'bg-white border-[#E2D8C0] text-[#57534E] hover:bg-[#F7F1E1]'
              }`}
            >
              <span className="text-2xl p-1 bg-emerald-100/70 rounded-xl border border-emerald-300/60 shrink-0">📍</span>
              <div className="min-w-0">
                <div className="font-black text-[13px] text-[#1E293B] flex items-center gap-1.5">
                  <span>Tingkat Daerah / 38 Provinsi</span>
                  {manualForm.tingkat_wilayah === 'daerah' && (
                    <span className="text-emerald-600 text-xs">✓ Aktif</span>
                  )}
                </div>
                <p className="text-[11px] text-slate-600 font-normal leading-relaxed mt-1">
                  Pemerintah Provinsi, Pemkab / Pemkot, Anggota DPRD Daerah, Kepala Dinas, serta BUMD Provinsi/Kabupaten.
                </p>
              </div>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-[#475569] mb-1">
              Partai Politik
            </label>
            <input
              type="text"
              placeholder="Misal: Golkar / PDI-P / Non-Partai"
              value={manualForm.partai}
              onChange={e => setManualForm({ ...manualForm, partai: e.target.value })}
              className="w-full bg-[#FAF5E8] border border-[#D5C9AB] rounded-xl px-3 py-2 text-xs text-[#1F2937] focus:ring-2 focus:ring-[#EA580C] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#475569] mb-1">
              {manualForm.tingkat_wilayah === 'nasional' ? 'Cakupan Wilayah / Instansi' : 'Provinsi Wilayah (Wajib)'}
            </label>
            <select
              required
              value={manualForm.provinsi}
              onChange={e => setManualForm({ ...manualForm, provinsi: e.target.value })}
              className="w-full bg-[#FAF5E8] border border-[#D5C9AB] rounded-xl px-3 py-2 text-xs text-[#1F2937] focus:ring-2 focus:ring-[#EA580C] focus:outline-none"
            >
              {manualForm.tingkat_wilayah === 'nasional' ? (
                <option value="Pusat / Nasional (Kementerian / Lembaga RI)">
                  🏛️ Tingkat Nasional / Lembaga Pusat RI
                </option>
              ) : (
                PROVINCES_LIST.filter(p => p.id !== 'pusat').map(p => (
                  <option key={p.id} value={p.name}>
                    {p.name}
                  </option>
                ))
              )}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#475569] mb-1">
              Kota / Kabupaten (Opsional)
            </label>
            <input
              type="text"
              placeholder="Misal: Kab. Bekasi"
              value={manualForm.kota_kabupaten}
              onChange={e => setManualForm({ ...manualForm, kota_kabupaten: e.target.value })}
              className="w-full bg-[#FAF5E8] border border-[#D5C9AB] rounded-xl px-3 py-2 text-xs text-[#1F2937] focus:ring-2 focus:ring-[#EA580C] focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-[#475569] mb-1">
              Status Hukum Resmi
            </label>
            <select
              value={manualForm.status_hukum}
              onChange={e => setManualForm({ ...manualForm, status_hukum: e.target.value as LegalStatus })}
              className="w-full bg-[#FAF5E8] border border-[#D5C9AB] rounded-xl px-3 py-2 text-xs font-bold text-[#B91C1C] focus:ring-2 focus:ring-[#EA580C] focus:outline-none"
            >
              <option value="Tersangka">Tersangka (Asas Praduga Tak Bersalah)</option>
              <option value="Terdakwa">Terdakwa (Proses Pengadilan)</option>
              <option value="Divonis Inkrah">Divonis Inkrah (Putusan Tetap)</option>
              <option value="Bebas/Praperadilan">Bebas / Praperadilan / SP3</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#475569] mb-1">
              Kerugian Negara (IDR Rupiah)
            </label>
            <input
              type="number"
              required
              placeholder="Contoh: 15000000000"
              value={manualForm.nilai_kerugian_negara}
              onChange={e => setManualForm({ ...manualForm, nilai_kerugian_negara: e.target.value })}
              className="w-full bg-[#FAF5E8] border border-[#D5C9AB] rounded-xl px-3 py-2 text-xs text-[#1F2937] focus:ring-2 focus:ring-[#EA580C] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#475569] mb-1">
              Tahun Kejadian
            </label>
            <input
              type="number"
              value={manualForm.tahun_kejadian}
              onChange={e => setManualForm({ ...manualForm, tahun_kejadian: e.target.value })}
              className="w-full bg-[#FAF5E8] border border-[#D5C9AB] rounded-xl px-3 py-2 text-xs text-[#1F2937] focus:ring-2 focus:ring-[#EA580C] focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-[#475569] mb-1">
            Ringkasan Kasus (Objektif)
          </label>
          <textarea
            rows={3}
            required
            placeholder="Rincian perbuatan tindak pidana korupsi, barang bukti, dan modus operandi..."
            value={manualForm.ringkasan_kasus}
            onChange={e => setManualForm({ ...manualForm, ringkasan_kasus: e.target.value })}
            className="w-full bg-[#FAF5E8] border border-[#D5C9AB] rounded-xl p-3 text-xs text-[#1F2937] focus:ring-2 focus:ring-[#EA580C] focus:outline-none"
          ></textarea>
        </div>

        {/* WAJIB SUMBER BERITA LINK */}
        <div className="p-4 bg-[#F0FDF4] border-2 border-dashed border-[#86EFAC] rounded-2xl space-y-2">
          <label className="block text-xs font-bold text-[#166534] uppercase tracking-wider flex items-center gap-1.5">
            <Scale className="w-4 h-4 text-[#16A34A]" />
            <span>Tautan Sumber Berita / Putusan Resmi (WAJIB ADA LINK):</span>
          </label>
          <input
            type="url"
            required
            placeholder="https://putusan3.mahkamahagung.go.id/... atau https://kompas.com/..."
            value={manualForm.sumber_url}
            onChange={e => setManualForm({ ...manualForm, sumber_url: e.target.value })}
            className="w-full bg-white border border-[#86EFAC] rounded-xl px-3 py-2 text-xs font-mono text-[#1F2937] focus:ring-2 focus:ring-[#16A34A] focus:outline-none"
          />
          <p className="text-[11px] text-[#15803D]">
            Data tanpa tautan sumber yang dapat diverifikasi akan ditolak oleh sistem.
          </p>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-[#EA580C] text-white font-bold rounded-xl text-xs hover:bg-[#C2410C] transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{isSubmitting ? 'Menyimpan...' : 'Simpan & Publikasikan Kasus'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
