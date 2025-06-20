-- QUICK FIX FOR FACEPLATES IMPORT
-- Run these commands in order in your Supabase SQL editor

-- 1. DISABLE THE PROBLEMATIC TRIGGER
ALTER TABLE faceplates DISABLE TRIGGER sync_faceplates_to_mayer;

-- 2. NOW IMPORT YOUR CSV FILE
-- Use Supabase Table Editor > faceplates > Import CSV
-- Make sure your CSV does NOT have last_modified_by or created_by columns

-- 3. AFTER IMPORT IS COMPLETE, RUN THIS TO SYNC TO MAYER_STOCK
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
    is_active
)
SELECT 
    f.part_number,
    f.brand,
    f.short_description,
    'PENDING',
    UPPER(REPLACE(REPLACE(f.part_number, '-', ''), ' ', '')),
    0,
    0,
    'IMPORT',
    'IMPORT',
    true
FROM faceplates f
WHERE NOT EXISTS (
    SELECT 1 FROM mayer_stock m 
    WHERE m.part_number = f.part_number
);

-- 4. RE-ENABLE THE TRIGGER
ALTER TABLE faceplates ENABLE TRIGGER sync_faceplates_to_mayer;

-- 5. VERIFY IMPORT SUCCESS
SELECT COUNT(*) as total_faceplates FROM faceplates;