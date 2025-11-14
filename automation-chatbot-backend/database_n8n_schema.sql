-- n8n Chat Integration Database Schema for Supabase
-- This schema supports Claude AI with n8n-mcp integration for workflow automation

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- CONVERSATIONS TABLE
-- ============================================================================
-- Stores conversation sessions between users and Claude AI
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL,  -- User identifier (could be Supabase auth user ID)
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb  -- Additional conversation metadata
);

-- Indexes for conversations
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON conversations(updated_at DESC);

-- ============================================================================
-- MESSAGES TABLE
-- ============================================================================
-- Stores individual messages within conversations
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    workflow_json JSONB,  -- Extracted workflow if present in message
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for messages
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_workflow_json ON messages USING GIN (workflow_json) WHERE workflow_json IS NOT NULL;

-- ============================================================================
-- WORKFLOWS TABLE
-- ============================================================================
-- Stores deployed workflows with n8n metadata
CREATE TABLE IF NOT EXISTS workflows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL,
    conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
    workflow_data JSONB NOT NULL,  -- Complete workflow JSON
    n8n_workflow_id TEXT,  -- ID from n8n instance
    n8n_workflow_url TEXT,  -- URL to workflow in n8n
    deployed_at TIMESTAMPTZ,  -- When workflow was deployed
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb  -- Additional workflow metadata
);

-- Indexes for workflows
CREATE INDEX IF NOT EXISTS idx_workflows_user_id ON workflows(user_id);
CREATE INDEX IF NOT EXISTS idx_workflows_conversation_id ON workflows(conversation_id);
CREATE INDEX IF NOT EXISTS idx_workflows_n8n_workflow_id ON workflows(n8n_workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflows_created_at ON workflows(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_workflows_workflow_data ON workflows USING GIN (workflow_data);

-- ============================================================================
-- WORKFLOW EXECUTIONS TABLE (Optional - for tracking)
-- ============================================================================
-- Stores execution history for workflows
CREATE TABLE IF NOT EXISTS workflow_executions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
    n8n_execution_id TEXT,  -- Execution ID from n8n
    status TEXT CHECK (status IN ('running', 'success', 'error', 'waiting')),
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    finished_at TIMESTAMPTZ,
    execution_data JSONB,  -- Execution details/results
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for workflow_executions
CREATE INDEX IF NOT EXISTS idx_executions_workflow_id ON workflow_executions(workflow_id);
CREATE INDEX IF NOT EXISTS idx_executions_n8n_execution_id ON workflow_executions(n8n_execution_id);
CREATE INDEX IF NOT EXISTS idx_executions_status ON workflow_executions(status);
CREATE INDEX IF NOT EXISTS idx_executions_started_at ON workflow_executions(started_at DESC);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger for conversations updated_at
DROP TRIGGER IF EXISTS update_conversations_updated_at ON conversations;
CREATE TRIGGER update_conversations_updated_at
    BEFORE UPDATE ON conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for workflows updated_at
DROP TRIGGER IF EXISTS update_workflows_updated_at ON workflows;
CREATE TRIGGER update_workflows_updated_at
    BEFORE UPDATE ON workflows
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
-- Enable RLS on all tables (recommended for Supabase)

-- Enable RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_executions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own conversations
CREATE POLICY conversations_user_policy ON conversations
    FOR ALL
    USING (user_id = current_setting('app.current_user_id', TRUE));

-- Policy: Users can only access messages in their conversations
CREATE POLICY messages_user_policy ON messages
    FOR ALL
    USING (
        conversation_id IN (
            SELECT id FROM conversations 
            WHERE user_id = current_setting('app.current_user_id', TRUE)
        )
    );

-- Policy: Users can only access their own workflows
CREATE POLICY workflows_user_policy ON workflows
    FOR ALL
    USING (user_id = current_setting('app.current_user_id', TRUE));

-- Policy: Users can only access executions of their workflows
CREATE POLICY executions_user_policy ON workflow_executions
    FOR ALL
    USING (
        workflow_id IN (
            SELECT id FROM workflows 
            WHERE user_id = current_setting('app.current_user_id', TRUE)
        )
    );

-- ============================================================================
-- SERVICE ROLE POLICIES (for backend API)
-- ============================================================================
-- Allow service role to bypass RLS for backend operations

-- If using Supabase service role, add these policies:
-- CREATE POLICY service_role_all_conversations ON conversations FOR ALL TO service_role USING (true);
-- CREATE POLICY service_role_all_messages ON messages FOR ALL TO service_role USING (true);
-- CREATE POLICY service_role_all_workflows ON workflows FOR ALL TO service_role USING (true);
-- CREATE POLICY service_role_all_executions ON workflow_executions FOR ALL TO service_role USING (true);

-- ============================================================================
-- SAMPLE QUERIES
-- ============================================================================

-- Get user's conversation history with message count
-- SELECT 
--     c.id,
--     c.created_at,
--     c.updated_at,
--     COUNT(m.id) as message_count
-- FROM conversations c
-- LEFT JOIN messages m ON m.conversation_id = c.id
-- WHERE c.user_id = 'user123'
-- GROUP BY c.id, c.created_at, c.updated_at
-- ORDER BY c.updated_at DESC;

-- Get all messages in a conversation
-- SELECT id, role, content, workflow_json, created_at
-- FROM messages
-- WHERE conversation_id = 'conversation-uuid'
-- ORDER BY created_at ASC;

-- Get user's deployed workflows
-- SELECT 
--     id,
--     n8n_workflow_id,
--     n8n_workflow_url,
--     deployed_at,
--     workflow_data->>'name' as workflow_name
-- FROM workflows
-- WHERE user_id = 'user123'
-- ORDER BY deployed_at DESC;

-- Get workflow execution history
-- SELECT 
--     we.id,
--     we.n8n_execution_id,
--     we.status,
--     we.started_at,
--     we.finished_at,
--     w.workflow_data->>'name' as workflow_name
-- FROM workflow_executions we
-- JOIN workflows w ON w.id = we.workflow_id
-- WHERE w.user_id = 'user123'
-- ORDER BY we.started_at DESC;

-- ============================================================================
-- NOTES
-- ============================================================================
-- 
-- 1. USER_ID: This schema uses TEXT for user_id to be flexible. In production:
--    - For Supabase Auth: Use auth.uid() or reference auth.users table
--    - For custom auth: Use your user ID format
-- 
-- 2. RLS POLICIES: The policies above use current_setting('app.current_user_id')
--    Your backend should set this before queries:
--    SET app.current_user_id = 'actual-user-id';
--    
--    Or use Supabase's auth.uid() if using Supabase Auth
-- 
-- 3. SERVICE ROLE: If your backend uses Supabase service role key, uncomment
--    the service role policies to allow backend operations
-- 
-- 4. CASCADING DELETES: 
--    - Deleting a conversation deletes all its messages
--    - Deleting a workflow deletes all its executions
--    - This keeps your database clean
-- 
-- 5. JSONB COLUMNS:
--    - workflow_json: Stores extracted workflows from chat
--    - workflow_data: Stores complete workflow configuration
--    - execution_data: Stores execution results
--    - metadata: For extensibility
-- 
-- 6. PERFORMANCE: Indexes are created for common query patterns:
--    - User lookups
--    - Time-based sorting
--    - JSONB searching (GIN indexes)
-- 
-- ============================================================================

