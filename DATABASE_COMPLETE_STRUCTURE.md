# Complete Database Structure Documentation
*Last Updated: June 20, 2025*

## Table of Contents
1. [Overview](#overview)
2. [Database Architecture](#database-architecture)
3. [Product Tables](#product-tables)
4. [Search & AI Tables](#search--ai-tables)
5. [Analytics Tables](#analytics-tables)
6. [Operational Tables](#operational-tables)
7. [Views](#views)
8. [Triggers & Functions](#triggers--functions)
9. [Data Types & Constraints](#data-types--constraints)
10. [Search System Architecture](#search-system-architecture)
11. [Import Procedures](#import-procedures)
12. [TypeScript Integration](#typescript-integration)

## Overview

The Plectic AI database is a PostgreSQL database hosted on Supabase, designed to manage electrical distribution products with advanced search capabilities. The database underwent a major reorganization in June 2025 to implement enterprise-level best practices.

### Key Features
- **Organized Table Naming**: Tables use prefixes (prod_, ops_, search_, etc.) for clarity
- **Full-Text Search**: PostgreSQL tsvector for advanced search capabilities
- **Computed Search Terms**: Pre-calculated search terms for performance
- **Audit Trail**: Comprehensive tracking of search decisions and user contributions
- **Stock Integration**: Automated synchronization with Mayer distributor inventory

### Current Status
- ✅ Tables reorganized with proper prefixes
- ⚠️ All triggers temporarily DISABLED for migration
- ✅ Search system enhanced with computed terms
- 🔄 Product line extraction in progress
- ✅ Category standardization complete

## Database Architecture

### Schema Organization
```
public/
├── prod_*              # Product catalog tables
├── ops_*               # Operational/business tables  
├── search_*            # Search and AI tables
├── analytics_*         # Analytics views and tables
├── docs_*              # Documentation tables
└── disabled_triggers_backup  # Temporary trigger storage
```

## Product Tables

### 1. prod_category_cables
Ethernet cables (Cat5e, Cat6, Cat6a)

```sql
Columns:
- id                    SERIAL PRIMARY KEY
- part_number           VARCHAR(255) NOT NULL UNIQUE
- brand                 VARCHAR(100) NOT NULL
- brand_normalized      VARCHAR(100) GENERATED (UPPER(TRIM(brand)))
- product_line          VARCHAR(100)
- short_description     TEXT NOT NULL
- category              VARCHAR(100) NOT NULL DEFAULT 'Category Cable'
- category_rating       TEXT[]  -- e.g., {"Category 6", "Category 6a"}
- jacket_rating         VARCHAR(50)  -- 'Plenum', 'Riser', 'LSZH'
- jacket_color          VARCHAR(50)
- shielding_type        VARCHAR(50)  -- 'UTP', 'STP', 'F/UTP'
- conductor_awg         INTEGER
- pair_count            VARCHAR(20)  -- '4-Pair', '25-Pair'
- cable_diameter        DECIMAL(5,3)
- length_ft             INTEGER
- packaging_type        VARCHAR(50)  -- 'Box', 'Reel', 'Spool'
- application           TEXT
- common_terms          TEXT  -- Search keywords
- search_vector         TSVECTOR GENERATED
- computed_search_terms TEXT
- possible_cross        TEXT
- go_with_items         TEXT
- image_file            VARCHAR(500)
- is_active             BOOLEAN DEFAULT true
- created_at            TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
- updated_at            TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP

Indexes:
- idx_prod_category_cables_part_number
- idx_prod_category_cables_brand
- idx_prod_category_cables_search_vector (GIN)
- idx_prod_category_cables_category_rating (GIN)
```

### 2. prod_fiber_connectors
LC, SC, ST, and other fiber optic connectors

```sql
Columns:
- id                    SERIAL PRIMARY KEY
- part_number           VARCHAR(255) NOT NULL UNIQUE
- brand                 VARCHAR(100) NOT NULL
- brand_normalized      VARCHAR(100) GENERATED
- product_line          VARCHAR(100)
- short_description     TEXT NOT NULL
- category              VARCHAR(100) DEFAULT 'Fiber Connector'
- connector_type        VARCHAR(50)  -- 'LC', 'SC', 'ST', 'MTP'
- fiber_types           TEXT[]  -- {"Single Mode", "Multimode"}
- polish                VARCHAR(50)  -- 'UPC', 'APC'
- housing_color         VARCHAR(50)
- boot_color            VARCHAR(50)
- ferrule_material      VARCHAR(50)
- compatible_cables     TEXT[]
- compatible_boots      TEXT[]
- packaging_qty         INTEGER
- common_terms          TEXT
- search_vector         TSVECTOR GENERATED
- computed_search_terms TEXT
- possible_cross        TEXT
- go_with_items         TEXT
- image_file            VARCHAR(500)
- is_active             BOOLEAN DEFAULT true
- created_at            TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
- updated_at            TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP

Indexes:
- idx_prod_fiber_connectors_part_number
- idx_prod_fiber_connectors_brand
- idx_prod_fiber_connectors_search_vector (GIN)
- idx_prod_fiber_connectors_connector_type
```

### 3. prod_fiber_cables (formerly fiber_optic_cable)
Single-mode and multimode fiber optic cables

```sql
Columns:
- id                    SERIAL PRIMARY KEY
- part_number           VARCHAR(255) NOT NULL UNIQUE
- brand                 VARCHAR(100) NOT NULL
- brand_normalized      VARCHAR(100) GENERATED
- product_line          VARCHAR(100)
- short_description     TEXT NOT NULL
- category              VARCHAR(100) DEFAULT 'Fiber Optic Cable'
- fiber_types           TEXT[]  -- {"Single Mode", "Multimode"}
- fiber_count           INTEGER
- jacket_rating         VARCHAR(50)
- jacket_color          VARCHAR(50)
- cable_diameter        DECIMAL(5,3)
- length_ft             INTEGER
- connector_type_a      VARCHAR(50)
- connector_type_b      VARCHAR(50)
- application           TEXT
- common_terms          TEXT
- search_vector         TSVECTOR GENERATED
- computed_search_terms TEXT
- possible_cross        TEXT
- go_with_items         TEXT
- image_file            VARCHAR(500)
- is_active             BOOLEAN DEFAULT true
- created_at            TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
- updated_at            TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
```

### 4. prod_jack_modules
RJ45 keystone jacks and modules

```sql
Columns:
- id                           BIGINT PRIMARY KEY
- part_number                  VARCHAR NOT NULL UNIQUE
- brand                        VARCHAR
- brand_normalized             VARCHAR GENERATED
- product_line                 VARCHAR
- short_description            TEXT
- upc_number                   VARCHAR
- product_type                 VARCHAR
- category_rating              VARCHAR  -- 'Category 6', 'Category 6a'
- pair_count                   VARCHAR  -- '4-Pair'
- color                        VARCHAR
- shielding_type               VARCHAR  -- 'UTP', 'STP'
- installation_tools_required  TEXT
- common_terms                 TEXT
- compatible_faceplates        TEXT
- image_file                   VARCHAR
- possible_cross               TEXT
- go_with_items                TEXT
- search_vector                TSVECTOR GENERATED
- computed_search_terms        TEXT
- is_active                    BOOLEAN DEFAULT true
- created_at                   TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
- updated_at                   TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP

NOTE: Missing created_by and last_modified_by columns (causes sync issues)
```

### 5. prod_faceplates
Network faceplates/wall plates

```sql
Columns:
- id                    SERIAL PRIMARY KEY
- part_number           VARCHAR(255) NOT NULL UNIQUE
- brand                 VARCHAR(100) NOT NULL
- brand_normalized      VARCHAR(100) GENERATED
- product_line          VARCHAR(100)
- short_description     TEXT NOT NULL
- number_of_ports       INTEGER
- color                 VARCHAR(50)
- compatible_jacks      TEXT[]  -- {"Keystone", "Mini-Com"}
- mounting_type         VARCHAR(50)
- material              VARCHAR(50)
- common_terms          TEXT
- search_vector         TSVECTOR GENERATED
- computed_search_terms TEXT
- possible_cross        TEXT
- go_with_items         TEXT
- image_file            VARCHAR(500)
- is_active             BOOLEAN DEFAULT true
- created_at            TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
- updated_at            TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
```

### 6. prod_surface_mount_boxes
Surface mount boxes (SMB) - Created June 2025

```sql
Columns:
- id                    SERIAL PRIMARY KEY
- part_number           VARCHAR(255) NOT NULL UNIQUE
- brand                 VARCHAR(100) NOT NULL
- brand_normalized      VARCHAR(100) GENERATED
- product_line          VARCHAR(100)  -- 'Mini-Com', 'ISTATION'
- short_description     TEXT NOT NULL
- number_of_ports       INTEGER  -- 1, 2, 4, 6, 12
- number_gang           INTEGER
- color                 VARCHAR(50)
- compatible_jacks      JSON  -- Note: JSON array, not TEXT[]
- mounting_depth        DECIMAL(5,3)
- material              VARCHAR(50)
- common_terms          TEXT[]  -- Note: Array field
- search_vector         TSVECTOR GENERATED
- computed_search_terms TEXT
- possible_cross        TEXT
- go_with_items         TEXT
- image_file            VARCHAR(500)
- is_active             BOOLEAN DEFAULT true
- created_at            TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
- updated_at            TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP

Special Notes:
- Contains both faceplates and SMB products
- common_terms is array type (cannot use ILIKE)
- compatible_jacks uses JSON format
```

### 7. prod_adapter_panels
Fiber optic adapter panels

```sql
Columns:
- id                          SERIAL PRIMARY KEY
- part_number                 VARCHAR(255) NOT NULL UNIQUE
- brand                       VARCHAR(100) NOT NULL
- brand_normalized            VARCHAR(100) GENERATED
- product_line                VARCHAR(100)
- short_description           TEXT NOT NULL
- panel_type                  VARCHAR(50)  -- 'LC', 'SC', 'MTP'
- fiber_types                 TEXT[]
- number_of_adapters          INTEGER
- adapter_color               VARCHAR(50)
- termination_type            VARCHAR(50)
- supports_apc                BOOLEAN DEFAULT false
- compatible_enclosures       TEXT
- rack_units                  INTEGER
- common_terms                TEXT
- search_vector               TSVECTOR GENERATED
- computed_search_terms       TEXT
- possible_cross              TEXT
- possible_equivalent         TEXT
- go_with_items               TEXT
- image_file                  VARCHAR(500)
- is_active                   BOOLEAN DEFAULT true
- created_at                  TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
- updated_at                  TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
```

### 8. prod_rack_mount_enclosures
1U-4U rack mount fiber enclosures

```sql
Columns:
- id                    SERIAL PRIMARY KEY
- part_number           VARCHAR(255) NOT NULL UNIQUE
- brand                 VARCHAR(100) NOT NULL
- brand_normalized      VARCHAR(100) GENERATED
- product_line          VARCHAR(100)
- short_description     TEXT NOT NULL
- rack_units            INTEGER  -- 1, 2, 3, 4
- panel_capacity        INTEGER  -- Number of adapter panels
- material              VARCHAR(50)
- color                 VARCHAR(50)
- supports_splice_trays BOOLEAN DEFAULT false
- splice_tray_model     VARCHAR(100)
- environment           VARCHAR(50)  -- 'Indoor', 'Outdoor'
- common_terms          TEXT
- search_vector         TSVECTOR GENERATED
- computed_search_terms TEXT
- possible_cross        TEXT
- go_with_items         TEXT
- image_file            VARCHAR(500)
- upc_code              VARCHAR(50)
- is_active             BOOLEAN DEFAULT true
- created_at            TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
- updated_at            TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
```

### 9. prod_wall_mount_enclosures
Wall mount fiber enclosures

```sql
Columns:
- id                    SERIAL PRIMARY KEY
- part_number           VARCHAR(255) NOT NULL UNIQUE
- brand                 VARCHAR(100) NOT NULL
- brand_normalized      VARCHAR(100) GENERATED
- product_line          VARCHAR(100)
- short_description     TEXT NOT NULL
- category              VARCHAR(100) DEFAULT 'Wall Mount Fiber Enclosure'
- panel_capacity        INTEGER
- material              VARCHAR(50)
- color                 VARCHAR(50)
- supports_splice_trays BOOLEAN DEFAULT false
- splice_tray_model     VARCHAR(100)
- environment           VARCHAR(50)
- mounting_type         VARCHAR(100)
- dimensions            VARCHAR(100)  -- 'H x W x D'
- common_terms          TEXT
- search_vector         TSVECTOR GENERATED
- computed_search_terms TEXT
- possible_cross        TEXT
- go_with_items         TEXT
- image_file            VARCHAR(500)
- is_active             BOOLEAN DEFAULT true
- created_at            TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
- updated_at            TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
```

### 10. prod_modular_plugs (Status Uncertain)
RJ45 plugs and connectors

```sql
Columns:
- Similar structure to jack_modules
- category_rating
- shielding_type
- conductor_awg
- compatible_cables
- packaging_qty
```

## Search & AI Tables

### 1. search_analytics
Tracks every search query for analytics

```sql
Columns:
- id                    UUID PRIMARY KEY DEFAULT gen_random_uuid()
- search_term           TEXT NOT NULL
- results_count         INTEGER
- clicked_result        TEXT
- search_time_ms        INTEGER
- user_session          TEXT
- search_type           VARCHAR(50)
- filters_applied       JSONB
- created_at            TIMESTAMPTZ DEFAULT NOW()

Indexes:
- idx_search_analytics_term
- idx_search_analytics_created
- idx_search_analytics_session
```

### 2. search_decisions_audit
Audit trail for decision engine

```sql
Columns:
- id                    UUID PRIMARY KEY DEFAULT gen_random_uuid()
- query_id              UUID NOT NULL
- original_query        TEXT NOT NULL
- normalized_query      TEXT
- decision_stage        VARCHAR(50) NOT NULL
- stage_order           INT NOT NULL
- decision_type         VARCHAR(50)
- decision_value        JSONB NOT NULL
- confidence_score      DECIMAL(3,2)
- reason                TEXT
- is_final              BOOLEAN DEFAULT FALSE
- created_at            TIMESTAMP DEFAULT NOW()

Decision Stages:
- BUSINESS_RULE
- PART_NUMBER
- CONTEXT
- AI
- TEXT_DETECTION
- KNOWLEDGE
- FALLBACK
```

### 3. knowledge_contributions
User-contributed search knowledge

```sql
Columns:
- id                    UUID PRIMARY KEY DEFAULT gen_random_uuid()
- contribution_type     VARCHAR(50) NOT NULL
- original_term         TEXT NOT NULL
- suggested_term        TEXT
- mapped_term           TEXT
- product_type          VARCHAR(100)
- context               TEXT
- confidence_score      DECIMAL(3,2) DEFAULT 0.5
- contributor_id        UUID
- validation_status     VARCHAR(20) DEFAULT 'PENDING'
- usage_count           INT DEFAULT 0
- success_count         INT DEFAULT 0
- created_at            TIMESTAMP DEFAULT NOW()
- validated_at          TIMESTAMP
- validated_by          UUID

Contribution Types:
- SYNONYM
- MAPPING
- CONTEXT
- CORRECTION
- RELATIONSHIP

Validation Statuses:
- PENDING
- APPROVED
- REJECTED
- AUTO_APPROVED
```

### 4. shadow_mode_comparisons
A/B testing for search improvements

```sql
Columns:
- id                    UUID PRIMARY KEY DEFAULT gen_random_uuid()
- query                 TEXT NOT NULL
- old_engine_result     JSONB NOT NULL
- new_engine_result     JSONB NOT NULL
- divergence_type       VARCHAR(50)
- divergence_severity   VARCHAR(20)
- old_engine_time_ms    INT
- new_engine_time_ms    INT
- user_clicked_result   VARCHAR(20)
- created_at            TIMESTAMP DEFAULT NOW()
```

### 5. regression_tests
Critical queries that must always work

```sql
Columns:
- id                    UUID PRIMARY KEY DEFAULT gen_random_uuid()
- query                 TEXT NOT NULL UNIQUE
- expected_product_type VARCHAR(100)
- expected_table        VARCHAR(100)
- expected_result_count INT
- expected_top_result_id VARCHAR(255)
- captured_from         VARCHAR(50)
- priority              VARCHAR(20) DEFAULT 'NORMAL'
- last_passed           TIMESTAMP
- last_failed           TIMESTAMP
- failure_count         INT DEFAULT 0
- created_at            TIMESTAMP DEFAULT NOW()
- active                BOOLEAN DEFAULT TRUE

Priorities:
- CRITICAL
- HIGH
- NORMAL
```

### 6. search_feedback
User feedback on failed searches

```sql
Columns:
- id                    UUID PRIMARY KEY
- search_term           TEXT NOT NULL
- feedback_type         VARCHAR(50)
- feedback_text         TEXT
- user_email            VARCHAR(255)
- created_at            TIMESTAMP DEFAULT NOW()
```

### 7. prompts (Usage Uncertain)
AI prompt templates

```sql
Columns:
- id                    UUID PRIMARY KEY
- prompt_name           VARCHAR(100)
- prompt_text           TEXT
- prompt_type           VARCHAR(50)
- active                BOOLEAN DEFAULT TRUE
- created_at            TIMESTAMP DEFAULT NOW()
```

## Analytics Tables

### 1. performance_baselines
Performance metrics and thresholds

```sql
Columns:
- id                    UUID PRIMARY KEY DEFAULT gen_random_uuid()
- metric_name           VARCHAR(100) NOT NULL UNIQUE
- baseline_value        DECIMAL(10,4) NOT NULL
- current_value         DECIMAL(10,4)
- target_value          DECIMAL(10,4)
- measurement_period    VARCHAR(20)
- last_updated          TIMESTAMP DEFAULT NOW()
- alert_threshold       DECIMAL(10,4)
- critical_queries      TEXT[]

Standard Metrics:
- decision_time_ms
- total_search_time_ms
- confidence_average
- success_rate
```

## Operational Tables

### 1. ops_mayer_stock
Centralized inventory across 67 Mayer branches

```sql
Columns:
- id                    BIGSERIAL PRIMARY KEY
- part_number           VARCHAR NOT NULL
- brand                 VARCHAR
- short_description     TEXT
- branch                VARCHAR NOT NULL  -- Branch code
- second_item_number    VARCHAR  -- Clean part number (uppercase, no spaces/dashes)
- qty_on_hand           INTEGER DEFAULT 0
- qty_on_order          INTEGER DEFAULT 0
- unit_price            DECIMAL(10,2)
- is_active             BOOLEAN DEFAULT TRUE
- created_at            TIMESTAMPTZ DEFAULT NOW()
- updated_at            TIMESTAMPTZ DEFAULT NOW()
- created_by            VARCHAR(255)
- last_modified_by      VARCHAR(255)

Unique Constraint: (part_number, branch)

Special Values:
- branch = 'PENDING' for products awaiting Mayer data
- branch = 'WEB' for web-only products
```

### 2. ops_branch_locations
Physical store locations

```sql
Columns:
- id                    SERIAL PRIMARY KEY
- branch_code           VARCHAR(10) UNIQUE
- branch_name           VARCHAR(255)
- address               TEXT
- city                  VARCHAR(100)
- state                 VARCHAR(2)
- zip_code              VARCHAR(10)
- phone                 VARCHAR(20)
- is_active             BOOLEAN DEFAULT TRUE
```

### 3. ops_manufacturers
Product manufacturer information

```sql
Columns:
- id                    SERIAL PRIMARY KEY
- name                  VARCHAR(255) NOT NULL UNIQUE
- normalized_name       VARCHAR(255)
- website               VARCHAR(500)
- support_phone         VARCHAR(20)
- is_active             BOOLEAN DEFAULT TRUE
```

### 4. ops_distributors
Distributor information

```sql
Columns:
- id                    SERIAL PRIMARY KEY
- name                  VARCHAR(255) NOT NULL UNIQUE
- code                  VARCHAR(50) UNIQUE
- website               VARCHAR(500)
- is_active             BOOLEAN DEFAULT TRUE
```

### 5. Other Operational Tables
- `ops_distributor_inventory` - Distributor stock levels
- `ops_customer_lists` - Saved customer product lists
- `ops_customer_list_items` - Items in customer lists
- `ops_selection_sessions` - User selection tracking

## Views

### 1. analytics_popular_searches
Most searched terms in last 30 days

```sql
SELECT 
    search_term,
    COUNT(*) as search_count,
    COUNT(DISTINCT user_session) as unique_sessions,
    AVG(results_count) as avg_results,
    MAX(created_at) as last_searched
FROM search_analytics
WHERE created_at > CURRENT_DATE - INTERVAL '30 days'
GROUP BY search_term
HAVING COUNT(*) > 5
ORDER BY search_count DESC
LIMIT 100;
```

### 2. analytics_search_summary
Daily search statistics

```sql
SELECT 
    DATE(created_at) as search_date,
    COUNT(*) as total_searches,
    COUNT(DISTINCT user_session) as unique_sessions,
    COUNT(CASE WHEN results_count = 0 THEN 1 END) as zero_result_searches,
    AVG(search_time_ms) as avg_search_time_ms
FROM search_analytics
GROUP BY DATE(created_at)
ORDER BY search_date DESC;
```

### 3. view_mayer_stock_summary (To Be Created)
Aggregated stock across all branches

### 4. view_product_search (To Be Created)
Unified product search across all tables

### 5. view_products_complete (To Be Created)
Complete product information with stock

## Triggers & Functions

### Current Status
⚠️ **ALL TRIGGERS ARE CURRENTLY DISABLED**
- Trigger definitions backed up in `disabled_triggers_backup` table
- Will need recreation after migration complete

### Key Triggers (When Re-enabled)

#### 1. Search Vector Updates
```sql
-- Updates search_vector when product data changes
update_[table]_search_vector_trigger
```

#### 2. Brand Normalization
```sql
-- Normalizes brand names on insert/update
normalize_[table]_brand_trigger
```

#### 3. Mayer Stock Sync
```sql
-- Syncs products to ops_mayer_stock
sync_[table]_to_mayer
```

#### 4. Updated Timestamp
```sql
-- Auto-updates updated_at timestamp
update_[table]_updated_at
```

### Key Functions

#### 1. clean_part_number()
```sql
-- Removes spaces and dashes, converts to uppercase
-- Example: "Cat6-550MHz-Blue" → "CAT6550MHZBLUE"
```

#### 2. normalize_brand()
```sql
-- Standardizes brand names
-- Corning/Siecor → "Corning"
-- Leviton/BerkTek → "Leviton"
```

#### 3. update_mayer_stock()
```sql
-- Updates stock for specific branch and product
SELECT update_mayer_stock('200500', 'CAT6550MHZBLUE', 150, 50);
```

#### 4. add_branch_to_product()
```sql
-- Adds stock for new branch
SELECT add_branch_to_product('Cat6-550MHz-Blue', '210500', 75, 25);
```

## Data Types & Constraints

### Common Data Types
- `VARCHAR(n)` - Variable character strings
- `TEXT` - Unlimited text
- `INTEGER` - Whole numbers
- `DECIMAL(p,s)` - Precise decimal numbers
- `BOOLEAN` - true/false values
- `TIMESTAMPTZ` - Timestamp with timezone
- `UUID` - Universally unique identifier
- `JSONB` - Binary JSON data
- `TEXT[]` - Array of text values
- `TSVECTOR` - Full-text search vector

### Common Constraints
- `NOT NULL` - Field must have a value
- `UNIQUE` - Value must be unique across table
- `PRIMARY KEY` - Unique identifier for row
- `DEFAULT` - Default value if not specified
- `CHECK` - Custom validation rules
- `GENERATED` - Computed columns

### Array Format
PostgreSQL arrays use this format:
```sql
'{"value1", "value2", "value3"}'
```

Example:
```sql
category_rating = '{"Category 6", "Category 6a"}'
fiber_types = '{"Single Mode", "Multimode"}'
```

## Search System Architecture

### 1. Search Vector Generation
Each product table has a `search_vector` column that combines:
- Part number (weight A - highest)
- Brand (weight B)
- Description (weight C)
- Common terms (weight D - lowest)

### 2. Computed Search Terms
Pre-calculated search terms including:
- Product variations
- Common misspellings
- Industry slang
- Abbreviations
- Singular/plural forms

### 3. Decision Engine Flow
1. **Business Rules** - Hard-coded rules for specific queries
2. **Part Number Detection** - Direct part number matches
3. **Context Analysis** - Understanding query intent
4. **AI Processing** - Natural language understanding
5. **Text Detection** - Pattern matching
6. **Knowledge Base** - User-contributed mappings
7. **Fallback** - Default behavior

### 4. Search Analytics
- Every search is tracked
- Failed searches captured for improvement
- Performance metrics monitored
- User feedback collected

## Import Procedures

### General Import Process

1. **Prepare CSV File**
   - Remove created_by/last_modified_by columns
   - Ensure part_number is unique
   - Trim all text fields
   - Use proper array format for array columns

2. **Disable Triggers**
   ```sql
   ALTER TABLE [table_name] DISABLE TRIGGER ALL;
   ```

3. **Import via Supabase UI**
   - Use Table Editor import function
   - Map columns correctly
   - Handle errors if any

4. **Manual Sync to Mayer Stock**
   ```sql
   INSERT INTO ops_mayer_stock (
       part_number, brand, short_description, branch,
       second_item_number, qty_on_hand, qty_on_order,
       last_modified_by, created_by, created_at, updated_at, is_active
   )
   SELECT 
       part_number, brand, short_description, 'PENDING',
       UPPER(REPLACE(REPLACE(part_number, '-', ''), ' ', '')),
       0, 0, 'IMPORT', 'IMPORT',
       CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, true
   FROM [table_name]
   WHERE NOT EXISTS (
       SELECT 1 FROM ops_mayer_stock m 
       WHERE m.part_number = [table_name].part_number
   );
   ```

5. **Re-enable Triggers**
   ```sql
   ALTER TABLE [table_name] ENABLE TRIGGER ALL;
   ```

6. **Verify Import**
   ```sql
   -- Check for missing required fields
   SELECT COUNT(*) as total,
          COUNT(CASE WHEN part_number IS NULL THEN 1 END) as missing_part_number,
          COUNT(CASE WHEN brand IS NULL THEN 1 END) as missing_brand
   FROM [table_name];
   ```

### Common Import Issues

1. **Trailing Spaces**
   ```sql
   UPDATE [table_name]
   SET brand = TRIM(brand)
   WHERE brand != TRIM(brand);
   ```

2. **Missing Categories**
   ```sql
   UPDATE [table_name]
   SET category = 'Default Category'
   WHERE category IS NULL OR category = '';
   ```

3. **Inactive Products**
   ```sql
   UPDATE [table_name]
   SET is_active = true
   WHERE is_active IS NULL;
   ```

## TypeScript Integration

### Type Mappings

Database types map to TypeScript as follows:

| PostgreSQL Type | TypeScript Type | Notes |
|----------------|-----------------|-------|
| VARCHAR/TEXT | string | |
| INTEGER | number | |
| DECIMAL | number | |
| BOOLEAN | boolean | |
| TIMESTAMPTZ | Date | |
| UUID | string | |
| JSONB | any or specific interface | |
| TEXT[] | string[] | |
| TSVECTOR | N/A | Not exposed to frontend |

### Product Interface
```typescript
export interface Product {
  id: string
  partNumber: string          // part_number
  brand: string
  description: string         // short_description
  price?: number             // unit_price
  stockLocal: number         // qty_on_hand
  stockDistribution: number  // qty_on_order
  leadTime?: string
  category: string
  imageUrl?: string          // image_file
  
  // Type-specific fields
  fiberType?: string         // fiber_types[0]
  jacketRating?: string
  jacketCode?: string
  fiberCount?: number
  connectorType?: string
  categoryRating?: string    // category_rating
  shielding?: string         // shielding_type
  
  // ... additional fields
}
```

### API Response Transformation
```typescript
// Database column → Frontend property
const transformProduct = (dbRow: any): Product => ({
  id: dbRow.id,
  partNumber: dbRow.part_number,
  brand: dbRow.brand,
  description: dbRow.short_description,
  // ... map remaining fields
})
```

### Search Response Types
```typescript
interface SearchResult {
  products: Product[]
  totalCount: number
  searchTime: number
  filters: FilterOptions
  suggestions?: string[]
}
```

## Maintenance & Best Practices

### Regular Maintenance Tasks

1. **Update Search Vectors**
   ```sql
   UPDATE [table_name] SET search_vector = search_vector;
   ```

2. **Analyze Tables**
   ```sql
   ANALYZE [table_name];
   ```

3. **Clean Soft-Deleted Records**
   ```sql
   DELETE FROM ops_mayer_stock 
   WHERE is_active = false 
   AND updated_at < CURRENT_DATE - INTERVAL '6 months';
   ```

4. **Verify Data Integrity**
   ```sql
   -- Find orphaned mayer_stock records
   SELECT DISTINCT ms.part_number 
   FROM ops_mayer_stock ms
   WHERE NOT EXISTS (
       SELECT 1 FROM prod_category_cables WHERE part_number::text = ms.part_number
       -- ... check all product tables
   );
   ```

### Best Practices

1. **Always Use Transactions** for bulk updates
2. **Test in Development** before production changes
3. **Backup Before Major Changes**
4. **Monitor Performance** after large imports
5. **Document All Changes** in migration files
6. **Use Consistent Naming**:
   - Tables: snake_case, plural
   - Columns: snake_case
   - Values: As displayed to users

### Performance Optimization

1. **Index Usage**
   - Part number searches: Use exact match indexes
   - Brand filtering: Use normalized brand index
   - Full-text search: Use GIN index on search_vector

2. **Query Optimization**
   - Use LIMIT for large result sets
   - Filter by is_active early
   - Use EXISTS instead of IN for subqueries

3. **Data Optimization**
   - Keep common_terms under 1000 characters
   - Archive old search_analytics data
   - Vacuum tables after large deletes

## Future Enhancements

### Planned Improvements
1. **Audit Trail System** - Track all data changes
2. **Advanced Analytics** - ML-based search improvements
3. **Real-time Stock Updates** - WebSocket integration
4. **Multi-tenant Support** - Company-specific data
5. **API Rate Limiting** - Protect against abuse

### Migration Completion Tasks
1. Re-enable all triggers after testing
2. Create missing views
3. Complete product_line extraction
4. Set up automated Mayer stock imports
5. Implement data validation constraints

## Support & Troubleshooting

### Common Issues

1. **Search Not Working**
   - Check if search_vector is populated
   - Verify common_terms has data
   - Ensure is_active = true

2. **Import Failures**
   - Check for unique constraint violations
   - Verify column names match
   - Look for trigger-related errors

3. **Performance Issues**
   - Run EXPLAIN on slow queries
   - Check index usage
   - Consider partitioning large tables

### Getting Help
- Check SQL comments in migration files
- Review trigger definitions in disabled_triggers_backup
- Test queries in Supabase SQL editor
- Monitor error logs for specific issues

---

*This documentation reflects the database state as of June 20, 2025, during the migration process. Some features may be temporarily disabled.*