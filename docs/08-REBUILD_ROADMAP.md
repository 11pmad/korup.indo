# 08 — Peta Jalan Eksekusi Rebuild dari Awal (Reset Branch `main` → Produksi)

> **Prinsip Eksekusi:** Setiap fase memiliki keluaran yang dapat diuji dan diverifikasi (*verifiable milestones*). Eksekusi **baru dimulai setelah seluruh dokumen `docs/01`–`08` disetujui**.

---

## 1. Kebijakan Pelestarian & Pembersihan Aset (Saat Fase 0 Dimulai)

Saat proses pembuatan ulang di branch `main` dimulai, repositori dibersihkan dari kode legacy v1 secara aman dengan aturan berikut:

| Kategori | Path / File | Tindakan di Fase 0 |
|---|---|---|
| **Histori Kode v1** | Seluruh commit lama di `main` | Diamankan dengan Git Tag **`v1-legacy-archive`** sebelum pembersihan file agar dapat ditinjau ulang kapan saja. |
| **Wajib Dipertahankan** | `data/` (seluruh dataset 1945–2026, skema SQL referensi, skrip validasi) | **Dipertahankan utuh** sebagai sumber data kanonik untuk *seeding* v2.0. |
| **Wajib Dipertahankan** | `docs/` (seluruh dokumen pra-produksi v2.0) | **Dipertahankan utuh** sebagai acuan kerja selama seluruh fase rebuild. |
| **Aset Statis Terpakai** | `public/indonesia-38-provinces.geojson`, `src/data/provincesGeo.ts`, `public/favicon.*`, `public/og-image.*` | Dipindahkan/dipertahankan untuk modul peta SVG 38 provinsi dan aset merek LKI. |
| **Kode Legacy v1 (Dihapus)** | `server.ts`, `server/`, `api/`, `vite.config.ts`, `index.html`, `src/App.tsx`, `src/components/` lama, `scripts/`, `CLAUDE.md`, `.cursorrules`, `VIBE_CODING_CONTEXT.md` (digantikan `docs/`) | Dihapus bersih pada commit inisialisasi Next.js v2.0 agar tidak ada *dead code* atau konflik dependensi. |

---

## 2. Tahapan Eksekusi Rebuild (Fase 0 – Fase 6)

### Fase 0 — Arsip v1, Pembersihan & Inisialisasi Next.js v2.0
- **Langkah:**
  1. Membuat tag pengaman: `git tag -a v1-legacy-archive -m "Archive LKI v1 before Next.js v2 rebuild"`.
  2. Menghapus file kode v1 sambil menjaga `data/`, `docs/`, `src/data/provincesGeo.ts`, dan aset `public/`.
  3. Menginisialisasi **Next.js App Router + React 19 + TypeScript Strict + Tailwind CSS v4**, `next.config.ts` (security headers), `src/env.ts` (Zod env validator), dan `.env.example` v2.0.
- **Definition of Done (DoD):** Server Next.js berjalan lokal (`bun run dev`), `tsc --noEmit` lulus 0 error, `/api/health` merespons, serta folder `data/` dan `docs/` tetap utuh.

### Fase 1 — Fondasi Database Terpadu & Seeding Data Kanonik
- **Langkah:**
  1. Mengimplementasikan `src/server/db/schema.ts` sesuai [03-DATABASE_SCHEMA.md](./03-DATABASE_SCHEMA.md) lengkap dengan indeks `pg_trgm` dan tabel `site_settings`, `rate_limit_buckets`, `review_queue`.
  2. Mengimplementasikan `src/server/services/financialAggregator.ts` (aturan Anti-Double-Counting).
  3. Menulis `src/server/db/seed.ts` (impor idempoten dari `data/normalized/*.json`) dan `src/server/db/bootstrap-admin.ts`.
  4. Menulis unit test Vitest untuk `financialAggregator` dan integritas hasil seed.
- **DoD:** `db:push` dan `db:seed` berhasil di PostgreSQL; seluruh 43 perkara, 38 provinsi + `nasional`, 10 era, 11 partai, 10 korporasi, 37 catatan finansial, 35 putusan, dan 43 sumber masuk dengan nol error relasi.

### Fase 2 — Layer Layanan Backend, Autentikasi `HttpOnly` & Kontrak API Publik
- **Langkah:**
  1. Mengimplementasikan modul keamanan: `session.ts` (`jose` HttpOnly cookie), `rbac.ts` (6 role admin), `rateLimit.ts` (PostgreSQL-backed), dan `ipHash.ts`.
  2. Mengimplementasikan `repositories/` (`casesRepo`, `officialsRepo`, `partiesRepo`, `provincesRepo`, `companiesRepo`, `statsRepo`).
  3. Membangun seluruh Route Handlers `GET /api/v1/*` publik dan `POST/GET /api/v1/export` sesuai [04-API_AND_DATA_CONTRACTS.md](./04-API_AND_DATA_CONTRACTS.md).
- **DoD:** Seluruh endpoint API publik lolos uji kontrak Zod dan unit/integration test; tidak ada query yang mencampur nilai proyek ke kerugian negara.

### Fase 3 — Antarmuka Publik SSR/ISR, Peta 38 Provinsi, Klasemen & SEO
- **Langkah:**
  1. Membangun Design System di `src/app/globals.css`, `layout.tsx` (`next/font/google`), `Navbar`, `DisclaimerBanner`, `LegalStatusStamp`, `FinancialBreakdownCard`, dan `Footer`.
  2. Membangun rute halaman publik berbasis RSC + ISR:
     - `/` (Beranda + Hall of Shame khusus inkrah)
     - `/peta` (Peta Choropleth SVG 38 Provinsi + Klaster Nasional aksesibel)
     - `/klasemen` (Tab Pejabat, Partai, Korporasi dengan paginasi & filter URL)
     - `/statistik` (Tren tahunan, 10 Era netral, Sektor, Asset Recovery Rate)
     - `/cari` (Fuzzy search `pg_trgm` sinkron URL)
     - `/kasus/[slug]` & `/tokoh/[slug]` (Detail berkas SSR, tabel tuntutan vs vonis, kutipan sumber primer, dynamic OG image, JSON-LD)
  3. Membangun `sitemap.ts` dan `robots.ts` dinamis.
- **DoD:** Seluruh rute publik dapat diakses langsung via URL dan dirender oleh server (SSR/ISR); `DisclaimerBanner` aktif; status tersangka/terdakwa terproteksi visual.

### Fase 4 — Partisipasi Warga, Laporan Publik (`Hak Jawab`) & Open Data
- **Langkah:**
  1. Mengimplementasikan autentikasi warga (`/api/v1/auth/citizen/*`: Register + OTP 6 digit via mailer, Login, Google OAuth server-verified, Profil & Hapus Akun).
  2. Mengimplementasikan komponen `CaseReactionsSection` (8 sentimen) dan `CaseCommentsSection` (komentar + upvote) pada halaman `/kasus/[slug]`.
  3. Membangun halaman `/lapor` (formulir pengajuan + fitur **Lacak Kode Tiket** `LKI-YYYY-XXXX`) dan `/open-data` (katalog & unduh CSV/JSON).
- **DoD:** Alur registrasi OTP, reaksi, komentar, pengajuan laporan/hak jawab, serta ekspor CSV/JSON berjalan end-to-end dengan proteksi rate limit.

### Fase 5 — Portal Kurasi Admin RBAC & AI Curator Gemini
- **Langkah:**
  1. Mengamankan rute `/admin/*` melalui `src/middleware.ts` dan Admin Server Layout.
  2. Membangun modul admin di `/admin/(protected)/*`:
     - Dashboard Overview & Monitoring Trafik Anonim
     - CRUD Perkara, Tokoh, Partai, Korporasi (+ manajemen `financial_records` & `verdicts`)
     - AI Curator (`@google/genai` dengan aturan wajib sumber URL primer & JSON schema ketat)
     - Antrean `review_queue`, Moderasi Laporan & Hak Jawab, Moderasi Komentar
     - Manajemen Pengaturan Situs (`site_settings` pengumuman & QRIS donasi)
     - Manajemen Pengguna Admin (`super_admin` only) & Audit Logs
  3. Menghubungkan setiap mutasi admin ke `revalidateTag()` agar halaman publik langsung terbarui.
- **DoD:** Seluruh 6 peran RBAC teruji batas aksesnya; perubahan data admin memicu audit log dan memperbarui cache ISR publik secara instan.

### Fase 6 — Pengujian Menyeluruh, Audit & Siap Produksi Vercel
- **Langkah:**
  1. Menjalankan suite tes unit & integrasi (Vitest) + E2E *smoke test* (Playwright) untuk seluruh alur kritikal.
  2. Mengimplementasikan `/api/cron/maintenance` dan mengonfigurasi `vercel.json`.
  3. Mengaudit skor Lighthouse (Performance, Accessibility WCAG 2.1 AA, Best Practices, SEO) dan memverifikasi seluruh item pada [07-DEPLOYMENT_AND_PRODUCTION_CHECKLIST.md](./07-DEPLOYMENT_AND_PRODUCTION_CHECKLIST.md).
  4. Memperbarui `README.md` root agar selaras 100% dengan arsitektur v2.0.
- **DoD:** `bun run lint`, `bun run test`, `bun run data:validate`, dan `bun run build` seluruhnya lulus bersih; aplikasi siap di-deploy ke Vercel + Managed PostgreSQL.
