# 🚀 Search Intelligence Migration Plan
## Moving from Code to Database - June 20, 2025

## Current State
- **500+ hardcoded terms** in `/search/shared/industryKnowledge.ts`
- **15+ detection functions** spread across search files
- **V2 search** only implemented for Category Cables
- **198+ search mappings** already in database (basic terms only)

## Migration Overview

### Phase 1: Pre-Migration Checks ✅
1. Run `00_check_migration_readiness.sql` to verify current state
2. Backup search_terms table
3. Ensure triggers remain DISABLED

### Phase 2: Database Schema Enhancement 🗄️
Run these SQL files in order:
1. **021_enhance_search_terms_table.sql**
   - Adds: detection_pattern, priority, redirect_to, context columns
   - Creates indexes for performance
   
2. **022_create_business_rules_tables.sql**
   - Creates specialized tables for different intelligence types
   - Includes: business_rules, detection_patterns, term_equivalencies

3. **023_migrate_search_intelligence_data.sql**
   - Populates all tables with hardcoded data from TypeScript
   - Includes all jacket types, colors, brands, patterns

4. **024_update_search_functions.sql**
   - Creates PostgreSQL functions to replace TypeScript logic
   - Includes: detect_jacket_type(), apply_business_rules(), etc.

### Phase 3: Testing & Verification 🧪
1. Test critical searches:
   - "4 boxes of Category 5e" → Should find Cat5e cables
   - "cat5 cable" → Should redirect to Cat5e
   - "smb" → Should find surface mount boxes
   - "panduit jack cat6" → Should find jack modules

2. Compare results between old and new implementation

### Phase 4: Deploy Updated Code 🚀
1. Deploy `SearchIntelligenceService.ts` 
2. Update search implementations to use new service
3. Keep V1 as fallback initially

## File Locations

### SQL Files to Run:
```
/migrations/021_enhance_search_terms_table.sql
/migrations/022_create_business_rules_tables.sql
/migrations/023_migrate_search_intelligence_data.sql
/migrations/024_update_search_functions.sql
```

### New TypeScript Files:
```
/search/shared/searchIntelligenceService.ts
/search/shared/industryKnowledgeV2.ts
```

### Testing Files:
```
/00_check_migration_readiness.sql
/check_search_terms_structure.sql
```

## Execution Commands

### Step 1: Check Readiness
```sql
-- Run in Supabase SQL Editor
-- Copy contents of 00_check_migration_readiness.sql
```

### Step 2: Run Migrations
```sql
-- Run each file in order in Supabase SQL Editor
-- 021, 022, 023, 024
```

### Step 3: Verify Success
```sql
-- Check enhanced search_terms
SELECT COUNT(*) FROM search_terms WHERE detection_pattern IS NOT NULL;

-- Check business rules
SELECT * FROM business_rules LIMIT 5;

-- Test a function
SELECT detect_jacket_type('plenum cable');
```

## Expected Outcomes

### Before Migration:
- Hardcoded logic in 15+ TypeScript files
- Code deployment needed for search updates
- No analytics on term usage

### After Migration:
- All intelligence in database tables
- Update search behavior with SQL
- Full analytics and A/B testing capability
- 10x faster updates

## Rollback Plan
If issues occur:
1. Keep original TypeScript files untouched
2. Service falls back to V1 implementation
3. Can disable new tables without breaking search

## Success Metrics
- ✅ All 500+ terms migrated to database
- ✅ Search results match or exceed V1 quality
- ✅ Performance remains under 100ms
- ✅ Non-developers can update search terms

---

**Ready to proceed?** Start with `00_check_migration_readiness.sql`!