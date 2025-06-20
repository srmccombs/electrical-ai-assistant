-- Quick check to see if modular_plugs needs any work
-- Run this before migration 009

SELECT 
    'Checking prod_modular_plugs product_line status...' as info;

-- Check if product_line column exists
SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN 'YES - product_line column exists'
        ELSE 'NO - product_line column missing'
    END as column_exists
FROM information_schema.columns 
WHERE table_name = 'prod_modular_plugs' 
AND column_name = 'product_line';

-- Check product_line values
SELECT 
    'Product lines in prod_modular_plugs:' as info,
    product_line,
    COUNT(*) as count
FROM prod_modular_plugs
GROUP BY product_line
ORDER BY product_line;

-- Check for any NULLs
SELECT 
    'Products with NULL product_line:' as info,
    COUNT(*) as null_count
FROM prod_modular_plugs
WHERE product_line IS NULL;

-- Sample data
SELECT 
    'Sample products:' as info;
    
SELECT 
    part_number,
    brand,
    product_line
FROM prod_modular_plugs
LIMIT 5;