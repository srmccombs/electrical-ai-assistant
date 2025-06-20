-- Debug Dynacom Faceplates Search Issue

-- STEP 1: Check ALL Dynacom faceplates (including inactive ones)
SELECT 
    part_number,
    brand,
    product_line,
    array_to_string(compatible_jacks, ', ') as compatible_jacks,
    is_active,
    short_description
FROM faceplates
WHERE brand = 'Dynacom'
LIMIT 20;

-- STEP 2: Count active vs inactive Dynacom faceplates
SELECT 
    is_active,
    COUNT(*) as count
FROM faceplates
WHERE brand = 'Dynacom'
GROUP BY is_active;

-- STEP 3: Check if it's a case sensitivity issue
SELECT DISTINCT brand
FROM faceplates
WHERE brand ILIKE '%dynacom%'
ORDER BY brand;

-- STEP 4: Check if Dynacom faceplates with Keystone compatibility exist
SELECT 
    part_number,
    brand,
    product_line,
    array_to_string(compatible_jacks, ', ') as compatible_jacks,
    is_active
FROM faceplates
WHERE brand ILIKE '%dynacom%'
  AND ('Keystone' = ANY(compatible_jacks) OR product_line = 'Keystone')
LIMIT 20;

-- STEP 5: If they're inactive, here's the fix:
-- UPDATE faceplates
-- SET is_active = true
-- WHERE brand = 'Dynacom'
--   AND product_line = 'Keystone';

-- STEP 6: Alternative - check exact case of brand name in database
SELECT DISTINCT 
    brand,
    COUNT(*) as count
FROM faceplates
WHERE UPPER(brand) = 'DYNACOM'
GROUP BY brand
ORDER BY brand;