"""
n8n-mcp Client Service

This service provides an interface to communicate with the n8n-mcp server
via HTTP, enabling Claude AI to interact with n8n workflows and nodes.
"""

import httpx
import json
import logging
from typing import Dict, Any, List, Optional
from fastapi import HTTPException

from app.core.config import settings

logger = logging.getLogger(__name__)


class N8nMcpClient:
    """
    Client for interacting with n8n-mcp (Model Context Protocol for n8n).
    
    This client provides methods to:
    - Search and retrieve n8n node documentation
    - Validate workflow structures
    - Search and fetch workflow templates
    - Create and manage workflows in n8n
    - List and retrieve workflow executions
    """
    
    def __init__(self, base_url: Optional[str] = None, auth_token: Optional[str] = None):
        """
        Initialize the n8n-mcp client.
        
        Args:
            base_url: Base URL of the n8n-mcp server. If None, uses config.
            auth_token: Authentication token for HTTP mode. If None, uses config.
        """
        self.base_url = base_url or settings.n8n_mcp_url
        self.auth_token = auth_token or getattr(settings, 'n8n_mcp_auth_token', None)
        self.mcp_endpoint = f"{self.base_url}/mcp"
        self.timeout = httpx.Timeout(30.0, connect=5.0)
        self._request_id = 1
        self._initialized = False
        
        logger.info(f"N8nMcpClient initialized with base_url: {self.base_url}")
    
    async def _initialize_if_needed(self) -> None:
        """Initialize MCP session if not already initialized."""
        if self._initialized:
            return
            
        try:
            headers = {"Content-Type": "application/json"}
            if self.auth_token:
                headers["Authorization"] = f"Bearer {self.auth_token}"
            
            payload = {
                "jsonrpc": "2.0",
                "method": "initialize",
                "params": {
                    "protocolVersion": "2024-11-05",
                    "capabilities": {}
                },
                "id": self._request_id
            }
            self._request_id += 1
            
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                logger.debug("Initializing MCP session")
                response = await client.post(self.mcp_endpoint, json=payload, headers=headers)
                response.raise_for_status()
                result = response.json()
                
                if "error" in result:
                    raise Exception(f"MCP initialization failed: {result['error']}")
                    
                logger.info("MCP session initialized successfully")
                self._initialized = True
                
        except Exception as e:
            logger.error(f"Failed to initialize MCP session: {str(e)}")
            raise
    
    async def _call_tool(self, tool_name: str, tool_input: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generic method to call any MCP tool using JSON-RPC 2.0 protocol.
        
        Args:
            tool_name: Name of the MCP tool to call
            tool_input: Input parameters for the tool
            
        Returns:
            Dict containing the tool result
            
        Raises:
            HTTPException: If the MCP server request fails
        """
        # Ensure MCP session is initialized
        await self._initialize_if_needed()
        
        # Prepare JSON-RPC 2.0 request for tools/call
        payload = {
            "jsonrpc": "2.0",
            "method": "tools/call",
            "params": {
                "name": tool_name,
                "arguments": tool_input
            },
            "id": self._request_id
        }
        self._request_id += 1
        
        try:
            # Prepare headers
            headers = {"Content-Type": "application/json"}
            if self.auth_token:
                headers["Authorization"] = f"Bearer {self.auth_token}"
            
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                logger.debug(f"Calling MCP tool: {tool_name} with input: {tool_input}")
                response = await client.post(self.mcp_endpoint, json=payload, headers=headers)
                response.raise_for_status()
                result = response.json()
                
                # Check for JSON-RPC error
                if "error" in result:
                    error = result["error"]
                    logger.error(f"MCP tool {tool_name} returned error: {error}")
                    raise HTTPException(
                        status_code=500,
                        detail=f"MCP tool error: {error.get('message', 'Unknown error')}"
                    )
                
                # Extract the result from JSON-RPC response
                if "result" not in result:
                    logger.error(f"Invalid MCP response: {result}")
                    raise HTTPException(
                        status_code=500,
                        detail="Invalid MCP response: missing result field"
                    )
                
                # Parse the content from MCP response
                mcp_result = result["result"]
                if "content" in mcp_result and len(mcp_result["content"]) > 0:
                    # Get the text content and parse it as JSON
                    content_text = mcp_result["content"][0].get("text", "{}")
                    try:
                        parsed_result = json.loads(content_text)
                    except json.JSONDecodeError:
                        # If it's not JSON, return as-is
                        parsed_result = {"result": content_text}
                    
                    logger.debug(f"MCP tool {tool_name} succeeded")
                    return parsed_result
                else:
                    logger.warning(f"MCP tool {tool_name} returned empty content")
                    return {}
                
        except httpx.TimeoutException:
            logger.error(f"Timeout calling MCP tool: {tool_name}")
            raise HTTPException(
                status_code=504,
                detail=f"n8n-mcp server timeout for tool: {tool_name}"
            )
        except httpx.HTTPStatusError as e:
            logger.error(f"HTTP error calling MCP tool {tool_name}: {e.response.status_code}")
            raise HTTPException(
                status_code=e.response.status_code,
                detail=f"n8n-mcp server error: {e.response.text}"
            )
        except httpx.RequestError as e:
            logger.error(f"Request error calling MCP tool {tool_name}: {str(e)}")
            raise HTTPException(
                status_code=503,
                detail=f"Cannot connect to n8n-mcp server at {self.base_url}"
            )
        except HTTPException:
            # Re-raise HTTP exceptions as-is
            raise
        except Exception as e:
            logger.error(f"Unexpected error calling MCP tool {tool_name}: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail=f"Unexpected error calling n8n-mcp: {str(e)}"
            )
    
    async def health_check(self) -> Dict[str, Any]:
        """
        Check if n8n-mcp server is healthy and responsive.
        
        Returns:
            Dict with health status information
        """
        try:
            headers = {}
            if self.auth_token:
                headers["Authorization"] = f"Bearer {self.auth_token}"
            
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                # Try root endpoint which returns server info
                response = await client.get(f"{self.base_url}/", headers=headers)
                response.raise_for_status()
                # If we get here, server is responsive
                return {"status": "ok", "server": "n8n-mcp", "url": self.base_url}
        except Exception as e:
            logger.error(f"Health check failed: {str(e)}")
            raise HTTPException(
                status_code=503,
                detail=f"Cannot connect to n8n-mcp server at {self.base_url}"
            )
    
    async def list_tools(self) -> List[str]:
        """
        Get a list of all available MCP tools.
        
        Returns:
            List of tool names
        """
        result = await self._call_tool("list_tools", {})
        return result.get("tools", [])
    
    # Node Documentation Tools
    
    async def search_nodes(
        self,
        query: str,
        include_examples: bool = True,
        limit: int = 10
    ) -> Dict[str, Any]:
        """
        Search for n8n nodes by query string.
        
        Args:
            query: Search query (e.g., "send email", "http request")
            include_examples: Whether to include usage examples
            limit: Maximum number of results to return
            
        Returns:
            Dict containing matching nodes with their documentation
        """
        return await self._call_tool("search_nodes", {
            "query": query,
            "includeExamples": include_examples,
            "limit": limit
        })
    
    async def get_node_essentials(
        self,
        node_type: str,
        include_examples: bool = True
    ) -> Dict[str, Any]:
        """
        Get comprehensive information about a specific n8n node.
        
        Args:
            node_type: The node type identifier (e.g., "n8n-nodes-base.httpRequest")
            include_examples: Whether to include usage examples
            
        Returns:
            Dict containing node properties, documentation, and examples
        """
        return await self._call_tool("get_node_essentials", {
            "nodeType": node_type,
            "includeExamples": include_examples
        })
    
    # Workflow Validation Tools
    
    async def validate_workflow(
        self,
        workflow: Dict[str, Any],
        profile: str = "balanced"
    ) -> Dict[str, Any]:
        """
        Validate a workflow structure and configuration.
        
        Args:
            workflow: The workflow JSON object
            profile: Validation profile ("strict", "balanced", or "permissive")
            
        Returns:
            Dict with validation results including errors and warnings
        """
        # Log workflow structure for debugging
        logger.info(f"Validating workflow with keys: {list(workflow.keys())}")
        
        # Basic validation before calling MCP
        if not isinstance(workflow, dict):
            return {
                "valid": False,
                "errors": ["Workflow must be a dictionary/object"],
                "warnings": []
            }
        
        # Check for required n8n fields
        if "nodes" not in workflow:
            logger.warning("Workflow missing 'nodes' field")
            return {
                "valid": False,
                "errors": ["Workflow must have a 'nodes' array"],
                "warnings": []
            }
        
        if "connections" not in workflow:
            logger.warning("Workflow missing 'connections' field")
            workflow["connections"] = {}  # Add empty connections if missing
        
        try:
            return await self._call_tool("validate_workflow", {
                "workflow": workflow,
                "profile": profile
            })
        except Exception as e:
            logger.error(f"MCP validation error: {str(e)}")
            return {
                "valid": False,
                "errors": [f"Validation service error: {str(e)}"],
                "warnings": []
            }
    
    async def autofix_workflow(
        self,
        workflow: Dict[str, Any],
        validation_result: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Automatically fix common workflow validation issues.
        
        Args:
            workflow: The workflow JSON object to fix
            validation_result: Optional pre-computed validation result
            
        Returns:
            Dict with the fixed workflow and applied fixes
        """
        input_data = {"workflow": workflow}
        if validation_result:
            input_data["validationResult"] = validation_result
            
        return await self._call_tool("autofix_workflow", input_data)
    
    # Template Tools
    
    async def search_templates(
        self,
        query: str,
        limit: int = 10,
        categories: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Search for workflow templates in n8n's template gallery.
        
        Args:
            query: Search query
            limit: Maximum number of templates to return
            categories: Optional list of categories to filter by
            
        Returns:
            Dict containing matching templates with metadata
        """
        input_data = {
            "query": query,
            "limit": limit
        }
        if categories:
            input_data["categories"] = categories
            
        return await self._call_tool("search_templates", input_data)
    
    async def get_template(
        self,
        template_id: str,
        mode: str = "full"
    ) -> Dict[str, Any]:
        """
        Retrieve a specific workflow template by ID.
        
        Args:
            template_id: The template ID from n8n
            mode: Retrieval mode - "full", "metadata", or "workflow"
            
        Returns:
            Dict containing the template data
        """
        return await self._call_tool("get_template", {
            "templateId": template_id,
            "mode": mode
        })
    
    # Workflow Management Tools (n8n API)
    
    async def create_workflow(
        self,
        workflow: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Create a new workflow in n8n.
        
        Args:
            workflow: The workflow JSON object to create
            
        Returns:
            Dict with the created workflow including n8n workflow ID
        """
        return await self._call_tool("n8n_create_workflow", {
            "workflow": workflow
        })
    
    async def update_workflow(
        self,
        workflow_id: str,
        workflow: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Update an existing workflow in n8n.
        
        Args:
            workflow_id: The n8n workflow ID
            workflow: The updated workflow JSON
            
        Returns:
            Dict with the updated workflow
        """
        return await self._call_tool("n8n_update_workflow", {
            "workflowId": workflow_id,
            "workflow": workflow
        })
    
    async def get_workflow(
        self,
        workflow_id: str
    ) -> Dict[str, Any]:
        """
        Retrieve a workflow from n8n by ID.
        
        Args:
            workflow_id: The n8n workflow ID
            
        Returns:
            Dict with the workflow data
        """
        return await self._call_tool("n8n_get_workflow", {
            "workflowId": workflow_id
        })
    
    async def list_workflows(
        self,
        limit: int = 10,
        active: Optional[bool] = None
    ) -> Dict[str, Any]:
        """
        List workflows from n8n.
        
        Args:
            limit: Maximum number of workflows to return
            active: Filter by active status (None = all)
            
        Returns:
            Dict containing list of workflows
        """
        input_data = {"limit": limit}
        if active is not None:
            input_data["active"] = active
            
        return await self._call_tool("n8n_list_workflows", input_data)
    
    async def delete_workflow(
        self,
        workflow_id: str
    ) -> Dict[str, Any]:
        """
        Delete a workflow from n8n.
        
        Args:
            workflow_id: The n8n workflow ID
            
        Returns:
            Dict with deletion confirmation
        """
        return await self._call_tool("n8n_delete_workflow", {
            "workflowId": workflow_id
        })
    
    async def activate_workflow(
        self,
        workflow_id: str
    ) -> Dict[str, Any]:
        """
        Activate a workflow in n8n.
        
        Args:
            workflow_id: The n8n workflow ID
            
        Returns:
            Dict with the activated workflow
        """
        return await self._call_tool("n8n_activate_workflow", {
            "workflowId": workflow_id
        })
    
    async def deactivate_workflow(
        self,
        workflow_id: str
    ) -> Dict[str, Any]:
        """
        Deactivate a workflow in n8n.
        
        Args:
            workflow_id: The n8n workflow ID
            
        Returns:
            Dict with the deactivated workflow
        """
        return await self._call_tool("n8n_deactivate_workflow", {
            "workflowId": workflow_id
        })
    
    # Execution Management Tools
    
    async def execute_workflow(
        self,
        workflow_id: str,
        input_data: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Manually execute a workflow in n8n.
        
        Args:
            workflow_id: The n8n workflow ID
            input_data: Optional input data for the workflow
            
        Returns:
            Dict with execution information
        """
        tool_input = {"workflowId": workflow_id}
        if input_data:
            tool_input["data"] = input_data
            
        return await self._call_tool("n8n_execute_workflow", tool_input)
    
    async def get_execution(
        self,
        execution_id: str
    ) -> Dict[str, Any]:
        """
        Retrieve details of a workflow execution.
        
        Args:
            execution_id: The n8n execution ID
            
        Returns:
            Dict with execution details
        """
        return await self._call_tool("n8n_get_execution", {
            "executionId": execution_id
        })
    
    async def list_executions(
        self,
        workflow_id: Optional[str] = None,
        limit: int = 10
    ) -> Dict[str, Any]:
        """
        List workflow executions.
        
        Args:
            workflow_id: Optional workflow ID to filter by
            limit: Maximum number of executions to return
            
        Returns:
            Dict containing list of executions
        """
        input_data = {"limit": limit}
        if workflow_id:
            input_data["workflowId"] = workflow_id
            
        return await self._call_tool("n8n_list_executions", input_data)
    
    async def delete_execution(
        self,
        execution_id: str
    ) -> Dict[str, Any]:
        """
        Delete a workflow execution record.
        
        Args:
            execution_id: The n8n execution ID
            
        Returns:
            Dict with deletion confirmation
        """
        return await self._call_tool("n8n_delete_execution", {
            "executionId": execution_id
        })


# Global client instance
_mcp_client: Optional[N8nMcpClient] = None


def get_mcp_client() -> N8nMcpClient:
    """
    Get or create the global n8n-mcp client instance.
    
    Returns:
        N8nMcpClient: The MCP client instance
    """
    global _mcp_client
    if _mcp_client is None:
        _mcp_client = N8nMcpClient()
    return _mcp_client

