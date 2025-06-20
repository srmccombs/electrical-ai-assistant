-- CORRECTED STEP 3: SYNC TO MAYER_STOCK
-- Run this after your CSV import is complete

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
    j.part_number,
    j.brand,
    j.short_description,
    'PENDING',
    UPPER(REPLACE(REPLACE(j.part_number, '-', ''), ' ', '')),
    0,
    0,
    'IMPORT',
    'IMPORT',
    true
FROM jack_modules j
WHERE NOT EXISTS (
    SELECT 1 FROM mayer_stock m 
    WHERE m.part_number = j.part_number
);