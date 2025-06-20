-- Combined migration script for Database-Driven Search for Category Cables
-- Run this script to set up the entire search infrastructure

-- Step 1: Create search_terms table
\i 001_create_search_terms_table.sql

-- Step 2: Populate search terms
\i 002_populate_category_cable_search_terms.sql

-- Step 3: Add search functionality to category_cables
\i 003_add_search_to_category_cables.sql

-- Verify the setup
SELECT COUNT(*) as search_terms_count FROM search_terms WHERE 'category_cables' = ANY(applicable_tables);
SELECT COUNT(*) as cables_with_search FROM category_cables WHERE computed_search_terms IS NOT NULL;

-- Test a simple search
SELECT part_number, category, jacket, shielding, brand 
FROM category_cables 
WHERE search_vector @@ plainto_tsquery('english', 'cat6 plenum')
LIMIT 5;