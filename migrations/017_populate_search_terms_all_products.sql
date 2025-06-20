-- Populate search_terms table for all product types
-- This completes the database-driven search implementation for all products

BEGIN;

-- ===================================
-- FIBER CABLES
-- ===================================

INSERT INTO search_terms (term_group, search_term, categories, applicable_tables) VALUES
-- Fiber types
('fiber_types', 'om1', '{"OM1"}', '{"prod_fiber_cables"}'),
('fiber_types', '62.5/125', '{"OM1"}', '{"prod_fiber_cables"}'),
('fiber_types', '62.5', '{"OM1"}', '{"prod_fiber_cables"}'),
('fiber_types', 'om2', '{"OM2"}', '{"prod_fiber_cables"}'),
('fiber_types', '50/125', '{"OM2","OM3","OM4"}', '{"prod_fiber_cables"}'),
('fiber_types', 'om3', '{"OM3"}', '{"prod_fiber_cables"}'),
('fiber_types', '10gig', '{"OM3","OM4"}', '{"prod_fiber_cables"}'),
('fiber_types', 'aqua', '{"OM3","OM4"}', '{"prod_fiber_cables"}'),
('fiber_types', 'om4', '{"OM4"}', '{"prod_fiber_cables"}'),
('fiber_types', 'violet', '{"OM4"}', '{"prod_fiber_cables"}'),
('fiber_types', 'os1', '{"OS1"}', '{"prod_fiber_cables"}'),
('fiber_types', 'os2', '{"OS2"}', '{"prod_fiber_cables"}'),
('fiber_types', 'singlemode', '{"OS1","OS2"}', '{"prod_fiber_cables"}'),
('fiber_types', 'single mode', '{"OS1","OS2"}', '{"prod_fiber_cables"}'),
('fiber_types', '9/125', '{"OS1","OS2"}', '{"prod_fiber_cables"}'),
('fiber_types', 'multimode', '{"OM1","OM2","OM3","OM4"}', '{"prod_fiber_cables"}'),
('fiber_types', 'multi mode', '{"OM1","OM2","OM3","OM4"}', '{"prod_fiber_cables"}');

-- Common fiber cable terms
INSERT INTO search_terms (term_group, search_term, applicable_tables) VALUES
('fiber_generic', 'fiber cable', '{"prod_fiber_cables"}'),
('fiber_generic', 'fiber optic', '{"prod_fiber_cables"}'),
('fiber_generic', 'fiber optic cable', '{"prod_fiber_cables"}'),
('fiber_generic', 'optical cable', '{"prod_fiber_cables"}'),
('fiber_generic', 'fo cable', '{"prod_fiber_cables"}');

-- ===================================
-- FIBER CONNECTORS
-- ===================================

INSERT INTO search_terms (term_group, search_term, categories, applicable_tables) VALUES
-- Connector types
('connector_types', 'lc', '{"LC"}', '{"prod_fiber_connectors","prod_adapter_panels"}'),
('connector_types', 'lc connector', '{"LC"}', '{"prod_fiber_connectors"}'),
('connector_types', 'sc', '{"SC"}', '{"prod_fiber_connectors","prod_adapter_panels"}'),
('connector_types', 'sc connector', '{"SC"}', '{"prod_fiber_connectors"}'),
('connector_types', 'st', '{"ST"}', '{"prod_fiber_connectors","prod_adapter_panels"}'),
('connector_types', 'st connector', '{"ST"}', '{"prod_fiber_connectors"}'),
('connector_types', 'fc', '{"FC"}', '{"prod_fiber_connectors","prod_adapter_panels"}'),
('connector_types', 'mtrj', '{"MTRJ"}', '{"prod_fiber_connectors","prod_adapter_panels"}'),
('connector_types', 'mpo', '{"MPO"}', '{"prod_fiber_connectors","prod_adapter_panels"}'),
('connector_types', 'mtp', '{"MTP"}', '{"prod_fiber_connectors","prod_adapter_panels"}');

-- Common fiber connector terms
INSERT INTO search_terms (term_group, search_term, applicable_tables) VALUES
('connector_generic', 'fiber connector', '{"prod_fiber_connectors"}'),
('connector_generic', 'fiber ends', '{"prod_fiber_connectors"}'),
('connector_generic', 'fiber termination', '{"prod_fiber_connectors"}'),
('connector_generic', 'optical connector', '{"prod_fiber_connectors"}');

-- ===================================
-- JACK MODULES
-- ===================================

INSERT INTO search_terms (term_group, search_term, categories, applicable_tables) VALUES
-- Category ratings for jacks
('jack_ratings', 'cat5e jack', '{"Category 5e"}', '{"prod_jack_modules"}'),
('jack_ratings', 'cat6 jack', '{"Category 6"}', '{"prod_jack_modules"}'),
('jack_ratings', 'cat6a jack', '{"Category 6A","Category 6a"}', '{"prod_jack_modules"}');

-- Product lines
INSERT INTO search_terms (term_group, search_term, product_lines, applicable_tables) VALUES
('jack_product_lines', 'minicom', '{"Mini-Com"}', '{"prod_jack_modules"}'),
('jack_product_lines', 'mini-com', '{"Mini-Com"}', '{"prod_jack_modules"}'),
('jack_product_lines', 'mini com', '{"Mini-Com"}', '{"prod_jack_modules"}'),
('jack_product_lines', 'netkey', '{"NetKey"}', '{"prod_jack_modules"}'),
('jack_product_lines', 'net key', '{"NetKey"}', '{"prod_jack_modules"}'),
('jack_product_lines', 'xcelerator', '{"Xcelerator"}', '{"prod_jack_modules"}'),
('jack_product_lines', 'netselect', '{"netSelect"}', '{"prod_jack_modules"}'),
('jack_product_lines', 'keystone', '{"Keystone"}', '{"prod_jack_modules"}');

-- Common jack terms
INSERT INTO search_terms (term_group, search_term, applicable_tables) VALUES
('jack_generic', 'jack', '{"prod_jack_modules"}'),
('jack_generic', 'jacks', '{"prod_jack_modules"}'),
('jack_generic', 'jack module', '{"prod_jack_modules"}'),
('jack_generic', 'jack modules', '{"prod_jack_modules"}'),
('jack_generic', 'rj45', '{"prod_jack_modules"}'),
('jack_generic', 'rj45 jack', '{"prod_jack_modules"}'),
('jack_generic', 'ethernet jack', '{"prod_jack_modules"}'),
('jack_generic', 'network jack', '{"prod_jack_modules"}'),
('jack_generic', 'data jack', '{"prod_jack_modules"}');

-- ===================================
-- MODULAR PLUGS
-- ===================================

INSERT INTO search_terms (term_group, search_term, product_lines, applicable_tables) VALUES
('plug_product_lines', 'simply 45', '{"Simply 45 PRO SERIES","Simply 45 INSTALLER SERIES"}', '{"prod_modular_plugs"}'),
('plug_product_lines', 's45', '{"Simply 45 PRO SERIES","Simply 45 INSTALLER SERIES"}', '{"prod_modular_plugs"}'),
('plug_product_lines', 'pro series', '{"Simply 45 PRO SERIES"}', '{"prod_modular_plugs"}'),
('plug_product_lines', 'installer series', '{"Simply 45 INSTALLER SERIES"}', '{"prod_modular_plugs"}');

-- Common plug terms
INSERT INTO search_terms (term_group, search_term, applicable_tables) VALUES
('plug_generic', 'plug', '{"prod_modular_plugs"}'),
('plug_generic', 'plugs', '{"prod_modular_plugs"}'),
('plug_generic', 'modular plug', '{"prod_modular_plugs"}'),
('plug_generic', 'rj45 plug', '{"prod_modular_plugs"}'),
('plug_generic', 'connector plug', '{"prod_modular_plugs"}'),
('plug_generic', 'pass-through', '{"prod_modular_plugs"}'),
('plug_generic', 'passthrough', '{"prod_modular_plugs"}'),
('plug_generic', 'pass through', '{"prod_modular_plugs"}'),
('plug_generic', 'feed-through', '{"prod_modular_plugs"}'),
('plug_generic', 'feedthrough', '{"prod_modular_plugs"}'),
('plug_generic', 'feed through', '{"prod_modular_plugs"}'),
('plug_generic', 'ez-rj45', '{"prod_modular_plugs"}'),
('plug_generic', 'ezrj45', '{"prod_modular_plugs"}');

-- ===================================
-- FACEPLATES
-- ===================================

INSERT INTO search_terms (term_group, search_term, applicable_tables) VALUES
('faceplate_generic', 'faceplate', '{"prod_faceplates"}'),
('faceplate_generic', 'face plate', '{"prod_faceplates"}'),
('faceplate_generic', 'wallplate', '{"prod_faceplates"}'),
('faceplate_generic', 'wall plate', '{"prod_faceplates"}'),
('faceplate_generic', 'datacom faceplate', '{"prod_faceplates"}'),
('faceplate_generic', 'datacom face plate', '{"prod_faceplates"}'),
('faceplate_generic', 'keystone faceplate', '{"prod_faceplates"}'),
('faceplate_generic', 'keystone wallplate', '{"prod_faceplates"}');

-- Port variations
INSERT INTO search_terms (term_group, search_term, categories, applicable_tables) VALUES
('faceplate_ports', '1 port', '{"1"}', '{"prod_faceplates"}'),
('faceplate_ports', 'single port', '{"1"}', '{"prod_faceplates"}'),
('faceplate_ports', '2 port', '{"2"}', '{"prod_faceplates"}'),
('faceplate_ports', 'dual port', '{"2"}', '{"prod_faceplates"}'),
('faceplate_ports', '3 port', '{"3"}', '{"prod_faceplates"}'),
('faceplate_ports', '4 port', '{"4"}', '{"prod_faceplates"}'),
('faceplate_ports', 'quad port', '{"4"}', '{"prod_faceplates"}'),
('faceplate_ports', '6 port', '{"6"}', '{"prod_faceplates"}');

-- ===================================
-- SURFACE MOUNT BOXES
-- ===================================

INSERT INTO search_terms (term_group, search_term, applicable_tables) VALUES
('smb_generic', 'surface mount box', '{"prod_surface_mount_boxes"}'),
('smb_generic', 'surface mount', '{"prod_surface_mount_boxes"}'),
('smb_generic', 'smb', '{"prod_surface_mount_boxes"}'),
('smb_generic', 's.m.b', '{"prod_surface_mount_boxes"}'),
('smb_generic', 's.m.b.', '{"prod_surface_mount_boxes"}'),
('smb_generic', 'surface box', '{"prod_surface_mount_boxes"}'),
('smb_generic', 'surface mount housing', '{"prod_surface_mount_boxes"}'),
('smb_generic', 'biscuit box', '{"prod_surface_mount_boxes"}'),
('smb_generic', 'biscuit', '{"prod_surface_mount_boxes"}');

-- Port variations for SMB
INSERT INTO search_terms (term_group, search_term, categories, applicable_tables) VALUES
('smb_ports', '1 port smb', '{"1"}', '{"prod_surface_mount_boxes"}'),
('smb_ports', '2 port smb', '{"2"}', '{"prod_surface_mount_boxes"}'),
('smb_ports', '4 port smb', '{"4"}', '{"prod_surface_mount_boxes"}'),
('smb_ports', '6 port smb', '{"6"}', '{"prod_surface_mount_boxes"}');

-- ===================================
-- FIBER ENCLOSURES
-- ===================================

INSERT INTO search_terms (term_group, search_term, applicable_tables) VALUES
('enclosure_generic', 'fiber enclosure', '{"prod_wall_mount_fiber_enclosures","prod_rack_mount_fiber_enclosures"}'),
('enclosure_generic', 'fiber patch panel', '{"prod_wall_mount_fiber_enclosures","prod_rack_mount_fiber_enclosures"}'),
('enclosure_generic', 'fiber housing', '{"prod_wall_mount_fiber_enclosures","prod_rack_mount_fiber_enclosures"}'),
('enclosure_generic', 'fiber cabinet', '{"prod_wall_mount_fiber_enclosures","prod_rack_mount_fiber_enclosures"}');

-- Wall mount specific
INSERT INTO search_terms (term_group, search_term, applicable_tables) VALUES
('wall_mount', 'wall mount', '{"prod_wall_mount_fiber_enclosures"}'),
('wall_mount', 'wall mounted', '{"prod_wall_mount_fiber_enclosures"}'),
('wall_mount', 'wall mount enclosure', '{"prod_wall_mount_fiber_enclosures"}'),
('wall_mount', 'wall mount fiber', '{"prod_wall_mount_fiber_enclosures"}');

-- Rack mount specific
INSERT INTO search_terms (term_group, search_term, applicable_tables) VALUES
('rack_mount', 'rack mount', '{"prod_rack_mount_fiber_enclosures"}'),
('rack_mount', 'rack mounted', '{"prod_rack_mount_fiber_enclosures"}'),
('rack_mount', 'rack mount enclosure', '{"prod_rack_mount_fiber_enclosures"}'),
('rack_mount', '1u', '{"prod_rack_mount_fiber_enclosures"}'),
('rack_mount', '2u', '{"prod_rack_mount_fiber_enclosures"}'),
('rack_mount', '3u', '{"prod_rack_mount_fiber_enclosures"}'),
('rack_mount', '4u', '{"prod_rack_mount_fiber_enclosures"}'),
('rack_mount', '1ru', '{"prod_rack_mount_fiber_enclosures"}'),
('rack_mount', '2ru', '{"prod_rack_mount_fiber_enclosures"}'),
('rack_mount', '3ru', '{"prod_rack_mount_fiber_enclosures"}'),
('rack_mount', '4ru', '{"prod_rack_mount_fiber_enclosures"}');

-- ===================================
-- ADAPTER PANELS
-- ===================================

INSERT INTO search_terms (term_group, search_term, applicable_tables) VALUES
('adapter_panel_generic', 'adapter panel', '{"prod_adapter_panels"}'),
('adapter_panel_generic', 'fiber adapter panel', '{"prod_adapter_panels"}'),
('adapter_panel_generic', 'fap', '{"prod_adapter_panels"}'),
('adapter_panel_generic', 'fiber panel', '{"prod_adapter_panels"}'),
('adapter_panel_generic', 'coupler panel', '{"prod_adapter_panels"}'),
('adapter_panel_generic', 'fiber coupler panel', '{"prod_adapter_panels"}');

-- Panel types
INSERT INTO search_terms (term_group, search_term, categories, applicable_tables) VALUES
('panel_types', 'cch', '{"CCH"}', '{"prod_adapter_panels"}'),
('panel_types', 'cch panel', '{"CCH"}', '{"prod_adapter_panels"}'),
('panel_types', 'lgx', '{"LGX"}', '{"prod_adapter_panels"}'),
('panel_types', 'lgx panel', '{"LGX"}', '{"prod_adapter_panels"}');

-- ===================================
-- COMMON MISSPELLINGS & VARIATIONS
-- ===================================

INSERT INTO search_terms (term_group, search_term, applicable_tables) VALUES
('misspellings', 'ehternet', '{"prod_category_cables","prod_jack_modules"}'),
('misspellings', 'ethenet', '{"prod_category_cables","prod_jack_modules"}'),
('misspellings', 'enternet', '{"prod_category_cables","prod_jack_modules"}'),
('misspellings', 'fibre', '{"prod_fiber_cables","prod_fiber_connectors"}'),
('misspellings', 'opitcal', '{"prod_fiber_cables","prod_fiber_connectors"}'),
('misspellings', 'conector', '{"prod_fiber_connectors","prod_jack_modules"}'),
('misspellings', 'facplate', '{"prod_faceplates"}'),
('misspellings', 'suface mount', '{"prod_surface_mount_boxes"}');

-- ===================================
-- VERIFY POPULATION
-- ===================================

-- Show counts by table
SELECT 
    'Search terms added by product type:' as info;

SELECT 
    applicable_tables[1] as product_table,
    COUNT(*) as search_term_count
FROM search_terms
WHERE created_at >= CURRENT_TIMESTAMP - INTERVAL '1 minute'
GROUP BY applicable_tables[1]
ORDER BY product_table;

-- Show total
SELECT 
    'Total new search terms added:' as info,
    COUNT(*) as total
FROM search_terms
WHERE created_at >= CURRENT_TIMESTAMP - INTERVAL '1 minute';

COMMIT;