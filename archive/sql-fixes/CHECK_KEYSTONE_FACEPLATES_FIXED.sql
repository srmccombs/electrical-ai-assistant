-- Diagnostic Query for Keystone Faceplate Compatibility (FIXED)
-- Run this in your Supabase SQL editor to understand your data

-- 1. Check what's in your faceplates table for Keystone compatibility
SELECT 
    part_number,
    brand,
    product_line,
    product_type,
    type,
    common_terms,
    array_to_string(compatible_jacks, ', ') as compatible_jacks_list,
    short_description
FROM faceplates
WHERE is_active = true
    AND (
        product_line ILIKE '%keystone%' 
        OR type ILIKE '%keystone%'
        OR product_type ILIKE '%keystone%'
        OR common_terms ILIKE '%keystone%'
        OR array_to_string(compatible_jacks, ' ') ILIKE '%keystone%'
        OR short_description ILIKE '%keystone%'
    )
LIMIT 20;

-- 2. Check how Panduit Mini-Com faceplates are stored
SELECT 
    part_number,
    brand,
    product_line,
    product_type,
    type,
    array_to_string(compatible_jacks, ', ') as compatible_jacks_list
FROM faceplates
WHERE is_active = true
    AND brand ILIKE '%panduit%'
    AND product_line = 'Mini-Com'
LIMIT 5;

-- 3. Check if you have any generic/universal Keystone faceplates
SELECT 
    part_number,
    brand,
    product_line,
    product_type,
    type,
    array_to_string(compatible_jacks, ', ') as compatible_jacks_list
FROM faceplates
WHERE is_active = true
    AND (type ILIKE '%keystone%' OR product_type ILIKE '%keystone%')
    AND brand NOT IN ('PANDUIT', 'Hubbell')
LIMIT 10;

-- 4. Count total faceplates by product_line
SELECT 
    product_line,
    COUNT(*) as count
FROM faceplates
WHERE is_active = true
    AND product_line IS NOT NULL
GROUP BY product_line
ORDER BY count DESC
LIMIT 20;

-- 5. Check a sample of all faceplates to see field patterns
SELECT 
    part_number,
    brand,
    product_line,
    type,
    product_type,
    array_to_string(compatible_jacks, ', ') as compatible_jacks_list
FROM faceplates
WHERE is_active = true
ORDER BY brand, product_line
LIMIT 30;

-- 6. Specifically check Dynacom jack compatibility info
SELECT 
    part_number,
    brand,
    product_line,
    compatible_faceplates
FROM jack_modules
WHERE brand = 'Dynacom'
    AND is_active = true
LIMIT 10;

-- 7. Check what brands/product lines exist in faceplates
SELECT DISTINCT
    brand,
    product_line
FROM faceplates
WHERE is_active = true
    AND brand IS NOT NULL
    AND product_line IS NOT NULL
ORDER BY brand, product_line;

-- 8. Look for any faceplates that might be compatible with "Keystone" jacks
-- by checking the compatible_jacks array
SELECT 
    part_number,
    brand,
    product_line,
    type,
    array_to_string(compatible_jacks, ', ') as compatible_jacks_list
FROM faceplates
WHERE is_active = true
    AND (
        'Keystone' = ANY(compatible_jacks)
        OR 'keystone' = ANY(compatible_jacks)
        OR EXISTS (
            SELECT 1 FROM unnest(compatible_jacks) as jack
            WHERE jack ILIKE '%keystone%'
        )
    )
LIMIT 20;