-- Final verification and standardization of all product tables
-- Uses ONLY verified column names from your actual database
-- Created after reviewing CSV exports and your corrections

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

-- Sample from each table
SELECT '=== Sample prod_category_cables ===' as table_info;
SELECT part_number, brand, category_rating, jacket_material, shielding_type 
FROM prod_category_cables LIMIT 3;

SELECT '=== Sample prod_fiber_cables ===' as table_info;
SELECT part_number, brand, fiber_types, fiber_count, jacket_rating 
FROM prod_fiber_cables LIMIT 3;

SELECT '=== Sample prod_fiber_connectors ===' as table_info;
SELECT part_number, brand, connector_type, fiber_types, termination_type 
FROM prod_fiber_connectors LIMIT 3;

SELECT '=== Sample prod_adapter_panels ===' as table_info;
SELECT part_number, brand, panel_type, fiber_types, connector_type
FROM prod_adapter_panels LIMIT 3;

SELECT '=== Sample prod_jack_modules ===' as table_info;
SELECT part_number, brand, product_line, jack_type, wiring_scheme 
FROM prod_jack_modules LIMIT 3;

SELECT '=== Sample prod_modular_plugs ===' as table_info;
SELECT part_number, brand, product_line, plug_type, short_description 
FROM prod_modular_plugs LIMIT 3;

SELECT '=== Sample prod_faceplates ===' as table_info;
SELECT part_number, brand, product_line, ports, color 
FROM prod_faceplates LIMIT 3;

SELECT '=== Sample prod_surface_mount_boxes ===' as table_info;
SELECT part_number, brand, product_line, ports, color 
FROM prod_surface_mount_boxes LIMIT 3;

SELECT '=== Sample prod_wall_mount_fiber_enclosures ===' as table_info;
SELECT part_number, brand, panel_capacity, width_ru, height_ru 
FROM prod_wall_mount_fiber_enclosures LIMIT 3;

SELECT '=== Sample prod_rack_mount_fiber_enclosures ===' as table_info;
SELECT part_number, brand, panel_capacity, height_ru 
FROM prod_rack_mount_fiber_enclosures LIMIT 3;

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
ORDER BY brand;

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

SELECT 'Verification complete!' as status,
    'Review the output above to see current database state' as next_step;

COMMIT;