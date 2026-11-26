'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Map,
  Trophy,
  BarChart3,
  Search,
  Flag,
  Database,
  Shield,
  Menu,
  X,
  Home,
} from 'lucide-react';
import { CitizenAuthModal, CitizenStatusButton, CitizenUserClient } from './CitizenAuthModal';

const NAV_ITEMS = [
  { href: '/', label: 'Beranda', icon: Home },
  { href: '/peta', label: 'Peta 38 Provinsi', icon: Map },
  { href: '/klasemen', label: 'Klasemen', icon: Trophy },
  { href: '/statistik', label: 'Statistik', icon: BarChart3 },
  { href: '/cari', label: 'Cari Berkas', icon: Search },
  { href: '/open-data', label: 'Open Data', icon: Database },
];

export function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [user, setUser] = useState<CitizenUserClient | null>(null);

  useEffect(() => {
    fetch('/api/v1/auth/citizen/me')
      .then((r) => r.json())
      .then((d) => {
        if (d?.data?.user) setUser(d.data.user);
      })
      .catch(() => {});
  }, []);

  async function handleLogout() {
    await fetch('/api/v1/auth/citizen/logout', { method: 'POST' });
    setUser(null);
  }

  return (
    <header className="sticky top-0 z-40 border-b-2 border-[#D6CBB5] bg-[#FAF7EE]/95 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-red-700 text-white font-hand text-xl font-bold shadow-xs">
              LKI
            </span>
            <div className="leading-tight">
              <span className="block font-hand text-xl font-bold text-stone-900">
                Liga Korupsi Indonesia
              </span>
              <span className="block text-[11px] font-medium text-stone-600">
                Arsip Transparansi Perkara 1945–2026
              </span>
            </div>
          </Link>

          <nav aria-label="Navigasi Utama" className="hidden lg:flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    active
                      ? 'bg-stone-900 text-white'
                      : 'text-stone-700 hover:bg-stone-200/70'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" aria-hidden="true" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="hidden lg:flex items-center gap-2">
            <Link
              href="/lapor"
              className="inline-flex items-center gap-1.5 rounded-lg bg-red-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-800 transition"
            >
              <Flag className="w-3.5 h-3.5" aria-hidden="true" />
              Lapor / Hak Jawab
            </Link>
            <CitizenStatusButton
              user={user}
              onOpenAuth={() => setAuthOpen(true)}
              onLogout={handleLogout}
            />
            <Link
              href="/admin"
              title="Portal Kurasi Admin"
              aria-label="Portal Kurasi Admin"
              className="inline-flex items-center justify-center rounded-lg border border-stone-300 bg-white p-1.5 text-stone-700 hover:bg-stone-100"
            >
              <Shield className="w-4 h-4" />
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label="Buka menu navigasi"
            className="lg:hidden rounded-lg border border-stone-300 bg-white p-2 text-stone-800"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {mobileOpen && (
          <nav aria-label="Menu Mobile" className="lg:hidden border-t border-stone-200 py-3 space-y-1.5">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold ${
                    active ? 'bg-stone-900 text-white' : 'text-stone-800 hover:bg-stone-200/70'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
            <div className="pt-2 flex flex-wrap items-center gap-2">
              <Link
                href="/lapor"
                onClick={() => setMobileOpen(false)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-red-700 px-3 py-2 text-xs font-bold text-white"
              >
                <Flag className="w-3.5 h-3.5" /> Lapor / Hak Jawab
              </Link>
              <CitizenStatusButton
                user={user}
                onOpenAuth={() => setAuthOpen(true)}
                onLogout={handleLogout}
              />
              <Link
                href="/admin"
                onClick={() => setMobileOpen(false)}
                className="inline-flex items-center gap-1 rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs font-semibold text-stone-800"
              >
                <Shield className="w-3.5 h-3.5" /> Admin
              </Link>
            </div>
          </nav>
        )}
      </div>

      <CitizenAuthModal
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
        onAuthChange={(u) => setUser(u)}
      />
    </header>
  );
}
