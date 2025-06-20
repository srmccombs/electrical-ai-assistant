-- Migration 022: Create tables for business rules and detection logic
-- This creates new tables to store complex business logic

BEGIN;

-- =====================================================
-- 1. Business Rules Table
-- =====================================================
CREATE TABLE IF NOT EXISTS business_rules (
    id SERIAL PRIMARY KEY,
    rule_type VARCHAR(50) NOT NULL CHECK (rule_type IN (
        'redirect', 'validation', 'conversion', 'normalization', 'blocking'
    )),
    rule_name VARCHAR(100) NOT NULL UNIQUE,
    source_pattern VARCHAR(500), -- Can be regex
    target_value VARCHAR(500),
    rule_config JSONB NOT NULL DEFAULT '{}',
    priority INT DEFAULT 100,
    is_active BOOLEAN DEFAULT true,
    applicable_tables TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_business_rules_type ON business_rules(rule_type);
CREATE INDEX idx_business_rules_active ON business_rules(is_active);
CREATE INDEX idx_business_rules_priority ON business_rules(priority DESC);

-- =====================================================
-- 2. Detection Patterns Table
-- =====================================================
CREATE TABLE IF NOT EXISTS detection_patterns (
    id SERIAL PRIMARY KEY,
    detection_type VARCHAR(50) NOT NULL CHECK (detection_type IN (
        'jacket', 'category', 'brand', 'color', 'shielding', 'quantity',
        'awg', 'polish', 'environment', 'product_line', 'part_number',
        'cross_reference', 'packaging', 'mount_type', 'connector_type'
    )),
    pattern VARCHAR(500) NOT NULL, -- Regex pattern
    result_value VARCHAR(100) NOT NULL,
    priority INT DEFAULT 100, -- Higher priority patterns are checked first
    conditions JSONB DEFAULT '{}', -- Additional conditions
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_detection_patterns_type ON detection_patterns(detection_type);
CREATE INDEX idx_detection_patterns_active ON detection_patterns(is_active);
CREATE INDEX idx_detection_patterns_priority ON detection_patterns(priority DESC);

-- =====================================================
-- 3. Term Equivalencies Table
-- =====================================================
CREATE TABLE IF NOT EXISTS term_equivalencies (
    id SERIAL PRIMARY KEY,
    primary_term VARCHAR(100) NOT NULL,
    equivalent_terms TEXT[] NOT NULL,
    context VARCHAR(50) NOT NULL CHECK (context IN (
        'jacket', 'brand', 'color', 'category', 'product_line',
        'connector', 'general', 'shielding', 'fiber_type'
    )),
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_term_equiv_primary ON term_equivalencies(primary_term);
CREATE INDEX idx_term_equiv_context ON term_equivalencies(context);
CREATE INDEX idx_term_equiv_active ON term_equivalencies(is_active);

-- =====================================================
-- 4. Validation Rules Table
-- =====================================================
CREATE TABLE IF NOT EXISTS validation_rules (
    id SERIAL PRIMARY KEY,
    rule_name VARCHAR(100) NOT NULL UNIQUE,
    rule_type VARCHAR(50) NOT NULL CHECK (rule_type IN (
        'blocked_terms', 'required_terms', 'pattern_match', 'custom'
    )),
    blocked_terms TEXT[],
    allowed_terms TEXT[],
    required_pattern VARCHAR(500), -- Regex for validation
    error_message TEXT NOT NULL,
    suggestion TEXT,
    applicable_tables TEXT[],
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_validation_rules_type ON validation_rules(rule_type);
CREATE INDEX idx_validation_rules_active ON validation_rules(is_active);

-- =====================================================
-- 5. Quantity Conversions Table
-- =====================================================
CREATE TABLE IF NOT EXISTS quantity_conversions (
    id SERIAL PRIMARY KEY,
    unit_from VARCHAR(50) NOT NULL,
    unit_to VARCHAR(50) NOT NULL,
    conversion_factor DECIMAL(10,4) NOT NULL,
    product_context VARCHAR(50), -- e.g., 'category_cable', 'fiber_cable'
    conditions JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_qty_conv_from ON quantity_conversions(unit_from);
CREATE INDEX idx_qty_conv_to ON quantity_conversions(unit_to);
CREATE INDEX idx_qty_conv_context ON quantity_conversions(product_context);

-- =====================================================
-- 6. Brand Mappings Table (for synonyms and variations)
-- =====================================================
CREATE TABLE IF NOT EXISTS brand_mappings (
    id SERIAL PRIMARY KEY,
    search_term VARCHAR(100) NOT NULL,
    canonical_brand VARCHAR(100) NOT NULL,
    brand_variations TEXT[] DEFAULT '{}',
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_brand_map_term ON brand_mappings(search_term);
CREATE INDEX idx_brand_map_canonical ON brand_mappings(canonical_brand);

-- =====================================================
-- 7. Color Mappings Table
-- =====================================================
CREATE TABLE IF NOT EXISTS color_mappings (
    id SERIAL PRIMARY KEY,
    search_term VARCHAR(100) NOT NULL,
    canonical_color VARCHAR(50) NOT NULL,
    color_variations TEXT[] DEFAULT '{}',
    hex_code VARCHAR(7),
    is_special BOOLEAN DEFAULT false, -- For cases like "stainless steel"
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_color_map_term ON color_mappings(search_term);
CREATE INDEX idx_color_map_canonical ON color_mappings(canonical_color);

-- =====================================================
-- Update triggers for updated_at
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_business_rules_updated_at BEFORE UPDATE
    ON business_rules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Grant permissions
-- =====================================================
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;

COMMIT;