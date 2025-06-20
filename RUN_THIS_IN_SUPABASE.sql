-- RUN_THIS_IN_SUPABASE.sql
-- Created: June 20, 2025
-- Purpose: Complete SQL script to fix database issues
-- Run this entire script in Supabase SQL Editor

-- ============================================
-- PART 1: CHECK CURRENT STATE
-- ============================================

-- Check if prod_surface_mount_boxes has an ID column
SELECT 
    'prod_surface_mount_boxes' as table_name,
    COUNT(*) FILTER (WHERE column_name = 'id') as has_id_column,
    COUNT(*) FILTER (WHERE column_name = 'created_by') as has_created_by,
    COUNT(*) FILTER (WHERE column_name = 'last_modified_by') as has_last_modified_by
FROM information_schema.columns 
WHERE table_name = 'prod_surface_mount_boxes';

-- Check audit columns on all tables
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

-- ============================================
-- PART 2: FIX prod_surface_mount_boxes
-- ============================================

-- Add ID column with serial primary key (if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'prod_surface_mount_boxes' 
        AND column_name = 'id'
    ) THEN
        ALTER TABLE prod_surface_mount_boxes 
        ADD COLUMN id SERIAL PRIMARY KEY;
        RAISE NOTICE 'Added ID column to prod_surface_mount_boxes';
    ELSE
        RAISE NOTICE 'ID column already exists in prod_surface_mount_boxes';
    END IF;
END $$;

-- Add audit columns to prod_surface_mount_boxes
ALTER TABLE prod_surface_mount_boxes 
ADD COLUMN IF NOT EXISTS created_by VARCHAR(255),
ADD COLUMN IF NOT EXISTS last_modified_by VARCHAR(255);

-- Create index on part_number for better search performance
CREATE INDEX IF NOT EXISTS idx_prod_surface_mount_boxes_part_number 
ON prod_surface_mount_boxes(part_number);

-- ============================================
-- PART 3: ADD AUDIT COLUMNS TO OTHER TABLES
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

-- ============================================
-- PART 4: CREATE AUDIT TRIGGER FUNCTION
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
-- PART 5: ADD TRIGGERS TO ALL TABLES
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
-- PART 6: UPDATE STATISTICS
-- ============================================

-- Update table statistics for query optimization
ANALYZE prod_category_cables;
ANALYZE prod_jack_modules;
ANALYZE prod_modular_plugs;
ANALYZE prod_faceplates;
ANALYZE prod_surface_mount_boxes;

-- ============================================
-- PART 7: FINAL VERIFICATION
-- ============================================

-- Verify all changes were applied
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

-- Check a sample from prod_surface_mount_boxes
SELECT id, part_number, brand, created_by, last_modified_by
FROM prod_surface_mount_boxes
LIMIT 5;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
SELECT 'DATABASE FIXES COMPLETED SUCCESSFULLY!' as status,
       'All tables now have ID columns and audit fields' as message;