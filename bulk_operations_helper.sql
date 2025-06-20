-- Bulk Operations Helper for Product Tables
-- Use this when adding many product tables or doing bulk updates
-- Created: June 18, 2025

-- ============================================
-- STEP 1: DISABLE ONLY SYNC TRIGGERS
-- ============================================
-- This keeps your performance optimization triggers active
-- while disabling the mayer_stock sync triggers that cause errors

CREATE OR REPLACE FUNCTION disable_sync_triggers()
RETURNS void AS $$
DECLARE
    r RECORD;
    v_count INTEGER := 0;
BEGIN
    FOR r IN 
        SELECT 
            c.relname AS table_name,
            t.tgname AS trigger_name
        FROM pg_trigger t
        JOIN pg_class c ON c.oid = t.tgrelid
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public'
          AND (t.tgname LIKE 'sync_%_to_mayer%' OR 
               t.tgname LIKE '%sync_mayer%' OR
               t.tgname = 'sync_to_mayer_stock')
          AND NOT t.tgisinternal
    LOOP
        EXECUTE format('ALTER TABLE %I DISABLE TRIGGER %I',
            r.table_name, r.trigger_name);
        v_count := v_count + 1;
        RAISE NOTICE 'Disabled: %.%', r.table_name, r.trigger_name;
    END LOOP;
    
    RAISE NOTICE 'Total triggers disabled: %', v_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- STEP 2: RE-ENABLE SYNC TRIGGERS
-- ============================================

CREATE OR REPLACE FUNCTION enable_sync_triggers()
RETURNS void AS $$
DECLARE
    r RECORD;
    v_count INTEGER := 0;
BEGIN
    FOR r IN 
        SELECT 
            c.relname AS table_name,
            t.tgname AS trigger_name
        FROM pg_trigger t
        JOIN pg_class c ON c.oid = t.tgrelid
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public'
          AND (t.tgname LIKE 'sync_%_to_mayer%' OR 
               t.tgname LIKE '%sync_mayer%' OR
               t.tgname = 'sync_to_mayer_stock')
          AND NOT t.tgisinternal
    LOOP
        EXECUTE format('ALTER TABLE %I ENABLE TRIGGER %I',
            r.table_name, r.trigger_name);
        v_count := v_count + 1;
        RAISE NOTICE 'Enabled: %.%', r.table_name, r.trigger_name;
    END LOOP;
    
    RAISE NOTICE 'Total triggers enabled: %', v_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- USAGE INSTRUCTIONS
-- ============================================

-- Before bulk operations:
SELECT disable_sync_triggers();

-- Do your bulk operations here:
-- - Import CSV files
-- - Update categories
-- - Add new product tables
-- - Any other bulk updates

-- After bulk operations:
SELECT enable_sync_triggers();

-- ============================================
-- CHECK TRIGGER STATUS
-- ============================================

CREATE OR REPLACE VIEW sync_trigger_status AS
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
  AND (t.tgname LIKE 'sync_%_to_mayer%' OR 
       t.tgname LIKE '%sync_mayer%' OR
       t.tgname = 'sync_to_mayer_stock')
  AND NOT t.tgisinternal
ORDER BY c.relname, t.tgname;

-- View status anytime with:
-- SELECT * FROM sync_trigger_status;