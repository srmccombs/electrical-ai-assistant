-- FIX_SURFACE_MOUNT_BOXES_TABLE.sql
-- Created: June 20, 2025
-- Purpose: Fix critical issue - prod_surface_mount_boxes has no ID column or primary key

-- Step 1: Check current table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'prod_surface_mount_boxes'
ORDER BY ordinal_position;

-- Step 2: Add ID column with serial primary key
ALTER TABLE prod_surface_mount_boxes 
ADD COLUMN IF NOT EXISTS id SERIAL PRIMARY KEY;

-- Step 3: Add missing audit columns to match other tables
ALTER TABLE prod_surface_mount_boxes 
ADD COLUMN IF NOT EXISTS created_by VARCHAR(255),
ADD COLUMN IF NOT EXISTS last_modified_by VARCHAR(255);

-- Step 4: Convert compatible_jacks from JSON to TEXT[] for consistency
-- First, let's check what data type it currently is
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'prod_surface_mount_boxes' 
AND column_name = 'compatible_jacks';

-- If it's JSON/JSONB, convert to TEXT[]
-- IMPORTANT: Run this ONLY if compatible_jacks is JSON/JSONB type
/*
-- Backup current data first
CREATE TABLE prod_surface_mount_boxes_backup AS 
SELECT * FROM prod_surface_mount_boxes;

-- Update the column type
ALTER TABLE prod_surface_mount_boxes 
ALTER COLUMN compatible_jacks TYPE TEXT[] 
USING CASE 
    WHEN compatible_jacks IS NULL THEN NULL
    WHEN compatible_jacks::text = '[]' THEN '{}'::TEXT[]
    ELSE ARRAY(SELECT jsonb_array_elements_text(compatible_jacks))
END;
*/

-- Step 5: Verify the changes
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'prod_surface_mount_boxes'
ORDER BY ordinal_position;

-- Step 6: Check a few rows to ensure data integrity
SELECT id, part_number, brand, compatible_jacks, created_by, last_modified_by
FROM prod_surface_mount_boxes
LIMIT 5;

-- Step 7: Create index on part_number for better search performance
CREATE INDEX IF NOT EXISTS idx_prod_surface_mount_boxes_part_number 
ON prod_surface_mount_boxes(part_number);

-- Step 8: Update statistics
ANALYZE prod_surface_mount_boxes;