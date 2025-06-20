-- Fix NetKey Faceplates to be Keystone-Compatible
-- NetKey faceplates use the Keystone standard opening size

-- STEP 1: Verify what we're about to update
SELECT 
    part_number,
    brand,
    product_line,
    array_to_string(compatible_jacks, ', ') as current_compatible_jacks,
    short_description
FROM faceplates
WHERE brand = 'PANDUIT' 
  AND product_line = 'NetKey'
  AND is_active = true
  AND NOT ('Keystone' = ANY(compatible_jacks));  -- Only ones that need updating

-- STEP 2: Update NetKey faceplates to include Keystone compatibility
UPDATE faceplates
SET compatible_jacks = array_append(compatible_jacks, 'Keystone')
WHERE brand = 'PANDUIT' 
  AND product_line = 'NetKey'
  AND is_active = true
  AND NOT ('Keystone' = ANY(compatible_jacks));  -- Only update if Keystone not already there

-- STEP 3: Verify the update worked
SELECT 
    part_number,
    brand,
    product_line,
    array_to_string(compatible_jacks, ', ') as updated_compatible_jacks
FROM faceplates
WHERE brand = 'PANDUIT' 
  AND product_line = 'NetKey'
  AND is_active = true
LIMIT 10;

-- STEP 4: Double-check Mini-Com faceplates are still NOT Keystone-compatible
SELECT 
    COUNT(*) as minicom_with_keystone_count
FROM faceplates
WHERE brand = 'PANDUIT' 
  AND product_line = 'Mini-Com'
  AND 'Keystone' = ANY(compatible_jacks)
  AND is_active = true;
-- This should return 0

-- STEP 5: Now test - find all faceplates compatible with Keystone jacks
SELECT 
    part_number,
    brand,
    product_line,
    array_to_string(compatible_jacks, ', ') as compatible_jacks
FROM faceplates
WHERE is_active = true
  AND 'Keystone' = ANY(compatible_jacks)
ORDER BY brand, product_line
LIMIT 20;