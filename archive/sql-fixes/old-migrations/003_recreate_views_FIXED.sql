-- STEP 3: Recreate Views (FIXED VERSION)
-- This version uses the correct column names from your search_analytics table

BEGIN;

-- Drop old views if they exist
DROP VIEW IF EXISTS popular_searches CASCADE;
DROP VIEW IF EXISTS search_analytics_summary CASCADE;
DROP VIEW IF EXISTS product_search CASCADE;
DROP VIEW IF EXISTS v_products_complete CASCADE;
DROP VIEW IF EXISTS v_mayer_stock_summary CASCADE;
DROP VIEW IF EXISTS products_without_cutsheets CASCADE;
DROP VIEW IF EXISTS weekly_missing_cutsheets CASCADE;
DROP VIEW IF EXISTS weekly_missing_cutsheets_with_url CASCADE;

-- Create views with correct column names

-- View 1: Popular searches
CREATE OR REPLACE VIEW analytics_popular_searches AS
SELECT 
    search_term,
    COUNT(*) as search_count,
    COUNT(DISTINCT user_session) as unique_sessions,  -- Changed from session_id
    AVG(results_count) as avg_results,               -- Changed from result_count
    MAX(created_at) as last_searched                 -- Changed from searched_at
FROM search_analytics
WHERE created_at > CURRENT_DATE - INTERVAL '30 days'
GROUP BY search_term
HAVING COUNT(*) > 5
ORDER BY search_count DESC
LIMIT 100;

-- View 2: Search summary
CREATE OR REPLACE VIEW analytics_search_summary AS
SELECT 
    DATE(created_at) as search_date,                  -- Changed from searched_at
    COUNT(*) as total_searches,
    COUNT(DISTINCT user_session) as unique_sessions,  -- Changed from session_id
    COUNT(CASE WHEN results_count = 0 THEN 1 END) as zero_result_searches,
    AVG(search_time_ms) as avg_search_time_ms
FROM search_analytics
GROUP BY DATE(created_at)
ORDER BY search_date DESC;

-- View 3: Mayer stock summary (if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'ops_mayer_stock') THEN
        CREATE OR REPLACE VIEW view_mayer_stock_summary AS
        SELECT 
            part_number,
            SUM(quantity_available) as total_quantity,
            COUNT(DISTINCT location) as location_count,
            MAX(last_updated) as last_updated
        FROM ops_mayer_stock
        GROUP BY part_number;
        RAISE NOTICE 'Created view: view_mayer_stock_summary';
    END IF;
END $$;

-- Show what views were created
SELECT 'Views created successfully!' as status;
SELECT tablename as object_name, 'table' as object_type 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename LIKE 'analytics_%'
UNION ALL
SELECT viewname as object_name, 'view' as object_type 
FROM pg_views 
WHERE schemaname = 'public' AND viewname LIKE 'analytics_%'
ORDER BY object_type, object_name;

COMMIT;

-- If something goes wrong, you can run: ROLLBACK;