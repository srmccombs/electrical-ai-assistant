-- Add search functionality to prod_category_cables table
-- This version uses the correct column names from your table

-- Check if computed_search_terms already exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'prod_category_cables' 
        AND column_name = 'computed_search_terms'
    ) THEN
        ALTER TABLE prod_category_cables ADD COLUMN computed_search_terms TEXT;
        RAISE NOTICE 'Added computed_search_terms column';
    ELSE
        RAISE NOTICE 'computed_search_terms column already exists';
    END IF;
END $$;

-- Create function to get cable search terms based on attributes
CREATE OR REPLACE FUNCTION get_cable_search_terms(
    p_category_rating VARCHAR,
    p_jacket_material VARCHAR,
    p_jacket_code VARCHAR,
    p_shielding_type VARCHAR,
    p_brand VARCHAR,
    p_part_number VARCHAR,
    p_description TEXT
) RETURNS TEXT AS $$
DECLARE
    search_terms TEXT := '';
    term_record RECORD;
BEGIN
    -- Add part number
    search_terms := p_part_number || ' ';
    
    -- Add description
    search_terms := search_terms || COALESCE(p_description, '') || ' ';
    
    -- Add brand
    search_terms := search_terms || COALESCE(p_brand, '') || ' ';
    
    -- Get all matching search terms from search_terms table
    FOR term_record IN 
        SELECT DISTINCT search_term 
        FROM search_terms 
        WHERE 'prod_category_cables' = ANY(applicable_tables)
        AND (
            -- Match category
            (p_category_rating = ANY(categories) OR cardinality(categories) = 0)
            -- Match jacket
            OR (p_jacket_code = ANY(jackets) OR cardinality(jackets) = 0)
            -- Match shielding
            OR (p_shielding_type = ANY(shielding) OR cardinality(shielding) = 0)
            -- Match brand
            OR (p_brand = ANY(brands) OR cardinality(brands) = 0)
        )
    LOOP
        search_terms := search_terms || term_record.search_term || ' ';
    END LOOP;
    
    -- Add direct attribute values
    search_terms := search_terms || COALESCE(p_category_rating, '') || ' ' || 
                   COALESCE(p_jacket_material, '') || ' ' || 
                   COALESCE(p_jacket_code, '') || ' ' || 
                   COALESCE(p_shielding_type, '') || ' ';
    
    RETURN TRIM(search_terms);
END;
$$ LANGUAGE plpgsql;

-- Update all existing cables with computed search terms
UPDATE prod_category_cables 
SET computed_search_terms = get_cable_search_terms(
    category_rating,
    jacket_material,
    jacket_code,
    "Shielding_Type",  -- Using quotes for case-sensitive column name
    brand,
    part_number,
    short_description
)
WHERE computed_search_terms IS NULL;

-- Create trigger to automatically update search terms on insert/update
CREATE OR REPLACE FUNCTION update_cable_search_terms()
RETURNS TRIGGER AS $$
BEGIN
    NEW.computed_search_terms := get_cable_search_terms(
        NEW.category_rating,
        NEW.jacket_material,
        NEW.jacket_code,
        NEW."Shielding_Type",  -- Using quotes for case-sensitive column name
        NEW.brand,
        NEW.part_number,
        NEW.short_description
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_update_cable_search_terms ON prod_category_cables;

-- Create the trigger
CREATE TRIGGER trigger_update_cable_search_terms
BEFORE INSERT OR UPDATE ON prod_category_cables
FOR EACH ROW
EXECUTE FUNCTION update_cable_search_terms();

-- Since search_vector column already exists, just update the trigger
CREATE OR REPLACE FUNCTION update_cable_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := to_tsvector('english', NEW.computed_search_terms);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate trigger
DROP TRIGGER IF EXISTS trigger_update_cable_search_vector ON prod_category_cables;

CREATE TRIGGER trigger_update_cable_search_vector
BEFORE INSERT OR UPDATE OF computed_search_terms ON prod_category_cables
FOR EACH ROW
EXECUTE FUNCTION update_cable_search_vector();

-- Update search vectors for all existing records
UPDATE prod_category_cables 
SET search_vector = to_tsvector('english', computed_search_terms)
WHERE search_vector IS NULL;

-- Create GIN index if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_prod_category_cables_search_vector 
ON prod_category_cables USING GIN (search_vector);

-- Add helpful comments
COMMENT ON COLUMN prod_category_cables.computed_search_terms IS 'Automatically computed search terms based on product attributes';

-- Verify the setup
SELECT 'Setup complete! Testing search...' as status;

-- Count how many records have search terms
SELECT COUNT(*) as total_records,
       COUNT(computed_search_terms) as records_with_search_terms,
       COUNT(search_vector) as records_with_search_vector
FROM prod_category_cables;

-- Test search
SELECT part_number, brand, category_rating, jacket_code, "Shielding_Type"
FROM prod_category_cables
WHERE search_vector @@ plainto_tsquery('english', 'cat5e plenum')
LIMIT 5;