-- Final verification and standardization of all product tables
-- FIXED VERSION - Uses actual column names from your database
-- Based on CSV exports you provided

BEGIN;

-- Step 1: Verify current state of all tables
-- This shows us exactly what columns exist in each table

SELECT 'Current structure of all product tables:' as info;

-- prod_category_cables
SELECT '=== prod_category_cables ===' as table_info;
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'prod_category_cables'
ORDER BY ordinal_position;

-- prod_fiber_cables
SELECT '=== prod_fiber_cables ===' as table_info;
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'prod_fiber_cables'
ORDER BY ordinal_position;

-- prod_fiber_connectors
SELECT '=== prod_fiber_connectors ===' as table_info;
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'prod_fiber_connectors'
ORDER BY ordinal_position;

-- prod_adapter_panels
SELECT '=== prod_adapter_panels ===' as table_info;
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'prod_adapter_panels'
ORDER BY ordinal_position;

-- prod_jack_modules
SELECT '=== prod_jack_modules ===' as table_info;
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'prod_jack_modules'
ORDER BY ordinal_position;

-- prod_modular_plugs
SELECT '=== prod_modular_plugs ===' as table_info;
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'prod_modular_plugs'
ORDER BY ordinal_position;

-- prod_faceplates
SELECT '=== prod_faceplates ===' as table_info;
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'prod_faceplates'
ORDER BY ordinal_position;

-- prod_surface_mount_boxes
SELECT '=== prod_surface_mount_boxes ===' as table_info;
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'prod_surface_mount_boxes'
ORDER BY ordinal_position;

-- prod_wall_mount_fiber_enclosures
SELECT '=== prod_wall_mount_fiber_enclosures ===' as table_info;
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'prod_wall_mount_fiber_enclosures'
ORDER BY ordinal_position;

-- prod_rack_mount_fiber_enclosures
SELECT '=== prod_rack_mount_fiber_enclosures ===' as table_info;
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'prod_rack_mount_fiber_enclosures'
ORDER BY ordinal_position;

-- Step 2: Show sample data from each table to verify actual values
SELECT 'Sample data from each table:' as info;

-- Sample from each table - USING CORRECT COLUMN NAMES
SELECT '=== Sample prod_category_cables ===' as table_info;
SELECT 
    part_number, 
    brand, 
    category_rating,  -- NOT cable_type
    jacket_material,  -- NOT jacket_rating
    jacket_color,     -- NOT just color
    shielding_type    -- Now lowercase after migration 012
FROM prod_category_cables 
LIMIT 3;

SELECT '=== Sample prod_fiber_cables ===' as table_info;
SELECT 
    part_number, 
    brand, 
    fiber_types,      -- Should be array
    fiber_count, 
    jacket_rating 
FROM prod_fiber_cables 
LIMIT 3;

SELECT '=== Sample prod_fiber_connectors ===' as table_info;
SELECT 
    part_number, 
    brand, 
    connector_type, 
    fiber_types,      -- Changed from fiber_category
    termination_type  -- Changed from technology
FROM prod_fiber_connectors 
LIMIT 3;

SELECT '=== Sample prod_adapter_panels ===' as table_info;
SELECT 
    part_number, 
    brand, 
    panel_type, 
    fiber_types,      -- Changed from fiber_category
    connector_type
FROM prod_adapter_panels 
LIMIT 3;

SELECT '=== Sample prod_jack_modules ===' as table_info;
SELECT 
    part_number, 
    brand, 
    product_line,     -- Extracted from JSON
    category_rating,  -- NOT jack_type
    color,
    shielding_type
FROM prod_jack_modules 
LIMIT 3;

SELECT '=== Sample prod_modular_plugs ===' as table_info;
SELECT 
    part_number, 
    brand, 
    product_line,     -- Already exists
    category_rating,  -- NOT plug_type
    shielding_type,
    short_description 
FROM prod_modular_plugs 
LIMIT 3;

SELECT '=== Sample prod_faceplates ===' as table_info;
SELECT 
    part_number, 
    brand, 
    product_line, 
    number_of_ports,  -- NOT ports
    number_gang,
    color 
FROM prod_faceplates 
LIMIT 3;

SELECT '=== Sample prod_surface_mount_boxes ===' as table_info;
SELECT 
    part_number, 
    brand, 
    product_line, 
    number_of_ports,  -- NOT ports
    color 
FROM prod_surface_mount_boxes 
LIMIT 3;

SELECT '=== Sample prod_wall_mount_fiber_enclosures ===' as table_info;
SELECT 
    part_number, 
    brand, 
    panel_capacity,  -- Renamed from accepts_number_of_connector_housing_panels
    max_fiber_capacity,
    mount_type
FROM prod_wall_mount_fiber_enclosures 
LIMIT 3;

SELECT '=== Sample prod_rack_mount_fiber_enclosures ===' as table_info;
SELECT 
    part_number, 
    brand, 
    panel_capacity,  -- Renamed from accepts_number_of_connector_housing_panels
    rack_units,
    max_fiber_capacity
FROM prod_rack_mount_fiber_enclosures 
LIMIT 3;

-- Step 3: Verify search columns exist on all tables
SELECT 'Verifying search columns on all tables:' as info;

SELECT 
    table_name,
    COUNT(CASE WHEN column_name = 'computed_search_terms' THEN 1 END) as has_search_terms,
    COUNT(CASE WHEN column_name = 'search_vector' THEN 1 END) as has_search_vector
FROM information_schema.columns 
WHERE table_name LIKE 'prod_%'
AND table_name NOT LIKE '%_old'
GROUP BY table_name
ORDER BY table_name;

-- Step 4: Show actual brands in each table
SELECT 'Brands by table:' as info;

SELECT '=== Brands in prod_category_cables ===' as table_info;
SELECT brand, COUNT(*) as count 
FROM prod_category_cables 
GROUP BY brand 
ORDER BY brand
LIMIT 10;

SELECT '=== Brands in prod_jack_modules ===' as table_info;
SELECT brand, COUNT(*) as count 
FROM prod_jack_modules 
GROUP BY brand 
ORDER BY brand;

SELECT '=== Brands in prod_modular_plugs ===' as table_info;
SELECT brand, COUNT(*) as count 
FROM prod_modular_plugs 
GROUP BY brand 
ORDER BY brand;

SELECT '=== Brands in prod_fiber_connectors ===' as table_info;
SELECT brand, COUNT(*) as count 
FROM prod_fiber_connectors 
GROUP BY brand 
ORDER BY brand
LIMIT 10;

-- Step 5: Show which tables need product_line extraction
SELECT 'Product line status:' as info;

SELECT 
    'prod_jack_modules' as table_name,
    COUNT(*) as total_products,
    COUNT(product_line) as has_product_line,
    COUNT(*) - COUNT(product_line) as missing_product_line
FROM prod_jack_modules

UNION ALL

SELECT 
    'prod_modular_plugs',
    COUNT(*),
    COUNT(product_line),
    COUNT(*) - COUNT(product_line)
FROM prod_modular_plugs

UNION ALL

SELECT 
    'prod_faceplates',
    COUNT(*),
    COUNT(product_line),
    COUNT(*) - COUNT(product_line)
FROM prod_faceplates

UNION ALL

SELECT 
    'prod_surface_mount_boxes',
    COUNT(*),
    COUNT(product_line),
    COUNT(*) - COUNT(product_line)
FROM prod_surface_mount_boxes;

-- Step 6: Check column consistency across similar tables
SELECT 'Checking column naming consistency:' as info;

-- Check fiber tables for fiber_types vs fiber_category
SELECT 
    'Fiber column naming' as check_type,
    table_name,
    column_name
FROM information_schema.columns
WHERE table_name IN ('prod_fiber_cables', 'prod_fiber_connectors', 'prod_adapter_panels')
AND column_name IN ('fiber_types', 'fiber_category')
ORDER BY table_name, column_name;

-- Check category cable columns
SELECT 
    'Category cable columns' as check_type,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_name = 'prod_category_cables'
AND column_name IN ('category_rating', 'cable_type', 'jacket_material', 'jacket_rating', 'jacket_color', 'color')
ORDER BY column_name;

SELECT 'Verification complete!' as status,
    'Review the output above to see current database state' as next_step;

COMMIT;