-- Add Category Column to All Product Tables and Populate
-- Created: June 18, 2025
-- This script adds a 'category' column to all product tables for consistent categorization

-- ============================================
-- 1. MODULAR PLUGS TABLE
-- ============================================
ALTER TABLE modular_plugs 
ADD COLUMN IF NOT EXISTS category VARCHAR(100) DEFAULT 'Modular Plug';

-- Update all modular plugs
UPDATE modular_plugs
SET category = 'Modular Plug'
WHERE category IS NULL OR category = '';

-- Verify
SELECT COUNT(*) as modular_plugs_updated FROM modular_plugs WHERE category = 'Modular Plug';

-- ============================================
-- 2. JACK MODULES TABLE
-- ============================================
ALTER TABLE jack_modules 
ADD COLUMN IF NOT EXISTS category VARCHAR(100);

-- Update based on existing category_rating or product type
UPDATE jack_modules
SET category = 
    CASE 
        WHEN category_rating = 'Blank' THEN 'Blank Module'
        WHEN category_rating = 'F-Type Coax' THEN 'Coax Jack Module'
        WHEN category_rating = 'HDMI Coup' THEN 'HDMI Jack Module'
        WHEN category_rating LIKE '%Category%' THEN 'Jack Module'
        ELSE 'Jack Module'
    END
WHERE category IS NULL OR category = '';

-- Verify
SELECT category, COUNT(*) as count 
FROM jack_modules 
GROUP BY category 
ORDER BY count DESC;

-- ============================================
-- 3. FACEPLATES TABLE
-- ============================================
ALTER TABLE faceplates 
ADD COLUMN IF NOT EXISTS category VARCHAR(100) DEFAULT 'Faceplate';

UPDATE faceplates
SET category = 'Faceplate'
WHERE category IS NULL OR category = '';

-- Verify
SELECT COUNT(*) as faceplates_updated FROM faceplates WHERE category = 'Faceplate';

-- ============================================
-- 4. SURFACE MOUNT BOX TABLE
-- ============================================
ALTER TABLE surface_mount_box 
ADD COLUMN IF NOT EXISTS category VARCHAR(100) DEFAULT 'Surface Mount Box';

UPDATE surface_mount_box
SET category = 'Surface Mount Box'
WHERE category IS NULL OR category = '';

-- Verify
SELECT COUNT(*) as smb_updated FROM surface_mount_box WHERE category = 'Surface Mount Box';

-- ============================================
-- 5. CATEGORY CABLES TABLE
-- ============================================
ALTER TABLE category_cables 
ADD COLUMN IF NOT EXISTS category VARCHAR(100) DEFAULT 'Category Cable';

-- Update with more specific categories based on rating
UPDATE category_cables
SET category = 
    CASE 
        WHEN category_rating = 'CAT5E' THEN 'Cat5e Cable'
        WHEN category_rating = 'CAT6' THEN 'Cat6 Cable'
        WHEN category_rating = 'CAT6A' THEN 'Cat6A Cable'
        ELSE 'Category Cable'
    END
WHERE category IS NULL OR category = '';

-- Verify
SELECT category, COUNT(*) as count 
FROM category_cables 
GROUP BY category 
ORDER BY count DESC;

-- ============================================
-- 6. FIBER CABLES TABLE
-- ============================================
ALTER TABLE fiber_optic_cable 
ADD COLUMN IF NOT EXISTS category VARCHAR(100) DEFAULT 'Fiber Optic Cable';

-- Update with more specific categories
UPDATE fiber_optic_cable
SET category = 
    CASE 
        WHEN fiber_type LIKE '%OS%' THEN 'Single-mode Fiber Cable'
        WHEN fiber_type LIKE '%OM%' THEN 'Multimode Fiber Cable'
        ELSE 'Fiber Optic Cable'
    END
WHERE category IS NULL OR category = '';

-- Verify
SELECT category, COUNT(*) as count 
FROM fiber_optic_cable 
GROUP BY category 
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