-- Fix for modular_plugs import issue
-- Problem: sync_modular_plugs_to_mayer trigger expects fields that may not exist in modular_plugs table
-- Created: June 18, 2025

-- STEP 1: Check current trigger status
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'modular_plugs'
    AND trigger_schema = 'public';

-- STEP 2: Temporarily disable the mayer_stock sync trigger
ALTER TABLE modular_plugs DISABLE TRIGGER sync_modular_plugs_to_mayer;

-- Verify it's disabled
SELECT 
    tgname AS trigger_name,
    CASE 
        WHEN tgenabled = 'O' THEN 'ENABLED'
        WHEN tgenabled = 'D' THEN 'DISABLED'
        ELSE 'UNKNOWN'
    END AS status
FROM pg_trigger
WHERE tgrelid = 'public.modular_plugs'::regclass
    AND tgname = 'sync_modular_plugs_to_mayer';

-- STEP 3: Now you can import your CSV data
-- Use Supabase dashboard or your preferred import method
-- Your CSV should NOT include last_modified_by or created_by columns

-- STEP 4: After import, manually sync new records to mayer_stock
-- First, let's see what needs to be synced
SELECT COUNT(*) as new_records_to_sync
FROM modular_plugs m
WHERE NOT EXISTS (
    SELECT 1 FROM mayer_stock ms 
    WHERE ms.part_number = m.part_number
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
    m.part_number,
    m.brand,
    m.short_description,
    'PENDING' as branch,
    UPPER(REPLACE(REPLACE(m.part_number, '-', ''), ' ', '')) as second_item_number,
    0 as qty_on_hand,
    0 as qty_on_order,
    'IMPORT' as last_modified_by,
    'IMPORT' as created_by,
    CURRENT_TIMESTAMP as created_at,
    CURRENT_TIMESTAMP as updated_at,
    true as is_active
FROM modular_plugs m
WHERE NOT EXISTS (
    SELECT 1 FROM mayer_stock ms 
    WHERE ms.part_number = m.part_number
)
AND m.is_active = true;

-- STEP 5: Re-enable the trigger
ALTER TABLE modular_plugs ENABLE TRIGGER sync_modular_plugs_to_mayer;

-- Verify it's enabled again
SELECT 
    tgname AS trigger_name,
    CASE 
        WHEN tgenabled = 'O' THEN 'ENABLED'
        WHEN tgenabled = 'D' THEN 'DISABLED'
        ELSE 'UNKNOWN'
    END AS status
FROM pg_trigger
WHERE tgrelid = 'public.modular_plugs'::regclass
    AND tgname = 'sync_modular_plugs_to_mayer';

-- OPTIONAL: Check the results
SELECT 
    'modular_plugs' as source_table,
    COUNT(*) as total_records
FROM modular_plugs
WHERE is_active = true
UNION ALL
SELECT 
    'mayer_stock (modular plug products)' as source_table,
    COUNT(*) as total_records
FROM mayer_stock
WHERE part_number IN (SELECT part_number FROM modular_plugs);

-- QUICK REFERENCE CHECKLIST:
-- 1. Run: ALTER TABLE modular_plugs DISABLE TRIGGER sync_modular_plugs_to_mayer;
-- 2. Import your CSV file through Supabase Table Editor
-- 3. Run the INSERT INTO mayer_stock... query above
-- 4. Run: ALTER TABLE modular_plugs ENABLE TRIGGER sync_modular_plugs_to_mayer;
-- 5. Verify with the count queries