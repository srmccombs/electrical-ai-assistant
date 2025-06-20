# Database Recommendations for prod_category_cables

## Current Table Analysis

Based on your CSV, here's what I observed:

### ✅ What's Good:
1. **jacket_code** column exists (CMP, CMR, etc.) - perfect for filtering
2. **search_vector** column already exists - great for full-text search
3. **Shielding_Type** properly populated (UTP, STP, etc.)
4. **common_terms** column exists - can be used for additional search terms
5. **brand_normalized** column - good for consistent filtering
6. Good product data with part numbers, brands, descriptions

### 🔧 Recommendations for Better Search:

#### 1. **Standardize Column Names** (Optional but recommended)
```sql
-- Consider lowercase with underscores for consistency
ALTER TABLE prod_category_cables RENAME COLUMN Shielding_Type TO shielding_type;
```

#### 2. **Add Missing Indexes**
```sql
-- For fast filtering
CREATE INDEX idx_prod_cables_jacket_code ON prod_category_cables(jacket_code);
CREATE INDEX idx_prod_cables_shielding ON prod_category_cables(Shielding_Type);
CREATE INDEX idx_prod_cables_category_rating ON prod_category_cables(category_rating);
CREATE INDEX idx_prod_cables_brand_normalized ON prod_category_cables(brand_normalized);

-- For price/stock filtering (when you add these)
-- CREATE INDEX idx_prod_cables_price ON prod_category_cables(price);
-- CREATE INDEX idx_prod_cables_stock ON prod_category_cables(stock_quantity);
```

#### 3. **Enhance the common_terms Column**
Your common_terms column is empty in all rows. This is a missed opportunity! Update it with:
```sql
UPDATE prod_category_cables
SET common_terms = CONCAT_WS(' ',
    -- Common variations of the category
    CASE 
        WHEN category_rating LIKE '%5e%' THEN 'cat5 cat5e category5e ethernet network cable'
        WHEN category_rating LIKE '%6a%' THEN 'cat6a category6a augmented 10gig 10g'
        WHEN category_rating LIKE '%6%' THEN 'cat6 category6 gigabit 1000base'
    END,
    -- Jacket variations
    CASE 
        WHEN jacket_code = 'CMP' THEN 'plenum fire-rated fireproof'
        WHEN jacket_code = 'CMR' THEN 'riser vertical non-plenum pvc'
        WHEN jacket_code = 'LSZH' THEN 'low-smoke zero-halogen lsoh'
    END,
    -- Shielding variations
    CASE 
        WHEN Shielding_Type = 'UTP' THEN 'unshielded twisted-pair'
        WHEN Shielding_Type IN ('F/UTP', 'S/FTP') THEN 'shielded stp ftp'
    END,
    -- Color variations
    LOWER(jacket_color),
    -- Length variations
    CASE 
        WHEN length LIKE '%1000%' THEN '1000ft 1000-ft thousand-feet'
        WHEN length LIKE '%500%' THEN '500ft 500-ft five-hundred'
    END
);
```

#### 4. **Add Columns for Future Growth**
```sql
-- Price and inventory
ALTER TABLE prod_category_cables ADD COLUMN IF NOT EXISTS price DECIMAL(10,2);
ALTER TABLE prod_category_cables ADD COLUMN IF NOT EXISTS stock_quantity INTEGER DEFAULT 0;
ALTER TABLE prod_category_cables ADD COLUMN IF NOT EXISTS lead_time VARCHAR(50);

-- Enhanced categorization
ALTER TABLE prod_category_cables ADD COLUMN IF NOT EXISTS subcategory VARCHAR(50);
ALTER TABLE prod_category_cables ADD COLUMN IF NOT EXISTS tags TEXT[];

-- Performance specs
ALTER TABLE prod_category_cables ADD COLUMN IF NOT EXISTS bandwidth_mhz INTEGER;
ALTER TABLE prod_category_cables ADD COLUMN IF NOT EXISTS max_distance_meters INTEGER;
```

#### 5. **Create a Materialized View for Fast Filtering**
```sql
CREATE MATERIALIZED VIEW mv_cable_search AS
SELECT 
    id,
    part_number,
    brand,
    brand_normalized,
    product_line,
    short_description,
    category_rating,
    jacket_code,
    jacket_color,
    Shielding_Type as shielding_type,
    length,
    packaging_type,
    -- Extract numeric values for range filtering
    CASE 
        WHEN category_rating LIKE '%5e%' THEN 5.5
        WHEN category_rating LIKE '%6a%' THEN 6.5
        WHEN category_rating LIKE '%6%' THEN 6.0
        ELSE 5.0
    END as category_numeric,
    -- Price columns when added
    price,
    stock_quantity,
    -- Full text search
    search_vector,
    computed_search_terms
FROM prod_category_cables
WHERE is_active = true;

CREATE INDEX idx_mv_cable_category_numeric ON mv_cable_search(category_numeric);
CREATE INDEX idx_mv_cable_search_vector ON mv_cable_search USING GIN(search_vector);
```

#### 6. **Data Quality Improvements**
```sql
-- Trim all text fields
UPDATE prod_category_cables
SET 
    brand = TRIM(brand),
    product_line = TRIM(product_line),
    category_rating = TRIM(category_rating),
    jacket_material = TRIM(jacket_material),
    jacket_color = TRIM(jacket_color);

-- Standardize jacket colors
UPDATE prod_category_cables
SET jacket_color = INITCAP(LOWER(TRIM(jacket_color)));

-- Fix the "Red " with trailing space
UPDATE prod_category_cables
SET jacket_color = 'Red'
WHERE jacket_color = 'Red ';
```

## For Scaling to 100,000+ Products:

1. **Partition by Brand or Category**
```sql
-- Example: Partition by first letter of part number
CREATE TABLE prod_category_cables_new (
    LIKE prod_category_cables INCLUDING ALL
) PARTITION BY RANGE (LEFT(part_number, 1));
```

2. **Use PostgreSQL 15+ Features**
- BRIN indexes for large tables
- Parallel query execution
- JIT compilation for complex queries

3. **Consider Read Replicas**
- Supabase supports read replicas for scaling
- Direct search queries to replicas

4. **Implement Caching**
- Cache popular searches
- Use Redis for session-based results

Would you like me to create the SQL scripts to implement these improvements?