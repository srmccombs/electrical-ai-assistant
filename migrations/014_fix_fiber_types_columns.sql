-- Fix fiber_types columns in fiber tables
-- 1. prod_fiber_connectors - Already correct (fiber_types as array)
-- 2. prod_adapter_panels - Fix double-nested array issue

BEGIN;

-- ===================================
-- CHECK CURRENT STATE
-- ===================================

-- Check fiber_types in both tables
SELECT 
    'Current fiber_types columns:' as info;

SELECT 
    'prod_fiber_connectors' as table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_name = 'prod_fiber_connectors'
AND column_name = 'fiber_types'

UNION ALL

SELECT 
    'prod_adapter_panels' as table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_name = 'prod_adapter_panels'
AND column_name = 'fiber_types';

-- Show sample data to see the issue
SELECT 
    'Sample prod_fiber_connectors fiber_types:' as info,
    part_number,
    fiber_types,
    pg_typeof(fiber_types) as data_type
FROM prod_fiber_connectors
LIMIT 5;

SELECT 
    'Sample prod_adapter_panels fiber_types (BEFORE fix):' as info,
    part_number,
    fiber_types,
    pg_typeof(fiber_types) as data_type
FROM prod_adapter_panels
LIMIT 5;

-- ===================================
-- FIX DOUBLE-NESTED ARRAYS IN ADAPTER PANELS
-- ===================================

-- Fix the double-nested array issue in prod_adapter_panels
-- The data shows ["[OM1]"] when it should be ["OM1"]
UPDATE prod_adapter_panels
SET fiber_types = 
    CASE 
        -- Handle the double-nested array case
        WHEN fiber_types::text LIKE '%"[%' THEN
            -- Extract the inner array values
            string_to_array(
                regexp_replace(
                    regexp_replace(
                        fiber_types::text,
                        '^\["\[|\]"\]$', '', 'g'  -- Remove outer ["[ and ]"]
                    ),
                    '[\[\]]', '', 'g'  -- Remove remaining brackets
                ),
                ','
            )::text[]
        -- Already correct format
        WHEN fiber_types IS NOT NULL THEN
            fiber_types
        ELSE
            NULL
    END
WHERE fiber_types::text LIKE '%"[%';  -- Only update the problematic ones

-- ===================================
-- VERIFY THE FIX
-- ===================================

-- Show sample data after fix
SELECT 
    'Sample prod_adapter_panels fiber_types (AFTER fix):' as info,
    part_number,
    fiber_types,
    array_length(fiber_types, 1) as array_length
FROM prod_adapter_panels
WHERE fiber_types IS NOT NULL
LIMIT 10;

-- Check for any remaining double-nested arrays
SELECT 
    'Remaining double-nested arrays:' as info,
    COUNT(*) as count
FROM prod_adapter_panels
WHERE fiber_types::text LIKE '%"[%';

-- ===================================
-- CREATE/UPDATE INDEXES
-- ===================================

-- Create GIN indexes for array searches if they don't exist
CREATE INDEX IF NOT EXISTS idx_fiber_connectors_fiber_types 
ON prod_fiber_connectors USING GIN (fiber_types);

CREATE INDEX IF NOT EXISTS idx_adapter_panels_fiber_types 
ON prod_adapter_panels USING GIN (fiber_types);

-- ===================================
-- UPDATE SEARCH TERMS
-- ===================================

-- Force update of computed search terms for adapter panels
-- since we changed the fiber_types data
UPDATE prod_adapter_panels
SET updated_at = CURRENT_TIMESTAMP
WHERE fiber_types IS NOT NULL;

SELECT 'Fiber types standardization complete!' as status,
    'Both tables now have consistent fiber_types arrays' as result;

COMMIT;