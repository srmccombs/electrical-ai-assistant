-- ================================================================
-- PROPER MIGRATION STEP 1B: Add Missing Strategic Columns
-- These columns will make search more powerful and maintainable
-- ================================================================

BEGIN;

-- 1. Check what columns we currently have
SELECT '=== CURRENT COLUMNS ===' as step;
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'search_terms'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Add strategic columns that are missing

-- Add jacket_types array column (for better jacket mapping)
ALTER TABLE search_terms ADD COLUMN IF NOT EXISTS jacket_types TEXT[];
COMMENT ON COLUMN search_terms.jacket_types IS 'Array of jacket types this term maps to (Plenum, Riser, LSZH, etc)';

-- Add shielding_types array column (for better shielding mapping)
ALTER TABLE search_terms ADD COLUMN IF NOT EXISTS shielding_types TEXT[];
COMMENT ON COLUMN search_terms.shielding_types IS 'Array of shielding types this term maps to (UTP, STP, SFTP, etc)';

-- Add fiber_types array column (for fiber products)
ALTER TABLE search_terms ADD COLUMN IF NOT EXISTS fiber_types TEXT[];
COMMENT ON COLUMN search_terms.fiber_types IS 'Array of fiber types this term maps to (OM1, OM2, OM3, OM4, OS1, OS2)';

-- Add connector_types array column (for connectors)
ALTER TABLE search_terms ADD COLUMN IF NOT EXISTS connector_types TEXT[];
COMMENT ON COLUMN search_terms.connector_types IS 'Array of connector types this term maps to (LC, SC, ST, FC, etc)';

-- Add validation_pattern column (for complex validation)
ALTER TABLE search_terms ADD COLUMN IF NOT EXISTS validation_pattern VARCHAR(500);
COMMENT ON COLUMN search_terms.validation_pattern IS 'Regex pattern for validating this search term';

-- Add usage_count column (for analytics)
ALTER TABLE search_terms ADD COLUMN IF NOT EXISTS usage_count INTEGER DEFAULT 0;
COMMENT ON COLUMN search_terms.usage_count IS 'Number of times this search term has been used';

-- Add last_used column (for analytics)
ALTER TABLE search_terms ADD COLUMN IF NOT EXISTS last_used TIMESTAMP;
COMMENT ON COLUMN search_terms.last_used IS 'Last time this search term was used in a search';

-- Add created_by column (for audit)
ALTER TABLE search_terms ADD COLUMN IF NOT EXISTS created_by VARCHAR(100);
COMMENT ON COLUMN search_terms.created_by IS 'Who created this search term mapping';

-- Add is_system column (to protect core mappings)
ALTER TABLE search_terms ADD COLUMN IF NOT EXISTS is_system BOOLEAN DEFAULT false;
COMMENT ON COLUMN search_terms.is_system IS 'System mappings that should not be modified by users';

-- 3. Migrate existing data to new columns where appropriate

-- Migrate jackets to jacket_types (keeping both for backward compatibility)
UPDATE search_terms
SET jacket_types = jackets
WHERE jackets IS NOT NULL 
  AND jacket_types IS NULL;

-- Migrate shielding to shielding_types (keeping both for backward compatibility)
UPDATE search_terms
SET shielding_types = shielding
WHERE shielding IS NOT NULL 
  AND shielding_types IS NULL;

-- Mark all existing mappings as system mappings
UPDATE search_terms
SET is_system = true,
    created_by = 'migration'
WHERE created_by IS NULL;

-- 4. Create indexes on new columns for performance
CREATE INDEX IF NOT EXISTS idx_search_terms_jacket_types ON search_terms USING gin(jacket_types);
CREATE INDEX IF NOT EXISTS idx_search_terms_shielding_types ON search_terms USING gin(shielding_types);
CREATE INDEX IF NOT EXISTS idx_search_terms_fiber_types ON search_terms USING gin(fiber_types);
CREATE INDEX IF NOT EXISTS idx_search_terms_connector_types ON search_terms USING gin(connector_types);
CREATE INDEX IF NOT EXISTS idx_search_terms_usage_count ON search_terms(usage_count DESC);
CREATE INDEX IF NOT EXISTS idx_search_terms_last_used ON search_terms(last_used DESC) WHERE last_used IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_search_terms_is_system ON search_terms(is_system);

-- 5. Verify the new columns
SELECT '=== NEW COLUMNS ADDED ===' as step;
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'search_terms'
AND table_schema = 'public'
AND column_name IN (
    'jacket_types', 'shielding_types', 'fiber_types', 'connector_types',
    'validation_pattern', 'usage_count', 'last_used', 'created_by', 'is_system'
)
ORDER BY column_name;

-- 6. Show migration results
SELECT '=== MIGRATION RESULTS ===' as step;
SELECT 
    COUNT(*) FILTER (WHERE jacket_types IS NOT NULL) as jacket_types_populated,
    COUNT(*) FILTER (WHERE shielding_types IS NOT NULL) as shielding_types_populated,
    COUNT(*) FILTER (WHERE is_system = true) as system_mappings
FROM search_terms;

COMMIT;

-- Summary
SELECT '✅ Step 1B Complete: Strategic columns added!' as status,
       'Now run PROPER_MIGRATION_STEP_2_CORRECT.sql to use these new columns' as next_step;