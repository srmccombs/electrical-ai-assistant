# Faceplate Shopping List Context Fix - June 17, 2025

## Problem Summary
The faceplate search was not receiving shopping list context, preventing it from automatically filtering results based on jack modules already in the shopping list. Additionally, the tsquery sanitization was creating invalid search strings when common words were removed.

## Changes Made

### 1. Updated searchService.ts
- Added `shoppingListContext` parameter when calling `searchFaceplatesImpl` (line 1338)
- Added `shoppingListContext` parameter when calling `searchSurfaceMountBoxesImpl` (line 1350)

### 2. Updated faceplateSearch.ts
- Added `shoppingListContext` to the `FaceplateSearchOptions` interface
- Added logic to extract brand and product line information from jack modules in the shopping list
- When no AI-detected brand/product line exists, the search now uses shopping list context to filter faceplates
- Added comprehensive logging for debugging compatibility filtering

### 3. Updated surfaceMountBoxSearch.ts
- Added `shoppingListContext` to the `SurfaceMountBoxSearchOptions` interface
- Updated function signature to accept the shopping list context

### 4. Fixed tsquery sanitization in searchUtils.ts
- Improved the `sanitizeForTsquery` function to handle edge cases better
- Added "i" to the list of problem words to filter out
- Enhanced fallback logic to extract meaningful product terms
- Added cleanup for special characters that could cause tsquery issues
- Ensures the function always returns a valid tsquery string

## How It Works Now

1. When searching for faceplates with jack modules in the shopping list:
   - The system extracts unique brands and product lines from the jacks
   - If AI doesn't detect brand/product line, it uses the shopping list context
   - Applies brand filtering directly in the database query
   - Uses post-filtering for product line matching

2. The tsquery sanitization now properly handles queries like "i need face plates" by:
   - Removing common words like "i", "need", "the", etc.
   - Extracting meaningful product terms
   - Falling back to safe defaults when needed

## Testing
The changes have been successfully built with `npm run build`. The implementation is TypeScript strict mode compliant.

## Benefits
- Faceplates are now automatically filtered for compatibility when jack modules are in the cart
- Better search results for users with specific brand/product line requirements
- Fixed tsquery errors that were causing search failures
- Improved user experience with automatic compatibility matching