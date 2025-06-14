-- Decision Engine Database Tables
-- Run this in your Supabase SQL editor to create the necessary tables

-- 1. Search Decisions Audit Table
-- Tracks every decision made by the Decision Engine
CREATE TABLE IF NOT EXISTS search_decisions_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    query_id UUID NOT NULL,
    original_query TEXT NOT NULL,
    normalized_query TEXT,
    decision_stage VARCHAR(50) NOT NULL,
    stage_order INT NOT NULL,
    decision_type VARCHAR(50),
    decision_value JSONB NOT NULL,
    confidence_score DECIMAL(3,2),
    reason TEXT,
    is_final BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_decision_query ON search_decisions_audit(query_id);
CREATE INDEX IF NOT EXISTS idx_decision_stage ON search_decisions_audit(decision_stage);
CREATE INDEX IF NOT EXISTS idx_decision_created ON search_decisions_audit(created_at DESC);

-- 2. Shadow Mode Comparisons Table
-- Tracks differences between old and new engine results
CREATE TABLE IF NOT EXISTS shadow_mode_comparisons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    query TEXT NOT NULL,
    old_engine_result JSONB NOT NULL,
    new_engine_result JSONB NOT NULL,
    divergence_type VARCHAR(50),
    divergence_severity VARCHAR(20),
    old_engine_time_ms INT,
    new_engine_time_ms INT,
    user_clicked_result VARCHAR(20),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for analysis
CREATE INDEX IF NOT EXISTS idx_shadow_divergence ON shadow_mode_comparisons(divergence_type);
CREATE INDEX IF NOT EXISTS idx_shadow_time ON shadow_mode_comparisons(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_shadow_severity ON shadow_mode_comparisons(divergence_severity);

-- 3. Performance Baselines Table
-- Tracks performance metrics for monitoring
CREATE TABLE IF NOT EXISTS performance_baselines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_name VARCHAR(100) NOT NULL,
    baseline_value DECIMAL(10,4) NOT NULL,
    current_value DECIMAL(10,4),
    target_value DECIMAL(10,4),
    measurement_period VARCHAR(20),
    last_updated TIMESTAMP DEFAULT NOW(),
    alert_threshold DECIMAL(10,4),
    critical_queries TEXT[]
);

CREATE INDEX IF NOT EXISTS idx_baseline_metric ON performance_baselines(metric_name);

-- Add unique constraint for metric_name
ALTER TABLE performance_baselines
ADD CONSTRAINT unique_metric_name UNIQUE (metric_name);

-- 4. Regression Tests Table
-- Stores critical queries that must always work
CREATE TABLE IF NOT EXISTS regression_tests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    query TEXT NOT NULL,
    expected_product_type VARCHAR(100),
    expected_table VARCHAR(100),
    expected_result_count INT,
    expected_top_result_id VARCHAR(255),
    captured_from VARCHAR(50),
    priority VARCHAR(20) DEFAULT 'NORMAL',
    last_passed TIMESTAMP,
    last_failed TIMESTAMP,
    failure_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    active BOOLEAN DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_regression_query ON regression_tests(query);
CREATE INDEX IF NOT EXISTS idx_regression_priority ON regression_tests(priority);
CREATE INDEX IF NOT EXISTS idx_regression_active ON regression_tests(active);

-- Add unique constraint for query
ALTER TABLE regression_tests
ADD CONSTRAINT unique_regression_query UNIQUE (query);

-- 5. Insert initial performance baselines
INSERT INTO performance_baselines (metric_name, baseline_value, target_value, measurement_period, critical_queries)
VALUES 
    ('decision_time_ms', 50, 30, 'HOURLY', ARRAY['cat6 plenum cable', 'surface mount box', 'panduit jack']),
    ('total_search_time_ms', 300, 250, 'HOURLY', ARRAY['cat6 plenum cable', 'surface mount box', 'panduit jack']),
    ('confidence_average', 0.75, 0.85, 'DAILY', NULL),
    ('success_rate', 0.95, 0.98, 'DAILY', NULL)
ON CONFLICT (metric_name) DO NOTHING;

-- 6. Insert critical regression tests
INSERT INTO regression_tests (query, expected_product_type, expected_table, priority)
VALUES 
    ('cat6 plenum cable', 'CATEGORY_CABLE', 'category_cables', 'CRITICAL'),
    ('surface mount box', 'SURFACE_MOUNT_BOX', 'surface_mount_box', 'CRITICAL'),
    ('smb', 'SURFACE_MOUNT_BOX', 'surface_mount_box', 'CRITICAL'),
    ('2 port faceplate', 'FACEPLATE', 'faceplates', 'CRITICAL'),
    ('panduit jack cat6', 'JACK_MODULE', 'jack_modules', 'CRITICAL'),
    ('fiber connector lc', 'FIBER_CONNECTOR', 'fiber_connectors', 'HIGH'),
    ('4ru fiber enclosure', 'ENCLOSURE', 'rack_mount_fiber_enclosures', 'HIGH'),
    ('CJ688TGBU', 'MULTI_TABLE', 'multi_table', 'HIGH'),
    ('cat5 cable', 'CATEGORY_CABLE', 'category_cables', 'NORMAL'),
    ('panduit', 'MULTI_TABLE', 'multi_table', 'NORMAL')
ON CONFLICT DO NOTHING;

-- 7. Function to analyze shadow mode divergences
CREATE OR REPLACE FUNCTION analyze_shadow_divergences(
    time_window INTERVAL DEFAULT '24 hours'
)
RETURNS TABLE (
    divergence_type VARCHAR(50),
    count BIGINT,
    avg_time_difference_ms NUMERIC,
    example_queries TEXT[]
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        smc.divergence_type,
        COUNT(*) as count,
        AVG(ABS(smc.new_engine_time_ms - smc.old_engine_time_ms))::NUMERIC as avg_time_difference_ms,
        (ARRAY_AGG(DISTINCT smc.query ORDER BY smc.created_at DESC))[1:5] as example_queries
    FROM shadow_mode_comparisons smc
    WHERE smc.created_at > NOW() - time_window
    GROUP BY smc.divergence_type
    ORDER BY count DESC;
END;
$$ LANGUAGE plpgsql;

-- 8. Function to get decision engine performance metrics
CREATE OR REPLACE FUNCTION get_decision_engine_metrics(
    time_window INTERVAL DEFAULT '1 hour'
)
RETURNS TABLE (
    total_decisions BIGINT,
    avg_confidence NUMERIC,
    stage_distribution JSONB,
    product_type_distribution JSONB,
    avg_decision_time_ms NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    WITH stage_stats AS (
        SELECT 
            decision_stage,
            COUNT(*) as count,
            AVG(confidence_score) as avg_conf
        FROM search_decisions_audit
        WHERE created_at > NOW() - time_window
        GROUP BY decision_stage
    ),
    product_stats AS (
        SELECT 
            decision_value->>'productType' as product_type,
            COUNT(*) as count
        FROM search_decisions_audit
        WHERE created_at > NOW() - time_window
        AND decision_type = 'COMPLETE'
        GROUP BY decision_value->>'productType'
    )
    SELECT 
        (SELECT COUNT(*) FROM search_decisions_audit WHERE created_at > NOW() - time_window) as total_decisions,
        (SELECT AVG(confidence_score) FROM search_decisions_audit WHERE created_at > NOW() - time_window)::NUMERIC as avg_confidence,
        (SELECT jsonb_object_agg(decision_stage, count) FROM stage_stats) as stage_distribution,
        (SELECT jsonb_object_agg(product_type, count) FROM product_stats) as product_type_distribution,
        50::NUMERIC as avg_decision_time_ms; -- Placeholder, would need timing data
END;
$$ LANGUAGE plpgsql;

-- 9. Grant permissions (adjust based on your Supabase setup)
GRANT ALL ON search_decisions_audit TO authenticated;
GRANT ALL ON shadow_mode_comparisons TO authenticated;
GRANT ALL ON performance_baselines TO authenticated;
GRANT ALL ON regression_tests TO authenticated;