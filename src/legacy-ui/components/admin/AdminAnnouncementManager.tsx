"use client";

import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Save, 
  RotateCcw, 
  Scale, 
  ShieldAlert, 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  HelpCircle, 
  Sparkles,
  ToggleLeft,
  ToggleRight,
  RefreshCw,
  X
} from 'lucide-react';
import { sound } from '../../utils/audio';
import { stripLeadingEmoji } from '../ThemeIcons';

interface AdminAnnouncementManagerProps {
  authToken: string;
  onRefreshGlobal?: () => void;
}

interface AnnouncementConfig {
  title: string;
  badge: string;
  main_text: string;
  sub_text: string;
  is_active: boolean;
  updated_at?: string;
  updated_by?: string;
}

const DEFAULT_CONFIG: AnnouncementConfig = {
  title: 'PEMBERITAHUAN ASAS HUKUM & SUMBER RESMI:',
  badge: 'Wajib Dibaca',
  main_text: 'Data bersumber dari putusan pengadilan & pemberitaan media yang tercantum. Setiap orang berhak atas asas praduga tak bersalah hingga ada putusan berkekuatan hukum tetap.',
  sub_text: 'Setiap data diverifikasi dengan tautan resmi direktori putusan Mahkamah Agung RI, KPK.go.id, atau media nasional kredibel.',
  is_active: true
};

export const AdminAnnouncementManager: React.FC<AdminAnnouncementManagerProps> = ({
  authToken,
  onRefreshGlobal
}) => {
  const [formData, setFormData] = useState<AnnouncementConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchAnnouncement();
  }, [authToken]);

  const fetchAnnouncement = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/settings/announcement', {
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : {}
      });
      if (res.ok) {
        const data = await res.json();
        setFormData({
          title: data.title || DEFAULT_CONFIG.title,
          badge: data.badge || DEFAULT_CONFIG.badge,
          main_text: data.main_text || DEFAULT_CONFIG.main_text,
          sub_text: data.sub_text || DEFAULT_CONFIG.sub_text,
          is_active: data.is_active !== undefined ? data.is_active : true,
          updated_at: data.updated_at,
          updated_by: data.updated_by
        });
      }
    } catch (err) {
      console.error('Gagal mengambil pengaturan announcement:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch('/api/admin/settings/announcement', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
        },
        body: JSON.stringify(formData)
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || 'Gagal menyimpan perubahan.');
      }

      sound.playCheer();
      setMessage({
        type: 'success',
        text: 'Teks pemberitahuan berhasil diperbarui dan disiarkan ke portal publik!'
      });
      setFormData(result.data);
      if (onRefreshGlobal) onRefreshGlobal();
    } catch (err: any) {
      sound.playPop();
      setMessage({
        type: 'error',
        text: err.message || 'Terjadi kesalahan sistem saat menyimpan.'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleResetToDefault = () => {
    if (window.confirm('Kembalikan teks pemberitahuan ke format standar asas hukum LKI?')) {
      sound.playPop();
      setFormData({
        ...DEFAULT_CONFIG,
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
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900">
                Pengaturan Teks Pemberitahuan Hukum
              </h1>
              <p className="text-xs text-slate-500">
                Sesuaikan teks disclaimer, asas praduga tak bersalah, dan label pengumuman portal publik.
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
            onClick={fetchAnnouncement}
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

      {/* Main Grid: Form + Live Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Form Editor (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <span>Formulir Teks Banner</span>
            </h2>
            
            {/* Active Toggle Switch */}
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-medium text-slate-600">
                Status Publikasi:
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
                Judul Pemberitahuan
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:border-[#DC2626] focus:ring-2 focus:ring-[#DC2626]/20 transition-all font-medium"
                placeholder="PEMBERITAHUAN ASAS HUKUM & SUMBER RESMI:"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Teks judul tebal di bagian atas banner (ikon neraca hukum ditampilkan otomatis di samping judul).
              </p>
            </div>

            {/* Badge Input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Label Badge
              </label>
              <input
                type="text"
                value={formData.badge}
                onChange={e => setFormData({ ...formData, badge: e.target.value })}
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:border-[#DC2626] focus:ring-2 focus:ring-[#DC2626]/20 transition-all font-medium"
                placeholder="Wajib Dibaca"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Label pill kecil penegas urgensi di samping judul (misal: "Wajib Dibaca", "Asas Hukum", "Resmi").
              </p>
            </div>

            {/* Main Content Textarea */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Teks Utama (Pernyataan Asas Praduga Tak Bersalah)
              </label>
              <textarea
                rows={4}
                value={formData.main_text}
                onChange={e => setFormData({ ...formData, main_text: e.target.value })}
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:border-[#DC2626] focus:ring-2 focus:ring-[#DC2626]/20 transition-all font-medium leading-relaxed"
                placeholder="Data bersumber dari putusan pengadilan..."
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Kutipan formal asas praduga tak bersalah (*presumption of innocence*) sebelum putusan inkracht.
              </p>
            </div>

            {/* Subtext Textarea */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Subteks Verifikasi &amp; Dokumen Rujukan
              </label>
              <input
                type="text"
                value={formData.sub_text}
                onChange={e => setFormData({ ...formData, sub_text: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:border-[#DC2626] focus:ring-2 focus:ring-[#DC2626]/20 transition-all font-medium"
                placeholder="Setiap data diverifikasi dengan tautan resmi..."
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Keterangan kecil di bagian bawah dengan ikon perisai verifikasi sumber.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleResetToDefault}
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
                    <span>Simpan &amp; Terapkan ke Publik</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Live Preview & Legal Notes (5 cols) */}
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
                Sesuai Tampilan Publik
              </span>
            </div>

            {/* Live Banner Container */}
            <div className="p-3 bg-[#FAF8F5] rounded-2xl border border-dashed border-slate-200">
              {formData.is_active ? (
                <div
                  id="disclaimer-banner-preview"
                  className="relative bg-[#FEF9C3] border-2 border-dashed border-[#CA8A04] rounded-2xl p-4 shadow-sm text-[#713F12]"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-[#FDE047] text-[#854D0E] rounded-xl shadow-inner shrink-0 rotate-[-2deg]">
                      <Scale className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm sm:text-base text-[#854D0E] tracking-wide">
                          {stripLeadingEmoji(formData.title) || 'Judul Pemberitahuan'}
                        </span>
                        {formData.badge && (
                          <span className="px-2 py-0.5 bg-[#FACC15] text-[#713F12] text-[11px] font-bold rounded-full uppercase tracking-wider">
                            {formData.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-xs sm:text-sm leading-relaxed text-[#5F370E]">
                        &ldquo;{formData.main_text || 'Teks pemberitahuan...'}&rdquo;
                      </p>
                      {formData.sub_text && (
                        <p className="text-[11px] text-[#854D0E] opacity-90 flex items-center gap-1.5 pt-1">
                          <ShieldAlert className="w-3 h-3 inline shrink-0" />
                          <span>{formData.sub_text}</span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center text-slate-400 space-y-2">
                  <Eye className="w-8 h-8 mx-auto text-slate-300" />
                  <p className="text-xs font-semibold text-slate-600">
                    Banner Sedang Disembunyikan
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Banner tidak akan muncul di halaman beranda publik selama opsi &quot;Status Publikasi&quot; disembunyikan.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Legal Compliance Guidelines */}
          <div className="bg-slate-50 border border-slate-200 rounded-3xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-slate-700">
              <HelpCircle className="w-4 h-4 text-amber-500" />
              <h3 className="text-xs font-bold">Panduan Kepatuhan Hukum</h3>
            </div>
            
            <ul className="text-[11px] text-slate-600 space-y-2 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="text-amber-500 font-bold">•</span>
                <span>
                  <strong>Pasal 8 ayat 1 UU No. 48/2009</strong>: Setiap orang yang disangka, ditangkap, ditahan, dituntut, atau dihadapkan di muka pengadilan wajib dianggap tidak bersalah sebelum ada putusan inkracht.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-500 font-bold">•</span>
                <span>
                  <strong>Transparansi Publik (UU KIP No. 14/2008)</strong>: Data wajib mengutip rujukan putusan pengadilan atau pemberitaan terverifikasi pers nasional.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-500 font-bold">•</span>
                <span>
                  <strong>Jejak Audit</strong>: Setiap perubahan teks yang Anda simpan akan dicatat pada menu <em>Log Audit &amp; Rollback</em>.
                </span>
              </li>
            </ul>
          </div>

        </div>

      </div>

    </div>
  );
};
