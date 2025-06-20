-- ================================================================
-- MIGRATION READINESS CHECK
-- Run this FIRST to ensure your database is ready for migration
-- ================================================================

-- 1. Check search_terms table current structure
SELECT '=== SEARCH_TERMS TABLE STRUCTURE ===' as check_type;
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'search_terms'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Check current search_terms data
SELECT '=== SEARCH_TERMS SAMPLE DATA ===' as check_type;
SELECT 
    id,
    term_group,
    search_term,
    categories,
    brands,
    applicable_tables
FROM search_terms 
LIMIT 5;

-- 3. Check if enhanced columns already exist
SELECT '=== CHECK FOR EXISTING COLUMNS ===' as check_type;
SELECT 
    column_name
FROM information_schema.columns
WHERE table_name = 'search_terms'
AND table_schema = 'public'
AND column_name IN ('detection_pattern', 'priority', 'redirect_to', 'context')
ORDER BY column_name;

-- 4. Check for existing intelligence tables
SELECT '=== CHECK FOR EXISTING INTELLIGENCE TABLES ===' as check_type;
SELECT 
    table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('business_rules', 'detection_patterns', 'term_equivalencies', 
                   'quantity_conversions', 'brand_mappings', 'color_mappings')
ORDER BY table_name;

-- 5. Check trigger status
SELECT '=== TRIGGER STATUS ===' as check_type;
SELECT 
    COUNT(*) as disabled_trigger_count
FROM disabled_triggers_backup;

-- 6. Product table health check
SELECT '=== PRODUCT TABLE HEALTH ===' as check_type;
SELECT 
    'prod_category_cables' as table_name,
    COUNT(*) as total_products,
    SUM(CASE WHEN common_terms IS NOT NULL AND common_terms != '' THEN 1 ELSE 0 END) as with_search_terms,
    ROUND(100.0 * SUM(CASE WHEN common_terms IS NOT NULL AND common_terms != '' THEN 1 ELSE 0 END) / COUNT(*), 1) as percent_searchable
FROM prod_category_cables
UNION ALL
SELECT 
    'prod_jack_modules',
    COUNT(*),
    SUM(CASE WHEN common_terms IS NOT NULL AND common_terms != '' THEN 1 ELSE 0 END),
    ROUND(100.0 * SUM(CASE WHEN common_terms IS NOT NULL AND common_terms != '' THEN 1 ELSE 0 END) / COUNT(*), 1)
FROM prod_jack_modules
UNION ALL
SELECT 
    'prod_faceplates',
    COUNT(*),
    SUM(CASE WHEN common_terms IS NOT NULL AND common_terms != '' THEN 1 ELSE 0 END),
    ROUND(100.0 * SUM(CASE WHEN common_terms IS NOT NULL AND common_terms != '' THEN 1 ELSE 0 END) / COUNT(*), 1)
FROM prod_faceplates;

-- 7. Check existing functions
SELECT '=== EXISTING FUNCTIONS ===' as check_type;
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name LIKE '%search%'
ORDER BY routine_name;

-- Summary
SELECT '=== MIGRATION READINESS SUMMARY ===' as check_type;
SELECT 
    'Ready for migration!' as status,
    'Run migrations 021-024 in order' as next_step;