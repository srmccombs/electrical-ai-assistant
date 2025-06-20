-- Query 1: Get row counts for all product tables
SELECT 'prod_category_cables' as table_name, COUNT(*) as row_count FROM prod_category_cables
UNION ALL
SELECT 'prod_fiber_cables', COUNT(*) FROM prod_fiber_cables
UNION ALL
SELECT 'prod_fiber_connectors', COUNT(*) FROM prod_fiber_connectors
UNION ALL
SELECT 'prod_jack_modules', COUNT(*) FROM prod_jack_modules
UNION ALL
SELECT 'prod_modular_plugs', COUNT(*) FROM prod_modular_plugs
UNION ALL
SELECT 'prod_faceplates', COUNT(*) FROM prod_faceplates
UNION ALL
SELECT 'prod_surface_mount_boxes', COUNT(*) FROM prod_surface_mount_boxes
UNION ALL
SELECT 'prod_adapter_panels', COUNT(*) FROM prod_adapter_panels
UNION ALL
SELECT 'prod_wall_mount_fiber_enclosures', COUNT(*) FROM prod_wall_mount_fiber_enclosures
UNION ALL
SELECT 'prod_rack_mount_fiber_enclosures', COUNT(*) FROM prod_rack_mount_fiber_enclosures
ORDER BY row_count DESC;

-- Query 2: Check search_terms table status
SELECT 
    COUNT(*) as total_terms,
    COUNT(DISTINCT term_group) as unique_groups,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_terms
FROM search_terms;

-- Query 3: Check data quality issues
SELECT * FROM (
    SELECT 'prod_category_cables' as table_name, 'Missing common_terms' as issue, COUNT(*) as count
    FROM prod_category_cables WHERE common_terms IS NULL OR common_terms = ''
    UNION ALL
    SELECT 'prod_category_cables', 'Inactive products', COUNT(*)
    FROM prod_category_cables WHERE is_active = false
    UNION ALL
    SELECT 'prod_fiber_cables', 'Missing common_terms', COUNT(*)
    FROM prod_fiber_cables WHERE common_terms IS NULL OR common_terms = ''
    UNION ALL
    SELECT 'prod_fiber_cables', 'Inactive products', COUNT(*)
    FROM prod_fiber_cables WHERE is_active = false
    UNION ALL
    SELECT 'prod_jack_modules', 'Missing common_terms', COUNT(*)
    FROM prod_jack_modules WHERE common_terms IS NULL OR common_terms = ''
    UNION ALL
    SELECT 'prod_faceplates', 'Missing common_terms', COUNT(*)
    FROM prod_faceplates WHERE common_terms IS NULL OR common_terms = ''
) quality_report
WHERE count > 0
ORDER BY table_name, issue;

-- Query 4: Check for tables missing audit columns
SELECT DISTINCT
    c1.table_name,
    CASE WHEN c2.column_name IS NOT NULL THEN 'YES' ELSE 'NO' END as has_created_by,
    CASE WHEN c3.column_name IS NOT NULL THEN 'YES' ELSE 'NO' END as has_last_modified_by
FROM information_schema.columns c1
LEFT JOIN information_schema.columns c2 
    ON c1.table_name = c2.table_name 
    AND c2.column_name = 'created_by'
    AND c2.table_schema = 'public'
LEFT JOIN information_schema.columns c3 
    ON c1.table_name = c3.table_name 
    AND c3.column_name = 'last_modified_by'
    AND c3.table_schema = 'public'
WHERE c1.table_schema = 'public'
AND c1.table_name LIKE 'prod_%'
ORDER BY c1.table_name;

-- Query 5: Check Category 5e products specifically
SELECT 
    COUNT(*) as total_cat5e_products,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_cat5e,
    COUNT(CASE WHEN common_terms IS NOT NULL AND common_terms != '' THEN 1 END) as with_search_terms
FROM prod_category_cables
WHERE category_rating = 'Category 5e';