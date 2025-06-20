# Fixes Applied on June 13, 2025

## Summary
This document outlines the fixes applied to resolve Surface Mount Box (SMB) search issues and related problems.

## Issues Fixed

### 1. Surface Mount Box Search Errors
**Problem**: SMB searches were returning 404 errors and "operator does not exist: text[] ~~* unknown"

**Root Cause**: 
- The `surface_mount_box` table was created but the code was still checking if it existed
- The `common_terms` field is an array type (text[]) and cannot be used with the `ilike` operator

**Fix Applied**:
- Removed table existence check since the table now exists
- Removed `common_terms` from all `ilike` search conditions
- Added fallback logic for when no search words remain after filtering

**Files Modified**:
- `/search/surfaceMountBoxes/surfaceMountBoxSearch.ts`

### 2. Faceplates Showing Surface Mount Boxes
**Problem**: When searching for faceplates, the results included surface mount boxes

**Root Cause**: The faceplates table contains products with `product_type` of both "Faceplate" and "Surface Mount Box"

**Fix Applied**:
- Added filter to exclude Surface Mount Box product types: `.not('product_type', 'ilike', '%Surface Mount Box%')`

**Files Modified**:
- `/search/faceplates/faceplateSearch.ts`

### 3. SMB Shopping List Context Not Working
**Problem**: When users had jack modules in their cart and searched for SMBs, the brand filter wasn't auto-applying

**Root Cause**: The keyword "smb" was not in the list of terms that trigger shopping list context

**Fix Applied**:
- Added "smb" to the `isSearchingForCompatibleProducts` keyword list
- The auto-apply filter logic was already in place and now works correctly

**Files Modified**:
- `/components/PlecticAI-Optimized.tsx`
- `/services/searchService.ts` (auto-apply filter logic was already there)

### 4. Cat6 STP Cable Search Broken
**Problem**: Searches for Cat6 STP (shielded) cables were not returning results

**Root Cause**: The shielding filter was only applied in post-processing, not at the database query level

**Fix Applied**:
- Added `query.eq('Shielding_Type', detectedShielding)` to database queries
- Updated both product line search and multi-criteria search strategies

**Files Modified**:
- `/search/categoryCables/categoryCableSearch.ts`

## Testing Recommendations

1. **SMB Search**: 
   - Search: "I need 10 SMB 1 port"
   - Expected: Returns surface mount boxes with 1 port

2. **Faceplate Search**:
   - Search: "I need 20 faceplates 2 port"
   - Expected: Returns only faceplates, no SMBs

3. **SMB with Shopping List**:
   - Add Panduit jacks to cart
   - Search: "I need 6 SMB 2 port"
   - Expected: Panduit brand filter auto-applies

4. **Cable Shielding**:
   - Search: "5000ft cat6 cable STP"
   - Expected: Returns only shielded (STP) cables

## Database Notes

- The `surface_mount_box` table has been created and populated
- The `common_terms` field is an array type and should not be used with text search operators
- The faceplates table contains mixed product types and requires filtering

## Future Considerations

1. Consider separating faceplates and SMBs into different tables
2. Implement full-text search properly for array fields
3. Add more comprehensive integration tests to catch these issues earlier