-- FIX_OM4_SEARCH_NOW.sql
-- Fix OM4 search by updating common_terms and computed_search_terms

-- 1. Update common_terms to include the fiber type for better searching
UPDATE prod_fiber_cables
SET common_terms = 
    CASE 
        WHEN fiber_types::text ILIKE '%OM4%' THEN 
            COALESCE(common_terms, '') || ' OM4 om4 multimode multi-mode 50/125 50 micron aqua'
        WHEN fiber_types::text ILIKE '%OM3%' THEN 
            COALESCE(common_terms, '') || ' OM3 om3 multimode multi-mode 50/125 50 micron aqua'
        WHEN fiber_types::text ILIKE '%OM1%' THEN 
            COALESCE(common_terms, '') || ' OM1 om1 multimode multi-mode 62.5/125 62.5 micron orange'
        WHEN fiber_types::text ILIKE '%OS2%' THEN 
            COALESCE(common_terms, '') || ' OS2 os2 singlemode single-mode single mode 9/125 9 micron yellow'
        ELSE common_terms
    END
WHERE is_active = true;

-- 2. Rebuild computed_search_terms to include all searchable content
UPDATE prod_fiber_cables
SET computed_search_terms = 
    LOWER(
        COALESCE(part_number, '') || ' ' || 
        COALESCE(brand, '') || ' ' || 
        COALESCE(short_description, '') || ' ' || 
        COALESCE(common_terms, '') || ' ' ||
        COALESCE(fiber_types::text, '') || ' ' ||
        CASE 
            WHEN short_description ILIKE '%tight buffer%' THEN 'tight buffer tb indoor '
            WHEN short_description ILIKE '%loose tube%' THEN 'loose tube lt outdoor osp outside plant '
            ELSE ''
        END ||
        CASE 
            WHEN short_description ILIKE '%plenum%' THEN 'plenum cmp ofnp '
            WHEN short_description ILIKE '%riser%' THEN 'riser cmr ofnr '
            ELSE ''
        END ||
        -- Add strand/fiber count variations
        CASE 
            WHEN fiber_count IS NOT NULL THEN 
                fiber_count || ' fiber ' || fiber_count || ' strand ' || fiber_count || ' count '
            ELSE ''
        END
    )
WHERE is_active = true;

-- 3. Verify the fix - count OM4 searchable cables
SELECT 
    'OM4 cables after fix' as status,
    COUNT(*) as count
FROM prod_fiber_cables
WHERE is_active = true
AND (
    computed_search_terms ILIKE '%om4%' OR
    common_terms ILIKE '%om4%'
);

-- 4. Show sample OM4 cables that should now be searchable
SELECT 
    part_number,
    brand,
    short_description,
    fiber_count,
    computed_search_terms
FROM prod_fiber_cables
WHERE is_active = true
AND computed_search_terms ILIKE '%om4%'
LIMIT 5;

-- 5. Test search pattern similar to what the app uses
SELECT 
    part_number,
    brand,
    short_description,
    fiber_count
FROM prod_fiber_cables
WHERE is_active = true
AND (
    part_number ILIKE '%om4%' OR
    short_description ILIKE '%om4%' OR
    computed_search_terms ILIKE '%om4%' OR
    common_terms ILIKE '%om4%' OR
    brand ILIKE '%om4%' OR
    fiber_types::text ILIKE '%om4%'
)
ORDER BY brand, part_number;