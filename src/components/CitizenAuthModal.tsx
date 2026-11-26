'use client';

import React, { useState, useEffect } from 'react';
import { X, LogIn, UserPlus, LogOut, ShieldCheck } from 'lucide-react';
import { CANONICAL_PROVINCES } from '@/lib/provinces';

export interface CitizenUserClient {
  id: string;
  username: string;
  displayName: string;
  email: string;
  avatarSeed: string;
}

export function CitizenAuthModal({
  isOpen,
  onClose,
  onAuthChange,
}: {
  isOpen: boolean;
  onClose: () => void;
  onAuthChange: (user: CitizenUserClient | null) => void;
}) {
  const [mode, setMode] = useState<'login' | 'register' | 'otp'>('login');
  const [identifier, setIdentifier] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [originProvince, setOriginProvince] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/v1/auth/citizen/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data?.error?.details?.needsVerification && data?.error?.details?.email) {
          setEmail(data.error.details.email);
          setMode('otp');
          setNotice('Email belum diverifikasi. Silakan masukkan kode OTP.');
        } else {
          setError(data?.error?.message || 'Gagal masuk.');
        }
        return;
      }
      onAuthChange(data.data.user);
      onClose();
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/v1/auth/citizen/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, displayName, email, password, originProvince }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error?.message || 'Gagal mendaftar.');
        return;
      }
      setNotice(data.data.message);
      setMode('otp');
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/v1/auth/citizen/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: otpCode }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error?.message || 'Verifikasi OTP gagal.');
        return;
      }
      onAuthChange(data.data.user);
      onClose();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="citizen-auth-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/60 p-4 backdrop-blur-xs"
    >
      <div className="w-full max-w-md archival-card p-6 space-y-4 relative">
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup dialog akun warga"
          className="absolute right-4 top-4 rounded-lg p-1 text-stone-500 hover:bg-stone-100"
        >
          <X className="w-5 h-5" />
        </button>

        <div>
          <h2 id="citizen-auth-title" className="font-hand text-2xl font-bold text-stone-900">
            {mode === 'login' ? 'Masuk Akun Warga' : mode === 'register' ? 'Daftar Akun Warga' : 'Verifikasi Email OTP'}
          </h2>
          <p className="text-xs text-stone-600 mt-0.5">
            Berpartisipasi memberi reaksi dan berdiskusi secara beradab pada berkas perkara.
          </p>
        </div>

        <div className="flex gap-2 border-b border-stone-200 pb-2">
          <button
            type="button"
            onClick={() => { setMode('login'); setError(''); }}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold ${
              mode === 'login' ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-700'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" /> Masuk
          </button>
          <button
            type="button"
            onClick={() => { setMode('register'); setError(''); }}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold ${
              mode === 'register' ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-700'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" /> Daftar Baru
          </button>
        </div>

        {error && (
          <div role="alert" className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-xs font-medium text-red-800">
            {error}
          </div>
        )}
        {notice && (
          <div className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-800">
            {notice}
          </div>
        )}

        {mode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-3">
            <div>
              <label htmlFor="cit-id" className="block text-xs font-semibold text-stone-700 mb-1">
                Username atau Email
              </label>
              <input
                id="cit-id"
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm focus:border-stone-900 focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="cit-pass" className="block text-xs font-semibold text-stone-700 mb-1">
                Kata Sandi
              </label>
              <input
                id="cit-pass"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm focus:border-stone-900 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-stone-900 py-2.5 text-sm font-bold text-white hover:bg-stone-800 disabled:opacity-50"
            >
              {loading ? 'Memproses...' : 'Masuk'}
            </button>
          </form>
        )}

        {mode === 'register' && (
          <form onSubmit={handleRegister} className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label htmlFor="reg-user" className="block text-xs font-semibold text-stone-700 mb-1">Username</label>
                <input
                  id="reg-user"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label htmlFor="reg-name" className="block text-xs font-semibold text-stone-700 mb-1">Nama Tampilan</label>
                <input
                  id="reg-name"
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div>
              <label htmlFor="reg-email" className="block text-xs font-semibold text-stone-700 mb-1">Email</label>
              <input
                id="reg-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label htmlFor="reg-prov" className="block text-xs font-semibold text-stone-700 mb-1">Provinsi Domisili (Opsional)</label>
              <select
                id="reg-prov"
                value={originProvince}
                onChange={(e) => setOriginProvince(e.target.value)}
                className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm"
              >
                <option value="">-- Pilih Provinsi --</option>
                {CANONICAL_PROVINCES.filter((p) => p.id !== 'nasional').map((p) => (
                  <option key={p.id} value={p.name}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="reg-pass" className="block text-xs font-semibold text-stone-700 mb-1">Kata Sandi (min. 8 karakter)</label>
              <input
                id="reg-pass"
                type="password"
                minLength={8}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-red-700 py-2.5 text-sm font-bold text-white hover:bg-red-800 disabled:opacity-50"
            >
              {loading ? 'Mendaftar...' : 'Daftar & Kirim OTP'}
            </button>
          </form>
        )}

        {mode === 'otp' && (
          <form onSubmit={handleVerifyOtp} className="space-y-3">
            <p className="text-xs text-stone-600">
              Masukkan 6 digit kode OTP yang dikirim ke <span className="font-semibold text-stone-900">{email}</span>.
            </p>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              required
              placeholder="123456"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value)}
              className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-center font-mono text-lg tracking-widest"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-emerald-700 py-2.5 text-sm font-bold text-white hover:bg-emerald-800 disabled:opacity-50 inline-flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              {loading ? 'Memverifikasi...' : 'Verifikasi Akun'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export function CitizenStatusButton({
  user,
  onOpenAuth,
  onLogout,
}: {
  user: CitizenUserClient | null;
  onOpenAuth: () => void;
  onLogout: () => void;
}) {
  if (!user) {
    return (
      <button
        type="button"
        onClick={onOpenAuth}
        className="inline-flex items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs font-semibold text-stone-800 hover:bg-stone-100"
      >
        <LogIn className="w-3.5 h-3.5" /> Masuk Warga
      </button>
    );
  }

  return (
    <div className="inline-flex items-center gap-2 rounded-lg border border-stone-300 bg-white px-2.5 py-1 text-xs">
      <span className="font-semibold text-stone-900">{user.displayName}</span>
      <button
        type="button"
        onClick={onLogout}
        aria-label="Keluar akun warga"
        className="text-stone-500 hover:text-red-700"
      >
        <LogOut className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
