-- ================================================================
-- QUICK INTELLIGENCE MIGRATION
-- Moves the most critical search intelligence to database
-- Run this for immediate improvements
-- ================================================================

BEGIN;

-- 1. Add essential columns to search_terms if they don't exist
ALTER TABLE search_terms ADD COLUMN IF NOT EXISTS priority INT DEFAULT 100;
ALTER TABLE search_terms ADD COLUMN IF NOT EXISTS redirect_to VARCHAR(100);
ALTER TABLE search_terms ADD COLUMN IF NOT EXISTS context VARCHAR(50);

-- 2. Add critical business rule redirects
INSERT INTO search_terms (term_group, search_term, redirect_to, priority, is_active)
VALUES 
    -- Cat5 → Cat5e redirects
    ('redirect', 'cat5', 'cat5e', 1000, true),
    ('redirect', 'cat 5', 'cat5e', 1000, true),
    ('redirect', 'category 5', 'category 5e', 1000, true),
    ('redirect', 'cat5 cable', 'cat5e cable', 1000, true),
    
    -- SMB redirects
    ('redirect', 'smb', 'surface mount box', 1000, true),
    ('redirect', 's.m.b', 'surface mount box', 1000, true),
    ('redirect', 's m b', 'surface mount box', 1000, true),
    
    -- Common misspellings
    ('redirect', 'cat6e', 'cat6', 900, true),
    ('redirect', 'cat 6e', 'cat6', 900, true),
    ('redirect', 'catagory', 'category', 900, true)
ON CONFLICT DO NOTHING;

-- 3. Add jacket type mappings
INSERT INTO search_terms (term_group, search_term, jacket_types, context, priority, is_active)
VALUES 
    -- Plenum variations
    ('jacket', 'plenum', ARRAY['Plenum']::text[], 'jacket', 800, true),
    ('jacket', 'cmp', ARRAY['Plenum']::text[], 'jacket', 800, true),
    ('jacket', 'plenum rated', ARRAY['Plenum']::text[], 'jacket', 800, true),
    
    -- Riser variations
    ('jacket', 'riser', ARRAY['Riser']::text[], 'jacket', 800, true),
    ('jacket', 'cmr', ARRAY['Riser']::text[], 'jacket', 800, true),
    ('jacket', 'non-plenum', ARRAY['Riser']::text[], 'jacket', 800, true),
    ('jacket', 'non plenum', ARRAY['Riser']::text[], 'jacket', 800, true),
    ('jacket', 'pvc', ARRAY['Riser']::text[], 'jacket', 800, true),
    
    -- LSZH variations
    ('jacket', 'lszh', ARRAY['LSZH']::text[], 'jacket', 800, true),
    ('jacket', 'low smoke', ARRAY['LSZH']::text[], 'jacket', 800, true),
    ('jacket', 'zero halogen', ARRAY['LSZH']::text[], 'jacket', 800, true)
ON CONFLICT DO NOTHING;

-- 4. Add shielding type mappings
INSERT INTO search_terms (term_group, search_term, shielding_types, context, priority, is_active)
VALUES 
    -- Shielded variations
    ('shielding', 'shielded', ARRAY['STP', 'SFTP']::text[], 'shielding', 700, true),
    ('shielding', 'stp', ARRAY['STP']::text[], 'shielding', 700, true),
    ('shielding', 'sftp', ARRAY['SFTP']::text[], 'shielding', 700, true),
    ('shielding', 's/ftp', ARRAY['SFTP']::text[], 'shielding', 700, true),
    
    -- Unshielded variations
    ('shielding', 'unshielded', ARRAY['UTP']::text[], 'shielding', 700, true),
    ('shielding', 'utp', ARRAY['UTP']::text[], 'shielding', 700, true),
    ('shielding', 'u/utp', ARRAY['UTP']::text[], 'shielding', 700, true)
ON CONFLICT DO NOTHING;

-- 5. Add brand synonyms
INSERT INTO search_terms (term_group, search_term, brands, context, priority, is_active)
VALUES 
    -- Panduit variations
    ('brand', 'pan', ARRAY['Panduit']::text[], 'brand', 600, true),
    ('brand', 'panduit', ARRAY['Panduit']::text[], 'brand', 600, true),
    
    -- Corning variations
    ('brand', 'corning', ARRAY['Corning Cable Systems']::text[], 'brand', 600, true),
    ('brand', 'ccs', ARRAY['Corning Cable Systems']::text[], 'brand', 600, true),
    ('brand', 'ccg', ARRAY['Corning Cable Systems']::text[], 'brand', 600, true),
    
    -- General Cable variations
    ('brand', 'general', ARRAY['General Cable']::text[], 'brand', 600, true),
    ('brand', 'gc', ARRAY['General Cable']::text[], 'brand', 600, true)
ON CONFLICT DO NOTHING;

-- 6. Add color mappings
INSERT INTO search_terms (term_group, search_term, context, priority, is_active)
VALUES 
    -- Color variations (these would map to actual color fields in a full implementation)
    ('color', 'white', 'color', 500, true),
    ('color', 'wh', 'color', 500, true),
    ('color', 'black', 'color', 500, true),
    ('color', 'bl', 'color', 500, true),
    ('color', 'blue', 'color', 500, true),
    ('color', 'red', 'color', 500, true),
    ('color', 'yellow', 'color', 500, true),
    ('color', 'yl', 'color', 500, true),
    ('color', 'orange', 'color', 500, true),
    ('color', 'or', 'color', 500, true),
    ('color', 'green', 'color', 500, true),
    ('color', 'gr', 'color', 500, true),
    ('color', 'gray', 'color', 500, true),
    ('color', 'grey', 'color', 500, true)
ON CONFLICT DO NOTHING;

-- 7. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_search_terms_priority ON search_terms(priority DESC);
CREATE INDEX IF NOT EXISTS idx_search_terms_context ON search_terms(context);
CREATE INDEX IF NOT EXISTS idx_search_terms_redirect ON search_terms(redirect_to) WHERE redirect_to IS NOT NULL;

-- 8. Verify migration
SELECT 'Total search terms:' as metric, COUNT(*) as value FROM search_terms
UNION ALL
SELECT 'Redirects added:', COUNT(*) FROM search_terms WHERE redirect_to IS NOT NULL
UNION ALL
SELECT 'Jacket mappings:', COUNT(*) FROM search_terms WHERE context = 'jacket'
UNION ALL
SELECT 'Brand mappings:', COUNT(*) FROM search_terms WHERE context = 'brand'
UNION ALL
SELECT 'Color mappings:', COUNT(*) FROM search_terms WHERE context = 'color';

COMMIT;

-- Summary message
SELECT '✅ Quick Intelligence Migration Complete!' as status,
       'Key redirects, jacket types, brands, and colors now in database' as details;