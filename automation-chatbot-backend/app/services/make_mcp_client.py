"""
Make.com MCP Client

Client for interacting with make-mcp (Model Context Protocol for Make.com).
"""

import httpx
import logging
from typing import Dict, Any, Optional, List
from fastapi import HTTPException

from app.core.config import settings

logger = logging.getLogger(__name__)


class MakeMcpClient:
    """
    Client for interacting with make-mcp server.
    
    This client provides methods to:
    - Search Make.com modules and documentation
    - Retrieve module details and examples
    - Create and manage scenarios
    - Validate Make workflows
    """
    
    def __init__(self, mcp_url: Optional[str] = None):
        """
        Initialize Make MCP client.
        
        Args:
            mcp_url: URL of the make-mcp HTTP server
        """
        self.mcp_url = mcp_url or settings.make_mcp_url
        self.timeout = 60.0
        self._request_id = 1
        
        if not self.mcp_url:
            logger.warning("Make MCP URL not configured. Make.com features will be unavailable.")
    
    def is_configured(self) -> bool:
        """Check if Make MCP is properly configured."""
        return bool(self.mcp_url)
    
    async def health_check(self) -> Dict[str, Any]:
        """Check if make-mcp service is available."""
        if not self.is_configured():
            raise HTTPException(
                status_code=503,
                detail="Make MCP is not configured"
            )
        
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.get(f"{self.mcp_url}/health")
                response.raise_for_status()
                return response.json()
        except Exception as e:
            logger.error(f"Make MCP health check failed: {str(e)}")
            raise HTTPException(
                status_code=503,
                detail=f"Make MCP service unavailable: {str(e)}"
            )
    
    async def _call_tool(self, tool_name: str, tool_input: Dict[str, Any]) -> Dict[str, Any]:
        """
        Call a Make MCP tool via HTTP JSON-RPC.
        
        Args:
            tool_name: Name of the tool to call
            tool_input: Input parameters for the tool
            
        Returns:
            Tool result data
        """
        if not self.is_configured():
            raise HTTPException(
                status_code=503,
                detail="Make MCP is not configured"
            )
        
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
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                logger.debug(f"Calling Make MCP tool: {tool_name} with input: {tool_input}")
                response = await client.post(f"{self.mcp_url}/mcp", json=payload)
                response.raise_for_status()
                result = response.json()
                
                # Check for JSON-RPC error
                if "error" in result:
                    error = result["error"]
                    logger.error(f"Make MCP tool {tool_name} returned error: {error}")
                    raise HTTPException(
                        status_code=500,
                        detail=f"Make MCP tool error: {error.get('message', 'Unknown error')}"
                    )
                
                # Extract the result
                if "result" not in result:
                    logger.error(f"Invalid Make MCP response: {result}")
                    raise HTTPException(
                        status_code=500,
                        detail="Invalid Make MCP response: missing result field"
                    )
                
                # Parse content from MCP response
                mcp_result = result["result"]
                if "content" in mcp_result and len(mcp_result["content"]) > 0:
                    content_item = mcp_result["content"][0]
                    if content_item.get("type") == "text":
                        import json
                        return json.loads(content_item["text"])
                
                return mcp_result
                
        except httpx.HTTPError as e:
            logger.error(f"HTTP error calling Make MCP: {str(e)}")
            raise HTTPException(
                status_code=503,
                detail=f"Make MCP service error: {str(e)}"
            )
        except Exception as e:
            logger.error(f"Error calling Make MCP tool {tool_name}: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail=f"Make MCP error: {str(e)}"
            )
    
    async def search_modules(
        self,
        query: str,
        limit: int = 10,
        include_examples: bool = True
    ) -> Dict[str, Any]:
        """
        Search for Make modules/apps.
        
        Args:
            query: Search query
            limit: Maximum number of results
            include_examples: Include usage examples
            
        Returns:
            Search results with module information
        """
        return await self._call_tool("search_modules", {
            "query": query,
            "limit": limit,
            "includeExamples": include_examples
        })
    
    async def get_module_info(
        self,
        module_name: str,
        include_examples: bool = True
    ) -> Dict[str, Any]:
        """
        Get detailed information about a specific Make module.
        
        Args:
            module_name: Name of the module
            include_examples: Include usage examples
            
        Returns:
            Module details including parameters and examples
        """
        return await self._call_tool("get_module_info", {
            "moduleName": module_name,
            "includeExamples": include_examples
        })
    
    async def search_templates(
        self,
        query: str,
        limit: int = 10
    ) -> Dict[str, Any]:
        """
        Search for Make scenario templates.
        
        Args:
            query: Search query
            limit: Maximum number of results
            
        Returns:
            Template search results
        """
        return await self._call_tool("search_templates", {
            "query": query,
            "limit": limit
        })
    
    async def get_template(
        self,
        template_id: int
    ) -> Dict[str, Any]:
        """
        Get a specific Make template by ID.
        
        Args:
            template_id: Template ID
            
        Returns:
            Complete template data including scenario JSON
        """
        return await self._call_tool("get_template", {
            "templateId": template_id
        })
    
    async def validate_scenario(
        self,
        scenario: Dict[str, Any],
        profile: str = "balanced"
    ) -> Dict[str, Any]:
        """
        Validate a Make scenario structure.
        
        Args:
            scenario: Scenario JSON to validate
            profile: Validation profile (strict, balanced, permissive)
            
        Returns:
            Validation results with errors and warnings
        """
        return await self._call_tool("validate_scenario", {
            "scenario": scenario,
            "profile": profile
        })
    
    async def create_scenario(
        self,
        scenario: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Create a new Make scenario.
        
        Note: This requires Make API credentials to be configured.
        
        Args:
            scenario: Scenario JSON to create
            
        Returns:
            Created scenario with ID and URL
        """
        return await self._call_tool("make_create_scenario", {
            "scenario": scenario
        })
    
    async def list_scenarios(
        self,
        limit: int = 50,
        offset: int = 0
    ) -> Dict[str, Any]:
        """
        List user's Make scenarios.
        
        Args:
            limit: Maximum number of scenarios
            offset: Offset for pagination
            
        Returns:
            List of scenarios
        """
        return await self._call_tool("make_list_scenarios", {
            "limit": limit,
            "offset": offset
        })


# Global instance
_make_mcp_client: Optional[MakeMcpClient] = None


def get_make_mcp_client() -> MakeMcpClient:
    """Get or create the global Make MCP client instance."""
    global _make_mcp_client
    
    if _make_mcp_client is None:
        _make_mcp_client = MakeMcpClient()
    
    return _make_mcp_client
