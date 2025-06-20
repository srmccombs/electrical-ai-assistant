-- Check modular_plugs table status

-- 1. Check if table exists and count records
SELECT 
    COUNT(*) as total_records,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_records,
    COUNT(CASE WHEN is_active = false THEN 1 END) as inactive_records
FROM modular_plugs;

-- 2. Show sample data
SELECT 
    part_number,
    brand,
    short_description,
    is_active,
    category,
    category_rating,
    shielding_type,
    conductor_awg,
    packaging_qty
FROM modular_plugs
LIMIT 5;

-- 3. Check if any records match basic search terms
SELECT COUNT(*) as matches_modular
FROM modular_plugs
WHERE is_active = true
  AND (
    short_description ILIKE '%modular%' OR
    short_description ILIKE '%plug%' OR
    short_description ILIKE '%RJ45%' OR
    short_description ILIKE '%RJ-45%'
  );

-- 4. Show all active products (should be 23)
SELECT 
    part_number,
    brand,
    short_description
FROM modular_plugs
WHERE is_active = true
ORDER BY brand, part_number;