-- ================================================================
-- COMPREHENSIVE FIX: All Category Cable Searches with "boxes"
-- VERSION: Simple - Only uses existing columns
-- ================================================================

-- 1. Check current category ratings in the database
SELECT '=== CURRENT CATEGORY RATINGS IN DATABASE ===' as check_type;
SELECT DISTINCT category_rating, COUNT(*) as product_count
FROM prod_category_cables
WHERE category_rating IS NOT NULL
GROUP BY category_rating
ORDER BY category_rating;

-- 2. Check current search_terms structure
SELECT '=== SEARCH_TERMS STRUCTURE ===' as check_type;
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'search_terms'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Add comprehensive search term mappings for ALL category types
-- Using ONLY the columns we know exist: term_group, search_term, categories, applicable_tables
INSERT INTO search_terms (term_group, search_term, categories, applicable_tables)
VALUES 
    -- ========== CATEGORY 5E ==========
    -- Exact matches with proper spacing
    ('category_rating', 'category 5e', ARRAY['Category 5e']::text[], ARRAY['prod_category_cables']::text[]),
    ('category_rating', 'category 5e cable', ARRAY['Category 5e']::text[], ARRAY['prod_category_cables']::text[]),
    ('category_rating', 'category 5e cables', ARRAY['Category 5e']::text[], ARRAY['prod_category_cables']::text[]),
    ('category_rating', 'cat 5e', ARRAY['Category 5e']::text[], ARRAY['prod_category_cables']::text[]),
    ('category_rating', 'cat 5e cable', ARRAY['Category 5e']::text[], ARRAY['prod_category_cables']::text[]),
    
    -- With "box" terminology
    ('category_rating', 'box of category 5e', ARRAY['Category 5e']::text[], ARRAY['prod_category_cables']::text[]),
    ('category_rating', 'boxes of category 5e', ARRAY['Category 5e']::text[], ARRAY['prod_category_cables']::text[]),
    ('category_rating', 'box of cat 5e', ARRAY['Category 5e']::text[], ARRAY['prod_category_cables']::text[]),
    ('category_rating', 'boxes of cat 5e', ARRAY['Category 5e']::text[], ARRAY['prod_category_cables']::text[]),
    ('category_rating', 'box of cat5e', ARRAY['Category 5e']::text[], ARRAY['prod_category_cables']::text[]),
    ('category_rating', 'boxes of cat5e', ARRAY['Category 5e']::text[], ARRAY['prod_category_cables']::text[]),
    
    -- Natural language variations
    ('category_rating', 'i need category 5e', ARRAY['Category 5e']::text[], ARRAY['prod_category_cables']::text[]),
    ('category_rating', 'i need cat 5e', ARRAY['Category 5e']::text[], ARRAY['prod_category_cables']::text[]),
    ('category_rating', 'i need cat5e', ARRAY['Category 5e']::text[], ARRAY['prod_category_cables']::text[]),
    
    -- Number variations
    ('category_rating', '4 boxes of category 5e', ARRAY['Category 5e']::text[], ARRAY['prod_category_cables']::text[]),
    ('category_rating', '4 boxes of cat5e', ARRAY['Category 5e']::text[], ARRAY['prod_category_cables']::text[]),
    
    -- ========== CATEGORY 6 ==========
    -- Exact matches with proper spacing
    ('category_rating', 'category 6', ARRAY['Category 6']::text[], ARRAY['prod_category_cables']::text[]),
    ('category_rating', 'category 6 cable', ARRAY['Category 6']::text[], ARRAY['prod_category_cables']::text[]),
    ('category_rating', 'category 6 cables', ARRAY['Category 6']::text[], ARRAY['prod_category_cables']::text[]),
    ('category_rating', 'cat 6', ARRAY['Category 6']::text[], ARRAY['prod_category_cables']::text[]),
    ('category_rating', 'cat 6 cable', ARRAY['Category 6']::text[], ARRAY['prod_category_cables']::text[]),
    
    -- With "box" terminology
    ('category_rating', 'box of category 6', ARRAY['Category 6']::text[], ARRAY['prod_category_cables']::text[]),
    ('category_rating', 'boxes of category 6', ARRAY['Category 6']::text[], ARRAY['prod_category_cables']::text[]),
    ('category_rating', 'box of cat 6', ARRAY['Category 6']::text[], ARRAY['prod_category_cables']::text[]),
    ('category_rating', 'boxes of cat 6', ARRAY['Category 6']::text[], ARRAY['prod_category_cables']::text[]),
    ('category_rating', 'box of cat6', ARRAY['Category 6']::text[], ARRAY['prod_category_cables']::text[]),
    ('category_rating', 'boxes of cat6', ARRAY['Category 6']::text[], ARRAY['prod_category_cables']::text[]),
    
    -- Natural language variations
    ('category_rating', 'i need category 6', ARRAY['Category 6']::text[], ARRAY['prod_category_cables']::text[]),
    ('category_rating', 'i need cat 6', ARRAY['Category 6']::text[], ARRAY['prod_category_cables']::text[]),
    ('category_rating', 'i need cat6', ARRAY['Category 6']::text[], ARRAY['prod_category_cables']::text[]),
    
    -- Number variations
    ('category_rating', '4 boxes of category 6', ARRAY['Category 6']::text[], ARRAY['prod_category_cables']::text[]),
    ('category_rating', '4 boxes of cat6', ARRAY['Category 6']::text[], ARRAY['prod_category_cables']::text[]),
    
    -- ========== CATEGORY 6A ==========
    -- Exact matches with proper spacing
    ('category_rating', 'category 6a', ARRAY['Category 6A']::text[], ARRAY['prod_category_cables']::text[]),
    ('category_rating', 'category 6a cable', ARRAY['Category 6A']::text[], ARRAY['prod_category_cables']::text[]),
    ('category_rating', 'category 6a cables', ARRAY['Category 6A']::text[], ARRAY['prod_category_cables']::text[]),
    ('category_rating', 'cat 6a', ARRAY['Category 6A']::text[], ARRAY['prod_category_cables']::text[]),
    ('category_rating', 'cat 6a cable', ARRAY['Category 6A']::text[], ARRAY['prod_category_cables']::text[]),
    
    -- With "box" terminology
    ('category_rating', 'box of category 6a', ARRAY['Category 6A']::text[], ARRAY['prod_category_cables']::text[]),
    ('category_rating', 'boxes of category 6a', ARRAY['Category 6A']::text[], ARRAY['prod_category_cables']::text[]),
    ('category_rating', 'box of cat 6a', ARRAY['Category 6A']::text[], ARRAY['prod_category_cables']::text[]),
    ('category_rating', 'boxes of cat 6a', ARRAY['Category 6A']::text[], ARRAY['prod_category_cables']::text[]),
    ('category_rating', 'box of cat6a', ARRAY['Category 6A']::text[], ARRAY['prod_category_cables']::text[]),
    ('category_rating', 'boxes of cat6a', ARRAY['Category 6A']::text[], ARRAY['prod_category_cables']::text[]),
    
    -- Natural language variations
    ('category_rating', 'i need category 6a', ARRAY['Category 6A']::text[], ARRAY['prod_category_cables']::text[]),
    ('category_rating', 'i need cat 6a', ARRAY['Category 6A']::text[], ARRAY['prod_category_cables']::text[]),
    ('category_rating', 'i need cat6a', ARRAY['Category 6A']::text[], ARRAY['prod_category_cables']::text[]),
    
    -- Number variations
    ('category_rating', '4 boxes of category 6a', ARRAY['Category 6A']::text[], ARRAY['prod_category_cables']::text[]),
    ('category_rating', '4 boxes of cat6a', ARRAY['Category 6A']::text[], ARRAY['prod_category_cables']::text[])
    
ON CONFLICT DO NOTHING;

-- 4. Update common_terms for ALL category cables to ensure searchability
-- Category 5e
UPDATE prod_category_cables
SET common_terms = COALESCE(common_terms, '') || 
    CASE 
        WHEN common_terms IS NULL OR common_terms = '' THEN ''
        ELSE ' '
    END || 
    'category 5e cat5e category5e cat 5e cat 5 e category five e box boxes'
WHERE category_rating = 'Category 5e'
  AND (common_terms IS NULL OR common_terms NOT ILIKE '%category 5e%' OR common_terms NOT ILIKE '%box%');

-- Category 6
UPDATE prod_category_cables
SET common_terms = COALESCE(common_terms, '') || 
    CASE 
        WHEN common_terms IS NULL OR common_terms = '' THEN ''
        ELSE ' '
    END || 
    'category 6 cat6 category6 cat 6 category six box boxes'
WHERE category_rating = 'Category 6'
  AND (common_terms IS NULL OR common_terms NOT ILIKE '%category 6%' OR common_terms NOT ILIKE '%box%');

-- Category 6A
UPDATE prod_category_cables
SET common_terms = COALESCE(common_terms, '') || 
    CASE 
        WHEN common_terms IS NULL OR common_terms = '' THEN ''
        ELSE ' '
    END || 
    'category 6a cat6a category6a cat 6a cat 6 a category six a box boxes'
WHERE category_rating = 'Category 6A'
  AND (common_terms IS NULL OR common_terms NOT ILIKE '%category 6a%' OR common_terms NOT ILIKE '%box%');

-- 5. Verify the fix for all categories
SELECT '=== VERIFY ALL CATEGORY PRODUCTS ===' as check_type;
SELECT 
    category_rating,
    COUNT(*) as total_products,
    SUM(CASE WHEN common_terms ILIKE '%category%' THEN 1 ELSE 0 END) as searchable_by_category,
    SUM(CASE WHEN common_terms ILIKE '%box%' THEN 1 ELSE 0 END) as searchable_by_box
FROM prod_category_cables
WHERE category_rating IN ('Category 5e', 'Category 6', 'Category 6A')
GROUP BY category_rating
ORDER BY category_rating;

-- 6. Count search terms added
SELECT '=== SEARCH TERMS COUNT ===' as check_type;
SELECT COUNT(*) as total_search_terms FROM search_terms;

-- 7. Summary
SELECT '=== FIX SUMMARY ===' as check_type;
SELECT 
    'Products updated with box terminology' as metric,
    COUNT(*) as value
FROM prod_category_cables
WHERE category_rating IN ('Category 5e', 'Category 6', 'Category 6A')
  AND common_terms ILIKE '%box%';

-- Final message
SELECT '✅ All Category Cable searches with "boxes" terminology should now work!' as status,
       'Includes: Category 5e, Category 6, Category 6A with all variations' as details;