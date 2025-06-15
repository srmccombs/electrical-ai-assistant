-- Knowledge System Tables
-- Part of the Decision Engine Knowledge Stage
-- Run this after decision_engine_tables.sql

-- 1. Knowledge Contributions Table
CREATE TABLE IF NOT EXISTS knowledge_contributions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contribution_type VARCHAR(50) NOT NULL CHECK (contribution_type IN ('SYNONYM', 'MAPPING', 'CONTEXT', 'CORRECTION', 'RELATIONSHIP')),
    original_term TEXT NOT NULL,
    suggested_term TEXT,
    mapped_term TEXT,
    product_type VARCHAR(100),
    context TEXT,
    confidence_score DECIMAL(3,2) DEFAULT 0.5,
    contributor_id UUID,
    validation_status VARCHAR(20) DEFAULT 'PENDING' CHECK (validation_status IN ('PENDING', 'APPROVED', 'REJECTED', 'AUTO_APPROVED')),
    usage_count INT DEFAULT 0,
    success_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    validated_at TIMESTAMP,
    validated_by UUID
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_knowledge_original ON knowledge_contributions(original_term);
CREATE INDEX IF NOT EXISTS idx_knowledge_status ON knowledge_contributions(validation_status);
CREATE INDEX IF NOT EXISTS idx_knowledge_confidence ON knowledge_contributions(confidence_score);
CREATE INDEX IF NOT EXISTS idx_knowledge_created ON knowledge_contributions(created_at DESC);

-- 2. Insert some initial knowledge entries for testing
INSERT INTO knowledge_contributions (
    contribution_type, 
    original_term, 
    suggested_term,
    mapped_term,
    product_type, 
    confidence_score, 
    validation_status
) VALUES 
    ('SYNONYM', 'smb', 'surface mount box', 'surface mount box', 'SURFACE_MOUNT_BOX', 0.95, 'APPROVED'),
    ('SYNONYM', 's.m.b', 'surface mount box', 'surface mount box', 'SURFACE_MOUNT_BOX', 0.95, 'APPROVED'),
    ('MAPPING', 'cat 5', 'cat5e', 'cat5e', 'CATEGORY_CABLE', 0.90, 'APPROVED'),
    ('CONTEXT', 'blue cable', 'blue cable', 'blue cable', 'CATEGORY_CABLE', 0.75, 'APPROVED')
ON CONFLICT DO NOTHING;

-- 3. Grant permissions
GRANT ALL ON knowledge_contributions TO authenticated;

-- 4. Function to auto-approve high-confidence contributions
CREATE OR REPLACE FUNCTION auto_approve_knowledge()
RETURNS TRIGGER AS $$
BEGIN
    -- Auto-approve if confidence is very high from trusted patterns
    IF NEW.confidence_score >= 0.9 AND NEW.validation_status = 'PENDING' THEN
        NEW.validation_status := 'AUTO_APPROVED';
        NEW.validated_at := NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Create trigger for auto-approval
CREATE TRIGGER knowledge_auto_approve
    BEFORE INSERT OR UPDATE ON knowledge_contributions
    FOR EACH ROW
    EXECUTE FUNCTION auto_approve_knowledge();

-- 6. Function to get knowledge statistics
CREATE OR REPLACE FUNCTION get_knowledge_stats()
RETURNS TABLE (
    total_contributions BIGINT,
    approved_contributions BIGINT,
    pending_contributions BIGINT,
    average_confidence NUMERIC,
    top_contributors JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT as total_contributions,
        COUNT(*) FILTER (WHERE validation_status IN ('APPROVED', 'AUTO_APPROVED'))::BIGINT as approved_contributions,
        COUNT(*) FILTER (WHERE validation_status = 'PENDING')::BIGINT as pending_contributions,
        AVG(confidence_score)::NUMERIC as average_confidence,
        COALESCE(
            jsonb_agg(DISTINCT contributor_id) FILTER (WHERE contributor_id IS NOT NULL),
            '[]'::jsonb
        ) as top_contributors
    FROM knowledge_contributions;
END;
$$ LANGUAGE plpgsql;