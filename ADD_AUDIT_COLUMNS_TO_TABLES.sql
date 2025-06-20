-- ADD_AUDIT_COLUMNS_TO_TABLES.sql
-- Created: June 20, 2025
-- Purpose: Add audit columns (created_by, last_modified_by) to 5 tables missing them

-- Based on check-database-state-simple.js results, these tables need audit columns:
-- 1. prod_category_cables
-- 2. prod_jack_modules  
-- 3. prod_modular_plugs
-- 4. prod_faceplates
-- 5. prod_surface_mount_boxes (handled in separate script)

-- Step 1: Add audit columns to prod_category_cables
ALTER TABLE prod_category_cables 
ADD COLUMN IF NOT EXISTS created_by VARCHAR(255),
ADD COLUMN IF NOT EXISTS last_modified_by VARCHAR(255);

-- Step 2: Add audit columns to prod_jack_modules
ALTER TABLE prod_jack_modules 
ADD COLUMN IF NOT EXISTS created_by VARCHAR(255),
ADD COLUMN IF NOT EXISTS last_modified_by VARCHAR(255);

-- Step 3: Add audit columns to prod_modular_plugs
ALTER TABLE prod_modular_plugs 
ADD COLUMN IF NOT EXISTS created_by VARCHAR(255),
ADD COLUMN IF NOT EXISTS last_modified_by VARCHAR(255);

-- Step 4: Add audit columns to prod_faceplates
ALTER TABLE prod_faceplates 
ADD COLUMN IF NOT EXISTS created_by VARCHAR(255),
ADD COLUMN IF NOT EXISTS last_modified_by VARCHAR(255);

-- Note: prod_surface_mount_boxes is handled in FIX_SURFACE_MOUNT_BOXES_TABLE.sql

-- Step 5: Verify all tables now have audit columns
SELECT 
    table_name,
    COUNT(CASE WHEN column_name = 'created_by' THEN 1 END) as has_created_by,
    COUNT(CASE WHEN column_name = 'last_modified_by' THEN 1 END) as has_last_modified_by
FROM information_schema.columns
WHERE table_name IN (
    'prod_category_cables',
    'prod_jack_modules',
    'prod_modular_plugs',
    'prod_faceplates',
    'prod_surface_mount_boxes'
)
GROUP BY table_name
ORDER BY table_name;

-- Step 6: Set default values for existing rows (optional)
-- This sets 'system' as the creator for all existing records
/*
UPDATE prod_category_cables 
SET created_by = 'system', last_modified_by = 'system' 
WHERE created_by IS NULL;

UPDATE prod_jack_modules 
SET created_by = 'system', last_modified_by = 'system' 
WHERE created_by IS NULL;

UPDATE prod_modular_plugs 
SET created_by = 'system', last_modified_by = 'system' 
WHERE created_by IS NULL;

UPDATE prod_faceplates 
SET created_by = 'system', last_modified_by = 'system' 
WHERE created_by IS NULL;
*/

-- Step 7: Create audit trigger function (if it doesn't exist)
CREATE OR REPLACE FUNCTION update_last_modified_by()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_modified_by = COALESCE(current_setting('app.current_user', true), 'system');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 8: Add triggers to automatically update last_modified_by
DROP TRIGGER IF EXISTS update_prod_category_cables_modified ON prod_category_cables;
CREATE TRIGGER update_prod_category_cables_modified
BEFORE UPDATE ON prod_category_cables
FOR EACH ROW EXECUTE FUNCTION update_last_modified_by();

DROP TRIGGER IF EXISTS update_prod_jack_modules_modified ON prod_jack_modules;
CREATE TRIGGER update_prod_jack_modules_modified
BEFORE UPDATE ON prod_jack_modules
FOR EACH ROW EXECUTE FUNCTION update_last_modified_by();

DROP TRIGGER IF EXISTS update_prod_modular_plugs_modified ON prod_modular_plugs;
CREATE TRIGGER update_prod_modular_plugs_modified
BEFORE UPDATE ON prod_modular_plugs
FOR EACH ROW EXECUTE FUNCTION update_last_modified_by();

DROP TRIGGER IF EXISTS update_prod_faceplates_modified ON prod_faceplates;
CREATE TRIGGER update_prod_faceplates_modified
BEFORE UPDATE ON prod_faceplates
FOR EACH ROW EXECUTE FUNCTION update_last_modified_by();

DROP TRIGGER IF EXISTS update_prod_surface_mount_boxes_modified ON prod_surface_mount_boxes;
CREATE TRIGGER update_prod_surface_mount_boxes_modified
BEFORE UPDATE ON prod_surface_mount_boxes
FOR EACH ROW EXECUTE FUNCTION update_last_modified_by();