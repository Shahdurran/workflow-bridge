"""
Make-MCP Client
HTTP client for communicating with the Make.com MCP server
"""

import httpx
import logging
from typing import Dict, List, Optional, Any
from datetime import datetime

logger = logging.getLogger(__name__)


class MakeMcpClient:
    """Client for interacting with Make-MCP server via HTTP"""
    
    def __init__(self, base_url: str = "http://localhost:3002"):
        self.base_url = base_url.rstrip('/')
        self.client = httpx.AsyncClient(timeout=30.0)
        self._initialized = False
        
    async def _initialize_if_needed(self):
        """Initialize connection to Make-MCP server"""
        if self._initialized:
            return
            
        try:
            response = await self.client.get(f"{self.base_url}/health")
            if response.status_code == 200:
                self._initialized = True
                logger.info("Make-MCP client initialized successfully")
            else:
                logger.warning(f"Make-MCP health check returned status {response.status_code}")
        except Exception as e:
            logger.error(f"Failed to initialize Make-MCP client: {e}")
            raise
    
    async def _call_tool(self, tool_name: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
        """Call a Make-MCP tool via HTTP JSON-RPC"""
        await self._initialize_if_needed()
        
        payload = {
            "jsonrpc": "2.0",
            "id": str(datetime.now().timestamp()),
            "method": "tools/call",
            "params": {
                "name": tool_name,
                "arguments": arguments
            }
        }
        
        try:
            response = await self.client.post(
                f"{self.base_url}/mcp",
                json=payload,
                headers={"Content-Type": "application/json"}
            )
            response.raise_for_status()
            
            result = response.json()
            
            if "error" in result:
                logger.error(f"Make-MCP tool error: {result['error']}")
                raise Exception(f"Make-MCP error: {result['error']}")
            
            return result.get("result", {})
            
        except httpx.HTTPError as e:
            logger.error(f"HTTP error calling Make-MCP tool {tool_name}: {e}")
            raise
        except Exception as e:
            logger.error(f"Error calling Make-MCP tool {tool_name}: {e}")
            raise
    
    async def health_check(self) -> Dict[str, Any]:
        """Check if Make-MCP server is healthy"""
        try:
            response = await self.client.get(f"{self.base_url}/health")
            return {
                "status": "healthy" if response.status_code == 200 else "unhealthy",
                "status_code": response.status_code,
                "response": response.json() if response.status_code == 200 else None
            }
        except Exception as e:
            return {
                "status": "error",
                "error": str(e)
            }
    
    async def search_modules(
        self,
        query: str,
        module_type: Optional[str] = None,
        app: Optional[str] = None,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Search for Make.com modules
        
        Args:
            query: Search query string
            module_type: Filter by type (trigger, action)
            app: Filter by app name
            limit: Maximum number of results
            
        Returns:
            List of matching modules
        """
        arguments = {
            "query": query,
            "limit": limit
        }
        
        if module_type:
            arguments["type"] = module_type
        if app:
            arguments["app"] = app
        
        result = await self._call_tool("search_make_modules", arguments)
        return result.get("modules", [])
    
    async def get_module_essentials(
        self,
        module_name: str,
        include_examples: bool = True
    ) -> Dict[str, Any]:
        """
        Get essential information about a Make.com module
        
        Args:
            module_name: Name of the module (e.g., "http:ActionSendData")
            include_examples: Whether to include usage examples
            
        Returns:
            Module essentials including parameters and examples
        """
        arguments = {
            "moduleName": module_name,
            "includeExamples": include_examples
        }
        
        return await self._call_tool("get_module_essentials", arguments)
    
    async def validate_make_scenario(
        self,
        scenario: Dict[str, Any],
        profile: str = "balanced"
    ) -> Dict[str, Any]:
        """
        Validate a Make.com scenario
        
        Args:
            scenario: Make.com scenario JSON
            profile: Validation profile (strict, balanced, lenient)
            
        Returns:
            Validation result with errors and warnings
        """
        arguments = {
            "scenario": scenario,
            "profile": profile
        }
        
        return await self._call_tool("validate_make_scenario", arguments)
    
    async def autofix_make_scenario(
        self,
        scenario: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Automatically fix common issues in a Make.com scenario
        
        Args:
            scenario: Make.com scenario JSON
            
        Returns:
            Fixed scenario and list of applied fixes
        """
        arguments = {
            "scenario": scenario
        }
        
        return await self._call_tool("autofix_make_scenario", arguments)
    
    async def list_make_templates(
        self,
        category: Optional[str] = None,
        limit: int = 20
    ) -> List[Dict[str, Any]]:
        """
        List available Make.com templates
        
        Args:
            category: Filter by category
            limit: Maximum number of templates
            
        Returns:
            List of templates
        """
        arguments = {
            "limit": limit
        }
        
        if category:
            arguments["category"] = category
        
        result = await self._call_tool("list_make_templates", arguments)
        return result.get("templates", [])
    
    async def get_make_template(
        self,
        template_id: str
    ) -> Dict[str, Any]:
        """
        Get a specific Make.com template
        
        Args:
            template_id: Template identifier
            
        Returns:
            Template details and scenario JSON
        """
        arguments = {
            "templateId": template_id
        }
        
        return await self._call_tool("get_make_template", arguments)
    
    async def get_modules_by_app(
        self,
        app_name: str,
        module_type: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Get all modules for a specific app
        
        Args:
            app_name: Name of the app (e.g., "Google Sheets", "Slack")
            module_type: Filter by type (trigger, action)
            
        Returns:
            List of modules for the app
        """
        arguments = {
            "appName": app_name
        }
        
        if module_type:
            arguments["type"] = module_type
        
        result = await self._call_tool("get_modules_by_app", arguments)
        return result.get("modules", [])
    
    async def get_database_statistics(self) -> Dict[str, Any]:
        """
        Get Make-MCP database statistics
        
        Returns:
            Statistics about modules, apps, categories
        """
        return await self._call_tool("get_database_statistics", {})
    
    async def get_popular_modules(
        self,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Get most popular Make.com modules
        
        Args:
            limit: Maximum number of modules
            
        Returns:
            List of popular modules
        """
        arguments = {
            "limit": limit
        }
        
        result = await self._call_tool("get_popular_modules", arguments)
        return result.get("modules", [])
    
    async def suggest_modules_for_intent(
        self,
        intent: str,
        limit: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Suggest modules based on user intent
        
        Args:
            intent: User's intent description
            limit: Maximum number of suggestions
            
        Returns:
            List of suggested modules with reasoning
        """
        arguments = {
            "intent": intent,
            "limit": limit
        }
        
        result = await self._call_tool("suggest_modules_for_intent", arguments)
        return result.get("suggestions", [])
    
    async def close(self):
        """Close the HTTP client"""
        await self.client.aclose()
        self._initialized = False

