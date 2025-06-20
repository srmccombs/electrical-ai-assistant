# Supabase SQL Quick Reference Card

## 🚀 Most Common Queries (Copy & Paste Ready)

### 1. Get Row Count for a Table
```sql
SELECT COUNT(*) as row_count FROM prod_category_cables;
```

### 2. Get All Row Counts
```sql
SELECT 'prod_category_cables' as table_name, COUNT(*) as count FROM prod_category_cables
UNION ALL
SELECT 'prod_fiber_cables', COUNT(*) FROM prod_fiber_cables
UNION ALL
SELECT 'prod_fiber_connectors', COUNT(*) FROM prod_fiber_connectors
UNION ALL
SELECT 'prod_jack_modules', COUNT(*) FROM prod_jack_modules
UNION ALL
SELECT 'prod_modular_plugs', COUNT(*) FROM prod_modular_plugs
UNION ALL
SELECT 'prod_faceplates', COUNT(*) FROM prod_faceplates
UNION ALL
SELECT 'prod_surface_mount_boxes', COUNT(*) FROM prod_surface_mount_boxes
UNION ALL
SELECT 'prod_adapter_panels', COUNT(*) FROM prod_adapter_panels
UNION ALL
SELECT 'prod_wall_mount_fiber_enclosures', COUNT(*) FROM prod_wall_mount_fiber_enclosures
UNION ALL
SELECT 'prod_rack_mount_fiber_enclosures', COUNT(*) FROM prod_rack_mount_fiber_enclosures;
```

### 3. See Table Columns
```sql
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'prod_category_cables'  -- Change table name here
AND table_schema = 'public'
ORDER BY ordinal_position;
```

### 4. Check for Trailing Spaces in Brands
```sql
SELECT 
    part_number,
    brand,
    LENGTH(brand) as current_length,
    LENGTH(TRIM(brand)) as trimmed_length
FROM prod_category_cables  -- Change table name here
WHERE brand != TRIM(brand)
LIMIT 10;
```

### 5. Fix Trailing Spaces
```sql
UPDATE prod_category_cables  -- Change table name here
SET brand = TRIM(brand)
WHERE brand != TRIM(brand);
```

### 6. Find Products Missing Common Terms
```sql
SELECT 
    part_number,
    brand,
    short_description
FROM prod_category_cables  -- Change table name here
WHERE common_terms IS NULL OR common_terms = ''
LIMIT 20;
```

### 7. Search for a Product
```sql
-- Simple search
SELECT * FROM prod_category_cables
WHERE part_number ILIKE '%cat6%'
OR short_description ILIKE '%cat6%'
LIMIT 10;

-- Search in array column
SELECT * FROM prod_faceplates
WHERE 'Keystone' = ANY(compatible_jacks);

-- Search in JSON column (surface_mount_boxes)
SELECT * FROM prod_surface_mount_boxes
WHERE compatible_jacks::jsonb @> '["Keystone"]';
```

### 8. Get Sample Data from a Table
```sql
SELECT * FROM prod_category_cables
ORDER BY created_at DESC
LIMIT 5;
```

### 9. Check Unique Values in a Column
```sql
-- Get all unique brands
SELECT DISTINCT brand 
FROM prod_category_cables
ORDER BY brand;

-- Get all unique category ratings
SELECT DISTINCT category_rating
FROM prod_category_cables
ORDER BY category_rating;
```

### 10. Find Duplicate Part Numbers
```sql
SELECT 
    part_number,
    COUNT(*) as count
FROM prod_category_cables  -- Change table name here
GROUP BY part_number
HAVING COUNT(*) > 1;
```

## 🔴 Common Supabase SQL Rules

### DO ✅
```sql
-- Use single quotes for strings
WHERE brand = 'Panduit'

-- Use ANY() for array comparisons
WHERE 'Keystone' = ANY(compatible_jacks)

-- Always specify schema
WHERE table_schema = 'public'

-- Use ILIKE for case-insensitive search
WHERE description ILIKE '%cable%'

-- Check NULL properly
WHERE column_name IS NULL
```

### DON'T ❌
```sql
-- Wrong: Double quotes for values
WHERE brand = "Panduit"

-- Wrong: Direct array comparison
WHERE compatible_jacks = 'Keystone'

-- Wrong: No schema specified
FROM information_schema.columns WHERE table_name = 'prod_cables'

-- Wrong: Using = NULL
WHERE column_name = NULL
```

## 🎯 Export Data to CSV

### From Supabase Dashboard:
1. Go to Table Editor
2. Select your table
3. Click "Export" button
4. Choose "CSV"

### From SQL Editor:
```sql
-- First run your query
SELECT 
    part_number,
    brand,
    short_description,
    category_rating
FROM prod_category_cables
WHERE is_active = true
ORDER BY brand, part_number;

-- Then click "Download CSV" button in results
```

## 📋 Check Table Health
```sql
-- Quick health check for a table
SELECT 
    'Total Products' as metric, COUNT(*) as value FROM prod_category_cables
UNION ALL
SELECT 'Active Products', COUNT(*) FROM prod_category_cables WHERE is_active = true
UNION ALL
SELECT 'Brands with Spaces', COUNT(*) FROM prod_category_cables WHERE brand != TRIM(brand)
UNION ALL
SELECT 'Missing Common Terms', COUNT(*) FROM prod_category_cables WHERE common_terms IS NULL OR common_terms = ''
UNION ALL
SELECT 'Has Search Vector', COUNT(*) FROM prod_category_cables WHERE search_vector IS NOT NULL;
```

---
**Remember**: Always test UPDATE/DELETE queries with a SELECT first!
```sql
-- Test first
SELECT * FROM prod_category_cables WHERE brand != TRIM(brand);

-- Then update
UPDATE prod_category_cables SET brand = TRIM(brand) WHERE brand != TRIM(brand);
```