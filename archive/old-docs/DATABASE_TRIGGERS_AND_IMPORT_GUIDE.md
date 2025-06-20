# Database Triggers and Import Guide

## Overview
This document contains critical information about the Plectic AI database structure, triggers, and import procedures discovered on June 17, 2025.

## Key Database Tables and Triggers

### jack_modules Table Structure
```
Columns:
- id (bigint, NOT NULL)
- part_number (varchar, NOT NULL)
- brand (varchar)
- brand_normalized (varchar)
- product_line (varchar)
- short_description (text)
- upc_number (varchar)
- product_type (varchar)
- category_rating (varchar)
- pair_count (varchar)
- color (varchar)
- shielding_type (varchar)
- installation_tools_required (text)
- common_terms (text)
- compatible_faceplates (text)
- image_file (varchar)
- possible_cross (text)
- go_with_items (text)
- created_at (timestamp with time zone)
- updated_at (timestamp with time zone)
- is_active (boolean)
- search_vector (tsvector)

NOTE: Does NOT have last_modified_by or created_by columns!
```

### Triggers on jack_modules
1. **normalize_jack_module_brand_trigger** - Normalizes brand names (BEFORE INSERT/UPDATE)
2. **sync_jack_modules_to_mayer** - Syncs to mayer_stock table (AFTER INSERT/UPDATE/DELETE)
3. **update_jack_modules_search_vector_trigger** - Updates search vectors (BEFORE INSERT/UPDATE)

### The Import Problem
The `sync_jack_modules_to_mayer` trigger executes `sync_mayer_stock_product()` function which expects:
- `last_modified_by` field (which jack_modules doesn't have)
- `created_by` field (which jack_modules doesn't have)

This causes imports to fail because:
- Without these fields in CSV: Trigger can't sync to mayer_stock
- With these fields in CSV: Import fails because columns don't exist in jack_modules

## Import Solution Process

### Step 1: Disable Trigger
```sql
ALTER TABLE jack_modules DISABLE TRIGGER sync_jack_modules_to_mayer;
```

### Step 2: Import CSV
- Use Supabase Table Editor
- CSV should NOT include last_modified_by or created_by columns
- Include only columns that exist in jack_modules table

### Step 3: Manual Sync to mayer_stock
```sql
INSERT INTO mayer_stock (
    part_number, 
    brand,
    short_description,
    branch,
    second_item_number,
    qty_on_hand,
    qty_on_order,
    last_modified_by,
    created_by,
    created_at,
    updated_at,
    is_active
)
SELECT 
    j.part_number,
    j.brand,
    j.short_description,
    'PENDING',
    UPPER(REPLACE(REPLACE(j.part_number, '-', ''), ' ', '')),
    0,
    0,
    'IMPORT',
    'IMPORT',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    true
FROM jack_modules j
WHERE NOT EXISTS (
    SELECT 1 FROM mayer_stock m 
    WHERE m.part_number = j.part_number
);
```

### Step 4: Re-enable Trigger
```sql
ALTER TABLE jack_modules ENABLE TRIGGER sync_jack_modules_to_mayer;
```

### Step 5: Verify
```sql
SELECT COUNT(*) as total_jack_modules FROM jack_modules;
```

## All Product Tables with Sync Triggers

The following tables all have sync_*_to_mayer triggers:
1. adapter_panels
2. category_cables
3. faceplates
4. fiber_connectors
5. fiber_optic_cable
6. jack_modules
7. rack_mount_fiber_enclosures
8. surface_mount_box
9. wall_mount_fiber_enclosures

## Useful Diagnostic Queries

### Show All Triggers on a Table
```sql
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'jack_modules'
    AND trigger_schema = 'public';
```

### Check Trigger Status
```sql
SELECT 
    tgname AS trigger_name,
    CASE 
        WHEN tgenabled = 'O' THEN 'ENABLED'
        WHEN tgenabled = 'D' THEN 'DISABLED'
    END AS status
FROM pg_trigger
WHERE tgrelid = 'public.jack_modules'::regclass;
```

### Show Table Structure
```sql
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'jack_modules'
ORDER BY ordinal_position;
```

## Permanent Fix Options

### Option 1: Add Missing Columns
```sql
ALTER TABLE jack_modules 
ADD COLUMN IF NOT EXISTS created_by VARCHAR(255) DEFAULT 'SYSTEM',
ADD COLUMN IF NOT EXISTS last_modified_by VARCHAR(255) DEFAULT 'SYSTEM';
```

### Option 2: Modify sync_mayer_stock_product() Function
Update the function to use default values when columns are missing.

### Option 3: Create Import-Specific Function
Create a function that temporarily disables triggers during import.

## Notes
- The mayer_stock table is used for inventory tracking across branches
- All product tables sync to mayer_stock automatically via triggers
- The 'PENDING' branch indicates products awaiting Mayer inventory data
- second_item_number is a cleaned version of part_number (uppercase, no spaces/dashes)

## Important Notes About mayer_stock Table

The `mayer_stock` table structure includes these columns:
- part_number
- brand (NOT brand_normalized - this column doesn't exist)
- short_description
- branch
- second_item_number
- qty_on_hand
- qty_on_order
- last_modified_by
- created_by
- created_at
- updated_at
- is_active

When syncing from product tables, use simple string manipulation for `second_item_number`:
```sql
UPPER(REPLACE(REPLACE(part_number, '-', ''), ' ', ''))
```

## Generic Import Process for Any Product Table

Replace `[TABLE_NAME]` with your actual table name (faceplates, jack_modules, etc.):

```sql
-- 1. Disable trigger
ALTER TABLE [TABLE_NAME] DISABLE TRIGGER sync_[TABLE_NAME]_to_mayer;

-- 2. Import CSV via Supabase UI

-- 3. Sync to mayer_stock
INSERT INTO mayer_stock (
    part_number, brand, short_description, branch,
    second_item_number, qty_on_hand, qty_on_order,
    last_modified_by, created_by, created_at, updated_at, is_active
)
SELECT 
    part_number, brand, short_description, 'PENDING',
    UPPER(REPLACE(REPLACE(part_number, '-', ''), ' ', '')),
    0, 0, 'IMPORT', 'IMPORT',
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, true
FROM [TABLE_NAME]
WHERE NOT EXISTS (
    SELECT 1 FROM mayer_stock m 
    WHERE m.part_number = [TABLE_NAME].part_number
);

-- 4. Re-enable trigger
ALTER TABLE [TABLE_NAME] ENABLE TRIGGER sync_[TABLE_NAME]_to_mayer;
```

## Related Files
- fix_jack_modules_import.sql - Comprehensive import fix with diagnostics
- QUICK_FIX_IMPORT_JACK_MODULES.sql - Simple 5-step import process
- fix_faceplates_import.sql - Faceplates-specific import fix
- QUICK_FIX_IMPORT_FACEPLATES.sql - Simple 5-step faceplates import
- DATABASE_DOCUMENTATION.md - Overall database structure documentation

Last Updated: June 17, 2025