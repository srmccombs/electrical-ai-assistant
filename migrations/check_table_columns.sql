-- Check what columns actually exist in each product table
-- Run this before the migration to verify column names

-- Function to show columns for a table
CREATE OR REPLACE FUNCTION show_table_columns(p_table_name text)
RETURNS TABLE(column_name text, data_type text) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.column_name::text,
        c.data_type::text
    FROM information_schema.columns c
    WHERE c.table_name = p_table_name
    AND c.table_schema = 'public'
    ORDER BY c.ordinal_position;
END;
$$ LANGUAGE plpgsql;

-- Check each product table
SELECT '=== prod_fiber_connectors ===' as table_info;
SELECT * FROM show_table_columns('prod_fiber_connectors');

SELECT '=== prod_fiber_cables ===' as table_info;
SELECT * FROM show_table_columns('prod_fiber_cables');

SELECT '=== prod_jack_modules ===' as table_info;
SELECT * FROM show_table_columns('prod_jack_modules');

SELECT '=== prod_faceplates ===' as table_info;
SELECT * FROM show_table_columns('prod_faceplates');

SELECT '=== prod_surface_mount_boxes ===' as table_info;
SELECT * FROM show_table_columns('prod_surface_mount_boxes');

SELECT '=== prod_adapter_panels ===' as table_info;
SELECT * FROM show_table_columns('prod_adapter_panels');

SELECT '=== prod_rack_mount_enclosures ===' as table_info;
SELECT * FROM show_table_columns('prod_rack_mount_enclosures');

SELECT '=== prod_wall_mount_enclosures ===' as table_info;
SELECT * FROM show_table_columns('prod_wall_mount_enclosures');

SELECT '=== prod_modular_plugs ===' as table_info;
SELECT * FROM show_table_columns('prod_modular_plugs');

-- Clean up
DROP FUNCTION show_table_columns(text);