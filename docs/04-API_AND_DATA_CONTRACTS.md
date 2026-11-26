# 04 — Kontrak REST API, Server Actions & Validasi Data

> **Prefix API Terpadu:** `/api/v1/*`  
> **Format Transport:** JSON (`application/json`) dan CSV (`text/csv; charset=utf-8` khusus endpoint ekspor)  
> **Standar Validasi:** Zod v4 di *boundary* seluruh Route Handlers & Server Actions

---

## 1. Standar Envelope Respons & Kode Status HTTP

Seluruh endpoint JSON menggunakan amplop respons seragam agar klien frontend dan konsumen eksternal mudah memprosesnya:

### Sukses (`200 OK` / `201 Created`):
```json
{
  "success": true,
  "data": {},
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 43,
    "total_pages": 3,
    "disclaimer": "Sesuai Pasal 8 ayat (1) UU No. 48/2009, subjek berstatus tersangka/terdakwa dilindungi asas praduga tak bersalah."
  }
}
```

### Gagal (`4xx` / `5xx`):
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "URL sumber rujukan hukum primer wajib disertakan.",
    "details": [
      { "field": "sources", "issue": "Minimal 1 URL sumber valid diperlukan" }
    ]
  }
}
```

| HTTP Status | Kode Error Standar | Kondisi Penggunaan |
|---|---|---|
| `400` | `VALIDATION_ERROR` | Payload atau query params tidak lolos skema Zod. |
| `401` | `UNAUTHORIZED` | Cookie sesi tidak ada, tidak valid, atau kedaluwarsa. |
| `403` | `FORBIDDEN` | Peran RBAC tidak mencukupi atau email warga belum terverifikasi OTP. |
| `404` | `NOT_FOUND` | Slug/ID perkara, tokoh, atau kode tiket laporan tidak ditemukan. |
| `409` | `CONFLICT` | Duplikasi username, email, slug, atau data unik lainnya. |
| `429` | `RATE_LIMITED` | Melebihi batas permintaan (disertai header `Retry-After`). |
| `500` | `INTERNAL_ERROR` | Kegagalan tak terduga (pesan detail disamarkan di produksi). |

---

## 2. Katalog Endpoint Publik (`/api/v1/*`)

| Endpoint | Method | Query Params / Payload | Deskripsi & Catatan |
|---|---|---|---|
| `/api/v1/cases` | `GET` | `q`, `province`, `era`, `status`, `sector`, `sort=loss\|date\|title`, `order=asc\|desc`, `page`, `limit` | Pencarian *fuzzy* `pg_trgm` & filter multi-dimensi perkara. |
| `/api/v1/cases/[slug]` | `GET` | - | Detail lengkap perkara: subyek (`case_persons`), finansial terpisah (`financial_records`), vonis berjenjang (`verdicts`), kronologi (`timeline_events`), korporasi, dan sumber primer (`sources`). |
| `/api/v1/officials` | `GET` | `era`, `province`, `party`, `status`, `q`, `sort`, `page`, `limit` | Klasemen pejabat/subjek hukum terfilter. |
| `/api/v1/officials/[slug]` | `GET` | - | Profil lengkap tokoh beserta riwayat jabatan (`positions`), afiliasi partai (`party_memberships`), dan semua perkaranya. |
| `/api/v1/parties` | `GET` | `era`, `sort`, `page`, `limit` | Klasemen partai berdasarkan kader yang berstatus aktif saat tindak pidana terjadi (`party_at_offense = true`). |
| `/api/v1/provinces` | `GET` | `era`, `sector`, `status` | Agregat statistik 38 provinsi + `nasional` untuk mewarnai peta choropleth. |
| `/api/v1/companies` | `GET` | `sector`, `q`, `page`, `limit` | Daftar korporasi rekanan beserta jumlah perkara & nilai kontrak/transaksi terkait. |
| `/api/v1/eras` | `GET` | - | Master daftar 10 era kepresidenan berurutan kronologis (1945–sekarang). |
| `/api/v1/stats/overview` | `GET` | `era` (opsional) | Ringkasan makro, *Hall of Shame* (khusus `divonis_inkrah`), dan *Asset Recovery Rate*. |
| `/api/v1/stats/trends` | `GET` | `metric=combined\|loss_only\|cases_only` | Data grafik tren tahunan & distribusi sektor untuk Recharts. |
| `/api/v1/settings/public` | `GET` | - | Mengambil teks `announcement` dan konfigurasi `donation` QRIS dari tabel `site_settings`. |
| `/api/v1/export` | `GET` | `type=cases\|persons\|parties\|companies\|provinces`, `format=csv\|json`, `era`, `status` | Unduh dataset terbuka (CSV RFC 4180 dengan BOM UTF-8 atau JSON). |

---

## 3. Katalog Endpoint Interaksi Warga (`/api/v1/*`)

| Endpoint | Method | Auth | Payload / Fungsi |
|---|---|---|---|
| `/api/v1/auth/citizen/register` | `POST` | Publik | `{ username, displayName, email, password, originProvince?, originCity? }` — Memicu pengiriman OTP 6 digit ke email. |
| `/api/v1/auth/citizen/verify-otp` | `POST` | Publik | `{ email, code }` — Memverifikasi OTP (maks 5 kali salah sebelum kedaluwarsa), menerbitkan `HttpOnly` cookie sesi warga. |
| `/api/v1/auth/citizen/resend-otp` | `POST` | Publik | `{ email }` — Mengirim ulang OTP dengan jeda minimal 60 detik. |
| `/api/v1/auth/citizen/login` | `POST` | Publik | `{ identifier, password }` — Login username/email, menerbitkan `HttpOnly` cookie sesi warga. |
| `/api/v1/auth/citizen/google` | `POST` | Publik | `{ idToken }` — Verifikasi ID Token Google di server (`OAuth2Client.verifyIdToken`), buat/sinkronkan akun warga. |
| `/api/v1/auth/citizen/logout` | `POST` | Warga | Menghapus cookie sesi warga. |
| `/api/v1/auth/citizen/me` | `GET`, `PATCH`, `DELETE` | Warga | Mengambil profil, memperbarui profil, atau menghapus akun mandiri (kepatuhan UU PDP). |
| `/api/v1/cases/[id]/reactions` | `GET`, `POST` | `GET`: Publik, `POST`: Warga | Mengambil agregat 8 sentimen reaksi atau toggle/ubah reaksi user pada perkara (`{ reactionType }`). |
| `/api/v1/cases/[id]/comments` | `GET`, `POST` | `GET`: Publik, `POST`: Warga | Daftar komentar visible berpaginasi atau kirim komentar baru (`{ content, reactionType? }`). |
| `/api/v1/comments/[id]/upvote` | `POST` | Warga | Toggle upvote komentar. |
| `/api/v1/reports` | `POST` | Publik / Warga | `{ caseId?, reportType, description, referenceUrl, submitterContact? }` — Mengembalikan `{ trackingCode: "LKI-2026-XXXX" }`. |
| `/api/v1/reports/track/[code]` | `GET` | Publik | Mengecek status pengajuan laporan atau Hak Jawab berdasarkan kode tiket tanpa membuka identitas pelapor. |

---

## 4. Katalog Endpoint Portal Admin (`/api/v1/admin/*`)

Seluruh endpoint di bawah wajib memiliki cookie sesi admin yang valid serta lolos pengecekan peran RBAC (`requireAdminRole`):

| Endpoint | Method | Minimal Role | Deskripsi |
|---|---|---|---|
| `/api/v1/admin/auth/login` | `POST` | Publik (Rate-limited) | `{ username, password }` — Cek *lockout*, verifikasi bcrypt, terbitkan cookie `lki_admin_session`. |
| `/api/v1/admin/auth/logout` | `POST` | Semua Staf | Menghapus cookie sesi admin. |
| `/api/v1/admin/auth/me` | `GET` | Semua Staf | Mengembalikan profil dan role staf aktif. |
| `/api/v1/admin/cases` | `GET`, `POST` | `editor` | List perkara (termasuk catatan review) atau buat perkara baru beserta `financial_records`, `verdicts`, dan `sources`. |
| `/api/v1/admin/cases/[id]` | `PATCH`, `DELETE` | `editor` (`DELETE`: `admin`) | Update/hapus perkara, otomatis memicu `computeCaseDisplayFinancials()`, `revalidateTag()`, dan penulisan `audit_logs`. |
| `/api/v1/admin/persons` | `GET`, `POST`, `PATCH` | `editor` | CRUD tokoh publik, riwayat jabatan, dan keanggotaan partai. |
| `/api/v1/admin/companies` | `GET`, `POST`, `PATCH` | `editor` | CRUD korporasi dan informasi *beneficial owner*. |
| `/api/v1/admin/ai-curator` | `POST` | `editor` | `{ message, history[] }` — Ekstraksi terstruktur via Gemini API (hanya menghasilkan draf jika sumber URL valid terdeteksi). |
| `/api/v1/admin/review-queue` | `GET`, `PATCH` | `reviewer` | Melihat daftar antrean disparitas sumber dan menandai selesai (`resolved`). |
| `/api/v1/admin/reports` | `GET` | `moderator` | Daftar laporan warga & Hak Jawab (diurutkan dengan prioritas `hak_jawab` di atas). |
| `/api/v1/admin/reports/[id]` | `PATCH` | `moderator` / `reviewer` | `{ status: 'approved' \| 'rejected', moderatorNote }` — Mencatat audit log. |
| `/api/v1/admin/comments/[id]` | `PATCH` | `moderator` | Menyembunyikan (`is_hidden = true`) atau memulihkan komentar warga dengan alasan moderasi. |
| `/api/v1/admin/settings` | `GET`, `PUT` | `admin` / `super_admin` | Memperbarui `announcement` atau `donation` pada `site_settings` + invalidasi cache. |
| `/api/v1/admin/users` | `GET`, `POST`, `PATCH` | `super_admin` | Mengelola akun staf admin, peran RBAC, dan status aktif/nonaktif. |
| `/api/v1/admin/audit-logs` | `GET` | `auditor` | Menelusuri log perubahan data tidak dapat diubah (*immutable*). |
| `/api/v1/admin/monitoring` | `GET` | `auditor` / `admin` | Statistik trafik anonim, rasio status HTTP, dan metrik kesehatan DB. |

---

## 5. Endpoint Operasional & Cron

| Endpoint | Method | Proteksi | Fungsi |
|---|---|---|---|
| `/api/health` | `GET` | Publik | Melakukan `SELECT 1` ke PostgreSQL dan mengembalikan status `{ status: "ok", db: "connected" }`. |
| `/api/cron/maintenance` | `GET` | `Authorization: Bearer <CRON_SECRET>` | Menghapus `visitor_logs` lebih tua dari 30 hari dan membersihkan `rate_limit_buckets` yang sudah kedaluwarsa. |

---

## 6. Kontrak Validasi Kritis (Zod Rules)

1. **Validasi URL Sumber Primer (`sourceUrlSchema`):**
   - Wajib menggunakan protokol `https://` (atau `http://` khusus domain resmi pemerintah lama bila perlu), panjang wajar, dan tidak boleh mengarah ke IP privat/localhost (pencegahan SSRF).
2. **Validasi Konsistensi Status Hukum (`casePayloadSchema`):**
   - Jika `current_legal_status` adalah `divonis_inkrah`, sistem mewajibkan minimal 1 entri `verdicts` dengan `decision_number` dan `is_final = true`.
   - Jika masih `tersangka` atau `terdakwa`, `verdicts` dengan `is_final = true` tidak boleh ada.
3. **Kontrak Structured Output AI Curator:**
   - Gemini SDK dipanggil dengan `responseSchema` (JSON Schema) ketat sehingga hasil tidak pernah keluar dari format `AiCuratorResponse` (`isDraftReady`, `message`, `missingFields`, `draft`).

---

## 7. Kebijakan Rate Limiting (PostgreSQL-Backed)

| Tier | Endpoint Tercakup | Batas Maksimal | Window |
|---|---|---|---|
| `auth_strict` | `/api/v1/auth/citizen/login`, `register`, `verify-otp`, `/api/v1/admin/auth/login` | **10 permintaan** | 15 menit / IP |
| `write_citizen` | `POST /reports`, `POST /comments`, `POST /reactions` | **20 permintaan** | 15 menit / IP+User |
| `export_heavy` | `GET /api/v1/export` | **15 permintaan** | 1 jam / IP |
| `ai_curator` | `POST /api/v1/admin/ai-curator` | **30 permintaan** | 1 jam / Admin User |
| `public_read` | Endpoint `GET /api/v1/*` lainnya | **120 permintaan** | 1 menit / IP |
