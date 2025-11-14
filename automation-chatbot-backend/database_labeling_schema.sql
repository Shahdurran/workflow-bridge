-- Data Quality Control & Labeling Schema
-- Extends training_data table with labeling and quality control features

-- ============================================================================
-- ALTER TABLE: training_data
-- Add labeling and quality control columns
-- ============================================================================

-- Add quality control columns
ALTER TABLE training_data ADD COLUMN IF NOT EXISTS quality_score INTEGER DEFAULT NULL CHECK (quality_score >= 0 AND quality_score <= 100);
ALTER TABLE training_data ADD COLUMN IF NOT EXISTS is_labeled BOOLEAN DEFAULT FALSE;
ALTER TABLE training_data ADD COLUMN IF NOT EXISTS labeled_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE training_data ADD COLUMN IF NOT EXISTS labeled_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE training_data ADD COLUMN IF NOT EXISTS review_notes TEXT;
ALTER TABLE training_data ADD COLUMN IF NOT EXISTS is_rejected BOOLEAN DEFAULT FALSE;
ALTER TABLE training_data ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE training_data ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE training_data ADD COLUMN IF NOT EXISTS is_curated BOOLEAN DEFAULT FALSE;
ALTER TABLE training_data ADD COLUMN IF NOT EXISTS is_duplicate BOOLEAN DEFAULT FALSE;
ALTER TABLE training_data ADD COLUMN IF NOT EXISTS duplicate_of UUID REFERENCES training_data(id) ON DELETE SET NULL;
ALTER TABLE training_data ADD COLUMN IF NOT EXISTS auto_labeled BOOLEAN DEFAULT FALSE;

-- Add indexes for labeling queries
CREATE INDEX IF NOT EXISTS idx_training_data_is_labeled ON training_data(is_labeled);
CREATE INDEX IF NOT EXISTS idx_training_data_quality_score ON training_data(quality_score) WHERE quality_score IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_training_data_is_rejected ON training_data(is_rejected);
CREATE INDEX IF NOT EXISTS idx_training_data_labeled_by ON training_data(labeled_by);
CREATE INDEX IF NOT EXISTS idx_training_data_is_curated ON training_data(is_curated);
CREATE INDEX IF NOT EXISTS idx_training_data_tags ON training_data USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_training_data_labeling_queue ON training_data(is_labeled, quality_score, created_at DESC) WHERE is_rejected = FALSE AND archived_at IS NULL;

-- Add comments for documentation
COMMENT ON COLUMN training_data.quality_score IS 'Manual quality rating 0-100 (0=unusable, 50=acceptable, 80=good, 100=perfect)';
COMMENT ON COLUMN training_data.is_labeled IS 'Whether this interaction has been manually reviewed and labeled';
COMMENT ON COLUMN training_data.labeled_by IS 'User ID of the reviewer who labeled this interaction';
COMMENT ON COLUMN training_data.labeled_at IS 'Timestamp when labeling was completed';
COMMENT ON COLUMN training_data.review_notes IS 'Reviewer notes about quality issues or improvements';
COMMENT ON COLUMN training_data.is_rejected IS 'Mark as rejected - do not use for training';
COMMENT ON COLUMN training_data.rejection_reason IS 'Reason for rejection (spam, invalid, duplicate, etc.)';
COMMENT ON COLUMN training_data.tags IS 'Descriptive tags for categorization (e.g., email-automation, multi-step)';
COMMENT ON COLUMN training_data.is_curated IS 'High-quality example manually verified and curated';
COMMENT ON COLUMN training_data.is_duplicate IS 'Flagged as duplicate of another interaction';
COMMENT ON COLUMN training_data.duplicate_of IS 'Reference to the original interaction if this is a duplicate';
COMMENT ON COLUMN training_data.auto_labeled IS 'Whether quality score was auto-assigned vs manually labeled';

-- ============================================================================
-- TABLE: labeling_sessions
-- Track labeling work sessions for productivity metrics
-- ============================================================================
CREATE TABLE IF NOT EXISTS labeling_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Session details
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE,
    
    -- Productivity metrics
    interactions_labeled INTEGER DEFAULT 0,
    time_spent_minutes INTEGER,
    avg_time_per_label_seconds INTEGER,
    
    -- Session metadata
    platform_focus VARCHAR(50),
    quality_range VARCHAR(50), -- e.g., "high-quality", "needs-review"
    
    INDEX idx_labeling_sessions_user (user_id),
    INDEX idx_labeling_sessions_started (started_at DESC)
);

COMMENT ON TABLE labeling_sessions IS 'Track reviewer productivity and labeling sessions';

-- ============================================================================
-- TABLE: inter_rater_reliability
-- Track multiple labels for the same interaction to measure agreement
-- ============================================================================
CREATE TABLE IF NOT EXISTS inter_rater_reliability (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    training_data_id UUID REFERENCES training_data(id) ON DELETE CASCADE,
    
    -- Reviewer details
    reviewer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    quality_score INTEGER CHECK (quality_score >= 0 AND quality_score <= 100),
    tags TEXT[],
    review_notes TEXT,
    
    -- Metadata
    labeled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    INDEX idx_irr_training_data (training_data_id),
    INDEX idx_irr_reviewer (reviewer_id)
);

COMMENT ON TABLE inter_rater_reliability IS 'Store multiple labels for same interaction to calculate inter-rater agreement';

-- ============================================================================
-- VIEW: labeling_queue_view
-- Smart queue that prioritizes interactions for labeling
-- ============================================================================
CREATE OR REPLACE VIEW labeling_queue_view AS
SELECT 
    td.id,
    td.interaction_id,
    td.user_message,
    td.ai_response,
    td.workflow_generated,
    td.workflow_compressed,
    td.is_compressed,
    td.platform,
    td.success,
    td.user_feedback,
    td.feedback_text,
    td.created_at,
    td.size_bytes,
    td.processing_time_ms,
    
    -- Priority scoring for queue ordering
    CASE
        -- Highest priority: User corrections (most valuable)
        WHEN td.user_feedback = 'edited' THEN 1000
        -- High priority: Negative feedback (learn from failures)
        WHEN td.user_feedback = 'thumbs_down' THEN 900
        -- Medium-high priority: Has any feedback
        WHEN td.user_feedback IS NOT NULL AND td.user_feedback != 'none' THEN 800
        -- Medium priority: Validation failed (needs review)
        WHEN EXISTS (
            SELECT 1 FROM validation_logs vl 
            WHERE vl.training_data_id = td.id AND vl.validation_passed = FALSE
        ) THEN 700
        -- Lower priority: Recent data (within last 7 days)
        WHEN td.created_at > NOW() - INTERVAL '7 days' THEN 600
        -- Base priority
        ELSE 500
    END as priority_score,
    
    -- Include validation info
    (SELECT validation_passed FROM validation_logs WHERE training_data_id = td.id LIMIT 1) as validation_passed,
    (SELECT array_agg(e->>'message') FROM validation_logs vl, jsonb_array_elements(vl.errors) e WHERE vl.training_data_id = td.id LIMIT 1) as validation_errors,
    
    -- Include feedback count
    (SELECT COUNT(*) FROM user_feedback WHERE training_data_id = td.id) as feedback_count
    
FROM training_data td
WHERE 
    td.is_labeled = FALSE
    AND td.is_rejected = FALSE
    AND td.archived_at IS NULL
    AND td.workflow_generated IS NOT NULL
ORDER BY priority_score DESC, td.created_at DESC;

COMMENT ON VIEW labeling_queue_view IS 'Smart labeling queue prioritizing valuable examples';

-- ============================================================================
-- VIEW: labeling_stats_view
-- Statistics for labeling progress and quality distribution
-- ============================================================================
CREATE OR REPLACE VIEW labeling_stats_view AS
SELECT 
    platform,
    COUNT(*) as total_interactions,
    COUNT(*) FILTER (WHERE is_labeled = TRUE) as labeled_count,
    COUNT(*) FILTER (WHERE is_labeled = FALSE) as unlabeled_count,
    ROUND(100.0 * COUNT(*) FILTER (WHERE is_labeled = TRUE) / NULLIF(COUNT(*), 0), 2) as labeled_percentage,
    
    -- Quality distribution
    COUNT(*) FILTER (WHERE quality_score >= 80) as excellent_count,
    COUNT(*) FILTER (WHERE quality_score >= 70 AND quality_score < 80) as good_count,
    COUNT(*) FILTER (WHERE quality_score >= 50 AND quality_score < 70) as fair_count,
    COUNT(*) FILTER (WHERE quality_score < 50 AND quality_score IS NOT NULL) as poor_count,
    
    AVG(quality_score) FILTER (WHERE quality_score IS NOT NULL) as avg_quality_score,
    
    -- Rejection stats
    COUNT(*) FILTER (WHERE is_rejected = TRUE) as rejected_count,
    
    -- Curation stats
    COUNT(*) FILTER (WHERE is_curated = TRUE) as curated_count,
    
    -- Auto-labeling stats
    COUNT(*) FILTER (WHERE auto_labeled = TRUE) as auto_labeled_count,
    COUNT(*) FILTER (WHERE auto_labeled = FALSE AND is_labeled = TRUE) as manual_labeled_count
    
FROM training_data
WHERE archived_at IS NULL
GROUP BY platform;

COMMENT ON VIEW labeling_stats_view IS 'Labeling progress and quality distribution statistics';

-- ============================================================================
-- VIEW: reviewer_productivity_view
-- Track individual reviewer productivity and quality
-- ============================================================================
CREATE OR REPLACE VIEW reviewer_productivity_view AS
SELECT 
    u.id as reviewer_id,
    u.email as reviewer_email,
    COUNT(td.id) as total_labeled,
    COUNT(td.id) FILTER (WHERE td.labeled_at > NOW() - INTERVAL '7 days') as labeled_last_7_days,
    COUNT(td.id) FILTER (WHERE td.labeled_at > NOW() - INTERVAL '30 days') as labeled_last_30_days,
    
    AVG(td.quality_score) FILTER (WHERE td.quality_score IS NOT NULL) as avg_quality_assigned,
    
    -- Labeling speed
    AVG(
        EXTRACT(EPOCH FROM (td.labeled_at - td.created_at)) / 3600
    ) as avg_hours_to_label,
    
    -- Session stats
    (SELECT COUNT(*) FROM labeling_sessions WHERE user_id = u.id) as total_sessions,
    (SELECT SUM(interactions_labeled) FROM labeling_sessions WHERE user_id = u.id) as total_session_labels,
    (SELECT AVG(avg_time_per_label_seconds) FROM labeling_sessions WHERE user_id = u.id) as avg_seconds_per_label
    
FROM auth.users u
LEFT JOIN training_data td ON td.labeled_by = u.id
WHERE EXISTS (SELECT 1 FROM training_data WHERE labeled_by = u.id)
GROUP BY u.id, u.email;

COMMENT ON VIEW reviewer_productivity_view IS 'Individual reviewer productivity metrics';

-- ============================================================================
-- FUNCTION: calculate_inter_rater_agreement
-- Calculate agreement percentage between reviewers for same interactions
-- ============================================================================
CREATE OR REPLACE FUNCTION calculate_inter_rater_agreement()
RETURNS TABLE (
    interaction_id VARCHAR(255),
    reviewer_count INTEGER,
    quality_scores INTEGER[],
    avg_quality DECIMAL(5,2),
    std_dev DECIMAL(5,2),
    agreement_level VARCHAR(20)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        td.interaction_id,
        COUNT(DISTINCT irr.reviewer_id)::INTEGER as reviewer_count,
        array_agg(DISTINCT irr.quality_score) as quality_scores,
        AVG(irr.quality_score)::DECIMAL(5,2) as avg_quality,
        STDDEV(irr.quality_score)::DECIMAL(5,2) as std_dev,
        CASE 
            WHEN STDDEV(irr.quality_score) < 10 THEN 'high'
            WHEN STDDEV(irr.quality_score) < 20 THEN 'medium'
            ELSE 'low'
        END as agreement_level
    FROM training_data td
    INNER JOIN inter_rater_reliability irr ON irr.training_data_id = td.id
    GROUP BY td.interaction_id
    HAVING COUNT(DISTINCT irr.reviewer_id) >= 2;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calculate_inter_rater_agreement IS 'Calculate inter-rater reliability for quality control';

-- ============================================================================
-- FUNCTION: auto_calculate_quality_score
-- Automatically calculate quality score based on available signals
-- ============================================================================
CREATE OR REPLACE FUNCTION auto_calculate_quality_score(p_training_data_id UUID)
RETURNS INTEGER AS $$
DECLARE
    v_score INTEGER := 50; -- Start with neutral score
    v_feedback VARCHAR(20);
    v_validation_passed BOOLEAN;
    v_has_errors BOOLEAN;
    v_user_edited BOOLEAN;
BEGIN
    -- Get interaction details
    SELECT user_feedback INTO v_feedback
    FROM training_data
    WHERE id = p_training_data_id;
    
    -- Get validation details
    SELECT validation_passed, (array_length(errors, 1) > 0)
    INTO v_validation_passed, v_has_errors
    FROM validation_logs
    WHERE training_data_id = p_training_data_id
    LIMIT 1;
    
    -- Get edit status
    SELECT user_edited INTO v_user_edited
    FROM validation_logs
    WHERE training_data_id = p_training_data_id AND user_edited = TRUE
    LIMIT 1;
    
    -- Calculate score based on signals
    
    -- User corrections = gold standard
    IF v_user_edited = TRUE THEN
        v_score := 90;
    -- Thumbs up = high quality
    ELSIF v_feedback = 'thumbs_up' THEN
        v_score := 80;
    -- Thumbs down = low quality
    ELSIF v_feedback = 'thumbs_down' THEN
        v_score := 30;
    -- Validation passed = decent quality
    ELSIF v_validation_passed = TRUE AND v_has_errors = FALSE THEN
        v_score := 70;
    -- Validation failed = poor quality
    ELSIF v_validation_passed = FALSE THEN
        v_score := 40;
    END IF;
    
    RETURN v_score;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION auto_calculate_quality_score IS 'Auto-calculate quality score from available signals';

-- ============================================================================
-- FUNCTION: get_quality_distribution
-- Get distribution of quality scores for analysis
-- ============================================================================
CREATE OR REPLACE FUNCTION get_quality_distribution(p_platform VARCHAR DEFAULT NULL)
RETURNS TABLE (
    quality_range VARCHAR(20),
    count BIGINT,
    percentage DECIMAL(5,2)
) AS $$
BEGIN
    RETURN QUERY
    WITH quality_ranges AS (
        SELECT 
            CASE 
                WHEN quality_score >= 90 THEN '90-100 (Excellent)'
                WHEN quality_score >= 80 THEN '80-89 (Good)'
                WHEN quality_score >= 70 THEN '70-79 (Above Average)'
                WHEN quality_score >= 50 THEN '50-69 (Fair)'
                WHEN quality_score >= 30 THEN '30-49 (Poor)'
                ELSE '0-29 (Unusable)'
            END as range,
            COUNT(*) as cnt
        FROM training_data
        WHERE 
            quality_score IS NOT NULL
            AND (p_platform IS NULL OR platform = p_platform)
            AND archived_at IS NULL
        GROUP BY range
    )
    SELECT 
        range as quality_range,
        cnt as count,
        ROUND(100.0 * cnt / SUM(cnt) OVER (), 2) as percentage
    FROM quality_ranges
    ORDER BY 
        CASE range
            WHEN '90-100 (Excellent)' THEN 1
            WHEN '80-89 (Good)' THEN 2
            WHEN '70-79 (Above Average)' THEN 3
            WHEN '50-69 (Fair)' THEN 4
            WHEN '30-49 (Poor)' THEN 5
            ELSE 6
        END;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_quality_distribution IS 'Get quality score distribution for visualization';

-- ============================================================================
-- FUNCTION: find_duplicate_workflows
-- Find potentially duplicate workflows based on similarity
-- ============================================================================
CREATE OR REPLACE FUNCTION find_duplicate_workflows(p_similarity_threshold DECIMAL DEFAULT 0.9)
RETURNS TABLE (
    original_id UUID,
    duplicate_id UUID,
    original_interaction_id VARCHAR(255),
    duplicate_interaction_id VARCHAR(255),
    platform VARCHAR(50),
    created_at_diff INTERVAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT ON (t2.id)
        t1.id as original_id,
        t2.id as duplicate_id,
        t1.interaction_id as original_interaction_id,
        t2.interaction_id as duplicate_interaction_id,
        t1.platform,
        (t2.created_at - t1.created_at) as created_at_diff
    FROM training_data t1
    INNER JOIN training_data t2 ON 
        t1.platform = t2.platform
        AND t1.id < t2.id  -- Avoid comparing same record and duplicates
        AND t1.user_message = t2.user_message  -- Same user input
        AND t1.is_duplicate = FALSE
        AND t2.is_duplicate = FALSE
    WHERE 
        t1.archived_at IS NULL
        AND t2.archived_at IS NULL
    ORDER BY t2.id, t1.created_at;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION find_duplicate_workflows IS 'Find duplicate interactions for cleanup';

-- ============================================================================
-- Grants for labeling
-- ============================================================================

-- Grant access to authenticated users (reviewers)
GRANT SELECT ON labeling_queue_view TO authenticated;
GRANT SELECT ON labeling_stats_view TO authenticated;
GRANT SELECT ON reviewer_productivity_view TO authenticated;

-- Service role needs full access
GRANT ALL ON labeling_sessions TO service_role;
GRANT ALL ON inter_rater_reliability TO service_role;
GRANT EXECUTE ON FUNCTION calculate_inter_rater_agreement() TO service_role;
GRANT EXECUTE ON FUNCTION auto_calculate_quality_score(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION get_quality_distribution(VARCHAR) TO service_role;
GRANT EXECUTE ON FUNCTION find_duplicate_workflows(DECIMAL) TO service_role;

-- Authenticated users can query these
GRANT EXECUTE ON FUNCTION calculate_inter_rater_agreement() TO authenticated;
GRANT EXECUTE ON FUNCTION get_quality_distribution(VARCHAR) TO authenticated;

-- ============================================================================
-- Initial Data Quality Check
-- ============================================================================

-- Find and flag obvious duplicates
UPDATE training_data t1
SET is_duplicate = TRUE, duplicate_of = (
    SELECT t2.id 
    FROM training_data t2 
    WHERE t2.platform = t1.platform 
      AND t2.user_message = t1.user_message
      AND t2.created_at < t1.created_at
      AND t2.is_duplicate = FALSE
    LIMIT 1
)
WHERE EXISTS (
    SELECT 1 FROM training_data t2 
    WHERE t2.platform = t1.platform 
      AND t2.user_message = t1.user_message
      AND t2.created_at < t1.created_at
      AND t2.id != t1.id
);

-- Auto-label high-confidence examples (thumbs up + validation passed)
UPDATE training_data td
SET 
    quality_score = 80,
    is_labeled = TRUE,
    auto_labeled = TRUE,
    labeled_at = NOW()
WHERE 
    user_feedback = 'thumbs_up'
    AND success = TRUE
    AND is_labeled = FALSE
    AND EXISTS (
        SELECT 1 FROM validation_logs vl 
        WHERE vl.training_data_id = td.id 
          AND vl.validation_passed = TRUE
    );

