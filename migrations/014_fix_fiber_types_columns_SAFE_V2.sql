-- Fix fiber_types columns in fiber tables (SAFE VERSION V2)
-- Handles trigger issues during column type conversion

BEGIN;

-- ===================================
-- DISABLE TRIGGERS TEMPORARILY
-- ===================================

-- Disable triggers on both tables during conversion
ALTER TABLE prod_fiber_connectors DISABLE TRIGGER update_search_terms;
ALTER TABLE prod_adapter_panels DISABLE TRIGGER update_search_terms;

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

-- ===================================
-- CONVERT FIBER_TYPES TO ARRAYS
-- ===================================

-- Handle prod_fiber_connectors
DO $$
DECLARE
    col_type text;
BEGIN
    -- Check if fiber_types is already an array
    SELECT udt_name INTO col_type
    FROM information_schema.columns
    WHERE table_name = 'prod_fiber_connectors'
    AND column_name = 'fiber_types';
    
    IF col_type != '_text' THEN
        RAISE NOTICE 'Converting prod_fiber_connectors.fiber_types to array';
        
        -- Add new array column
        ALTER TABLE prod_fiber_connectors ADD COLUMN fiber_types_new text[];
        
        -- Convert data
        UPDATE prod_fiber_connectors
        SET fiber_types_new = 
            CASE 
                WHEN fiber_types IS NULL THEN NULL
                WHEN fiber_types::text LIKE '{%}' THEN 
                    fiber_types::text[]  -- Already PostgreSQL array format
                WHEN fiber_types::text LIKE '[%]' THEN
                    string_to_array(
                        regexp_replace(
                            regexp_replace(fiber_types::text, '^\[|\]$', '', 'g'),
                            '"', '', 'g'
                        ),
                        ','
                    )::text[]
                ELSE 
                    ARRAY[fiber_types::text]::text[]
            END;
        
        -- Drop old column and rename new one
        ALTER TABLE prod_fiber_connectors DROP COLUMN fiber_types;
        ALTER TABLE prod_fiber_connectors RENAME COLUMN fiber_types_new TO fiber_types;
        
        RAISE NOTICE 'Conversion complete for prod_fiber_connectors';
    ELSE
        RAISE NOTICE 'prod_fiber_connectors.fiber_types is already an array';
    END IF;
END $$;

-- Handle prod_adapter_panels
DO $$
DECLARE
    col_type text;
BEGIN
    -- Check if fiber_types is already an array
    SELECT udt_name INTO col_type
    FROM information_schema.columns
    WHERE table_name = 'prod_adapter_panels'
    AND column_name = 'fiber_types';
    
    IF col_type != '_text' THEN
        RAISE NOTICE 'Converting prod_adapter_panels.fiber_types to array';
        
        -- Add new array column
        ALTER TABLE prod_adapter_panels ADD COLUMN fiber_types_new text[];
        
        -- Convert data, handling double-nested arrays
        UPDATE prod_adapter_panels
        SET fiber_types_new = 
            CASE 
                WHEN fiber_types IS NULL THEN NULL
                WHEN fiber_types::text LIKE '{%}' THEN 
                    fiber_types::text[]  -- Already PostgreSQL array format
                -- Handle double-nested array ["[OM1]"]
                WHEN fiber_types::text LIKE '%"[%' THEN
                    string_to_array(
                        regexp_replace(
                            regexp_replace(
                                regexp_replace(fiber_types::text, '^\["\[|\]"\]$', '', 'g'),
                                '[\[\]]', '', 'g'
                            ),
                            '"', '', 'g'
                        ),
                        ','
                    )::text[]
                -- Handle regular JSON array ["OM1"]
                WHEN fiber_types::text LIKE '[%]' THEN
                    string_to_array(
                        regexp_replace(
                            regexp_replace(fiber_types::text, '^\[|\]$', '', 'g'),
                            '"', '', 'g'
                        ),
                        ','
                    )::text[]
                ELSE 
                    ARRAY[fiber_types::text]::text[]
            END;
        
        -- Drop old column and rename new one
        ALTER TABLE prod_adapter_panels DROP COLUMN fiber_types;
        ALTER TABLE prod_adapter_panels RENAME COLUMN fiber_types_new TO fiber_types;
        
        RAISE NOTICE 'Conversion complete for prod_adapter_panels';
    ELSE
        RAISE NOTICE 'prod_adapter_panels.fiber_types is already an array';
    END IF;
END $$;

-- ===================================
-- RE-ENABLE TRIGGERS
-- ===================================

ALTER TABLE prod_fiber_connectors ENABLE TRIGGER update_search_terms;
ALTER TABLE prod_adapter_panels ENABLE TRIGGER update_search_terms;

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

-- Show sample data
SELECT 
    'Sample prod_fiber_connectors:' as info;
    
SELECT 
    part_number,
    fiber_types,
    array_length(fiber_types, 1) as array_length
FROM prod_fiber_connectors
WHERE fiber_types IS NOT NULL
LIMIT 5;

SELECT 
    'Sample prod_adapter_panels:' as info;
    
SELECT 
    part_number,
    fiber_types,
    array_length(fiber_types, 1) as array_length
FROM prod_adapter_panels
WHERE fiber_types IS NOT NULL
LIMIT 5;

-- ===================================
-- CREATE INDEXES
-- ===================================

-- Create GIN indexes for array searches
CREATE INDEX IF NOT EXISTS idx_fiber_connectors_fiber_types 
ON prod_fiber_connectors USING GIN (fiber_types);

CREATE INDEX IF NOT EXISTS idx_adapter_panels_fiber_types 
ON prod_adapter_panels USING GIN (fiber_types);

-- ===================================
-- UPDATE SEARCH TERMS
-- ===================================

-- Update search terms now that triggers are re-enabled
UPDATE prod_fiber_connectors
SET computed_search_terms = computed_search_terms
WHERE fiber_types IS NOT NULL;

UPDATE prod_adapter_panels
SET computed_search_terms = computed_search_terms
WHERE fiber_types IS NOT NULL;

SELECT 'Fiber types conversion complete!' as status,
    'Both tables now have proper array columns' as result;

COMMIT;