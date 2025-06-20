# Dynacom Faceplates Import Checklist

## Required Column Values:

1. **is_active** = `true` (not NULL, not empty)

2. **compatible_jacks** = For Keystone product line faceplates:
   - Format: `{Keystone}` or `{Keystone,Dynacom}`
   - This is PostgreSQL array format with curly braces
   - Multiple values separated by commas: `{Keystone,value2,value3}`

3. **product_line** = `Keystone` (for Keystone-compatible faceplates)

4. **brand** = `Dynacom` (exact case)

5. **search_vector** = Can be NULL (will be auto-generated)

## Example CSV row:
```
part_number,brand,product_line,is_active,compatible_jacks,short_description,...
DYN-FP-2K-WH,Dynacom,Keystone,true,"{Keystone}","2 Port Keystone Faceplate White",...
```

## Before Import:
1. Delete existing Dynacom faceplates:
   ```sql
   DELETE FROM faceplates WHERE brand = 'Dynacom';
   ```

2. Use the fix_faceplates_import.sql script after importing

## Important Notes:
- Make sure is_active is `true` not `TRUE` or `1`
- Compatible_jacks needs curly braces for array format
- Don't leave any columns as NULL that should have values
- If you have non-Keystone Dynacom faceplates, adjust compatible_jacks accordingly