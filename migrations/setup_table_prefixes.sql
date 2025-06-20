-- Simple Prefix-Based Organization for Supabase
-- This approach requires no code changes and works immediately

-- Step 1: Create a view to see your current table organization
CREATE OR REPLACE VIEW table_organization AS
WITH table_categories AS (
    SELECT 
        tablename,
        CASE 
            -- Product tables
            WHEN tablename IN ('category_cables', 'fiber_cables', 'fiber_connectors', 
                             'jack_modules', 'faceplates', 'surface_mount_box',
                             'adapter_panels', 'rack_mount_fiber_enclosures', 
                             'wall_mount_fiber_enclosures', 'modular_plugs') 
            THEN '1. Products'
            
            -- Search tables
            WHEN tablename LIKE '%search%' OR tablename = 'search_terms'
            THEN '2. Search System'
            
            -- Analytics tables
            WHEN tablename LIKE '%analytics%' OR tablename IN ('popular_searches', 'user_feedback')
            THEN '3. Analytics'
            
            -- Decision Engine / AI tables
            WHEN tablename LIKE '%decision%' OR tablename LIKE '%knowledge%'
            THEN '4. AI/Decision Engine'
            
            -- System tables
            WHEN tablename LIKE 'pg_%' OR tablename LIKE '_pg%'
            THEN '5. System'
            
            ELSE '6. Other'
        END as category,
        pg_size_pretty(pg_total_relation_size(tablename::regclass)) as size
    FROM pg_tables
    WHERE schemaname = 'public'
)
SELECT 
    category,
    tablename as table_name,
    size,
    CASE category
        WHEN '1. Products' THEN 'prod_' || tablename
        WHEN '2. Search System' THEN 'search_' || regexp_replace(tablename, '^search_', '')
        WHEN '3. Analytics' THEN 'analytics_' || regexp_replace(tablename, '^.*analytics', '')
        WHEN '4. AI/Decision Engine' THEN 'ai_' || tablename
        ELSE tablename
    END as suggested_new_name
FROM table_categories
ORDER BY category, tablename;

-- View your current organization
SELECT * FROM table_organization;

-- Step 2: Generate rename commands (DON'T RUN AUTOMATICALLY - REVIEW FIRST!)
SELECT 
    'ALTER TABLE ' || table_name || ' RENAME TO ' || suggested_new_name || ';' as rename_command
FROM table_organization
WHERE category IN ('1. Products', '2. Search System', '3. Analytics')
    AND table_name != suggested_new_name;

-- Step 3: Create helpful views for each category
CREATE OR REPLACE VIEW product_tables AS
SELECT tablename, pg_size_pretty(pg_total_relation_size(tablename::regclass)) as size
FROM pg_tables
WHERE schemaname = 'public' 
    AND tablename LIKE 'prod_%'
ORDER BY tablename;

CREATE OR REPLACE VIEW search_tables AS
SELECT tablename, pg_size_pretty(pg_total_relation_size(tablename::regclass)) as size
FROM pg_tables
WHERE schemaname = 'public' 
    AND tablename LIKE 'search_%'
ORDER BY tablename;

CREATE OR REPLACE VIEW analytics_tables AS
SELECT tablename, pg_size_pretty(pg_total_relation_size(tablename::regclass)) as size
FROM pg_tables
WHERE schemaname = 'public' 
    AND tablename LIKE 'analytics_%'
ORDER BY tablename;