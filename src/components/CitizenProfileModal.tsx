import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  User, 
  MapPin, 
  Camera, 
  Upload, 
  Trash2, 
  CheckCircle2, 
  Save, 
  ShieldCheck, 
  Mail, 
  FileText,
  AlertCircle
} from 'lucide-react';
import { sound } from '../utils/audio.js';
import { PROVINCES_LIST } from './ReportModal.js';
import { AVATAR_OPTIONS } from './CitizenAuthModal.js';

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

export const CitizenProfileModal: React.FC<CitizenProfileModalProps> = ({
  isOpen,
  onClose,
  user,
  onProfileUpdated
}) => {
  const [displayName, setDisplayName] = useState(user.displayName || '');
  const [photoUrl, setPhotoUrl] = useState(user.photoUrl || '');
  const [originProvince, setOriginProvince] = useState(user.originProvince || '');
  const [originCity, setOriginCity] = useState(user.originCity || '');
  const [bio, setBio] = useState(user.bio || '');
  const [selectedAvatar, setSelectedAvatar] = useState(user.avatarSeed || 'garuda');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [photoMode, setPhotoMode] = useState<'upload' | 'url'>('upload');

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setDisplayName(user.displayName || '');
      setPhotoUrl(user.photoUrl || '');
      setOriginProvince(user.originProvince || '');
      setOriginCity(user.originCity || '');
      setBio(user.bio || '');
      setSelectedAvatar(user.avatarSeed || 'garuda');
      setError(null);
      setSuccessMsg(null);
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size < 4MB
    if (file.size > 4 * 1024 * 1024) {
      setError('Ukuran foto terlalu besar. Maksimal 4MB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoUrl(reader.result as string);
      sound.playPop();
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setPhotoUrl('');
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
          bio: bio.trim() || undefined,
          avatarSeed: selectedAvatar
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal memperbarui profil warga.');
      }

      // Update storage
      localStorage.setItem('lki_citizen_token', data.token);
      localStorage.setItem('lki_citizen_user', JSON.stringify(data.user));
      window.dispatchEvent(new Event('lki_citizen_auth_change'));

      sound.playSuccess();
      setSuccessMsg('Profil warga berhasil diperbarui!');
      if (onProfileUpdated) {
        onProfileUpdated(data.user);
      }

      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      sound.playError();
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const currentAvatarEmoji = AVATAR_OPTIONS.find(a => a.id === selectedAvatar)?.emoji || '🦅';

  const modalContent = (
    <div 
      id="citizen-profile-modal"
      className="fixed inset-0 z-9999 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="relative bg-[#FFFDF8] border-3 border-[#E2D5B7] rounded-3xl p-5 sm:p-7 max-w-lg w-full shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200 my-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Scrapbook Dual Washi Tapes */}
        <div className="washi-tape washi-tape-yellow -top-3 left-10 !w-24 !h-4.5 !opacity-90 shadow-xs"></div>
        <div className="washi-tape washi-tape-pink -top-3 right-10 !w-20 !h-4.5 !opacity-90 shadow-xs"></div>

        {/* Close Button */}
        <button
          onClick={() => {
            sound.playPop();
            onClose();
          }}
          className="absolute top-4 right-4 p-2 rounded-full bg-[#F3EDE0] text-[#57534E] hover:bg-[#E5DAC0] hover:text-[#1F2937] transition-colors cursor-pointer"
          title="Tutup Modal Profil"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center pt-1 space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FEF3C7] border border-[#FDE68A] text-[#92400E] text-[11px] font-bold shadow-2xs">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
            <span>KARTU IDENTITAS WARGA LKI</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-marker text-[#1E293B]">
            Edit Profil Warga
          </h3>
          <p className="text-xs text-[#64748B]">
            Perbarui foto, asal daerah kedaulatan, dan profil publik Anda.
          </p>
        </div>

        {/* Error / Success Notifications */}
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

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Foto Profil & Avatar Section */}
          <div className="p-4 bg-[#F8F4EA] border border-[#E7DFCC] rounded-2xl space-y-3">
            <label className="block text-xs font-bold text-[#334155]">
              Foto Profil Pengguna (Warga)
            </label>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              {/* Avatar / Photo Preview Box */}
              <div className="relative group shrink-0">
                <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-2xl overflow-hidden bg-white border-2 border-[#D6C7A1] shadow-md flex items-center justify-center">
                  {photoUrl ? (
                    <img 
                      src={photoUrl} 
                      alt="Foto Profil Warga" 
                      className="w-full h-full object-cover"
                      onError={() => {
                        setPhotoUrl('');
                        setError('Gagal memuat URL foto. Format gambar tidak didukung atau tautan mati.');
                      }}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center p-1">
                      <span className="text-3xl">{currentAvatarEmoji}</span>
                      <span className="text-[9px] font-bold text-[#78716C] mt-0.5">Avatar</span>
                    </div>
                  )}
                </div>

                {photoUrl && (
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="absolute -top-1.5 -right-1.5 p-1 bg-red-600 text-white rounded-full hover:bg-red-700 shadow-md cursor-pointer"
                    title="Hapus foto dan kembali ke avatar"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Photo Upload / URL Controls */}
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
                      <span>{photoUrl ? 'Ganti Foto dari Perangkat' : 'Pilih Foto dari Galeri/Perangkat'}</span>
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
                      onChange={e => setPhotoUrl(e.target.value)}
                      placeholder="https://example.com/foto-warga.jpg"
                      className="w-full px-3 py-2 bg-white border border-[#CBD5E1] focus:border-amber-500 rounded-xl text-xs text-slate-900 outline-hidden shadow-2xs"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Avatar Badge Alternative */}
            <div className="pt-2 border-t border-[#E7DFCC]">
              <label className="block text-[11px] font-bold text-[#475569] mb-1.5">
                Lencana Karakter Avatar {!photoUrl && '(Aktif)'}
              </label>
              <div className="grid grid-cols-6 gap-1.5">
                {AVATAR_OPTIONS.map(av => (
                  <button
                    key={av.id}
                    type="button"
                    onClick={() => {
                      sound.playPop();
                      setSelectedAvatar(av.id);
                    }}
                    className={`p-1.5 rounded-xl border flex flex-col items-center justify-center transition-all cursor-pointer ${
                      selectedAvatar === av.id
                        ? 'border-amber-500 bg-amber-100 ring-2 ring-amber-400/40 scale-105 shadow-xs'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                    title={av.label}
                  >
                    <span className="text-base">{av.emoji}</span>
                    <span className="text-[9px] font-bold text-slate-700 truncate max-w-full">
                      {av.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Nama Tampilan */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-[#334155]">
              Nama Tampilan / Alias Publik <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder="Nama lengkap atau nama alias Anda"
                className="w-full pl-9 pr-3 py-2.5 bg-white border border-[#CBD5E1] focus:border-amber-500 focus:ring-2 focus:ring-amber-400/20 rounded-xl text-xs text-slate-900 outline-hidden transition-all shadow-xs"
              />
            </div>
          </div>

          {/* Asal Daerah (Provinsi & Kota) */}
          <div className="p-3.5 bg-[#FEFCE8] border border-[#FEF08A] rounded-2xl space-y-2.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#854D0E]">
              <MapPin className="w-3.5 h-3.5 text-amber-600" />
              <span>Asal Daerah Domisili Warga</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-bold text-[#713F12] mb-1">
                  Provinsi Asal
                </label>
                <select
                  value={originProvince}
                  onChange={e => setOriginProvince(e.target.value)}
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
                <input
                  type="text"
                  value={originCity}
                  onChange={e => setOriginCity(e.target.value)}
                  placeholder="Contoh: Kota Bandung / Sleman"
                  className="w-full px-3 py-2 bg-white border border-[#CBD5E1] focus:border-amber-500 rounded-xl text-xs text-slate-900 outline-hidden shadow-2xs"
                />
              </div>
            </div>
          </div>

          {/* Bio / Aspirasi Singkat */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <label className="font-bold text-[#334155]">
                Slogan / Catatan Warga (Opsional)
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
              placeholder="Contoh: Mengawal keadilan hukum dan APBD yang bersih demi anak cucu bangsa."
              className="w-full p-2.5 bg-white border border-[#CBD5E1] focus:border-amber-500 focus:ring-2 focus:ring-amber-400/20 rounded-xl text-xs text-slate-900 outline-hidden transition-all shadow-xs resize-none"
            />
          </div>

          {/* Info Status Akun & Email */}
          <div className="p-3 bg-[#F1F5F9] border border-[#CBD5E1] rounded-xl flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-slate-500" />
              <div>
                <p className="font-bold text-slate-800">
                  {user.email || 'Email belum diatur'}
                </p>
                <p className="text-[10px] text-slate-500 font-mono">
                  @{user.username}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 px-2.5 py-1 bg-emerald-100 border border-emerald-300 text-emerald-800 rounded-full text-[10px] font-bold shadow-2xs">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              <span>Terverifikasi</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-[#EAE1CD]">
            <button
              type="button"
              onClick={() => {
                sound.playPop();
                onClose();
              }}
              className="px-4 py-2.5 bg-[#F3EDE0] hover:bg-[#E5DAC0] text-[#57534E] rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Batal
            </button>

            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-[#1E293B] hover:bg-[#334155] text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <span>Menyimpan...</span>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5 text-amber-400" />
                  <span>Simpan Profil Warga</span>
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
};
