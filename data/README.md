# Database Historis Perkara Korupsi Indonesia (1945 – Sekarang)
**Liga Korupsi Indonesia (LKI) Data Layer & Fact-Checking Repository**

Dataset historis terstruktur mengenai perkara tindak pidana korupsi di Indonesia sejak Era Kemerdekaan (17 Agustus 1945), Orde Lama, Orde Baru (1966–1998), hingga Era Reformasi dan era kepresidenan saat ini (September 2026). Dibangun sesuai dengan standar riset hukum tertinggi, bebas dari halusinasi model AI, memiliki *source provenance* berjenjang (Direktori Putusan Mahkamah Agung RI, Pengadilan Negeri/Tipikor, KPK, Kejaksaan RI, BPK/BPKP), memisahkan tuntutan vs vonis, dan menerapkan asas ketat **anti double counting**.

---

## 📁 Struktur Direktori & Berkas Dataset

```text
data/
├── README.md                            # Dokumentasi dataset & metodologi riset (1945–2026)
├── schema/
│   ├── schema.sql                       # DDL PostgreSQL lengkap (14 tabel, UUID-v4, GIN Index)
│   └── types.ts                         # Definisi tipe TypeScript & skema relasional 10 era
├── master/
│   ├── master_cases.json                # Master Hierarchical JSON sesuai Bagian 53
│   └── master_cases.compact.json        # Versi JSON ringkas tanpa whitespace
├── normalized/                          # 13 Canonical Datasets (JSON & RFC 4180 CSV)
│   ├── persons.json / .csv              # [A] Master Person Dataset (43 records)
│   ├── positions.json / .csv            # [B] Master Position History Dataset (43 records)
│   ├── parties.json / .csv              # [C] Master Political Party Dataset (11 records)
│   ├── party_memberships.json / .csv    # [D] Master Party Membership Dataset (16 records)
│   ├── cases.json / .csv                # [E] Master Case Dataset (43 records lintas 10 era)
│   ├── case_persons.json / .csv         # [F] Master Case-Person Involvement Dataset (43 records)
│   ├── financial_records.json / .csv    # [G] Master Financial Dataset (37 records, Anti Double Counting)
│   ├── verdicts.json / .csv             # [H] Master Court Verdict Dataset (35 records)
│   ├── timeline_events.json / .csv      # [I] Master Case Timeline Dataset (9 records)
│   ├── companies.json / .csv            # [J] Master Related Company Dataset (10 records)
│   ├── case_companies.json / .csv       # [K] Master Case-Company Relationship Dataset (10 records)
│   ├── locations.json / .csv            # [L] Master Location Dataset (13 records)
│   ├── case_locations.json / .csv       # Relasi Perkara dengan Lokasi Administratif (15 records)
│   └── sources.json / .csv              # [M] Master Provenance & Source Repository (43 records)
├── quality/
│   ├── review_queue.json                # Antrean Perkara yang Membutuhkan Review/Verifikasi
│   ├── data_quality_report.json         # Laporan Metrik Kualitas Mesin (Bagian 55 & 80)
│   └── data_quality_report.md           # Laporan Naratif Kualitas Data & Metrik Multidimensi
├── sql/
│   ├── seed.sql                         # Skrip INSERT SQL untuk inisialisasi database PostgreSQL
│   └── analytics_views.sql              # VIEW Analitik (Klasemen, Peta Choropleth, Sektor, Era)
└── scripts/
    ├── build_all.ts                     # Eksekutor pipeline otomatis seluruh proses kompilasi & audit
    ├── build_datasets_part1.ts          # Generator master entitas (Sources, Parties, Persons, Companies)
    ├── build_datasets_part2.ts          # Generator perkara (Cases, Case-Persons, Financials 1945–2026)
    ├── build_datasets_part3.ts          # Generator vonis, relasi spasial/korporasi & master hierarchical JSON
    ├── export_csv.ts                    # Konverter otomatis JSON ke format CSV standar RFC 4180
    ├── generate_sql.ts                  # Generator skrip SQL seed dari dataset normalisasi
    ├── generate_quality_report.ts       # Generator laporan audit kualitas & metrik statistik
    └── validate.ts                      # Pengujian otomatis integritas relasional & anti-double-counting
```

---

## ⚖️ Metodologi & Prinsip Riset (Master Prompt v2026.09)

1. **Nol Halusinasi & Provenance Primer**:
   Setiap fakta hukum (amar vonis, hukuman penjara, denda, kerugian negara, pasal terbukti) bersumber langsung dari dokumen peradilan resmi (Direktori Putusan Mahkamah Agung RI, PN Istimewa Jakarta, PN Tipikor, SIPP, KPK, atau Kejaksaan RI). Data yang tidak terverifikasi diberi nilai `null` dan dijelaskan pada `verification_note`.
2. **Pemisahan Status Hukum & Asas Praduga Tak Bersalah**:
   Sistem membedakan secara tegas Tersangka, Terdakwa, Terpidana (Divonis Bersalah), serta Putusan Bebas / Lepas (*onslag van alle rechtsvervolging*).
3. **Pemisahan Tuntutan Jaksa vs Putusan Hakim**:
   Tuntutan pidana penuntut umum tidak pernah disamakan dengan vonis pengadilan.
4. **Anti Double Counting Finansial**:
   Nilai proyek $\neq$ Nilai kontrak $\neq$ Nilai suap $\neq$ Nilai gratifikasi $\neq$ Keuntungan ilegal $\neq$ Kerugian negara $\neq$ Uang pengganti $\neq$ Denda $\neq$ Aset disita. Seluruh angka dipisah dalam entitas `FINANCIAL_RECORD` dengan `fact_classification` yang terverifikasi.
5. **Netralitas Temporal 10 Era Pemerintahan**:
   Pengelompokan 10 era kepresidenan (Era Kemerdekaan & Orde Lama, Orde Baru, B.J. Habibie, Abdurrahman Wahid, Megawati Soekarnoputri, Susilo Bambang Yudhoyono I–II, Joko Widodo I–II, Prabowo Subianto) berfungsi murni sebagai metadata kronologis tanpa penarikan kesimpulan kausalitas moral/politik.

---

## 🏛️ Cakupan Kasus Tonggak Historis (1945 – 1998)

1. **Kasus Percetakan De Unie & Roeslan Abdulgani (1956 - Era Orde Lama)**:
   Penyelidikan Polisi Militer dan Kejaksaan Agung RI (Jaksa Agung Soeprapto) terkait barter devisa cetak uang dan surat suara di NV De Unie. Menlu Roeslan Abdulgani dibebaskan oleh komisi kabinet setelah tidak terbukti menikmati keuntungan pribadi.
2. **Kasus Teuku Jusuf Muda Dalam (1966 - Era Orde Lama)**:
   Menteri Urusan Bank Sentral / Gubernur BI divonis **Pidana Mati** oleh Pengadilan Negeri Istimewa Jakarta (No. 4001/1966 Pid.Subv) atas korupsi devisa lisensi deferred payment dan penggelapan dana revolusi. Terpidana wafat di tahanan militer sebelum eksekusi hukuman mati.
3. **Kasus Dolog Kalimantan Timur Budiadji (1976/1977 - Era Orde Baru)**:
   Kepala Dolog Kaltim divonis **Penjara Seumur Hidup** oleh PN Samarinda (No. 12/Pid/1977) atas korupsi kas daerah & beras Bulog Rp7,607 miliar (diubah via Grasi Presiden 1980 menjadi 20 tahun penjara).
4. **Kasus Valas Bank Duta Dicky Iskandar Di Nata (1990/1992 - Era Orde Baru)**:
   Dirut Bank Duta divonis 8 tahun penjara dan kewajiban ganti rugi perdata Rp811 miliar oleh PN Jakarta Pusat jo. Kasasi MA atas transaksi spekulasi valuta asing ilegal lepas kendali sebesar USD 419,6 juta.
5. **Kasus Pembobolan L/C Bapindo Eddy Tansil (1994 - Era Orde Baru)**:
   Pemilik PT Golden Key Group divonis 17 tahun penjara, denda Rp30 juta, dan uang pengganti Rp500 miliar atas pembobolan Letter of Credit kredit macet Bapindo Rp1,3 triliun. Melarikan diri dari LP Cipinang pada 4 Mei 1996.
6. **Gugatan Perdata PMH Yayasan Supersemar / H.M. Soeharto (Era Orde Baru)**:
   Putusan Peninjauan Kembali Mahkamah Agung No. 140 PK/Pdt/2015 menghukum Yayasan Supersemar membayar ganti rugi kepada negara sebesar USD 315 juta dan Rp139,2 miliar (total setara Rp4,44 triliun) atas penyalahgunaan dana beasiswa BUMN untuk korporasi swasta terafiliasi.

---

## 🚀 Panduan Penggunaan & Validasi

### 1. Menjalankan Kompilasi Penuh & Validasi
```bash
bun run scripts/build_all.ts
```

### 2. Menjalankan Validasi Integritas Relasional Saja
```bash
bun run scripts/validate.ts
```

### 3. Mengimpor ke PostgreSQL
```bash
psql -U postgres -d lki_db -f schema/schema.sql
psql -U postgres -d lki_db -f sql/seed.sql
psql -U postgres -d lki_db -f sql/analytics_views.sql
```
