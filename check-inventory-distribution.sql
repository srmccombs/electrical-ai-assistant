-- Check inventory distribution across all product tables
-- Created: June 19, 2025

-- Category Cables Distribution
SELECT 
    'Category Cables Inventory' as table_name,
    category_rating,
    COUNT(*) as product_count,
    COUNT(DISTINCT brand) as brand_count
FROM prod_category_cables
WHERE is_active = true
GROUP BY category_rating
ORDER BY category_rating;

-- Check total active vs inactive
SELECT 
    'Category Cables Status' as info,
    is_active,
    COUNT(*) as count
FROM prod_category_cables
GROUP BY is_active;

-- See sample of Category 5e products
SELECT 
    'Category 5e Products' as info,
    part_number,
    brand,
    short_description,
    is_active
FROM prod_category_cables
WHERE category_rating = 'Category 5e'
LIMIT 10;

-- Check if products might be inactive
SELECT 
    'Inactive Category 5e Products' as info,
    COUNT(*) as count
FROM prod_category_cables
WHERE category_rating = 'Category 5e' 
  AND (is_active = false OR is_active IS NULL);

-- Check all category ratings to see if there's a naming issue
SELECT DISTINCT 
    category_rating,
    COUNT(*) as count
FROM prod_category_cables
GROUP BY category_rating
ORDER BY category_rating;