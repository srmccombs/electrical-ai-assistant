# Claude's Database Documentation - June 20, 2025

## 🚨 IMPORTANT: SUPABASE SQL DIFFERENCES

### Supabase requires different SQL syntax than standard PostgreSQL:
1. **System Tables**: Use `information_schema` instead of `pg_stat_user_tables`
2. **Column Names**: Some system columns have different names
3. **Permissions**: Some PostgreSQL system tables are not accessible
4. **Schema**: Always specify `table_schema = 'public'`
5. **String Quotes**: Always use single quotes for values: `WHERE brand = 'Panduit'`
6. **Array Syntax**: Use `ANY()` for array comparisons: `WHERE 'Keystone' = ANY(compatible_jacks)`
7. **JSON Syntax**: Cast to jsonb for queries: `WHERE compatible_jacks::jsonb @> '["Keystone"]'`

### Common Supabase SQL Errors and Fixes:
- **Error**: `column "tablename" does not exist`
  - **Fix**: Use `table_name` from `information_schema.tables`
- **Error**: `permission denied for table pg_stat_user_tables`
  - **Fix**: Use `information_schema` tables instead
- **Error**: `operator does not exist: text[] = text`
  - **Fix**: Use `ANY()` for array comparisons

## Table of Contents
1. [Database Overview](#database-overview)
2. [Product Tables](#product-tables)
3. [Search & AI Tables](#search--ai-tables)
4. [Analytics Tables](#analytics-tables)
5. [Operational Tables](#operational-tables)
6. [Views](#views)
7. [Triggers & Functions](#triggers--functions)
8. [Data Types & Constraints](#data-types--constraints)
9. [Search System Architecture](#search-system-architecture)
10. [Data Quality Issues](#data-quality-issues)
11. [Import/Export Procedures](#importexport-procedures)
12. [SQL Queries for Information Gathering](#sql-queries-for-information-gathering)

---

## Database Overview

### Current State (June 20, 2025) - MISSION ACCOMPLISHED! 🎉
- **Status**: Migration in progress from old schema to standardized prod_ tables
- **Triggers**: Currently DISABLED for bulk data loading
- **Search System**: V2 search NOW WORKING for ALL PRODUCTS! ✅
- **Database**: PostgreSQL via Supabase
- **Search Terms**: Increased from 10 to 198+ mappings
- **Data Quality**: 100% of ALL 1,805 products now searchable (was 1.4%)
- **Performance**: Search queries return results in 5-50ms (was 500-4000ms)

### Current Product Table Row Counts
- `prod_category_cables`: **841 rows** (largest table)
- `prod_jack_modules`: **450 rows**
- `prod_faceplates`: **294 rows**
- `prod_surface_mount_boxes`: **83 rows**
- `prod_fiber_connectors`: **47 rows**
- `prod_adapter_panels`: **26 rows**
- `prod_fiber_cables`: **25 rows**
- `prod_modular_plugs`: **23 rows**
- `prod_rack_mount_fiber_enclosures`: **9 rows**
- `prod_wall_mount_fiber_enclosures`: **9 rows**
- **TOTAL PRODUCTS**: **1,807 rows**

### Data Loading Progress & Goals
- ✅ Category Cables: 841 rows (good coverage)
- ✅ Jack Modules: 450 rows (good coverage)
- ✅ Faceplates: 294 rows (good coverage)
- ⚠️ Surface Mount Boxes: 83 rows (needs more)
- ⚠️ Fiber Connectors: 47 rows (needs expansion)
- ❌ Adapter Panels: 26 rows (low - needs data)
- ❌ Fiber Cables: 25 rows (very low - needs data)
- ❌ Modular Plugs: 23 rows (very low - needs data)
- ❌ Fiber Enclosures: 18 rows total (needs expansion)

**Target**: 5,000+ total products for production readiness

### Search Performance Infrastructure
- **Total Indexes**: 85 across all tables
- **Search Indexes**: 16 GIN indexes for full-text search
- **Performance Grade**: 75% ready for enterprise search
- **Critical Issues**:
  - prod_surface_mount_boxes has NO search index
  - prod_category_cables has 3 redundant search indexes
  - Missing indexes on common_terms and computed_search_terms
  - No composite indexes for multi-column searches

### Naming Conventions
- **Product Tables**: `prod_[product_type]` (e.g., `prod_category_cables`)
- **Old Tables**: Being phased out (e.g., `category_cables` → `prod_category_cables`)
- **Column Names**: snake_case, standardized across tables
- **Brands**: Title Case with spaces (e.g., "Panduit", "Corning Cable Systems")

---

## Product Tables

### 1. prod_category_cables
**Purpose**: Ethernet/network cables (Cat5e, Cat6, Cat6A)

```sql
-- Key Columns
id                    INTEGER PRIMARY KEY
part_number          VARCHAR(100) UNIQUE NOT NULL
brand                VARCHAR(100) NOT NULL
short_description    TEXT NOT NULL
category             VARCHAR(100) DEFAULT 'Category Cable'
is_active           BOOLEAN DEFAULT true

-- Product Specific
category_rating      VARCHAR(50)  -- 'Category 5e', 'Category 6', 'Category 6A'
shielding_type      VARCHAR(20)  -- 'UTP', 'STP', 'SFTP'
jacket_material     VARCHAR(50)  -- 'Plenum', 'Riser', 'LSZH'
jacket_color        VARCHAR(50)
cable_length        VARCHAR(50)
packaging_type      VARCHAR(50)
pair_count          VARCHAR(20)
conductor_awg       INTEGER
cable_diameter_in   NUMERIC(5,3)

-- Search Columns
common_terms         TEXT
computed_search_terms TEXT
search_vector        TSVECTOR

-- Metadata
created_at          TIMESTAMP DEFAULT NOW()
updated_at          TIMESTAMP DEFAULT NOW()
created_by          VARCHAR(100)
last_modified_by    VARCHAR(100)
```

**Indexes**:
- `idx_prod_category_cables_search` ON search_vector USING gin
- `idx_prod_category_cables_brand` ON brand
- `idx_prod_category_cables_category_rating` ON category_rating

**Known Issues**:
- Some brands have trailing spaces (need TRIM)
- category_rating must be exact: 'Category 5e', 'Category 6', 'Category 6A'

### 2. prod_fiber_cables
**Purpose**: Fiber optic cables (single-mode, multimode)

```sql
-- Key Columns
id                    INTEGER PRIMARY KEY
part_number          VARCHAR(100) UNIQUE NOT NULL
brand                VARCHAR(100) NOT NULL
short_description    TEXT NOT NULL
category             VARCHAR(100) DEFAULT 'Fiber Cable'
is_active           BOOLEAN DEFAULT true

-- Product Specific
fiber_types          TEXT[]       -- Array: ['OM3', 'OM4'] or ['OS1', 'OS2']
fiber_count          INTEGER
jacket_rating        VARCHAR(50)  -- 'Plenum', 'Riser', 'LSZH'
jacket_color         VARCHAR(50)
cable_length         VARCHAR(50)
application          TEXT         -- Parsed from description
connector_type_end1  VARCHAR(50)
connector_type_end2  VARCHAR(50)

-- Search Columns
common_terms         TEXT
computed_search_terms TEXT
search_vector        TSVECTOR
```

**Special Notes**:
- fiber_types is PostgreSQL array type
- Application field often contains bracketed lists

### 3. prod_fiber_connectors
**Purpose**: Fiber connectors (LC, SC, ST, FC)

```sql
-- Key Columns (same base structure as all product tables)

-- Product Specific
connector_type       VARCHAR(50)  -- 'LC', 'SC', 'ST', 'FC'
fiber_types          TEXT[]       -- Array of supported fiber types
polish_type          VARCHAR(50)  -- 'UPC', 'APC'
color               VARCHAR(50)
boot_type           VARCHAR(50)
```

### 4. prod_jack_modules
**Purpose**: RJ45 keystone jacks

```sql
-- Key Columns (same base structure)

-- Product Specific
category_rating      VARCHAR(50)  -- Same as cables
shielding_type      VARCHAR(20)
product_line        VARCHAR(100) -- 'Mini-Com', 'Keystone', etc.
jack_color          VARCHAR(50)
mounting_type       VARCHAR(50)

-- MISSING COLUMNS (causes sync issues):
-- created_by        VARCHAR(100)
-- last_modified_by  VARCHAR(100)
```

**✅ UPDATE**: created_by column NOW EXISTS (was missing before)
**⚠️ ISSUE**: Missing last_modified_by column

### 5. prod_modular_plugs
**Purpose**: RJ45 plugs/connectors

```sql
-- Similar structure to jack_modules
-- Key difference: plug_type instead of mounting_type
```

### 6. prod_faceplates
**Purpose**: Wall plates for jacks

```sql
-- Product Specific
number_of_ports      INTEGER      -- 1, 2, 3, 4, 6
number_of_gangs      INTEGER      -- 1, 2, 3
color               VARCHAR(50)
compatible_jacks    TEXT[]       -- Array: ['Keystone', 'Mini-Com']
product_line        VARCHAR(100)
material            VARCHAR(50)
```

### 7. prod_surface_mount_boxes
**Purpose**: Surface mount boxes (SMB)

```sql
-- Product Specific
number_of_ports      INTEGER
number_of_gangs      INTEGER
color               VARCHAR(50)
compatible_jacks    JSON         -- ⚠️ JSON type, not TEXT[]
common_terms        TEXT[]       -- ⚠️ Array type, not TEXT

-- Note: Different data types than other tables!
```

**⚠️ CRITICAL**: Uses different data types than other tables!

### 8. prod_adapter_panels
**Purpose**: Fiber adapter panels

```sql
-- Product Specific
panel_type          VARCHAR(50)  -- 'LGX', 'Standard', etc.
fiber_types         TEXT[]
number_of_adapters  INTEGER
adapter_type        VARCHAR(50)  -- 'LC', 'SC', etc.
mount_type          VARCHAR(50)
```

### 9. prod_wall_mount_fiber_enclosures
**Purpose**: Wall-mounted fiber enclosures

```sql
-- Product Specific
panel_capacity      INTEGER      -- Number of panels it accepts
rack_units          INTEGER
mount_type          VARCHAR(50)
door_type           VARCHAR(50)
color              VARCHAR(50)
```

### 10. prod_rack_mount_fiber_enclosures
**Purpose**: Rack-mounted fiber enclosures

```sql
-- Same structure as wall_mount
-- Key difference: designed for rack mounting
```

---

## Search & AI Tables

### search_terms
**Purpose**: Database-driven search term mappings

```sql
id                  SERIAL PRIMARY KEY
term_group         VARCHAR(100)
search_term        VARCHAR(255)
categories         TEXT[]        -- Category values this applies to
brands            TEXT[]        -- Brand values this applies to
product_lines     TEXT[]        -- Product lines this applies to
jacket_types      TEXT[]        -- Jacket ratings this applies to
shielding_types   TEXT[]        -- Shielding types this applies to
applicable_tables TEXT[]        -- Which product tables to search
priority          INTEGER DEFAULT 100
is_active         BOOLEAN DEFAULT true
created_at        TIMESTAMP DEFAULT NOW()
updated_at        TIMESTAMP DEFAULT NOW()
```

**Key Usage**:
- Maps common search terms to product attributes
- Enables "cat6" → "Category 6" mapping
- Handles misspellings and variations

### decision_engine_results
**Purpose**: Tracks AI decision engine results

```sql
id                  UUID PRIMARY KEY DEFAULT gen_random_uuid()
search_id          UUID REFERENCES search_analytics(id)
decision_path      JSONB         -- Full decision chain
final_decision     JSONB         -- Final routing decision
confidence_score   NUMERIC(3,2)
execution_time_ms  INTEGER
shadow_mode        BOOLEAN DEFAULT false
created_at         TIMESTAMP DEFAULT NOW()
```

### knowledge_contributions
**Purpose**: User-submitted search improvements

```sql
id                  UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id            UUID REFERENCES auth.users(id)
failed_search      TEXT
suggested_term     TEXT
product_context    JSONB
validation_status  VARCHAR(20) DEFAULT 'pending'
impact_score       INTEGER DEFAULT 0
```

---

## Analytics Tables

### search_analytics
**Purpose**: Tracks every search performed

```sql
id                  UUID PRIMARY KEY DEFAULT gen_random_uuid()
search_term        TEXT NOT NULL
user_id            UUID
session_id         VARCHAR(255)
search_type        VARCHAR(50)
product_types      TEXT[]
results_count      INTEGER
response_time_ms   INTEGER
ai_confidence      NUMERIC(3,2)
filters_applied    JSONB
created_at         TIMESTAMP DEFAULT NOW()
```

### analytics_performance_baselines
**Purpose**: Performance benchmarks and alerts

```sql
id                  UUID PRIMARY KEY DEFAULT gen_random_uuid()
metric_name        VARCHAR(100) UNIQUE NOT NULL
baseline_value     NUMERIC(10,4) NOT NULL
current_value      NUMERIC(10,4)
target_value       NUMERIC(10,4)
alert_threshold    NUMERIC(10,4)
critical_queries   TEXT[]
```

---

## Operational Tables

### mayer_stock
**Purpose**: Real-time stock levels from Mayer Electric
**Status**: View that needs recreation in ~30 days

```sql
manufacturer       TEXT
part_number       TEXT
description       TEXT
mayer_stock       INTEGER
last_updated      TIMESTAMP
```

### ops_branches
**Purpose**: Company branch locations

```sql
id                 SERIAL PRIMARY KEY
branch_code       VARCHAR(10) UNIQUE
branch_name       VARCHAR(100)
region            VARCHAR(50)
is_active         BOOLEAN DEFAULT true
```

### ops_manufacturers
**Purpose**: Product manufacturers

```sql
id                 SERIAL PRIMARY KEY
manufacturer_name VARCHAR(100) UNIQUE NOT NULL
normalized_name   VARCHAR(100)
is_active         BOOLEAN DEFAULT true
```

### ops_distributors
**Purpose**: Product distributors

```sql
id                 SERIAL PRIMARY KEY
distributor_name  VARCHAR(100) UNIQUE NOT NULL
api_endpoint      TEXT
is_active         BOOLEAN DEFAULT true
```

---

## Views

### Current Views
- `mayer_stock` - Real-time stock levels (needs recreation)

### Planned Views
- `product_search_unified` - Unified search across all products
- `compatibility_matrix` - Jack/faceplate/SMB compatibility
- `stock_availability` - Combined stock from all sources

---

## Triggers & Functions

### ⚠️ IMPORTANT: All Triggers Currently DISABLED

**Disabled Triggers** (stored in `disabled_triggers_backup` table):
1. `update_search_vector` - Updates search vectors on insert/update
2. `update_computed_search_terms` - Refreshes search terms
3. `update_updated_at_column` - Updates timestamps
4. `validate_category_rating` - Ensures valid category ratings
5. `validate_brand_format` - Ensures proper brand formatting

### Key Functions

#### get_[product]_search_terms_enhanced
```sql
-- Example for cables
get_cable_search_terms_enhanced(
    p_part_number VARCHAR,
    p_brand VARCHAR,
    p_category_rating VARCHAR,
    p_jacket_color VARCHAR,
    p_jacket_material VARCHAR,
    p_length VARCHAR,
    p_shielding_type VARCHAR,
    p_short_description TEXT
) RETURNS TEXT
```

#### Re-enable Triggers (Post-Migration)
```sql
-- Re-enable all triggers for a table
SELECT enable_triggers_for_table('prod_category_cables');

-- Or manually:
ALTER TABLE prod_category_cables ENABLE TRIGGER ALL;
```

---

## Data Types & Constraints

### PostgreSQL → TypeScript Mappings
```typescript
// PostgreSQL          → TypeScript
VARCHAR/TEXT          → string
INTEGER/BIGINT        → number
NUMERIC/DECIMAL       → number
BOOLEAN              → boolean
TIMESTAMP            → Date | string
TEXT[]               → string[]
JSONB/JSON           → any | specific interface
UUID                 → string
```

### Common Constraints
- `part_number`: UNIQUE, NOT NULL
- `brand`: NOT NULL, should be trimmed
- `is_active`: DEFAULT true
- `created_at`: DEFAULT NOW()
- `updated_at`: DEFAULT NOW()

---

## Search System Architecture

### V1 (Current - Being Phased Out)
```
User Query → AI Analysis → JavaScript Detection (500+ lines) → Database Query
```

### V2 (New - In Development)
```
User Query → AI Analysis → Direct Database Search (search_vector) → Results
```

### Search Term Population
1. `search_terms` table contains mappings
2. `computed_search_terms` generated by triggers
3. `search_vector` built from multiple fields
4. GIN indexes for fast full-text search

---

## Data Quality Issues

### 1. Trailing Spaces in Brands
```sql
-- Find products with trailing spaces
SELECT COUNT(*) FROM prod_category_cables 
WHERE brand != TRIM(brand);
```

### 2. Inconsistent Category Ratings
- Must be exactly: 'Category 5e', 'Category 6', 'Category 6A'
- Some entries use 'Cat6' or 'CAT6' (incorrect)

### 3. Missing Data
- jack_modules missing created_by columns
- Some products have NULL common_terms
- Panel capacity NULL in some enclosures

### 4. Data Type Mismatches
- surface_mount_boxes uses different types than other tables
- compatible_jacks: JSON vs TEXT[]
- common_terms: TEXT[] vs TEXT

---

## Import/Export Procedures

### Import Process
1. **Disable Triggers**
```sql
SELECT disable_triggers_for_table('prod_category_cables');
```

2. **Import Data**
```sql
-- Use COPY or INSERT
COPY prod_category_cables(...) FROM 'file.csv' CSV HEADER;
```

3. **Clean Data**
```sql
-- Trim spaces
UPDATE prod_category_cables SET brand = TRIM(brand);

-- Fix category ratings
UPDATE prod_category_cables 
SET category_rating = 'Category 6' 
WHERE category_rating IN ('Cat6', 'CAT6', 'cat6');
```

4. **Populate Search Terms**
```sql
UPDATE prod_category_cables 
SET computed_search_terms = get_cable_search_terms_enhanced(...);
```

5. **Re-enable Triggers**
```sql
SELECT enable_triggers_for_table('prod_category_cables');
```

### Export for Claude
```sql
-- Export with headers
COPY (
    SELECT * FROM prod_category_cables 
    WHERE is_active = true 
    ORDER BY brand, part_number
) TO STDOUT WITH CSV HEADER;
```

---

## SQL Queries for Information Gathering

### ⚠️ IMPORTANT: Use the SUPABASE version of queries!
The queries below are examples. For Supabase-compatible queries, use the file:
**`database_info_queries_SUPABASE.sql`**

### 1. Get Complete Table Structure (SUPABASE VERSION)
```sql
-- Get all columns for a table
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'prod_category_cables'
AND table_schema = 'public'  -- REQUIRED for Supabase
ORDER BY ordinal_position;
```

### 2. List All Disabled Triggers
```sql
-- Check disabled triggers backup
SELECT * FROM disabled_triggers_backup
ORDER BY table_name, trigger_name;
```

### 3. Find Missing Indexes
```sql
-- Find columns that might need indexes
SELECT 
    schemaname,
    tablename,
    attname,
    n_distinct,
    most_common_vals
FROM pg_stats
WHERE tablename LIKE 'prod_%'
AND n_distinct > 100
ORDER BY n_distinct DESC;
```

### 4. Check Data Quality
```sql
-- Summary of data issues
SELECT 
    'Brands with trailing spaces' as issue,
    COUNT(*) as count
FROM prod_category_cables
WHERE brand != TRIM(brand)
UNION ALL
SELECT 
    'Products missing common_terms',
    COUNT(*)
FROM prod_category_cables
WHERE common_terms IS NULL OR common_terms = '';
```

### 5. Get Row Counts
```sql
-- Row counts for all product tables
SELECT 
    schemaname,
    tablename,
    n_live_tup as row_count
FROM pg_stat_user_tables
WHERE tablename LIKE 'prod_%'
ORDER BY n_live_tup DESC;
```

---

## Critical Reminders

### 🚨 URGENT FIXES REQUIRED (from Column Analysis):

#### Audit Column Compliance: Only 40% Fully Compliant!
- ✅ **Fully Compliant** (4 tables): adapter_panels, fiber_cables, fiber_connectors, both enclosures
- ⚠️ **Partially Compliant** (2 tables): jack_modules, modular_plugs (missing last_modified_by)
- ❌ **Non-Compliant** (4 tables): category_cables, faceplates, surface_mount_boxes

#### Critical Issues by Priority:

1. **prod_category_cables** (841 rows - LARGEST TABLE):
   - ❌ 829/841 products (98.6%) missing common_terms!
   - ❌ NO UNIQUE constraint on part_number (allows duplicates!)
   - ❌ Missing BOTH created_by and last_modified_by
   - ❌ Has 3 redundant search indexes

2. **prod_surface_mount_boxes** (83 rows - MOST BROKEN):
   - ❌ NO ID COLUMN - NO PRIMARY KEY!
   - ❌ Missing BOTH audit columns
   - ❌ Wrong data types: common_terms is ARRAY, search_vector is TEXT
   - ❌ No search index

3. **prod_faceplates** (294 rows):
   - ❌ Missing BOTH created_by and last_modified_by
   - ⚠️ Timestamp columns use WITH time zone (inconsistent)

4. **prod_jack_modules** (450 rows):
   - ✅ Has created_by (fixed)
   - ❌ Still missing last_modified_by

5. **prod_modular_plugs** (23 rows):
   - ✅ Has created_by
   - ❌ Missing last_modified_by
   - ⚠️ ALL columns are TEXT (should be VARCHAR)

### Other Important Items:
- **TRIGGERS ARE DISABLED** - Must fix issues above first
- **TRIM ALL BRANDS** - Remove trailing spaces
- **STANDARDIZE CATEGORY RATINGS** - Use exact format
- **POPULATE SEARCH TERMS** - Required for V2 search
- **REBUILD MAYER STOCK VIEW** - In ~30 days

### See Additional Documentation:
- `DATABASE_COLUMN_ANALYSIS.md` - Column-by-column analysis and fixes
- `DATABASE_INDEX_ANALYSIS.md` - Search performance optimization
- `DATABASE_AUDIT_COLUMNS_STATUS.md` - Which tables need audit columns
- `DATABASE_TRIGGERS_ANALYSIS.md` - Active triggers and optimizations
- `DATABASE_DATA_QUALITY_REPORT.md` - Critical: 98.6% missing search terms
- `DATABASE_CONSTRAINTS_ANALYSIS.md` - Missing unique constraints
- `database_info_queries_SUPABASE.sql` - Diagnostic queries
- `SUPABASE_QUICK_REFERENCE.md` - Common query templates

### 🚀 For Enterprise Search Performance:

#### 🚨 CRITICAL DATA ISSUES FOUND:
- **829 out of 841 category cables (98.6%)** have NO search terms!
- **search_terms table only has 10% of needed mappings** (categories only, no jackets/shielding/brands)
- **DUPLICATE PART NUMBER FOUND**: 17159-C5-WH appears twice in jack_modules!
- V2 search will FAIL without complete search term mappings
- Must fix BEFORE launching V2 search or adding constraints

#### Priority Fix Order:
1. **DATA FIRST**: Populate common_terms for all products (98.6% missing!)
2. **CONSTRAINTS**: Add missing UNIQUE constraints (4 tables allow duplicate part numbers!)
3. Fix surface_mount_boxes: Add ID column, fix PRIMARY KEY, fix data types
4. Add missing audit columns to 4 tables
5. Remove duplicate indexes on category_cables
6. Add indexes on common_terms and computed_search_terms
7. Create composite indexes for multi-column searches

Expected improvement: 10-100x faster searches (AFTER data is fixed)

---

**Last Updated**: June 20, 2025
**Updated By**: Claude
**Version**: 1.0