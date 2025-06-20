-- Update Categories with "Fiber" Prefix for Better Distinction
-- Since other types of enclosures will be added later

-- ============================================
-- 1. UPDATE ADAPTER PANELS TO FIBER ADAPTER PANEL
-- ============================================
ALTER TABLE adapter_panels DISABLE TRIGGER ALL;

UPDATE adapter_panels
SET category = 'Fiber Adapter Panel'
WHERE is_active = true;

ALTER TABLE adapter_panels ENABLE TRIGGER ALL;

-- ============================================
-- 2. UPDATE RACK MOUNT FIBER ENCLOSURES
-- ============================================
ALTER TABLE rack_mount_fiber_enclosures DISABLE TRIGGER ALL;

UPDATE rack_mount_fiber_enclosures
SET category = 'Fiber Rack Mount Enclosure'
WHERE is_active = true;

ALTER TABLE rack_mount_fiber_enclosures ENABLE TRIGGER ALL;

-- ============================================
-- 3. UPDATE WALL MOUNT FIBER ENCLOSURES
-- ============================================
ALTER TABLE wall_mount_fiber_enclosures DISABLE TRIGGER ALL;

UPDATE wall_mount_fiber_enclosures
SET category = 'Fiber Wall Mount Enclosure'
WHERE is_active = true;

ALTER TABLE wall_mount_fiber_enclosures ENABLE TRIGGER ALL;

-- ============================================
-- 4. ALSO UPDATE FIBER CONNECTORS IF NEEDED
-- ============================================
ALTER TABLE fiber_connectors DISABLE TRIGGER ALL;

UPDATE fiber_connectors
SET category = 
    CASE 
        WHEN connector_type = 'LC' THEN 'LC Fiber Connector'
        WHEN connector_type = 'SC' THEN 'SC Fiber Connector'
        WHEN connector_type = 'ST' THEN 'ST Fiber Connector'
        WHEN connector_type = 'FC' THEN 'FC Fiber Connector'
        ELSE 'Fiber Connector'
    END
WHERE is_active = true;

ALTER TABLE fiber_connectors ENABLE TRIGGER ALL;

-- ============================================
-- 5. FINAL VERIFICATION - All Fiber Tables
-- ============================================
SELECT 'FIBER PRODUCT CATEGORIES:' as report_type;

SELECT 
    table_name,
    category,
    count
FROM (
    SELECT 'fiber_optic_cable' as table_name, category, COUNT(*) as count
    FROM fiber_optic_cable WHERE is_active = true GROUP BY category
    UNION ALL
    SELECT 'fiber_connectors', category, COUNT(*)
    FROM fiber_connectors WHERE is_active = true GROUP BY category
    UNION ALL
    SELECT 'adapter_panels', category, COUNT(*)
    FROM adapter_panels WHERE is_active = true GROUP BY category
    UNION ALL
    SELECT 'rack_mount_fiber_enclosures', category, COUNT(*)
    FROM rack_mount_fiber_enclosures WHERE is_active = true GROUP BY category
    UNION ALL
    SELECT 'wall_mount_fiber_enclosures', category, COUNT(*)
    FROM wall_mount_fiber_enclosures WHERE is_active = true GROUP BY category
) as summary
ORDER BY 
    CASE 
        WHEN table_name = 'fiber_optic_cable' THEN 1
        WHEN table_name = 'fiber_connectors' THEN 2
        WHEN table_name = 'adapter_panels' THEN 3
        WHEN table_name LIKE '%rack%' THEN 4
        WHEN table_name LIKE '%wall%' THEN 5
    END,
    category;

-- Summary
SELECT 
    COUNT(DISTINCT table_name) as tables_updated,
    COUNT(*) as total_categories,
    'All fiber products now have "Fiber" in their category names' as note
FROM (
    SELECT 'fiber_optic_cable' as table_name, category FROM fiber_optic_cable WHERE is_active = true GROUP BY category
    UNION ALL
    SELECT 'fiber_connectors', category FROM fiber_connectors WHERE is_active = true GROUP BY category
    UNION ALL
    SELECT 'adapter_panels', category FROM adapter_panels WHERE is_active = true GROUP BY category
    UNION ALL
    SELECT 'rack_mount_fiber_enclosures', category FROM rack_mount_fiber_enclosures WHERE is_active = true GROUP BY category
    UNION ALL
    SELECT 'wall_mount_fiber_enclosures', category FROM wall_mount_fiber_enclosures WHERE is_active = true GROUP BY category
) as all_categories;