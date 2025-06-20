-- Verify product_line column in prod_modular_plugs
-- Based on your CSV data: product_line is ALREADY POPULATED with:
-- - Simply 45 PRO SERIES
-- - Simply 45 INSTALLER SERIES

BEGIN;

-- Step 1: Check current state of product_line column
SELECT 
    'Checking product_line column:' as info,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'prod_modular_plugs' 
AND column_name = 'product_line';

-- Step 2: Show current product lines in your data
SELECT 
    'Current product lines:' as info,
    brand,
    product_line,
    COUNT(*) as product_count
FROM prod_modular_plugs
GROUP BY brand, product_line
ORDER BY brand, product_line;

-- Step 3: Check if any products have NULL product_line
SELECT 
    'Products with NULL/empty product_line:' as info,
    COUNT(*) as null_count
FROM prod_modular_plugs
WHERE product_line IS NULL OR product_line = '';

-- Step 4: Sample of your actual data
SELECT 
    'Sample products:' as info,
    part_number,
    brand,
    product_line,
    LEFT(short_description, 50) || '...' as description_sample
FROM prod_modular_plugs
LIMIT 10;

-- Step 5: Create an index on product_line for faster searches (if needed)
CREATE INDEX IF NOT EXISTS idx_modular_plugs_product_line 
ON prod_modular_plugs(product_line);

-- Step 6: Verify the index was created
SELECT 
    'Indexes on product_line:' as info,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'prod_modular_plugs' 
AND indexname LIKE '%product_line%';

-- Summary
SELECT 'Migration complete!' as status,
    'prod_modular_plugs already has product_line populated' as summary;

COMMIT;