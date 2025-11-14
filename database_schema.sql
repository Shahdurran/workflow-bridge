-- =====================================================================
-- Workflow Automation Platform - Database Schema
-- =====================================================================
-- This schema supports workflow generation, conversation management,
-- and template storage for n8n, Make.com, and Zapier platforms.
-- =====================================================================

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================================
-- WORKFLOWS TABLE
-- =====================================================================
-- Stores generated workflows for different automation platforms
CREATE TABLE IF NOT EXISTS workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    platform VARCHAR(50) NOT NULL CHECK (platform IN ('n8n', 'make', 'zapier')),
    workflow_json JSONB NOT NULL,
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID,
    tags TEXT[],
    metadata JSONB DEFAULT '{}'::jsonb,
    
    -- Validation
    CONSTRAINT workflows_name_not_empty CHECK (length(trim(name)) > 0),
    CONSTRAINT workflows_platform_lowercase CHECK (platform = lower(platform))
);

-- =====================================================================
-- CONVERSATIONS TABLE
-- =====================================================================
-- Stores chat conversations and workflow generation sessions
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id VARCHAR(255) UNIQUE NOT NULL,
    workflow_id UUID REFERENCES workflows(id) ON DELETE SET NULL,
    messages JSONB NOT NULL DEFAULT '[]'::jsonb,
    platform VARCHAR(50),
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned')),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Validation
    CONSTRAINT conversations_session_id_not_empty CHECK (length(trim(session_id)) > 0),
    CONSTRAINT conversations_messages_is_array CHECK (jsonb_typeof(messages) = 'array')
);

-- =====================================================================
-- WORKFLOW_TEMPLATES TABLE
-- =====================================================================
-- Stores reusable workflow templates for common automation patterns
CREATE TABLE IF NOT EXISTS workflow_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    platform VARCHAR(50) NOT NULL CHECK (platform IN ('n8n', 'make', 'zapier')),
    trigger_type VARCHAR(100) NOT NULL,
    action_types TEXT[] NOT NULL,
    json_template JSONB NOT NULL,
    usage_count INTEGER DEFAULT 0,
    tags TEXT[],
    category VARCHAR(100),
    is_public BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Validation
    CONSTRAINT templates_name_not_empty CHECK (length(trim(name)) > 0),
    CONSTRAINT templates_usage_count_positive CHECK (usage_count >= 0),
    CONSTRAINT templates_action_types_not_empty CHECK (array_length(action_types, 1) > 0)
);

-- =====================================================================
-- INDEXES
-- =====================================================================

-- Workflows indexes
CREATE INDEX IF NOT EXISTS idx_workflows_platform ON workflows(platform);
CREATE INDEX IF NOT EXISTS idx_workflows_status ON workflows(status);
CREATE INDEX IF NOT EXISTS idx_workflows_created_at ON workflows(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_workflows_created_by ON workflows(created_by);
CREATE INDEX IF NOT EXISTS idx_workflows_tags ON workflows USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_workflows_name_search ON workflows USING gin(to_tsvector('english', name));

-- Conversations indexes
CREATE INDEX IF NOT EXISTS idx_conversations_session_id ON conversations(session_id);
CREATE INDEX IF NOT EXISTS idx_conversations_workflow_id ON conversations(workflow_id);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations(status);
CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON conversations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_platform ON conversations(platform);

-- Templates indexes
CREATE INDEX IF NOT EXISTS idx_templates_platform ON workflow_templates(platform);
CREATE INDEX IF NOT EXISTS idx_templates_trigger ON workflow_templates(trigger_type);
CREATE INDEX IF NOT EXISTS idx_templates_category ON workflow_templates(category);
CREATE INDEX IF NOT EXISTS idx_templates_is_public ON workflow_templates(is_public);
CREATE INDEX IF NOT EXISTS idx_templates_usage_count ON workflow_templates(usage_count DESC);
CREATE INDEX IF NOT EXISTS idx_templates_tags ON workflow_templates USING GIN(tags);

-- =====================================================================
-- TRIGGER FUNCTIONS
-- =====================================================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to increment template usage count
CREATE OR REPLACE FUNCTION increment_template_usage()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE workflow_templates
    SET usage_count = usage_count + 1
    WHERE id = NEW.workflow_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================================
-- TRIGGERS
-- =====================================================================

-- Auto-update updated_at on workflows table
CREATE TRIGGER update_workflows_updated_at
    BEFORE UPDATE ON workflows
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Auto-update updated_at on conversations table
CREATE TRIGGER update_conversations_updated_at
    BEFORE UPDATE ON conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Auto-update updated_at on templates table
CREATE TRIGGER update_templates_updated_at
    BEFORE UPDATE ON workflow_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================================
-- Note: Uncomment and customize these if you want to use RLS

-- Enable RLS
-- ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE workflow_templates ENABLE ROW LEVEL SECURITY;

-- Example policies (customize based on your auth setup)
-- CREATE POLICY "Users can view their own workflows"
--     ON workflows FOR SELECT
--     USING (created_by = auth.uid());

-- CREATE POLICY "Users can insert their own workflows"
--     ON workflows FOR INSERT
--     WITH CHECK (created_by = auth.uid());

-- CREATE POLICY "Users can update their own workflows"
--     ON workflows FOR UPDATE
--     USING (created_by = auth.uid());

-- CREATE POLICY "Users can delete their own workflows"
--     ON workflows FOR DELETE
--     USING (created_by = auth.uid());

-- CREATE POLICY "Everyone can view public templates"
--     ON workflow_templates FOR SELECT
--     USING (is_public = true);

-- =====================================================================
-- VIEWS
-- =====================================================================

-- View for workflow statistics
CREATE OR REPLACE VIEW workflow_stats AS
SELECT
    platform,
    status,
    COUNT(*) as workflow_count,
    AVG(CASE WHEN created_at > NOW() - INTERVAL '7 days' THEN 1 ELSE 0 END) as recent_workflows
FROM workflows
GROUP BY platform, status;

-- View for popular templates
CREATE OR REPLACE VIEW popular_templates AS
SELECT
    id,
    name,
    description,
    platform,
    trigger_type,
    usage_count,
    tags,
    created_at
FROM workflow_templates
WHERE is_public = true
ORDER BY usage_count DESC, created_at DESC
LIMIT 20;

-- =====================================================================
-- HELPER FUNCTIONS
-- =====================================================================

-- Function to search workflows by name or description
CREATE OR REPLACE FUNCTION search_workflows(search_query TEXT)
RETURNS TABLE (
    id UUID,
    name VARCHAR(255),
    description TEXT,
    platform VARCHAR(50),
    status VARCHAR(50),
    relevance REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        w.id,
        w.name,
        w.description,
        w.platform,
        w.status,
        ts_rank(
            to_tsvector('english', w.name || ' ' || COALESCE(w.description, '')),
            plainto_tsquery('english', search_query)
        ) as relevance
    FROM workflows w
    WHERE
        to_tsvector('english', w.name || ' ' || COALESCE(w.description, ''))
        @@ plainto_tsquery('english', search_query)
    ORDER BY relevance DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get conversation message count
CREATE OR REPLACE FUNCTION get_conversation_message_count(conv_session_id VARCHAR)
RETURNS INTEGER AS $$
DECLARE
    msg_count INTEGER;
BEGIN
    SELECT jsonb_array_length(messages)
    INTO msg_count
    FROM conversations
    WHERE session_id = conv_session_id;
    
    RETURN COALESCE(msg_count, 0);
END;
$$ LANGUAGE plpgsql;

-- =====================================================================
-- SAMPLE DATA (Optional - comment out for production)
-- =====================================================================

-- Insert sample workflow template
-- INSERT INTO workflow_templates (name, description, platform, trigger_type, action_types, json_template, category, tags)
-- VALUES (
--     'Form to Email Notification',
--     'Automatically send an email when a Google Form is submitted',
--     'zapier',
--     'google_forms',
--     ARRAY['gmail'],
--     '{"title": "Form to Email", "steps": [...]}'::jsonb,
--     'productivity',
--     ARRAY['email', 'forms', 'notifications']
-- );

-- =====================================================================
-- GRANTS (Customize based on your user roles)
-- =====================================================================

-- Grant necessary permissions to authenticated users
-- GRANT SELECT, INSERT, UPDATE, DELETE ON workflows TO authenticated;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON conversations TO authenticated;
-- GRANT SELECT ON workflow_templates TO authenticated;
-- GRANT INSERT, UPDATE ON workflow_templates TO authenticated;

-- Grant permissions to service role (for backend operations)
-- GRANT ALL ON workflows TO service_role;
-- GRANT ALL ON conversations TO service_role;
-- GRANT ALL ON workflow_templates TO service_role;

-- =====================================================================
-- COMMENTS
-- =====================================================================

COMMENT ON TABLE workflows IS 'Stores generated workflows for automation platforms (n8n, Make.com, Zapier)';
COMMENT ON TABLE conversations IS 'Stores chat conversations and workflow generation sessions';
COMMENT ON TABLE workflow_templates IS 'Stores reusable workflow templates for common automation patterns';

COMMENT ON COLUMN workflows.workflow_json IS 'Platform-specific workflow configuration in JSON format';
COMMENT ON COLUMN workflows.status IS 'Current workflow status: draft, active, or archived';
COMMENT ON COLUMN conversations.messages IS 'Array of conversation messages with role, content, and timestamp';
COMMENT ON COLUMN workflow_templates.usage_count IS 'Number of times this template has been used to generate workflows';

-- =====================================================================
-- VERIFICATION QUERIES
-- =====================================================================

-- Run these queries to verify the schema was created successfully:

-- Check tables
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('workflows', 'conversations', 'workflow_templates');

-- Check indexes
-- SELECT indexname FROM pg_indexes WHERE schemaname = 'public' AND tablename IN ('workflows', 'conversations', 'workflow_templates');

-- Check triggers
-- SELECT trigger_name, event_object_table FROM information_schema.triggers WHERE trigger_schema = 'public';

-- =====================================================================
-- MAINTENANCE
-- =====================================================================

-- Cleanup old abandoned conversations (run periodically)
-- DELETE FROM conversations WHERE status = 'abandoned' AND updated_at < NOW() - INTERVAL '30 days';

-- Archive old workflows (run periodically)
-- UPDATE workflows SET status = 'archived' WHERE status = 'draft' AND updated_at < NOW() - INTERVAL '90 days';

-- =====================================================================
-- END OF SCHEMA
-- =====================================================================

