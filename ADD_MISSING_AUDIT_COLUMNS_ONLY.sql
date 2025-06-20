-- ADD_MISSING_AUDIT_COLUMNS_ONLY.sql
-- Created: June 20, 2025
-- Purpose: Add audit columns only to tables that need them
-- prod_surface_mount_boxes already has everything!

-- ============================================
-- PART 1: CHECK CURRENT STATE
-- ============================================

-- Check which tables need audit columns
SELECT 
    table_name,
    COUNT(CASE WHEN column_name = 'id' THEN 1 END) as has_id,
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

-- ============================================
-- PART 2: ADD AUDIT COLUMNS TO TABLES THAT NEED THEM
-- ============================================

-- Add audit columns to prod_category_cables
ALTER TABLE prod_category_cables 
ADD COLUMN IF NOT EXISTS created_by VARCHAR(255),
ADD COLUMN IF NOT EXISTS last_modified_by VARCHAR(255);

-- Add audit columns to prod_jack_modules
ALTER TABLE prod_jack_modules 
ADD COLUMN IF NOT EXISTS created_by VARCHAR(255),
ADD COLUMN IF NOT EXISTS last_modified_by VARCHAR(255);

-- Add audit columns to prod_modular_plugs
ALTER TABLE prod_modular_plugs 
ADD COLUMN IF NOT EXISTS created_by VARCHAR(255),
ADD COLUMN IF NOT EXISTS last_modified_by VARCHAR(255);

-- Add audit columns to prod_faceplates
ALTER TABLE prod_faceplates 
ADD COLUMN IF NOT EXISTS created_by VARCHAR(255),
ADD COLUMN IF NOT EXISTS last_modified_by VARCHAR(255);

-- Note: prod_surface_mount_boxes already has these columns!

-- ============================================
-- PART 3: CREATE AUDIT TRIGGER FUNCTION
-- ============================================

-- Create or replace the audit trigger function
CREATE OR REPLACE FUNCTION update_last_modified_by()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_modified_by = COALESCE(current_setting('app.current_user', true), 'system');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- PART 4: ADD TRIGGERS TO ALL TABLES
-- ============================================

-- Add triggers for automatic last_modified_by updates
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

-- ============================================
-- PART 5: UPDATE STATISTICS
-- ============================================

-- Update table statistics for query optimization
ANALYZE prod_category_cables;
ANALYZE prod_jack_modules;
ANALYZE prod_modular_plugs;
ANALYZE prod_faceplates;
ANALYZE prod_surface_mount_boxes;

-- ============================================
-- PART 6: FINAL VERIFICATION
-- ============================================

-- Verify all audit columns were added
SELECT 
    table_name,
    COUNT(CASE WHEN column_name = 'id' THEN 1 END) as has_id,
    COUNT(CASE WHEN column_name = 'created_by' THEN 1 END) as has_created_by,
    COUNT(CASE WHEN column_name = 'last_modified_by' THEN 1 END) as has_last_modified_by,
    COUNT(*) as total_columns
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

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
SELECT '✅ DATABASE FIXES COMPLETED!' as status,
       'prod_surface_mount_boxes already had all required columns' as note1,
       'Audit columns added to other 4 tables' as note2,
       'All triggers created successfully' as note3;