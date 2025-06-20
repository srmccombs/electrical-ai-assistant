-- Enhance search system with sophisticated term generation
-- This integrates with the search_terms table for synonyms and variations
-- Just like prod_category_cables implementation

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
-- STEP 2: Create table-specific update functions
-- =====================================================

-- For prod_fiber_connectors
CREATE OR REPLACE FUNCTION update_fiber_connector_search_terms()
RETURNS TRIGGER AS $$
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
    
    -- Add connector-specific terms
    NEW.computed_search_terms := NEW.computed_search_terms || ' ' ||
        COALESCE(NEW.connector_type, '') || ' ' ||
        COALESCE(NEW.fiber_type, '') || ' ' ||
        COALESCE(NEW.polarity, '');
        
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
        NEW.product_line,
        'Fiber Cable',
        NEW.common_terms
    );
    
    -- Add cable-specific terms
    NEW.computed_search_terms := NEW.computed_search_terms || ' ' ||
        COALESCE(NEW.fiber_type, '') || ' ' ||
        COALESCE(NEW.fiber_count::TEXT, '') || ' ' ||
        COALESCE(NEW.jacket_material, '') || ' ' ||
        COALESCE(NEW.jacket_rating, '');
        
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
        NEW.common_terms
    );
    
    -- Add jack-specific terms
    NEW.computed_search_terms := NEW.computed_search_terms || ' ' ||
        COALESCE(NEW.category, '') || ' ' ||
        COALESCE(NEW.termination_type, '') || ' ' ||
        COALESCE(NEW.color, '');
        
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
        NEW.common_terms
    );
    
    -- Add faceplate-specific terms
    NEW.computed_search_terms := NEW.computed_search_terms || ' ' ||
        COALESCE(NEW.ports::TEXT, '') || ' port ' ||
        COALESCE(NEW.gang::TEXT, '') || ' gang ' ||
        COALESCE(NEW.color, '') || ' ' ||
        COALESCE(NEW.mounting_type, '');
        
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
        NEW.product_line,
        'Surface Mount Box',
        NEW.common_terms
    );
    
    -- Add SMB-specific terms
    NEW.computed_search_terms := NEW.computed_search_terms || ' ' ||
        'smb surface mount box ' ||
        COALESCE(NEW.ports::TEXT, '') || ' port ' ||
        COALESCE(NEW.color, '') || ' ' ||
        COALESCE(NEW.mounting_type, '');
        
    NEW.computed_search_terms := TRIM(REGEXP_REPLACE(NEW.computed_search_terms, '\s+', ' ', 'g'));
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- STEP 3: Replace simple triggers with enhanced ones
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

-- =====================================================
-- STEP 4: Update existing records with enhanced terms
-- =====================================================
SELECT 'Updating existing records with enhanced search terms...' as status;

-- Update each table to regenerate search terms with the new functions
-- This will trigger the new functions and include synonyms

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

-- Show some example enhanced search terms
SELECT 
    'prod_fiber_connectors' as table_name,
    COUNT(*) as total_products,
    COUNT(CASE WHEN computed_search_terms LIKE '%fiber ends%' THEN 1 END) as has_synonym
FROM prod_fiber_connectors
UNION ALL
SELECT 
    'prod_jack_modules',
    COUNT(*),
    COUNT(CASE WHEN computed_search_terms LIKE '%keystone%' THEN 1 END)
FROM prod_jack_modules
UNION ALL
SELECT 
    'prod_surface_mount_boxes',
    COUNT(*),
    COUNT(CASE WHEN computed_search_terms LIKE '%smb%' THEN 1 END)
FROM prod_surface_mount_boxes;

COMMIT;