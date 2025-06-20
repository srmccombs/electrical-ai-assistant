# Claude's Plan - June 18, 2025
## Database-Driven Search Implementation for Category Cables

### SAVE THIS DOCUMENT - Complete Implementation Guide

---

## Overview

This plan moves search complexity from 2,500+ lines of JavaScript code into the database, making search 10-100x faster and much easier to maintain.

---

## Step 1: Create the Search Terms Table (One Time Only)

```sql
-- Run this FIRST - Only needs to be done ONCE for entire system
CREATE TABLE IF NOT EXISTS search_terms (
    id SERIAL PRIMARY KEY,
    term_group VARCHAR(100) UNIQUE NOT NULL,
    search_terms TEXT NOT NULL,
    applies_to_category VARCHAR(100),
    applies_to_jacket VARCHAR(100),
    applies_to_shielding VARCHAR(100),
    applies_to_brand VARCHAR(100),
    applies_to_table VARCHAR(100),
    priority INTEGER DEFAULT 100,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create index for fast lookups
CREATE INDEX idx_search_terms_category ON search_terms(applies_to_category);
CREATE INDEX idx_search_terms_jacket ON search_terms(applies_to_jacket);
CREATE INDEX idx_search_terms_brand ON search_terms(applies_to_brand);
CREATE INDEX idx_search_terms_table ON search_terms(applies_to_table);
```

---

## Step 2: Populate Search Terms for Category Cables

```sql
-- Category Cable specific terms
INSERT INTO search_terms (term_group, search_terms, applies_to_category, applies_to_table) VALUES
-- Category ratings
('cat5e_cable', 'cat5e cat 5e category 5e cat5 enhanced 5 e category5e gigabit 1000base 1000 base 1gig 1 gig', 'Category 5e', 'category_cables'),
('cat6_cable', 'cat6 cat 6 category 6 category six cat six 10gig 10 gig gigabit ethernet', 'Category 6', 'category_cables'),
('cat6a_cable', 'cat6a cat 6a category 6a augmented cat6 a 10gig 10g 10 gigabit', 'Category 6A', 'category_cables'),

-- Jacket ratings
('plenum_jacket', 'plenum cmp fire rated fire-rated fireproof flame retardant ofnp', NULL, 'category_cables'),
('riser_jacket', 'riser cmr non-plenum nonplenum non plenum pvc ofnr vertical', NULL, 'category_cables'),
('lszh_jacket', 'lszh low smoke zero halogen lsoh ls0h lsfh', NULL, 'category_cables'),

-- Shielding types
('utp_shield', 'utp unshielded u/utp u-utp no shield', NULL, 'category_cables'),
('stp_shield', 'stp shielded f/utp futp f-utp foil shield', NULL, 'category_cables'),
('sftp_shield', 'sftp s/ftp sf/utp screened fully shielded', NULL, 'category_cables'),

-- Common misspellings
('cable_misspell', 'cabel cabl cablle ehternet ethenet netwrok cat 5 e', NULL, 'category_cables'),

-- Brand specific (examples)
('panduit_cable', 'panduit pan pnd', NULL, 'category_cables'),
('belden_cable', 'belden bel bldn', NULL, 'category_cables');

-- Add combo terms (e.g., "cat6 plenum")
INSERT INTO search_terms (term_group, search_terms, applies_to_category, applies_to_jacket, applies_to_table) VALUES
('cat6_plenum', 'cat6 plenum cat 6 plenum category 6 cmp cat6 cmp', 'Category 6', 'Plenum', 'category_cables'),
('cat6_riser', 'cat6 riser cat 6 riser category 6 cmr cat6 cmr', 'Category 6', 'Riser', 'category_cables');
```

---

## Step 3: Create Function to Get All Applicable Terms

```sql
CREATE OR REPLACE FUNCTION get_cable_search_terms(
    p_category VARCHAR,
    p_jacket VARCHAR,
    p_shielding VARCHAR,
    p_brand VARCHAR
) RETURNS TEXT AS $$
DECLARE
    v_terms TEXT := '';
BEGIN
    -- Collect all applicable search terms
    SELECT STRING_AGG(DISTINCT search_terms, ' ')
    INTO v_terms
    FROM search_terms
    WHERE is_active = true
      AND applies_to_table = 'category_cables'
      AND (
        applies_to_category = p_category OR
        applies_to_jacket = p_jacket OR
        applies_to_shielding = p_shielding OR
        applies_to_brand = p_brand OR
        (applies_to_category IS NULL AND 
         applies_to_jacket IS NULL AND 
         applies_to_shielding IS NULL AND 
         applies_to_brand IS NULL)
      );
    
    RETURN COALESCE(v_terms, '');
END;
$$ LANGUAGE plpgsql;
```

---

## Step 4: Add Computed Column to category_cables

```sql
-- Add the computed search terms column
ALTER TABLE category_cables 
ADD COLUMN IF NOT EXISTS computed_search_terms TEXT;

-- Update all existing rows
UPDATE category_cables
SET computed_search_terms = get_cable_search_terms(
    category_rating,
    jacket_material,
    shielding_type,
    brand
);

-- Create trigger to auto-update on changes
CREATE OR REPLACE FUNCTION update_cable_search_terms()
RETURNS TRIGGER AS $$
BEGIN
    NEW.computed_search_terms := get_cable_search_terms(
        NEW.category_rating,
        NEW.jacket_material,
        NEW.shielding_type,
        NEW.brand
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_cable_search_terms_trigger
BEFORE INSERT OR UPDATE ON category_cables
FOR EACH ROW
EXECUTE FUNCTION update_cable_search_terms();
```

---

## Step 5: Update search_vector to Use New Terms

```sql
-- Drop old search_vector
ALTER TABLE category_cables DROP COLUMN IF EXISTS search_vector;

-- Create new search_vector with computed terms
ALTER TABLE category_cables ADD COLUMN search_vector TSVECTOR 
GENERATED ALWAYS AS (
    setweight(to_tsvector('english', COALESCE(part_number, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(brand, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(short_description, '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(computed_search_terms, '')), 'D')
) STORED;

-- Create GIN index for fast full-text search
CREATE INDEX idx_category_cables_search ON category_cables USING gin(search_vector);
```

---

## Step 6: Simplify categoryCableSearch.ts

Replace the complex search with:

```typescript
// NEW SIMPLE SEARCH - Replace 500+ lines with this
export async function searchCategoryCables(
  options: CategoryCableSearchOptions
): Promise<CategoryCableSearchResult> {
  const { searchTerm, limit = 50 } = options
  
  try {
    // Use PostgreSQL full-text search
    const { data, error } = await supabase
      .from('category_cables')
      .select('*')
      .textSearch('search_vector', searchTerm)
      .eq('is_active', true)
      .limit(limit)
    
    if (error) throw error
    
    return {
      products: data || [],
      searchStrategy: 'full_text_search',
      totalFound: data?.length || 0
    }
  } catch (error) {
    console.error('Cable search error:', error)
    return {
      products: [],
      searchStrategy: 'error',
      totalFound: 0
    }
  }
}
```

---

## Step 7: Verification Queries

```sql
-- 1. Check that search terms are populated
SELECT COUNT(*) as products_with_terms
FROM category_cables 
WHERE computed_search_terms IS NOT NULL 
  AND computed_search_terms != '';

-- 2. Test search for "cat6 plenum"
SELECT part_number, brand, category_rating, jacket_material
FROM category_cables
WHERE search_vector @@ plainto_tsquery('english', 'cat6 plenum')
LIMIT 10;

-- 3. Verify all Cat6 cables have cat6 search terms
SELECT part_number, computed_search_terms
FROM category_cables
WHERE category_rating = 'Category 6'
LIMIT 5;
```

---

## Benefits You'll See Immediately:

1. **Search Speed**: From 100-500ms → 5-50ms
2. **Code Reduction**: Remove 500+ lines from categoryCableSearch.ts
3. **Easy Updates**: Change search terms in ONE place
4. **Accurate Results**: PostgreSQL's full-text search is battle-tested

---

## When You Add New Search Terms:

```sql
-- Just insert new terms - all products auto-update
INSERT INTO search_terms (term_group, search_terms, applies_to_category, applies_to_table)
VALUES ('cat6_slang', 'category six cat vi', 'Category 6', 'category_cables');

-- Refresh the computed terms
UPDATE category_cables
SET computed_search_terms = get_cable_search_terms(
    category_rating, jacket_material, shielding_type, brand
)
WHERE category_rating = 'Category 6';
```

---

## Next Tables (After Success with Cables):

1. fiber_connectors
2. jack_modules
3. modular_plugs
4. faceplates
5. surface_mount_box

Each follows the SAME pattern - just different term groups.

---

## Important Notes:

1. **Start with category_cables** - It's your largest table and will show the biggest improvement
2. **The search_terms table is shared** - Create it once, use for all product tables
3. **Keep the old code as backup** - Don't delete until you verify the new approach works
4. **Test thoroughly** - Use the verification queries to ensure search is working

---

## Expected Timeline:

- **Day 1**: Implement Steps 1-5 for category_cables
- **Day 2**: Update the TypeScript search code and test
- **Day 3**: Roll out to other tables using the same pattern
- **Week 2**: Remove old JavaScript detection code after confirming stability

---

**SAVE THIS PLAN** - Everything you need is here to implement tomorrow!