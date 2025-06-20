-- ================================================================
-- PROPER MIGRATION STEP 4: Create Additional Intelligence Tables
-- These tables handle complex mappings and business rules
-- ================================================================

BEGIN;

-- 1. Create term equivalencies table (for synonyms)
CREATE TABLE IF NOT EXISTS term_equivalencies (
    id SERIAL PRIMARY KEY,
    term_group VARCHAR(50) NOT NULL,
    canonical_term VARCHAR(100) NOT NULL,
    equivalent_terms TEXT[] NOT NULL,
    context VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Add indexes
CREATE INDEX idx_equiv_canonical ON term_equivalencies(canonical_term);
CREATE INDEX idx_equiv_context ON term_equivalencies(context);

-- Populate with common equivalencies
INSERT INTO term_equivalencies (term_group, canonical_term, equivalent_terms, context)
VALUES 
    -- Jacket equivalencies
    ('jacket', 'Riser', ARRAY['CMR', 'PVC', 'Non-Plenum', 'Non Plenum', 'Nonplenum'], 'jacket'),
    ('jacket', 'Plenum', ARRAY['CMP', 'Plenum Rated', 'Plenum-Rated'], 'jacket'),
    ('jacket', 'LSZH', ARRAY['LS0H', 'Low Smoke', 'Zero Halogen', 'Low Smoke Zero Halogen'], 'jacket'),
    
    -- Product type equivalencies
    ('product', 'Surface Mount Box', ARRAY['SMB', 'S.M.B', 'S.M.B.', 'S M B', 'Surface Mount'], 'product'),
    ('product', 'Fiber Connectors', ARRAY['Fiber Ends', 'Fiber Terminations', 'Fiber Terminators'], 'product'),
    ('product', 'Patch Panel', ARRAY['Patchpanel', 'Patch-Panel', 'Patch Panels'], 'product'),
    
    -- Measurement equivalencies
    ('measurement', 'feet', ARRAY['ft', 'foot', 'FT', 'Feet'], 'length'),
    ('measurement', 'meters', ARRAY['m', 'meter', 'M', 'Meters'], 'length')
ON CONFLICT DO NOTHING;

-- 2. Create business rules table
CREATE TABLE IF NOT EXISTS business_rules (
    id SERIAL PRIMARY KEY,
    rule_name VARCHAR(100) UNIQUE NOT NULL,
    rule_type VARCHAR(50) NOT NULL, -- 'redirect', 'validation', 'conversion'
    condition_pattern TEXT,
    action_type VARCHAR(50), -- 'replace', 'append', 'multiply', 'validate'
    action_value TEXT,
    priority INTEGER DEFAULT 100,
    is_active BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Populate business rules
INSERT INTO business_rules (rule_name, rule_type, condition_pattern, action_type, action_value, priority, notes)
VALUES 
    -- Core business rules
    ('cat5_redirect', 'redirect', 'cat5|category 5', 'replace', 'cat5e', 1000, 'Always redirect Cat5 to Cat5e'),
    ('box_conversion', 'conversion', '[0-9]+ box(es)?', 'multiply', '1000', 900, 'Convert boxes to feet'),
    ('pair_conversion', 'conversion', '[0-9]+ pair(s)?', 'multiply', '2', 900, 'Convert fiber pairs to strands'),
    
    -- Validation rules
    ('min_cable_length', 'validation', 'cable|patch cord', 'validate', '{"min_length": 1, "max_length": 1000}', 800, 'Validate cable length range'),
    ('valid_categories', 'validation', 'category|cat', 'validate', '["Category 5e", "Category 6", "Category 6A"]', 800, 'Valid category ratings')
ON CONFLICT (rule_name) DO NOTHING;

-- 3. Create color mappings table
CREATE TABLE IF NOT EXISTS color_mappings (
    id SERIAL PRIMARY KEY,
    color_name VARCHAR(50) NOT NULL,
    color_codes TEXT[] NOT NULL,
    hex_values TEXT[],
    is_active BOOLEAN DEFAULT true
);

-- Populate color mappings
INSERT INTO color_mappings (color_name, color_codes, hex_values)
VALUES 
    ('White', ARRAY['WH', 'WHT', 'W'], ARRAY['#FFFFFF', '#F5F5F5']),
    ('Black', ARRAY['BK', 'BLK', 'B'], ARRAY['#000000', '#1A1A1A']),
    ('Blue', ARRAY['BL', 'BLU'], ARRAY['#0000FF', '#0066CC']),
    ('Red', ARRAY['RD', 'RED', 'R'], ARRAY['#FF0000', '#CC0000']),
    ('Green', ARRAY['GR', 'GRN', 'G'], ARRAY['#00FF00', '#009900']),
    ('Yellow', ARRAY['YL', 'YEL', 'Y'], ARRAY['#FFFF00', '#FFD700']),
    ('Orange', ARRAY['OR', 'ORG', 'O'], ARRAY['#FFA500', '#FF8C00']),
    ('Gray', ARRAY['GY', 'GRY', 'GREY'], ARRAY['#808080', '#A9A9A9']),
    ('Purple', ARRAY['PR', 'PUR', 'P'], ARRAY['#800080', '#9370DB']),
    ('Brown', ARRAY['BR', 'BRN'], ARRAY['#964B00', '#8B4513'])
ON CONFLICT DO NOTHING;

-- 4. Create search analytics enhancement table
CREATE TABLE IF NOT EXISTS search_term_usage (
    id SERIAL PRIMARY KEY,
    search_term_id INTEGER REFERENCES search_terms(id),
    times_used INTEGER DEFAULT 0,
    successful_matches INTEGER DEFAULT 0,
    failed_matches INTEGER DEFAULT 0,
    last_used TIMESTAMP,
    avg_result_count NUMERIC(10,2),
    created_at TIMESTAMP DEFAULT NOW()
);

-- 5. Create function to log search term usage
CREATE OR REPLACE FUNCTION log_search_term_usage(
    p_search_term TEXT,
    p_was_successful BOOLEAN,
    p_result_count INTEGER
)
RETURNS VOID AS $$
DECLARE
    term_id INTEGER;
BEGIN
    -- Find the search term
    SELECT id INTO term_id
    FROM search_terms
    WHERE search_term = p_search_term
    LIMIT 1;
    
    IF term_id IS NOT NULL THEN
        INSERT INTO search_term_usage (search_term_id, times_used, successful_matches, failed_matches, last_used, avg_result_count)
        VALUES (term_id, 1, 
                CASE WHEN p_was_successful THEN 1 ELSE 0 END,
                CASE WHEN p_was_successful THEN 0 ELSE 1 END,
                NOW(),
                p_result_count)
        ON CONFLICT (search_term_id) DO UPDATE
        SET times_used = search_term_usage.times_used + 1,
            successful_matches = search_term_usage.successful_matches + CASE WHEN p_was_successful THEN 1 ELSE 0 END,
            failed_matches = search_term_usage.failed_matches + CASE WHEN p_was_successful THEN 0 ELSE 1 END,
            last_used = NOW(),
            avg_result_count = ((search_term_usage.avg_result_count * search_term_usage.times_used) + p_result_count) / (search_term_usage.times_used + 1);
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 6. Create view for search intelligence overview
CREATE OR REPLACE VIEW search_intelligence_overview AS
SELECT 
    'Total Search Terms' as metric,
    COUNT(*) as value
FROM search_terms
WHERE is_active = true
UNION ALL
SELECT 
    'Active Redirects',
    COUNT(*)
FROM search_terms
WHERE context = 'redirect' AND is_active = true
UNION ALL
SELECT 
    'Jacket Mappings',
    COUNT(*)
FROM search_terms
WHERE context = 'jacket' AND is_active = true
UNION ALL
SELECT 
    'Brand Mappings',
    COUNT(*)
FROM search_terms
WHERE context = 'brand' AND is_active = true
UNION ALL
SELECT 
    'Business Rules',
    COUNT(*)
FROM business_rules
WHERE is_active = true
UNION ALL
SELECT 
    'Color Mappings',
    COUNT(*)
FROM color_mappings
WHERE is_active = true;

-- 7. Test the complete system
SELECT '=== SEARCH INTELLIGENCE OVERVIEW ===' as test;
SELECT * FROM search_intelligence_overview;

SELECT '=== TEST COMPLETE SEARCH ===' as test;
SELECT * FROM extract_search_attributes('I need 4 boxes of cat5 plenum cable from panduit');

SELECT '=== EQUIVALENCY TEST ===' as test;
SELECT canonical_term, equivalent_terms
FROM term_equivalencies
WHERE 'cmr' = ANY(equivalent_terms);

COMMIT;

-- Summary
SELECT '✅ Step 4 Complete: Additional intelligence tables created!' as status,
       'Run PROPER_MIGRATION_VERIFY.sql to verify everything' as next_step;