# Liga Korupsi Indonesia (LKI) v2.0

> **Portal Edukasi Publik & Transparansi Data Perkara Tindak Pidana Korupsi Indonesia (1945–2026)**  
> Dibangun ulang dari awal di atas arsitektur **Next.js App Router (SSR/ISR) + React 19 + TypeScript Strict + Tailwind CSS v4 + Drizzle ORM + PostgreSQL (`pg_trgm`)**.

---

## Dokumentasi Pra-Produksi & Spesifikasi Arsitektur

Seluruh cetak biru produk, skema database terpadu, kontrak API, keamanan, kepatuhan hukum, dan checklist produksi tersedia di folder [`docs/`](./docs/README.md):
- [01-PRD.md](./docs/01-PRD.md) — Spesifikasi modul fungsional & 5 guardrails hukum
- [02-ARCHITECTURE.md](./docs/02-ARCHITECTURE.md) — Arsitektur Next.js + Vercel + PostgreSQL
- [03-DATABASE_SCHEMA.md](./docs/03-DATABASE_SCHEMA.md) — Skema Drizzle ORM terpadu (28 tabel) & Anti Double-Counting
- [04-API_AND_DATA_CONTRACTS.md](./docs/04-API_AND_DATA_CONTRACTS.md) — Kontrak REST API `/api/v1/*` & rate limiting
- [05-UI_UX_DESIGN_SYSTEM.md](./docs/05-UI_UX_DESIGN_SYSTEM.md) — Sistem desain, WCAG 2.1 AA, & SEO
- [06-SECURITY_LEGAL_AND_COMPLIANCE.md](./docs/06-SECURITY_LEGAL_AND_COMPLIANCE.md) — Keamanan OWASP, RBAC 6 peran, Hak Jawab & UU PDP
- [07-DEPLOYMENT_AND_PRODUCTION_CHECKLIST.md](./docs/07-DEPLOYMENT_AND_PRODUCTION_CHECKLIST.md) — Panduan Vercel + Neon/Supabase
- [08-REBUILD_ROADMAP.md](./docs/08-REBUILD_ROADMAP.md) — Peta jalan rebuild & pengamanan arsip `v1-legacy-archive`

---

## Menjalankan Secara Lokal

1. **Salin dan lengkapi `.env`:**
   ```bash
   cp .env.example .env
   ```
   Pastikan PostgreSQL aktif dan ekstensi `pg_trgm` serta `pgcrypto` telah diaktifkan pada database target.

2. **Instalasi dependensi (Bun):**
   ```bash
   bun install
   ```

3. **Migrasi Skema, Seeding Data Kanonik (`data/normalized/`) & Bootstrap Super Admin:**
   ```bash
   bun run db:push
   bun run db:seed
   bun run db:bootstrap-admin
   ```

4. **Jalankan Server Development:**
   ```bash
   bun run dev
   ```
   Akses aplikasi di `http://localhost:3000` dan Portal Kurasi di `http://localhost:3000/admin`.

---

## Perintah Pengujian & Build Produksi

```bash
bun run typecheck      # Verifikasi TypeScript strict (tsc --noEmit)
bun run data:validate  # Validasi integritas dataset kanonik di data/
bun run test           # Jalankan unit test Vitest
bun run build          # Build produksi Next.js
```

---

## Prinsip Kepatuhan Hukum & Etika Data

1. **Asas Praduga Tak Bersalah (Pasal 8 ayat (1) UU No. 48/2009):** Status `tersangka`/`terdakwa` selalu diberi penanda belum inkrah dan tidak ditampilkan di *Hall of Shame* inkrah.
2. **Anti Double-Counting Finansial:** Nilai proyek, kontrak, audit BPK/BPKP, kerugian vonis pengadilan, suap/gratifikasi, uang pengganti, dan denda dipisahkan secara ketat.
3. **Kewajiban Sumber Primer:** Setiap perkara wajib memiliki rujukan resmi (Direktori Putusan Mahkamah Agung RI, KPK, Kejaksaan RI, atau media terverifikasi Dewan Pers).
4. **Kanal Hak Jawab:** Tersedia di `/lapor` dengan kode tiket pelacakan publik dan prioritas moderasi kurator.
