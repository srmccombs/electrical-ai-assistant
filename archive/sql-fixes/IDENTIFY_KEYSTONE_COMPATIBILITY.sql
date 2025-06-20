-- Identify and Fix Keystone Compatibility in Your Database
-- Keystone is an industry standard jack opening size

-- STEP 1: Check current NetKey faceplates (should be Keystone-compatible)
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
LIMIT 10;

-- STEP 2: Check Mini-Com faceplates (should NOT be Keystone-compatible)
SELECT 
    part_number,
    brand,
    product_line,
    array_to_string(compatible_jacks, ', ') as current_compatible_jacks,
    short_description
FROM faceplates
WHERE brand = 'PANDUIT' 
  AND product_line = 'Mini-Com'
  AND is_active = true
LIMIT 10;

-- STEP 3: Find all unique product_line values to identify other potential Keystone-compatible lines
SELECT DISTINCT
    brand,
    product_line,
    COUNT(*) as faceplate_count
FROM faceplates
WHERE is_active = true
  AND brand IS NOT NULL
  AND product_line IS NOT NULL
GROUP BY brand, product_line
ORDER BY brand, product_line;

-- STEP 4: Check for faceplates that might be Keystone-compatible based on description
SELECT 
    part_number,
    brand,
    product_line,
    short_description,
    array_to_string(compatible_jacks, ', ') as current_compatible_jacks
FROM faceplates
WHERE is_active = true
  AND (
    short_description ILIKE '%keystone%'
    OR short_description ILIKE '%modular%'
    OR type ILIKE '%keystone%'
    OR type ILIKE '%modular%'
  )
ORDER BY brand, product_line
LIMIT 20;

-- STEP 5: After you identify which product lines are Keystone-compatible,
-- here's the template to update them:

-- Example for NetKey (uncomment and run after verification):

UPDATE faceplates
SET compatible_jacks = 
    CASE 
        WHEN compatible_jacks IS NULL THEN ARRAY['Keystone', 'NetKey']
        WHEN NOT ('Keystone' = ANY(compatible_jacks)) THEN array_append(compatible_jacks, 'Keystone')
        ELSE compatible_jacks
    END
WHERE brand = 'PANDUIT' 
  AND product_line = 'NetKey'
  AND is_active = true;


-- Example for other Keystone-compatible product lines:

UPDATE faceplates
SET compatible_jacks = 
    CASE 
        WHEN compatible_jacks IS NULL THEN ARRAY['Keystone', '{ORIGINAL_PRODUCT_LINE}']
        WHEN NOT ('Keystone' = ANY(compatible_jacks)) THEN array_append(compatible_jacks, 'Keystone')
        ELSE compatible_jacks
    END
WHERE brand = '{BRAND}' 
  AND product_line = '{PRODUCT_LINE}'
  AND is_active = true;


-- STEP 6: Verify Mini-Com is NOT marked as Keystone-compatible
SELECT 
    part_number,
    array_to_string(compatible_jacks, ', ') as compatible_jacks
FROM faceplates
WHERE brand = 'PANDUIT' 
  AND product_line = 'Mini-Com'
  AND 'Keystone' = ANY(compatible_jacks)
  AND is_active = true;

-- If any Mini-Com faceplates are incorrectly marked as Keystone-compatible:

UPDATE faceplates
SET compatible_jacks = array_remove(compatible_jacks, 'Keystone')
WHERE brand = 'PANDUIT' 
  AND product_line = 'Mini-Com'
  AND 'Keystone' = ANY(compatible_jacks)
  AND is_active = true;
