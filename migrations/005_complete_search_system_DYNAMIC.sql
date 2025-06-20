-- Complete Search System Setup (DYNAMIC VERSION)
-- This version dynamically checks which columns exist in each table

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
-- STEP 2: Create dynamic search update function
-- =====================================================
CREATE OR REPLACE FUNCTION update_product_search_terms()
RETURNS TRIGGER AS $$
DECLARE
    search_parts TEXT[];
BEGIN
    -- Always include these core fields
    search_parts := ARRAY[
        NEW.part_number,
        NEW.brand,
        NEW.short_description
    ];
    
    -- Add optional fields if they exist
    IF TG_TABLE_NAME = 'prod_category_cables' THEN
        search_parts := search_parts || ARRAY[
            COALESCE(NEW.product_line, ''),
            COALESCE(NEW.category_rating, ''),
            COALESCE(NEW.jacket_code, ''),
            COALESCE(NEW.jacket_color, ''),
            COALESCE(NEW."Shielding_Type", '')
        ];
    ELSIF TG_TABLE_NAME = 'prod_fiber_cables' THEN
        search_parts := search_parts || ARRAY[
            COALESCE(NEW.product_type, ''),
            COALESCE(NEW.fiber_type, ''),
            COALESCE(NEW.fiber_count::TEXT, '')
        ];
    ELSIF TG_TABLE_NAME = 'prod_fiber_connectors' THEN
        search_parts := search_parts || ARRAY[
            COALESCE(NEW.product_line, ''),
            COALESCE(NEW.connector_type, ''),
            COALESCE(NEW.fiber_category, '')
        ];
    END IF;
    
    -- Add common_terms if it exists
    IF NEW.common_terms IS NOT NULL THEN
        search_parts := search_parts || NEW.common_terms;
    END IF;
    
    -- Build search terms
    NEW.computed_search_terms := array_to_string(search_parts, ' ');
    
    -- Update search vector
    NEW.search_vector := to_tsvector('english', COALESCE(NEW.computed_search_terms, ''));
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- STEP 3: Update existing records dynamically
-- =====================================================
SELECT 'Updating search terms for existing products...' as status;

DO $$
DECLARE
    r RECORD;
    col_list TEXT;
    update_sql TEXT;
    update_count INT;
BEGIN
    FOR r IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename LIKE 'prod_%'
    LOOP
        -- Build column list dynamically
        SELECT string_agg(
            CASE column_name
                WHEN 'part_number' THEN 'part_number'
                WHEN 'brand' THEN 'brand'
                WHEN 'short_description' THEN 'short_description'
                WHEN 'product_line' THEN 'COALESCE(product_line, '''')'
                WHEN 'product_type' THEN 'COALESCE(product_type, '''')'
                WHEN 'category_rating' THEN 'COALESCE(category_rating, '''')'
                WHEN 'common_terms' THEN 'COALESCE(common_terms, '''')'
                WHEN 'connector_type' THEN 'COALESCE(connector_type, '''')'
                WHEN 'fiber_type' THEN 'COALESCE(fiber_type, '''')'
                WHEN 'fiber_category' THEN 'COALESCE(fiber_category, '''')'
                ELSE NULL
            END, ', '
        ) INTO col_list
        FROM information_schema.columns
        WHERE table_name = r.tablename
        AND column_name IN ('part_number', 'brand', 'short_description', 'product_line', 
                           'product_type', 'category_rating', 'common_terms', 'connector_type',
                           'fiber_type', 'fiber_category');
        
        IF col_list IS NOT NULL THEN
            -- Build and execute update
            update_sql := format('
                UPDATE %I 
                SET computed_search_terms = CONCAT_WS('' '', %s)
                WHERE computed_search_terms IS NULL', r.tablename, col_list);
            
            EXECUTE update_sql;
            GET DIAGNOSTICS update_count = ROW_COUNT;
            
            IF update_count > 0 THEN
                RAISE NOTICE 'Updated % rows in % with columns: %', update_count, r.tablename, col_list;
            END IF;
            
            -- Update search vector
            EXECUTE format('
                UPDATE %I 
                SET search_vector = to_tsvector(''english'', COALESCE(computed_search_terms, ''''))
                WHERE computed_search_terms IS NOT NULL', r.tablename);
        ELSE
            RAISE NOTICE 'No searchable columns found in %', r.tablename;
        END IF;
    END LOOP;
END $$;

-- =====================================================
-- STEP 4: Create report of missing columns
-- =====================================================
CREATE TEMP TABLE missing_columns_report AS
SELECT 
    t.tablename,
    CASE WHEN c1.column_name IS NULL THEN 'product_line' ELSE NULL END as missing_product_line,
    CASE WHEN c2.column_name IS NULL THEN 'common_terms' ELSE NULL END as missing_common_terms,
    CASE WHEN c3.column_name IS NULL THEN 'category' ELSE NULL END as missing_category,
    CASE WHEN c4.column_name IS NULL THEN 'brand_normalized' ELSE NULL END as missing_brand_normalized
FROM pg_tables t
LEFT JOIN information_schema.columns c1 
    ON t.tablename = c1.table_name AND c1.column_name = 'product_line'
LEFT JOIN information_schema.columns c2 
    ON t.tablename = c2.table_name AND c2.column_name = 'common_terms'
LEFT JOIN information_schema.columns c3 
    ON t.tablename = c3.table_name AND c3.column_name = 'category'
LEFT JOIN information_schema.columns c4 
    ON t.tablename = c4.table_name AND c4.column_name = 'brand_normalized'
WHERE t.schemaname = 'public' 
AND t.tablename LIKE 'prod_%';

-- Add to migration notes
INSERT INTO migration_notes (note_type, note_text)
SELECT 
    'TODO',
    'Table ' || tablename || ' is missing columns: ' || 
    COALESCE(missing_product_line || ', ', '') ||
    COALESCE(missing_common_terms || ', ', '') ||
    COALESCE(missing_category || ', ', '') ||
    COALESCE(missing_brand_normalized, '')
FROM missing_columns_report
WHERE missing_product_line IS NOT NULL 
   OR missing_common_terms IS NOT NULL 
   OR missing_category IS NOT NULL
   OR missing_brand_normalized IS NOT NULL;

-- =====================================================
-- STEP 5: Create indexes safely
-- =====================================================
SELECT 'Creating indexes...' as status;

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
        -- Create search vector index
        BEGIN
            EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%s_search_vector ON %I USING GIN (search_vector)', 
                          r.tablename, r.tablename);
            RAISE NOTICE 'Created search index on %', r.tablename;
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE 'Could not create search index on %: %', r.tablename, SQLERRM;
        END;
        
        -- Create other indexes if columns exist
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = r.tablename AND column_name = 'part_number') THEN
            EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%s_part_number ON %I (part_number)', r.tablename, r.tablename);
        END IF;
        
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = r.tablename AND column_name = 'brand') THEN
            EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%s_brand ON %I (brand)', r.tablename, r.tablename);
        END IF;
    END LOOP;
END $$;

-- =====================================================
-- STEP 6: Add triggers
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
        EXECUTE format('DROP TRIGGER IF EXISTS trigger_update_search_terms ON %I', r.tablename);
        EXECUTE format('
            CREATE TRIGGER trigger_update_search_terms
            BEFORE INSERT OR UPDATE ON %I
            FOR EACH ROW
            EXECUTE FUNCTION update_product_search_terms()', r.tablename);
    END LOOP;
END $$;

-- =====================================================
-- STEP 7: Show results
-- =====================================================
SELECT 'Missing columns report:' as status;
SELECT * FROM missing_columns_report 
WHERE missing_product_line IS NOT NULL 
   OR missing_common_terms IS NOT NULL 
   OR missing_category IS NOT NULL
   OR missing_brand_normalized IS NOT NULL;

SELECT 'Search terms update summary:' as status;
SELECT 
    tablename,
    COUNT(*) as total_rows,
    COUNT(computed_search_terms) as rows_with_search_terms,
    COUNT(search_vector) as rows_with_search_vector
FROM (
    SELECT 'prod_category_cables' as tablename, computed_search_terms, search_vector FROM prod_category_cables
    UNION ALL
    SELECT 'prod_fiber_connectors', computed_search_terms, search_vector FROM prod_fiber_connectors
    UNION ALL
    SELECT 'prod_fiber_cables', computed_search_terms, search_vector FROM prod_fiber_cables
    -- Add other tables as needed
) t
GROUP BY tablename;

-- Test search
SELECT 'Testing search on prod_category_cables...' as status;
SELECT 
    part_number,
    brand,
    LEFT(computed_search_terms, 100) as search_terms_preview
FROM prod_category_cables
WHERE search_vector @@ plainto_tsquery('english', 'cable')
LIMIT 5;

SELECT 'Search system setup complete!' as status;

-- Show TODOs
SELECT 'TODO items added to migration_notes:' as status;
SELECT note_text 
FROM migration_notes 
WHERE note_type = 'TODO' 
  AND created_at >= CURRENT_TIMESTAMP - INTERVAL '5 minutes';

COMMIT;