-- Update Existing Categories for Adapter Panels and Rack Mount Enclosures
-- These tables have existing category values that need to be updated

-- ============================================
-- 1. UPDATE ADAPTER PANELS
-- ============================================
-- Currently has "FIBER ADAPTER PANELS"
-- Update to standardized "Adapter Panel"

ALTER TABLE adapter_panels DISABLE TRIGGER ALL;

UPDATE adapter_panels
SET category = 'Adapter Panel'
WHERE is_active = true
  AND category = 'FIBER ADAPTER PANELS';

ALTER TABLE adapter_panels ENABLE TRIGGER ALL;

-- Verify
SELECT 'Adapter Panels Updated:' as status, COUNT(*) as count
FROM adapter_panels
WHERE category = 'Adapter Panel';

-- ============================================
-- 2. UPDATE RACK MOUNT FIBER ENCLOSURES
-- ============================================
-- Currently has "FIBER PATCH PANEL"
-- Update to standardized "Rack Mount Enclosure"

ALTER TABLE rack_mount_fiber_enclosures DISABLE TRIGGER ALL;

UPDATE rack_mount_fiber_enclosures
SET category = 'Rack Mount Enclosure'
WHERE is_active = true
  AND category = 'FIBER PATCH PANEL';

ALTER TABLE rack_mount_fiber_enclosures ENABLE TRIGGER ALL;

-- Verify
SELECT 'Rack Mount Enclosures Updated:' as status, COUNT(*) as count
FROM rack_mount_fiber_enclosures
WHERE category = 'Rack Mount Enclosure';

-- ============================================
-- 3. FINAL VERIFICATION
-- ============================================
SELECT 
    'adapter_panels' as table_name,
    COUNT(*) as total,
    category,
    COUNT(*) as count_per_category
FROM adapter_panels
WHERE is_active = true
GROUP BY category
UNION ALL
SELECT 
    'rack_mount_fiber_enclosures',
    COUNT(*),
    category,
    COUNT(*)
FROM rack_mount_fiber_enclosures
WHERE is_active = true
GROUP BY category
UNION ALL
SELECT 
    'wall_mount_fiber_enclosures',
    COUNT(*),
    category,
    COUNT(*)
FROM wall_mount_fiber_enclosures
WHERE is_active = true
GROUP BY category
ORDER BY table_name, category;

-- Summary view
SELECT 
    'Category Update Complete' as status,
    'All fiber enclosure and panel tables now have standardized categories' as message;