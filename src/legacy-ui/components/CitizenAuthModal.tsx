"use client";

import React, { useState, useEffect, useRef } from 'react';
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
  ShieldAlert,
  MapPin,
  Camera,
  Upload,
  RefreshCw,
  KeyRound,
  Trash2
} from 'lucide-react';
import { sound } from '../utils/audio';
import { PROVINCES_LIST, getCitiesByProvince } from '../constants/provinces';
import { useGoogleLogin } from '@react-oauth/google';

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
}

interface CitizenAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (user: CitizenUser) => void;
  initialMode?: 'login' | 'register' | 'verify_email';
  contextMessage?: string;
}

export const CitizenAuthModal: React.FC<CitizenAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialMode = 'login',
  contextMessage
}) => {
  const [mode, setMode] = useState<'login' | 'register' | 'verify_email' | 'google_prompt'>('login');
  
  // Registration & Login Form states
  const [identifier, setIdentifier] = useState(''); // Username or Email for login
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [originProvince, setOriginProvince] = useState('');
  const [originCity, setOriginCity] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [bio, setBio] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Email Verification OTP states
  const [otpCode, setOtpCode] = useState('');
  const [verificationEmail, setVerificationEmail] = useState('');
  const [debugOtp, setDebugOtp] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Google Sign-in dialog states
  const [googleEmail, setGoogleEmail] = useState('');
  const [googleName, setGoogleName] = useState('');
  const [googlePhoto, setGooglePhoto] = useState('https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80');
  const [googleOriginProv, setGoogleOriginProv] = useState('DKI Jakarta');
  const [googleOriginCity, setGoogleOriginCity] = useState('Jakarta Pusat');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode === 'verify_email' ? 'verify_email' : initialMode);
      setError(null);
      setInfoMsg(null);
      setShowPassword(false);
      const savedUser = localStorage.getItem('lki_remembered_citizen_username');
      if (savedUser) {
        setIdentifier(savedUser);
        setUsername(savedUser);
        setRememberMe(true);
      }
    }
  }, [isOpen, initialMode]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleSaveAuth = (token: string, user: CitizenUser) => {
    localStorage.setItem('lki_citizen_token', token);
    localStorage.setItem('lki_citizen_user', JSON.stringify(user));
    window.dispatchEvent(new Event('lki_citizen_auth_change'));
    sound.playSuccess();
    if (onSuccess) onSuccess(user);
    onClose();
  };

  // Google OAuth Popup Hook via Google Identity Services (MUST be at the top level before early returns)
  const triggerGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setError(null);
      setLoading(true);
      sound.playPop();
      try {
        const res = await fetch('/api/auth/citizen/google', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            accessToken: tokenResponse.access_token,
            originProvince: originProvince || undefined,
            originCity: originCity || undefined
          })
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Gagal masuk menggunakan akun Google.');
        }

        handleSaveAuth(data.token, data.user);
      } catch (err: any) {
        sound.playError();
        setError(err.message || 'Gagal memproses otentikasi Google.');
      } finally {
        setLoading(false);
      }
    },
    onError: (errorResponse) => {
      sound.playError();
      console.error('Google login error:', errorResponse);
      setError('Gagal menghubungkan akun Google. Pastikan jendela popup tidak diblokir browser.');
    }
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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

  // 1. Submit Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfoMsg(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/citizen/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          identifier: identifier.trim(), 
          password 
        })
      });
      const data = await res.json();
      
      if (!res.ok) {
        // If unverified, redirect to OTP verification screen
        if (data.needsVerification && data.email) {
          setVerificationEmail(data.email);
          setDebugOtp(data.debug_otp || null);
          setMode('verify_email');
          setResendCooldown(30);
          setInfoMsg(data.error || 'Silakan verifikasi email Anda terlebih dahulu.');
          sound.playPop();
          return;
        }
        throw new Error(data.error || 'Gagal masuk akun warga.');
      }

      if (rememberMe) {
        localStorage.setItem('lki_remembered_citizen_username', identifier.trim());
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

  // 2. Submit Register (requires email OTP)
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfoMsg(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/citizen/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          displayName: displayName.trim(),
          email: email.trim(),
          password,
          originProvince: originProvince || undefined,
          originCity: originCity.trim() || undefined,
          photoUrl: photoUrl.trim() || undefined,
          bio: bio.trim() || undefined
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal mendaftarkan akun warga.');
      }

      sound.playSuccess();
      setVerificationEmail(data.email || email.trim());
      setDebugOtp(data.debug_otp || null);
      setResendCooldown(45);
      setMode('verify_email');
      setInfoMsg(data.message || 'Kode verifikasi telah dikirim ke email Anda.');
    } catch (err: any) {
      sound.playError();
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 3. Submit Email OTP Verification
  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.trim().length !== 6) {
      setError('Masukkan 6-digit kode verifikasi OTP yang valid.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/citizen/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: verificationEmail.toLowerCase().trim(),
          code: otpCode.trim()
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Kode verifikasi tidak cocok atau telah kadaluarsa.');
      }

      handleSaveAuth(data.token, data.user);
    } catch (err: any) {
      sound.playError();
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 4. Resend OTP Code
  const handleResendCode = async () => {
    if (resendCooldown > 0) return;
    setError(null);
    setInfoMsg(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/citizen/resend-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: verificationEmail.toLowerCase().trim() })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal mengirim ulang kode verifikasi.');
      }

      sound.playPop();
      setDebugOtp(data.debug_otp || null);
      setResendCooldown(60);
      setInfoMsg('Kode verifikasi baru berhasil dikirimkan ke email Anda.');
    } catch (err: any) {
      sound.playError();
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 5. Google Sign-In Actions

  const handleOpenGooglePrompt = () => {
    sound.playPop();
    const defaultEmail = email || (identifier.includes('@') ? identifier : 'warga.pengawal@gmail.com');
    const defaultName = displayName || (identifier && !identifier.includes('@') ? identifier : 'Warga Anti Korupsi');
    setGoogleEmail(defaultEmail);
    setGoogleName(defaultName);
    setMode('google_prompt');
  };

  const handleGoogleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const googleId = 'g-usr-' + btoa(googleEmail).replace(/[^a-zA-Z0-9]/g, '').slice(0, 16);
      const res = await fetch('/api/auth/citizen/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: googleEmail.trim().toLowerCase(),
          displayName: googleName.trim(),
          googleId,
          photoUrl: googlePhoto || undefined,
          originProvince: googleOriginProv || undefined,
          originCity: googleOriginCity || undefined
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal masuk menggunakan akun Google.');
      }

      handleSaveAuth(data.token, data.user);
    } catch (err: any) {
      sound.playError();
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };


  if (!isOpen) return null;

  const modalContent = (
    <div 
      id="citizen-auth-modal"
      className="fixed inset-0 z-9999 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="relative bg-[#FFFDF8] border-3 border-[#E2D5B7] rounded-3xl p-5 sm:p-7 max-w-lg w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200 my-auto"
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
            {mode === 'login' && 'Masuk Akun Warga'}
            {mode === 'register' && 'Daftar Akun Warga & Verifikasi'}
            {mode === 'verify_email' && 'Verifikasi Email Warga'}
            {mode === 'google_prompt' && 'Masuk dengan Akun Google'}
          </h3>

          <p className="text-xs text-[#64748B] max-w-sm mx-auto leading-relaxed">
            {contextMessage || (
              mode === 'verify_email'
                ? `Masukkan 6-digit kode verifikasi yang telah dikirim ke ${verificationEmail}`
                : mode === 'google_prompt'
                ? 'Hubungkan akun Google Anda untuk autentikasi cepat dan terverifikasi otomatis.'
                : mode === 'login' 
                ? 'Masuk untuk memberikan reaksi sentimen, telaah kritis, dan mengawal berkas korupsi.'
                : 'Daftarkan akun warga dengan verifikasi email OTP untuk mengawal berkas korupsi.'
            )}
          </p>
        </div>

        {/* Tab Switcher (Visible in login & register) */}
        {mode !== 'verify_email' && mode !== 'google_prompt' && (
          <div className="grid grid-cols-2 gap-2 bg-[#F5EFE0] p-1.5 rounded-2xl border border-[#E7DECB] text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                sound.playPop();
                setMode('login');
                setError(null);
                setInfoMsg(null);
              }}
              className={`py-2 px-2 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
                mode === 'login' 
                  ? 'bg-white text-[#1E293B] shadow-sm border border-[#E2D5B7]' 
                  : 'text-[#78716C] hover:text-[#1E293B] hover:bg-white/50'
              }`}
            >
              <LogIn className="w-4 h-4 text-blue-600" />
              <span>Masuk Akun</span>
            </button>
            
            <button
              type="button"
              onClick={() => {
                sound.playPop();
                setMode('register');
                setError(null);
                setInfoMsg(null);
              }}
              className={`py-2 px-2 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
                mode === 'register' 
                  ? 'bg-white text-[#1E293B] shadow-sm border border-[#E2D5B7]' 
                  : 'text-[#78716C] hover:text-[#1E293B] hover:bg-white/50'
              }`}
            >
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>Daftar Baru</span>
            </button>
          </div>
        )}

        {/* Info Message */}
        {infoMsg && (
          <div className="p-3 rounded-2xl bg-[#F0FDF4] border border-[#BBF7D0] text-[#166534] text-xs font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{infoMsg}</span>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="p-3 rounded-2xl bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B] text-xs font-medium flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-[#DC2626] shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* ======================================================== */}
        {/* MODE 1: LOGIN */}
        {/* ======================================================== */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-3.5">
            {/* Google Sign In Button */}
            <button
              type="button"
              onClick={() => triggerGoogleLogin()}
              disabled={loading}
              className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 border-2 border-[#CBD5E1] hover:border-slate-400 rounded-xl text-xs sm:text-sm font-bold text-slate-700 transition-all shadow-xs flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span>{loading ? 'Menghubungkan...' : 'Masuk dengan Akun Google'}</span>
            </button>

            <div className="relative flex items-center justify-center">
              <div className="border-t border-[#CBD5E1] w-full"></div>
              <span className="bg-[#FFFDF8] px-3 text-[11px] font-bold text-slate-400 uppercase">
                Atau dengan Kata Sandi
              </span>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#334155]">
                Username atau Email Warga
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={e => setIdentifier(e.target.value)}
                  placeholder="Username terdaftar atau alamat email"
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
                    const targetEmail = identifier.includes('@') ? identifier.trim() : '';
                    if (targetEmail) {
                      setVerificationEmail(targetEmail);
                    }
                    setMode('verify_email');
                    setError(null);
                  }}
                  className="text-[11px] font-bold text-amber-700 hover:text-amber-800 hover:underline cursor-pointer"
                >
                  Belum verifikasi email? Masukkan OTP 🔑
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
                <span>Ingat identitas saya di perangkat ini</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#1E293B] hover:bg-[#334155] text-white font-bold rounded-xl text-xs sm:text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <span>Memverifikasi Akun Warga...</span>
              ) : (
                <>
                  <LogIn className="w-4 h-4 text-amber-400" />
                  <span>Masuk ke Akun Warga</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* ======================================================== */}
        {/* MODE 2: REGISTER (With Photo, Origin & Email Verification) */}
        {/* ======================================================== */}
        {mode === 'register' && (
          <form onSubmit={handleRegister} className="space-y-3 max-h-[72vh] overflow-y-auto pr-1">
            {/* Google Quick Register Button */}
            <button
              type="button"
              onClick={() => triggerGoogleLogin()}
              disabled={loading}
              className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 border-2 border-[#CBD5E1] hover:border-slate-400 rounded-xl text-xs sm:text-sm font-bold text-slate-700 transition-all shadow-xs flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span>{loading ? 'Menghubungkan...' : 'Daftar Cepat dengan Akun Google'}</span>
            </button>

            <div className="relative flex items-center justify-center">
              <div className="border-t border-[#CBD5E1] w-full"></div>
              <span className="bg-[#FFFDF8] px-3 text-[11px] font-bold text-slate-400 uppercase">
                Atau Isi Formulir Warga
              </span>
            </div>

            {/* Photo Upload Box */}
            <div className="p-3 bg-[#F8F4EA] border border-[#E7DFCC] rounded-2xl space-y-2">
              <label className="block text-xs font-bold text-[#334155]">
                Upload Foto Profil Warga (Opsional)
              </label>

              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl overflow-hidden bg-white border border-[#CBD5E1] shrink-0 flex items-center justify-center relative shadow-xs">
                  {photoUrl ? (
                    <img src={photoUrl} alt="Preview Warga" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-7 h-7 text-slate-400" />
                  )}
                  {photoUrl && (
                    <button
                      type="button"
                      onClick={() => setPhotoUrl('')}
                      className="absolute -top-1 -right-1 p-0.5 bg-red-600 text-white rounded-full hover:bg-red-700 cursor-pointer"
                      title="Hapus foto"
                    >
                      <Trash2 className="w-2.5 h-2.5" />
                    </button>
                  )}
                </div>

                <div className="flex-1 space-y-1">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="citizen-auth-photo-upload"
                  />
                  <label
                    htmlFor="citizen-auth-photo-upload"
                    className="flex items-center justify-center gap-2 px-3 py-1.5 bg-white border border-dashed border-[#CBD5E1] hover:border-amber-500 rounded-xl text-xs font-bold text-[#475569] hover:text-[#1E293B] cursor-pointer transition-colors shadow-2xs"
                  >
                    <Upload className="w-3.5 h-3.5 text-amber-600" />
                    <span>{photoUrl ? 'Ganti Foto Diri' : 'Pilih Foto dari Perangkat'}</span>
                  </label>
                  <p className="text-[10px] text-[#78716C]">
                    Format gambar PNG, JPG, WebP (maksimal 4MB).
                  </p>
                </div>
              </div>
            </div>

            {/* Nama & Username */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-[#334155]">
                  Nama Lengkap / Alias <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    placeholder="Contoh: Rahmat Hidayat"
                    className="w-full pl-8 pr-2.5 py-2 bg-white border border-[#CBD5E1] focus:border-amber-500 rounded-xl text-xs text-slate-900 outline-hidden shadow-2xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-[#334155]">
                  Username Unik <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="text-xs font-bold text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 font-mono">@</span>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    placeholder="rahmat_h"
                    className="w-full pl-7 pr-2.5 py-2 bg-white border border-[#CBD5E1] focus:border-amber-500 rounded-xl text-xs text-slate-900 outline-hidden shadow-2xs font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Email (Required for Verification) */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-[#334155]">
                Alamat Email Aktif <span className="text-red-500">*</span>
                <span className="text-[10px] font-normal text-amber-700 ml-1.5">(wajib untuk verifikasi OTP)</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="email.aktif@gmail.com"
                  className="w-full pl-8 pr-2.5 py-2 bg-white border border-[#CBD5E1] focus:border-amber-500 rounded-xl text-xs text-slate-900 outline-hidden shadow-2xs"
                />
              </div>
            </div>

            {/* Asal Daerah (Provinsi & Kota) */}
            <div className="p-2.5 bg-[#FEFCE8] border border-[#FEF08A] rounded-xl space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#854D0E]">
                <MapPin className="w-3.5 h-3.5 text-amber-600" />
                <span>Asal Daerah Warga (Provinsi &amp; Kota/Kabupaten)</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <select
                    value={originProvince}
                    onChange={e => {
                      const newProv = e.target.value;
                      setOriginProvince(newProv);
                      const cities = getCitiesByProvince(newProv);
                      setOriginCity(cities.length > 0 ? cities[0] : '');
                    }}
                    className="w-full px-2 py-1.5 bg-white border border-[#CBD5E1] focus:border-amber-500 rounded-xl text-xs text-slate-900 outline-hidden shadow-2xs cursor-pointer font-medium"
                  >
                    <option value="">-- Pilih Provinsi Asal --</option>
                    {PROVINCES_LIST.map(p => (
                      <option key={p.id} value={p.name}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <select
                    value={originCity}
                    onChange={e => setOriginCity(e.target.value)}
                    disabled={!originProvince}
                    className="w-full px-2 py-1.5 bg-white border border-[#CBD5E1] focus:border-amber-500 rounded-xl text-xs text-slate-900 outline-hidden shadow-2xs cursor-pointer font-medium disabled:bg-slate-100 disabled:cursor-not-allowed"
                  >
                    {!originProvince ? (
                      <option value="">-- Pilih Provinsi Dahulu --</option>
                    ) : getCitiesByProvince(originProvince).length === 0 ? (
                      <option value="">-- Tidak ada data kota --</option>
                    ) : (
                      <>
                        <option value="">-- Pilih Kota / Kab. --</option>
                        {getCitiesByProvince(originProvince).map(c => (
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

            {/* Kata Sandi */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-[#334155]">
                Kata Sandi Akun <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  className="w-full pl-8 pr-10 py-2 bg-white border border-[#CBD5E1] focus:border-amber-500 rounded-xl text-xs text-slate-900 outline-hidden shadow-2xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs sm:text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <span>Mendaftarkan &amp; Mengirim OTP...</span>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Daftar Akun &amp; Kirim Kode Verifikasi</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* ======================================================== */}
        {/* MODE 3: EMAIL VERIFICATION (6-Digit OTP) */}
        {/* ======================================================== */}
        {mode === 'verify_email' && (
          <form onSubmit={handleVerifyEmail} className="space-y-4">
            <div className="p-3.5 bg-[#F0FDF4] border border-[#BBF7D0] rounded-2xl text-center space-y-1.5">
              <KeyRound className="w-8 h-8 text-emerald-600 mx-auto" />
              <h4 className="font-bold text-xs sm:text-sm text-emerald-900">
                Masukkan 6-Digit Kode Verifikasi Email
              </h4>
              <p className="text-xs text-emerald-800">
                Kode verifikasi telah dikirimkan ke: <br />
                <strong className="font-mono text-emerald-950">{verificationEmail}</strong>
              </p>
            </div>

            {/* Debug OTP Auto-fill Helper for Dev/Preview */}
            {debugOtp && (
              <div className="p-2.5 bg-amber-50 border border-dashed border-amber-300 rounded-xl flex items-center justify-between text-xs text-amber-900">
                <div className="flex items-center gap-1.5">
                  <span className="px-1.5 py-0.5 bg-amber-200 text-amber-900 font-mono font-bold rounded">
                    DEV OTP
                  </span>
                  <span className="font-mono font-bold">{debugOtp}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setOtpCode(debugOtp);
                    sound.playPop();
                  }}
                  className="px-2 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[10px] font-bold cursor-pointer transition-colors"
                >
                  Gunakan Kode Ini
                </button>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#334155] text-center">
                Kode Verifikasi (OTP)
              </label>
              <input
                type="text"
                required
                maxLength={6}
                value={otpCode}
                onChange={e => setOtpCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                placeholder="123456"
                className="w-full py-3 px-4 text-center tracking-[0.5em] font-mono font-bold text-xl sm:text-2xl bg-white border-2 border-emerald-500 focus:ring-4 focus:ring-emerald-400/20 rounded-2xl text-slate-900 outline-hidden transition-all shadow-sm"
              />
            </div>

            <button
              type="submit"
              disabled={loading || otpCode.length !== 6}
              className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs sm:text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <span>Memverifikasi Kode...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Verifikasi &amp; Masuk ke LKI</span>
                </>
              )}
            </button>

            {/* Resend OTP */}
            <div className="flex items-center justify-between pt-2 border-t border-[#EAE1CD] text-xs">
              <button
                type="button"
                onClick={() => {
                  sound.playPop();
                  setMode('login');
                }}
                className="text-[#64748B] hover:text-[#1E293B] cursor-pointer"
              >
                ← Kembali ke Masuk
              </button>

              <button
                type="button"
                disabled={resendCooldown > 0 || loading}
                onClick={handleResendCode}
                className="flex items-center gap-1 font-bold text-emerald-700 hover:text-emerald-800 disabled:text-slate-400 cursor-pointer disabled:cursor-not-allowed"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>
                  {resendCooldown > 0 ? `Kirim Ulang (${resendCooldown}s)` : 'Kirim Ulang Kode'}
                </span>
              </button>
            </div>
          </form>
        )}

        {/* ======================================================== */}
        {/* MODE 4: GOOGLE AUTH POPUP / DIALOG */}
        {/* ======================================================== */}
        {mode === 'google_prompt' && (
          <form onSubmit={handleGoogleSubmit} className="space-y-3.5">
            <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-2xl flex items-start gap-3">
              <div className="p-2 bg-white rounded-xl shadow-2xs shrink-0">
                <svg className="w-6 h-6" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
              </div>
              <div className="text-xs text-blue-900 leading-relaxed">
                <strong>Otentikasi Akun Google:</strong> Masuk langsung dengan identitas Google Anda. Email otomatis terverifikasi tanpa perlu memasukkan kode OTP.
              </div>
            </div>

            <button
              type="button"
              onClick={() => triggerGoogleLogin()}
              disabled={loading}
              className="w-full py-2.5 px-4 bg-white hover:bg-blue-50 border-2 border-blue-400 rounded-xl text-xs sm:text-sm font-bold text-blue-700 transition-all shadow-xs flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span>{loading ? 'Menghubungkan...' : 'Buka Jendela Popup Google'}</span>
            </button>

            <div className="relative flex items-center justify-center my-2">
              <div className="border-t border-[#CBD5E1] w-full"></div>
              <span className="bg-[#FFFDF8] px-3 text-[10px] font-bold text-slate-400 uppercase">
                Atau Masukkan Manual (Dev Test)
              </span>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-[#334155]">
                Akun Google (Email)
              </label>
              <input
                type="email"
                required
                value={googleEmail}
                onChange={e => setGoogleEmail(e.target.value)}
                placeholder="nama.anda@gmail.com"
                className="w-full px-3 py-2 bg-white border border-[#CBD5E1] focus:border-blue-500 rounded-xl text-xs text-slate-900 outline-hidden shadow-2xs"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-[#334155]">
                Nama Akun Google
              </label>
              <input
                type="text"
                required
                value={googleName}
                onChange={e => setGoogleName(e.target.value)}
                placeholder="Budi Sudarsono"
                className="w-full px-3 py-2 bg-white border border-[#CBD5E1] focus:border-blue-500 rounded-xl text-xs text-slate-900 outline-hidden shadow-2xs"
              />
            </div>

            {/* Asal Daerah for Google User */}
            <div className="p-2.5 bg-[#FEFCE8] border border-[#FEF08A] rounded-xl space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#854D0E]">
                <MapPin className="w-3.5 h-3.5 text-amber-600" />
                <span>Asal Daerah Domisili</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <select
                  value={googleOriginProv}
                  onChange={e => {
                    const newProv = e.target.value;
                    setGoogleOriginProv(newProv);
                    const cities = getCitiesByProvince(newProv);
                    setGoogleOriginCity(cities.length > 0 ? cities[0] : '');
                  }}
                  className="w-full px-2 py-1.5 bg-white border border-[#CBD5E1] rounded-xl text-xs font-medium cursor-pointer"
                >
                  <option value="">-- Pilih Provinsi --</option>
                  {PROVINCES_LIST.map(p => (
                    <option key={p.id} value={p.name}>
                      {p.name}
                    </option>
                  ))}
                </select>

                <select
                  value={googleOriginCity}
                  onChange={e => setGoogleOriginCity(e.target.value)}
                  disabled={!googleOriginProv}
                  className="w-full px-2.5 py-1.5 bg-white border border-[#CBD5E1] rounded-xl text-xs font-medium cursor-pointer disabled:bg-slate-100 disabled:cursor-not-allowed"
                >
                  {!googleOriginProv ? (
                    <option value="">-- Pilih Provinsi Dahulu --</option>
                  ) : getCitiesByProvince(googleOriginProv).length === 0 ? (
                    <option value="">-- Tidak ada data kota --</option>
                  ) : (
                    <>
                      <option value="">-- Pilih Kota / Kab. --</option>
                      {getCitiesByProvince(googleOriginProv).map(c => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </>
                  )}
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#1E293B] hover:bg-[#334155] text-white font-bold rounded-xl text-xs sm:text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <span>Menghubungkan Akun Google...</span>
              ) : (
                <>
                  <span>Lanjutkan Masuk dengan Google</span>
                  <ArrowRight className="w-4 h-4 text-amber-400" />
                </>
              )}
            </button>

            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => {
                  sound.playPop();
                  setMode('login');
                }}
                className="text-xs text-[#64748B] hover:underline cursor-pointer"
              >
                Batal dan kembali ke formulir biasa
              </button>
            </div>
          </form>
        )}


        {/* Footer Note */}
        <div className="pt-2 border-t border-[#EAE1CD] text-center text-[11px] text-[#78716C] flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Keamanan terenkripsi &amp; suara warga dijamin UU KIP &amp; UU PDP.</span>
        </div>

      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
};
