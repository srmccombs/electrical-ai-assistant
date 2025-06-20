-- ================================================================
-- PROPER MIGRATION STEP 1: Enhance search_terms table structure
-- FIXED VERSION - Adds is_active column first
-- ================================================================

BEGIN;

-- 1. First, let's see what we're working with
SELECT '=== CURRENT SEARCH_TERMS STRUCTURE ===' as step;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'search_terms'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Add the is_active column FIRST (if it doesn't exist)
ALTER TABLE search_terms ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
COMMENT ON COLUMN search_terms.is_active IS 'Whether this search term mapping is currently active';

-- 3. Add the other missing intelligent columns
ALTER TABLE search_terms ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 100;
COMMENT ON COLUMN search_terms.priority IS 'Search priority - higher numbers are checked first (1000=redirects, 800=exact, 500=fuzzy)';

ALTER TABLE search_terms ADD COLUMN IF NOT EXISTS context VARCHAR(50);
COMMENT ON COLUMN search_terms.context IS 'Context type: category, jacket, brand, color, shielding, redirect, etc.';

ALTER TABLE search_terms ADD COLUMN IF NOT EXISTS redirect_to VARCHAR(255);
COMMENT ON COLUMN search_terms.redirect_to IS 'Redirect this search to another term (e.g., cat5 -> cat5e)';

ALTER TABLE search_terms ADD COLUMN IF NOT EXISTS detection_pattern VARCHAR(500);
COMMENT ON COLUMN search_terms.detection_pattern IS 'Regex pattern for advanced detection';

ALTER TABLE search_terms ADD COLUMN IF NOT EXISTS conversion_factor NUMERIC(10,2);
COMMENT ON COLUMN search_terms.conversion_factor IS 'Unit conversion factor (e.g., box = 1000 for feet)';

ALTER TABLE search_terms ADD COLUMN IF NOT EXISTS notes TEXT;
COMMENT ON COLUMN search_terms.notes IS 'Internal notes about this mapping';

-- 4. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_search_terms_priority ON search_terms(priority DESC);
CREATE INDEX IF NOT EXISTS idx_search_terms_context ON search_terms(context);
CREATE INDEX IF NOT EXISTS idx_search_terms_redirect ON search_terms(redirect_to) WHERE redirect_to IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_search_terms_active_priority ON search_terms(is_active, priority DESC) WHERE is_active = true;

-- 5. Update existing mappings with proper context and priority
-- Category mappings get high priority
UPDATE search_terms 
SET context = 'category',
    priority = 800,
    is_active = true
WHERE term_group = 'category_rating'
  AND context IS NULL;

-- Jacket mappings
UPDATE search_terms 
SET context = 'jacket',
    priority = 700,
    is_active = true
WHERE term_group IN ('jacket_rating', 'jacket_type', 'jacket')
  AND context IS NULL;

-- Brand mappings
UPDATE search_terms 
SET context = 'brand',
    priority = 600,
    is_active = true
WHERE term_group = 'brand'
  AND context IS NULL;

-- Ensure all rows have is_active set
UPDATE search_terms
SET is_active = true
WHERE is_active IS NULL;

-- 6. Verify the enhancement
SELECT '=== ENHANCED STRUCTURE ===' as step;
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'search_terms'
AND table_schema = 'public'
AND column_name IN ('is_active', 'priority', 'context', 'redirect_to', 'detection_pattern', 'conversion_factor')
ORDER BY column_name;

-- 7. Show sample of updated data
SELECT '=== SAMPLE UPDATED DATA ===' as step;
SELECT term_group, search_term, context, priority, is_active
FROM search_terms
WHERE context IS NOT NULL
LIMIT 10;

-- 8. Count active terms
SELECT '=== ACTIVE TERMS COUNT ===' as step;
SELECT COUNT(*) as total_active_terms
FROM search_terms
WHERE is_active = true;

COMMIT;

-- Summary
SELECT '✅ Step 1 Complete: Table structure enhanced!' as status,
       'Run PROPER_MIGRATION_STEP_2.sql next' as next_step;