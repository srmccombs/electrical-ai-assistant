-- Fix Dynacom Faceplates with NULL is_active status

-- STEP 1: Verify the issue - count Dynacom faceplates with NULL is_active
SELECT 
    COUNT(*) as null_active_count,
    brand,
    product_line
FROM faceplates
WHERE brand = 'Dynacom'
  AND is_active IS NULL
GROUP BY brand, product_line;

-- STEP 2: Preview what we're about to update
SELECT 
    part_number,
    brand,
    product_line,
    array_to_string(compatible_jacks, ', ') as compatible_jacks,
    is_active,
    short_description
FROM faceplates
WHERE brand = 'Dynacom'
  AND is_active IS NULL
LIMIT 10;

-- STEP 3: Update all Dynacom faceplates with NULL is_active to true
UPDATE faceplates
SET is_active = true
WHERE brand = 'Dynacom'
  AND is_active IS NULL;

-- STEP 4: Verify the update worked
SELECT 
    is_active,
    COUNT(*) as count
FROM faceplates
WHERE brand = 'Dynacom'
GROUP BY is_active;

-- STEP 5: Now test - find Dynacom Keystone faceplates
SELECT 
    part_number,
    brand,
    product_line,
    array_to_string(compatible_jacks, ', ') as compatible_jacks,
    is_active
FROM faceplates
WHERE brand = 'Dynacom'
  AND is_active = true
  AND (product_line = 'Keystone' OR 'Keystone' = ANY(compatible_jacks))
LIMIT 10;