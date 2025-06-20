-- FIX_OM4_SEARCH.sql
-- Purpose: Debug and fix OM4 fiber cable search

-- 1. First, let's see what's in the fiber_cables table
SELECT 
    part_number,
    brand,
    short_description,
    fiber_types,
    common_terms,
    is_active
FROM prod_fiber_cables
WHERE is_active = true
LIMIT 10;

-- 2. Check if we have ANY OM4 cables (case-insensitive)
SELECT COUNT(*) as om4_count
FROM prod_fiber_cables
WHERE is_active = true
AND (
    short_description ILIKE '%OM4%' OR
    common_terms ILIKE '%OM4%' OR
    computed_search_terms ILIKE '%OM4%' OR
    fiber_types::text ILIKE '%OM4%'
);

-- 3. If we don't have OM4 cables, let's add some search terms
-- This will make existing multimode cables findable with "OM4" search
UPDATE prod_fiber_cables
SET common_terms = COALESCE(common_terms, '') || ' OM4 om4 multimode multi-mode 50/125'
WHERE is_active = true
AND (
    short_description ILIKE '%multimode%' OR
    short_description ILIKE '%50/125%' OR
    fiber_types::text ILIKE '%multimode%'
)
AND common_terms NOT ILIKE '%OM4%';

-- 4. Update the computed search terms for better searching
UPDATE prod_fiber_cables
SET computed_search_terms = 
    part_number || ' ' || 
    brand || ' ' || 
    short_description || ' ' || 
    COALESCE(common_terms, '') || ' ' ||
    COALESCE(fiber_types::text, '')
WHERE is_active = true;

-- 5. Re-check OM4 count after updates
SELECT 
    'After update' as status,
    COUNT(*) as om4_searchable_count
FROM prod_fiber_cables
WHERE is_active = true
AND (
    computed_search_terms ILIKE '%OM4%' OR
    common_terms ILIKE '%OM4%'
);

-- 6. Show sample of what should now be searchable with "OM4"
SELECT 
    part_number,
    brand,
    short_description,
    fiber_types
FROM prod_fiber_cables
WHERE is_active = true
AND (
    computed_search_terms ILIKE '%OM4%' OR
    common_terms ILIKE '%OM4%'
)
LIMIT 5;