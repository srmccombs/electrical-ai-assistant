-- Test different ways to query array fields in Supabase/PostgreSQL

-- Method 1: Using ANY operator
SELECT part_number, brand, product_line, array_to_string(compatible_jacks, ', ') as compatible_jacks
FROM faceplates
WHERE 'Keystone' = ANY(compatible_jacks)
  AND is_active = true
LIMIT 10;

-- Method 2: Using @> operator (array contains)
SELECT part_number, brand, product_line, array_to_string(compatible_jacks, ', ') as compatible_jacks
FROM faceplates
WHERE compatible_jacks @> ARRAY['Keystone']
  AND is_active = true
LIMIT 10;

-- Method 3: Using && operator (arrays overlap)
SELECT part_number, brand, product_line, array_to_string(compatible_jacks, ', ') as compatible_jacks
FROM faceplates
WHERE compatible_jacks && ARRAY['Keystone']
  AND is_active = true
LIMIT 10;

-- Check what NetKey faceplates have after the update
SELECT part_number, brand, product_line, array_to_string(compatible_jacks, ', ') as compatible_jacks
FROM faceplates
WHERE brand = 'PANDUIT' 
  AND product_line = 'NetKey'
  AND is_active = true
LIMIT 5;