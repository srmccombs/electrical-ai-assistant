-- Enhance search system with sophisticated term generation (FINAL VERSION)
-- Based on actual column names from database inspection

BEGIN;

-- =====================================================
-- STEP 1: Create enhanced search term generation function
-- =====================================================
CREATE OR REPLACE FUNCTION get_enhanced_search_terms(
    p_table_name VARCHAR,
    p_part_number VARCHAR,
    p_brand VARCHAR,
    p_description TEXT,
    p_product_line VARCHAR DEFAULT NULL,
    p_category VARCHAR DEFAULT NULL,
    p_common_terms TEXT DEFAULT NULL
) RETURNS TEXT AS $$
DECLARE
    search_terms TEXT := '';
    term_record RECORD;
BEGIN
    -- Add all the basic fields
    search_terms := COALESCE(p_part_number, '') || ' ';
    search_terms := search_terms || COALESCE(p_description, '') || ' ';
    search_terms := search_terms || COALESCE(p_brand, '') || ' ';
    search_terms := search_terms || COALESCE(p_product_line, '') || ' ';
    search_terms := search_terms || COALESCE(p_category, '') || ' ';
    search_terms := search_terms || COALESCE(p_common_terms, '') || ' ';
    
    -- Get all matching search terms from search_terms table
    FOR term_record IN 
        SELECT DISTINCT search_term 
        FROM search_terms 
        WHERE p_table_name = ANY(applicable_tables)
        AND (
            -- Match brand
            (p_brand = ANY(brands) OR brands IS NULL OR cardinality(brands) = 0)
            -- Match product line (if column exists)
            OR (p_product_line = ANY(product_lines) OR product_lines IS NULL OR cardinality(product_lines) = 0)
            -- Match category
            OR (p_category = ANY(categories) OR categories IS NULL OR cardinality(categories) = 0)
        )
    LOOP
        search_terms := search_terms || term_record.search_term || ' ';
    END LOOP;
    
    -- Clean up extra spaces
    search_terms := REGEXP_REPLACE(search_terms, '\s+', ' ', 'g');
    search_terms := TRIM(search_terms);
    
    RETURN search_terms;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- STEP 2: Create table-specific update functions using ACTUAL columns
-- =====================================================

-- For prod_fiber_connectors (verified columns)
CREATE OR REPLACE FUNCTION update_fiber_connector_search_terms()
RETURNS TRIGGER AS $$
DECLARE
    fiber_cat_text TEXT;
BEGIN
    NEW.computed_search_terms := get_enhanced_search_terms(
        'prod_fiber_connectors',
        NEW.part_number,
        NEW.brand,
        NEW.short_description,
        NEW.product_line,
        NEW.category,  -- Uses actual category column
        NEW.common_terms
    );
    
    -- Handle fiber_category array
    BEGIN
        fiber_cat_text := array_to_string(NEW.fiber_category, ' ');
    EXCEPTION
        WHEN OTHERS THEN
            fiber_cat_text := '';
    END;
    
    -- Add connector-specific terms from actual columns
    NEW.computed_search_terms := NEW.computed_search_terms || ' ' ||
        COALESCE(NEW.connector_type, '') || ' ' ||
        COALESCE(fiber_cat_text, '') || ' ' ||
        COALESCE(NEW.housing_color, '') || ' ' ||
        COALESCE(NEW.boot_color, '') || ' ' ||
        COALESCE(NEW.polish, '') || ' ' ||
        COALESCE(NEW.ferrule_material, '') || ' ' ||
        'fiber ends fiber termination fiber connector';
        
    NEW.computed_search_terms := TRIM(REGEXP_REPLACE(NEW.computed_search_terms, '\s+', ' ', 'g'));
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- For prod_fiber_cables (verified columns from CSV)
CREATE OR REPLACE FUNCTION update_fiber_cable_search_terms()
RETURNS TRIGGER AS $$
DECLARE
    fiber_cat_text TEXT;
BEGIN
    NEW.computed_search_terms := get_enhanced_search_terms(
        'prod_fiber_cables',
        NEW.part_number,
        NEW.brand,
        NEW.short_description,
        NEW.product_line,
        NEW.category,
        NEW.common_terms
    );
    
    -- Handle fiber_category array properly
    BEGIN
        fiber_cat_text := array_to_string(NEW.fiber_category, ' ');
    EXCEPTION
        WHEN OTHERS THEN
            fiber_cat_text := '';
    END;
    
    -- Add cable-specific terms from actual columns
    NEW.computed_search_terms := NEW.computed_search_terms || ' ' ||
        COALESCE(fiber_cat_text, '') || ' ' ||
        COALESCE(NEW.jacket_color, '') || ' ' ||
        COALESCE(NEW.length::TEXT, '') || ' ' ||
        COALESCE(NEW.connector_a, '') || ' ' ||
        COALESCE(NEW.connector_b, '') || ' ' ||
        'fiber cable fiber optic cable patch cable';
        
    NEW.computed_search_terms := TRIM(REGEXP_REPLACE(NEW.computed_search_terms, '\s+', ' ', 'g'));
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- For prod_jack_modules (verified columns)
CREATE OR REPLACE FUNCTION update_jack_module_search_terms()
RETURNS TRIGGER AS $$
BEGIN
    NEW.computed_search_terms := get_enhanced_search_terms(
        'prod_jack_modules',
        NEW.part_number,
        NEW.brand,
        NEW.short_description,
        NEW.product_line,
        NEW.category,
        NEW.common_terms
    );
    
    -- Add jack-specific terms
    NEW.computed_search_terms := NEW.computed_search_terms || ' ' ||
        COALESCE(NEW.color, '') || ' ' ||
        COALESCE(NEW.wiring_scheme, '') || ' ' ||
        'keystone jack rj45 ethernet jack network jack cat6 jack cat5e jack';
        
    NEW.computed_search_terms := TRIM(REGEXP_REPLACE(NEW.computed_search_terms, '\s+', ' ', 'g'));
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- For prod_faceplates (verified columns)
CREATE OR REPLACE FUNCTION update_faceplate_search_terms()
RETURNS TRIGGER AS $$
BEGIN
    NEW.computed_search_terms := get_enhanced_search_terms(
        'prod_faceplates',
        NEW.part_number,
        NEW.brand,
        NEW.short_description,
        NEW.product_line,
        NEW.category,
        NEW.common_terms
    );
    
    -- Add faceplate-specific terms
    NEW.computed_search_terms := NEW.computed_search_terms || ' ' ||
        COALESCE(NEW.ports::TEXT, '') || ' port ' ||
        COALESCE(NEW.gang::TEXT, '') || ' gang ' ||
        COALESCE(NEW.color, '') || ' ' ||
        'wall plate face plate datacom faceplate keystone faceplate';
        
    NEW.computed_search_terms := TRIM(REGEXP_REPLACE(NEW.computed_search_terms, '\s+', ' ', 'g'));
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- For prod_surface_mount_boxes (verified columns)
CREATE OR REPLACE FUNCTION update_smb_search_terms()
RETURNS TRIGGER AS $$
BEGIN
    NEW.computed_search_terms := get_enhanced_search_terms(
        'prod_surface_mount_boxes',
        NEW.part_number,
        NEW.brand,
        NEW.short_description,
        NEW.product_line,
        NEW.category,
        NEW.common_terms
    );
    
    -- Add SMB-specific terms
    NEW.computed_search_terms := NEW.computed_search_terms || ' ' ||
        'smb s.m.b surface mount box biscuit box surface box ' ||
        COALESCE(NEW.ports::TEXT, '') || ' port ' ||
        COALESCE(NEW.color, '') || ' ' ||
        COALESCE(NEW.mounting_type, '');
        
    NEW.computed_search_terms := TRIM(REGEXP_REPLACE(NEW.computed_search_terms, '\s+', ' ', 'g'));
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- For prod_adapter_panels (verified columns)
CREATE OR REPLACE FUNCTION update_adapter_panel_search_terms()
RETURNS TRIGGER AS $$
BEGIN
    NEW.computed_search_terms := get_enhanced_search_terms(
        'prod_adapter_panels',
        NEW.part_number,
        NEW.brand,
        NEW.short_description,
        NEW.product_line,
        NEW.category,
        NEW.common_terms
    );
    
    -- Add panel-specific terms
    NEW.computed_search_terms := NEW.computed_search_terms || ' ' ||
        COALESCE(NEW.panel_type, '') || ' ' ||
        COALESCE(NEW.fiber_type, '') || ' ' ||
        COALESCE(NEW.rack_units::TEXT, '') || 'ru ' ||
        COALESCE(NEW.ports::TEXT, '') || ' port ' ||
        'adapter panel patch panel fiber panel';
        
    NEW.computed_search_terms := TRIM(REGEXP_REPLACE(NEW.computed_search_terms, '\s+', ' ', 'g'));
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- For prod_rack_mount_enclosures (verified columns)
CREATE OR REPLACE FUNCTION update_rack_enclosure_search_terms()
RETURNS TRIGGER AS $$
BEGIN
    NEW.computed_search_terms := get_enhanced_search_terms(
        'prod_rack_mount_enclosures',
        NEW.part_number,
        NEW.brand,
        NEW.short_description,
        NEW.product_line,
        NEW.category,
        NEW.common_terms
    );
    
    -- Add enclosure-specific terms
    NEW.computed_search_terms := NEW.computed_search_terms || ' ' ||
        COALESCE(NEW.panel_capacity::TEXT, '') || ' panel ' ||
        COALESCE(NEW.rack_units::TEXT, '') || 'ru ' ||
        'rack mount fiber enclosure patch panel enclosure';
        
    NEW.computed_search_terms := TRIM(REGEXP_REPLACE(NEW.computed_search_terms, '\s+', ' ', 'g'));
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- For prod_wall_mount_enclosures (verified columns)
CREATE OR REPLACE FUNCTION update_wall_enclosure_search_terms()
RETURNS TRIGGER AS $$
BEGIN
    NEW.computed_search_terms := get_enhanced_search_terms(
        'prod_wall_mount_enclosures',
        NEW.part_number,
        NEW.brand,
        NEW.short_description,
        NEW.product_line,
        NEW.category,
        NEW.common_terms
    );
    
    -- Add enclosure-specific terms
    NEW.computed_search_terms := NEW.computed_search_terms || ' ' ||
        COALESCE(NEW.panel_capacity::TEXT, '') || ' panel ' ||
        'wall mount fiber enclosure wall cabinet';
        
    NEW.computed_search_terms := TRIM(REGEXP_REPLACE(NEW.computed_search_terms, '\s+', ' ', 'g'));
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- For prod_modular_plugs (verified columns)
CREATE OR REPLACE FUNCTION update_modular_plug_search_terms()
RETURNS TRIGGER AS $$
BEGIN
    NEW.computed_search_terms := get_enhanced_search_terms(
        'prod_modular_plugs',
        NEW.part_number,
        NEW.brand,
        NEW.short_description,
        NEW.product_line,
        NEW.category,
        NEW.common_terms
    );
    
    -- Add plug-specific terms
    NEW.computed_search_terms := NEW.computed_search_terms || ' ' ||
        COALESCE(NEW.connector_type, '') || ' ' ||
        COALESCE(NEW.contacts, '') || ' ' ||
        'rj45 plug modular plug ethernet plug crimp plug';
        
    NEW.computed_search_terms := TRIM(REGEXP_REPLACE(NEW.computed_search_terms, '\s+', ' ', 'g'));
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- STEP 3: Replace simple triggers with enhanced ones
-- =====================================================
SELECT 'Upgrading triggers to use enhanced search...' as status;

-- Drop and recreate triggers for each table

-- prod_fiber_connectors
DROP TRIGGER IF EXISTS trg_update_fiber_connectors_search_terms ON prod_fiber_connectors;
CREATE TRIGGER trg_update_fiber_connectors_search_terms
    BEFORE INSERT OR UPDATE ON prod_fiber_connectors
    FOR EACH ROW
    EXECUTE FUNCTION update_fiber_connector_search_terms();

-- prod_fiber_cables
DROP TRIGGER IF EXISTS trg_update_fiber_cables_search_terms ON prod_fiber_cables;
CREATE TRIGGER trg_update_fiber_cables_search_terms
    BEFORE INSERT OR UPDATE ON prod_fiber_cables
    FOR EACH ROW
    EXECUTE FUNCTION update_fiber_cable_search_terms();

-- prod_jack_modules
DROP TRIGGER IF EXISTS trg_update_jack_modules_search_terms ON prod_jack_modules;
CREATE TRIGGER trg_update_jack_modules_search_terms
    BEFORE INSERT OR UPDATE ON prod_jack_modules
    FOR EACH ROW
    EXECUTE FUNCTION update_jack_module_search_terms();

-- prod_faceplates
DROP TRIGGER IF EXISTS trg_update_faceplates_search_terms ON prod_faceplates;
CREATE TRIGGER trg_update_faceplates_search_terms
    BEFORE INSERT OR UPDATE ON prod_faceplates
    FOR EACH ROW
    EXECUTE FUNCTION update_faceplate_search_terms();

-- prod_surface_mount_boxes
DROP TRIGGER IF EXISTS trg_update_surface_mount_boxes_search_terms ON prod_surface_mount_boxes;
CREATE TRIGGER trg_update_surface_mount_boxes_search_terms
    BEFORE INSERT OR UPDATE ON prod_surface_mount_boxes
    FOR EACH ROW
    EXECUTE FUNCTION update_smb_search_terms();

-- prod_adapter_panels
DROP TRIGGER IF EXISTS trg_update_adapter_panels_search_terms ON prod_adapter_panels;
CREATE TRIGGER trg_update_adapter_panels_search_terms
    BEFORE INSERT OR UPDATE ON prod_adapter_panels
    FOR EACH ROW
    EXECUTE FUNCTION update_adapter_panel_search_terms();

-- prod_rack_mount_enclosures
DROP TRIGGER IF EXISTS trg_update_rack_mount_enclosures_search_terms ON prod_rack_mount_enclosures;
CREATE TRIGGER trg_update_rack_mount_enclosures_search_terms
    BEFORE INSERT OR UPDATE ON prod_rack_mount_enclosures
    FOR EACH ROW
    EXECUTE FUNCTION update_rack_enclosure_search_terms();

-- prod_wall_mount_enclosures
DROP TRIGGER IF EXISTS trg_update_wall_mount_enclosures_search_terms ON prod_wall_mount_enclosures;
CREATE TRIGGER trg_update_wall_mount_enclosures_search_terms
    BEFORE INSERT OR UPDATE ON prod_wall_mount_enclosures
    FOR EACH ROW
    EXECUTE FUNCTION update_wall_enclosure_search_terms();

-- prod_modular_plugs
DROP TRIGGER IF EXISTS trg_update_modular_plugs_search_terms ON prod_modular_plugs;
CREATE TRIGGER trg_update_modular_plugs_search_terms
    BEFORE INSERT OR UPDATE ON prod_modular_plugs
    FOR EACH ROW
    EXECUTE FUNCTION update_modular_plug_search_terms();

-- =====================================================
-- STEP 4: Update existing records to regenerate search terms
-- =====================================================
SELECT 'Updating existing records with enhanced search terms...' as status;

-- Touch each record to trigger the new functions
DO $$
DECLARE
    update_count INT;
BEGIN
    -- Update each table
    UPDATE prod_fiber_connectors 
    SET updated_at = CURRENT_TIMESTAMP
    WHERE part_number IS NOT NULL;
    GET DIAGNOSTICS update_count = ROW_COUNT;
    RAISE NOTICE 'Updated % fiber connectors', update_count;

    UPDATE prod_fiber_cables 
    SET updated_at = CURRENT_TIMESTAMP
    WHERE part_number IS NOT NULL;
    GET DIAGNOSTICS update_count = ROW_COUNT;
    RAISE NOTICE 'Updated % fiber cables', update_count;

    UPDATE prod_jack_modules 
    SET updated_at = CURRENT_TIMESTAMP
    WHERE part_number IS NOT NULL;
    GET DIAGNOSTICS update_count = ROW_COUNT;
    RAISE NOTICE 'Updated % jack modules', update_count;

    UPDATE prod_faceplates 
    SET updated_at = CURRENT_TIMESTAMP
    WHERE part_number IS NOT NULL;
    GET DIAGNOSTICS update_count = ROW_COUNT;
    RAISE NOTICE 'Updated % faceplates', update_count;

    UPDATE prod_surface_mount_boxes 
    SET updated_at = CURRENT_TIMESTAMP
    WHERE part_number IS NOT NULL;
    GET DIAGNOSTICS update_count = ROW_COUNT;
    RAISE NOTICE 'Updated % surface mount boxes', update_count;

    UPDATE prod_adapter_panels 
    SET updated_at = CURRENT_TIMESTAMP
    WHERE part_number IS NOT NULL;
    GET DIAGNOSTICS update_count = ROW_COUNT;
    RAISE NOTICE 'Updated % adapter panels', update_count;

    UPDATE prod_rack_mount_enclosures 
    SET updated_at = CURRENT_TIMESTAMP
    WHERE part_number IS NOT NULL;
    GET DIAGNOSTICS update_count = ROW_COUNT;
    RAISE NOTICE 'Updated % rack mount enclosures', update_count;

    UPDATE prod_wall_mount_enclosures 
    SET updated_at = CURRENT_TIMESTAMP
    WHERE part_number IS NOT NULL;
    GET DIAGNOSTICS update_count = ROW_COUNT;
    RAISE NOTICE 'Updated % wall mount enclosures', update_count;

    UPDATE prod_modular_plugs 
    SET updated_at = CURRENT_TIMESTAMP
    WHERE part_number IS NOT NULL;
    GET DIAGNOSTICS update_count = ROW_COUNT;
    RAISE NOTICE 'Updated % modular plugs', update_count;
END $$;

-- =====================================================
-- STEP 5: Add search terms for other product types
-- =====================================================
INSERT INTO search_terms (term_group, search_term, categories, applicable_tables) VALUES
-- Fiber connector terms
('connector', 'lc connector', ARRAY['Fiber Connector'], ARRAY['prod_fiber_connectors']),
('connector', 'sc connector', ARRAY['Fiber Connector'], ARRAY['prod_fiber_connectors']),
('connector', 'st connector', ARRAY['Fiber Connector'], ARRAY['prod_fiber_connectors']),
('connector', 'fiber ends', ARRAY['Fiber Connector'], ARRAY['prod_fiber_connectors']),
('connector', 'fiber termination', ARRAY['Fiber Connector'], ARRAY['prod_fiber_connectors']),
('connector', 'unicam', ARRAY['Fiber Connector'], ARRAY['prod_fiber_connectors']),
('connector', 'fastconnect', ARRAY['Fiber Connector'], ARRAY['prod_fiber_connectors']),
('connector', 'opticam', ARRAY['Fiber Connector'], ARRAY['prod_fiber_connectors']),

-- Jack module terms
('jack', 'keystone', ARRAY['Jack Module'], ARRAY['prod_jack_modules']),
('jack', 'keystone jack', ARRAY['Jack Module'], ARRAY['prod_jack_modules']),
('jack', 'rj45', ARRAY['Jack Module'], ARRAY['prod_jack_modules']),
('jack', 'rj45 jack', ARRAY['Jack Module'], ARRAY['prod_jack_modules']),
('jack', 'ethernet jack', ARRAY['Jack Module'], ARRAY['prod_jack_modules']),
('jack', 'network jack', ARRAY['Jack Module'], ARRAY['prod_jack_modules']),
('jack', 'cat6 jack', ARRAY['Jack Module'], ARRAY['prod_jack_modules']),
('jack', 'cat5e jack', ARRAY['Jack Module'], ARRAY['prod_jack_modules']),

-- Faceplate terms
('faceplate', 'wall plate', ARRAY['Faceplate'], ARRAY['prod_faceplates']),
('faceplate', 'face plate', ARRAY['Faceplate'], ARRAY['prod_faceplates']),
('faceplate', 'datacom faceplate', ARRAY['Faceplate'], ARRAY['prod_faceplates']),
('faceplate', 'keystone faceplate', ARRAY['Faceplate'], ARRAY['prod_faceplates']),
('faceplate', 'outlet', ARRAY['Faceplate'], ARRAY['prod_faceplates']),

-- SMB terms
('smb', 'smb', ARRAY['Surface Mount Box'], ARRAY['prod_surface_mount_boxes']),
('smb', 's.m.b', ARRAY['Surface Mount Box'], ARRAY['prod_surface_mount_boxes']),
('smb', 'surface mount', ARRAY['Surface Mount Box'], ARRAY['prod_surface_mount_boxes']),
('smb', 'biscuit box', ARRAY['Surface Mount Box'], ARRAY['prod_surface_mount_boxes']),
('smb', 'surface box', ARRAY['Surface Mount Box'], ARRAY['prod_surface_mount_boxes']),
('smb', 'surface mount box', ARRAY['Surface Mount Box'], ARRAY['prod_surface_mount_boxes']),

-- Fiber cable terms
('fiber', 'fiber optic', ARRAY['Fiber Cable'], ARRAY['prod_fiber_cables']),
('fiber', 'om1', ARRAY['Fiber Cable'], ARRAY['prod_fiber_cables']),
('fiber', 'om2', ARRAY['Fiber Cable'], ARRAY['prod_fiber_cables']),
('fiber', 'om3', ARRAY['Fiber Cable'], ARRAY['prod_fiber_cables']),
('fiber', 'om4', ARRAY['Fiber Cable'], ARRAY['prod_fiber_cables']),
('fiber', 'os1', ARRAY['Fiber Cable'], ARRAY['prod_fiber_cables']),
('fiber', 'os2', ARRAY['Fiber Cable'], ARRAY['prod_fiber_cables']),
('fiber', 'single mode', ARRAY['Fiber Cable'], ARRAY['prod_fiber_cables']),
('fiber', 'multimode', ARRAY['Fiber Cable'], ARRAY['prod_fiber_cables'])

ON CONFLICT DO NOTHING;

-- =====================================================
-- STEP 6: Show final status
-- =====================================================
SELECT 'Enhanced search system with synonyms is now active!' as status;

-- Show search term statistics
WITH search_stats AS (
    SELECT 
        'prod_fiber_connectors' as table_name,
        COUNT(*) as total_records,
        COUNT(CASE WHEN computed_search_terms IS NOT NULL THEN 1 END) as has_search_terms,
        AVG(LENGTH(computed_search_terms)) as avg_term_length
    FROM prod_fiber_connectors
    UNION ALL
    SELECT 'prod_fiber_cables', COUNT(*), COUNT(CASE WHEN computed_search_terms IS NOT NULL THEN 1 END), AVG(LENGTH(computed_search_terms))
    FROM prod_fiber_cables
    UNION ALL
    SELECT 'prod_jack_modules', COUNT(*), COUNT(CASE WHEN computed_search_terms IS NOT NULL THEN 1 END), AVG(LENGTH(computed_search_terms))
    FROM prod_jack_modules
    UNION ALL
    SELECT 'prod_faceplates', COUNT(*), COUNT(CASE WHEN computed_search_terms IS NOT NULL THEN 1 END), AVG(LENGTH(computed_search_terms))
    FROM prod_faceplates
    UNION ALL
    SELECT 'prod_surface_mount_boxes', COUNT(*), COUNT(CASE WHEN computed_search_terms IS NOT NULL THEN 1 END), AVG(LENGTH(computed_search_terms))
    FROM prod_surface_mount_boxes
    UNION ALL
    SELECT 'prod_adapter_panels', COUNT(*), COUNT(CASE WHEN computed_search_terms IS NOT NULL THEN 1 END), AVG(LENGTH(computed_search_terms))
    FROM prod_adapter_panels
    UNION ALL
    SELECT 'prod_rack_mount_enclosures', COUNT(*), COUNT(CASE WHEN computed_search_terms IS NOT NULL THEN 1 END), AVG(LENGTH(computed_search_terms))
    FROM prod_rack_mount_enclosures
    UNION ALL
    SELECT 'prod_wall_mount_enclosures', COUNT(*), COUNT(CASE WHEN computed_search_terms IS NOT NULL THEN 1 END), AVG(LENGTH(computed_search_terms))
    FROM prod_wall_mount_enclosures
    UNION ALL
    SELECT 'prod_modular_plugs', COUNT(*), COUNT(CASE WHEN computed_search_terms IS NOT NULL THEN 1 END), AVG(LENGTH(computed_search_terms))
    FROM prod_modular_plugs
)
SELECT 
    table_name,
    total_records,
    has_search_terms,
    ROUND(avg_term_length::numeric, 0) as avg_term_length
FROM search_stats
ORDER BY table_name;

-- Show sample enhanced search terms
SELECT 'Sample enhanced search terms:' as info;
SELECT 
    part_number,
    LEFT(computed_search_terms, 100) || '...' as search_terms_preview
FROM prod_fiber_connectors
WHERE computed_search_terms LIKE '%fiber ends%'
LIMIT 3;

COMMIT;