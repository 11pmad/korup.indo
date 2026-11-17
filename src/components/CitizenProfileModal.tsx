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
  Download,
  Edit3,
  ArrowLeft,
  CreditCard,
  QrCode,
  Loader2,
  FileCheck
} from 'lucide-react';
import { toPng } from 'html-to-image';
import { sound } from '../utils/audio.js';
import { 
  PROVINCES_LIST, 
  getCitiesByProvince, 
  getProvinceKemendagriCode 
} from '../constants/provinces.js';

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

// Helper untuk menghasilkan NIK 16 digit deterministik yang realistis
function generateDeterministicNik(user: CitizenUser, provinceName?: string | null, cityName?: string | null): string {
  const provCode = getProvinceKemendagriCode(provinceName || user.originProvince);
  
  // Hash city
  const cityStr = (cityName || user.originCity || 'Pusat').trim().toLowerCase();
  let cityHash = 71;
  for (let i = 0; i < cityStr.length; i++) {
    cityHash = (cityHash * 31 + cityStr.charCodeAt(i)) % 89 + 10;
  }
  const cityCode = String(cityHash).padStart(2, '0');

  // Kecamatan default
  const kecCode = '01';

  // Tanggal & tahun (DDMMYY)
  let dateCode = '170898';
  if (user.created_at) {
    const d = new Date(user.created_at);
    if (!isNaN(d.getTime())) {
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = String(d.getFullYear()).slice(-2);
      dateCode = `${day}${month}${year}`;
    }
  }

  // Suffix 4 digit konsisten dari ID / Username
  let suffixNum = 1204;
  const seed = (user.id || '') + (user.username || 'warga');
  for (let i = 0; i < seed.length; i++) {
    suffixNum = (suffixNum * 37 + seed.charCodeAt(i)) % 8999 + 1000;
  }
  const suffix = String(suffixNum).padStart(4, '0');

  return `${provCode}${cityCode}${kecCode}${dateCode}${suffix}`.slice(0, 16);
}

// Format tanggal Indonesia resmi
function formatIndonesianDate(dateInput?: string | Date): string {
  const d = dateInput ? new Date(dateInput) : new Date();
  if (isNaN(d.getTime())) return '17 AGUSTUS 2024';
  const months = [
    'JANUARI', 'FEBRUARI', 'MARET', 'APRIL', 'MEI', 'JUNI',
    'JULI', 'AGUSTUS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DESEMBER'
  ];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

export const CitizenProfileModal: React.FC<CitizenProfileModalProps> = ({
  isOpen,
  onClose,
  user,
  onProfileUpdated
}) => {
  // Modal Mode: 'view' (Tampilan Kartu e-KTP) atau 'edit' (Formulir Pengubahan Data)
  const [modalMode, setModalMode] = useState<'view' | 'edit'>('view');

  // Form Fields
  const [displayName, setDisplayName] = useState(user.displayName || '');
  const [photoUrl, setPhotoUrl] = useState(user.photoUrl || '');
  const [originProvince, setOriginProvince] = useState(user.originProvince || '');
  const [originCity, setOriginCity] = useState(user.originCity || '');
  const [bio, setBio] = useState(user.bio || '');

  // Operation States
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [photoMode, setPhotoMode] = useState<'upload' | 'url'>('upload');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const ktpRef = useRef<HTMLDivElement>(null);

  // Sync state ketika user atau isOpen berubah
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
      setDownloadSuccess(false);
    }
  }, [isOpen, user]);

  // Dynamic Cities list berdasarkan provinsi saat ini di form
  const availableCities = getCitiesByProvince(originProvince);

  // Handler saat provinsi diubah di form edit
  const handleProvinceChange = (newProvince: string) => {
    setOriginProvince(newProvince);
    const cities = getCitiesByProvince(newProvince);
    if (cities.length > 0) {
      // Set kota pertama dari provinsi baru secara default
      setOriginCity(cities[0]);
    } else {
      setOriginCity('');
    }
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

  // Unduh Kartu e-KTP sebagai gambar PNG beresolusi tinggi
  const handleDownloadKtp = async () => {
    if (!ktpRef.current) return;
    try {
      setDownloading(true);
      setError(null);
      sound.playPop();

      // Render KTP element ke canvas PNG resolusi tinggi (pixelRatio 2.5)
      const dataUrl = await toPng(ktpRef.current, {
        cacheBust: true,
        pixelRatio: 2.5,
        backgroundColor: '#7ea9d8'
      });

      const cleanUsername = (user.username || displayName || 'warga').replace(/[^a-zA-Z0-9_-]/g, '_');
      const link = document.createElement('a');
      link.download = `e-KTP-LKI-${cleanUsername}.png`;
      link.href = dataUrl;
      link.click();

      sound.playSuccess();
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3500);
    } catch (err: any) {
      console.error('Error saat unduh kartu KTP:', err);
      sound.playError();
      setError('Gagal mengunduh kartu KTP. Silakan coba kembali.');
    } finally {
      setDownloading(false);
    }
  };

  // Submit Simpan Profil
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

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal memperbarui profil warga.');
      }

      // Update local storage
      localStorage.setItem('lki_citizen_token', data.token);
      localStorage.setItem('lki_citizen_user', JSON.stringify(data.user));
      window.dispatchEvent(new Event('lki_citizen_auth_change'));

      sound.playSuccess();
      setSuccessMsg('Profil warga berhasil diperbarui!');
      if (onProfileUpdated) {
        onProfileUpdated(data.user);
      }

      // Kembali ke tampilan KTP setelah simpan
      setTimeout(() => {
        setModalMode('view');
        setSuccessMsg(null);
      }, 1000);
    } catch (err: any) {
      sound.playError();
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // Nilai aktif untuk render KTP
  const activeProvince = originProvince || user.originProvince || 'DKI JAKARTA';
  const activeCity = originCity || user.originCity || 'JAKARTA PUSAT';
  const activeName = (displayName || user.displayName || user.username || 'WARGA NEGARA INDONESIA').toUpperCase();
  const activeNik = generateDeterministicNik(user, activeProvince, activeCity);
  const activeBirthDate = formatIndonesianDate(user.created_at);

  const modalContent = (
    <div 
      id="citizen-profile-modal"
      className="fixed inset-0 z-9999 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="relative bg-[#FFFDF8] border-3 border-[#E2D5B7] rounded-3xl p-4 sm:p-6 max-w-2xl w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200 my-auto"
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
          className="absolute top-3.5 right-3.5 p-2 rounded-full bg-[#F3EDE0] text-[#57534E] hover:bg-[#E5DAC0] hover:text-[#1F2937] transition-colors cursor-pointer z-10"
          title="Tutup Modal Profil"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Bagian Atas */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-b border-[#EAE1CD] pb-3">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#FEF3C7] border border-[#FDE68A] text-[#92400E] text-[10px] font-bold shadow-2xs">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
              <span>KARTU IDENTITAS RESMI WARGA LKI</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-marker text-[#1E293B] mt-0.5">
              {modalMode === 'view' ? 'Profil Identitas Warga' : 'Ubah Data Profil Warga'}
            </h3>
            <p className="text-[11px] sm:text-xs text-[#64748B]">
              {modalMode === 'view' 
                ? 'Kartu e-KTP kedaulatan warga pengawal transparansi & integritas bangsa.' 
                : 'Perbarui foto diri, asal daerah domisili, dan aspirasi kedaulatan Anda.'}
            </p>
          </div>

          {/* Toggle Tombol View / Edit di header jika sedang di mode view */}
          {modalMode === 'view' && (
            <button
              type="button"
              onClick={() => {
                sound.playPop();
                setModalMode('edit');
              }}
              className="self-start sm:self-center inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer hover:shadow-md"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Profil</span>
            </button>
          )}

          {modalMode === 'edit' && (
            <button
              type="button"
              onClick={() => {
                sound.playPop();
                setModalMode('view');
              }}
              className="self-start sm:self-center inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#F3EDE0] hover:bg-[#E5DAC0] text-[#57534E] rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Lihat Kartu KTP</span>
            </button>
          )}
        </div>

        {/* Notifikasi Error / Sukses */}
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

        {downloadSuccess && (
          <div className="p-3 rounded-2xl bg-[#ECFDF5] border border-[#A7F3D0] text-[#065F46] text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <FileCheck className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>Kartu e-KTP berhasil diunduh ke perangkat Anda dalam format PNG beresolusi tinggi!</span>
          </div>
        )}

        {/* ========================================================= */}
        {/* MODE 1: VIEW (KARTU e-KTP REPUBLIK INDONESIA RESMI)      */}
        {/* ========================================================= */}
        {modalMode === 'view' ? (
          <div className="space-y-4">
            
            {/* Wrapper Kartu KTP dengan Ref untuk Download */}
            <div className="flex justify-center items-center py-1">
              <div 
                ref={ktpRef}
                id="indonesia-ektp-card"
                className="relative w-full max-w-[530px] rounded-2xl overflow-hidden border-2 border-[#5281ad] text-[#0c2340] select-none shadow-xl"
                style={{
                  aspectRatio: '1.586 / 1',
                  background: 'linear-gradient(135deg, #719ecf 0%, #9fc1e6 28%, #bdd9f3 52%, #8fb8e1 78%, #6695c5 100%)',
                  boxShadow: '0 10px 25px -5px rgba(26, 68, 110, 0.4), inset 0 1px 2px rgba(255, 255, 255, 0.6)'
                }}
              >
                {/* Guilloche / Microtext Security Lines Texture Overlay */}
                <div 
                  className="absolute inset-0 pointer-events-none opacity-20"
                  style={{
                    backgroundImage: `repeating-linear-gradient(45deg, #2b6cb0 0px, #2b6cb0 1px, transparent 1px, transparent 5px),
                                      repeating-linear-gradient(-45deg, #1a365d 0px, #1a365d 1px, transparent 1px, transparent 5px)`
                  }}
                />

                {/* Garuda Pancasila / Lambang Samar Watermark di Tengah */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.07]">
                  <svg className="w-56 h-56 text-[#0f2a4a]" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2L9.19 8.63L2 9.24L7.46 13.97L5.82 21L12 17.27L18.18 21L16.54 13.97L22 9.24L14.81 8.63L12 2Z" />
                  </svg>
                </div>

                {/* Konten Dalam KTP */}
                <div className="relative z-10 p-3 sm:p-4.5 flex flex-col justify-between h-full font-sans">
                  
                  {/* Header Resmi KTP */}
                  <div className="text-center leading-tight">
                    <h2 className="text-[11px] sm:text-[13px] font-black uppercase tracking-wider text-[#0e2746] drop-shadow-[0_1px_1px_rgba(255,255,255,0.7)]">
                      PROVINSI {activeProvince.toUpperCase()}
                    </h2>
                    <h3 className="text-[10px] sm:text-[12px] font-extrabold uppercase tracking-wide text-[#0e2746] drop-shadow-[0_1px_1px_rgba(255,255,255,0.7)]">
                      {activeCity.toUpperCase().startsWith('KOTA') || activeCity.toUpperCase().startsWith('KAB') 
                        ? activeCity.toUpperCase() 
                        : `KOTA ${activeCity.toUpperCase()}`}
                    </h3>
                  </div>

                  {/* NIK Bar */}
                  <div className="flex items-center gap-1.5 sm:gap-2 mt-1 text-[#0b203a]">
                    <span className="font-bold text-[10px] sm:text-xs tracking-normal">NIK</span>
                    <span className="font-bold text-[10px] sm:text-xs">:</span>
                    <span className="font-mono font-black text-xs sm:text-base tracking-[0.15em] sm:tracking-[0.2em] text-[#051a33] drop-shadow-[0_1px_0_rgba(255,255,255,0.8)]">
                      {activeNik}
                    </span>
                  </div>

                  {/* Isi Data Kiri & Pasfoto Kanan */}
                  <div className="grid grid-cols-12 gap-1.5 sm:gap-2 items-start text-[8px] sm:text-[10px] leading-[1.25] font-semibold text-[#0c2442] mt-0.5">
                    
                    {/* Kolom Kiri: Tabel Biodata Warga */}
                    <div className="col-span-8 space-y-[2px] sm:space-y-[3px]">
                      
                      {/* Nama */}
                      <div className="grid grid-cols-12 items-baseline">
                        <span className="col-span-4 uppercase">Nama</span>
                        <span className="col-span-1 text-center">:</span>
                        <span className="col-span-7 font-black tracking-wide truncate">{activeName}</span>
                      </div>

                      {/* Tempat / Tgl Lahir */}
                      <div className="grid grid-cols-12 items-baseline">
                        <span className="col-span-4 uppercase">Tempat/Tgl Lahir</span>
                        <span className="col-span-1 text-center">:</span>
                        <span className="col-span-7 truncate font-medium">
                          {activeCity.replace(/^(Kota|Kabupaten|Kab\.)\s*/i, '')}, {activeBirthDate}
                        </span>
                      </div>

                      {/* Jenis Kelamin & Gol Darah */}
                      <div className="grid grid-cols-12 items-baseline">
                        <span className="col-span-4 uppercase">Jenis Kelamin</span>
                        <span className="col-span-1 text-center">:</span>
                        <div className="col-span-7 flex items-center justify-between pr-1">
                          <span className="font-medium">WARGA NEGARA</span>
                          <span className="text-[7px] sm:text-[9px] font-bold">Gol. Darah: O</span>
                        </div>
                      </div>

                      {/* Alamat */}
                      <div className="grid grid-cols-12 items-baseline">
                        <span className="col-span-4 uppercase">Alamat Domisili</span>
                        <span className="col-span-1 text-center">:</span>
                        <span className="col-span-7 truncate font-medium">
                          {user.bio ? user.bio.slice(0, 30) : `Kawasan ${activeCity}`}
                        </span>
                      </div>

                      {/* RT / RW */}
                      <div className="grid grid-cols-12 items-baseline text-[7.5px] sm:text-[9.5px]">
                        <span className="col-span-4 pl-2 uppercase font-medium">RT / RW</span>
                        <span className="col-span-1 text-center">:</span>
                        <span className="col-span-7 font-mono font-medium">001 / 001</span>
                      </div>

                      {/* Kel / Desa */}
                      <div className="grid grid-cols-12 items-baseline text-[7.5px] sm:text-[9.5px]">
                        <span className="col-span-4 pl-2 uppercase font-medium">Kel/Desa</span>
                        <span className="col-span-1 text-center">:</span>
                        <span className="col-span-7 font-medium">SUARA RAKYAT</span>
                      </div>

                      {/* Kecamatan */}
                      <div className="grid grid-cols-12 items-baseline text-[7.5px] sm:text-[9.5px]">
                        <span className="col-span-4 pl-2 uppercase font-medium">Kecamatan</span>
                        <span className="col-span-1 text-center">:</span>
                        <span className="col-span-7 font-medium">KAWAL INTEGRITAS</span>
                      </div>

                      {/* Agama */}
                      <div className="grid grid-cols-12 items-baseline">
                        <span className="col-span-4 uppercase">Agama</span>
                        <span className="col-span-1 text-center">:</span>
                        <span className="col-span-7 font-medium">-</span>
                      </div>

                      {/* Status Perkawinan */}
                      <div className="grid grid-cols-12 items-baseline">
                        <span className="col-span-4 uppercase">Status Perkawinan</span>
                        <span className="col-span-1 text-center">:</span>
                        <span className="col-span-7 font-medium">BELUM KAWIN</span>
                      </div>

                      {/* Pekerjaan */}
                      <div className="grid grid-cols-12 items-baseline">
                        <span className="col-span-4 uppercase">Pekerjaan</span>
                        <span className="col-span-1 text-center">:</span>
                        <span className="col-span-7 font-bold text-[#081c33] truncate">PENGAWAL TRANSPARANSI</span>
                      </div>

                      {/* Kewarganegaraan */}
                      <div className="grid grid-cols-12 items-baseline">
                        <span className="col-span-4 uppercase">Kewarganegaraan</span>
                        <span className="col-span-1 text-center">:</span>
                        <span className="col-span-7 font-extrabold text-[#081c33]">WNI</span>
                      </div>

                      {/* Berlaku Hingga */}
                      <div className="grid grid-cols-12 items-baseline">
                        <span className="col-span-4 uppercase">Berlaku Hingga</span>
                        <span className="col-span-1 text-center">:</span>
                        <span className="col-span-7 font-black tracking-wider text-[#05182d]">SEUMUR HIDUP</span>
                      </div>

                    </div>

                    {/* Kolom Kanan: Pasfoto 3:4, Chip Emas, Stempel & Tanda Tangan */}
                    <div className="col-span-4 flex flex-col items-center justify-between h-full pt-0.5">
                      
                      {/* Chip Pintar e-KTP Kotak Emas */}
                      <div 
                        className="w-8 h-6 sm:w-10 sm:h-7.5 rounded-sm border border-[#a37920] shadow-2xs mb-1.5 flex flex-col justify-center items-center relative overflow-hidden shrink-0"
                        style={{
                          background: 'linear-gradient(135deg, #e4c478 0%, #d4a946 50%, #f6e2a2 75%, #b58927 100%)'
                        }}
                        title="Smart Chip e-KTP Republik Indonesia"
                      >
                        <div className="w-full h-[1px] bg-[#876214] absolute top-1.5"></div>
                        <div className="w-full h-[1px] bg-[#876214] absolute bottom-1.5"></div>
                        <div className="h-full w-[1px] bg-[#876214] absolute left-2 sm:left-2.5"></div>
                        <div className="h-full w-[1px] bg-[#876214] absolute right-2 sm:right-2.5"></div>
                        <div className="w-2.5 h-2 rounded-[1px] border border-[#876214] bg-[#ebd089] z-1"></div>
                      </div>

                      {/* Pasfoto Resmi Berlatar Belakang Merah/Biru Formal */}
                      <div className="relative w-18 h-24 sm:w-24 sm:h-32 rounded-sm overflow-hidden border border-[#3b5978] shadow-md bg-[#b91c1c] flex items-center justify-center shrink-0">
                        {photoUrl ? (
                          <img 
                            src={photoUrl} 
                            alt={activeName} 
                            crossOrigin="anonymous"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center text-white/90 p-1 text-center">
                            <User className="w-10 h-10 sm:w-14 sm:h-14 text-white drop-shadow-sm" />
                            <span className="text-[7px] sm:text-[9px] font-black uppercase tracking-wider mt-0.5">
                              WARGA LKI
                            </span>
                          </div>
                        )}

                        {/* Stempel Bulat "LKI TERVERIFIKASI" Menimpa Pasfoto */}
                        <div 
                          className="absolute -bottom-2 -left-2 sm:-bottom-3 sm:-left-3 w-12 h-12 sm:w-16 sm:h-16 rounded-full border-2 border-[#1e40af] text-[#1e40af] flex flex-col items-center justify-center pointer-events-none -rotate-12 bg-white/20 backdrop-blur-[0.5px] shadow-xs"
                          style={{ borderColor: 'rgba(30, 64, 175, 0.85)' }}
                        >
                          <span className="text-[5px] sm:text-[6px] font-black tracking-tighter uppercase text-center leading-none text-[#1e3a8a]">
                            KOMUNITAS LKI
                          </span>
                          <span className="text-[5.5px] sm:text-[7px] font-black tracking-widest uppercase text-center leading-tight text-[#1e3a8a] my-0.5">
                            VERIFIKASI
                          </span>
                          <span className="text-[4.5px] sm:text-[5.5px] font-bold tracking-tighter uppercase text-center leading-none text-[#1e3a8a]">
                            KEDAULATAN
                          </span>
                        </div>
                      </div>

                      {/* Kota Terbit & Tanda Tangan */}
                      <div className="text-center mt-1 w-full flex flex-col items-center">
                        <span className="text-[7px] sm:text-[8.5px] font-bold text-[#0c2442] truncate max-w-[90px] sm:max-w-[110px]">
                          {activeCity.replace(/^(Kota|Kabupaten|Kab\.)\s*/i, '').toUpperCase()}
                        </span>
                        <span className="text-[6.5px] sm:text-[8px] font-mono text-[#0e2746]">
                          {new Date().toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                        </span>
                        {/* Goresan Tanda Tangan Digital */}
                        <div className="h-4 sm:h-5 w-16 sm:w-20 flex items-center justify-center text-[10px] sm:text-xs font-serif italic text-[#081f3b] opacity-80 border-b border-[#3b5978]/60 mt-0.5">
                          {activeName.split(' ')[0] || 'Warga'}
                        </div>
                        <span className="text-[6px] sm:text-[7px] font-bold text-[#0c2442] tracking-tighter uppercase mt-0.5">
                          TANDA TANGAN WARGA
                        </span>
                      </div>

                    </div>

                  </div>

                </div>

              </div>
            </div>

            {/* Info Email & Akun Warga */}
            <div className="p-3 bg-[#F8F5EE] border border-[#E7DECB] rounded-2xl flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-800">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-[#1E293B]">
                    {user.displayName || user.username} <span className="font-normal text-slate-500 font-mono text-[11px]">(@{user.username})</span>
                  </p>
                  <p className="text-[11px] text-[#64748B] flex items-center gap-1">
                    <Mail className="w-3 h-3 text-slate-400" />
                    <span>{user.email || 'Email belum diatur'}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-100 border border-emerald-300 text-emerald-800 rounded-full text-[11px] font-bold shadow-2xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Warga Sah Terverifikasi</span>
              </div>
            </div>

            {/* Tombol Aksi Utama: Unduh KTP & Edit Profil */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-2.5 border-t border-[#EAE1CD]">
              <p className="text-[11px] text-slate-500 text-center sm:text-left">
                Kartu e-KTP LKI ini adalah bukti sah partisipasi publik dalam pengawasan anti-korupsi.
              </p>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleDownloadKtp}
                  disabled={downloading}
                  className="flex-1 sm:flex-initial px-4 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  title="Unduh e-KTP sebagai gambar PNG"
                >
                  {downloading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Memproses Gambar...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-3.5 h-3.5" />
                      <span>Unduh KTP (PNG)</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    sound.playPop();
                    setModalMode('edit');
                  }}
                  className="flex-1 sm:flex-initial px-4 py-2.5 bg-[#1E293B] hover:bg-[#334155] text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                  <span>Edit Profil</span>
                </button>
              </div>
            </div>

          </div>
        ) : (

          /* ========================================================= */
          /* MODE 2: EDIT (FORMULIR EDIT DATA PROFIL & WILAYAH DINAMIS) */
          /* ========================================================= */
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Foto Profil & Avatar Section */}
            <div className="p-3.5 bg-[#F8F4EA] border border-[#E7DFCC] rounded-2xl space-y-3">
              <label className="block text-xs font-bold text-[#334155]">
                Pasfoto Profil Warga (Ditampilkan pada e-KTP)
              </label>

              <div className="flex flex-col sm:flex-row items-center gap-4">
                {/* Photo Preview Box */}
                <div className="relative group shrink-0">
                  <div className="w-20 h-24 rounded-xl overflow-hidden bg-[#b91c1c] border-2 border-[#D6C7A1] shadow-md flex items-center justify-center">
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
                      <div className="flex flex-col items-center justify-center text-center p-1 text-white">
                        <User className="w-8 h-8" />
                        <span className="text-[9px] font-bold mt-0.5">Pasfoto</span>
                      </div>
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
                        onChange={e => setPhotoUrl(e.target.value)}
                        placeholder="https://example.com/pasfoto-warga.jpg"
                        className="w-full px-3 py-2 bg-white border border-[#CBD5E1] focus:border-amber-500 rounded-xl text-xs text-slate-900 outline-hidden shadow-2xs"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Nama Tampilan */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-[#334155]">
                Nama Lengkap / Nama KTP Warga <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  placeholder="Nama lengkap sesuai e-KTP Anda"
                  className="w-full pl-9 pr-3 py-2 bg-white border border-[#CBD5E1] focus:border-amber-500 focus:ring-2 focus:ring-amber-400/20 rounded-xl text-xs text-slate-900 outline-hidden transition-all shadow-xs"
                />
              </div>
            </div>

            {/* Asal Daerah Dinamis (Provinsi -> Kota/Kabupaten Dropdown) */}
            <div className="p-3.5 bg-[#FEFCE8] border border-[#FEF08A] rounded-2xl space-y-2.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#854D0E]">
                <MapPin className="w-3.5 h-3.5 text-amber-600" />
                <span>Asal Daerah Domisili KTP (Terhubung Otomatis)</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* Dropdown Provinsi */}
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

                {/* Dropdown Kota/Kabupaten Terhubung */}
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

            {/* Slogan / Catatan Warga */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <label className="font-bold text-[#334155]">
                  Slogan / Aspirasi Kedaulatan (Alamat KTP)
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

            {/* Action Buttons Form */}
            <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-[#EAE1CD]">
              <button
                type="button"
                onClick={() => {
                  sound.playPop();
                  setModalMode('view');
                }}
                className="px-4 py-2 bg-[#F3EDE0] hover:bg-[#E5DAC0] text-[#57534E] rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Kembali ke KTP
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
