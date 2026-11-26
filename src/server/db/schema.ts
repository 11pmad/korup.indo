import {
  pgTable,
  text,
  integer,
  numeric,
  boolean,
  timestamp,
  pgEnum,
  jsonb,
  index,
  uniqueIndex,
  primaryKey,
} from 'drizzle-orm/pg-core';
import { sql, relations } from 'drizzle-orm';

export const legalStatusEnum = pgEnum('legal_status', [
  'penyelidikan',
  'penyidikan',
  'tersangka',
  'terdakwa',
  'dituntut',
  'divonis_bersalah',
  'divonis_inkrah',
  'banding',
  'kasasi',
  'peninjauan_kembali',
  'bebas',
  'lepas',
  'meninggal',
  'status_tidak_diketahui',
]);

export const financialCategoryEnum = pgEnum('financial_category', [
  'court_recognized_loss_amount',
  'prosecutor_loss_amount',
  'audit_loss_amount',
  'alleged_loss_amount',
  'estimated_loss_amount',
  'bribe_amount',
  'gratification_amount',
  'illegal_profit_amount',
  'restitution_amount',
  'fine_amount',
  'project_value',
  'contract_value',
  'assets_seized_value',
  'assets_recovered_value',
]);

export const factClassificationEnum = pgEnum('fact_classification', [
  'FACT_PRIMARY',
  'FACT_SECONDARY',
  'PROSECUTOR_CLAIM',
  'DEFENDANT_CLAIM',
  'MEDIA_REPORT',
  'COURT_FINDING',
  'ANALYTICAL_DERIVATION',
  'UNVERIFIED',
]);

export const verificationStatusEnum = pgEnum('verification_status', [
  'VERIFIED_PRIMARY',
  'VERIFIED_MULTIPLE_SOURCES',
  'VERIFIED_SECONDARY',
  'PARTIALLY_VERIFIED',
  'NEEDS_REVIEW',
  'UNVERIFIED',
]);

export const courtLevelEnum = pgEnum('court_level', [
  'tingkat_pertama',
  'banding',
  'kasasi',
  'peninjauan_kembali',
]);

export const sourceTypeEnum = pgEnum('source_type', [
  'court_decision',
  'court_document',
  'indictment',
  'prosecution_document',
  'official_press_release',
  'audit_document',
  'government_document',
  'company_document',
  'reputable_media',
  'other',
]);

export const sectorCategoryEnum = pgEnum('sector_category', [
  'pengadaan_barang_jasa',
  'bansos_bencana',
  'suap_gratifikasi',
  'perizinan_sda_tambang',
  'mafia_peradilan',
  'perbankan_keuangan',
  'bumn_korporasi',
  'pajak_bea_cukai',
  'penyalahgunaan_anggaran',
]);

export const reactionTypeEnum = pgEnum('reaction_type', [
  'geram',
  'rampok',
  'memalukan',
  'didukung',
  'khilaf_administrasi',
  'dimaklumi',
  'tebang_pilih',
  'kawal_sidang',
]);

export const reportTypeEnum = pgEnum('report_type', [
  'koreksi_data',
  'rujukan_putusan_baru',
  'usulan_kasus_baru',
  'hak_jawab',
]);

export const reportStatusEnum = pgEnum('report_status', [
  'pending_review',
  'approved',
  'rejected',
]);

export const adminRoleEnum = pgEnum('admin_role', [
  'super_admin',
  'admin',
  'editor',
  'moderator',
  'auditor',
  'reviewer',
]);

export const auditActionEnum = pgEnum('audit_action', [
  'create',
  'update',
  'delete',
  'rollback',
  'approve_report',
  'reject_report',
  'update_setting',
  'moderate_comment',
]);

// 1. Provinces (38 + nasional)
export const provinces = pgTable('provinces', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  island_cluster: text('island_cluster').notNull(),
  bps_code: text('bps_code').notNull(),
  cached_total_cases: integer('cached_total_cases').default(0).notNull(),
  cached_total_loss: numeric('cached_total_loss', { precision: 20, scale: 2 }).default('0').notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// 2. Presidential Eras (10 Eras)
export const presidentialEras = pgTable('presidential_eras', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  sort_order: integer('sort_order').notNull(),
  start_date: timestamp('start_date').notNull(),
  end_date: timestamp('end_date'),
  cabinet_name: text('cabinet_name'),
  context_summary: text('context_summary'),
});

// 3. Political Parties
export const parties = pgTable('parties', {
  id: text('id').primaryKey(),
  name: text('name').notNull().unique(),
  abbreviation: text('abbreviation').notNull().unique(),
  color_hex: text('color_hex').default('#475569').notNull(),
  logo_url: text('logo_url'),
});

// 4. Sources (Provenance Repository)
export const sources = pgTable(
  'sources',
  {
    id: text('id').primaryKey(),
    source_title: text('source_title').notNull(),
    source_url: text('source_url').notNull(),
    source_type: sourceTypeEnum('source_type').default('court_decision').notNull(),
    source_institution: text('source_institution').notNull(),
    publication_date: text('publication_date'),
    access_date: text('access_date').notNull(),
    source_page: text('source_page'),
    source_excerpt: text('source_excerpt').notNull(),
    source_reliability: text('source_reliability').default('high').notNull(),
    created_at: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [index('sources_url_idx').on(table.source_url)]
);

// 5. Admin Users
export const adminUsers = pgTable('admin_users', {
  id: text('id').primaryKey(),
  username: text('username').notNull().unique(),
  password_hash: text('password_hash').notNull(),
  full_name: text('full_name'),
  email: text('email'),
  role: adminRoleEnum('role').default('editor').notNull(),
  is_active: boolean('is_active').default(true).notNull(),
  failed_login_attempts: integer('failed_login_attempts').default(0).notNull(),
  locked_until: timestamp('locked_until'),
  last_login: timestamp('last_login'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// 6. Persons (Legal Subjects / Public Officials)
export const persons = pgTable(
  'persons',
  {
    id: text('id').primaryKey(),
    slug: text('slug').notNull().unique(),
    full_name: text('full_name').notNull(),
    normalized_name: text('normalized_name').notNull(),
    aliases: text('aliases').array().default(sql`'{}'::text[]`).notNull(),
    gender: text('gender'),
    birth_place: text('birth_place'),
    birth_date: text('birth_date'),
    occupation: text('occupation'),
    nationality: text('nationality').default('Indonesia').notNull(),
    photo_url: text('photo_url'),
    created_at: timestamp('created_at').defaultNow().notNull(),
    updated_at: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('persons_full_name_trgm_idx').using('gin', sql`${table.full_name} gin_trgm_ops`),
  ]
);

// 7. Positions
export const positions = pgTable(
  'positions',
  {
    id: text('id').primaryKey(),
    person_id: text('person_id')
      .notNull()
      .references(() => persons.id, { onDelete: 'cascade' }),
    position_title: text('position_title').notNull(),
    institution: text('institution').notNull(),
    government_level: text('government_level').notNull(),
    sector: text('sector').notNull(),
    province_id: text('province_id').references(() => provinces.id),
    city_regency: text('city_regency'),
    period_start: text('period_start'),
    period_end: text('period_end'),
    position_at_offense: boolean('position_at_offense').default(true).notNull(),
    position_at_arrest: boolean('position_at_arrest').default(false).notNull(),
    position_at_verdict: boolean('position_at_verdict').default(false).notNull(),
    source_id: text('source_id').references(() => sources.id, { onDelete: 'set null' }),
  },
  (table) => [index('positions_person_idx').on(table.person_id)]
);

// 8. Party Memberships
export const partyMemberships = pgTable(
  'party_memberships',
  {
    id: text('id').primaryKey(),
    person_id: text('person_id')
      .notNull()
      .references(() => persons.id, { onDelete: 'cascade' }),
    party_id: text('party_id')
      .notNull()
      .references(() => parties.id, { onDelete: 'cascade' }),
    party_position: text('party_position'),
    membership_start: text('membership_start'),
    membership_end: text('membership_end'),
    party_status: text('party_status').default('aktif').notNull(),
    party_at_offense: boolean('party_at_offense').default(true).notNull(),
    party_at_arrest: boolean('party_at_arrest').default(false).notNull(),
    party_at_verdict: boolean('party_at_verdict').default(false).notNull(),
    source_id: text('source_id').references(() => sources.id, { onDelete: 'set null' }),
  },
  (table) => [
    index('party_memberships_person_idx').on(table.person_id),
    index('party_memberships_party_idx').on(table.party_id),
  ]
);

// 9. Companies
export const companies = pgTable(
  'companies',
  {
    id: text('id').primaryKey(),
    slug: text('slug').notNull().unique(),
    name: text('name').notNull(),
    company_type: text('company_type').notNull(),
    industry: text('industry').notNull(),
    business_sector: text('business_sector').notNull(),
    company_location: text('company_location'),
    beneficial_owner: text('beneficial_owner'),
    beneficial_owner_source: text('beneficial_owner_source'),
    beneficial_owner_verification_status: verificationStatusEnum('beneficial_owner_verification_status')
      .default('UNVERIFIED')
      .notNull(),
    company_status: text('company_status').default('aktif').notNull(),
    source_id: text('source_id').references(() => sources.id, { onDelete: 'set null' }),
  },
  (table) => [
    index('companies_name_trgm_idx').using('gin', sql`${table.name} gin_trgm_ops`),
  ]
);

// 10. Locations
export const locations = pgTable('locations', {
  id: text('id').primaryKey(),
  province_id: text('province_id')
    .notNull()
    .references(() => provinces.id),
  city_regency: text('city_regency'),
  district: text('district'),
  latitude: numeric('latitude', { precision: 10, scale: 7 }),
  longitude: numeric('longitude', { precision: 10, scale: 7 }),
  location_type: text('location_type').default('offense_location').notNull(),
});

// 11. Cases
export const cases = pgTable(
  'cases',
  {
    id: text('id').primaryKey(),
    slug: text('slug').notNull().unique(),
    case_title: text('case_title').notNull(),
    normalized_case_title: text('normalized_case_title').notNull(),
    case_number: text('case_number'),
    case_type: text('case_type').default('Tindak Pidana Korupsi').notNull(),
    era_id: text('era_id')
      .notNull()
      .references(() => presidentialEras.id),
    primary_province_id: text('primary_province_id')
      .default('nasional')
      .notNull()
      .references(() => provinces.id),
    sector_category: sectorCategoryEnum('sector_category').notNull(),
    sector_label: text('sector_label').notNull(),
    sub_sector: text('sub_sector'),
    primary_mode: text('primary_mode').notNull(),
    secondary_modes: text('secondary_modes').array().default(sql`'{}'::text[]`).notNull(),
    case_date: text('case_date'),
    investigation_date: text('investigation_date'),
    suspect_date: text('suspect_date'),
    indictment_date: text('indictment_date'),
    trial_start_date: text('trial_start_date'),
    verdict_date: text('verdict_date'),
    final_decision_date: text('final_decision_date'),
    current_legal_status: legalStatusEnum('current_legal_status').default('penyidikan').notNull(),
    summary: text('summary').notNull(),
    charges_articles: text('charges_articles'),
    verification_status: verificationStatusEnum('verification_status').default('VERIFIED_PRIMARY').notNull(),
    confidence_level: text('confidence_level').default('high').notNull(),
    possible_duplicate: boolean('possible_duplicate').default(false).notNull(),
    needs_manual_review: boolean('needs_manual_review').default(false).notNull(),
    verification_note: text('verification_note'),
    display_loss_amount: numeric('display_loss_amount', { precision: 20, scale: 2 }).default('0').notNull(),
    display_loss_basis: text('display_loss_basis').default('Belum Tercatat').notNull(),
    display_bribe_amount: numeric('display_bribe_amount', { precision: 20, scale: 2 }).default('0').notNull(),
    display_recovery_amount: numeric('display_recovery_amount', { precision: 20, scale: 2 }).default('0').notNull(),
    verified_by: text('verified_by').references(() => adminUsers.id, { onDelete: 'set null' }),
    verified_at: timestamp('verified_at'),
    created_at: timestamp('created_at').defaultNow().notNull(),
    updated_at: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('cases_title_trgm_idx').using('gin', sql`${table.case_title} gin_trgm_ops`),
    index('cases_summary_trgm_idx').using('gin', sql`${table.summary} gin_trgm_ops`),
    index('cases_era_idx').on(table.era_id),
    index('cases_province_idx').on(table.primary_province_id),
    index('cases_status_idx').on(table.current_legal_status),
    index('cases_sector_idx').on(table.sector_category),
  ]
);

// 12. Case-Persons
export const casePersons = pgTable(
  'case_persons',
  {
    id: text('id').primaryKey(),
    case_id: text('case_id')
      .notNull()
      .references(() => cases.id, { onDelete: 'cascade' }),
    person_id: text('person_id')
      .notNull()
      .references(() => persons.id, { onDelete: 'cascade' }),
    is_primary_subject: boolean('is_primary_subject').default(true).notNull(),
    role_in_case: text('role_in_case').notNull(),
    legal_status: legalStatusEnum('legal_status').notNull(),
    offense_role: text('offense_role').notNull(),
    defendant_role: text('defendant_role').notNull(),
    source_id: text('source_id').references(() => sources.id, { onDelete: 'set null' }),
  },
  (table) => [
    uniqueIndex('case_persons_unique_idx').on(table.case_id, table.person_id),
    index('case_persons_case_idx').on(table.case_id),
    index('case_persons_person_idx').on(table.person_id),
  ]
);

// 13. Case-Companies
export const caseCompanies = pgTable(
  'case_companies',
  {
    id: text('id').primaryKey(),
    case_id: text('case_id')
      .notNull()
      .references(() => cases.id, { onDelete: 'cascade' }),
    company_id: text('company_id')
      .notNull()
      .references(() => companies.id, { onDelete: 'cascade' }),
    company_role_in_case: text('company_role_in_case').notNull(),
    transaction_value: numeric('transaction_value', { precision: 20, scale: 2 }),
    contract_value: numeric('contract_value', { precision: 20, scale: 2 }),
    tender_value: numeric('tender_value', { precision: 20, scale: 2 }),
    transaction_date: text('transaction_date'),
    company_case_status: text('company_case_status').notNull(),
    source_id: text('source_id').references(() => sources.id, { onDelete: 'set null' }),
  },
  (table) => [uniqueIndex('case_companies_unique_idx').on(table.case_id, table.company_id)]
);

// 14. Case-Locations
export const caseLocations = pgTable(
  'case_locations',
  {
    id: text('id').primaryKey(),
    case_id: text('case_id')
      .notNull()
      .references(() => cases.id, { onDelete: 'cascade' }),
    location_id: text('location_id')
      .notNull()
      .references(() => locations.id, { onDelete: 'cascade' }),
    location_context: text('location_context').notNull(),
  },
  (table) => [uniqueIndex('case_locations_unique_idx').on(table.case_id, table.location_id)]
);

// 15. Case-Sources
export const caseSources = pgTable(
  'case_sources',
  {
    case_id: text('case_id')
      .notNull()
      .references(() => cases.id, { onDelete: 'cascade' }),
    source_id: text('source_id')
      .notNull()
      .references(() => sources.id, { onDelete: 'cascade' }),
    is_primary: boolean('is_primary').default(true).notNull(),
  },
  (table) => [primaryKey({ columns: [table.case_id, table.source_id] })]
);

// 16. Financial Records (Anti-Double-Counting Discriminator)
export const financialRecords = pgTable(
  'financial_records',
  {
    id: text('id').primaryKey(),
    case_id: text('case_id')
      .notNull()
      .references(() => cases.id, { onDelete: 'cascade' }),
    person_id: text('person_id').references(() => persons.id, { onDelete: 'set null' }),
    financial_type: financialCategoryEnum('financial_type').notNull(),
    amount: numeric('amount', { precision: 20, scale: 2 }).notNull(),
    currency: text('currency').default('IDR').notNull(),
    financial_year: integer('financial_year'),
    financial_description: text('financial_description').notNull(),
    fact_classification: factClassificationEnum('fact_classification').notNull(),
    source_id: text('source_id')
      .notNull()
      .references(() => sources.id, { onDelete: 'restrict' }),
    source_page: text('source_page'),
    verification_status: verificationStatusEnum('verification_status').default('VERIFIED_PRIMARY').notNull(),
    created_at: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('financial_case_idx').on(table.case_id),
    index('financial_type_idx').on(table.financial_type),
  ]
);

// 17. Verdicts
export const verdicts = pgTable(
  'verdicts',
  {
    id: text('id').primaryKey(),
    case_id: text('case_id')
      .notNull()
      .references(() => cases.id, { onDelete: 'cascade' }),
    person_id: text('person_id')
      .notNull()
      .references(() => persons.id, { onDelete: 'cascade' }),
    court: text('court').notNull(),
    court_level: courtLevelEnum('court_level').notNull(),
    decision_number: text('decision_number').notNull(),
    decision_date: text('decision_date').notNull(),
    decision_type: text('decision_type').notNull(),
    guilty_status: text('guilty_status').notNull(),
    sentence_type: text('sentence_type').notNull(),
    prison_sentence_months: integer('prison_sentence_months').default(0).notNull(),
    prosecutor_demand_months: integer('prosecutor_demand_months'),
    fine_amount: numeric('fine_amount', { precision: 20, scale: 2 }).default('0').notNull(),
    fine_substitute_sentence: text('fine_substitute_sentence'),
    restitution_amount: numeric('restitution_amount', { precision: 20, scale: 2 }).default('0').notNull(),
    restitution_substitute_sentence: text('restitution_substitute_sentence'),
    additional_penalty: text('additional_penalty'),
    asset_forfeiture: text('asset_forfeiture'),
    political_disqualification: text('political_disqualification'),
    is_final: boolean('is_final').default(false).notNull(),
    source_id: text('source_id')
      .notNull()
      .references(() => sources.id, { onDelete: 'restrict' }),
    created_at: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [index('verdicts_case_idx').on(table.case_id)]
);

// 18. Timeline Events
export const timelineEvents = pgTable(
  'timeline_events',
  {
    id: text('id').primaryKey(),
    case_id: text('case_id')
      .notNull()
      .references(() => cases.id, { onDelete: 'cascade' }),
    event_date: text('event_date').notNull(),
    event_type: text('event_type').notNull(),
    event_description: text('event_description').notNull(),
    institution: text('institution').notNull(),
    location: text('location'),
    source_id: text('source_id')
      .notNull()
      .references(() => sources.id, { onDelete: 'restrict' }),
    source_page: text('source_page'),
  },
  (table) => [index('timeline_case_idx').on(table.case_id)]
);

// 19. Citizen Users
export const citizenUsers = pgTable('citizen_users', {
  id: text('id').primaryKey(),
  username: text('username').notNull().unique(),
  display_name: text('display_name').notNull(),
  email: text('email').notNull().unique(),
  password_hash: text('password_hash'),
  photo_url: text('photo_url'),
  origin_province: text('origin_province'),
  origin_city: text('origin_city'),
  bio: text('bio'),
  avatar_seed: text('avatar_seed').default('garuda').notNull(),
  is_email_verified: boolean('is_email_verified').default(false).notNull(),
  email_verification_code_hash: text('email_verification_code_hash'),
  email_verification_expires: timestamp('email_verification_expires'),
  otp_attempts: integer('otp_attempts').default(0).notNull(),
  google_id: text('google_id').unique(),
  auth_provider: text('auth_provider').default('local').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// 20. Case Reactions
export const caseReactions = pgTable(
  'case_reactions',
  {
    id: text('id').primaryKey(),
    case_id: text('case_id')
      .notNull()
      .references(() => cases.id, { onDelete: 'cascade' }),
    user_id: text('user_id')
      .notNull()
      .references(() => citizenUsers.id, { onDelete: 'cascade' }),
    reaction_type: reactionTypeEnum('reaction_type').notNull(),
    created_at: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [uniqueIndex('case_reactions_case_user_idx').on(table.case_id, table.user_id)]
);

// 21. Case Comments
export const caseComments = pgTable(
  'case_comments',
  {
    id: text('id').primaryKey(),
    case_id: text('case_id')
      .notNull()
      .references(() => cases.id, { onDelete: 'cascade' }),
    user_id: text('user_id')
      .notNull()
      .references(() => citizenUsers.id, { onDelete: 'cascade' }),
    reaction_type: reactionTypeEnum('reaction_type'),
    content: text('content').notNull(),
    upvotes_count: integer('upvotes_count').default(0).notNull(),
    is_hidden: boolean('is_hidden').default(false).notNull(),
    moderated_by: text('moderated_by').references(() => adminUsers.id, { onDelete: 'set null' }),
    moderation_reason: text('moderation_reason'),
    created_at: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [index('case_comments_case_idx').on(table.case_id)]
);

// 22. Comment Upvotes
export const commentUpvotes = pgTable(
  'comment_upvotes',
  {
    id: text('id').primaryKey(),
    comment_id: text('comment_id')
      .notNull()
      .references(() => caseComments.id, { onDelete: 'cascade' }),
    user_id: text('user_id')
      .notNull()
      .references(() => citizenUsers.id, { onDelete: 'cascade' }),
    created_at: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [uniqueIndex('comment_upvotes_unique_idx').on(table.comment_id, table.user_id)]
);

// 23. Public Reports & Hak Jawab
export const publicReports = pgTable(
  'public_reports',
  {
    id: text('id').primaryKey(),
    tracking_code: text('tracking_code').notNull().unique(),
    case_id: text('case_id').references(() => cases.id, { onDelete: 'set null' }),
    report_type: reportTypeEnum('report_type').notNull(),
    description: text('description').notNull(),
    reference_url: text('reference_url').notNull(),
    submitter_contact: text('submitter_contact'),
    metadata: jsonb('metadata'),
    status: reportStatusEnum('status').default('pending_review').notNull(),
    moderator_note: text('moderator_note'),
    reviewed_by: text('reviewed_by').references(() => adminUsers.id, { onDelete: 'set null' }),
    created_at: timestamp('created_at').defaultNow().notNull(),
    reviewed_at: timestamp('reviewed_at'),
  },
  (table) => [index('public_reports_status_idx').on(table.status)]
);

// 24. Site Settings (replaces local announcement.json & donation.json)
export const siteSettings = pgTable('site_settings', {
  key: text('key').primaryKey(),
  value: jsonb('value').notNull(),
  updated_by: text('updated_by').references(() => adminUsers.id, { onDelete: 'set null' }),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// 25. Review Queue
export const reviewQueue = pgTable('review_queue', {
  id: text('id').primaryKey(),
  entity_type: text('entity_type').notNull(),
  entity_id: text('entity_id').notNull(),
  reason: text('reason').notNull(),
  disparity_details: text('disparity_details'),
  conflicting_sources: text('conflicting_sources').array().default(sql`'{}'::text[]`).notNull(),
  status: text('status').default('pending').notNull(),
  resolved_by: text('resolved_by').references(() => adminUsers.id, { onDelete: 'set null' }),
  created_at: timestamp('created_at').defaultNow().notNull(),
  resolved_at: timestamp('resolved_at'),
});

// 26. Audit Logs
export const auditLogs = pgTable(
  'audit_logs',
  {
    id: text('id').primaryKey(),
    admin_user_id: text('admin_user_id').references(() => adminUsers.id, { onDelete: 'set null' }),
    entity_type: text('entity_type').notNull(),
    entity_id: text('entity_id').notNull(),
    action: auditActionEnum('action').notNull(),
    diff_snapshot: jsonb('diff_snapshot'),
    ip_hash: text('ip_hash'),
    created_at: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('audit_logs_entity_idx').on(table.entity_id),
    index('audit_logs_created_idx').on(table.created_at),
  ]
);

// 27. Rate Limit Buckets (Serverless-safe PostgreSQL rate limiter)
export const rateLimitBuckets = pgTable(
  'rate_limit_buckets',
  {
    key: text('key').primaryKey(),
    count: integer('count').default(1).notNull(),
    reset_at: timestamp('reset_at').notNull(),
  },
  (table) => [index('rate_limit_reset_idx').on(table.reset_at)]
);

// 28. Visitor Logs (Privacy-safe anonymized IP hashes)
export const visitorLogs = pgTable(
  'visitor_logs',
  {
    id: text('id').primaryKey(),
    timestamp: timestamp('timestamp', { withTimezone: true }).defaultNow().notNull(),
    method: text('method').notNull(),
    path: text('path').notNull(),
    status_code: integer('status_code').notNull(),
    duration_ms: integer('duration_ms').default(0).notNull(),
    ip_hash: text('ip_hash'),
    device_type: text('device_type').default('desktop'),
    referrer: text('referrer'),
  },
  (table) => [index('visitor_logs_ts_idx').on(table.timestamp)]
);

// Relations
export const casesRelations = relations(cases, ({ one, many }) => ({
  era: one(presidentialEras, { fields: [cases.era_id], references: [presidentialEras.id] }),
  province: one(provinces, { fields: [cases.primary_province_id], references: [provinces.id] }),
  casePersons: many(casePersons),
  caseCompanies: many(caseCompanies),
  caseLocations: many(caseLocations),
  caseSources: many(caseSources),
  financialRecords: many(financialRecords),
  verdicts: many(verdicts),
  timelineEvents: many(timelineEvents),
  reactions: many(caseReactions),
  comments: many(caseComments),
}));

export const personsRelations = relations(persons, ({ many }) => ({
  positions: many(positions),
  partyMemberships: many(partyMemberships),
  casePersons: many(casePersons),
  verdicts: many(verdicts),
}));
