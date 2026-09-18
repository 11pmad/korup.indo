/**
 * LIGA KORUPSI INDONESIA (LKI) - HISTORICAL DATABASE SCHEMA TYPES
 * Master Data Definitions complying with Master Prompt v2026.09
 * Strict typing, auditable provenance, anti-double-counting definitions.
 */

export type PresidentialEra =
  | 'Era Kemerdekaan & Orde Lama (1945 - 1966)'
  | 'Era Orde Baru (1966 - 1998)'
  | 'Reformasi Awal / B.J. Habibie'
  | 'Abdurrahman Wahid'
  | 'Megawati Soekarnoputri'
  | 'Susilo Bambang Yudhoyono Periode I'
  | 'Susilo Bambang Yudhoyono Periode II'
  | 'Joko Widodo Periode I'
  | 'Joko Widodo Periode II'
  | 'Prabowo Subianto';

export type GovernmentLevel =
  | 'Nasional'
  | 'Provinsi'
  | 'Kabupaten/Kota'
  | 'Kecamatan/Desa'
  | 'BUMN'
  | 'BUMD'
  | 'Kementerian/Lembaga'
  | 'Aparat Penegak Hukum'
  | 'Yudikatif'
  | 'Legislatif'
  | 'Eksekutif'
  | 'Swasta'
  | 'Korporasi'
  | 'Lainnya';

export type LegalStatus =
  | 'penyelidikan'
  | 'penyidikan'
  | 'tersangka'
  | 'terdakwa'
  | 'dituntut'
  | 'divonis_bersalah'
  | 'divonis_inkrah'
  | 'bebas'
  | 'lepas'
  | 'banding'
  | 'kasasi'
  | 'peninjauan_kembali'
  | 'meninggal'
  | 'status_tidak_diketahui';

export type CourtLevel =
  | 'tingkat_pertama'
  | 'banding'
  | 'kasasi'
  | 'peninjauan_kembali';

export type SourceType =
  | 'court_decision'
  | 'court_document'
  | 'indictment'
  | 'prosecution_document'
  | 'official_press_release'
  | 'audit_document'
  | 'government_document'
  | 'company_document'
  | 'reputable_media'
  | 'other';

export type FactClassification =
  | 'FACT_PRIMARY'
  | 'FACT_SECONDARY'
  | 'PROSECUTOR_CLAIM'
  | 'DEFENDANT_CLAIM'
  | 'MEDIA_REPORT'
  | 'COURT_FINDING'
  | 'ANALYTICAL_DERIVATION'
  | 'UNVERIFIED';

export type VerificationStatus =
  | 'VERIFIED_PRIMARY'
  | 'VERIFIED_MULTIPLE_SOURCES'
  | 'VERIFIED_SECONDARY'
  | 'PARTIALLY_VERIFIED'
  | 'NEEDS_REVIEW'
  | 'UNVERIFIED';

export type FinancialCategory =
  | 'court_recognized_loss_amount'
  | 'prosecutor_loss_amount'
  | 'audit_loss_amount'
  | 'alleged_loss_amount'
  | 'bribe_amount'
  | 'gratification_amount'
  | 'illegal_profit_amount'
  | 'restitution_amount'
  | 'fine_amount'
  | 'project_value'
  | 'contract_value'
  | 'assets_seized_value'
  | 'assets_recovered_value';

export type LocationType =
  | 'offense_location'
  | 'project_location'
  | 'institution_location'
  | 'company_location'
  | 'residence_location'
  | 'court_location'
  | 'other';

// --- A. PERSON DATASET ---
export interface Person {
  person_id: string; // UUID
  full_name: string;
  normalized_name: string;
  alias: string[];
  gender: 'L' | 'P' | null;
  birth_place: string | null;
  birth_date: string | null; // YYYY-MM-DD
  occupation: string | null;
  nationality: string;
}

// --- B. POSITION DATASET ---
export interface Position {
  position_id: string; // UUID
  person_id: string; // UUID
  position_title: string;
  institution: string;
  government_level: GovernmentLevel;
  sector: string;
  province: string | null;
  city_regency: string | null;
  district: string | null;
  village: string | null;
  period_start: string | null;
  period_end: string | null;
  position_at_offense: boolean;
  position_at_arrest: boolean;
  position_at_verdict: boolean;
  source_id: string; // UUID
}

// --- C. PARTY DATASET ---
export interface Party {
  party_id: string; // UUID
  party_name: string;
  party_abbreviation: string;
}

// --- D. PARTY MEMBERSHIP DATASET ---
export interface PartyMembership {
  membership_id: string; // UUID
  person_id: string; // UUID
  party_id: string; // UUID
  membership_start: string | null;
  membership_end: string | null;
  party_position: string | null;
  party_position_start: string | null;
  party_position_end: string | null;
  party_status: string;
  party_at_offense: boolean;
  party_at_arrest: boolean;
  party_at_verdict: boolean;
  source_id: string; // UUID
}

// --- E. CASE DATASET ---
export interface CaseRecord {
  case_id: string; // UUID
  case_title: string;
  normalized_case_title: string;
  case_number: string | null;
  case_type: string;
  sector: string;
  sub_sector: string;
  primary_mode: string;
  secondary_modes: string[];
  case_date: string | null;
  investigation_date: string | null;
  suspect_date: string | null;
  indictment_date: string | null;
  prosecution_date: string | null;
  trial_start_date: string | null;
  verdict_date: string | null;
  final_decision_date: string | null;
  execution_date: string | null;
  era_pemerintahan: PresidentialEra;
  summary: string;
  verification_status: VerificationStatus;
  confidence_level: 'high' | 'medium' | 'low';
  possible_duplicate: boolean;
  needs_manual_review: boolean;
  verification_note: string;
}

// --- F. CASE-PERSON DATASET ---
export interface CasePerson {
  case_person_id: string; // UUID
  case_id: string; // UUID
  person_id: string; // UUID
  role_in_case: string;
  legal_status: LegalStatus;
  offense_role: string;
  defendant_role: string;
  source_id: string; // UUID
}

// --- G. FINANCIAL DATASET ---
export interface FinancialRecord {
  financial_id: string; // UUID
  case_id: string; // UUID
  person_id: string | null; // UUID
  financial_type: FinancialCategory;
  amount: number;
  currency: string;
  financial_year: number | null;
  financial_description: string;
  fact_classification: FactClassification;
  source_id: string; // UUID
  source_page: string | null;
  verification_status: VerificationStatus;
}

// --- H. VERDICT DATASET ---
export interface Verdict {
  verdict_id: string; // UUID
  case_id: string; // UUID
  person_id: string; // UUID
  court: string;
  court_level: CourtLevel;
  decision_number: string;
  decision_date: string;
  decision_type: string;
  guilty_status: 'bersalah' | 'bebas' | 'lepas';
  sentence_type: string;
  prison_sentence_months: number;
  fine_amount: number;
  fine_substitute_sentence: string | null;
  restitution_amount: number;
  restitution_substitute_sentence: string | null;
  additional_penalty: string | null;
  asset_forfeiture: string | null;
  political_disqualification: string | null;
  other_penalty: string | null;
  is_final: boolean;
  source_id: string; // UUID
}

// --- I. TIMELINE DATASET ---
export interface TimelineEvent {
  event_id: string; // UUID
  case_id: string; // UUID
  event_date: string;
  event_type: string;
  event_description: string;
  institution: string;
  location: string | null;
  source_id: string; // UUID
  source_page: string | null;
}

// --- J. COMPANY DATASET ---
export interface Company {
  company_id: string; // UUID
  company_name: string;
  company_type: string;
  industry: string;
  business_sector: string;
  company_location: string | null;
  beneficial_owner: string | null;
  beneficial_owner_source: string | null;
  beneficial_owner_verification_status: VerificationStatus;
  company_status: string;
  source_id: string; // UUID
}

// --- K. CASE-COMPANY DATASET ---
export interface CaseCompany {
  case_company_id: string; // UUID
  case_id: string; // UUID
  company_id: string; // UUID
  company_role_in_case: string;
  transaction_value: number | null;
  contract_value: number | null;
  tender_value: number | null;
  transaction_date: string | null;
  company_case_status: string;
  source_id: string; // UUID
}

// --- L. LOCATION DATASET ---
export interface Location {
  location_id: string; // UUID
  island_cluster: string;
  province: string;
  city_regency: string | null;
  district: string | null;
  village: string | null;
  latitude: number | null;
  longitude: number | null;
  location_type: LocationType;
}

export interface CaseLocation {
  case_location_id: string; // UUID
  case_id: string; // UUID
  location_id: string; // UUID
  location_context: string;
}

// --- M. SOURCE DATASET ---
export interface Source {
  source_id: string; // UUID
  source_title: string;
  source_url: string;
  source_type: SourceType;
  source_institution: string;
  publication_date: string | null;
  access_date: string;
  source_page: string | null;
  source_excerpt: string;
  source_reliability: 'high' | 'medium' | 'low';
}

// --- MASTER HIERARCHICAL STRUCTURE (Bagian 53) ---
export interface MasterPersonCase {
  person: {
    person_id: string;
    full_name: string;
    normalized_name: string;
    alias: string[];
    birth_date: string | null;
    birth_place: string | null;
    occupation: string | null;
  };
  positions: Position[];
  party_memberships: PartyMembership[];
  cases: Array<{
    case_id: string;
    case_title: string;
    case_number: string | null;
    case_date: string | null;
    classification: {
      primary_mode: string;
      secondary_modes: string[];
      sector: string;
      sub_sector: string;
    };
    locations: Location[];
    financial_records: FinancialRecord[];
    legal: {
      current_status: LegalStatus;
      status_history: Array<{
        date: string;
        status: LegalStatus;
      }>;
      charges: {
        primary: string[];
        subsidiary: string[];
        proven: string[];
        rejected: string[];
      };
    };
    prosecutor_demand: {
      prison_demand_months?: number;
      fine_demand?: number;
      restitution_demand?: number;
      source_id?: string;
    };
    court_proceedings: Array<{
      proceeding_id: string;
      court: string;
      court_level: CourtLevel;
      case_number: string;
      decision_number: string;
      verdict_date: string;
      decision_type: string;
    }>;
    verdicts: Verdict[];
    timeline: TimelineEvent[];
    companies: Company[];
    sources: Source[];
    quality: {
      verification_status: VerificationStatus;
      confidence_level: 'high' | 'medium' | 'low';
      possible_duplicate: boolean;
      needs_manual_review: boolean;
      verification_note: string;
    };
  }>;
}

export interface ReviewQueueItem {
  review_id: string;
  entity_type: 'case' | 'person' | 'financial' | 'verdict' | 'source';
  entity_id: string;
  reason: string;
  disparity_details: string;
  conflicting_sources: string[];
  status: 'pending' | 'resolved' | 'needs_field_inquiry';
  created_at: string;
}

