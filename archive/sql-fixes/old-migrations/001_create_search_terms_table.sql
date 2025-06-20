-- Create the search_terms table for database-driven search
-- This table stores all search keyword mappings for products

CREATE TABLE IF NOT EXISTS search_terms (
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

-- Create indexes for fast lookups
CREATE INDEX idx_search_terms_term ON search_terms(search_term);
CREATE INDEX idx_search_terms_group ON search_terms(term_group);
CREATE INDEX idx_search_terms_tables ON search_terms USING GIN(applicable_tables);

-- Create update trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_search_terms_updated_at BEFORE UPDATE
    ON search_terms FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE search_terms IS 'Centralized search term mappings for all product tables';
COMMENT ON COLUMN search_terms.term_group IS 'Logical grouping of related terms (e.g., category_ratings, jacket_types)';
COMMENT ON COLUMN search_terms.search_term IS 'The actual search keyword users might type';
COMMENT ON COLUMN search_terms.categories IS 'Array of category values this term maps to';
COMMENT ON COLUMN search_terms.jackets IS 'Array of jacket types this term maps to';
COMMENT ON COLUMN search_terms.shielding IS 'Array of shielding types this term maps to';
COMMENT ON COLUMN search_terms.brands IS 'Array of brand names this term maps to';
COMMENT ON COLUMN search_terms.applicable_tables IS 'Which product tables this search term applies to';