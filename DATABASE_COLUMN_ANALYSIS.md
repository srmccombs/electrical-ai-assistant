# Database Column Analysis - June 20, 2025

## 🔍 Critical Findings from Column Analysis

### 1. Data Type Inconsistencies Found

#### ⚠️ CRITICAL: prod_surface_mount_boxes has DIFFERENT data types!
- `common_terms`: **ARRAY** type (all other tables use TEXT)
- `search_vector`: **TEXT** type (all other tables use TSVECTOR)
- `compatible_jacks`: **TEXT** type (prod_faceplates uses ARRAY)
- Many columns are NOT NULL when other tables allow NULL

#### ⚠️ CRITICAL: prod_modular_plugs uses ALL TEXT columns!
- `id`: Uses SERIAL sequence but column is INTEGER
- All string columns are TEXT (not VARCHAR like other tables)
- This could cause JOIN and comparison issues

#### ⚠️ Timestamp Inconsistencies:
- Most tables: `timestamp without time zone`
- `prod_faceplates`: `timestamp WITH time zone` 
- `prod_jack_modules`: `timestamp WITH time zone`
- `prod_modular_plugs`: `timestamp WITH time zone`

### 2. Missing Standard Columns

#### ❌ prod_category_cables MISSING:
- `created_by` (no default)
- `last_modified_by` (no default)
- `product_line` column exists but not used

#### ❌ prod_jack_modules MISSING:
- `last_modified_by` column

#### ❌ prod_surface_mount_boxes MISSING:
- `id` column (NO PRIMARY KEY!)
- `created_by` column
- `last_modified_by` column

#### ❌ prod_fiber_cables MISSING:
- `product_line` column

### 3. Default Value Inconsistencies

#### Different defaults for is_active:
- Most tables: `DEFAULT true`
- Some tables: No default specified

#### Different defaults for timestamps:
- `created_at`: Some use `now()`, others use `CURRENT_TIMESTAMP`
- `updated_at`: Same inconsistency

#### Different defaults for created_by:
- Most tables: `DEFAULT 'system'`
- Some tables: No default

### 4. Column Naming Inconsistencies

#### Number of ports/gangs:
- `prod_faceplates`: `number_gang` (VARCHAR!)
- `prod_surface_mount_boxes`: `number_gang` (INTEGER)
- Standard should be: `number_of_gangs` (INTEGER)

#### Fiber types storage:
- All fiber tables correctly use ARRAY type
- `fiber_types` column is consistent

#### Color columns:
- Some tables: `color`
- Some tables: `jacket_color`, `adapter_color`, `boot_color`, `housing_color`
- Should standardize on context-specific names

### 5. Special Findings

#### ✅ Good: All tables have these required columns:
- `part_number` (NOT NULL)
- `brand` (mostly NOT NULL)
- `short_description`
- `is_active`
- `common_terms`
- `search_vector` (except surface_mount_boxes)
- `computed_search_terms`

#### ⚠️ Unique Constraints:
- Only some tables show UNIQUE on part_number
- This should be enforced on ALL tables

#### 📝 Sequence Usage:
- `prod_faceplates`: Uses `faceplates_id_seq`
- `prod_modular_plugs`: Uses `modular_plugs_id_seq`
- These are OLD sequence names from before renaming!

## 📊 Detailed Table Analysis

### prod_adapter_panels (26 rows)
- ✅ Has all standard columns including created_by, last_modified_by
- ✅ Proper data types throughout
- ✅ fiber_types is ARRAY type
- Total columns: 37

### prod_category_cables (841 rows) 
- ❌ MISSING: created_by, last_modified_by
- ⚠️ Has unused product_line column
- ✅ Proper VARCHAR types
- Total columns: 34

### prod_faceplates (294 rows)
- ✅ Has all standard columns
- ⚠️ Uses timestamp WITH time zone (inconsistent)
- ⚠️ number_gang is VARCHAR (should be INTEGER)
- ⚠️ OLD sequence name: faceplates_id_seq
- Total columns: 25

### prod_fiber_cables (25 rows)
- ✅ Has created_by, last_modified_by
- ❌ MISSING: product_line column
- ✅ fiber_types is ARRAY type
- Total columns: 24

### prod_fiber_connectors (47 rows)
- ✅ Has all standard columns
- ✅ fiber_types is ARRAY type (added last)
- ✅ Proper data types
- Total columns: 31

### prod_jack_modules (450 rows)
- ✅ Has created_by
- ❌ MISSING: last_modified_by
- ⚠️ Uses BIGINT for id (others use INTEGER)
- ⚠️ Uses timestamp WITH time zone
- Total columns: 24

### prod_modular_plugs (23 rows)
- ⚠️ ALL columns are TEXT type (should be VARCHAR)
- ⚠️ OLD sequence name: modular_plugs_id_seq
- ✅ Has created_by (but as TEXT)
- ❌ MISSING: last_modified_by
- Total columns: 29

### prod_rack_mount_fiber_enclosures (9 rows)
- ✅ Has all standard columns
- ✅ Proper data types
- ✅ panel_capacity column present
- Total columns: 32

### prod_surface_mount_boxes (83 rows)
- ❌ NO ID COLUMN - NO PRIMARY KEY!
- ❌ MISSING: created_by, last_modified_by
- ⚠️ common_terms is ARRAY (should be TEXT)
- ⚠️ search_vector is TEXT (should be TSVECTOR)
- ⚠️ compatible_jacks is TEXT (faceplates uses ARRAY)
- Total columns: 22

### prod_wall_mount_fiber_enclosures (9 rows)
- ✅ Has all standard columns
- ⚠️ part_number is nullable (should be NOT NULL)
- ✅ panel_capacity column present
- Total columns: 30

## 🔧 Required Fixes

### URGENT - Before Re-enabling Triggers:

1. **prod_surface_mount_boxes**:
   ```sql
   -- Add missing id column
   ALTER TABLE prod_surface_mount_boxes 
   ADD COLUMN id SERIAL PRIMARY KEY;
   
   -- Fix data types
   ALTER TABLE prod_surface_mount_boxes 
   ALTER COLUMN common_terms TYPE TEXT USING array_to_string(common_terms, ' ');
   
   ALTER TABLE prod_surface_mount_boxes 
   ALTER COLUMN search_vector TYPE TSVECTOR USING to_tsvector('english', COALESCE(search_vector, ''));
   ```

2. **prod_category_cables**:
   ```sql
   -- Add missing columns
   ALTER TABLE prod_category_cables 
   ADD COLUMN created_by VARCHAR(100) DEFAULT 'system',
   ADD COLUMN last_modified_by VARCHAR(100) DEFAULT 'system';
   ```

3. **prod_jack_modules**:
   ```sql
   -- Add missing column
   ALTER TABLE prod_jack_modules 
   ADD COLUMN last_modified_by VARCHAR(100) DEFAULT 'system';
   ```

4. **Fix timestamp inconsistencies**:
   ```sql
   -- Convert all to timestamp without time zone
   ALTER TABLE prod_faceplates 
   ALTER COLUMN created_at TYPE timestamp without time zone,
   ALTER COLUMN updated_at TYPE timestamp without time zone;
   
   -- Repeat for other tables with "with time zone"
   ```

5. **Fix sequence names**:
   ```sql
   -- Create new sequences with correct names
   CREATE SEQUENCE prod_faceplates_id_seq;
   CREATE SEQUENCE prod_modular_plugs_id_seq;
   
   -- Update the default values
   ALTER TABLE prod_faceplates 
   ALTER COLUMN id SET DEFAULT nextval('prod_faceplates_id_seq');
   ```

## 📋 Column Standardization Checklist

### Every product table MUST have:
- [x] id (INTEGER or SERIAL PRIMARY KEY)
- [x] part_number (VARCHAR NOT NULL UNIQUE)
- [x] brand (VARCHAR NOT NULL)
- [x] short_description (TEXT)
- [x] category (VARCHAR with default)
- [x] is_active (BOOLEAN DEFAULT true)
- [x] common_terms (TEXT not ARRAY)
- [x] computed_search_terms (TEXT)
- [x] search_vector (TSVECTOR not TEXT)
- [x] created_at (TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW())
- [x] updated_at (TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW())
- [x] created_by (VARCHAR DEFAULT 'system')
- [x] last_modified_by (VARCHAR DEFAULT 'system')

### Notes on Special Columns:
- `product_line`: Should be VARCHAR(100) when used
- `fiber_types`: Always ARRAY type for fiber products
- `compatible_jacks`: Should be TEXT[] array type
- `number_of_ports`: Always INTEGER
- `number_of_gangs`: Always INTEGER (not VARCHAR)

---
**Generated**: June 20, 2025
**Purpose**: Detailed column analysis to fix before re-enabling triggers