-- Database Organization Script for Supabase
-- This creates a professional schema structure for enterprise management

-- Step 1: Create schemas for logical organization
CREATE SCHEMA IF NOT EXISTS products;
CREATE SCHEMA IF NOT EXISTS search;
CREATE SCHEMA IF NOT EXISTS analytics;
CREATE SCHEMA IF NOT EXISTS operations;

-- Step 2: Set search path to include all schemas
ALTER DATABASE postgres SET search_path TO public, products, search, analytics, operations;

-- Step 3: Create comments for documentation
COMMENT ON SCHEMA products IS 'Product catalog tables - cables, connectors, etc.';
COMMENT ON SCHEMA search IS 'Search optimization - terms, indexes, caching';
COMMENT ON SCHEMA analytics IS 'Analytics and reporting tables';
COMMENT ON SCHEMA operations IS 'Operational data - orders, inventory, customers';

-- Step 4: Move existing tables to appropriate schemas (if desired)
-- Example (uncomment to use):
-- ALTER TABLE category_cables SET SCHEMA products;
-- ALTER TABLE fiber_connectors SET SCHEMA products;
-- ALTER TABLE search_terms SET SCHEMA search;
-- ALTER TABLE search_analytics SET SCHEMA analytics;

-- Step 5: Create a management view
CREATE OR REPLACE VIEW public.database_organization AS
SELECT 
    n.nspname as schema_name,
    c.relname as table_name,
    pg_size_pretty(pg_total_relation_size(c.oid)) as total_size,
    obj_description(c.oid, 'pg_class') as table_comment,
    CASE 
        WHEN c.relname LIKE '%cable%' THEN 'Product - Cables'
        WHEN c.relname LIKE '%connector%' THEN 'Product - Connectors'
        WHEN c.relname LIKE '%jack%' OR c.relname LIKE '%faceplate%' THEN 'Product - Datacom'
        WHEN c.relname LIKE '%search%' THEN 'Search System'
        WHEN c.relname LIKE '%analytics%' THEN 'Analytics'
        ELSE 'Other'
    END as category
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE c.relkind = 'r'
    AND n.nspname NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
ORDER BY schema_name, category, table_name;

-- Step 6: Create helper functions for table management
CREATE OR REPLACE FUNCTION list_tables_by_category(p_category TEXT DEFAULT NULL)
RETURNS TABLE(
    schema_name TEXT,
    table_name TEXT,
    row_count BIGINT,
    size TEXT,
    category TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        do.schema_name::TEXT,
        do.table_name::TEXT,
        (SELECT COUNT(*) FROM regclass(do.schema_name||'.'||do.table_name))::BIGINT as row_count,
        do.total_size::TEXT,
        do.category::TEXT
    FROM database_organization do
    WHERE p_category IS NULL OR do.category = p_category
    ORDER BY do.category, do.table_name;
END;
$$ LANGUAGE plpgsql;

-- Usage examples:
-- SELECT * FROM list_tables_by_category('Product - Cables');
-- SELECT * FROM list_tables_by_category('Search System');
-- SELECT * FROM database_organization;