# Fiber Enclosure & Adapter Panel Compatibility Test

## Test Scenarios

### 1. Panel Capacity Search
- Search: "6 panel fiber enclosure"
- Expected: Should show enclosures with exactly 6 panels, or if none exist, show the next size up (e.g., 8 panels)

### 2. Compatibility Flow
1. Add a fiber enclosure to shopping list (e.g., rack mount with CCH panel type)
2. Search for "adapter panels" 
3. Expected: Results should be filtered to only show adapter panels with matching panel_type (CCH)

### 3. Wall Mount Panel Capacity
- Search: "4 panel wall mount fiber enclosure"
- Expected: Wall mount enclosures with 4 panel capacity, or next size up

## Implementation Details

### Updated Files:
1. `/search/fiberadapterPanels/fiberadapterPanelSearch.ts`
   - Added shopping list context support
   - Filters by panel_type when fiber enclosures are in shopping list

2. `/search/fiberenclosure/rack_mount_fiber_enclosure_Search.ts`
   - Added panel capacity detection
   - Implements "next size up" logic

3. `/search/fiberenclosure/wall_mount_fiber_enclosure_Search.ts`
   - Added panel capacity detection
   - Implements "next size up" logic

4. `/types/search.ts`
   - Added fiberEnclosures to SearchOptions interface

5. `/services/searchService.ts`
   - Passes shopping list context to adapter panel search

6. `/components/PlecticAI.tsx`
   - Extracts fiber enclosures from shopping list
   - Includes them in search context

## How It Works

1. **Panel Capacity Matching**:
   - Detects patterns like "6 panel", "4 panel enclosure"
   - First searches for exact match
   - If no exact match, finds next size up (e.g., request 6, show 8, not 12)

2. **Compatibility Matching**:
   - Fiber enclosures have `panel_type` field (CCH, FAP, etc.)
   - Adapter panels also have `panel_type` field
   - When fiber enclosure is in shopping list, adapter panel search filters by matching panel_type

3. **Bidirectional Compatibility**:
   - Works like jack modules and faceplates
   - Ensures users get compatible products automatically