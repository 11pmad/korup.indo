import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  UserCheck, 
  Lock, 
  User, 
  Mail, 
  Sparkles, 
  ShieldCheck, 
  ArrowRight,
  Zap,
  LogIn,
  Eye,
  EyeOff,
  CheckCircle2,
  ShieldAlert
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
  initialMode = 'login',
  contextMessage
}) => {
  const [mode, setMode] = useState<'login' | 'register' | 'quick'>(initialMode);
  
  // Form states
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('garuda');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setError(null);
      setShowPassword(false);
      const savedUser = localStorage.getItem('lki_remembered_citizen_username');
      if (savedUser) {
        setUsername(savedUser);
        setRememberMe(true);
      }
    }
  }, [isOpen, initialMode]);

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
        body: JSON.stringify({ username: username.trim(), password })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal masuk akun warga.');
      }

      if (rememberMe) {
        localStorage.setItem('lki_remembered_citizen_username', username.trim());
      } else {
        localStorage.removeItem('lki_remembered_citizen_username');
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

  const modalContent = (
    <div 
      id="citizen-auth-modal"
      className="fixed inset-0 z-9999 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="relative bg-[#FFFDF8] border-3 border-[#E2D5B7] rounded-3xl p-5 sm:p-7 max-w-md w-full shadow-2xl space-y-4.5 animate-in fade-in zoom-in-95 duration-200 my-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Scrapbook Dual Washi Tapes */}
        <div className="washi-tape washi-tape-yellow -top-3 left-8 !w-24 !h-4.5 !opacity-90 shadow-xs"></div>
        <div className="washi-tape washi-tape-pink -top-3 right-8 !w-20 !h-4.5 !opacity-90 shadow-xs"></div>

        {/* Close Button */}
        <button
          onClick={() => {
            sound.playPop();
            onClose();
          }}
          className="absolute top-4 right-4 p-2 rounded-full bg-[#F3EDE0] text-[#57534E] hover:bg-[#E5DAC0] hover:text-[#1F2937] transition-colors cursor-pointer"
          title="Tutup Modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Passport Header */}
        <div className="space-y-1.5 text-center pt-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FEF3C7] border border-[#FDE68A] text-[#92400E] text-[11px] font-bold shadow-2xs">
            <UserCheck className="w-3.5 h-3.5 text-amber-600" />
            <span>KARTU IDENTITAS SUARA WARGA LKI 🇮🇩</span>
          </div>

          <h3 className="text-xl sm:text-2xl font-marker text-[#1E293B] tracking-wide">
            {mode === 'login' ? 'Masuk Akun Warga' : mode === 'register' ? 'Daftar Akun Warga' : 'Suara Kilat Warga'}
          </h3>

          <p className="text-xs text-[#64748B] max-w-sm mx-auto leading-relaxed">
            {contextMessage || (
              mode === 'login' 
                ? 'Masuk untuk memberikan reaksi sentimen, menyampaikan telaah kritis, dan mengawal keadilan berkas perkara korupsi.'
                : mode === 'register'
                ? 'Daftarkan akun warga Anda untuk mendapatkan identitas permanen dan rekam jejak aspirasi.'
                : 'Berikan reaksi emoji dan aspirasi secara instan tanpa perlu mendaftarkan kata sandi.'
            )}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-3 gap-1.5 bg-[#F5EFE0] p-1.5 rounded-2xl border border-[#E7DECB] text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              sound.playPop();
              setMode('login');
              setError(null);
            }}
            className={`py-2 px-1 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              mode === 'login' 
                ? 'bg-white text-[#1E293B] shadow-sm border border-[#E2D5B7]' 
                : 'text-[#78716C] hover:text-[#1E293B] hover:bg-white/50'
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
            className={`py-2 px-1 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              mode === 'register' 
                ? 'bg-white text-[#1E293B] shadow-sm border border-[#E2D5B7]' 
                : 'text-[#78716C] hover:text-[#1E293B] hover:bg-white/50'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Buat Akun</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sound.playPop();
              setMode('quick');
              setError(null);
            }}
            className={`py-2 px-1 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              mode === 'quick' 
                ? 'bg-white text-[#1E293B] shadow-sm border border-[#E2D5B7]' 
                : 'text-[#78716C] hover:text-[#1E293B] hover:bg-white/50'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-600" />
            <span>Mode Kilat</span>
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3 rounded-2xl bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B] text-xs font-medium animate-in fade-in duration-150 flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-[#DC2626] shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Mode 1: Login */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-3.5">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#334155]">
                Username Warga
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="Username terdaftar (contoh: budi_warga)"
                  className="w-full pl-9 pr-3 py-2.5 bg-white border border-[#CBD5E1] focus:border-amber-500 focus:ring-2 focus:ring-amber-400/20 rounded-xl text-xs text-slate-900 outline-hidden transition-all shadow-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-[#334155]">
                  Kata Sandi
                </label>
                <button
                  type="button"
                  onClick={() => {
                    sound.playPop();
                    setMode('quick');
                    setError(null);
                  }}
                  className="text-[11px] font-bold text-amber-700 hover:text-amber-800 hover:underline cursor-pointer"
                >
                  Lupa sandi? Pakai Mode Kilat ⚡
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Masukkan kata sandi akun"
                  className="w-full pl-9 pr-10 py-2.5 bg-white border border-[#CBD5E1] focus:border-amber-500 focus:ring-2 focus:ring-amber-400/20 rounded-xl text-xs text-slate-900 outline-hidden transition-all shadow-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-1"
                  title={showPassword ? 'Sembunyikan sandi' : 'Tampilkan sandi'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between pt-0.5">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-[#475569]">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  className="rounded border-[#CBD5E1] text-amber-600 focus:ring-amber-500 cursor-pointer"
                />
                <span>Ingat username saya di perangkat ini</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#1E293B] hover:bg-[#334155] text-white font-bold rounded-xl text-xs sm:text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <span>Memverifikasi Berkas...</span>
              ) : (
                <>
                  <LogIn className="w-4 h-4 text-amber-400" />
                  <span>Masuk ke Akun Warga</span>
                </>
              )}
            </button>

            {/* Quick Switch Links */}
            <div className="pt-2 text-center text-xs space-y-1.5 border-t border-[#EAE1CD]">
              <p className="text-[#64748B]">
                Belum memiliki akun warga?{' '}
                <button
                  type="button"
                  onClick={() => {
                    sound.playPop();
                    setMode('register');
                    setError(null);
                  }}
                  className="font-bold text-[#0284C7] hover:underline cursor-pointer"
                >
                  Daftar Akun Baru Sekarang ✨
                </button>
              </p>
              <p className="text-[#64748B]">
                Atau ingin bersuara langsung tanpa kata sandi?{' '}
                <button
                  type="button"
                  onClick={() => {
                    sound.playPop();
                    setMode('quick');
                    setError(null);
                  }}
                  className="font-bold text-[#D97706] hover:underline cursor-pointer"
                >
                  Gunakan Suara Kilat ⚡
                </button>
              </p>
            </div>
          </form>
        )}

        {/* Mode 2: Register */}
        {mode === 'register' && (
          <form onSubmit={handleRegister} className="space-y-3">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-[#334155]">
                Nama Lengkap / Nama Alias Publik
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  placeholder="Contoh: Rahmat Hidayat / Warga Sadar Hukum"
                  className="w-full pl-9 pr-3 py-2 bg-white border border-[#CBD5E1] focus:border-amber-500 focus:ring-2 focus:ring-amber-400/20 rounded-xl text-xs text-slate-900 outline-hidden transition-all shadow-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-[#334155]">
                Username Unik (Hanya huruf, angka, underscore)
              </label>
              <div className="relative">
                <span className="text-xs font-bold text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 font-mono">@</span>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  placeholder="rahmat_hidayat"
                  className="w-full pl-8 pr-3 py-2 bg-white border border-[#CBD5E1] focus:border-amber-500 focus:ring-2 focus:ring-amber-400/20 rounded-xl text-xs text-slate-900 outline-hidden transition-all shadow-xs font-mono"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-[#334155]">
                Kata Sandi Akun
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  className="w-full pl-9 pr-10 py-2 bg-white border border-[#CBD5E1] focus:border-amber-500 focus:ring-2 focus:ring-amber-400/20 rounded-xl text-xs text-slate-900 outline-hidden transition-all shadow-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-1"
                  title={showPassword ? 'Sembunyikan sandi' : 'Tampilkan sandi'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Avatar Selector */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-[#334155]">
                Pilih Lencana Karakter Avatar Anda
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
                        ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-400/30 scale-105 shadow-xs'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                    title={av.label}
                  >
                    <span className="text-lg">{av.emoji}</span>
                    <span className="text-[9px] font-bold text-slate-700 truncate max-w-full pt-0.5">
                      {av.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs sm:text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <span>Mendaftarkan Akun...</span>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Daftar &amp; Aktifkan Akun Warga</span>
                </>
              )}
            </button>

            {/* Quick Switch Link */}
            <div className="pt-2 text-center text-xs border-t border-[#EAE1CD]">
              <p className="text-[#64748B]">
                Sudah memiliki akun warga?{' '}
                <button
                  type="button"
                  onClick={() => {
                    sound.playPop();
                    setMode('login');
                    setError(null);
                  }}
                  className="font-bold text-[#0284C7] hover:underline cursor-pointer"
                >
                  Masuk di sini 🔑
                </button>
              </p>
            </div>
          </form>
        )}

        {/* Mode 3: Quick Voice */}
        {mode === 'quick' && (
          <form onSubmit={handleQuickAuth} className="space-y-3.5">
            <div className="p-3 bg-[#FFFBEB] border border-dashed border-[#FDE68A] rounded-2xl text-xs text-[#92400E] leading-relaxed flex items-start gap-2">
              <Zap className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong>Suara Kilat:</strong> Cukup tentukan nama panggilan dan pilih lencana avatar untuk langsung memberikan reaksi sentimen dan menulis tanggapan.
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#334155]">
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
                  className="w-full pl-9 pr-3 py-2.5 bg-white border border-[#CBD5E1] focus:border-amber-500 focus:ring-2 focus:ring-amber-400/20 rounded-xl text-xs text-slate-900 outline-hidden transition-all shadow-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#334155]">
                Pilih Lencana Avatar
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
                    <span className="text-lg">{av.emoji}</span>
                    <span className="text-[9px] font-bold text-slate-700 truncate max-w-full pt-0.5">
                      {av.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#D97706] hover:bg-[#B45309] text-white font-bold rounded-xl text-xs sm:text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <span>Menyiapkan Identitas Kilat...</span>
              ) : (
                <>
                  <span>Mulai Bersuara Sebagai Warga</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Quick Switch Links */}
            <div className="pt-2 text-center text-xs space-y-1.5 border-t border-[#EAE1CD]">
              <p className="text-[#64748B]">
                Ingin akun permanen dengan kata sandi?{' '}
                <button
                  type="button"
                  onClick={() => {
                    sound.playPop();
                    setMode('register');
                    setError(null);
                  }}
                  className="font-bold text-[#0284C7] hover:underline cursor-pointer"
                >
                  Daftar Akun Permanen ✨
                </button>
              </p>
              <p className="text-[#64748B]">
                Sudah pernah mendaftar?{' '}
                <button
                  type="button"
                  onClick={() => {
                    sound.playPop();
                    setMode('login');
                    setError(null);
                  }}
                  className="font-bold text-[#1E293B] hover:underline cursor-pointer"
                >
                  Masuk dengan Password 🔑
                </button>
              </p>
            </div>
          </form>
        )}

        {/* Footer Note */}
        <div className="pt-2 border-t border-[#EAE1CD] text-center text-[11px] text-[#78716C] flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Privasi terlindungi. Suara warga dijamin oleh UU KIP &amp; UU PDP.</span>
        </div>

      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
};
