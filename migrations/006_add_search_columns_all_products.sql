-- Add search columns to all product tables
-- This completes the search implementation for all product types
-- 
-- IMPORTANT: This migration is designed to match the sophisticated search implementation
-- used for prod_category_cables. It includes:
-- 1. Integration with search_terms table for synonyms and variations
-- 2. Table-specific attributes included in search terms
-- 3. Automatic triggers for search term updates
-- 4. Full-text search indexes for performance
--
-- This migration is safe to run multiple times - it checks for existing columns

BEGIN;

-- =====================================================
-- STEP 0: Ensure search_terms table has product_lines column
-- =====================================================
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'search_terms' 
        AND column_name = 'product_lines'
    ) THEN
        ALTER TABLE search_terms ADD COLUMN product_lines TEXT[];
        RAISE NOTICE 'Added product_lines column to search_terms table';
    END IF;
END $$;

-- =====================================================
-- STEP 1: Add computed_search_terms column to all product tables
-- =====================================================
SELECT 'Adding computed_search_terms to all product tables...' as status;

-- prod_fiber_connectors
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'prod_fiber_connectors' 
        AND column_name = 'computed_search_terms'
    ) THEN
        ALTER TABLE prod_fiber_connectors ADD COLUMN computed_search_terms TEXT;
        RAISE NOTICE 'Added computed_search_terms to prod_fiber_connectors';
    END IF;
END $$;

-- prod_fiber_cables
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'prod_fiber_cables' 
        AND column_name = 'computed_search_terms'
    ) THEN
        ALTER TABLE prod_fiber_cables ADD COLUMN computed_search_terms TEXT;
        RAISE NOTICE 'Added computed_search_terms to prod_fiber_cables';
    END IF;
END $$;

-- prod_jack_modules
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'prod_jack_modules' 
        AND column_name = 'computed_search_terms'
    ) THEN
        ALTER TABLE prod_jack_modules ADD COLUMN computed_search_terms TEXT;
        RAISE NOTICE 'Added computed_search_terms to prod_jack_modules';
    END IF;
END $$;

-- prod_faceplates
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'prod_faceplates' 
        AND column_name = 'computed_search_terms'
    ) THEN
        ALTER TABLE prod_faceplates ADD COLUMN computed_search_terms TEXT;
        RAISE NOTICE 'Added computed_search_terms to prod_faceplates';
    END IF;
END $$;

-- prod_surface_mount_boxes
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'prod_surface_mount_boxes' 
        AND column_name = 'computed_search_terms'
    ) THEN
        ALTER TABLE prod_surface_mount_boxes ADD COLUMN computed_search_terms TEXT;
        RAISE NOTICE 'Added computed_search_terms to prod_surface_mount_boxes';
    END IF;
END $$;

-- prod_adapter_panels
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'prod_adapter_panels' 
        AND column_name = 'computed_search_terms'
    ) THEN
        ALTER TABLE prod_adapter_panels ADD COLUMN computed_search_terms TEXT;
        RAISE NOTICE 'Added computed_search_terms to prod_adapter_panels';
    END IF;
END $$;

-- prod_rack_mount_enclosures
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'prod_rack_mount_enclosures' 
        AND column_name = 'computed_search_terms'
    ) THEN
        ALTER TABLE prod_rack_mount_enclosures ADD COLUMN computed_search_terms TEXT;
        RAISE NOTICE 'Added computed_search_terms to prod_rack_mount_enclosures';
    END IF;
END $$;

-- prod_wall_mount_enclosures
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'prod_wall_mount_enclosures' 
        AND column_name = 'computed_search_terms'
    ) THEN
        ALTER TABLE prod_wall_mount_enclosures ADD COLUMN computed_search_terms TEXT;
        RAISE NOTICE 'Added computed_search_terms to prod_wall_mount_enclosures';
    END IF;
END $$;

-- prod_modular_plugs
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'prod_modular_plugs' 
        AND column_name = 'computed_search_terms'
    ) THEN
        ALTER TABLE prod_modular_plugs ADD COLUMN computed_search_terms TEXT;
        RAISE NOTICE 'Added computed_search_terms to prod_modular_plugs';
    END IF;
END $$;

-- =====================================================
-- STEP 2: Add search_vector column to all product tables
-- =====================================================
SELECT 'Adding search_vector to all product tables...' as status;

-- prod_fiber_connectors
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'prod_fiber_connectors' 
        AND column_name = 'search_vector'
    ) THEN
        ALTER TABLE prod_fiber_connectors ADD COLUMN search_vector tsvector;
        RAISE NOTICE 'Added search_vector to prod_fiber_connectors';
    END IF;
END $$;

-- prod_fiber_cables
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'prod_fiber_cables' 
        AND column_name = 'search_vector'
    ) THEN
        ALTER TABLE prod_fiber_cables ADD COLUMN search_vector tsvector;
        RAISE NOTICE 'Added search_vector to prod_fiber_cables';
    END IF;
END $$;

-- prod_jack_modules
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'prod_jack_modules' 
        AND column_name = 'search_vector'
    ) THEN
        ALTER TABLE prod_jack_modules ADD COLUMN search_vector tsvector;
        RAISE NOTICE 'Added search_vector to prod_jack_modules';
    END IF;
END $$;

-- prod_faceplates
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'prod_faceplates' 
        AND column_name = 'search_vector'
    ) THEN
        ALTER TABLE prod_faceplates ADD COLUMN search_vector tsvector;
        RAISE NOTICE 'Added search_vector to prod_faceplates';
    END IF;
END $$;

-- prod_surface_mount_boxes
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'prod_surface_mount_boxes' 
        AND column_name = 'search_vector'
    ) THEN
        ALTER TABLE prod_surface_mount_boxes ADD COLUMN search_vector tsvector;
        RAISE NOTICE 'Added search_vector to prod_surface_mount_boxes';
    END IF;
END $$;

-- prod_adapter_panels
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'prod_adapter_panels' 
        AND column_name = 'search_vector'
    ) THEN
        ALTER TABLE prod_adapter_panels ADD COLUMN search_vector tsvector;
        RAISE NOTICE 'Added search_vector to prod_adapter_panels';
    END IF;
END $$;

-- prod_rack_mount_enclosures
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'prod_rack_mount_enclosures' 
        AND column_name = 'search_vector'
    ) THEN
        ALTER TABLE prod_rack_mount_enclosures ADD COLUMN search_vector tsvector;
        RAISE NOTICE 'Added search_vector to prod_rack_mount_enclosures';
    END IF;
END $$;

-- prod_wall_mount_enclosures
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'prod_wall_mount_enclosures' 
        AND column_name = 'search_vector'
    ) THEN
        ALTER TABLE prod_wall_mount_enclosures ADD COLUMN search_vector tsvector;
        RAISE NOTICE 'Added search_vector to prod_wall_mount_enclosures';
    END IF;
END $$;

-- prod_modular_plugs
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'prod_modular_plugs' 
        AND column_name = 'search_vector'
    ) THEN
        ALTER TABLE prod_modular_plugs ADD COLUMN search_vector tsvector;
        RAISE NOTICE 'Added search_vector to prod_modular_plugs';
    END IF;
END $$;

-- =====================================================
-- STEP 3: Create GIN indexes for full-text search
-- =====================================================
SELECT 'Creating GIN indexes for search_vector...' as status;

-- Create indexes only on tables that have the search_vector column as tsvector
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = 'public'
        AND tablename LIKE 'prod_%'
    LOOP
        -- Check if search_vector exists and is of type tsvector
        IF EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_name = r.tablename 
            AND column_name = 'search_vector'
            AND data_type = 'tsvector'
        ) THEN
            -- Create index if it doesn't exist
            IF NOT EXISTS (
                SELECT 1
                FROM pg_indexes
                WHERE tablename = r.tablename
                AND indexname = 'idx_' || r.tablename || '_search'
            ) THEN
                EXECUTE format('CREATE INDEX idx_%s_search ON %I USING GIN(search_vector)', 
                    replace(r.tablename, 'prod_', ''), r.tablename);
                RAISE NOTICE 'Created GIN index on %.search_vector', r.tablename;
            ELSE
                RAISE NOTICE 'GIN index already exists on %.search_vector', r.tablename;
            END IF;
        ELSE
            RAISE WARNING 'Table % does not have search_vector column of type tsvector', r.tablename;
        END IF;
    END LOOP;
END $$;

-- =====================================================
-- STEP 4: Create helper function to check if column exists
-- =====================================================
CREATE OR REPLACE FUNCTION column_exists(p_table_name TEXT, p_column_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = p_table_name 
        AND column_name = p_column_name
    );
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- STEP 5: Create generic search term generation function
-- =====================================================
CREATE OR REPLACE FUNCTION get_generic_search_terms(
    p_table_name VARCHAR,
    p_part_number VARCHAR,
    p_brand VARCHAR,
    p_description TEXT,
    p_product_line VARCHAR DEFAULT NULL,
    p_category VARCHAR DEFAULT NULL,
    p_common_terms TEXT DEFAULT NULL,
    p_additional_attrs JSONB DEFAULT NULL
) RETURNS TEXT AS $$
DECLARE
    search_terms TEXT := '';
    term_record RECORD;
    attr_key TEXT;
    attr_value TEXT;
BEGIN
    -- Add all the basic fields
    search_terms := COALESCE(p_part_number, '') || ' ';
    search_terms := search_terms || COALESCE(p_description, '') || ' ';
    search_terms := search_terms || COALESCE(p_brand, '') || ' ';
    search_terms := search_terms || COALESCE(p_product_line, '') || ' ';
    search_terms := search_terms || COALESCE(p_category, '') || ' ';
    search_terms := search_terms || COALESCE(p_common_terms, '') || ' ';
    
    -- Get all matching search terms from search_terms table (like category_cables does)
    FOR term_record IN 
        SELECT DISTINCT search_term 
        FROM search_terms 
        WHERE p_table_name = ANY(applicable_tables)
        AND (
            -- Match brand
            (p_brand = ANY(brands) OR cardinality(brands) = 0)
            -- Match product line
            OR (p_product_line = ANY(product_lines) OR cardinality(product_lines) = 0)
            -- Match category
            OR (p_category = ANY(categories) OR cardinality(categories) = 0)
        )
    LOOP
        search_terms := search_terms || term_record.search_term || ' ';
    END LOOP;
    
    -- Add any additional attributes passed as JSONB
    IF p_additional_attrs IS NOT NULL THEN
        FOR attr_key, attr_value IN SELECT * FROM jsonb_each_text(p_additional_attrs)
        LOOP
            search_terms := search_terms || COALESCE(attr_value, '') || ' ';
        END LOOP;
    END IF;
    
    -- Clean up extra spaces
    search_terms := REGEXP_REPLACE(search_terms, '\s+', ' ', 'g');
    search_terms := TRIM(search_terms);
    
    RETURN search_terms;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- STEP 6: Create update functions for each table
-- =====================================================

-- Generic function to update computed_search_terms
CREATE OR REPLACE FUNCTION update_generic_search_terms()
RETURNS TRIGGER AS $$
DECLARE
    v_additional_attrs JSONB;
    v_product_line TEXT := NULL;
    v_common_terms TEXT := NULL;
BEGIN
    -- Build additional attributes based on table
    v_additional_attrs := '{}'::jsonb;
    
    -- Get product_line if column exists
    BEGIN
        EXECUTE format('SELECT $1.product_line') INTO v_product_line USING NEW;
    EXCEPTION
        WHEN undefined_column THEN
            v_product_line := NULL;
    END;
    
    -- Get common_terms if column exists
    BEGIN
        EXECUTE format('SELECT $1.common_terms') INTO v_common_terms USING NEW;
    EXCEPTION
        WHEN undefined_column THEN
            v_common_terms := NULL;
    END;
    
    -- Add table-specific attributes (with error handling for missing columns)
    BEGIN
        CASE TG_TABLE_NAME
            WHEN 'prod_fiber_connectors' THEN
                v_additional_attrs := jsonb_strip_nulls(jsonb_build_object(
                    'connector_type', CASE WHEN column_exists(TG_TABLE_NAME, 'connector_type') THEN NEW.connector_type ELSE NULL END,
                    'fiber_type', CASE WHEN column_exists(TG_TABLE_NAME, 'fiber_type') THEN NEW.fiber_type ELSE NULL END,
                    'polarity', CASE WHEN column_exists(TG_TABLE_NAME, 'polarity') THEN NEW.polarity ELSE NULL END
                ));
            WHEN 'prod_fiber_cables' THEN
                v_additional_attrs := jsonb_strip_nulls(jsonb_build_object(
                    'fiber_type', CASE WHEN column_exists(TG_TABLE_NAME, 'fiber_type') THEN NEW.fiber_type ELSE NULL END,
                    'fiber_count', CASE WHEN column_exists(TG_TABLE_NAME, 'fiber_count') THEN NEW.fiber_count ELSE NULL END,
                    'jacket_material', CASE WHEN column_exists(TG_TABLE_NAME, 'jacket_material') THEN NEW.jacket_material ELSE NULL END,
                    'jacket_rating', CASE WHEN column_exists(TG_TABLE_NAME, 'jacket_rating') THEN NEW.jacket_rating ELSE NULL END
                ));
            WHEN 'prod_jack_modules' THEN
                v_additional_attrs := jsonb_strip_nulls(jsonb_build_object(
                    'category', CASE WHEN column_exists(TG_TABLE_NAME, 'category') THEN NEW.category ELSE NULL END,
                    'termination_type', CASE WHEN column_exists(TG_TABLE_NAME, 'termination_type') THEN NEW.termination_type ELSE NULL END,
                    'color', CASE WHEN column_exists(TG_TABLE_NAME, 'color') THEN NEW.color ELSE NULL END
                ));
            WHEN 'prod_faceplates' THEN
                v_additional_attrs := jsonb_strip_nulls(jsonb_build_object(
                    'ports', CASE WHEN column_exists(TG_TABLE_NAME, 'ports') THEN NEW.ports ELSE NULL END,
                    'gang', CASE WHEN column_exists(TG_TABLE_NAME, 'gang') THEN NEW.gang ELSE NULL END,
                    'color', CASE WHEN column_exists(TG_TABLE_NAME, 'color') THEN NEW.color ELSE NULL END,
                    'mounting_type', CASE WHEN column_exists(TG_TABLE_NAME, 'mounting_type') THEN NEW.mounting_type ELSE NULL END
                ));
            WHEN 'prod_surface_mount_boxes' THEN
                v_additional_attrs := jsonb_strip_nulls(jsonb_build_object(
                    'ports', CASE WHEN column_exists(TG_TABLE_NAME, 'ports') THEN NEW.ports ELSE NULL END,
                    'mounting_type', CASE WHEN column_exists(TG_TABLE_NAME, 'mounting_type') THEN NEW.mounting_type ELSE NULL END,
                    'color', CASE WHEN column_exists(TG_TABLE_NAME, 'color') THEN NEW.color ELSE NULL END
                ));
            WHEN 'prod_adapter_panels' THEN
                v_additional_attrs := jsonb_strip_nulls(jsonb_build_object(
                    'panel_type', CASE WHEN column_exists(TG_TABLE_NAME, 'panel_type') THEN NEW.panel_type ELSE NULL END,
                    'adapter_type', CASE WHEN column_exists(TG_TABLE_NAME, 'adapter_type') THEN NEW.adapter_type ELSE NULL END,
                    'ports', CASE WHEN column_exists(TG_TABLE_NAME, 'ports') THEN NEW.ports ELSE NULL END
                ));
            WHEN 'prod_rack_mount_enclosures' THEN
                v_additional_attrs := jsonb_strip_nulls(jsonb_build_object(
                    'panel_capacity', CASE WHEN column_exists(TG_TABLE_NAME, 'panel_capacity') THEN NEW.panel_capacity ELSE NULL END,
                    'rack_units', CASE WHEN column_exists(TG_TABLE_NAME, 'rack_units') THEN NEW.rack_units ELSE NULL END,
                    'depth', CASE WHEN column_exists(TG_TABLE_NAME, 'depth') THEN NEW.depth ELSE NULL END
                ));
            WHEN 'prod_wall_mount_enclosures' THEN
                v_additional_attrs := jsonb_strip_nulls(jsonb_build_object(
                    'panel_capacity', CASE WHEN column_exists(TG_TABLE_NAME, 'panel_capacity') THEN NEW.panel_capacity ELSE NULL END,
                    'mounting_type', CASE WHEN column_exists(TG_TABLE_NAME, 'mounting_type') THEN NEW.mounting_type ELSE NULL END
                ));
            WHEN 'prod_modular_plugs' THEN
                v_additional_attrs := jsonb_strip_nulls(jsonb_build_object(
                    'category', CASE WHEN column_exists(TG_TABLE_NAME, 'category') THEN NEW.category ELSE NULL END,
                    'plug_type', CASE WHEN column_exists(TG_TABLE_NAME, 'plug_type') THEN NEW.plug_type ELSE NULL END,
                    'shielded', CASE WHEN column_exists(TG_TABLE_NAME, 'shielded') THEN NEW.shielded ELSE NULL END
                ));
        END CASE;
    EXCEPTION
        WHEN OTHERS THEN
            -- If any error occurs, just use empty attributes
            v_additional_attrs := '{}'::jsonb;
    END;
    
    NEW.computed_search_terms := get_generic_search_terms(
        TG_TABLE_NAME,
        NEW.part_number,
        NEW.brand,
        NEW.short_description,
        v_product_line,
        CASE TG_TABLE_NAME
            WHEN 'prod_fiber_connectors' THEN 'Fiber Connector'
            WHEN 'prod_fiber_cables' THEN 'Fiber Cable'
            WHEN 'prod_jack_modules' THEN 'Jack Module'
            WHEN 'prod_faceplates' THEN 'Faceplate'
            WHEN 'prod_surface_mount_boxes' THEN 'Surface Mount Box'
            WHEN 'prod_adapter_panels' THEN 'Adapter Panel'
            WHEN 'prod_rack_mount_enclosures' THEN 'Rack Mount Enclosure'
            WHEN 'prod_wall_mount_enclosures' THEN 'Wall Mount Enclosure'
            WHEN 'prod_modular_plugs' THEN 'Modular Plug'
            ELSE 'Product'
        END,
        v_common_terms,
        v_additional_attrs
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update search vector from computed terms
CREATE OR REPLACE FUNCTION update_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := to_tsvector('english', COALESCE(NEW.computed_search_terms, ''));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- STEP 7: Create triggers for automatic updates
-- =====================================================
SELECT 'Creating triggers for automatic search term updates...' as status;

-- Triggers for computed_search_terms
CREATE TRIGGER trg_update_fiber_connectors_search_terms
    BEFORE INSERT OR UPDATE ON prod_fiber_connectors
    FOR EACH ROW
    EXECUTE FUNCTION update_generic_search_terms();

CREATE TRIGGER trg_update_fiber_cables_search_terms
    BEFORE INSERT OR UPDATE ON prod_fiber_cables
    FOR EACH ROW
    EXECUTE FUNCTION update_generic_search_terms();

CREATE TRIGGER trg_update_jack_modules_search_terms
    BEFORE INSERT OR UPDATE ON prod_jack_modules
    FOR EACH ROW
    EXECUTE FUNCTION update_generic_search_terms();

CREATE TRIGGER trg_update_faceplates_search_terms
    BEFORE INSERT OR UPDATE ON prod_faceplates
    FOR EACH ROW
    EXECUTE FUNCTION update_generic_search_terms();

CREATE TRIGGER trg_update_surface_mount_boxes_search_terms
    BEFORE INSERT OR UPDATE ON prod_surface_mount_boxes
    FOR EACH ROW
    EXECUTE FUNCTION update_generic_search_terms();

CREATE TRIGGER trg_update_adapter_panels_search_terms
    BEFORE INSERT OR UPDATE ON prod_adapter_panels
    FOR EACH ROW
    EXECUTE FUNCTION update_generic_search_terms();

CREATE TRIGGER trg_update_rack_mount_enclosures_search_terms
    BEFORE INSERT OR UPDATE ON prod_rack_mount_enclosures
    FOR EACH ROW
    EXECUTE FUNCTION update_generic_search_terms();

CREATE TRIGGER trg_update_wall_mount_enclosures_search_terms
    BEFORE INSERT OR UPDATE ON prod_wall_mount_enclosures
    FOR EACH ROW
    EXECUTE FUNCTION update_generic_search_terms();

CREATE TRIGGER trg_update_modular_plugs_search_terms
    BEFORE INSERT OR UPDATE ON prod_modular_plugs
    FOR EACH ROW
    EXECUTE FUNCTION update_generic_search_terms();

-- Triggers for search_vector
CREATE TRIGGER trg_update_fiber_connectors_search_vector
    BEFORE INSERT OR UPDATE OF computed_search_terms ON prod_fiber_connectors
    FOR EACH ROW
    EXECUTE FUNCTION update_search_vector();

CREATE TRIGGER trg_update_fiber_cables_search_vector
    BEFORE INSERT OR UPDATE OF computed_search_terms ON prod_fiber_cables
    FOR EACH ROW
    EXECUTE FUNCTION update_search_vector();

CREATE TRIGGER trg_update_jack_modules_search_vector
    BEFORE INSERT OR UPDATE OF computed_search_terms ON prod_jack_modules
    FOR EACH ROW
    EXECUTE FUNCTION update_search_vector();

CREATE TRIGGER trg_update_faceplates_search_vector
    BEFORE INSERT OR UPDATE OF computed_search_terms ON prod_faceplates
    FOR EACH ROW
    EXECUTE FUNCTION update_search_vector();

CREATE TRIGGER trg_update_surface_mount_boxes_search_vector
    BEFORE INSERT OR UPDATE OF computed_search_terms ON prod_surface_mount_boxes
    FOR EACH ROW
    EXECUTE FUNCTION update_search_vector();

CREATE TRIGGER trg_update_adapter_panels_search_vector
    BEFORE INSERT OR UPDATE OF computed_search_terms ON prod_adapter_panels
    FOR EACH ROW
    EXECUTE FUNCTION update_search_vector();

CREATE TRIGGER trg_update_rack_mount_enclosures_search_vector
    BEFORE INSERT OR UPDATE OF computed_search_terms ON prod_rack_mount_enclosures
    FOR EACH ROW
    EXECUTE FUNCTION update_search_vector();

CREATE TRIGGER trg_update_wall_mount_enclosures_search_vector
    BEFORE INSERT OR UPDATE OF computed_search_terms ON prod_wall_mount_enclosures
    FOR EACH ROW
    EXECUTE FUNCTION update_search_vector();

CREATE TRIGGER trg_update_modular_plugs_search_vector
    BEFORE INSERT OR UPDATE OF computed_search_terms ON prod_modular_plugs
    FOR EACH ROW
    EXECUTE FUNCTION update_search_vector();

-- =====================================================
-- STEP 8: Update existing records to populate search columns
-- =====================================================
SELECT 'Updating existing records with search terms...' as status;

-- Update prod_fiber_connectors
UPDATE prod_fiber_connectors 
SET computed_search_terms = get_generic_search_terms(
    'prod_fiber_connectors',
    part_number, 
    brand, 
    short_description,
    product_line,
    'Fiber Connector',
    common_terms,
    jsonb_build_object(
        'connector_type', connector_type,
        'fiber_type', fiber_type,
        'polarity', polarity
    )
)
WHERE computed_search_terms IS NULL;

-- Update prod_fiber_cables
UPDATE prod_fiber_cables 
SET computed_search_terms = get_generic_search_terms(
    'prod_fiber_cables',
    part_number, 
    brand, 
    short_description,
    product_line,
    'Fiber Cable',
    common_terms,
    jsonb_build_object(
        'fiber_type', fiber_type,
        'fiber_count', fiber_count,
        'jacket_material', jacket_material,
        'jacket_rating', jacket_rating
    )
)
WHERE computed_search_terms IS NULL;

-- Update prod_jack_modules
UPDATE prod_jack_modules 
SET computed_search_terms = get_generic_search_terms(
    'prod_jack_modules',
    part_number, 
    brand, 
    short_description,
    product_line,
    'Jack Module',
    common_terms,
    jsonb_build_object(
        'category', category,
        'termination_type', termination_type,
        'color', color
    )
)
WHERE computed_search_terms IS NULL;

-- Update prod_faceplates
UPDATE prod_faceplates 
SET computed_search_terms = get_generic_search_terms(
    'prod_faceplates',
    part_number, 
    brand, 
    short_description,
    product_line,
    'Faceplate',
    common_terms,
    jsonb_build_object(
        'ports', ports,
        'gang', gang,
        'color', color,
        'mounting_type', mounting_type
    )
)
WHERE computed_search_terms IS NULL;

-- Update prod_surface_mount_boxes
UPDATE prod_surface_mount_boxes 
SET computed_search_terms = get_generic_search_terms(
    'prod_surface_mount_boxes',
    part_number, 
    brand, 
    short_description,
    product_line,
    'Surface Mount Box',
    common_terms,
    jsonb_build_object(
        'ports', ports,
        'mounting_type', mounting_type,
        'color', color
    )
)
WHERE computed_search_terms IS NULL;

-- Update prod_adapter_panels
UPDATE prod_adapter_panels 
SET computed_search_terms = get_generic_search_terms(
    'prod_adapter_panels',
    part_number, 
    brand, 
    short_description,
    product_line,
    'Adapter Panel',
    common_terms,
    jsonb_build_object(
        'panel_type', panel_type,
        'adapter_type', adapter_type,
        'ports', ports
    )
)
WHERE computed_search_terms IS NULL;

-- Update prod_rack_mount_enclosures
UPDATE prod_rack_mount_enclosures 
SET computed_search_terms = get_generic_search_terms(
    'prod_rack_mount_enclosures',
    part_number, 
    brand, 
    short_description,
    product_line,
    'Rack Mount Enclosure',
    common_terms,
    jsonb_build_object(
        'panel_capacity', panel_capacity,
        'rack_units', rack_units,
        'depth', depth
    )
)
WHERE computed_search_terms IS NULL;

-- Update prod_wall_mount_enclosures
UPDATE prod_wall_mount_enclosures 
SET computed_search_terms = get_generic_search_terms(
    'prod_wall_mount_enclosures',
    part_number, 
    brand, 
    short_description,
    product_line,
    'Wall Mount Enclosure',
    common_terms,
    jsonb_build_object(
        'panel_capacity', panel_capacity,
        'mounting_type', mounting_type
    )
)
WHERE computed_search_terms IS NULL;

-- Update prod_modular_plugs
UPDATE prod_modular_plugs 
SET computed_search_terms = get_generic_search_terms(
    'prod_modular_plugs',
    part_number, 
    brand, 
    short_description,
    product_line,
    'Modular Plug',
    common_terms,
    jsonb_build_object(
        'category', category,
        'plug_type', plug_type,
        'shielded', shielded
    )
)
WHERE computed_search_terms IS NULL;

SELECT 'Search columns added to all product tables successfully!' as status;

COMMIT;