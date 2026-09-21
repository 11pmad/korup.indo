# 📜 LIGA KORUPSI INDONESIA (LKI) — MASTER VIBE CODING & SYSTEM CONTEXT
> **Target Audience:** AI Coding Assistants (Claude, Cursor, GPT-4o, Copilot, Antigravity, Gemini, Windsurf) & Senior Engineers.  
> **Purpose:** Single source of truth for full context, architecture, schema, API contracts, codebase design, and development rules for rapid "vibe coding" without regressions.  
> **Repository:** `ip1mad/korup.indo` | **Versi Dokumen:** 2026.09 (Comprehensive Master Edition)

---

## 1. 🎯 Misi & Identitas Produk (Product Essence)

**Liga Korupsi Indonesia (LKI)** adalah portal edukasi publik, transparansi hukum, dan pemantauan historis perkara tindak pidana korupsi di Indonesia sejak era kemerdekaan (1945) hingga sekarang (September 2026).

### Nilai Inti & Vibe Desain:
1. **Aset Visual & Vibe:** Mengusung estetika *investigative scrapbook*, *newspaper clipping* (kliping koran vintage/arsip intelijen), dipadukan dengan *dashboard cyber-modern*, peta choropleth SVG 38 provinsi yang interaktif, dan grafik data analitik *Recharts*.
2. **Nol Halusinasi (Zero AI Hallucinations):** Setiap fakta hukum (amar putusan, masa kurungan, kerugian negara, pasal terbukti) **wajib** memiliki *provenance* rujukan primer (Direktori Putusan Mahkamah Agung RI, PN Tipikor, SIPP, KPK.go.id, Kejaksaan RI, BPK/BPKP).
3. **Kepatuhan Hukum & Asas Praduga Tak Bersalah (*Presumption of Innocence*):**
   - Mematuhi secara ketat Pasal 8 ayat (1) UU Kekuasaan Kehakiman No. 48/2009.
   - Status Tersangka dan Terdakwa **wajib** dilindungi peringatan hukum (*Disclaimer Banner*).
   - Memisahkan secara tegas antara tuntutan jaksa (dakwaan) dan vonis hakim yang telah berkekuatan hukum tetap (*inkrah*).
4. **Anti Double-Counting Finansial:**
   - $\text{Nilai Proyek} \neq \text{Nilai Kontrak} \neq \text{Nilai Suap/Gratifikasi} \neq \text{Kerugian Keuangan Negara} \neq \text{Uang Pengganti} \neq \text{Denda} \neq \text{Aset Disita}$.
   - Angka-angka finansial dicatat per kategori dan tidak boleh dijumlahkan secara serampangan.

---

## 2. 🛠️ Tech Stack & Spesifikasi Runtime

| Layer | Teknologi & Dependensi Utama | Catatan Penting |
|---|---|---|
| **Runtime & Bundler** | Node.js v22.13+ / Bun 1.4+, Vite 6.2.3, `tsx` (TypeScript Execute) | Kompatibel penuh dengan Bun dan Node.js |
| **Frontend Framework** | React 19.0.1, TypeScript ~5.8.2 | Menggunakan fitur React 19 modern |
| **Styling & Icons** | Tailwind CSS v4.1.14 (`@tailwindcss/vite`), Lucide React 0.546 | Menggunakan konfigurasi CSS-first Tailwind v4 |
| **Motion & Visual** | Motion 12.23 (Framer Motion modern), `canvas-confetti` | Animasi micro-interactions bertema arsip hukum |
| **Data Viz & Maps** | Recharts 3.10.1, Custom GeoJSON SVG Choropleth Map | Peta 38 Provinsi Indonesia (`src/data/provincesGeo.ts`) |
| **Backend Framework** | Express 4.21.2 (TypeScript via `tsx` di `server.ts`) | RESTful modular routes, Rate Limiting, Traffic Logger |
| **Database & ORM** | PostgreSQL 14+, Drizzle ORM (`drizzle-orm`, `drizzle-kit`), `postgres` driver | Dilengkapi ekstensi `pg_trgm` untuk fuzzy search GIN |
| **AI Integration** | `@google/genai` (v2.4.0) | Gemini SDK untuk kurasi berkas & asisten analitik |
| **Keamanan & Utilities**| `dotenv`, `bcryptjs`, JSON Web Token (JWT), `express-rate-limit` | Perlindungan brute-force dan audit log perubahan data |

---

## 3. 📂 Struktur Direktori Lengkap (File Tree & Roadmap)

```text
.
├── .env.example                     # Template variabel lingkungan (DATABASE_URL, GEMINI_API_KEY, PORT)
├── package.json                     # Definisi skrip & dependensi proyek
├── tsconfig.json                    # Konfigurasi TypeScript strict mode
├── vite.config.ts                   # Konfigurasi Vite + React Plugin + Tailwind v4 Vite Plugin
├── index.html                       # Entry HTML aplikasi web
├── server.ts                        # Express server entry point (API + Vite dev/production middleware)
│
├── src/                             # FRONTEND SOURCE CODE
│   ├── main.tsx                     # React root mount
│   ├── App.tsx                      # Main application component & tab/view router
│   ├── index.css                    # Tailwind v4 theme, custom textures, scrollbars, animations
│   ├── types.ts                     # Definisi antarmuka TypeScript Frontend
│   │
│   ├── components/                  # UI COMPONENT MODULES
│   │   ├── Navbar.tsx               # Navigasi utama, status bar, pencarian cepat, theme & modal switch
│   │   ├── DisclaimerBanner.tsx     # Peringatan asas praduga tak bersalah (Pasal 8 ayat 1)
│   │   ├── IndonesiaMap.tsx         # Peta choropleth interaktif 38 provinsi dengan tooltip & zoom
│   │   ├── LeaderboardTable.tsx     # Klasemen ranking korupsi per pejabat, partai, & sektor
│   │   ├── StatsDashboard.tsx       # Visualisasi grafik Recharts (tren tahunan, sektor, kerugian)
│   │   ├── StatsDrilldownModal.tsx  # Modal detail statistik saat grafik/item diklik
│   │   ├── SearchCasesView.tsx      # Case explorer dengan filter multi-dimensi & fuzzy search
│   │   ├── CaseDetailModal.tsx      # Modal berkas perkara lengkap (vonis, timeline, pasal, rujukan)
│   │   ├── ReportModal.tsx          # Modal kanal laporan warga (koreksi data & usulan perkara)
│   │   ├── AdminPanel.tsx           # Panel kurasi super admin (CRUD perkara, verifikasi, audit logs)
│   │   ├── WatercolorLadder.tsx     # Tangga visualisasi scrapbook tingkatan kerugian negara
│   │   └── Footer.tsx               # Catatan kaki, atribusi rujukan hukum, & tombol donasi QRIS
│   │
│   ├── data/
│   │   └── provincesGeo.ts          # Dataset GeoJSON poligon batas spasial 38 provinsi di Indonesia
│   └── utils/                       # Helper functions (pemformatan Rupiah, tanggal hukum, normalisasi nama)
│
├── server/                          # BACKEND SOURCE CODE
│   ├── data.ts                      # In-memory static dataset (fallback jika PostgreSQL belum disetup)
│   ├── db.ts                        # In-Memory DB Engine class dengan filter, search, & sorter
│   ├── gemini.ts                    # Integrasi Google GenAI API untuk fact-checking & ringkasan berkas
│   │
│   ├── db/                          # DATABASE LAYER (PostgreSQL + Drizzle ORM)
│   │   ├── index.ts                 # Koneksi PostgreSQL (`postgres` client + Drizzle instance)
│   │   ├── schema.ts                # 18 Skema tabel Drizzle ORM + Enums + Relations lengkap
│   │   ├── seed.ts                  # Seeder data dasar
│   │   ├── seedFromData.ts          # Seeder importer canonical dataset dari folder data/normalized/
│   │   └── seedReactionsAndComments.ts # Seeder sampel interaksi warga & komentar
│   │
│   ├── middleware/
│   │   └── rateLimit.ts             # Express rate limiter (mencegah DDoS & scraping berlebihan)
│   │
│   └── routes/                      # MODULAR REST API ROUTES
│       ├── cases.ts                 # GET /api/cases (Pencarian & filter perkara)
│       ├── officials.ts             # GET /api/officials (Profil subjek hukum & riwayat jabatan)
│       ├── parties.ts               # GET /api/parties (Klasemen partai politik)
│       ├── provinces.ts             # GET /api/provinces (Agregat statistik 38 provinsi untuk peta)
│       ├── stats.ts                 # GET /api/stats (Tren tahunan, rasio pemulihan aset, hall-of-shame)
│       ├── companies.ts             # GET /api/companies (Daftar & relasi korporasi rekanan)
│       ├── eras.ts                  # GET /api/eras (Master 10 era kepresidenan Indonesia)
│       ├── export.ts                # GET /api/export (Ekspor dataset format CSV / JSON)
│       ├── reports.ts               # POST /api/reports (Penerimaan laporan warga)
│       ├── admin.ts                 # /api/admin (Login JWT, CRUD perkara, manajemen pengguna admin)
│       ├── citizenAuth.ts           # /api/auth/citizen (Registrasi & login pengguna publik)
│       ├── reactions.ts             # /api/reactions (Stance & sentimen reaksi emoji warga)
│       ├── comments.ts              # /api/comments (Komentar & upvote warga pada berkas perkara)
│       └── monitoring.ts            # /api/monitoring & trafficLoggerMiddleware (Observabilitas trafik)
│
└── data/                            # CANONICAL RESEARCH DATASET & MIGRATIONS (1945 - 2026)
    ├── README.md                    # Dokumentasi metodologi riset perkara 1945–2026
    ├── schema/
    │   ├── schema.sql               # PostgreSQL Native DDL (14 tabel, UUID-v4, GIN Index pg_trgm)
    │   └── types.ts                 # TypeScript relational interface untuk dataset riset
    ├── normalized/                  # 13 CANONICAL DATASETS (Format JSON & RFC 4180 CSV)
    │   ├── cases.json / .csv        # 43 Perkara korupsi terverifikasi lintas 10 era
    │   ├── persons.json / .csv      # 43 Subjek hukum/pejabat publik
    │   ├── positions.json / .csv    # 43 Riwayat jabatan saat perkara terjadi
    │   ├── parties.json / .csv      # 11 Partai politik
    │   ├── party_memberships.json   # 16 Riwayat keanggotaan partai subjek hukum
    │   ├── financial_records.json   # 37 Catatan finansial (Anti Double-Counting)
    │   ├── verdicts.json / .csv     # 35 Amar putusan vonis pengadilan (PN/PT/MA)
    │   ├── companies.json / .csv    # 10 Korporasi rekanan yang terlibat
    │   ├── case_companies.json      # 10 Relasi perkara dengan korporasi
    │   ├── locations.json / .csv    # 13 Master lokasi administratif
    │   ├── case_locations.json      # 15 Relasi perkara ke titik geografis
    │   ├── timeline_events.json     # Linimasa peristiwa hukum
    │   └── sources.json / .csv      # 43 Rujukan primer sumber direktori hukum
    ├── sql/
    │   ├── seed.sql                 # Skrip SQL INSERT mentah untuk PostgreSQL
    │   └── analytics_views.sql      # View analitik SQL (Peta, Klasemen, Tren)
    └── scripts/                     # Tooling validasi & ekspor otomatis dataset
```

---

## 4. 🗄️ Database Architecture & Drizzle Schema Specification

Sistem memiliki 18 tabel relasional yang didefinisikan pada [`server/db/schema.ts`](file:///home/ipmad/vault/New%20Folder%20%283%29/New%20Folder%20%281%29/server/db/schema.ts) dan native PostgreSQL di [`data/schema/schema.sql`](file:///home/ipmad/vault/New%20Folder%20%283%29/New%20Folder%20%281%29/data/schema/schema.sql).

### Enum Utama:
- **`legalStatusEnum`**: `'tersangka'`, `'terdakwa'`, `'divonis_inkrah'`, `'bebas'`
- **`sectorCategoryEnum`**: `'pengadaan_barang_jasa'`, `'bansos_bencana'`, `'suap_gratifikasi'`, `'perizinan_sda_tambang'`, `'mafia_peradilan'`
- **`reactionTypeEnum`**: `'geram'`, `'rampok'`, `'memalukan'`, `'didukung'`, `'khilaf_administrasi'`, `'dimaklumi'`, `'tebang_pilih'`, `'kawal_sidang'`
- **`reportStatusEnum`**: `'pending_review'`, `'approved'`, `'rejected'`
- **`adminRoleEnum`**: `'super_admin'`, `'editor'`, `'reviewer'`

### Klasifikasi 10 Era Pemerintahan (`presidential_eras`):
1. `era-orla`: Era Kemerdekaan & Orde Lama (1945 - 1966)
2. `era-orba`: Era Orde Baru (1966 - 1998)
3. `era-habibie`: Reformasi Awal / B.J. Habibie (1998 - 1999)
4. `era-gusdur`: Abdurrahman Wahid (1999 - 2001)
5. `era-megawati`: Megawati Soekarnoputri (2001 - 2004)
6. `era-sby-1`: Susilo Bambang Yudhoyono Periode I (2004 - 2009)
7. `era-sby-2`: Susilo Bambang Yudhoyono Periode II (2009 - 2014)
8. `era-jokowi-1`: Joko Widodo Periode I (2014 - 2019)
9. `era-jokowi-2`: Joko Widodo Periode II (2019 - 2024)
10. `era-prabowo`: Prabowo Subianto (2024 - Sekarang)

### Relasi Kunci Tabel (Drizzle ORM):
- **`cases`** $\leftrightarrow$ **`officials`**:
  - `cases.primary_official_id` $\rightarrow$ `officials.id`
  - Relasi multi-tersangka: via tabel penghubung `case_officials(case_id, official_id, role_in_case)`.
- **`cases`** $\leftrightarrow$ **`companies`**:
  - Many-to-many via `case_companies(case_id, company_id, transaction_role)`.
- **`officials`** $\leftrightarrow$ **`provinces`** & **`parties`**:
  - `officials.province_id` $\rightarrow$ `provinces.id`
  - `officials.party_id` $\rightarrow$ `parties.id`
- **`cases`** $\leftrightarrow$ **`citizen_users`**:
  - Reaksi publik: `case_reactions(case_id, user_id, reaction_type)`
  - Komentar publik: `case_comments(case_id, user_id, content, upvotes_count)`
- **`audit_logs`**:
  - Mencatat rekam jejak setiap aksi admin (`create`, `update`, `delete`, `rollback`, `approve_report`).

---

## 5. 🌐 API Endpoints Contract

Semua endpoint berbasis RESTful di bawah prefix `/api/`:

### Publik (Read-Only):
| Endpoint | Method | Query Parameters / Payload | Deskripsi |
|---|---|---|---|
| `/api/cases` | GET | `q`, `province`, `era`, `status`, `sector`, `sort_by`, `order`, `page`, `limit` | Mengambil daftar kasus dengan fuzzy search & filter |
| `/api/cases/:id` | GET | - | Detail lengkap satu perkara beserta vonis & timeline |
| `/api/officials` | GET | `era`, `province`, `party`, `status`, `sort`, `page`, `limit` | Daftar pejabat terakumulasi ranking kerugian |
| `/api/officials/:id` | GET | - | Profil subjek hukum dan histori perkara terkait |
| `/api/parties` | GET | `sort`, `order` | Klasemen kerugian negara terakumulasi per partai |
| `/api/provinces` | GET | - | Data agregat untuk mewarnai peta Choropleth 38 provinsi |
| `/api/companies` | GET | `sector`, `page`, `limit` | Daftar korporasi rekanan yang terafiliasi korupsi |
| `/api/stats` | GET | - | Ringkasan statistik makro, top kerugian, tren tahunan |
| `/api/stats/trends` | GET | `metric=combined\|loss_only\|cases_only` | Data visualisasi grafik Recharts |
| `/api/eras` | GET | - | Master daftar 10 era kepresidenan |
| `/api/export` | GET | `format=json\|csv`, `type=cases\|officials\|parties` | Download dataset publik |

### Interaksi Warga (Citizen Engagement):
| Endpoint | Method | Payload | Deskripsi |
|---|---|---|---|
| `/api/auth/citizen/register` | POST | `{ username, display_name, password }` | Pendaftaran akun publik warga |
| `/api/auth/citizen/login` | POST | `{ username, password }` | Login warga, mengembalikan token JWT |
| `/api/reactions` | POST | `{ case_id, reaction_type }` (Auth required) | Memberi reaksi sentimen pada perkara |
| `/api/comments` | POST | `{ case_id, content, reaction_type }` | Mengirim komentar diskusi publik |
| `/api/comments/:id/upvote`| POST | - | Memberikan dukungan upvote pada komentar |
| `/api/reports` | POST | `{ case_id, report_type, description, reference_url }` | Mengirim aduan/koreksi data dengan rujukan |

### Admin Kurasi (Protected via JWT Bearer Token):
| Endpoint | Method | Deskripsi |
|---|---|---|
| `/api/admin/login` | POST | Otentikasi admin (`username: admin`, `password: admin123`) |
| `/api/admin/cases` | POST, PUT, DELETE | Modifikasi langsung berkas perkara peradilan |
| `/api/admin/officials` | POST, PUT, DELETE | Modifikasi entitas subjek hukum & afiliasi partai |
| `/api/admin/reports/:id` | PUT | Moderasi & verifikasi laporan publik (`approve` / `reject`) |
| `/api/admin/audit-logs` | GET | Melihat audit trail perubahan database |
| `/api/admin/monitoring/stats`| GET | Metrik performa server, RPS, latency, & log trafik |

---

## 6. 🎨 Desain Sistem & Frontend UI Guidelines

### Tema Visual:
- **Style:** *"Investigative Scrapbook Meets Modern Cyber Transparency"*
- **Palet Warna Utama:**
  - Background: Cream/Ivory hangat paper aesthetic (`#FBF9F4` / `bg-[#FBF9F4]`) atau dark investigation board (`#121417`).
  - Border: Stamped/grunge dashed lines, stempel peradilan merah (`#DC2626`), stempel arsip hijau (`#16A34A`), emas mahkamah (`#D97706`).
  - Badge Status Hukum:
    - `Divonis Inkrah`: Merah tebal bergaris ganda / Stempel Sah Pengadilan.
    - `Tersangka` / `Terdakwa`: Kuning peringatan (dilengkapi asas praduga tak bersalah).
    - `Bebas/SP3`: Abu-abu netral / Hijau pemulihan nama baik.
- **Tipografi:** Font judul bernuansa serif/typewriter arsip hukum dipadukan dengan sans-serif modern yang sangat mudah dibaca untuk data tabular.

### Komponen Utama:
- **`IndonesiaMap.tsx`:** Menampilkan peta interaktif 38 provinsi di Indonesia menggunakan data poligon SVG dari [`src/data/provincesGeo.ts`](file:///home/ipmad/vault/New%20Folder%20%283%29/New%20Folder%20%281%29/src/data/provincesGeo.ts). Mendukung hover tooltip (nama provinsi, total kasus, akumulasi kerugian) dan klik untuk memfilter data seluruh dashboard.
- **`LeaderboardTable.tsx`:** Tabel "klasemen liga" korupsi dengan pagination, filter partai politik, filter status hukum, dan pengurutan dinamis berdasarkan nominal kerugian negara atau tahun kejadian.
- **`StatsDashboard.tsx`:** Panel grafik analitik interaktif menggunakan Recharts (tren kurva waktu, diagram donat sektor/modus perkara, dan bar chart perbandingan partai).

---

## 7. ⚖️ Aturan Hukum, Etika Data & Anti-Halusinasi (Guardrails)

Bagi AI Model yang melakukan penulisan kode (*coding*), manipulasi data, atau penambahan fitur di repositori ini, **wajib mematuhi 5 aturan mutlak berikut:**

1. **Aturan Asas Praduga Tak Bersalah:**
   - Dilarang keras melabeli individu sebagai "Koruptor" jika status hukumnya masih `Tersangka` atau `Terdakwa` dan belum ada putusan inkrah pengadilan.
   - Jangan pernah menghapus banner peringatan [`src/components/DisclaimerBanner.tsx`](file:///home/ipmad/vault/New%20Folder%20%283%29/New%20Folder%20%281%29/src/components/DisclaimerBanner.tsx).
2. **Aturan Anti Double-Counting:**
   - Dilarang menjumlahkan nilai proyek pengadaan (misal: BTS Kominfo Rp28T) dengan nilai kerugian keuangan negara hasil audit BPKP (Rp8,03T). Yang dihitung sebagai kerugian negara adalah hasil audit kerugian peradilan resmi.
3. **Netralitas Temporal & Politik:**
   - Pembagian 10 era pemerintahan murni bersifat metadata kronologis. Dilarang menambahkan bias opini subjektif.
4. **Integritas Rujukan Hukum Primer:**
   - Setiap berkas perkara baru harus menyertakan URL rujukan kredibel (`putusan3.mahkamahagung.go.id`, `kpk.go.id`, `kejaksaan.go.id`, atau media nasional terverifikasi Dewan Pers).
5. **Integritas TypeScript & Clean Code:**
   - Kode harus lulus `npm run lint` (`tsc --noEmit`).
   - Pertahankan seluruh komentar dan *docstrings* yang sudah ada.

---

## 8. 💻 Perintah Kerja (CLI & Developer Workflow)

### Menjalankan Server Pengembangan:
```bash
# Menjalankan Express + Vite Dev Server secara simultan
npm run dev
# Akses di: http://localhost:3000
```

### Typechecking & Verifikasi Kode:
```bash
npm run lint
```

### Build untuk Produksi:
```bash
npm run build
# Menghasilkan dist/ (Vite static assets) & dist/server.cjs (Bundle backend Node.js)
npm run start
```

### Database & Adminer via Docker:
```bash
# Menjalankan Adminer untuk inspeksi database secara visual
docker run -d --name lki-adminer -p 8080:8080 --network host adminer
# Akses di: http://localhost:8080 (System: PostgreSQL, Server: localhost, DB: lki_db)
```

### Validasi & Kompilasi Dataset Historis:
```bash
# Kompilasi ulang dataset JSON & CSV di folder data/
bun run data/scripts/build_all.ts
# Validasi integritas relasi dataset
bun run data/scripts/validate.ts
```

---

*Dokumen ini dirancang sebagai context primer bagi AI Coding Assistants. Simpan dan rujuk dokumen ini saat meminta AI melakukan refactoring, menambahkan fitur baru, memodifikasi UI, atau memperluas pangkalan data perkara.*
