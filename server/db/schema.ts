import { pgTable, text, integer, doublePrecision, timestamp, pgEnum, jsonb, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { sql, relations } from 'drizzle-orm';

// Enums
export const legalStatusEnum = pgEnum('legal_status', [
  'tersangka',
  'terdakwa',
  'divonis_inkrah',
  'bebas'
]);

export const sectorCategoryEnum = pgEnum('sector_category', [
  'pengadaan_barang_jasa',
  'bansos_bencana',
  'suap_gratifikasi',
  'perizinan_sda_tambang',
  'mafia_peradilan'
]);

export const reportTypeEnum = pgEnum('report_type', [
  'koreksi_data',
  'rujukan_putusan_baru',
  'usulan_kasus_baru'
]);

export const reportStatusEnum = pgEnum('report_status', [
  'pending_review',
  'approved',
  'rejected'
]);

export const adminRoleEnum = pgEnum('admin_role', [
  'super_admin',
  'admin',
  'editor',
  'moderator',
  'auditor',
  'reviewer'
]);

export const auditActionEnum = pgEnum('audit_action', [
  'create',
  'update',
  'delete',
  'rollback',
  'approve_report',
  'reject_report'
]);

export const reactionTypeEnum = pgEnum('reaction_type', [
  'geram',
  'rampok',
  'memalukan',
  'didukung',
  'khilaf_administrasi',
  'dimaklumi',
  'tebang_pilih',
  'kawal_sidang'
]);

// 1. Provinces
export const provinces = pgTable('provinces', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  island_cluster: text('island_cluster').notNull(),
  geojson_code: text('geojson_code'),
  total_loss_amount: doublePrecision('total_loss_amount').default(0).notNull(),
  total_cases: integer('total_cases').default(0).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// 2. Presidential Eras
export const presidentialEras = pgTable('presidential_eras', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  start_date: timestamp('start_date').notNull(),
  end_date: timestamp('end_date'),
  context_summary: text('context_summary'),
  cabinet_name: text('cabinet_name')
});

// 3. Political Parties
export const parties = pgTable('parties', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  logo_url: text('logo_url'),
  total_loss_amount: doublePrecision('total_loss_amount').default(0).notNull(),
  total_cases: integer('total_cases').default(0).notNull()
});

// 4. Admin Users
export const adminUsers = pgTable('admin_users', {
  id: text('id').primaryKey(),
  username: text('username').unique().notNull(),
  password_hash: text('password_hash').notNull(),
  full_name: text('full_name'),
  email: text('email'),
  role: adminRoleEnum('role').default('editor').notNull(),
  is_active: integer('is_active').default(1).notNull(),
  last_login: timestamp('last_login'),
  created_at: timestamp('created_at').defaultNow().notNull()
});

// 5. Officials
export const officials = pgTable(
  'officials',
  {
    id: text('id').primaryKey(),
    full_name: text('full_name').notNull(),
    photo_url: text('photo_url'),
    position_title: text('position_title').notNull(),
    province_id: text('province_id').references(() => provinces.id),
    party_id: text('party_id').references(() => parties.id),
    total_loss_amount: doublePrecision('total_loss_amount').default(0).notNull(),
    current_legal_status: legalStatusEnum('current_legal_status').notNull(),
    created_at: timestamp('created_at').defaultNow().notNull(),
    updated_at: timestamp('updated_at').defaultNow().notNull()
  },
  (table) => [
    index('officials_full_name_trgm_idx').using('gin', sql`${table.full_name} gin_trgm_ops`)
  ]
);

// 6. Companies
export const companies = pgTable(
  'companies',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    sector: text('sector').notNull(),
    description: text('description')
  },
  (table) => [
    index('companies_name_trgm_idx').using('gin', sql`${table.name} gin_trgm_ops`)
  ]
);

// 7. Cases
export const cases = pgTable(
  'cases',
  {
    id: text('id').primaryKey(),
    title: text('title').notNull(),
    primary_official_id: text('primary_official_id').references(() => officials.id),
    province_id: text('province_id').references(() => provinces.id),
    era_id: text('era_id').references(() => presidentialEras.id),
    sector_category: sectorCategoryEnum('sector_category').notNull(),
    loss_amount: doublePrecision('loss_amount').default(0).notNull(),
    fine_amount: doublePrecision('fine_amount').default(0).notNull(),
    restitution_amount: doublePrecision('restitution_amount').default(0).notNull(),
    prison_sentence_months: integer('prison_sentence_months').default(0).notNull(),
    legal_status: legalStatusEnum('legal_status').notNull(),
    court_decision_number: text('court_decision_number'),
    chronology: text('chronology').notNull(),
    charges_articles: text('charges_articles'),
    source_url: text('source_url').notNull(),
    verified_by: text('verified_by').references(() => adminUsers.id),
    verified_at: timestamp('verified_at'),
    case_date: timestamp('case_date'),
    created_at: timestamp('created_at').defaultNow().notNull(),
    updated_at: timestamp('updated_at').defaultNow().notNull()
  },
  (table) => [
    index('cases_title_trgm_idx').using('gin', sql`${table.title} gin_trgm_ops`),
    index('cases_chronology_trgm_idx').using('gin', sql`${table.chronology} gin_trgm_ops`),
    index('cases_province_id_idx').on(table.province_id),
    index('cases_era_id_idx').on(table.era_id),
    index('cases_legal_status_idx').on(table.legal_status),
    index('cases_sector_category_idx').on(table.sector_category),
    index('cases_loss_amount_idx').on(table.loss_amount),
    index('cases_case_date_idx').on(table.case_date),
    index('cases_primary_official_id_idx').on(table.primary_official_id)
  ]
);

// 8. Case Officials (Many-to-Many)
export const caseOfficials = pgTable(
  'case_officials',
  {
    case_id: text('case_id')
      .references(() => cases.id, { onDelete: 'cascade' })
      .notNull(),
    official_id: text('official_id')
      .references(() => officials.id, { onDelete: 'cascade' })
      .notNull(),
    role_in_case: text('role_in_case')
  },
  (table) => [
    index('case_officials_case_id_idx').on(table.case_id),
    index('case_officials_official_id_idx').on(table.official_id)
  ]
);

// 9. Case Companies (Many-to-Many)
export const caseCompanies = pgTable('case_companies', {
  case_id: text('case_id')
    .references(() => cases.id, { onDelete: 'cascade' })
    .notNull(),
  company_id: text('company_id')
    .references(() => companies.id, { onDelete: 'cascade' })
    .notNull(),
  transaction_date: timestamp('transaction_date'),
  transaction_role: text('transaction_role')
});

// 10. Case Timeline Events
export const caseTimelineEvents = pgTable('case_timeline_events', {
  id: text('id').primaryKey(),
  case_id: text('case_id')
    .references(() => cases.id, { onDelete: 'cascade' })
    .notNull(),
  event_date: timestamp('event_date').notNull(),
  event_description: text('event_description').notNull(),
  event_type: text('event_type').notNull()
});

// 11. Case Documents
export const caseDocuments = pgTable('case_documents', {
  id: text('id').primaryKey(),
  case_id: text('case_id')
    .references(() => cases.id, { onDelete: 'cascade' })
    .notNull(),
  document_type: text('document_type').notNull(),
  storage_url: text('storage_url').notNull(),
  uploaded_at: timestamp('uploaded_at').defaultNow().notNull()
});

// 12. Public Reports
export const publicReports = pgTable(
  'public_reports',
  {
    id: text('id').primaryKey(),
    case_id: text('case_id').references(() => cases.id, { onDelete: 'set null' }),
    report_type: reportTypeEnum('report_type').notNull(),
    description: text('description').notNull(),
    reference_url: text('reference_url'),
    submitter_contact: text('submitter_contact'),
    metadata: jsonb('metadata'),
    status: reportStatusEnum('status').default('pending_review').notNull(),
    reviewed_by: text('reviewed_by').references(() => adminUsers.id),
    created_at: timestamp('created_at').defaultNow().notNull(),
    reviewed_at: timestamp('reviewed_at')
  },
  (table) => [
    index('public_reports_status_idx').on(table.status),
    index('public_reports_case_id_idx').on(table.case_id)
  ]
);

// 13. Audit Logs
export const auditLogs = pgTable(
  'audit_logs',
  {
    id: text('id').primaryKey(),
    admin_user_id: text('admin_user_id').references(() => adminUsers.id),
    entity_type: text('entity_type').notNull(),
    entity_id: text('entity_id').notNull(),
    action: auditActionEnum('action').notNull(),
    diff_snapshot: jsonb('diff_snapshot'),
    created_at: timestamp('created_at').defaultNow().notNull()
  },
  (table) => [
    index('audit_logs_entity_id_idx').on(table.entity_id),
    index('audit_logs_created_at_idx').on(table.created_at)
  ]
);

// 14. Visitor & Traffic Logs (Monitoring Observability)
export const visitorLogs = pgTable(
  'visitor_logs',
  {
    id: text('id').primaryKey(),
    timestamp: timestamp('timestamp', { withTimezone: true }).defaultNow().notNull(),
    method: text('method').notNull(),
    path: text('path').notNull(),
    status_code: integer('status_code').notNull(),
    duration_ms: integer('duration_ms').default(0).notNull(),
    ip_address: text('ip_address'),
    user_agent: text('user_agent'),
    device_type: text('device_type').default('desktop'),
    browser: text('browser').default('unknown'),
    os: text('os').default('unknown'),
    referrer: text('referrer'),
    session_id: text('session_id')
  },
  (table) => [
    index('visitor_logs_timestamp_idx').on(table.timestamp),
    index('visitor_logs_session_id_idx').on(table.session_id),
    index('visitor_logs_path_idx').on(table.path),
    index('visitor_logs_status_code_idx').on(table.status_code)
  ]
);

// 15. Citizen Users (Regular Public Users)
export const citizenUsers = pgTable('citizen_users', {
  id: text('id').primaryKey(),
  username: text('username').unique().notNull(),
  display_name: text('display_name').notNull(),
  email: text('email'),
  password_hash: text('password_hash'),
  photo_url: text('photo_url'),
  origin_province: text('origin_province'),
  origin_city: text('origin_city'),
  bio: text('bio'),
  avatar_seed: text('avatar_seed').default('garuda'),
  is_email_verified: integer('is_email_verified').default(0).notNull(),
  email_verification_code: text('email_verification_code'),
  email_verification_expires: timestamp('email_verification_expires'),
  google_id: text('google_id'),
  auth_provider: text('auth_provider').default('local').notNull(),
  role: text('role').default('citizen').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull()
});

// 16. Case Reactions (Public Sentiment Emoji & Stance)
export const caseReactions = pgTable(
  'case_reactions',
  {
    id: text('id').primaryKey(),
    case_id: text('case_id')
      .references(() => cases.id, { onDelete: 'cascade' })
      .notNull(),
    user_id: text('user_id')
      .references(() => citizenUsers.id, { onDelete: 'cascade' })
      .notNull(),
    reaction_type: reactionTypeEnum('reaction_type').notNull(),
    created_at: timestamp('created_at').defaultNow().notNull()
  },
  (table) => [
    uniqueIndex('case_reactions_case_user_idx').on(table.case_id, table.user_id),
    index('case_reactions_case_id_idx').on(table.case_id),
    index('case_reactions_user_id_idx').on(table.user_id)
  ]
);

// 17. Case Comments (Citizen Discussion & Community Feedback)
export const caseComments = pgTable(
  'case_comments',
  {
    id: text('id').primaryKey(),
    case_id: text('case_id')
      .references(() => cases.id, { onDelete: 'cascade' })
      .notNull(),
    user_id: text('user_id')
      .references(() => citizenUsers.id, { onDelete: 'cascade' })
      .notNull(),
    reaction_type: reactionTypeEnum('reaction_type'),
    content: text('content').notNull(),
    upvotes_count: integer('upvotes_count').default(0).notNull(),
    is_hidden: integer('is_hidden').default(0).notNull(), // 0: visible, 1: hidden by admin
    created_at: timestamp('created_at').defaultNow().notNull()
  },
  (table) => [
    index('case_comments_case_id_idx').on(table.case_id),
    index('case_comments_user_id_idx').on(table.user_id)
  ]
);

// 18. Comment Upvotes
export const commentUpvotes = pgTable(
  'comment_upvotes',
  {
    id: text('id').primaryKey(),
    comment_id: text('comment_id')
      .references(() => caseComments.id, { onDelete: 'cascade' })
      .notNull(),
    user_id: text('user_id')
      .references(() => citizenUsers.id, { onDelete: 'cascade' })
      .notNull(),
    created_at: timestamp('created_at').defaultNow().notNull()
  },
  (table) => [
    uniqueIndex('comment_upvotes_comment_user_idx').on(table.comment_id, table.user_id)
  ]
);

// Relations
export const provincesRelations = relations(provinces, ({ many }) => ({
  officials: many(officials),
  cases: many(cases)
}));

export const presidentialErasRelations = relations(presidentialEras, ({ many }) => ({
  cases: many(cases)
}));

export const partiesRelations = relations(parties, ({ many }) => ({
  officials: many(officials)
}));

export const officialsRelations = relations(officials, ({ one, many }) => ({
  province: one(provinces, {
    fields: [officials.province_id],
    references: [provinces.id]
  }),
  party: one(parties, {
    fields: [officials.party_id],
    references: [parties.id]
  }),
  primaryCases: many(cases),
  caseOfficials: many(caseOfficials)
}));

export const companiesRelations = relations(companies, ({ many }) => ({
  caseCompanies: many(caseCompanies)
}));

export const casesRelations = relations(cases, ({ one, many }) => ({
  primaryOfficial: one(officials, {
    fields: [cases.primary_official_id],
    references: [officials.id]
  }),
  province: one(provinces, {
    fields: [cases.province_id],
    references: [provinces.id]
  }),
  era: one(presidentialEras, {
    fields: [cases.era_id],
    references: [presidentialEras.id]
  }),
  verifiedByAdmin: one(adminUsers, {
    fields: [cases.verified_by],
    references: [adminUsers.id]
  }),
  caseOfficials: many(caseOfficials),
  caseCompanies: many(caseCompanies),
  timelineEvents: many(caseTimelineEvents),
  documents: many(caseDocuments),
  reports: many(publicReports),
  reactions: many(caseReactions),
  comments: many(caseComments)
}));

export const caseOfficialsRelations = relations(caseOfficials, ({ one }) => ({
  case: one(cases, {
    fields: [caseOfficials.case_id],
    references: [cases.id]
  }),
  official: one(officials, {
    fields: [caseOfficials.official_id],
    references: [officials.id]
  })
}));

export const caseCompaniesRelations = relations(caseCompanies, ({ one }) => ({
  case: one(cases, {
    fields: [caseCompanies.case_id],
    references: [cases.id]
  }),
  company: one(companies, {
    fields: [caseCompanies.company_id],
    references: [companies.id]
  })
}));

export const caseTimelineEventsRelations = relations(caseTimelineEvents, ({ one }) => ({
  case: one(cases, {
    fields: [caseTimelineEvents.case_id],
    references: [cases.id]
  })
}));

export const caseDocumentsRelations = relations(caseDocuments, ({ one }) => ({
  case: one(cases, {
    fields: [caseDocuments.case_id],
    references: [cases.id]
  })
}));

export const publicReportsRelations = relations(publicReports, ({ one }) => ({
  case: one(cases, {
    fields: [publicReports.case_id],
    references: [cases.id]
  }),
  reviewedByAdmin: one(adminUsers, {
    fields: [publicReports.reviewed_by],
    references: [adminUsers.id]
  })
}));

export const citizenUsersRelations = relations(citizenUsers, ({ many }) => ({
  reactions: many(caseReactions),
  comments: many(caseComments),
  upvotes: many(commentUpvotes)
}));

export const caseReactionsRelations = relations(caseReactions, ({ one }) => ({
  case: one(cases, {
    fields: [caseReactions.case_id],
    references: [cases.id]
  }),
  user: one(citizenUsers, {
    fields: [caseReactions.user_id],
    references: [citizenUsers.id]
  })
}));

export const caseCommentsRelations = relations(caseComments, ({ one, many }) => ({
  case: one(cases, {
    fields: [caseComments.case_id],
    references: [cases.id]
  }),
  user: one(citizenUsers, {
    fields: [caseComments.user_id],
    references: [citizenUsers.id]
  }),
  upvotes: many(commentUpvotes)
}));

export const commentUpvotesRelations = relations(commentUpvotes, ({ one }) => ({
  comment: one(caseComments, {
    fields: [commentUpvotes.comment_id],
    references: [caseComments.id]
  }),
  user: one(citizenUsers, {
    fields: [commentUpvotes.user_id],
    references: [citizenUsers.id]
  })
}));
