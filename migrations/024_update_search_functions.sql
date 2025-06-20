-- Migration 024: Update search functions to use intelligence from database
-- This creates database functions to replace hardcoded TypeScript logic

BEGIN;

-- =====================================================
-- 1. Function to detect jacket type from database patterns
-- =====================================================
CREATE OR REPLACE FUNCTION detect_jacket_type(search_term TEXT)
RETURNS TEXT AS $$
DECLARE
    detected_jacket TEXT;
BEGIN
    -- Use detection patterns ordered by priority
    SELECT result_value INTO detected_jacket
    FROM detection_patterns
    WHERE detection_type = 'jacket'
    AND is_active = true
    AND search_term ~* pattern
    ORDER BY priority DESC
    LIMIT 1;
    
    RETURN detected_jacket;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 2. Function to detect category rating
-- =====================================================
CREATE OR REPLACE FUNCTION detect_category_rating(search_term TEXT)
RETURNS TEXT AS $$
DECLARE
    detected_category TEXT;
BEGIN
    SELECT result_value INTO detected_category
    FROM detection_patterns
    WHERE detection_type = 'category'
    AND is_active = true
    AND search_term ~* pattern
    ORDER BY priority DESC
    LIMIT 1;
    
    RETURN detected_category;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 3. Function to apply business rules (redirects, conversions)
-- =====================================================
CREATE OR REPLACE FUNCTION apply_business_rules(search_term TEXT)
RETURNS JSONB AS $$
DECLARE
    rule RECORD;
    result JSONB := '{"original_term": "", "processed_term": "", "was_redirected": false, "redirect_message": null}'::jsonb;
BEGIN
    result := jsonb_set(result, '{original_term}', to_jsonb(search_term));
    result := jsonb_set(result, '{processed_term}', to_jsonb(search_term));
    
    -- Check for redirect rules
    FOR rule IN 
        SELECT * FROM business_rules
        WHERE rule_type = 'redirect'
        AND is_active = true
        AND search_term ~* source_pattern
        ORDER BY priority DESC
        LIMIT 1
    LOOP
        result := jsonb_set(result, '{processed_term}', to_jsonb(rule.target_value));
        result := jsonb_set(result, '{was_redirected}', 'true'::jsonb);
        result := jsonb_set(result, '{redirect_message}', to_jsonb(rule.rule_config->>'message'));
        EXIT;
    END LOOP;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 4. Function to validate search query
-- =====================================================
CREATE OR REPLACE FUNCTION validate_search_query(query_text TEXT)
RETURNS JSONB AS $$
DECLARE
    validation_rule RECORD;
    blocked_term TEXT;
    result JSONB := '{"is_valid": true, "message": null, "suggestion": null}'::jsonb;
BEGIN
    -- Check blocked terms
    FOR validation_rule IN 
        SELECT * FROM validation_rules
        WHERE rule_type = 'blocked_terms'
        AND is_active = true
    LOOP
        FOREACH blocked_term IN ARRAY validation_rule.blocked_terms
        LOOP
            IF lower(query_text) LIKE '%' || blocked_term || '%' THEN
                result := jsonb_set(result, '{is_valid}', 'false'::jsonb);
                result := jsonb_set(result, '{message}', to_jsonb(validation_rule.error_message));
                result := jsonb_set(result, '{suggestion}', to_jsonb(validation_rule.suggestion));
                RETURN result;
            END IF;
        END LOOP;
    END LOOP;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 5. Function to detect brand with mappings
-- =====================================================
CREATE OR REPLACE FUNCTION detect_brand(search_term TEXT)
RETURNS TEXT AS $$
DECLARE
    detected_brand TEXT;
BEGIN
    -- First check brand mappings
    SELECT canonical_brand INTO detected_brand
    FROM brand_mappings
    WHERE is_active = true
    AND (
        lower(search_term) LIKE '%' || lower(search_term) || '%'
        OR search_term = ANY(brand_variations)
    )
    LIMIT 1;
    
    -- If not found, check detection patterns
    IF detected_brand IS NULL THEN
        SELECT result_value INTO detected_brand
        FROM detection_patterns
        WHERE detection_type = 'brand'
        AND is_active = true
        AND search_term ~* pattern
        ORDER BY priority DESC
        LIMIT 1;
    END IF;
    
    RETURN detected_brand;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 6. Function to detect color with special cases
-- =====================================================
CREATE OR REPLACE FUNCTION detect_color(search_term TEXT)
RETURNS TEXT AS $$
DECLARE
    detected_color TEXT;
BEGIN
    -- Check color mappings
    SELECT canonical_color INTO detected_color
    FROM color_mappings
    WHERE is_active = true
    AND (
        lower(search_term) LIKE '%' || lower(search_term) || '%'
        OR search_term = ANY(color_variations)
    )
    ORDER BY is_special DESC -- Special colors like stainless steel first
    LIMIT 1;
    
    -- If not found, check detection patterns
    IF detected_color IS NULL THEN
        SELECT result_value INTO detected_color
        FROM detection_patterns
        WHERE detection_type = 'color'
        AND is_active = true
        AND search_term ~* pattern
        ORDER BY priority DESC
        LIMIT 1;
    END IF;
    
    RETURN detected_color;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 7. Function to convert quantities
-- =====================================================
CREATE OR REPLACE FUNCTION convert_quantity(quantity_value NUMERIC, unit_from TEXT, product_context TEXT DEFAULT NULL)
RETURNS TABLE(converted_value NUMERIC, unit_to TEXT) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        quantity_value * qc.conversion_factor as converted_value,
        qc.unit_to
    FROM quantity_conversions qc
    WHERE qc.unit_from = lower(unit_from)
    AND qc.is_active = true
    AND (qc.product_context IS NULL OR qc.product_context = product_context)
    ORDER BY qc.product_context NULLS LAST
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 8. Function to get all search terms for a product
-- =====================================================
CREATE OR REPLACE FUNCTION get_product_search_terms(
    p_table_name TEXT,
    p_part_number TEXT,
    p_brand TEXT,
    p_category TEXT DEFAULT NULL,
    p_jacket TEXT DEFAULT NULL,
    p_shielding TEXT DEFAULT NULL
)
RETURNS TEXT[] AS $$
DECLARE
    search_terms_array TEXT[] := '{}';
    term_rec RECORD;
BEGIN
    -- Get all matching search terms
    FOR term_rec IN
        SELECT DISTINCT search_term
        FROM search_terms
        WHERE p_table_name = ANY(applicable_tables)
        AND is_active = true
        AND (
            -- Match by arrays
            (p_category = ANY(categories) OR cardinality(categories) = 0)
            OR (p_jacket = ANY(jackets) OR cardinality(jackets) = 0)
            OR (p_shielding = ANY(shielding) OR cardinality(shielding) = 0)
            OR (p_brand = ANY(brands) OR cardinality(brands) = 0)
        )
    LOOP
        search_terms_array := array_append(search_terms_array, term_rec.search_term);
    END LOOP;
    
    -- Add basic terms
    search_terms_array := array_append(search_terms_array, p_part_number);
    search_terms_array := array_append(search_terms_array, p_brand);
    
    -- Remove nulls and duplicates
    search_terms_array := ARRAY(SELECT DISTINCT unnest(search_terms_array) WHERE unnest IS NOT NULL);
    
    RETURN search_terms_array;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 9. Function to detect all attributes from search term
-- =====================================================
CREATE OR REPLACE FUNCTION detect_all_attributes(search_term TEXT)
RETURNS JSONB AS $$
DECLARE
    result JSONB := '{}'::jsonb;
    pattern_rec RECORD;
    temp_value TEXT;
BEGIN
    -- Detect each type
    FOR pattern_rec IN
        SELECT DISTINCT ON (detection_type) 
            detection_type, 
            result_value
        FROM detection_patterns
        WHERE is_active = true
        AND search_term ~* pattern
        ORDER BY detection_type, priority DESC
    LOOP
        result := jsonb_set(result, 
            ARRAY[pattern_rec.detection_type], 
            to_jsonb(pattern_rec.result_value));
    END LOOP;
    
    -- Apply business rules
    SELECT (apply_business_rules(search_term))->>'processed_term' INTO temp_value;
    IF temp_value != search_term THEN
        result := jsonb_set(result, '{redirected_to}', to_jsonb(temp_value));
    END IF;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 10. Create indexes for performance
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_detection_patterns_pattern ON detection_patterns USING gin(pattern gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_brand_mappings_variations ON brand_mappings USING gin(brand_variations);
CREATE INDEX IF NOT EXISTS idx_color_mappings_variations ON color_mappings USING gin(color_variations);

-- =====================================================
-- 11. Grant permissions
-- =====================================================
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- =====================================================
-- 12. Create helper views for common queries
-- =====================================================

-- View for active jacket mappings
CREATE OR REPLACE VIEW v_jacket_mappings AS
SELECT 
    dp.pattern as search_pattern,
    dp.result_value as jacket_type,
    dp.priority,
    te.equivalent_terms
FROM detection_patterns dp
LEFT JOIN term_equivalencies te ON te.primary_term = dp.result_value AND te.context = 'jacket'
WHERE dp.detection_type = 'jacket'
AND dp.is_active = true
ORDER BY dp.priority DESC;

-- View for active brand mappings
CREATE OR REPLACE VIEW v_brand_mappings AS
SELECT 
    bm.search_term,
    bm.canonical_brand,
    bm.brand_variations,
    dp.pattern,
    dp.priority
FROM brand_mappings bm
LEFT JOIN detection_patterns dp ON dp.result_value = bm.canonical_brand AND dp.detection_type = 'brand'
WHERE bm.is_active = true
ORDER BY dp.priority DESC NULLS LAST;

COMMIT;