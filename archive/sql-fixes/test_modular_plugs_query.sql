-- Test basic query that the search function uses

-- 1. First check if table has any data
SELECT COUNT(*) as total_records FROM modular_plugs;

-- 2. Check active records
SELECT COUNT(*) as active_records 
FROM modular_plugs 
WHERE is_active = true;

-- 3. Run the exact base query the search uses
SELECT *
FROM modular_plugs
WHERE is_active = true
ORDER BY brand ASC, part_number ASC
LIMIT 50;

-- 4. Check if any records would match "RJ45" search
SELECT COUNT(*) as rj45_matches
FROM modular_plugs
WHERE is_active = true
  AND short_description ILIKE '%RJ45%';

-- 5. Show first 5 records to see structure
SELECT 
    id,
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