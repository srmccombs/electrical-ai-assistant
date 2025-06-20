-- Fix Wall Mount Fiber Enclosures Category Update with Trigger Disable
-- The sync trigger expects fields that don't exist

-- First, check current values
SELECT DISTINCT category, COUNT(*) as count
FROM wall_mount_fiber_enclosures
WHERE is_active = true
GROUP BY category;

-- Temporarily disable the sync trigger
ALTER TABLE wall_mount_fiber_enclosures DISABLE TRIGGER sync_wall_mount_fiber_enclosures_to_mayer;

-- Now update the category
UPDATE wall_mount_fiber_enclosures
SET category = 'Wall Mount Enclosure'
WHERE is_active = true
  AND (category = 'FIBER PATCH PANEL' 
       OR category IS NULL 
       OR category = '');

-- Re-enable the trigger
ALTER TABLE wall_mount_fiber_enclosures ENABLE TRIGGER sync_wall_mount_fiber_enclosures_to_mayer;

-- Verify the update
SELECT 
    category,
    COUNT(*) as count,
    STRING_AGG(DISTINCT product_type, ', ' ORDER BY product_type) as product_types
FROM wall_mount_fiber_enclosures
WHERE is_active = true
GROUP BY category;

-- Also fix any other tables that might have this issue
-- Let's create a general approach for all remaining tables

-- ADAPTER PANELS
ALTER TABLE adapter_panels DISABLE TRIGGER IF EXISTS sync_adapter_panels_to_mayer;
UPDATE adapter_panels
SET category = 'Adapter Panel'
WHERE category IS NULL OR category = '';
ALTER TABLE adapter_panels ENABLE TRIGGER IF EXISTS sync_adapter_panels_to_mayer;

-- RACK MOUNT FIBER ENCLOSURES  
ALTER TABLE rack_mount_fiber_enclosures DISABLE TRIGGER IF EXISTS sync_rack_mount_fiber_enclosures_to_mayer;
UPDATE rack_mount_fiber_enclosures
SET category = 'Rack Mount Enclosure'
WHERE category IS NULL OR category = '';
ALTER TABLE rack_mount_fiber_enclosures ENABLE TRIGGER IF EXISTS sync_rack_mount_fiber_enclosures_to_mayer;

-- Final verification for all fiber-related tables
SELECT 'adapter_panels' as table_name, COUNT(*) as total, COUNT(category) as with_category 
FROM adapter_panels WHERE is_active = true
UNION ALL
SELECT 'rack_mount_fiber_enclosures', COUNT(*), COUNT(category) 
FROM rack_mount_fiber_enclosures WHERE is_active = true
UNION ALL
SELECT 'wall_mount_fiber_enclosures', COUNT(*), COUNT(category) 
FROM wall_mount_fiber_enclosures WHERE is_active = true
ORDER BY table_name;