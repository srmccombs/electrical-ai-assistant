-- Add Category Column to Remaining Tables (Parts 6-10)
-- For use after parts 1-5 have already been completed
-- Created: June 18, 2025

-- ============================================
-- 6. FIBER CABLES TABLE (FIXED)
-- ============================================
-- Note: fiber_optic_cable already has a 'category' column
-- Update it to be more specific based on fiber_category

UPDATE fiber_optic_cable
SET category = 
    CASE 
        WHEN fiber_category LIKE '%OS%' THEN 'Single-mode Fiber Cable'
        WHEN fiber_category LIKE '%OM%' THEN 'Multimode Fiber Cable'
        WHEN category = 'FIBER OPTIC CABLE' THEN 'Fiber Optic Cable'
        ELSE COALESCE(category, 'Fiber Optic Cable')
    END
WHERE is_active = true;

-- Verify
SELECT category, fiber_category, COUNT(*) as count 
FROM fiber_optic_cable 
WHERE is_active = true
GROUP BY category, fiber_category
ORDER BY count DESC;

-- ============================================
-- 7. FIBER CONNECTORS TABLE
-- ============================================
ALTER TABLE fiber_connectors 
ADD COLUMN IF NOT EXISTS category VARCHAR(100) DEFAULT 'Fiber Connector';

-- Update with connector type specifics
UPDATE fiber_connectors
SET category = 
    CASE 
        WHEN connector_type = 'LC' THEN 'LC Fiber Connector'
        WHEN connector_type = 'SC' THEN 'SC Fiber Connector'
        WHEN connector_type = 'ST' THEN 'ST Fiber Connector'
        WHEN connector_type = 'FC' THEN 'FC Fiber Connector'
        ELSE 'Fiber Connector'
    END
WHERE category IS NULL OR category = '';

-- Verify
SELECT category, COUNT(*) as count 
FROM fiber_connectors 
GROUP BY category 
ORDER BY count DESC;

-- ============================================
-- 8. ADAPTER PANELS TABLE
-- ============================================
ALTER TABLE adapter_panels 
ADD COLUMN IF NOT EXISTS category VARCHAR(100) DEFAULT 'Adapter Panel';

UPDATE adapter_panels
SET category = 'Adapter Panel'
WHERE category IS NULL OR category = '';

-- Verify
SELECT COUNT(*) as adapter_panels_updated FROM adapter_panels WHERE category = 'Adapter Panel';

-- ============================================
-- 9. RACK MOUNT FIBER ENCLOSURES TABLE
-- ============================================
ALTER TABLE rack_mount_fiber_enclosures 
ADD COLUMN IF NOT EXISTS category VARCHAR(100) DEFAULT 'Rack Mount Enclosure';

UPDATE rack_mount_fiber_enclosures
SET category = 'Rack Mount Enclosure'
WHERE category IS NULL OR category = '';

-- Verify
SELECT COUNT(*) as rack_enclosures_updated FROM rack_mount_fiber_enclosures WHERE category = 'Rack Mount Enclosure';

-- ============================================
-- 10. WALL MOUNT FIBER ENCLOSURES TABLE
-- ============================================
ALTER TABLE wall_mount_fiber_enclosures 
ADD COLUMN IF NOT EXISTS category VARCHAR(100) DEFAULT 'Wall Mount Enclosure';

UPDATE wall_mount_fiber_enclosures
SET category = 'Wall Mount Enclosure'
WHERE category IS NULL OR category = '';

-- Verify
SELECT COUNT(*) as wall_enclosures_updated FROM wall_mount_fiber_enclosures WHERE category = 'Wall Mount Enclosure';

-- ============================================
-- FINAL VERIFICATION - Check all tables
-- ============================================
SELECT 'modular_plugs' as table_name, COUNT(*) as total, COUNT(category) as with_category FROM modular_plugs WHERE is_active = true
UNION ALL
SELECT 'jack_modules', COUNT(*), COUNT(category) FROM jack_modules WHERE is_active = true
UNION ALL
SELECT 'faceplates', COUNT(*), COUNT(category) FROM faceplates WHERE is_active = true
UNION ALL
SELECT 'surface_mount_box', COUNT(*), COUNT(category) FROM surface_mount_box WHERE is_active = true
UNION ALL
SELECT 'category_cables', COUNT(*), COUNT(category) FROM category_cables WHERE is_active = true
UNION ALL
SELECT 'fiber_optic_cable', COUNT(*), COUNT(category) FROM fiber_optic_cable WHERE is_active = true
UNION ALL
SELECT 'fiber_connectors', COUNT(*), COUNT(category) FROM fiber_connectors WHERE is_active = true
UNION ALL
SELECT 'adapter_panels', COUNT(*), COUNT(category) FROM adapter_panels WHERE is_active = true
UNION ALL
SELECT 'rack_mount_fiber_enclosures', COUNT(*), COUNT(category) FROM rack_mount_fiber_enclosures WHERE is_active = true
UNION ALL
SELECT 'wall_mount_fiber_enclosures', COUNT(*), COUNT(category) FROM wall_mount_fiber_enclosures WHERE is_active = true
ORDER BY table_name;