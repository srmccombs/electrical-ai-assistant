-- Migration 021: Enhance search_terms table to support all intelligence types
-- This adds missing columns and functionality to the search_terms table

BEGIN;

-- Add new columns to search_terms table
ALTER TABLE search_terms ADD COLUMN IF NOT EXISTS detection_pattern VARCHAR(500);
ALTER TABLE search_terms ADD COLUMN IF NOT EXISTS priority INT DEFAULT 100;
ALTER TABLE search_terms ADD COLUMN IF NOT EXISTS redirect_to VARCHAR(100);
ALTER TABLE search_terms ADD COLUMN IF NOT EXISTS validation_rules JSONB;
ALTER TABLE search_terms ADD COLUMN IF NOT EXISTS equivalencies TEXT[];
ALTER TABLE search_terms ADD COLUMN IF NOT EXISTS conversion_rules JSONB;
ALTER TABLE search_terms ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE search_terms ADD COLUMN IF NOT EXISTS context VARCHAR(50);

-- Add indexes for new columns
CREATE INDEX IF NOT EXISTS idx_search_terms_priority ON search_terms(priority DESC);
CREATE INDEX IF NOT EXISTS idx_search_terms_active ON search_terms(is_active);
CREATE INDEX IF NOT EXISTS idx_search_terms_context ON search_terms(context);
CREATE INDEX IF NOT EXISTS idx_search_terms_redirect ON search_terms(redirect_to) WHERE redirect_to IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN search_terms.detection_pattern IS 'Regex pattern for advanced detection logic';
COMMENT ON COLUMN search_terms.priority IS 'Order of evaluation (higher = first)';
COMMENT ON COLUMN search_terms.redirect_to IS 'Term to redirect this search to';
COMMENT ON COLUMN search_terms.validation_rules IS 'JSON rules for query validation';
COMMENT ON COLUMN search_terms.equivalencies IS 'Array of equivalent terms';
COMMENT ON COLUMN search_terms.conversion_rules IS 'JSON rules for unit conversions';
COMMENT ON COLUMN search_terms.context IS 'Context for the term (jacket, brand, color, etc)';

-- Create a unique constraint to prevent duplicates
ALTER TABLE search_terms ADD CONSTRAINT unique_search_term_context 
    UNIQUE (search_term, term_group, context) 
    WHERE context IS NOT NULL;

COMMIT;