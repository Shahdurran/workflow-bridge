-- Training Data Collection Schema
-- This schema supports collecting AI interactions for training a custom model
-- with cost-optimized hybrid storage (Supabase + S3/R2)

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- TABLE: training_data
-- Main interaction logs for all user/AI conversations
-- ============================================================================
CREATE TABLE IF NOT EXISTS training_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Interaction details
    interaction_id VARCHAR(255) UNIQUE NOT NULL,
    user_message TEXT NOT NULL,
    ai_response TEXT NOT NULL,
    intent_extracted TEXT,
    
    -- Workflow data
    workflow_generated JSONB,
    workflow_compressed TEXT, -- Hex-encoded gzipped workflow for large payloads
    is_compressed BOOLEAN DEFAULT FALSE,
    
    -- Platform and success metrics
    platform VARCHAR(50) NOT NULL CHECK (platform IN ('n8n', 'make', 'zapier')),
    success BOOLEAN DEFAULT TRUE,
    error_message TEXT,
    
    -- User feedback
    user_feedback VARCHAR(20) CHECK (user_feedback IN ('thumbs_up', 'thumbs_down', 'edited', 'none')),
    feedback_text TEXT,
    
    -- Metadata
    size_bytes INTEGER,
    processing_time_ms INTEGER,
    model_version VARCHAR(50),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    archived_at TIMESTAMP WITH TIME ZONE,
    
    -- Indexing for queries
    INDEX idx_training_data_platform (platform),
    INDEX idx_training_data_success (success),
    INDEX idx_training_data_feedback (user_feedback),
    INDEX idx_training_data_created_at (created_at),
    INDEX idx_training_data_user_id (user_id),
    INDEX idx_training_data_archived (archived_at),
    INDEX idx_training_data_interaction (interaction_id)
);

-- Add comment for documentation
COMMENT ON TABLE training_data IS 'Main table for logging all AI interactions for model training';
COMMENT ON COLUMN training_data.workflow_compressed IS 'Gzip-compressed workflow stored as hex string for payloads >10KB';
COMMENT ON COLUMN training_data.archived_at IS 'Timestamp when data was archived to S3/R2';

-- ============================================================================
-- TABLE: validation_logs
-- Track validation results for workflows
-- ============================================================================
CREATE TABLE IF NOT EXISTS validation_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    training_data_id UUID REFERENCES training_data(id) ON DELETE CASCADE,
    workflow_id VARCHAR(255),
    
    -- Validation results
    platform VARCHAR(50) NOT NULL CHECK (platform IN ('n8n', 'make', 'zapier')),
    validation_passed BOOLEAN NOT NULL,
    validation_score DECIMAL(5, 2), -- 0-100 score
    
    -- Error and warning details
    errors JSONB DEFAULT '[]'::jsonb,
    warnings JSONB DEFAULT '[]'::jsonb,
    
    -- User edits tracking
    user_edited BOOLEAN DEFAULT FALSE,
    original_workflow JSONB,
    edited_workflow JSONB,
    edit_diff JSONB, -- JSON diff of changes
    
    -- Metadata
    validator_version VARCHAR(50),
    validation_time_ms INTEGER,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Indexing
    INDEX idx_validation_logs_training_data (training_data_id),
    INDEX idx_validation_logs_platform (platform),
    INDEX idx_validation_logs_passed (validation_passed),
    INDEX idx_validation_logs_edited (user_edited),
    INDEX idx_validation_logs_created_at (created_at)
);

COMMENT ON TABLE validation_logs IS 'Track workflow validation results and user corrections';
COMMENT ON COLUMN validation_logs.edit_diff IS 'JSON diff showing what user changed in the workflow';

-- ============================================================================
-- TABLE: user_feedback
-- Explicit user feedback with corrections
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    interaction_id VARCHAR(255) NOT NULL,
    training_data_id UUID REFERENCES training_data(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Feedback details
    feedback_type VARCHAR(20) NOT NULL CHECK (feedback_type IN ('thumbs_up', 'thumbs_down', 'edit', 'report')),
    feedback_text TEXT,
    sentiment_score INTEGER CHECK (sentiment_score BETWEEN 1 AND 5),
    
    -- Corrections
    corrected_workflow JSONB,
    correction_notes TEXT,
    
    -- Issue reporting
    issue_category VARCHAR(50) CHECK (issue_category IN ('incorrect_workflow', 'missing_steps', 'wrong_platform', 'other')),
    
    -- Metadata
    user_agent TEXT,
    session_id VARCHAR(255),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Indexing
    INDEX idx_user_feedback_interaction (interaction_id),
    INDEX idx_user_feedback_training_data (training_data_id),
    INDEX idx_user_feedback_type (feedback_type),
    INDEX idx_user_feedback_user (user_id),
    INDEX idx_user_feedback_created_at (created_at)
);

COMMENT ON TABLE user_feedback IS 'Explicit user feedback and corrections - most valuable for training';

-- ============================================================================
-- TABLE: workflow_examples
-- Curated high-quality workflow examples
-- ============================================================================
CREATE TABLE IF NOT EXISTS workflow_examples (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_interaction_id VARCHAR(255),
    
    -- Example data
    user_intent TEXT NOT NULL,
    workflow_json JSONB NOT NULL,
    platform VARCHAR(50) NOT NULL CHECK (platform IN ('n8n', 'make', 'zapier')),
    
    -- Quality metrics
    quality_score INTEGER CHECK (quality_score BETWEEN 1 AND 100),
    is_verified BOOLEAN DEFAULT FALSE,
    verified_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    verified_at TIMESTAMP WITH TIME ZONE,
    
    -- Categorization
    category VARCHAR(100),
    tags TEXT[],
    complexity_level VARCHAR(20) CHECK (complexity_level IN ('simple', 'medium', 'complex')),
    
    -- Usage tracking
    times_used INTEGER DEFAULT 0,
    success_rate DECIMAL(5, 2),
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Indexing
    INDEX idx_workflow_examples_platform (platform),
    INDEX idx_workflow_examples_quality (quality_score),
    INDEX idx_workflow_examples_verified (is_verified),
    INDEX idx_workflow_examples_category (category),
    INDEX idx_workflow_examples_tags (tags) USING GIN
);

COMMENT ON TABLE workflow_examples IS 'Curated high-quality workflow examples for training';
COMMENT ON COLUMN workflow_examples.quality_score IS 'Quality score 1-100 based on validation, feedback, and usage';

-- ============================================================================
-- TABLE: training_metrics
-- Track model performance over time
-- ============================================================================
CREATE TABLE IF NOT EXISTS training_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Model version
    model_version VARCHAR(50) NOT NULL,
    platform VARCHAR(50) NOT NULL CHECK (platform IN ('n8n', 'make', 'zapier', 'all')),
    
    -- Training stats
    training_examples_count INTEGER NOT NULL,
    training_date TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Performance metrics
    accuracy_rate DECIMAL(5, 2),
    validation_pass_rate DECIMAL(5, 2),
    user_satisfaction_rate DECIMAL(5, 2),
    
    -- Detailed metrics
    avg_processing_time_ms INTEGER,
    avg_workflow_size_bytes INTEGER,
    error_rate DECIMAL(5, 2),
    
    -- Data quality
    with_feedback_count INTEGER,
    with_corrections_count INTEGER,
    verified_examples_count INTEGER,
    
    -- Cost tracking
    training_cost_usd DECIMAL(10, 2),
    inference_cost_per_1k DECIMAL(10, 4),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Indexing
    INDEX idx_training_metrics_model (model_version),
    INDEX idx_training_metrics_platform (platform),
    INDEX idx_training_metrics_date (training_date),
    UNIQUE(model_version, platform, training_date)
);

COMMENT ON TABLE training_metrics IS 'Track model performance and training metrics over time';

-- ============================================================================
-- TABLE: archive_metadata
-- Track what has been archived to S3/R2
-- ============================================================================
CREATE TABLE IF NOT EXISTS archive_metadata (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Archive details
    archive_key VARCHAR(500) NOT NULL UNIQUE, -- S3 object key
    archive_date DATE NOT NULL,
    platform VARCHAR(50) NOT NULL,
    
    -- Statistics
    records_count INTEGER NOT NULL,
    compressed_size_bytes BIGINT NOT NULL,
    uncompressed_size_bytes BIGINT NOT NULL,
    compression_ratio DECIMAL(5, 2),
    
    -- Date range of archived data
    data_from_date TIMESTAMP WITH TIME ZONE NOT NULL,
    data_to_date TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Storage info
    storage_class VARCHAR(50) DEFAULT 'STANDARD',
    s3_bucket VARCHAR(255),
    
    -- Status
    archive_status VARCHAR(20) DEFAULT 'completed' CHECK (archive_status IN ('pending', 'completed', 'failed')),
    error_message TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Indexing
    INDEX idx_archive_metadata_date (archive_date),
    INDEX idx_archive_metadata_platform (platform),
    INDEX idx_archive_metadata_status (archive_status),
    INDEX idx_archive_metadata_key (archive_key)
);

COMMENT ON TABLE archive_metadata IS 'Track archived data in S3/R2 for inventory and cost management';

-- ============================================================================
-- VIEW: training_data_summary
-- Summary statistics by platform
-- ============================================================================
CREATE OR REPLACE VIEW training_data_summary AS
SELECT 
    platform,
    COUNT(*) as total_interactions,
    COUNT(*) FILTER (WHERE success = TRUE) as successful_interactions,
    COUNT(*) FILTER (WHERE success = FALSE) as failed_interactions,
    ROUND(100.0 * COUNT(*) FILTER (WHERE success = TRUE) / NULLIF(COUNT(*), 0), 2) as success_rate,
    
    -- Feedback stats
    COUNT(*) FILTER (WHERE user_feedback = 'thumbs_up') as thumbs_up_count,
    COUNT(*) FILTER (WHERE user_feedback = 'thumbs_down') as thumbs_down_count,
    COUNT(*) FILTER (WHERE user_feedback = 'edited') as edited_count,
    COUNT(*) FILTER (WHERE user_feedback IS NOT NULL AND user_feedback != 'none') as total_feedback_count,
    
    -- Size stats
    AVG(size_bytes) as avg_size_bytes,
    SUM(size_bytes) as total_size_bytes,
    COUNT(*) FILTER (WHERE is_compressed = TRUE) as compressed_count,
    
    -- Time stats
    AVG(processing_time_ms) as avg_processing_time_ms,
    
    -- Archive stats
    COUNT(*) FILTER (WHERE archived_at IS NOT NULL) as archived_count,
    COUNT(*) FILTER (WHERE archived_at IS NULL) as active_count,
    
    -- Date range
    MIN(created_at) as earliest_interaction,
    MAX(created_at) as latest_interaction
FROM training_data
GROUP BY platform;

COMMENT ON VIEW training_data_summary IS 'Summary statistics for training data by platform';

-- ============================================================================
-- VIEW: training_readiness_view
-- Check training readiness for each platform
-- ============================================================================
CREATE OR REPLACE VIEW training_readiness_view AS
SELECT 
    platform,
    COUNT(*) as total_examples,
    COUNT(*) FILTER (WHERE success = TRUE) as successful_examples,
    COUNT(*) FILTER (WHERE user_feedback IN ('thumbs_up', 'edited')) as quality_examples,
    COUNT(*) FILTER (WHERE user_feedback IS NOT NULL AND user_feedback != 'none') as examples_with_feedback,
    
    -- Readiness score (0-100)
    LEAST(100, GREATEST(0,
        (COUNT(*) FILTER (WHERE success = TRUE) * 40 / NULLIF(GREATEST(COUNT(*), 100), 0)) +
        (COUNT(*) FILTER (WHERE user_feedback IN ('thumbs_up', 'edited')) * 40 / NULLIF(GREATEST(COUNT(*), 50), 0)) +
        (COUNT(*) FILTER (WHERE user_feedback IS NOT NULL AND user_feedback != 'none') * 20 / NULLIF(GREATEST(COUNT(*), 20), 0))
    )) as readiness_score,
    
    -- Recommendations
    CASE 
        WHEN COUNT(*) < 50 THEN 'Need more data - collect at least 50 examples'
        WHEN COUNT(*) FILTER (WHERE user_feedback IS NOT NULL AND user_feedback != 'none') < 10 THEN 'Need more feedback - encourage users to rate workflows'
        WHEN COUNT(*) FILTER (WHERE success = TRUE) < 30 THEN 'Low success rate - improve workflow generation'
        WHEN COUNT(*) FILTER (WHERE user_feedback IN ('thumbs_up', 'edited')) < 20 THEN 'Need more quality examples'
        WHEN COUNT(*) >= 100 AND COUNT(*) FILTER (WHERE user_feedback IN ('thumbs_up', 'edited')) >= 50 THEN 'Ready for training'
        ELSE 'Continue collecting data'
    END as recommendation
FROM training_data
WHERE archived_at IS NULL  -- Only count active (non-archived) data
GROUP BY platform;

COMMENT ON VIEW training_readiness_view IS 'Check training readiness status for each platform';

-- ============================================================================
-- FUNCTION: get_training_readiness
-- Get training readiness for a specific platform
-- ============================================================================
CREATE OR REPLACE FUNCTION get_training_readiness(p_platform VARCHAR(50))
RETURNS TABLE (
    platform VARCHAR(50),
    total_examples BIGINT,
    successful_examples BIGINT,
    quality_examples BIGINT,
    examples_with_feedback BIGINT,
    readiness_score INTEGER,
    recommendation TEXT,
    is_ready BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        v.platform,
        v.total_examples,
        v.successful_examples,
        v.quality_examples,
        v.examples_with_feedback,
        v.readiness_score::INTEGER,
        v.recommendation,
        (v.readiness_score >= 70)::BOOLEAN as is_ready
    FROM training_readiness_view v
    WHERE v.platform = p_platform OR p_platform = 'all';
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_training_readiness IS 'Get detailed training readiness for a platform';

-- ============================================================================
-- FUNCTION: archive_old_training_data
-- Mark old training data as ready for archiving
-- ============================================================================
CREATE OR REPLACE FUNCTION archive_old_training_data(days_old INTEGER DEFAULT 30)
RETURNS TABLE (
    archived_count BIGINT,
    platform VARCHAR(50)
) AS $$
BEGIN
    RETURN QUERY
    WITH archived AS (
        UPDATE training_data
        SET archived_at = NOW()
        WHERE created_at < NOW() - (days_old || ' days')::INTERVAL
          AND archived_at IS NULL
        RETURNING id, platform
    )
    SELECT 
        COUNT(*) as archived_count,
        a.platform
    FROM archived a
    GROUP BY a.platform;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION archive_old_training_data IS 'Mark training data older than N days for archiving';

-- ============================================================================
-- FUNCTION: get_storage_stats
-- Get detailed storage statistics
-- ============================================================================
CREATE OR REPLACE FUNCTION get_storage_stats()
RETURNS TABLE (
    metric VARCHAR(100),
    value_numeric BIGINT,
    value_text TEXT
) AS $$
BEGIN
    RETURN QUERY
    -- Total records
    SELECT 'total_training_records'::VARCHAR(100), COUNT(*)::BIGINT, COUNT(*)::TEXT
    FROM training_data
    
    UNION ALL
    
    -- Active records (not archived)
    SELECT 'active_records'::VARCHAR(100), COUNT(*)::BIGINT, COUNT(*)::TEXT
    FROM training_data
    WHERE archived_at IS NULL
    
    UNION ALL
    
    -- Archived records
    SELECT 'archived_records'::VARCHAR(100), COUNT(*)::BIGINT, COUNT(*)::TEXT
    FROM training_data
    WHERE archived_at IS NOT NULL
    
    UNION ALL
    
    -- Total size in Supabase (bytes)
    SELECT 'supabase_size_bytes'::VARCHAR(100), 
           COALESCE(SUM(size_bytes), 0)::BIGINT,
           pg_size_pretty(COALESCE(SUM(size_bytes), 0)) as value_text
    FROM training_data
    WHERE archived_at IS NULL
    
    UNION ALL
    
    -- Archived size (bytes)
    SELECT 'archived_size_bytes'::VARCHAR(100),
           COALESCE(SUM(compressed_size_bytes), 0)::BIGINT,
           pg_size_pretty(COALESCE(SUM(compressed_size_bytes), 0)) as value_text
    FROM archive_metadata
    
    UNION ALL
    
    -- Compressed records count
    SELECT 'compressed_records'::VARCHAR(100), COUNT(*)::BIGINT, COUNT(*)::TEXT
    FROM training_data
    WHERE is_compressed = TRUE
    
    UNION ALL
    
    -- Records with feedback
    SELECT 'records_with_feedback'::VARCHAR(100), COUNT(*)::BIGINT, COUNT(*)::TEXT
    FROM training_data
    WHERE user_feedback IS NOT NULL AND user_feedback != 'none'
    
    UNION ALL
    
    -- Validation logs count
    SELECT 'validation_logs_count'::VARCHAR(100), COUNT(*)::BIGINT, COUNT(*)::TEXT
    FROM validation_logs
    
    UNION ALL
    
    -- User feedback count
    SELECT 'user_feedback_count'::VARCHAR(100), COUNT(*)::BIGINT, COUNT(*)::TEXT
    FROM user_feedback
    
    UNION ALL
    
    -- Curated examples
    SELECT 'curated_examples'::VARCHAR(100), COUNT(*)::BIGINT, COUNT(*)::TEXT
    FROM workflow_examples
    WHERE is_verified = TRUE;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_storage_stats IS 'Get comprehensive storage and usage statistics';

-- ============================================================================
-- Row Level Security (RLS) Policies
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE training_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE validation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_examples ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE archive_metadata ENABLE ROW LEVEL SECURITY;

-- Allow service role full access (for backend operations)
CREATE POLICY "Service role has full access to training_data" ON training_data
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access to validation_logs" ON validation_logs
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access to user_feedback" ON user_feedback
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access to workflow_examples" ON workflow_examples
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access to training_metrics" ON training_metrics
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access to archive_metadata" ON archive_metadata
    FOR ALL USING (auth.role() = 'service_role');

-- Users can view their own training data
CREATE POLICY "Users can view own training data" ON training_data
    FOR SELECT USING (auth.uid() = user_id);

-- Users can submit feedback
CREATE POLICY "Users can insert own feedback" ON user_feedback
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own feedback" ON user_feedback
    FOR SELECT USING (auth.uid() = user_id);

-- ============================================================================
-- Indexes for performance
-- ============================================================================

-- Additional composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_training_data_platform_success_created 
    ON training_data(platform, success, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_training_data_feedback_created 
    ON training_data(user_feedback, created_at DESC) 
    WHERE user_feedback IS NOT NULL AND user_feedback != 'none';

CREATE INDEX IF NOT EXISTS idx_validation_logs_platform_passed 
    ON validation_logs(platform, validation_passed, created_at DESC);

-- ============================================================================
-- Initial Data / Seed
-- ============================================================================

-- Insert initial training metrics tracking
INSERT INTO training_metrics (
    model_version, 
    platform, 
    training_examples_count, 
    training_date,
    accuracy_rate,
    validation_pass_rate
) VALUES 
    ('baseline-v1', 'zapier', 0, NOW(), 0, 0),
    ('baseline-v1', 'make', 0, NOW(), 0, 0),
    ('baseline-v1', 'n8n', 0, NOW(), 0, 0)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- Grants
-- ============================================================================

-- Grant necessary permissions to authenticated users
GRANT SELECT ON training_data_summary TO authenticated;
GRANT SELECT ON training_readiness_view TO authenticated;
GRANT EXECUTE ON FUNCTION get_training_readiness(VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION get_storage_stats() TO authenticated;

-- Service role needs full access
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;

