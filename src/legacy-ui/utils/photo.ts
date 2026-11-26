import React from 'react';

/**
 * Generic Default Official Photo (Vector SVG Data URI)
 * Designed with a dignified, neutral dossier silhouette matching the LKI scrapbook aesthetic.
 * 100% offline, zero external dependencies, sharp at any DPI resolution.
 */
export const DEFAULT_OFFICIAL_PHOTO = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200"><rect width="200" height="200" fill="%23F4EFE6" rx="16"/><rect x="6" y="6" width="188" height="188" fill="none" stroke="%23D3C7B2" stroke-width="2" stroke-dasharray="6 4" rx="12"/><circle cx="100" cy="70" r="32" fill="%2394A3B8"/><path d="M 44 162 C 44 126 70 118 100 118 C 130 118 156 126 156 162 C 156 170 148 174 138 174 L 62 174 C 52 174 44 170 44 162 Z" fill="%2394A3B8"/><path d="M 86 118 L 100 140 L 114 118 Z" fill="%23CBD5E1"/><rect x="36" y="148" width="128" height="20" rx="10" fill="%23E2D9C8" opacity="0.95"/><text x="100" y="161.5" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="8.5" font-weight="700" fill="%2357534E" letter-spacing="0.4">FOTO BELUM TERSEDIA</text></svg>`;

/**
 * Safely resolves an official's photo URL.
 * Falls back to DEFAULT_OFFICIAL_PHOTO if empty, undefined, null, or if it points to legacy placeholder stock photos.
 */
export function getOfficialPhoto(photoUrl?: string | null): string {
  if (!photoUrl || typeof photoUrl !== 'string') {
    return DEFAULT_OFFICIAL_PHOTO;
  }
  const trimmed = photoUrl.trim();
  if (
    !trimmed ||
    trimmed === 'null' ||
    trimmed === 'undefined' ||
    trimmed.includes('photo-1507003211169-0a1dd7228f2d') // Legacy innocent stock photo
  ) {
    return DEFAULT_OFFICIAL_PHOTO;
  }
  return trimmed;
}

/**
 * Fallback event handler for <img> onError event.
 * Automatically replaces a broken or failed image source with DEFAULT_OFFICIAL_PHOTO.
 */
export function handleImageError(e: React.SyntheticEvent<HTMLImageElement, Event>) {
  const target = e.currentTarget;
  if (target.src !== DEFAULT_OFFICIAL_PHOTO) {
    target.src = DEFAULT_OFFICIAL_PHOTO;
  }
}
