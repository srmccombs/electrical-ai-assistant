-- ADD_OM4_SEARCH_MAPPING.sql
-- Quick fix: Add OM4 search term mapping

-- Add OM4 as a search term that maps to multimode fiber
INSERT INTO search_terms (
    term_group,
    search_term,
    redirect_to,
    context,
    priority,
    is_active,
    applicable_tables
)
VALUES 
-- Direct OM4 mappings
('fiber_type', 'om4', 'multimode fiber', 'fiber_type', 200, true, ARRAY['prod_fiber_cables']::text[]),
('fiber_type', 'OM4', 'multimode fiber', 'fiber_type', 200, true, ARRAY['prod_fiber_cables']::text[]),
('fiber_type', 'om4 fiber', 'multimode fiber', 'fiber_type', 200, true, ARRAY['prod_fiber_cables']::text[]),
('fiber_type', 'om4 cable', 'multimode fiber cable', 'fiber_type', 200, true, ARRAY['prod_fiber_cables']::text[])
ON CONFLICT (search_term) DO UPDATE
SET 
    redirect_to = EXCLUDED.redirect_to,
    priority = EXCLUDED.priority,
    is_active = EXCLUDED.is_active;

-- Also add other fiber type mappings while we're at it
INSERT INTO search_terms (
    term_group,
    search_term,
    redirect_to,
    context,
    priority,
    is_active,
    applicable_tables
)
VALUES 
('fiber_type', 'om3', 'multimode fiber', 'fiber_type', 200, true, ARRAY['prod_fiber_cables']::text[]),
('fiber_type', 'om2', 'multimode fiber', 'fiber_type', 200, true, ARRAY['prod_fiber_cables']::text[]),
('fiber_type', 'om1', 'multimode fiber', 'fiber_type', 200, true, ARRAY['prod_fiber_cables']::text[]),
('fiber_type', 'os1', 'single mode fiber', 'fiber_type', 200, true, ARRAY['prod_fiber_cables']::text[]),
('fiber_type', 'os2', 'single mode fiber', 'fiber_type', 200, true, ARRAY['prod_fiber_cables']::text[])
ON CONFLICT (search_term) DO NOTHING;

-- Verify the mappings were added
SELECT * FROM search_terms 
WHERE term_group = 'fiber_type' 
ORDER BY search_term;