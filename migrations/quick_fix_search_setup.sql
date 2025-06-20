-- Quick fix to bypass the mayer_stock trigger issue
-- This disables the trigger temporarily so we can set up search

-- Disable the problematic trigger
ALTER TABLE prod_category_cables DISABLE TRIGGER ALL;

-- Now run the search setup
-- Add computed_search_terms column if it doesn't exist
ALTER TABLE prod_category_cables ADD COLUMN IF NOT EXISTS computed_search_terms TEXT;

-- Create simple function to build search terms
CREATE OR REPLACE FUNCTION build_cable_search_terms()
RETURNS TRIGGER AS $$
BEGIN
    -- Build search terms from product attributes
    NEW.computed_search_terms := CONCAT_WS(' ',
        NEW.part_number,
        NEW.brand,
        NEW.short_description,
        NEW.category_rating,
        NEW.jacket_material,
        NEW.jacket_code,
        NEW."Shielding_Type",
        NEW.jacket_color,
        NEW.product_line,
        -- Add common variations
        CASE 
            WHEN NEW.category_rating LIKE '%5e%' THEN 'cat5e cat5 cat 5e category5e'
            WHEN NEW.category_rating LIKE '%6a%' THEN 'cat6a cat6 a category6a'
            WHEN NEW.category_rating LIKE '%6%' THEN 'cat6 cat 6 category6'
        END,
        CASE 
            WHEN NEW.jacket_code = 'CMP' THEN 'plenum cmp fire-rated'
            WHEN NEW.jacket_code = 'CMR' THEN 'riser cmr vertical'
        END
    );
    
    -- Update search vector
    NEW.search_vector := to_tsvector('english', NEW.computed_search_terms);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for search terms
DROP TRIGGER IF EXISTS trigger_build_search_terms ON prod_category_cables;
CREATE TRIGGER trigger_build_search_terms
BEFORE INSERT OR UPDATE ON prod_category_cables
FOR EACH ROW
EXECUTE FUNCTION build_cable_search_terms();

-- Update existing records
UPDATE prod_category_cables
SET computed_search_terms = CONCAT_WS(' ',
    part_number,
    brand,
    short_description,
    category_rating,
    jacket_material,
    jacket_code,
    "Shielding_Type",
    jacket_color,
    product_line
)
WHERE computed_search_terms IS NULL;

-- Update search vectors
UPDATE prod_category_cables
SET search_vector = to_tsvector('english', computed_search_terms)
WHERE search_vector IS NULL 
   OR computed_search_terms IS NOT NULL;

-- Re-enable triggers
ALTER TABLE prod_category_cables ENABLE TRIGGER ALL;

-- Create index if needed
CREATE INDEX IF NOT EXISTS idx_prod_category_cables_search_vector 
ON prod_category_cables USING GIN (search_vector);

-- Test the search
SELECT 'Testing search for "cat5e plenum"...' as status;

SELECT 
    part_number, 
    brand, 
    category_rating, 
    jacket_code,
    LEFT(short_description, 50) as description
FROM prod_category_cables
WHERE search_vector @@ plainto_tsquery('english', 'cat5e plenum')
LIMIT 5;

SELECT 'Search setup complete!' as status;