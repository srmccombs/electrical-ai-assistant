-- Verify Category Field is Populated in All Product Tables
-- Run this to ensure all products have categories for search/filter

SELECT 'CATEGORY COVERAGE REPORT' as report_title;

-- Check each table for category population
SELECT 
    'category_cables' as table_name,
    COUNT(*) as total_products,
    COUNT(category) as with_category,
    COUNT(DISTINCT category) as unique_categories,
    STRING_AGG(DISTINCT category, ', ' ORDER BY category) as categories
FROM category_cables
WHERE is_active = true

UNION ALL

SELECT 
    'fiber_optic_cable',
    COUNT(*),
    COUNT(category),
    COUNT(DISTINCT category),
    STRING_AGG(DISTINCT category, ', ' ORDER BY category)
FROM fiber_optic_cable
WHERE is_active = true

UNION ALL

SELECT 
    'fiber_connectors',
    COUNT(*),
    COUNT(category),
    COUNT(DISTINCT category),
    STRING_AGG(DISTINCT category, ', ' ORDER BY category)
FROM fiber_connectors
WHERE is_active = true

UNION ALL

SELECT 
    'adapter_panels',
    COUNT(*),
    COUNT(category),
    COUNT(DISTINCT category),
    STRING_AGG(DISTINCT category, ', ' ORDER BY category)
FROM adapter_panels
WHERE is_active = true

UNION ALL

SELECT 
    'rack_mount_fiber_enclosures',
    COUNT(*),
    COUNT(category),
    COUNT(DISTINCT category),
    STRING_AGG(DISTINCT category, ', ' ORDER BY category)
FROM rack_mount_fiber_enclosures
WHERE is_active = true

UNION ALL

SELECT 
    'wall_mount_fiber_enclosures',
    COUNT(*),
    COUNT(category),
    COUNT(DISTINCT category),
    STRING_AGG(DISTINCT category, ', ' ORDER BY category)
FROM wall_mount_fiber_enclosures
WHERE is_active = true

UNION ALL

SELECT 
    'jack_modules',
    COUNT(*),
    COUNT(category),
    COUNT(DISTINCT category),
    STRING_AGG(DISTINCT category, ', ' ORDER BY category)
FROM jack_modules
WHERE is_active = true

UNION ALL

SELECT 
    'faceplates',
    COUNT(*),
    COUNT(category),
    COUNT(DISTINCT category),
    STRING_AGG(DISTINCT category, ', ' ORDER BY category)
FROM faceplates
WHERE is_active = true

UNION ALL

SELECT 
    'surface_mount_box',
    COUNT(*),
    COUNT(category),
    COUNT(DISTINCT category),
    STRING_AGG(DISTINCT category, ', ' ORDER BY category)
FROM surface_mount_box
WHERE is_active = true

UNION ALL

SELECT 
    'modular_plugs',
    COUNT(*),
    COUNT(category),
    COUNT(DISTINCT category),
    STRING_AGG(DISTINCT category, ', ' ORDER BY category)
FROM modular_plugs
WHERE is_active = true

ORDER BY table_name;

-- Summary Stats
SELECT 
    'SUMMARY' as report_type,
    COUNT(*) as total_tables,
    SUM(total_products) as total_products,
    SUM(with_category) as products_with_category,
    ROUND(100.0 * SUM(with_category) / NULLIF(SUM(total_products), 0), 2) as percent_coverage
FROM (
    SELECT COUNT(*) as total_products, COUNT(category) as with_category FROM category_cables WHERE is_active = true
    UNION ALL
    SELECT COUNT(*), COUNT(category) FROM fiber_optic_cable WHERE is_active = true
    UNION ALL
    SELECT COUNT(*), COUNT(category) FROM fiber_connectors WHERE is_active = true
    UNION ALL
    SELECT COUNT(*), COUNT(category) FROM adapter_panels WHERE is_active = true
    UNION ALL
    SELECT COUNT(*), COUNT(category) FROM rack_mount_fiber_enclosures WHERE is_active = true
    UNION ALL
    SELECT COUNT(*), COUNT(category) FROM wall_mount_fiber_enclosures WHERE is_active = true
    UNION ALL
    SELECT COUNT(*), COUNT(category) FROM jack_modules WHERE is_active = true
    UNION ALL
    SELECT COUNT(*), COUNT(category) FROM faceplates WHERE is_active = true
    UNION ALL
    SELECT COUNT(*), COUNT(category) FROM surface_mount_box WHERE is_active = true
    UNION ALL
    SELECT COUNT(*), COUNT(category) FROM modular_plugs WHERE is_active = true
) as coverage;