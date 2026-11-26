# Dokumentasi Pra-Produksi — Liga Korupsi Indonesia (LKI) v2.0

> **Status Dokumen:** Siap Direview (Pre-Production Sign-Off Gate)  
> **Target Stack:** Next.js (App Router, v15+) · React 19 · TypeScript (Strict) · Tailwind CSS v4 · Drizzle ORM · PostgreSQL (`pg_trgm`)  
> **Target Hosting:** Vercel + Managed PostgreSQL (Neon / Supabase)  
> **Dataset Kanonik:** `data/` (43+ perkara historis terverifikasi 1945–2026 lintas 10 era kepresidenan)

---

## 1. Ringkasan Eksekutif

**Liga Korupsi Indonesia (LKI)** adalah portal transparansi data, edukasi hukum, dan pemantauan historis perkara tindak pidana korupsi di Indonesia (1945–sekarang). Platform ini mengemas data putusan pengadilan, audit resmi negara (BPK/BPKP), dan rilis penegak hukum ke dalam format interaktif berupa **peta choropleth 38 provinsi**, **klasemen liga pejabat/partai/korporasi**, **mesin pencari berkas perkara**, serta **kanal partisipasi dan laporan warga**.

Versi **2.0** merupakan *ground-up rebuild* (pembangunan ulang dari awal) atas basis kode v1 (Vite + React SPA + Express.js) untuk mencapai standar **produksi, keamanan, kepatuhan hukum, SEO, dan keandalan serverless** pada arsitektur **Next.js App Router + Vercel + Managed PostgreSQL**.

---

## 2. Audit Masalah Teknis v1 yang Diselesaikan di v2.0

Sebelum menulis kode v2.0, berikut adalah empat akar masalah pada implementasi v1 yang wajib diselesaikan secara struktural:

| No | Masalah pada Kode v1 | Dampak Risiko Produksi | Solusi Arsitektural di v2.0 |
|---|---|---|---|
| **1** | **Duplikasi & Inkonsistensi 3 Layer Data** (`server/db.ts` InMemoryDB, `server/db/schema.ts` 18 tabel yang meratakan angka finansial pada kolom `loss_amount`, dan `data/schema/schema.sql` 14 tabel riset kanonik). | Potensi *double-counting* kerugian negara vs nilai proyek/suap, ketidaksinkronan angka antara riset `data/` dan database runtime. | **Skema Database Terpadu (Unified Schema)** di Drizzle ORM yang menyatukan `financial_records`, `verdicts`, `sources`, `positions`, `party_memberships` dengan tabel interaksi publik (`citizen_users`, `case_reactions`, `case_comments`, `public_reports`). |
| **2** | **Ketiadaan SSR/ISR pada SPA Vite** (`src/App.tsx` hanya berbasis *state* tab internal tanpa routing URL nyata, padahal `sitemap.xml` menautkan ke `/kasus/:id`). | Halaman detail perkara tidak dapat diindeks mesin pencari (404 saat diakses langsung), OpenGraph per kasus tidak dinamis, beban *initial load* tinggi. | **Next.js App Router (RSC + ISR)** dengan rute nyata (`/`, `/peta`, `/klasemen`, `/statistik`, `/cari`, `/kasus/[slug]`, `/tokoh/[slug]`, `/lapor`, `/open-data`), `generateMetadata()`, dan OpenGraph dinamis. |
| **3** | **Anti-Pattern File Lokal di Serverless** (`server.ts` membaca/menulis `data/announcement.json` & `data/donation.json`, serta menyimpan konfigurasi di `audit_logs.diff_snapshot`). | Pada lingkungan *read-only/ephemeral* Vercel Serverless, penulisan file gagal atau hilang saat instance restart. | Tabel khusus **`site_settings`** di PostgreSQL dengan *tag-based cache invalidation* (`revalidateTag`), murni *stateless* di layer aplikasi. |
| **4** | **Celah Keamanan Konfigurasi & Sesi** (fallback *hardcoded* `ADMIN_JWT_SECRET`/`CITIZEN_JWT_SECRET`, password default `admin123`, penyimpanan JWT di `localStorage`, dan `express-rate-limit` in-memory). | Rentan serangan XSS (pencurian token), kebocoran kredensial default, dan *rate limit* ter-reset setiap *cold start* Vercel. | Validasi **Zod Env Startup (`src/env.ts`)** (tolak boot jika secret kosong di produksi), penghapusan password default, **HttpOnly Secure Cookie** (`jose`), serta **PostgreSQL-backed / Distributed Rate Limiter**. |

---

## 3. Daftar Isi Suite Dokumen Pra-Produksi

Seluruh spesifikasi teknis, produk, hukum, keamanan, dan tahapan eksekusi telah disusun ke dalam 8 dokumen berurutan berikut:

| Urutan | Dokumen | Fokus Utama |
|---|---|---|
| **01** | [01-PRD.md](./01-PRD.md) | Visi produk, persona pengguna, spesifikasi 8 modul fungsional, *acceptance criteria*, dan 5 guardrails hukum/data mutlak. |
| **02** | [02-ARCHITECTURE.md](./02-ARCHITECTURE.md) | Arsitektur Next.js App Router + Vercel + PostgreSQL, diagram alur sistem, struktur direktori target, strategi SSR/ISR & *connection pooling*. |
| **03** | [03-DATABASE_SCHEMA.md](./03-DATABASE_SCHEMA.md) | ERD terpadu, spesifikasi 25+ tabel & enum Drizzle ORM, indeks `pg_trgm`, aturan SQL Anti-Double-Counting, dan pipeline *seeding* `data/normalized/`. |
| **04** | [04-API_AND_DATA_CONTRACTS.md](./04-API_AND_DATA_CONTRACTS.md) | Standar respons JSON, kontrak lengkap endpoint `/api/v1/*` (Publik, Warga, Admin, Cron), validasi Zod, AI Curator schema, dan aturan *rate limit*. |
| **05** | [05-UI_UX_DESIGN_SYSTEM.md](./05-UI_UX_DESIGN_SYSTEM.md) | Sistem desain *"Investigative Archival Dossier & Scrapbook"*, palet warna & token Tailwind v4, tipografi `next/font`, komponen kunci, WCAG 2.1 AA, dan SEO. |
| **06** | [06-SECURITY_LEGAL_AND_COMPLIANCE.md](./06-SECURITY_LEGAL_AND_COMPLIANCE.md) | Hardening OWASP Top 10, autentikasi HttpOnly Cookie, RBAC 6 peran admin, kepatuhan UU Kekuasaan Kehakiman, SOP Hak Jawab, dan kepatuhan UU PDP No. 27/2022. |
| **07** | [07-DEPLOYMENT_AND_PRODUCTION_CHECKLIST.md](./07-DEPLOYMENT_AND_PRODUCTION_CHECKLIST.md) | Daftar variabel lingkungan `.env.example` v2.0, konfigurasi Neon/Supabase & Vercel Cron, pipeline CI/CD, dan *Master Go-Live Checklist*. |
| **08** | [08-REBUILD_ROADMAP.md](./08-REBUILD_ROADMAP.md) | Peta jalan eksekusi bertahap (Fase 0–6): prosedur aman *tagging* `v1-legacy-archive`, reset bersih branch `main` dengan menjaga `data/` & `docs/`, hingga produksi. |

---

## 4. Prinsip Dasar yang Tidak Boleh Dilanggar Selama Rebuild

1. **Asas Praduga Tak Bersalah (*Presumption of Innocence*)** — Mematuhi Pasal 8 ayat (1) UU No. 48 Tahun 2009: dilarang melabeli `tersangka`/`terdakwa` sebagai koruptor/terpidana sebelum ada putusan *inkrah*.
2. **Anti Double-Counting Finansial** — Nilai proyek/kontrak, nilai audit BPK/BPKP, kerugian negara versi vonis, suap/gratifikasi, uang pengganti, dan denda dipisahkan secara ketat dan tidak pernah dijumlahkan sembarangan.
3. **Provenance Primer Wajib** — Setiap fakta hukum dan nominal finansial wajib terhubung ke tabel `sources` dengan URL resmi (Direktori Putusan MA, SIPP, KPK, Kejaksaan, BPK/BPKP, atau media terverifikasi Dewan Pers).
4. **Pelestarian Aset Riset `data/`** — Seluruh dataset historis terverifikasi di direktori `data/` (1945–2026) dipertahankan utuh sebagai *single source of truth* awal untuk *seeding* database v2.0.

---

## 5. Status Persetujuan (Sign-Off Gate)

> [!IMPORTANT]
> **Status Saat Ini:** Menunggu review dan persetujuan pemilik proyek atas seluruh dokumen `docs/01-*.md` hingga `docs/08-*.md`.  
> **Belum ada kode v1 yang dihapus atau diubah** pada tahap ini. Setelah dokumen disetujui, eksekusi **Fase 0** (Git tag `v1-legacy-archive` + inisialisasi Next.js v2.0 di branch `main`) dapat segera dimulai.
