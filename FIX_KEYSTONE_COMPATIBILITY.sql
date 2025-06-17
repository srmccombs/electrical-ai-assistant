-- Fix Keystone Compatibility for Dynacom Jacks
-- This script will help you set up Keystone faceplates in your database

-- STEP 1: First, let's see what faceplates you have that SHOULD be Keystone-compatible
-- Look for faceplates that might be universal/keystone but aren't marked as such
SELECT 
    part_number,
    brand,
    product_line,
    type,
    short_description
FROM faceplates
WHERE is_active = true
    AND (
        short_description ILIKE '%universal%'
        OR short_description ILIKE '%blank%'
        OR short_description ILIKE '%modular%'
        OR short_description ILIKE '%snap%'
        OR brand IN ('Leviton', 'ICC', 'Generic')  -- Common brands that make Keystone faceplates
    )
    AND product_line IS DISTINCT FROM 'Keystone'  -- Not already marked as Keystone
LIMIT 20;

-- STEP 2: If you want to make certain faceplates Keystone-compatible, run this:
-- Example: Make all Leviton QuickPort faceplates also compatible with Keystone
/*
UPDATE faceplates
SET compatible_jacks = 
    CASE 
        WHEN compatible_jacks IS NULL THEN ARRAY['Keystone']
        WHEN NOT ('Keystone' = ANY(compatible_jacks)) THEN array_append(compatible_jacks, 'Keystone')
        ELSE compatible_jacks
    END
WHERE is_active = true
    AND brand = 'Leviton'
    AND product_line = 'QuickPort';
*/

-- STEP 3: Alternative - Add some generic Keystone faceplates
-- This creates truly universal Keystone faceplates if you don't have any
/*
INSERT INTO faceplates (
    part_number,
    brand,
    product_line,
    type,
    product_type,
    short_description,
    number_of_ports,
    color,
    compatible_jacks,
    is_active
) VALUES 
    ('KS-FP-1-WH', 'Generic', 'Keystone', 'Keystone', 'Faceplate', 'Keystone Faceplate 1 Port White', 1, 'White', ARRAY['Keystone'], true),
    ('KS-FP-2-WH', 'Generic', 'Keystone', 'Keystone', 'Faceplate', 'Keystone Faceplate 2 Port White', 2, 'White', ARRAY['Keystone'], true),
    ('KS-FP-4-WH', 'Generic', 'Keystone', 'Keystone', 'Faceplate', 'Keystone Faceplate 4 Port White', 4, 'White', ARRAY['Keystone'], true),
    ('KS-FP-6-WH', 'Generic', 'Keystone', 'Keystone', 'Faceplate', 'Keystone Faceplate 6 Port White', 6, 'White', ARRAY['Keystone'], true);
*/

-- STEP 4: Check if Panduit Mini-Com faceplates could also accept Keystone jacks
-- Many faceplates accept both their proprietary and Keystone formats
SELECT 
    part_number,
    brand,
    product_line,
    array_to_string(compatible_jacks, ', ') as current_compatible_jacks,
    short_description
FROM faceplates
WHERE is_active = true
    AND brand = 'PANDUIT'
    AND product_line = 'Mini-Com'
LIMIT 10;

-- STEP 5: Quick fix - Make some existing faceplates Keystone-compatible
-- This finds faceplates that don't have a specific product line and makes them universal
/*
UPDATE faceplates
SET product_line = 'Keystone',
    compatible_jacks = 
        CASE 
            WHEN compatible_jacks IS NULL THEN ARRAY['Keystone']
            WHEN NOT ('Keystone' = ANY(compatible_jacks)) THEN array_append(compatible_jacks, 'Keystone')
            ELSE compatible_jacks
        END
WHERE is_active = true
    AND (product_line IS NULL OR product_line = '')
    AND number_of_ports IN (1, 2, 4, 6)  -- Common Keystone port counts
LIMIT 20;
*/

-- VERIFICATION: After running updates, check if Dynacom compatibility now works
SELECT 
    part_number,
    brand,
    product_line,
    array_to_string(compatible_jacks, ', ') as compatible_jacks_list
FROM faceplates
WHERE is_active = true
    AND (
        product_line = 'Keystone'
        OR 'Keystone' = ANY(compatible_jacks)
    )
LIMIT 10;