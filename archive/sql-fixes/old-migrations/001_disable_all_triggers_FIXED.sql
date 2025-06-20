-- Disable ALL triggers temporarily for migration (FIXED VERSION)
-- Run this to prevent any trigger conflicts during setup

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
-- STEP 2: Save all current triggers before disabling
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
  AND NOT t.tgisinternal
  AND c.relkind = 'r'  -- Only tables
ON CONFLICT DO NOTHING;

-- =====================================================
-- STEP 3: Disable ALL triggers on all tables
-- =====================================================
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Disable triggers on all tables
    FOR r IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('ALTER TABLE %I DISABLE TRIGGER ALL', r.tablename);
        RAISE NOTICE 'Disabled all triggers on table %', r.tablename;
    END LOOP;
END $$;

-- =====================================================
-- STEP 4: Drop the problematic mayer_stock function
-- =====================================================
DROP FUNCTION IF EXISTS sync_mayer_stock_product() CASCADE;

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
('IMPORTANT', 'All triggers have been disabled as of ' || CURRENT_TIMESTAMP),
('TODO', 'Re-enable triggers after migration using: SELECT * FROM disabled_triggers_backup'),
('TODO', 'Recreate sync_mayer_stock_product() function to use ops_mayer_stock table'),
('INFO', 'Mayer stock sync is disabled - not needed for 1 month'),
('WARNING', 'Search triggers will be recreated by the migration - do not restore old ones');

-- =====================================================
-- STEP 6: Show status
-- =====================================================
SELECT 'All triggers disabled!' as status;

SELECT 'Migration notes:' as section;
SELECT note_type, note_text FROM migration_notes ORDER BY id;

SELECT 'Backed up triggers:' as section;
SELECT table_name, COUNT(*) as trigger_count 
FROM disabled_triggers_backup 
GROUP BY table_name
ORDER BY table_name;

-- Show total triggers disabled
SELECT 'Total triggers disabled: ' || COUNT(*) as summary
FROM disabled_triggers_backup;

COMMIT;

-- =====================================================
-- INSTRUCTIONS TO RE-ENABLE TRIGGERS LATER:
-- =====================================================
-- After migration is complete, run this query to see what needs to be restored:
-- SELECT * FROM disabled_triggers_backup WHERE trigger_name NOT LIKE '%search%';
-- 
-- To re-enable all triggers on a specific table:
-- ALTER TABLE table_name ENABLE TRIGGER ALL;