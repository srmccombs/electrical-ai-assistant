-- Fix search functions with simpler implementation
-- Remove dependency on search_terms table for now

BEGIN;

-- Check what columns search_terms table actually has
SELECT 
    'Columns in search_terms table:' as info,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_name = 'search_terms'
ORDER BY ordinal_position;

-- Create simplified search functions without search_terms dependency

-- 1. Category Cables Search Terms (SIMPLIFIED)
CREATE OR REPLACE FUNCTION get_cable_search_terms_enhanced(
    p_part_number TEXT,
    p_brand TEXT,
    p_category_rating TEXT,
    p_jacket_color TEXT,
    p_jacket_material TEXT,
    p_length TEXT,
    p_shielding_type TEXT,
    p_short_description TEXT
) RETURNS TEXT AS $$
DECLARE
    terms TEXT[];
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
        LOWER(p_length)
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
    
    -- Add jacket material synonyms
    IF p_jacket_material IS NOT NULL THEN
        CASE LOWER(p_jacket_material)
            WHEN 'plenum rated cmp' THEN
                terms := terms || ARRAY['plenum', 'cmp', 'fire rated'];
            WHEN 'riser rated cmr' THEN
                terms := terms || ARRAY['riser', 'cmr', 'pvc'];
            ELSE
                NULL;
        END CASE;
    END IF;
    
    -- Add shielding synonyms
    IF p_shielding_type IS NOT NULL THEN
        CASE LOWER(p_shielding_type)
            WHEN 'utp' THEN
                terms := terms || ARRAY['unshielded', 'unshielded twisted pair'];
            WHEN 'stp' THEN
                terms := terms || ARRAY['shielded', 'shielded twisted pair'];
            WHEN 'f/utp' THEN
                terms := terms || ARRAY['foiled', 'ftp'];
            ELSE
                NULL;
        END CASE;
    END IF;
    
    -- Add length variations
    IF p_length IS NOT NULL THEN
        terms := terms || ARRAY[
            p_length || ' ft',
            p_length || ' feet',
            p_length || 'ft'
        ];
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

-- 2. Fiber Cables Search Terms (SIMPLIFIED)
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
            
            -- Add fiber type synonyms
            CASE LOWER(fiber_type)
                WHEN 'om1' THEN
                    terms := terms || ARRAY['62.5/125', 'multimode'];
                WHEN 'om2' THEN
                    terms := terms || ARRAY['50/125', 'multimode'];
                WHEN 'om3' THEN
                    terms := terms || ARRAY['50/125', 'multimode', '10gig', 'aqua'];
                WHEN 'om4' THEN
                    terms := terms || ARRAY['50/125', 'multimode', '10gig', 'aqua', 'violet'];
                WHEN 'os1' THEN
                    terms := terms || ARRAY['9/125', 'singlemode', 'single mode'];
                WHEN 'os2' THEN
                    terms := terms || ARRAY['9/125', 'singlemode', 'single mode'];
                ELSE
                    NULL;
            END CASE;
        END LOOP;
    END IF;
    
    -- Add fiber count variations
    IF p_fiber_count IS NOT NULL THEN
        terms := terms || ARRAY[
            p_fiber_count::TEXT || ' fiber',
            p_fiber_count::TEXT || ' strand',
            p_fiber_count::TEXT || ' count',
            (p_fiber_count/2)::TEXT || ' pair'  -- Add pair count
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

-- 3. Fiber Connectors Search Terms (SIMPLIFIED)
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

-- 4. Jack Modules Search Terms (SIMPLIFIED)
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

-- 5. Modular Plugs Search Terms (SIMPLIFIED)
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

-- 6. Faceplates Search Terms (SIMPLIFIED)
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

-- 7. Surface Mount Boxes Search Terms (SIMPLIFIED)
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

-- Test update on a few records
UPDATE prod_category_cables 
SET updated_at = CURRENT_TIMESTAMP 
WHERE id IN (SELECT id FROM prod_category_cables LIMIT 5);

SELECT 'Simplified search functions created!' as status,
    'Removed dependency on search_terms table' as result,
    'Added hardcoded synonyms instead' as approach;

COMMIT;