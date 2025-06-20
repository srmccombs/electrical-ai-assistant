-- Populate search_terms table with category cable search mappings
-- This covers all common search terms for category cables

-- Category ratings and common variations
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
('category_ratings', 'cat6 a', ARRAY['Cat6a'], ARRAY['prod_category_cables']),

-- Jacket types
('jacket_types', 'plenum', ARRAY['CMP'], ARRAY['prod_category_cables']),
('jacket_types', 'cmp', ARRAY['CMP'], ARRAY['prod_category_cables']),
('jacket_types', 'plenum rated', ARRAY['CMP'], ARRAY['prod_category_cables']),
('jacket_types', 'fire rated', ARRAY['CMP'], ARRAY['prod_category_cables']),

('jacket_types', 'riser', ARRAY['CMR'], ARRAY['prod_category_cables']),
('jacket_types', 'cmr', ARRAY['CMR'], ARRAY['prod_category_cables']),
('jacket_types', 'riser rated', ARRAY['CMR'], ARRAY['prod_category_cables']),
('jacket_types', 'vertical', ARRAY['CMR'], ARRAY['prod_category_cables']),

('jacket_types', 'lszh', ARRAY['LSZH'], ARRAY['prod_category_cables']),
('jacket_types', 'low smoke', ARRAY['LSZH'], ARRAY['prod_category_cables']),
('jacket_types', 'zero halogen', ARRAY['LSZH'], ARRAY['prod_category_cables']),
('jacket_types', 'lsoh', ARRAY['LSZH'], ARRAY['prod_category_cables']),
('jacket_types', 'ls0h', ARRAY['LSZH'], ARRAY['prod_category_cables']),

('jacket_types', 'outdoor', ARRAY['Outdoor'], ARRAY['prod_category_cables']),
('jacket_types', 'direct burial', ARRAY['Direct Burial'], ARRAY['prod_category_cables']),
('jacket_types', 'burial', ARRAY['Direct Burial'], ARRAY['prod_category_cables']),
('jacket_types', 'underground', ARRAY['Direct Burial'], ARRAY['prod_category_cables']),

-- Shielding types
('shielding_types', 'utp', ARRAY['UTP'], ARRAY['prod_category_cables']),
('shielding_types', 'unshielded', ARRAY['UTP'], ARRAY['prod_category_cables']),
('shielding_types', 'u/utp', ARRAY['UTP'], ARRAY['prod_category_cables']),

('shielding_types', 'stp', ARRAY['F/UTP'], ARRAY['prod_category_cables']),
('shielding_types', 'shielded', ARRAY['F/UTP', 'U/FTP', 'F/FTP', 'S/FTP', 'SF/UTP'], ARRAY['prod_category_cables']),
('shielding_types', 'ftp', ARRAY['U/FTP'], ARRAY['prod_category_cables']),
('shielding_types', 'f/utp', ARRAY['F/UTP'], ARRAY['prod_category_cables']),
('shielding_types', 'u/ftp', ARRAY['U/FTP'], ARRAY['prod_category_cables']),
('shielding_types', 'f/ftp', ARRAY['F/FTP'], ARRAY['prod_category_cables']),
('shielding_types', 's/ftp', ARRAY['S/FTP'], ARRAY['prod_category_cables']),
('shielding_types', 'sftp', ARRAY['S/FTP'], ARRAY['prod_category_cables']),
('shielding_types', 'sf/utp', ARRAY['SF/UTP'], ARRAY['prod_category_cables']),

-- Common misspellings
('misspellings', 'cat5', ARRAY['Cat5e'], ARRAY['prod_category_cables']),
('misspellings', 'cat 5', ARRAY['Cat5e'], ARRAY['prod_category_cables']),
('misspellings', 'cate5', ARRAY['Cat5e'], ARRAY['prod_category_cables']),
('misspellings', 'cate6', ARRAY['Cat6'], ARRAY['prod_category_cables']),
('misspellings', 'cate6a', ARRAY['Cat6a'], ARRAY['prod_category_cables']),
('misspellings', 'catergory', ARRAY['Cat5e', 'Cat6', 'Cat6a'], ARRAY['prod_category_cables']),
('misspellings', 'catagory', ARRAY['Cat5e', 'Cat6', 'Cat6a'], ARRAY['prod_category_cables']),
('misspellings', 'plennum', ARRAY['CMP'], ARRAY['prod_category_cables']),
('misspellings', 'rizer', ARRAY['CMR'], ARRAY['prod_category_cables']),

-- Brand terms (examples - add your actual brands)
('brands', 'belden', ARRAY[], ARRAY[], ARRAY[], ARRAY['Belden'], ARRAY['prod_category_cables']),
('brands', 'panduit', ARRAY[], ARRAY[], ARRAY[], ARRAY['Panduit'], ARRAY['prod_category_cables']),
('brands', 'commscope', ARRAY[], ARRAY[], ARRAY[], ARRAY['CommScope'], ARRAY['prod_category_cables']),
('brands', 'leviton', ARRAY[], ARRAY[], ARRAY[], ARRAY['Leviton'], ARRAY['prod_category_cables']),

-- Combination terms (common multi-word searches)
('combinations', 'cat6 plenum', ARRAY['Cat6'], ARRAY['CMP'], ARRAY[], ARRAY[], ARRAY['prod_category_cables']),
('combinations', 'cat6a shielded', ARRAY['Cat6a'], ARRAY[], ARRAY['F/UTP', 'U/FTP', 'F/FTP', 'S/FTP', 'SF/UTP'], ARRAY[], ARRAY['prod_category_cables']),
('combinations', 'cat5e utp', ARRAY['Cat5e'], ARRAY[], ARRAY['UTP'], ARRAY[], ARRAY['prod_category_cables']),
('combinations', 'outdoor cat6', ARRAY['Cat6'], ARRAY['Outdoor'], ARRAY[], ARRAY[], ARRAY['prod_category_cables']),
('combinations', 'shielded cat6a', ARRAY['Cat6a'], ARRAY[], ARRAY['F/UTP', 'U/FTP', 'F/FTP', 'S/FTP', 'SF/UTP'], ARRAY[], ARRAY['prod_category_cables']),

-- Generic terms
('generic', 'ethernet', ARRAY['Cat5e', 'Cat6', 'Cat6a'], ARRAY[], ARRAY[], ARRAY[], ARRAY['prod_category_cables']),
('generic', 'ethernet cable', ARRAY['Cat5e', 'Cat6', 'Cat6a'], ARRAY[], ARRAY[], ARRAY[], ARRAY['prod_category_cables']),
('generic', 'network cable', ARRAY['Cat5e', 'Cat6', 'Cat6a'], ARRAY[], ARRAY[], ARRAY[], ARRAY['prod_category_cables']),
('generic', 'lan cable', ARRAY['Cat5e', 'Cat6', 'Cat6a'], ARRAY[], ARRAY[], ARRAY[], ARRAY['prod_category_cables']),
('generic', 'patch cable', ARRAY['Cat5e', 'Cat6', 'Cat6a'], ARRAY[], ARRAY[], ARRAY[], ARRAY['prod_category_cables']);