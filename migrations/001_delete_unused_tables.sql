-- STEP 1: Delete Unused Tables
-- Run this FIRST before renaming tables
-- This deletes tables we identified as unused or redundant

BEGIN;

-- Show what we're about to delete (for confirmation)
SELECT 'Deleting unused tables...' as status;

-- Delete temporary/import tables
DROP TABLE IF EXISTS cutsheet_import_temp CASCADE;
DROP TABLE IF EXISTS product_attributes CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS compatible_products CASCADE;

-- Delete tables under investigation (as requested)
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS go_with_items CASCADE;
DROP TABLE IF EXISTS customer_product_lists CASCADE;
DROP TABLE IF EXISTS customer_list_items CASCADE;
DROP TABLE IF EXISTS distributor_inventory CASCADE;
DROP TABLE IF EXISTS prompts CASCADE;

-- Show what tables remain
SELECT 'Remaining tables after cleanup:' as status;
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;

COMMIT;

-- If something goes wrong, you can run: ROLLBACK;