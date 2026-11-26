"use client";

import React, { useState, useEffect, useRef } from 'react';
import { 
  QrCode, 
  Save, 
  RotateCcw, 
  Upload, 
  Link as LinkIcon, 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  HelpCircle, 
  Trash2, 
  RefreshCw,
  ToggleLeft,
  ToggleRight,
  Heart,
  ShieldCheck,
  Smartphone,
  ExternalLink,
  X,
  Maximize2,
  Download,
  Check,
  Search
} from 'lucide-react';
import { sound } from '../../utils/audio';
import { stripLeadingEmoji } from '../ThemeIcons';

interface AdminDonationManagerProps {
  authToken: string;
  onRefreshGlobal?: () => void;
}

interface DonationConfig {
  title: string;
  description: string;
  qris_image_url: string;
  account_name: string;
  bank_info: string;
  is_active: boolean;
  updated_at?: string;
  updated_by?: string;
}

const DEFAULT_DONATION: DonationConfig = {
  title: 'Dukung Independensi & Operasional LKI',
  description: 'Bantu operasional server, infrastruktur pangkalan data, verifikasi berkas direktori putusan peradilan, dan keterbukaan informasi korupsi Indonesia tanpa kompromi.',
  qris_image_url: '',
  account_name: 'Pengelola Liga Korupsi Indonesia',
  bank_info: 'Bisa discan melalui seluruh aplikasi Mobile Banking (BCA, Mandiri, BRI, BNI) & E-Wallet (GoPay, OVO, Dana, ShopeePay, LinkAja)',
  is_active: true
};

export const AdminDonationManager: React.FC<AdminDonationManagerProps> = ({
  authToken,
  onRefreshGlobal
}) => {
  const [formData, setFormData] = useState<DonationConfig>(DEFAULT_DONATION);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [imageInputMode, setImageInputMode] = useState<'upload' | 'url'>('upload');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [previewModalOpen, setPreviewModalOpen] = useState<boolean>(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchDonationConfig();
  }, [authToken]);

  const fetchDonationConfig = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/settings/donation', {
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : {}
      });
      if (res.ok) {
        const data = await res.json();
        setFormData({
          title: data.title || DEFAULT_DONATION.title,
          description: data.description || DEFAULT_DONATION.description,
          qris_image_url: data.qris_image_url || '',
          account_name: data.account_name || DEFAULT_DONATION.account_name,
          bank_info: data.bank_info || DEFAULT_DONATION.bank_info,
          is_active: data.is_active !== undefined ? data.is_active : true,
          updated_at: data.updated_at,
          updated_by: data.updated_by
        });
        if (data.qris_image_url && data.qris_image_url.startsWith('http')) {
          setImageInputMode('url');
        }
      }
    } catch (err) {
      console.error('Gagal memuat pengaturan donasi:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Berkas harus berupa gambar (PNG, JPG, JPEG, WebP, atau SVG).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Ukuran gambar maksimal 5 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const base64 = uploadEvent.target?.result as string;
      if (base64) {
        sound.playPop();
        setFormData(prev => ({ ...prev, qris_image_url: base64 }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    sound.playPop();
    setFormData(prev => ({ ...prev, qris_image_url: '' }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch('/api/admin/settings/donation', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
        },
        body: JSON.stringify(formData)
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || 'Gagal menyimpan pengaturan donasi.');
      }

      sound.playCheer();
      setMessage({
        type: 'success',
        text: 'Pengaturan donasi & kode QRIS admin berhasil disimpan dan dipublikasikan!'
      });
      setFormData(result.data);
      if (onRefreshGlobal) onRefreshGlobal();
    } catch (err: any) {
      sound.playPop();
      setMessage({
        type: 'error',
        text: err.message || 'Terjadi kesalahan sistem saat menyimpan data donasi.'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (window.confirm('Kembalikan konfigurasi donasi & QRIS ke format standar LKI?')) {
      sound.playPop();
      setFormData({
        ...DEFAULT_DONATION,
        updated_at: formData.updated_at,
        updated_by: formData.updated_by
      });
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center font-bold">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900">
                Pengaturan Donasi &amp; Kode QRIS Admin
              </h1>
              <p className="text-xs text-slate-500">
                Kelola gambar QRIS, rekening alternatif, dan narasi apresiasi dukungan di bagian bawah portal publik.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {formData.updated_at && (
            <div className="text-right hidden sm:block">
              <div className="text-[11px] text-slate-400">Terakhir Diperbarui</div>
              <div className="text-xs font-semibold text-slate-700">
                {new Date(formData.updated_at).toLocaleString('id-ID')}
              </div>
            </div>
          )}

          <button
            onClick={fetchDonationConfig}
            disabled={loading}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors cursor-pointer"
            title="Segarkan data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Alert Notification */}
      {message && (
        <div className={`p-4 rounded-2xl border text-xs font-medium flex items-center gap-3 ${
          message.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
            : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span className="flex-1">{message.text}</span>
          <button 
            onClick={() => setMessage(null)}
            className="text-slate-400 hover:text-slate-600 cursor-pointer font-bold ml-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Form Editor (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <span>Formulir Donasi &amp; QRIS</span>
            </h2>

            {/* Active Toggle */}
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-medium text-slate-600">
                Status Tayang:
              </span>
              <button
                type="button"
                onClick={() => {
                  sound.playPop();
                  setFormData(prev => ({ ...prev, is_active: !prev.is_active }));
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  formData.is_active 
                    ? 'bg-emerald-100 text-emerald-700 border border-emerald-300' 
                    : 'bg-slate-100 text-slate-500 border border-slate-300'
                }`}
              >
                {formData.is_active ? (
                  <>
                    <ToggleRight className="w-4 h-4 text-emerald-600" />
                    <span>Aktif Tayang</span>
                  </>
                ) : (
                  <>
                    <ToggleLeft className="w-4 h-4 text-slate-400" />
                    <span>Disembunyikan</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            
            {/* Title Input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Judul Kartu Dukungan
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:border-[#DC2626] focus:ring-2 focus:ring-[#DC2626]/20 transition-all font-medium"
                placeholder="Dukung Independensi & Operasional LKI"
              />
            </div>

            {/* Description Textarea */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Narasi Ajakan Donasi
              </label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:border-[#DC2626] focus:ring-2 focus:ring-[#DC2626]/20 transition-all font-medium leading-relaxed"
                placeholder="Bantu operasional server, infrastruktur database, dan verifikasi putusan..."
              />
            </div>

            {/* QRIS Image Input Section */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <QrCode className="w-4 h-4 text-rose-600" />
                  <span>Gambar / Kode QRIS Admin</span>
                </label>

                {/* Mode Selector Tabs */}
                <div className="flex items-center gap-1 bg-slate-200 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setImageInputMode('upload')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                      imageInputMode === 'upload' 
                        ? 'bg-white text-slate-900 shadow-xs' 
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Unggah Berkas
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageInputMode('url')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                      imageInputMode === 'url' 
                        ? 'bg-white text-slate-900 shadow-xs' 
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    URL Gambar
                  </button>
                </div>
              </div>

              {/* Mode 1: File Upload */}
              {imageInputMode === 'upload' && (
                <div className="space-y-2">
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-300 hover:border-[#DC2626] bg-white rounded-2xl p-4 text-center cursor-pointer transition-colors group"
                  >
                    <Upload className="w-6 h-6 mx-auto text-slate-400 group-hover:text-[#DC2626] transition-colors mb-1" />
                    <p className="text-xs font-semibold text-slate-700">
                      Klik untuk memilih foto / tangkapan layar QRIS
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Format PNG, JPG, JPEG, atau WebP (Maks. 5 MB)
                    </p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
              )}

              {/* Mode 2: URL Input */}
              {imageInputMode === 'url' && (
                <div>
                  <div className="relative">
                    <LinkIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="url"
                      value={formData.qris_image_url}
                      onChange={e => setFormData({ ...formData, qris_image_url: e.target.value })}
                      className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:border-[#DC2626] focus:ring-2 focus:ring-[#DC2626]/20 transition-all font-medium"
                      placeholder="https://domain.com/qris-admin.png"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Tautan langsung ke file gambar QRIS yang di-host di web.
                  </p>
                </div>
              )}

              {/* Image Preview / Remove Bar */}
              {formData.qris_image_url && (
                <div className="flex items-center justify-between p-3 bg-white rounded-2xl border border-slate-200 shadow-xs">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <img 
                      src={formData.qris_image_url} 
                      alt="QRIS Preview Mini" 
                      className="w-20 h-20 sm:w-24 sm:h-24 object-contain bg-slate-50 rounded-xl border border-slate-200 p-1 shadow-2xs shrink-0"
                    />
                    <div className="min-w-0 space-y-1">
                      <div className="text-xs font-bold text-slate-800 truncate">
                        Gambar QRIS Terpasang
                      </div>
                      <div className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                        <Check className="w-3.5 h-3.5 shrink-0" />
                        <span>Siap dipindai &amp; ditampilkan</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono truncate max-w-[220px]">
                        {formData.qris_image_url.startsWith('data:') ? 'File Base64 Unggahan' : formData.qris_image_url}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer shrink-0"
                    title="Hapus gambar ini"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Account Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Nama Terdaftar QRIS / Rekening (Atas Nama)
              </label>
              <input
                type="text"
                value={formData.account_name}
                onChange={e => setFormData({ ...formData, account_name: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:border-[#DC2626] focus:ring-2 focus:ring-[#DC2626]/20 transition-all font-medium"
                placeholder="Pengelola Liga Korupsi Indonesia"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Nama pemilik atau merchant yang muncul pada layar HP saat warga memindai QRIS.
              </p>
            </div>

            {/* Bank Info / E-Wallet notes */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Keterangan Bank / Nomor Rekening Alternatif (Opsional)
              </label>
              <textarea
                rows={2}
                value={formData.bank_info}
                onChange={e => setFormData({ ...formData, bank_info: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:border-[#DC2626] focus:ring-2 focus:ring-[#DC2626]/20 transition-all font-medium leading-relaxed"
                placeholder="BCA: 1234567890 a.n Admin LKI • QRIS mendukung seluruh m-banking & e-wallet"
              />
            </div>

            {/* Action Buttons */}
            <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleReset}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Standar LKI</span>
              </button>

              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 bg-[#DC2626] hover:bg-[#B91C1C] text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Simpan Pengaturan QRIS</span>
                  </>
                )}
              </button>
            </div>

          </form>
        </div>

        {/* Right Column: Live Preview & Instructions (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Live Preview Card */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-[#DC2626]" />
                <h3 className="text-xs font-bold text-slate-800">
                  Pratinjau Langsung (Live Preview)
                </h3>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-mono font-semibold">
                Tampilan Bawah Portal
              </span>
            </div>

            {/* Live Card Container */}
            <div className="p-4 bg-[#F5F0E6] rounded-2xl border border-dashed border-[#E3D7BA] flex flex-col items-center justify-center">
              {formData.is_active ? (
                <div className="bg-[#FFFDF8] border-2 border-[#E2D8C3] hover:border-[#CA8A04] transition-colors rounded-2xl p-3.5 shadow-sm text-center space-y-2.5 w-full max-w-[215px] sm:max-w-[230px]">
                  {/* Judul Sedikit */}
                  <div className="flex items-center justify-center gap-1.5 text-xs sm:text-sm font-bold text-[#78350F]">
                    <QrCode className="w-4 h-4 text-[#CA8A04] shrink-0" />
                    <span className="truncate" title={stripLeadingEmoji(formData.title) || 'Dukungan QRIS'}>
                      {stripLeadingEmoji(formData.title) ? (stripLeadingEmoji(formData.title).length > 20 ? 'Dukungan QRIS' : stripLeadingEmoji(formData.title)) : 'Dukungan QRIS'}
                    </span>
                  </div>

                  {/* QRIS Display Area Diperbesar */}
                  {formData.qris_image_url ? (
                    <div 
                      onClick={() => setPreviewModalOpen(true)}
                      className="group/img relative cursor-pointer bg-white p-2 border border-[#E7DECB] rounded-2xl inline-block shadow-xs hover:border-[#CA8A04] hover:shadow-md transition-all"
                      title="Klik untuk membuka modal perbesar"
                    >
                      <img 
                        src={formData.qris_image_url} 
                        alt="QRIS Admin" 
                        className="w-40 h-40 sm:w-44 sm:h-44 object-contain mx-auto rounded-xl transition-transform group-hover/img:scale-102"
                      />
                      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-2xs rounded-2xl opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white text-xs font-bold">
                        <Maximize2 className="w-4 h-4" />
                        <span>Perbesar</span>
                      </div>
                    </div>
                  ) : (
                    <div className="w-40 h-40 sm:w-44 sm:h-44 text-center flex flex-col items-center justify-center space-y-1.5 text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-3 mx-auto">
                      <QrCode className="w-8 h-8 mx-auto text-slate-300 stroke-1" />
                      <p className="text-[10px] font-semibold text-slate-600 leading-tight">
                        QRIS Belum Dipasang
                      </p>
                    </div>
                  )}

                  {/* Info Sedikit di Bawah Gambar */}
                  <div className="text-[11px] text-[#78716C] leading-tight space-y-1">
                    {formData.account_name ? (
                      <p className="font-bold text-[#44403C] truncate max-w-[190px] mx-auto" title={formData.account_name}>
                        A.N. {formData.account_name}
                      </p>
                    ) : (
                      <p className="font-medium text-[#78716C]">Scan donasi QRIS</p>
                    )}
                    <span className="text-[10px] text-[#854D0E] font-medium inline-flex items-center justify-center gap-1">
                      <Search className="w-3 h-3 shrink-0" />
                      <span>Klik gambar untuk perbesar</span>
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-slate-400 space-y-2">
                  <Eye className="w-8 h-8 mx-auto text-slate-300" />
                  <p className="text-xs font-semibold text-slate-600">
                    Kotak QRIS Sedang Disembunyikan
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Kotak QRIS tidak akan dimunculkan pada footer selama status dimatikan.
                  </p>
                </div>
              )}
            </div>

            {/* Action button to test full modal */}
            {formData.is_active && formData.qris_image_url && (
              <button
                type="button"
                onClick={() => setPreviewModalOpen(true)}
                className="w-full py-2.5 px-4 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold rounded-2xl text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
              >
                <Maximize2 className="w-4 h-4 text-amber-700" />
                <span>Uji Pratinjau Modal Layar Penuh</span>
              </button>
            )}
          </div>

          {/* Quick Guide Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-3xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-slate-700">
              <HelpCircle className="w-4 h-4 text-rose-500" />
              <h3 className="text-xs font-bold">Panduan QRIS Standar Bank Indonesia</h3>
            </div>

            <ul className="text-[11px] text-slate-600 space-y-2 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="text-rose-500 font-bold">•</span>
                <span>
                  <strong>QRIS Statis</strong> dapat diperoleh dari aplikasi merchant bank/e-wallet Anda (BCA Merchant, Livin Usaha, GoBiz, OVO Merchant, Dana Bisnis, QRIS Doku/Midtrans).
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-rose-500 font-bold">•</span>
                <span>
                  <strong>Interoperabilitas Penuh</strong>: 1 gambar kode QRIS dapat dipindai oleh puluhan juta pengguna dari BCA, Mandiri, BRI, BNI, GoPay, OVO, Dana, ShopeePay, dan LinkAja tanpa biaya transfer antar-bank.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-rose-500 font-bold">•</span>
                <span>
                  <strong>Keamanan &amp; Audit</strong>: Seluruh pembaharuan teks dan gambar QRIS akan dicatat ke dalam <em>Log Audit</em> sistem.
                </span>
              </li>
            </ul>
          </div>

        </div>

      </div>

      {/* Giant QRIS Preview Modal for Admin */}
      {previewModalOpen && formData.qris_image_url && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
          onClick={() => setPreviewModalOpen(false)}
        >
          <div 
            className="bg-white rounded-3xl p-5 sm:p-7 max-w-xl md:max-w-2xl lg:max-w-3xl w-full max-h-[96vh] shadow-2xl space-y-4 text-center relative animate-in fade-in zoom-in duration-200 flex flex-col justify-between overflow-y-auto my-auto"
            onClick={e => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setPreviewModalOpen(false)}
              className="absolute top-4 right-4 sm:top-5 sm:right-5 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 cursor-pointer transition-colors shadow-xs z-10"
              title="Tutup (Esc)"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>

            {/* Modal Header */}
            <div className="space-y-1 text-left pr-10">
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-rose-500 fill-rose-500 shrink-0" />
                <h4 className="font-bold text-base sm:text-lg md:text-xl text-slate-900 truncate">
                  {stripLeadingEmoji(formData.title) || 'Dukungan QRIS Pengelola LKI'}
                </h4>
              </div>
              <p className="text-xs sm:text-sm text-slate-500">
                Pindai kode QRIS di bawah melalui aplikasi m-banking atau dompet digital (GoPay, OVO, Dana, BCA, BRI, Mandiri, dll).
              </p>
            </div>

            {/* Giant QRIS Image Container */}
            <div className="w-full p-3 sm:p-6 bg-[#FFFDF8] border-2 border-[#E7DECB] rounded-3xl shadow-inner flex items-center justify-center overflow-hidden">
              <img 
                src={formData.qris_image_url} 
                alt="QRIS Admin Full Preview" 
                className="w-auto h-auto max-h-[58vh] sm:max-h-[64vh] md:max-h-[68vh] max-w-full object-contain mx-auto rounded-2xl drop-shadow-md transition-transform hover:scale-[1.01]"
              />
            </div>

            {/* Account & Bank Info */}
            <div className="space-y-1 text-center">
              {formData.account_name && (
                <div className="text-sm sm:text-base font-extrabold text-slate-900">
                  A.N. {formData.account_name}
                </div>
              )}
              {formData.bank_info && (
                <div className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto leading-relaxed">
                  {formData.bank_info}
                </div>
              )}
            </div>

            {/* Action Buttons: Download + Close */}
            <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-center gap-3">
              <a
                href={formData.qris_image_url}
                download="QRIS_Donasi_LKI.png"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs sm:text-sm transition-all shadow-xs inline-flex items-center justify-center gap-2 cursor-pointer"
                title="Unduh file gambar QRIS ke perangkat Anda"
              >
                <Download className="w-4 h-4" />
                <span>Simpan Gambar QRIS</span>
              </a>
              <button
                onClick={() => setPreviewModalOpen(false)}
                className="w-full sm:w-auto px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs sm:text-sm font-bold transition-colors cursor-pointer shadow-xs"
              >
                Selesai / Tutup
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
