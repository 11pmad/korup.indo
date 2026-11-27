export type AdminSubtab =
  | 'dashboard'
  | 'ai'
  | 'cases'
  | 'officials'
  | 'reports'
  | 'comments'
  | 'monitoring'
  | 'audit'
  | 'manual'
  | 'announcement'
  | 'donation'
  | 'users';

export const ADMIN_TAB_TO_PATH: Record<AdminSubtab, string> = {
  dashboard: '/admin',
  cases: '/admin/kasus',
  officials: '/admin/pejabat',
  manual: '/admin/input-manual',
  ai: '/admin/kurasi-ai',
  reports: '/admin/laporan',
  comments: '/admin/komentar',
  users: '/admin/pengguna',
  monitoring: '/admin/monitoring',
  audit: '/admin/audit',
  announcement: '/admin/pemberitahuan',
  donation: '/admin/donasi',
};

export const ADMIN_CANONICAL_SLUGS: string[] = [
  'dashboard',
  'kasus',
  'pejabat',
  'input-manual',
  'kurasi-ai',
  'laporan',
  'komentar',
  'pengguna',
  'monitoring',
  'audit',
  'pemberitahuan',
  'donasi',
];

export const ADMIN_TAB_TITLES: Record<AdminSubtab, string> = {
  dashboard: 'Dashboard Ringkasan',
  cases: 'Kelola Berkas Perkara',
  officials: 'Kelola Pejabat Publik',
  manual: 'Formulir Input Manual',
  ai: 'Kurasi AI Assistant',
  reports: 'Moderasi Laporan Warga',
  comments: 'Moderasi Komentar Warga',
  users: 'Manajemen Pengguna',
  monitoring: 'Monitoring & Trafik Log',
  audit: 'Log Audit & Rollback',
  announcement: 'Teks Pemberitahuan',
  donation: 'Donasi & QRIS Admin',
};

const SLUG_TO_TAB: Record<string, AdminSubtab> = {
  dashboard: 'dashboard',
  kasus: 'cases',
  cases: 'cases',
  pejabat: 'officials',
  officials: 'officials',
  'input-manual': 'manual',
  manual: 'manual',
  'kurasi-ai': 'ai',
  ai: 'ai',
  laporan: 'reports',
  reports: 'reports',
  komentar: 'comments',
  comments: 'comments',
  pengguna: 'users',
  users: 'users',
  monitoring: 'monitoring',
  audit: 'audit',
  pemberitahuan: 'announcement',
  announcement: 'announcement',
  donasi: 'donation',
  donation: 'donation',
};

export function adminTabToPath(tab: AdminSubtab): string {
  return ADMIN_TAB_TO_PATH[tab] || '/admin';
}

export function adminSlugToTab(slug?: string | null): AdminSubtab | null {
  if (!slug) return null;
  return SLUG_TO_TAB[slug.trim().toLowerCase()] ?? null;
}

export function pathnameToAdminTab(pathname?: string | null): AdminSubtab | null {
  if (!pathname) return null;
  const normalized = pathname.replace(/\/+$/, '') || '/';
  if (normalized === '/admin') return 'dashboard';
  if (!normalized.startsWith('/admin/')) return null;

  const rest = normalized.slice('/admin/'.length);
  if (!rest || rest.includes('/')) return null;
  return adminSlugToTab(rest);
}
