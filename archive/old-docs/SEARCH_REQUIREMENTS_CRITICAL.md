# 🚨 CRITICAL SEARCH REQUIREMENTS - READ BEFORE CREATING ANY TABLE

## The ONLY 6 Things That Matter for Search to Work

### 1. `common_terms` Column = 90% of Search Success
**POPULATE THIS OR SEARCH FAILS**
```sql
common_terms TEXT -- Space-separated list of EVERY way someone might search
```

Example for a patch panel:
```
"patch panel patchpanel patch-panel patch panels fiber panel lc panel 
 pach panel patch pannel corning cch panduit ppc netconnect cat6 panel 
 category 6 panel cat 6 panel 24 port panel 24port twenty four port"
```

### 2. Brand Names Must Be EXACT
- "PANDUIT" not "Panduit" 
- "Corning" not "CORNING"
- NO TRAILING SPACES - They break everything

### 3. Category Must Be Consistent Title Case
- "Patch Panel" ✅
- "patch_panel" ❌
- "PATCH PANEL" ❌

### 4. These 6 Columns Are MANDATORY
```sql
part_number VARCHAR(255) NOT NULL UNIQUE
brand VARCHAR(100) NOT NULL  
short_description TEXT NOT NULL
category VARCHAR(100) NOT NULL
is_active BOOLEAN DEFAULT true
common_terms TEXT
```

### 5. Compatibility Uses PostgreSQL Arrays
```sql
compatible_jacks TEXT[] -- Format: '{"Keystone", "Mini-Com", "NetKey"}'
```

### 6. Run These 3 Checks Before Going Live
```sql
-- All must return 0
SELECT COUNT(*) FROM your_table WHERE TRIM(brand) != brand;
SELECT COUNT(*) FROM your_table WHERE category IS NULL OR category = '';  
SELECT COUNT(*) FROM your_table WHERE common_terms IS NULL OR common_terms = '';
```

## What Happens When You Don't Follow These Rules

1. **Empty common_terms** → Product invisible to 90% of searches
2. **Wrong brand format** → Filters don't work, customers can't find by brand
3. **Missing category** → Products don't appear in smart filters
4. **Trailing spaces** → Random search failures that are hard to debug
5. **is_active = false** → Product completely invisible

## The Fast Way to Create Tables

1. Copy `PRODUCT_TABLE_TEMPLATE.sql`
2. Replace `[PRODUCT_TYPE]` with your table name
3. Delete columns you don't need
4. Run the SQL
5. Import your data
6. Run the 3 verification queries
7. Done

## For 1000+ Users/Day You MUST

- Index these columns: part_number, brand, category, is_active
- Use search_vector with weights for full-text search
- Keep descriptions under 500 characters
- Populate common_terms with 10+ variations minimum

## Stop Doing These Things

- Creating tables without common_terms
- Using inconsistent brand names
- Forgetting to set category
- Not checking for trailing spaces
- Making me debug why search doesn't work

---

**THE GOLDEN RULE**: If a user might type it, put it in common_terms.