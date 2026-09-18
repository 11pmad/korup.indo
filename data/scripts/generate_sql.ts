import fs from 'node:fs';
import path from 'node:path';

const BASE_DIR = path.resolve(__dirname, '..');
const NORMALIZED_DIR = path.join(BASE_DIR, 'normalized');
const SQL_DIR = path.join(BASE_DIR, 'sql');

function loadJSON<T>(filename: string): T[] {
  const p = path.join(NORMALIZED_DIR, `${filename}.json`);
  if (!fs.existsSync(p)) return [];
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function sqlVal(val: any): string {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
  if (typeof val === 'number') return String(val);
  if (Array.isArray(val)) {
    if (val.length === 0) return "'{}'";
    const escaped = val.map((v) => `"${String(v).replace(/"/g, '\\"')}"`).join(',');
    return `'{${escaped}}'`;
  }
  return `'${String(val).replace(/'/g, "''")}'`;
}

console.log('⚡ Menghasilkan SQL Seed file (seed.sql)...');

const sources = loadJSON<any>('sources');
const persons = loadJSON<any>('persons');
const positions = loadJSON<any>('positions');
const parties = loadJSON<any>('parties');
const partyMemberships = loadJSON<any>('party_memberships');
const cases = loadJSON<any>('cases');
const casePersons = loadJSON<any>('case_persons');
const financialRecords = loadJSON<any>('financial_records');
const verdicts = loadJSON<any>('verdicts');
const timelineEvents = loadJSON<any>('timeline_events');
const companies = loadJSON<any>('companies');
const caseCompanies = loadJSON<any>('case_companies');
const locations = loadJSON<any>('locations');
const caseLocations = loadJSON<any>('case_locations');

const lines: string[] = [
  '-- =============================================================================',
  '-- LIGA KORUPSI INDONESIA - SQL SEED DATA (1998 - 2026)',
  '-- Generated automatically by scripts/generate_sql.ts',
  '-- =============================================================================',
  'BEGIN;',
  ''
];

function appendInserts(tableName: string, records: Record<string, any>[]) {
  if (records.length === 0) return;
  lines.push(`-- Table: ${tableName}`);
  const keys = Object.keys(records[0]);
  for (const r of records) {
    const vals = keys.map((k) => sqlVal(r[k])).join(', ');
    lines.push(`INSERT INTO ${tableName} (${keys.join(', ')}) VALUES (${vals});`);
  }
  lines.push('');
}

appendInserts('sources', sources);
appendInserts('parties', parties);
appendInserts('locations', locations);
appendInserts('companies', companies);
appendInserts('persons', persons);
appendInserts('positions', positions);
appendInserts('party_memberships', partyMemberships);
appendInserts('cases', cases);
appendInserts('case_persons', casePersons);
appendInserts('financial_records', financialRecords);
appendInserts('verdicts', verdicts);
appendInserts('timeline_events', timelineEvents);
appendInserts('case_companies', caseCompanies);
appendInserts('case_locations', caseLocations);

lines.push('COMMIT;');
lines.push('');

fs.writeFileSync(path.join(SQL_DIR, 'seed.sql'), lines.join('\n'), 'utf8');
console.log('✓ File sql/seed.sql berhasil digenerate.');

