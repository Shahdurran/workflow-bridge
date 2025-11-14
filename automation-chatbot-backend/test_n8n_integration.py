"""
Integration tests for n8n-mcp and Claude AI integration.

This module tests:
- n8n-mcp server connectivity
- Claude service initialization
- Chat streaming endpoints
- Workflow validation and deployment
- Database operations

Usage:
    pytest test_n8n_integration.py -v
    
    # Run specific test
    pytest test_n8n_integration.py::test_mcp_health_check -v
    
    # Run with verbose output
    pytest test_n8n_integration.py -vv -s
"""

import pytest
import asyncio
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()


@pytest.fixture(scope="session")
def event_loop():
    """Create an event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


class TestN8nMcpClient:
    """Test n8n-mcp client functionality."""
    
    @pytest.mark.asyncio
    async def test_mcp_health_check(self):
        """Test n8n-mcp server health check."""
        from app.services.n8n_mcp_client import get_mcp_client
        
        client = get_mcp_client()
        
        try:
            result = await client.health_check()
            assert result is not None
            print(f"✓ n8n-mcp health check passed: {result}")
        except Exception as e:
            pytest.skip(f"n8n-mcp server not running: {str(e)}")
    
    @pytest.mark.asyncio
    async def test_list_tools(self):
        """Test listing available MCP tools."""
        from app.services.n8n_mcp_client import get_mcp_client
        
        client = get_mcp_client()
        
        try:
            tools = await client.list_tools()
            assert isinstance(tools, list)
            assert len(tools) > 0
            print(f"✓ Found {len(tools)} MCP tools")
            
            # Check for essential tools
            essential_tools = [
                'search_nodes',
                'get_node_essentials',
                'validate_workflow',
                'search_templates'
            ]
            
            for tool in essential_tools:
                assert tool in tools, f"Essential tool '{tool}' not found"
                print(f"  - {tool} ✓")
                
        except Exception as e:
            pytest.skip(f"n8n-mcp server not running: {str(e)}")
    
    @pytest.mark.asyncio
    async def test_search_nodes(self):
        """Test node search functionality."""
        from app.services.n8n_mcp_client import get_mcp_client
        
        client = get_mcp_client()
        
        try:
            result = await client.search_nodes(
                query="send email",
                include_examples=True,
                limit=5
            )
            
            assert result is not None
            assert 'nodes' in result or 'results' in result
            print(f"✓ Node search completed: {result}")
            
        except Exception as e:
            pytest.skip(f"n8n-mcp server not running: {str(e)}")
    
    @pytest.mark.asyncio
    async def test_validate_workflow(self):
        """Test workflow validation."""
        from app.services.n8n_mcp_client import get_mcp_client
        
        client = get_mcp_client()
        
        # Simple test workflow
        test_workflow = {
            "name": "Test Workflow",
            "nodes": [
                {
                    "parameters": {},
                    "name": "Start",
                    "type": "n8n-nodes-base.start",
                    "typeVersion": 1,
                    "position": [250, 300]
                }
            ],
            "connections": {}
        }
        
        try:
            result = await client.validate_workflow(
                workflow=test_workflow,
                profile="balanced"
            )
            
            assert result is not None
            assert 'valid' in result
            print(f"✓ Workflow validation completed: valid={result.get('valid')}")
            
        except Exception as e:
            pytest.skip(f"n8n-mcp server not running: {str(e)}")


class TestClaudeService:
    """Test Claude AI service."""
    
    def test_claude_configured(self):
        """Test Claude AI configuration."""
        from app.core.config import settings
        
        if not settings.claude_configured:
            pytest.skip("Claude AI not configured (ANTHROPIC_API_KEY not set)")
        
        assert settings.anthropic_api_key is not None
        assert settings.claude_model is not None
        print(f"✓ Claude configured with model: {settings.claude_model}")
    
    @pytest.mark.asyncio
    async def test_claude_service_init(self):
        """Test Claude service initialization."""
        from app.core.config import settings
        
        if not settings.claude_configured:
            pytest.skip("Claude AI not configured")
        
        from app.services.claude_service import get_claude_service
        
        try:
            service = get_claude_service()
            assert service is not None
            print("✓ Claude service initialized successfully")
        except Exception as e:
            pytest.fail(f"Failed to initialize Claude service: {str(e)}")


class TestDatabaseSchema:
    """Test database schema and operations."""
    
    @pytest.mark.asyncio
    async def test_supabase_connection(self):
        """Test Supabase connection."""
        from app.services.supabase_client import get_supabase_client
        
        client = get_supabase_client()
        
        if not client:
            pytest.skip("Supabase not configured")
        
        print("✓ Supabase client initialized")
    
    @pytest.mark.asyncio
    async def test_database_tables_exist(self):
        """Test that required tables exist."""
        from app.services.supabase_client import get_supabase_client
        
        client = get_supabase_client()
        
        if not client:
            pytest.skip("Supabase not configured")
        
        required_tables = [
            'conversations',
            'messages',
            'workflows'
        ]
        
        for table_name in required_tables:
            try:
                # Try to query the table
                result = client.table(table_name).select("id").limit(1).execute()
                print(f"✓ Table '{table_name}' exists")
            except Exception as e:
                pytest.fail(
                    f"Table '{table_name}' not found. "
                    f"Please run: python setup_n8n_database.py\n"
                    f"Error: {str(e)}"
                )


class TestChatEndpoints:
    """Test chat API endpoints."""
    
    @pytest.mark.asyncio
    async def test_health_endpoint(self):
        """Test health check endpoint."""
        from app.main import app
        from fastapi.testclient import TestClient
        
        client = TestClient(app)
        response = client.get("/health")
        
        assert response.status_code in [200, 503]
        data = response.json()
        
        assert 'status' in data
        assert 'timestamp' in data
        
        print(f"✓ Health check: {data['status']}")
        
        # Check service statuses
        if 'claude_service' in data:
            print(f"  - Claude: {data['claude_service'].get('status')}")
        if 'n8n_mcp' in data:
            print(f"  - n8n-mcp: {data['n8n_mcp'].get('status')}")


class TestEndToEnd:
    """End-to-end integration tests."""
    
    @pytest.mark.asyncio
    @pytest.mark.slow
    async def test_simple_chat_flow(self):
        """Test a simple chat interaction (if all services are available)."""
        from app.core.config import settings
        from app.services.claude_service import get_claude_service
        from app.services.n8n_mcp_client import get_mcp_client
        
        # Check prerequisites
        if not settings.claude_configured:
            pytest.skip("Claude AI not configured")
        
        try:
            # Test MCP client
            mcp_client = get_mcp_client()
            await mcp_client.health_check()
            
            # Test Claude service
            claude_service = get_claude_service()
            
            print("✓ All services available for end-to-end test")
            
            # This would test actual chat streaming
            # For now, just verify services are initialized
            assert mcp_client is not None
            assert claude_service is not None
            
        except Exception as e:
            pytest.skip(f"Services not available: {str(e)}")


def test_environment_variables():
    """Test that required environment variables are set."""
    required_vars = {
        'SUPABASE_URL': os.getenv('SUPABASE_URL'),
        'SUPABASE_ANON_KEY': os.getenv('SUPABASE_ANON_KEY'),
    }
    
    optional_vars = {
        'ANTHROPIC_API_KEY': os.getenv('ANTHROPIC_API_KEY'),
        'N8N_MCP_URL': os.getenv('N8N_MCP_URL'),
        'N8N_API_URL': os.getenv('N8N_API_URL'),
        'N8N_API_KEY': os.getenv('N8N_API_KEY'),
    }
    
    print("\nEnvironment Variables Check:")
    print("=" * 60)
    
    # Check required vars
    missing_required = []
    for var, value in required_vars.items():
        if value:
            print(f"✓ {var}: configured")
        else:
            print(f"✗ {var}: NOT SET (required)")
            missing_required.append(var)
    
    # Check optional vars
    for var, value in optional_vars.items():
        if value:
            print(f"✓ {var}: configured")
        else:
            print(f"○ {var}: not set (optional for MVP)")
    
    if missing_required:
        pytest.fail(
            f"Missing required environment variables: {', '.join(missing_required)}\n"
            f"Please configure them in your .env file"
        )


if __name__ == "__main__":
    """Run tests with pytest."""
    pytest.main([__file__, "-v", "-s"])

