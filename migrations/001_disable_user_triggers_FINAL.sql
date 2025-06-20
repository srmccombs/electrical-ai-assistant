-- Disable only USER triggers (not system triggers) for migration
-- This version properly handles system triggers that can't be disabled

BEGIN;

-- =====================================================
-- STEP 1: Create a backup table of all triggers
-- =====================================================
CREATE TABLE IF NOT EXISTS disabled_triggers_backup (
    id SERIAL PRIMARY KEY,
    table_name TEXT,
    trigger_name TEXT,
    trigger_definition TEXT,
    disabled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- STEP 2: Save all USER triggers before disabling
-- =====================================================
INSERT INTO disabled_triggers_backup (table_name, trigger_name, trigger_definition)
SELECT 
    c.relname as table_name,
    t.tgname as trigger_name,
    pg_get_triggerdef(t.oid) as trigger_definition
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'public'
  AND NOT t.tgisinternal  -- Exclude system triggers
  AND c.relkind = 'r'     -- Only tables
  AND t.tgname NOT LIKE 'RI_ConstraintTrigger%'  -- Exclude FK triggers
ON CONFLICT DO NOTHING;

-- =====================================================
-- STEP 3: Disable only USER triggers
-- =====================================================
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Disable specific user triggers, not ALL
    FOR r IN 
        SELECT DISTINCT
            c.relname as table_name,
            t.tgname as trigger_name
        FROM pg_trigger t
        JOIN pg_class c ON t.tgrelid = c.oid
        JOIN pg_namespace n ON c.relnamespace = n.oid
        WHERE n.nspname = 'public'
          AND NOT t.tgisinternal
          AND c.relkind = 'r'
          AND t.tgname NOT LIKE 'RI_ConstraintTrigger%'
    LOOP
        BEGIN
            EXECUTE format('ALTER TABLE %I DISABLE TRIGGER %I', r.table_name, r.trigger_name);
            RAISE NOTICE 'Disabled trigger % on table %', r.trigger_name, r.table_name;
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE 'Could not disable trigger % on table %: %', r.trigger_name, r.table_name, SQLERRM;
        END;
    END LOOP;
END $$;

-- =====================================================
-- STEP 4: Drop problematic functions
-- =====================================================
-- Drop the mayer stock sync function
DROP FUNCTION IF EXISTS sync_mayer_stock_product() CASCADE;

-- Drop any other functions that might cause issues
DROP FUNCTION IF EXISTS update_fiber_connectors_search_vector() CASCADE;

-- =====================================================
-- STEP 5: Create migration notes table
-- =====================================================
CREATE TABLE IF NOT EXISTS migration_notes (
    id SERIAL PRIMARY KEY,
    note_type VARCHAR(50),
    note_text TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Clear old notes and add new ones
TRUNCATE TABLE migration_notes;

INSERT INTO migration_notes (note_type, note_text) VALUES
('IMPORTANT', 'All USER triggers have been disabled as of ' || CURRENT_TIMESTAMP),
('INFO', 'System triggers (foreign keys) remain active - this is good!'),
('TODO', 'Re-enable triggers after migration using: SELECT * FROM disabled_triggers_backup'),
('TODO', 'Recreate sync_mayer_stock_product() function to use ops_mayer_stock table'),
('INFO', 'Mayer stock sync is disabled - not needed for 1 month'),
('WARNING', 'Search triggers will be recreated by the migration - do not restore old ones');

-- =====================================================
-- STEP 6: Show what was disabled
-- =====================================================
SELECT 'User triggers disabled successfully!' as status;

-- Show which triggers were disabled
SELECT 
    table_name,
    COUNT(*) as disabled_trigger_count
FROM disabled_triggers_backup
GROUP BY table_name
ORDER BY table_name;

-- Show remaining active triggers (should be system triggers only)
SELECT 'Remaining active triggers (system triggers):' as info;
SELECT 
    c.relname as table_name,
    COUNT(*) as active_system_triggers
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'public'
  AND t.tgenabled = 'O'  -- O = enabled
  AND (t.tgisinternal OR t.tgname LIKE 'RI_ConstraintTrigger%')
GROUP BY c.relname
ORDER BY c.relname;

COMMIT;

-- =====================================================
-- HOW TO RE-ENABLE TRIGGERS LATER:
-- =====================================================
-- To see all disabled triggers:
-- SELECT * FROM disabled_triggers_backup;
--
-- To re-enable a specific trigger:
-- ALTER TABLE table_name ENABLE TRIGGER trigger_name;
--
-- To re-enable all user triggers on a table:
-- SELECT format('ALTER TABLE %I ENABLE TRIGGER %I;', table_name, trigger_name)
-- FROM disabled_triggers_backup
-- WHERE table_name = 'your_table_name';