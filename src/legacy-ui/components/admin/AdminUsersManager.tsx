"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  UserPlus, 
  Shield, 
  ShieldCheck, 
  ShieldAlert, 
  Key, 
  Pencil, 
  Trash2, 
  Search, 
  CheckCircle, 
  CheckCircle2,
  X, 
  Loader2, 
  AlertCircle, 
  Lock, 
  Mail, 
  User, 
  Clock, 
  Sparkles,
  HelpCircle,
  Eye,
  EyeOff,
  MapPin,
  CreditCard,
  UserCheck,
  RefreshCw,
  BadgeCheck,
  Globe,
  SlidersHorizontal,
  FileCheck,
  Crown,
  PenLine,
  MessageSquare
} from 'lucide-react';
import { sound } from '../../utils/audio';
import { PROVINCES_LIST, getCitiesByProvince } from '../../constants/provinces';
import { RoleIcon } from '../ThemeIcons';

export interface AdminUserItem {
  id: string;
  username: string;
  full_name: string | null;
  email: string | null;
  role: 'super_admin' | 'admin' | 'editor' | 'moderator' | 'auditor' | 'reviewer';
  is_active: number;
  last_login: string | null;
  created_at: string;
}

export interface CitizenUserItem {
  id: string;
  username: string;
  display_name: string;
  email: string | null;
  photo_url: string | null;
  origin_province: string | null;
  origin_city: string | null;
  bio: string | null;
  avatar_seed?: string;
  is_email_verified: number;
  auth_provider: string;
  role: string;
  created_at: string;
}

interface AdminUsersManagerProps {
  authToken: string;
  currentUserId?: string;
  currentUserRole?: string;
}

export const ROLE_CONFIG: Record<string, { label: string; color: string; badgeBg: string; icon: string; description: string }> = {
  super_admin: {
    label: 'Super Admin',
    color: 'text-purple-700 border-purple-300 bg-purple-50',
    badgeBg: 'bg-purple-100 text-purple-800 border border-purple-300',
    icon: 'super_admin',
    description: 'Kendali penuh: kelola semua akun, konfigurasi donasi & sistem, rollback log, dan hapus berkas permanen.'
  },
  admin: {
    label: 'Admin Operasional',
    color: 'text-blue-700 border-blue-300 bg-blue-50',
    badgeBg: 'bg-blue-100 text-blue-800 border border-blue-300',
    icon: 'admin',
    description: 'Kelola penuh berkas kasus, data pejabat, moderasi laporan & komentar, serta pantau trafik monitoring.'
  },
  editor: {
    label: 'Editor Berkas',
    color: 'text-amber-700 border-amber-300 bg-amber-50',
    badgeBg: 'bg-amber-100 text-amber-800 border border-amber-300',
    icon: 'editor',
    description: 'Kurasi berkas kasus hukum, input formulir manual, dan integrasi kurasi AI Gemini. Tidak bisa hapus berkas permanen.'
  },
  moderator: {
    label: 'Moderator Warga',
    color: 'text-emerald-700 border-emerald-300 bg-emerald-50',
    badgeBg: 'bg-emerald-100 text-emerald-800 border border-emerald-300',
    icon: 'moderator',
    description: 'Fokus moderasi suara publik: kelola & sembunyikan komentar melanggar, tinjau usulan warga, dan pantau reaksi.'
  },
  auditor: {
    label: 'Auditor Independen',
    color: 'text-slate-700 border-slate-300 bg-slate-50',
    badgeBg: 'bg-slate-100 text-slate-800 border border-slate-300',
    icon: 'auditor',
    description: 'Akses Read-Only: verifikasi log audit trail, pantau integritas berkas perkara, dan unduh laporan berkala.'
  },
  reviewer: {
    label: 'Auditor Independen',
    color: 'text-slate-700 border-slate-300 bg-slate-50',
    badgeBg: 'bg-slate-100 text-slate-800 border border-slate-300',
    icon: 'auditor',
    description: 'Akses Read-Only: verifikasi log audit trail, pantau integritas berkas perkara, dan unduh laporan berkala.'
  }
};

export const AdminUsersManager: React.FC<AdminUsersManagerProps> = ({
  authToken,
  currentUserId,
  currentUserRole = 'super_admin'
}) => {
  // Sub-Tab Switcher: 'staff' (Tim Staf & Verifikator) atau 'citizens' (Warga Publik Terdaftar)
  const [activeTabType, setActiveTabType] = useState<'staff' | 'citizens'>('staff');

  // ===================== STAFF STATE =====================
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Staff Modals
  const [createModalOpen, setCreateModalOpen] = useState<boolean>(false);
  const [editModalUser, setEditModalUser] = useState<AdminUserItem | null>(null);
  const [resetModalUser, setResetModalUser] = useState<AdminUserItem | null>(null);

  // Form states - Create Staff
  const [formFullName, setFormFullName] = useState<string>('');
  const [formUsername, setFormUsername] = useState<string>('');
  const [formEmail, setFormEmail] = useState<string>('');
  const [formPassword, setFormPassword] = useState<string>('');
  const [formRole, setFormRole] = useState<'super_admin' | 'admin' | 'editor' | 'moderator' | 'auditor'>('editor');
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // Form states - Reset Staff Password
  const [newPassword, setNewPassword] = useState<string>('');
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);

  // Form states - Edit Staff
  const [editFullName, setEditFullName] = useState<string>('');
  const [editEmail, setEditEmail] = useState<string>('');
  const [editRole, setEditRole] = useState<'super_admin' | 'admin' | 'editor' | 'moderator' | 'auditor'>('editor');

  // ===================== CITIZENS STATE =====================
  const [citizens, setCitizens] = useState<CitizenUserItem[]>([]);
  const [citizensLoading, setCitizensLoading] = useState<boolean>(false);
  const [citizenSearchQuery, setCitizenSearchQuery] = useState<string>('');
  const [citizenFilterVerified, setCitizenFilterVerified] = useState<string>('all');
  const [citizenFilterProvider, setCitizenFilterProvider] = useState<string>('all');

  // Citizen Modals
  const [editCitizenModalItem, setEditCitizenModalItem] = useState<CitizenUserItem | null>(null);
  const [editCitizenName, setEditCitizenName] = useState<string>('');
  const [editCitizenEmail, setEditCitizenEmail] = useState<string>('');
  const [editCitizenProvince, setEditCitizenProvince] = useState<string>('');
  const [editCitizenCity, setEditCitizenCity] = useState<string>('');
  const [editCitizenBio, setEditCitizenBio] = useState<string>('');
  const [editCitizenVerified, setEditCitizenVerified] = useState<number>(0);

  const [resetCitizenPasswordItem, setResetCitizenPasswordItem] = useState<CitizenUserItem | null>(null);
  const [citizenNewPassword, setCitizenNewPassword] = useState<string>('');
  const [showCitizenNewPassword, setShowCitizenNewPassword] = useState<boolean>(false);

  // General States
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const isSuperAdmin = currentUserRole === 'super_admin';
  const canManageCitizens = isSuperAdmin || currentUserRole === 'admin';

  // Fetch Staff
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users', {
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : {}
      });
      const data = await res.json();
      if (res.ok && data?.data) {
        setUsers(data.data);
      } else {
        throw new Error(data.error || 'Gagal memuat pengguna staf');
      }
    } catch (err: any) {
      console.error('Error fetching admin users:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Citizens
  const fetchCitizens = async () => {
    setCitizensLoading(true);
    try {
      const res = await fetch('/api/admin/users/citizens', {
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : {}
      });
      const data = await res.json();
      if (res.ok && data?.data) {
        setCitizens(data.data);
      } else {
        throw new Error(data.error || 'Gagal memuat akun warga');
      }
    } catch (err: any) {
      console.error('Error fetching citizens:', err);
    } finally {
      setCitizensLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchCitizens();
  }, [authToken]);

  const showFeedback = (type: 'success' | 'error', text: string) => {
    setFeedbackMsg({ type, text });
    if (type === 'success') {
      sound.playSuccess();
    } else {
      sound.playError();
    }
    setTimeout(() => {
      setFeedbackMsg(null);
    }, 5000);
  };

  // ===================== COMPUTED STAFF =====================
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = 
        (user.full_name && user.full_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (user.email && user.email.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesRole = filterRole === 'all' || user.role === filterRole;
      const matchesStatus = filterStatus === 'all' || 
        (filterStatus === 'active' && user.is_active === 1) || 
        (filterStatus === 'suspended' && user.is_active === 0);

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchQuery, filterRole, filterStatus]);

  const stats = useMemo(() => {
    const total = users.length;
    const active = users.filter(u => u.is_active === 1).length;
    const superAdminCount = users.filter(u => u.role === 'super_admin').length;
    const adminCount = users.filter(u => u.role === 'admin').length;
    const editorCount = users.filter(u => u.role === 'editor').length;
    const moderatorCount = users.filter(u => u.role === 'moderator').length;
    const auditorCount = users.filter(u => u.role === 'auditor' || u.role === 'reviewer').length;

    return { total, active, superAdminCount, adminCount, editorCount, moderatorCount, auditorCount };
  }, [users]);

  // ===================== COMPUTED CITIZENS =====================
  const filteredCitizens = useMemo(() => {
    return citizens.filter(c => {
      const q = citizenSearchQuery.toLowerCase();
      const matchesSearch = 
        (c.display_name && c.display_name.toLowerCase().includes(q)) ||
        c.username.toLowerCase().includes(q) ||
        (c.email && c.email.toLowerCase().includes(q)) ||
        (c.origin_province && c.origin_province.toLowerCase().includes(q)) ||
        (c.origin_city && c.origin_city.toLowerCase().includes(q));

      const matchesVerified = 
        citizenFilterVerified === 'all' || 
        (citizenFilterVerified === 'verified' && c.is_email_verified === 1) ||
        (citizenFilterVerified === 'unverified' && c.is_email_verified === 0);

      const matchesProvider = 
        citizenFilterProvider === 'all' || 
        (citizenFilterProvider === 'google' && c.auth_provider === 'google') ||
        (citizenFilterProvider === 'local' && c.auth_provider !== 'google');

      return matchesSearch && matchesVerified && matchesProvider;
    });
  }, [citizens, citizenSearchQuery, citizenFilterVerified, citizenFilterProvider]);

  const citizenStats = useMemo(() => {
    const total = citizens.length;
    const verified = citizens.filter(c => c.is_email_verified === 1).length;
    const unverified = total - verified;
    const googleCount = citizens.filter(c => c.auth_provider === 'google').length;
    const localCount = citizens.filter(c => c.auth_provider !== 'google').length;

    return { total, verified, unverified, googleCount, localCount };
  }, [citizens]);

  // ===================== STAFF ACTIONS =====================
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formUsername || !formPassword || !formFullName) {
      showFeedback('error', 'Nama lengkap, username, dan kata sandi wajib diisi.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({
          username: formUsername,
          password: formPassword,
          full_name: formFullName,
          email: formEmail,
          role: formRole
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal membuat pengguna');
      }

      showFeedback('success', data.message || 'Pengguna staf berhasil dibuat!');
      setCreateModalOpen(false);
      setFormFullName('');
      setFormUsername('');
      setFormEmail('');
      setFormPassword('');
      setFormRole('editor');
      fetchUsers();
    } catch (err: any) {
      showFeedback('error', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModalUser) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/users/${editModalUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({
          full_name: editFullName,
          email: editEmail,
          role: editRole
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal memperbarui pengguna');
      }

      showFeedback('success', data.message);
      setEditModalUser(null);
      fetchUsers();
    } catch (err: any) {
      showFeedback('error', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetModalUser || !newPassword) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/users/${resetModalUser.id}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({
          new_password: newPassword
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal mengatur ulang kata sandi');
      }

      showFeedback('success', data.message);
      setResetModalUser(null);
      setNewPassword('');
    } catch (err: any) {
      showFeedback('error', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (user: AdminUserItem) => {
    const newStatus = user.is_active === 1 ? 0 : 1;
    const actionLabel = newStatus === 1 ? 'mengaktifkan' : 'menangguhkan (suspend)';
    if (!confirm(`Apakah Anda yakin ingin ${actionLabel} akun pengguna "${user.full_name || user.username}"?`)) {
      return;
    }

    sound.playPop();
    try {
      const res = await fetch(`/api/admin/users/${user.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({ is_active: newStatus })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal mengubah status');
      }

      showFeedback('success', data.message);
      fetchUsers();
    } catch (err: any) {
      showFeedback('error', err.message);
    }
  };

  const handleDeleteUser = async (user: AdminUserItem) => {
    if (!confirm(`PERINGATAN: Tindakan ini permanen!\n\nHapus akun pengguna "${user.full_name || user.username}" (${user.role}) dari pangkalan data LKI?`)) {
      return;
    }

    sound.playPop();
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal menghapus pengguna');
      }

      showFeedback('success', data.message);
      fetchUsers();
    } catch (err: any) {
      showFeedback('error', err.message);
    }
  };

  // ===================== CITIZEN ACTIONS =====================
  const handleToggleCitizenVerify = async (citizen: CitizenUserItem) => {
    if (!canManageCitizens) return;
    const newStatus = citizen.is_email_verified === 1 ? 0 : 1;
    const label = newStatus === 1 ? 'Memverifikasi secara manual' : 'Mencabut verifikasi';

    if (!confirm(`Apakah Anda ingin ${label} akun warga "${citizen.display_name}" (@${citizen.username})?`)) {
      return;
    }

    sound.playPop();
    try {
      const res = await fetch(`/api/admin/users/citizens/${citizen.id}/verify`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({ is_email_verified: newStatus })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal mengubah status verifikasi warga');
      }

      showFeedback('success', data.message);
      fetchCitizens();
    } catch (err: any) {
      showFeedback('error', err.message);
    }
  };

  const openEditCitizenModal = (c: CitizenUserItem) => {
    setEditCitizenModalItem(c);
    setEditCitizenName(c.display_name || '');
    setEditCitizenEmail(c.email || '');
    setEditCitizenProvince(c.origin_province || '');
    setEditCitizenCity(c.origin_city || '');
    setEditCitizenBio(c.bio || '');
    setEditCitizenVerified(c.is_email_verified);
    sound.playPop();
  };

  const handleEditCitizenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editCitizenModalItem) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/users/citizens/${editCitizenModalItem.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({
          display_name: editCitizenName.trim(),
          email: editCitizenEmail.trim() || undefined,
          origin_province: editCitizenProvince || undefined,
          origin_city: editCitizenCity.trim() || undefined,
          bio: editCitizenBio.trim() || undefined,
          is_email_verified: editCitizenVerified
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal memperbarui data akun warga');
      }

      showFeedback('success', data.message);
      setEditCitizenModalItem(null);
      fetchCitizens();
    } catch (err: any) {
      showFeedback('error', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const openResetCitizenPassword = (c: CitizenUserItem) => {
    setResetCitizenPasswordItem(c);
    setCitizenNewPassword('');
    sound.playPop();
  };

  const handleResetCitizenPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetCitizenPasswordItem || !citizenNewPassword) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/users/citizens/${resetCitizenPasswordItem.id}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({
          new_password: citizenNewPassword
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal mereset kata sandi warga');
      }

      showFeedback('success', data.message);
      setResetCitizenPasswordItem(null);
      setCitizenNewPassword('');
    } catch (err: any) {
      showFeedback('error', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCitizen = async (citizen: CitizenUserItem) => {
    if (!canManageCitizens) return;
    if (!confirm(`PERINGATAN: Tindakan ini permanen!\n\nHapus akun warga "${citizen.display_name}" (@${citizen.username})?\nSeluruh komentar dan reaksi kasus milik warga ini akan ikut dihapus secara otomatis.`)) {
      return;
    }

    sound.playPop();
    try {
      const res = await fetch(`/api/admin/users/citizens/${citizen.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal menghapus akun warga');
      }

      showFeedback('success', data.message);
      fetchCitizens();
    } catch (err: any) {
      showFeedback('error', err.message);
    }
  };

  const generateRandomPassword = () => {
    const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%';
    let res = '';
    for (let i = 0; i < 10; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCitizenNewPassword(res);
    sound.playPop();
  };

  return (
    <div className="space-y-6">
      
      {/* Toast Feedback */}
      {feedbackMsg && (
        <div className={`p-4 rounded-2xl flex items-center justify-between shadow-lg border animate-in slide-in-from-top duration-200 ${
          feedbackMsg.type === 'success' 
            ? 'bg-emerald-50 border-emerald-300 text-emerald-900' 
            : 'bg-rose-50 border-rose-300 text-rose-900'
        }`}>
          <div className="flex items-center gap-2.5 text-xs sm:text-sm font-semibold">
            {feedbackMsg.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span>{feedbackMsg.text}</span>
          </div>
          <button 
            type="button" 
            onClick={() => setFeedbackMsg(null)}
            className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header & Main Sub-tab Switcher */}
      <div className="bg-[#FFFDF9] border-2 border-[#E7DECB] rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 bg-purple-100 border border-purple-200 text-purple-700 rounded-2xl">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h2 className="font-marker text-xl sm:text-2xl text-[#1E293B]">
                  Manajemen Pengguna &amp; Akun
                </h2>
                <p className="text-xs text-[#78716C]">
                  Pusat kendali akun staf internal (RBAC) dan pangkalan data akun warga publik terdaftar.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {activeTabType === 'staff' && isSuperAdmin && (
              <button
                type="button"
                onClick={() => {
                  sound.playPop();
                  setCreateModalOpen(true);
                }}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#7C3AED] hover:bg-[#6D28D9] text-white rounded-2xl text-xs sm:text-sm font-bold shadow-sm transition-all cursor-pointer border border-[#6D28D9] shrink-0"
              >
                <UserPlus className="w-4 h-4" />
                <span>Tambah Pengguna Staf</span>
              </button>
            )}

            {activeTabType === 'citizens' && (
              <button
                type="button"
                onClick={() => {
                  sound.playPop();
                  fetchCitizens();
                }}
                disabled={citizensLoading}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#1E293B] hover:bg-[#334155] text-white rounded-2xl text-xs sm:text-sm font-bold shadow-sm transition-all cursor-pointer shrink-0 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${citizensLoading ? 'animate-spin' : ''}`} />
                <span>Segarkan Data Warga</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab Navigation Switcher: Staf vs Warga */}
        <div className="flex items-center gap-2 pt-2 border-t border-[#EAE1CD]">
          <button
            type="button"
            onClick={() => {
              sound.playPop();
              setActiveTabType('staff');
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTabType === 'staff'
                ? 'bg-[#1E293B] text-white shadow-md'
                : 'bg-[#F3EDE0] text-[#57534E] hover:bg-[#E5DAC0]'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-purple-400" />
            <span>Tim Staf &amp; Verifikator</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
              activeTabType === 'staff' ? 'bg-purple-600 text-white' : 'bg-slate-200 text-slate-700'
            }`}>
              {users.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              sound.playPop();
              setActiveTabType('citizens');
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTabType === 'citizens'
                ? 'bg-[#1E293B] text-white shadow-md'
                : 'bg-[#F3EDE0] text-[#57534E] hover:bg-[#E5DAC0]'
            }`}
          >
            <UserCheck className="w-4 h-4 text-emerald-400" />
            <span>Akun Warga Terdaftar (Publik)</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
              activeTabType === 'citizens' ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
            }`}>
              {citizens.length}
            </span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* KONTEN TAB 1: TIM STAF & VERIFIKATOR                                     */}
      {/* ========================================================================= */}
      {activeTabType === 'staff' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* Summary Role Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-[#FAF5E8] border border-[#E7DECB] rounded-2xl p-3.5 text-center">
              <span className="text-[10px] text-gray-500 font-bold block uppercase">Total Tim</span>
              <span className="font-marker text-2xl text-[#1E293B]">{stats.total}</span>
              <span className="text-[10px] text-emerald-700 font-medium block mt-0.5">{stats.active} Aktif</span>
            </div>

            <div className="bg-purple-50/70 border border-purple-200 rounded-2xl p-3.5 text-center">
              <span className="text-[10px] text-purple-700 font-bold uppercase flex items-center justify-center gap-1">
                <Crown className="w-3.5 h-3.5 shrink-0" />
                <span>Super Admin</span>
              </span>
              <span className="font-marker text-2xl text-purple-900">{stats.superAdminCount}</span>
              <span className="text-[10px] text-purple-600 font-medium block mt-0.5">Otoritas Penuh</span>
            </div>

            <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-3.5 text-center">
              <span className="text-[10px] text-blue-700 font-bold uppercase flex items-center justify-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                <span>Admin</span>
              </span>
              <span className="font-marker text-2xl text-blue-900">{stats.adminCount}</span>
              <span className="text-[10px] text-blue-600 font-medium block mt-0.5">Operasional</span>
            </div>

            <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-3.5 text-center">
              <span className="text-[10px] text-amber-700 font-bold uppercase flex items-center justify-center gap-1">
                <PenLine className="w-3.5 h-3.5 shrink-0" />
                <span>Editor</span>
              </span>
              <span className="font-marker text-2xl text-amber-900">{stats.editorCount}</span>
              <span className="text-[10px] text-amber-600 font-medium block mt-0.5">Kurator Berkas</span>
            </div>

            <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-3.5 text-center">
              <span className="text-[10px] text-emerald-700 font-bold uppercase flex items-center justify-center gap-1">
                <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                <span>Moderator</span>
              </span>
              <span className="font-marker text-2xl text-emerald-900">{stats.moderatorCount}</span>
              <span className="text-[10px] text-emerald-600 font-medium block mt-0.5">Suara Warga</span>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-center">
              <span className="text-[10px] text-slate-700 font-bold uppercase flex items-center justify-center gap-1">
                <Search className="w-3.5 h-3.5 shrink-0" />
                <span>Auditor</span>
              </span>
              <span className="font-marker text-2xl text-slate-900">{stats.auditorCount}</span>
              <span className="text-[10px] text-slate-500 font-medium block mt-0.5">Read-Only</span>
            </div>
          </div>

          {/* Filter Bar Staf */}
          <div className="bg-[#FFFDF9] border border-[#E7DECB] rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-3 shadow-2xs">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Cari nama staf, username, email..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-purple-500 outline-none"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
              <select
                value={filterRole}
                onChange={e => setFilterRole(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 outline-none cursor-pointer"
              >
                <option value="all">Semua Peran (RBAC)</option>
                <option value="super_admin">Super Admin</option>
                <option value="admin">Admin Operasional</option>
                <option value="editor">Editor Berkas</option>
                <option value="moderator">Moderator Warga</option>
                <option value="auditor">Auditor Independen</option>
              </select>

              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 outline-none cursor-pointer"
              >
                <option value="all">Semua Status</option>
                <option value="active">Aktif</option>
                <option value="suspended">Ditangguhkan</option>
              </select>
            </div>
          </div>

          {/* Tabel Pengguna Staf */}
          <div className="bg-white border-2 border-[#E7DECB] rounded-3xl overflow-hidden shadow-sm">
            {loading ? (
              <div className="p-12 text-center text-slate-400 flex flex-col items-center gap-2">
                <Loader2 className="w-7 h-7 animate-spin text-purple-600" />
                <span className="text-xs font-semibold">Memuat daftar staf verifikator...</span>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="p-12 text-center text-slate-400 space-y-2">
                <Users className="w-10 h-10 mx-auto text-slate-300" />
                <p className="text-xs font-medium">Tidak ada pengguna staf yang sesuai dengan filter.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#FAF5E8] border-b border-[#E7DECB] text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                      <th className="py-3.5 px-4">Pengguna Staf</th>
                      <th className="py-3.5 px-4">Wewenang / Peran (RBAC)</th>
                      <th className="py-3.5 px-4">Status Akun</th>
                      <th className="py-3.5 px-4">Terakhir Masuk</th>
                      <th className="py-3.5 px-4">Terdaftar</th>
                      <th className="py-3.5 px-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredUsers.map(user => {
                      const roleMeta = ROLE_CONFIG[user.role] || ROLE_CONFIG.editor;
                      const isSelf = user.id === currentUserId;

                      return (
                        <tr key={user.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-purple-100 border border-purple-200 text-purple-800 flex items-center justify-center font-bold text-xs shrink-0">
                                {(user.full_name || user.username).slice(0, 2).toUpperCase()}
                              </div>
                              <div className="space-y-0.5">
                                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                  <span>{user.full_name || user.username}</span>
                                  {isSelf && (
                                    <span className="px-1.5 py-0.2 rounded text-[9px] bg-amber-100 text-amber-800 font-bold">
                                      Anda
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
                                  <span>@{user.username}</span>
                                  {user.email && (
                                    <>
                                      <span>•</span>
                                      <span className="text-slate-400 font-sans">{user.email}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${roleMeta.badgeBg}`}>
                              <RoleIcon role={roleMeta.icon} className="w-3.5 h-3.5" />
                              <span>{roleMeta.label}</span>
                            </span>
                          </td>

                          <td className="py-3.5 px-4">
                            {user.is_active === 1 ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                <span>Aktif</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                                <span>Ditangguhkan</span>
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-slate-500 text-[11px] font-mono">
                            {user.last_login 
                              ? new Date(user.last_login).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })
                              : 'Belum pernah'}
                          </td>

                          <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                            {new Date(user.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            {isSuperAdmin && (
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleToggleStatus(user)}
                                  disabled={isSelf}
                                  className={`p-1.5 rounded-lg border transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
                                    user.is_active === 1 
                                      ? 'text-amber-700 bg-amber-50 hover:bg-amber-100 border-amber-200' 
                                      : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-200'
                                  }`}
                                  title={user.is_active === 1 ? 'Tangguhkan akun staf' : 'Aktifkan akun staf'}
                                >
                                  {user.is_active === 1 ? <ShieldAlert className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditModalUser(user);
                                    setEditFullName(user.full_name || '');
                                    setEditEmail(user.email || '');
                                    setEditRole(user.role === 'reviewer' ? 'auditor' : user.role);
                                    sound.playPop();
                                  }}
                                  className="p-1.5 rounded-lg text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors cursor-pointer"
                                  title="Edit profil & peran"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setResetModalUser(user);
                                    setNewPassword('');
                                    sound.playPop();
                                  }}
                                  className="p-1.5 rounded-lg text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-colors cursor-pointer"
                                  title="Reset kata sandi"
                                >
                                  <Key className="w-3.5 h-3.5" />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleDeleteUser(user)}
                                  disabled={isSelf}
                                  className="p-1.5 rounded-lg text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                                  title="Hapus akun staf"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* KONTEN TAB 2: AKUN WARGA TERDAFTAR (PUBLIK)                              */}
      {/* ========================================================================= */}
      {activeTabType === 'citizens' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* Summary Cards Warga */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <div className="bg-[#FAF5E8] border border-[#E7DECB] rounded-2xl p-3.5 text-center">
              <span className="text-[10px] text-gray-500 font-bold block uppercase">Total Warga</span>
              <span className="font-marker text-2xl text-[#1E293B]">{citizenStats.total}</span>
              <span className="text-[10px] text-slate-500 font-medium block mt-0.5">Partisipan Publik</span>
            </div>

            <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-3.5 text-center">
              <span className="text-[10px] text-emerald-700 font-bold uppercase flex items-center justify-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                <span>Terverifikasi</span>
              </span>
              <span className="font-marker text-2xl text-emerald-900">{citizenStats.verified}</span>
              <span className="text-[10px] text-emerald-600 font-medium block mt-0.5">Kedaulatan Sah</span>
            </div>

            <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-3.5 text-center">
              <span className="text-[10px] text-amber-700 font-bold uppercase flex items-center justify-center gap-1">
                <Clock className="w-3.5 h-3.5 shrink-0" />
                <span>Belum Verifikasi</span>
              </span>
              <span className="font-marker text-2xl text-amber-900">{citizenStats.unverified}</span>
              <span className="text-[10px] text-amber-600 font-medium block mt-0.5">Menunggu OTP</span>
            </div>

            <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-3.5 text-center">
              <span className="text-[10px] text-blue-700 font-bold uppercase flex items-center justify-center gap-1">
                <Globe className="w-3.5 h-3.5 shrink-0" />
                <span>Akun Google</span>
              </span>
              <span className="font-marker text-2xl text-blue-900">{citizenStats.googleCount}</span>
              <span className="text-[10px] text-blue-600 font-medium block mt-0.5">Google OAuth</span>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-center">
              <span className="text-[10px] text-slate-700 font-bold uppercase flex items-center justify-center gap-1">
                <Mail className="w-3.5 h-3.5 shrink-0" />
                <span>Akun Email</span>
              </span>
              <span className="font-marker text-2xl text-slate-900">{citizenStats.localCount}</span>
              <span className="text-[10px] text-slate-500 font-medium block mt-0.5">Registrasi Lokal</span>
            </div>
          </div>

          {/* Filter Bar Warga */}
          <div className="bg-[#FFFDF9] border border-[#E7DECB] rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-3 shadow-2xs">
            <div className="relative w-full md:w-96">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={citizenSearchQuery}
                onChange={e => setCitizenSearchQuery(e.target.value)}
                placeholder="Cari nama warga, @username, email, provinsi, kota..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
              <select
                value={citizenFilterVerified}
                onChange={e => setCitizenFilterVerified(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 outline-none cursor-pointer"
              >
                <option value="all">Semua Status Verifikasi</option>
                <option value="verified">Terverifikasi (Aktif)</option>
                <option value="unverified">Belum Verifikasi</option>
              </select>

              <select
                value={citizenFilterProvider}
                onChange={e => setCitizenFilterProvider(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 outline-none cursor-pointer"
              >
                <option value="all">Semua Metode Masuk</option>
                <option value="google">Akun Google</option>
                <option value="local">Akun Email Lokal</option>
              </select>
            </div>
          </div>

          {/* Tabel Pengguna Warga */}
          <div className="bg-white border-2 border-[#E7DECB] rounded-3xl overflow-hidden shadow-sm">
            {citizensLoading ? (
              <div className="p-12 text-center text-slate-400 flex flex-col items-center gap-2">
                <Loader2 className="w-7 h-7 animate-spin text-emerald-600" />
                <span className="text-xs font-semibold">Memuat daftar akun warga publik...</span>
              </div>
            ) : filteredCitizens.length === 0 ? (
              <div className="p-12 text-center text-slate-400 space-y-2">
                <UserCheck className="w-10 h-10 mx-auto text-slate-300" />
                <p className="text-xs font-medium">Tidak ada akun warga yang cocok dengan kriteria pencarian.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#FAF5E8] border-b border-[#E7DECB] text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                      <th className="py-3.5 px-4">Warga LKI</th>
                      <th className="py-3.5 px-4">Email &amp; Provider</th>
                      <th className="py-3.5 px-4">Domisili KTP</th>
                      <th className="py-3.5 px-4">Status e-KTP / Email</th>
                      <th className="py-3.5 px-4">Bergabung</th>
                      <th className="py-3.5 px-4 text-right">Aksi Manajemen</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredCitizens.map(citizen => {
                      const isGoogle = citizen.auth_provider === 'google';
                      const isVerified = citizen.is_email_verified === 1;

                      return (
                        <tr key={citizen.id} className="hover:bg-slate-50/80 transition-colors">
                          
                          {/* Nama & Foto Warga */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-11 rounded-lg overflow-hidden bg-[#b91c1c] border border-slate-300 shadow-2xs flex items-center justify-center shrink-0">
                                {citizen.photo_url ? (
                                  <img 
                                    src={citizen.photo_url} 
                                    alt={citizen.display_name} 
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <User className="w-5 h-5 text-white" />
                                )}
                              </div>
                              <div className="space-y-0.5">
                                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                  <span>{citizen.display_name}</span>
                                </div>
                                <div className="text-[11px] text-slate-500 font-mono">
                                  @{citizen.username}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Email & Provider */}
                          <td className="py-3.5 px-4">
                            <div className="space-y-1">
                              <div className="font-medium text-slate-800 flex items-center gap-1">
                                <Mail className="w-3 h-3 text-slate-400" />
                                <span>{citizen.email || 'Email belum diatur'}</span>
                              </div>
                              <div>
                                {isGoogle ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-md text-[10px] font-bold">
                                    <Globe className="w-2.5 h-2.5" />
                                    <span>Google OAuth</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 rounded-md text-[10px] font-bold">
                                    <Mail className="w-2.5 h-2.5" />
                                    <span>Email Lokal</span>
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Asal Daerah Domisili */}
                          <td className="py-3.5 px-4">
                            {citizen.origin_province ? (
                              <div className="space-y-0.5">
                                <div className="font-bold text-slate-800 flex items-center gap-1 text-[11px]">
                                  <MapPin className="w-3 h-3 text-amber-600 shrink-0" />
                                  <span>{citizen.origin_city || 'Semua Kota'}</span>
                                </div>
                                <div className="text-[10px] text-slate-500 pl-4">
                                  {citizen.origin_province}
                                </div>
                              </div>
                            ) : (
                              <span className="text-[11px] text-slate-400 italic">Belum diatur</span>
                            )}
                          </td>

                          {/* Status Verifikasi Email / e-KTP */}
                          <td className="py-3.5 px-4">
                            {isVerified ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>Terverifikasi (Aktif)</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 shadow-2xs">
                                <AlertCircle className="w-3 h-3 text-amber-600" />
                                <span>Belum Verifikasi</span>
                              </span>
                            )}
                          </td>

                          {/* Tanggal Bergabung */}
                          <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                            {new Date(citizen.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </td>

                          {/* Tombol Aksi Warga */}
                          <td className="py-3.5 px-4 text-right">
                            {canManageCitizens ? (
                              <div className="flex items-center justify-end gap-1.5">
                                
                                {/* Tombol Toggle Verifikasi Cepat */}
                                <button
                                  type="button"
                                  onClick={() => handleToggleCitizenVerify(citizen)}
                                  className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                                    isVerified 
                                      ? 'text-amber-700 bg-amber-50 hover:bg-amber-100 border-amber-200' 
                                      : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-200'
                                  }`}
                                  title={isVerified ? 'Cabut verifikasi warga' : 'Verifikasi email secara instan'}
                                >
                                  {isVerified ? <ShieldAlert className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                                </button>

                                {/* Edit Profil Warga */}
                                <button
                                  type="button"
                                  onClick={() => openEditCitizenModal(citizen)}
                                  className="p-1.5 rounded-lg text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors cursor-pointer"
                                  title="Edit data & wilayah domisili warga"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>

                                {/* Reset Password Warga */}
                                {!isGoogle && (
                                  <button
                                    type="button"
                                    onClick={() => openResetCitizenPassword(citizen)}
                                    className="p-1.5 rounded-lg text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-colors cursor-pointer"
                                    title="Reset kata sandi warga"
                                  >
                                    <Key className="w-3.5 h-3.5" />
                                  </button>
                                )}

                                {/* Hapus Akun Warga */}
                                <button
                                  type="button"
                                  onClick={() => handleDeleteCitizen(citizen)}
                                  className="p-1.5 rounded-lg text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer"
                                  title="Hapus akun warga permanen"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>

                              </div>
                            ) : (
                              <span className="text-[11px] text-slate-400 italic">Lihat Saja</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: Tambah Pengguna Staf                                              */}
      {/* ========================================================================= */}
      {createModalOpen && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#FFFDF9] border-3 border-[#E2D5B7] rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#E7DECB]">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-purple-600" />
                <h3 className="font-marker text-lg text-slate-900">
                  Tambah Pengguna Staf Baru
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Lengkap <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Misal: Ahmad Zaki, S.H."
                  value={formFullName}
                  onChange={e => setFormFullName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Username Akun <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Misal: zaki_kurator"
                  value={formUsername}
                  onChange={e => setFormUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.-]/g, ''))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:bg-white focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Email Staf (Opsional)
                </label>
                <input
                  type="email"
                  placeholder="zaki@ligakorupsi.id"
                  value={formEmail}
                  onChange={e => setFormEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Kata Sandi <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    placeholder="Minimal 6 karakter"
                    value={formPassword}
                    onChange={e => setFormPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-purple-500 outline-none pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tingkat Peran &amp; Wewenang (RBAC) <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formRole}
                  onChange={e => setFormRole(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-purple-500 outline-none cursor-pointer"
                >
                  <option value="editor">Editor Berkas (Kurasi &amp; Validasi Data Kasus)</option>
                  <option value="moderator">Moderator Warga (Moderasi Laporan &amp; Suara Publik)</option>
                  <option value="admin">Admin Operasional (Akses Penuh Perkara, Pejabat, Trafik)</option>
                  <option value="super_admin">Super Admin (Otoritas Sistem Tertinggi)</option>
                  <option value="auditor">Auditor Independen (Read-Only Log Trail)</option>
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  {ROLE_CONFIG[formRole]?.description}
                </p>
              </div>

              <div className="pt-3 border-t border-[#E7DECB] flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Simpan Pengguna</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: Edit Data Staf                                                    */}
      {/* ========================================================================= */}
      {editModalUser && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#FFFDF9] border-3 border-[#E2D5B7] rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#E7DECB]">
              <div className="flex items-center gap-2">
                <Pencil className="w-5 h-5 text-blue-600" />
                <h3 className="font-marker text-lg text-slate-900">
                  Ubah Profil &amp; Peran Staf
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditModalUser(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditUser} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  disabled
                  value={editModalUser.username}
                  className="w-full px-3.5 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-mono text-slate-500 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Lengkap <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editFullName}
                  onChange={e => setEditFullName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={e => setEditEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Peran Wewenang (RBAC) <span className="text-rose-500">*</span>
                </label>
                <select
                  value={editRole}
                  onChange={e => setEditRole(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
                >
                  <option value="editor">Editor Berkas (Kurasi &amp; Validasi Data Kasus)</option>
                  <option value="moderator">Moderator Warga (Moderasi Laporan &amp; Suara Publik)</option>
                  <option value="admin">Admin Operasional (Akses Penuh Perkara, Pejabat, Trafik)</option>
                  <option value="super_admin">Super Admin (Otoritas Sistem Tertinggi)</option>
                  <option value="auditor">Auditor Independen (Read-Only Log Trail)</option>
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  {ROLE_CONFIG[editRole]?.description}
                </p>
              </div>

              <div className="pt-3 border-t border-[#E7DECB] flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditModalUser(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Simpan Perubahan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: Reset Kata Sandi Staf                                             */}
      {/* ========================================================================= */}
      {resetModalUser && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#FFFDF9] border-3 border-[#E2D5B7] rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#E7DECB]">
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5 text-amber-600" />
                <h3 className="font-marker text-lg text-slate-900">
                  Reset Kata Sandi Staf
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setResetModalUser(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-4">
              <p className="text-xs text-slate-600">
                Atur ulang kata sandi untuk pengguna <strong>{resetModalUser.full_name || resetModalUser.username}</strong> (@{resetModalUser.username}).
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Kata Sandi Baru <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    placeholder="Minimal 6 karakter"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-amber-500 outline-none pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-3 border-t border-[#E7DECB] flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setResetModalUser(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Simpan Sandi Baru</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: Edit Data Warga Publik                                            */}
      {/* ========================================================================= */}
      {editCitizenModalItem && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#FFFDF9] border-3 border-[#E2D5B7] rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#E7DECB]">
              <div className="flex items-center gap-2">
                <Pencil className="w-5 h-5 text-emerald-600" />
                <h3 className="font-marker text-lg text-slate-900">
                  Ubah Data Profil Akun Warga
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditCitizenModalItem(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditCitizenSubmit} className="space-y-3.5">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-500 block text-[10px]">Username Warga</span>
                  <span className="font-mono font-bold text-slate-800">@{editCitizenModalItem.username}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 block text-[10px]">Metode Masuk</span>
                  <span className="font-bold text-slate-800 capitalize">{editCitizenModalItem.auth_provider}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Lengkap / Nama Tampilan KTP <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editCitizenName}
                  onChange={e => setEditCitizenName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Alamat Email Warga
                </label>
                <input
                  type="email"
                  value={editCitizenEmail}
                  onChange={e => setEditCitizenEmail(e.target.value)}
                  placeholder="warga@email.com"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              {/* Asal Daerah Dinamis (Provinsi -> Kota) */}
              <div className="p-3 bg-[#FEFCE8] border border-[#FEF08A] rounded-xl space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#854D0E]">
                  <MapPin className="w-3.5 h-3.5 text-amber-600" />
                  <span>Asal Domisili Warga (Dropdown Terhubung)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-[#713F12] mb-0.5">
                      Provinsi
                    </label>
                    <select
                      value={editCitizenProvince}
                      onChange={e => {
                        const newProv = e.target.value;
                        setEditCitizenProvince(newProv);
                        const cities = getCitiesByProvince(newProv);
                        setEditCitizenCity(cities.length > 0 ? cities[0] : '');
                      }}
                      className="w-full px-2.5 py-2 bg-white border border-[#CBD5E1] rounded-xl text-xs font-medium cursor-pointer"
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
                    <label className="block text-[10px] font-bold text-[#713F12] mb-0.5">
                      Kota / Kabupaten
                    </label>
                    <select
                      value={editCitizenCity}
                      onChange={e => setEditCitizenCity(e.target.value)}
                      disabled={!editCitizenProvince}
                      className="w-full px-2.5 py-2 bg-white border border-[#CBD5E1] rounded-xl text-xs font-medium cursor-pointer disabled:bg-slate-100 disabled:cursor-not-allowed"
                    >
                      {!editCitizenProvince ? (
                        <option value="">-- Pilih Provinsi Dahulu --</option>
                      ) : getCitiesByProvince(editCitizenProvince).length === 0 ? (
                        <option value="">-- Tidak ada kota --</option>
                      ) : (
                        <>
                          <option value="">-- Pilih Kota / Kab. --</option>
                          {getCitiesByProvince(editCitizenProvince).map(c => (
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

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Slogan / Catatan Warga (Alamat KTP)
                </label>
                <textarea
                  rows={2}
                  maxLength={250}
                  value={editCitizenBio}
                  onChange={e => setEditCitizenBio(e.target.value)}
                  placeholder="Catatan atau slogan aspirasi..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Status Verifikasi Email Warga
                </label>
                <select
                  value={editCitizenVerified}
                  onChange={e => setEditCitizenVerified(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none cursor-pointer"
                >
                  <option value={1}>Terverifikasi (Dapat berinteraksi penuh)</option>
                  <option value={0}>Belum Diverifikasi (Menunggu verifikasi email OTP)</option>
                </select>
              </div>

              <div className="pt-3 border-t border-[#E7DECB] flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditCitizenModalItem(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Simpan Data Warga</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: Reset Kata Sandi Warga                                            */}
      {/* ========================================================================= */}
      {resetCitizenPasswordItem && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#FFFDF9] border-3 border-[#E2D5B7] rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#E7DECB]">
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5 text-amber-600" />
                <h3 className="font-marker text-lg text-slate-900">
                  Reset Sandi Warga
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setResetCitizenPasswordItem(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleResetCitizenPasswordSubmit} className="space-y-4">
              <p className="text-xs text-slate-600">
                Atur ulang kata sandi untuk akun warga <strong>{resetCitizenPasswordItem.display_name}</strong> (@{resetCitizenPasswordItem.username}).
              </p>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">
                    Kata Sandi Baru <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={generateRandomPassword}
                    className="text-[11px] font-bold text-amber-700 hover:text-amber-900 cursor-pointer flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Acak Sandi</span>
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showCitizenNewPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    placeholder="Minimal 6 karakter"
                    value={citizenNewPassword}
                    onChange={e => setCitizenNewPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-amber-500 outline-none pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCitizenNewPassword(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    {showCitizenNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-3 border-t border-[#E7DECB] flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setResetCitizenPasswordItem(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Simpan Sandi Baru</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
