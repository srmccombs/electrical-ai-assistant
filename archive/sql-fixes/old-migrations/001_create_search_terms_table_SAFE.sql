-- Create search_terms table (SAFE VERSION - checks if exists)

-- Check if table exists first
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'search_terms') THEN
        -- Create the search_terms table
        CREATE TABLE search_terms (
            id SERIAL PRIMARY KEY,
            term_group VARCHAR(50) NOT NULL,
            search_term VARCHAR(100) NOT NULL,
            categories TEXT[],
            jackets TEXT[],
            shielding TEXT[],
            brands TEXT[],
            applicable_tables TEXT[] NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        RAISE NOTICE 'Created table: search_terms';
    ELSE
        RAISE NOTICE 'Table search_terms already exists - skipping creation';
    END IF;
END $$;

-- Create indexes only if they don't exist
CREATE INDEX IF NOT EXISTS idx_search_terms_term ON search_terms(search_term);
CREATE INDEX IF NOT EXISTS idx_search_terms_group ON search_terms(term_group);
CREATE INDEX IF NOT EXISTS idx_search_terms_tables ON search_terms USING GIN(applicable_tables);

-- Create or replace the update trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop and recreate trigger to ensure it's current
DROP TRIGGER IF EXISTS update_search_terms_updated_at ON search_terms;
CREATE TRIGGER update_search_terms_updated_at 
    BEFORE UPDATE ON search_terms 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments
COMMENT ON TABLE search_terms IS 'Centralized search term mappings for all product tables';
COMMENT ON COLUMN search_terms.term_group IS 'Logical grouping of related terms (e.g., category_ratings, jacket_types)';
COMMENT ON COLUMN search_terms.search_term IS 'The actual search keyword users might type';
COMMENT ON COLUMN search_terms.categories IS 'Array of category values this term maps to';
COMMENT ON COLUMN search_terms.jackets IS 'Array of jacket types this term maps to';
COMMENT ON COLUMN search_terms.shielding IS 'Array of shielding types this term maps to';
COMMENT ON COLUMN search_terms.brands IS 'Array of brand names this term maps to';
COMMENT ON COLUMN search_terms.applicable_tables IS 'Which product tables this search term applies to';

-- Show current status
SELECT 'Search terms table ready. Current row count:' as status, COUNT(*) as count FROM search_terms;