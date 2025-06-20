-- Enhance search system with sophisticated term generation (CORRECTED VERSION)
-- This version uses actual column names from the database
-- Verified against prod_fiber_connectors CSV export

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
-- STEP 2: Helper function to safely get column value
-- =====================================================
CREATE OR REPLACE FUNCTION safe_column_value(p_row anyelement, p_column_name text)
RETURNS text AS $$
DECLARE
    result text;
BEGIN
    EXECUTE format('SELECT ($1).%I::text', p_column_name) INTO result USING p_row;
    RETURN result;
EXCEPTION
    WHEN undefined_column THEN
        RETURN NULL;
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- STEP 3: Create table-specific update functions
-- =====================================================

-- For prod_fiber_connectors (using actual columns: fiber_category, connector_type, housing_color, boot_color)
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
        'Fiber Connector',
        NEW.common_terms
    );
    
    -- Add connector-specific terms (using actual columns)
    -- Handle fiber_category array properly
    BEGIN
        fiber_cat_text := array_to_string(NEW.fiber_category, ' ');
    EXCEPTION
        WHEN OTHERS THEN
            fiber_cat_text := '';
    END;
    
    NEW.computed_search_terms := NEW.computed_search_terms || ' ' ||
        COALESCE(NEW.connector_type, '') || ' ' ||
        COALESCE(fiber_cat_text, '') || ' ' ||
        COALESCE(NEW.housing_color, '') || ' ' ||
        COALESCE(NEW.boot_color, '') || ' ' ||
        COALESCE(NEW.polish, '');
        
    -- Add "fiber ends" synonym
    NEW.computed_search_terms := NEW.computed_search_terms || ' fiber ends fiber termination';
        
    NEW.computed_search_terms := TRIM(REGEXP_REPLACE(NEW.computed_search_terms, '\s+', ' ', 'g'));
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- For prod_fiber_cables  
CREATE OR REPLACE FUNCTION update_fiber_cable_search_terms()
RETURNS TRIGGER AS $$
BEGIN
    NEW.computed_search_terms := get_enhanced_search_terms(
        'prod_fiber_cables',
        NEW.part_number,
        NEW.brand,
        NEW.short_description,
        safe_column_value(NEW, 'product_line'),
        'Fiber Cable',
        safe_column_value(NEW, 'common_terms')
    );
    
    -- Add cable-specific terms (check which columns exist)
    NEW.computed_search_terms := NEW.computed_search_terms || ' ' ||
        COALESCE(safe_column_value(NEW, 'fiber_type'), '') || ' ' ||
        COALESCE(safe_column_value(NEW, 'fiber_count'), '') || ' ' ||
        COALESCE(safe_column_value(NEW, 'jacket_material'), '') || ' ' ||
        COALESCE(safe_column_value(NEW, 'jacket_rating'), '');
        
    NEW.computed_search_terms := TRIM(REGEXP_REPLACE(NEW.computed_search_terms, '\s+', ' ', 'g'));
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- For prod_jack_modules
CREATE OR REPLACE FUNCTION update_jack_module_search_terms()
RETURNS TRIGGER AS $$
BEGIN
    NEW.computed_search_terms := get_enhanced_search_terms(
        'prod_jack_modules',
        NEW.part_number,
        NEW.brand,
        NEW.short_description,
        NEW.product_line,
        'Jack Module',
        safe_column_value(NEW, 'common_terms')
    );
    
    -- Add jack-specific terms
    NEW.computed_search_terms := NEW.computed_search_terms || ' ' ||
        COALESCE(NEW.category, '') || ' ' ||
        COALESCE(safe_column_value(NEW, 'termination_type'), '') || ' ' ||
        COALESCE(NEW.color, '') || ' ' ||
        'keystone jack rj45 ethernet jack network jack';
        
    NEW.computed_search_terms := TRIM(REGEXP_REPLACE(NEW.computed_search_terms, '\s+', ' ', 'g'));
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- For prod_faceplates
CREATE OR REPLACE FUNCTION update_faceplate_search_terms()
RETURNS TRIGGER AS $$
BEGIN
    NEW.computed_search_terms := get_enhanced_search_terms(
        'prod_faceplates',
        NEW.part_number,
        NEW.brand,
        NEW.short_description,
        NEW.product_line,
        'Faceplate',
        safe_column_value(NEW, 'common_terms')
    );
    
    -- Add faceplate-specific terms
    NEW.computed_search_terms := NEW.computed_search_terms || ' ' ||
        COALESCE(NEW.ports::TEXT, '') || ' port ' ||
        COALESCE(NEW.gang::TEXT, '') || ' gang ' ||
        COALESCE(NEW.color, '') || ' ' ||
        COALESCE(safe_column_value(NEW, 'mounting_type'), '') || ' ' ||
        'wall plate face plate datacom faceplate';
        
    NEW.computed_search_terms := TRIM(REGEXP_REPLACE(NEW.computed_search_terms, '\s+', ' ', 'g'));
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- For prod_surface_mount_boxes
CREATE OR REPLACE FUNCTION update_smb_search_terms()
RETURNS TRIGGER AS $$
BEGIN
    NEW.computed_search_terms := get_enhanced_search_terms(
        'prod_surface_mount_boxes',
        NEW.part_number,
        NEW.brand,
        NEW.short_description,
        safe_column_value(NEW, 'product_line'),
        'Surface Mount Box',
        safe_column_value(NEW, 'common_terms')
    );
    
    -- Add SMB-specific terms
    NEW.computed_search_terms := NEW.computed_search_terms || ' ' ||
        'smb s.m.b surface mount box biscuit box ' ||
        COALESCE(NEW.ports::TEXT, '') || ' port ' ||
        COALESCE(NEW.color, '') || ' ' ||
        COALESCE(safe_column_value(NEW, 'mounting_type'), '');
        
    NEW.computed_search_terms := TRIM(REGEXP_REPLACE(NEW.computed_search_terms, '\s+', ' ', 'g'));
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- For prod_adapter_panels
CREATE OR REPLACE FUNCTION update_adapter_panel_search_terms()
RETURNS TRIGGER AS $$
BEGIN
    NEW.computed_search_terms := get_enhanced_search_terms(
        'prod_adapter_panels',
        NEW.part_number,
        NEW.brand,
        NEW.short_description,
        safe_column_value(NEW, 'product_line'),
        'Adapter Panel',
        safe_column_value(NEW, 'common_terms')
    );
    
    -- Add panel-specific terms
    NEW.computed_search_terms := NEW.computed_search_terms || ' ' ||
        COALESCE(NEW.panel_type, '') || ' ' ||
        COALESCE(safe_column_value(NEW, 'adapter_type'), '') || ' ' ||
        COALESCE(safe_column_value(NEW, 'ports'), '');
        
    NEW.computed_search_terms := TRIM(REGEXP_REPLACE(NEW.computed_search_terms, '\s+', ' ', 'g'));
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- For prod_rack_mount_enclosures
CREATE OR REPLACE FUNCTION update_rack_enclosure_search_terms()
RETURNS TRIGGER AS $$
BEGIN
    NEW.computed_search_terms := get_enhanced_search_terms(
        'prod_rack_mount_enclosures',
        NEW.part_number,
        NEW.brand,
        NEW.short_description,
        safe_column_value(NEW, 'product_line'),
        'Rack Mount Enclosure',
        safe_column_value(NEW, 'common_terms')
    );
    
    -- Add enclosure-specific terms
    NEW.computed_search_terms := NEW.computed_search_terms || ' ' ||
        COALESCE(NEW.panel_capacity::TEXT, '') || ' panel ' ||
        COALESCE(safe_column_value(NEW, 'rack_units'), '') || ' ' ||
        COALESCE(safe_column_value(NEW, 'depth'), '') || ' ' ||
        'rack mount fiber enclosure';
        
    NEW.computed_search_terms := TRIM(REGEXP_REPLACE(NEW.computed_search_terms, '\s+', ' ', 'g'));
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- For prod_wall_mount_enclosures
CREATE OR REPLACE FUNCTION update_wall_enclosure_search_terms()
RETURNS TRIGGER AS $$
BEGIN
    NEW.computed_search_terms := get_enhanced_search_terms(
        'prod_wall_mount_enclosures',
        NEW.part_number,
        NEW.brand,
        NEW.short_description,
        safe_column_value(NEW, 'product_line'),
        'Wall Mount Enclosure',
        safe_column_value(NEW, 'common_terms')
    );
    
    -- Add enclosure-specific terms
    NEW.computed_search_terms := NEW.computed_search_terms || ' ' ||
        COALESCE(NEW.panel_capacity::TEXT, '') || ' panel ' ||
        COALESCE(safe_column_value(NEW, 'mounting_type'), '') || ' ' ||
        'wall mount fiber enclosure';
        
    NEW.computed_search_terms := TRIM(REGEXP_REPLACE(NEW.computed_search_terms, '\s+', ' ', 'g'));
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- For prod_modular_plugs (keep simple until we know actual columns)
CREATE OR REPLACE FUNCTION update_modular_plug_search_terms()
RETURNS TRIGGER AS $$
BEGIN
    NEW.computed_search_terms := get_enhanced_search_terms(
        'prod_modular_plugs',
        NEW.part_number,
        NEW.brand,
        NEW.short_description,
        safe_column_value(NEW, 'product_line'),
        'Modular Plug',
        safe_column_value(NEW, 'common_terms')
    );
    
    -- Add plug-specific terms
    NEW.computed_search_terms := NEW.computed_search_terms || ' ' ||
        COALESCE(safe_column_value(NEW, 'category'), '') || ' ' ||
        COALESCE(safe_column_value(NEW, 'plug_type'), '') || ' ' ||
        'rj45 plug modular plug ethernet plug';
        
    NEW.computed_search_terms := TRIM(REGEXP_REPLACE(NEW.computed_search_terms, '\s+', ' ', 'g'));
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- STEP 4: Replace simple triggers with enhanced ones
-- =====================================================
SELECT 'Upgrading triggers to use enhanced search...' as status;

-- Drop and recreate triggers for each table with specific functions

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
-- STEP 5: Update existing records with enhanced terms
-- =====================================================
SELECT 'Updating existing records with enhanced search terms...' as status;

-- Force trigger to fire by updating a field
UPDATE prod_fiber_connectors 
SET computed_search_terms = computed_search_terms || ' '
WHERE part_number IS NOT NULL;

UPDATE prod_fiber_cables 
SET computed_search_terms = computed_search_terms || ' '
WHERE part_number IS NOT NULL;

UPDATE prod_jack_modules 
SET computed_search_terms = computed_search_terms || ' '
WHERE part_number IS NOT NULL;

UPDATE prod_faceplates 
SET computed_search_terms = computed_search_terms || ' '
WHERE part_number IS NOT NULL;

UPDATE prod_surface_mount_boxes 
SET computed_search_terms = computed_search_terms || ' '
WHERE part_number IS NOT NULL;

UPDATE prod_adapter_panels 
SET computed_search_terms = computed_search_terms || ' '
WHERE part_number IS NOT NULL;

UPDATE prod_rack_mount_enclosures 
SET computed_search_terms = computed_search_terms || ' '
WHERE part_number IS NOT NULL;

UPDATE prod_wall_mount_enclosures 
SET computed_search_terms = computed_search_terms || ' '
WHERE part_number IS NOT NULL;

UPDATE prod_modular_plugs 
SET computed_search_terms = computed_search_terms || ' '
WHERE part_number IS NOT NULL;

-- =====================================================
-- STEP 6: Add search terms for other product types
-- =====================================================
INSERT INTO search_terms (term_group, search_term, categories, applicable_tables) VALUES
-- Fiber connector terms
('connector', 'lc connector', ARRAY['Fiber Connector'], ARRAY['prod_fiber_connectors']),
('connector', 'sc connector', ARRAY['Fiber Connector'], ARRAY['prod_fiber_connectors']),
('connector', 'st connector', ARRAY['Fiber Connector'], ARRAY['prod_fiber_connectors']),
('connector', 'fiber ends', ARRAY['Fiber Connector'], ARRAY['prod_fiber_connectors']),
('connector', 'fiber termination', ARRAY['Fiber Connector'], ARRAY['prod_fiber_connectors']),

-- Jack module terms
('jack', 'keystone', ARRAY['Jack Module'], ARRAY['prod_jack_modules']),
('jack', 'keystone jack', ARRAY['Jack Module'], ARRAY['prod_jack_modules']),
('jack', 'rj45', ARRAY['Jack Module'], ARRAY['prod_jack_modules']),
('jack', 'rj45 jack', ARRAY['Jack Module'], ARRAY['prod_jack_modules']),
('jack', 'ethernet jack', ARRAY['Jack Module'], ARRAY['prod_jack_modules']),
('jack', 'network jack', ARRAY['Jack Module'], ARRAY['prod_jack_modules']),

-- Faceplate terms
('faceplate', 'wall plate', ARRAY['Faceplate'], ARRAY['prod_faceplates']),
('faceplate', 'face plate', ARRAY['Faceplate'], ARRAY['prod_faceplates']),
('faceplate', 'datacom faceplate', ARRAY['Faceplate'], ARRAY['prod_faceplates']),
('faceplate', 'keystone faceplate', ARRAY['Faceplate'], ARRAY['prod_faceplates']),

-- SMB terms
('smb', 'smb', ARRAY['Surface Mount Box'], ARRAY['prod_surface_mount_boxes']),
('smb', 's.m.b', ARRAY['Surface Mount Box'], ARRAY['prod_surface_mount_boxes']),
('smb', 'surface mount', ARRAY['Surface Mount Box'], ARRAY['prod_surface_mount_boxes']),
('smb', 'biscuit box', ARRAY['Surface Mount Box'], ARRAY['prod_surface_mount_boxes']),
('smb', 'surface box', ARRAY['Surface Mount Box'], ARRAY['prod_surface_mount_boxes'])

ON CONFLICT DO NOTHING;

SELECT 'Enhanced search system with synonyms is now active!' as status;

-- Show status
SELECT 
    table_name,
    count(*) as total_records,
    avg(length(computed_search_terms)) as avg_search_term_length
FROM (
    SELECT 'prod_fiber_connectors' as table_name, computed_search_terms FROM prod_fiber_connectors
    UNION ALL
    SELECT 'prod_jack_modules', computed_search_terms FROM prod_jack_modules
    UNION ALL
    SELECT 'prod_faceplates', computed_search_terms FROM prod_faceplates
    UNION ALL
    SELECT 'prod_surface_mount_boxes', computed_search_terms FROM prod_surface_mount_boxes
) t
GROUP BY table_name
ORDER BY table_name;

COMMIT;