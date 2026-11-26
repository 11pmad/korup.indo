# 07 — Panduan Deployment (Vercel + Neon/Supabase) & Checklist Kesiapan Produksi

> **Target Infrastruktur:** Vercel (Next.js App Router + Serverless Functions + Cron) & Managed PostgreSQL (Neon / Supabase)

---

## 1. Spesifikasi Variabel Lingkungan (`.env.example` v2.0)

Seluruh variabel di bawah ini divalidasi oleh `src/env.ts` saat runtime:

| Variabel | Status | Deskripsi & Contoh Nilai |
|---|---|---|
| `DATABASE_URL` | **Wajib** | Connection string **Transaction Pooler** PostgreSQL untuk runtime Vercel Serverless (contoh Supabase port `6543` / Neon `-pooler` dengan `?sslmode=require`). |
| `DIRECT_URL` | **Wajib (CLI)** | Connection string **Direct / Non-Pooler** (port `5432`) khusus untuk `drizzle-kit push/migrate` dan `db:seed`. |
| `NEXT_PUBLIC_APP_URL` | **Wajib** | URL kanonik produksi tanpa trailing slash (contoh: `https://korup-indo.vercel.app`). |
| `ADMIN_JWT_SECRET` | **Wajib** | String acak kriptografis minimal 32 karakter (`openssl rand -hex 32`) khusus sesi admin. |
| `CITIZEN_JWT_SECRET` | **Wajib** | String acak kriptografis minimal 32 karakter (berbeda dari admin secret) khusus sesi warga. |
| `CRON_SECRET` | **Wajib (Prod)** | Token bearer rahasia untuk mengamankan endpoint `/api/cron/maintenance` di Vercel. |
| `IP_HASH_SALT` | **Wajib (Prod)** | Secret salt minimal 32 karakter untuk hashing IP pada `visitor_logs` dan *rate limiter*. |
| `INITIAL_SUPERADMIN_USERNAME` | Opsional (Setup) | Username bootstrap admin awal (hanya dipakai saat menjalankan skrip `db:bootstrap-admin`). |
| `INITIAL_SUPERADMIN_PASSWORD` | Opsional (Setup) | Password awal minimal 14 karakter untuk bootstrap admin pertama (segera ganti setelah login perdana). |
| `GEMINI_API_KEY` | Opsional | Kunci API Google Gemini untuk modul AI Curator di portal admin. |
| `GOOGLE_CLIENT_ID` | Opsional | Client ID OAuth 2.0 untuk tombol "Masuk dengan Google" bagi akun warga. |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Opsional | Salinan Client ID Google yang diekspos ke klien (harus sama dengan `GOOGLE_CLIENT_ID`). |
| `RESEND_API_KEY` | Wajib bila Auth Lokal aktif | API Key Resend untuk mengirim email OTP 6 digit verifikasi pendaftaran warga. |
| `EMAIL_FROM` | Opsional | Alamat pengirim email OTP (contoh: `LKI Transparansi <noreply@domainanda.id>`). |

---

## 2. Pengaturan Database Produksi (Neon / Supabase)

### 2.1 Aktivasi Ekstensi Wajib
Jalankan sekali pada SQL Editor penyedia PostgreSQL Anda:
```sql
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
```

### 2.2 Migrasi & Seeding Awal dari Lokal/CI
```bash
# 1. Dorong skema Drizzle v2 ke database target menggunakan DIRECT_URL
bun run db:push

# 2. Impor 43+ perkara kanonik, 38 provinsi, 10 era, partai, korporasi & sumber
bun run db:seed

# 3. Buat akun Super Admin awal secara aman (bukan password default!)
bun run db:bootstrap-admin
```

### 2.3 Backup & Rollback Strategy
- Aktifkan **Point-in-Time Recovery (PITR)** atau snapshot harian otomatis di dashboard Neon/Supabase sebelum setiap migrasi skema besar.
- Gunakan file migrasi SQL terversi (`drizzle-kit generate`) untuk perubahan skema pasca-rilis v2.0 agar setiap perubahan dapat diaudit di Git.

---

## 3. Konfigurasi Vercel & CI/CD

### 3.1 `vercel.json` (Cron & Build)
```json
{
  "crons": [
    {
      "path": "/api/cron/maintenance",
      "schedule": "0 3 * * *"
    }
  ]
}
```
Vercel otomatis menyuntikkan header `Authorization: Bearer <CRON_SECRET>` saat memanggil `/api/cron/maintenance` setiap pukul 03:00 UTC.

### 3.2 GitHub Actions CI Pipeline
Setiap *Pull Request* dan *push* ke branch `main` wajib melewati:
1. `bun run lint` (`eslint` + `next typegen` + `tsc --noEmit`)
2. `bun run data:validate` (memastikan dataset di `data/normalized/` tetap lolos uji integritas relasional & anti-double-counting)
3. `bun run test` (Vitest unit & API contract tests)
4. `bun run build` (verifikasi kompilasi Next.js produksi tanpa error)

---

## 4. Master Pre-Production Go-Live Checklist

Salin dan verifikasi seluruh item berikut sebelum mengumumkan rilis produksi:

### A. Infrastruktur & Database
- [ ] Ekstensi `pg_trgm` dan `pgcrypto` aktif di PostgreSQL produksi.
- [ ] Indeks GIN trigram (`cases_title_trgm_idx`, `persons_name_trgm_idx`, `companies_name_trgm_idx`) terpasang dan diverifikasi dengan `EXPLAIN ANALYZE`.
- [ ] `DATABASE_URL` menggunakan Transaction Pooler (`prepare: false`) dan `DIRECT_URL` hanya dipakai CLI.
- [ ] Snapshot/backup otomatis database aktif.
- [ ] Cron harian `/api/cron/maintenance` terkonfigurasi dan diuji dengan `CRON_SECRET`.

### B. Keamanan & Autentikasi
- [ ] Tidak ada *hardcoded secret* atau akun `admin123` di kode maupun database produksi.
- [ ] Seluruh variabel secret (`ADMIN_JWT_SECRET`, `CITIZEN_JWT_SECRET`, `CRON_SECRET`, `IP_HASH_SALT`) memiliki panjang ≥ 32 karakter acak.
- [ ] Cookie sesi admin & warga menggunakan `HttpOnly`, `Secure`, `SameSite=Lax`.
- [ ] Login admin terproteksi *account lockout* + *rate limit* berbasis PostgreSQL.
- [ ] Security headers (CSP, HSTS, X-Frame-Options `DENY`, nosniff) aktif di respons HTTP produksi.
- [ ] Endpoint `/api/v1/admin/*` teruji menolak request tanpa cookie valid (status `401`) dan role tidak berwenang (status `403`).

### C. Integritas Data & Kepatuhan Hukum
- [ ] Seluruh kasus berstatus `tersangka`/`terdakwa` menampilkan disclaimer Pasal 8 ayat (1) UU No. 48/2009 dan tidak muncul di *Hall of Shame* inkrah.
- [ ] Hasil audit `computeCaseDisplayFinancials` sesuai 100% dengan aturan Anti Double-Counting (`data/quality/data_quality_report.md`).
- [ ] 100% perkara memiliki minimal 1 sumber rujukan primer di tabel `sources`.
- [ ] Formulir `/lapor` dan pelacakan kode tiket (termasuk `hak_jawab`) berfungsi penuh.

### D. Kualitas Kode & Pengujian
- [ ] `tsc --noEmit`, ESLint, dan `next build` lulus dengan 0 error.
- [ ] Seluruh unit test (aggregator finansial, RBAC, validator Zod, formatter) lulus 100%.
- [ ] Playwright E2E *smoke test* lulus untuk rute `/`, `/peta`, `/klasemen`, `/cari`, `/kasus/[slug]`, `/lapor`, dan `/admin/login`.

### E. SEO, Performa & Aksesibilitas
- [ ] `/sitemap.xml` dan `/robots.txt` valid dan dapat diakses (memuat seluruh URL `/kasus/[slug]` dan `/tokoh/[slug]`).
- [ ] Dynamic OpenGraph image (`/kasus/[slug]/opengraph-image`) merender dengan benar.
- [ ] Skor Lighthouse (Mobile & Desktop) ≥ 90 untuk Performance dan ≥ 95 untuk Accessibility, Best Practices, dan SEO.

### F. Observabilitas & Operasional
- [ ] `/api/health` mengembalikan `200 OK` dan terhubung ke monitor uptime eksternal.
- [ ] Anonimisasi IP pada `visitor_logs` diverifikasi (tidak ada IP mentah tersimpan).
- [ ] Pengaturan awal `announcement` dan `donation` di `site_settings` sudah terisi dan diuji diubah dari panel `/admin/settings`.
