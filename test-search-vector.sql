-- Test if search_vector is properly configured
-- Created: June 19, 2025

-- Check if search_vector column exists and has data
SELECT 
    'Checking search_vector status' as test,
    COUNT(*) as total_products,
    COUNT(search_vector) as products_with_search_vector,
    COUNT(computed_search_terms) as products_with_computed_terms
FROM prod_category_cables
WHERE is_active = true;

-- Test full-text search
SELECT 
    part_number,
    brand,
    short_description,
    category_rating
FROM prod_category_cables
WHERE to_tsvector('english', COALESCE(short_description, '') || ' ' || COALESCE(computed_search_terms, '')) @@ plainto_tsquery('english', 'category 6 cable')
LIMIT 10;

-- Alternative: Check what's in computed_search_terms
SELECT 
    part_number,
    brand,
    category_rating,
    LEFT(computed_search_terms, 100) as search_terms_preview
FROM prod_category_cables
WHERE category_rating = 'Category 6'
LIMIT 5;