'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { ZoomIn, ZoomOut, RotateCcw, Building2, MapPin, ArrowUpRight } from 'lucide-react';
import { INDONESIA_PROVINCES_GEO } from '@/data/provincesGeo';
import { resolveProvinceId } from '@/lib/provinces';
import { formatRupiah } from '@/lib/formatters';
import { LegalStatusStamp } from './LegalStatusStamp';

export interface ProvinceStatItem {
  id: string;
  name: string;
  island_cluster: string;
  bps_code: string;
  total_cases: number;
  total_loss: number;
}

export interface MapCaseSnippet {
  id: string;
  slug: string;
  case_title: string;
  primary_province_id: string;
  province_name: string | null;
  current_legal_status: string;
  display_loss_amount: number;
  sector_label: string;
  case_date: string | null;
}

function getHeatColor(casesCount: number, totalLoss: number, isSelected: boolean): string {
  if (isSelected) return '#B91C1C';
  if (casesCount === 0) return '#EDE7D9';
  if (totalLoss >= 50e12 || casesCount >= 6) return '#DC2626';
  if (totalLoss >= 5e12 || casesCount >= 3) return '#EA580C';
  if (totalLoss >= 100e9 || casesCount >= 2) return '#F59E0B';
  return '#FDE047';
}

export function IndonesiaChoroplethMap({
  provinces,
  cases,
}: {
  provinces: ProvinceStatItem[];
  cases: MapCaseSnippet[];
}) {
  const [selectedProvId, setSelectedProvId] = useState<string>('dki-jakarta');
  const [hoveredProvId, setHoveredProvId] = useState<string | null>(null);
  const [zoom, setZoom] = useState<number>(1);
  const [islandFilter, setIslandFilter] = useState<string>('Semua');

  const statById = useMemo(() => {
    const map = new Map<string, ProvinceStatItem>();
    for (const p of provinces) map.set(p.id, p);
    return map;
  }, [provinces]);

  const nasionalStat = statById.get('nasional');
  const selectedStat = statById.get(selectedProvId);
  const hoveredStat = hoveredProvId ? statById.get(hoveredProvId) : null;

  const filteredCases = useMemo(() => {
    return cases.filter((c) => c.primary_province_id === selectedProvId);
  }, [cases, selectedProvId]);

  const islands = ['Semua', 'Sumatera', 'Jawa', 'Kalimantan', 'Sulawesi', 'Bali & Nusa Tenggara', 'Maluku & Papua'];

  const tableProvinces = useMemo(() => {
    return provinces
      .filter((p) => p.id !== 'nasional')
      .filter((p) => islandFilter === 'Semua' || p.island_cluster === islandFilter)
      .sort((a, b) => b.total_cases - a.total_cases || b.total_loss - a.total_loss);
  }, [provinces, islandFilter]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* SVG Map Canvas */}
        <div className="lg:col-span-8 archival-card p-4 sm:p-5 flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-hand text-2xl font-bold text-stone-900">
                Peta Spasial 38 Provinsi Indonesia
              </h2>
              <p className="text-xs text-stone-600">
                Klik atau arahkan kursor/keyboard ke provinsi untuk melihat ringkasan perkara.
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              {nasionalStat && (
                <button
                  type="button"
                  onClick={() => setSelectedProvId('nasional')}
                  className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                    selectedProvId === 'nasional'
                      ? 'bg-red-700 text-white border-red-800'
                      : 'bg-stone-100 text-stone-800 border-stone-300 hover:bg-stone-200'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" aria-hidden="true" />
                  Pusat / Nasional ({nasionalStat.total_cases})
                </button>
              )}
              <button
                type="button"
                aria-label="Perbesar peta"
                onClick={() => setZoom((z) => Math.min(2.2, Number((z + 0.25).toFixed(2))))}
                className="rounded-lg border border-stone-300 bg-white p-1.5 text-stone-700 hover:bg-stone-100"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                type="button"
                aria-label="Perkecil peta"
                onClick={() => setZoom((z) => Math.max(1, Number((z - 0.25).toFixed(2))))}
                className="rounded-lg border border-stone-300 bg-white p-1.5 text-stone-700 hover:bg-stone-100"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                type="button"
                aria-label="Reset zoom peta"
                onClick={() => setZoom(1)}
                className="rounded-lg border border-stone-300 bg-white p-1.5 text-stone-700 hover:bg-stone-100"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="relative overflow-auto rounded-xl border border-stone-200 bg-[#F4EFE2] p-2">
            {/* Hover Info Bar */}
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-white/90 px-3 py-2 border border-stone-200 text-xs">
              <span className="font-semibold text-stone-700">
                {hoveredStat
                  ? `${hoveredStat.name}: ${hoveredStat.total_cases} perkara • ${formatRupiah(hoveredStat.total_loss, { compact: true })}`
                  : 'Arahkan kursor atau pilih salah satu poligon provinsi pada peta'}
              </span>
              <div className="flex items-center gap-3 text-[11px] text-stone-600">
                <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-xs bg-[#EDE7D9] border border-stone-400" /> 0</span>
                <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-xs bg-[#FDE047]" /> 1</span>
                <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-xs bg-[#F59E0B]" /> 2+</span>
                <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-xs bg-[#EA580C]" /> ≥Rp5T</span>
                <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-xs bg-[#DC2626]" /> ≥Rp50T</span>
              </div>
            </div>

            <div className="w-full overflow-x-auto">
              <svg
                viewBox="0 0 1000 440"
                role="img"
                aria-label="Peta Choropleth 38 Provinsi Indonesia"
                className="w-full h-auto min-w-[640px] transition-transform duration-200 origin-center"
                style={{ transform: `scale(${zoom})` }}
              >
                {INDONESIA_PROVINCES_GEO.map((poly) => {
                  const provSlug = resolveProvinceId(poly.name);
                  const stat = statById.get(provSlug);
                  const isSelected = selectedProvId === provSlug;
                  const fill = getHeatColor(
                    stat?.total_cases ?? 0,
                    stat?.total_loss ?? 0,
                    isSelected
                  );
                  return (
                    <path
                      key={provSlug}
                      d={poly.path}
                      fill={fill}
                      stroke={isSelected ? '#450A0A' : '#78716C'}
                      strokeWidth={isSelected ? 1.8 : 0.7}
                      tabIndex={0}
                      role="button"
                      aria-label={`Provinsi ${poly.name}, ${stat?.total_cases ?? 0} perkara, kerugian ${formatRupiah(stat?.total_loss ?? 0, { compact: true })}`}
                      className="cursor-pointer transition-opacity hover:opacity-90 focus:outline-none focus:stroke-stone-950 focus:stroke-2"
                      onMouseEnter={() => setHoveredProvId(provSlug)}
                      onMouseLeave={() => setHoveredProvId(null)}
                      onClick={() => setSelectedProvId(provSlug)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setSelectedProvId(provSlug);
                        }
                      }}
                    />
                  );
                })}
              </svg>
            </div>
          </div>
        </div>

        {/* Selected Province Dossier Drawer */}
        <div className="lg:col-span-4 archival-card p-5 flex flex-col gap-4">
          <div className="border-b border-stone-200 pb-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-stone-500">
              <MapPin className="w-3.5 h-3.5 text-red-700" aria-hidden="true" />
              <span>{selectedStat?.island_cluster || 'Indonesia'}</span>
            </div>
            <h3 className="font-hand text-2xl font-bold text-stone-900 mt-0.5">
              {selectedStat?.name || 'Pilih Provinsi'}
            </h3>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <div className="rounded-lg bg-stone-100 p-2.5 border border-stone-200">
                <p className="text-[11px] text-stone-600">Total Perkara</p>
                <p className="font-mono text-lg font-bold text-stone-900 tabular-nums">
                  {selectedStat?.total_cases ?? 0}
                </p>
              </div>
              <div className="rounded-lg bg-red-50 p-2.5 border border-red-200">
                <p className="text-[11px] text-red-900">Akumulasi Kerugian</p>
                <p className="font-mono text-lg font-bold text-red-800 tabular-nums">
                  {formatRupiah(selectedStat?.total_loss ?? 0, { compact: true })}
                </p>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto max-h-[380px] space-y-2.5 pr-1">
            {filteredCases.length === 0 ? (
              <div className="rounded-lg border border-dashed border-stone-300 bg-stone-50 p-4 text-center text-sm text-stone-600">
                Belum ada perkara terverifikasi yang tercatat di wilayah ini pada basis data saat ini.
              </div>
            ) : (
              filteredCases.map((c) => (
                <Link
                  key={c.id}
                  href={`/kasus/${c.slug}`}
                  className="block rounded-lg border border-stone-200 bg-[#FFFDF9] p-3 hover:border-amber-600 hover:bg-amber-50/40 transition"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-bold text-stone-900 line-clamp-2">{c.case_title}</p>
                    <ArrowUpRight className="w-4 h-4 shrink-0 text-stone-400" />
                  </div>
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                    <LegalStatusStamp status={c.current_legal_status} compact />
                    <span className="font-mono text-xs font-bold text-red-800 tabular-nums">
                      {c.display_loss_amount > 0
                        ? formatRupiah(c.display_loss_amount, { compact: true })
                        : 'Suap / Non-Loss'}
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Accessible Tabular Province Index (WCAG + Mobile Friendly) */}
      <div className="archival-card p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-hand text-xl font-bold text-stone-900">
            Indeks Spasial 38 Provinsi
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {islands.map((isl) => (
              <button
                key={isl}
                type="button"
                onClick={() => setIslandFilter(isl)}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                  islandFilter === isl
                    ? 'bg-stone-900 text-white'
                    : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                }`}
              >
                {isl}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {tableProvinces.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setSelectedProvId(p.id)}
              className={`text-left rounded-lg border p-3 transition ${
                selectedProvId === p.id
                  ? 'border-red-700 bg-red-50/70'
                  : 'border-stone-200 bg-white hover:border-stone-400'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-bold text-stone-900">{p.name}</span>
                <span className="font-mono text-xs font-bold rounded bg-stone-100 px-2 py-0.5 text-stone-800 tabular-nums">
                  {p.total_cases}
                </span>
              </div>
              <p className="mt-1 font-mono text-xs text-stone-600 tabular-nums">
                {p.total_loss > 0 ? formatRupiah(p.total_loss, { compact: true }) : 'Rp 0'}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
