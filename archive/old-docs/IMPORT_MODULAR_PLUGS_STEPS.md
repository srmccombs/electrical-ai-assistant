# Import Modular Plugs Data - Step by Step Guide

## Current Status
The modular plug search is now correctly routing to the modular_plugs table, but the table appears to be empty.

## Import Steps

### 1. Prepare the CSV
Ensure your CSV file (`/Users/stacymccombs/Downloads/modular_plugs_rows.csv`) has these columns:
- part_number
- brand
- short_description
- category_rating (as array, e.g., ["Cat5e","Cat6"])
- shielding_type
- conductor_awg
- packaging_qty
- packaging_type
- product_line
- common_terms
- pass_through_type
- supports_poe
- installation_tools_required
- is_active

**DO NOT** include: last_modified_by, created_by, created_at, updated_at

### 2. Disable Sync Trigger
Run this in Supabase SQL Editor:
```sql
ALTER TABLE modular_plugs DISABLE TRIGGER sync_modular_plugs_to_mayer;
```

### 3. Import CSV
Use Supabase Table Editor:
1. Go to Table Editor → modular_plugs
2. Click "Import data from CSV"
3. Upload your CSV file
4. Map columns appropriately

### 4. Sync to mayer_stock
After import, run this to sync new records:
```sql
-- Check what needs syncing
SELECT COUNT(*) as records_to_sync
FROM modular_plugs m
WHERE NOT EXISTS (
    SELECT 1 FROM mayer_stock ms 
    WHERE ms.part_number = m.part_number
);

-- Sync new records
INSERT INTO mayer_stock (
    part_number, brand, short_description, branch,
    second_item_number, qty_on_hand, qty_on_order,
    last_modified_by, created_by, created_at, updated_at, is_active
)
SELECT 
    m.part_number, m.brand, m.short_description, 'PENDING',
    UPPER(REPLACE(REPLACE(m.part_number, '-', ''), ' ', '')),
    0, 0, 'IMPORT', 'IMPORT', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, true
FROM modular_plugs m
WHERE NOT EXISTS (
    SELECT 1 FROM mayer_stock ms 
    WHERE ms.part_number = m.part_number
)
AND m.is_active = true;
```

### 5. Re-enable Trigger
```sql
ALTER TABLE modular_plugs ENABLE TRIGGER sync_modular_plugs_to_mayer;
```

### 6. Verify Import
```sql
-- Check import success
SELECT COUNT(*) as total_modular_plugs FROM modular_plugs WHERE is_active = true;

-- Check sample data
SELECT part_number, brand, short_description, category_rating
FROM modular_plugs
WHERE is_active = true
LIMIT 5;

-- Test RJ45 search
SELECT COUNT(*) as rj45_products
FROM modular_plugs
WHERE is_active = true
  AND (common_terms ILIKE '%rj45%' OR short_description ILIKE '%rj45%');
```

## Testing After Import
1. Search: "modular plugs" → Should show all modular plugs
2. Search: "rj45" → Should show RJ45 connectors
3. Search: "cat6 modular plug" → Should show Cat6 rated plugs
4. Search: "I need 20 modular plugs" → Should detect quantity and show results