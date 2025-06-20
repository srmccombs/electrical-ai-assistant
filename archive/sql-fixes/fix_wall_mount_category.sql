-- Fix Wall Mount Fiber Enclosures Category Update
-- The category column already exists with "FIBER PATCH PANEL" values

-- Check current values
SELECT DISTINCT category, COUNT(*) as count
FROM wall_mount_fiber_enclosures
WHERE is_active = true
GROUP BY category;

-- Update to standardized category name
UPDATE wall_mount_fiber_enclosures
SET category = 'Wall Mount Enclosure'
WHERE is_active = true
  AND (category = 'FIBER PATCH PANEL' 
       OR category IS NULL 
       OR category = '');

-- Verify the update
SELECT 
    category,
    COUNT(*) as count,
    STRING_AGG(DISTINCT product_type, ', ' ORDER BY product_type) as product_types
FROM wall_mount_fiber_enclosures
WHERE is_active = true
GROUP BY category;

-- Check sample records
SELECT 
    part_number,
    brand,
    category,
    product_type,
    short_description
FROM wall_mount_fiber_enclosures
WHERE is_active = true
LIMIT 5;