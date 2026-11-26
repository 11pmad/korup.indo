'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Shield, Lock, ArrowLeft } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/v1/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json?.error?.message || 'Login staf gagal.');
        return;
      }
      router.push('/admin');
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-[#111827] p-7 space-y-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="h-9 w-9 rounded-lg bg-red-600 flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </span>
            <div>
              <h1 className="text-lg font-bold text-white">Portal Kurasi LKI</h1>
              <p className="text-xs text-slate-400">Akses Terbatas Staf & Verifikator</p>
            </div>
          </div>
          <Link href="/" className="text-xs text-slate-400 hover:text-white inline-flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Publik
          </Link>
        </div>

        {error && (
          <div role="alert" className="rounded-lg border border-red-500/50 bg-red-950/60 px-3 py-2 text-xs text-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="adm-user" className="block text-xs font-semibold text-slate-300 mb-1">
              Username Staf
            </label>
            <input
              id="adm-user"
              type="text"
              required
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white focus:border-red-500 focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="adm-pass" className="block text-xs font-semibold text-slate-300 mb-1">
              Kata Sandi
            </label>
            <input
              id="adm-pass"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white focus:border-red-500 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-red-600 py-2.5 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50 inline-flex items-center justify-center gap-2"
          >
            <Lock className="w-4 h-4" />
            {loading ? 'Memverifikasi...' : 'Masuk Portal Admin'}
          </button>
        </form>

        <p className="text-[11px] text-slate-500 text-center">
          Dilindungi sesi HttpOnly Cookie, rate-limiter PostgreSQL, dan pencatatan Audit Log.
        </p>
      </div>
    </div>
  );
}
