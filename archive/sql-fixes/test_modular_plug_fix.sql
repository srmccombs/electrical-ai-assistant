-- Test modular plug search fix
-- Created: June 19, 2025

-- 1. Verify modular_plugs table has data
SELECT 
    'Modular Plugs Table' as check_name,
    COUNT(*) as total_records,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_records
FROM modular_plugs;

-- 2. Check sample of modular plug data with key fields
SELECT 
    part_number,
    brand,
    short_description,
    category,
    category_rating,
    shielding_type,
    conductor_awg,
    packaging_qty
FROM modular_plugs
WHERE is_active = true
ORDER BY brand, part_number
LIMIT 5;

-- 3. Verify no jack modules have "modular plug" in their search terms
SELECT 
    'Jack Modules with modular plug terms' as check_name,
    COUNT(*) as count
FROM jack_modules
WHERE is_active = true
  AND (
    common_terms ILIKE '%modular plug%' OR
    short_description ILIKE '%modular plug%' OR
    common_terms ILIKE '%cable end%' OR
    common_terms ILIKE '%clear end%'
  );

-- 4. Show any jack modules that might be confused
SELECT 
    part_number,
    brand,
    short_description,
    common_terms
FROM jack_modules
WHERE is_active = true
  AND (
    common_terms ILIKE '%rj45%' OR
    short_description ILIKE '%plug%'
  )
LIMIT 5;