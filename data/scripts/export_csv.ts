import fs from 'node:fs';
import path from 'node:path';

const BASE_DIR = path.resolve(__dirname, '..');
const NORMALIZED_DIR = path.join(BASE_DIR, 'normalized');

const datasets = [
  'persons',
  'positions',
  'parties',
  'party_memberships',
  'cases',
  'case_persons',
  'financial_records',
  'verdicts',
  'timeline_events',
  'companies',
  'case_companies',
  'locations',
  'case_locations',
  'sources'
];

function escapeCSV(value: any): string {
  if (value === null || value === undefined) return '';
  if (Array.isArray(value)) {
    return `"${value.join('; ').replace(/"/g, '""')}"`;
  }
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

console.log('📄 Mengonversi seluruh normalized dataset ke format CSV standar RFC 4180...');

for (const name of datasets) {
  const jsonPath = path.join(NORMALIZED_DIR, `${name}.json`);
  if (!fs.existsSync(jsonPath)) continue;

  const records: Record<string, any>[] = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  if (records.length === 0) continue;

  const headers = Object.keys(records[0]);
  const csvRows = [headers.join(',')];

  for (const row of records) {
    const values = headers.map((header) => escapeCSV(row[header]));
    csvRows.push(values.join(','));
  }

  const csvPath = path.join(NORMALIZED_DIR, `${name}.csv`);
  fs.writeFileSync(csvPath, csvRows.join('\n'), 'utf8');
  console.log(`✓ ${name}.csv (${records.length} records) berhasil digenerate.`);
}

console.log('🎉 Seluruh file CSV dataset (A - M) selesai diekspor.');

