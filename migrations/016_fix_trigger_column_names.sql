-- Fix trigger to use correct column names after standardization
-- The trigger was created with Shielding_Type but we renamed it to shielding_type

BEGIN;

-- Drop and recreate the trigger function with correct column names
CREATE OR REPLACE FUNCTION update_search_terms_trigger() RETURNS TRIGGER AS $$
BEGIN
    -- Update timestamp
    NEW.updated_at = CURRENT_TIMESTAMP;
    
    -- Update search terms based on table
    CASE TG_TABLE_NAME
        WHEN 'prod_category_cables' THEN
            NEW.computed_search_terms := get_cable_search_terms_enhanced(
                NEW.part_number, NEW.brand, NEW.category_rating, NEW.jacket_color,
                NEW.jacket_material, NEW.length, NEW.shielding_type,  -- FIXED: lowercase
                NEW.short_description
            );
            
        WHEN 'prod_fiber_cables' THEN
            NEW.computed_search_terms := get_fiber_cable_search_terms_enhanced(
                NEW.part_number, NEW.brand, NEW.fiber_types, NEW.fiber_count,
                NEW.jacket_rating, NEW.short_description
            );
            
        WHEN 'prod_fiber_connectors' THEN
            NEW.computed_search_terms := get_fiber_connector_search_terms_enhanced(
                NEW.part_number, NEW.brand, NEW.connector_type, NEW.fiber_types,
                NEW.termination_type, NEW.short_description
            );
            
        WHEN 'prod_jack_modules' THEN
            NEW.computed_search_terms := get_jack_module_search_terms_enhanced(
                NEW.part_number, NEW.brand, NEW.product_line, NEW.category_rating,
                NEW.shielding_type, NEW.color, NEW.short_description
            );
            
        WHEN 'prod_modular_plugs' THEN
            NEW.computed_search_terms := get_modular_plug_search_terms_enhanced(
                NEW.part_number, NEW.brand, NEW.product_line, NEW.category_rating,
                NEW.shielding_type, NEW.short_description
            );
            
        WHEN 'prod_faceplates' THEN
            NEW.computed_search_terms := get_faceplate_search_terms_enhanced(
                NEW.part_number, NEW.brand, NEW.product_line, NEW.number_of_ports,
                NEW.color, NEW.short_description
            );
            
        WHEN 'prod_surface_mount_boxes' THEN
            NEW.computed_search_terms := get_smb_search_terms_enhanced(
                NEW.part_number, NEW.brand, NEW.product_line, NEW.number_of_ports,
                NEW.color, NEW.short_description
            );
            
        ELSE
            -- For other tables, use basic search terms
            NEW.computed_search_terms := LOWER(
                COALESCE(NEW.part_number, '') || ' ' ||
                COALESCE(NEW.brand, '') || ' ' ||
                COALESCE(NEW.short_description, '')
            );
    END CASE;
    
    -- Update search vector
    NEW.search_vector := to_tsvector('english', NEW.computed_search_terms);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Verify triggers exist on all tables
SELECT 
    'Triggers on product tables:' as info,
    n.nspname as schema_name,
    c.relname as table_name,
    t.tgname as trigger_name
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE t.tgname = 'update_search_terms'
AND c.relname LIKE 'prod_%'
AND NOT t.tgisinternal
ORDER BY c.relname;

SELECT 'Trigger function updated!' as status,
    'Now uses lowercase shielding_type column' as result;

COMMIT;