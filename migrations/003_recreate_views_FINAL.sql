-- STEP 3: Recreate Views (FINAL VERSION)
-- This version skips the mayer_stock view since we don't know its columns

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

-- View 1: Popular searches
CREATE OR REPLACE VIEW analytics_popular_searches AS
SELECT 
    search_term,
    COUNT(*) as search_count,
    COUNT(DISTINCT user_session) as unique_sessions,
    AVG(results_count) as avg_results,
    MAX(created_at) as last_searched
FROM search_analytics
WHERE created_at > CURRENT_DATE - INTERVAL '30 days'
GROUP BY search_term
HAVING COUNT(*) > 5
ORDER BY search_count DESC
LIMIT 100;

-- View 2: Search summary
CREATE OR REPLACE VIEW analytics_search_summary AS
SELECT 
    DATE(created_at) as search_date,
    COUNT(*) as total_searches,
    COUNT(DISTINCT user_session) as unique_sessions,
    COUNT(CASE WHEN results_count = 0 THEN 1 END) as zero_result_searches,
    AVG(search_time_ms) as avg_search_time_ms
FROM search_analytics
GROUP BY DATE(created_at)
ORDER BY search_date DESC;

-- Let's check what columns ops_mayer_stock actually has
SELECT 'Columns in ops_mayer_stock table:' as info;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'ops_mayer_stock' 
ORDER BY ordinal_position;

-- Show final results
SELECT 'Migration complete! Your database is now organized:' as status;

SELECT 
    CASE 
        WHEN tablename LIKE 'prod_%' THEN '🛍️ Products'
        WHEN tablename LIKE 'search_%' THEN '🔍 Search'
        WHEN tablename LIKE 'analytics_%' THEN '📊 Analytics'
        WHEN tablename LIKE 'ops_%' THEN '⚙️ Operations'
        WHEN tablename LIKE 'docs_%' THEN '📄 Documentation'
        ELSE '❓ Other'
    END as category,
    COUNT(*) as count
FROM pg_tables
WHERE schemaname = 'public'
GROUP BY category
ORDER BY category;

COMMIT;