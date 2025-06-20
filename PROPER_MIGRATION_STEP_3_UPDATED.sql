-- ================================================================
-- PROPER MIGRATION STEP 3: Create Intelligent Functions
-- UPDATED VERSION - Uses correct column names
-- ================================================================

BEGIN;

-- 1. Function to apply redirects
CREATE OR REPLACE FUNCTION apply_search_redirects(query_text TEXT)
RETURNS TEXT AS $$
DECLARE
    redirect_result TEXT;
    search_term_match TEXT;
BEGIN
    -- Look for redirects in order of priority
    SELECT search_term, redirect_to INTO search_term_match, redirect_result
    FROM search_terms
    WHERE context = 'redirect'
      AND is_active = true
      AND LOWER(query_text) LIKE '%' || LOWER(search_term) || '%'
    ORDER BY priority DESC, LENGTH(search_term) DESC
    LIMIT 1;
    
    -- If redirect found, replace in query
    IF redirect_result IS NOT NULL THEN
        RETURN REPLACE(LOWER(query_text), search_term_match, redirect_result);
    END IF;
    
    RETURN query_text;
END;
$$ LANGUAGE plpgsql;

-- 2. Function to detect jacket type (using jacket_types column)
CREATE OR REPLACE FUNCTION detect_jacket_type(query_text TEXT)
RETURNS TEXT AS $$
DECLARE
    jacket_result TEXT;
BEGIN
    SELECT jacket_types[1] INTO jacket_result
    FROM search_terms
    WHERE context = 'jacket'
      AND is_active = true
      AND jacket_types IS NOT NULL
      AND LOWER(query_text) LIKE '%' || LOWER(search_term) || '%'
    ORDER BY priority DESC, LENGTH(search_term) DESC
    LIMIT 1;
    
    RETURN jacket_result;
END;
$$ LANGUAGE plpgsql;

-- 3. Function to detect category rating
CREATE OR REPLACE FUNCTION detect_category_rating(query_text TEXT)
RETURNS TEXT AS $$
DECLARE
    category_result TEXT;
BEGIN
    SELECT categories[1] INTO category_result
    FROM search_terms
    WHERE context = 'category'
      AND is_active = true
      AND categories IS NOT NULL
      AND LOWER(query_text) LIKE '%' || LOWER(search_term) || '%'
    ORDER BY priority DESC, LENGTH(search_term) DESC
    LIMIT 1;
    
    RETURN category_result;
END;
$$ LANGUAGE plpgsql;

-- 4. Function to convert quantities
CREATE OR REPLACE FUNCTION convert_quantity(query_text TEXT)
RETURNS NUMERIC AS $$
DECLARE
    quantity_match TEXT;
    base_number NUMERIC;
    conversion NUMERIC;
BEGIN
    -- Extract number and unit
    quantity_match := SUBSTRING(LOWER(query_text) FROM '([0-9]+)\s*(box|boxes|spool|spools|reel|reels|pair|pairs)');
    
    IF quantity_match IS NOT NULL THEN
        -- Get the number
        base_number := SUBSTRING(quantity_match FROM '([0-9]+)')::NUMERIC;
        
        -- Get conversion factor
        SELECT conversion_factor INTO conversion
        FROM search_terms
        WHERE context = 'quantity'
          AND is_active = true
          AND quantity_match LIKE '%' || search_term || '%'
        ORDER BY priority DESC
        LIMIT 1;
        
        IF conversion IS NOT NULL THEN
            RETURN base_number * conversion;
        END IF;
    END IF;
    
    -- Return original number if found, or NULL
    RETURN SUBSTRING(query_text FROM '([0-9]+)')::NUMERIC;
END;
$$ LANGUAGE plpgsql;

-- 5. Function to detect brands
CREATE OR REPLACE FUNCTION detect_brand(query_text TEXT)
RETURNS TEXT AS $$
DECLARE
    brand_result TEXT;
BEGIN
    SELECT brands[1] INTO brand_result
    FROM search_terms
    WHERE context = 'brand'
      AND is_active = true
      AND brands IS NOT NULL
      AND LOWER(query_text) LIKE '%' || LOWER(search_term) || '%'
    ORDER BY priority DESC, LENGTH(search_term) DESC
    LIMIT 1;
    
    RETURN brand_result;
END;
$$ LANGUAGE plpgsql;

-- 6. Function to detect shielding type (using shielding_types column)
CREATE OR REPLACE FUNCTION detect_shielding_type(query_text TEXT)
RETURNS TEXT AS $$
DECLARE
    shielding_result TEXT;
BEGIN
    SELECT shielding_types[1] INTO shielding_result
    FROM search_terms
    WHERE context = 'shielding'
      AND is_active = true
      AND shielding_types IS NOT NULL
      AND LOWER(query_text) LIKE '%' || LOWER(search_term) || '%'
    ORDER BY priority DESC, LENGTH(search_term) DESC
    LIMIT 1;
    
    RETURN shielding_result;
END;
$$ LANGUAGE plpgsql;

-- 7. Function to detect fiber type
CREATE OR REPLACE FUNCTION detect_fiber_type(query_text TEXT)
RETURNS TEXT AS $$
DECLARE
    fiber_result TEXT;
BEGIN
    SELECT fiber_types[1] INTO fiber_result
    FROM search_terms
    WHERE context = 'fiber'
      AND is_active = true
      AND fiber_types IS NOT NULL
      AND LOWER(query_text) LIKE '%' || LOWER(search_term) || '%'
    ORDER BY priority DESC, LENGTH(search_term) DESC
    LIMIT 1;
    
    RETURN fiber_result;
END;
$$ LANGUAGE plpgsql;

-- 8. Function to detect connector type
CREATE OR REPLACE FUNCTION detect_connector_type(query_text TEXT)
RETURNS TEXT AS $$
DECLARE
    connector_result TEXT;
BEGIN
    SELECT connector_types[1] INTO connector_result
    FROM search_terms
    WHERE context = 'connector'
      AND is_active = true
      AND connector_types IS NOT NULL
      AND LOWER(query_text) LIKE '%' || LOWER(search_term) || '%'
    ORDER BY priority DESC, LENGTH(search_term) DESC
    LIMIT 1;
    
    RETURN connector_result;
END;
$$ LANGUAGE plpgsql;

-- 9. Master function to extract all attributes
CREATE OR REPLACE FUNCTION extract_search_attributes(query_text TEXT)
RETURNS TABLE(
    original_query TEXT,
    redirected_query TEXT,
    category_rating TEXT,
    jacket_type TEXT,
    shielding_type TEXT,
    brand TEXT,
    quantity NUMERIC,
    fiber_type TEXT,
    connector_type TEXT
) AS $$
DECLARE
    processed_query TEXT;
BEGIN
    -- Apply redirects first
    processed_query := apply_search_redirects(query_text);
    
    RETURN QUERY
    SELECT 
        query_text,
        processed_query,
        detect_category_rating(processed_query),
        detect_jacket_type(processed_query),
        detect_shielding_type(processed_query),
        detect_brand(processed_query),
        convert_quantity(processed_query),
        detect_fiber_type(processed_query),
        detect_connector_type(processed_query);
END;
$$ LANGUAGE plpgsql;

-- 10. Function to log search usage (for analytics)
CREATE OR REPLACE FUNCTION log_search_usage(query_text TEXT)
RETURNS VOID AS $$
BEGIN
    -- Update usage count for any matching search terms
    UPDATE search_terms
    SET usage_count = COALESCE(usage_count, 0) + 1,
        last_used = NOW()
    WHERE is_active = true
      AND LOWER(query_text) LIKE '%' || LOWER(search_term) || '%';
END;
$$ LANGUAGE plpgsql;

-- 11. Test the functions
SELECT '=== TEST REDIRECTS ===' as test;
SELECT 
    'cat5 cable' as input,
    apply_search_redirects('cat5 cable') as output
UNION ALL
SELECT 
    'I need smb',
    apply_search_redirects('I need smb')
UNION ALL
SELECT 
    'category 5',
    apply_search_redirects('category 5');

SELECT '=== TEST ATTRIBUTE EXTRACTION ===' as test;
SELECT * FROM extract_search_attributes('I need 4 boxes of cat5 plenum cable');

SELECT '=== TEST CATEGORY DETECTION ===' as test;
SELECT 
    'Category 6 cable' as input,
    detect_category_rating('Category 6 cable') as detected_category;

SELECT '=== TEST JACKET DETECTION ===' as test;
SELECT 
    'plenum rated cable' as input,
    detect_jacket_type('plenum rated cable') as detected_jacket;

SELECT '=== TEST FIBER DETECTION ===' as test;
SELECT 
    'om3 fiber cable' as input,
    detect_fiber_type('om3 fiber cable') as detected_fiber;

SELECT '=== TEST CONNECTOR DETECTION ===' as test;
SELECT 
    'lc connector' as input,
    detect_connector_type('lc connector') as detected_connector;

-- 12. Create helper view for debugging
CREATE OR REPLACE VIEW search_intelligence_debug AS
SELECT 
    context,
    search_term,
    priority,
    COALESCE(
        redirect_to, 
        categories[1], 
        jacket_types[1], 
        brands[1], 
        shielding_types[1],
        fiber_types[1],
        connector_types[1]
    ) as maps_to,
    is_active,
    is_system,
    usage_count,
    last_used
FROM search_terms
WHERE is_active = true
ORDER BY context, priority DESC;

-- 13. Create view for most used search terms
CREATE OR REPLACE VIEW popular_search_terms AS
SELECT 
    search_term,
    context,
    usage_count,
    last_used,
    COALESCE(
        redirect_to, 
        categories[1], 
        jacket_types[1], 
        brands[1], 
        shielding_types[1]
    ) as result
FROM search_terms
WHERE usage_count > 0
ORDER BY usage_count DESC, last_used DESC;

COMMIT;

-- Summary
SELECT '✅ Step 3 Complete: Intelligent functions created!' as status,
       'Run PROPER_MIGRATION_STEP_4.sql next' as next_step;