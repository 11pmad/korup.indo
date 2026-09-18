import React, { useState } from 'react';
import { 
  X, 
  UserCheck, 
  Lock, 
  User, 
  Mail, 
  Sparkles, 
  ShieldCheck, 
  Smile, 
  ArrowRight,
  Zap,
  LogIn
} from 'lucide-react';
import { sound } from '../utils/audio.js';

interface CitizenUser {
  id: string;
  username: string;
  displayName: string;
  role: 'citizen';
  avatarSeed?: string;
}

interface CitizenAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (user: CitizenUser) => void;
  initialMode?: 'login' | 'register' | 'quick';
  contextMessage?: string;
}

export const AVATAR_OPTIONS = [
  { id: 'garuda', emoji: '🦅', label: 'Garuda' },
  { id: 'merah', emoji: '🔴', label: 'Merah Putih' },
  { id: 'padi', emoji: '🌾', label: 'Padi Kapas' },
  { id: 'emas', emoji: '⭐', label: 'Bintang Emas' },
  { id: 'banteng', emoji: '🐃', label: 'Banteng' },
  { id: 'buku', emoji: '📖', label: 'Cendekia' }
];

export const CitizenAuthModal: React.FC<CitizenAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialMode = 'quick',
  contextMessage
}) => {
  const [mode, setMode] = useState<'login' | 'register' | 'quick'>(initialMode);
  
  // Form states
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('garuda');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSaveAuth = (token: string, user: CitizenUser) => {
    localStorage.setItem('lki_citizen_token', token);
    localStorage.setItem('lki_citizen_user', JSON.stringify(user));
    window.dispatchEvent(new Event('lki_citizen_auth_change'));
    sound.playSuccess();
    if (onSuccess) onSuccess(user);
    onClose();
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/citizen/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal masuk akun warga.');
      }
      handleSaveAuth(data.token, data.user);
    } catch (err: any) {
      sound.playError();
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/citizen/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          displayName,
          password,
          email: email || undefined,
          avatarSeed: selectedAvatar
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal mendaftarkan akun warga.');
      }
      handleSaveAuth(data.token, data.user);
    } catch (err: any) {
      sound.playError();
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/citizen/quick', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: displayName || 'Warga Pemerhati Integritas',
          avatarSeed: selectedAvatar
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal membuat identitas warga kilat.');
      }
      handleSaveAuth(data.token, data.user);
    } catch (err: any) {
      sound.playError();
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div 
        className="bg-[#FFFDF9] border-3 border-[#E5DAC4] rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5 relative animate-in fade-in zoom-in-95 duration-200 my-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Washi Tape Header */}
        <div className="washi-tape washi-tape-yellow -top-3 left-1/2 -translate-x-1/2 !w-24 !h-4 !opacity-90 shadow-xs"></div>

        {/* Close Button */}
        <button
          onClick={() => {
            sound.playPop();
            onClose();
          }}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
          title="Tutup"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title Header */}
        <div className="space-y-1 text-center pt-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 border border-amber-300 text-amber-900 text-[11px] font-bold">
            <UserCheck className="w-3.5 h-3.5 text-amber-700" />
            <span>Role: Pengguna Biasa (Warga LKI)</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold font-hand text-[#78350F]">
            Suara &amp; Sentimen Warga
          </h3>
          <p className="text-xs text-[#78716C] max-w-sm mx-auto">
            {contextMessage || 'Masuk atau gunakan nama panggilan untuk memberikan reaksi emoji dan menyampaikan pandangan berbobot pada berkas perkara korupsi.'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-3 gap-1 bg-[#F5EFE0] p-1 rounded-2xl border border-[#E7DECB] text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              sound.playPop();
              setMode('quick');
              setError(null);
            }}
            className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer ${
              mode === 'quick' 
                ? 'bg-white text-[#78350F] shadow-xs' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-600" />
            <span>Kilat</span>
          </button>
          <button
            type="button"
            onClick={() => {
              sound.playPop();
              setMode('login');
              setError(null);
            }}
            className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer ${
              mode === 'login' 
                ? 'bg-white text-[#78350F] shadow-xs' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LogIn className="w-3.5 h-3.5 text-blue-600" />
            <span>Masuk</span>
          </button>
          <button
            type="button"
            onClick={() => {
              sound.playPop();
              setMode('register');
              setError(null);
            }}
            className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer ${
              mode === 'register' 
                ? 'bg-white text-[#78350F] shadow-xs' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-rose-600" />
            <span>Daftar</span>
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium animate-in fade-in duration-150">
            ⚠️ {error}
          </div>
        )}

        {/* Form Mode 1: Quick Citizen Voice */}
        {mode === 'quick' && (
          <form onSubmit={handleQuickAuth} className="space-y-4">
            <div className="p-3 bg-amber-50/70 border border-dashed border-amber-200 rounded-2xl text-[11px] text-amber-900 leading-relaxed">
              ⚡ <strong>Mode Suara Kilat:</strong> Cukup masukkan nama panggilan Anda untuk langsung bersuara tanpa perlu kata sandi.
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Nama Panggilan / Alias Netizen
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  placeholder="Contoh: Warga Sadar Hukum / Siti Bandung"
                  className="w-full pl-9 pr-3 py-2.5 bg-white border border-[#CBD5E1] focus:border-amber-500 rounded-xl text-xs text-slate-900 outline-hidden transition-all shadow-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Pilih Karakter Lencana Avatar
              </label>
              <div className="grid grid-cols-6 gap-2">
                {AVATAR_OPTIONS.map(av => (
                  <button
                    key={av.id}
                    type="button"
                    onClick={() => setSelectedAvatar(av.id)}
                    className={`p-2 rounded-xl border text-base flex flex-col items-center justify-center transition-all cursor-pointer ${
                      selectedAvatar === av.id
                        ? 'border-amber-500 bg-amber-100 ring-2 ring-amber-400/40 scale-105'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                    title={av.label}
                  >
                    <span>{av.emoji}</span>
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#78350F] hover:bg-[#5E2B0C] text-white font-bold rounded-xl text-xs sm:text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <span>{loading ? 'Memproses...' : 'Lanjut Bersuara Sebagai Warga'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* Form Mode 2: Login */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Username Warga
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="Username yang terdaftar"
                  className="w-full pl-9 pr-3 py-2.5 bg-white border border-[#CBD5E1] focus:border-amber-500 rounded-xl text-xs text-slate-900 outline-hidden transition-all shadow-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Kata Sandi
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2.5 bg-white border border-[#CBD5E1] focus:border-amber-500 rounded-xl text-xs text-slate-900 outline-hidden transition-all shadow-xs"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-xl text-xs sm:text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <span>{loading ? 'Memverifikasi...' : 'Masuk Akun Warga'}</span>
              <LogIn className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* Form Mode 3: Register */}
        {mode === 'register' && (
          <form onSubmit={handleRegister} className="space-y-3.5">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">
                Nama Lengkap / Panggilan
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  placeholder="Contoh: Rahmat Hidayat"
                  className="w-full pl-9 pr-3 py-2 bg-white border border-[#CBD5E1] focus:border-amber-500 rounded-xl text-xs text-slate-900 outline-hidden transition-all shadow-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">
                Username Unik (Hanya huruf, angka, underscore)
              </label>
              <div className="relative">
                <span className="text-xs font-bold text-slate-400 absolute left-3 top-1/2 -translate-y-1/2">@</span>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={e => setUsername(e.target.value.toLowerCase())}
                  placeholder="rahmat_hidayat"
                  className="w-full pl-8 pr-3 py-2 bg-white border border-[#CBD5E1] focus:border-amber-500 rounded-xl text-xs text-slate-900 outline-hidden transition-all shadow-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">
                Kata Sandi (Minimal 6 karakter)
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 bg-white border border-[#CBD5E1] focus:border-amber-500 rounded-xl text-xs text-slate-900 outline-hidden transition-all shadow-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">
                Pilih Karakter Lencana Avatar
              </label>
              <div className="grid grid-cols-6 gap-2">
                {AVATAR_OPTIONS.map(av => (
                  <button
                    key={av.id}
                    type="button"
                    onClick={() => setSelectedAvatar(av.id)}
                    className={`p-1.5 rounded-xl border text-sm flex flex-col items-center justify-center transition-all cursor-pointer ${
                      selectedAvatar === av.id
                        ? 'border-amber-500 bg-amber-100 ring-2 ring-amber-400/40 scale-105'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                    title={av.label}
                  >
                    <span>{av.emoji}</span>
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs sm:text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <span>{loading ? 'Mendaftarkan...' : 'Daftar Akun Warga'}</span>
              <Sparkles className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* Footer Note */}
        <div className="pt-2 border-t border-[#EAE1CD] text-center text-[11px] text-[#A8A29E] flex items-center justify-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Privasi terjaga. Suara warga dilindungi asas transparansi publik.</span>
        </div>

      </div>
    </div>
  );
};
