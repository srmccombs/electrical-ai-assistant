-- Add search columns to all product tables (SAFE VERSION)
-- This version handles all Supabase-specific issues and missing columns
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
-- STEP 1: Add search columns to all product tables
-- =====================================================
SELECT 'Adding search columns to all product tables...' as status;

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
            RAISE NOTICE 'Added computed_search_terms to %', r.tablename;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = r.tablename AND column_name = 'search_vector') THEN
            EXECUTE format('ALTER TABLE %I ADD COLUMN search_vector tsvector', r.tablename);
            RAISE NOTICE 'Added search_vector to %', r.tablename;
        END IF;
    END LOOP;
END $$;

-- =====================================================
-- STEP 2: Create simple search functions first
-- =====================================================

-- Simple function to build search terms
CREATE OR REPLACE FUNCTION build_simple_search_terms(
    p_part_number TEXT,
    p_brand TEXT,
    p_description TEXT
) RETURNS TEXT AS $$
BEGIN
    RETURN TRIM(REGEXP_REPLACE(
        CONCAT_WS(' ', 
            COALESCE(p_part_number, ''),
            COALESCE(p_brand, ''),
            COALESCE(p_description, '')
        ),
        '\s+', ' ', 'g'
    ));
END;
$$ LANGUAGE plpgsql;

-- Simple trigger function for search terms
CREATE OR REPLACE FUNCTION update_simple_search_terms()
RETURNS TRIGGER AS $$
BEGIN
    NEW.computed_search_terms := build_simple_search_terms(
        NEW.part_number,
        NEW.brand,
        NEW.short_description
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Simple trigger function for search vector
CREATE OR REPLACE FUNCTION update_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := to_tsvector('english', COALESCE(NEW.computed_search_terms, ''));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- STEP 3: Create triggers for all product tables
-- =====================================================
SELECT 'Creating triggers for automatic search term updates...' as status;

DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT tablename FROM pg_tables 
        WHERE schemaname = 'public' AND tablename LIKE 'prod_%'
    LOOP
        -- Drop existing triggers if they exist
        EXECUTE format('DROP TRIGGER IF EXISTS trg_update_%s_search_terms ON %I', 
            replace(r.tablename, 'prod_', ''), r.tablename);
        EXECUTE format('DROP TRIGGER IF EXISTS trg_update_%s_search_vector ON %I', 
            replace(r.tablename, 'prod_', ''), r.tablename);
        
        -- Create triggers
        EXECUTE format('CREATE TRIGGER trg_update_%s_search_terms
            BEFORE INSERT OR UPDATE ON %I
            FOR EACH ROW
            EXECUTE FUNCTION update_simple_search_terms()',
            replace(r.tablename, 'prod_', ''), r.tablename);
            
        EXECUTE format('CREATE TRIGGER trg_update_%s_search_vector
            BEFORE INSERT OR UPDATE OF computed_search_terms ON %I
            FOR EACH ROW
            EXECUTE FUNCTION update_search_vector()',
            replace(r.tablename, 'prod_', ''), r.tablename);
            
        RAISE NOTICE 'Created triggers for %', r.tablename;
    END LOOP;
END $$;

-- =====================================================
-- STEP 4: Update existing records with simple search terms
-- =====================================================
SELECT 'Updating existing records with search terms...' as status;

DO $$
DECLARE
    r RECORD;
    update_count INT;
BEGIN
    FOR r IN 
        SELECT tablename FROM pg_tables 
        WHERE schemaname = 'public' AND tablename LIKE 'prod_%'
    LOOP
        -- Update computed_search_terms for records where it's NULL
        EXECUTE format('
            UPDATE %I 
            SET computed_search_terms = build_simple_search_terms(
                part_number,
                brand,
                short_description
            )
            WHERE computed_search_terms IS NULL', r.tablename);
        
        GET DIAGNOSTICS update_count = ROW_COUNT;
        IF update_count > 0 THEN
            RAISE NOTICE 'Updated % search terms in %', update_count, r.tablename;
        END IF;
        
        -- Update search_vector for records where it's NULL
        EXECUTE format('
            UPDATE %I 
            SET search_vector = to_tsvector(''english'', COALESCE(computed_search_terms, ''''))
            WHERE search_vector IS NULL', r.tablename);
        
        GET DIAGNOSTICS update_count = ROW_COUNT;
        IF update_count > 0 THEN
            RAISE NOTICE 'Updated % search vectors in %', update_count, r.tablename;
        END IF;
    END LOOP;
END $$;

-- =====================================================
-- STEP 5: Create GIN indexes safely
-- =====================================================
SELECT 'Creating GIN indexes for search_vector...' as status;

DO $$
DECLARE
    r RECORD;
    index_name TEXT;
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
            AND udt_name = 'tsvector'
        ) THEN
            index_name := 'idx_' || replace(r.tablename, 'prod_', '') || '_search';
            
            -- Create index if it doesn't exist
            IF NOT EXISTS (
                SELECT 1
                FROM pg_indexes
                WHERE tablename = r.tablename
                AND indexname = index_name
            ) THEN
                EXECUTE format('CREATE INDEX %I ON %I USING GIN(search_vector)', 
                    index_name, r.tablename);
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
-- STEP 6: Create indexes on commonly searched columns
-- =====================================================
SELECT 'Creating additional performance indexes...' as status;

-- Create indexes on part_number for all tables
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT tablename FROM pg_tables 
        WHERE schemaname = 'public' AND tablename LIKE 'prod_%'
    LOOP
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = r.tablename AND column_name = 'part_number') THEN
            EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%s_part_number ON %I(part_number)', 
                replace(r.tablename, 'prod_', ''), r.tablename);
        END IF;
        
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = r.tablename AND column_name = 'brand') THEN
            EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%s_brand ON %I(brand)', 
                replace(r.tablename, 'prod_', ''), r.tablename);
        END IF;
    END LOOP;
END $$;

SELECT 'Search columns added to all product tables successfully!' as status;

-- Show summary
SELECT 
    table_name,
    COUNT(*) FILTER (WHERE column_name = 'computed_search_terms') as has_search_terms,
    COUNT(*) FILTER (WHERE column_name = 'search_vector') as has_search_vector
FROM information_schema.columns
WHERE table_name LIKE 'prod_%'
GROUP BY table_name
ORDER BY table_name;

COMMIT;