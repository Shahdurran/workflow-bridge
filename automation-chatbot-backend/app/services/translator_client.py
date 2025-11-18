"""
Workflow Translator Client
HTTP client for communicating with the Workflow Translator service
"""

import httpx
import logging
from typing import Dict, List, Optional, Any
from datetime import datetime

logger = logging.getLogger(__name__)


class WorkflowTranslatorClient:
    """Client for interacting with Workflow Translator service via HTTP"""
    
    def __init__(self, base_url: str = "http://localhost:3003"):
        self.base_url = base_url.rstrip('/')
        self.client = httpx.AsyncClient(timeout=60.0)  # Longer timeout for AI translations
        self._initialized = False
        
    async def _initialize_if_needed(self):
        """Initialize connection to Workflow Translator service"""
        if self._initialized:
            return
            
        try:
            response = await self.client.get(f"{self.base_url}/health")
            if response.status_code == 200:
                self._initialized = True
                logger.info("Workflow Translator client initialized successfully")
            else:
                logger.warning(f"Workflow Translator health check returned status {response.status_code}")
        except Exception as e:
            logger.error(f"Failed to initialize Workflow Translator client: {e}")
            raise
    
    async def _call_tool(self, tool_name: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
        """Call a Workflow Translator tool via HTTP JSON-RPC"""
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
                logger.error(f"Workflow Translator tool error: {result['error']}")
                raise Exception(f"Workflow Translator error: {result['error']}")
            
            return result.get("result", {})
            
        except httpx.HTTPError as e:
            logger.error(f"HTTP error calling Workflow Translator tool {tool_name}: {e}")
            raise
        except Exception as e:
            logger.error(f"Error calling Workflow Translator tool {tool_name}: {e}")
            raise
    
    async def health_check(self) -> Dict[str, Any]:
        """Check if Workflow Translator service is healthy"""
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
    
    async def translate_workflow(
        self,
        workflow: Dict[str, Any],
        source_platform: str,
        target_platform: str,
        optimize: bool = True,
        preserve_names: bool = False,
        strict_mode: bool = False
    ) -> Dict[str, Any]:
        """
        Translate a workflow between platforms
        
        Args:
            workflow: Workflow JSON to translate
            source_platform: Source platform (n8n, make, zapier)
            target_platform: Target platform (n8n, make, zapier)
            optimize: Apply platform-specific optimizations
            preserve_names: Preserve original node/module names
            strict_mode: Fail on any translation issues
            
        Returns:
            Translation result with translated workflow and metadata
        """
        arguments = {
            "workflow": workflow,
            "sourcePlatform": source_platform,
            "targetPlatform": target_platform,
            "optimize": optimize,
            "preserveNames": preserve_names,
            "strictMode": strict_mode
        }
        
        return await self._call_tool("translate_workflow", arguments)
    
    async def check_translation_feasibility(
        self,
        workflow: Dict[str, Any],
        source_platform: str,
        target_platform: str
    ) -> Dict[str, Any]:
        """
        Check if a workflow can be successfully translated
        
        Args:
            workflow: Workflow JSON to analyze
            source_platform: Source platform
            target_platform: Target platform
            
        Returns:
            Feasibility analysis with score, issues, and suggestions
        """
        arguments = {
            "workflow": workflow,
            "sourcePlatform": source_platform,
            "targetPlatform": target_platform
        }
        
        return await self._call_tool("check_translation_feasibility", arguments)
    
    async def get_platform_capabilities(
        self,
        platforms: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Get capabilities comparison for platforms
        
        Args:
            platforms: List of platforms to compare (default: all three)
            
        Returns:
            Capabilities matrix for requested platforms
        """
        arguments = {}
        
        if platforms:
            arguments["platforms"] = platforms
        
        return await self._call_tool("get_platform_capabilities", arguments)
    
    async def get_translation_complexity(
        self,
        source_platform: str,
        target_platform: str
    ) -> Dict[str, Any]:
        """
        Get difficulty and success rate for a translation path
        
        Args:
            source_platform: Source platform
            target_platform: Target platform
            
        Returns:
            Complexity information including difficulty and success rate
        """
        arguments = {
            "sourcePlatform": source_platform,
            "targetPlatform": target_platform
        }
        
        return await self._call_tool("get_translation_complexity", arguments)
    
    async def suggest_best_platform(
        self,
        requirements: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Suggest the best platform based on requirements
        
        Args:
            requirements: Dictionary with needs_custom_code, needs_loops,
                         team_technical_level, budget_level, etc.
            
        Returns:
            Platform recommendation with scores and reasoning
        """
        arguments = {
            "requirements": requirements
        }
        
        return await self._call_tool("suggest_best_platform", arguments)
    
    async def translate_expression(
        self,
        expression: str,
        source_platform: str,
        target_platform: str,
        context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Translate a single expression between platform syntaxes
        
        Args:
            expression: Expression to translate
            source_platform: Source platform
            target_platform: Target platform
            context: Additional context (field types, available data)
            
        Returns:
            Translated expression
        """
        arguments = {
            "expression": expression,
            "sourcePlatform": source_platform,
            "targetPlatform": target_platform
        }
        
        if context:
            arguments["context"] = context
        
        return await self._call_tool("translate_expression", arguments)
    
    async def analyze_workflow_complexity(
        self,
        workflow: Dict[str, Any],
        platform: str
    ) -> Dict[str, Any]:
        """
        Analyze workflow complexity and get optimization suggestions
        
        Args:
            workflow: Workflow to analyze
            platform: Platform (n8n, make, zapier)
            
        Returns:
            Complexity analysis with score and suggestions
        """
        arguments = {
            "workflow": workflow,
            "platform": platform
        }
        
        return await self._call_tool("analyze_workflow_complexity", arguments)
    
    async def batch_translate_workflows(
        self,
        workflows: List[Dict[str, Any]],
        source_platform: str,
        target_platform: str,
        optimize: bool = True
    ) -> Dict[str, Any]:
        """
        Translate multiple workflows at once
        
        Args:
            workflows: List of workflow JSONs
            source_platform: Source platform
            target_platform: Target platform
            optimize: Apply optimizations
            
        Returns:
            Batch translation results
        """
        arguments = {
            "workflows": workflows,
            "sourcePlatform": source_platform,
            "targetPlatform": target_platform,
            "optimize": optimize
        }
        
        return await self._call_tool("batch_translate_workflows", arguments)
    
    async def close(self):
        """Close the HTTP client"""
        await self.client.aclose()
        self._initialized = False

