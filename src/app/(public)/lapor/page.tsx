'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Flag, Search, CheckCircle2, Clock, XCircle } from 'lucide-react';

function LaporFormInner() {
  const sp = useSearchParams();
  const initialCaseId = sp.get('caseId') || '';
  const initialType = (sp.get('type') as any) || 'koreksi_data';
  const initialCode = sp.get('kode') || '';

  const [reportType, setReportType] = useState<'koreksi_data' | 'rujukan_putusan_baru' | 'usulan_kasus_baru' | 'hak_jawab'>(
    ['koreksi_data', 'rujukan_putusan_baru', 'usulan_kasus_baru', 'hak_jawab'].includes(initialType)
      ? initialType
      : 'koreksi_data'
  );
  const [caseId, setCaseId] = useState(initialCaseId);
  const [referenceUrl, setReferenceUrl] = useState('');
  const [description, setDescription] = useState('');
  const [contact, setContact] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [createdCode, setCreatedCode] = useState('');

  const [trackCode, setTrackCode] = useState(initialCode);
  const [trackResult, setTrackResult] = useState<any>(null);
  const [trackError, setTrackError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setCreatedCode('');
    setSubmitting(true);
    try {
      const res = await fetch('/api/v1/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caseId: caseId || null,
          reportType,
          referenceUrl,
          description,
          submitterContact: contact,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json?.error?.message || 'Gagal mengirim pengajuan.');
        return;
      }
      setCreatedCode(json.data.trackingCode);
      setTrackCode(json.data.trackingCode);
      setDescription('');
      setReferenceUrl('');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleTrack(e: React.FormEvent) {
    e.preventDefault();
    setTrackError('');
    setTrackResult(null);
    const res = await fetch(`/api/v1/reports/track/${encodeURIComponent(trackCode.trim())}`);
    const json = await res.json();
    if (!res.ok) {
      setTrackError(json?.error?.message || 'Tiket tidak ditemukan.');
      return;
    }
    setTrackResult(json.data);
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <section className="lg:col-span-7 archival-card p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Flag className="w-5 h-5 text-red-700" />
          <h2 className="font-hand text-2xl font-bold text-stone-900">
            Formulir Pengajuan Publik & Hak Jawab
          </h2>
        </div>

        {createdCode && (
          <div className="rounded-xl border-2 border-emerald-500 bg-emerald-50 p-4 space-y-1">
            <p className="text-sm font-bold text-emerald-950">Pengajuan Berhasil Diterima!</p>
            <p className="text-xs text-emerald-900">
              Simpan kode tiket berikut untuk memantau progres verifikasi kurator:{' '}
              <strong className="font-mono text-base">{createdCode}</strong>
            </p>
          </div>
        )}

        {error && (
          <div role="alert" className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-xs font-semibold text-red-800">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="rep-type" className="block text-xs font-bold text-stone-700 mb-1">
              Jenis Pengajuan
            </label>
            <select
              id="rep-type"
              value={reportType}
              onChange={(e) => setReportType(e.target.value as any)}
              className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm"
            >
              <option value="koreksi_data">Koreksi Data / Kesalahan Angka atau Status</option>
              <option value="rujukan_putusan_baru">Pembaruan Putusan Baru (Banding / Kasasi / PK)</option>
              <option value="usulan_kasus_baru">Usulan Penambahan Perkara Baru</option>
              <option value="hak_jawab">Hak Jawab Resmi / Putusan Bebas / SP3 (Prioritas SLA 2×24 Jam)</option>
            </select>
          </div>

          {caseId && (
            <div>
              <label htmlFor="rep-case" className="block text-xs font-bold text-stone-700 mb-1">
                ID Berkas Terkait
              </label>
              <input
                id="rep-case"
                type="text"
                value={caseId}
                onChange={(e) => setCaseId(e.target.value)}
                className="w-full rounded-lg border border-stone-300 bg-stone-50 px-3 py-2 font-mono text-xs"
              />
            </div>
          )}

          <div>
            <label htmlFor="rep-url" className="block text-xs font-bold text-stone-700 mb-1">
              URL Sumber Resmi / Putusan Pengadilan (Wajib)
            </label>
            <input
              id="rep-url"
              type="url"
              required
              placeholder="https://putusan3.mahkamahagung.go.id/..."
              value={referenceUrl}
              onChange={(e) => setReferenceUrl(e.target.value)}
              className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label htmlFor="rep-desc" className="block text-xs font-bold text-stone-700 mb-1">
              Uraian Fakta & Penjelasan (min. 20 karakter)
            </label>
            <textarea
              id="rep-desc"
              rows={5}
              required
              minLength={20}
              placeholder="Jelaskan bagian data yang perlu diperbaiki atau detail perkara baru beserta nomor putusan..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-lg border border-stone-300 bg-white p-3 text-sm"
            />
          </div>

          <div>
            <label htmlFor="rep-contact" className="block text-xs font-bold text-stone-700 mb-1">
              Kontak Pelapor (Opsional — Dirahasiakan Sesuai UU PDP)
            </label>
            <input
              id="rep-contact"
              type="text"
              placeholder="Email atau kontak untuk konfirmasi kurator"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-red-700 py-3 text-sm font-bold text-white hover:bg-red-800 disabled:opacity-50"
          >
            {submitting ? 'Mengirim Pengajuan...' : 'Kirim Laporan & Dapatkan Kode Tiket'}
          </button>
        </form>
      </section>

      <section className="lg:col-span-5 archival-card p-6 space-y-4 h-fit">
        <div className="flex items-center gap-2">
          <Search className="w-5 h-5 text-stone-700" />
          <h2 className="font-hand text-2xl font-bold text-stone-900">
            Lacak Status Tiket Laporan
          </h2>
        </div>

        <form onSubmit={handleTrack} className="flex gap-2">
          <input
            type="text"
            required
            placeholder="Contoh: LKI-2026-A1B2"
            value={trackCode}
            onChange={(e) => setTrackCode(e.target.value)}
            className="flex-1 rounded-lg border border-stone-300 bg-white px-3 py-2 font-mono text-sm uppercase"
          />
          <button
            type="submit"
            className="rounded-lg bg-stone-900 px-4 py-2 text-xs font-bold text-white hover:bg-stone-800"
          >
            Lacak
          </button>
        </form>

        {trackError && (
          <p className="text-xs font-semibold text-red-700">{trackError}</p>
        )}

        {trackResult && (
          <div className="rounded-xl border border-stone-200 bg-[#FBF8F1] p-4 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-stone-900">{trackResult.tracking_code}</span>
              <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-bold bg-stone-200 text-stone-900">
                {trackResult.status === 'approved' ? (
                  <><CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" /> Disetujui</>
                ) : trackResult.status === 'rejected' ? (
                  <><XCircle className="w-3.5 h-3.5 text-red-700" /> Ditolak</>
                ) : (
                  <><Clock className="w-3.5 h-3.5 text-amber-700" /> Menunggu Review</>
                )}
              </span>
            </div>
            <p><strong>Jenis:</strong> {trackResult.report_type}</p>
            {trackResult.case_title && <p><strong>Berkas:</strong> {trackResult.case_title}</p>}
            {trackResult.moderator_note && (
              <p className="rounded bg-white p-2 border border-stone-200">
                <strong>Catatan Kurator:</strong> {trackResult.moderator_note}
              </p>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

export default function LaporPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="font-hand text-4xl font-bold text-stone-900">
          Kanal Partisipasi Warga, Koreksi Data & Hak Jawab
        </h1>
        <p className="text-sm text-stone-600">
          Setiap pengajuan wajib melampirkan tautan sumber hukum primer atau media terverifikasi Dewan Pers.
        </p>
      </div>
      <Suspense fallback={<div className="archival-card p-6 text-sm">Memuat formulir...</div>}>
        <LaporFormInner />
      </Suspense>
    </div>
  );
}
