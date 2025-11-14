"""
Basic API tests for the automation chatbot backend.

This module contains basic tests for API endpoints to ensure
they respond correctly and handle errors appropriately.
"""

import pytest
import asyncio
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock

from app.main import app

# Create test client
client = TestClient(app)


class TestHealthEndpoints:
    """Test health check endpoints."""
    
    def test_root_endpoint(self):
        """Test root endpoint returns success."""
        response = client.get("/")
        assert response.status_code == 200
        assert "message" in response.json()
        assert "Automation Chatbot API is running" in response.json()["message"]
    
    def test_health_endpoint(self):
        """Test health check endpoint."""
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert "status" in data
        assert "message" in data
        assert "supabase_connected" in data


class TestChatEndpoints:
    """Test chat API endpoints."""
    
    def test_chat_message_endpoint_exists(self):
        """Test that chat message endpoint exists."""
        # Test with invalid data to check endpoint exists
        response = client.post("/api/chat/message", json={})
        # Should return 422 for validation error, not 404
        assert response.status_code in [400, 422, 500]
    
    def test_chat_message_with_valid_data(self):
        """Test chat message with valid data."""
        message_data = {
            "message": "I want to create a workflow that sends an email when I receive a form submission",
            "session_id": "test-session-123"
        }
        
        response = client.post("/api/chat/message", json=message_data)
        # Should not return 404 (endpoint exists)
        assert response.status_code != 404
        
        if response.status_code == 200:
            data = response.json()
            assert "message" in data
            assert "session_id" in data
    
    def test_chat_history_endpoint_exists(self):
        """Test that chat history endpoint exists."""
        response = client.get("/api/chat/history/test-session")
        # Should not return 404 (endpoint exists)
        assert response.status_code != 404


class TestWorkflowEndpoints:
    """Test workflow API endpoints."""
    
    def test_workflow_generation_endpoint_exists(self):
        """Test that workflow generation endpoint exists."""
        generation_data = {
            "session_id": "test-session",
            "platform": "n8n"
        }
        
        response = client.post("/api/workflow/generate", json=generation_data)
        # Should not return 404 (endpoint exists)
        assert response.status_code != 404
    
    def test_workflow_validation_endpoint_exists(self):
        """Test that workflow validation endpoint exists."""
        validation_data = {
            "workflow_json": {"name": "test", "nodes": [], "connections": {}},
            "platform": "n8n"
        }
        
        response = client.post("/api/workflow/validate", json=validation_data)
        # Should not return 404 (endpoint exists)
        assert response.status_code != 404
    
    def test_workflow_templates_endpoint(self):
        """Test workflow templates endpoint."""
        response = client.get("/api/workflow/templates")
        assert response.status_code == 200
        data = response.json()
        assert "templates" in data


class TestPlatformEndpoints:
    """Test platform API endpoints."""
    
    def test_list_platforms_endpoint(self):
        """Test list platforms endpoint."""
        response = client.get("/api/platforms/")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    def test_platform_capabilities_endpoint(self):
        """Test platform capabilities endpoint."""
        response = client.get("/api/platforms/n8n/capabilities")
        assert response.status_code == 200
        data = response.json()
        assert "platform_id" in data
        assert "triggers" in data
        assert "actions" in data
    
    def test_platform_capabilities_invalid_platform(self):
        """Test platform capabilities with invalid platform."""
        response = client.get("/api/platforms/invalid-platform/capabilities")
        assert response.status_code == 404
    
    def test_platform_integrations_endpoint(self):
        """Test platform integrations endpoint."""
        response = client.get("/api/platforms/n8n/integrations")
        assert response.status_code == 200
        data = response.json()
        assert "platform_id" in data
        assert "integrations" in data


class TestErrorHandling:
    """Test error handling across endpoints."""
    
    def test_invalid_json_handling(self):
        """Test handling of invalid JSON data."""
        response = client.post(
            "/api/chat/message",
            data="invalid json",
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code in [400, 422]
    
    def test_missing_required_fields(self):
        """Test handling of missing required fields."""
        response = client.post("/api/chat/message", json={})
        assert response.status_code == 422
    
    def test_invalid_platform_parameter(self):
        """Test handling of invalid platform parameter."""
        response = client.post("/api/workflow/generate", json={
            "session_id": "test",
            "platform": "invalid-platform"
        })
        assert response.status_code in [400, 422]


class TestCORSHeaders:
    """Test CORS headers are properly set."""
    
    def test_cors_headers_present(self):
        """Test that CORS headers are present in responses."""
        response = client.get("/")
        
        # Check for CORS headers (may not be present in test client)
        # This is more of a smoke test
        assert response.status_code == 200


@pytest.mark.asyncio
class TestAsyncEndpoints:
    """Test async endpoint functionality."""
    
    async def test_async_chat_processing(self):
        """Test async chat message processing."""
        # This would test the actual async functionality
        # For now, just ensure the endpoint can handle async operations
        message_data = {
            "message": "Create a workflow",
            "session_id": "async-test"
        }
        
        response = client.post("/api/chat/message", json=message_data)
        assert response.status_code != 404


class TestValidationSchemas:
    """Test Pydantic validation schemas."""
    
    def test_chat_message_validation(self):
        """Test chat message validation."""
        # Test with missing message
        response = client.post("/api/chat/message", json={"session_id": "test"})
        assert response.status_code == 422
        
        # Test with empty message
        response = client.post("/api/chat/message", json={
            "message": "",
            "session_id": "test"
        })
        assert response.status_code == 422
        
        # Test with too long message
        long_message = "x" * 3000
        response = client.post("/api/chat/message", json={
            "message": long_message,
            "session_id": "test"
        })
        assert response.status_code == 422
    
    def test_workflow_generation_validation(self):
        """Test workflow generation validation."""
        # Test with missing required fields
        response = client.post("/api/workflow/generate", json={})
        assert response.status_code == 422
        
        # Test with invalid platform
        response = client.post("/api/workflow/generate", json={
            "session_id": "test",
            "platform": ""
        })
        assert response.status_code == 422


# Fixtures for testing
@pytest.fixture
def mock_ai_service():
    """Mock AI service for testing."""
    with patch('app.services.ai_service.AIService') as mock:
        mock_instance = MagicMock()
        mock.return_value = mock_instance
        yield mock_instance


@pytest.fixture
def mock_workflow_generator():
    """Mock workflow generator for testing."""
    with patch('app.services.workflow_generator.WorkflowGenerator') as mock:
        mock_instance = MagicMock()
        mock.return_value = mock_instance
        yield mock_instance


@pytest.fixture
def mock_validator():
    """Mock validator for testing."""
    with patch('app.services.validator.WorkflowValidator') as mock:
        mock_instance = MagicMock()
        mock.return_value = mock_instance
        yield mock_instance


@pytest.fixture
def mock_supabase_client():
    """Mock Supabase client for testing."""
    with patch('app.services.supabase_client.get_supabase_client') as mock:
        mock_client = MagicMock()
        mock.return_value = mock_client
        yield mock_client


# Integration tests would go here
class TestIntegration:
    """Integration tests for the API."""
    
    @pytest.mark.skip(reason="Requires actual services to be implemented")
    def test_full_workflow_generation_flow(self):
        """Test complete workflow generation flow."""
        # This would test the full flow from chat message to workflow generation
        pass
    
    @pytest.mark.skip(reason="Requires database setup")
    def test_database_integration(self):
        """Test database integration."""
        # This would test actual database operations
        pass


if __name__ == "__main__":
    pytest.main([__file__])
