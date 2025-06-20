-- Fix trigger that references old mayer_stock table name
-- Version 2: Handles existing clean_part_number function

-- First, let's check what functions and triggers exist
SELECT 'Checking existing triggers and functions...' as status;

-- Find triggers referencing mayer_stock
SELECT 
    event_object_table as table_name,
    trigger_name
FROM information_schema.triggers
WHERE trigger_schema = 'public'
AND action_statement LIKE '%mayer_stock%';

-- Drop and recreate the sync function with correct table name
DROP FUNCTION IF EXISTS sync_mayer_stock_product() CASCADE;

CREATE OR REPLACE FUNCTION sync_mayer_stock_product()
RETURNS TRIGGER AS $$
DECLARE
    v_brand_normalized TEXT;
BEGIN
    -- Normalize the brand if needed
    v_brand_normalized := UPPER(TRIM(NEW.brand));
    
    -- Insert or update in ops_mayer_stock (not mayer_stock)
    INSERT INTO ops_mayer_stock (
        part_number,
        second_item_number,
        brand,
        short_description,
        branch,
        created_by
    )
    VALUES (
        NEW.part_number,
        clean_part_number(NEW.part_number),  -- Use existing function
        COALESCE(v_brand_normalized, NEW.brand),
        NEW.short_description,
        'PENDING',
        COALESCE(NEW.created_by, 'system')
    )
    ON CONFLICT (part_number, branch) 
    DO UPDATE SET
        second_item_number = clean_part_number(NEW.part_number),
        brand = COALESCE(v_brand_normalized, NEW.brand),
        short_description = NEW.short_description,
        updated_at = CURRENT_TIMESTAMP,
        last_modified_by = COALESCE(NEW.last_modified_by, NEW.updated_by, 'system');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Find and recreate triggers on product tables
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Loop through all product tables and create sync triggers
    FOR r IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename LIKE 'prod_%'
        AND EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = tablename 
            AND column_name = 'part_number'
        )
    LOOP
        -- Drop old trigger if exists
        EXECUTE format('DROP TRIGGER IF EXISTS trigger_sync_mayer_stock ON %I', r.tablename);
        
        -- Only create trigger if table has required columns
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = r.tablename 
            AND column_name IN ('part_number', 'brand', 'short_description')
        ) THEN
            EXECUTE format('
                CREATE TRIGGER trigger_sync_mayer_stock
                AFTER INSERT OR UPDATE ON %I
                FOR EACH ROW
                EXECUTE FUNCTION sync_mayer_stock_product()', r.tablename);
            RAISE NOTICE 'Created trigger on table %', r.tablename;
        END IF;
    END LOOP;
END $$;

-- Show final status
SELECT 'Triggers updated to use ops_mayer_stock!' as status;

-- Verify the clean_part_number function exists
SELECT 
    proname as function_name,
    prokind as function_type,
    proargnames as parameter_names
FROM pg_proc 
WHERE proname = 'clean_part_number';