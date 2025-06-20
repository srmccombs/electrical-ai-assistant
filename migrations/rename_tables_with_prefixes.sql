-- Database Table Renaming Script
-- IMPORTANT: Review each section before running!
-- This script renames tables to use a professional prefix system

-- =====================================================
-- STEP 1: BACKUP YOUR DATABASE BEFORE RUNNING THIS!
-- =====================================================

BEGIN;

-- =====================================================
-- PRODUCT TABLES (prod_)
-- =====================================================

-- Core product tables used by search
ALTER TABLE category_cables RENAME TO prod_category_cables;
ALTER TABLE fiber_connectors RENAME TO prod_fiber_connectors;
ALTER TABLE fiber_optic_cable RENAME TO prod_fiber_cables;
ALTER TABLE jack_modules RENAME TO prod_jack_modules;
ALTER TABLE faceplates RENAME TO prod_faceplates;
ALTER TABLE surface_mount_box RENAME TO prod_surface_mount_boxes;
ALTER TABLE adapter_panels RENAME TO prod_adapter_panels;
ALTER TABLE rack_mount_fiber_enclosures RENAME TO prod_rack_mount_enclosures;
ALTER TABLE wall_mount_fiber_enclosures RENAME TO prod_wall_mount_enclosures;
ALTER TABLE modular_plugs RENAME TO prod_modular_plugs;

-- =====================================================
-- SEARCH & AI TABLES (search_)
-- =====================================================

-- Already prefixed correctly:
-- search_analytics (keep as-is)
-- search_feedback (keep as-is)
-- search_decisions_audit (keep as-is)

-- Need renaming:
ALTER TABLE shadow_mode_comparisons RENAME TO search_shadow_comparisons;
ALTER TABLE knowledge_contributions RENAME TO search_knowledge_contrib;
ALTER TABLE regression_tests RENAME TO search_regression_tests;
ALTER TABLE prompts RENAME TO search_ai_prompts;
ALTER TABLE search_variations RENAME TO search_term_variations;

-- =====================================================
-- ANALYTICS TABLES/VIEWS (analytics_)
-- =====================================================

ALTER TABLE performance_baselines RENAME TO analytics_performance;
-- Views will be recreated below

-- =====================================================
-- OPERATIONAL TABLES (ops_)
-- =====================================================

ALTER TABLE branch_locations RENAME TO ops_branch_locations;
ALTER TABLE location_types RENAME TO ops_location_types;
ALTER TABLE manufacturers RENAME TO ops_manufacturers;
ALTER TABLE distributors RENAME TO ops_distributors;
ALTER TABLE distributor_inventory RENAME TO ops_distributor_inventory;
ALTER TABLE mayer_stock RENAME TO ops_mayer_stock;
ALTER TABLE customer_product_lists RENAME TO ops_customer_lists;
ALTER TABLE customer_list_items RENAME TO ops_customer_list_items;
ALTER TABLE selection_sessions RENAME TO ops_selection_sessions;

-- =====================================================
-- DOCUMENTATION TABLES (docs_)
-- =====================================================

ALTER TABLE product_datasheets RENAME TO docs_product_datasheets;
ALTER TABLE product_datasheet_links RENAME TO docs_datasheet_links;

-- =====================================================
-- IMPORT/TEMP TABLES (import_)
-- =====================================================

ALTER TABLE import_batches RENAME TO import_batches_archive;
ALTER TABLE cutsheet_import_temp RENAME TO import_temp_cutsheets;

-- =====================================================
-- UNCERTAIN TABLES (Keep for now, review later)
-- =====================================================

-- These need investigation before deciding
-- products
-- categories
-- product_attributes
-- compatible_products
-- go_with_items

-- =====================================================
-- RECREATE VIEWS WITH NEW TABLE NAMES
-- =====================================================

-- Drop existing views
DROP VIEW IF EXISTS popular_searches CASCADE;
DROP VIEW IF EXISTS search_analytics_summary CASCADE;
DROP VIEW IF EXISTS product_search CASCADE;
DROP VIEW IF EXISTS v_products_complete CASCADE;
DROP VIEW IF EXISTS v_mayer_stock_summary CASCADE;
DROP VIEW IF EXISTS products_without_cutsheets CASCADE;
DROP VIEW IF EXISTS weekly_missing_cutsheets CASCADE;
DROP VIEW IF EXISTS weekly_missing_cutsheets_with_url CASCADE;

-- Recreate analytics views
CREATE OR REPLACE VIEW analytics_popular_searches AS
SELECT 
    search_term,
    COUNT(*) as search_count,
    COUNT(DISTINCT session_id) as unique_sessions,
    AVG(result_count) as avg_results,
    MAX(searched_at) as last_searched
FROM search_analytics
WHERE searched_at > CURRENT_DATE - INTERVAL '30 days'
GROUP BY search_term
HAVING COUNT(*) > 5
ORDER BY search_count DESC
LIMIT 100;

CREATE OR REPLACE VIEW analytics_search_summary AS
SELECT 
    DATE(searched_at) as search_date,
    COUNT(*) as total_searches,
    COUNT(DISTINCT session_id) as unique_sessions,
    COUNT(CASE WHEN result_count = 0 THEN 1 END) as zero_result_searches,
    AVG(search_time_ms) as avg_search_time_ms,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY search_time_ms) as median_search_time_ms
FROM search_analytics
GROUP BY DATE(searched_at)
ORDER BY search_date DESC;

-- Recreate operational views
CREATE OR REPLACE VIEW view_mayer_stock_summary AS
SELECT 
    part_number,
    SUM(quantity_available) as total_quantity,
    COUNT(DISTINCT location) as location_count,
    MAX(last_updated) as last_updated
FROM ops_mayer_stock
GROUP BY part_number;

-- =====================================================
-- UPDATE FOREIGN KEY REFERENCES
-- =====================================================

-- This section would update any foreign key constraints
-- Example (uncomment and modify as needed):
-- ALTER TABLE some_table 
-- DROP CONSTRAINT IF EXISTS fk_category_cables,
-- ADD CONSTRAINT fk_prod_category_cables 
-- FOREIGN KEY (cable_id) REFERENCES prod_category_cables(id);

-- =====================================================
-- CREATE HELPFUL MANAGEMENT VIEWS
-- =====================================================

CREATE OR REPLACE VIEW database_tables_by_prefix AS
SELECT 
    CASE 
        WHEN tablename LIKE 'prod_%' THEN '1. Products'
        WHEN tablename LIKE 'search_%' THEN '2. Search System'
        WHEN tablename LIKE 'analytics_%' THEN '3. Analytics'
        WHEN tablename LIKE 'ops_%' THEN '4. Operations'
        WHEN tablename LIKE 'docs_%' THEN '5. Documentation'
        WHEN tablename LIKE 'import_%' THEN '6. Import/Temp'
        WHEN tablename LIKE 'view_%' THEN '7. Views'
        ELSE '8. Other/Legacy'
    END as category,
    tablename as table_name,
    pg_size_pretty(pg_total_relation_size(tablename::regclass)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY category, tablename;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check renamed tables
SELECT * FROM database_tables_by_prefix;

-- Verify no orphaned tables
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename NOT LIKE 'prod_%'
AND tablename NOT LIKE 'search_%'
AND tablename NOT LIKE 'analytics_%'
AND tablename NOT LIKE 'ops_%'
AND tablename NOT LIKE 'docs_%'
AND tablename NOT LIKE 'import_%'
AND tablename NOT IN ('products', 'categories', 'product_attributes', 'compatible_products', 'go_with_items');

COMMIT;

-- =====================================================
-- ROLLBACK SCRIPT (Save this separately!)
-- =====================================================
/*
BEGIN;

-- Product tables
ALTER TABLE prod_category_cables RENAME TO category_cables;
ALTER TABLE prod_fiber_connectors RENAME TO fiber_connectors;
ALTER TABLE prod_fiber_cables RENAME TO fiber_optic_cable;
ALTER TABLE prod_jack_modules RENAME TO jack_modules;
ALTER TABLE prod_faceplates RENAME TO faceplates;
ALTER TABLE prod_surface_mount_boxes RENAME TO surface_mount_box;
ALTER TABLE prod_adapter_panels RENAME TO adapter_panels;
ALTER TABLE prod_rack_mount_enclosures RENAME TO rack_mount_fiber_enclosures;
ALTER TABLE prod_wall_mount_enclosures RENAME TO wall_mount_fiber_enclosures;
ALTER TABLE prod_modular_plugs RENAME TO modular_plugs;

-- Search tables
ALTER TABLE search_shadow_comparisons RENAME TO shadow_mode_comparisons;
ALTER TABLE search_knowledge_contrib RENAME TO knowledge_contributions;
ALTER TABLE search_regression_tests RENAME TO regression_tests;
ALTER TABLE search_ai_prompts RENAME TO prompts;
ALTER TABLE search_term_variations RENAME TO search_variations;

-- Analytics tables
ALTER TABLE analytics_performance RENAME TO performance_baselines;

-- Operational tables
ALTER TABLE ops_branch_locations RENAME TO branch_locations;
ALTER TABLE ops_location_types RENAME TO location_types;
ALTER TABLE ops_manufacturers RENAME TO manufacturers;
ALTER TABLE ops_distributors RENAME TO distributors;
ALTER TABLE ops_distributor_inventory RENAME TO distributor_inventory;
ALTER TABLE ops_mayer_stock RENAME TO mayer_stock;
ALTER TABLE ops_customer_lists RENAME TO customer_product_lists;
ALTER TABLE ops_customer_list_items RENAME TO customer_list_items;
ALTER TABLE ops_selection_sessions RENAME TO selection_sessions;

-- Documentation tables
ALTER TABLE docs_product_datasheets RENAME TO product_datasheets;
ALTER TABLE docs_datasheet_links RENAME TO product_datasheet_links;

-- Import tables
ALTER TABLE import_batches_archive RENAME TO import_batches;
ALTER TABLE import_temp_cutsheets RENAME TO cutsheet_import_temp;

COMMIT;
*/