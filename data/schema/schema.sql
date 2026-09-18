-- =============================================================================
-- DATABASE HISTORIS PERKARA KORUPSI INDONESIA (1998 - SEKARANG)
-- PostgreSQL DDL Specification (Section 50 & 51 Master Prompt)
-- Compatible with PostgreSQL 14+, pg_trgm, UUID-v4, Audit Trail Triggers
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- -----------------------------------------------------------------------------
-- ENUM TYPES
-- -----------------------------------------------------------------------------
CREATE TYPE presidential_era AS ENUM (
    'Era Kemerdekaan & Orde Lama (1945 - 1966)',
    'Era Orde Baru (1966 - 1998)',
    'Reformasi Awal / B.J. Habibie',
    'Abdurrahman Wahid',
    'Megawati Soekarnoputri',
    'Susilo Bambang Yudhoyono Periode I',
    'Susilo Bambang Yudhoyono Periode II',
    'Joko Widodo Periode I',
    'Joko Widodo Periode II',
    'Prabowo Subianto'
);

CREATE TYPE government_level AS ENUM (
    'Nasional',
    'Provinsi',
    'Kabupaten/Kota',
    'Kecamatan/Desa',
    'BUMN',
    'BUMD',
    'Kementerian/Lembaga',
    'Aparat Penegak Hukum',
    'Yudikatif',
    'Legislatif',
    'Eksekutif',
    'Swasta',
    'Korporasi',
    'Lainnya'
);

CREATE TYPE legal_status AS ENUM (
    'penyelidikan',
    'penyidikan',
    'tersangka',
    'terdakwa',
    'dituntut',
    'divonis_bersalah',
    'divonis_inkrah',
    'bebas',
    'lepas',
    'banding',
    'kasasi',
    'peninjauan_kembali',
    'meninggal',
    'status_tidak_diketahui'
);

CREATE TYPE court_level AS ENUM (
    'tingkat_pertama',
    'banding',
    'kasasi',
    'peninjauan_kembali'
);

CREATE TYPE source_type AS ENUM (
    'court_decision',
    'court_document',
    'indictment',
    'prosecution_document',
    'official_press_release',
    'audit_document',
    'government_document',
    'company_document',
    'reputable_media',
    'other'
);

CREATE TYPE fact_classification AS ENUM (
    'FACT_PRIMARY',
    'FACT_SECONDARY',
    'PROSECUTOR_CLAIM',
    'DEFENDANT_CLAIM',
    'MEDIA_REPORT',
    'COURT_FINDING',
    'ANALYTICAL_DERIVATION',
    'UNVERIFIED'
);

CREATE TYPE verification_status AS ENUM (
    'VERIFIED_PRIMARY',
    'VERIFIED_MULTIPLE_SOURCES',
    'VERIFIED_SECONDARY',
    'PARTIALLY_VERIFIED',
    'NEEDS_REVIEW',
    'UNVERIFIED'
);

CREATE TYPE financial_category AS ENUM (
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
);

CREATE TYPE location_type AS ENUM (
    'offense_location',
    'project_location',
    'institution_location',
    'company_location',
    'residence_location',
    'court_location',
    'other'
);

-- -----------------------------------------------------------------------------
-- 1. SOURCES TABLE (PROVENANCE REPOSITORY)
-- -----------------------------------------------------------------------------
CREATE TABLE sources (
    source_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_title TEXT NOT NULL,
    source_url TEXT NOT NULL,
    source_type source_type NOT NULL,
    source_institution TEXT NOT NULL,
    publication_date DATE,
    access_date DATE NOT NULL DEFAULT CURRENT_DATE,
    source_page TEXT,
    source_excerpt TEXT NOT NULL,
    source_reliability VARCHAR(10) NOT NULL CHECK (source_reliability IN ('high', 'medium', 'low')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sources_url ON sources(source_url);
CREATE INDEX idx_sources_institution ON sources(source_institution);

-- -----------------------------------------------------------------------------
-- 2. PERSONS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE persons (
    person_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name TEXT NOT NULL,
    normalized_name TEXT NOT NULL,
    alias TEXT[] DEFAULT '{}',
    gender CHAR(1) CHECK (gender IN ('L', 'P')),
    birth_place TEXT,
    birth_date DATE,
    occupation TEXT,
    nationality TEXT DEFAULT 'Indonesia' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_persons_name_trgm ON persons USING gin (full_name gin_trgm_ops);
CREATE INDEX idx_persons_normalized ON persons(normalized_name);

-- -----------------------------------------------------------------------------
-- 3. POSITIONS TABLE (RIWAYAT JABATAN)
-- -----------------------------------------------------------------------------
CREATE TABLE positions (
    position_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    person_id UUID NOT NULL REFERENCES persons(person_id) ON DELETE CASCADE,
    position_title TEXT NOT NULL,
    institution TEXT NOT NULL,
    government_level government_level NOT NULL,
    sector TEXT NOT NULL,
    province TEXT,
    city_regency TEXT,
    district TEXT,
    village TEXT,
    period_start DATE,
    period_end DATE,
    position_at_offense BOOLEAN DEFAULT FALSE NOT NULL,
    position_at_arrest BOOLEAN DEFAULT FALSE NOT NULL,
    position_at_verdict BOOLEAN DEFAULT FALSE NOT NULL,
    source_id UUID REFERENCES sources(source_id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_positions_person ON positions(person_id);
CREATE INDEX idx_positions_institution ON positions(institution);

-- -----------------------------------------------------------------------------
-- 4. PARTIES & PARTY MEMBERSHIPS
-- -----------------------------------------------------------------------------
CREATE TABLE parties (
    party_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    party_name TEXT NOT NULL UNIQUE,
    party_abbreviation VARCHAR(20) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE party_memberships (
    membership_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    person_id UUID NOT NULL REFERENCES persons(person_id) ON DELETE CASCADE,
    party_id UUID NOT NULL REFERENCES parties(party_id) ON DELETE CASCADE,
    membership_start DATE,
    membership_end DATE,
    party_position TEXT,
    party_position_start DATE,
    party_position_end DATE,
    party_status VARCHAR(50) DEFAULT 'aktif' NOT NULL,
    party_at_offense BOOLEAN DEFAULT FALSE NOT NULL,
    party_at_arrest BOOLEAN DEFAULT FALSE NOT NULL,
    party_at_verdict BOOLEAN DEFAULT FALSE NOT NULL,
    source_id UUID REFERENCES sources(source_id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_party_memberships_person ON party_memberships(person_id);
CREATE INDEX idx_party_memberships_party ON party_memberships(party_id);

-- -----------------------------------------------------------------------------
-- 5. CASES TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE cases (
    case_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_title TEXT NOT NULL,
    normalized_case_title TEXT NOT NULL,
    case_number TEXT,
    case_type TEXT DEFAULT 'Tindak Pidana Korupsi' NOT NULL,
    sector TEXT NOT NULL,
    sub_sector TEXT NOT NULL,
    primary_mode TEXT NOT NULL,
    secondary_modes TEXT[] DEFAULT '{}',
    case_date DATE,
    investigation_date DATE,
    suspect_date DATE,
    indictment_date DATE,
    prosecution_date DATE,
    trial_start_date DATE,
    verdict_date DATE,
    final_decision_date DATE,
    execution_date DATE,
    era_pemerintahan presidential_era NOT NULL,
    summary TEXT NOT NULL,
    verification_status verification_status DEFAULT 'PARTIALLY_VERIFIED' NOT NULL,
    confidence_level VARCHAR(10) DEFAULT 'medium' NOT NULL CHECK (confidence_level IN ('high', 'medium', 'low')),
    possible_duplicate BOOLEAN DEFAULT FALSE NOT NULL,
    needs_manual_review BOOLEAN DEFAULT FALSE NOT NULL,
    verification_note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_cases_title_trgm ON cases USING gin (case_title gin_trgm_ops);
CREATE INDEX idx_cases_era ON cases(era_pemerintahan);
CREATE INDEX idx_cases_sector ON cases(sector);
CREATE INDEX idx_cases_number ON cases(case_number);

-- -----------------------------------------------------------------------------
-- 6. CASE-PERSON (PERAN INDIVIDU DALAM PERKARA)
-- -----------------------------------------------------------------------------
CREATE TABLE case_persons (
    case_person_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id UUID NOT NULL REFERENCES cases(case_id) ON DELETE CASCADE,
    person_id UUID NOT NULL REFERENCES persons(person_id) ON DELETE CASCADE,
    role_in_case TEXT NOT NULL,
    legal_status legal_status NOT NULL,
    offense_role TEXT NOT NULL,
    defendant_role TEXT NOT NULL,
    source_id UUID REFERENCES sources(source_id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_case_person UNIQUE (case_id, person_id)
);

CREATE INDEX idx_case_persons_case ON case_persons(case_id);
CREATE INDEX idx_case_persons_person ON case_persons(person_id);

-- -----------------------------------------------------------------------------
-- 7. FINANCIAL RECORDS TABLE (ANTI DOUBLE COUNTING DISCRIMINATOR)
-- -----------------------------------------------------------------------------
CREATE TABLE financial_records (
    financial_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id UUID NOT NULL REFERENCES cases(case_id) ON DELETE CASCADE,
    person_id UUID REFERENCES persons(person_id) ON DELETE SET NULL,
    financial_type financial_category NOT NULL,
    amount NUMERIC(20, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'IDR' NOT NULL,
    financial_year SMALLINT,
    financial_description TEXT NOT NULL,
    fact_classification fact_classification NOT NULL,
    source_id UUID NOT NULL REFERENCES sources(source_id) ON DELETE RESTRICT,
    source_page TEXT,
    verification_status verification_status DEFAULT 'VERIFIED_PRIMARY' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_financial_case ON financial_records(case_id);
CREATE INDEX idx_financial_type ON financial_records(financial_type);

-- -----------------------------------------------------------------------------
-- 8. VERDICTS TABLE (PUTUSAN PENGADILAN)
-- -----------------------------------------------------------------------------
CREATE TABLE verdicts (
    verdict_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id UUID NOT NULL REFERENCES cases(case_id) ON DELETE CASCADE,
    person_id UUID NOT NULL REFERENCES persons(person_id) ON DELETE CASCADE,
    court TEXT NOT NULL,
    court_level court_level NOT NULL,
    decision_number TEXT NOT NULL,
    decision_date DATE NOT NULL,
    decision_type TEXT NOT NULL,
    guilty_status VARCHAR(15) NOT NULL CHECK (guilty_status IN ('bersalah', 'bebas', 'lepas')),
    sentence_type TEXT NOT NULL,
    prison_sentence_months INTEGER DEFAULT 0 NOT NULL,
    fine_amount NUMERIC(20, 2) DEFAULT 0 NOT NULL,
    fine_substitute_sentence TEXT,
    restitution_amount NUMERIC(20, 2) DEFAULT 0 NOT NULL,
    restitution_substitute_sentence TEXT,
    additional_penalty TEXT,
    asset_forfeiture TEXT,
    political_disqualification TEXT,
    other_penalty TEXT,
    is_final BOOLEAN DEFAULT FALSE NOT NULL,
    source_id UUID NOT NULL REFERENCES sources(source_id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_verdicts_case ON verdicts(case_id);
CREATE INDEX idx_verdicts_person ON verdicts(person_id);
CREATE INDEX idx_verdicts_decision_number ON verdicts(decision_number);

-- -----------------------------------------------------------------------------
-- 9. TIMELINE EVENTS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE timeline_events (
    event_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id UUID NOT NULL REFERENCES cases(case_id) ON DELETE CASCADE,
    event_date DATE NOT NULL,
    event_type TEXT NOT NULL,
    event_description TEXT NOT NULL,
    institution TEXT NOT NULL,
    location TEXT,
    source_id UUID NOT NULL REFERENCES sources(source_id) ON DELETE RESTRICT,
    source_page TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_timeline_case ON timeline_events(case_id);
CREATE INDEX idx_timeline_date ON timeline_events(event_date);

-- -----------------------------------------------------------------------------
-- 10. COMPANIES & CASE COMPANIES
-- -----------------------------------------------------------------------------
CREATE TABLE companies (
    company_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_name TEXT NOT NULL,
    company_type TEXT NOT NULL,
    industry TEXT NOT NULL,
    business_sector TEXT NOT NULL,
    company_location TEXT,
    beneficial_owner TEXT,
    beneficial_owner_source TEXT,
    beneficial_owner_verification_status verification_status DEFAULT 'UNVERIFIED',
    company_status TEXT DEFAULT 'aktif' NOT NULL,
    source_id UUID REFERENCES sources(source_id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_companies_name_trgm ON companies USING gin (company_name gin_trgm_ops);

CREATE TABLE case_companies (
    case_company_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id UUID NOT NULL REFERENCES cases(case_id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
    company_role_in_case TEXT NOT NULL,
    transaction_value NUMERIC(20, 2),
    contract_value NUMERIC(20, 2),
    tender_value NUMERIC(20, 2),
    transaction_date DATE,
    company_case_status TEXT NOT NULL,
    source_id UUID REFERENCES sources(source_id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_case_company UNIQUE (case_id, company_id)
);

CREATE INDEX idx_case_companies_case ON case_companies(case_id);
CREATE INDEX idx_case_companies_company ON case_companies(company_id);

-- -----------------------------------------------------------------------------
-- 11. LOCATIONS & CASE LOCATIONS
-- -----------------------------------------------------------------------------
CREATE TABLE locations (
    location_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    island_cluster TEXT NOT NULL,
    province TEXT NOT NULL,
    city_regency TEXT,
    district TEXT,
    village TEXT,
    latitude NUMERIC(10, 7),
    longitude NUMERIC(10, 7),
    location_type location_type NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_locations_province ON locations(province);

CREATE TABLE case_locations (
    case_location_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id UUID NOT NULL REFERENCES cases(case_id) ON DELETE CASCADE,
    location_id UUID NOT NULL REFERENCES locations(location_id) ON DELETE CASCADE,
    location_context TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_case_location UNIQUE (case_id, location_id)
);

CREATE INDEX idx_case_locations_case ON case_locations(case_id);
CREATE INDEX idx_case_locations_location ON case_locations(location_id);

-- -----------------------------------------------------------------------------
-- 12. REVIEW QUEUE TABLE (SECTION 62)
-- -----------------------------------------------------------------------------
CREATE TABLE review_queue (
    review_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    reason TEXT NOT NULL,
    disparity_details TEXT,
    conflicting_sources TEXT[] DEFAULT '{}',
    status VARCHAR(25) DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'resolved', 'needs_field_inquiry')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- -----------------------------------------------------------------------------
-- 13. DATA CHANGE LOGS (SECTION 77 AUDIT TRAIL)
-- -----------------------------------------------------------------------------
CREATE TABLE data_change_logs (
    change_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    record_type VARCHAR(50) NOT NULL,
    record_id UUID NOT NULL,
    field_name VARCHAR(100) NOT NULL,
    old_value TEXT,
    new_value TEXT,
    change_reason TEXT NOT NULL,
    source_id UUID REFERENCES sources(source_id) ON DELETE SET NULL,
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

