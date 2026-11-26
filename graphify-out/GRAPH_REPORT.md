# Graph Report - korup.indo  (2026-11-26)

## Corpus Check
- 179 files · ~228,676 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 20 file(s) not represented in the graph (top: .csv 14, .example 1, (none) 1)

## Summary
- 923 nodes · 2353 edges · 38 communities (36 shown, 2 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 21 edges (avg confidence: 0.93)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Backend API & Auth Runtime
- Admin UI & Analytics Widgets
- Pre-Production Architecture Docs
- PostgreSQL Drizzle Schema
- Data Quality Report Generator
- User & Citizen Auth Management
- Portal Views & Historical Eras
- Provinces & Financial Aggregation
- Public v1 REST Endpoints
- Dataset Schema Validator
- Next.js App Router Pages
- Canonical Data Type Definitions
- Admin CRUD & Cases Managers
- Case Detail & OG Image SSR
- SQL Seed Generator Script
- Dataset Builder Pipeline
- Dataset Part 3 Ingestion
- Build & Tooling Configuration
- Provinces GeoJSON & AI Curator
- TypeScript Compiler Settings
- Entity Normalization Pipeline
- Portal Shell & Route Sync
- NPM Production Dependencies
- Case Comments & Reactions UI
- Next Config & Overview Routes
- Health, Sitemap & Env Config
- NPM Development Dependencies
- Package Automation Scripts
- Interactive Indonesia Choropleth Map
- Legal & National Favicon Identity
- Scrapbook Audio Feedback Utility
- Dataset Build Orchestrator & CSV
- Open Graph SVG Social Card
- Open Graph PNG Brand Banner
- Root Layout & Google OAuth
- Legacy v1 API Catch-All Proxy
- Vercel Deployment Preset Config
- PostCSS Tailwind Pipeline Config

## God Nodes (most connected - your core abstractions)
1. `apiSuccess()` - 92 edges
2. `next` - 59 edges
3. `apiError()` - 59 edges
4. `applyRateLimit()` - 55 edges
5. `react` - 48 edges
6. `requireAdminApi()` - 40 edges
7. `lucide-react` - 35 edges
8. `db` - 35 edges
9. `sound` - 34 edges
10. `drizzle-orm` - 33 edges

## Surprising Connections (you probably didn't know these)
- `Root README.md` --references--> `05-UI_UX_DESIGN_SYSTEM: Investigative Archival Dossier & Scrapbook`  [EXTRACTED]
  README.md → docs/05-UI_UX_DESIGN_SYSTEM.md
- `Financial Anti Double-Counting Guardrail` --conceptually_related_to--> `Zero-Hallucination & Provenance Research Methodology (Master Prompt v2026.09)`  [INFERRED]
  docs/01-PRD.md → data/README.md
- `Idempotent Canonical Seed Pipeline (db:seed)` --shares_data_with--> `13 Canonical Normalized Datasets (data/normalized/)`  [EXTRACTED]
  docs/03-DATABASE_SCHEMA.md → data/README.md
- `v1-legacy-archive Tagging & Asset Preservation Policy` --rationale_for--> `13 Canonical Normalized Datasets (data/normalized/)`  [EXTRACTED]
  docs/08-REBUILD_ROADMAP.md → data/README.md
- `GET()` --calls--> `getStaticDataset()`  [EXTRACTED]
  src/app/api/health/route.ts → src/server/static-dataset.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **End-to-End Financial Anti Double-Counting Pipeline** — data_readme_master_prompt_methodology, docs_01_prd_anti_double_counting, docs_03_database_schema_financial_aggregator, docs_05_ui_ux_design_system_key_components [EXTRACTED 1.00]
- **Presumption of Innocence Legal Compliance Stack** — docs_01_prd_presumption_of_innocence, docs_04_api_and_data_contracts_zod_validation, docs_05_ui_ux_design_system_legal_semantics, docs_06_security_legal_and_compliance_spec [EXTRACTED 1.00]
- **Serverless-Safe v2.0 Migration Architecture** — docs_readme_v1_audit, docs_02_architecture_serverless_pg_pooling, docs_03_database_schema_site_settings, docs_04_api_and_data_contracts_rate_limiting, docs_06_security_legal_and_compliance_auth_cookies [INFERRED 0.95]

## Communities (38 total, 2 thin omitted)

### Community 0 - "Backend API & Auth Runtime"
Cohesion: 0.05
Nodes (108): bcryptjs, dotenv, drizzle-orm, postgres, zod, maxDuration, POST(), aiReqSchema (+100 more)

### Community 1 - "Admin UI & Analytics Widgets"
Cohesion: 0.09
Nodes (35): lucide-react, recharts, AdminAiCurator(), AdminAiCuratorProps, ChatMessage, AdminAnnouncementManager(), AdminAnnouncementManagerProps, AnnouncementConfig (+27 more)

### Community 2 - "Pre-Production Architecture Docs"
Cohesion: 0.06
Nodes (32): Data Quality Control & Research Metrics Report (v2026.09), Segregated Financial Accumulations (Section 20 & 59), Historical Corruption Case Dataset Documentation (1945-2026), Historical Landmark Corruption Cases (1945-1998), 13 Canonical Normalized Datasets (data/normalized/), Human-in-the-Loop AI Curator (/admin/ai-curator), Hak Jawab & Public Correction Channel (/lapor, 2x24h SLA), Public Functional Modules (M1-M7) (+24 more)

### Community 3 - "PostgreSQL Drizzle Schema"
Cohesion: 0.05
Nodes (42): adminRoleEnum, adminUsers, auditActionEnum, auditLogs, caseComments, caseCompanies, caseLocations, casePersons (+34 more)

### Community 4 - "Data Quality Report Generator"
Cohesion: 0.05
Nodes (34): BASE_DIR, caseLocations, casePersons, cases, cases_per_era, cases_per_mode, cases_per_province, cases_per_sector (+26 more)

### Community 5 - "User & Citizen Auth Management"
Cohesion: 0.11
Nodes (27): react-dom, AdminUserItem, AdminUsersManager(), AdminUsersManagerProps, CitizenUserItem, ROLE_CONFIG, CitizenAuthModal(), CitizenAuthModalProps (+19 more)

### Community 6 - "Portal Views & Historical Eras"
Cohesion: 0.10
Nodes (30): PortalDataSnapshot, ModalProps, IndonesiaMapProps, LandingPageProps, getProvinceIsland(), HISTORICAL_ERAS, HistoricalEra, ISLAND_CLUSTERS (+22 more)

### Community 7 - "Provinces & Financial Aggregation"
Cohesion: 0.14
Nodes (29): mapSectorToCategory(), toNum(), CANONICAL_PROVINCES, CanonicalProvince, LOOKUP_MAP, resolveProvinceId(), calculateAntiDoubleCounting(), deriveCaseStatus() (+21 more)

### Community 8 - "Public v1 REST Endpoints"
Cohesion: 0.17
Nodes (22): GET(), GET(), GET(), csvEscape(), GET(), toCsv(), GET(), GET() (+14 more)

### Community 9 - "Dataset Schema Validator"
Cohesion: 0.07
Nodes (27): BASE_DIR, caseCompanies, caseIds, caseLocations, casePersons, cases, companies, companyIds (+19 more)

### Community 10 - "Next.js App Router Pages"
Cohesion: 0.11
Nodes (20): AdminPage(), metadata, CariPage(), metadata, KlasemenPage(), metadata, LaporPage(), metadata (+12 more)

### Community 11 - "Canonical Data Type Definitions"
Cohesion: 0.10
Nodes (25): CaseCompany, CaseLocation, CasePerson, CaseRecord, CourtLevel, FactClassification, FinancialCategory, FinancialRecord (+17 more)

### Community 12 - "Admin CRUD & Cases Managers"
Cohesion: 0.21
Nodes (19): react, AdminCasesManager(), CasesManagerProps, AdminDashboardOverview(), DashboardOverviewProps, AdminManualCaseManagerProps, AdminOfficialsManager(), OfficialsManagerProps (+11 more)

### Community 13 - "Case Detail & OG Image SSR"
Cohesion: 0.13
Nodes (19): CaseOgImage(), contentType, size, CaseSlugPage(), generateMetadata(), revalidate, ERA_MAPPING_BY_NAME, formatRupiah() (+11 more)

### Community 14 - "SQL Seed Generator Script"
Cohesion: 0.10
Nodes (20): appendInserts(), BASE_DIR, caseCompanies, caseLocations, casePersons, cases, companies, financialRecords (+12 more)

### Community 15 - "Dataset Builder Pipeline"
Cohesion: 0.10
Nodes (20): BASE_DIR, caseCompanies, caseLocations, casePersons, cases, companies, financialRecords, locations (+12 more)

### Community 16 - "Dataset Part 3 Ingestion"
Cohesion: 0.10
Nodes (19): BASE_DIR, caseCompanies, caseLocations, casePersons, cases, companies, financialRecords, locations (+11 more)

### Community 17 - "Build & Tooling Configuration"
Cohesion: 0.11
Nodes (17): name, private, type, version, drizzle-kit, eslint, eslint-config-next, google-auth-library (+9 more)

### Community 18 - "Provinces GeoJSON & AI Curator"
Cohesion: 0.12
Nodes (12): @google/genai, vitest, INDONESIA_PROVINCES_GEO, ProvincePolygon, AiChatMessage, AiCuratorDraft, AiCuratorResponse, fallbackRuleParser() (+4 more)

### Community 19 - "TypeScript Compiler Settings"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 20 - "Entity Normalization Pipeline"
Cohesion: 0.12
Nodes (16): Company, Location, Party, PartyMembership, Person, Position, Source, BASE_DIR (+8 more)

### Community 21 - "Portal Shell & Route Sync"
Cohesion: 0.20
Nodes (15): AdminPanel, App(), IndonesiaMap, LeaderboardTable, pathnameToTab(), PortalTab, ReportModal, SearchCasesView (+7 more)

### Community 22 - "NPM Production Dependencies"
Cohesion: 0.12
Nodes (16): dependencies, bcryptjs, dotenv, drizzle-orm, google-auth-library, @google/genai, html-to-image, jose (+8 more)

### Community 23 - "Case Comments & Reactions UI"
Cohesion: 0.15
Nodes (13): AdminCommentItem, AdminCommentsManager(), AdminCommentsManagerProps, AdminCommentUser, CaseComment, CaseCommentsSectionProps, CommentUser, CaseReactionsSectionProps (+5 more)

### Community 24 - "Next Config & Overview Routes"
Cohesion: 0.18
Nodes (7): cspDirectives, nextConfig, next, GET(), GET(), config, queryStatsOverview()

### Community 25 - "Health, Sitemap & Env Config"
Cohesion: 0.18
Nodes (10): GET(), GET(), dynamic, sitemap(), envSchema, isDatabaseConfigured, isVercel, parsed (+2 more)

### Community 26 - "NPM Development Dependencies"
Cohesion: 0.17
Nodes (12): devDependencies, drizzle-kit, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/bcryptjs, @types/node (+4 more)

### Community 27 - "Package Automation Scripts"
Cohesion: 0.17
Nodes (12): scripts, build, data:validate, db:bootstrap-admin, db:push, db:seed, db:setup-prod, dev (+4 more)

### Community 28 - "Interactive Indonesia Choropleth Map"
Cohesion: 0.21
Nodes (8): IndonesiaMap(), normalizeName(), ISLAND_TIERS, KASUS_TIERS, KERUGIAN_TIERS, SeverityTier, WatercolorLadder(), WatercolorLadderProps

### Community 29 - "Legal & National Favicon Identity"
Cohesion: 0.27
Nodes (11): Amber Gold and Crimson Color Palette, Court Document Stamp Badge, Korup.indo Favicon Icon, Indonesian National Identity, Indonesian Red-and-White Flag Badge, Red and White Indonesian Badge Ribbon, Justice, Law, and Anti-Corruption Branding, Indonesian Legal and Justice Branding (+3 more)

### Community 31 - "Dataset Build Orchestrator & CSV"
Cohesion: 0.20
Nodes (4): steps, BASE_DIR, datasets, NORMALIZED_DIR

### Community 32 - "Open Graph SVG Social Card"
Cohesion: 0.27
Nodes (9): LIGA KORUPSI INDONESIA Brand & Title, Feature Card: Klasemen Liga (Pejabat & Partai Politik), Feature Card: Peta Spasial 38 Prov (Choropleth Map), Feature Card: Praduga Tak Bersalah (Legal Compliance), Scrapbook Color Palette & Typography (Plus Jakarta Sans, Baloo 2), 1200x630 Scrapbook Paper & Washi Tape Card Layout, MA & KPK Public Court Decision Directories, Open Graph Image (og-image.svg) (+1 more)

### Community 33 - "Open Graph PNG Brand Banner"
Cohesion: 0.36
Nodes (8): Open Graph Banner - Liga Korupsi Indonesia, Liga Korupsi Indonesia Two-Tone Typography & Subtitle, Praduga Tak Bersalah Feature Card (Kepatuhan Hukum, Direktori MA & KPK), Peta Spasial 38 Prov Feature Card (Choropleth & Sebaran Kerugian), Klasemen Liga Feature Card (Pejabat, Partai Politik, Era & Ekspor CSV), Dokumen Putusan Peradilan Terbuka Footer, Portal Transparansi Perkara Publik Pill Badge, Dashed Border & Sticky-Tape Dossier Visual Theme

### Community 34 - "Root Layout & Google OAuth"
Cohesion: 0.38
Nodes (4): @react-oauth/google, metadata, RootLayout(), ClientProviders()

### Community 35 - "Legacy v1 API Catch-All Proxy"
Cohesion: 0.52
Nodes (6): DELETE(), GET(), PATCH(), POST(), PUT(), safeInvoke()

### Community 36 - "Vercel Deployment Preset Config"
Cohesion: 0.50
Nodes (3): buildCommand, framework, $schema

## Knowledge Gaps
- **393 isolated node(s):** `PresidentialEra`, `GovernmentLevel`, `LegalStatus`, `CourtLevel`, `SourceType` (+388 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 423 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `Next Config & Overview Routes` to `Backend API & Auth Runtime`, `Admin UI & Analytics Widgets`, `Root Layout & Google OAuth`, `Legacy v1 API Catch-All Proxy`, `User & Citizen Auth Management`, `Provinces & Financial Aggregation`, `Public v1 REST Endpoints`, `Next.js App Router Pages`, `Case Detail & OG Image SSR`, `Build & Tooling Configuration`, `Portal Shell & Route Sync`, `Health, Sitemap & Env Config`?**
  _High betweenness centrality (0.163) - this node is a cross-community bridge._
- **Why does `react` connect `Admin CRUD & Cases Managers` to `Admin UI & Analytics Widgets`, `Root Layout & Google OAuth`, `User & Citizen Auth Management`, `Portal Views & Historical Eras`, `Next.js App Router Pages`, `Case Detail & OG Image SSR`, `Build & Tooling Configuration`, `Portal Shell & Route Sync`, `Case Comments & Reactions UI`, `Interactive Indonesia Choropleth Map`?**
  _High betweenness centrality (0.082) - this node is a cross-community bridge._
- **Why does `drizzle-orm` connect `Backend API & Auth Runtime` to `PostgreSQL Drizzle Schema`, `Provinces & Financial Aggregation`, `Public v1 REST Endpoints`, `Build & Tooling Configuration`, `Health, Sitemap & Env Config`?**
  _High betweenness centrality (0.054) - this node is a cross-community bridge._
- **What connects `PresidentialEra`, `GovernmentLevel`, `LegalStatus` to the rest of the system?**
  _393 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Backend API & Auth Runtime` be split into smaller, more focused modules?**
  _Cohesion score 0.05330617095322978 - nodes in this community are weakly interconnected._
- **Should `Admin UI & Analytics Widgets` be split into smaller, more focused modules?**
  _Cohesion score 0.08788159111933395 - nodes in this community are weakly interconnected._
- **Should `Pre-Production Architecture Docs` be split into smaller, more focused modules?**
  _Cohesion score 0.0647342995169082 - nodes in this community are weakly interconnected._