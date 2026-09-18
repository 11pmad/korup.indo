-- =============================================================================
-- LIGA KORUPSI INDONESIA (LKI) - ANALYTICAL VIEWS
-- PostgreSQL Views for Dashboard, Spatial Map, Statistics, and Case Explorer
-- Anti Double Counting strictly enforced across all financial aggregations
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. VIEW: KLASEMEN PEJABAT PUBLIK / INDIVIDU (LEADERBOARD)
-- Catatan: Hanya menghitung kerugian negara dan uang pengganti yang terbukti
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_leaderboard_officials AS
SELECT
    p.person_id,
    p.full_name,
    p.normalized_name,
    pos.position_title AS current_or_offense_position,
    pos.institution,
    pos.government_level,
    pty.party_name,
    pty.party_abbreviation,
    cp.legal_status AS current_legal_status,
    COUNT(DISTINCT c.case_id) AS total_cases,
    COALESCE(SUM(CASE WHEN fin.financial_type = 'court_recognized_loss_amount' THEN fin.amount ELSE 0 END), 0) AS total_court_recognized_loss,
    COALESCE(SUM(CASE WHEN fin.financial_type = 'restitution_amount' THEN fin.amount ELSE 0 END), 0) AS total_restitution_ordered,
    COALESCE(SUM(CASE WHEN fin.financial_type = 'bribe_amount' THEN fin.amount ELSE 0 END), 0) AS total_bribe_received,
    COALESCE(MAX(v.prison_sentence_months), 0) AS max_prison_months,
    BOOL_OR(v.is_final) AS has_inkrah_verdict
FROM persons p
LEFT JOIN case_persons cp ON p.person_id = cp.person_id
LEFT JOIN cases c ON cp.case_id = c.case_id
LEFT JOIN positions pos ON p.person_id = pos.person_id AND pos.position_at_offense = TRUE
LEFT JOIN party_memberships pm ON p.person_id = pm.person_id AND pm.party_at_offense = TRUE
LEFT JOIN parties pty ON pm.party_id = pty.party_id
LEFT JOIN financial_records fin ON c.case_id = fin.case_id AND (fin.person_id = p.person_id OR fin.person_id IS NULL)
LEFT JOIN verdicts v ON c.case_id = v.case_id AND v.person_id = p.person_id
GROUP BY
    p.person_id,
    p.full_name,
    p.normalized_name,
    pos.position_title,
    pos.institution,
    pos.government_level,
    pty.party_name,
    pty.party_abbreviation,
    cp.legal_status;

-- -----------------------------------------------------------------------------
-- 2. VIEW: AGREGASI SPASIAL PROVINSI (CHOROPLETH MAP)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_spatial_provinces AS
SELECT
    loc.province,
    loc.island_cluster,
    COUNT(DISTINCT c.case_id) AS total_cases,
    COUNT(DISTINCT cp.person_id) AS total_persons_involved,
    COALESCE(SUM(CASE WHEN fin.financial_type = 'court_recognized_loss_amount' THEN fin.amount ELSE 0 END), 0) AS total_court_loss_amount,
    COALESCE(SUM(CASE WHEN fin.financial_type = 'audit_loss_amount' THEN fin.amount ELSE 0 END), 0) AS total_audit_loss_amount,
    COALESCE(SUM(CASE WHEN fin.financial_type = 'restitution_amount' THEN fin.amount ELSE 0 END), 0) AS total_restitution_amount
FROM locations loc
JOIN case_locations cl ON loc.location_id = cl.location_id
JOIN cases c ON cl.case_id = c.case_id
LEFT JOIN case_persons cp ON c.case_id = cp.case_id
LEFT JOIN financial_records fin ON c.case_id = fin.case_id
GROUP BY
    loc.province,
    loc.island_cluster;

-- -----------------------------------------------------------------------------
-- 3. VIEW: STATISTIK SEKTOR DAN MODUS OPERANDI
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_stats_sectors AS
SELECT
    c.sector,
    c.primary_mode,
    COUNT(DISTINCT c.case_id) AS case_count,
    COUNT(DISTINCT cp.person_id) AS person_count,
    COALESCE(SUM(CASE WHEN fin.financial_type = 'court_recognized_loss_amount' THEN fin.amount ELSE 0 END), 0) AS total_court_loss,
    COALESCE(SUM(CASE WHEN fin.financial_type = 'bribe_amount' THEN fin.amount ELSE 0 END), 0) AS total_bribe,
    COALESCE(SUM(CASE WHEN fin.financial_type = 'illegal_profit_amount' THEN fin.amount ELSE 0 END), 0) AS total_illegal_profit
FROM cases c
LEFT JOIN case_persons cp ON c.case_id = cp.case_id
LEFT JOIN financial_records fin ON c.case_id = fin.case_id
GROUP BY
    c.sector,
    c.primary_mode;

-- -----------------------------------------------------------------------------
-- 4. VIEW: TREN ERA PEMERINTAHAN (TEMPORAL METADATA ONLY)
-- Sesuai Section 1 & Section 35: Murni metadata temporal, bukan atribusi kausal
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_stats_presidential_eras AS
SELECT
    c.era_pemerintahan,
    COUNT(DISTINCT c.case_id) AS total_cases,
    COUNT(DISTINCT cp.person_id) AS total_persons,
    COUNT(DISTINCT CASE WHEN cp.legal_status = 'divonis_inkrah' THEN cp.person_id END) AS inkrah_convictions,
    COALESCE(SUM(CASE WHEN fin.financial_type = 'court_recognized_loss_amount' THEN fin.amount ELSE 0 END), 0) AS total_court_recognized_loss,
    COALESCE(SUM(CASE WHEN fin.financial_type = 'restitution_amount' THEN fin.amount ELSE 0 END), 0) AS total_restitution_amount
FROM cases c
LEFT JOIN case_persons cp ON c.case_id = cp.case_id
LEFT JOIN financial_records fin ON c.case_id = fin.case_id
GROUP BY
    c.era_pemerintahan
ORDER BY
    MIN(c.case_date) ASC;

