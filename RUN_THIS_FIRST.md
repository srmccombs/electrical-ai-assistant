# 🚀 Search Intelligence Migration - Quick Start Guide

## What to Run First (In Order)

### 1. Fix Immediate Search Issue (2 minutes)
**File**: `FIX_CATEGORY_5E_SEARCH.sql`
- Fixes "4 boxes of Category 5e" returning 0 results
- Adds proper search term mappings
- Updates common_terms for all Cat5e products

### 2. Check Current State (1 minute)
**File**: `00_check_migration_readiness.sql`
- Shows current database structure
- Verifies search_terms table
- Checks product health

### 3. Quick Intelligence Migration (5 minutes)
**File**: `QUICK_INTELLIGENCE_MIGRATION.sql`
- Adds most critical intelligence to database:
  - Cat5 → Cat5e redirects
  - SMB → surface mount box redirects
  - Jacket type mappings (plenum, riser, etc.)
  - Brand synonyms (pan → Panduit)
  - Color abbreviations
- Creates necessary indexes

### 4. Full Migration (If Needed) (15-20 minutes)
Run these in order from `/migrations/` folder:
1. `021_enhance_search_terms_table.sql`
2. `022_create_business_rules_tables.sql`
3. `023_migrate_search_intelligence_data.sql`
4. `024_update_search_functions.sql`

## How to Run in Supabase

1. Go to your Supabase Dashboard
2. Click on "SQL Editor" in the left sidebar
3. Copy the contents of each SQL file
4. Paste into the SQL editor
5. Click "Run" button
6. Check for success messages

## What Each File Does

### FIX_CATEGORY_5E_SEARCH.sql
- **Purpose**: Immediate fix for Category 5e searches
- **Impact**: "4 boxes of Category 5e" will find products
- **Time**: < 1 minute

### QUICK_INTELLIGENCE_MIGRATION.sql
- **Purpose**: Moves most common search intelligence to database
- **Impact**: Redirects, synonyms, and mappings work from database
- **Time**: < 2 minutes

### Full Migration (021-024)
- **Purpose**: Complete intelligence migration
- **Impact**: All 500+ terms and patterns in database
- **Time**: 15-20 minutes total

## Testing After Migration

Test these searches:
1. "4 boxes of Category 5e" → Should find Cat5e cables
2. "cat5 cable" → Should redirect to Cat5e
3. "plenum cat6" → Should find plenum-rated Cat6 cables
4. "panduit jack" → Should find Panduit jacks
5. "smb" → Should find surface mount boxes

## Success Indicators

✅ Search terms table has 300+ rows (up from 198)
✅ Category 5e searches return products
✅ Redirects work (cat5 → cat5e)
✅ All test searches return relevant results

## If Something Goes Wrong

The migrations are designed to be safe:
- They use `IF NOT EXISTS` clauses
- They use `ON CONFLICT DO NOTHING`
- Original data is preserved
- Can be rolled back if needed

---

**Ready?** Start with `FIX_CATEGORY_5E_SEARCH.sql` for immediate improvement!