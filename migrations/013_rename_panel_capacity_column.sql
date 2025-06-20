-- Rename accepts_number_of_connector_housing_panels to panel_capacity
-- This makes the column name shorter and easier to work with

BEGIN;

-- ===================================
-- RENAME COLUMNS IN FIBER ENCLOSURES
-- ===================================

-- Rename in prod_wall_mount_fiber_enclosures
ALTER TABLE prod_wall_mount_fiber_enclosures 
RENAME COLUMN accepts_number_of_connector_housing_panels TO panel_capacity;

-- Rename in prod_rack_mount_fiber_enclosures
ALTER TABLE prod_rack_mount_fiber_enclosures 
RENAME COLUMN accepts_number_of_connector_housing_panels TO panel_capacity;

-- ===================================
-- VERIFY CHANGES
-- ===================================

-- Check column rename in wall mount
SELECT 
    'Wall mount enclosures columns:' as info,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_name = 'prod_wall_mount_fiber_enclosures'
AND column_name IN ('accepts_number_of_connector_housing_panels', 'panel_capacity')
ORDER BY column_name;

-- Check column rename in rack mount
SELECT 
    'Rack mount enclosures columns:' as info,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_name = 'prod_rack_mount_fiber_enclosures'
AND column_name IN ('accepts_number_of_connector_housing_panels', 'panel_capacity')
ORDER BY column_name;

-- Show sample data with new column name
SELECT 
    'Sample wall mount with panel_capacity:' as info,
    part_number,
    brand,
    panel_capacity,
    max_fiber_capacity
FROM prod_wall_mount_fiber_enclosures
LIMIT 3;

SELECT 
    'Sample rack mount with panel_capacity:' as info,
    part_number,
    brand,
    panel_capacity,
    max_fiber_capacity,
    rack_units
FROM prod_rack_mount_fiber_enclosures
LIMIT 3;

SELECT 'Column rename complete!' as status,
    'accepts_number_of_connector_housing_panels → panel_capacity' as change;

COMMIT;