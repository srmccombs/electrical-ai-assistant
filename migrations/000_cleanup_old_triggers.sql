-- Cleanup script to remove all old triggers before setting up new search system
-- Run this BEFORE the search setup migration

BEGIN;

-- =====================================================
-- STEP 1: Find and remove all old search-related triggers
-- =====================================================
SELECT 'Cleaning up old triggers and functions...' as status;

-- Drop all old search vector update triggers
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Find all triggers that might be search-related
    FOR r IN 
        SELECT DISTINCT 
            event_object_table as table_name,
            trigger_name
        FROM information_schema.triggers
        WHERE trigger_schema = 'public'
        AND (
            trigger_name LIKE '%search%'
            OR trigger_name LIKE '%vector%'
            OR action_statement LIKE '%search_variations%'
            OR action_statement LIKE '%computed_search_terms%'
        )
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS %I ON %I CASCADE', r.trigger_name, r.table_name);
        RAISE NOTICE 'Dropped trigger % on table %', r.trigger_name, r.table_name;
    END LOOP;
END $$;

-- Drop old search-related functions
DROP FUNCTION IF EXISTS update_fiber_connectors_search_vector() CASCADE;
DROP FUNCTION IF EXISTS update_cable_search_terms() CASCADE;
DROP FUNCTION IF EXISTS update_cable_search_vector() CASCADE;
DROP FUNCTION IF EXISTS build_cable_search_terms() CASCADE;
DROP FUNCTION IF EXISTS get_cable_search_terms(VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR, TEXT) CASCADE;
DROP FUNCTION IF EXISTS get_cable_search_terms(VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR, TEXT) CASCADE;

-- =====================================================
-- STEP 2: Clean up any table references
-- =====================================================

-- Fix any functions that reference old table names
DO $$
DECLARE
    func_rec RECORD;
BEGIN
    -- Find functions that might reference old tables
    FOR func_rec IN
        SELECT 
            proname as function_name,
            oid::regprocedure as function_signature
        FROM pg_proc
        WHERE prosrc LIKE '%search_variations%'
           OR prosrc LIKE '%mayer_stock%'
           OR prosrc LIKE '%category_cables%'
           OR prosrc LIKE '%fiber_connectors%'
    LOOP
        -- Log what we found
        RAISE NOTICE 'Found function % that may reference old tables', func_rec.function_name;
    END LOOP;
END $$;

-- =====================================================
-- STEP 3: Verify cleanup
-- =====================================================

-- Check remaining triggers
SELECT 'Remaining triggers after cleanup:' as status;
SELECT 
    event_object_table as table_name,
    COUNT(*) as trigger_count
FROM information_schema.triggers
WHERE trigger_schema = 'public'
GROUP BY event_object_table
ORDER BY table_name;

-- Check for any remaining references to old tables
SELECT 'Checking for old table references in functions...' as status;
SELECT 
    proname as function_name,
    'search_variations' as old_table_reference
FROM pg_proc
WHERE prosrc LIKE '%search_variations%'
UNION ALL
SELECT 
    proname as function_name,
    'mayer_stock' as old_table_reference
FROM pg_proc
WHERE prosrc LIKE '%mayer_stock%'
   AND prosrc NOT LIKE '%ops_mayer_stock%';

SELECT 'Cleanup complete! Safe to run search setup migration.' as status;

COMMIT;