-- ================================================================
-- PROPER MIGRATION STEP 2: Add Core Intelligence Data
-- FINAL VERSION - Uses both existing and new columns
-- ================================================================

BEGIN;

-- 1. Add high-priority redirects (these are checked FIRST)
INSERT INTO search_terms (term_group, search_term, redirect_to, context, priority, is_active, applicable_tables, is_system)
VALUES 
    -- Category redirects
    ('redirect', 'cat5', 'cat5e', 'redirect', 1000, true, ARRAY['prod_category_cables', 'prod_jack_modules', 'prod_modular_plugs']::text[], true),
    ('redirect', 'cat 5', 'cat5e', 'redirect', 1000, true, ARRAY['prod_category_cables', 'prod_jack_modules', 'prod_modular_plugs']::text[], true),
    ('redirect', 'category 5', 'category 5e', 'redirect', 1000, true, ARRAY['prod_category_cables', 'prod_jack_modules', 'prod_modular_plugs']::text[], true),
    ('redirect', 'cat5 cable', 'cat5e cable', 'redirect', 1000, true, ARRAY['prod_category_cables']::text[], true),
    ('redirect', 'cat5 cables', 'cat5e cables', 'redirect', 1000, true, ARRAY['prod_category_cables']::text[], true),
    
    -- SMB redirects
    ('redirect', 'smb', 'surface mount box', 'redirect', 1000, true, ARRAY['prod_surface_mount_boxes']::text[], true),
    ('redirect', 's.m.b', 'surface mount box', 'redirect', 1000, true, ARRAY['prod_surface_mount_boxes']::text[], true),
    ('redirect', 's.m.b.', 'surface mount box', 'redirect', 1000, true, ARRAY['prod_surface_mount_boxes']::text[], true),
    ('redirect', 's m b', 'surface mount box', 'redirect', 1000, true, ARRAY['prod_surface_mount_boxes']::text[], true),
    ('redirect', 'surface mount', 'surface mount box', 'redirect', 950, true, ARRAY['prod_surface_mount_boxes']::text[], true),
    
    -- Common misspellings
    ('redirect', 'cat6e', 'cat6', 'redirect', 900, true, ARRAY['prod_category_cables', 'prod_jack_modules', 'prod_modular_plugs']::text[], true),
    ('redirect', 'cat 6e', 'cat6', 'redirect', 900, true, ARRAY['prod_category_cables', 'prod_jack_modules', 'prod_modular_plugs']::text[], true),
    ('redirect', 'catagory', 'category', 'redirect', 900, true, ARRAY['prod_category_cables', 'prod_jack_modules', 'prod_modular_plugs']::text[], true),
    ('redirect', 'categroy', 'category', 'redirect', 900, true, ARRAY['prod_category_cables', 'prod_jack_modules', 'prod_modular_plugs']::text[], true),
    ('redirect', 'patchpanel', 'patch panel', 'redirect', 900, true, ARRAY['prod_adapter_panels']::text[], true),
    ('redirect', 'patch-panel', 'patch panel', 'redirect', 900, true, ARRAY['prod_adapter_panels']::text[], true),
    
    -- Fiber terminology
    ('redirect', 'fiber ends', 'fiber connectors', 'redirect', 950, true, ARRAY['prod_fiber_connectors']::text[], true),
    ('redirect', 'fiber terminations', 'fiber connectors', 'redirect', 950, true, ARRAY['prod_fiber_connectors']::text[], true)
ON CONFLICT DO NOTHING;

-- 2. Add unit conversions
INSERT INTO search_terms (term_group, search_term, conversion_factor, context, priority, is_active, notes, applicable_tables, is_system)
VALUES 
    ('conversion', 'box', 1000, 'quantity', 850, true, 'Standard box = 1000 feet', ARRAY['prod_category_cables', 'prod_fiber_cables']::text[], true),
    ('conversion', 'boxes', 1000, 'quantity', 850, true, 'Standard box = 1000 feet', ARRAY['prod_category_cables', 'prod_fiber_cables']::text[], true),
    ('conversion', 'spool', 1000, 'quantity', 850, true, 'Standard spool = 1000 feet', ARRAY['prod_category_cables', 'prod_fiber_cables']::text[], true),
    ('conversion', 'spools', 1000, 'quantity', 850, true, 'Standard spool = 1000 feet', ARRAY['prod_category_cables', 'prod_fiber_cables']::text[], true),
    ('conversion', 'reel', 1000, 'quantity', 850, true, 'Standard reel = 1000 feet', ARRAY['prod_category_cables', 'prod_fiber_cables']::text[], true),
    ('conversion', 'reels', 1000, 'quantity', 850, true, 'Standard reel = 1000 feet', ARRAY['prod_category_cables', 'prod_fiber_cables']::text[], true),
    ('conversion', 'pair', 2, 'quantity', 850, true, 'Fiber pair = 2 strands', ARRAY['prod_fiber_cables', 'prod_fiber_connectors']::text[], true),
    ('conversion', 'pairs', 2, 'quantity', 850, true, 'Fiber pairs = 2x strands', ARRAY['prod_fiber_cables', 'prod_fiber_connectors']::text[], true)
ON CONFLICT DO NOTHING;

-- 3. Add jacket type intelligence (using BOTH jackets and jacket_types columns)
INSERT INTO search_terms (term_group, search_term, jackets, jacket_types, context, priority, is_active, applicable_tables, is_system)
VALUES 
    -- Plenum variations (all map to 'Plenum')
    ('jacket', 'plenum', ARRAY['Plenum']::text[], ARRAY['Plenum']::text[], 'jacket', 800, true, ARRAY['prod_category_cables', 'prod_fiber_cables']::text[], true),
    ('jacket', 'cmp', ARRAY['Plenum']::text[], ARRAY['Plenum']::text[], 'jacket', 800, true, ARRAY['prod_category_cables', 'prod_fiber_cables']::text[], true),
    ('jacket', 'plenum rated', ARRAY['Plenum']::text[], ARRAY['Plenum']::text[], 'jacket', 800, true, ARRAY['prod_category_cables', 'prod_fiber_cables']::text[], true),
    ('jacket', 'plenum-rated', ARRAY['Plenum']::text[], ARRAY['Plenum']::text[], 'jacket', 800, true, ARRAY['prod_category_cables', 'prod_fiber_cables']::text[], true),
    ('jacket', 'plenum cable', ARRAY['Plenum']::text[], ARRAY['Plenum']::text[], 'jacket', 780, true, ARRAY['prod_category_cables', 'prod_fiber_cables']::text[], true),
    
    -- Riser variations (all map to 'Riser')
    ('jacket', 'riser', ARRAY['Riser']::text[], ARRAY['Riser']::text[], 'jacket', 800, true, ARRAY['prod_category_cables', 'prod_fiber_cables']::text[], true),
    ('jacket', 'cmr', ARRAY['Riser']::text[], ARRAY['Riser']::text[], 'jacket', 800, true, ARRAY['prod_category_cables', 'prod_fiber_cables']::text[], true),
    ('jacket', 'riser rated', ARRAY['Riser']::text[], ARRAY['Riser']::text[], 'jacket', 800, true, ARRAY['prod_category_cables', 'prod_fiber_cables']::text[], true),
    ('jacket', 'riser-rated', ARRAY['Riser']::text[], ARRAY['Riser']::text[], 'jacket', 800, true, ARRAY['prod_category_cables', 'prod_fiber_cables']::text[], true),
    ('jacket', 'non-plenum', ARRAY['Riser']::text[], ARRAY['Riser']::text[], 'jacket', 790, true, ARRAY['prod_category_cables', 'prod_fiber_cables']::text[], true),
    ('jacket', 'non plenum', ARRAY['Riser']::text[], ARRAY['Riser']::text[], 'jacket', 790, true, ARRAY['prod_category_cables', 'prod_fiber_cables']::text[], true),
    ('jacket', 'nonplenum', ARRAY['Riser']::text[], ARRAY['Riser']::text[], 'jacket', 790, true, ARRAY['prod_category_cables', 'prod_fiber_cables']::text[], true),
    ('jacket', 'pvc', ARRAY['Riser']::text[], ARRAY['Riser']::text[], 'jacket', 780, true, ARRAY['prod_category_cables', 'prod_fiber_cables']::text[], true),
    
    -- LSZH variations
    ('jacket', 'lszh', ARRAY['LSZH']::text[], ARRAY['LSZH']::text[], 'jacket', 800, true, ARRAY['prod_category_cables', 'prod_fiber_cables']::text[], true),
    ('jacket', 'ls0h', ARRAY['LSZH']::text[], ARRAY['LSZH']::text[], 'jacket', 800, true, ARRAY['prod_category_cables', 'prod_fiber_cables']::text[], true),
    ('jacket', 'low smoke', ARRAY['LSZH']::text[], ARRAY['LSZH']::text[], 'jacket', 790, true, ARRAY['prod_category_cables', 'prod_fiber_cables']::text[], true),
    ('jacket', 'zero halogen', ARRAY['LSZH']::text[], ARRAY['LSZH']::text[], 'jacket', 790, true, ARRAY['prod_category_cables', 'prod_fiber_cables']::text[], true),
    ('jacket', 'low smoke zero halogen', ARRAY['LSZH']::text[], ARRAY['LSZH']::text[], 'jacket', 790, true, ARRAY['prod_category_cables', 'prod_fiber_cables']::text[], true),
    
    -- Outdoor variations
    ('jacket', 'outdoor', ARRAY['Outdoor']::text[], ARRAY['Outdoor']::text[], 'jacket', 800, true, ARRAY['prod_category_cables', 'prod_fiber_cables']::text[], true),
    ('jacket', 'outdoor rated', ARRAY['Outdoor']::text[], ARRAY['Outdoor']::text[], 'jacket', 800, true, ARRAY['prod_category_cables', 'prod_fiber_cables']::text[], true),
    ('jacket', 'direct burial', ARRAY['Outdoor']::text[], ARRAY['Outdoor']::text[], 'jacket', 790, true, ARRAY['prod_category_cables', 'prod_fiber_cables']::text[], true),
    ('jacket', 'cmx', ARRAY['Outdoor']::text[], ARRAY['Outdoor']::text[], 'jacket', 800, true, ARRAY['prod_category_cables', 'prod_fiber_cables']::text[], true)
ON CONFLICT DO NOTHING;

-- 4. Add shielding type intelligence (using BOTH shielding and shielding_types columns)
INSERT INTO search_terms (term_group, search_term, shielding, shielding_types, context, priority, is_active, applicable_tables, is_system)
VALUES 
    -- Shielded variations
    ('shielding', 'shielded', ARRAY['STP', 'SFTP']::text[], ARRAY['STP', 'SFTP']::text[], 'shielding', 750, true, ARRAY['prod_category_cables', 'prod_jack_modules', 'prod_modular_plugs']::text[], true),
    ('shielding', 'stp', ARRAY['STP']::text[], ARRAY['STP']::text[], 'shielding', 800, true, ARRAY['prod_category_cables', 'prod_jack_modules', 'prod_modular_plugs']::text[], true),
    ('shielding', 's/utp', ARRAY['STP']::text[], ARRAY['STP']::text[], 'shielding', 800, true, ARRAY['prod_category_cables', 'prod_jack_modules', 'prod_modular_plugs']::text[], true),
    ('shielding', 'sftp', ARRAY['SFTP']::text[], ARRAY['SFTP']::text[], 'shielding', 800, true, ARRAY['prod_category_cables', 'prod_jack_modules', 'prod_modular_plugs']::text[], true),
    ('shielding', 's/ftp', ARRAY['SFTP']::text[], ARRAY['SFTP']::text[], 'shielding', 800, true, ARRAY['prod_category_cables', 'prod_jack_modules', 'prod_modular_plugs']::text[], true),
    ('shielding', 'foil', ARRAY['STP', 'SFTP']::text[], ARRAY['STP', 'SFTP']::text[], 'shielding', 700, true, ARRAY['prod_category_cables', 'prod_jack_modules', 'prod_modular_plugs']::text[], true),
    ('shielding', 'screened', ARRAY['STP', 'SFTP']::text[], ARRAY['STP', 'SFTP']::text[], 'shielding', 700, true, ARRAY['prod_category_cables', 'prod_jack_modules', 'prod_modular_plugs']::text[], true),
    
    -- Unshielded variations
    ('shielding', 'unshielded', ARRAY['UTP']::text[], ARRAY['UTP']::text[], 'shielding', 750, true, ARRAY['prod_category_cables', 'prod_jack_modules', 'prod_modular_plugs']::text[], true),
    ('shielding', 'utp', ARRAY['UTP']::text[], ARRAY['UTP']::text[], 'shielding', 800, true, ARRAY['prod_category_cables', 'prod_jack_modules', 'prod_modular_plugs']::text[], true),
    ('shielding', 'u/utp', ARRAY['UTP']::text[], ARRAY['UTP']::text[], 'shielding', 800, true, ARRAY['prod_category_cables', 'prod_jack_modules', 'prod_modular_plugs']::text[], true)
ON CONFLICT DO NOTHING;

-- 5. Add fiber type intelligence (using the new fiber_types column)
INSERT INTO search_terms (term_group, search_term, fiber_types, context, priority, is_active, applicable_tables, is_system)
VALUES 
    -- Multimode fiber types
    ('fiber', 'om1', ARRAY['OM1']::text[], 'fiber', 800, true, ARRAY['prod_fiber_cables', 'prod_fiber_connectors']::text[], true),
    ('fiber', 'om2', ARRAY['OM2']::text[], 'fiber', 800, true, ARRAY['prod_fiber_cables', 'prod_fiber_connectors']::text[], true),
    ('fiber', 'om3', ARRAY['OM3']::text[], 'fiber', 800, true, ARRAY['prod_fiber_cables', 'prod_fiber_connectors']::text[], true),
    ('fiber', 'om4', ARRAY['OM4']::text[], 'fiber', 800, true, ARRAY['prod_fiber_cables', 'prod_fiber_connectors']::text[], true),
    ('fiber', 'om5', ARRAY['OM5']::text[], 'fiber', 800, true, ARRAY['prod_fiber_cables', 'prod_fiber_connectors']::text[], true),
    
    -- Singlemode fiber types
    ('fiber', 'os1', ARRAY['OS1']::text[], 'fiber', 800, true, ARRAY['prod_fiber_cables', 'prod_fiber_connectors']::text[], true),
    ('fiber', 'os2', ARRAY['OS2']::text[], 'fiber', 800, true, ARRAY['prod_fiber_cables', 'prod_fiber_connectors']::text[], true),
    
    -- Generic fiber terms
    ('fiber', 'multimode', ARRAY['OM1', 'OM2', 'OM3', 'OM4', 'OM5']::text[], 'fiber', 750, true, ARRAY['prod_fiber_cables', 'prod_fiber_connectors']::text[], true),
    ('fiber', 'multi-mode', ARRAY['OM1', 'OM2', 'OM3', 'OM4', 'OM5']::text[], 'fiber', 750, true, ARRAY['prod_fiber_cables', 'prod_fiber_connectors']::text[], true),
    ('fiber', 'singlemode', ARRAY['OS1', 'OS2']::text[], 'fiber', 750, true, ARRAY['prod_fiber_cables', 'prod_fiber_connectors']::text[], true),
    ('fiber', 'single-mode', ARRAY['OS1', 'OS2']::text[], 'fiber', 750, true, ARRAY['prod_fiber_cables', 'prod_fiber_connectors']::text[], true)
ON CONFLICT DO NOTHING;

-- 6. Add connector type intelligence (using the new connector_types column)
INSERT INTO search_terms (term_group, search_term, connector_types, context, priority, is_active, applicable_tables, is_system)
VALUES 
    -- Common connector types
    ('connector', 'lc', ARRAY['LC']::text[], 'connector', 800, true, ARRAY['prod_fiber_connectors', 'prod_adapter_panels']::text[], true),
    ('connector', 'sc', ARRAY['SC']::text[], 'connector', 800, true, ARRAY['prod_fiber_connectors', 'prod_adapter_panels']::text[], true),
    ('connector', 'st', ARRAY['ST']::text[], 'connector', 800, true, ARRAY['prod_fiber_connectors', 'prod_adapter_panels']::text[], true),
    ('connector', 'fc', ARRAY['FC']::text[], 'connector', 800, true, ARRAY['prod_fiber_connectors', 'prod_adapter_panels']::text[], true),
    ('connector', 'mpo', ARRAY['MPO']::text[], 'connector', 800, true, ARRAY['prod_fiber_connectors', 'prod_adapter_panels']::text[], true),
    ('connector', 'mtp', ARRAY['MTP']::text[], 'connector', 800, true, ARRAY['prod_fiber_connectors', 'prod_adapter_panels']::text[], true),
    ('connector', 'mtrj', ARRAY['MTRJ']::text[], 'connector', 800, true, ARRAY['prod_fiber_connectors', 'prod_adapter_panels']::text[], true)
ON CONFLICT DO NOTHING;

-- 7. Add brand intelligence with common variations
INSERT INTO search_terms (term_group, search_term, brands, context, priority, is_active, applicable_tables, is_system)
VALUES 
    -- Panduit
    ('brand', 'pan', ARRAY['Panduit']::text[], 'brand', 600, true, 
     ARRAY['prod_category_cables', 'prod_jack_modules', 'prod_modular_plugs', 'prod_faceplates', 'prod_surface_mount_boxes']::text[], true),
    ('brand', 'pand', ARRAY['Panduit']::text[], 'brand', 600, true, 
     ARRAY['prod_category_cables', 'prod_jack_modules', 'prod_modular_plugs', 'prod_faceplates', 'prod_surface_mount_boxes']::text[], true),
    
    -- Corning
    ('brand', 'ccs', ARRAY['Corning Cable Systems']::text[], 'brand', 600, true, 
     ARRAY['prod_fiber_cables', 'prod_fiber_connectors', 'prod_adapter_panels']::text[], true),
    ('brand', 'ccg', ARRAY['Corning Cable Systems']::text[], 'brand', 600, true, 
     ARRAY['prod_fiber_cables', 'prod_fiber_connectors', 'prod_adapter_panels']::text[], true),
    ('brand', 'corning cable', ARRAY['Corning Cable Systems']::text[], 'brand', 590, true, 
     ARRAY['prod_fiber_cables', 'prod_fiber_connectors', 'prod_adapter_panels']::text[], true),
    
    -- General Cable
    ('brand', 'gc', ARRAY['General Cable']::text[], 'brand', 600, true, 
     ARRAY['prod_category_cables', 'prod_fiber_cables']::text[], true),
    ('brand', 'genecable', ARRAY['General Cable']::text[], 'brand', 590, true, 
     ARRAY['prod_category_cables', 'prod_fiber_cables']::text[], true),
    
    -- CommScope
    ('brand', 'cs', ARRAY['CommScope']::text[], 'brand', 600, true, 
     ARRAY['prod_category_cables', 'prod_jack_modules', 'prod_modular_plugs', 'prod_faceplates']::text[], true),
    ('brand', 'systimax', ARRAY['CommScope']::text[], 'brand', 590, true, 
     ARRAY['prod_category_cables', 'prod_jack_modules', 'prod_modular_plugs', 'prod_faceplates']::text[], true),
    
    -- Belden
    ('brand', 'bldn', ARRAY['Belden']::text[], 'brand', 600, true, 
     ARRAY['prod_category_cables', 'prod_fiber_cables']::text[], true)
ON CONFLICT DO NOTHING;

-- 8. Add color mappings with abbreviations
INSERT INTO search_terms (term_group, search_term, context, priority, is_active, notes, applicable_tables, is_system)
VALUES 
    -- Color abbreviations
    ('color', 'wh', 'color', 500, true, 'White abbreviation', 
     ARRAY['prod_category_cables', 'prod_fiber_cables', 'prod_jack_modules', 'prod_faceplates', 'prod_surface_mount_boxes']::text[], true),
    ('color', 'bl', 'color', 500, true, 'Blue/Black - needs context', 
     ARRAY['prod_category_cables', 'prod_fiber_cables', 'prod_jack_modules', 'prod_faceplates', 'prod_surface_mount_boxes']::text[], true),
    ('color', 'bk', 'color', 500, true, 'Black abbreviation', 
     ARRAY['prod_category_cables', 'prod_fiber_cables', 'prod_jack_modules', 'prod_faceplates', 'prod_surface_mount_boxes']::text[], true),
    ('color', 'gy', 'color', 500, true, 'Gray abbreviation', 
     ARRAY['prod_category_cables', 'prod_fiber_cables', 'prod_jack_modules', 'prod_faceplates', 'prod_surface_mount_boxes']::text[], true),
    ('color', 'gr', 'color', 500, true, 'Green/Gray - needs context', 
     ARRAY['prod_category_cables', 'prod_fiber_cables', 'prod_jack_modules', 'prod_faceplates', 'prod_surface_mount_boxes']::text[], true),
    ('color', 'yl', 'color', 500, true, 'Yellow abbreviation', 
     ARRAY['prod_category_cables', 'prod_fiber_cables', 'prod_jack_modules', 'prod_faceplates', 'prod_surface_mount_boxes']::text[], true),
    ('color', 'or', 'color', 500, true, 'Orange abbreviation', 
     ARRAY['prod_category_cables', 'prod_fiber_cables', 'prod_jack_modules', 'prod_faceplates', 'prod_surface_mount_boxes']::text[], true),
    ('color', 'rd', 'color', 500, true, 'Red abbreviation', 
     ARRAY['prod_category_cables', 'prod_fiber_cables', 'prod_jack_modules', 'prod_faceplates', 'prod_surface_mount_boxes']::text[], true),
    ('color', 'pr', 'color', 500, true, 'Purple abbreviation', 
     ARRAY['prod_category_cables', 'prod_fiber_cables', 'prod_jack_modules', 'prod_faceplates', 'prod_surface_mount_boxes']::text[], true),
    ('color', 'br', 'color', 500, true, 'Brown abbreviation', 
     ARRAY['prod_category_cables', 'prod_fiber_cables', 'prod_jack_modules', 'prod_faceplates', 'prod_surface_mount_boxes']::text[], true),
    
    -- Color variations
    ('color', 'grey', 'color', 490, true, 'Gray alternate spelling', 
     ARRAY['prod_category_cables', 'prod_fiber_cables', 'prod_jack_modules', 'prod_faceplates', 'prod_surface_mount_boxes']::text[], true),
    ('color', 'aqua', 'color', 490, true, 'Aqua/Light Blue', 
     ARRAY['prod_fiber_cables', 'prod_fiber_connectors']::text[], true)
ON CONFLICT DO NOTHING;

-- 9. Add detection patterns for part numbers
INSERT INTO search_terms (term_group, search_term, detection_pattern, context, priority, is_active, notes, applicable_tables, is_system)
VALUES 
    ('pattern', 'panduit_part', '^[A-Z]{2,4}[0-9]{1,4}[A-Z]{0,3}[0-9]{0,2}[A-Z]{0,2}$', 'part_number', 900, true, 'Panduit part pattern',
     ARRAY['prod_category_cables', 'prod_jack_modules', 'prod_modular_plugs', 'prod_faceplates', 'prod_surface_mount_boxes']::text[], true),
    ('pattern', 'corning_part', '^[0-9]{3,4}-[0-9]{3}', 'part_number', 900, true, 'Corning part pattern',
     ARRAY['prod_fiber_cables', 'prod_fiber_connectors', 'prod_adapter_panels']::text[], true),
    ('pattern', 'generic_part', '^[A-Z0-9]{2,}-[A-Z0-9]{2,}', 'part_number', 850, true, 'Generic part with dash',
     ARRAY['prod_category_cables', 'prod_fiber_cables', 'prod_jack_modules', 'prod_modular_plugs', 'prod_faceplates', 
            'prod_surface_mount_boxes', 'prod_fiber_connectors', 'prod_adapter_panels', 
            'prod_wall_mount_fiber_enclosures', 'prod_rack_mount_fiber_enclosures']::text[], true),
    ('pattern', 'numeric_length', '^[0-9]{1,4}[\s-]?(ft|feet|foot|m|meter|meters?)$', 'length', 700, true, 'Cable length pattern',
     ARRAY['prod_category_cables', 'prod_fiber_cables']::text[], true)
ON CONFLICT DO NOTHING;

-- 10. Verify the migration
SELECT '=== INTELLIGENCE SUMMARY ===' as step;
SELECT context, COUNT(*) as mappings
FROM search_terms
WHERE context IS NOT NULL
GROUP BY context
ORDER BY COUNT(*) DESC;

SELECT '=== HIGH PRIORITY ITEMS ===' as step;
SELECT search_term, redirect_to, context, priority
FROM search_terms
WHERE priority >= 900
ORDER BY priority DESC
LIMIT 10;

SELECT '=== SYSTEM MAPPINGS ===' as step;
SELECT COUNT(*) as system_mappings
FROM search_terms
WHERE is_system = true;

SELECT '=== TOTAL SEARCH TERMS ===' as step;
SELECT COUNT(*) as total_terms FROM search_terms;

COMMIT;

-- Summary
SELECT '✅ Step 2 Complete: Core intelligence data loaded with new columns!' as status,
       'Run PROPER_MIGRATION_STEP_3.sql next' as next_step;