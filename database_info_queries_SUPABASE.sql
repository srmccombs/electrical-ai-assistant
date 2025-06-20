-- Database Information Gathering Queries for SUPABASE
-- IMPORTANT: Supabase uses different system tables than standard PostgreSQL
-- Run these in Supabase SQL Editor to get current database state
-- Created: June 20, 2025

-- ============================================
-- SUPABASE NOTES:
-- 1. Use information_schema instead of pg_stat_user_tables
-- 2. Table names must be in quotes if they have mixed case
-- 3. Some PostgreSQL system tables are not accessible in Supabase
-- 4. Always specify schema as 'public'
-- ============================================

-- ============================================
-- 1. GET ALL PRODUCT TABLES AND ROW COUNTS (SUPABASE VERSION)
-- ============================================
-- Get list of all product tables
SELECT 
    table_name,
    table_type
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name LIKE 'prod_%'
ORDER BY table_name;

-- Get row counts (run for each table individually in Supabase)
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
ORDER BY table_name;

-- ============================================
-- 2. GET COMPLETE COLUMN INFO FOR A SPECIFIC TABLE
-- ============================================
-- Run this for each table you want to inspect
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default,
    ordinal_position
FROM information_schema.columns
WHERE table_name = 'prod_category_cables'  -- Change this for each table
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Get all columns for all product tables at once
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name LIKE 'prod_%'
ORDER BY table_name, ordinal_position;

-- ============================================
-- 3. LIST ALL INDEXES (SUPABASE VERSION)
-- ============================================
SELECT 
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename LIKE 'prod_%'
ORDER BY tablename, indexname;

-- ============================================
-- 4. CHECK FOR MISSING COLUMNS (jack_modules issue)
-- ============================================
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

-- ============================================
-- 5. CHECK TRIGGER STATUS (SUPABASE)
-- ============================================
-- Check if disabled_triggers_backup table exists
SELECT 
    table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
AND table_name = 'disabled_triggers_backup';

-- If the backup table exists, view its contents
SELECT * FROM disabled_triggers_backup;

-- Check current trigger status
SELECT 
    event_object_table as table_name,
    trigger_name,
    event_manipulation as trigger_event,
    action_timing,
    action_orientation
FROM information_schema.triggers
WHERE event_object_schema = 'public'
AND event_object_table LIKE 'prod_%'
ORDER BY event_object_table, trigger_name;

-- ============================================
-- 6. DATA QUALITY CHECKS (SUPABASE FRIENDLY)
-- ============================================
-- Check for trailing spaces in brands - Category Cables
SELECT 
    'prod_category_cables' as table_name,
    COUNT(*) as brands_with_spaces
FROM prod_category_cables 
WHERE brand != TRIM(brand);

-- Check for trailing spaces in brands - Fiber Cables
SELECT 
    'prod_fiber_cables' as table_name,
    COUNT(*) as brands_with_spaces
FROM prod_fiber_cables 
WHERE brand != TRIM(brand);

-- Check for NULL or empty common_terms - Category Cables
SELECT 
    'prod_category_cables' as table_name,
    COUNT(*) as missing_common_terms
FROM prod_category_cables
WHERE common_terms IS NULL OR common_terms = '';

-- Check for NULL or empty common_terms - Fiber Cables
SELECT 
    'prod_fiber_cables' as table_name,
    COUNT(*) as missing_common_terms
FROM prod_fiber_cables
WHERE common_terms IS NULL OR common_terms = '';

-- Combined data quality report
SELECT * FROM (
    SELECT 'prod_category_cables' as table_name, 'Brands with spaces' as issue, COUNT(*) as count
    FROM prod_category_cables WHERE brand != TRIM(brand)
    UNION ALL
    SELECT 'prod_category_cables', 'Missing common_terms', COUNT(*)
    FROM prod_category_cables WHERE common_terms IS NULL OR common_terms = ''
    UNION ALL
    SELECT 'prod_category_cables', 'Inactive products', COUNT(*)
    FROM prod_category_cables WHERE is_active = false
    UNION ALL
    SELECT 'prod_fiber_cables', 'Brands with spaces', COUNT(*)
    FROM prod_fiber_cables WHERE brand != TRIM(brand)
    UNION ALL
    SELECT 'prod_fiber_cables', 'Missing common_terms', COUNT(*)
    FROM prod_fiber_cables WHERE common_terms IS NULL OR common_terms = ''
    UNION ALL
    SELECT 'prod_fiber_cables', 'Inactive products', COUNT(*)
    FROM prod_fiber_cables WHERE is_active = false
) quality_report
WHERE count > 0
ORDER BY table_name, issue;

-- ============================================
-- 7. CHECK CONSTRAINTS (SUPABASE)
-- ============================================
SELECT 
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type
FROM information_schema.table_constraints tc
WHERE tc.table_schema = 'public'
AND tc.table_name LIKE 'prod_%'
AND tc.constraint_type IN ('PRIMARY KEY', 'UNIQUE', 'FOREIGN KEY')
ORDER BY tc.table_name, tc.constraint_type;

-- Get detailed constraint columns
SELECT 
    kcu.table_name,
    kcu.constraint_name,
    kcu.column_name,
    tc.constraint_type
FROM information_schema.key_column_usage kcu
JOIN information_schema.table_constraints tc
    ON kcu.constraint_name = tc.constraint_name
    AND kcu.table_schema = tc.table_schema
WHERE kcu.table_schema = 'public'
AND kcu.table_name LIKE 'prod_%'
ORDER BY kcu.table_name, kcu.constraint_name, kcu.ordinal_position;

-- ============================================
-- 8. CHECK ARRAY AND JSON COLUMNS
-- ============================================
SELECT 
    table_name,
    column_name,
    data_type,
    udt_name
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name LIKE 'prod_%'
AND (data_type LIKE '%[]' OR data_type IN ('json', 'jsonb'))
ORDER BY table_name, column_name;

-- ============================================
-- 9. GET SAMPLE DATA (Run each separately)
-- ============================================
-- Category Cables sample
SELECT 
    part_number,
    brand,
    category_rating,
    shielding_type,
    jacket_material,
    is_active
FROM prod_category_cables 
LIMIT 5;

-- Fiber Cables sample
SELECT 
    part_number,
    brand,
    fiber_types,
    fiber_count,
    jacket_rating,
    is_active
FROM prod_fiber_cables 
LIMIT 5;

-- Jack Modules sample
SELECT 
    part_number,
    brand,
    category_rating,
    product_line,
    is_active
FROM prod_jack_modules 
LIMIT 5;

-- Faceplates sample
SELECT 
    part_number,
    brand,
    number_of_ports,
    compatible_jacks,
    is_active
FROM prod_faceplates 
LIMIT 5;

-- Surface Mount Boxes sample (note different column types)
SELECT 
    part_number,
    brand,
    number_of_ports,
    compatible_jacks,  -- This is JSON type
    common_terms,      -- This is TEXT[] array
    is_active
FROM prod_surface_mount_boxes 
LIMIT 5;

-- ============================================
-- 10. SEARCH SYSTEM STATUS
-- ============================================
-- Check if search_terms table exists
SELECT 
    COUNT(*) as search_terms_exist
FROM information_schema.tables 
WHERE table_schema = 'public'
AND table_name = 'search_terms';

-- If exists, check search terms data
SELECT 
    COUNT(*) as total_terms,
    COUNT(DISTINCT term_group) as unique_groups
FROM search_terms
WHERE is_active = true;

-- Check search vector population for each table
SELECT 
    'prod_category_cables' as table_name,
    COUNT(*) as total_products,
    COUNT(search_vector) as has_search_vector,
    COUNT(computed_search_terms) as has_computed_terms,
    COUNT(common_terms) as has_common_terms
FROM prod_category_cables;

-- ============================================
-- 11. UNIQUE VALUES IN KEY COLUMNS
-- ============================================
-- Get unique brands
SELECT DISTINCT brand 
FROM prod_category_cables 
WHERE brand IS NOT NULL
ORDER BY brand
LIMIT 20;

-- Get unique category ratings
SELECT DISTINCT category_rating 
FROM prod_category_cables 
WHERE category_rating IS NOT NULL
ORDER BY category_rating;

-- Get unique shielding types
SELECT DISTINCT shielding_type 
FROM prod_category_cables 
WHERE shielding_type IS NOT NULL
ORDER BY shielding_type;

-- Get unique jacket materials
SELECT DISTINCT jacket_material 
FROM prod_category_cables 
WHERE jacket_material IS NOT NULL
ORDER BY jacket_material;

-- ============================================
-- 12. FIND DUPLICATE PART NUMBERS
-- ============================================
-- Check for duplicate part numbers in category cables
SELECT 
    part_number,
    COUNT(*) as duplicate_count
FROM prod_category_cables
GROUP BY part_number
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC;

-- ============================================
-- HELPFUL SUPABASE SQL TIPS:
-- 1. Always use single quotes for string values: WHERE brand = 'Panduit'
-- 2. Use double quotes for identifiers with special characters: SELECT "my-column"
-- 3. Array comparisons: WHERE 'Keystone' = ANY(compatible_jacks)
-- 4. JSON queries: WHERE compatible_jacks::jsonb @> '["Keystone"]'
-- 5. Check NULL values: WHERE column_name IS NULL (not = NULL)
-- 6. Text search: WHERE column_name ILIKE '%search%' (case insensitive)
-- ============================================