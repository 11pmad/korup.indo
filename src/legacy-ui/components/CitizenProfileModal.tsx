"use client";

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  User,
  MapPin,
  Upload,
  Trash2,
  CheckCircle2,
  Save,
  ShieldCheck,
  Mail,
  AlertCircle,
  Edit3,
  ArrowLeft,
  Loader2,
  Calendar,
  FileText
} from 'lucide-react';
import { sound } from '../utils/audio';
import { parseApiJson } from '../utils/safeJson';
import {
  PROVINCES_LIST,
  getCitiesByProvince
} from '../constants/provinces';

export interface CitizenUser {
  id: string;
  username: string;
  displayName: string;
  email?: string | null;
  photoUrl?: string | null;
  originProvince?: string | null;
  originCity?: string | null;
  bio?: string | null;
  avatarSeed?: string;
  role: 'citizen';
  isEmailVerified?: boolean;
  authProvider?: string;
  created_at?: string | Date;
}

interface CitizenProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: CitizenUser;
  onProfileUpdated?: (user: CitizenUser) => void;
}

function formatJoinDate(dateInput?: string | Date): string | null {
  if (!dateInput) return null;
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

export const CitizenProfileModal: React.FC<CitizenProfileModalProps> = ({
  isOpen,
  onClose,
  user,
  onProfileUpdated
}) => {
  const [modalMode, setModalMode] = useState<'view' | 'edit'>('view');

  const [displayName, setDisplayName] = useState(user.displayName || '');
  const [photoUrl, setPhotoUrl] = useState(user.photoUrl || '');
  const [originProvince, setOriginProvince] = useState(user.originProvince || '');
  const [originCity, setOriginCity] = useState(user.originCity || '');
  const [bio, setBio] = useState(user.bio || '');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [photoMode, setPhotoMode] = useState<'upload' | 'url'>('upload');
  const [imgFailed, setImgFailed] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setModalMode('view');
      setDisplayName(user.displayName || '');
      setPhotoUrl(user.photoUrl || '');
      setOriginProvince(user.originProvince || '');
      setOriginCity(user.originCity || '');
      setBio(user.bio || '');
      setError(null);
      setSuccessMsg(null);
      setImgFailed(false);
    }
  }, [isOpen, user]);

  const availableCities = getCitiesByProvince(originProvince);

  const handleProvinceChange = (newProvince: string) => {
    setOriginProvince(newProvince);
    const cities = getCitiesByProvince(newProvince);
    setOriginCity(cities.length > 0 ? cities[0] : '');
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 4 * 1024 * 1024) {
      setError('Ukuran foto terlalu besar. Maksimal 4MB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImgFailed(false);
      setPhotoUrl(reader.result as string);
      sound.playPop();
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setPhotoUrl('');
    setImgFailed(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    sound.playPop();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const token = localStorage.getItem('lki_citizen_token');
      if (!token) {
        throw new Error('Sesi warga tidak ditemukan. Silakan masuk kembali.');
      }

      const res = await fetch('/api/auth/citizen/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          displayName: displayName.trim(),
          photoUrl: photoUrl.trim() || undefined,
          originProvince: originProvince || undefined,
          originCity: originCity.trim() || undefined,
          bio: bio.trim() || undefined
        })
      });

      const data = await parseApiJson(res);
      if (!res.ok) {
        throw new Error(data.error || 'Gagal memperbarui profil warga.');
      }

      localStorage.setItem('lki_citizen_token', data.token);
      localStorage.setItem('lki_citizen_user', JSON.stringify(data.user));
      window.dispatchEvent(new Event('lki_citizen_auth_change'));

      sound.playSuccess();
      setSuccessMsg('Profil warga berhasil diperbarui!');
      if (onProfileUpdated) {
        onProfileUpdated(data.user);
      }

      setTimeout(() => {
        setModalMode('view');
        setSuccessMsg(null);
      }, 900);
    } catch (err: any) {
      sound.playError();
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const activeName = user.displayName || user.username || 'Warga LKI';
  const activeProvince = user.originProvince?.trim() || '';
  const activeCity = user.originCity?.trim() || '';
  const activeLocation = [activeCity, activeProvince].filter(Boolean).join(', ');
  const joinDate = formatJoinDate(user.created_at);
  const showPhoto = Boolean(photoUrl && !imgFailed);

  const modalContent = (
    <div
      id="citizen-profile-modal"
      className="fixed inset-0 z-9999 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative bg-[#FFFDF8] border-3 border-[#E2D5B7] rounded-3xl p-4 sm:p-6 max-w-xl w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200 my-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="washi-tape washi-tape-yellow -top-3 left-10 !w-24 !h-4.5 !opacity-90 shadow-xs"></div>
        <div className="washi-tape washi-tape-pink -top-3 right-10 !w-20 !h-4.5 !opacity-90 shadow-xs"></div>

        <button
          onClick={() => {
            sound.playPop();
            onClose();
          }}
          className="absolute top-3.5 right-3.5 p-2 rounded-full bg-[#F3EDE0] text-[#57534E] hover:bg-[#E5DAC0] hover:text-[#1F2937] transition-colors cursor-pointer z-10"
          title="Tutup Modal Profil"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-b border-[#EAE1CD] pb-3">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#FEF3C7] border border-[#FDE68A] text-[#92400E] text-[10px] font-bold shadow-2xs">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
              <span>AKUN WARGA LKI</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-marker text-[#1E293B] mt-0.5">
              {modalMode === 'view' ? 'Profil Warga' : 'Ubah Data Profil Warga'}
            </h3>
            <p className="text-[11px] sm:text-xs text-[#64748B]">
              {modalMode === 'view'
                ? 'Informasi akun yang terdaftar pada portal Liga Korupsi Indonesia.'
                : 'Perbarui foto profil, nama tampilan, domisili, dan catatan Anda.'}
            </p>
          </div>

          {modalMode === 'view' ? (
            <button
              type="button"
              onClick={() => {
                sound.playPop();
                setModalMode('edit');
              }}
              className="self-start sm:self-center inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer hover:shadow-md mr-8 sm:mr-9"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Profil</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                sound.playPop();
                setModalMode('view');
              }}
              className="self-start sm:self-center inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#F3EDE0] hover:bg-[#E5DAC0] text-[#57534E] rounded-xl text-xs font-bold transition-all cursor-pointer mr-8 sm:mr-9"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Lihat Profil</span>
            </button>
          )}
        </div>

        {error && (
          <div className="p-3 rounded-2xl bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B] text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 rounded-2xl bg-[#F0FDF4] border border-[#BBF7D0] text-[#166534] text-xs font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {modalMode === 'view' ? (
          <div className="space-y-4">
            {/* Kartu Profil Ringkas sesuai data terdaftar */}
            <div className="p-4 sm:p-5 bg-[#F8F5EE] border border-[#E7DECB] rounded-2xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3.5">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden bg-amber-100 border-2 border-[#E2D5B7] flex items-center justify-center shrink-0 shadow-xs">
                    {showPhoto ? (
                      <img
                        src={photoUrl}
                        alt={activeName}
                        className="w-full h-full object-cover"
                        onError={() => setImgFailed(true)}
                      />
                    ) : (
                      <User className="w-8 h-8 text-amber-800" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-base sm:text-lg font-extrabold text-[#1E293B] truncate">
                      {activeName}
                    </h4>
                    <p className="text-xs font-mono text-slate-500 truncate">
                      @{user.username}
                    </p>
                  </div>
                </div>

                <div
                  className={`self-start sm:self-center inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border shadow-2xs ${
                    user.isEmailVerified === false
                      ? 'bg-amber-50 border-amber-200 text-amber-800'
                      : 'bg-emerald-100 border-emerald-300 text-emerald-800'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    {user.isEmailVerified === false
                      ? 'Menunggu Verifikasi'
                      : 'Warga Terverifikasi'}
                  </span>
                </div>
              </div>

              {/* Detail Informasi Terdaftar */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-[#EAE1CD] text-xs">
                <div className="p-3 bg-white rounded-xl border border-[#EAE1CD] space-y-0.5">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#64748B]">
                    <Mail className="w-3.5 h-3.5 text-amber-600" />
                    <span>Email Terdaftar</span>
                  </div>
                  <p className="font-semibold text-[#1E293B] break-all">
                    {user.email || 'Belum diatur'}
                  </p>
                </div>

                <div className="p-3 bg-white rounded-xl border border-[#EAE1CD] space-y-0.5">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#64748B]">
                    <MapPin className="w-3.5 h-3.5 text-amber-600" />
                    <span>Domisili</span>
                  </div>
                  <p className="font-semibold text-[#1E293B]">
                    {activeLocation || 'Belum diatur'}
                  </p>
                </div>

                {joinDate && (
                  <div className="p-3 bg-white rounded-xl border border-[#EAE1CD] space-y-0.5 sm:col-span-2">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#64748B]">
                      <Calendar className="w-3.5 h-3.5 text-amber-600" />
                      <span>Terdaftar Sejak</span>
                    </div>
                    <p className="font-semibold text-[#1E293B]">{joinDate}</p>
                  </div>
                )}

                {user.bio && (
                  <div className="p-3 bg-white rounded-xl border border-[#EAE1CD] space-y-1 sm:col-span-2">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#64748B]">
                      <FileText className="w-3.5 h-3.5 text-amber-600" />
                      <span>Catatan Warga</span>
                    </div>
                    <p className="text-[#334155] leading-relaxed">{user.bio}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="p-3.5 bg-[#F8F4EA] border border-[#E7DFCC] rounded-2xl space-y-3">
              <label className="block text-xs font-bold text-[#334155]">
                Foto Profil Warga
              </label>

              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="relative group shrink-0">
                  <div className="w-20 h-20 rounded-2xl overflow-hidden bg-amber-100 border-2 border-[#D6C7A1] shadow-md flex items-center justify-center">
                    {showPhoto ? (
                      <img
                        src={photoUrl}
                        alt="Foto Profil Warga"
                        className="w-full h-full object-cover"
                        onError={() => {
                          setImgFailed(true);
                          setError('Gagal memuat URL foto. Format gambar tidak didukung atau tautan mati.');
                        }}
                      />
                    ) : (
                      <User className="w-8 h-8 text-amber-800" />
                    )}
                  </div>

                  {photoUrl && (
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="absolute -top-1.5 -right-1.5 p-1 bg-red-600 text-white rounded-full hover:bg-red-700 shadow-md cursor-pointer"
                      title="Hapus foto profil"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>

                <div className="space-y-2 flex-1 w-full">
                  <div className="flex items-center gap-1.5 text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => setPhotoMode('upload')}
                      className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                        photoMode === 'upload'
                          ? 'bg-[#1E293B] text-white'
                          : 'bg-white border border-[#CBD5E1] text-[#64748B]'
                      }`}
                    >
                      Upload Gambar
                    </button>
                    <button
                      type="button"
                      onClick={() => setPhotoMode('url')}
                      className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                        photoMode === 'url'
                          ? 'bg-[#1E293B] text-white'
                          : 'bg-white border border-[#CBD5E1] text-[#64748B]'
                      }`}
                    >
                      Tautan URL Foto
                    </button>
                  </div>

                  {photoMode === 'upload' ? (
                    <div>
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        onChange={handleImageFileChange}
                        className="hidden"
                        id="citizen-profile-photo-input"
                      />
                      <label
                        htmlFor="citizen-profile-photo-input"
                        className="flex items-center justify-center gap-2 px-3 py-2 bg-white border border-dashed border-[#CBD5E1] hover:border-amber-500 rounded-xl text-xs font-bold text-[#475569] hover:text-[#1E293B] cursor-pointer transition-colors shadow-2xs"
                      >
                        <Upload className="w-4 h-4 text-amber-600" />
                        <span>{photoUrl ? 'Ganti Foto dari Perangkat' : 'Pilih Foto dari Galeri / Kamera'}</span>
                      </label>
                      <p className="text-[10px] text-[#78716C] mt-1 text-center sm:text-left">
                        Format PNG, JPG, JPEG, atau WebP (maks. 4MB)
                      </p>
                    </div>
                  ) : (
                    <div>
                      <input
                        type="url"
                        value={photoUrl}
                        onChange={e => {
                          setImgFailed(false);
                          setPhotoUrl(e.target.value);
                        }}
                        placeholder="https://example.com/foto-profil.jpg"
                        className="w-full px-3 py-2 bg-white border border-[#CBD5E1] focus:border-amber-500 rounded-xl text-xs text-slate-900 outline-hidden shadow-2xs"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-[#334155]">
                Nama Tampilan <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  placeholder="Nama tampilan Anda"
                  className="w-full pl-9 pr-3 py-2 bg-white border border-[#CBD5E1] focus:border-amber-500 focus:ring-2 focus:ring-amber-400/20 rounded-xl text-xs text-slate-900 outline-hidden transition-all shadow-xs"
                />
              </div>
            </div>

            <div className="p-3.5 bg-[#FEFCE8] border border-[#FEF08A] rounded-2xl space-y-2.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#854D0E]">
                <MapPin className="w-3.5 h-3.5 text-amber-600" />
                <span>Asal Daerah Domisili</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-[#713F12] mb-1">
                    Provinsi Asal
                  </label>
                  <select
                    value={originProvince}
                    onChange={e => handleProvinceChange(e.target.value)}
                    className="w-full px-2.5 py-2 bg-white border border-[#CBD5E1] focus:border-amber-500 rounded-xl text-xs text-slate-900 outline-hidden shadow-2xs cursor-pointer font-medium"
                  >
                    <option value="">-- Pilih Provinsi --</option>
                    {PROVINCES_LIST.map(p => (
                      <option key={p.id} value={p.name}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#713F12] mb-1">
                    Kota / Kabupaten
                  </label>
                  <select
                    value={originCity}
                    onChange={e => setOriginCity(e.target.value)}
                    disabled={!originProvince}
                    className="w-full px-2.5 py-2 bg-white border border-[#CBD5E1] focus:border-amber-500 rounded-xl text-xs text-slate-900 outline-hidden shadow-2xs cursor-pointer font-medium disabled:bg-slate-100 disabled:cursor-not-allowed"
                  >
                    {!originProvince ? (
                      <option value="">-- Pilih Provinsi Dahulu --</option>
                    ) : availableCities.length === 0 ? (
                      <option value="">-- Tidak ada kota terdaftar --</option>
                    ) : (
                      <>
                        <option value="">-- Pilih Kota / Kabupaten --</option>
                        {availableCities.map(c => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </>
                    )}
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <label className="font-bold text-[#334155]">
                  Bio / Catatan Warga
                </label>
                <span className="text-[10px] text-slate-400 font-mono">
                  {bio.length}/250
                </span>
              </div>
              <textarea
                maxLength={250}
                rows={2}
                value={bio}
                onChange={e => setBio(e.target.value)}
                placeholder="Tulis catatan singkat atau aspirasi Anda."
                className="w-full p-2.5 bg-white border border-[#CBD5E1] focus:border-amber-500 focus:ring-2 focus:ring-amber-400/20 rounded-xl text-xs text-slate-900 outline-hidden transition-all shadow-xs resize-none"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-[#EAE1CD]">
              <button
                type="button"
                onClick={() => {
                  sound.playPop();
                  setModalMode('view');
                }}
                className="px-4 py-2 bg-[#F3EDE0] hover:bg-[#E5DAC0] text-[#57534E] rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Batal
              </button>

              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 bg-[#1E293B] hover:bg-[#334155] text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5 text-amber-400" />
                    <span>Simpan Perubahan</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
};
