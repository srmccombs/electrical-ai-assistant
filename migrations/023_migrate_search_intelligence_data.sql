-- Migration 023: Migrate all hardcoded search intelligence to database
-- This populates the new tables with all intelligence from industryKnowledge.ts

BEGIN;

-- =====================================================
-- 1. BUSINESS RULES
-- =====================================================

-- Cat5 → Cat5e redirect rule
INSERT INTO business_rules (rule_type, rule_name, source_pattern, target_value, rule_config, priority)
VALUES 
    ('redirect', 'cat5_to_cat5e', '\bcat\s*5\b|\bcategory\s*5\b|\bcat-5\b|\bcat5\b', 'cat5e', 
     '{"message": "Showing Cat5e results (Cat5e is the current standard)"}', 1000);

-- Quantity conversion rules
INSERT INTO business_rules (rule_type, rule_name, source_pattern, target_value, rule_config, priority)
VALUES 
    ('conversion', 'box_to_feet', '(\d+)\s*box(?:es)?', '1000', 
     '{"unit": "feet", "multiplier": 1000, "applies_to": ["category_cables"]}', 900),
    ('conversion', 'single_box', 'box\s+of', '1000', 
     '{"unit": "feet", "default_quantity": 1000, "applies_to": ["category_cables"]}', 890);

-- Validation rules for blocked terms
INSERT INTO validation_rules (rule_name, rule_type, blocked_terms, error_message, suggestion)
VALUES 
    ('non_electrical_terms', 'blocked_terms', 
     ARRAY['cancer', 'medicine', 'doctor', 'prescription', 'surgery', 'treatment',
           'health', 'medical', 'hospital', 'clinic', 'patient', 'drug',
           'recipe', 'cooking', 'restaurant', 'food', 'kitchen', 'meal',
           'diet', 'nutrition', 'ingredients', 'baking',
           'car', 'vehicle', 'automotive', 'engine', 'tire', 'brake',
           'transmission', 'gasoline', 'motor oil',
           'investment', 'stock', 'cryptocurrency', 'bitcoin', 'trading',
           'mortgage', 'loan', 'banking', 'finance'],
     'I''m specialized in electrical and telecommunications products. Please search for cables, connectors, panels, or other electrical infrastructure items.',
     'For best results, try searching for specific electrical products like ''Cat6 cable'', ''fiber connector'', or part numbers.');

-- =====================================================
-- 2. DETECTION PATTERNS
-- =====================================================

-- Jacket type detection patterns (ORDER MATTERS - higher priority first)
INSERT INTO detection_patterns (detection_type, pattern, result_value, priority, description)
VALUES 
    -- Non-plenum MUST be checked before plenum
    ('jacket', 'non-plenum|non plenum|nonplenum', 'RISER', 1000, 'Non-plenum variations'),
    ('jacket', 'riser', 'RISER', 900, 'Riser jacket'),
    ('jacket', 'cmr|c\.m\.r\.', 'RISER', 890, 'CMR rating'),
    ('jacket', 'pvc', 'RISER', 880, 'PVC maps to riser'),
    
    -- Plenum patterns (lower priority)
    ('jacket', 'plenum rated|plenum-rated|plenumrated', 'PLENUM', 800, 'Plenum rated variations'),
    ('jacket', 'cmp|c\.m\.p\.', 'PLENUM', 790, 'CMP rating'),
    ('jacket', 'plenum', 'PLENUM', 700, 'Standalone plenum - lowest priority'),
    
    -- Outdoor patterns
    ('jacket', 'outdoor|osp|outside plant', 'OUTDOOR', 600, 'Outdoor variations'),
    ('jacket', 'burial|underground|gel filled|gel-filled|water block|waterblock', 'OUTDOOR', 590, 'Outdoor burial cable');

-- Category rating detection patterns
INSERT INTO detection_patterns (detection_type, pattern, result_value, priority, description)
VALUES 
    -- Cat5e patterns
    ('category', 'cat\s*5e|cat5e', 'CAT5E', 1000, 'Cat5e standard format'),
    ('category', 'category\s*5e|category5e', 'CAT5E', 990, 'Category 5e variations'),
    ('category', 'cat\s*5\s*enhanced|enhanced\s*cat\s*5', 'CAT5E', 980, 'Enhanced Cat5'),
    
    -- Cat6 patterns
    ('category', 'cat\s*6\b|cat6\b', 'CAT6', 900, 'Cat6 standard format'),
    ('category', 'category\s*6\b|category6\b', 'CAT6', 890, 'Category 6 variations'),
    ('category', 'gigabit\s*cable|gigabit\s*ethernet|1000Base-?T', 'CAT6', 880, 'Gigabit references'),
    
    -- Cat6a patterns
    ('category', 'cat\s*6a|cat6a', 'CAT6A', 800, 'Cat6a standard format'),
    ('category', 'category\s*6a|category6a', 'CAT6A', 790, 'Category 6a variations'),
    ('category', 'category\s*6\s*augmented|augmented\s*cat\s*6', 'CAT6A', 780, 'Augmented Cat6'),
    ('category', '10-?gig\s*cable|10\s*gigabit|10GBase-?T', 'CAT6A', 770, '10-gig references');

-- Shielding detection patterns
INSERT INTO detection_patterns (detection_type, pattern, result_value, priority, description)
VALUES 
    ('shielding', 'utp|u\.t\.p\.|unshielded\s*twisted\s*pair', 'UTP', 1000, 'UTP variations'),
    ('shielding', 'stp|s\.t\.p\.|shielded\s*twisted\s*pair', 'STP', 900, 'STP variations'),
    ('shielding', 'f/utp|futp', 'F/UTP', 800, 'F/UTP shielding'),
    ('shielding', 'u/ftp|uftp', 'U/FTP', 700, 'U/FTP shielding'),
    ('shielding', 'f/ftp|fftp', 'F/FTP', 600, 'F/FTP shielding'),
    ('shielding', 's/ftp|sftp|sf/utp', 'S/FTP', 500, 'S/FTP shielding');

-- Color detection patterns (including special cases)
INSERT INTO detection_patterns (detection_type, pattern, result_value, priority, description)
VALUES 
    -- Stainless steel variations (highest priority)
    ('color', 'stainless\s*steel|stainless-steel|stainlesssteel', 'Stainless Steel', 2000, 'Stainless steel variations'),
    ('color', 'stainless|ss|s\.s\.|s/s', 'Stainless Steel', 1900, 'Stainless abbreviations'),
    ('color', 'brushed\s*steel|brushed\s*stainless|brushed\s*finish', 'Stainless Steel', 1800, 'Brushed steel'),
    ('color', 'satin\s*steel|satin\s*stainless|satin\s*finish', 'Stainless Steel', 1700, 'Satin steel'),
    ('color', 'chrome|chrome\s*finish|chrome\s*plated', 'Stainless Steel', 1600, 'Chrome finish'),
    ('color', 'nickel|nickel\s*finish|nickel\s*plated', 'Stainless Steel', 1500, 'Nickel finish'),
    ('color', 'metallic|metal\s*finish|silver\s*steel', 'Stainless Steel', 1400, 'Metallic finishes'),
    
    -- Standard colors
    ('color', '\bblack\b', 'Black', 1000, 'Black color'),
    ('color', '\bblue\b', 'Blue', 900, 'Blue color'),
    ('color', '\bbrown\b', 'Brown', 800, 'Brown color'),
    ('color', '\bgray\b|\bgrey\b', 'Gray', 700, 'Gray/Grey color'),
    ('color', '\bgreen\b', 'Green', 600, 'Green color'),
    ('color', '\borange\b', 'Orange', 500, 'Orange color'),
    ('color', '\bpink\b', 'Pink', 400, 'Pink color'),
    ('color', '\bred\b', 'Red', 300, 'Red color'),
    ('color', '\bviolet\b', 'Violet', 200, 'Violet color'),
    ('color', '\bwhite\b', 'White', 100, 'White color'),
    ('color', '\byellow\b', 'Yellow', 90, 'Yellow color'),
    ('color', '\bivory\b', 'Ivory', 80, 'Ivory color'),
    ('color', '\balmond\b', 'Almond', 70, 'Almond color');

-- Brand detection patterns
INSERT INTO detection_patterns (detection_type, pattern, result_value, priority, description)
VALUES 
    ('brand', 'corning|siecor', 'Corning', 1000, 'Corning and Siecor'),
    ('brand', 'panduit|pan\s*duit', 'Panduit', 900, 'Panduit variations'),
    ('brand', 'leviton|berktek|berk\s*tek|berk-tek|bertek|burktek|birktek', 'Leviton/BerkTek', 800, 'Leviton/BerkTek variations'),
    ('brand', 'dmsi', 'DMSI', 700, 'DMSI'),
    ('brand', 'legrand|le\s*grand', 'Legrand', 600, 'Legrand variations'),
    ('brand', 'superior\s*essex|superior|essex|superioressex|sup\s*essex', 'Superior Essex', 500, 'Superior Essex variations'),
    ('brand', 'prysmian|general\s*cable|generalcable|gen\s*cable', 'Prysmian', 400, 'Prysmian/General Cable'),
    ('brand', 'hubbell|hubell|hubbel', 'Hubbell', 300, 'Hubbell variations');

-- Polish type detection (fiber connectors)
INSERT INTO detection_patterns (detection_type, pattern, result_value, priority, conditions, description)
VALUES 
    ('polish', 'apc|angled\s*polish|angled\s*physical|angle\s*polish|green\s*connector', 'APC', 1000, '{}', 'APC polish'),
    ('polish', 'upc|ultra\s*polish|ultra\s*physical|blue\s*connector', 'UPC', 900, '{}', 'UPC polish'),
    ('polish', 'spc|super\s*polish|super\s*physical', 'SPC', 800, '{}', 'SPC polish'),
    ('polish', '\bpc\b|physical\s*contact', 'PC', 700, '{"exclude": ["apc", "upc", "spc"]}', 'PC polish');

-- AWG detection patterns
INSERT INTO detection_patterns (detection_type, pattern, result_value, priority, description)
VALUES 
    ('awg', '(23)\s*awg|awg\s*(23)|(?:^|\s)(23)awg', '23', 1000, '23 AWG'),
    ('awg', '(24)\s*awg|awg\s*(24)|(?:^|\s)(24)awg', '24', 900, '24 AWG');

-- Environment detection
INSERT INTO detection_patterns (detection_type, pattern, result_value, priority, description)
VALUES 
    ('environment', 'outdoor|outside|external', 'Outdoor', 1000, 'Outdoor environment'),
    ('environment', 'indoor|inside|internal', 'Indoor', 900, 'Indoor environment');

-- Cross-reference detection
INSERT INTO detection_patterns (detection_type, pattern, result_value, priority, description)
VALUES 
    ('cross_reference', 'cross|equal|equivalent|substitute|replacement|alternative|match|same\s*as|like|similar\s*to', 'CROSS_REF', 1000, 'Cross-reference keywords');

-- =====================================================
-- 3. TERM EQUIVALENCIES
-- =====================================================

-- Jacket equivalencies
INSERT INTO term_equivalencies (primary_term, equivalent_terms, context, description)
VALUES 
    ('RISER', ARRAY['non-plenum', 'non plenum', 'nonplenum', 'non-plenum rated', 'riser', 'cmr', 'cmr rated', 'pvc'], 
     'jacket', 'Riser/CMR/Non-Plenum/PVC are all equivalent'),
    ('PLENUM', ARRAY['plenum rated', 'cmp', 'cmp rated', 'plenum-rated'], 
     'jacket', 'Plenum/CMP equivalents'),
    ('OUTDOOR', ARRAY['outdoor', 'osp', 'outside plant', 'burial', 'underground', 'gel filled', 'gel-filled', 'water block', 'waterblock'], 
     'jacket', 'Outdoor cable equivalents');

-- Brand equivalencies
INSERT INTO term_equivalencies (primary_term, equivalent_terms, context, description)
VALUES 
    ('Corning', ARRAY['corning', 'siecor'], 'brand', 'Siecor is now Corning'),
    ('Prysmian', ARRAY['prysmian', 'general cable', 'generalcable'], 'brand', 'General Cable is now Prysmian');

-- =====================================================
-- 4. QUANTITY CONVERSIONS
-- =====================================================

INSERT INTO quantity_conversions (unit_from, unit_to, conversion_factor, product_context, conditions)
VALUES 
    ('box', 'feet', 1000, 'category_cable', '{"standard_box_size": 1000}'),
    ('boxes', 'feet', 1000, 'category_cable', '{"standard_box_size": 1000}'),
    ('bx', 'feet', 1000, 'category_cable', '{"standard_box_size": 1000}');

-- =====================================================
-- 5. BRAND MAPPINGS
-- =====================================================

INSERT INTO brand_mappings (search_term, canonical_brand, brand_variations, notes)
VALUES 
    ('siecor', 'Corning', ARRAY['siecor', 'corning'], 'Siecor was acquired by Corning'),
    ('berktek', 'Leviton/BerkTek', ARRAY['berktek', 'berk tek', 'berk-tek', 'bertek', 'burktek', 'birktek'], 'BerkTek is part of Leviton'),
    ('general cable', 'Prysmian', ARRAY['general cable', 'generalcable', 'gen cable'], 'General Cable was acquired by Prysmian');

-- =====================================================
-- 6. COLOR MAPPINGS
-- =====================================================

INSERT INTO color_mappings (search_term, canonical_color, color_variations, hex_code, is_special)
VALUES 
    -- Standard colors
    ('black', 'Black', ARRAY['black', 'blk'], '#000000', false),
    ('blue', 'Blue', ARRAY['blue', 'blu'], '#0000FF', false),
    ('brown', 'Brown', ARRAY['brown', 'brn'], '#A52A2A', false),
    ('gray', 'Gray', ARRAY['gray', 'grey', 'gry'], '#808080', false),
    ('green', 'Green', ARRAY['green', 'grn'], '#008000', false),
    ('orange', 'Orange', ARRAY['orange', 'org'], '#FFA500', false),
    ('pink', 'Pink', ARRAY['pink', 'pnk'], '#FFC0CB', false),
    ('red', 'Red', ARRAY['red'], '#FF0000', false),
    ('violet', 'Violet', ARRAY['violet', 'vio', 'purple'], '#8A2BE2', false),
    ('white', 'White', ARRAY['white', 'wht'], '#FFFFFF', false),
    ('yellow', 'Yellow', ARRAY['yellow', 'yel'], '#FFFF00', false),
    ('ivory', 'Ivory', ARRAY['ivory', 'ivy', 'off-white'], '#FFFFF0', false),
    ('almond', 'Almond', ARRAY['almond', 'alm'], '#FFEBCD', false),
    
    -- Special metal finishes
    ('stainless steel', 'Stainless Steel', 
     ARRAY['stainless steel', 'stainless-steel', 'stainlesssteel', 'stainless', 'ss', 's.s.', 's/s',
           'brushed steel', 'brushed stainless', 'brushed finish', 'satin steel', 'satin stainless',
           'satin finish', 'chrome', 'chrome finish', 'chrome plated', 'nickel', 'nickel finish',
           'nickel plated', 'metallic', 'metal finish', 'silver steel'], 
     '#C0C0C0', true);

-- =====================================================
-- 7. COMPREHENSIVE SEARCH TERM ADDITIONS
-- =====================================================

-- Add all the comprehensive category terms from industryKnowledge.ts
INSERT INTO search_terms (term_group, search_term, categories, applicable_tables, priority, context)
VALUES 
    -- Cat5e comprehensive terms
    ('category_ratings', 'enhanced cat5', ARRAY['Cat5e'], ARRAY['prod_category_cables'], 950, 'category'),
    ('category_ratings', 'enhanced Cat5', ARRAY['Cat5e'], ARRAY['prod_category_cables'], 950, 'category'),
    ('category_ratings', 'enhanced CAT5', ARRAY['Cat5e'], ARRAY['prod_category_cables'], 950, 'category'),
    ('category_ratings', 'enhanced category 5', ARRAY['Cat5e'], ARRAY['prod_category_cables'], 950, 'category'),
    ('category_ratings', 'Cat5E', ARRAY['Cat5e'], ARRAY['prod_category_cables'], 1000, 'category'),
    ('category_ratings', 'cat5E', ARRAY['Cat5e'], ARRAY['prod_category_cables'], 1000, 'category'),
    ('category_ratings', 'CAT5E', ARRAY['Cat5e'], ARRAY['prod_category_cables'], 1000, 'category'),
    ('category_ratings', 'Cat 5e', ARRAY['Cat5e'], ARRAY['prod_category_cables'], 1000, 'category'),
    ('category_ratings', 'cat 5e', ARRAY['Cat5e'], ARRAY['prod_category_cables'], 1000, 'category'),
    ('category_ratings', 'CAT 5e', ARRAY['Cat5e'], ARRAY['prod_category_cables'], 1000, 'category'),
    ('category_ratings', 'CAT 5E', ARRAY['Cat5e'], ARRAY['prod_category_cables'], 1000, 'category'),
    ('category_ratings', 'Category 5e', ARRAY['Cat5e'], ARRAY['prod_category_cables'], 990, 'category'),
    ('category_ratings', 'category 5e', ARRAY['Cat5e'], ARRAY['prod_category_cables'], 990, 'category'),
    ('category_ratings', 'CATEGORY 5e', ARRAY['Cat5e'], ARRAY['prod_category_cables'], 990, 'category'),
    ('category_ratings', 'CATEGORY 5E', ARRAY['Cat5e'], ARRAY['prod_category_cables'], 990, 'category'),
    ('category_ratings', 'Category 5 enhanced', ARRAY['Cat5e'], ARRAY['prod_category_cables'], 980, 'category'),
    ('category_ratings', 'category 5 enhanced', ARRAY['Cat5e'], ARRAY['prod_category_cables'], 980, 'category'),
    
    -- Cat6 comprehensive terms
    ('category_ratings', 'Cat six', ARRAY['Cat6'], ARRAY['prod_category_cables'], 890, 'category'),
    ('category_ratings', 'cat six', ARRAY['Cat6'], ARRAY['prod_category_cables'], 890, 'category'),
    ('category_ratings', 'CAT six', ARRAY['Cat6'], ARRAY['prod_category_cables'], 890, 'category'),
    ('category_ratings', 'Category six', ARRAY['Cat6'], ARRAY['prod_category_cables'], 890, 'category'),
    ('category_ratings', 'category six', ARRAY['Cat6'], ARRAY['prod_category_cables'], 890, 'category'),
    ('category_ratings', 'category six unshielded', ARRAY['Cat6'], ARRAY['prod_category_cables'], 880, 'category'),
    ('category_ratings', 'gigabit cable', ARRAY['Cat6'], ARRAY['prod_category_cables'], 870, 'category'),
    ('category_ratings', 'gigabit ethernet', ARRAY['Cat6'], ARRAY['prod_category_cables'], 870, 'category'),
    ('category_ratings', '1000BaseT', ARRAY['Cat6'], ARRAY['prod_category_cables'], 870, 'category'),
    ('category_ratings', '1000Base-T', ARRAY['Cat6'], ARRAY['prod_category_cables'], 870, 'category'),
    ('category_ratings', '1000 BaseT', ARRAY['Cat6'], ARRAY['prod_category_cables'], 870, 'category'),
    
    -- Cat6a comprehensive terms  
    ('category_ratings', 'Cat6A', ARRAY['Cat6a'], ARRAY['prod_category_cables'], 800, 'category'),
    ('category_ratings', 'cat6A', ARRAY['Cat6a'], ARRAY['prod_category_cables'], 800, 'category'),
    ('category_ratings', 'CAT6A', ARRAY['Cat6a'], ARRAY['prod_category_cables'], 800, 'category'),
    ('category_ratings', 'Cat 6a', ARRAY['Cat6a'], ARRAY['prod_category_cables'], 800, 'category'),
    ('category_ratings', 'cat 6a', ARRAY['Cat6a'], ARRAY['prod_category_cables'], 800, 'category'),
    ('category_ratings', 'CAT 6a', ARRAY['Cat6a'], ARRAY['prod_category_cables'], 800, 'category'),
    ('category_ratings', 'CAT 6A', ARRAY['Cat6a'], ARRAY['prod_category_cables'], 800, 'category'),
    ('category_ratings', 'Category 6a', ARRAY['Cat6a'], ARRAY['prod_category_cables'], 790, 'category'),
    ('category_ratings', 'category 6a', ARRAY['Cat6a'], ARRAY['prod_category_cables'], 790, 'category'),
    ('category_ratings', 'CATEGORY 6a', ARRAY['Cat6a'], ARRAY['prod_category_cables'], 790, 'category'),
    ('category_ratings', 'CATEGORY 6A', ARRAY['Cat6a'], ARRAY['prod_category_cables'], 790, 'category'),
    ('category_ratings', 'Category 6 augmented', ARRAY['Cat6a'], ARRAY['prod_category_cables'], 780, 'category'),
    ('category_ratings', 'category 6 augmented', ARRAY['Cat6a'], ARRAY['prod_category_cables'], 780, 'category'),
    ('category_ratings', 'augmented category 6', ARRAY['Cat6a'], ARRAY['prod_category_cables'], 780, 'category'),
    ('category_ratings', 'augmented cat6', ARRAY['Cat6a'], ARRAY['prod_category_cables'], 780, 'category'),
    ('category_ratings', 'augmented Cat6', ARRAY['Cat6a'], ARRAY['prod_category_cables'], 780, 'category'),
    ('category_ratings', 'TIA-568-B.2-10', ARRAY['Cat6a'], ARRAY['prod_category_cables'], 770, 'category'),
    ('category_ratings', '10-gig cable', ARRAY['Cat6a'], ARRAY['prod_category_cables'], 770, 'category'),
    ('category_ratings', '10 gig cable', ARRAY['Cat6a'], ARRAY['prod_category_cables'], 770, 'category'),
    ('category_ratings', '10-gigabit', ARRAY['Cat6a'], ARRAY['prod_category_cables'], 770, 'category'),
    ('category_ratings', '10 gigabit', ARRAY['Cat6a'], ARRAY['prod_category_cables'], 770, 'category'),
    ('category_ratings', '10GBaseT', ARRAY['Cat6a'], ARRAY['prod_category_cables'], 770, 'category'),
    ('category_ratings', '10GBase-T', ARRAY['Cat6a'], ARRAY['prod_category_cables'], 770, 'category'),
    ('category_ratings', '10G BaseT', ARRAY['Cat6a'], ARRAY['prod_category_cables'], 770, 'category')
ON CONFLICT (search_term, term_group, context) DO UPDATE 
SET categories = EXCLUDED.categories,
    applicable_tables = EXCLUDED.applicable_tables,
    priority = EXCLUDED.priority;

-- Add surface mount box comprehensive terms
INSERT INTO search_terms (term_group, search_term, applicable_tables, priority, context)
VALUES 
    ('smb_variations', 's m b', ARRAY['prod_surface_mount_boxes'], 1000, 'product'),
    ('smb_variations', 's-m-b', ARRAY['prod_surface_mount_boxes'], 1000, 'product'),
    ('smb_variations', 'sm.b', ARRAY['prod_surface_mount_boxes'], 990, 'product'),
    ('smb_variations', 'sm box', ARRAY['prod_surface_mount_boxes'], 980, 'product'),
    ('smb_variations', 'sm boxes', ARRAY['prod_surface_mount_boxes'], 980, 'product'),
    ('smb_variations', 'smbs', ARRAY['prod_surface_mount_boxes'], 970, 'product'),
    ('smb_variations', 'smb''s', ARRAY['prod_surface_mount_boxes'], 970, 'product'),
    ('smb_variations', 'smb box', ARRAY['prod_surface_mount_boxes'], 960, 'product'),
    ('smb_variations', 'smb boxes', ARRAY['prod_surface_mount_boxes'], 960, 'product'),
    ('smb_variations', 'surface mounting box', ARRAY['prod_surface_mount_boxes'], 950, 'product'),
    ('smb_variations', 'surface mounting boxes', ARRAY['prod_surface_mount_boxes'], 950, 'product'),
    ('smb_variations', 'surface-mount box', ARRAY['prod_surface_mount_boxes'], 950, 'product'),
    ('smb_variations', 'surface-mount boxes', ARRAY['prod_surface_mount_boxes'], 950, 'product'),
    ('smb_variations', 'surface mount outlet box', ARRAY['prod_surface_mount_boxes'], 940, 'product'),
    ('smb_variations', 'surface mount junction box', ARRAY['prod_surface_mount_boxes'], 940, 'product'),
    ('smb_variations', 'surface mount electrical box', ARRAY['prod_surface_mount_boxes'], 940, 'product'),
    ('smb_variations', 'surface mount data box', ARRAY['prod_surface_mount_boxes'], 940, 'product'),
    ('smb_variations', 'surface mount network box', ARRAY['prod_surface_mount_boxes'], 940, 'product'),
    ('smb_variations', 'box for surface mount', ARRAY['prod_surface_mount_boxes'], 930, 'product'),
    ('smb_variations', 'surface type box', ARRAY['prod_surface_mount_boxes'], 920, 'product'),
    ('smb_variations', 'surface style box', ARRAY['prod_surface_mount_boxes'], 920, 'product'),
    ('smb_variations', 'on-wall box', ARRAY['prod_surface_mount_boxes'], 910, 'product'),
    ('smb_variations', 'on wall box', ARRAY['prod_surface_mount_boxes'], 910, 'product'),
    ('smb_variations', 'wall surface box', ARRAY['prod_surface_mount_boxes'], 900, 'product'),
    
    -- Common misspellings
    ('smb_misspellings', 'surfce mount box', ARRAY['prod_surface_mount_boxes'], 500, 'product'),
    ('smb_misspellings', 'suface mount box', ARRAY['prod_surface_mount_boxes'], 500, 'product'),
    ('smb_misspellings', 'surfacemount box', ARRAY['prod_surface_mount_boxes'], 500, 'product'),
    ('smb_misspellings', 'serface mount box', ARRAY['prod_surface_mount_boxes'], 500, 'product'),
    ('smb_misspellings', 'serfice mount box', ARRAY['prod_surface_mount_boxes'], 500, 'product')
ON CONFLICT (search_term, term_group, context) DO UPDATE 
SET applicable_tables = EXCLUDED.applicable_tables,
    priority = EXCLUDED.priority;

-- Add modular plug pass-through terms
INSERT INTO search_terms (term_group, search_term, applicable_tables, priority, context)
VALUES 
    ('plug_passthrough', 'pass-thru', ARRAY['prod_modular_plugs'], 900, 'product'),
    ('plug_passthrough', 'poe feed-through', ARRAY['prod_modular_plugs'], 880, 'product'),
    ('plug_passthrough', 'ez rj45', ARRAY['prod_modular_plugs'], 870, 'product')
ON CONFLICT (search_term, term_group, context) DO UPDATE 
SET applicable_tables = EXCLUDED.applicable_tables,
    priority = EXCLUDED.priority;

COMMIT;