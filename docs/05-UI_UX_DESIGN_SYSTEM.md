# 05 — Sistem Desain UI/UX, Aksesibilitas & Identitas Visual

> **Arah Estetika:** *"Investigative Archival Dossier & Scrapbook Meets Modern Data Journalism"*  
> Mempertahankan karakter unik arsip kliping LKI yang akrab di mata publik Indonesia, sembari meningkatkan keterbacaan angka finansial, hirarki informasi hukum, dan standar aksesibilitas WCAG 2.1 AA.

---

## 1. Palet Warna & Design Tokens (Tailwind CSS v4)

Seluruh warna didefinisikan dalam `@theme` di `src/app/globals.css` agar konsisten di seluruh komponen:

### 1.1 Tema Publik (Archival Paper & Ink)
| Token | Hex | Penggunaan |
|---|---|---|
| `--color-paper-bg` | `#FAF7EE` | Latar belakang utama aplikasi (tekstur *dot-grid* halus `#E8DFCA`). |
| `--color-paper-card` | `#FFFDF9` | Kartu arsip, berkas perkara, polaroid pejabat, dan modal. |
| `--color-paper-muted` | `#F3EDE0` | Baris tabel bergantian, blok kutipan `source_excerpt`, panel filter. |
| `--color-ink-primary` | `#1C1917` | Judul, teks utama, nominal uang (rasio kontras > 12:1 di atas `#FFFDF9`). |
| `--color-ink-secondary` | `#57534E` | Label metadata, jabatan, keterangan tanggal, subjudul. |
| `--color-border-archival` | `#D6CBB5` | Garis tepi solid/putus-putus (*stitched-border*) kartu arsip. |

### 1.2 Semantik Status Hukum (Wajib Konsisten & Tidak Ambigu)
| Status Hukum | Warna Teks/Border | Warna Latar | Ikon & Gaya Stempel |
|---|---|---|---|
| **Divonis Inkrah / Bersalah** | `#B91C1C` (Crimson Red) | `#FEF2F2` | Stempel ganda `Gavel` — tegas bahwa putusan berkekuatan hukum tetap. |
| **Tersangka / Terdakwa / Dituntut / Banding / Kasasi** | `#B45309` (Judicial Amber) | `#FFFBEB` | Badge peringatan `Scale` — selalu disertai label **"Belum Inkrah — Praduga Tak Bersalah"**. |
| **Bebas / Lepas (Onslag)** | `#15803D` (Emerald Green) | `#F0FDF4` | Stempel `ShieldCheck` — penegasan pemulihan status hukum. |
| **Meninggal / Status Lain** | `#475569` (Slate) | `#F1F5F9` | Badge netral arsip historis. |

### 1.3 Portal Kurasi Admin (Investigation Board Dark Theme)
| Token | Hex | Penggunaan |
|---|---|---|
| `--color-admin-bg` | `#0B0F19` | Latar utama portal `/admin/*`. |
| `--color-admin-surface` | `#111827` | Sidebar, kartu statistik, panel form kurasi. |
| `--color-admin-border` | `#1F2937` | Pemisah antar modul admin. |
| `--color-admin-accent` | `#EF4444` / `#F59E0B` | Aksi kurasi penting, badge antrean laporan/review pending. |

---

## 2. Sistem Tipografi (`next/font/google`)

Menggunakan `next/font/google` di `src/app/layout.tsx` untuk menghilangkan *layout shift* (CLS) dan menghindari *render-blocking external stylesheets*:

| Font Family | CSS Variable | Peran Penggunaan |
|---|---|---|
| **Plus Jakarta Sans** (400, 500, 600, 700, 800) | `--font-sans` | Seluruh teks bacaan panjang, kronologi perkara, navigasi, form, dan label tabel. |
| **Patrick Hand** (400) | `--font-hand` | Judul seksi editorial, stempel status hukum scrapbook, label *washi tape* dekoratif. |
| **Caveat** (600, 700) | `--font-note` | Catatan kaki kurator atau *sticky-note* kontekstual. |
| **JetBrains Mono** (400, 500, 700) | `--font-mono` | **Wajib** memakai `tabular-nums` untuk seluruh nominal Rupiah (`Rp 8,03 T`), nomor putusan pengadilan, kode tiket laporan, dan tanggal resmi. |

---

## 3. Spesifikasi Komponen UI Kunci

1. **`DisclaimerBanner` (Permanen & Aksesibel):**
   - Tampil di atas area konten utama seluruh halaman publik.
   - Mengutip Pasal 8 ayat (1) UU No. 48 Tahun 2009 tentang Kekuasaan Kehakiman dan tautan cepat ke metodologi & kanal Hak Jawab.
   - Tidak boleh dihilangkan secara permanen; status tutup hanya opsional untuk mode ringkas per sesi dan tetap menyisakan *bar* pengingat tipis.

2. **`FinancialBreakdownCard` (Anti Double-Counting Visual):**
   - Pada `/kasus/[slug]`, angka finansial tidak boleh ditampilkan sebagai satu angka tunggal yang ambigu.
   - Terdiri dari kompartemen terpisah dengan label klasifikasi sumber:
     - **Kerugian Negara (Putusan Pengadilan / Audit BPK-BPKP)**
     - **Suap / Gratifikasi / Pemerasan**
     - **Kewajiban Terpidana (Uang Pengganti & Denda)**
     - **Konteks Proyek / Aset Disita** (diberi catatan eksplisit *"Bukan bagian dari total kerugian negara"*).

3. **`IndonesiaChoroplethMap` (38 Provinsi + Klaster Nasional):**
   - Menggunakan poligon SVG 38 provinsi dari `src/data/provincesGeo.ts` dengan pewarnaan gradasi intensitas kasus/kerugian.
   - Dilengkapi tombol kontrol zoom/reset, chip terpisah untuk **Kasus Tingkat Nasional / Pusat**, *floating tooltip* saat hover, serta **tabulasi daftar provinsi aksesibel** di bawah peta untuk pengguna layar kecil (*mobile*) dan pembaca layar.

4. **`PolaroidOfficialCard` (Klasemen & Profil):**
   - Menampilkan foto tokoh (dengan *fallback* inisial SVG aman jika URL foto eksternal gagal dimuat), jabatan saat perkara terjadi, afiliasi partai saat kejadian, serta stempel status hukum yang kontras.

5. **Efek Mikro & Audio Opsional:**
   - Animasi transisi memakai CSS ringan dan Motion dengan menghormati `prefers-reduced-motion: reduce`.
   - Efek suara kertas/stempel (di v1 `audio.ts`) bersifat **opt-in / default muted** dengan tombol toggle jelas di Navbar.

---

## 4. Standar Aksesibilitas (WCAG 2.1 AA)

- **Kontras Warna:** Seluruh teks isi, label badge status hukum, dan tautan memiliki rasio kontras minimal **4.5:1** (teks besar minimal **3:1**).
- **Navigasi Keyboard:** Seluruh poligon provinsi pada peta memiliki `tabIndex={0}`, `role="button"`, dan `aria-label="Provinsi [Nama], [X] perkara, total kerugian [Rp Y]"`.
- **Semantik HTML & ARIA:** Navigasi memakai `<nav>`, konten utama `<main>`, modal memakai *focus trap* dan penutupan dengan tombol `Escape`.
- **Responsivitas Mobile-First:** Tabel klasemen pada layar `< 768px` beralih secara rapi ke tampilan kartu daftar atau *horizontal scroll container* dengan kolom nama tetap (*sticky*) tanpa memotong informasi status hukum.

---

## 5. Standar SEO, Metadata & Shareability

- **Dynamic Metadata (`generateMetadata`):**
  - Halaman `/kasus/[slug]` menghasilkan judul format: `Perkara [Judul Ringkas] ([Status Hukum]) — Liga Korupsi Indonesia`.
  - Deskripsi meta merangkum nominal terverifikasi dan lembaga penegak hukum tanpa melabeli tersangka/terdakwa sebagai koruptor.
- **Dynamic OpenGraph Image (`opengraph-image.tsx`):**
  - Menghasilkan kartu gambar sosial `1200x630` otomatis per kasus (menampilkan judul perkara, stempel status hukum, nominal, dan era) untuk dibagikan di X/Twitter, WhatsApp, dan media sosial.
- **Structured Data (JSON-LD):**
  - Root layout: `WebSite` + `Dataset` (`license: CC BY 4.0`, `spatialCoverage: ID`).
  - Halaman detail kasus: `Article` / `Report` dengan `citation` menuju dokumen sumber primer.
