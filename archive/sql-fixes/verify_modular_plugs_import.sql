-- Verify modular plugs import and fix any issues
-- Created: June 19, 2025

-- 1. Check if data was imported
SELECT 
    COUNT(*) as total_records,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_records,
    COUNT(CASE WHEN brand = 'Simply Brands' THEN 1 END) as simply_brands_count,
    COUNT(CASE WHEN brand = 'Dynacom' THEN 1 END) as dynacom_count
FROM modular_plugs;

-- 2. Show sample of imported data
SELECT 
    id,
    part_number,
    brand,
    short_description,
    category,
    category_rating,
    shielding_type,
    conductor_awg,
    packaging_qty,
    is_active
FROM modular_plugs
ORDER BY id
LIMIT 10;

-- 3. Fix category_rating format if needed (remove extra spaces)
UPDATE modular_plugs
SET category_rating = ARRAY(
    SELECT TRIM(unnest(category_rating))
)
WHERE category_rating IS NOT NULL;

-- 4. Ensure all records have proper category
UPDATE modular_plugs
SET category = 'Modular Plug'
WHERE category IS NULL OR category = '';

-- 5. Verify search terms are populated
SELECT 
    COUNT(*) as total,
    COUNT(common_terms) as with_common_terms,
    COUNT(CASE WHEN common_terms LIKE '%modular plug%' THEN 1 END) as has_modular_plug,
    COUNT(CASE WHEN common_terms LIKE '%rj45%' THEN 1 END) as has_rj45
FROM modular_plugs;

-- 6. Test a basic search query
SELECT 
    part_number,
    brand,
    short_description,
    category_rating,
    shielding_type,
    conductor_awg,
    packaging_qty
FROM modular_plugs
WHERE is_active = true
ORDER BY brand, part_number
LIMIT 25;

-- 7. Verify array fields are properly formatted
SELECT 
    part_number,
    category_rating,
    pg_typeof(category_rating) as category_rating_type
FROM modular_plugs
WHERE category_rating IS NOT NULL
LIMIT 5;