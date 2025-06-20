# Dynacom Jack Faceplate Compatibility Fix - UPDATED

## Problem
Dynacom jacks were not showing compatible faceplates when selected, even though they have "Keystone" in their `compatible_faceplates` field.

## Root Causes Found
1. The faceplate search was not using the `compatible_faceplates` field from jack modules
2. AI was detecting "Dynacom" as the brand for faceplates (wrong - should look for Keystone faceplates)
3. The search was trying brand AND product line matching, failing when no Dynacom faceplates exist
4. Duplicate key warnings due to duplicate part numbers in results
5. tsquery errors with certain search terms

## Solutions Implemented

### 1. Enhanced Shopping List Context Extraction
Updated `faceplateSearch.ts` to extract and use the `compatible_faceplates` field:
- Parses the field value (handles formats like "Keystone", "{Keystone}", "Keystone, Mini-Com")
- Removes curly braces if present
- Splits comma-separated values
- Adds these values to the product line filter

### 2. Fixed AI Brand Detection Override
- Detects when AI's brand matches a jack brand in the shopping list
- Recognizes this as a compatibility search (not a brand search)
- Clears the brand filter and uses only product line compatibility
- This prevents searching for "Dynacom faceplates" when we want "Keystone faceplates"

### 3. Enhanced Product Line Matching
- Searches both `product_line` and `type` fields for compatibility
- Special handling for "Keystone" to check multiple fields
- This catches faceplates that might have "Keystone" in different fields

### 4. Fixed Duplicate Key Warning
- Updated ProductTable component to include index in key generation
- Changed from `${tableName}-${partNumber}` to `${tableName}-${partNumber}-${index}`

### 5. Improved Fallback Search
- Removes "datacom" from search terms (not relevant for faceplates)
- Better handling of tsquery syntax errors

## Testing Instructions

1. Clear your shopping list
2. Search for "cat6 jacks" and add some Dynacom jacks
3. Search for "face plates" or "i need 20 face plates"
4. Verify that Keystone faceplates appear in the results
5. Check console - no more duplicate key warnings
6. Also test with Panduit and Hubbell jacks to ensure they still work

## Data Format Notes

Your CSV can use any of these formats for the `compatible_faceplates` field:
- `Keystone` (simple value) ✓ Your current format works!
- `{Keystone}` (with braces)
- `Keystone, Mini-Com` (comma-separated)
- `{Keystone}, {Mini-Com}` (comma-separated with braces)

The code will handle all these formats correctly.

## Files Modified
- `/search/faceplates/faceplateSearch.ts` - Added compatibility logic and AI override detection
- `/components/PlecticAI/ProductTable.tsx` - Fixed duplicate key warnings

Created: June 17, 2025