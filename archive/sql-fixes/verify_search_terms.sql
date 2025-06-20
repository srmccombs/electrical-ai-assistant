-- Verify search terms and data
-- Created: June 19, 2025

-- 1. Check modular plugs descriptions
SELECT 
    'Modular Plugs with RJ45 in description' as check_name,
    COUNT(*) as count
FROM modular_plugs
WHERE is_active = true
  AND (short_description ILIKE '%RJ45%' OR short_description ILIKE '%RJ-45%');

-- 2. Show sample modular plug descriptions
SELECT 
    part_number,
    brand,
    short_description
FROM modular_plugs
WHERE is_active = true
LIMIT 10;

-- 3. Check jack modules that might be confused
SELECT 
    'Jack Modules with plug in description' as check_name,
    COUNT(*) as count
FROM jack_modules
WHERE is_active = true
  AND short_description ILIKE '%plug%';

-- 4. Test the exact search that would be performed
SELECT 
    part_number,
    brand,
    short_description
FROM modular_plugs
WHERE is_active = true
  AND (
    short_description ILIKE '%RJ45%' OR
    short_description ILIKE '%RJ-45%' OR
    short_description ILIKE '%plug%' OR
    short_description ILIKE '%Plug%' OR
    short_description ILIKE '%modular%'
  )
ORDER BY brand, part_number;