-- Populate search_terms table for all product types (excluding prod_category_cables which already has data)
-- This completes the database-driven search implementation for all products
-- Fixed version that doesn't require unique constraints

BEGIN;

-- First, let's see what we already have
SELECT 
    'Current search_terms by table:' as info;

SELECT 
    unnest(applicable_tables) as product_table,
    COUNT(*) as existing_terms
FROM search_terms
GROUP BY unnest(applicable_tables)
ORDER BY product_table;

-- Create a temporary function to check if a term exists
CREATE OR REPLACE FUNCTION term_exists(p_term_group VARCHAR, p_search_term VARCHAR) 
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM search_terms 
        WHERE term_group = p_term_group 
        AND search_term = p_search_term
    );
END;
$$ LANGUAGE plpgsql;

-- ===================================
-- FIBER CABLES
-- ===================================

-- Fiber types
DO $$
BEGIN
    IF NOT term_exists('fiber_types', 'om1') THEN
        INSERT INTO search_terms (term_group, search_term, categories, applicable_tables) 
        VALUES ('fiber_types', 'om1', '{"OM1"}', '{"prod_fiber_cables"}');
    END IF;
    
    IF NOT term_exists('fiber_types', '62.5/125') THEN
        INSERT INTO search_terms (term_group, search_term, categories, applicable_tables) 
        VALUES ('fiber_types', '62.5/125', '{"OM1"}', '{"prod_fiber_cables"}');
    END IF;
    
    IF NOT term_exists('fiber_types', '62.5') THEN
        INSERT INTO search_terms (term_group, search_term, categories, applicable_tables) 
        VALUES ('fiber_types', '62.5', '{"OM1"}', '{"prod_fiber_cables"}');
    END IF;
    
    IF NOT term_exists('fiber_types', 'om2') THEN
        INSERT INTO search_terms (term_group, search_term, categories, applicable_tables) 
        VALUES ('fiber_types', 'om2', '{"OM2"}', '{"prod_fiber_cables"}');
    END IF;
    
    IF NOT term_exists('fiber_types', '50/125') THEN
        INSERT INTO search_terms (term_group, search_term, categories, applicable_tables) 
        VALUES ('fiber_types', '50/125', '{"OM2","OM3","OM4"}', '{"prod_fiber_cables"}');
    END IF;
    
    IF NOT term_exists('fiber_types', 'om3') THEN
        INSERT INTO search_terms (term_group, search_term, categories, applicable_tables) 
        VALUES ('fiber_types', 'om3', '{"OM3"}', '{"prod_fiber_cables"}');
    END IF;
    
    IF NOT term_exists('fiber_types', '10gig') THEN
        INSERT INTO search_terms (term_group, search_term, categories, applicable_tables) 
        VALUES ('fiber_types', '10gig', '{"OM3","OM4"}', '{"prod_fiber_cables"}');
    END IF;
    
    IF NOT term_exists('fiber_types', 'aqua') THEN
        INSERT INTO search_terms (term_group, search_term, categories, applicable_tables) 
        VALUES ('fiber_types', 'aqua', '{"OM3","OM4"}', '{"prod_fiber_cables"}');
    END IF;
    
    IF NOT term_exists('fiber_types', 'om4') THEN
        INSERT INTO search_terms (term_group, search_term, categories, applicable_tables) 
        VALUES ('fiber_types', 'om4', '{"OM4"}', '{"prod_fiber_cables"}');
    END IF;
    
    IF NOT term_exists('fiber_types', 'violet') THEN
        INSERT INTO search_terms (term_group, search_term, categories, applicable_tables) 
        VALUES ('fiber_types', 'violet', '{"OM4"}', '{"prod_fiber_cables"}');
    END IF;
    
    IF NOT term_exists('fiber_types', 'os1') THEN
        INSERT INTO search_terms (term_group, search_term, categories, applicable_tables) 
        VALUES ('fiber_types', 'os1', '{"OS1"}', '{"prod_fiber_cables"}');
    END IF;
    
    IF NOT term_exists('fiber_types', 'os2') THEN
        INSERT INTO search_terms (term_group, search_term, categories, applicable_tables) 
        VALUES ('fiber_types', 'os2', '{"OS2"}', '{"prod_fiber_cables"}');
    END IF;
    
    IF NOT term_exists('fiber_types', 'singlemode') THEN
        INSERT INTO search_terms (term_group, search_term, categories, applicable_tables) 
        VALUES ('fiber_types', 'singlemode', '{"OS1","OS2"}', '{"prod_fiber_cables"}');
    END IF;
    
    IF NOT term_exists('fiber_types', 'single mode') THEN
        INSERT INTO search_terms (term_group, search_term, categories, applicable_tables) 
        VALUES ('fiber_types', 'single mode', '{"OS1","OS2"}', '{"prod_fiber_cables"}');
    END IF;
    
    IF NOT term_exists('fiber_types', '9/125') THEN
        INSERT INTO search_terms (term_group, search_term, categories, applicable_tables) 
        VALUES ('fiber_types', '9/125', '{"OS1","OS2"}', '{"prod_fiber_cables"}');
    END IF;
    
    IF NOT term_exists('fiber_types', 'multimode') THEN
        INSERT INTO search_terms (term_group, search_term, categories, applicable_tables) 
        VALUES ('fiber_types', 'multimode', '{"OM1","OM2","OM3","OM4"}', '{"prod_fiber_cables"}');
    END IF;
    
    IF NOT term_exists('fiber_types', 'multi mode') THEN
        INSERT INTO search_terms (term_group, search_term, categories, applicable_tables) 
        VALUES ('fiber_types', 'multi mode', '{"OM1","OM2","OM3","OM4"}', '{"prod_fiber_cables"}');
    END IF;
END $$;

-- Common fiber cable terms
DO $$
BEGIN
    IF NOT term_exists('fiber_generic', 'fiber cable') THEN
        INSERT INTO search_terms (term_group, search_term, applicable_tables) 
        VALUES ('fiber_generic', 'fiber cable', '{"prod_fiber_cables"}');
    END IF;
    
    IF NOT term_exists('fiber_generic', 'fiber optic') THEN
        INSERT INTO search_terms (term_group, search_term, applicable_tables) 
        VALUES ('fiber_generic', 'fiber optic', '{"prod_fiber_cables"}');
    END IF;
    
    IF NOT term_exists('fiber_generic', 'fiber optic cable') THEN
        INSERT INTO search_terms (term_group, search_term, applicable_tables) 
        VALUES ('fiber_generic', 'fiber optic cable', '{"prod_fiber_cables"}');
    END IF;
    
    IF NOT term_exists('fiber_generic', 'optical cable') THEN
        INSERT INTO search_terms (term_group, search_term, applicable_tables) 
        VALUES ('fiber_generic', 'optical cable', '{"prod_fiber_cables"}');
    END IF;
    
    IF NOT term_exists('fiber_generic', 'fo cable') THEN
        INSERT INTO search_terms (term_group, search_term, applicable_tables) 
        VALUES ('fiber_generic', 'fo cable', '{"prod_fiber_cables"}');
    END IF;
END $$;

-- ===================================
-- FIBER CONNECTORS
-- ===================================

-- Connector types
DO $$
BEGIN
    IF NOT term_exists('connector_types', 'lc') THEN
        INSERT INTO search_terms (term_group, search_term, categories, applicable_tables) 
        VALUES ('connector_types', 'lc', '{"LC"}', '{"prod_fiber_connectors","prod_adapter_panels"}');
    END IF;
    
    IF NOT term_exists('connector_types', 'lc connector') THEN
        INSERT INTO search_terms (term_group, search_term, categories, applicable_tables) 
        VALUES ('connector_types', 'lc connector', '{"LC"}', '{"prod_fiber_connectors"}');
    END IF;
    
    IF NOT term_exists('connector_types', 'sc') THEN
        INSERT INTO search_terms (term_group, search_term, categories, applicable_tables) 
        VALUES ('connector_types', 'sc', '{"SC"}', '{"prod_fiber_connectors","prod_adapter_panels"}');
    END IF;
    
    IF NOT term_exists('connector_types', 'sc connector') THEN
        INSERT INTO search_terms (term_group, search_term, categories, applicable_tables) 
        VALUES ('connector_types', 'sc connector', '{"SC"}', '{"prod_fiber_connectors"}');
    END IF;
    
    IF NOT term_exists('connector_types', 'st') THEN
        INSERT INTO search_terms (term_group, search_term, categories, applicable_tables) 
        VALUES ('connector_types', 'st', '{"ST"}', '{"prod_fiber_connectors","prod_adapter_panels"}');
    END IF;
    
    IF NOT term_exists('connector_types', 'st connector') THEN
        INSERT INTO search_terms (term_group, search_term, categories, applicable_tables) 
        VALUES ('connector_types', 'st connector', '{"ST"}', '{"prod_fiber_connectors"}');
    END IF;
    
    IF NOT term_exists('connector_types', 'fc') THEN
        INSERT INTO search_terms (term_group, search_term, categories, applicable_tables) 
        VALUES ('connector_types', 'fc', '{"FC"}', '{"prod_fiber_connectors","prod_adapter_panels"}');
    END IF;
    
    IF NOT term_exists('connector_types', 'mtrj') THEN
        INSERT INTO search_terms (term_group, search_term, categories, applicable_tables) 
        VALUES ('connector_types', 'mtrj', '{"MTRJ"}', '{"prod_fiber_connectors","prod_adapter_panels"}');
    END IF;
    
    IF NOT term_exists('connector_types', 'mpo') THEN
        INSERT INTO search_terms (term_group, search_term, categories, applicable_tables) 
        VALUES ('connector_types', 'mpo', '{"MPO"}', '{"prod_fiber_connectors","prod_adapter_panels"}');
    END IF;
    
    IF NOT term_exists('connector_types', 'mtp') THEN
        INSERT INTO search_terms (term_group, search_term, categories, applicable_tables) 
        VALUES ('connector_types', 'mtp', '{"MTP"}', '{"prod_fiber_connectors","prod_adapter_panels"}');
    END IF;
END $$;

-- Common fiber connector terms
DO $$
BEGIN
    IF NOT term_exists('connector_generic', 'fiber connector') THEN
        INSERT INTO search_terms (term_group, search_term, applicable_tables) 
        VALUES ('connector_generic', 'fiber connector', '{"prod_fiber_connectors"}');
    END IF;
    
    IF NOT term_exists('connector_generic', 'fiber ends') THEN
        INSERT INTO search_terms (term_group, search_term, applicable_tables) 
        VALUES ('connector_generic', 'fiber ends', '{"prod_fiber_connectors"}');
    END IF;
    
    IF NOT term_exists('connector_generic', 'fiber termination') THEN
        INSERT INTO search_terms (term_group, search_term, applicable_tables) 
        VALUES ('connector_generic', 'fiber termination', '{"prod_fiber_connectors"}');
    END IF;
    
    IF NOT term_exists('connector_generic', 'optical connector') THEN
        INSERT INTO search_terms (term_group, search_term, applicable_tables) 
        VALUES ('connector_generic', 'optical connector', '{"prod_fiber_connectors"}');
    END IF;
END $$;

-- ===================================
-- JACK MODULES
-- ===================================

-- Category ratings for jacks
DO $$
BEGIN
    IF NOT term_exists('jack_ratings', 'cat5e jack') THEN
        INSERT INTO search_terms (term_group, search_term, categories, applicable_tables) 
        VALUES ('jack_ratings', 'cat5e jack', '{"Category 5e"}', '{"prod_jack_modules"}');
    END IF;
    
    IF NOT term_exists('jack_ratings', 'cat6 jack') THEN
        INSERT INTO search_terms (term_group, search_term, categories, applicable_tables) 
        VALUES ('jack_ratings', 'cat6 jack', '{"Category 6"}', '{"prod_jack_modules"}');
    END IF;
    
    IF NOT term_exists('jack_ratings', 'cat6a jack') THEN
        INSERT INTO search_terms (term_group, search_term, categories, applicable_tables) 
        VALUES ('jack_ratings', 'cat6a jack', '{"Category 6A","Category 6a"}', '{"prod_jack_modules"}');
    END IF;
END $$;

-- Product lines - Use product_lines column
DO $$
BEGIN
    IF NOT term_exists('jack_product_lines', 'minicom') THEN
        INSERT INTO search_terms (term_group, search_term, product_lines, applicable_tables) 
        VALUES ('jack_product_lines', 'minicom', '{"Mini-Com"}', '{"prod_jack_modules"}');
    END IF;
    
    IF NOT term_exists('jack_product_lines', 'mini-com') THEN
        INSERT INTO search_terms (term_group, search_term, product_lines, applicable_tables) 
        VALUES ('jack_product_lines', 'mini-com', '{"Mini-Com"}', '{"prod_jack_modules"}');
    END IF;
    
    IF NOT term_exists('jack_product_lines', 'mini com') THEN
        INSERT INTO search_terms (term_group, search_term, product_lines, applicable_tables) 
        VALUES ('jack_product_lines', 'mini com', '{"Mini-Com"}', '{"prod_jack_modules"}');
    END IF;
    
    IF NOT term_exists('jack_product_lines', 'netkey') THEN
        INSERT INTO search_terms (term_group, search_term, product_lines, applicable_tables) 
        VALUES ('jack_product_lines', 'netkey', '{"NetKey"}', '{"prod_jack_modules"}');
    END IF;
    
    IF NOT term_exists('jack_product_lines', 'net key') THEN
        INSERT INTO search_terms (term_group, search_term, product_lines, applicable_tables) 
        VALUES ('jack_product_lines', 'net key', '{"NetKey"}', '{"prod_jack_modules"}');
    END IF;
    
    IF NOT term_exists('jack_product_lines', 'xcelerator') THEN
        INSERT INTO search_terms (term_group, search_term, product_lines, applicable_tables) 
        VALUES ('jack_product_lines', 'xcelerator', '{"Xcelerator"}', '{"prod_jack_modules"}');
    END IF;
    
    IF NOT term_exists('jack_product_lines', 'netselect') THEN
        INSERT INTO search_terms (term_group, search_term, product_lines, applicable_tables) 
        VALUES ('jack_product_lines', 'netselect', '{"netSelect"}', '{"prod_jack_modules"}');
    END IF;
    
    IF NOT term_exists('jack_product_lines', 'keystone') THEN
        INSERT INTO search_terms (term_group, search_term, product_lines, applicable_tables) 
        VALUES ('jack_product_lines', 'keystone', '{"Keystone"}', '{"prod_jack_modules"}');
    END IF;
END $$;

-- Common jack terms
DO $$
BEGIN
    IF NOT term_exists('jack_generic', 'jack') THEN
        INSERT INTO search_terms (term_group, search_term, applicable_tables) 
        VALUES ('jack_generic', 'jack', '{"prod_jack_modules"}');
    END IF;
    
    IF NOT term_exists('jack_generic', 'jacks') THEN
        INSERT INTO search_terms (term_group, search_term, applicable_tables) 
        VALUES ('jack_generic', 'jacks', '{"prod_jack_modules"}');
    END IF;
    
    IF NOT term_exists('jack_generic', 'jack module') THEN
        INSERT INTO search_terms (term_group, search_term, applicable_tables) 
        VALUES ('jack_generic', 'jack module', '{"prod_jack_modules"}');
    END IF;
    
    IF NOT term_exists('jack_generic', 'jack modules') THEN
        INSERT INTO search_terms (term_group, search_term, applicable_tables) 
        VALUES ('jack_generic', 'jack modules', '{"prod_jack_modules"}');
    END IF;
    
    IF NOT term_exists('jack_generic', 'rj45') THEN
        INSERT INTO search_terms (term_group, search_term, applicable_tables) 
        VALUES ('jack_generic', 'rj45', '{"prod_jack_modules"}');
    END IF;
    
    IF NOT term_exists('jack_generic', 'rj45 jack') THEN
        INSERT INTO search_terms (term_group, search_term, applicable_tables) 
        VALUES ('jack_generic', 'rj45 jack', '{"prod_jack_modules"}');
    END IF;
    
    IF NOT term_exists('jack_generic', 'ethernet jack') THEN
        INSERT INTO search_terms (term_group, search_term, applicable_tables) 
        VALUES ('jack_generic', 'ethernet jack', '{"prod_jack_modules"}');
    END IF;
    
    IF NOT term_exists('jack_generic', 'network jack') THEN
        INSERT INTO search_terms (term_group, search_term, applicable_tables) 
        VALUES ('jack_generic', 'network jack', '{"prod_jack_modules"}');
    END IF;
    
    IF NOT term_exists('jack_generic', 'data jack') THEN
        INSERT INTO search_terms (term_group, search_term, applicable_tables) 
        VALUES ('jack_generic', 'data jack', '{"prod_jack_modules"}');
    END IF;
END $$;

-- ===================================
-- MODULAR PLUGS
-- ===================================

-- Product lines for plugs
DO $$
BEGIN
    IF NOT term_exists('plug_product_lines', 'simply 45') THEN
        INSERT INTO search_terms (term_group, search_term, product_lines, applicable_tables) 
        VALUES ('plug_product_lines', 'simply 45', '{"Simply 45 PRO SERIES","Simply 45 INSTALLER SERIES"}', '{"prod_modular_plugs"}');
    END IF;
    
    IF NOT term_exists('plug_product_lines', 's45') THEN
        INSERT INTO search_terms (term_group, search_term, product_lines, applicable_tables) 
        VALUES ('plug_product_lines', 's45', '{"Simply 45 PRO SERIES","Simply 45 INSTALLER SERIES"}', '{"prod_modular_plugs"}');
    END IF;
    
    IF NOT term_exists('plug_product_lines', 'pro series') THEN
        INSERT INTO search_terms (term_group, search_term, product_lines, applicable_tables) 
        VALUES ('plug_product_lines', 'pro series', '{"Simply 45 PRO SERIES"}', '{"prod_modular_plugs"}');
    END IF;
    
    IF NOT term_exists('plug_product_lines', 'installer series') THEN
        INSERT INTO search_terms (term_group, search_term, product_lines, applicable_tables) 
        VALUES ('plug_product_lines', 'installer series', '{"Simply 45 INSTALLER SERIES"}', '{"prod_modular_plugs"}');
    END IF;
END $$;

-- Common plug terms
DO $$
BEGIN
    IF NOT term_exists('plug_generic', 'plug') THEN
        INSERT INTO search_terms (term_group, search_term, applicable_tables) 
        VALUES ('plug_generic', 'plug', '{"prod_modular_plugs"}');
    END IF;
    
    IF NOT term_exists('plug_generic', 'plugs') THEN
        INSERT INTO search_terms (term_group, search_term, applicable_tables) 
        VALUES ('plug_generic', 'plugs', '{"prod_modular_plugs"}');
    END IF;
    
    IF NOT term_exists('plug_generic', 'modular plug') THEN
        INSERT INTO search_terms (term_group, search_term, applicable_tables) 
        VALUES ('plug_generic', 'modular plug', '{"prod_modular_plugs"}');
    END IF;
    
    IF NOT term_exists('plug_generic', 'rj45 plug') THEN
        INSERT INTO search_terms (term_group, search_term, applicable_tables) 
        VALUES ('plug_generic', 'rj45 plug', '{"prod_modular_plugs"}');
    END IF;
    
    IF NOT term_exists('plug_generic', 'connector plug') THEN
        INSERT INTO search_terms (term_group, search_term, applicable_tables) 
        VALUES ('plug_generic', 'connector plug', '{"prod_modular_plugs"}');
    END IF;
    
    IF NOT term_exists('plug_generic', 'pass-through') THEN
        INSERT INTO search_terms (term_group, search_term, applicable_tables) 
        VALUES ('plug_generic', 'pass-through', '{"prod_modular_plugs"}');
    END IF;
    
    IF NOT term_exists('plug_generic', 'passthrough') THEN
        INSERT INTO search_terms (term_group, search_term, applicable_tables) 
        VALUES ('plug_generic', 'passthrough', '{"prod_modular_plugs"}');
    END IF;
    
    IF NOT term_exists('plug_generic', 'pass through') THEN
        INSERT INTO search_terms (term_group, search_term, applicable_tables) 
        VALUES ('plug_generic', 'pass through', '{"prod_modular_plugs"}');
    END IF;
    
    IF NOT term_exists('plug_generic', 'feed-through') THEN
        INSERT INTO search_terms (term_group, search_term, applicable_tables) 
        VALUES ('plug_generic', 'feed-through', '{"prod_modular_plugs"}');
    END IF;
    
    IF NOT term_exists('plug_generic', 'feedthrough') THEN
        INSERT INTO search_terms (term_group, search_term, applicable_tables) 
        VALUES ('plug_generic', 'feedthrough', '{"prod_modular_plugs"}');
    END IF;
    
    IF NOT term_exists('plug_generic', 'feed through') THEN
        INSERT INTO search_terms (term_group, search_term, applicable_tables) 
        VALUES ('plug_generic', 'feed through', '{"prod_modular_plugs"}');
    END IF;
    
    IF NOT term_exists('plug_generic', 'ez-rj45') THEN
        INSERT INTO search_terms (term_group, search_term, applicable_tables) 
        VALUES ('plug_generic', 'ez-rj45', '{"prod_modular_plugs"}');
    END IF;
    
    IF NOT term_exists('plug_generic', 'ezrj45') THEN
        INSERT INTO search_terms (term_group, search_term, applicable_tables) 
        VALUES ('plug_generic', 'ezrj45', '{"prod_modular_plugs"}');
    END IF;
END $$;

-- ===================================
-- FACEPLATES
-- ===================================

DO $$
BEGIN
    IF NOT term_exists('faceplate_generic', 'faceplate') THEN
        INSERT INTO search_terms (term_group, search_term, applicable_tables) 
        VALUES ('faceplate_generic', 'faceplate', '{"prod_faceplates"}');
    END IF;
    
    IF NOT term_exists('faceplate_generic', 'face plate') THEN
        INSERT INTO search_terms (term_group, search_term, applicable_tables) 
        VALUES ('faceplate_generic', 'face plate', '{"prod_faceplates"}');
    END IF;
    
    IF NOT term_exists('faceplate_generic', 'wallplate') THEN
        INSERT INTO search_terms (term_group, search_term, applicable_tables) 
        VALUES ('faceplate_generic', 'wallplate', '{"prod_faceplates"}');
    END IF;
    
    IF NOT term_exists('faceplate_generic', 'wall plate') THEN
        INSERT INTO search_terms (term_group, search_term, applicable_tables) 
        VALUES ('faceplate_generic', 'wall plate', '{"prod_faceplates"}');
    END IF;
    
    IF NOT term_exists('faceplate_generic', 'datacom faceplate') THEN
        INSERT INTO search_terms (term_group, search_term, applicable_tables) 
        VALUES ('faceplate_generic', 'datacom faceplate', '{"prod_faceplates"}');
    END IF;
    
    IF NOT term_exists('faceplate_generic', 'datacom face plate') THEN
        INSERT INTO search_terms (term_group, search_term, applicable_tables) 
        VALUES ('faceplate_generic', 'datacom face plate', '{"prod_faceplates"}');
    END IF;
    
    IF NOT term_exists('faceplate_generic', 'keystone faceplate') THEN
        INSERT INTO search_terms (term_group, search_term, applicable_tables) 
        VALUES ('faceplate_generic', 'keystone faceplate', '{"prod_faceplates"}');
    END IF;
    
    IF NOT term_exists('faceplate_generic', 'keystone wallplate') THEN
        INSERT INTO search_terms (term_group, search_term, applicable_tables) 
        VALUES ('faceplate_generic', 'keystone wallplate', '{"prod_faceplates"}');
    END IF;
END $$;

-- Port variations
DO $$
BEGIN
    IF NOT term_exists('faceplate_ports', '1 port') THEN
        INSERT INTO search_terms (term_group, search_term, categories, applicable_tables) 
        VALUES ('faceplate_ports', '1 port', '{"1"}', '{"prod_faceplates"}');
    END IF;
    
    IF NOT term_exists('faceplate_ports', 'single port') THEN
        INSERT INTO search_terms (term_group, search_term, categories, applicable_tables) 
        VALUES ('faceplate_ports', 'single port', '{"1"}', '{"prod_faceplates"}');
    END IF;
    
    IF NOT term_exists('faceplate_ports', '2 port') THEN
        INSERT INTO search_terms (term_group, search_term, categories, applicable_tables) 
        VALUES ('faceplate_ports', '2 port', '{"2"}', '{"prod_faceplates"}');
    END IF;
    
    IF NOT term_exists('faceplate_ports', 'dual port') THEN
        INSERT INTO search_terms (term_group, search_term, categories, applicable_tables) 
        VALUES ('faceplate_ports', 'dual port', '{"2"}', '{"prod_faceplates"}');
    END IF;
    
    IF NOT term_exists('faceplate_ports', '3 port') THEN
        INSERT INTO search_terms (term_group, search_term, categories, applicable_tables) 
        VALUES ('faceplate_ports', '3 port', '{"3"}', '{"prod_faceplates"}');
    END IF;
    
    IF NOT term_exists('faceplate_ports', '4 port') THEN
        INSERT INTO search_terms (term_group, search_term, categories, applicable_tables) 
        VALUES ('faceplate_ports', '4 port', '{"4"}', '{"prod_faceplates"}');
    END IF;
    
    IF NOT term_exists('faceplate_ports', 'quad port') THEN
        INSERT INTO search_terms (term_group, search_term, categories, applicable_tables) 
        VALUES ('faceplate_ports', 'quad port', '{"4"}', '{"prod_faceplates"}');
    END IF;
    
    IF NOT term_exists('faceplate_ports', '6 port') THEN
        INSERT INTO search_terms (term_group, search_term, categories, applicable_tables) 
        VALUES ('faceplate_ports', '6 port', '{"6"}', '{"prod_faceplates"}');
    END IF;
END $$;

-- ===================================
-- SURFACE MOUNT BOXES
-- ===================================

DO $$
BEGIN
    IF NOT term_exists('smb_generic', 'surface mount box') THEN
        INSERT INTO search_terms (term_group, search_term, applicable_tables) 
        VALUES ('smb_generic', 'surface mount box', '{"prod_surface_mount_boxes"}');
    END IF;
    
    IF NOT term_exists('smb_generic', 'surface mount') THEN
        INSERT INTO search_terms (term_group, search_term, applicable_tables) 
        VALUES ('smb_generic', 'surface mount', '{"prod_surface_mount_boxes"}');
    END IF;
    
    IF NOT term_exists('smb_generic', 'smb') THEN
        INSERT INTO search_terms (term_group, search_term, applicable_tables) 
        VALUES ('smb_generic', 'smb', '{"prod_surface_mount_boxes"}');
    END IF;
    
    IF NOT term_exists('smb_generic', 's.m.b') THEN
        INSERT INTO search_terms (term_group, search_term, applicable_tables) 
        VALUES ('smb_generic', 's.m.b', '{"prod_surface_mount_boxes"}');
    END IF;
    
    IF NOT term_exists('smb_generic', 's.m.b.') THEN
        INSERT INTO search_terms (term_group, search_term, applicable_tables) 
        VALUES ('smb_generic', 's.m.b.', '{"prod_surface_mount_boxes"}');
    END IF;
    
    IF NOT term_exists('smb_generic', 'surface box') THEN
        INSERT INTO search_terms (term_group, search_term, applicable_tables) 
        VALUES ('smb_generic', 'surface box', '{"prod_surface_mount_boxes"}');
    END IF;
    
    IF NOT term_exists('smb_generic', 'surface mount housing') THEN
        INSERT INTO search_terms (term_group, search_term, applicable_tables) 
        VALUES ('smb_generic', 'surface mount housing', '{"prod_surface_mount_boxes"}');
    END IF;
    
    IF NOT term_exists('smb_generic', 'biscuit box') THEN
        INSERT INTO search_terms (term_group, search_term, applicable_tables) 
        VALUES ('smb_generic', 'biscuit box', '{"prod_surface_mount_boxes"}');
    END IF;
    
    IF NOT term_exists('smb_generic', 'biscuit') THEN
        INSERT INTO search_terms (term_group, search_term, applicable_tables) 
        VALUES ('smb_generic', 'biscuit', '{"prod_surface_mount_boxes"}');
    END IF;
END $$;

-- Port variations for SMB
DO $$
BEGIN
    IF NOT term_exists('smb_ports', '1 port smb') THEN
        INSERT INTO search_terms (term_group, search_term, categories, applicable_tables) 
        VALUES ('smb_ports', '1 port smb', '{"1"}', '{"prod_surface_mount_boxes"}');
    END IF;
    
    IF NOT term_exists('smb_ports', '2 port smb') THEN
        INSERT INTO search_terms (term_group, search_term, categories, applicable_tables) 
        VALUES ('smb_ports', '2 port smb', '{"2"}', '{"prod_surface_mount_boxes"}');
    END IF;
    
    IF NOT term_exists('smb_ports', '4 port smb') THEN
        INSERT INTO search_terms (term_group, search_term, categories, applicable_tables) 
        VALUES ('smb_ports', '4 port smb', '{"4"}', '{"prod_surface_mount_boxes"}');
    END IF;
    
    IF NOT term_exists('smb_ports', '6 port smb') THEN
        INSERT INTO search_terms (term_group, search_term, categories, applicable_tables) 
        VALUES ('smb_ports', '6 port smb', '{"6"}', '{"prod_surface_mount_boxes"}');
    END IF;
END $$;

-- ===================================
-- FIBER ENCLOSURES
-- ===================================

DO $$
BEGIN
    IF NOT term_exists('enclosure_generic', 'fiber enclosure') THEN
        INSERT INTO search_terms (term_group, search_term, applicable_tables) 
        VALUES ('enclosure_generic', 'fiber enclosure', '{"prod_wall_mount_fiber_enclosures","prod_rack_mount_fiber_enclosures"}');
    END IF;
    
    IF NOT term_exists('enclosure_generic', 'fiber patch panel') THEN
        INSERT INTO search_terms (term_group, search_term, applicable_tables) 
        VALUES ('enclosure_generic', 'fiber patch panel', '{"prod_wall_mount_fiber_enclosures","prod_rack_mount_fiber_enclosures"}');
    END IF;
    
    IF NOT term_exists('enclosure_generic', 'fiber housing') THEN
        INSERT INTO search_terms (term_group, search_term, applicable_tables) 
        VALUES ('enclosure_generic', 'fiber housing', '{"prod_wall_mount_fiber_enclosures","prod_rack_mount_fiber_enclosures"}');
    END IF;
    
    IF NOT term_exists('enclosure_generic', 'fiber cabinet') THEN
        INSERT INTO search_terms (term_group, search_term, applicable_tables) 
        VALUES ('enclosure_generic', 'fiber cabinet', '{"prod_wall_mount_fiber_enclosures","prod_rack_mount_fiber_enclosures"}');
    END IF;
END $$;

-- Wall mount specific
DO $$
BEGIN
    IF NOT term_exists('wall_mount', 'wall mount') THEN
        INSERT INTO search_terms (term_group, search_term, applicable_tables) 
        VALUES ('wall_mount', 'wall mount', '{"prod_wall_mount_fiber_enclosures"}');
    END IF;
    
    IF NOT term_exists('wall_mount', 'wall mounted') THEN
        INSERT INTO search_terms (term_group, search_term, applicable_tables) 
        VALUES ('wall_mount', 'wall mounted', '{"prod_wall_mount_fiber_enclosures"}');
    END IF;
    
    IF NOT term_exists('wall_mount', 'wall mount enclosure') THEN
        INSERT INTO search_terms (term_group, search_term, applicable_tables) 
        VALUES ('wall_mount', 'wall mount enclosure', '{"prod_wall_mount_fiber_enclosures"}');
    END IF;
    
    IF NOT term_exists('wall_mount', 'wall mount fiber') THEN
        INSERT INTO search_terms (term_group, search_term, applicable_tables) 
        VALUES ('wall_mount', 'wall mount fiber', '{"prod_wall_mount_fiber_enclosures"}');
    END IF;
END $$;

-- Rack mount specific
DO $$
BEGIN
    IF NOT term_exists('rack_mount', 'rack mount') THEN
        INSERT INTO search_terms (term_group, search_term, applicable_tables) 
        VALUES ('rack_mount', 'rack mount', '{"prod_rack_mount_fiber_enclosures"}');
    END IF;
    
    IF NOT term_exists('rack_mount', 'rack mounted') THEN
        INSERT INTO search_terms (term_group, search_term, applicable_tables) 
        VALUES ('rack_mount', 'rack mounted', '{"prod_rack_mount_fiber_enclosures"}');
    END IF;
    
    IF NOT term_exists('rack_mount', 'rack mount enclosure') THEN
        INSERT INTO search_terms (term_group, search_term, applicable_tables) 
        VALUES ('rack_mount', 'rack mount enclosure', '{"prod_rack_mount_fiber_enclosures"}');
    END IF;
    
    IF NOT term_exists('rack_mount', '1u') THEN
        INSERT INTO search_terms (term_group, search_term, applicable_tables) 
        VALUES ('rack_mount', '1u', '{"prod_rack_mount_fiber_enclosures"}');
    END IF;
    
    IF NOT term_exists('rack_mount', '2u') THEN
        INSERT INTO search_terms (term_group, search_term, applicable_tables) 
        VALUES ('rack_mount', '2u', '{"prod_rack_mount_fiber_enclosures"}');
    END IF;
    
    IF NOT term_exists('rack_mount', '3u') THEN
        INSERT INTO search_terms (term_group, search_term, applicable_tables) 
        VALUES ('rack_mount', '3u', '{"prod_rack_mount_fiber_enclosures"}');
    END IF;
    
    IF NOT term_exists('rack_mount', '4u') THEN
        INSERT INTO search_terms (term_group, search_term, applicable_tables) 
        VALUES ('rack_mount', '4u', '{"prod_rack_mount_fiber_enclosures"}');
    END IF;
    
    IF NOT term_exists('rack_mount', '1ru') THEN
        INSERT INTO search_terms (term_group, search_term, applicable_tables) 
        VALUES ('rack_mount', '1ru', '{"prod_rack_mount_fiber_enclosures"}');
    END IF;
    
    IF NOT term_exists('rack_mount', '2ru') THEN
        INSERT INTO search_terms (term_group, search_term, applicable_tables) 
        VALUES ('rack_mount', '2ru', '{"prod_rack_mount_fiber_enclosures"}');
    END IF;
    
    IF NOT term_exists('rack_mount', '3ru') THEN
        INSERT INTO search_terms (term_group, search_term, applicable_tables) 
        VALUES ('rack_mount', '3ru', '{"prod_rack_mount_fiber_enclosures"}');
    END IF;
    
    IF NOT term_exists('rack_mount', '4ru') THEN
        INSERT INTO search_terms (term_group, search_term, applicable_tables) 
        VALUES ('rack_mount', '4ru', '{"prod_rack_mount_fiber_enclosures"}');
    END IF;
END $$;

-- ===================================
-- ADAPTER PANELS
-- ===================================

DO $$
BEGIN
    IF NOT term_exists('adapter_panel_generic', 'adapter panel') THEN
        INSERT INTO search_terms (term_group, search_term, applicable_tables) 
        VALUES ('adapter_panel_generic', 'adapter panel', '{"prod_adapter_panels"}');
    END IF;
    
    IF NOT term_exists('adapter_panel_generic', 'fiber adapter panel') THEN
        INSERT INTO search_terms (term_group, search_term, applicable_tables) 
        VALUES ('adapter_panel_generic', 'fiber adapter panel', '{"prod_adapter_panels"}');
    END IF;
    
    IF NOT term_exists('adapter_panel_generic', 'fap') THEN
        INSERT INTO search_terms (term_group, search_term, applicable_tables) 
        VALUES ('adapter_panel_generic', 'fap', '{"prod_adapter_panels"}');
    END IF;
    
    IF NOT term_exists('adapter_panel_generic', 'fiber panel') THEN
        INSERT INTO search_terms (term_group, search_term, applicable_tables) 
        VALUES ('adapter_panel_generic', 'fiber panel', '{"prod_adapter_panels"}');
    END IF;
    
    IF NOT term_exists('adapter_panel_generic', 'coupler panel') THEN
        INSERT INTO search_terms (term_group, search_term, applicable_tables) 
        VALUES ('adapter_panel_generic', 'coupler panel', '{"prod_adapter_panels"}');
    END IF;
    
    IF NOT term_exists('adapter_panel_generic', 'fiber coupler panel') THEN
        INSERT INTO search_terms (term_group, search_term, applicable_tables) 
        VALUES ('adapter_panel_generic', 'fiber coupler panel', '{"prod_adapter_panels"}');
    END IF;
END $$;

-- Panel types
DO $$
BEGIN
    IF NOT term_exists('panel_types', 'cch') THEN
        INSERT INTO search_terms (term_group, search_term, categories, applicable_tables) 
        VALUES ('panel_types', 'cch', '{"CCH"}', '{"prod_adapter_panels"}');
    END IF;
    
    IF NOT term_exists('panel_types', 'cch panel') THEN
        INSERT INTO search_terms (term_group, search_term, categories, applicable_tables) 
        VALUES ('panel_types', 'cch panel', '{"CCH"}', '{"prod_adapter_panels"}');
    END IF;
    
    IF NOT term_exists('panel_types', 'lgx') THEN
        INSERT INTO search_terms (term_group, search_term, categories, applicable_tables) 
        VALUES ('panel_types', 'lgx', '{"LGX"}', '{"prod_adapter_panels"}');
    END IF;
    
    IF NOT term_exists('panel_types', 'lgx panel') THEN
        INSERT INTO search_terms (term_group, search_term, categories, applicable_tables) 
        VALUES ('panel_types', 'lgx panel', '{"LGX"}', '{"prod_adapter_panels"}');
    END IF;
END $$;

-- ===================================
-- COMMON MISSPELLINGS & VARIATIONS
-- ===================================

DO $$
BEGIN
    IF NOT term_exists('misspellings', 'ehternet') THEN
        INSERT INTO search_terms (term_group, search_term, applicable_tables) 
        VALUES ('misspellings', 'ehternet', '{"prod_category_cables","prod_jack_modules"}');
    END IF;
    
    IF NOT term_exists('misspellings', 'ethenet') THEN
        INSERT INTO search_terms (term_group, search_term, applicable_tables) 
        VALUES ('misspellings', 'ethenet', '{"prod_category_cables","prod_jack_modules"}');
    END IF;
    
    IF NOT term_exists('misspellings', 'enternet') THEN
        INSERT INTO search_terms (term_group, search_term, applicable_tables) 
        VALUES ('misspellings', 'enternet', '{"prod_category_cables","prod_jack_modules"}');
    END IF;
    
    IF NOT term_exists('misspellings', 'fibre') THEN
        INSERT INTO search_terms (term_group, search_term, applicable_tables) 
        VALUES ('misspellings', 'fibre', '{"prod_fiber_cables","prod_fiber_connectors"}');
    END IF;
    
    IF NOT term_exists('misspellings', 'opitcal') THEN
        INSERT INTO search_terms (term_group, search_term, applicable_tables) 
        VALUES ('misspellings', 'opitcal', '{"prod_fiber_cables","prod_fiber_connectors"}');
    END IF;
    
    IF NOT term_exists('misspellings', 'conector') THEN
        INSERT INTO search_terms (term_group, search_term, applicable_tables) 
        VALUES ('misspellings', 'conector', '{"prod_fiber_connectors","prod_jack_modules"}');
    END IF;
    
    IF NOT term_exists('misspellings', 'facplate') THEN
        INSERT INTO search_terms (term_group, search_term, applicable_tables) 
        VALUES ('misspellings', 'facplate', '{"prod_faceplates"}');
    END IF;
    
    IF NOT term_exists('misspellings', 'suface mount') THEN
        INSERT INTO search_terms (term_group, search_term, applicable_tables) 
        VALUES ('misspellings', 'suface mount', '{"prod_surface_mount_boxes"}');
    END IF;
END $$;

-- Clean up the temporary function
DROP FUNCTION IF EXISTS term_exists(VARCHAR, VARCHAR);

-- ===================================
-- VERIFY POPULATION
-- ===================================

-- Show counts by table after migration
SELECT 
    'Search terms after migration:' as info;

SELECT 
    unnest(applicable_tables) as product_table,
    COUNT(*) as search_term_count
FROM search_terms
GROUP BY unnest(applicable_tables)
ORDER BY product_table;

-- Show what was added
SELECT 
    'New search terms added in this migration:' as info,
    COUNT(*) as total
FROM search_terms
WHERE created_at >= CURRENT_TIMESTAMP - INTERVAL '1 minute';

-- Show sample of new terms
SELECT 
    'Sample of new search terms:' as info;

SELECT 
    term_group,
    search_term,
    CASE 
        WHEN categories IS NOT NULL THEN categories::text
        WHEN product_lines IS NOT NULL THEN product_lines::text
        ELSE 'N/A'
    END as applies_to,
    applicable_tables[1] as primary_table
FROM search_terms
WHERE created_at >= CURRENT_TIMESTAMP - INTERVAL '1 minute'
LIMIT 20;

COMMIT;