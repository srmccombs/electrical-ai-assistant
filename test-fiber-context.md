# Fiber Cable Shopping List Context Test Plan

## Test Scenarios

### Scenario 1: OM3 Fiber Cable in Cart
1. Add OM3 fiber cable to shopping list
2. Search for "fiber connectors" 
3. Expected: OM3/Multimode connectors should appear first

### Scenario 2: OS2 Fiber Cable in Cart  
1. Add OS2 fiber cable to shopping list
2. Search for "LC connectors"
3. Expected: OS2/Singlemode LC connectors should appear first

### Scenario 3: Mixed Fiber Types
1. Add both OM4 and OS1 fiber cables to shopping list
2. Search for "fiber connectors"
3. Expected: Both OM4 and OS1 compatible connectors should be prioritized

### Scenario 4: Brand + Fiber Type Context
1. Add Corning OM3 fiber cable to shopping list
2. Search for "Corning fiber connectors"
3. Expected: Corning OM3 connectors should appear first

### Scenario 5: No Fiber Cables in Cart
1. Clear shopping list
2. Search for "fiber connectors"
3. Expected: Standard search results without fiber type prioritization

## Implementation Summary

### Files Modified:
1. `/types/search.ts` - Added fiberCables to SearchOptions interface
2. `/components/PlecticAI-Optimized.tsx` - Added fiber cable collection and context passing
3. `/app/api/ai-search/route.js` - Added fiber cable context to AI prompt
4. `/config/constants.ts` - Added FIBER_TYPE_MAPPING for compatibility
5. `/search/fiberConnectors/fiberConnectorSearch.ts` - Enhanced to use shopping list context
6. `/services/searchService.ts` - Updated to pass shopping list context to fiber connector search

### Key Features:
- Automatically detects fiber cables in shopping list
- Passes fiber type context to AI for better analysis
- Prioritizes matching fiber types in search results
- Maintains compatibility with existing search functionality
- Works for both direct connector searches and brand searches