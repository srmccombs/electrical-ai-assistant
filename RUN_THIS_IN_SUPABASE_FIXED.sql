-- RUN_THIS_IN_SUPABASE_FIXED.sql
-- Created: June 20, 2025
-- Purpose: Complete SQL script to fix database issues (handles existing primary key)
-- Run this entire script in Supabase SQL Editor

-- ============================================
-- PART 1: CHECK CURRENT STATE
-- ============================================

-- Check current primary key and columns
SELECT 
    c.column_name,
    c.data_type,
    CASE WHEN pk.column_name IS NOT NULL THEN 'YES' ELSE 'NO' END as is_primary_key
FROM information_schema.columns c
LEFT JOIN (
    SELECT ku.column_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage ku
        ON tc.constraint_name = ku.constraint_name
    WHERE tc.table_name = 'prod_surface_mount_boxes'
    AND tc.constraint_type = 'PRIMARY KEY'
) pk ON c.column_name = pk.column_name
WHERE c.table_name = 'prod_surface_mount_boxes'
ORDER BY c.ordinal_position;

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

-- First check if 'id' column exists, if not we need to add it
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'prod_surface_mount_boxes' 
        AND column_name = 'id'
    ) THEN
        -- Add id column without primary key first
        ALTER TABLE prod_surface_mount_boxes 
        ADD COLUMN id SERIAL;
        
        -- Now check if we need to drop existing primary key
        IF EXISTS (
            SELECT 1 FROM information_schema.table_constraints
            WHERE table_name = 'prod_surface_mount_boxes'
            AND constraint_type = 'PRIMARY KEY'
        ) THEN
            -- Get the constraint name
            DECLARE
                v_constraint_name TEXT;
            BEGIN
                SELECT constraint_name INTO v_constraint_name
                FROM information_schema.table_constraints
                WHERE table_name = 'prod_surface_mount_boxes'
                AND constraint_type = 'PRIMARY KEY';
                
                -- Drop the existing primary key
                EXECUTE format('ALTER TABLE prod_surface_mount_boxes DROP CONSTRAINT %I', v_constraint_name);
                RAISE NOTICE 'Dropped existing primary key constraint: %', v_constraint_name;
            END;
        END IF;
        
        -- Add primary key on id column
        ALTER TABLE prod_surface_mount_boxes 
        ADD PRIMARY KEY (id);
        
        RAISE NOTICE 'Added ID column as primary key to prod_surface_mount_boxes';
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

-- Show primary key information
SELECT 
    tc.table_name,
    kcu.column_name as primary_key_column,
    c.data_type
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.columns c
    ON c.table_name = tc.table_name AND c.column_name = kcu.column_name
WHERE tc.table_name IN (
    'prod_category_cables',
    'prod_jack_modules',
    'prod_modular_plugs',
    'prod_faceplates',
    'prod_surface_mount_boxes'
)
AND tc.constraint_type = 'PRIMARY KEY'
ORDER BY tc.table_name;

-- Verify all audit columns were added
SELECT 
    table_name,
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
SELECT 
    CASE 
        WHEN id IS NOT NULL THEN 'ID exists' 
        ELSE 'ID missing' 
    END as id_status,
    part_number, 
    brand, 
    created_by, 
    last_modified_by
FROM prod_surface_mount_boxes
LIMIT 5;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
SELECT 'DATABASE FIXES COMPLETED SUCCESSFULLY!' as status,
       'All tables now have proper primary keys and audit fields' as message;