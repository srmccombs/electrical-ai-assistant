-- Disable Only Sync Triggers (Keep Performance Triggers)
-- For bulk operations on product tables
-- Created: June 18, 2025

-- ============================================
-- DISABLE SYNC TRIGGERS FOR ALL PRODUCT TABLES
-- ============================================

-- Find and disable all sync_*_to_mayer triggers
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Find all triggers that match pattern 'sync_%_to_mayer'
    FOR r IN 
        SELECT 
            n.nspname AS schema_name,
            c.relname AS table_name,
            t.tgname AS trigger_name
        FROM pg_trigger t
        JOIN pg_class c ON c.oid = t.tgrelid
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public'
          AND t.tgname LIKE 'sync_%_to_mayer%'
          AND NOT t.tgisinternal
    LOOP
        EXECUTE format('ALTER TABLE %I.%I DISABLE TRIGGER %I',
            r.schema_name, r.table_name, r.trigger_name);
        RAISE NOTICE 'Disabled trigger % on table %', r.trigger_name, r.table_name;
    END LOOP;
END $$;

-- List all disabled triggers for verification
SELECT 
    c.relname AS table_name,
    t.tgname AS trigger_name,
    CASE 
        WHEN t.tgenabled = 'O' THEN 'ENABLED'
        WHEN t.tgenabled = 'D' THEN 'DISABLED'
        ELSE 'OTHER'
    END AS status
FROM pg_trigger t
JOIN pg_class c ON c.oid = t.tgrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND t.tgname LIKE 'sync_%_to_mayer%'
  AND NOT t.tgisinternal
ORDER BY c.relname, t.tgname;

-- ============================================
-- RE-ENABLE SYNC TRIGGERS (Run this after bulk operations)
-- ============================================
-- Save this for later use:
/*
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT 
            n.nspname AS schema_name,
            c.relname AS table_name,
            t.tgname AS trigger_name
        FROM pg_trigger t
        JOIN pg_class c ON c.oid = t.tgrelid
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public'
          AND t.tgname LIKE 'sync_%_to_mayer%'
          AND NOT t.tgisinternal
    LOOP
        EXECUTE format('ALTER TABLE %I.%I ENABLE TRIGGER %I',
            r.schema_name, r.table_name, r.trigger_name);
        RAISE NOTICE 'Enabled trigger % on table %', r.trigger_name, r.table_name;
    END LOOP;
END $$;
*/