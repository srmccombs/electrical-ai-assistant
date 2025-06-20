-- STEP 3: Recreate Views with New Table Names
-- Run this AFTER renaming tables
-- This updates all views to use the new table names

BEGIN;

-- =====================================================
-- DROP OLD VIEWS
-- =====================================================
SELECT 'Dropping old views...' as status;

DROP VIEW IF EXISTS popular_searches CASCADE;
DROP VIEW IF EXISTS search_analytics_summary CASCADE;
DROP VIEW IF EXISTS product_search CASCADE;
DROP VIEW IF EXISTS v_products_complete CASCADE;
DROP VIEW IF EXISTS v_mayer_stock_summary CASCADE;
DROP VIEW IF EXISTS products_without_cutsheets CASCADE;
DROP VIEW IF EXISTS weekly_missing_cutsheets CASCADE;
DROP VIEW IF EXISTS weekly_missing_cutsheets_with_url CASCADE;

-- =====================================================
-- CREATE NEW VIEWS
-- =====================================================
SELECT 'Creating updated views...' as status;

-- Popular searches view
CREATE OR REPLACE VIEW analytics_popular_searches AS
SELECT 
    search_term,
    COUNT(*) as search_count,
    COUNT(DISTINCT session_id) as unique_sessions,
    AVG(result_count) as avg_results,
    MAX(searched_at) as last_searched
FROM search_analytics
WHERE searched_at > CURRENT_DATE - INTERVAL '30 days'
GROUP BY search_term
HAVING COUNT(*) > 5
ORDER BY search_count DESC
LIMIT 100;

-- Search summary view
CREATE OR REPLACE VIEW analytics_search_summary AS
SELECT 
    DATE(searched_at) as search_date,
    COUNT(*) as total_searches,
    COUNT(DISTINCT session_id) as unique_sessions,
    COUNT(CASE WHEN result_count = 0 THEN 1 END) as zero_result_searches,
    AVG(search_time_ms) as avg_search_time_ms
FROM search_analytics
GROUP BY DATE(searched_at)
ORDER BY search_date DESC;

-- Mayer stock summary
CREATE OR REPLACE VIEW view_mayer_stock_summary AS
SELECT 
    part_number,
    SUM(quantity_available) as total_quantity,
    COUNT(DISTINCT location) as location_count,
    MAX(last_updated) as last_updated
FROM ops_mayer_stock
GROUP BY part_number;

-- Missing datasheets view
CREATE OR REPLACE VIEW view_missing_datasheets AS
SELECT 
    'prod_category_cables' as table_name,
    part_number,
    short_description
FROM prod_category_cables
WHERE part_number NOT IN (
    SELECT DISTINCT part_number 
    FROM docs_product_datasheets
)
UNION ALL
SELECT 
    'prod_fiber_connectors' as table_name,
    part_number,
    short_description
FROM prod_fiber_connectors
WHERE part_number NOT IN (
    SELECT DISTINCT part_number 
    FROM docs_product_datasheets
)
UNION ALL
SELECT 
    'prod_jack_modules' as table_name,
    part_number,
    short_description
FROM prod_jack_modules
WHERE part_number NOT IN (
    SELECT DISTINCT part_number 
    FROM docs_product_datasheets
);

SELECT 'Views recreated successfully!' as status;

COMMIT;

-- If something goes wrong, you can run: ROLLBACK;