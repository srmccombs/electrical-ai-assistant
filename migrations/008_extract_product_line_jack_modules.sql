-- Extract product_line from common_terms JSON to a real column in prod_jack_modules
-- This will improve search performance and make the data structure enterprise-level

BEGIN;

-- Step 1: Add product_line column if it doesn't exist
ALTER TABLE prod_jack_modules 
ADD COLUMN IF NOT EXISTS product_line VARCHAR(100);

-- Step 2: Extract product_line from common_terms JSON
-- The JSON looks like: ["Mini-Com","TX6A 10Gig","Network Connector","product_line:Mini-Com"]
UPDATE prod_jack_modules
SET product_line = 
    CASE 
        -- Extract from JSON array format
        WHEN common_terms::text LIKE '%"product_line:%' THEN
            substring(
                common_terms::text 
                FROM '"product_line:([^"]+)"'
            )
        -- Handle some known patterns
        WHEN brand = 'Panduit' AND common_terms::text LIKE '%Mini-Com%' THEN 'Mini-Com'
        WHEN brand = 'Panduit' AND common_terms::text LIKE '%NetKey%' THEN 'NetKey'
        WHEN brand = 'Leviton' AND common_terms::text LIKE '%eXtreme%' THEN 'eXtreme'
        WHEN brand = 'Leviton' AND common_terms::text LIKE '%QuickPort%' THEN 'QuickPort'
        WHEN common_terms::text LIKE '%Keystone%' THEN 'Keystone'
        ELSE NULL
    END
WHERE product_line IS NULL;

-- Step 3: Show what we extracted
SELECT 
    brand,
    product_line,
    COUNT(*) as count
FROM prod_jack_modules
GROUP BY brand, product_line
ORDER BY brand, product_line;

-- Step 4: For any remaining NULLs, set a default based on brand
UPDATE prod_jack_modules
SET product_line = 
    CASE 
        WHEN brand = 'Panduit' THEN 'Mini-Com'
        WHEN brand = 'Leviton' THEN 'QuickPort'
        WHEN brand = 'Ortronics' THEN 'TracJack'
        WHEN brand = 'Hubbell' THEN 'Xcelerator'
        WHEN brand = 'Belden' THEN 'REVConnect'
        WHEN brand = 'CommScope' THEN 'Uniprise'
        WHEN brand = 'Siemon' THEN 'MAX'
        ELSE 'Keystone'  -- Generic default
    END
WHERE product_line IS NULL;

-- Step 5: Create an index on product_line for faster searches
CREATE INDEX IF NOT EXISTS idx_jack_modules_product_line 
ON prod_jack_modules(product_line);

-- Step 6: Clean up the common_terms to remove the product_line entries
-- This removes the redundant "product_line:xxx" from the JSON
UPDATE prod_jack_modules
SET common_terms = 
    CASE 
        WHEN common_terms IS NOT NULL THEN
            (
                SELECT json_agg(elem)
                FROM json_array_elements_text(common_terms) elem
                WHERE elem NOT LIKE 'product_line:%'
            )
        ELSE common_terms
    END
WHERE common_terms::text LIKE '%product_line:%';

-- Step 7: Show final results
SELECT 'Product line extraction complete!' as status;
SELECT 
    'Total jacks with product_line:' as metric,
    COUNT(*) as count
FROM prod_jack_modules 
WHERE product_line IS NOT NULL

UNION ALL

SELECT 
    'Unique product lines:',
    COUNT(DISTINCT product_line)
FROM prod_jack_modules;

-- Show sample of the data
SELECT 
    part_number,
    brand,
    product_line,
    short_description
FROM prod_jack_modules
LIMIT 10;

COMMIT;