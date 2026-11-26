CREATE TYPE "public"."admin_role" AS ENUM('super_admin', 'admin', 'editor', 'moderator', 'auditor', 'reviewer');--> statement-breakpoint
CREATE TYPE "public"."audit_action" AS ENUM('create', 'update', 'delete', 'rollback', 'approve_report', 'reject_report', 'update_setting', 'moderate_comment');--> statement-breakpoint
CREATE TYPE "public"."court_level" AS ENUM('tingkat_pertama', 'banding', 'kasasi', 'peninjauan_kembali');--> statement-breakpoint
CREATE TYPE "public"."fact_classification" AS ENUM('FACT_PRIMARY', 'FACT_SECONDARY', 'PROSECUTOR_CLAIM', 'DEFENDANT_CLAIM', 'MEDIA_REPORT', 'COURT_FINDING', 'ANALYTICAL_DERIVATION', 'UNVERIFIED');--> statement-breakpoint
CREATE TYPE "public"."financial_category" AS ENUM('court_recognized_loss_amount', 'prosecutor_loss_amount', 'audit_loss_amount', 'alleged_loss_amount', 'estimated_loss_amount', 'bribe_amount', 'gratification_amount', 'illegal_profit_amount', 'restitution_amount', 'fine_amount', 'project_value', 'contract_value', 'assets_seized_value', 'assets_recovered_value');--> statement-breakpoint
CREATE TYPE "public"."legal_status" AS ENUM('penyelidikan', 'penyidikan', 'tersangka', 'terdakwa', 'dituntut', 'divonis_bersalah', 'divonis_inkrah', 'banding', 'kasasi', 'peninjauan_kembali', 'bebas', 'lepas', 'meninggal', 'status_tidak_diketahui');--> statement-breakpoint
CREATE TYPE "public"."reaction_type" AS ENUM('geram', 'rampok', 'memalukan', 'didukung', 'khilaf_administrasi', 'dimaklumi', 'tebang_pilih', 'kawal_sidang');--> statement-breakpoint
CREATE TYPE "public"."report_status" AS ENUM('pending_review', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."report_type" AS ENUM('koreksi_data', 'rujukan_putusan_baru', 'usulan_kasus_baru', 'hak_jawab');--> statement-breakpoint
CREATE TYPE "public"."sector_category" AS ENUM('pengadaan_barang_jasa', 'bansos_bencana', 'suap_gratifikasi', 'perizinan_sda_tambang', 'mafia_peradilan', 'perbankan_keuangan', 'bumn_korporasi', 'pajak_bea_cukai', 'penyalahgunaan_anggaran');--> statement-breakpoint
CREATE TYPE "public"."source_type" AS ENUM('court_decision', 'court_document', 'indictment', 'prosecution_document', 'official_press_release', 'audit_document', 'government_document', 'company_document', 'reputable_media', 'other');--> statement-breakpoint
CREATE TYPE "public"."verification_status" AS ENUM('VERIFIED_PRIMARY', 'VERIFIED_MULTIPLE_SOURCES', 'VERIFIED_SECONDARY', 'PARTIALLY_VERIFIED', 'NEEDS_REVIEW', 'UNVERIFIED');--> statement-breakpoint
CREATE TABLE "admin_users" (
	"id" text PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password_hash" text NOT NULL,
	"full_name" text,
	"email" text,
	"role" "admin_role" DEFAULT 'editor' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"failed_login_attempts" integer DEFAULT 0 NOT NULL,
	"locked_until" timestamp,
	"last_login" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "admin_users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"admin_user_id" text,
	"entity_type" text NOT NULL,
	"entity_id" text NOT NULL,
	"action" "audit_action" NOT NULL,
	"diff_snapshot" jsonb,
	"ip_hash" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "case_comments" (
	"id" text PRIMARY KEY NOT NULL,
	"case_id" text NOT NULL,
	"user_id" text NOT NULL,
	"reaction_type" "reaction_type",
	"content" text NOT NULL,
	"upvotes_count" integer DEFAULT 0 NOT NULL,
	"is_hidden" boolean DEFAULT false NOT NULL,
	"moderated_by" text,
	"moderation_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "case_companies" (
	"id" text PRIMARY KEY NOT NULL,
	"case_id" text NOT NULL,
	"company_id" text NOT NULL,
	"company_role_in_case" text NOT NULL,
	"transaction_value" numeric(20, 2),
	"contract_value" numeric(20, 2),
	"tender_value" numeric(20, 2),
	"transaction_date" text,
	"company_case_status" text NOT NULL,
	"source_id" text
);
--> statement-breakpoint
CREATE TABLE "case_locations" (
	"id" text PRIMARY KEY NOT NULL,
	"case_id" text NOT NULL,
	"location_id" text NOT NULL,
	"location_context" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "case_persons" (
	"id" text PRIMARY KEY NOT NULL,
	"case_id" text NOT NULL,
	"person_id" text NOT NULL,
	"is_primary_subject" boolean DEFAULT true NOT NULL,
	"role_in_case" text NOT NULL,
	"legal_status" "legal_status" NOT NULL,
	"offense_role" text NOT NULL,
	"defendant_role" text NOT NULL,
	"source_id" text
);
--> statement-breakpoint
CREATE TABLE "case_reactions" (
	"id" text PRIMARY KEY NOT NULL,
	"case_id" text NOT NULL,
	"user_id" text NOT NULL,
	"reaction_type" "reaction_type" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "case_sources" (
	"case_id" text NOT NULL,
	"source_id" text NOT NULL,
	"is_primary" boolean DEFAULT true NOT NULL,
	CONSTRAINT "case_sources_case_id_source_id_pk" PRIMARY KEY("case_id","source_id")
);
--> statement-breakpoint
CREATE TABLE "cases" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"case_title" text NOT NULL,
	"normalized_case_title" text NOT NULL,
	"case_number" text,
	"case_type" text DEFAULT 'Tindak Pidana Korupsi' NOT NULL,
	"era_id" text NOT NULL,
	"primary_province_id" text DEFAULT 'nasional' NOT NULL,
	"sector_category" "sector_category" NOT NULL,
	"sector_label" text NOT NULL,
	"sub_sector" text,
	"primary_mode" text NOT NULL,
	"secondary_modes" text[] DEFAULT '{}'::text[] NOT NULL,
	"case_date" text,
	"investigation_date" text,
	"suspect_date" text,
	"indictment_date" text,
	"trial_start_date" text,
	"verdict_date" text,
	"final_decision_date" text,
	"current_legal_status" "legal_status" DEFAULT 'penyidikan' NOT NULL,
	"summary" text NOT NULL,
	"charges_articles" text,
	"verification_status" "verification_status" DEFAULT 'VERIFIED_PRIMARY' NOT NULL,
	"confidence_level" text DEFAULT 'high' NOT NULL,
	"possible_duplicate" boolean DEFAULT false NOT NULL,
	"needs_manual_review" boolean DEFAULT false NOT NULL,
	"verification_note" text,
	"display_loss_amount" numeric(20, 2) DEFAULT '0' NOT NULL,
	"display_loss_basis" text DEFAULT 'Belum Tercatat' NOT NULL,
	"display_bribe_amount" numeric(20, 2) DEFAULT '0' NOT NULL,
	"display_recovery_amount" numeric(20, 2) DEFAULT '0' NOT NULL,
	"verified_by" text,
	"verified_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "cases_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "citizen_users" (
	"id" text PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"display_name" text NOT NULL,
	"email" text NOT NULL,
	"password_hash" text,
	"photo_url" text,
	"origin_province" text,
	"origin_city" text,
	"bio" text,
	"avatar_seed" text DEFAULT 'garuda' NOT NULL,
	"is_email_verified" boolean DEFAULT false NOT NULL,
	"email_verification_code_hash" text,
	"email_verification_expires" timestamp,
	"otp_attempts" integer DEFAULT 0 NOT NULL,
	"google_id" text,
	"auth_provider" text DEFAULT 'local' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "citizen_users_username_unique" UNIQUE("username"),
	CONSTRAINT "citizen_users_email_unique" UNIQUE("email"),
	CONSTRAINT "citizen_users_google_id_unique" UNIQUE("google_id")
);
--> statement-breakpoint
CREATE TABLE "comment_upvotes" (
	"id" text PRIMARY KEY NOT NULL,
	"comment_id" text NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "companies" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"company_type" text NOT NULL,
	"industry" text NOT NULL,
	"business_sector" text NOT NULL,
	"company_location" text,
	"beneficial_owner" text,
	"beneficial_owner_source" text,
	"beneficial_owner_verification_status" "verification_status" DEFAULT 'UNVERIFIED' NOT NULL,
	"company_status" text DEFAULT 'aktif' NOT NULL,
	"source_id" text,
	CONSTRAINT "companies_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "financial_records" (
	"id" text PRIMARY KEY NOT NULL,
	"case_id" text NOT NULL,
	"person_id" text,
	"financial_type" "financial_category" NOT NULL,
	"amount" numeric(20, 2) NOT NULL,
	"currency" text DEFAULT 'IDR' NOT NULL,
	"financial_year" integer,
	"financial_description" text NOT NULL,
	"fact_classification" "fact_classification" NOT NULL,
	"source_id" text NOT NULL,
	"source_page" text,
	"verification_status" "verification_status" DEFAULT 'VERIFIED_PRIMARY' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "locations" (
	"id" text PRIMARY KEY NOT NULL,
	"province_id" text NOT NULL,
	"city_regency" text,
	"district" text,
	"latitude" numeric(10, 7),
	"longitude" numeric(10, 7),
	"location_type" text DEFAULT 'offense_location' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "parties" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"abbreviation" text NOT NULL,
	"color_hex" text DEFAULT '#475569' NOT NULL,
	"logo_url" text,
	CONSTRAINT "parties_name_unique" UNIQUE("name"),
	CONSTRAINT "parties_abbreviation_unique" UNIQUE("abbreviation")
);
--> statement-breakpoint
CREATE TABLE "party_memberships" (
	"id" text PRIMARY KEY NOT NULL,
	"person_id" text NOT NULL,
	"party_id" text NOT NULL,
	"party_position" text,
	"membership_start" text,
	"membership_end" text,
	"party_status" text DEFAULT 'aktif' NOT NULL,
	"party_at_offense" boolean DEFAULT true NOT NULL,
	"party_at_arrest" boolean DEFAULT false NOT NULL,
	"party_at_verdict" boolean DEFAULT false NOT NULL,
	"source_id" text
);
--> statement-breakpoint
CREATE TABLE "persons" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"full_name" text NOT NULL,
	"normalized_name" text NOT NULL,
	"aliases" text[] DEFAULT '{}'::text[] NOT NULL,
	"gender" text,
	"birth_place" text,
	"birth_date" text,
	"occupation" text,
	"nationality" text DEFAULT 'Indonesia' NOT NULL,
	"photo_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "persons_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "positions" (
	"id" text PRIMARY KEY NOT NULL,
	"person_id" text NOT NULL,
	"position_title" text NOT NULL,
	"institution" text NOT NULL,
	"government_level" text NOT NULL,
	"sector" text NOT NULL,
	"province_id" text,
	"city_regency" text,
	"period_start" text,
	"period_end" text,
	"position_at_offense" boolean DEFAULT true NOT NULL,
	"position_at_arrest" boolean DEFAULT false NOT NULL,
	"position_at_verdict" boolean DEFAULT false NOT NULL,
	"source_id" text
);
--> statement-breakpoint
CREATE TABLE "presidential_eras" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"sort_order" integer NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp,
	"cabinet_name" text,
	"context_summary" text
);
--> statement-breakpoint
CREATE TABLE "provinces" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"island_cluster" text NOT NULL,
	"bps_code" text NOT NULL,
	"cached_total_cases" integer DEFAULT 0 NOT NULL,
	"cached_total_loss" numeric(20, 2) DEFAULT '0' NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "public_reports" (
	"id" text PRIMARY KEY NOT NULL,
	"tracking_code" text NOT NULL,
	"case_id" text,
	"report_type" "report_type" NOT NULL,
	"description" text NOT NULL,
	"reference_url" text NOT NULL,
	"submitter_contact" text,
	"metadata" jsonb,
	"status" "report_status" DEFAULT 'pending_review' NOT NULL,
	"moderator_note" text,
	"reviewed_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"reviewed_at" timestamp,
	CONSTRAINT "public_reports_tracking_code_unique" UNIQUE("tracking_code")
);
--> statement-breakpoint
CREATE TABLE "rate_limit_buckets" (
	"key" text PRIMARY KEY NOT NULL,
	"count" integer DEFAULT 1 NOT NULL,
	"reset_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "review_queue" (
	"id" text PRIMARY KEY NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text NOT NULL,
	"reason" text NOT NULL,
	"disparity_details" text,
	"conflicting_sources" text[] DEFAULT '{}'::text[] NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"resolved_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"resolved_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "site_settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL,
	"updated_by" text,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sources" (
	"id" text PRIMARY KEY NOT NULL,
	"source_title" text NOT NULL,
	"source_url" text NOT NULL,
	"source_type" "source_type" DEFAULT 'court_decision' NOT NULL,
	"source_institution" text NOT NULL,
	"publication_date" text,
	"access_date" text NOT NULL,
	"source_page" text,
	"source_excerpt" text NOT NULL,
	"source_reliability" text DEFAULT 'high' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "timeline_events" (
	"id" text PRIMARY KEY NOT NULL,
	"case_id" text NOT NULL,
	"event_date" text NOT NULL,
	"event_type" text NOT NULL,
	"event_description" text NOT NULL,
	"institution" text NOT NULL,
	"location" text,
	"source_id" text NOT NULL,
	"source_page" text
);
--> statement-breakpoint
CREATE TABLE "verdicts" (
	"id" text PRIMARY KEY NOT NULL,
	"case_id" text NOT NULL,
	"person_id" text NOT NULL,
	"court" text NOT NULL,
	"court_level" "court_level" NOT NULL,
	"decision_number" text NOT NULL,
	"decision_date" text NOT NULL,
	"decision_type" text NOT NULL,
	"guilty_status" text NOT NULL,
	"sentence_type" text NOT NULL,
	"prison_sentence_months" integer DEFAULT 0 NOT NULL,
	"prosecutor_demand_months" integer,
	"fine_amount" numeric(20, 2) DEFAULT '0' NOT NULL,
	"fine_substitute_sentence" text,
	"restitution_amount" numeric(20, 2) DEFAULT '0' NOT NULL,
	"restitution_substitute_sentence" text,
	"additional_penalty" text,
	"asset_forfeiture" text,
	"political_disqualification" text,
	"is_final" boolean DEFAULT false NOT NULL,
	"source_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "visitor_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL,
	"method" text NOT NULL,
	"path" text NOT NULL,
	"status_code" integer NOT NULL,
	"duration_ms" integer DEFAULT 0 NOT NULL,
	"ip_hash" text,
	"device_type" text DEFAULT 'desktop',
	"referrer" text
);
--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_admin_user_id_admin_users_id_fk" FOREIGN KEY ("admin_user_id") REFERENCES "public"."admin_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_comments" ADD CONSTRAINT "case_comments_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_comments" ADD CONSTRAINT "case_comments_user_id_citizen_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."citizen_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_comments" ADD CONSTRAINT "case_comments_moderated_by_admin_users_id_fk" FOREIGN KEY ("moderated_by") REFERENCES "public"."admin_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_companies" ADD CONSTRAINT "case_companies_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_companies" ADD CONSTRAINT "case_companies_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_companies" ADD CONSTRAINT "case_companies_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_locations" ADD CONSTRAINT "case_locations_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_locations" ADD CONSTRAINT "case_locations_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_persons" ADD CONSTRAINT "case_persons_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_persons" ADD CONSTRAINT "case_persons_person_id_persons_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."persons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_persons" ADD CONSTRAINT "case_persons_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_reactions" ADD CONSTRAINT "case_reactions_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_reactions" ADD CONSTRAINT "case_reactions_user_id_citizen_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."citizen_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_sources" ADD CONSTRAINT "case_sources_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_sources" ADD CONSTRAINT "case_sources_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cases" ADD CONSTRAINT "cases_era_id_presidential_eras_id_fk" FOREIGN KEY ("era_id") REFERENCES "public"."presidential_eras"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cases" ADD CONSTRAINT "cases_primary_province_id_provinces_id_fk" FOREIGN KEY ("primary_province_id") REFERENCES "public"."provinces"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cases" ADD CONSTRAINT "cases_verified_by_admin_users_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."admin_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comment_upvotes" ADD CONSTRAINT "comment_upvotes_comment_id_case_comments_id_fk" FOREIGN KEY ("comment_id") REFERENCES "public"."case_comments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comment_upvotes" ADD CONSTRAINT "comment_upvotes_user_id_citizen_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."citizen_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "companies" ADD CONSTRAINT "companies_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_records" ADD CONSTRAINT "financial_records_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_records" ADD CONSTRAINT "financial_records_person_id_persons_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."persons"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_records" ADD CONSTRAINT "financial_records_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "locations" ADD CONSTRAINT "locations_province_id_provinces_id_fk" FOREIGN KEY ("province_id") REFERENCES "public"."provinces"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "party_memberships" ADD CONSTRAINT "party_memberships_person_id_persons_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."persons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "party_memberships" ADD CONSTRAINT "party_memberships_party_id_parties_id_fk" FOREIGN KEY ("party_id") REFERENCES "public"."parties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "party_memberships" ADD CONSTRAINT "party_memberships_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "positions" ADD CONSTRAINT "positions_person_id_persons_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."persons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "positions" ADD CONSTRAINT "positions_province_id_provinces_id_fk" FOREIGN KEY ("province_id") REFERENCES "public"."provinces"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "positions" ADD CONSTRAINT "positions_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "public_reports" ADD CONSTRAINT "public_reports_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "public_reports" ADD CONSTRAINT "public_reports_reviewed_by_admin_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."admin_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_queue" ADD CONSTRAINT "review_queue_resolved_by_admin_users_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "public"."admin_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_updated_by_admin_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."admin_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timeline_events" ADD CONSTRAINT "timeline_events_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timeline_events" ADD CONSTRAINT "timeline_events_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verdicts" ADD CONSTRAINT "verdicts_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verdicts" ADD CONSTRAINT "verdicts_person_id_persons_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."persons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verdicts" ADD CONSTRAINT "verdicts_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_logs_entity_idx" ON "audit_logs" USING btree ("entity_id");--> statement-breakpoint
CREATE INDEX "audit_logs_created_idx" ON "audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "case_comments_case_idx" ON "case_comments" USING btree ("case_id");--> statement-breakpoint
CREATE UNIQUE INDEX "case_companies_unique_idx" ON "case_companies" USING btree ("case_id","company_id");--> statement-breakpoint
CREATE UNIQUE INDEX "case_locations_unique_idx" ON "case_locations" USING btree ("case_id","location_id");--> statement-breakpoint
CREATE UNIQUE INDEX "case_persons_unique_idx" ON "case_persons" USING btree ("case_id","person_id");--> statement-breakpoint
CREATE INDEX "case_persons_case_idx" ON "case_persons" USING btree ("case_id");--> statement-breakpoint
CREATE INDEX "case_persons_person_idx" ON "case_persons" USING btree ("person_id");--> statement-breakpoint
CREATE UNIQUE INDEX "case_reactions_case_user_idx" ON "case_reactions" USING btree ("case_id","user_id");--> statement-breakpoint
CREATE INDEX "cases_title_trgm_idx" ON "cases" USING gin ("case_title" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "cases_summary_trgm_idx" ON "cases" USING gin ("summary" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "cases_era_idx" ON "cases" USING btree ("era_id");--> statement-breakpoint
CREATE INDEX "cases_province_idx" ON "cases" USING btree ("primary_province_id");--> statement-breakpoint
CREATE INDEX "cases_status_idx" ON "cases" USING btree ("current_legal_status");--> statement-breakpoint
CREATE INDEX "cases_sector_idx" ON "cases" USING btree ("sector_category");--> statement-breakpoint
CREATE UNIQUE INDEX "comment_upvotes_unique_idx" ON "comment_upvotes" USING btree ("comment_id","user_id");--> statement-breakpoint
CREATE INDEX "companies_name_trgm_idx" ON "companies" USING gin ("name" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "financial_case_idx" ON "financial_records" USING btree ("case_id");--> statement-breakpoint
CREATE INDEX "financial_type_idx" ON "financial_records" USING btree ("financial_type");--> statement-breakpoint
CREATE INDEX "party_memberships_person_idx" ON "party_memberships" USING btree ("person_id");--> statement-breakpoint
CREATE INDEX "party_memberships_party_idx" ON "party_memberships" USING btree ("party_id");--> statement-breakpoint
CREATE INDEX "persons_full_name_trgm_idx" ON "persons" USING gin ("full_name" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "positions_person_idx" ON "positions" USING btree ("person_id");--> statement-breakpoint
CREATE INDEX "public_reports_status_idx" ON "public_reports" USING btree ("status");--> statement-breakpoint
CREATE INDEX "rate_limit_reset_idx" ON "rate_limit_buckets" USING btree ("reset_at");--> statement-breakpoint
CREATE INDEX "sources_url_idx" ON "sources" USING btree ("source_url");--> statement-breakpoint
CREATE INDEX "timeline_case_idx" ON "timeline_events" USING btree ("case_id");--> statement-breakpoint
CREATE INDEX "verdicts_case_idx" ON "verdicts" USING btree ("case_id");--> statement-breakpoint
CREATE INDEX "visitor_logs_ts_idx" ON "visitor_logs" USING btree ("timestamp");