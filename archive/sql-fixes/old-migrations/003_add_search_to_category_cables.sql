-- Add computed search terms column to category_cables table
ALTER TABLE prod_category_cables ADD COLUMN IF NOT EXISTS computed_search_terms TEXT;

-- Create function to get cable search terms based on attributes
CREATE OR REPLACE FUNCTION get_cable_search_terms(
    p_category VARCHAR,
    p_jacket_material VARCHAR,
    p_jacket_code VARCHAR,
    p_shielding VARCHAR,
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
            (p_category = ANY(categories) OR cardinality(categories) = 0)
            -- Match jacket
            OR (p_jacket_code = ANY(jackets) OR cardinality(jackets) = 0)
            -- Match shielding
            OR (p_shielding = ANY(shielding) OR cardinality(shielding) = 0)
            -- Match brand
            OR (p_brand = ANY(brands) OR cardinality(brands) = 0)
        )
    LOOP
        search_terms := search_terms || term_record.search_term || ' ';
    END LOOP;
    
    -- Add direct attribute values
    search_terms := search_terms || p_category || ' ' || p_jacket_material || ' ' || p_jacket_code || ' ' || p_shielding || ' ';
    
    RETURN TRIM(search_terms);
END;
$$ LANGUAGE plpgsql;

-- Update all existing cables with computed search terms
UPDATE prod_category_cables 
SET computed_search_terms = get_cable_search_terms(
    category_rating,
    jacket_material,
    jacket_code,
    Shielding_Type,
    brand,
    part_number,
    short_description
);

-- Create trigger to automatically update search terms on insert/update
CREATE OR REPLACE FUNCTION update_cable_search_terms()
RETURNS TRIGGER AS $$
BEGIN
    NEW.computed_search_terms := get_cable_search_terms(
        NEW.category_rating,
        NEW.jacket_material,
        NEW.jacket_code,
        NEW.Shielding_Type,
        NEW.brand,
        NEW.part_number,
        NEW.short_description
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_cable_search_terms
BEFORE INSERT OR UPDATE ON prod_category_cables
FOR EACH ROW
EXECUTE FUNCTION update_cable_search_terms();

-- Create full-text search column and index
ALTER TABLE prod_category_cables ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Update search vectors for all existing records
UPDATE prod_category_cables 
SET search_vector = to_tsvector('english', computed_search_terms);

-- Create trigger to update search vector
CREATE OR REPLACE FUNCTION update_cable_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := to_tsvector('english', NEW.computed_search_terms);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_cable_search_vector
BEFORE INSERT OR UPDATE OF computed_search_terms ON prod_category_cables
FOR EACH ROW
EXECUTE FUNCTION update_cable_search_vector();

-- Create GIN index for fast full-text search
CREATE INDEX IF NOT EXISTS idx_category_cables_search_vector 
ON prod_category_cables USING GIN (search_vector);

-- Add helpful comments
COMMENT ON COLUMN category_cables.computed_search_terms IS 'Automatically computed search terms based on product attributes';
COMMENT ON COLUMN category_cables.search_vector IS 'Full-text search vector for fast searching';