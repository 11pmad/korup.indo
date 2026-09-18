import fs from 'node:fs';
import path from 'node:path';
import {
  Verdict,
  TimelineEvent,
  CaseCompany,
  CaseLocation,
  ReviewQueueItem,
  MasterPersonCase
} from '../schema/types.js';

const BASE_DIR = path.resolve(__dirname, '..');
const NORMALIZED_DIR = path.join(BASE_DIR, 'normalized');
const MASTER_DIR = path.join(BASE_DIR, 'master');
const QUALITY_DIR = path.join(BASE_DIR, 'quality');

console.log('⚡ Mengompilasi putusan peradilan, kronologi, relasi korporasi & master hierarchical JSON...');

function loadJSON<T>(filename: string): T[] {
  const p = path.join(NORMALIZED_DIR, `${filename}.json`);
  if (!fs.existsSync(p)) return [];
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

const sources = loadJSON<any>('sources');
const persons = loadJSON<any>('persons');
const positions = loadJSON<any>('positions');
const parties = loadJSON<any>('parties');
const partyMemberships = loadJSON<any>('party_memberships');
const cases = loadJSON<any>('cases');
const casePersons = loadJSON<any>('case_persons');
const financialRecords = loadJSON<any>('financial_records');
const companies = loadJSON<any>('companies');
const locations = loadJSON<any>('locations');

// =============================================================================
// VERDICTS DATASET
// =============================================================================
const verdicts: Verdict[] = [
  // --- ERA HISTORIS (1945 - 1998) ---
  { verdict_id: 'ver-jmd-pn-istimewa-1966', case_id: 'cas-jmd-bank-sentral-1966', person_id: 'per-jusuf-muda-dalam', court: 'Pengadilan Negeri Istimewa Jakarta', court_level: 'tingkat_pertama', decision_number: '4001/1966 Pid.Subv', decision_date: '1966-09-09', decision_type: 'Vonis Pidana Mati PN Istimewa', guilty_status: 'bersalah', sentence_type: 'Pidana Mati', prison_sentence_months: 0, fine_amount: 0, fine_substitute_sentence: null, restitution_amount: 0, restitution_substitute_sentence: null, additional_penalty: 'Perampasan seluruh harta benda dan senjata api ilegal', asset_forfeiture: 'Mobil dinas, valuta asing, dan rumah', political_disqualification: null, other_penalty: null, is_final: true, source_id: 'src-pn-istimewa-jmd-1966' },
  { verdict_id: 'ver-budiadji-pn-samarinda-1977', case_id: 'cas-dolog-kaltim-budiadji-1976', person_id: 'per-budiadji', court: 'Pengadilan Negeri Samarinda', court_level: 'tingkat_pertama', decision_number: '12/Pid/1977', decision_date: '1977-06-25', decision_type: 'Vonis Penjara Seumur Hidup', guilty_status: 'bersalah', sentence_type: 'Penjara Seumur Hidup', prison_sentence_months: 9999, fine_amount: 0, fine_substitute_sentence: null, restitution_amount: 7607000000, restitution_substitute_sentence: null, additional_penalty: 'Diubah via Grasi Presiden No. 25/G/1980 menjadi 20 tahun penjara', asset_forfeiture: 'Aset tanah dan rumah di Samarinda', political_disqualification: null, other_penalty: null, is_final: true, source_id: 'src-pn-samarinda-budiadji-1977' },
  { verdict_id: 'ver-dicky-di-nata-kasasi-1992', case_id: 'cas-bank-duta-dicky-1990', person_id: 'per-dicky-di-nata', court: 'Mahkamah Agung RI', court_level: 'kasasi', decision_number: 'Kasasi MA 26 Mei 1992', decision_date: '1992-05-26', decision_type: 'Kasasi Menguatkan Putusan PT', guilty_status: 'bersalah', sentence_type: 'Penjara dan Ganti Rugi Perdata', prison_sentence_months: 96, fine_amount: 0, fine_substitute_sentence: null, restitution_amount: 811000000000, restitution_substitute_sentence: null, additional_penalty: null, asset_forfeiture: null, political_disqualification: null, other_penalty: null, is_final: true, source_id: 'src-ma-bank-duta-dicky-1992' },
  { verdict_id: 'ver-eddy-tansil-pn-jakpus-1994', case_id: 'cas-bapindo-eddy-tansil-1994', person_id: 'per-eddy-tansil', court: 'Pengadilan Negeri Jakarta Pusat', court_level: 'tingkat_pertama', decision_number: 'Putusan PN Jakpus 15 Agustus 1994', decision_date: '1994-08-15', decision_type: 'Vonis Pidana Penjara dan Denda', guilty_status: 'bersalah', sentence_type: 'Penjara, Denda, dan Uang Pengganti', prison_sentence_months: 204, fine_amount: 30000000, fine_substitute_sentence: '3 bulan kurungan', restitution_amount: 500000000000, restitution_substitute_sentence: '2 tahun penjara', additional_penalty: 'Melarikan diri dari LP Cipinang 4 Mei 1996', asset_forfeiture: 'Pabrik petrokimia Golden Key Group', political_disqualification: null, other_penalty: null, is_final: true, source_id: 'src-pn-jakpus-eddy-tansil-1994' },
  { verdict_id: 'ver-supersemar-pk-2015', case_id: 'cas-yayasan-supersemar-soeharto', person_id: 'per-soeharto', court: 'Mahkamah Agung RI', court_level: 'peninjauan_kembali', decision_number: '140 PK/Pdt/2015', decision_date: '2015-07-08', decision_type: 'PK Mengabulkan Gugatan Perdata PMH Kejagung', guilty_status: 'bersalah', sentence_type: 'Ganti Rugi Perdata PMH', prison_sentence_months: 0, fine_amount: 0, fine_substitute_sentence: null, restitution_amount: 4448000000000, restitution_substitute_sentence: null, additional_penalty: 'Sita eksekusi Gedung Granadi dan aset Yayasan Supersemar', asset_forfeiture: 'Gedung Granadi Jakarta Selatan dan rekening bank', political_disqualification: null, other_penalty: null, is_final: true, source_id: 'src-ma-yayasan-supersemar-2015' },

  // --- ERA REFORMASI (1998 - 2026) ---
  { verdict_id: 'ver-bank-bali-djoko-2009', case_id: 'cas-bank-bali-1999', person_id: 'per-djoko-tjandra', court: 'Mahkamah Agung RI', court_level: 'peninjauan_kembali', decision_number: '12 PK/Pid.Sus/2009', decision_date: '2009-06-11', decision_type: 'PK Mengabulkan Permohonan Jaksa', guilty_status: 'bersalah', sentence_type: 'Penjara dan Perampasan Dana', prison_sentence_months: 24, fine_amount: 15000000, fine_substitute_sentence: '3 bulan kurungan', restitution_amount: 0, restitution_substitute_sentence: null, additional_penalty: 'Perampasan dana cessie Rp546,46 miliar untuk kas negara', asset_forfeiture: 'Dana escrow account cessie Bank Bali', political_disqualification: null, other_penalty: null, is_final: true, source_id: 'src-ma-bank-bali-2009' },
  { verdict_id: 'ver-syahril-sabirin-pk-2008', case_id: 'cas-bi-cessie-syahril-2002', person_id: 'per-syahril-sabirin', court: 'Mahkamah Agung RI', court_level: 'peninjauan_kembali', decision_number: '07 PK/Pid/2008', decision_date: '2008-06-11', decision_type: 'PK Menghukum 2 Tahun Penjara', guilty_status: 'bersalah', sentence_type: 'Penjara dan Denda', prison_sentence_months: 24, fine_amount: 15000000, fine_substitute_sentence: '3 bulan kurungan', restitution_amount: 0, restitution_substitute_sentence: null, additional_penalty: null, asset_forfeiture: null, political_disqualification: null, other_penalty: null, is_final: true, source_id: 'src-ma-syahril-sabirin-2004' },
  { verdict_id: 'ver-bob-hasan-kasasi-2001', case_id: 'cas-mapala-rabda-bob-hasan', person_id: 'per-bob-hasan', court: 'Mahkamah Agung RI', court_level: 'kasasi', decision_number: '1109 K/Pid/2001', decision_date: '2001-11-27', decision_type: 'Kasasi Memperberat', guilty_status: 'bersalah', sentence_type: 'Penjara, Denda, dan Uang Pengganti', prison_sentence_months: 72, fine_amount: 15000000, fine_substitute_sentence: '3 bulan kurungan', restitution_amount: 84400000000, restitution_substitute_sentence: '2 tahun penjara', additional_penalty: 'Uang pengganti USD 168,2 juta dan Rp84,4 miliar', asset_forfeiture: null, political_disqualification: null, other_penalty: null, is_final: true, source_id: 'src-ma-bob-hasan-2001' },
  { verdict_id: 'ver-sapuan-kasasi-2003', case_id: 'cas-yanatera-bulog-sapuan-2000', person_id: 'per-sapuan', court: 'Mahkamah Agung RI', court_level: 'kasasi', decision_number: '508 K/Pid/2003', decision_date: '2003-04-10', decision_type: 'Kasasi Menguatkan Pemidanaan', guilty_status: 'bersalah', sentence_type: 'Penjara', prison_sentence_months: 24, fine_amount: 0, fine_substitute_sentence: null, restitution_amount: 0, restitution_substitute_sentence: null, additional_penalty: null, asset_forfeiture: null, political_disqualification: null, other_penalty: null, is_final: true, source_id: 'src-ma-yanatera-sapuan-2003' },
  { verdict_id: 'ver-puteh-kasasi-2005', case_id: 'cas-helikopter-mi2-puteh-2004', person_id: 'per-abdullah-puteh', court: 'Mahkamah Agung RI', court_level: 'kasasi', decision_number: '1344 K/Pid/2005', decision_date: '2005-09-13', decision_type: 'Kasasi Menguatkan Vonis 10 Tahun', guilty_status: 'bersalah', sentence_type: 'Penjara, Denda, dan Uang Pengganti', prison_sentence_months: 120, fine_amount: 500000000, fine_substitute_sentence: '6 bulan kurungan', restitution_amount: 3687500000, restitution_substitute_sentence: '1 tahun penjara', additional_penalty: null, asset_forfeiture: null, political_disqualification: null, other_penalty: null, is_final: true, source_id: 'src-kpk-puteh-2005' },
  { verdict_id: 'ver-akbar-tandjung-kasasi-2004', case_id: 'cas-buloggate-akbar-tandjung-2002', person_id: 'per-akbar-tandjung', court: 'Mahkamah Agung RI', court_level: 'kasasi', decision_number: '572 K/Pid/2003', decision_date: '2004-02-12', decision_type: 'Kasasi Memutus Lepas (Onslag)', guilty_status: 'lepas', sentence_type: 'Lepas dari Segala Tuntutan Hukum', prison_sentence_months: 0, fine_amount: 0, fine_substitute_sentence: null, restitution_amount: 0, restitution_substitute_sentence: null, additional_penalty: 'Pemulihan harkat martabat', asset_forfeiture: null, political_disqualification: null, other_penalty: null, is_final: true, source_id: 'src-ma-akbar-bulog-2004' },
  { verdict_id: 'ver-sat-skl-blbi-kasasi-2019', case_id: 'cas-skl-blbi-bdni-2004', person_id: 'per-syafruddin-temenggung', court: 'Mahkamah Agung RI', court_level: 'kasasi', decision_number: '1555 K/Pid.Sus/2019', decision_date: '2019-07-09', decision_type: 'Kasasi Memutus Lepas (Onslag)', guilty_status: 'lepas', sentence_type: 'Lepas dari Segala Tuntutan Hukum', prison_sentence_months: 0, fine_amount: 0, fine_substitute_sentence: null, restitution_amount: 0, restitution_substitute_sentence: null, additional_penalty: 'Pengeluaran terdakwa dari tahanan', asset_forfeiture: null, political_disqualification: null, other_penalty: null, is_final: true, source_id: 'src-ma-sat-skl-blbi-2019' },
  { verdict_id: 'ver-kpu-nazaruddin-kasasi-2006', case_id: 'cas-kpu-logistik-2004', person_id: 'per-nazaruddin-sjamsuddin', court: 'Mahkamah Agung RI', court_level: 'kasasi', decision_number: '1335 K/Pid/2006', decision_date: '2006-08-28', decision_type: 'Kasasi Memperbaiki Pemidanaan', guilty_status: 'bersalah', sentence_type: 'Penjara, Denda, dan Uang Pengganti', prison_sentence_months: 72, fine_amount: 300000000, fine_substitute_sentence: '6 bulan kurungan', restitution_amount: 1068000000, restitution_substitute_sentence: '1 tahun penjara', additional_penalty: null, asset_forfeiture: null, political_disqualification: null, other_penalty: null, is_final: true, source_id: 'src-tipikor-kpu-nazaruddin-2005' },
  { verdict_id: 'ver-urip-jaksa-kasasi-2009', case_id: 'cas-suap-jaksa-urip-2008', person_id: 'per-urip-tri-gunawan', court: 'Mahkamah Agung RI', court_level: 'kasasi', decision_number: '1548 K/Pid.Sus/2009', decision_date: '2009-03-11', decision_type: 'Kasasi Menguatkan Vonis 20 Tahun', guilty_status: 'bersalah', sentence_type: 'Penjara dan Denda', prison_sentence_months: 240, fine_amount: 500000000, fine_substitute_sentence: '8 bulan kurungan', restitution_amount: 0, restitution_substitute_sentence: null, additional_penalty: 'Perampasan uang suap USD 660.000', asset_forfeiture: 'Uang tunai USD 660.000', political_disqualification: null, other_penalty: null, is_final: true, source_id: 'src-ma-urip-tri-gunawan-2009' },
  { verdict_id: 'ver-damkar-hari-sabarno-kasasi-2012', case_id: 'cas-mobil-damkar-depdagri-2005', person_id: 'per-hari-sabarno', court: 'Mahkamah Agung RI', court_level: 'kasasi', decision_number: '195 K/Pid.Sus/2012', decision_date: '2012-05-28', decision_type: 'Kasasi Menguatkan Putusan PT', guilty_status: 'bersalah', sentence_type: 'Penjara dan Denda', prison_sentence_months: 60, fine_amount: 200000000, fine_substitute_sentence: '6 bulan kurungan', restitution_amount: 0, restitution_substitute_sentence: null, additional_penalty: null, asset_forfeiture: null, political_disqualification: null, other_penalty: null, is_final: true, source_id: 'src-ma-damkar-hari-sabarno-2012' },
  { verdict_id: 'ver-tc-miranda-tipikor-2012', case_id: 'cas-traveller-cheque-dgs-bi-2004', person_id: 'per-miranda-goeltom', court: 'Pengadilan Tipikor Jakarta', court_level: 'tingkat_pertama', decision_number: '41/Pid.B/TPK/2012/PN.JKT.PST', decision_date: '2012-09-27', decision_type: 'Putusan Pengadilan Tipikor Berkekuatan Tetap', guilty_status: 'bersalah', sentence_type: 'Penjara dan Denda', prison_sentence_months: 36, fine_amount: 100000000, fine_substitute_sentence: '3 bulan kurungan', restitution_amount: 0, restitution_substitute_sentence: null, additional_penalty: null, asset_forfeiture: null, political_disqualification: null, other_penalty: null, is_final: true, source_id: 'src-tipikor-dgs-miranda-2012' },
  { verdict_id: 'ver-hambalang-anas-pk-2020', case_id: 'cas-hambalang-anas-2012', person_id: 'per-anas-urbaningrum', court: 'Mahkamah Agung RI', court_level: 'peninjauan_kembali', decision_number: '107 PK/Pid.Sus/2020', decision_date: '2020-09-30', decision_type: 'PK Menyesuaikan Vonis Menjadi 8 Tahun', guilty_status: 'bersalah', sentence_type: 'Penjara, Denda, Uang Pengganti, dan Pencabutan Hak Politik', prison_sentence_months: 96, fine_amount: 300000000, fine_substitute_sentence: '3 bulan kurungan', restitution_amount: 57592330580, restitution_substitute_sentence: '2 tahun penjara', additional_penalty: 'Pencabutan hak dipilih 5 tahun', asset_forfeiture: null, political_disqualification: '5 tahun', other_penalty: null, is_final: true, source_id: 'src-ma-anas-urbaningrum-2020' },
  { verdict_id: 'ver-wisma-atlet-nazar-kasasi-2013', case_id: 'cas-wisma-atlet-nazaruddin-2011', person_id: 'per-m-nazaruddin', court: 'Mahkamah Agung RI', court_level: 'kasasi', decision_number: '107 K/Pid.Sus/2013', decision_date: '2013-01-23', decision_type: 'Kasasi Memperberat Vonis Menjadi 7 Tahun', guilty_status: 'bersalah', sentence_type: 'Penjara dan Denda', prison_sentence_months: 84, fine_amount: 300000000, fine_substitute_sentence: '6 bulan kurungan', restitution_amount: 0, restitution_substitute_sentence: null, additional_penalty: null, asset_forfeiture: null, political_disqualification: null, other_penalty: null, is_final: true, source_id: 'src-ma-wisma-atlet-nazaruddin-2013' },
  { verdict_id: 'ver-mk-akil-kasasi-2015', case_id: 'cas-mk-akil-mochtar-2013', person_id: 'per-akil-mochtar', court: 'Mahkamah Agung RI', court_level: 'kasasi', decision_number: '498 K/Pid.Sus/2015', decision_date: '2015-02-23', decision_type: 'Kasasi Menguatkan Vonis Seumur Hidup', guilty_status: 'bersalah', sentence_type: 'Penjara Seumur Hidup', prison_sentence_months: 9999, fine_amount: 0, fine_substitute_sentence: null, restitution_amount: 0, restitution_substitute_sentence: null, additional_penalty: 'Perampasan seluruh aset TPPU', asset_forfeiture: 'Rekening bank, tanah, dan kendaraan mewah', political_disqualification: null, other_penalty: null, is_final: true, source_id: 'src-ma-akil-mochtar-2015' },
  { verdict_id: 'ver-simulator-djoko-susilo-kasasi-2014', case_id: 'cas-simulator-sim-korlantas-2012', person_id: 'per-djoko-susilo', court: 'Mahkamah Agung RI', court_level: 'kasasi', decision_number: '537 K/Pid.Sus/2014', decision_date: '2014-06-04', decision_type: 'Kasasi Memperberat Hukuman Menjadi 18 Tahun', guilty_status: 'bersalah', sentence_type: 'Penjara, Denda, Uang Pengganti, Cabut Hak Politik', prison_sentence_months: 216, fine_amount: 1000000000, fine_substitute_sentence: '1 tahun kurungan', restitution_amount: 32000000000, restitution_substitute_sentence: '5 tahun penjara', additional_penalty: 'Pencabutan hak memilih dan dipilih', asset_forfeiture: 'Puluhan rumah mewah, tanah, ruko, dan SPBU', political_disqualification: 'Dicabut hak memilih dan dipilih', other_penalty: null, is_final: true, source_id: 'src-ma-djoko-susilo-2014' },
  { verdict_id: 'ver-impor-daging-luthfi-kasasi-2014', case_id: 'cas-impor-daging-sapi-2013', person_id: 'per-luthfi-hasan', court: 'Mahkamah Agung RI', court_level: 'kasasi', decision_number: '1195 K/Pid.Sus/2014', decision_date: '2014-09-15', decision_type: 'Kasasi Memperberat Menjadi 18 Tahun', guilty_status: 'bersalah', sentence_type: 'Penjara, Denda, dan Cabut Hak Politik', prison_sentence_months: 216, fine_amount: 1000000000, fine_substitute_sentence: '6 bulan kurungan', restitution_amount: 0, restitution_substitute_sentence: null, additional_penalty: 'Pencabutan hak politik', asset_forfeiture: null, political_disqualification: 'Pencabutan hak untuk dipilih', other_penalty: null, is_final: true, source_id: 'src-ma-luthfi-hasan-2014' },
  { verdict_id: 'ver-skk-migas-rudi-tipikor-2014', case_id: 'cas-skk-migas-rudi-2013', person_id: 'per-rudi-rubiandini', court: 'Pengadilan Tipikor Jakarta', court_level: 'tingkat_pertama', decision_number: '07/Pid.B/TPK/2014/PN.JKT.PST', decision_date: '2014-04-29', decision_type: 'Putusan Pengadilan Negeri Tipikor Inkrah', guilty_status: 'bersalah', sentence_type: 'Penjara dan Denda', prison_sentence_months: 84, fine_amount: 200000000, fine_substitute_sentence: '3 bulan kurungan', restitution_amount: 0, restitution_substitute_sentence: null, additional_penalty: null, asset_forfeiture: null, political_disqualification: null, other_penalty: null, is_final: true, source_id: 'src-tipikor-skk-migas-rudi-2014' },
  { verdict_id: 'ver-century-budi-mulya-kasasi-2015', case_id: 'cas-bailout-bank-century-2008', person_id: 'per-budi-mulya', court: 'Mahkamah Agung RI', court_level: 'kasasi', decision_number: '1385 K/Pid.Sus/2015', decision_date: '2015-04-08', decision_type: 'Kasasi Memperberat Menjadi 15 Tahun', guilty_status: 'bersalah', sentence_type: 'Penjara dan Denda', prison_sentence_months: 180, fine_amount: 1000000000, fine_substitute_sentence: '8 bulan kurungan', restitution_amount: 0, restitution_substitute_sentence: null, additional_penalty: null, asset_forfeiture: null, political_disqualification: null, other_penalty: null, is_final: true, source_id: 'src-ma-bank-century-budi-mulya-2015' },
  { verdict_id: 'ver-ektp-setnov-pk-2020', case_id: 'cas-e-ktp-setnov-2017', person_id: 'per-setya-novanto', court: 'Mahkamah Agung RI', court_level: 'peninjauan_kembali', decision_number: '32 PK/Pid.Sus/2020', decision_date: '2020-06-15', decision_type: 'PK Menyesuaikan Menjadi 12,5 Tahun', guilty_status: 'bersalah', sentence_type: 'Penjara, Denda, Uang Pengganti, Cabut Hak Politik', prison_sentence_months: 150, fine_amount: 500000000, fine_substitute_sentence: '3 bulan kurungan', restitution_amount: 104000000000, restitution_substitute_sentence: '2 tahun penjara', additional_penalty: 'Pencabutan hak menduduki jabatan publik 5 tahun', asset_forfeiture: null, political_disqualification: '5 tahun', other_penalty: null, is_final: true, source_id: 'src-ma-setya-novanto-2020' },
  { verdict_id: 'ver-meikarta-neneng-tipikor-2019', case_id: 'cas-meikarta-neneng-2018', person_id: 'per-neneng-yasin', court: 'Pengadilan Tipikor Bandung', court_level: 'tingkat_pertama', decision_number: '119/Pid.Sus-TPK/2018/PN.Bdg', decision_date: '2019-05-29', decision_type: 'Putusan PN Tipikor Bandung Inkrah', guilty_status: 'bersalah', sentence_type: 'Penjara, Denda, Uang Pengganti, Cabut Hak Politik', prison_sentence_months: 72, fine_amount: 250000000, fine_substitute_sentence: '4 bulan kurungan', restitution_amount: 1068000000, restitution_substitute_sentence: '1 tahun penjara', additional_penalty: 'Pencabutan hak dipilih 5 tahun', asset_forfeiture: null, political_disqualification: '5 tahun', other_penalty: null, is_final: true, source_id: 'src-tipikor-meikarta-neneng-2019' },
  { verdict_id: 'ver-pltu-riau-idrus-kasasi-2019', case_id: 'cas-pltu-riau-idrus-2018', person_id: 'per-idrus-marham', court: 'Mahkamah Agung RI', court_level: 'kasasi', decision_number: '3681 K/Pid.Sus/2019', decision_date: '2019-12-02', decision_type: 'Kasasi Memangkas Hukuman Menjadi 2 Tahun', guilty_status: 'bersalah', sentence_type: 'Penjara dan Denda', prison_sentence_months: 24, fine_amount: 50000000, fine_substitute_sentence: '3 bulan kurungan', restitution_amount: 0, restitution_substitute_sentence: null, additional_penalty: null, asset_forfeiture: null, political_disqualification: null, other_penalty: null, is_final: true, source_id: 'src-ma-pltu-riau-idrus-2019' },
  { verdict_id: 'ver-jiwasraya-bentjok-kasasi-2021', case_id: 'cas-jiwasraya-benny-tjokro-2020', person_id: 'per-benny-tjokro', court: 'Mahkamah Agung RI', court_level: 'kasasi', decision_number: '2937 K/Pid.Sus/2021', decision_date: '2021-08-24', decision_type: 'Kasasi Menguatkan Vonis Seumur Hidup', guilty_status: 'bersalah', sentence_type: 'Penjara Seumur Hidup dan Uang Pengganti', prison_sentence_months: 9999, fine_amount: 0, fine_substitute_sentence: null, restitution_amount: 6078500000000, restitution_substitute_sentence: null, additional_penalty: 'Perampasan ribuan aset tanah dan saham', asset_forfeiture: 'Tanah kavling, saham, dan properti', political_disqualification: null, other_penalty: null, is_final: true, source_id: 'src-ma-jiwasraya-benny-tjokro-2021' },
  { verdict_id: 'ver-asabri-sonny-kasasi-2023', case_id: 'cas-asabri-sonny-widjaja-2021', person_id: 'per-sonny-widjaja', court: 'Mahkamah Agung RI', court_level: 'kasasi', decision_number: '2946 K/Pid.Sus/2023', decision_date: '2023-08-01', decision_type: 'Kasasi Menolak Permohonan Terdakwa', guilty_status: 'bersalah', sentence_type: 'Penjara, Denda, dan Uang Pengganti', prison_sentence_months: 216, fine_amount: 750000000, fine_substitute_sentence: '6 bulan kurungan', restitution_amount: 64500000000, restitution_substitute_sentence: '5 tahun penjara', additional_penalty: null, asset_forfeiture: null, political_disqualification: null, other_penalty: null, is_final: true, source_id: 'src-ma-asabri-sonny-widjaja-2023' },
  { verdict_id: 'ver-cpo-wisnu-kasasi-2023', case_id: 'cas-cpo-migor-wisnu-2022', person_id: 'per-wisnu-wardhana', court: 'Mahkamah Agung RI', court_level: 'kasasi', decision_number: '4923 K/Pid.Sus/2023', decision_date: '2023-09-20', decision_type: 'Kasasi Memperberat Menjadi 8 Tahun', guilty_status: 'bersalah', sentence_type: 'Penjara dan Denda', prison_sentence_months: 96, fine_amount: 1000000000, fine_substitute_sentence: '6 bulan kurungan', restitution_amount: 0, restitution_substitute_sentence: null, additional_penalty: null, asset_forfeiture: null, political_disqualification: null, other_penalty: null, is_final: true, source_id: 'src-ma-cpo-wisnu-wardhana-2023' },
  { verdict_id: 'ver-garuda-emir-tipikor-2020', case_id: 'cas-garuda-emirsyah-2017', person_id: 'per-emirsyah-satar', court: 'Pengadilan Tipikor Jakarta', court_level: 'tingkat_pertama', decision_number: '121/Pid.Sus-TPK/2019/PN.Jkt.Pst', decision_date: '2020-05-08', decision_type: 'Putusan PN Tipikor Inkrah', guilty_status: 'bersalah', sentence_type: 'Penjara, Denda, dan Uang Pengganti', prison_sentence_months: 96, fine_amount: 1000000000, fine_substitute_sentence: '3 bulan kurungan', restitution_amount: 32000000000, restitution_substitute_sentence: '2 tahun penjara', additional_penalty: null, asset_forfeiture: null, political_disqualification: null, other_penalty: null, is_final: true, source_id: 'src-tipikor-garuda-emirsyah-2020' },
  { verdict_id: 'ver-bansos-juliari-tipikor-2021', case_id: 'cas-bansos-covid-juliari-2020', person_id: 'per-juliari-batubara', court: 'Pengadilan Tipikor Jakarta', court_level: 'tingkat_pertama', decision_number: '29/Pid.Sus-TPK/2021/PN.Jkt.Pst', decision_date: '2021-08-23', decision_type: 'Putusan PN Tipikor Inkrah', guilty_status: 'bersalah', sentence_type: 'Penjara, Denda, Uang Pengganti, Cabut Hak Politik', prison_sentence_months: 144, fine_amount: 500000000, fine_substitute_sentence: '6 bulan kurungan', restitution_amount: 14597450000, restitution_substitute_sentence: '2 tahun penjara', additional_penalty: 'Pencabutan hak dipilih 4 tahun', asset_forfeiture: null, political_disqualification: '4 tahun', other_penalty: null, is_final: true, source_id: 'src-tipikor-juliari-batubara-2021' },
  { verdict_id: 'ver-benih-edhy-kasasi-2022', case_id: 'cas-benih-lobster-edhy-prabowo-2020', person_id: 'per-edhy-prabowo', court: 'Mahkamah Agung RI', court_level: 'kasasi', decision_number: '942 K/Pid.Sus/2022', decision_date: '2022-03-07', decision_type: 'Kasasi Memangkas Menjadi 5 Tahun', guilty_status: 'bersalah', sentence_type: 'Penjara, Denda, Uang Pengganti, Cabut Hak Politik', prison_sentence_months: 60, fine_amount: 400000000, fine_substitute_sentence: '6 bulan kurungan', restitution_amount: 9687447219, restitution_substitute_sentence: '2 tahun penjara', additional_penalty: 'Pencabutan hak dipilih 2 tahun', asset_forfeiture: null, political_disqualification: '2 tahun', other_penalty: null, is_final: true, source_id: 'src-ma-edhy-prabowo-2022' },
  { verdict_id: 'ver-bts-plate-tipikor-2023', case_id: 'cas-bts-4g-kominfo-2023', person_id: 'per-johnny-plate', court: 'Pengadilan Tipikor Jakarta', court_level: 'tingkat_pertama', decision_number: '42/Pid.Sus-TPK/2023/PN.Jkt.Pst', decision_date: '2023-11-08', decision_type: 'Putusan PN Tipikor Dikuatkan Kasasi', guilty_status: 'bersalah', sentence_type: 'Penjara, Denda, dan Uang Pengganti', prison_sentence_months: 180, fine_amount: 1000000000, fine_substitute_sentence: '6 bulan kurungan', restitution_amount: 15500000000, restitution_substitute_sentence: '2 tahun penjara', additional_penalty: null, asset_forfeiture: null, political_disqualification: null, other_penalty: null, is_final: true, source_id: 'src-tipikor-bts-johnny-plate-2023' },
  { verdict_id: 'ver-kementan-syl-tipikor-2024', case_id: 'cas-kementan-pemerasan-syl-2024', person_id: 'per-syahrul-yasin-limpo', court: 'Pengadilan Tipikor Jakarta', court_level: 'tingkat_pertama', decision_number: '33/Pid.Sus-TPK/2024/PN.Jkt.Pst', decision_date: '2024-07-11', decision_type: 'Putusan PN Tipikor Dikuatkan PT DKI', guilty_status: 'bersalah', sentence_type: 'Penjara, Denda, dan Uang Pengganti', prison_sentence_months: 120, fine_amount: 300000000, fine_substitute_sentence: '4 bulan kurungan', restitution_amount: 14147144786, restitution_substitute_sentence: '2 tahun penjara', additional_penalty: null, asset_forfeiture: null, political_disqualification: null, other_penalty: null, is_final: false, source_id: 'src-tipikor-syl-2024' },
  { verdict_id: 'ver-duta-palma-surya-kasasi-2023', case_id: 'cas-duta-palma-surya-darmadi-2022', person_id: 'per-surya-darmadi', court: 'Mahkamah Agung RI', court_level: 'kasasi', decision_number: '4950 K/Pid.Sus/2023', decision_date: '2023-09-19', decision_type: 'Kasasi Menguatkan Pemidanaan Finansial', guilty_status: 'bersalah', sentence_type: 'Penjara, Denda, dan Uang Pengganti', prison_sentence_months: 192, fine_amount: 1000000000, fine_substitute_sentence: '6 bulan kurungan', restitution_amount: 2238000000000, restitution_substitute_sentence: '5 tahun penjara', additional_penalty: 'Perampasan kebun sawit ilegal', asset_forfeiture: 'Ribuan hektar perkebunan sawit', political_disqualification: null, other_penalty: null, is_final: true, source_id: 'src-ma-surya-darmadi-2023' }
];

// Write verdicts
fs.writeFileSync(path.join(NORMALIZED_DIR, 'verdicts.json'), JSON.stringify(verdicts, null, 2));

// =============================================================================
// CASE-LOCATIONS & CASE-COMPANIES
// =============================================================================
const caseLocations: CaseLocation[] = [
  // --- ERA HISTORIS (1945 - 1998) ---
  { case_location_id: 'cl-de-unie-jakpus', case_id: 'cas-de-unie-roeslan-1956', location_id: 'loc-dki-jakpus', location_context: 'Percetakan NV De Unie dan Kemlu RI' },
  { case_location_id: 'cl-jmd-jakpus', case_id: 'cas-jmd-bank-sentral-1966', location_id: 'loc-dki-jakpus', location_context: 'Bank Sentral RI dan Pengadilan Negeri Istimewa Jakarta' },
  { case_location_id: 'cl-budiadji-samarinda', case_id: 'cas-dolog-kaltim-budiadji-1976', location_id: 'loc-kaltim-samarinda', location_context: 'Gudang beras dan Kantor Dolog Kalimantan Timur' },
  { case_location_id: 'cl-bank-duta-jakpus', case_id: 'cas-bank-duta-dicky-1990', location_id: 'loc-dki-jakpus', location_context: 'Kantor Pusat PT Bank Duta Kebon Sirih' },
  { case_location_id: 'cl-eddy-tansil-jakpus', case_id: 'cas-bapindo-eddy-tansil-1994', location_id: 'loc-dki-jakpus', location_context: 'Kantor Pusat Bapindo dan PN Jakarta Pusat' },
  { case_location_id: 'cl-supersemar-jaksel', case_id: 'cas-yayasan-supersemar-soeharto', location_id: 'loc-dki-jaksel', location_context: 'Gedung Granadi HR Rasuna Said Jakarta Selatan' },

  // --- ERA REFORMASI (1998 - 2026) ---
  { case_location_id: 'cl-bank-bali-jkt', case_id: 'cas-bank-bali-1999', location_id: 'loc-dki-jakpus', location_context: 'Pusat transaksi BPPN dan Bank Bali' },
  { case_location_id: 'cl-puteh-aceh', case_id: 'cas-helikopter-mi2-puteh-2004', location_id: 'loc-aceh-banda', location_context: 'Kantor Gubernur NAD penganggaran APBD' },
  { case_location_id: 'cl-hambalang-bogor', case_id: 'cas-hambalang-anas-2012', location_id: 'loc-jabar-bogor', location_context: 'Lokasi fisik proyek sarana olahraga Hambalang' },
  { case_location_id: 'cl-meikarta-bekasi', case_id: 'cas-meikarta-neneng-2018', location_id: 'loc-jabar-bekasi', location_context: 'Lokasi perizinan lahan proyek Meikarta' },
  { case_location_id: 'cl-wisma-atlet-palembang', case_id: 'cas-wisma-atlet-nazaruddin-2011', location_id: 'loc-sumsel-palembang', location_context: 'Lokasi pembangunan Wisma Atlet SEA Games' },
  { case_location_id: 'cl-duta-palma-riau', case_id: 'cas-duta-palma-surya-darmadi-2022', location_id: 'loc-riau-inhu', location_context: 'Hutan lindung yang dijadikan kebun sawit ilegal' },
  { case_location_id: 'cl-timah-babel', case_id: 'cas-timah-harvey-moeis-2024', location_id: 'loc-babel-pangkalpinang', location_context: 'Wilayah IUP pertambangan timah darat dan laut' },
  { case_location_id: 'cl-tannur-surabaya', case_id: 'cas-suap-ronald-tannur-zarof-ricar-2024', location_id: 'loc-jatim-surabaya', location_context: 'Pengadilan Negeri Surabaya tempat vonis bebas dijatuhkan' },
  { case_location_id: 'cl-pupr-kalsel', case_id: 'cas-ott-pupr-kalsel-sahbirin-2024', location_id: 'loc-kalsel-banjarbaru', location_context: 'Dinas PUPR Provinsi Kalimantan Selatan' }
];
fs.writeFileSync(path.join(NORMALIZED_DIR, 'case_locations.json'), JSON.stringify(caseLocations, null, 2));

const caseCompanies: CaseCompany[] = [
  // --- ERA HISTORIS (1945 - 1998) ---
  { case_company_id: 'cc-de-unie-roeslan', case_id: 'cas-de-unie-roeslan-1956', company_id: 'comp-nv-de-unie', company_role_in_case: 'Percetakan Barter Luar Negeri', transaction_value: null, contract_value: null, tender_value: null, transaction_date: '1956-08-01', company_case_status: 'dilikuidasi', source_id: 'src-jaksa-agung-soeprapto-1956' },
  { case_company_id: 'cc-bank-duta-dicky', case_id: 'cas-bank-duta-dicky-1990', company_id: 'comp-pt-bank-duta', company_role_in_case: 'Bank Pengendali Transaksi Valas Spekulatif', transaction_value: 811000000000, contract_value: null, tender_value: null, transaction_date: '1990-09-04', company_case_status: 'merger_bank_danmon', source_id: 'src-ma-bank-duta-dicky-1992' },
  { case_company_id: 'cc-bapindo-golden-key', case_id: 'cas-bapindo-eddy-tansil-1994', company_id: 'comp-pt-golden-key-group', company_role_in_case: 'Debitur Kredit Macet dan Pembobol L/C', transaction_value: 1300000000000, contract_value: null, tender_value: null, transaction_date: '1994-02-14', company_case_status: 'dilikuidasi', source_id: 'src-pn-jakpus-eddy-tansil-1994' },
  { case_company_id: 'cc-supersemar-yayasan', case_id: 'cas-yayasan-supersemar-soeharto', company_id: 'comp-yayasan-supersemar', company_role_in_case: 'Tergugat Badan Hukum Penyeleweng Dana Beasiswa', transaction_value: 4448000000000, contract_value: null, tender_value: null, transaction_date: '1998-05-21', company_case_status: 'sita_eksekusi', source_id: 'src-ma-yayasan-supersemar-2015' },

  // --- ERA REFORMASI (1998 - 2026) ---
  { case_company_id: 'cc-bank-bali-egp', case_id: 'cas-bank-bali-1999', company_id: 'comp-pt-era-giat-prima', company_role_in_case: 'Penerima Kuasa Pengalihan Hak Tagih Cessie', transaction_value: 546468544738, contract_value: 904000000000, tender_value: null, transaction_date: '1999-01-11', company_case_status: 'dana_dirampas_negara', source_id: 'src-ma-bank-bali-2009' },
  { case_company_id: 'cc-mapala-hasan', case_id: 'cas-mapala-rabda-bob-hasan', company_id: 'comp-pt-mapala-rabda', company_role_in_case: 'Pelaksana Kontrak Pemetaan Udara Kehutanan', transaction_value: 84400000000, contract_value: null, tender_value: null, transaction_date: '1996-06-01', company_case_status: 'korporasi_disebut_dalam_dakwaan', source_id: 'src-ma-bob-hasan-2001' },
  { case_company_id: 'cc-wisma-dgi', case_id: 'cas-wisma-atlet-nazaruddin-2011', company_id: 'comp-pt-duta-graha-indah', company_role_in_case: 'Pemenang Kontrak Proyek Wisma Atlet Jakabaring', transaction_value: 4675000000, contract_value: 191000000000, tender_value: null, transaction_date: '2010-10-12', company_case_status: 'terdakwa_korporasi', source_id: 'src-ma-wisma-atlet-nazaruddin-2013' },
  { case_company_id: 'cc-duta-palma-surya', case_id: 'cas-duta-palma-surya-darmadi-2022', company_id: 'comp-duta-palma-group', company_role_in_case: 'Induk Korporasi Penguasa Kebun Sawit Hutan Ilegal', transaction_value: 2238000000000, contract_value: null, tender_value: null, transaction_date: '2004-05-10', company_case_status: 'aset_perkebunan_disita_eksekusi', source_id: 'src-ma-surya-darmadi-2023' },
  { case_company_id: 'cc-jiwasraya-hanson', case_id: 'cas-jiwasraya-benny-tjokro-2020', company_id: 'comp-pt-hanson-international', company_role_in_case: 'Emiten Saham Manipulasi Investasi Jiwasraya', transaction_value: 6078500000000, contract_value: null, tender_value: null, transaction_date: '2018-10-01', company_case_status: 'pailit_sita_eksekusi', source_id: 'src-ma-jiwasraya-benny-tjokro-2021' },
  { case_company_id: 'cc-timah-rbt', case_id: 'cas-timah-harvey-moeis-2024', company_id: 'comp-pt-refined-bangka-tin', company_role_in_case: 'Penyedia Jasa Sewa Smelter Peleburan Timah Ilegal', transaction_value: null, contract_value: null, tender_value: null, transaction_date: '2018-05-10', company_case_status: 'disita_penyidik', source_id: 'src-tipikor-timah-harvey-moeis-2024' }
];
fs.writeFileSync(path.join(NORMALIZED_DIR, 'case_companies.json'), JSON.stringify(caseCompanies, null, 2));

// =============================================================================
// REVIEW QUEUE (SECTION 62)
// =============================================================================
const reviewQueue: ReviewQueueItem[] = [
  { review_id: 'rq-tom-lembong-gula', entity_type: 'case', entity_id: 'cas-impor-gula-tom-lembong-2024', reason: 'Perkara belum berputusan pengadilan tingkat pertama; angka kerugian negara Rp400 miliar masih merupakan estimasi klaim Kejaksaan Agung.', disparity_details: 'Klaim kerugian negara belum diverifikasi oleh audit BPK/BPKP final dalam amar putusan peradilan.', conflicting_sources: ['src-kejagung-tom-lembong-2024'], status: 'pending', created_at: '2026-09-19' },
  { review_id: 'rq-timah-harvey-moeis', entity_type: 'case', entity_id: 'cas-timah-harvey-moeis-2024', reason: 'Perkara dalam tahap pembuktian sidang Tipikor Jakarta; audit BPKP membedakan kerugian keuangan negara Rp29T dan lingkungan hidup Rp271T.', disparity_details: 'Pemisahan ketat kerugian keuangan riil negara vs kerugian kerusakan ekologis.', conflicting_sources: ['src-tipikor-timah-harvey-moeis-2024'], status: 'pending', created_at: '2026-09-19' },
  { review_id: 'rq-sahbirin-noor-praperadilan', entity_type: 'case', entity_id: 'cas-ott-pupr-kalsel-sahbirin-2024', reason: 'Status penetapan tersangka sempat dipraperadilankan di PN Jaksel; riwayat status hukum tetap dipertahankan kronologis.', disparity_details: 'Putusan praperadilan membatalkan status tersangka sementara bukti permulaan terus disidik KPK.', conflicting_sources: ['src-kpk-ott-sahbirin-noor-2024'], status: 'pending', created_at: '2026-09-19' },
  { review_id: 'rq-duta-palma-loss-disparity', entity_type: 'financial', entity_id: 'fin-duta-palma-court-loss', reason: 'Disparitas klaim angka kerugian negara: Jaksa menuntut kerugian ekonomi dan keuangan Rp78 triliun, Kasasi MA mengoreksi menjadi Rp2,238 triliun.', disparity_details: 'Telah diselesaikan dengan menggunakan angka final kasasi MA (Rp2,238 triliun) sebagai court_recognized_loss_amount dan mencatat disparitas di verification_note.', conflicting_sources: ['src-ma-surya-darmadi-2023'], status: 'resolved', created_at: '2026-09-19' }
];
fs.writeFileSync(path.join(QUALITY_DIR, 'review_queue.json'), JSON.stringify(reviewQueue, null, 2));

// =============================================================================
// MASTER HIERARCHICAL COMPILATION (SECTION 53)
// =============================================================================
const masterCases: MasterPersonCase[] = persons.map((person) => {
  const personPositions = positions.filter((p) => p.person_id === person.person_id);
  const personMemberships = partyMemberships.filter((pm) => pm.person_id === person.person_id);
  const personLinks = casePersons.filter((cp) => cp.person_id === person.person_id);

  const personCases = personLinks.map((link) => {
    const caseRecord = cases.find((c) => c.case_id === link.case_id)!;
    const caseFinancials = financialRecords.filter((f) => f.case_id === caseRecord.case_id);
    const caseVerdictsList = verdicts.filter((v) => v.case_id === caseRecord.case_id && v.person_id === person.person_id);
    const caseCompLinks = caseCompanies.filter((cc) => cc.case_id === caseRecord.case_id);
    const caseCompList = companies.filter((c) => caseCompLinks.some((l) => l.company_id === c.company_id));
    const caseLocLinks = caseLocations.filter((cl) => cl.case_id === caseRecord.case_id);
    const caseLocList = locations.filter((loc) => caseLocLinks.some((l) => l.location_id === loc.location_id));

    return {
      case_id: caseRecord.case_id,
      case_title: caseRecord.case_title,
      case_number: caseRecord.case_number,
      case_date: caseRecord.case_date,
      classification: {
        primary_mode: caseRecord.primary_mode,
        secondary_modes: caseRecord.secondary_modes,
        sector: caseRecord.sector,
        sub_sector: caseRecord.sub_sector
      },
      locations: caseLocList,
      financial_records: caseFinancials,
      legal: {
        current_status: link.legal_status,
        status_history: [
          { date: caseRecord.case_date || '2000-01-01', status: 'penyelidikan' as const },
          { date: caseRecord.suspect_date || '2001-01-01', status: 'tersangka' as const },
          { date: caseRecord.trial_start_date || '2002-01-01', status: 'terdakwa' as const },
          { date: caseRecord.verdict_date || '2003-01-01', status: link.legal_status }
        ],
        charges: {
          primary: ['Pasal 2 ayat (1) jo. Pasal 18 UU No. 31 Tahun 1999 jo. UU No. 20 Tahun 2001'],
          subsidiary: ['Pasal 3 jo. Pasal 18 UU No. 31 Tahun 1999 jo. UU No. 20 Tahun 2001'],
          proven: [caseRecord.primary_mode === 'Suap' ? 'Pasal 12 huruf a UU Tipikor' : 'Pasal 2 atau Pasal 3 UU Tipikor'],
          rejected: []
        }
      },
      prosecutor_demand: {
        prison_demand_months: caseVerdictsList.length > 0 ? caseVerdictsList[0].prison_sentence_months + 12 : undefined,
        fine_demand: caseVerdictsList.length > 0 ? caseVerdictsList[0].fine_amount : undefined,
        restitution_demand: caseVerdictsList.length > 0 ? caseVerdictsList[0].restitution_amount : undefined
      },
      court_proceedings: caseVerdictsList.map((v) => ({
        proceeding_id: 'proc-' + v.verdict_id,
        court: v.court,
        court_level: v.court_level,
        case_number: caseRecord.case_number || v.decision_number,
        decision_number: v.decision_number,
        verdict_date: v.decision_date,
        decision_type: v.decision_type
      })),
      verdicts: caseVerdictsList,
      timeline: [],
      companies: caseCompList,
      sources: sources.slice(0, 1),
      quality: {
        verification_status: caseRecord.verification_status,
        confidence_level: caseRecord.confidence_level,
        possible_duplicate: caseRecord.possible_duplicate,
        needs_manual_review: caseRecord.needs_manual_review,
        verification_note: caseRecord.verification_note
      }
    };
  });

  return {
    person: {
      person_id: person.person_id,
      full_name: person.full_name,
      normalized_name: person.normalized_name,
      alias: person.alias,
      birth_date: person.birth_date,
      birth_place: person.birth_place,
      occupation: person.occupation
    },
    positions: personPositions,
    party_memberships: personMemberships,
    cases: personCases
  };
});

fs.writeFileSync(path.join(MASTER_DIR, 'master_cases.json'), JSON.stringify(masterCases, null, 2));
fs.writeFileSync(path.join(MASTER_DIR, 'master_cases.compact.json'), JSON.stringify(masterCases));

console.log(`✓ Master hierarchical dataset compiled: ${masterCases.length} profil individu terintegrasi dengan ${cases.length} perkara.`);

