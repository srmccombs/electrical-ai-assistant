-- Complete Search System Setup (FIXED VERSION)
-- This handles tables that don't have search columns yet

BEGIN;

-- =====================================================
-- STEP 1: Add search columns to all product tables
-- =====================================================
SELECT 'Adding search columns to all product tables...' as status;

-- Add computed_search_terms to all product tables that don't have it
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
        -- Add computed_search_terms if it doesn't exist
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = r.tablename 
            AND column_name = 'computed_search_terms'
        ) THEN
            EXECUTE format('ALTER TABLE %I ADD COLUMN computed_search_terms TEXT', r.tablename);
            RAISE NOTICE 'Added computed_search_terms to %', r.tablename;
        END IF;
        
        -- Add search_vector if it doesn't exist
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
    NEW.search_vector := to_tsvector('english', NEW.computed_search_terms);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- STEP 3: Add triggers to all product tables
-- =====================================================
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
        -- Drop existing trigger if it exists
        EXECUTE format('DROP TRIGGER IF EXISTS trigger_update_search_terms ON %I', r.tablename);
        
        -- Create trigger
        EXECUTE format('
            CREATE TRIGGER trigger_update_search_terms
            BEFORE INSERT OR UPDATE ON %I
            FOR EACH ROW
            EXECUTE FUNCTION update_product_search_terms()', r.tablename);
        
        RAISE NOTICE 'Created search trigger on %', r.tablename;
    END LOOP;
END $$;

-- =====================================================
-- STEP 4: Update existing records
-- =====================================================
SELECT 'Updating search terms for existing products...' as status;

-- Update prod_category_cables (already has custom function)
-- Skip if already updated

-- Update other product tables
UPDATE prod_fiber_connectors
SET computed_search_terms = CONCAT_WS(' ',
    part_number,
    brand,
    short_description,
    COALESCE(product_line, ''),
    COALESCE(common_terms, '')
)
WHERE computed_search_terms IS NULL;

UPDATE prod_fiber_connectors
SET search_vector = to_tsvector('english', computed_search_terms)
WHERE search_vector IS NULL;

-- Repeat for other tables
UPDATE prod_jack_modules
SET computed_search_terms = CONCAT_WS(' ',
    part_number,
    brand,
    short_description,
    COALESCE(product_line, ''),
    COALESCE(common_terms, '')
)
WHERE computed_search_terms IS NULL;

UPDATE prod_jack_modules
SET search_vector = to_tsvector('english', computed_search_terms)
WHERE search_vector IS NULL;

-- Continue for other tables...

-- =====================================================
-- STEP 5: Populate search_terms table
-- =====================================================
SELECT 'Populating comprehensive search terms...' as status;

-- Clear and repopulate
TRUNCATE TABLE search_terms;

-- Category Cable terms
INSERT INTO search_terms (term_group, search_term, categories, jackets, shielding, applicable_tables) VALUES
-- Category variations
('category', 'cat5e', ARRAY['Category 5e'], NULL, NULL, ARRAY['prod_category_cables']),
('category', 'cat 5e', ARRAY['Category 5e'], NULL, NULL, ARRAY['prod_category_cables']),
('category', 'cat6', ARRAY['Category 6'], NULL, NULL, ARRAY['prod_category_cables']),
('category', 'cat 6', ARRAY['Category 6'], NULL, NULL, ARRAY['prod_category_cables']),
('category', 'cat6a', ARRAY['Category 6a'], NULL, NULL, ARRAY['prod_category_cables']),
('category', 'cat 6a', ARRAY['Category 6a'], NULL, NULL, ARRAY['prod_category_cables']),

-- Jacket variations
('jacket', 'plenum', NULL, ARRAY['CMP'], NULL, ARRAY['prod_category_cables']),
('jacket', 'riser', NULL, ARRAY['CMR'], NULL, ARRAY['prod_category_cables']),
('jacket', 'lszh', NULL, ARRAY['LSZH'], NULL, ARRAY['prod_category_cables']),

-- Generic terms
('generic', 'ethernet', ARRAY['Category 5e', 'Category 6', 'Category 6a'], NULL, NULL, ARRAY['prod_category_cables']),
('generic', 'network cable', ARRAY['Category 5e', 'Category 6', 'Category 6a'], NULL, NULL, ARRAY['prod_category_cables']);

-- Fiber Connector terms
INSERT INTO search_terms (term_group, search_term, categories, applicable_tables) VALUES
('connector', 'lc', ARRAY['LC'], ARRAY['prod_fiber_connectors']),
('connector', 'sc', ARRAY['SC'], ARRAY['prod_fiber_connectors']),
('connector', 'st', ARRAY['ST'], ARRAY['prod_fiber_connectors']),
('connector', 'fiber end', ARRAY['LC', 'SC', 'ST'], ARRAY['prod_fiber_connectors']),
('connector', 'fiber connector', ARRAY['LC', 'SC', 'ST'], ARRAY['prod_fiber_connectors']);

-- Jack Module terms
INSERT INTO search_terms (term_group, search_term, categories, applicable_tables) VALUES
('jack', 'keystone', ARRAY['Keystone'], ARRAY['prod_jack_modules']),
('jack', 'rj45', ARRAY['RJ45'], ARRAY['prod_jack_modules']),
('jack', 'jack module', ARRAY['Jack Module'], ARRAY['prod_jack_modules']),
('jack', 'ethernet jack', ARRAY['Jack Module'], ARRAY['prod_jack_modules']);

-- =====================================================
-- STEP 6: Create indexes on all product tables
-- =====================================================
SELECT 'Creating performance indexes...' as status;

-- Create indexes for each product table
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
        -- Search vector index
        EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%s_search_vector ON %I USING GIN (search_vector)', 
                      r.tablename, r.tablename);
        
        -- Part number index
        EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%s_part_number ON %I (part_number)', 
                      r.tablename, r.tablename);
        
        -- Brand index
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = r.tablename AND column_name = 'brand'
        ) THEN
            EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%s_brand ON %I (brand)', 
                          r.tablename, r.tablename);
        END IF;
        
        RAISE NOTICE 'Created indexes on %', r.tablename;
    END LOOP;
END $$;

-- =====================================================
-- STEP 7: Create simplified materialized view
-- =====================================================
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_product_search AS
SELECT 
    'prod_category_cables' as table_name,
    id,
    part_number,
    brand,
    short_description,
    search_vector,
    computed_search_terms,
    is_active
FROM prod_category_cables
WHERE is_active = true

UNION ALL

SELECT 
    'prod_fiber_connectors' as table_name,
    id,
    part_number,
    brand,
    short_description,
    search_vector,
    computed_search_terms,
    is_active
FROM prod_fiber_connectors
WHERE is_active = true

UNION ALL

SELECT 
    'prod_jack_modules' as table_name,
    id,
    part_number,
    brand,
    short_description,
    search_vector,
    computed_search_terms,
    is_active
FROM prod_jack_modules
WHERE is_active = true

WITH DATA;

-- Create indexes on materialized view
CREATE INDEX IF NOT EXISTS idx_mv_search_vector ON mv_product_search USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_mv_part_number ON mv_product_search(part_number);
CREATE INDEX IF NOT EXISTS idx_mv_table ON mv_product_search(table_name);

-- =====================================================
-- STEP 8: Create simple search function
-- =====================================================
CREATE OR REPLACE FUNCTION search_all_products(
    p_search_term TEXT,
    p_limit INT DEFAULT 100
) RETURNS TABLE (
    table_name TEXT,
    id BIGINT,
    part_number VARCHAR,
    brand VARCHAR,
    description TEXT,
    rank REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        mv.table_name,
        mv.id,
        mv.part_number,
        mv.brand,
        mv.short_description,
        ts_rank(mv.search_vector, plainto_tsquery('english', p_search_term)) as rank
    FROM mv_product_search mv
    WHERE mv.search_vector @@ plainto_tsquery('english', p_search_term)
       OR mv.part_number ILIKE '%' || p_search_term || '%'
    ORDER BY 
        CASE WHEN mv.part_number = p_search_term THEN 0 ELSE 1 END,
        ts_rank(mv.search_vector, plainto_tsquery('english', p_search_term)) DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FINAL: Test and show status
-- =====================================================
SELECT 'Testing search system...' as status;

-- Test search
SELECT * FROM search_all_products('cat6 plenum', 5);

-- Show index status
SELECT 
    schemaname,
    tablename,
    indexname,
    pg_size_pretty(pg_relation_size(indexname::regclass)) as index_size
FROM pg_indexes
WHERE tablename LIKE 'prod_%'
AND indexname LIKE '%search%'
ORDER BY tablename, indexname;

-- Show search terms count
SELECT term_group, COUNT(*) as count 
FROM search_terms 
GROUP BY term_group;

SELECT 'Search system setup complete!' as status;

COMMIT;