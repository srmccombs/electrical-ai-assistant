-- Database Information Gathering Queries
-- Run these in Supabase SQL Editor to get current database state
-- Created: June 20, 2025

-- ============================================
-- 1. GET ALL PRODUCT TABLES AND ROW COUNTS
-- ============================================
SELECT 
    tablename as table_name,
    n_live_tup as row_count,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as table_size
FROM pg_stat_user_tables
WHERE tablename LIKE 'prod_%'
ORDER BY tablename;

-- ============================================
-- 2. GET COMPLETE COLUMN INFO FOR ALL PRODUCT TABLES
-- ============================================
SELECT 
    table_name,
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name LIKE 'prod_%'
AND table_schema = 'public'
ORDER BY table_name, ordinal_position;

-- ============================================
-- 3. LIST ALL INDEXES
-- ============================================
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename LIKE 'prod_%'
ORDER BY tablename, indexname;

-- ============================================
-- 4. CHECK FOR MISSING COLUMNS (jack_modules issue)
-- ============================================
SELECT 
    t.table_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns 
                    WHERE table_name = t.table_name 
                    AND column_name = 'created_by') 
        THEN 'YES' ELSE 'NO' 
    END as has_created_by,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns 
                    WHERE table_name = t.table_name 
                    AND column_name = 'last_modified_by') 
        THEN 'YES' ELSE 'NO' 
    END as has_last_modified_by
FROM information_schema.tables t
WHERE t.table_name LIKE 'prod_%'
AND t.table_schema = 'public'
ORDER BY t.table_name;

-- ============================================
-- 5. GET ALL DISABLED TRIGGERS
-- ============================================
-- First, check if backup table exists
SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'disabled_triggers_backup'
);

-- If exists, get the triggers
SELECT * FROM disabled_triggers_backup
ORDER BY table_name, trigger_name;

-- Alternative: Check trigger status directly
SELECT 
    n.nspname as schema_name,
    c.relname as table_name,
    t.tgname as trigger_name,
    CASE t.tgenabled 
        WHEN 'O' THEN 'ENABLED'
        WHEN 'D' THEN 'DISABLED'
        WHEN 'R' THEN 'REPLICA'
        WHEN 'A' THEN 'ALWAYS'
    END as status
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'public'
AND c.relname LIKE 'prod_%'
ORDER BY c.relname, t.tgname;

-- ============================================
-- 6. DATA QUALITY CHECKS
-- ============================================
-- Check for trailing spaces in brands
SELECT 
    table_name,
    issue,
    count
FROM (
    SELECT 'prod_category_cables' as table_name, 'Brands with trailing spaces' as issue, COUNT(*) as count
    FROM prod_category_cables WHERE brand != TRIM(brand)
    UNION ALL
    SELECT 'prod_fiber_cables', 'Brands with trailing spaces', COUNT(*)
    FROM prod_fiber_cables WHERE brand != TRIM(brand)
    UNION ALL
    SELECT 'prod_fiber_connectors', 'Brands with trailing spaces', COUNT(*)
    FROM prod_fiber_connectors WHERE brand != TRIM(brand)
    -- Add more tables as needed
) AS quality_checks
WHERE count > 0
ORDER BY table_name;

-- Check for NULL or empty common_terms
SELECT 
    table_name,
    COUNT(*) as missing_common_terms
FROM (
    SELECT 'prod_category_cables' as table_name, common_terms
    FROM prod_category_cables
    WHERE common_terms IS NULL OR common_terms = ''
    UNION ALL
    SELECT 'prod_fiber_cables', common_terms
    FROM prod_fiber_cables
    WHERE common_terms IS NULL OR common_terms = ''
    -- Add more tables
) AS term_checks
GROUP BY table_name
ORDER BY table_name;

-- ============================================
-- 7. CHECK UNIQUE CONSTRAINTS
-- ============================================
SELECT 
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    string_agg(kcu.column_name, ', ') as columns
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name LIKE 'prod_%'
AND tc.constraint_type IN ('PRIMARY KEY', 'UNIQUE')
GROUP BY tc.table_name, tc.constraint_name, tc.constraint_type
ORDER BY tc.table_name, tc.constraint_type;

-- ============================================
-- 8. CHECK FOREIGN KEY RELATIONSHIPS
-- ============================================
SELECT 
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_name LIKE 'prod_%'
ORDER BY tc.table_name;

-- ============================================
-- 9. GET SAMPLE DATA FROM EACH TABLE
-- ============================================
-- Run these one at a time to see sample data
SELECT * FROM prod_category_cables LIMIT 5;
SELECT * FROM prod_fiber_cables LIMIT 5;
SELECT * FROM prod_fiber_connectors LIMIT 5;
SELECT * FROM prod_jack_modules LIMIT 5;
SELECT * FROM prod_modular_plugs LIMIT 5;
SELECT * FROM prod_faceplates LIMIT 5;
SELECT * FROM prod_surface_mount_boxes LIMIT 5;
SELECT * FROM prod_adapter_panels LIMIT 5;
SELECT * FROM prod_wall_mount_fiber_enclosures LIMIT 5;
SELECT * FROM prod_rack_mount_fiber_enclosures LIMIT 5;

-- ============================================
-- 10. CHECK SEARCH SYSTEM STATUS
-- ============================================
-- Check if search_terms table exists and has data
SELECT 
    COUNT(*) as total_search_terms,
    COUNT(DISTINCT term_group) as unique_groups,
    COUNT(DISTINCT unnest(applicable_tables)) as tables_covered
FROM search_terms
WHERE is_active = true;

-- Check search vector population
SELECT 
    table_name,
    populated_count,
    total_count,
    ROUND(100.0 * populated_count / NULLIF(total_count, 0), 2) as percent_populated
FROM (
    SELECT 
        'prod_category_cables' as table_name,
        COUNT(*) FILTER (WHERE search_vector IS NOT NULL) as populated_count,
        COUNT(*) as total_count
    FROM prod_category_cables
    -- Add more UNION ALL for other tables
) AS search_status
ORDER BY table_name;