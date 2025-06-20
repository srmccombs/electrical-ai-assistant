-- Database-Driven Search Setup for Category Cables
-- Run this to implement the new search system with your renamed tables

-- STEP 1: Create search_terms table
\echo 'Creating search_terms table...'
\i 001_create_search_terms_table.sql

-- STEP 2: Populate search terms
\echo 'Populating search terms for category cables...'
\i 002_populate_category_cable_search_terms.sql

-- STEP 3: Add search functionality to prod_category_cables
\echo 'Adding search functionality to prod_category_cables...'
\i 003_add_search_to_category_cables.sql

-- Verify the setup
\echo 'Verifying setup...'
SELECT COUNT(*) as search_terms_count 
FROM search_terms 
WHERE 'prod_category_cables' = ANY(applicable_tables);

SELECT COUNT(*) as cables_with_search 
FROM prod_category_cables 
WHERE computed_search_terms IS NOT NULL;

-- Test a simple search
\echo 'Testing search for "cat6 plenum"...'
SELECT part_number, category, jacket, shielding, brand 
FROM prod_category_cables 
WHERE search_vector @@ plainto_tsquery('english', 'cat6 plenum')
LIMIT 5;

\echo 'Search system setup complete!'