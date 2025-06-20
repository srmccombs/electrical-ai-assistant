-- Add "datacom" as a generic term for all network/data communication products
-- This ensures searches for "Datacom Face Plates" return ALL faceplates from ALL brands

BEGIN;

-- Add datacom as a generic term for all faceplate searches
INSERT INTO search_terms (term_group, search_term, applicable_tables) VALUES
('generic_datacom', 'datacom', '{"prod_faceplates","prod_jack_modules","prod_surface_mount_boxes"}'),
('generic_datacom', 'data com', '{"prod_faceplates","prod_jack_modules","prod_surface_mount_boxes"}'),
('generic_datacom', 'datacom faceplate', '{"prod_faceplates"}'),
('generic_datacom', 'datacom face plate', '{"prod_faceplates"}'),
('generic_datacom', 'datacom wallplate', '{"prod_faceplates"}'),
('generic_datacom', 'datacom wall plate', '{"prod_faceplates"}'),
('generic_datacom', 'network faceplate', '{"prod_faceplates"}'),
('generic_datacom', 'network face plate', '{"prod_faceplates"}'),
('generic_datacom', 'data faceplate', '{"prod_faceplates"}'),
('generic_datacom', 'data face plate', '{"prod_faceplates"}')
ON CONFLICT (term_group, search_term) DO UPDATE SET 
    applicable_tables = EXCLUDED.applicable_tables;

-- Update ALL faceplates to include "datacom" in their search terms
-- This ensures they all show up for generic datacom searches
UPDATE prod_faceplates
SET computed_search_terms = COALESCE(computed_search_terms, '') || ' datacom data com network' 
WHERE is_active = true 
  AND (computed_search_terms IS NULL OR computed_search_terms NOT LIKE '%datacom%');

-- Update ALL jack modules to include "datacom" 
UPDATE prod_jack_modules
SET computed_search_terms = COALESCE(computed_search_terms, '') || ' datacom data com network'
WHERE is_active = true 
  AND (computed_search_terms IS NULL OR computed_search_terms NOT LIKE '%datacom%');

-- Update ALL surface mount boxes to include "datacom"
UPDATE prod_surface_mount_boxes
SET computed_search_terms = COALESCE(computed_search_terms, '') || ' datacom data com network'
WHERE is_active = true 
  AND (computed_search_terms IS NULL OR computed_search_terms NOT LIKE '%datacom%');

-- Force search vector rebuild for all updated products
UPDATE prod_faceplates
SET updated_at = CURRENT_TIMESTAMP
WHERE is_active = true;

UPDATE prod_jack_modules
SET updated_at = CURRENT_TIMESTAMP
WHERE is_active = true;

UPDATE prod_surface_mount_boxes
SET updated_at = CURRENT_TIMESTAMP
WHERE is_active = true;

-- Show results
SELECT 
    'Datacom search terms added' as status,
    COUNT(*) as terms_added
FROM search_terms
WHERE created_at >= CURRENT_TIMESTAMP - INTERVAL '1 minute';

-- Show product counts by brand
SELECT 
    'Faceplate counts by brand' as info,
    brand,
    COUNT(*) as count
FROM prod_faceplates
WHERE is_active = true
GROUP BY brand
ORDER BY brand;

COMMIT;