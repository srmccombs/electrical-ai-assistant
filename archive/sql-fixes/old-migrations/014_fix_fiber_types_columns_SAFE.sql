-- Fix fiber_types columns in fiber tables (SAFE VERSION)
-- 1. prod_fiber_connectors - Check if it's actually an array
-- 2. prod_adapter_panels - Fix double-nested array issue

BEGIN;

-- ===================================
-- CHECK CURRENT STATE
-- ===================================

-- Check fiber_types data types in both tables
SELECT 
    'Checking fiber_types data types:' as info;

SELECT 
    table_name,
    column_name,
    data_type,
    udt_name
FROM information_schema.columns
WHERE table_name IN ('prod_fiber_connectors', 'prod_adapter_panels')
AND column_name = 'fiber_types'
ORDER BY table_name;

-- Show sample data to understand the actual format
SELECT 
    'Sample prod_fiber_connectors fiber_types:' as info,
    part_number,
    fiber_types,
    pg_typeof(fiber_types) as actual_type
FROM prod_fiber_connectors
WHERE fiber_types IS NOT NULL
LIMIT 5;

SELECT 
    'Sample prod_adapter_panels fiber_types:' as info,
    part_number,
    fiber_types,
    pg_typeof(fiber_types) as actual_type
FROM prod_adapter_panels
WHERE fiber_types IS NOT NULL
LIMIT 5;

-- ===================================
-- FIX DATA ISSUES (if columns are text/varchar)
-- ===================================

-- Check if fiber_types columns need to be converted to arrays
DO $$
DECLARE
    connector_type text;
    panel_type text;
BEGIN
    -- Get the actual data type for fiber_connectors
    SELECT data_type INTO connector_type
    FROM information_schema.columns
    WHERE table_name = 'prod_fiber_connectors'
    AND column_name = 'fiber_types';
    
    -- Get the actual data type for adapter_panels
    SELECT data_type INTO panel_type
    FROM information_schema.columns
    WHERE table_name = 'prod_adapter_panels'
    AND column_name = 'fiber_types';
    
    RAISE NOTICE 'prod_fiber_connectors.fiber_types type: %', connector_type;
    RAISE NOTICE 'prod_adapter_panels.fiber_types type: %', panel_type;
    
    -- If fiber_types is varchar/text (not array), we need to convert it
    IF connector_type IN ('character varying', 'text') THEN
        RAISE NOTICE 'Converting prod_fiber_connectors.fiber_types to array';
        
        -- Add temporary column
        ALTER TABLE prod_fiber_connectors ADD COLUMN fiber_types_array text[];
        
        -- Convert string representation to array
        UPDATE prod_fiber_connectors
        SET fiber_types_array = 
            CASE 
                WHEN fiber_types LIKE '[%]' THEN
                    string_to_array(
                        regexp_replace(
                            regexp_replace(fiber_types, '^\[|\]$', '', 'g'),
                            '"', '', 'g'
                        ),
                        ','
                    )::text[]
                WHEN fiber_types IS NOT NULL THEN
                    ARRAY[fiber_types]::text[]
                ELSE NULL
            END;
            
        -- Drop old column and rename new one
        ALTER TABLE prod_fiber_connectors DROP COLUMN fiber_types;
        ALTER TABLE prod_fiber_connectors RENAME COLUMN fiber_types_array TO fiber_types;
    END IF;
    
    -- Same for adapter_panels
    IF panel_type IN ('character varying', 'text') THEN
        RAISE NOTICE 'Converting prod_adapter_panels.fiber_types to array';
        
        -- Add temporary column
        ALTER TABLE prod_adapter_panels ADD COLUMN fiber_types_array text[];
        
        -- Convert string representation to array, handling double-nested arrays
        UPDATE prod_adapter_panels
        SET fiber_types_array = 
            CASE 
                -- Handle double-nested array ["[OM1]"]
                WHEN fiber_types LIKE '%"[%' THEN
                    string_to_array(
                        regexp_replace(
                            regexp_replace(
                                regexp_replace(fiber_types, '^\["\[|\]"\]$', '', 'g'),
                                '[\[\]]', '', 'g'
                            ),
                            '"', '', 'g'
                        ),
                        ','
                    )::text[]
                -- Handle regular array [OM1]
                WHEN fiber_types LIKE '[%]' THEN
                    string_to_array(
                        regexp_replace(
                            regexp_replace(fiber_types, '^\[|\]$', '', 'g'),
                            '"', '', 'g'
                        ),
                        ','
                    )::text[]
                WHEN fiber_types IS NOT NULL THEN
                    ARRAY[fiber_types]::text[]
                ELSE NULL
            END;
            
        -- Drop old column and rename new one
        ALTER TABLE prod_adapter_panels DROP COLUMN fiber_types;
        ALTER TABLE prod_adapter_panels RENAME COLUMN fiber_types_array TO fiber_types;
    END IF;
END $$;

-- ===================================
-- VERIFY THE CHANGES
-- ===================================

-- Check data types after conversion
SELECT 
    'Data types after conversion:' as info;

SELECT 
    table_name,
    column_name,
    data_type,
    udt_name
FROM information_schema.columns
WHERE table_name IN ('prod_fiber_connectors', 'prod_adapter_panels')
AND column_name = 'fiber_types'
ORDER BY table_name;

-- Show sample data after conversion
SELECT 
    'Sample fiber_types after conversion:' as info;

SELECT 
    'prod_fiber_connectors' as table_name,
    part_number,
    fiber_types::text as fiber_types_display,
    array_length(fiber_types, 1) as array_length
FROM prod_fiber_connectors
WHERE fiber_types IS NOT NULL
LIMIT 5;

SELECT 
    'prod_adapter_panels' as table_name,
    part_number,
    fiber_types::text as fiber_types_display,
    array_length(fiber_types, 1) as array_length
FROM prod_adapter_panels
WHERE fiber_types IS NOT NULL
LIMIT 5;

-- ===================================
-- CREATE INDEXES (only if columns are arrays)
-- ===================================

-- Only create GIN indexes if the columns are actually arrays
DO $$
DECLARE
    connector_type text;
    panel_type text;
BEGIN
    -- Check final data types
    SELECT udt_name INTO connector_type
    FROM information_schema.columns
    WHERE table_name = 'prod_fiber_connectors'
    AND column_name = 'fiber_types';
    
    SELECT udt_name INTO panel_type
    FROM information_schema.columns
    WHERE table_name = 'prod_adapter_panels'
    AND column_name = 'fiber_types';
    
    -- Create indexes only if they're arrays
    IF connector_type = '_text' THEN
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_fiber_connectors_fiber_types 
                 ON prod_fiber_connectors USING GIN (fiber_types)';
        RAISE NOTICE 'Created GIN index on prod_fiber_connectors.fiber_types';
    ELSE
        RAISE NOTICE 'Skipping GIN index on prod_fiber_connectors.fiber_types (not an array)';
    END IF;
    
    IF panel_type = '_text' THEN
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_adapter_panels_fiber_types 
                 ON prod_adapter_panels USING GIN (fiber_types)';
        RAISE NOTICE 'Created GIN index on prod_adapter_panels.fiber_types';
    ELSE
        RAISE NOTICE 'Skipping GIN index on prod_adapter_panels.fiber_types (not an array)';
    END IF;
END $$;

-- ===================================
-- UPDATE SEARCH TERMS
-- ===================================

-- Force update of computed search terms
UPDATE prod_fiber_connectors
SET updated_at = CURRENT_TIMESTAMP
WHERE fiber_types IS NOT NULL;

UPDATE prod_adapter_panels
SET updated_at = CURRENT_TIMESTAMP
WHERE fiber_types IS NOT NULL;

SELECT 'Fiber types standardization complete!' as status,
    'Check the output above to see what was done' as result;

COMMIT;