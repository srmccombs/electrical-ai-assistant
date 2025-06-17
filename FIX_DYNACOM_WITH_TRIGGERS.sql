-- Fix Dynacom Faceplates with Trigger Management

-- STEP 1: Check current trigger status
SELECT 
    tgname AS trigger_name,
    tgenabled AS is_enabled
FROM pg_trigger
WHERE tgrelid = 'faceplates'::regclass;

-- STEP 2: Disable ALL triggers on faceplates table
ALTER TABLE faceplates DISABLE TRIGGER ALL;

-- STEP 3: Now update the is_active status
UPDATE faceplates
SET is_active = true
WHERE brand = 'Dynacom'
  AND (is_active IS NULL OR is_active = false);

-- STEP 4: Also ensure they have proper compatible_jacks array if they're Keystone
UPDATE faceplates
SET compatible_jacks = 
    CASE 
        WHEN compatible_jacks IS NULL AND product_line = 'Keystone' 
            THEN ARRAY['Keystone']
        WHEN product_line = 'Keystone' AND NOT ('Keystone' = ANY(COALESCE(compatible_jacks, '{}'))) 
            THEN array_append(COALESCE(compatible_jacks, '{}'), 'Keystone')
        ELSE compatible_jacks
    END
WHERE brand = 'Dynacom'
  AND product_line = 'Keystone';

-- STEP 5: Re-enable ALL triggers
ALTER TABLE faceplates ENABLE TRIGGER ALL;

-- STEP 6: Verify the updates worked
SELECT 
    COUNT(*) as active_count,
    COUNT(CASE WHEN 'Keystone' = ANY(compatible_jacks) THEN 1 END) as keystone_compatible_count
FROM faceplates
WHERE brand = 'Dynacom'
  AND is_active = true;

-- STEP 7: Test query - should now find Dynacom Keystone faceplates
SELECT 
    part_number,
    brand,
    product_line,
    array_to_string(compatible_jacks, ', ') as compatible_jacks,
    is_active
FROM faceplates
WHERE brand = 'Dynacom'
  AND is_active = true
  AND (product_line = 'Keystone' OR 'Keystone' = ANY(compatible_jacks))
LIMIT 10;