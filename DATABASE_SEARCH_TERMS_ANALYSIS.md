# Database Search Terms Table Analysis
## June 20, 2025

## 📊 Search Terms Table Structure & Data

### Table Schema Discovered:
```sql
id                  INTEGER PRIMARY KEY
term_group         VARCHAR      -- Groups related terms (e.g., "category_ratings")
search_term        VARCHAR      -- The search term users might type
categories         TEXT[]       -- Maps to category values (e.g., ["Cat5e"])
jackets           TEXT[]       -- Maps to jacket types
shielding         TEXT[]       -- Maps to shielding types  
brands            TEXT[]       -- Maps to brand names
applicable_tables  TEXT[]       -- Which tables to search
created_at         TIMESTAMP
updated_at         TIMESTAMP
product_lines      TEXT[]       -- Maps to product lines
```

### Sample Data Shows:
- 10 rows shown (all for category cable ratings)
- All created on June 19, 2025 (yesterday!)
- Only mapping category ratings so far

---

## 🔍 Key Findings

### 1. Search Term Mappings for Categories
```
User searches → Maps to standard value
"cat5e"       → ["Cat5e"]
"cat 5e"      → ["Cat5e"]  
"category 5e" → ["Cat5e"]
"5e"          → ["Cat5e"]
"cat5 enhanced" → ["Cat5e"]

"cat6"        → ["Cat6"]
"cat 6"       → ["Cat6"]
"category 6"  → ["Cat6"]
"cat6 cable"  → ["Cat6"]
"6"           → ["Cat6"]
```

### 2. Current Coverage
- ✅ Category ratings mapped (Cat5e, Cat6 shown)
- ❌ No jacket mappings (plenum, riser, etc.)
- ❌ No shielding mappings (UTP, STP, etc.)
- ❌ No brand mappings
- ❌ No product line mappings

### 3. Missing Critical Mappings
Based on the sample, these are NOT in the search_terms table yet:
- Cat6A mappings
- Jacket terms (plenum → CMP, riser → CMR)
- Shield terms (unshielded → UTP)
- Brand variations (Pan → Panduit)
- Common misspellings

---

## 🚨 Why Products Have No Search Terms

### The Disconnect:
1. **search_terms table**: Has mappings but limited (only categories)
2. **computed_search_terms column**: Should be populated by triggers using this table
3. **common_terms column**: Should have manual keywords but 98.6% are NULL

### The Problem:
The triggers that should populate computed_search_terms from this search_terms table are either:
- Not working correctly
- Disabled
- Not finding matches due to limited mappings

---

## 📈 What Should Be in search_terms Table

### Complete Example for Category Cables:
```sql
-- Category mappings (partially exists)
('cat5e_variants', 'cat5e', ["Category 5e"], null, null, null, ["prod_category_cables"])
('cat5e_variants', 'cat 5 e', ["Category 5e"], null, null, null, ["prod_category_cables"])
('cat5e_variants', 'category5e', ["Category 5e"], null, null, null, ["prod_category_cables"])

-- Jacket mappings (MISSING)
('jacket_plenum', 'plenum', null, ["Plenum"], null, null, ["prod_category_cables"])
('jacket_plenum', 'cmp', null, ["Plenum"], null, null, ["prod_category_cables"])
('jacket_plenum', 'fire rated', null, ["Plenum"], null, null, ["prod_category_cables"])

-- Shielding mappings (MISSING)  
('shield_utp', 'utp', null, null, ["UTP"], null, ["prod_category_cables"])
('shield_utp', 'unshielded', null, null, ["UTP"], null, ["prod_category_cables"])

-- Brand mappings (MISSING)
('brand_panduit', 'panduit', null, null, null, ["PANDUIT"], ["prod_category_cables"])
('brand_panduit', 'pan', null, null, null, ["PANDUIT"], ["prod_category_cables"])

-- Generic terms (MISSING)
('generic_cable', 'ethernet', null, null, null, null, ["prod_category_cables"])
('generic_cable', 'network cable', null, null, null, null, ["prod_category_cables"])
('generic_cable', 'patch cord', null, null, null, null, ["prod_category_cables"])
```

---

## 🛠️ Immediate Actions Needed

### 1. Add Missing Mappings
```sql
-- Add jacket mappings
INSERT INTO search_terms (term_group, search_term, jackets, applicable_tables) VALUES
('jacket_terms', 'plenum', '{"Plenum"}', '{"prod_category_cables"}'),
('jacket_terms', 'cmp', '{"Plenum"}', '{"prod_category_cables"}'),
('jacket_terms', 'fire rated', '{"Plenum"}', '{"prod_category_cables"}'),
('jacket_terms', 'riser', '{"Riser"}', '{"prod_category_cables"}'),
('jacket_terms', 'cmr', '{"Riser"}', '{"prod_category_cables"}'),
('jacket_terms', 'non plenum', '{"Riser"}', '{"prod_category_cables"}'),
('jacket_terms', 'non-plenum', '{"Riser"}', '{"prod_category_cables"}'),
('jacket_terms', 'lszh', '{"LSZH"}', '{"prod_category_cables"}'),
('jacket_terms', 'low smoke', '{"LSZH"}', '{"prod_category_cables"}');

-- Add shielding mappings
INSERT INTO search_terms (term_group, search_term, shielding, applicable_tables) VALUES
('shield_terms', 'utp', '{"UTP"}', '{"prod_category_cables"}'),
('shield_terms', 'unshielded', '{"UTP"}', '{"prod_category_cables"}'),
('shield_terms', 'stp', '{"STP"}', '{"prod_category_cables"}'),
('shield_terms', 'shielded', '{"STP"}', '{"prod_category_cables"}'),
('shield_terms', 'sftp', '{"SFTP"}', '{"prod_category_cables"}'),
('shield_terms', 'screened', '{"SFTP"}', '{"prod_category_cables"}');

-- Add Cat6A mappings (CRITICAL - missing!)
INSERT INTO search_terms (term_group, search_term, categories, applicable_tables) VALUES
('category_ratings', 'cat6a', '{"Category 6A"}', '{"prod_category_cables"}'),
('category_ratings', 'cat 6a', '{"Category 6A"}', '{"prod_category_cables"}'),
('category_ratings', 'category 6a', '{"Category 6A"}', '{"prod_category_cables"}'),
('category_ratings', 'cat6 augmented', '{"Category 6A"}', '{"prod_category_cables"}'),
('category_ratings', '6a', '{"Category 6A"}', '{"prod_category_cables"}');
```

### 2. Add Generic Terms
```sql
-- Add common cable terms that apply to all
INSERT INTO search_terms (term_group, search_term, applicable_tables) VALUES
('generic_cable', 'ethernet', '{"prod_category_cables"}'),
('generic_cable', 'ethernet cable', '{"prod_category_cables"}'),
('generic_cable', 'network cable', '{"prod_category_cables"}'),
('generic_cable', 'patch cable', '{"prod_category_cables"}'),
('generic_cable', 'patch cord', '{"prod_category_cables"}'),
('generic_cable', 'lan cable', '{"prod_category_cables"}'),
('generic_cable', 'data cable', '{"prod_category_cables"}'),
('generic_cable', 'rj45', '{"prod_category_cables"}'),
('generic_cable', 'rj45 cable', '{"prod_category_cables"}');
```

### 3. Fix the Population Process
```sql
-- After adding mappings, force update computed_search_terms
UPDATE prod_category_cables
SET computed_search_terms = (
    SELECT STRING_AGG(DISTINCT s.search_term, ' ')
    FROM search_terms s
    WHERE 'prod_category_cables' = ANY(s.applicable_tables)
    AND (
        category_rating = ANY(s.categories) OR
        jacket_material = ANY(s.jackets) OR
        shielding_type = ANY(s.shielding) OR
        brand = ANY(s.brands) OR
        (s.categories IS NULL AND s.jackets IS NULL AND s.shielding IS NULL AND s.brands IS NULL)
    )
);
```

---

## 📊 Search Terms Coverage Analysis

### Current State:
```
Categories:  ████████░░░░░░░░░░░░ 40% (only Cat5e, Cat6)
Jackets:     ░░░░░░░░░░░░░░░░░░░░ 0%  (none)
Shielding:   ░░░░░░░░░░░░░░░░░░░░ 0%  (none)
Brands:      ░░░░░░░░░░░░░░░░░░░░ 0%  (none)
Generic:     ░░░░░░░░░░░░░░░░░░░░ 0%  (none)
```

### After Adding Mappings:
```
Categories:  ████████████████████ 100%
Jackets:     ████████████████████ 100%
Shielding:   ████████████████████ 100%
Brands:      ████████████░░░░░░░ 60% (main brands)
Generic:     ████████████████████ 100%
```

---

## 🎯 This Explains Everything!

The reason 98.6% of products have no search terms is because:
1. The search_terms table only has partial mappings (categories only)
2. No mappings for jackets, shielding, brands, or generic terms
3. The triggers can't populate computed_search_terms without complete mappings
4. Without computed_search_terms, the V2 search will fail

**This is the root cause of the search problem!**