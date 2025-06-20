-- Diagnostic Query for Adapter Panels and Rack Mount Enclosures
-- Check what's actually in these tables

-- ============================================
-- 1. CHECK ADAPTER PANELS
-- ============================================
SELECT 'ADAPTER PANELS STATUS:' as check_type;

-- Check if table has any data
SELECT 
    COUNT(*) as total_records,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_records,
    COUNT(category) as records_with_category,
    COUNT(DISTINCT category) as unique_categories
FROM adapter_panels;

-- Show existing categories
SELECT 
    category,
    is_active,
    COUNT(*) as count
FROM adapter_panels
GROUP BY category, is_active
ORDER BY category, is_active;

-- Show sample records
SELECT 
    part_number,
    brand,
    short_description,
    category,
    is_active
FROM adapter_panels
LIMIT 5;

-- ============================================
-- 2. CHECK RACK MOUNT FIBER ENCLOSURES
-- ============================================
SELECT 'RACK MOUNT ENCLOSURES STATUS:' as check_type;

-- Check if table has any data
SELECT 
    COUNT(*) as total_records,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_records,
    COUNT(category) as records_with_category,
    COUNT(DISTINCT category) as unique_categories
FROM rack_mount_fiber_enclosures;

-- Show existing categories
SELECT 
    category,
    is_active,
    COUNT(*) as count
FROM rack_mount_fiber_enclosures
GROUP BY category, is_active
ORDER BY category, is_active;

-- Show sample records
SELECT 
    part_number,
    brand,
    short_description,
    category,
    is_active
FROM rack_mount_fiber_enclosures
LIMIT 5;

-- ============================================
-- 3. SUMMARY OF ALL ENCLOSURE/PANEL TABLES
-- ============================================
SELECT 'SUMMARY:' as check_type;

SELECT 
    'adapter_panels' as table_name,
    COUNT(*) as total,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active,
    COUNT(category) as with_category,
    STRING_AGG(DISTINCT category, ', ') as categories
FROM adapter_panels
UNION ALL
SELECT 
    'rack_mount_fiber_enclosures',
    COUNT(*),
    COUNT(CASE WHEN is_active = true THEN 1 END),
    COUNT(category),
    STRING_AGG(DISTINCT category, ', ')
FROM rack_mount_fiber_enclosures
UNION ALL
SELECT 
    'wall_mount_fiber_enclosures',
    COUNT(*),
    COUNT(CASE WHEN is_active = true THEN 1 END),
    COUNT(category),
    STRING_AGG(DISTINCT category, ', ')
FROM wall_mount_fiber_enclosures
ORDER BY table_name;