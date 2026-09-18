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
  ExternalLink
} from 'lucide-react';
import { sound } from '../../utils/audio.js';

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
  title: '☕ Dukung Independensi & Operasional LKI',
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
            ✕
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
                placeholder="☕ Dukung Independensi & Operasional LKI"
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
                <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200">
                  <div className="flex items-center gap-3 min-w-0">
                    <img 
                      src={formData.qris_image_url} 
                      alt="QRIS Preview Mini" 
                      className="w-12 h-12 object-contain bg-slate-50 rounded-lg border border-slate-200 p-0.5"
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-slate-800 truncate">
                        Gambar QRIS Terpasang
                      </div>
                      <div className="text-[10px] text-emerald-600 font-medium">
                        ✓ Siap ditampilkan ke publik
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
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
            <div className="p-3 bg-[#F5F0E6] rounded-2xl border border-dashed border-[#E3D7BA]">
              {formData.is_active ? (
                <div className="bg-[#FFFDF8] border-2 border-dashed border-[#CA8A04] rounded-2xl p-5 shadow-sm space-y-4 text-[#57534E]">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#FEF3C7] text-[#D97706] flex items-center justify-center font-bold shrink-0 shadow-inner">
                      <Heart className="w-5 h-5 fill-amber-500 text-amber-500" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-bold text-sm text-[#1E293B] leading-tight">
                        {formData.title || 'Dukung Independensi LKI'}
                      </h4>
                      <p className="text-xs text-[#64748B] leading-relaxed">
                        {formData.description || 'Bantu operasional server & verifikasi berkas peradilan...'}
                      </p>
                    </div>
                  </div>

                  {/* QRIS Display Area */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-4 text-center space-y-3 shadow-2xs">
                    {formData.qris_image_url ? (
                      <div className="space-y-2">
                        <div className="inline-block p-2 bg-white border border-slate-200 rounded-xl shadow-xs">
                          <img 
                            src={formData.qris_image_url} 
                            alt="QRIS Admin" 
                            className="w-44 h-44 object-contain mx-auto"
                          />
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono flex items-center justify-center gap-1">
                          <span>🔍 Klik untuk memperbesar</span>
                        </div>
                      </div>
                    ) : (
                      <div className="py-8 text-center space-y-2 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        <QrCode className="w-12 h-12 mx-auto text-slate-300 stroke-1" />
                        <p className="text-xs font-semibold text-slate-600">
                          Foto QRIS Belum Diunggah
                        </p>
                        <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                          Unggah berkas foto QRIS pada formulir di sebelah kiri untuk menampilkannya di sini.
                        </p>
                      </div>
                    )}

                    {formData.account_name && (
                      <div className="text-xs font-bold text-slate-800">
                        A.N. {formData.account_name}
                      </div>
                    )}

                    {formData.bank_info && (
                      <div className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded-xl border border-slate-100">
                        {formData.bank_info}
                      </div>
                    )}

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[10px] text-slate-400">
                      <Smartphone className="w-3.5 h-3.5 text-slate-500" />
                      <span>Mendukung seluruh Mobile Banking &amp; Dompet Digital (QRIS Standar BI)</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-slate-400 space-y-2">
                  <Eye className="w-8 h-8 mx-auto text-slate-300" />
                  <p className="text-xs font-semibold text-slate-600">
                    Kartu Donasi Sedang Disembunyikan
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Bagian donasi tidak akan dimunculkan pada portal publik selama status dimatikan.
                  </p>
                </div>
              )}
            </div>
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

    </div>
  );
};
