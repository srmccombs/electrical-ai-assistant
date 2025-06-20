-- Fix search functions with correct data types
-- Check actual column types and adjust function signatures

BEGIN;

-- First, let's check the actual data types
SELECT 
    'Checking prod_category_cables column types:' as info;

SELECT 
    column_name,
    data_type,
    udt_name
FROM information_schema.columns
WHERE table_name = 'prod_category_cables'
AND column_name IN ('length', 'shielding_type', 'jacket_color', 'jacket_material')
ORDER BY column_name;

-- Fix the function with correct data type for length
-- Based on the error, length appears to be VARCHAR not INTEGER
CREATE OR REPLACE FUNCTION get_cable_search_terms_enhanced(
    p_part_number TEXT,
    p_brand TEXT,
    p_category_rating TEXT,
    p_jacket_color TEXT,
    p_jacket_material TEXT,
    p_length TEXT,  -- Changed from INTEGER to TEXT
    p_shielding_type TEXT,
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
        LOWER(p_short_description),
        LOWER(p_length)  -- Add length to search terms
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
    
    -- Add length variations if provided
    IF p_length IS NOT NULL THEN
        terms := terms || ARRAY[
            p_length || ' ft',
            p_length || ' feet',
            p_length || 'ft'
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
        ARRAY(
            SELECT DISTINCT term 
            FROM unnest(terms) AS term 
            WHERE term IS NOT NULL
        ),
        ' '
    );
END;
$$ LANGUAGE plpgsql;

-- Rest of the functions remain the same, just copying them to ensure they exist

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
        ARRAY(
            SELECT DISTINCT term 
            FROM unnest(terms) AS term 
            WHERE term IS NOT NULL
        ),
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
        'fiber ends',
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
        ARRAY(
            SELECT DISTINCT term 
            FROM unnest(terms) AS term 
            WHERE term IS NOT NULL
        ),
        ' '
    );
END;
$$ LANGUAGE plpgsql;

-- 4. Jack Modules Search Terms
CREATE OR REPLACE FUNCTION get_jack_module_search_terms_enhanced(
    p_part_number TEXT,
    p_brand TEXT,
    p_product_line TEXT,
    p_category_rating TEXT,
    p_shielding_type TEXT,
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
    
    -- Add brand-specific terms
    IF p_brand = 'Panduit' THEN
        terms := terms || ARRAY['minicom', 'mini-com', 'netkey'];
    ELSIF p_brand = 'Hubbell' THEN
        terms := terms || ARRAY['xcelerator', 'netselect'];
    ELSIF p_brand = 'Dynacom' THEN
        terms := terms || ARRAY['keystone'];
    END IF;
    
    RETURN array_to_string(
        ARRAY(
            SELECT DISTINCT term 
            FROM unnest(terms) AS term 
            WHERE term IS NOT NULL
        ),
        ' '
    );
END;
$$ LANGUAGE plpgsql;

-- 5. Modular Plugs Search Terms
CREATE OR REPLACE FUNCTION get_modular_plug_search_terms_enhanced(
    p_part_number TEXT,
    p_brand TEXT,
    p_product_line TEXT,
    p_category_rating TEXT,
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
    
    -- Add terms specific to Simply Brands
    IF p_brand = 'Simply Brands' THEN
        terms := terms || ARRAY['simply', 'simply 45', 's45'];
        
        IF p_product_line LIKE '%PRO%' THEN
            terms := terms || ARRAY['pro series', 'pro'];
        ELSIF p_product_line LIKE '%INSTALLER%' THEN
            terms := terms || ARRAY['installer series', 'installer'];
        END IF;
    END IF;
    
    RETURN array_to_string(
        ARRAY(
            SELECT DISTINCT term 
            FROM unnest(terms) AS term 
            WHERE term IS NOT NULL
        ),
        ' '
    );
END;
$$ LANGUAGE plpgsql;

-- 6. Faceplates Search Terms
CREATE OR REPLACE FUNCTION get_faceplate_search_terms_enhanced(
    p_part_number TEXT,
    p_brand TEXT,
    p_product_line TEXT,
    p_number_of_ports INTEGER,
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
        ARRAY(
            SELECT DISTINCT term 
            FROM unnest(terms) AS term 
            WHERE term IS NOT NULL
        ),
        ' '
    );
END;
$$ LANGUAGE plpgsql;

-- 7. Surface Mount Boxes Search Terms
CREATE OR REPLACE FUNCTION get_smb_search_terms_enhanced(
    p_part_number TEXT,
    p_brand TEXT,
    p_product_line TEXT,
    p_number_of_ports INTEGER,
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
        ARRAY(
            SELECT DISTINCT term 
            FROM unnest(terms) AS term 
            WHERE term IS NOT NULL
        ),
        ' '
    );
END;
$$ LANGUAGE plpgsql;

-- Force update search terms
UPDATE prod_category_cables SET updated_at = CURRENT_TIMESTAMP WHERE id IN (SELECT id FROM prod_category_cables LIMIT 10);
UPDATE prod_fiber_cables SET updated_at = CURRENT_TIMESTAMP WHERE id IN (SELECT id FROM prod_fiber_cables LIMIT 10);
UPDATE prod_fiber_connectors SET updated_at = CURRENT_TIMESTAMP WHERE id IN (SELECT id FROM prod_fiber_connectors LIMIT 10);
UPDATE prod_jack_modules SET updated_at = CURRENT_TIMESTAMP WHERE id IN (SELECT id FROM prod_jack_modules LIMIT 10);
UPDATE prod_modular_plugs SET updated_at = CURRENT_TIMESTAMP WHERE id IN (SELECT id FROM prod_modular_plugs LIMIT 10);
UPDATE prod_faceplates SET updated_at = CURRENT_TIMESTAMP WHERE id IN (SELECT id FROM prod_faceplates LIMIT 10);
UPDATE prod_surface_mount_boxes SET updated_at = CURRENT_TIMESTAMP WHERE id IN (SELECT id FROM prod_surface_mount_boxes LIMIT 10);

SELECT 'Search functions fixed with correct data types!' as status,
    'Length parameter changed from INTEGER to TEXT' as result;

COMMIT;