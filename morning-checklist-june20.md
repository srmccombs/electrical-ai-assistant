# Morning Checklist - June 20, 2025

## 🌅 Quick Start Tasks (Do These First!)

### 1. Run Pending Migration
```bash
# Run migration 018 to add datacom generic terms
psql $DATABASE_URL < migrations/018_add_datacom_generic_terms.sql
```

### 2. Test V2 Search Performance
Visit: http://localhost:3000/test-search-performance
- Compare V1 vs V2 speeds
- Look for the 10-100x speedup (target: 5-50ms)
- Screenshot the results for documentation

### 3. Quick V2 Search Tests
Test these searches to ensure V2 is working:
- "Category 5e" → Should return 154 products
- "Category 6" → Should return 431 products  
- "Category 6A" → Should return 252 products
- "Panduit Cat6" → Should filter by brand
- "7131100" → Part number search

## 📋 Main Development Tasks

### 1. Create V2 Search Functions for Remaining Product Types
Following the pattern in `categoryCableSearchV2.ts`, create V2 versions for:

- [ ] **Fiber Cables** (`/search/fiberCables/fiberCableSearchV2.ts`)
- [ ] **Fiber Connectors** (`/search/fiberConnectors/fiberConnectorSearchV2.ts`)
- [ ] **Jack Modules** (`/search/jackModules/jackModuleSearchV2.ts`)
- [ ] **Faceplates** (`/search/faceplates/faceplateSearchV2.ts`)
- [ ] **Surface Mount Boxes** (`/search/surfaceMountBoxes/surfaceMountBoxSearchV2.ts`)
- [ ] **Fiber Enclosures** (`/search/fiberenclosure/`)
  - [ ] Wall Mount (`wall_mount_fiber_enclosure_SearchV2.ts`)
  - [ ] Rack Mount (`rack_mount_fiber_enclosure_SearchV2.ts`)
- [ ] **Adapter Panels** (`/search/fiberadapterPanels/fiberadapterPanelSearchV2.ts`)
- [ ] **Modular Plugs** (`/search/modularPlugs/modularPlugSearchV2.ts`)

### 2. Create Router Files for Each Product Type
For each product type, create an `index.ts` that routes between V1 and V2:
```typescript
const useV2 = process.env.NEXT_PUBLIC_USE_V2_SEARCH === 'true'
if (useV2) {
  return searchProductTypeV2(options)
}
return searchProductTypeV1(options)
```

### 3. Update Service Imports
Update `/services/searchService.ts` to import from the new router files instead of direct implementations.

## 🚀 Decision Engine Tasks

### 1. Enable Shadow Mode
Add to your `.env.local`:
```
USE_DECISION_ENGINE=shadow
```

### 2. Deploy and Monitor
- Visit `/admin/decision-engine` to see shadow mode results
- Look for any divergences between old and new engine
- Document any issues found

## 📊 Performance Testing

### 1. Run Comprehensive Tests
Create a test script that searches for:
- All category ratings (Cat5e, Cat6, Cat6A)
- All major brands
- Common part numbers
- Complex queries with multiple specifications

### 2. Document Results
Track in a spreadsheet:
- Query
- V1 Time (ms)
- V2 Time (ms)
- Result Count
- Speedup Factor

## 🎯 Success Criteria

By end of day, you should have:
1. ✅ All V2 search functions created
2. ✅ Router files switching between V1 and V2
3. ✅ Performance improvement verified (5-50ms target)
4. ✅ Decision Engine running in shadow mode
5. ✅ All tests passing with consistent results

## 💡 Quick Reference

### V2 Search Pattern
```typescript
// Simple OR query across all relevant columns
.or(`part_number.ilike.%${searchTerm}%,short_description.ilike.%${searchTerm}%,computed_search_terms.ilike.%${searchTerm}%`)
.eq('is_active', true)
.limit(limit)
```

### Table Name Reference
- `prod_category_cables`
- `prod_fiber_cables`
- `prod_fiber_connectors`
- `prod_adapter_panels`
- `prod_jack_modules`
- `prod_modular_plugs`
- `prod_faceplates`
- `prod_surface_mount_boxes`
- `prod_wall_mount_fiber_enclosures`
- `prod_rack_mount_fiber_enclosures`

### Common Issues & Fixes
1. **0 results** → Check `is_active = true`
2. **Slow performance** → Ensure GIN indexes exist
3. **Missing products** → Check data standardization
4. **Wrong table** → Verify `prod_` prefix

## 📞 Questions to Ask Yourself

1. Are all migrations run successfully?
2. Is V2 search consistently faster than V1?
3. Are result counts the same or better?
4. Is the Decision Engine logging properly?
5. Are all product types covered?

## 🎉 When Complete

1. Update CLAUDE.md with completion status
2. Create performance report showing speedups
3. Plan production rollout timeline
4. Celebrate the 100x performance improvement! 🚀

---

Remember: The goal is to eliminate 2,500+ lines of complex JavaScript detection logic and replace it with simple, fast database queries. You're almost there!