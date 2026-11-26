# 01 — Product Requirements Document (PRD) & Kepatuhan Hukum

> **Produk:** Liga Korupsi Indonesia (LKI) v2.0  
> **Domain:** Portal Transparansi Perkara Tindak Pidana Korupsi & Edukasi Hukum Publik  
> **Cakupan Temporal:** 17 Agustus 1945 – Sekarang (10 Era Pemerintahan Republik Indonesia)

---

## 1. Visi Produk & Tujuan Utama

**Liga Korupsi Indonesia (LKI)** hadir untuk menjembatani kesenjangan antara dokumen putusan hukum yang kompleks (PDF putusan pengadilan, dakwaan, laporan audit BPK/BPKP) dan pemahaman publik yang cepat, akurat, serta dapat diaudit.

### Tujuan Strategis v2.0:
1. **Akurasi Hukum Mutlak:** Menyajikan status hukum, amar putusan, dan rincian finansial yang terverifikasi sumber primer tanpa halusinasi.
2. **Aksesibilitas & Keterindeksan Publik (SEO):** Setiap berkas perkara dan profil tokoh memiliki URL kanonik permanen (`/kasus/[slug]`, `/tokoh/[slug]`) yang dirender di server (SSR/ISR) agar mudah dirujuk jurnalis, akademisi, dan mesin pencari.
3. **Transparansi Spasial & Sektoral:** Memetakan persebaran perkara pada 38 provinsi Indonesia serta klaster perkara tingkat nasional/pusat.
4. **Partisipasi Sipil Terukur:** Menyediakan ruang diskusi warga yang beradab dan kanal pengajuan koreksi data serta **Hak Jawab** dengan nomor tiket pelacakan.

---

## 2. Metrik Keberhasilan (Success Metrics)

| Kategori | Metrik | Target Produksi v2.0 |
|---|---|---|
| **Integritas Data** | Persentase perkara dengan sumber rujukan primer (`sources`) | **100%** (Nol perkara tanpa URL rujukan) |
| **Kepatuhan Hukum** | Kesalahan pelabelan status hukum (`tersangka`/`terdakwa` vs `inkrah`) | **0** kasus |
| **Kepatuhan Finansial** | Insiden *double-counting* nilai proyek ke kerugian negara | **0** kasus |
| **SLA Hak Jawab** | Waktu tanggap koreksi jika ada putusan Bebas/Lepas/PK resmi | **Maksimal 2×24 jam** |
| **Performa Web** | Core Web Vitals — Largest Contentful Paint (LCP) | **< 2,5 detik** (4G mobile & desktop) |
| **SEO & Aksesibilitas** | Skor Lighthouse Accessibility & SEO | **≥ 95 / 100** |

---

## 3. Target Pengguna (User Personas)

| Persona | Kebutuhan Utama | Fitur Kunci yang Digunakan |
|---|---|---|
| **Warga & Pelajar** | Memahami gambaran besar kasus korupsi di daerahnya dan dampak kerugian negara secara visual & mudah dicerna. | Beranda, Peta 38 Provinsi, Klasemen Liga, Reaksi & Diskusi Warga. |
| **Jurnalis & Peneliti** | Mendapatkan angka pasti (kerugian vonis vs audit vs suap), nomor putusan pengadilan, rujukan sumber asli, dan ekspor data mentah. | Pencarian Lanjutan, Halaman Detail Berkas (`/kasus/[slug]`), Open Data (CSV/JSON). |
| **Pelapor & Subjek Terkait** | Mengajukan pembaruan status putusan baru (misal kasasi/PK), mengoreksi kesalahan ketik, atau mengajukan **Hak Jawab** resmi. | Kanal Lapor (`/lapor`), Pelacakan Tiket (`/lapor?kode=LKI-...`). |
| **Kurator / Editor LKI** | Menginput perkara baru dengan cepat menggunakan AI Curator *Human-in-the-Loop*, memverifikasi laporan warga, dan memoderasi komentar. | Portal Admin (`/admin`), AI Curator, Review Queue, Moderasi Laporan. |
| **Super Admin / Auditor** | Mengelola peran staf, mengaudit riwayat perubahan data (*audit trail*), memantau kesehatan trafik, serta mengatur pengumuman & donasi QRIS. | Manajemen User Admin, Audit Logs, Monitoring, Pengaturan Situs. |

---

## 4. Spesifikasi Modul Fungsional & Acceptance Criteria

### M1 — Beranda (`/`)
- **Fungsi:** Menyajikan ringkasan makro nasional, sorotan perkara era terkini, *Hall of Shame* (khusus perkara berstatus **Divonis Inkrah** dengan kerugian terbesar), pratinjau peta mini, dan akses cepat ke seluruh modul.
- **Acceptance Criteria:**
  - `DisclaimerBanner` hukum wajib muncul permanen di atas konten utama.
  - *Hall of Shame* **hanya** menampilkan subjek hukum dengan status `divonis_inkrah` atau `divonis_bersalah` yang telah berkekuatan hukum tetap (dilarang mencantumkan `tersangka`/`terdakwa` di *Hall of Shame*).
  - Angka agregat total kerugian menampilkan catatan metodologi bahwa angka dihitung berdasarkan aturan *Anti Double-Counting*.

### M2 — Peta Spasial Interaktif 38 Provinsi (`/peta`)
- **Fungsi:** Visualisasi *choropleth* SVG 38 provinsi Indonesia (termasuk 6 provinsi Papua terkini) + panel khusus klaster **Nasional / Pusat** (untuk kasus kementerian/BUMN pusat yang tidak terikat satu provinsi saja).
- **Acceptance Criteria:**
  - Hover/fokus keyboard pada provinsi menampilkan tooltip nama provinsi, jumlah perkara, dan total kerugian negara terakumulasi.
  - Klik provinsi membuka *drawer/panel* daftar perkara pada provinsi tersebut beserta tautan ke `/kasus/[slug]`.
  - Mendukung filter berdasarkan **Era Kepresidenan**, **Kelompok Pulau**, **Sektor**, dan **Status Hukum**.

### M3 — Klasemen Liga Korupsi (`/klasemen`)
- **Fungsi:** Papan peringkat interaktif dalam 3 mode tampilan tab:
  1. **Klasemen Pejabat / Subjek Hukum** (peringkat berdasarkan kerugian negara terbukti / suap terpisah).
  2. **Klasemen Partai Politik** (akumulasi perkara & kerugian dari kader yang menjabat/aktif saat tindak pidana terjadi, merujuk `party_memberships.party_at_offense`).
  3. **Klasemen Korporasi Rekanan** (daftar perusahaan yang terlibat dalam pengadaan/suap beserta *beneficial owner* bila terverifikasi).
- **Acceptance Criteria:**
  - Tabel memiliki paginasi server-side, pengurutan dinamis (kerugian, jumlah kasus, tahun terbaru), serta filter Era, Provinsi, Sektor, dan Status Hukum.
  - Subjek yang belum inkrah wajib menampilkan badge peringatan praduga tak bersalah langsung di baris tabel.

### M4 — Mesin Pencari & Halaman Detail Berkas (`/cari`, `/kasus/[slug]`, `/tokoh/[slug]`)
- **Fungsi:**
  - `/cari`: Pencarian *fuzzy* PostgreSQL (`pg_trgm`) lintas judul perkara, nama pejabat, nomor putusan, nama perusahaan, dan kronologi; sinkron dengan *URL query params* agar tautan pencarian dapat dibagikan.
  - `/kasus/[slug]`: Halaman berkas perkara lengkap berbasis SSR/ISR dengan metadata SEO unik.
  - `/tokoh/[slug]`: Halaman profil individu (riwayat jabatan `positions`, riwayat keanggotaan partai `party_memberships`, daftar perkara terkait).
- **Acceptance Criteria halaman `/kasus/[slug]`:**
  - Menampilkan **Badge Status Hukum** yang tegas (`Tersangka`, `Terdakwa`, `Divonis Inkrah`, `Bebas`, `Lepas`, dll.).
  - Memisahkan secara visual kartu **Rincian Finansial**: Kerugian Negara (Vonis vs Audit BPK/BPKP vs Dugaan Jaksa), Suap/Gratifikasi, Uang Pengganti, Pidana Denda, Nilai Proyek (sebagai konteks, bukan kerugian), dan Aset Disita/Dipulihkan.
  - Menampilkan **Tabel Perbandingan Tuntutan Jaksa vs Amar Putusan Hakim** (PN Tipikor, Banding PT, Kasasi MA, PK).
  - Menampilkan **Linimasa Peristiwa Peradilan** (`timeline_events`), daftar korporasi terkait, dan **Kotak Sumber Primer** (`source_title`, `source_institution`, `source_page`, `source_excerpt`, dan tautan eksternal `rel="noopener noreferrer"`).

### M5 — Statistik & Analitik Makro (`/statistik`)
- **Fungsi:** Dasbor visualisasi tren historis (Recharts) dan analitik struktural:
  1. Grafik tren tahunan jumlah perkara & kerugian negara (toggle: *Gabungan*, *Volume Kasus*, *Nominal Kerugian*).
  2. Distribusi lintas **10 Era Pemerintahan (1945–Sekarang)** dengan keterangan netralitas kronologis.
  3. Diagram proporsi sektor & modus operandi korupsi.
  4. Metrik **Rasio Pemulihan Aset (*Asset Recovery Rate*)**: perbandingan total Uang Pengganti + Denda + Aset Disita terhadap total Kerugian Keuangan Negara Terbukti.

### M6 — Partisipasi Warga (`/lapor` & Komunitas Perkara)
- **Fungsi:**
  - **Akun Warga:** Registrasi email + verifikasi kode OTP 6 digit (berlaku 15 menit) atau masuk dengan **Google OAuth**. Pengguna dapat mengelola profil (nama tampilan, provinsi/kota asal, bio, avatar).
  - **Reaksi Sentimen Perkara:** 8 jenis reaksi publik (`geram`, `rampok`, `memalukan`, `didukung`, `khilaf_administrasi`, `dimaklumi`, `tebang_pilih`, `kawal_sidang`) — 1 reaksi aktif per akun per perkara (dapat diubah/dibatalkan).
  - **Diskusi Komentar:** Komentar warga terikat pada perkara dengan dukungan *upvote* serta mekanisme penyembunyian otomatis/manual bila melanggar etika atau mengandung ujaran kebencian/fitnah.
  - **Kanal Laporan Warga & Hak Jawab (`/lapor`):** Formulir pengajuan `koreksi_data`, `rujukan_putusan_baru`, `usulan_kasus_baru`, atau `hak_jawab` dengan lampiran URL sumber wajib. Mengembalikan **Kode Tiket** (contoh: `LKI-2026-A8F2`) agar pelapor bisa memantau status (`pending_review`, `approved`, `rejected`) beserta catatan moderator.

### M7 — Open Data & Ekspor (`/open-data`)
- **Fungsi:** Halaman katalog terbuka untuk peneliti/jurnalis mengunduh dataset terkurasi dalam format **CSV (RFC 4180)** dan **JSON** berlisensi **CC BY 4.0**, lengkap dengan kamus skema kolom dan metodologi penghitungan.
- **Acceptance Criteria:** Ekspor mendukung filter parameter (`type=cases|persons|parties|companies|provinces`, `era`, `status`, `format=csv|json`) serta dilindungi *rate limit* ketat.

### M8 — Portal Kurasi Admin & AI Curator (`/admin/*`)
- **Fungsi:** Portal staf terisolasi (tema gelap *investigation board*) dengan otorisasi RBAC 6 peran (`super_admin`, `admin`, `editor`, `moderator`, `auditor`, `reviewer`):
  - **Ringkasan & Monitoring:** Metrik sistem, antrean laporan masuk, antrean *review queue*, dan grafik trafik pengunjung anonim.
  - **Manajemen Perkara, Tokoh, Partai, Korporasi:** Form CRUD terstruktur termasuk pengelolaan `financial_records`, `verdicts`, `timeline_events`, dan `sources`.
  - **AI Curator (Human-in-the-Loop):** Antarmuka percakapan dengan Google Gemini (`@google/genai`) untuk mengekstrak draf JSON terstruktur dari berita/putusan yang ditempel admin. Sistem **wajib menolak membuat draf siap publikasi jika tidak ada URL sumber primer yang valid**. Draf wajib direview dan disetujui admin sebelum masuk tabel publik.
  - **Review Queue:** Meninjau perkara yang ditandai `needs_manual_review` atau memiliki disparitas angka antar sumber.
  - **Moderasi Laporan & Komentar:** Menyetujui/menolak laporan warga & Hak Jawab; menyembunyikan/memulihkan komentar warga.
  - **Pengaturan Situs:** Mengubah teks banner pengumuman legal dan konfigurasi QRIS donasi langsung ke database (`site_settings`).
  - **Audit Logs:** Log permanen (*immutable*) setiap aksi `create`, `update`, `delete`, `approve_report`, `reject_report`, `rollback` lengkap dengan *before/after snapshot*.

---

## 5. Lima Aturan Mutlak (Guardrails) Hukum & Etika Data

1. **Asas Praduga Tak Bersalah (Pasal 8 ayat (1) UU No. 48/2009):**
   - Setiap orang yang disangka, ditangkap, ditahan, dituntut, atau dihadapkan di depan pengadilan wajib dianggap tidak bersalah sebelum ada putusan pengadilan yang menyatakan kesalahannya dan telah memperoleh kekuatan hukum tetap (*inkrah*).
   - Dilarang melabeli `tersangka`/`terdakwa` sebagai "Koruptor" atau "Terpidana" di UI, judul SEO, maupun ringkasan AI.
   - `DisclaimerBanner` wajib tampil dan tidak boleh dihapus secara permanen dari aplikasi.
2. **Aturan Anti Double-Counting Finansial:**
   - Dilarang keras menjumlahkan `project_value` / `contract_value` dengan `court_recognized_loss_amount` atau `audit_loss_amount`.
   - Dilarang menjumlahkan `audit_loss_amount` dan `court_recognized_loss_amount` untuk perkara yang sama pada agregat kerugian negara.
3. **Kewajiban Sumber Primer (`source_url` & `source_excerpt`):**
   - Setiap entitas perkara dan angka finansial wajib ditautkan ke dokumen resmi (`putusan3.mahkamahagung.go.id`, `sipp.*`, `kpk.go.id`, `kejaksaan.go.id`, `bpk.go.id`) atau media nasional terverifikasi Dewan Pers.
4. **Pemisahan Tuntutan vs Vonis:**
   - Tuntutan Jaksa Penuntut Umum dicatat terpisah dan tidak boleh ditampilkan sebagai hukuman final sebelum majelis hakim memutus perkara.
5. **Netralitas Temporal 10 Era Kepresidenan:**
   - Pengelompokan 10 era (Orde Lama s/d Prabowo Subianto) bersifat klasifikasi kronologis murni tanpa narasi partisan atau kesimpulan kausalitas subjektif.
