-- Force Update Dynacom Faceplates - Nuclear Option

-- STEP 1: Check if there are any constraints preventing updates
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'faceplates'::regclass;

-- STEP 2: Try a direct update without any conditions first
-- Just update ONE record to test
UPDATE faceplates
SET is_active = true
WHERE part_number = (
    SELECT part_number 
    FROM faceplates 
    WHERE brand = 'Dynacom' 
    LIMIT 1
);

-- STEP 3: If that doesn't work, check for RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'faceplates';

-- STEP 4: Alternative approach - Insert the Dynacom data into a temp table
-- then delete and re-insert
CREATE TEMP TABLE temp_dynacom_faceplates AS
SELECT * FROM faceplates WHERE brand = 'Dynacom';

-- Update the temp table
UPDATE temp_dynacom_faceplates
SET is_active = true;

-- Check what we have
SELECT COUNT(*), is_active 
FROM temp_dynacom_faceplates 
GROUP BY is_active;

-- STEP 5: If you can't update, try this workaround
-- Export Dynacom faceplates, fix the is_active column, and re-import
SELECT 
    part_number,
    brand,
    product_line,
    true as is_active,  -- Force true in the select
    short_description,
    array_to_string(compatible_jacks, ', ') as compatible_jacks
FROM faceplates
WHERE brand = 'Dynacom'
LIMIT 5;

-- STEP 6: Nuclear option - check if the user has UPDATE permissions
SELECT 
    has_table_privilege(current_user, 'faceplates', 'UPDATE') as can_update,
    current_user as current_user;