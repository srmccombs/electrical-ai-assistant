-- Re-enable All Product Table Triggers After Bulk Loading
-- Run this AFTER all data imports are complete

-- CATEGORY CABLES
ALTER TABLE category_cables ENABLE TRIGGER ALL;

-- FIBER CABLES
ALTER TABLE fiber_cables ENABLE TRIGGER ALL;

-- FIBER CONNECTORS
ALTER TABLE fiber_connectors ENABLE TRIGGER ALL;

-- ADAPTER PANELS
ALTER TABLE adapter_panels ENABLE TRIGGER ALL;

-- RACK MOUNT FIBER ENCLOSURES
ALTER TABLE rack_mount_fiber_enclosures ENABLE TRIGGER ALL;

-- WALL MOUNT FIBER ENCLOSURES
ALTER TABLE wall_mount_fiber_enclosures ENABLE TRIGGER ALL;

-- JACK MODULES
ALTER TABLE jack_modules ENABLE TRIGGER ALL;

-- FACEPLATES
ALTER TABLE faceplates ENABLE TRIGGER ALL;

-- SURFACE MOUNT BOXES
ALTER TABLE surface_mount_box ENABLE TRIGGER ALL;

-- SYNC ALL TABLES TO MAYER_STOCK
-- This ensures mayer_stock is up to date after bulk loading

-- Category Cables
INSERT INTO mayer_stock (
    table_name, product_id, part_number, brand, 
    short_description, stocking_um, list_price, 
    my_cost, stock_local, stock_az, stock_direct, 
    last_modified, last_modified_by
)
SELECT 
    'category_cables', id, part_number, brand,
    short_description, stocking_um, list_price,
    my_cost, 0, 0, 0, 
    NOW(), 'bulk_import'
FROM category_cables
WHERE is_active = true
ON CONFLICT (table_name, product_id) 
DO UPDATE SET
    part_number = EXCLUDED.part_number,
    brand = EXCLUDED.brand,
    short_description = EXCLUDED.short_description,
    last_modified = NOW();

-- Fiber Cables
INSERT INTO mayer_stock (
    table_name, product_id, part_number, brand, 
    short_description, stocking_um, list_price, 
    my_cost, stock_local, stock_az, stock_direct, 
    last_modified, last_modified_by
)
SELECT 
    'fiber_cables', id, part_number, brand,
    short_description, stocking_um, list_price,
    my_cost, 0, 0, 0, 
    NOW(), 'bulk_import'
FROM fiber_cables
WHERE is_active = true
ON CONFLICT (table_name, product_id) 
DO UPDATE SET
    part_number = EXCLUDED.part_number,
    brand = EXCLUDED.brand,
    short_description = EXCLUDED.short_description,
    last_modified = NOW();

-- Continue pattern for all other tables...
-- (Truncated for brevity - follow same pattern for remaining tables)

-- VERIFY ALL TRIGGERS ARE RE-ENABLED
SELECT 
    schemaname,
    tablename,
    tgname AS trigger_name,
    CASE tgenabled 
        WHEN 'O' THEN 'ENABLED'
        WHEN 'D' THEN 'DISABLED'
        ELSE tgenabled::text
    END AS status
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
JOIN pg_tables pt ON pt.tablename = c.relname AND pt.schemaname = n.nspname
WHERE schemaname = 'public'
    AND tablename IN (
        'category_cables',
        'fiber_cables', 
        'fiber_connectors',
        'adapter_panels',
        'rack_mount_fiber_enclosures',
        'wall_mount_fiber_enclosures',
        'jack_modules',
        'faceplates',
        'surface_mount_box'
    )
ORDER BY tablename, trigger_name;