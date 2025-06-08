# Search Flow Example: "I need 1200 ft of OM4 fiber"

## 🎯 Complete Search Flow Diagram

```
USER TYPES: "I need 1200 ft of OM4 fiber"
                    │
                    ▼
┌──────────────────────────────────────┐
│ 1. FRONTEND (PlecticAI.tsx)          │
│   • Shows AI loading animation       │
│   • Disables input during search     │
│   • Calls searchProducts()           │
└──────────────────────────────────────┘
                    │
                    ▼
┌──────────────────────────────────────┐
│ 2. VALIDATION (searchService.ts)     │
│   • validateElectricalQuery()        │
│   • Checks query isn't malicious     │
│   • Applies business rules           │
│   • No Cat5→Cat5e redirect needed    │
└──────────────────────────────────────┘
                    │
                    ▼
┌──────────────────────────────────────┐
│ 3. PART NUMBER CHECK                 │
│   • detectPartNumbers()              │
│   • Not a part number format         │
│   • Continues to AI analysis         │
└──────────────────────────────────────┘
                    │
                    ▼
┌──────────────────────────────────────┐
│ 4. AI ANALYSIS (/api/ai-search)      │
│   • Sends to OpenAI GPT-4o-mini     │
│   • AI Response:                     │
│   {                                  │
│     "productType": "CABLE",          │
│     "searchStrategy": "cables",      │
│     "confidence": 0.95,              │
│     "detectedSpecs": {               │
│       "fiberType": "OM4",            │
│       "requestedQuantity": 1200,     │
│       "fiberCount": null             │
│     },                               │
│     "searchTerms": ["OM4", "fiber"], │
│     "reasoning": "User needs fiber   │
│      cable with OM4 specification"   │
│   }                                  │
└──────────────────────────────────────┘
                    │
                    ▼
┌──────────────────────────────────────┐
│ 5. TABLE ROUTING (searchService.ts)  │
│   • determineTargetTable()           │
│   • Sees "ft" + "fiber" + AI says   │
│     productType: "CABLE"             │
│   • Routes to: fiber_cables table    │
└──────────────────────────────────────┘
                    │
                    ▼
┌──────────────────────────────────────┐
│ 6. FIBER CABLE SEARCH                │
│ (searchFiberCables.ts)               │
│   • Builds PostgreSQL query:         │
│     SELECT * FROM fiber_optic_cable  │
│     WHERE search_vector @@            │
│     plainto_tsquery('OM4 fiber')     │
│   • Filters: fiber_category ILIKE    │
│     '%OM4%' OR '%50/125%'            │
│   • Orders by relevance              │
└──────────────────────────────────────┘
                    │
                    ▼
┌──────────────────────────────────────┐
│ 7. RESULTS PROCESSING                │
│   • 15 OM4 cables found              │
│   • Formats each product:            │
│     - Part number, brand, description│
│     - Stock status (red/yellow/green)│
│     - Fiber count options            │
│     - Jacket ratings                 │
│   • Generates smart filters          │
└──────────────────────────────────────┘
                    │
                    ▼
┌──────────────────────────────────────┐
│ 8. UI DISPLAY (PlecticAI.tsx)        │
│   • Shows "Found 15 products in 45ms"│
│   • Displays product table           │
│   • Smart Filters shown:             │
│     - Brands: Corning, Panduit       │
│     - Fiber Counts: 12, 24, 48, 72  │
│     - Jackets: Plenum, Riser, OSP   │
│   • When user clicks "Add":          │
│     - Quantity pre-filled as 1200    │
└──────────────────────────────────────┘
```

## 🤖 AI Value Addition

### What AI Extracted:
1. **Intent**: "I need" → purchase intent
2. **Quantity**: 1200 (numeric value)
3. **Unit**: "ft" → feet of cable
4. **Product Type**: "fiber" → fiber optic cable
5. **Specification**: "OM4" → multimode 50/125

### How AI Improved Search:
- **Natural Language**: User didn't need to know exact product codes
- **Quantity Intelligence**: Extracted 1200 for pre-filling orders
- **Context Understanding**: Knew "ft" meant cable, not connectors
- **Specification Mapping**: OM4 → searches for 50/125 multimode

### Without AI:
- User must search: "fiber optic cable OM4"
- No quantity extraction
- Might miss products labeled differently
- No intelligent routing to correct table

## 📊 Actual Code Execution Path

1. **PlecticAI.tsx:473** - `handleSubmit()`
2. **searchService.ts:920** - `searchProducts()`
3. **searchService.ts:943** - `validateElectricalQuery()`
4. **searchService.ts:954** - `applyBusinessRules()`
5. **searchService.ts:958** - `detectPartNumbers()`
6. **searchService.ts:259** - `getAIAnalysis()`
7. **ai-search/route.js:19** - `POST()` to OpenAI
8. **searchService.ts:1000** - `determineTargetTable()`
9. **searchService.ts:1042** - Routes to fiber cable search
10. **fiberCableSearch.ts** - Executes database query
11. **searchService.ts:1189** - `generateSmartFilters()`
12. **PlecticAI.tsx:526** - Displays results

## 🎯 Business Impact

### Search Time Comparison:
- **Traditional Search**: 2-5 minutes
  - Navigate to fiber section
  - Filter by type
  - Find OM4 products
  - Check each for availability
  
- **Plectic AI**: 3 seconds
  - Type natural language
  - Get filtered results
  - See all options immediately

### Error Reduction:
- **Quantity Capture**: AI extracts "1200 ft" preventing order errors
- **Correct Products**: OM4 filter ensures compatible products
- **Smart Filters**: Further refine without new searches

### Sales Efficiency:
- **Faster Quotes**: 45ms search vs manual lookup
- **Better Discovery**: Shows all OM4 options, not just familiar ones
- **Cross-Sell**: Related products suggested