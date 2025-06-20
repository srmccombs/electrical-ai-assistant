-- Fix Dynacom trailing space issue and update compatibility
-- Created: June 18, 2025
-- Issue: Brand is stored as "Dynacom " with trailing space in faceplates and surface_mount_box

-- =====================================================
-- FACEPLATES - Fix trailing space and update compatibility
-- =====================================================

-- Step 1: Check current Dynacom faceplates (with space)
SELECT 
    brand,
    LENGTH(brand) as brand_length,
    product_line,
    COUNT(*) as count
FROM faceplates
WHERE brand LIKE 'Dynacom%'
GROUP BY brand, product_line;

-- Step 2: Disable trigger
ALTER TABLE faceplates DISABLE TRIGGER sync_faceplates_to_mayer;

-- Step 3: Fix the trailing space in brand name
UPDATE faceplates
SET brand = TRIM(brand),
    updated_at = CURRENT_TIMESTAMP
WHERE brand LIKE 'Dynacom%';

-- Step 4: Update compatibility for Dynacom Keystone faceplates
UPDATE faceplates
SET compatible_jacks = ARRAY['Keystone', 'NetKey']::text[],
    updated_at = CURRENT_TIMESTAMP
WHERE brand = 'Dynacom' 
AND product_line = 'Keystone'
AND is_active = true;

-- Step 5: Re-enable trigger
ALTER TABLE faceplates ENABLE TRIGGER sync_faceplates_to_mayer;

-- Step 6: Verify the fix
SELECT 
    part_number,
    brand,
    LENGTH(brand) as brand_length,
    product_line,
    compatible_jacks
FROM faceplates
WHERE brand = 'Dynacom' 
AND product_line = 'Keystone'
LIMIT 10;

-- =====================================================
-- SURFACE MOUNT BOXES - Fix trailing space and update compatibility
-- =====================================================

-- Step 1: Check current Dynacom SMBs (with space)
SELECT 
    brand,
    LENGTH(brand) as brand_length,
    product_line,
    COUNT(*) as count
FROM surface_mount_box
WHERE brand LIKE 'Dynacom%'
GROUP BY brand, product_line;

-- Step 2: Disable trigger
ALTER TABLE surface_mount_box DISABLE TRIGGER sync_surface_mount_to_mayer;

-- Step 3: Fix the trailing space in brand name
UPDATE surface_mount_box
SET brand = TRIM(brand),
    updated_at = CURRENT_TIMESTAMP
WHERE brand LIKE 'Dynacom%';

-- Step 4: Update compatibility for Dynacom Keystone SMBs
UPDATE surface_mount_box
SET compatible_jacks = ARRAY['Keystone', 'NetKey']::text[],
    updated_at = CURRENT_TIMESTAMP
WHERE brand = 'Dynacom' 
AND product_line = 'Keystone'
AND is_active = true;

-- Step 5: Re-enable trigger
ALTER TABLE surface_mount_box ENABLE TRIGGER sync_surface_mount_to_mayer;

-- Step 6: Verify the fix
SELECT 
    part_number,
    brand,
    LENGTH(brand) as brand_length,
    product_line,
    compatible_jacks
FROM surface_mount_box
WHERE brand = 'Dynacom' 
AND product_line = 'Keystone'
LIMIT 10;

-- =====================================================
-- FINAL VERIFICATION - Check all tables
-- =====================================================

-- Summary of all Dynacom products with Keystone/NetKey compatibility
SELECT 
    'jack_modules' as table_name,
    COUNT(*) as dynacom_keystone_count,
    COUNT(CASE WHEN compatible_faceplates = ARRAY['Keystone', 'NetKey']::text[] THEN 1 END) as updated_count
FROM jack_modules
WHERE brand = 'Dynacom' 
AND product_line = 'Keystone'
AND is_active = true

UNION ALL

SELECT 
    'faceplates' as table_name,
    COUNT(*) as dynacom_keystone_count,
    COUNT(CASE WHEN compatible_jacks = ARRAY['Keystone', 'NetKey']::text[] THEN 1 END) as updated_count
FROM faceplates
WHERE brand = 'Dynacom' 
AND product_line = 'Keystone'
AND is_active = true

UNION ALL

SELECT 
    'surface_mount_box' as table_name,
    COUNT(*) as dynacom_keystone_count,
    COUNT(CASE WHEN compatible_jacks = ARRAY['Keystone', 'NetKey']::text[] THEN 1 END) as updated_count
FROM surface_mount_box
WHERE brand = 'Dynacom' 
AND product_line = 'Keystone'
AND is_active = true;

-- Check for any remaining trailing spaces
SELECT 
    'faceplates' as table_name,
    brand,
    LENGTH(brand) as brand_length,
    COUNT(*) as count
FROM faceplates
WHERE brand LIKE '%Dynacom%'
GROUP BY brand

UNION ALL

SELECT 
    'surface_mount_box' as table_name,
    brand,
    LENGTH(brand) as brand_length,
    COUNT(*) as count
FROM surface_mount_box
WHERE brand LIKE '%Dynacom%'
GROUP BY brand

UNION ALL

SELECT 
    'jack_modules' as table_name,
    brand,
    LENGTH(brand) as brand_length,
    COUNT(*) as count
FROM jack_modules
WHERE brand LIKE '%Dynacom%'
GROUP BY brand
ORDER BY table_name, brand;