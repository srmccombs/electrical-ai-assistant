-- Safe Update for Wall Mount Fiber Enclosures Category
-- This approach disables ALL triggers temporarily

-- Check current values
SELECT DISTINCT category, COUNT(*) as count
FROM wall_mount_fiber_enclosures
WHERE is_active = true
GROUP BY category;

-- Disable ALL triggers on the table (safer approach)
ALTER TABLE wall_mount_fiber_enclosures DISABLE TRIGGER ALL;

-- Now update the category
UPDATE wall_mount_fiber_enclosures
SET category = 'Wall Mount Enclosure'
WHERE is_active = true
  AND (category = 'FIBER PATCH PANEL' 
       OR category IS NULL 
       OR category = '');

-- Re-enable ALL triggers
ALTER TABLE wall_mount_fiber_enclosures ENABLE TRIGGER ALL;

-- Verify the update
SELECT 
    category,
    COUNT(*) as count,
    STRING_AGG(DISTINCT product_type, ', ' ORDER BY product_type) as product_types
FROM wall_mount_fiber_enclosures
WHERE is_active = true
GROUP BY category;

-- Do the same for other tables that might have issues
-- ADAPTER PANELS
ALTER TABLE adapter_panels DISABLE TRIGGER ALL;
ALTER TABLE adapter_panels 
ADD COLUMN IF NOT EXISTS category VARCHAR(100) DEFAULT 'Adapter Panel';
UPDATE adapter_panels
SET category = 'Adapter Panel'
WHERE category IS NULL OR category = '';
ALTER TABLE adapter_panels ENABLE TRIGGER ALL;

-- RACK MOUNT FIBER ENCLOSURES  
ALTER TABLE rack_mount_fiber_enclosures DISABLE TRIGGER ALL;
ALTER TABLE rack_mount_fiber_enclosures 
ADD COLUMN IF NOT EXISTS category VARCHAR(100) DEFAULT 'Rack Mount Enclosure';
UPDATE rack_mount_fiber_enclosures
SET category = 'Rack Mount Enclosure'
WHERE category IS NULL OR category = '';
ALTER TABLE rack_mount_fiber_enclosures ENABLE TRIGGER ALL;

-- Final verification
SELECT 'wall_mount_fiber_enclosures' as table_name, 
       COUNT(*) as total, 
       COUNT(category) as with_category,
       COUNT(DISTINCT category) as unique_categories
FROM wall_mount_fiber_enclosures WHERE is_active = true
UNION ALL
SELECT 'adapter_panels', COUNT(*), COUNT(category), COUNT(DISTINCT category)
FROM adapter_panels WHERE is_active = true
UNION ALL
SELECT 'rack_mount_fiber_enclosures', COUNT(*), COUNT(category), COUNT(DISTINCT category)
FROM rack_mount_fiber_enclosures WHERE is_active = true
ORDER BY table_name;