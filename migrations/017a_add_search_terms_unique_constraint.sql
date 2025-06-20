-- Add unique constraint to search_terms table
-- This allows us to use ON CONFLICT in subsequent migrations

BEGIN;

-- Add unique constraint on (term_group, search_term)
ALTER TABLE search_terms 
ADD CONSTRAINT search_terms_unique_term 
UNIQUE (term_group, search_term);

-- Verify constraint was added
SELECT 
    'Unique constraint added successfully' as status,
    conname as constraint_name
FROM pg_constraint 
WHERE conrelid = 'search_terms'::regclass 
AND conname = 'search_terms_unique_term';

COMMIT;