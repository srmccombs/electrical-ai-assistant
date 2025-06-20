-- Standardize table names and column names for consistency
-- 1. Rename enclosure tables to be more specific
-- 2. Change Shielding_Type to shielding_type in prod_category_cables

BEGIN;

-- ===================================
-- RENAME ENCLOSURE TABLES
-- ===================================

-- Rename prod_wall_mount_enclosures to prod_wall_mount_fiber_enclosures
ALTER TABLE IF EXISTS prod_wall_mount_enclosures 
RENAME TO prod_wall_mount_fiber_enclosures;

-- Rename prod_rack_mount_enclosures to prod_rack_mount_fiber_enclosures
ALTER TABLE IF EXISTS prod_rack_mount_enclosures 
RENAME TO prod_rack_mount_fiber_enclosures;

-- Update any indexes
ALTER INDEX IF EXISTS prod_wall_mount_enclosures_pkey 
RENAME TO prod_wall_mount_fiber_enclosures_pkey;

ALTER INDEX IF EXISTS prod_rack_mount_enclosures_pkey 
RENAME TO prod_rack_mount_fiber_enclosures_pkey;

-- Update search vector indexes if they exist
ALTER INDEX IF EXISTS idx_wall_mount_enclosures_search_vector 
RENAME TO idx_wall_mount_fiber_enclosures_search_vector;

ALTER INDEX IF EXISTS idx_rack_mount_enclosures_search_vector 
RENAME TO idx_rack_mount_fiber_enclosures_search_vector;

-- ===================================
-- STANDARDIZE COLUMN NAMES
-- ===================================

-- Rename Shielding_Type to shielding_type in prod_category_cables
ALTER TABLE prod_category_cables 
RENAME COLUMN "Shielding_Type" TO shielding_type;

-- ===================================
-- VERIFY CHANGES
-- ===================================

-- Check table renames
SELECT 
    'Table rename verification:' as info,
    table_name
FROM information_schema.tables
WHERE table_name IN (
    'prod_wall_mount_fiber_enclosures',
    'prod_rack_mount_fiber_enclosures',
    'prod_wall_mount_enclosures',
    'prod_rack_mount_enclosures'
)
ORDER BY table_name;

-- Check column rename
SELECT 
    'Column rename verification:' as info,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_name = 'prod_category_cables'
AND column_name IN ('Shielding_Type', 'shielding_type');

-- Show standardized shielding_type across all tables
SELECT 
    'Shielding type columns across tables:' as info,
    table_name,
    column_name
FROM information_schema.columns
WHERE column_name LIKE '%shielding%'
AND table_name LIKE 'prod_%'
ORDER BY table_name;

SELECT 'Standardization complete!' as status,
    'Tables renamed: prod_wall_mount_fiber_enclosures, prod_rack_mount_fiber_enclosures' as tables,
    'Column renamed: shielding_type (lowercase) in prod_category_cables' as columns;

COMMIT;