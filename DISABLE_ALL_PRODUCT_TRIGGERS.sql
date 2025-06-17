-- Disable All Product Table Triggers for Bulk Loading
-- Run this BEFORE importing data to avoid trigger conflicts

-- CATEGORY CABLES
ALTER TABLE category_cables DISABLE TRIGGER ALL;

-- FIBER CABLES
ALTER TABLE fiber_optic_cable DISABLE TRIGGER ALL;

-- FIBER CONNECTORS
ALTER TABLE fiber_connectors DISABLE TRIGGER ALL;

-- ADAPTER PANELS
ALTER TABLE adapter_panels DISABLE TRIGGER ALL;

-- RACK MOUNT FIBER ENCLOSURES
ALTER TABLE rack_mount_fiber_enclosures DISABLE TRIGGER ALL;

-- WALL MOUNT FIBER ENCLOSURES
ALTER TABLE wall_mount_fiber_enclosures DISABLE TRIGGER ALL;

-- JACK MODULES
ALTER TABLE jack_modules DISABLE TRIGGER ALL;

-- FACEPLATES
ALTER TABLE faceplates DISABLE TRIGGER ALL;

-- SURFACE MOUNT BOXES
ALTER TABLE surface_mount_box DISABLE TRIGGER ALL;

-- VERIFY ALL TRIGGERS ARE DISABLED
SELECT 
    schemaname,
    tablename,
    tgname AS trigger_name,
    CASE tgenabled 
        WHEN 'O' THEN 'ENABLED'
        WHEN 'D' THEN 'DISABLED'
        ELSE tgenabled::text
    END AS status
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
JOIN pg_tables pt ON pt.tablename = c.relname AND pt.schemaname = n.nspname
WHERE schemaname = 'public'
    AND tablename IN (
        'category_cables',
        'fiber_cables', 
        'fiber_connectors',
        'adapter_panels',
        'rack_mount_fiber_enclosures',
        'wall_mount_fiber_enclosures',
        'jack_modules',
        'faceplates',
        'surface_mount_box'
    )
ORDER BY tablename, trigger_name;