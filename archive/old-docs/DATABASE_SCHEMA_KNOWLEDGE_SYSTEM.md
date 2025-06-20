# Knowledge System Database Schema

## Core Tables

### 1. knowledge_contributions
```sql
CREATE TABLE knowledge_contributions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contribution_type VARCHAR(50) NOT NULL, -- SYNONYM, MAPPING, CONTEXT, CORRECTION, RELATIONSHIP
    contributor_id UUID NOT NULL,
    company_id UUID NOT NULL,
    original_term VARCHAR(255) NOT NULL,
    suggested_term VARCHAR(255) NOT NULL,
    context TEXT,
    product_type VARCHAR(100),
    confidence_score DECIMAL(3,2),
    validation_status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED, TESTING
    validation_method VARCHAR(20), -- EXPERT, AUTOMATED, CROWD, AB_TEST
    rejection_reason TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    approved_at TIMESTAMP,
    approved_by UUID,
    metadata JSONB -- Store additional context
);

CREATE INDEX idx_knowledge_status ON knowledge_contributions(validation_status);
CREATE INDEX idx_knowledge_contributor ON knowledge_contributions(contributor_id);
CREATE INDEX idx_knowledge_terms ON knowledge_contributions(original_term, suggested_term);
```

### 2. search_decisions_audit
```sql
CREATE TABLE search_decisions_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    query_id UUID NOT NULL,
    original_query TEXT NOT NULL,
    normalized_query TEXT,
    decision_stage VARCHAR(50) NOT NULL, -- BUSINESS_RULE, PART_NUMBER, CONTEXT, AI, TEXT_DETECTION, KNOWLEDGE, FALLBACK
    stage_order INT NOT NULL,
    decision_type VARCHAR(50), -- REDIRECT, PRODUCT_TYPE, TABLE_ROUTING, FILTER
    decision_value JSONB NOT NULL,
    confidence_score DECIMAL(3,2),
    reason TEXT,
    is_final BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_decision_query ON search_decisions_audit(query_id);
CREATE INDEX idx_decision_stage ON search_decisions_audit(decision_stage);
```

### 3. user_reputation
```sql
CREATE TABLE user_reputation (
    user_id UUID PRIMARY KEY,
    company_id UUID NOT NULL,
    total_contributions INT DEFAULT 0,
    approved_contributions INT DEFAULT 0,
    rejected_contributions INT DEFAULT 0,
    reputation_score INT DEFAULT 0,
    expertise_areas JSONB DEFAULT '[]', -- ["cables", "connectors", "fiber"]
    badges JSONB DEFAULT '[]', -- ["Cable Expert", "Top Contributor"]
    contribution_streak INT DEFAULT 0,
    last_contribution_date DATE,
    impact_metrics JSONB DEFAULT '{}', -- {"searches_helped": 150, "time_saved_minutes": 450}
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_reputation_company ON user_reputation(company_id);
CREATE INDEX idx_reputation_score ON user_reputation(reputation_score DESC);
```

### 4. company_knowledge_stats
```sql
CREATE TABLE company_knowledge_stats (
    company_id UUID PRIMARY KEY,
    company_name VARCHAR(255) NOT NULL,
    total_contributions INT DEFAULT 0,
    quality_score DECIMAL(3,2) DEFAULT 0,
    active_contributors INT DEFAULT 0,
    knowledge_areas JSONB DEFAULT '[]',
    monthly_contributions JSONB DEFAULT '{}', -- {"2025-01": 45, "2025-02": 62}
    leaderboard_rank INT,
    achievements JSONB DEFAULT '[]', -- ["Most Collaborative 2025", "Fiber Expert Company"]
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_company_rank ON company_knowledge_stats(leaderboard_rank);
```

### 5. learning_patterns
```sql
CREATE TABLE learning_patterns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pattern_type VARCHAR(50) NOT NULL, -- QUERY_REFINEMENT, CLICK_BEHAVIOR, FAILURE_RECOVERY
    original_pattern TEXT NOT NULL,
    learned_pattern TEXT NOT NULL,
    occurrence_count INT DEFAULT 1,
    confidence_score DECIMAL(3,2),
    first_observed TIMESTAMP DEFAULT NOW(),
    last_observed TIMESTAMP DEFAULT NOW(),
    applied_at TIMESTAMP,
    performance_impact JSONB, -- {"success_rate_change": 0.15, "time_saved": 2.3}
    status VARCHAR(20) DEFAULT 'OBSERVED' -- OBSERVED, TESTING, APPLIED, REJECTED
);

CREATE INDEX idx_pattern_type ON learning_patterns(pattern_type);
CREATE INDEX idx_pattern_confidence ON learning_patterns(confidence_score DESC);
```

### 6. ab_test_results
```sql
CREATE TABLE ab_test_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_name VARCHAR(255) NOT NULL,
    hypothesis TEXT NOT NULL,
    control_behavior JSONB NOT NULL,
    variant_behavior JSONB NOT NULL,
    metric_name VARCHAR(100) NOT NULL, -- search_success_rate, time_to_result
    control_value DECIMAL(10,4),
    variant_value DECIMAL(10,4),
    sample_size_control INT,
    sample_size_variant INT,
    statistical_significance DECIMAL(3,2),
    p_value DECIMAL(10,8),
    started_at TIMESTAMP DEFAULT NOW(),
    ended_at TIMESTAMP,
    decision VARCHAR(20), -- ADOPT_VARIANT, KEEP_CONTROL, CONTINUE_TESTING
    decision_reason TEXT
);

CREATE INDEX idx_ab_test_status ON ab_test_results(ended_at);
```

### 7. regression_tests
```sql
CREATE TABLE regression_tests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    query TEXT NOT NULL,
    expected_product_type VARCHAR(100),
    expected_table VARCHAR(100),
    expected_result_count INT,
    expected_top_result_id VARCHAR(255),
    captured_from VARCHAR(50), -- SUCCESSFUL_SEARCH, MANUAL_ENTRY, CRITICAL_PATH
    priority VARCHAR(20) DEFAULT 'NORMAL', -- CRITICAL, HIGH, NORMAL, LOW
    last_passed TIMESTAMP,
    last_failed TIMESTAMP,
    failure_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    active BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_regression_query ON regression_tests(query);
CREATE INDEX idx_regression_priority ON regression_tests(priority);
```

### 8. shadow_mode_comparisons
```sql
CREATE TABLE shadow_mode_comparisons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    query TEXT NOT NULL,
    old_engine_result JSONB NOT NULL,
    new_engine_result JSONB NOT NULL,
    divergence_type VARCHAR(50), -- TABLE_MISMATCH, PRODUCT_TYPE_MISMATCH, COUNT_DIFFERENCE
    divergence_severity VARCHAR(20), -- CRITICAL, MAJOR, MINOR
    old_engine_time_ms INT,
    new_engine_time_ms INT,
    user_clicked_result VARCHAR(20), -- OLD, NEW, NEITHER
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_shadow_divergence ON shadow_mode_comparisons(divergence_type);
CREATE INDEX idx_shadow_time ON shadow_mode_comparisons(created_at);
```

### 9. knowledge_validation_queue
```sql
CREATE TABLE knowledge_validation_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contribution_id UUID REFERENCES knowledge_contributions(id),
    validation_type VARCHAR(50) NOT NULL, -- EXPERT_REVIEW, AB_TEST, AUTOMATED_CHECK
    assigned_to UUID,
    priority VARCHAR(20) DEFAULT 'NORMAL',
    due_date TIMESTAMP,
    validation_criteria JSONB,
    validation_result JSONB,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_validation_type ON knowledge_validation_queue(validation_type);
CREATE INDEX idx_validation_assigned ON knowledge_validation_queue(assigned_to);
```

### 10. performance_baselines
```sql
CREATE TABLE performance_baselines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_name VARCHAR(100) NOT NULL,
    baseline_value DECIMAL(10,4) NOT NULL,
    current_value DECIMAL(10,4),
    target_value DECIMAL(10,4),
    measurement_period VARCHAR(20), -- HOURLY, DAILY, WEEKLY
    last_updated TIMESTAMP DEFAULT NOW(),
    alert_threshold DECIMAL(10,4),
    critical_queries TEXT[] -- Array of queries that must maintain performance
);

CREATE INDEX idx_baseline_metric ON performance_baselines(metric_name);
```

## Supporting Functions

### Calculate User Reputation
```sql
CREATE OR REPLACE FUNCTION calculate_user_reputation(p_user_id UUID)
RETURNS INT AS $$
DECLARE
    v_reputation INT;
BEGIN
    SELECT 
        (approved_contributions * 10) +
        (total_contributions * 2) -
        (rejected_contributions * 5) +
        (COALESCE((impact_metrics->>'searches_helped')::INT, 0) / 10)
    INTO v_reputation
    FROM user_reputation
    WHERE user_id = p_user_id;
    
    RETURN COALESCE(v_reputation, 0);
END;
$$ LANGUAGE plpgsql;
```

### Update Company Rankings
```sql
CREATE OR REPLACE FUNCTION update_company_rankings()
RETURNS VOID AS $$
BEGIN
    WITH ranked_companies AS (
        SELECT 
            company_id,
            ROW_NUMBER() OVER (ORDER BY quality_score DESC, total_contributions DESC) as rank
        FROM company_knowledge_stats
    )
    UPDATE company_knowledge_stats c
    SET leaderboard_rank = r.rank
    FROM ranked_companies r
    WHERE c.company_id = r.company_id;
END;
$$ LANGUAGE plpgsql;
```

## Triggers

### Auto-update reputation on contribution
```sql
CREATE OR REPLACE FUNCTION update_reputation_on_contribution()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.validation_status = 'APPROVED' AND OLD.validation_status != 'APPROVED' THEN
        UPDATE user_reputation
        SET 
            approved_contributions = approved_contributions + 1,
            reputation_score = calculate_user_reputation(NEW.contributor_id),
            updated_at = NOW()
        WHERE user_id = NEW.contributor_id;
    ELSIF NEW.validation_status = 'REJECTED' AND OLD.validation_status != 'REJECTED' THEN
        UPDATE user_reputation
        SET 
            rejected_contributions = rejected_contributions + 1,
            reputation_score = calculate_user_reputation(NEW.contributor_id),
            updated_at = NOW()
        WHERE user_id = NEW.contributor_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_reputation
AFTER UPDATE ON knowledge_contributions
FOR EACH ROW
WHEN (OLD.validation_status IS DISTINCT FROM NEW.validation_status)
EXECUTE FUNCTION update_reputation_on_contribution();
```