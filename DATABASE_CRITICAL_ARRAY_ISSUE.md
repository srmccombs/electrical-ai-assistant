# CRITICAL: Mixed Data Types for common_terms Column!
## June 20, 2025

## 🚨 The Problem

We have **inconsistent data types** for the `common_terms` column across tables:
- **Most tables**: `common_terms` is TEXT type ✅
- **Some tables**: `common_terms` is TEXT[] (array) type ❌

This causes:
1. SQL queries to fail with "malformed array literal" errors
2. Search functionality to break
3. Data population scripts to fail

## 🔍 Identifying Which Tables Have Arrays

Run this query to check data types:
```sql
SELECT 
    table_name,
    column_name,
    data_type,
    udt_name
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name LIKE 'prod_%'
AND column_name = 'common_terms'
ORDER BY table_name;
```

## 📊 Expected Results

Based on earlier findings:
- **prod_surface_mount_boxes**: `common_terms` is TEXT[] (ARRAY)
- **Other tables**: Should be TEXT

## 🛠️ The Fix

### For Tables with ARRAY type (like surface_mount_boxes):

```sql
-- Step 1: Add a temporary column
ALTER TABLE prod_surface_mount_boxes 
ADD COLUMN common_terms_new TEXT;

-- Step 2: Convert array to text (if any data exists)
UPDATE prod_surface_mount_boxes
SET common_terms_new = array_to_string(common_terms, ' ')
WHERE common_terms IS NOT NULL;

-- Step 3: Drop old column
ALTER TABLE prod_surface_mount_boxes 
DROP COLUMN common_terms;

-- Step 4: Rename new column
ALTER TABLE prod_surface_mount_boxes 
RENAME COLUMN common_terms_new TO common_terms;

-- Step 5: Now populate with search terms
UPDATE prod_surface_mount_boxes
SET common_terms = LOWER(CONCAT_WS(' ',
    number_of_ports || ' port',
    LOWER(brand),
    'surface mount box smb biscuit block outlet junction'
))
WHERE common_terms IS NULL;
```

## 📋 Corrected Query for Mixed Types

To check search term status with mixed data types:

```sql
-- Check data type for each table first
WITH table_types AS (
    SELECT 
        table_name,
        data_type
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name LIKE 'prod_%'
    AND column_name = 'common_terms'
)
SELECT 
    t.table_name,
    t.data_type as common_terms_type,
    CASE 
        WHEN t.table_name = 'prod_category_cables' THEN 
            (SELECT COUNT(*) FROM prod_category_cables)
        WHEN t.table_name = 'prod_jack_modules' THEN 
            (SELECT COUNT(*) FROM prod_jack_modules)
        WHEN t.table_name = 'prod_faceplates' THEN 
            (SELECT COUNT(*) FROM prod_faceplates)
        WHEN t.table_name = 'prod_surface_mount_boxes' THEN 
            (SELECT COUNT(*) FROM prod_surface_mount_boxes)
        -- Add other tables
    END as total_products,
    CASE 
        WHEN t.table_name = 'prod_category_cables' THEN 
            (SELECT COUNT(*) FROM prod_category_cables WHERE common_terms IS NOT NULL AND common_terms != '')
        WHEN t.table_name = 'prod_surface_mount_boxes' AND t.data_type = 'ARRAY' THEN 
            (SELECT COUNT(*) FROM prod_surface_mount_boxes WHERE common_terms IS NOT NULL AND array_length(common_terms, 1) > 0)
        -- Add other cases
    END as with_search_terms
FROM table_types t
ORDER BY t.table_name;
```

## 🎯 Action Plan

1. **First**: Identify ALL tables with array type common_terms
2. **Second**: Convert arrays to TEXT type
3. **Third**: Populate search terms using consistent TEXT format
4. **Fourth**: Update all queries to use TEXT comparisons

## ⚠️ Why This Happened

During table creation, someone incorrectly defined:
```sql
-- Wrong:
common_terms TEXT[]  -- Array type

-- Correct:
common_terms TEXT    -- Text type
```

This must be fixed before V2 search can work properly!