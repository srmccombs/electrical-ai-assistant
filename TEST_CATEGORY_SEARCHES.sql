-- ================================================================
-- TEST: Category Cable Searches with Boxes
-- Verify our migration fixed the search issues
-- ================================================================

-- 1. Test the specific searches that were failing
SELECT '=== TEST CATEGORY SEARCHES WITH BOXES ===' as test_type;

-- Test "4 boxes of Category 5e"
WITH test1 AS (
    SELECT * FROM extract_search_attributes('I need 4 boxes of Category 5e')
)
SELECT 
    'TEST: 4 boxes of Category 5e' as test_case,
    original_query,
    redirected_query,
    category_rating,
    quantity as feet_converted,
    jacket_type,
    brand
FROM test1;

-- Test "4 boxes of Cat 6"
WITH test2 AS (
    SELECT * FROM extract_search_attributes('I need 4 boxes of Cat 6')
)
SELECT 
    'TEST: 4 boxes of Cat 6' as test_case,
    original_query,
    redirected_query,
    category_rating,
    quantity as feet_converted,
    jacket_type,
    brand
FROM test2;

-- Test "4 boxes of Cat 6A"
WITH test3 AS (
    SELECT * FROM extract_search_attributes('I need 4 boxes of Cat 6A')
)
SELECT 
    'TEST: 4 boxes of Cat 6A' as test_case,
    original_query,
    redirected_query,
    category_rating,
    quantity as feet_converted,
    jacket_type,
    brand
FROM test3;

-- 2. Test redirect functionality
SELECT '=== TEST REDIRECTS ===' as test_type;
SELECT 
    search_term as redirect_from,
    redirect_to,
    priority
FROM search_terms
WHERE context = 'redirect'
AND search_term IN ('cat5', 'cat 5', 'category 5', 'smb')
ORDER BY priority DESC;

-- 3. Test quantity conversions
SELECT '=== TEST QUANTITY CONVERSIONS ===' as test_type;
SELECT 
    search_term,
    conversion_factor,
    notes
FROM search_terms
WHERE context = 'quantity'
ORDER BY search_term;

-- 4. Verify category mappings exist
SELECT '=== VERIFY CATEGORY MAPPINGS ===' as test_type;
SELECT 
    search_term,
    categories[1] as maps_to_category,
    priority
FROM search_terms
WHERE search_term IN (
    'category 5e', 'cat 5e', 'cat5e',
    'category 6', 'cat 6', 'cat6',
    'category 6a', 'cat 6a', 'cat6a',
    'boxes of category 5e', 'boxes of cat 6', 'boxes of cat6a'
)
ORDER BY categories[1], priority DESC;

-- 5. Test complex queries
SELECT '=== TEST COMPLEX QUERIES ===' as test_type;

-- Test with jacket type
SELECT * FROM extract_search_attributes('10 boxes of cat6 plenum cable');

-- Test with brand
SELECT * FROM extract_search_attributes('4 boxes of panduit cat5e');

-- Test with shielding
SELECT * FROM extract_search_attributes('5 boxes of cat6a shielded cable');

-- 6. Check usage tracking
SELECT '=== CHECK USAGE TRACKING ===' as test_type;
-- First log some usage
SELECT log_search_usage('4 boxes of category 5e');
SELECT log_search_usage('cat6 cable');
SELECT log_search_usage('panduit jack');

-- Then check if it was tracked
SELECT 
    search_term,
    context,
    usage_count,
    last_used
FROM search_terms
WHERE usage_count > 0
ORDER BY usage_count DESC
LIMIT 10;

-- 7. Summary of search intelligence
SELECT '=== SEARCH INTELLIGENCE SUMMARY ===' as test_type;
SELECT * FROM search_intelligence_debug
WHERE context IN ('redirect', 'quantity', 'category')
ORDER BY context, priority DESC
LIMIT 20;

-- Final verification
SELECT '=== FINAL STATUS ===' as test_type;
SELECT 
    'Total search terms' as metric,
    COUNT(*) as value
FROM search_terms
WHERE is_active = true
UNION ALL
SELECT 
    'System mappings',
    COUNT(*)
FROM search_terms
WHERE is_system = true
UNION ALL
SELECT 
    'Redirects configured',
    COUNT(*)
FROM search_terms
WHERE context = 'redirect'
UNION ALL
SELECT 
    'Categories mapped',
    COUNT(*)
FROM search_terms
WHERE categories IS NOT NULL;