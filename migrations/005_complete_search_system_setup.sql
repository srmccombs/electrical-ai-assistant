-- Complete Search System Setup
-- This builds a comprehensive, scalable search infrastructure

BEGIN;

-- =====================================================
-- STEP 1: Populate search_terms table comprehensively
-- =====================================================
SELECT 'Populating comprehensive search terms...' as status;

-- Clear and repopulate with complete data
TRUNCATE TABLE search_terms;

-- Category Cable Search Terms
INSERT INTO search_terms (term_group, search_term, categories, jackets, shielding, applicable_tables) VALUES
-- Category variations
('category', 'cat5e', ARRAY['Category 5e'], NULL, NULL, ARRAY['prod_category_cables']),
('category', 'cat 5e', ARRAY['Category 5e'], NULL, NULL, ARRAY['prod_category_cables']),
('category', 'cat5', ARRAY['Category 5e'], NULL, NULL, ARRAY['prod_category_cables']),
('category', 'category 5e', ARRAY['Category 5e'], NULL, NULL, ARRAY['prod_category_cables']),
('category', 'cat6', ARRAY['Category 6'], NULL, NULL, ARRAY['prod_category_cables']),
('category', 'cat 6', ARRAY['Category 6'], NULL, NULL, ARRAY['prod_category_cables']),
('category', 'category 6', ARRAY['Category 6'], NULL, NULL, ARRAY['prod_category_cables']),
('category', 'cat6a', ARRAY['Category 6a'], NULL, NULL, ARRAY['prod_category_cables']),
('category', 'cat 6a', ARRAY['Category 6a'], NULL, NULL, ARRAY['prod_category_cables']),
('category', 'category 6a', ARRAY['Category 6a'], NULL, NULL, ARRAY['prod_category_cables']),

-- Jacket variations
('jacket', 'plenum', NULL, ARRAY['CMP'], NULL, ARRAY['prod_category_cables']),
('jacket', 'cmp', NULL, ARRAY['CMP'], NULL, ARRAY['prod_category_cables']),
('jacket', 'fire rated', NULL, ARRAY['CMP'], NULL, ARRAY['prod_category_cables']),
('jacket', 'riser', NULL, ARRAY['CMR'], NULL, ARRAY['prod_category_cables']),
('jacket', 'cmr', NULL, ARRAY['CMR'], NULL, ARRAY['prod_category_cables']),
('jacket', 'vertical', NULL, ARRAY['CMR'], NULL, ARRAY['prod_category_cables']),
('jacket', 'lszh', NULL, ARRAY['LSZH'], NULL, ARRAY['prod_category_cables']),
('jacket', 'low smoke', NULL, ARRAY['LSZH'], NULL, ARRAY['prod_category_cables']),
('jacket', 'zero halogen', NULL, ARRAY['LSZH'], NULL, ARRAY['prod_category_cables']),

-- Shielding variations
('shielding', 'utp', NULL, NULL, ARRAY['UTP'], ARRAY['prod_category_cables']),
('shielding', 'unshielded', NULL, NULL, ARRAY['UTP'], ARRAY['prod_category_cables']),
('shielding', 'stp', NULL, NULL, ARRAY['F/UTP', 'S/FTP'], ARRAY['prod_category_cables']),
('shielding', 'shielded', NULL, NULL, ARRAY['F/UTP', 'U/FTP', 'F/FTP', 'S/FTP', 'SF/UTP'], ARRAY['prod_category_cables']),
('shielding', 'ftp', NULL, NULL, ARRAY['U/FTP'], ARRAY['prod_category_cables']),
('shielding', 'sftp', NULL, NULL, ARRAY['S/FTP'], ARRAY['prod_category_cables']),

-- Common misspellings
('misspelling', 'eithernet', ARRAY['Category 5e', 'Category 6', 'Category 6a'], NULL, NULL, ARRAY['prod_category_cables']),
('misspelling', 'ethenet', ARRAY['Category 5e', 'Category 6', 'Category 6a'], NULL, NULL, ARRAY['prod_category_cables']),
('misspelling', 'cat5 e', ARRAY['Category 5e'], NULL, NULL, ARRAY['prod_category_cables']),
('misspelling', 'cat6 a', ARRAY['Category 6a'], NULL, NULL, ARRAY['prod_category_cables']),
('misspelling', 'plenium', NULL, ARRAY['CMP'], NULL, ARRAY['prod_category_cables']),
('misspelling', 'plennum', NULL, ARRAY['CMP'], NULL, ARRAY['prod_category_cables']),

-- Generic terms
('generic', 'ethernet', ARRAY['Category 5e', 'Category 6', 'Category 6a'], NULL, NULL, ARRAY['prod_category_cables']),
('generic', 'ethernet cable', ARRAY['Category 5e', 'Category 6', 'Category 6a'], NULL, NULL, ARRAY['prod_category_cables']),
('generic', 'network cable', ARRAY['Category 5e', 'Category 6', 'Category 6a'], NULL, NULL, ARRAY['prod_category_cables']),
('generic', 'lan cable', ARRAY['Category 5e', 'Category 6', 'Category 6a'], NULL, NULL, ARRAY['prod_category_cables']),
('generic', 'patch cable', ARRAY['Category 5e', 'Category 6', 'Category 6a'], NULL, NULL, ARRAY['prod_category_cables']),
('generic', 'data cable', ARRAY['Category 5e', 'Category 6', 'Category 6a'], NULL, NULL, ARRAY['prod_category_cables']);

-- =====================================================
-- STEP 2: Create optimized indexes on all product tables
-- =====================================================
SELECT 'Creating performance indexes...' as status;

-- prod_category_cables indexes
CREATE INDEX IF NOT EXISTS idx_prod_cables_brand ON prod_category_cables(brand);
CREATE INDEX IF NOT EXISTS idx_prod_cables_brand_normalized ON prod_category_cables(brand_normalized);
CREATE INDEX IF NOT EXISTS idx_prod_cables_jacket_code ON prod_category_cables(jacket_code);
CREATE INDEX IF NOT EXISTS idx_prod_cables_shielding ON prod_category_cables("Shielding_Type");
CREATE INDEX IF NOT EXISTS idx_prod_cables_category_rating ON prod_category_cables(category_rating);
CREATE INDEX IF NOT EXISTS idx_prod_cables_jacket_color ON prod_category_cables(jacket_color);
CREATE INDEX IF NOT EXISTS idx_prod_cables_part_number ON prod_category_cables(part_number);
CREATE INDEX IF NOT EXISTS idx_prod_cables_active ON prod_category_cables(is_active) WHERE is_active = true;

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_prod_cables_category_jacket ON prod_category_cables(category_rating, jacket_code);
CREATE INDEX IF NOT EXISTS idx_prod_cables_brand_category ON prod_category_cables(brand_normalized, category_rating);

-- =====================================================
-- STEP 3: Create advanced search function
-- =====================================================
CREATE OR REPLACE FUNCTION search_products_advanced(
    p_search_term TEXT,
    p_table_name TEXT DEFAULT NULL,
    p_limit INT DEFAULT 100,
    p_offset INT DEFAULT 0
) RETURNS TABLE (
    table_name TEXT,
    id BIGINT,
    part_number VARCHAR,
    brand VARCHAR,
    description TEXT,
    rank REAL,
    matched_terms TEXT[]
) AS $$
DECLARE
    v_tsquery tsquery;
    v_search_terms TEXT[];
    v_matched_terms TEXT[];
BEGIN
    -- Parse search terms
    v_search_terms := string_to_array(lower(p_search_term), ' ');
    v_tsquery := plainto_tsquery('english', p_search_term);
    
    -- Search category cables
    IF p_table_name IS NULL OR p_table_name = 'prod_category_cables' THEN
        RETURN QUERY
        SELECT 
            'prod_category_cables'::TEXT,
            c.id,
            c.part_number,
            c.brand,
            c.short_description,
            ts_rank(c.search_vector, v_tsquery) as rank,
            ARRAY(
                SELECT DISTINCT unnest(v_search_terms) 
                WHERE c.computed_search_terms ILIKE '%' || unnest(v_search_terms) || '%'
            ) as matched_terms
        FROM prod_category_cables c
        WHERE c.search_vector @@ v_tsquery
           OR c.part_number ILIKE '%' || p_search_term || '%'
           OR c.computed_search_terms ILIKE '%' || p_search_term || '%'
        ORDER BY 
            CASE WHEN c.part_number = p_search_term THEN 0 ELSE 1 END,
            ts_rank(c.search_vector, v_tsquery) DESC,
            c.part_number
        LIMIT p_limit
        OFFSET p_offset;
    END IF;
    
    -- Add other product tables as they're ready
    -- TODO: Add prod_fiber_connectors, prod_jack_modules, etc.
    
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- STEP 4: Create materialized view for ultra-fast search
-- =====================================================
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_product_search AS
SELECT 
    'prod_category_cables' as table_name,
    id,
    part_number,
    brand,
    brand_normalized,
    short_description,
    category_rating,
    jacket_code,
    jacket_color,
    "Shielding_Type" as shielding_type,
    search_vector,
    computed_search_terms,
    is_active
FROM prod_category_cables
WHERE is_active = true

UNION ALL

SELECT 
    'prod_fiber_connectors' as table_name,
    id,
    part_number,
    brand,
    brand_normalized,
    short_description,
    NULL as category_rating,
    NULL as jacket_code,
    NULL as jacket_color,
    NULL as shielding_type,
    search_vector,
    computed_search_terms,
    is_active
FROM prod_fiber_connectors
WHERE is_active = true AND search_vector IS NOT NULL

-- Add more UNION ALL statements for other product tables

WITH DATA;

-- Create indexes on materialized view
CREATE INDEX idx_mv_search_vector ON mv_product_search USING GIN(search_vector);
CREATE INDEX idx_mv_part_number ON mv_product_search(part_number);
CREATE INDEX idx_mv_brand ON mv_product_search(brand_normalized);
CREATE INDEX idx_mv_table ON mv_product_search(table_name);

-- =====================================================
-- STEP 5: Create search analytics tracking
-- =====================================================
CREATE TABLE IF NOT EXISTS search_analytics_enhanced (
    id BIGSERIAL PRIMARY KEY,
    search_term TEXT NOT NULL,
    cleaned_search_term TEXT,
    search_vector tsvector,
    results_count INT DEFAULT 0,
    clicked_results JSONB,
    search_duration_ms INT,
    user_session VARCHAR(255),
    ip_address INET,
    user_agent TEXT,
    searched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- New fields for better analytics
    search_type VARCHAR(50), -- 'direct', 'filtered', 'advanced'
    filters_applied JSONB,
    result_quality_score FLOAT,
    did_user_refine BOOLEAN DEFAULT FALSE,
    refined_search_term TEXT
);

CREATE INDEX idx_search_analytics_term ON search_analytics_enhanced(search_term);
CREATE INDEX idx_search_analytics_date ON search_analytics_enhanced(searched_at);
CREATE INDEX idx_search_analytics_session ON search_analytics_enhanced(user_session);

-- =====================================================
-- STEP 6: Create search suggestions table
-- =====================================================
CREATE TABLE IF NOT EXISTS search_suggestions (
    id SERIAL PRIMARY KEY,
    original_term TEXT NOT NULL,
    suggested_term TEXT NOT NULL,
    suggestion_type VARCHAR(50), -- 'spelling', 'synonym', 'category', 'brand'
    confidence_score FLOAT DEFAULT 1.0,
    usage_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(original_term, suggested_term)
);

-- Populate initial suggestions
INSERT INTO search_suggestions (original_term, suggested_term, suggestion_type) VALUES
('cat5', 'cat5e', 'spelling'),
('cat 5', 'cat5e', 'spelling'),
('eithernet', 'ethernet', 'spelling'),
('plenium', 'plenum', 'spelling'),
('shieled', 'shielded', 'spelling'),
('berktek', 'leviton berktek', 'brand'),
('panduit', 'panduit', 'brand')
ON CONFLICT DO NOTHING;

-- =====================================================
-- STEP 7: Create search performance monitoring
-- =====================================================
CREATE OR REPLACE VIEW v_search_performance AS
SELECT 
    DATE(searched_at) as search_date,
    COUNT(*) as total_searches,
    AVG(search_duration_ms) as avg_duration_ms,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY search_duration_ms) as median_duration_ms,
    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY search_duration_ms) as p95_duration_ms,
    COUNT(CASE WHEN results_count = 0 THEN 1 END) as zero_result_searches,
    COUNT(DISTINCT user_session) as unique_users,
    AVG(result_quality_score) as avg_quality_score
FROM search_analytics_enhanced
WHERE searched_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(searched_at)
ORDER BY search_date DESC;

-- =====================================================
-- FINAL: Show system status
-- =====================================================
SELECT 'Search system setup complete!' as status;

-- Show search terms count
SELECT term_group, COUNT(*) as count 
FROM search_terms 
GROUP BY term_group;

-- Show indexed tables
SELECT 
    tablename,
    indexname,
    pg_size_pretty(pg_relation_size(indexname::regclass)) as size
FROM pg_indexes
WHERE tablename LIKE 'prod_%'
ORDER BY tablename, indexname;

COMMIT;