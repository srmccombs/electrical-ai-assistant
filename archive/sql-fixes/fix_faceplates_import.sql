-- Fix for faceplates import issue
-- Problem: sync_faceplates_to_mayer trigger expects fields that may not exist in faceplates table
-- Created: June 17, 2025

-- STEP 1: Check current trigger status
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'faceplates'
    AND trigger_schema = 'public';

-- STEP 2: Temporarily disable the mayer_stock sync trigger
ALTER TABLE faceplates DISABLE TRIGGER sync_faceplates_to_mayer;

-- Verify it's disabled
SELECT 
    tgname AS trigger_name,
    CASE 
        WHEN tgenabled = 'O' THEN 'ENABLED'
        WHEN tgenabled = 'D' THEN 'DISABLED'
        ELSE 'UNKNOWN'
    END AS status
FROM pg_trigger
WHERE tgrelid = 'public.faceplates'::regclass
    AND tgname = 'sync_faceplates_to_mayer';

-- STEP 3: Now you can import your CSV data
-- Use Supabase dashboard or your preferred import method
-- Your CSV should NOT include last_modified_by or created_by columns

-- STEP 4: After import, manually sync new records to mayer_stock
-- First, let's see what needs to be synced
SELECT COUNT(*) as new_records_to_sync
FROM faceplates f
WHERE NOT EXISTS (
    SELECT 1 FROM mayer_stock m 
    WHERE m.part_number = f.part_number
);

-- Sync new records to mayer_stock with default values
INSERT INTO mayer_stock (
    part_number, 
    brand,
    short_description,
    branch,
    second_item_number,
    qty_on_hand,
    qty_on_order,
    last_modified_by,
    created_by,
    created_at,
    updated_at,
    is_active
)
SELECT 
    f.part_number,
    f.brand,
    f.short_description,
    'PENDING' as branch,
    UPPER(REPLACE(REPLACE(f.part_number, '-', ''), ' ', '')) as second_item_number,
    0 as qty_on_hand,
    0 as qty_on_order,
    'IMPORT' as last_modified_by,
    'IMPORT' as created_by,
    CURRENT_TIMESTAMP as created_at,
    CURRENT_TIMESTAMP as updated_at,
    true as is_active
FROM faceplates f
WHERE NOT EXISTS (
    SELECT 1 FROM mayer_stock m 
    WHERE m.part_number = f.part_number
)
AND f.is_active = true;

-- STEP 5: Re-enable the trigger
ALTER TABLE faceplates ENABLE TRIGGER sync_faceplates_to_mayer;

-- Verify it's enabled again
SELECT 
    tgname AS trigger_name,
    CASE 
        WHEN tgenabled = 'O' THEN 'ENABLED'
        WHEN tgenabled = 'D' THEN 'DISABLED'
        ELSE 'UNKNOWN'
    END AS status
FROM pg_trigger
WHERE tgrelid = 'public.faceplates'::regclass
    AND tgname = 'sync_faceplates_to_mayer';

-- OPTIONAL: Check the results
SELECT 
    'faceplates' as source_table,
    COUNT(*) as total_records
FROM faceplates
WHERE is_active = true
UNION ALL
SELECT 
    'mayer_stock (faceplate products)' as source_table,
    COUNT(*) as total_records
FROM mayer_stock
WHERE part_number IN (SELECT part_number FROM faceplates);

-- QUICK REFERENCE CHECKLIST:
-- 1. Run: ALTER TABLE faceplates DISABLE TRIGGER sync_faceplates_to_mayer;
-- 2. Import your CSV file through Supabase Table Editor
-- 3. Run the INSERT INTO mayer_stock... query above
-- 4. Run: ALTER TABLE faceplates ENABLE TRIGGER sync_faceplates_to_mayer;
-- 5. Verify with the count queries

-- STEP 6: Update Dynacom Keystone faceplates to be compatible with both Keystone and NetKey jacks
-- Created: June 18, 2025
-- This ensures Dynacom brand faceplates with product_line 'Keystone' work with both Keystone and NetKey jacks

-- First, check how many Dynacom Keystone faceplates we have
SELECT COUNT(*) as dynacom_keystone_faceplates
FROM faceplates
WHERE brand = 'Dynacom' 
AND product_line = 'Keystone'
AND is_active = true;

-- Update the compatible_jacks field to include both Keystone and NetKey
UPDATE faceplates
SET compatible_jacks = ARRAY['Keystone', 'NetKey']::text[],
    updated_at = CURRENT_TIMESTAMP
WHERE brand = 'Dynacom' 
AND product_line = 'Keystone'
AND is_active = true;

-- Verify the update
SELECT 
    part_number,
    brand,
    product_line,
    compatible_jacks
FROM faceplates
WHERE brand = 'Dynacom' 
AND product_line = 'Keystone'
AND is_active = true
LIMIT 5;