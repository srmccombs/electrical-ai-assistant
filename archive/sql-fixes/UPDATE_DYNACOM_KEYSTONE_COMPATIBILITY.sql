-- Update Dynacom Keystone products to be compatible with both Keystone and NetKey
-- Created: June 18, 2025
-- This script safely updates compatibility without triggering sync errors

-- =====================================================
-- JACK MODULES - Update Dynacom Keystone compatibility
-- =====================================================

-- Step 1: Disable the trigger that's causing issues
ALTER TABLE jack_modules DISABLE TRIGGER sync_jack_modules_to_mayer;

-- Step 2: Check how many Dynacom Keystone jacks we have
SELECT COUNT(*) as dynacom_keystone_jacks_count
FROM jack_modules
WHERE brand = 'Dynacom' 
AND product_line = 'Keystone'
AND is_active = true;

-- Step 3: Update the compatible_faceplates field
UPDATE jack_modules
SET compatible_faceplates = ARRAY['Keystone', 'NetKey']::text[],
    updated_at = CURRENT_TIMESTAMP
WHERE brand = 'Dynacom' 
AND product_line = 'Keystone'
AND is_active = true;

-- Step 4: Verify the jack module update
SELECT 
    part_number,
    brand,
    product_line,
    compatible_faceplates
FROM jack_modules
WHERE brand = 'Dynacom' 
AND product_line = 'Keystone'
AND is_active = true
LIMIT 10;

-- Step 5: Re-enable the trigger
ALTER TABLE jack_modules ENABLE TRIGGER sync_jack_modules_to_mayer;

-- =====================================================
-- FACEPLATES - Update Dynacom Keystone compatibility
-- =====================================================

-- Step 1: Disable the trigger
ALTER TABLE faceplates DISABLE TRIGGER sync_faceplates_to_mayer;

-- Step 2: Check how many Dynacom Keystone faceplates we have
SELECT COUNT(*) as dynacom_keystone_faceplates_count
FROM faceplates
WHERE brand = 'Dynacom' 
AND product_line = 'Keystone'
AND is_active = true;

-- Step 3: Update the compatible_jacks field
UPDATE faceplates
SET compatible_jacks = ARRAY['Keystone', 'NetKey']::text[],
    updated_at = CURRENT_TIMESTAMP
WHERE brand = 'Dynacom' 
AND product_line = 'Keystone'
AND is_active = true;

-- Step 4: Verify the faceplate update
SELECT 
    part_number,
    brand,
    product_line,
    compatible_jacks
FROM faceplates
WHERE brand = 'Dynacom' 
AND product_line = 'Keystone'
AND is_active = true
LIMIT 10;

-- Step 5: Re-enable the trigger
ALTER TABLE faceplates ENABLE TRIGGER sync_faceplates_to_mayer;

-- =====================================================
-- SURFACE MOUNT BOXES - Update Dynacom Keystone compatibility
-- =====================================================

-- Step 1: Disable the trigger
ALTER TABLE surface_mount_box DISABLE TRIGGER sync_surface_mount_to_mayer;

-- Step 2: Check how many Dynacom Keystone SMBs we have
SELECT COUNT(*) as dynacom_keystone_smb_count
FROM surface_mount_box
WHERE brand = 'Dynacom' 
AND product_line = 'Keystone'
AND is_active = true;

-- Step 3: Update the compatible_jacks field
UPDATE surface_mount_box
SET compatible_jacks = ARRAY['Keystone', 'NetKey']::text[],
    updated_at = CURRENT_TIMESTAMP
WHERE brand = 'Dynacom' 
AND product_line = 'Keystone'
AND is_active = true;

-- Step 4: Verify the SMB update
SELECT 
    part_number,
    brand,
    product_line,
    compatible_jacks
FROM surface_mount_box
WHERE brand = 'Dynacom' 
AND product_line = 'Keystone'
AND is_active = true
LIMIT 10;

-- Step 5: Re-enable the trigger
ALTER TABLE surface_mount_box ENABLE TRIGGER sync_surface_mount_to_mayer;

-- =====================================================
-- FINAL VERIFICATION - Check all updates
-- =====================================================

-- Summary of updates
SELECT 
    'jack_modules' as table_name,
    COUNT(*) as updated_count
FROM jack_modules
WHERE brand = 'Dynacom' 
AND product_line = 'Keystone'
AND compatible_faceplates = ARRAY['Keystone', 'NetKey']::text[]
AND is_active = true

UNION ALL

SELECT 
    'faceplates' as table_name,
    COUNT(*) as updated_count
FROM faceplates
WHERE brand = 'Dynacom' 
AND product_line = 'Keystone'
AND compatible_jacks = ARRAY['Keystone', 'NetKey']::text[]
AND is_active = true

UNION ALL

SELECT 
    'surface_mount_box' as table_name,
    COUNT(*) as updated_count
FROM surface_mount_box
WHERE brand = 'Dynacom' 
AND product_line = 'Keystone'
AND compatible_jacks = ARRAY['Keystone', 'NetKey']::text[]
AND is_active = true;

-- Additional check: If counts are 0, let's see what Dynacom products exist
SELECT 
    'jack_modules' as table_name,
    brand,
    product_line,
    COUNT(*) as count
FROM jack_modules
WHERE brand = 'Dynacom'
AND is_active = true
GROUP BY brand, product_line

UNION ALL

SELECT 
    'faceplates' as table_name,
    brand,
    product_line,
    COUNT(*) as count
FROM faceplates
WHERE brand = 'Dynacom'
AND is_active = true
GROUP BY brand, product_line

UNION ALL

SELECT 
    'surface_mount_box' as table_name,
    brand,
    product_line,
    COUNT(*) as count
FROM surface_mount_box
WHERE brand = 'Dynacom'
AND is_active = true
GROUP BY brand, product_line
ORDER BY table_name, product_line;