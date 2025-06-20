-- Fix trigger that references old mayer_stock table name
-- This trigger is trying to sync with mayer_stock but it's now ops_mayer_stock

-- First, let's find and fix the problematic trigger
DO $$
DECLARE
    trigger_rec RECORD;
BEGIN
    -- Find all triggers that might reference mayer_stock
    FOR trigger_rec IN 
        SELECT 
            event_object_table as table_name,
            trigger_name,
            action_statement
        FROM information_schema.triggers
        WHERE trigger_schema = 'public'
        AND action_statement LIKE '%mayer_stock%'
    LOOP
        RAISE NOTICE 'Found trigger % on table % that references mayer_stock', 
                     trigger_rec.trigger_name, trigger_rec.table_name;
    END LOOP;
END $$;

-- Drop the old trigger function and recreate with new table name
DROP FUNCTION IF EXISTS sync_mayer_stock_product() CASCADE;

-- Create the updated function with ops_mayer_stock
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
        public.clean_part_number(NEW.part_number),
        COALESCE(v_brand_normalized, NEW.brand),
        NEW.short_description,
        'PENDING',
        COALESCE(NEW.created_by, 'system')
    )
    ON CONFLICT (part_number, branch) 
    DO UPDATE SET
        second_item_number = public.clean_part_number(NEW.part_number),
        brand = COALESCE(v_brand_normalized, NEW.brand),
        short_description = NEW.short_description,
        updated_at = CURRENT_TIMESTAMP,
        last_modified_by = COALESCE(NEW.last_modified_by, NEW.updated_by, 'system');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Find which table has this trigger and recreate it
DO $$
DECLARE
    trigger_table TEXT;
BEGIN
    -- Find the table that has a trigger calling sync_mayer_stock_product
    SELECT DISTINCT event_object_table INTO trigger_table
    FROM information_schema.triggers
    WHERE action_statement LIKE '%sync_mayer_stock_product%'
    LIMIT 1;
    
    IF trigger_table IS NOT NULL THEN
        -- Drop and recreate the trigger
        EXECUTE format('DROP TRIGGER IF EXISTS trigger_sync_mayer_stock ON %I', trigger_table);
        EXECUTE format('
            CREATE TRIGGER trigger_sync_mayer_stock
            AFTER INSERT OR UPDATE ON %I
            FOR EACH ROW
            EXECUTE FUNCTION sync_mayer_stock_product()', trigger_table);
        RAISE NOTICE 'Recreated trigger on table %', trigger_table;
    END IF;
END $$;

-- Also check if clean_part_number function exists
CREATE OR REPLACE FUNCTION clean_part_number(p_part_number TEXT)
RETURNS TEXT AS $$
BEGIN
    -- Simple cleaning function - adjust as needed
    RETURN UPPER(REGEXP_REPLACE(TRIM(p_part_number), '[^A-Za-z0-9-]', '', 'g'));
END;
$$ LANGUAGE plpgsql;

-- Show status
SELECT 'Mayer stock trigger fixed!' as status;