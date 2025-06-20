-- Populate search_terms table (SAFE VERSION)
-- First check what's already there

-- Show current content
SELECT 'Current search_terms content:' as info;
SELECT term_group, COUNT(*) as count 
FROM search_terms 
GROUP BY term_group
ORDER BY term_group;

-- Clear existing category cable terms to avoid duplicates
DELETE FROM search_terms 
WHERE 'prod_category_cables' = ANY(applicable_tables)
   OR 'category_cables' = ANY(applicable_tables);

-- Now insert fresh data with new table name
INSERT INTO search_terms (term_group, search_term, categories, applicable_tables) VALUES
-- Cat5e terms
('category_ratings', 'cat5e', ARRAY['Cat5e'], ARRAY['prod_category_cables']),
('category_ratings', 'cat 5e', ARRAY['Cat5e'], ARRAY['prod_category_cables']),
('category_ratings', 'category 5e', ARRAY['Cat5e'], ARRAY['prod_category_cables']),
('category_ratings', 'cat5 enhanced', ARRAY['Cat5e'], ARRAY['prod_category_cables']),
('category_ratings', '5e', ARRAY['Cat5e'], ARRAY['prod_category_cables']),

-- Cat6 terms
('category_ratings', 'cat6', ARRAY['Cat6'], ARRAY['prod_category_cables']),
('category_ratings', 'cat 6', ARRAY['Cat6'], ARRAY['prod_category_cables']),
('category_ratings', 'category 6', ARRAY['Cat6'], ARRAY['prod_category_cables']),
('category_ratings', 'cat6 cable', ARRAY['Cat6'], ARRAY['prod_category_cables']),
('category_ratings', '6', ARRAY['Cat6'], ARRAY['prod_category_cables']),

-- Cat6a terms
('category_ratings', 'cat6a', ARRAY['Cat6a'], ARRAY['prod_category_cables']),
('category_ratings', 'cat 6a', ARRAY['Cat6a'], ARRAY['prod_category_cables']),
('category_ratings', 'category 6a', ARRAY['Cat6a'], ARRAY['prod_category_cables']),
('category_ratings', 'cat6 augmented', ARRAY['Cat6a'], ARRAY['prod_category_cables']),
('category_ratings', '6a', ARRAY['Cat6a'], ARRAY['prod_category_cables']),
('category_ratings', 'cat6 a', ARRAY['Cat6a'], ARRAY['prod_category_cables']);

-- Add jacket types
INSERT INTO search_terms (term_group, search_term, jackets, applicable_tables) VALUES
('jacket_types', 'plenum', ARRAY['CMP'], ARRAY['prod_category_cables']),
('jacket_types', 'cmp', ARRAY['CMP'], ARRAY['prod_category_cables']),
('jacket_types', 'plenum rated', ARRAY['CMP'], ARRAY['prod_category_cables']),
('jacket_types', 'fire rated', ARRAY['CMP'], ARRAY['prod_category_cables']),
('jacket_types', 'riser', ARRAY['CMR'], ARRAY['prod_category_cables']),
('jacket_types', 'cmr', ARRAY['CMR'], ARRAY['prod_category_cables']),
('jacket_types', 'riser rated', ARRAY['CMR'], ARRAY['prod_category_cables']),
('jacket_types', 'lszh', ARRAY['LSZH'], ARRAY['prod_category_cables']),
('jacket_types', 'low smoke', ARRAY['LSZH'], ARRAY['prod_category_cables']),
('jacket_types', 'zero halogen', ARRAY['LSZH'], ARRAY['prod_category_cables']);

-- Add shielding types
INSERT INTO search_terms (term_group, search_term, shielding, applicable_tables) VALUES
('shielding_types', 'utp', ARRAY['UTP'], ARRAY['prod_category_cables']),
('shielding_types', 'unshielded', ARRAY['UTP'], ARRAY['prod_category_cables']),
('shielding_types', 'stp', ARRAY['F/UTP'], ARRAY['prod_category_cables']),
('shielding_types', 'shielded', ARRAY['F/UTP', 'U/FTP', 'F/FTP', 'S/FTP', 'SF/UTP'], ARRAY['prod_category_cables']),
('shielding_types', 'ftp', ARRAY['U/FTP'], ARRAY['prod_category_cables']),
('shielding_types', 'sftp', ARRAY['S/FTP'], ARRAY['prod_category_cables']);

-- Add common misspellings
INSERT INTO search_terms (term_group, search_term, categories, applicable_tables) VALUES
('misspellings', 'cat5', ARRAY['Cat5e'], ARRAY['prod_category_cables']),
('misspellings', 'cat 5', ARRAY['Cat5e'], ARRAY['prod_category_cables']),
('misspellings', 'cate5', ARRAY['Cat5e'], ARRAY['prod_category_cables']),
('misspellings', 'cate6', ARRAY['Cat6'], ARRAY['prod_category_cables']),
('misspellings', 'cate6a', ARRAY['Cat6a'], ARRAY['prod_category_cables']);

-- Add combination terms
INSERT INTO search_terms (term_group, search_term, categories, jackets, applicable_tables) VALUES
('combinations', 'cat6 plenum', ARRAY['Cat6'], ARRAY['CMP'], ARRAY['prod_category_cables']),
('combinations', 'cat6a shielded', ARRAY['Cat6a'], ARRAY[]::TEXT[], ARRAY['prod_category_cables']),
('combinations', 'cat5e utp', ARRAY['Cat5e'], ARRAY[]::TEXT[], ARRAY['prod_category_cables']);

-- Add generic terms
INSERT INTO search_terms (term_group, search_term, categories, applicable_tables) VALUES
('generic', 'ethernet', ARRAY['Cat5e', 'Cat6', 'Cat6a'], ARRAY['prod_category_cables']),
('generic', 'ethernet cable', ARRAY['Cat5e', 'Cat6', 'Cat6a'], ARRAY['prod_category_cables']),
('generic', 'network cable', ARRAY['Cat5e', 'Cat6', 'Cat6a'], ARRAY['prod_category_cables']),
('generic', 'lan cable', ARRAY['Cat5e', 'Cat6', 'Cat6a'], ARRAY['prod_category_cables']),
('generic', 'patch cable', ARRAY['Cat5e', 'Cat6', 'Cat6a'], ARRAY['prod_category_cables']);

-- Show what we added
SELECT 'Search terms populated. New totals by group:' as status;
SELECT term_group, COUNT(*) as count 
FROM search_terms 
WHERE 'prod_category_cables' = ANY(applicable_tables)
GROUP BY term_group
ORDER BY term_group;