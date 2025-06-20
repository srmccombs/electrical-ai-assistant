-- Fix for jack_modules import issue
-- Problem: sync_jack_modules_to_mayer trigger expects fields that don't exist in jack_modules table
-- Created: June 17, 2025

-- STEP 1: Check current trigger status
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'jack_modules'
    AND trigger_schema = 'public';

-- STEP 2: Temporarily disable the mayer_stock sync trigger
ALTER TABLE jack_modules DISABLE TRIGGER sync_jack_modules_to_mayer;

-- Verify it's disabled
SELECT 
    tgname AS trigger_name,
    CASE 
        WHEN tgenabled = 'O' THEN 'ENABLED'
        WHEN tgenabled = 'D' THEN 'DISABLED'
        ELSE 'UNKNOWN'
    END AS status
FROM pg_trigger
WHERE tgrelid = 'public.jack_modules'::regclass
    AND tgname = 'sync_jack_modules_to_mayer';

-- STEP 3: Now you can import your CSV data
-- Use Supabase dashboard or your preferred import method
-- Your CSV should NOT include last_modified_by column

-- STEP 4: After import, manually sync new records to mayer_stock
-- First, let's see what needs to be synced
SELECT COUNT(*) as new_records_to_sync
FROM jack_modules j
WHERE NOT EXISTS (
    SELECT 1 FROM mayer_stock m 
    WHERE m.part_number = j.part_number
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
    j.part_number,
    j.brand,
    j.short_description,
    'PENDING' as branch,
    UPPER(REPLACE(REPLACE(j.part_number, '-', ''), ' ', '')) as second_item_number,
    0 as qty_on_hand,
    0 as qty_on_order,
    'IMPORT' as last_modified_by,
    'IMPORT' as created_by,
    CURRENT_TIMESTAMP as created_at,
    CURRENT_TIMESTAMP as updated_at,
    true as is_active
FROM jack_modules j
WHERE NOT EXISTS (
    SELECT 1 FROM mayer_stock m 
    WHERE m.part_number = j.part_number
)
AND j.is_active = true;

-- STEP 5: Re-enable the trigger
ALTER TABLE jack_modules ENABLE TRIGGER sync_jack_modules_to_mayer;

-- Verify it's enabled again
SELECT 
    tgname AS trigger_name,
    CASE 
        WHEN tgenabled = 'O' THEN 'ENABLED'
        WHEN tgenabled = 'D' THEN 'DISABLED'
        ELSE 'UNKNOWN'
    END AS status
FROM pg_trigger
WHERE tgrelid = 'public.jack_modules'::regclass
    AND tgname = 'sync_jack_modules_to_mayer';

-- OPTIONAL: Check the results
SELECT 
    'jack_modules' as source_table,
    COUNT(*) as total_records
FROM jack_modules
WHERE is_active = true
UNION ALL
SELECT 
    'mayer_stock (jack products)' as source_table,
    COUNT(*) as total_records
FROM mayer_stock
WHERE part_number IN (SELECT part_number FROM jack_modules);

-- PERMANENT FIX OPTIONS:

-- Option A: Add missing columns to jack_modules table to match other tables
/*
ALTER TABLE jack_modules 
ADD COLUMN IF NOT EXISTS created_by VARCHAR(255) DEFAULT 'SYSTEM',
ADD COLUMN IF NOT EXISTS last_modified_by VARCHAR(255) DEFAULT 'SYSTEM';

-- Update existing records
UPDATE jack_modules 
SET created_by = 'SYSTEM', 
    last_modified_by = 'SYSTEM' 
WHERE created_by IS NULL;
*/

-- Option B: View the sync function to see what it expects
/*
SELECT pg_get_functiondef(oid) 
FROM pg_proc 
WHERE proname = 'sync_mayer_stock_product';
*/

-- Option C: Create a wrapper function for imports that handles missing fields
/*
CREATE OR REPLACE FUNCTION import_jack_modules_safe(
    p_part_number VARCHAR,
    p_brand VARCHAR,
    p_short_description TEXT,
    -- ... other fields ...
) RETURNS void AS $$
BEGIN
    -- Disable trigger
    ALTER TABLE jack_modules DISABLE TRIGGER sync_jack_modules_to_mayer;
    
    -- Insert data
    INSERT INTO jack_modules (part_number, brand, short_description, ...)
    VALUES (p_part_number, p_brand, p_short_description, ...);
    
    -- Manually sync with defaults
    INSERT INTO mayer_stock (part_number, brand, last_modified_by, created_by, ...)
    VALUES (p_part_number, p_brand, 'IMPORT', 'IMPORT', ...)
    ON CONFLICT (part_number, branch) DO NOTHING;
    
    -- Re-enable trigger
    ALTER TABLE jack_modules ENABLE TRIGGER sync_jack_modules_to_mayer;
END;
$$ LANGUAGE plpgsql;
*/

-- STEP 6: Update Dynacom Keystone jack modules to be compatible with both Keystone and NetKey
-- Created: June 18, 2025
-- This ensures Dynacom brand jacks with product_line 'Keystone' work with both Keystone and NetKey faceplates/SMBs

-- First, check how many Dynacom Keystone jacks we have
SELECT COUNT(*) as dynacom_keystone_jacks
FROM jack_modules
WHERE brand = 'Dynacom' 
AND product_line = 'Keystone'
AND is_active = true;

-- Update the compatible_faceplates field to include both Keystone and NetKey
UPDATE jack_modules
SET compatible_faceplates = ARRAY['Keystone', 'NetKey']::text[],
    updated_at = CURRENT_TIMESTAMP
WHERE brand = 'Dynacom' 
AND product_line = 'Keystone'
AND is_active = true;

-- Verify the update
SELECT 
    part_number,
    brand,
    product_line,
    compatible_faceplates
FROM jack_modules
WHERE brand = 'Dynacom' 
AND product_line = 'Keystone'
AND is_active = true
LIMIT 5;