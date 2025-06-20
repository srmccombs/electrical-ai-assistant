-- SIMPLE FINAL Search Setup - Just get it working!

BEGIN;

-- =====================================================
-- STEP 1: Add search columns (skip if exists)
-- =====================================================
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT tablename FROM pg_tables 
        WHERE schemaname = 'public' AND tablename LIKE 'prod_%'
    LOOP
        -- Add columns if missing
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = r.tablename AND column_name = 'computed_search_terms') THEN
            EXECUTE format('ALTER TABLE %I ADD COLUMN computed_search_terms TEXT', r.tablename);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = r.tablename AND column_name = 'search_vector') THEN
            EXECUTE format('ALTER TABLE %I ADD COLUMN search_vector tsvector', r.tablename);
        END IF;
    END LOOP;
END $$;

-- =====================================================
-- STEP 2: Simple update for each table
-- =====================================================

-- Update prod_category_cables
UPDATE prod_category_cables 
SET computed_search_terms = CONCAT_WS(' ', 
    part_number, 
    brand, 
    short_description,
    category_rating,
    jacket_code,
    jacket_color
)
WHERE computed_search_terms IS NULL;

UPDATE prod_category_cables 
SET search_vector = to_tsvector('english', COALESCE(computed_search_terms, ''))
WHERE search_vector IS NULL;

-- Update prod_fiber_connectors  
UPDATE prod_fiber_connectors 
SET computed_search_terms = CONCAT_WS(' ',
    part_number,
    brand, 
    short_description
)
WHERE computed_search_terms IS NULL;

UPDATE prod_fiber_connectors 
SET search_vector = to_tsvector('english', COALESCE(computed_search_terms, ''))
WHERE search_vector IS NULL;

-- Update other tables with just basic fields
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT tablename FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename LIKE 'prod_%'
        AND tablename NOT IN ('prod_category_cables', 'prod_fiber_connectors')
    LOOP
        -- Just use basic fields that every table should have
        EXECUTE format('
            UPDATE %I 
            SET computed_search_terms = CONCAT_WS('' '', part_number, brand, short_description)
            WHERE computed_search_terms IS NULL', r.tablename);
            
        EXECUTE format('
            UPDATE %I 
            SET search_vector = to_tsvector(''english'', COALESCE(computed_search_terms, ''''))
            WHERE search_vector IS NULL', r.tablename);
    END LOOP;
END $$;

-- =====================================================
-- STEP 3: Create indexes
-- =====================================================
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT tablename FROM pg_tables 
        WHERE schemaname = 'public' AND tablename LIKE 'prod_%'
    LOOP
        BEGIN
            EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%s_search ON %I USING GIN (search_vector)', 
                          replace(r.tablename, 'prod_', ''), r.tablename);
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Index exists on %', r.tablename;
        END;
    END LOOP;
END $$;

-- =====================================================
-- STEP 4: Test it works
-- =====================================================
SELECT 'Testing search...' as status;
SELECT part_number, brand, LEFT(short_description, 50) as description
FROM prod_category_cables
WHERE search_vector @@ plainto_tsquery('english', 'cat6')
LIMIT 5;

SELECT 'Setup complete!' as status;

COMMIT;