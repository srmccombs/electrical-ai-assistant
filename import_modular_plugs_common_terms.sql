-- Import Common Terms for Modular Plugs from CSV
-- Created: June 18, 2025
-- Use this after importing the CSV files with updated common_terms

-- First, create a temporary table to hold the CSV data
CREATE TEMP TABLE temp_modular_plugs_update (
    part_number VARCHAR(100),
    brand VARCHAR(100),
    short_description TEXT,
    common_terms TEXT
);

-- Import your CSV data into the temp table using Supabase Table Editor
-- 1. Go to SQL Editor
-- 2. Create the temp table above
-- 3. Use Table Editor to import CSV into temp_modular_plugs_update

-- After importing, update the main table
UPDATE modular_plugs mp
SET common_terms = tmu.common_terms
FROM temp_modular_plugs_update tmu
WHERE mp.part_number = tmu.part_number
  AND mp.is_active = true;

-- Verify the update
SELECT 
    mp.part_number,
    mp.brand,
    mp.short_description,
    LENGTH(mp.common_terms) as terms_length,
    mp.common_terms
FROM modular_plugs mp
WHERE mp.is_active = true
ORDER BY mp.part_number
LIMIT 10;

-- Check search capability after update
SELECT 'Total Active Products' as metric, COUNT(*) as count
FROM modular_plugs
WHERE is_active = true
UNION ALL
SELECT 'Products with common_terms', COUNT(*)
FROM modular_plugs
WHERE is_active = true AND common_terms IS NOT NULL AND common_terms != ''
UNION ALL
SELECT 'RJ45 searchable', COUNT(*)
FROM modular_plugs
WHERE is_active = true AND common_terms ILIKE '%rj45%'
UNION ALL
SELECT 'Modular plug searchable', COUNT(*)
FROM modular_plugs
WHERE is_active = true AND common_terms ILIKE '%modular plug%'
UNION ALL
SELECT 'Crimp searchable', COUNT(*)
FROM modular_plugs
WHERE is_active = true AND common_terms ILIKE '%crimp%';

-- Clean up
DROP TABLE IF EXISTS temp_modular_plugs_update;