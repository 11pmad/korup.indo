# Liga Korupsi Indonesia (LKI)

> **Portal Edukasi & Transparansi Data Perkara Korupsi Indonesia Berbasis Web**  
> Mengemas data perkara korupsi (bersumber dari putusan pengadilan inkrah, dakwaan resmi KPK/Kejaksaan Agung, dan rilis lembaga penegak hukum) ke dalam format "klasemen liga", peta spasial choropleth 38 provinsi, grafik analitik sektor & korporasi rekanan, mesin pencari berkas perkara, serta perlindungan asas praduga tak bersalah.

---

## 🚀 Tech Stack

| Layer | Teknologi |
|---|---|
| **Runtime & Package Manager** | [Bun](https://bun.sh) (v1.4+) |
| **Frontend** | React 19 + TypeScript + Vite + Tailwind CSS |
| **Visualisasi** | Recharts (grafik garis/area/donat), Custom SVG Choropleth Map |
| **Ikon** | Lucide React |
| **State & Data Fetching** | TanStack Query / React Hooks |
| **Backend API** | Express.js + Bun native runtime / TypeScript |
| **Database** | PostgreSQL + Ekstensi `pg_trgm` (GIN search index) |
| **ORM & Migrations** | Drizzle ORM (`drizzle-orm` & `drizzle-kit`) |
| **Validasi & Keamanan** | Zod, JSON Web Token (JWT), `bcryptjs`, `express-rate-limit` |

---

## 📦 Panduan Instalasi & Menjalankan

### 1. Prasyarat Sistem
- Pastikan **PostgreSQL** sudah berjalan lokal (default port: `5432`).
- Pastikan **Bun** telah terinstal di sistem (`curl -fsSL https://bun.sh/install | bash`).

### 2. Setup Environment Variables (`.env`)
Salin berkas contoh `.env.example` menjadi `.env`:
```bash
cp .env.example .env
```
Isi konfigurasi database dan JWT secret:
```env
DATABASE_URL="postgres://postgres@localhost:5432/lki_db"
JWT_SECRET="lki-super-secret-jwt-key-2026-indonesia-maju"
PORT=3000
APP_URL="http://localhost:3000"
GEMINI_API_KEY="" # Opsional untuk asisten AI kurasi
```

### 3. Buat Database & Aktifkan Ekstensi `pg_trgm`
```bash
psql -U postgres -c "CREATE DATABASE lki_db;"
psql -U postgres -d lki_db -c "CREATE EXTENSION IF NOT EXISTS pg_trgm;"
```

### 4. Instalasi Dependensi
```bash
bun install
```

### 5. Migrasi Skema Database (Drizzle ORM)
Push 13 tabel dan GIN trgm index ke PostgreSQL:
```bash
bun run db:push
```

### 6. Seeding Data Dummy Realistis
Isi database dengan data awal 38 provinsi, era kepresidenan, partai politik, rekanan korporasi, dan 12 kasus contoh berlabel `[CONTOH/DUMMY]`:
```bash
bun run db:seed
```

### 7. Jalankan Server Development
```bash
bun run dev
```
Buka browser di **[http://localhost:3000](http://localhost:3000)**.

---

## 🔑 Kredensial Admin Default

Panel kurator admin dapat diakses di menu **Admin Kurasi**:
- **Username**: `admin`
- **Password**: `admin123`
- **Role**: `super_admin`

---

## 📡 Daftar Endpoint RESTful API

| Method | Endpoint | Keterangan |
|---|---|---|
| `GET` | `/api/officials?era=&province=&party=&status=&sort=&page=` | Daftar klasemen pejabat publik terfilter |
| `GET` | `/api/officials/:id` | Detail profil pejabat beserta riwayat perkara |
| `GET` | `/api/parties?era=&sort=&page=` | Klasemen akumulasi kerugian per partai politik |
| `GET` | `/api/provinces` | Agregat 38 provinsi untuk peta choropleth |
| `GET` | `/api/cases?q=&province=&era=&status=&sector=&page=` | Case explorer dengan search fuzzy & debouncing |
| `GET` | `/api/cases/:id` | Detail berkas perkara lengkap (vonis, timeline, rujukan) |
| `GET` | `/api/companies?sector=&page=` | Daftar korporasi rekanan proyek |
| `GET` | `/api/companies/:id` | Drill-down korporasi dan relasi transaksi perkara |
| `GET` | `/api/stats/trends?metric=combined\|loss_only\|cases_only` | Tren tahunan kerugian & volume perkara (Recharts) |
| `GET` | `/api/stats/sectors` | Komposisi modus/sektor korupsi (grafik donat) |
| `GET` | `/api/stats/hall-of-shame` | Top 10 kerugian terbesar vonis inkrah |
| `GET` | `/api/export?type=officials\|parties\|provinces` | Ekspor data terfilter ke format CSV |
| `POST` | `/api/reports` | Kanal partisipasi warga (koreksi data & putusan baru) |
| `POST` | `/api/admin/login` | Otentikasi admin via JWT |
| `GET/POST/PUT/DELETE` | `/api/admin/cases` | CRUD berkas kasus peradilan *(Wajib JWT)* |
| `GET/POST/PUT/DELETE` | `/api/admin/officials` | CRUD pejabat publik *(Wajib JWT)* |
| `GET/PUT` | `/api/admin/reports/:id` | Moderasi & verifikasi laporan publik *(Wajib JWT)* |
| `GET` | `/api/admin/audit-logs` | Audit trail perubahan data *(Wajib JWT)* |

---

## ⚖️ Kepatuhan Hukum & Etika Data

1. **Asas Praduga Tak Bersalah**: Setiap entri atau filter berstatus `Tersangka` atau `Terdakwa` secara otomatis memunculkan banner peringatan hukum Pasal 8 ayat (1) UU Kekuasaan Kehakiman. Tombol dismiss hanya berlaku per sesi peramban (`sessionStorage`) dan tidak permanen.
2. **Kewajiban Sumber Resmi (`source_url`)**: Sistem menolak input perkara tanpa tautan rujukan resmi yang valid (Direktori Putusan Mahkamah Agung RI, KPK.go.id, atau rilis pers resmi Kejaksaan RI).
3. **Data Uji Coba**: Seluruh data testing diberi label eksplisit `[CONTOH/DUMMY — BUKAN DATA NYATA]` guna mencegah misinformasi publik selama masa pengujian.
