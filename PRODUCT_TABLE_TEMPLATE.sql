-- =====================================================
-- PRODUCT TABLE CREATION TEMPLATE
-- Created: June 19, 2025
-- 
-- Use this template when creating new product tables
-- Replace [PRODUCT_TYPE] with your actual product type
-- Example: patch_panels, cable_testers, etc.
-- =====================================================

-- =====================================================
-- SECTION 1: CREATE TABLE
-- =====================================================

-- Drop table if you need to recreate (BE CAREFUL IN PRODUCTION!)
-- DROP TABLE IF EXISTS [PRODUCT_TYPE];

CREATE TABLE IF NOT EXISTS [PRODUCT_TYPE] (
    -- ===== REQUIRED COLUMNS (EVERY TABLE MUST HAVE THESE) =====
    id SERIAL PRIMARY KEY,
    part_number VARCHAR(255) NOT NULL UNIQUE,
    brand VARCHAR(100) NOT NULL,
    brand_normalized VARCHAR(100) GENERATED ALWAYS AS (UPPER(TRIM(brand))) STORED,
    short_description TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    category VARCHAR(100) NOT NULL, -- e.g., 'Patch Panel', 'Cable Tester'
    
    -- ===== TIMESTAMPS =====
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    last_modified_by VARCHAR(255),
    
    -- ===== RECOMMENDED COLUMNS (INCLUDE THESE FOR BETTER FUNCTIONALITY) =====
    upc_number VARCHAR(50),
    unit_price DECIMAL(10,2),
    stock_quantity INTEGER DEFAULT 0,
    lead_time VARCHAR(50) DEFAULT 'Ships Today',
    manufacturer_part_number VARCHAR(255), -- If different from part_number
    
    -- Search optimization
    common_terms TEXT, -- Space-separated search keywords
    search_vector TSVECTOR GENERATED ALWAYS AS (
        setweight(to_tsvector('english', COALESCE(part_number, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(brand, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(short_description, '')), 'C') ||
        setweight(to_tsvector('english', COALESCE(common_terms, '')), 'D')
    ) STORED,
    
    -- Cross-reference and compatibility
    possible_cross TEXT, -- Alternative part numbers
    possible_equivalent TEXT, -- Equivalent products
    go_with_items TEXT, -- Related products
    
    -- Product details
    image_file VARCHAR(500),
    datasheet_url VARCHAR(500),
    product_line VARCHAR(100), -- e.g., 'Mini-Com', 'NetKey'
    
    -- ===== CATEGORY-SPECIFIC COLUMNS (CHOOSE WHAT APPLIES) =====
    
    -- === For Cable Products ===
    -- category_rating TEXT[], -- Array: '{"Category 6", "Category 6a"}'
    -- jacket_rating VARCHAR(50), -- 'Plenum', 'Riser', 'LSZH'
    -- jacket_color VARCHAR(50),
    -- jacket_material VARCHAR(50),
    -- shielding_type VARCHAR(50), -- 'UTP', 'STP', 'F/UTP'
    -- conductor_awg INTEGER, -- 23, 24, etc.
    -- pair_count VARCHAR(20), -- '4-Pair', '25-Pair'
    -- cable_diameter_in DECIMAL(5,3),
    -- length_ft INTEGER,
    -- packaging_type VARCHAR(50), -- 'Box', 'Reel', 'Spool'
    
    -- === For Connector/Plug Products ===
    -- category_rating TEXT[], -- Array format
    -- shielding_type VARCHAR(50),
    -- conductor_awg INTEGER,
    -- housing_color VARCHAR(50),
    -- boot_color VARCHAR(50),
    -- connector_type VARCHAR(50), -- 'LC', 'SC', 'RJ45'
    -- polish VARCHAR(50), -- 'UPC', 'APC' (for fiber)
    -- compatible_cables TEXT[], -- Array of compatible cable types
    -- compatible_boots TEXT[], -- Array of compatible boot part numbers
    -- packaging_qty INTEGER, -- 20, 50, 100, 500
    -- max_cable_od DECIMAL(5,3), -- Maximum cable OD in inches
    
    -- === For Enclosure/Box Products ===
    -- number_of_ports INTEGER,
    -- number_gang INTEGER,
    -- mounting_type VARCHAR(50), -- 'Wall Mount', 'Rack Mount', 'Surface Mount'
    -- mount_type VARCHAR(100), -- Can be multiple: 'Wall Mount, Rack Mount'
    -- color VARCHAR(50),
    -- material VARCHAR(50), -- 'Plastic', 'Metal', 'Die-cast Aluminum'
    -- dimensions VARCHAR(100), -- 'H x W x D'
    -- rack_units INTEGER, -- For rack mount products
    -- compatible_jacks TEXT[], -- Array: '{"Keystone", "Mini-Com"}'
    -- compatible_modules TEXT[],
    -- environment VARCHAR(50), -- 'Indoor', 'Outdoor', 'Indoor/Outdoor'
    
    -- === For Panel Products ===
    -- panel_type VARCHAR(50), -- 'MTP', 'LC', 'SC'
    -- fiber_count INTEGER,
    -- number_of_adapter_per_panel INTEGER,
    -- adapter_color VARCHAR(50),
    -- termination_type VARCHAR(50),
    -- supports_apc BOOLEAN DEFAULT false,
    -- compatible_enclosures TEXT,
    
    -- === For Tool/Accessory Products ===
    -- tool_type VARCHAR(50),
    -- compatible_with TEXT[], -- Array of compatible products
    -- requires_power BOOLEAN DEFAULT false,
    -- power_type VARCHAR(50), -- 'Battery', 'AC', 'USB'
    -- includes_accessories TEXT,
    
    -- === Application-specific ===
    -- application TEXT, -- '[DUCTS, UNDERGROUND CONDUIT, INTRABUILDING]'
    -- temperature_rating VARCHAR(50),
    -- fire_rating VARCHAR(50),
    -- standards_compliance TEXT[], -- '{"TIA/EIA-568", "ISO/IEC 11801"}'
    
    -- Constraints
    CONSTRAINT chk_brand_not_empty CHECK (TRIM(brand) != ''),
    CONSTRAINT chk_part_number_not_empty CHECK (TRIM(part_number) != ''),
    CONSTRAINT chk_description_not_empty CHECK (TRIM(short_description) != '')
);

-- ===== INDEXES FOR PERFORMANCE =====
CREATE INDEX idx_[PRODUCT_TYPE]_part_number ON [PRODUCT_TYPE](part_number);
CREATE INDEX idx_[PRODUCT_TYPE]_brand ON [PRODUCT_TYPE](brand);
CREATE INDEX idx_[PRODUCT_TYPE]_brand_normalized ON [PRODUCT_TYPE](brand_normalized);
CREATE INDEX idx_[PRODUCT_TYPE]_is_active ON [PRODUCT_TYPE](is_active);
CREATE INDEX idx_[PRODUCT_TYPE]_category ON [PRODUCT_TYPE](category);
CREATE INDEX idx_[PRODUCT_TYPE]_search_vector ON [PRODUCT_TYPE] USING gin(search_vector);

-- Category-specific indexes (uncomment as needed)
-- CREATE INDEX idx_[PRODUCT_TYPE]_category_rating ON [PRODUCT_TYPE] USING gin(category_rating);
-- CREATE INDEX idx_[PRODUCT_TYPE]_shielding ON [PRODUCT_TYPE](shielding_type);
-- CREATE INDEX idx_[PRODUCT_TYPE]_product_line ON [PRODUCT_TYPE](product_line);

-- =====================================================
-- SECTION 2: TRIGGERS
-- =====================================================

-- Auto-update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_[PRODUCT_TYPE]_updated_at
    BEFORE UPDATE ON [PRODUCT_TYPE]
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- Sync to mayer_stock trigger (if using Mayer integration)
CREATE OR REPLACE FUNCTION sync_[PRODUCT_TYPE]_to_mayer()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO mayer_stock (
            part_number, 
            brand,
            short_description,
            branch,
            second_item_number,
            qty_on_hand,
            unit_price,
            created_at,
            created_by
        ) VALUES (
            NEW.part_number,
            NEW.brand,
            NEW.short_description,
            'WEB',
            NULL,
            0,
            NEW.unit_price,
            CURRENT_TIMESTAMP,
            COALESCE(NEW.created_by, 'system')
        )
        ON CONFLICT (part_number) DO UPDATE SET
            brand = EXCLUDED.brand,
            short_description = EXCLUDED.short_description,
            unit_price = EXCLUDED.unit_price,
            updated_at = CURRENT_TIMESTAMP;
    
    ELSIF TG_OP = 'UPDATE' THEN
        UPDATE mayer_stock SET
            brand = NEW.brand,
            short_description = NEW.short_description,
            unit_price = NEW.unit_price,
            updated_at = CURRENT_TIMESTAMP,
            last_modified_by = COALESCE(NEW.last_modified_by, 'system')
        WHERE part_number = NEW.part_number;
    
    ELSIF TG_OP = 'DELETE' THEN
        DELETE FROM mayer_stock WHERE part_number = OLD.part_number;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_[PRODUCT_TYPE]_to_mayer
    AFTER INSERT OR UPDATE OR DELETE ON [PRODUCT_TYPE]
    FOR EACH ROW
    EXECUTE FUNCTION sync_[PRODUCT_TYPE]_to_mayer();

-- =====================================================
-- SECTION 3: SAMPLE DATA INSERTION
-- =====================================================

-- Example: Insert sample products (adjust columns based on your product type)
/*
INSERT INTO [PRODUCT_TYPE] (
    part_number,
    brand,
    short_description,
    category,
    is_active,
    common_terms,
    unit_price,
    stock_quantity,
    -- Add category-specific columns here
) VALUES 
(
    'SAMPLE-001',
    'Sample Brand',
    'Sample Product Description - Replace with actual product',
    'Product Category Name',
    true,
    'sample search terms keywords common misspellings alternate names',
    99.99,
    100
    -- Add category-specific values here
),
(
    'SAMPLE-002',
    'Another Brand',
    'Another Sample Product - This is a template',
    'Product Category Name',
    true,
    'more search terms product specific keywords industry slang',
    149.99,
    50
);
*/

-- =====================================================
-- SECTION 4: COMMON_TERMS POPULATION EXAMPLES
-- =====================================================

-- Update common_terms with comprehensive search keywords
-- This is CRITICAL for search functionality!

/*
-- Example for patch panels:
UPDATE [PRODUCT_TYPE]
SET common_terms = LOWER(CONCAT_WS(' ',
    -- Primary terms
    'patch panel', 'patch-panel', 'patchpanel',
    -- Type variations
    CASE 
        WHEN panel_type = 'LC' THEN 'lc panel fiber panel'
        WHEN panel_type = 'MTP' THEN 'mtp panel mpo panel'
        ELSE ''
    END,
    -- Brand variations
    LOWER(brand),
    CASE 
        WHEN brand = 'PANDUIT' THEN 'panduit pan'
        WHEN brand = 'Corning' THEN 'corning ccg'
        ELSE ''
    END,
    -- Category variations
    REPLACE(LOWER(category_rating), ' ', ''),
    -- Common misspellings
    'pach panel', 'patch pannel',
    -- Part number components
    LOWER(part_number),
    REPLACE(LOWER(part_number), '-', ' ')
))
WHERE common_terms IS NULL OR common_terms = '';
*/

-- =====================================================
-- SECTION 5: DATA VERIFICATION QUERIES
-- =====================================================

-- Run these after importing data to verify everything is correct:

-- 1. Check for required fields
SELECT 
    COUNT(*) as total_records,
    COUNT(CASE WHEN TRIM(part_number) = '' OR part_number IS NULL THEN 1 END) as missing_part_numbers,
    COUNT(CASE WHEN TRIM(brand) = '' OR brand IS NULL THEN 1 END) as missing_brands,
    COUNT(CASE WHEN TRIM(short_description) = '' OR short_description IS NULL THEN 1 END) as missing_descriptions,
    COUNT(CASE WHEN category IS NULL OR category = '' THEN 1 END) as missing_categories
FROM [PRODUCT_TYPE];

-- 2. Check for trailing spaces (common issue!)
SELECT 
    COUNT(*) as brands_with_trailing_spaces
FROM [PRODUCT_TYPE]
WHERE brand != TRIM(brand);

-- 3. Verify active products
SELECT 
    COUNT(*) as total,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active,
    COUNT(CASE WHEN is_active = false THEN 1 END) as inactive,
    COUNT(CASE WHEN is_active IS NULL THEN 1 END) as null_active
FROM [PRODUCT_TYPE];

-- 4. Check search readiness
SELECT 
    COUNT(*) as total,
    COUNT(common_terms) as with_search_terms,
    COUNT(search_vector) as with_search_vector
FROM [PRODUCT_TYPE]
WHERE is_active = true;

-- 5. Sample data review
SELECT 
    part_number,
    brand,
    category,
    short_description,
    is_active,
    LEFT(common_terms, 100) as search_terms_preview
FROM [PRODUCT_TYPE]
LIMIT 10;

-- =====================================================
-- SECTION 6: COMMON FIXES
-- =====================================================

-- Fix trailing spaces in brands
UPDATE [PRODUCT_TYPE]
SET brand = TRIM(brand)
WHERE brand != TRIM(brand);

-- Set default category if missing
UPDATE [PRODUCT_TYPE]
SET category = 'Your Product Category'
WHERE category IS NULL OR category = '';

-- Ensure all products have is_active set
UPDATE [PRODUCT_TYPE]
SET is_active = true
WHERE is_active IS NULL;

-- =====================================================
-- SECTION 7: INTEGRATION CHECKLIST
-- =====================================================

/*
After creating your table, complete these steps:

1. [ ] Add table configuration to /config/productTypes.ts
2. [ ] Create search implementation at /search/[productType]/[productType]Search.ts
3. [ ] Update /services/searchService.ts:
   - [ ] Add to searchByPartNumber field mapping
   - [ ] Update determineCategoryFromTable function
4. [ ] Update /types/search.ts if new specifications needed
5. [ ] Test search functionality:
   - [ ] Generic search (returns all products)
   - [ ] Filtered search (by brand, category, etc.)
   - [ ] Part number search
   - [ ] Cross-reference search
6. [ ] Verify smart filters are generated correctly
7. [ ] Test shopping list compatibility if applicable
*/

-- =====================================================
-- NAMING CONVENTIONS REMINDER
-- =====================================================

/*
CRITICAL NAMING RULES:
1. Table names: snake_case, plural (patch_panels, not PatchPanel)
2. Column names: snake_case (number_of_ports, not numberOfPorts)
3. Category values: Title Case ('Patch Panel', not 'patch_panel')
4. Brand values: Exact as displayed ('PANDUIT', not 'Panduit')
5. Colors: Full names ('Black', not 'BK' or 'BLK')
6. Shielding: Standard abbreviations ('UTP', 'STP', 'F/UTP')

ARRAY FORMAT:
PostgreSQL arrays use this format: '{"value1", "value2", "value3"}'
Example: category_rating = '{"Category 6", "Category 6a"}'

SEARCH OPTIMIZATION:
1. Always populate common_terms with variations
2. Include misspellings users might type
3. Add industry slang and abbreviations
4. Include both hyphenated and non-hyphenated versions
5. Add singular and plural forms
*/