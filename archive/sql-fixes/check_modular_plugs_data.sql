-- Check if modular_plugs table has any data
SELECT COUNT(*) as total_records,
       COUNT(CASE WHEN is_active = true THEN 1 END) as active_records,
       COUNT(CASE WHEN is_active = false THEN 1 END) as inactive_records
FROM modular_plugs;

-- Check sample data
SELECT part_number, brand, short_description, is_active
FROM modular_plugs
LIMIT 10;

-- Check for RJ45 related products
SELECT COUNT(*) as rj45_count
FROM modular_plugs
WHERE is_active = true
  AND (common_terms ILIKE '%rj45%' 
       OR short_description ILIKE '%rj45%'
       OR part_number ILIKE '%rj45%');

-- Check what fields we're searching on
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'modular_plugs'
ORDER BY ordinal_position;