-- Comprehensive inspection of all product tables
-- Shows columns and sample data for each table

-- Create a more detailed inspection function
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

-- =====================================================
-- INSPECT EACH PRODUCT TABLE
-- =====================================================

\echo '=========================================='
\echo 'PROD_FIBER_CONNECTORS'
\echo '=========================================='
SELECT * FROM inspect_table_details('prod_fiber_connectors');
\echo 'Sample data (3 rows):'
SELECT * FROM prod_fiber_connectors LIMIT 3;

\echo ''
\echo '=========================================='
\echo 'PROD_FIBER_CABLES'
\echo '=========================================='
SELECT * FROM inspect_table_details('prod_fiber_cables');
\echo 'Sample data (3 rows):'
SELECT * FROM prod_fiber_cables LIMIT 3;

\echo ''
\echo '=========================================='
\echo 'PROD_JACK_MODULES'
\echo '=========================================='
SELECT * FROM inspect_table_details('prod_jack_modules');
\echo 'Sample data (3 rows):'
SELECT * FROM prod_jack_modules LIMIT 3;

\echo ''
\echo '=========================================='
\echo 'PROD_FACEPLATES'
\echo '=========================================='
SELECT * FROM inspect_table_details('prod_faceplates');
\echo 'Sample data (3 rows):'
SELECT * FROM prod_faceplates LIMIT 3;

\echo ''
\echo '=========================================='
\echo 'PROD_SURFACE_MOUNT_BOXES'
\echo '=========================================='
SELECT * FROM inspect_table_details('prod_surface_mount_boxes');
\echo 'Sample data (3 rows):'
SELECT * FROM prod_surface_mount_boxes LIMIT 3;

\echo ''
\echo '=========================================='
\echo 'PROD_ADAPTER_PANELS'
\echo '=========================================='
SELECT * FROM inspect_table_details('prod_adapter_panels');
\echo 'Sample data (3 rows):'
SELECT * FROM prod_adapter_panels LIMIT 3;

\echo ''
\echo '=========================================='
\echo 'PROD_RACK_MOUNT_ENCLOSURES'
\echo '=========================================='
SELECT * FROM inspect_table_details('prod_rack_mount_enclosures');
\echo 'Sample data (3 rows):'
SELECT * FROM prod_rack_mount_enclosures LIMIT 3;

\echo ''
\echo '=========================================='
\echo 'PROD_WALL_MOUNT_ENCLOSURES'
\echo '=========================================='
SELECT * FROM inspect_table_details('prod_wall_mount_enclosures');
\echo 'Sample data (3 rows):'
SELECT * FROM prod_wall_mount_enclosures LIMIT 3;

\echo ''
\echo '=========================================='
\echo 'PROD_MODULAR_PLUGS'
\echo '=========================================='
SELECT * FROM inspect_table_details('prod_modular_plugs');
\echo 'Sample data (3 rows):'
SELECT * FROM prod_modular_plugs LIMIT 3;

\echo ''
\echo '=========================================='
\echo 'PROD_CATEGORY_CABLES (for comparison)'
\echo '=========================================='
SELECT * FROM inspect_table_details('prod_category_cables');
\echo 'Sample data (3 rows):'
SELECT * FROM prod_category_cables LIMIT 3;

-- Show summary of search columns
\echo ''
\echo '=========================================='
\echo 'SEARCH COLUMN STATUS SUMMARY'
\echo '=========================================='
SELECT 
    table_name,
    MAX(CASE WHEN column_name = 'computed_search_terms' THEN 'YES' ELSE 'NO' END) as has_computed_search_terms,
    MAX(CASE WHEN column_name = 'search_vector' THEN 'YES' ELSE 'NO' END) as has_search_vector,
    MAX(CASE WHEN column_name = 'common_terms' THEN 'YES' ELSE 'NO' END) as has_common_terms,
    COUNT(*) as total_columns
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name LIKE 'prod_%'
GROUP BY table_name
ORDER BY table_name;

-- Clean up
DROP FUNCTION inspect_table_details(text);