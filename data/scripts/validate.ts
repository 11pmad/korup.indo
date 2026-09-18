import fs from 'node:fs';
import path from 'node:path';

const BASE_DIR = path.resolve(__dirname, '..');
const NORMALIZED_DIR = path.join(BASE_DIR, 'normalized');
const QUALITY_DIR = path.join(BASE_DIR, 'quality');

function loadJSON<T>(filename: string): T[] {
  const p = path.join(NORMALIZED_DIR, `${filename}.json`);
  if (!fs.existsSync(p)) return [];
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

console.log('🔍 Menjalankan Audit Kualitas & Integritas Relasional Dataset...');

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

const sourceIds = new Set(sources.map((s) => s.source_id));
const personIds = new Set(persons.map((p) => p.person_id));
const caseIds = new Set(cases.map((c) => c.case_id));
const partyIds = new Set(parties.map((p) => p.party_id));
const companyIds = new Set(companies.map((c) => c.company_id));
const locationIds = new Set(locations.map((l) => l.location_id));

let errors = 0;
let warnings = 0;

// 1. Foreign Key Audits
console.log('1. Memeriksa Integritas Referensial (Foreign Keys)...');

for (const pos of positions) {
  if (!personIds.has(pos.person_id)) {
    console.error(`❌ Foreign Key Error: position ${pos.position_id} mereferensikan person_id tidak valid: ${pos.person_id}`);
    errors++;
  }
  if (pos.source_id && !sourceIds.has(pos.source_id)) {
    console.error(`❌ Foreign Key Error: position ${pos.position_id} mereferensikan source_id tidak valid: ${pos.source_id}`);
    errors++;
  }
}

for (const pm of partyMemberships) {
  if (!personIds.has(pm.person_id)) {
    console.error(`❌ Foreign Key Error: party_membership ${pm.membership_id} mereferensikan person_id tidak valid: ${pm.person_id}`);
    errors++;
  }
  if (!partyIds.has(pm.party_id)) {
    console.error(`❌ Foreign Key Error: party_membership ${pm.membership_id} mereferensikan party_id tidak valid: ${pm.party_id}`);
    errors++;
  }
}

for (const cp of casePersons) {
  if (!caseIds.has(cp.case_id)) {
    console.error(`❌ Foreign Key Error: case_person ${cp.case_person_id} mereferensikan case_id tidak valid: ${cp.case_id}`);
    errors++;
  }
  if (!personIds.has(cp.person_id)) {
    console.error(`❌ Foreign Key Error: case_person ${cp.case_person_id} mereferensikan person_id tidak valid: ${cp.person_id}`);
    errors++;
  }
}

for (const fin of financialRecords) {
  if (!caseIds.has(fin.case_id)) {
    console.error(`❌ Foreign Key Error: financial ${fin.financial_id} mereferensikan case_id tidak valid: ${fin.case_id}`);
    errors++;
  }
  if (fin.person_id && !personIds.has(fin.person_id)) {
    console.error(`❌ Foreign Key Error: financial ${fin.financial_id} mereferensikan person_id tidak valid: ${fin.person_id}`);
    errors++;
  }
  if (!sourceIds.has(fin.source_id)) {
    console.error(`❌ Foreign Key Error: financial ${fin.financial_id} mereferensikan source_id tidak valid: ${fin.source_id}`);
    errors++;
  }
}

for (const v of verdicts) {
  if (!caseIds.has(v.case_id)) {
    console.error(`❌ Foreign Key Error: verdict ${v.verdict_id} mereferensikan case_id tidak valid: ${v.case_id}`);
    errors++;
  }
  if (!personIds.has(v.person_id)) {
    console.error(`❌ Foreign Key Error: verdict ${v.verdict_id} mereferensikan person_id tidak valid: ${v.person_id}`);
    errors++;
  }
  if (!sourceIds.has(v.source_id)) {
    console.error(`❌ Foreign Key Error: verdict ${v.verdict_id} mereferensikan source_id tidak valid: ${v.source_id}`);
    errors++;
  }
}

// 2. Anti Double Counting Verification
console.log('2. Memeriksa Aturan Anti-Double Counting Finansial...');
const validCategories = new Set([
  'court_recognized_loss_amount',
  'prosecutor_loss_amount',
  'audit_loss_amount',
  'alleged_loss_amount',
  'bribe_amount',
  'gratification_amount',
  'illegal_profit_amount',
  'restitution_amount',
  'fine_amount',
  'project_value',
  'contract_value',
  'assets_seized_value',
  'assets_recovered_value'
]);

for (const fin of financialRecords) {
  if (!validCategories.has(fin.financial_type)) {
    console.error(`❌ Invalid Category: financial_type ${fin.financial_type} pada record ${fin.financial_id} tidak dikenali!`);
    errors++;
  }
  if (typeof fin.amount !== 'number' || isNaN(fin.amount) || fin.amount < 0) {
    console.error(`❌ Invalid Amount: Nilai ${fin.amount} pada record ${fin.financial_id} tidak valid!`);
    errors++;
  }
}

// 3. Null & Formatting Compliance Check
console.log('3. Memeriksa Kepatuhan Format Null vs Unknown (Section 41)...');
const forbiddenStrings = ['N/A', 'n/a', '-', '?', 'tidak ada', 'belum ada'];

function checkForbiddenStrings(obj: any, label: string) {
  for (const key of Object.keys(obj)) {
    const val = obj[key];
    if (typeof val === 'string' && forbiddenStrings.includes(val.trim())) {
      console.warn(`⚠️ Warning: Ditemukan string '${val}' pada ${label}.${key}. Harus menggunakan null.`);
      warnings++;
    }
  }
}

for (const p of persons) checkForbiddenStrings(p, `person(${p.person_id})`);
for (const c of cases) checkForbiddenStrings(c, `case(${c.case_id})`);

// 4. Verification Note on Review Queue
console.log('4. Memeriksa Review Queue & Verification Notes...');
const reviewQueuePath = path.join(QUALITY_DIR, 'review_queue.json');
const reviewQueue: any[] = fs.existsSync(reviewQueuePath) ? JSON.parse(fs.readFileSync(reviewQueuePath, 'utf8')) : [];
const reviewCaseIds = new Set(reviewQueue.filter((rq) => rq.entity_type === 'case').map((rq) => rq.entity_id));

for (const c of cases) {
  if (c.needs_manual_review && !reviewCaseIds.has(c.case_id)) {
    console.warn(`⚠️ Warning: Perkara ${c.case_id} berstatus needs_manual_review=true tetapi belum tercatat di review_queue.json`);
    warnings++;
  }
}

console.log('\n================ AUDIT SUMMARY ================');
console.log(`Total Records Checked: ${persons.length + cases.length + financialRecords.length + verdicts.length + sources.length}`);
console.log(`Errors: ${errors}`);
console.log(`Warnings: ${warnings}`);

if (errors === 0) {
  console.log('✅ SELURUH UJI INTEGRITAS DAN VALIDASI DATASET BERHASIL TANPA ERROR.');
} else {
  console.error(`❌ DITEMUKAN ${errors} KESALAHAN PADA DATASET!`);
  process.exit(1);
}

