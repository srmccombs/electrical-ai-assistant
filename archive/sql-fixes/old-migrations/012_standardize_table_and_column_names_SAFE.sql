-- Standardize table names and column names for consistency (SAFE VERSION)
-- 1. Rename enclosure tables to be more specific
-- 2. Change Shielding_Type to shielding_type in prod_category_cables (if it exists)

BEGIN;

-- ===================================
-- RENAME ENCLOSURE TABLES
-- ===================================

-- Check if tables exist before renaming
DO $$
BEGIN
    -- Rename prod_wall_mount_enclosures to prod_wall_mount_fiber_enclosures
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'prod_wall_mount_enclosures') THEN
        ALTER TABLE prod_wall_mount_enclosures RENAME TO prod_wall_mount_fiber_enclosures;
        RAISE NOTICE 'Renamed prod_wall_mount_enclosures to prod_wall_mount_fiber_enclosures';
    ELSE
        RAISE NOTICE 'Table prod_wall_mount_enclosures not found or already renamed';
    END IF;

    -- Rename prod_rack_mount_enclosures to prod_rack_mount_fiber_enclosures
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'prod_rack_mount_enclosures') THEN
        ALTER TABLE prod_rack_mount_enclosures RENAME TO prod_rack_mount_fiber_enclosures;
        RAISE NOTICE 'Renamed prod_rack_mount_enclosures to prod_rack_mount_fiber_enclosures';
    ELSE
        RAISE NOTICE 'Table prod_rack_mount_enclosures not found or already renamed';
    END IF;
END $$;

-- ===================================
-- CHECK COLUMN CASE SENSITIVITY
-- ===================================

-- First, let's see what shielding columns exist
SELECT 
    'Checking shielding columns in prod_category_cables:' as info,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_name = 'prod_category_cables'
AND lower(column_name) LIKE '%shielding%'
ORDER BY column_name;

-- ===================================
-- STANDARDIZE COLUMN NAME (SAFE)
-- ===================================

-- Only rename if the column exists with different case
DO $$
DECLARE
    col_exists boolean;
    col_name text;
BEGIN
    -- Check for any variation of shielding_type column
    SELECT column_name INTO col_name
    FROM information_schema.columns
    WHERE table_name = 'prod_category_cables'
    AND lower(column_name) = 'shielding_type'
    LIMIT 1;

    IF col_name IS NOT NULL AND col_name != 'shielding_type' THEN
        -- Column exists but with different case
        EXECUTE format('ALTER TABLE prod_category_cables RENAME COLUMN "%s" TO shielding_type', col_name);
        RAISE NOTICE 'Renamed column % to shielding_type', col_name;
    ELSIF col_name = 'shielding_type' THEN
        RAISE NOTICE 'Column shielding_type already exists with correct case';
    ELSE
        RAISE NOTICE 'No shielding_type column found in prod_category_cables';
    END IF;
END $$;

-- ===================================
-- VERIFY CHANGES
-- ===================================

-- Check table renames
SELECT 
    'Tables after rename:' as info,
    table_name
FROM information_schema.tables
WHERE table_name IN (
    'prod_wall_mount_fiber_enclosures',
    'prod_rack_mount_fiber_enclosures',
    'prod_wall_mount_enclosures',
    'prod_rack_mount_enclosures'
)
ORDER BY table_name;

-- Check column status
SELECT 
    'Shielding columns after standardization:' as info,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_name = 'prod_category_cables'
AND lower(column_name) LIKE '%shielding%';

-- Show all columns in prod_category_cables to verify
SELECT 
    'All columns in prod_category_cables:' as info,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_name = 'prod_category_cables'
ORDER BY ordinal_position
LIMIT 20;

SELECT 'Standardization complete (safe version)!' as status;

COMMIT;