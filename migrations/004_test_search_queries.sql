-- Test queries for the new database-driven search implementation

-- 1. Simple search for "cat6"
SELECT part_number, category, jacket, shielding, brand, description
FROM prod_category_cables
WHERE search_vector @@ plainto_tsquery('english', 'cat6')
LIMIT 10;

-- 2. Search for "cat6 plenum"
SELECT part_number, category, jacket, shielding, brand, description
FROM prod_category_cables
WHERE search_vector @@ plainto_tsquery('english', 'cat6 plenum')
LIMIT 10;

-- 3. Search for "shielded cat6a"
SELECT part_number, category, jacket, shielding, brand, description
FROM prod_category_cables
WHERE search_vector @@ plainto_tsquery('english', 'shielded cat6a')
LIMIT 10;

-- 4. Search with misspelling "cate6"
SELECT part_number, category, jacket, shielding, brand, description
FROM prod_category_cables
WHERE search_vector @@ plainto_tsquery('english', 'cate6')
LIMIT 10;

-- 5. Search for generic term "ethernet cable"
SELECT part_number, category, jacket, shielding, brand, description
FROM prod_category_cables
WHERE search_vector @@ plainto_tsquery('english', 'ethernet cable')
LIMIT 10;

-- 6. Performance comparison - old method vs new method
-- (This is a conceptual comparison - the old method would be in TypeScript)

-- New method (fast):
EXPLAIN ANALYZE
SELECT part_number, category, jacket, shielding, brand, description
FROM prod_category_cables
WHERE search_vector @@ plainto_tsquery('english', 'cat6 plenum shielded')
LIMIT 50;

-- 7. Check search terms for a specific cable
SELECT 
    part_number,
    computed_search_terms
FROM prod_category_cables
WHERE part_number = 'YOUR_PART_NUMBER_HERE'
LIMIT 1;

-- 8. Verify search_terms table content
SELECT * FROM search_terms 
WHERE 'prod_category_cables' = ANY(applicable_tables)
ORDER BY term_group, search_term
LIMIT 20;

-- 9. Count cables by category with search
SELECT 
    category,
    COUNT(*) as count
FROM prod_category_cables
WHERE search_vector @@ plainto_tsquery('english', 'shielded')
GROUP BY category
ORDER BY count DESC;

-- 10. Complex search with ranking
SELECT 
    part_number,
    category,
    jacket,
    shielding,
    brand,
    ts_rank(search_vector, plainto_tsquery('english', 'cat6a plenum shielded')) as rank
FROM prod_category_cables
WHERE search_vector @@ plainto_tsquery('english', 'cat6a plenum shielded')
ORDER BY rank DESC
LIMIT 20;