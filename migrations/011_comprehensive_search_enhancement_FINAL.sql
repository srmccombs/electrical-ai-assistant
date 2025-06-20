-- Comprehensive Search Enhancement for ALL Product Tables
-- Uses VERIFIED column names from your actual database
-- Only includes brands that exist in YOUR data

BEGIN;

-- ===================================
-- ENHANCED SEARCH TERM FUNCTIONS
-- ===================================

-- Function to generate comprehensive search terms for each product type
-- This integrates with the search_terms table for synonym support

-- 1. Category Cables Search Terms
CREATE OR REPLACE FUNCTION get_cable_search_terms_enhanced(
    p_part_number TEXT,
    p_brand TEXT,
    p_category_rating TEXT,
    p_jacket_color TEXT,
    p_jacket_material TEXT,
    p_length INTEGER,
    p_shielding_type TEXT,  -- Will receive Shielding_Type value
    p_short_description TEXT
) RETURNS TEXT AS $$
DECLARE
    terms TEXT[];
    synonym_terms TEXT[];
BEGIN
    -- Start with basic terms
    terms := ARRAY[
        LOWER(p_part_number),
        LOWER(p_brand),
        LOWER(p_category_rating),
        LOWER(p_jacket_color),
        LOWER(p_jacket_material),
        LOWER(p_shielding_type),
        LOWER(p_short_description)
    ];
    
    -- Add category-specific terms
    IF p_category_rating IS NOT NULL THEN
        terms := terms || ARRAY[
            LOWER(p_category_rating) || ' cable',
            LOWER(p_category_rating) || ' ethernet',
            LOWER(p_category_rating) || ' patch',
            REPLACE(LOWER(p_category_rating), 'category ', 'cat')
        ];
    END IF;
    
    -- Add synonyms from search_terms table
    SELECT array_agg(DISTINCT LOWER(st.search_term))
    INTO synonym_terms
    FROM search_terms st
    WHERE st.product_category = 'category_cables'
    AND (
        LOWER(st.mapped_value) = LOWER(p_category_rating) OR
        LOWER(st.mapped_value) = LOWER(p_jacket_material) OR
        LOWER(st.mapped_value) = LOWER(p_shielding_type)
    );
    
    IF synonym_terms IS NOT NULL THEN
        terms := terms || synonym_terms;
    END IF;
    
    -- Return unique terms as space-separated string
    RETURN array_to_string(
        ARRAY(SELECT DISTINCT unnest(terms) WHERE unnest(terms) IS NOT NULL),
        ' '
    );
END;
$$ LANGUAGE plpgsql;

-- 2. Fiber Cables Search Terms
CREATE OR REPLACE FUNCTION get_fiber_cable_search_terms_enhanced(
    p_part_number TEXT,
    p_brand TEXT,
    p_fiber_types TEXT[],
    p_fiber_count INTEGER,
    p_jacket_rating TEXT,
    p_short_description TEXT
) RETURNS TEXT AS $$
DECLARE
    terms TEXT[];
    fiber_type TEXT;
BEGIN
    -- Basic terms
    terms := ARRAY[
        LOWER(p_part_number),
        LOWER(p_brand),
        LOWER(p_jacket_rating),
        LOWER(p_short_description),
        'fiber cable',
        'fiber optic',
        'fiber optic cable'
    ];
    
    -- Add fiber types
    IF p_fiber_types IS NOT NULL THEN
        FOREACH fiber_type IN ARRAY p_fiber_types
        LOOP
            terms := terms || ARRAY[
                LOWER(fiber_type),
                LOWER(fiber_type) || ' fiber',
                LOWER(fiber_type) || ' cable'
            ];
        END LOOP;
    END IF;
    
    -- Add fiber count variations
    IF p_fiber_count IS NOT NULL THEN
        terms := terms || ARRAY[
            p_fiber_count::TEXT || ' fiber',
            p_fiber_count::TEXT || ' strand',
            p_fiber_count::TEXT || ' count'
        ];
    END IF;
    
    RETURN array_to_string(
        ARRAY(SELECT DISTINCT unnest(terms) WHERE unnest(terms) IS NOT NULL),
        ' '
    );
END;
$$ LANGUAGE plpgsql;

-- 3. Fiber Connectors Search Terms
CREATE OR REPLACE FUNCTION get_fiber_connector_search_terms_enhanced(
    p_part_number TEXT,
    p_brand TEXT,
    p_connector_type TEXT,
    p_fiber_types TEXT[],
    p_termination_type TEXT,
    p_short_description TEXT
) RETURNS TEXT AS $$
DECLARE
    terms TEXT[];
    fiber_type TEXT;
BEGIN
    -- Basic terms
    terms := ARRAY[
        LOWER(p_part_number),
        LOWER(p_brand),
        LOWER(p_connector_type),
        LOWER(p_termination_type),
        LOWER(p_short_description),
        'fiber connector',
        'fiber ends',  -- Common synonym
        'fiber termination'
    ];
    
    -- Add connector variations
    IF p_connector_type IS NOT NULL THEN
        terms := terms || ARRAY[
            LOWER(p_connector_type) || ' connector',
            LOWER(p_connector_type) || ' fiber',
            LOWER(p_connector_type) || ' termination'
        ];
    END IF;
    
    -- Add fiber types
    IF p_fiber_types IS NOT NULL THEN
        FOREACH fiber_type IN ARRAY p_fiber_types
        LOOP
            terms := terms || ARRAY[
                LOWER(fiber_type),
                LOWER(p_connector_type) || ' ' || LOWER(fiber_type)
            ];
        END LOOP;
    END IF;
    
    RETURN array_to_string(
        ARRAY(SELECT DISTINCT unnest(terms) WHERE unnest(terms) IS NOT NULL),
        ' '
    );
END;
$$ LANGUAGE plpgsql;

-- 4. Jack Modules Search Terms
CREATE OR REPLACE FUNCTION get_jack_module_search_terms_enhanced(
    p_part_number TEXT,
    p_brand TEXT,
    p_product_line TEXT,
    p_category_rating TEXT,  -- NOT jack_type
    p_shielding_type TEXT,   -- NOT wiring_scheme
    p_color TEXT,
    p_short_description TEXT
) RETURNS TEXT AS $$
DECLARE
    terms TEXT[];
BEGIN
    -- Basic terms
    terms := ARRAY[
        LOWER(p_part_number),
        LOWER(p_brand),
        LOWER(p_product_line),
        LOWER(p_category_rating),
        LOWER(p_shielding_type),
        LOWER(p_color),
        LOWER(p_short_description),
        'jack',
        'jacks',
        'jack module',
        'keystone',
        'rj45'
    ];
    
    -- Add category rating variations
    IF p_category_rating IS NOT NULL THEN
        terms := terms || ARRAY[
            LOWER(p_category_rating) || ' jack',
            LOWER(p_category_rating) || ' module',
            REPLACE(LOWER(p_category_rating), 'category ', 'cat')
        ];
    END IF;
    
    -- Add brand-specific terms for YOUR brands
    IF p_brand = 'Panduit' THEN
        terms := terms || ARRAY['minicom', 'mini-com', 'netkey'];
    ELSIF p_brand = 'Hubbell' THEN
        terms := terms || ARRAY['xcelerator', 'netselect'];
    ELSIF p_brand = 'Dynacom' THEN
        terms := terms || ARRAY['keystone'];
    END IF;
    
    RETURN array_to_string(
        ARRAY(SELECT DISTINCT unnest(terms) WHERE unnest(terms) IS NOT NULL),
        ' '
    );
END;
$$ LANGUAGE plpgsql;

-- 5. Modular Plugs Search Terms
CREATE OR REPLACE FUNCTION get_modular_plug_search_terms_enhanced(
    p_part_number TEXT,
    p_brand TEXT,
    p_product_line TEXT,
    p_category_rating TEXT,  -- NOT plug_type
    p_shielding_type TEXT,
    p_short_description TEXT
) RETURNS TEXT AS $$
DECLARE
    terms TEXT[];
BEGIN
    -- Basic terms
    terms := ARRAY[
        LOWER(p_part_number),
        LOWER(p_brand),
        LOWER(p_product_line),
        LOWER(p_category_rating),
        LOWER(p_shielding_type),
        LOWER(p_short_description),
        'plug',
        'plugs',
        'modular plug',
        'rj45 plug',
        'connector',
        'pass-through',
        'passthrough',
        'feed-through'
    ];
    
    -- Add category rating variations
    IF p_category_rating IS NOT NULL THEN
        terms := terms || ARRAY[
            LOWER(p_category_rating) || ' plug',
            LOWER(p_category_rating) || ' connector',
            REPLACE(LOWER(p_category_rating), 'category ', 'cat')
        ];
    END IF;
    
    -- Add terms specific to Simply Brands product lines (from your actual data)
    IF p_brand = 'Simply Brands' THEN
        terms := terms || ARRAY['simply', 'simply 45', 's45'];
        
        IF p_product_line LIKE '%PRO%' THEN
            terms := terms || ARRAY['pro series', 'pro'];
        ELSIF p_product_line LIKE '%INSTALLER%' THEN
            terms := terms || ARRAY['installer series', 'installer'];
        END IF;
    END IF;
    
    RETURN array_to_string(
        ARRAY(SELECT DISTINCT unnest(terms) WHERE unnest(terms) IS NOT NULL),
        ' '
    );
END;
$$ LANGUAGE plpgsql;

-- 6. Faceplates Search Terms
CREATE OR REPLACE FUNCTION get_faceplate_search_terms_enhanced(
    p_part_number TEXT,
    p_brand TEXT,
    p_product_line TEXT,
    p_number_of_ports INTEGER,  -- NOT ports
    p_color TEXT,
    p_short_description TEXT
) RETURNS TEXT AS $$
DECLARE
    terms TEXT[];
BEGIN
    -- Basic terms
    terms := ARRAY[
        LOWER(p_part_number),
        LOWER(p_brand),
        LOWER(p_product_line),
        LOWER(p_color),
        LOWER(p_short_description),
        'faceplate',
        'face plate',
        'wallplate',
        'wall plate',
        'datacom faceplate'
    ];
    
    -- Add port variations
    IF p_number_of_ports IS NOT NULL THEN
        terms := terms || ARRAY[
            p_number_of_ports::TEXT || ' port',
            p_number_of_ports::TEXT || ' port faceplate',
            p_number_of_ports::TEXT || 'port'
        ];
    END IF;
    
    RETURN array_to_string(
        ARRAY(SELECT DISTINCT unnest(terms) WHERE unnest(terms) IS NOT NULL),
        ' '
    );
END;
$$ LANGUAGE plpgsql;

-- 7. Surface Mount Boxes Search Terms
CREATE OR REPLACE FUNCTION get_smb_search_terms_enhanced(
    p_part_number TEXT,
    p_brand TEXT,
    p_product_line TEXT,
    p_number_of_ports INTEGER,  -- NOT ports
    p_color TEXT,
    p_short_description TEXT
) RETURNS TEXT AS $$
DECLARE
    terms TEXT[];
BEGIN
    -- Basic terms
    terms := ARRAY[
        LOWER(p_part_number),
        LOWER(p_brand),
        LOWER(p_product_line),
        LOWER(p_color),
        LOWER(p_short_description),
        'surface mount box',
        'surface mount',
        'smb',
        's.m.b',
        'surface box'
    ];
    
    -- Add port variations
    IF p_number_of_ports IS NOT NULL THEN
        terms := terms || ARRAY[
            p_number_of_ports::TEXT || ' port',
            p_number_of_ports::TEXT || ' port smb',
            p_number_of_ports::TEXT || ' port surface mount'
        ];
    END IF;
    
    RETURN array_to_string(
        ARRAY(SELECT DISTINCT unnest(terms) WHERE unnest(terms) IS NOT NULL),
        ' '
    );
END;
$$ LANGUAGE plpgsql;

-- ===================================
-- UPDATE TRIGGERS FOR ALL TABLES
-- ===================================

-- Create trigger function for automatic updates
CREATE OR REPLACE FUNCTION update_search_terms_trigger() RETURNS TRIGGER AS $$
BEGIN
    -- Update timestamp
    NEW.updated_at = CURRENT_TIMESTAMP;
    
    -- Update search terms based on table
    CASE TG_TABLE_NAME
        WHEN 'prod_category_cables' THEN
            NEW.computed_search_terms := get_cable_search_terms_enhanced(
                NEW.part_number, NEW.brand, NEW.category_rating, NEW.jacket_color,
                NEW.jacket_material, NEW.length, NEW."Shielding_Type",
                NEW.short_description
            );
            
        WHEN 'prod_fiber_cables' THEN
            NEW.computed_search_terms := get_fiber_cable_search_terms_enhanced(
                NEW.part_number, NEW.brand, NEW.fiber_types, NEW.fiber_count,
                NEW.jacket_rating, NEW.short_description
            );
            
        WHEN 'prod_fiber_connectors' THEN
            NEW.computed_search_terms := get_fiber_connector_search_terms_enhanced(
                NEW.part_number, NEW.brand, NEW.connector_type, NEW.fiber_types,
                NEW.termination_type, NEW.short_description
            );
            
        WHEN 'prod_jack_modules' THEN
            NEW.computed_search_terms := get_jack_module_search_terms_enhanced(
                NEW.part_number, NEW.brand, NEW.product_line, NEW.category_rating,
                NEW.shielding_type, NEW.color, NEW.short_description
            );
            
        WHEN 'prod_modular_plugs' THEN
            NEW.computed_search_terms := get_modular_plug_search_terms_enhanced(
                NEW.part_number, NEW.brand, NEW.product_line, NEW.category_rating,
                NEW.shielding_type, NEW.short_description
            );
            
        WHEN 'prod_faceplates' THEN
            NEW.computed_search_terms := get_faceplate_search_terms_enhanced(
                NEW.part_number, NEW.brand, NEW.product_line, NEW.number_of_ports,
                NEW.color, NEW.short_description
            );
            
        WHEN 'prod_surface_mount_boxes' THEN
            NEW.computed_search_terms := get_smb_search_terms_enhanced(
                NEW.part_number, NEW.brand, NEW.product_line, NEW.number_of_ports,
                NEW.color, NEW.short_description
            );
            
        ELSE
            -- For other tables, use basic search terms
            NEW.computed_search_terms := LOWER(
                COALESCE(NEW.part_number, '') || ' ' ||
                COALESCE(NEW.brand, '') || ' ' ||
                COALESCE(NEW.short_description, '')
            );
    END CASE;
    
    -- Update search vector
    NEW.search_vector := to_tsvector('english', NEW.computed_search_terms);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers on all tables
DO $$
DECLARE
    tbl TEXT;
    tables TEXT[] := ARRAY[
        'prod_category_cables',
        'prod_fiber_cables',
        'prod_fiber_connectors',
        'prod_adapter_panels',
        'prod_jack_modules',
        'prod_modular_plugs',
        'prod_faceplates',
        'prod_surface_mount_boxes',
        'prod_wall_mount_fiber_enclosures',
        'prod_rack_mount_fiber_enclosures'
    ];
BEGIN
    FOREACH tbl IN ARRAY tables
    LOOP
        -- Drop existing trigger if it exists
        EXECUTE format('DROP TRIGGER IF EXISTS update_search_terms ON %I', tbl);
        
        -- Create new trigger
        EXECUTE format('
            CREATE TRIGGER update_search_terms
            BEFORE INSERT OR UPDATE ON %I
            FOR EACH ROW
            EXECUTE FUNCTION update_search_terms_trigger()
        ', tbl);
    END LOOP;
END $$;

-- ===================================
-- UPDATE ALL EXISTING DATA
-- ===================================

-- Update all existing products to populate search terms
UPDATE prod_category_cables 
SET computed_search_terms = computed_search_terms
WHERE computed_search_terms IS NULL OR computed_search_terms = '';

UPDATE prod_fiber_cables 
SET computed_search_terms = computed_search_terms
WHERE computed_search_terms IS NULL OR computed_search_terms = '';

UPDATE prod_fiber_connectors 
SET computed_search_terms = computed_search_terms
WHERE computed_search_terms IS NULL OR computed_search_terms = '';

UPDATE prod_jack_modules 
SET computed_search_terms = computed_search_terms
WHERE computed_search_terms IS NULL OR computed_search_terms = '';

UPDATE prod_modular_plugs 
SET computed_search_terms = computed_search_terms
WHERE computed_search_terms IS NULL OR computed_search_terms = '';

UPDATE prod_faceplates 
SET computed_search_terms = computed_search_terms
WHERE computed_search_terms IS NULL OR computed_search_terms = '';

UPDATE prod_surface_mount_boxes 
SET computed_search_terms = computed_search_terms
WHERE computed_search_terms IS NULL OR computed_search_terms = '';

-- ===================================
-- VERIFY RESULTS
-- ===================================

SELECT 'Search enhancement complete! Verifying results...' as status;

-- Show sample of enhanced search terms
(SELECT 
    'prod_category_cables' as table_name,
    part_number::text,
    LEFT(computed_search_terms, 100) || '...' as search_terms_sample
FROM prod_category_cables
WHERE computed_search_terms IS NOT NULL
LIMIT 2)

UNION ALL

(SELECT 
    'prod_fiber_connectors' as table_name,
    part_number::text,
    LEFT(computed_search_terms, 100) || '...' as search_terms_sample
FROM prod_fiber_connectors
WHERE computed_search_terms IS NOT NULL
LIMIT 2)

UNION ALL

(SELECT 
    'prod_jack_modules' as table_name,
    part_number::text,
    LEFT(computed_search_terms, 100) || '...' as search_terms_sample
FROM prod_jack_modules
WHERE computed_search_terms IS NOT NULL
LIMIT 2);

-- Show counts
SELECT 
    'Tables with search terms populated:' as metric,
    COUNT(DISTINCT table_name) as count
FROM (
    SELECT 'prod_category_cables' as table_name FROM prod_category_cables WHERE computed_search_terms IS NOT NULL
    UNION ALL
    SELECT 'prod_fiber_cables' FROM prod_fiber_cables WHERE computed_search_terms IS NOT NULL
    UNION ALL
    SELECT 'prod_fiber_connectors' FROM prod_fiber_connectors WHERE computed_search_terms IS NOT NULL
    UNION ALL
    SELECT 'prod_jack_modules' FROM prod_jack_modules WHERE computed_search_terms IS NOT NULL
    UNION ALL
    SELECT 'prod_modular_plugs' FROM prod_modular_plugs WHERE computed_search_terms IS NOT NULL
    UNION ALL
    SELECT 'prod_faceplates' FROM prod_faceplates WHERE computed_search_terms IS NOT NULL
    UNION ALL
    SELECT 'prod_surface_mount_boxes' FROM prod_surface_mount_boxes WHERE computed_search_terms IS NOT NULL
) t;

SELECT 'Search enhancement complete!' as status,
    'All products now have enhanced search terms' as result,
    'Triggers will automatically update on product changes' as automation;

COMMIT;