-- CHECK_FIBER_CABLES.sql
-- Purpose: Debug why "500ft of OM4" returns 0 results

-- 1. Check what fiber types we have in prod_fiber_cables
SELECT 
    fiber_types,
    COUNT(*) as count
FROM prod_fiber_cables
WHERE is_active = true
GROUP BY fiber_types
ORDER BY count DESC;

-- 2. Check if any cables contain 'OM4' in any field
SELECT 
    part_number,
    brand,
    short_description,
    fiber_types,
    common_terms
FROM prod_fiber_cables
WHERE is_active = true
AND (
    fiber_types::text ILIKE '%OM4%' OR
    short_description ILIKE '%OM4%' OR
    common_terms ILIKE '%OM4%' OR
    part_number ILIKE '%OM4%'
);

-- 3. Show all fiber cables to see what we have
SELECT 
    id,
    part_number,
    brand,
    short_description,
    fiber_types,
    is_active
FROM prod_fiber_cables
ORDER BY fiber_types, brand;

-- 4. Check if search_terms has OM4 mappings
SELECT * FROM search_terms 
WHERE search_term ILIKE '%OM4%' 
OR redirect_to ILIKE '%OM4%';

-- 5. Check the search vectors
SELECT 
    part_number,
    short_description,
    computed_search_terms
FROM prod_fiber_cables
WHERE computed_search_terms ILIKE '%om4%'
OR search_vector::text ILIKE '%om4%';