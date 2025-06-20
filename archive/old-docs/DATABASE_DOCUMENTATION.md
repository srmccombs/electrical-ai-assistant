# Plectic AI Database Documentation

## Overview
This document provides comprehensive documentation for the Plectic AI Supabase database, including the new Mayer_stock table integration and database organization guidelines.

## Database Structure

### Core Product Tables (9 active tables)
These tables store the main product catalog:

#### Active Tables:
1. **category_cables** - Ethernet cables (Cat5e/6/6a)
2. **fiber_connectors** - LC/SC/ST fiber connectors  
3. **adapter_panels** - Fiber adapter panels
4. **rack_mount_fiber_enclosures** - 1U-4U rack mount enclosures
5. **wall_mount_fiber_enclosures** - Wall mount fiber enclosures
6. **fiber_optic_cable** - Single/multimode fiber cables
7. **faceplates** - Network faceplates (Note: Contains both faceplates and some SMB products)
8. **jack_modules** - Keystone jacks and modules
9. **surface_mount_box** - Surface mount boxes (Created June 2025)
   - Compatible with jack modules via `compatible_jacks` JSON array field
   - Contains Panduit Mini-Com and Hubbell ISTATION product lines
   - Port configurations: 1, 2, 4, 6, 12 ports
   - Note: `common_terms` is an array field, cannot use with ilike operators

### Stock Management Table

#### mayer_stock
Centralized inventory tracking across 67 Mayer branches:
- **Primary Key**: `id` (BIGSERIAL)
- **Unique Constraint**: `(part_number, branch)`
- **Key Fields**:
  - `branch` - Branch code (e.g., "200500", "210500")
  - `second_item_number` - Cleaned part number (no dashes/spaces, uppercase)
  - `qty_on_hand` - Current stock quantity
  - `qty_on_order` - Quantity on order
  - `part_number` - Original manufacturer part number
  - `brand` - Normalized brand name
  - `short_description` - Product description
  - `is_active` - Soft delete flag
  - Audit fields: `created_at`, `updated_at`, `created_by`, `last_modified_by`

### Analytics Tables
- **search_analytics** - Tracks all search queries and performance
- **search_analytics_summary** - Daily aggregated statistics
- **popular_searches** - Most searched terms

### Other Tables (Status TBD)
Tables that need review for activation/deletion:
- ai_cache
- brands
- cables
- connectors
- cross_reference_guide
- enclosures
- keyword_mappings
- panels
- product_aliases
- product_search_terms
- products
- search_intents
- stock_levels
- user_feedback
- user_search_history

## Key Database Features

### 1. Automatic Synchronization
The `mayer_stock` table automatically syncs with all 9 product tables through triggers:
- **INSERT**: Adds product to mayer_stock with 'PENDING' branch
- **UPDATE**: Updates product details in mayer_stock
- **DELETE**: Sets `is_active = false` (soft delete)

### 2. Part Number Cleaning
Function `clean_part_number()` automatically creates `second_item_number`:
```sql
-- Example: "Cat6-550MHz-Blue" → "CAT6550MHZBLUE"
SELECT clean_part_number('Cat6-550MHz-Blue');
```

### 3. Brand Normalization
Function `normalize_brand()` standardizes brand names:
- Corning/Siecor → "Corning"
- Leviton/BerkTek → "Leviton"
- Auto-populated via triggers on all product tables

### 4. Helper Functions

#### Update Stock from Mayer
```sql
-- Update stock for a specific branch and product
SELECT update_mayer_stock('200500', 'CAT6550MHZBLUE', 150, 50);
```

#### Add New Branch Stock
```sql
-- Add stock for a new branch
SELECT add_branch_to_product('Cat6-550MHz-Blue', '210500', 75, 25);
```

### 5. Useful Views

#### v_mayer_stock_summary
Aggregated view showing stock across all branches:
```sql
SELECT * FROM v_mayer_stock_summary 
WHERE brand = 'Corning' 
ORDER BY total_on_hand DESC;
```

## Common Operations

### 1. Import Mayer Stock Data
```sql
-- Bulk update from CSV/Excel import
UPDATE mayer_stock 
SET qty_on_hand = ?, qty_on_order = ?
WHERE branch = ? AND second_item_number = ?;
```

### 2. Find Low Stock Items
```sql
SELECT part_number, branch, qty_on_hand, qty_on_order
FROM mayer_stock
WHERE is_active = true
AND qty_on_hand < 10
AND branch != 'PENDING'
ORDER BY qty_on_hand ASC;
```

### 3. Check Product Distribution
```sql
-- See which branches carry a specific product
SELECT branch, qty_on_hand, qty_on_order
FROM mayer_stock
WHERE part_number = 'YOUR-PART-NUMBER'
AND is_active = true
ORDER BY qty_on_hand DESC;
```

## Maintenance Tasks

### 1. Clean Inactive Records
```sql
-- Remove soft-deleted records older than 6 months
DELETE FROM mayer_stock 
WHERE is_active = false 
AND updated_at < CURRENT_DATE - INTERVAL '6 months';
```

### 2. Verify Data Integrity
```sql
-- Find products in mayer_stock not in any product table
SELECT DISTINCT ms.part_number 
FROM mayer_stock ms
WHERE NOT EXISTS (
    SELECT 1 FROM category_cables WHERE part_number::text = ms.part_number
    UNION SELECT 1 FROM fiber_connectors WHERE part_number = ms.part_number
    -- ... check all 9 tables
);
```

### 3. Update Brand Normalization
```sql
-- Re-normalize all brands if rules change
UPDATE mayer_stock 
SET brand = normalize_brand(brand);
```

## Best Practices

1. **Always use the helper functions** for updating stock data
2. **Never hard-delete** from mayer_stock - use soft deletes
3. **Monitor the PENDING branch** - products here need Mayer data
4. **Use transactions** for bulk updates to maintain consistency
5. **Index maintenance** - Run `ANALYZE mayer_stock;` after large imports

## Troubleshooting

### Product not syncing to mayer_stock
1. Check if product has `is_active = true`
2. Verify trigger exists on the product table
3. Check for unique constraint violations

### Stock updates not working
1. Verify `second_item_number` matches (uppercase, no spaces/dashes)
2. Check branch code format
3. Ensure product exists and `is_active = true`

### Performance issues
1. Run `VACUUM ANALYZE mayer_stock;`
2. Check index usage with `EXPLAIN`
3. Consider partitioning if >1M rows

## Development Environment

### PyCharm Memory Configuration
For optimal performance when working with the database and large codebases:

#### MacBook Air (8GB RAM) Recommended Settings
Location: `/Users/stacymccombs/Library/Application Support/JetBrains/PyCharm2025.1/pycharm.vmoptions`

```
-Xmx2048m  # Maximum heap size (2GB - 25% of total RAM)
```

#### Memory Management Tips
1. **Enable Memory Indicator**: View → Appearance → Status Bar Widgets → Memory Indicator
2. **Monitor Usage**: Keep an eye on PyCharm's memory usage in the status bar
3. **Free Memory**: Click the memory indicator to trigger garbage collection
4. **Power Save Mode**: Consider using for very large database operations

#### Adjusting Memory Settings
- **Via UI**: Help → Change Memory Settings
- **Manual Edit**: Edit the vmoptions file directly
- **Restart Required**: Always restart PyCharm after changes

#### Warning Signs of Low Memory
- Slow indexing or search
- Frequent freezing
- "Low Memory" warnings
- Slow database query results

## Next Steps

1. **Review inactive tables** - Determine which can be deleted
2. **Add missing audit fields** - Some tables lack created_by/updated_by
3. **Create admin interface** - For managing stock updates
4. **Set up automated imports** - Schedule Mayer data updates
5. **Add data validation** - Ensure branch codes are valid

## Contact
For database issues or questions:
- Check this documentation first
- Review SQL comments in the code
- Test in development before production