-- Complete Search System Setup (WORKING VERSION)
-- This version checks column types before creating indexes

BEGIN;

-- =====================================================
-- STEP 1: Add search columns to all product tables
-- =====================================================
SELECT 'Adding search columns to all product tables...' as status;

-- Add columns if they don't exist
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
        -- Add computed_search_terms if missing
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = r.tablename
            AND column_name = 'computed_search_terms'
        ) THEN
            EXECUTE format('ALTER TABLE %I ADD COLUMN computed_search_terms TEXT', r.tablename);
            RAISE NOTICE 'Added computed_search_terms to %', r.tablename;
        END IF;

        -- Add search_vector if missing
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = r.tablename
            AND column_name = 'search_vector'
        ) THEN
            EXECUTE format('ALTER TABLE %I ADD COLUMN search_vector tsvector', r.tablename);
            RAISE NOTICE 'Added search_vector to %', r.tablename;
        END IF;
    END LOOP;
END $$;

-- =====================================================
-- STEP 2: Create generic search update function
-- =====================================================
CREATE OR REPLACE FUNCTION update_product_search_terms()
RETURNS TRIGGER AS $$
BEGIN
    -- Build search terms from common fields
    NEW.computed_search_terms := CONCAT_WS(' ',
        NEW.part_number,
        NEW.brand,
        NEW.short_description,
        COALESCE(NEW.product_line, ''),
        COALESCE(NEW.category, ''),
        COALESCE(NEW.common_terms, '')
    );

    -- Update search vector
    NEW.search_vector := to_tsvector('english', COALESCE(NEW.computed_search_terms, ''));

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- STEP 3: Update existing records with search data
-- =====================================================
SELECT 'Updating search terms for existing products...' as status;

-- Update each product table
DO $$
DECLARE
    r RECORD;
    update_count INT;
BEGIN
    FOR r IN
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = 'public'
        AND tablename LIKE 'prod_%'
    LOOP
        -- Update computed_search_terms
        EXECUTE format('
            UPDATE %I
            SET computed_search_terms = CONCAT_WS('' '',
                part_number,
                brand,
                short_description,
                COALESCE(product_line, ''''),
                COALESCE(common_terms, '''')
            )
            WHERE computed_search_terms IS NULL', r.tablename);

        GET DIAGNOSTICS update_count = ROW_COUNT;
        IF update_count > 0 THEN
            RAISE NOTICE 'Updated % rows in %', update_count, r.tablename;
        END IF;

        -- Update search_vector
        EXECUTE format('
            UPDATE %I
            SET search_vector = to_tsvector(''english'', COALESCE(computed_search_terms, ''''))
            WHERE search_vector IS NULL
               OR computed_search_terms IS NOT NULL', r.tablename);
    END LOOP;
END $$;

-- =====================================================
-- STEP 4: Create indexes only where columns exist
-- =====================================================
SELECT 'Creating indexes...' as status;

DO $$
DECLARE
    r RECORD;
    col_type TEXT;
BEGIN
    FOR r IN
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = 'public'
        AND tablename LIKE 'prod_%'
    LOOP
        -- Check if search_vector column exists and is tsvector type
        SELECT data_type INTO col_type
        FROM information_schema.columns
        WHERE table_name = r.tablename
        AND column_name = 'search_vector';

        IF col_type = 'tsvector' OR col_type IS NULL THEN
            -- Create GIN index on search_vector
            BEGIN
                EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%s_search_vector ON %I USING GIN (search_vector)',
                              r.tablename, r.tablename);
                RAISE NOTICE 'Created search index on %', r.tablename;
            EXCEPTION
                WHEN OTHERS THEN
                    RAISE NOTICE 'Could not create search index on %: %', r.tablename, SQLERRM;
            END;
        END IF;

        -- Create regular indexes
        EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%s_part_number ON %I (part_number)',
                      r.tablename, r.tablename);

        -- Brand index if column exists
        IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = r.tablename AND column_name = 'brand'
        ) THEN
            EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%s_brand ON %I (brand)',
                          r.tablename, r.tablename);
        END IF;
    END LOOP;
END $$;

-- =====================================================
-- STEP 5: Add triggers for auto-update
-- =====================================================
SELECT 'Adding search triggers...' as status;

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
        -- Drop old trigger
        EXECUTE format('DROP TRIGGER IF EXISTS trigger_update_search_terms ON %I', r.tablename);

        -- Create new trigger
        EXECUTE format('
            CREATE TRIGGER trigger_update_search_terms
            BEFORE INSERT OR UPDATE ON %I
            FOR EACH ROW
            EXECUTE FUNCTION update_product_search_terms()', r.tablename);
    END LOOP;
END $$;

-- =====================================================
-- STEP 6: Create simple search function
-- =====================================================
CREATE OR REPLACE FUNCTION search_products_simple(
    p_search_term TEXT,
    p_limit INT DEFAULT 100
) RETURNS TABLE (
    table_name TEXT,
    part_number VARCHAR,
    brand VARCHAR,
    description TEXT
) AS $$
BEGIN
    -- Search prod_category_cables
    RETURN QUERY
    SELECT
        'prod_category_cables'::TEXT,
        part_number,
        brand,
        short_description
    FROM prod_category_cables
    WHERE search_vector @@ plainto_tsquery('english', p_search_term)
       OR part_number ILIKE '%' || p_search_term || '%'
       OR short_description ILIKE '%' || p_search_term || '%'
    LIMIT p_limit;

    -- Add other tables as needed
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- STEP 7: Populate search_terms table
-- =====================================================
SELECT 'Populating search terms...' as status;

-- Clear existing
TRUNCATE TABLE search_terms;

-- Add category cable terms
INSERT INTO search_terms (term_group, search_term, categories, applicable_tables) VALUES
('category', 'cat5e', ARRAY['Category 5e'], ARRAY['prod_category_cables']),
('category', 'cat6', ARRAY['Category 6'], ARRAY['prod_category_cables']),
('category', 'cat6a', ARRAY['Category 6a'], ARRAY['prod_category_cables']),
('generic', 'ethernet', ARRAY['Category 5e', 'Category 6', 'Category 6a'], ARRAY['prod_category_cables']),
('generic', 'network cable', ARRAY['Category 5e', 'Category 6', 'Category 6a'], ARRAY['prod_category_cables']);

-- =====================================================
-- STEP 8: Test the system
-- =====================================================
SELECT 'Testing search...' as status;

-- Test on category cables
SELECT
    part_number,
    brand,
    LEFT(short_description, 50) as description
FROM prod_category_cables
WHERE search_vector @@ plainto_tsquery('english', 'cat6')
LIMIT 5;

-- Show index status
SELECT
    tablename,
    indexname,
    pg_size_pretty(pg_relation_size(indexname::regclass)) as size
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename LIKE 'prod_%'
AND indexname LIKE '%search%'
ORDER BY tablename;

SELECT 'Search system setup complete!' as status;

COMMIT;