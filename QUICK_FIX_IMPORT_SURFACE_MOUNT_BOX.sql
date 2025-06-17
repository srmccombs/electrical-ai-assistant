-- QUICK FIX FOR SURFACE_MOUNT_BOX IMPORT
-- Run these commands in order in your Supabase SQL editor

-- 1. DISABLE THE PROBLEMATIC TRIGGER
ALTER TABLE surface_mount_box DISABLE TRIGGER sync_surface_mount_to_mayer;

-- 2. NOW IMPORT YOUR CSV FILE
-- Use Supabase Table Editor > surface_mount_box > Import CSV
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
    created_at,
    updated_at,
    is_active
)
SELECT 
    s.part_number,
    s.brand,
    s.short_description,
    'PENDING',
    UPPER(REPLACE(REPLACE(s.part_number, '-', ''), ' ', '')),
    0,
    0,
    'IMPORT',
    'IMPORT',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    true
FROM surface_mount_box s
WHERE NOT EXISTS (
    SELECT 1 FROM mayer_stock m 
    WHERE m.part_number = s.part_number
);

-- 4. RE-ENABLE THE TRIGGER
ALTER TABLE surface_mount_box ENABLE TRIGGER sync_surface_mount_to_mayer;

-- 5. VERIFY IMPORT SUCCESS
SELECT COUNT(*) as total_surface_mount_boxes FROM surface_mount_box;