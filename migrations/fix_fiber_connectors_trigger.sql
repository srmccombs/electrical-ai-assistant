-- Fix fiber connectors trigger that references old table name

-- First, let's see what triggers exist on prod_fiber_connectors
SELECT 'Current triggers on prod_fiber_connectors:' as status;
SELECT trigger_name, event_manipulation, action_statement
FROM information_schema.triggers
WHERE event_object_table = 'prod_fiber_connectors';

-- Drop the problematic trigger
DROP TRIGGER IF EXISTS update_fiber_connectors_search_vector_trigger ON prod_fiber_connectors;
DROP FUNCTION IF EXISTS update_fiber_connectors_search_vector() CASCADE;

-- Now the migration can continue without errors
SELECT 'Old trigger removed. You can now run the search setup migration.' as status;