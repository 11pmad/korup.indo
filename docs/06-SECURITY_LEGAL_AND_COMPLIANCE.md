# 06 — Standar Keamanan, Mitigasi Risiko Hukum & Pelindungan Data Pribadi

> **Cakupan:** Keamanan Aplikasi (OWASP Top 10), Tata Kelola Akses Admin (RBAC), Kepatuhan Hukum Nasional (UU Kekuasaan Kehakiman, UU ITE, UU Pers), dan Kepatuhan UU Pelindungan Data Pribadi (UU No. 27 Tahun 2022).

---

## 1. Keamanan Aplikasi & Hardening Produksi (OWASP Top 10)

### 1.1 Validasi Environment Variables (`src/env.ts`)
- Aplikasi menggunakan Zod untuk memvalidasi seluruh variabel lingkungan saat *boot*.
- **Larangan Fallback Secret:** Tidak ada lagi *hardcoded fallback* untuk `ADMIN_JWT_SECRET`, `CITIZEN_JWT_SECRET`, `CRON_SECRET`, atau `GOOGLE_CLIENT_ID`. Jika variabel wajib tidak tersedia di produksi, aplikasi gagal memulai (*fail-fast*) dengan pesan diagnostik yang aman.
- **Penghapusan Kredensial Default:** Password default `admin123` pada v1 **dihapus total**. Akun `super_admin` pertama hanya dibuat melalui skrip CLI `bun run db:bootstrap-admin` menggunakan env `INITIAL_SUPERADMIN_PASSWORD` (minimal 14 karakter) atau input interaktif terminal.

### 1.2 Autentikasi, Sesi & Cookie
- **HttpOnly Cookies (Anti-XSS):** Token JWT (ditandatangani `HS256` via `jose`) disimpan eksklusif dalam cookie `lki_admin_session` (masa berlaku 12 jam) dan `lki_citizen_session` (masa berlaku 7 hari) dengan atribut:
  - `HttpOnly: true` (tidak dapat dibaca JavaScript / `localStorage`)
  - `Secure: true` (wajib HTTPS di produksi)
  - `SameSite: 'lax'` (perlindungan CSRF)
  - `Path: '/'` (cookie admin dibatasi atau divalidasi terpisah di `middleware.ts`)
- **Password Hashing:** `bcryptjs` dengan *cost factor* **12**.
- **Brute-Force Protection:** Akun admin dikunci sementara selama **15 menit** setelah **5 kali** gagal login berturut-turut (`failed_login_attempts`, `locked_until`), ditambah *rate limit* berbasis IP pada tabel `rate_limit_buckets`.
- **Google OAuth Server-Side Verification:** Token kredensial Google (`idToken`) wajib diverifikasi langsung di server memakai `OAuth2Client.verifyIdToken({ idToken, audience: env.GOOGLE_CLIENT_ID })`. Tidak mempercayai payload email mentah dari body request klien.

### 1.3 Matriks Otorisasi RBAC (6 Peran Staf Admin)
| Fitur / Aksi | `super_admin` | `admin` | `editor` | `reviewer` | `moderator` | `auditor` |
|---|---|---|---|---|---|---|
| Kelola Perkara, Tokoh, Korporasi (`POST/PATCH`) | Ya | Ya | Ya | Lihat | Lihat | Lihat |
| Hapus Perkara / Data Master (`DELETE`) | Ya | Ya | Tidak | Tidak | Tidak | Tidak |
| Gunakan AI Curator | Ya | Ya | Ya | Tidak | Tidak | Tidak |
| Selesaikan Antrean `review_queue` | Ya | Ya | Tidak | Ya | Tidak | Tidak |
| Moderasi Laporan Warga & Hak Jawab | Ya | Ya | Tidak | Ya | Ya | Tidak |
| Moderasi / Sembunyikan Komentar Publik | Ya | Ya | Tidak | Tidak | Ya | Tidak |
| Ubah Pengumuman & QRIS Donasi (`site_settings`) | Ya | Ya | Tidak | Tidak | Tidak | Tidak |
| Kelola Staf Admin & Role RBAC | Ya | Tidak | Tidak | Tidak | Tidak | Tidak |
| Lihat Audit Logs & Monitoring | Ya | Ya | Tidak | Tidak | Tidak | Ya |

### 1.4 Sanitasi Input, Anti-SSRF & Security Headers
- **SQL Injection:** Seluruh query memakai Drizzle ORM *parameterized queries*; melarang interpolasi string SQL mentah dari input pengguna.
- **XSS:** Komentar warga dan deskripsi laporan hanya dirender sebagai *plain text* oleh React (dilarang menggunakan `dangerouslySetInnerHTML`). URL rujukan eksternal divalidasi hanya menerima skema `https://` atau `http://` (memblokir `javascript:` dan `data:`).
- **Security Headers di `next.config.ts` / `middleware.ts`:**
  - `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy: camera=(), microphone=(), geolocation=()`
  - `Content-Security-Policy` ketat (mengizinkan script self, domain Google OAuth bila diaktifkan, dan gambar tepercaya).

---

## 2. Mitigasi Risiko Hukum Nasional (UU ITE, UU Kekuasaan Kehakiman, Pencemaran Nama Baik)

Portal transparansi korupsi memiliki risiko somasi atau gugatan hukum apabila salah menyajikan fakta peradilan. Oleh karena itu, kode aplikasi dan SOP kurasi menerapkan perlindungan berikut:

1. **Kepatuhan Pasal 8 ayat (1) UU No. 48 Tahun 2009:**
   - Status `tersangka` dan `terdakwa` selalu dirender dengan label jelas **"Belum Berkekuatan Hukum Tetap (Asas Praduga Tak Bersalah)"**.
   - Fitur *Hall of Shame* dan kalimat simpulan kesalahan hanya aktif untuk status `divonis_inkrah` / `divonis_bersalah` yang terkonfirmasi putusan pengadilan.
2. **Aturan Sumber Primer & Kutipan Fakta (`source_excerpt`):**
   - Setiap ringkasan perkara dan angka finansial wajib mengacu pada dokumen publik resmi (`putusan3.mahkamahagung.go.id`, `kpk.go.id`, `kejaksaan.go.id`, `bpk.go.id`) atau liputan media terverifikasi Dewan Pers.
   - Kurator dilarang menambahkan opini pribadi, spekulasi motif tanpa fakta persidangan, atau kata sifat menghakimi.
3. **Prosedur Hak Jawab & Pemulihan Status Hukum (SLA 2×24 Jam):**
   - Subjek hukum atau kuasa hukumnya dapat mengajukan pembaruan melalui jenis laporan **`hak_jawab`** di halaman `/lapor` dengan melampirkan tautan resmi Putusan Bebas (`vrijspraak`), Lepas (`ontslag`), SP3, atau Putusan Peninjauan Kembali (PK).
   - Laporan bertipe `hak_jawab` otomatis mendapat tanda **Prioritas Tinggi** di antrean moderator admin.
   - Setelah diverifikasi, status tokoh/kasus segera diperbarui ke `bebas` / `lepas`, cache ISR diinvalidasi seketika, dan catatan perubahan tercatat di `audit_logs`.

---

## 3. Kepatuhan UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi (UU PDP)

1. **Minimisasi Data & Anonimisasi Log Trafik:**
   - `visitor_logs` **tidak menyimpan alamat IP mentah**. IP pengunjung di-hash menggunakan `SHA-256(ip + daily_rotating_salt)` untuk keperluan metrik pengunjung unik harian dan *rate limiting*, lalu dihapus otomatis setelah **30 hari** melalui Vercel Cron.
2. **Kerahasiaan Identitas Pelapor Warga:**
   - Kolom `submitter_contact` pada kanal laporan `/lapor` bersifat opsional, tidak pernah dikembalikan oleh endpoint publik (`/api/v1/reports/track/[code]`), dan hanya digunakan untuk konfirmasi klarifikasi kurator bila diperlukan.
3. **Hak Subjek Data Warga (`citizen_users`):**
   - Warga yang mendaftar akun dapat memperbarui data profil maupun menghapus akunnya secara permanen melalui `DELETE /api/v1/auth/citizen/me`.
   - Kode OTP verifikasi email disimpan dalam bentuk hash di database (`email_verification_code_hash`) dan kedaluwarsa otomatis dalam 15 menit.
