-- Debug modular_plugs search issue

-- 1. Check what's actually in the table
SELECT 
    COUNT(*) as total_records,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_records,
    COUNT(CASE WHEN is_active = false THEN 1 END) as inactive_records,
    COUNT(CASE WHEN is_active IS NULL THEN 1 END) as null_active_records
FROM modular_plugs;

-- 2. Check if common_terms was populated
SELECT 
    COUNT(*) as total,
    COUNT(common_terms) as with_common_terms,
    COUNT(CASE WHEN common_terms = '' THEN 1 END) as empty_common_terms,
    COUNT(CASE WHEN common_terms IS NULL THEN 1 END) as null_common_terms
FROM modular_plugs
WHERE is_active = true;

-- 3. Show sample data
SELECT 
    part_number,
    brand,
    short_description,
    is_active,
    common_terms,
    category
FROM modular_plugs
LIMIT 5;

-- 4. Test the exact query that should work
SELECT COUNT(*) as should_find_these
FROM modular_plugs
WHERE is_active = true
ORDER BY brand, part_number
LIMIT 50;

-- 5. Check for any weird data issues
SELECT DISTINCT is_active, COUNT(*)
FROM modular_plugs
GROUP BY is_active;