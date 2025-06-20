-- STEP 2: Rename Tables with Prefixes
-- Run this AFTER deleting unused tables
-- This renames all your tables to use the prefix system

BEGIN;

-- =====================================================
-- PRODUCT TABLES (prod_)
-- =====================================================
SELECT 'Renaming product tables...' as status;

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
SELECT 'Renaming search tables...' as status;

-- These are already named correctly, so we skip them:
-- search_analytics (keep as-is)
-- search_feedback (keep as-is)
-- search_decisions_audit (keep as-is)

-- These need renaming:
ALTER TABLE shadow_mode_comparisons RENAME TO search_shadow_comparisons;
ALTER TABLE knowledge_contributions RENAME TO search_knowledge_contrib;
ALTER TABLE regression_tests RENAME TO search_regression_tests;
ALTER TABLE search_variations RENAME TO search_term_variations;

-- =====================================================
-- ANALYTICS TABLES (analytics_)
-- =====================================================
SELECT 'Renaming analytics tables...' as status;

ALTER TABLE performance_baselines RENAME TO analytics_performance;

-- =====================================================
-- OPERATIONAL TABLES (ops_)
-- =====================================================
SELECT 'Renaming operational tables...' as status;

ALTER TABLE branch_locations RENAME TO ops_branch_locations;
ALTER TABLE location_types RENAME TO ops_location_types;
ALTER TABLE manufacturers RENAME TO ops_manufacturers;
ALTER TABLE distributors RENAME TO ops_distributors;
ALTER TABLE mayer_stock RENAME TO ops_mayer_stock;
ALTER TABLE selection_sessions RENAME TO ops_selection_sessions;

-- =====================================================
-- DOCUMENTATION TABLES (docs_)
-- =====================================================
SELECT 'Renaming documentation tables...' as status;

ALTER TABLE product_datasheets RENAME TO docs_product_datasheets;
ALTER TABLE product_datasheet_links RENAME TO docs_datasheet_links;

-- =====================================================
-- IMPORT TABLES (import_)
-- =====================================================
SELECT 'Renaming import tables...' as status;

ALTER TABLE import_batches RENAME TO import_batches_history;

-- =====================================================
-- SHOW FINAL RESULT
-- =====================================================
SELECT 'Table renaming complete! Here are your renamed tables:' as status;

SELECT 
    CASE 
        WHEN tablename LIKE 'prod_%' THEN '1. Products'
        WHEN tablename LIKE 'search_%' THEN '2. Search System'
        WHEN tablename LIKE 'analytics_%' THEN '3. Analytics'
        WHEN tablename LIKE 'ops_%' THEN '4. Operations'
        WHEN tablename LIKE 'docs_%' THEN '5. Documentation'
        WHEN tablename LIKE 'import_%' THEN '6. Import/Temp'
        ELSE '7. Other'
    END as category,
    tablename as table_name
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY category, tablename;

COMMIT;

-- If something goes wrong, you can run: ROLLBACK;