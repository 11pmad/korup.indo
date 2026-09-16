import { LegalStatus } from '../types.js';

export function formatRupiah(amount: number): string {
  if (amount >= 1_000_000_000_000) {
    const triliun = (amount / 1_000_000_000_000).toFixed(2).replace(/\.00$/, '');
    return `Rp ${triliun} Triliun`;
  }
  if (amount >= 1_000_000_000) {
    const miliar = (amount / 1_000_000_000).toFixed(1).replace(/\.0$/, '');
    return `Rp ${miliar} Miliar`;
  }
  if (amount >= 1_000_000) {
    const juta = (amount / 1_000_000).toFixed(1).replace(/\.0$/, '');
    return `Rp ${juta} Juta`;
  }
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(amount);
}

export function formatRupiahFull(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(amount);
}

export function getStatusBadgeStyle(status: LegalStatus): {
  bg: string;
  border: string;
  text: string;
  sticker: string;
  stampBg: string;
} {
  switch (status) {
    case 'Divonis Inkrah':
      return {
        bg: 'bg-rose-100',
        border: 'border-rose-400',
        text: 'text-rose-800',
        sticker: 'bg-rose-500 text-white',
        stampBg: 'border-rose-600 text-rose-700 bg-rose-50'
      };
    case 'Terdakwa':
      return {
        bg: 'bg-purple-100',
        border: 'border-purple-400',
        text: 'text-purple-800',
        sticker: 'bg-purple-500 text-white',
        stampBg: 'border-purple-600 text-purple-700 bg-purple-50'
      };
    case 'Tersangka':
      return {
        bg: 'bg-amber-100',
        border: 'border-amber-400',
        text: 'text-amber-800',
        sticker: 'bg-amber-500 text-white',
        stampBg: 'border-amber-600 text-amber-700 bg-amber-50'
      };
    case 'Bebas/Praperadilan':
      return {
        bg: 'bg-emerald-100',
        border: 'border-emerald-400',
        text: 'text-emerald-800',
        sticker: 'bg-emerald-500 text-white',
        stampBg: 'border-emerald-600 text-emerald-700 bg-emerald-50'
      };
    default:
      return {
        bg: 'bg-gray-100',
        border: 'border-gray-400',
        text: 'text-gray-800',
        sticker: 'bg-gray-500 text-white',
        stampBg: 'border-gray-500 text-gray-700 bg-gray-50'
      };
  }
}
