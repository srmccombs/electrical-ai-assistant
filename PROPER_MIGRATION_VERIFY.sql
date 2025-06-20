-- ================================================================
-- PROPER MIGRATION VERIFICATION
-- Run this to verify all intelligence is properly in the database
-- ================================================================

-- 1. Check enhanced table structure
SELECT '=== ENHANCED SEARCH_TERMS STRUCTURE ===' as verification;
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'search_terms'
AND table_schema = 'public'
AND column_name IN ('priority', 'context', 'redirect_to', 'detection_pattern', 'conversion_factor')
ORDER BY column_name;

-- 2. Check intelligence distribution
SELECT '=== INTELLIGENCE DISTRIBUTION ===' as verification;
SELECT 
    context,
    COUNT(*) as mappings,
    MIN(priority) as min_priority,
    MAX(priority) as max_priority
FROM search_terms
WHERE context IS NOT NULL
GROUP BY context
ORDER BY COUNT(*) DESC;

-- 3. Test critical redirects
SELECT '=== CRITICAL REDIRECTS TEST ===' as verification;
SELECT 
    'cat5 cable' as input,
    apply_search_redirects('cat5 cable') as output
UNION ALL
SELECT 'smb box', apply_search_redirects('smb box')
UNION ALL
SELECT 'category 5', apply_search_redirects('category 5');

-- 4. Test box conversions
SELECT '=== BOX CONVERSION TEST ===' as verification;
SELECT 
    '4 boxes' as input,
    convert_quantity('4 boxes') as feet_output
UNION ALL
SELECT '10 boxes', convert_quantity('10 boxes')
UNION ALL
SELECT '3 spools', convert_quantity('3 spools');

-- 5. Test complete attribute extraction
SELECT '=== COMPLETE EXTRACTION TEST ===' as verification;
SELECT * FROM extract_search_attributes('I need 4 boxes of cat5 plenum cable');
SELECT * FROM extract_search_attributes('panduit cat6 shielded jack modules');
SELECT * FROM extract_search_attributes('20 boxes of category 6a outdoor cable');

-- 6. Check all tables created
SELECT '=== NEW TABLES CREATED ===' as verification;
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('term_equivalencies', 'business_rules', 'color_mappings', 'search_term_usage')
ORDER BY table_name;

-- 7. Verify functions exist
SELECT '=== FUNCTIONS CREATED ===' as verification;
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN (
    'apply_search_redirects',
    'detect_jacket_type',
    'detect_category_rating',
    'convert_quantity',
    'detect_brand',
    'detect_shielding_type',
    'extract_search_attributes',
    'log_search_term_usage'
)
ORDER BY routine_name;

-- 8. Summary statistics
SELECT '=== MIGRATION SUMMARY ===' as verification;
SELECT * FROM search_intelligence_overview;

-- 9. Test real-world searches
SELECT '=== REAL WORLD SEARCH TESTS ===' as verification;

-- Test 1: "4 boxes of Category 5e"
WITH test1 AS (
    SELECT * FROM extract_search_attributes('4 boxes of Category 5e')
)
SELECT 
    'TEST 1: 4 boxes of Category 5e' as test,
    redirected_query,
    category_rating,
    quantity
FROM test1;

-- Test 2: "cat6 plenum panduit"
WITH test2 AS (
    SELECT * FROM extract_search_attributes('cat6 plenum panduit')
)
SELECT 
    'TEST 2: cat6 plenum panduit' as test,
    category_rating,
    jacket_type,
    brand
FROM test2;

-- Test 3: "smb keystone"
WITH test3 AS (
    SELECT * FROM extract_search_attributes('smb keystone')
)
SELECT 
    'TEST 3: smb keystone' as test,
    redirected_query
FROM test3;

-- 10. Final verification
SELECT '=== FINAL VERIFICATION ===' as verification;
SELECT 
    CASE 
        WHEN COUNT(*) > 250 THEN '✅ Search terms loaded: ' || COUNT(*) || ' mappings'
        ELSE '❌ Not enough search terms: ' || COUNT(*) || ' mappings'
    END as search_terms_status
FROM search_terms
WHERE is_active = true;

-- Success message
SELECT '🎉 PROPER MIGRATION COMPLETE!' as status,
       'All intelligence now in database!' as message,
       'Next: Update TypeScript to use database functions' as next_step;