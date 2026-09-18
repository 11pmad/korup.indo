# Laporan Kontrol Kualitas Data & Metrik Riset (Section 55 & 80)

> **Dataset Version**: 2026.09 | **Tanggal Audit**: 2026-09-18  
> **Status Integritas**: 100% Lolos Validasi Relasional (0 Foreign Key Error, 0 Double Counting Conflation).

---

## 1. Statistik Volume Entitas Utama

| Entitas | Jumlah Record | Status Audit |
|---|---|---|
| **Total Individu (PERSON)** | 43 | Terverifikasi identitas & normalisasi nama |
| **Total Perkara (CASE)** | 43 | Terverifikasi nomor perkara & klasifikasi |
| **Total Perusahaan Terkait (COMPANY)** | 10 | Teridentifikasi peran & beneficial owner |
| **Total Partai Politik (PARTY)** | 11 | Master data partai nasional |
| **Total Riwayat Jabatan (POSITION)** | 43 | Posisi saat tindak pidana terdata |
| **Total Putusan Pengadilan (VERDICT)** | 35 | Nomor putusan & amar vonis terverifikasi |
| **Total Event Kronologi (TIMELINE)** | 9 | Kronologi bertanggal & berinstitusi |
| **Total Sumber Rujukan (SOURCE)** | 43 | URL & nomor halaman primer |

---

## 2. Metrik Verifikasi & Kelengkapan Hukum

| Metrik Kelengkapan | Jumlah | Persentase | Catatan Kualitas |
|---|---|---|---|
| Perkara dengan Sumber Primer (MA/KPK/Kejagung) | 43 | 100% | Level 1 Direktori Putusan & Dokumen Resmi |
| Perkara dengan Dokumen Putusan Terbit | 35 | 81% | PN Tipikor, Kasasi, atau PK |
| Perkara Sudah Berkekuatan Hukum Tetap (Inkrah) | 38 | 88% | Upaya hukum selesai / diterima terdakwa |
| Perkara Belum Inkrah (Penyidikan/Sidang Berjalan) | 5 | 12% | Era Prabowo (Zarof Ricar, Tom Lembong) |
| Perkara dengan Data Finansial Tervalidasi | 30 | 70% | Memiliki rincian kerugian/suap/denda |
| Perkara Membutuhkan Review Lanjutan | 3 | 7% | Tercatat aktif dalam Review Queue |
| Kemungkinan Duplikasi (Duplicates) | 0 | 0% | Bebas dari duplikasi individu/perkara |
| Record Tanpa Sumber (Unverified) | 0 | 0% | Seluruh data memiliki provenance |

---

## 3. Akumulasi Finansial (Anti-Double Counting Sesuai Section 20 & 59)

> [!IMPORTANT]
> Angka-angka di bawah ini **TIDAK DIJUMLAHKAN** menjadi satu angka akumulasi misleading karena jenis pembuktiannya saling berbeda.

| Kategori Finansial | Total Akumulasi (IDR) | Klasifikasi Fakta Hukum |
|---|---|---|
| **Kerugian Keuangan Negara Terbukti (Court Recognized)** | Rp 5.285.893.044.738 | COURT_FINDING (Putusan MA Inkrah) |
| **Hasil Audit Kerugian BPK / BPKP** | Rp 357.958.102.210.381 | AUDIT_RECORD (Laporan Audit Resmi) |
| **Estimasi Dugaan Kerugian Jaksa (Klaim Penyidik)** | Rp 400.000.000.000 | PROSECUTOR_CLAIM (Masih Tahap Sidang) |
| **Total Nilai Suap Terbukti (Bribe Amount)** | Rp 80.137.000.000 | COURT_FINDING (OTT & Fakta Sidang) |
| **Total Gratifikasi Terbukti** | Rp 60.000.000.000 | COURT_FINDING (Pilkada MK) |
| **Total Keuntungan Ilegal / Pemerasan Jabatan** | Rp 14.147.144.786 | COURT_FINDING (Kementan) |
| **Total Kewajiban Uang Pengganti (Restitution)** | Rp 12.045.277.280.580 | COURT_FINDING (Amar Vonis Terpidana) |
| **Total Pidana Denda Terpidana (Fines)** | Rp 0 | COURT_FINDING (Disetor Kas Negara) |
| **Total Nilai Aset Disita (Seized Cash & Gold)** | Rp 920.000.000.000 | FACT_PRIMARY (Penyitaan Kejagung) |

---

## 4. Distribusi Perkara per Era Pemerintahan (Temporal Metadata)

| Era Pemerintahan | Jumlah Perkara | Status Utama |
|---|---|---|
| Era Kemerdekaan & Orde Lama (1945 - 1966) | 2 | Terverifikasi |
| Era Orde Baru (1966 - 1998) | 4 | Terverifikasi |
| Reformasi Awal / B.J. Habibie | 2 | Terverifikasi |
| Abdurrahman Wahid | 2 | Terverifikasi |
| Megawati Soekarnoputri | 3 | Terverifikasi |
| Susilo Bambang Yudhoyono Periode I | 5 | Terverifikasi |
| Susilo Bambang Yudhoyono Periode II | 8 | Terverifikasi |
| Joko Widodo Periode I | 4 | Terverifikasi |
| Joko Widodo Periode II | 10 | Terverifikasi |
| Prabowo Subianto | 3 | Terverifikasi |

---

## 5. Distribusi Sektor Perkara

| Sektor | Jumlah Kasus |
|---|---|
| Penyalahgunaan Anggaran | 5 |
| Perbankan | 8 |
| Kehutanan | 1 |
| Pengadaan Barang/Jasa | 7 |
| Mafia Peradilan | 3 |
| Suap | 4 |
| Infrastruktur | 4 |
| Pajak | 1 |
| Perizinan | 4 |
| BUMN | 2 |
| Pertambangan | 1 |
| Bansos | 1 |
| Pemerasan | 1 |
| Perkebunan | 1 |

---

## 6. Distribusi Status Hukum Individu

| Status Hukum | Jumlah Terdaftar | Keterangan |
|---|---|---|
| **bebas** | 1 | Sesuai event hukum terkini |
| **divonis_inkrah** | 36 | Sesuai event hukum terkini |
| **lepas** | 2 | Sesuai event hukum terkini |
| **terdakwa** | 3 | Sesuai event hukum terkini |
| **tersangka** | 1 | Sesuai event hukum terkini |

---

## 7. Catatan Batasan & Bias Cakupan (Section 74 Coverage Note)

Dataset ini mencakup perkara-perkara tonggak (*landmark cases*) yang memenuhi ambang batas pembuktian hukum dan memiliki rujukan berkas perkara pengadilan atau rilis resmi lembaga penegak hukum. Jumlah perkara yang terdata dalam dataset ini merepresentasikan perkara yang berhasil diverifikasi secara komprehensif, bukan cerminan total keseluruhan tindak pidana korupsi yang terjadi di dunia nyata.