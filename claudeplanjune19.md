# Claude's Plan - June 19, 2025
## Eliminating 2,500+ Lines of Hardcoded Detection Logic

### Current Performance Issue
- **Current**: 4011ms for searches (using complex JavaScript detection)
- **Target**: 5-50ms (using PostgreSQL full-text search)
- **Problem**: Still using old detection logic, not database-driven search

---

## Phase 1: Understand Current Performance (June 19, 2025)

### Where the 4011ms comes from:
1. **AI Analysis**: ~2000-3000ms (OpenAI GPT-4o-mini API call)
2. **Complex Detection Logic**: ~500-1000ms (JavaScript pattern matching)
3. **Database Queries**: ~200-500ms (multiple OR conditions)
4. **Post-processing**: ~200-300ms (filters, enrichment)

### Performance is measured in:
- `searchService.ts` (lines 1194-2005)
- Displayed in `PlecticAI-Optimized.tsx` (line 776)

---

## Phase 2: Create V2 Search Functions (June 20-21, 2025)

### Simple Database-Driven Search Pattern:
```typescript
// Replace 500+ lines with 50 lines
export async function searchProductV2(searchTerm: string, limit: number) {
  const { data, error } = await supabase
    .from('prod_[table_name]')
    .select('*')
    .textSearch('search_vector', searchTerm)
    .eq('is_active', true)
    .limit(limit)
  
  return { products: data || [], searchTime: 5-50ms }
}
```

### Implementation Order:
1. ✅ `prod_category_cables` - Has search_terms populated
2. ✅ `prod_fiber_cables` - Has search_terms populated  
3. ✅ `prod_fiber_connectors` - Has search_terms populated
4. ✅ `prod_jack_modules` - Has search_terms populated
5. ✅ `prod_modular_plugs` - Has search_terms populated
6. ✅ `prod_faceplates` - Has search_terms populated
7. ✅ `prod_surface_mount_boxes` - Has search_terms populated
8. ✅ `prod_adapter_panels` - Has search_terms populated
9. ✅ `prod_wall_mount_fiber_enclosures` - Has search_terms populated
10. ✅ `prod_rack_mount_fiber_enclosures` - Has search_terms populated

---

## Phase 3: Performance Testing (June 21, 2025)

### Create Performance Test Suite:
```typescript
// test-db-performance.ts
async function compareSearchPerformance() {
  // Test 1: Old detection logic (current)
  const oldTime = await measureOldSearch("cat6 cable")  // ~1000ms
  
  // Test 2: New database search
  const newTime = await measureNewSearch("cat6 cable")  // ~20ms
  
  console.log(`Speed improvement: ${oldTime/newTime}x faster`)
}
```

### Expected Results:
- Text search: 5-50ms ✅
- Old style: 500-1500ms ❌
- Improvement: 10-100x faster

---

## Phase 4: Gradual Migration (June 22-26, 2025)

### Option A: Feature Flag Approach
```typescript
const USE_V2_SEARCH = process.env.USE_V2_SEARCH === 'true'

if (USE_V2_SEARCH) {
  return searchCategoryCablesV2(options)  // Fast
} else {
  return searchCategoryCables(options)    // Current
}
```

### Option B: Shadow Mode (Recommended)
```typescript
// Run both searches in parallel
const [oldResult, newResult] = await Promise.all([
  searchCategoryCables(options),
  searchCategoryCablesV2(options)
])

// Log differences for monitoring
logSearchDivergence(oldResult, newResult)

// Return old result to users (safe)
return oldResult
```

---

## Phase 5: Decision Engine Integration (June 27-30, 2025)

### Enable Decision Engine Shadow Mode:
1. Set environment variable: `USE_DECISION_ENGINE=shadow`
2. Monitor at `/admin/decision-engine`
3. Track metrics:
   - Routing accuracy
   - Search success rate  
   - Performance improvement

### Decision Engine Benefits with V2:
- **Before**: Engine routes → Complex detection → Maybe finds product
- **After**: Engine routes → Database search → Always finds product

---

## Phase 6: Production Rollout (July 1-7, 2025)

### Rollout Checklist:
- [ ] All V2 search functions tested
- [ ] Performance metrics show 10-100x improvement
- [ ] Decision Engine shadow mode shows 95%+ accuracy
- [ ] Backup of old search code created
- [ ] Rollback plan documented

### Final State:
- **Code**: From 2,500+ lines → ~500 lines total
- **Performance**: From 1000ms → 20ms average
- **Maintenance**: Single pattern for all products
- **Learning**: Users can add search terms dynamically

---

## Critical Success Factors:

1. **Database Indexes**: Ensure GIN indexes on search_vector columns
2. **Search Terms**: Comprehensive terms in search_terms table
3. **Testing**: Shadow mode for at least 1 week
4. **Monitoring**: Track performance metrics continuously

---

## Next Immediate Steps (Today - June 19, 2025):

1. Run migration 018 to add "datacom" generic terms
2. Create test-db-performance.ts to measure current state
3. Build first V2 search function for category cables
4. Compare performance: old vs new
5. Document results in this file

---

**SAVE THIS PLAN** - Track progress daily!