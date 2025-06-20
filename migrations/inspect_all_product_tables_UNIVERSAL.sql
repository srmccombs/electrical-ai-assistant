-- Comprehensive inspection of all product tables (UNIVERSAL VERSION)
-- Works in any SQL environment (Supabase, psql, etc.)

-- Create a temporary inspection function
CREATE OR REPLACE FUNCTION inspect_table_details(p_table_name text)
RETURNS TABLE(
    column_position int,
    column_name text,
    data_type text,
    is_nullable text,
    column_default text
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.ordinal_position::int,
        c.column_name::text,
        c.data_type::text || 
        CASE 
            WHEN c.character_maximum_length IS NOT NULL 
            THEN '(' || c.character_maximum_length || ')'
            ELSE ''
        END as data_type,
        c.is_nullable::text,
        c.column_default::text
    FROM information_schema.columns c
    WHERE c.table_name = p_table_name
    AND c.table_schema = 'public'
    ORDER BY c.ordinal_position;
END;
$$ LANGUAGE plpgsql;

-- Create a comprehensive report
WITH table_info AS (
    -- Get all product tables
    SELECT DISTINCT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name LIKE 'prod_%'
    ORDER BY table_name
)
SELECT 
    '==================== ' || UPPER(t.table_name) || ' ====================' as table_header,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as total_columns,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name AND column_name = 'computed_search_terms') as has_search_terms,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name AND column_name = 'search_vector') as has_search_vector,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name AND column_name = 'common_terms') as has_common_terms
FROM table_info t;

-- Show columns for each table
SELECT '=== COLUMN DETAILS FOR EACH TABLE ===' as section;

-- prod_fiber_connectors
SELECT 'TABLE: prod_fiber_connectors' as table_info;
SELECT * FROM inspect_table_details('prod_fiber_connectors');

-- prod_fiber_cables
SELECT 'TABLE: prod_fiber_cables' as table_info;
SELECT * FROM inspect_table_details('prod_fiber_cables');

-- prod_jack_modules
SELECT 'TABLE: prod_jack_modules' as table_info;
SELECT * FROM inspect_table_details('prod_jack_modules');

-- prod_faceplates
SELECT 'TABLE: prod_faceplates' as table_info;
SELECT * FROM inspect_table_details('prod_faceplates');

-- prod_surface_mount_boxes
SELECT 'TABLE: prod_surface_mount_boxes' as table_info;
SELECT * FROM inspect_table_details('prod_surface_mount_boxes');

-- prod_adapter_panels
SELECT 'TABLE: prod_adapter_panels' as table_info;
SELECT * FROM inspect_table_details('prod_adapter_panels');

-- prod_rack_mount_enclosures
SELECT 'TABLE: prod_rack_mount_enclosures' as table_info;
SELECT * FROM inspect_table_details('prod_rack_mount_enclosures');

-- prod_wall_mount_enclosures
SELECT 'TABLE: prod_wall_mount_enclosures' as table_info;
SELECT * FROM inspect_table_details('prod_wall_mount_enclosures');

-- prod_modular_plugs
SELECT 'TABLE: prod_modular_plugs' as table_info;
SELECT * FROM inspect_table_details('prod_modular_plugs');

-- prod_category_cables (for comparison)
SELECT 'TABLE: prod_category_cables' as table_info;
SELECT * FROM inspect_table_details('prod_category_cables');

-- Show important columns summary
SELECT '=== KEY COLUMNS SUMMARY ===' as section;
SELECT 
    table_name,
    string_agg(
        CASE 
            WHEN column_name IN ('part_number', 'brand', 'short_description', 'category', 
                                'product_line', 'common_terms', 'computed_search_terms', 
                                'search_vector', 'fiber_category', 'connector_type', 
                                'jacket_color', 'ports', 'gang', 'color', 'panel_capacity',
                                'fiber_type', 'fiber_count', 'panel_type')
            THEN column_name
            ELSE NULL
        END, 
        ', ' ORDER BY ordinal_position
    ) as important_columns
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name LIKE 'prod_%'
GROUP BY table_name
ORDER BY table_name;

-- Clean up
DROP FUNCTION IF EXISTS inspect_table_details(text);