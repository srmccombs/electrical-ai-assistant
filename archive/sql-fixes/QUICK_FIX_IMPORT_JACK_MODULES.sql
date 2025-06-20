-- QUICK FIX FOR JACK_MODULES IMPORT
-- Run these commands in order in your Supabase SQL editor

-- 1. DISABLE THE PROBLEMATIC TRIGGER
ALTER TABLE jack_modules DISABLE TRIGGER sync_jack_modules_to_mayer;

-- 2. NOW IMPORT YOUR CSV FILE
-- Use Supabase Table Editor > jack_modules > Import CSV
-- Make sure your CSV does NOT have a last_modified_by column

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
    created_at,
    updated_at,
    is_active
)
SELECT 
    j.part_number,
    j.brand,
    j.short_description,
    'PENDING',
    UPPER(REPLACE(REPLACE(j.part_number, '-', ''), ' ', '')),
    0,
    0,
    'IMPORT',
    'IMPORT',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    true
FROM jack_modules j
WHERE NOT EXISTS (
    SELECT 1 FROM mayer_stock m 
    WHERE m.part_number = j.part_number
);

-- 4. RE-ENABLE THE TRIGGER
ALTER TABLE jack_modules ENABLE TRIGGER sync_jack_modules_to_mayer;

-- 5. VERIFY IMPORT SUCCESS
SELECT COUNT(*) as total_jack_modules FROM jack_modules;