-- Standardize category_rating values in prod_category_cables
-- Created: June 19, 2025
-- This ensures consistent naming for better search results

BEGIN;

-- First, let's see what we're dealing with
SELECT 
    'Current category_rating distribution:' as info;

SELECT 
    category_rating,
    COUNT(*) as count
FROM prod_category_cables
GROUP BY category_rating
ORDER BY category_rating;

-- Standardize Category 5e variations
UPDATE prod_category_cables
SET category_rating = 'Category 5e'
WHERE category_rating ILIKE '%category 5e%'
   OR category_rating ILIKE '%cat5e%'
   OR category_rating ILIKE '%cat 5e%';

-- Standardize Category 6 variations
UPDATE prod_category_cables
SET category_rating = 'Category 6'
WHERE category_rating ILIKE '%category 6%'
   AND category_rating NOT ILIKE '%6a%'
   AND category_rating != 'Category 6';

-- Standardize Category 6A variations
UPDATE prod_category_cables
SET category_rating = 'Category 6A'
WHERE category_rating ILIKE '%category 6a%'
   OR category_rating ILIKE '%cat6a%'
   OR category_rating ILIKE '%cat 6a%';

-- Update any "Category 5e UTP" to just "Category 5e"
UPDATE prod_category_cables
SET category_rating = 'Category 5e'
WHERE category_rating = 'Category 5e UTP';

-- Update any "Category 6 UTP" to just "Category 6"
UPDATE prod_category_cables
SET category_rating = 'Category 6'
WHERE category_rating = 'Category 6 UTP';

-- Update any "Category 6A UTP" or "Category 6a UTP" to just "Category 6A"
UPDATE prod_category_cables
SET category_rating = 'Category 6A'
WHERE category_rating IN ('Category 6A UTP', 'Category 6a UTP', 'Category 6A STP', 'Category 6a STP');

-- Show the results
SELECT 
    'After standardization:' as info;

SELECT 
    category_rating,
    COUNT(*) as count
FROM prod_category_cables
GROUP BY category_rating
ORDER BY category_rating;

-- Force search vector rebuild
UPDATE prod_category_cables
SET updated_at = CURRENT_TIMESTAMP
WHERE category_rating IN ('Category 5e', 'Category 6', 'Category 6A');

COMMIT;