-- Add search terms for Dynacom products including common misspellings
-- This ensures "Datacom" searches also find "Dynacom" products

BEGIN;

-- Add Dynacom/Datacom search terms
INSERT INTO search_terms (term_group, search_term, brands, applicable_tables) VALUES
('brand_variations', 'dynacom', '{"Dynacom"}', '{"prod_faceplates","prod_jack_modules","prod_surface_mount_boxes"}'),
('brand_variations', 'datacom', '{"Dynacom"}', '{"prod_faceplates","prod_jack_modules","prod_surface_mount_boxes"}'),
('brand_variations', 'data com', '{"Dynacom"}', '{"prod_faceplates","prod_jack_modules","prod_surface_mount_boxes"}'),
('brand_variations', 'dyna com', '{"Dynacom"}', '{"prod_faceplates","prod_jack_modules","prod_surface_mount_boxes"}')
ON CONFLICT (term_group, search_term) DO UPDATE SET 
    brands = EXCLUDED.brands,
    applicable_tables = EXCLUDED.applicable_tables;

-- Add Dynacom Keystone specific terms
INSERT INTO search_terms (term_group, search_term, brands, product_lines, applicable_tables) VALUES
('brand_product_lines', 'dynacom keystone', '{"Dynacom"}', '{"Keystone"}', '{"prod_faceplates","prod_jack_modules","prod_surface_mount_boxes"}'),
('brand_product_lines', 'datacom keystone', '{"Dynacom"}', '{"Keystone"}', '{"prod_faceplates","prod_jack_modules","prod_surface_mount_boxes"}')
ON CONFLICT (term_group, search_term) DO UPDATE SET 
    brands = EXCLUDED.brands,
    product_lines = EXCLUDED.product_lines,
    applicable_tables = EXCLUDED.applicable_tables;

-- Update computed search terms for Dynacom products
-- This ensures the search_vector includes "datacom" as a searchable term

-- Update faceplates
UPDATE prod_faceplates
SET computed_search_terms = COALESCE(computed_search_terms, '') || ' datacom data com' 
WHERE brand = 'Dynacom' AND computed_search_terms NOT LIKE '%datacom%';

-- Update jack modules
UPDATE prod_jack_modules
SET computed_search_terms = COALESCE(computed_search_terms, '') || ' datacom data com'
WHERE brand = 'Dynacom' AND computed_search_terms NOT LIKE '%datacom%';

-- Update surface mount boxes
UPDATE prod_surface_mount_boxes
SET computed_search_terms = COALESCE(computed_search_terms, '') || ' datacom data com'
WHERE brand = 'Dynacom' AND computed_search_terms NOT LIKE '%datacom%';

-- Show results
SELECT 
    'Search terms added for Dynacom/Datacom variations' as status,
    COUNT(*) as terms_added
FROM search_terms
WHERE created_at >= CURRENT_TIMESTAMP - INTERVAL '1 minute';

-- Show updated products
SELECT 
    'Products updated with datacom search terms' as status,
    COUNT(*) as dynacom_faceplates
FROM prod_faceplates
WHERE brand = 'Dynacom';

COMMIT;