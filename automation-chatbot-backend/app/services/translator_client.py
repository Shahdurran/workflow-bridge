"""
Workflow Translator MCP Client

Client for interacting with workflow-translator MCP service.
"""

import httpx
import logging
from typing import Dict, Any, Optional, List
from fastapi import HTTPException

from app.core.config import settings

logger = logging.getLogger(__name__)


class TranslatorClient:
    """
    Client for interacting with workflow-translator MCP server.
    
    This client provides methods to:
    - Translate workflows between platforms (n8n, Make, Zapier)
    - Check translation feasibility
    - Get platform capabilities comparison
    """
    
    def __init__(self, mcp_url: Optional[str] = None):
        """
        Initialize Translator MCP client.
        
        Args:
            mcp_url: URL of the workflow-translator HTTP server
        """
        self.mcp_url = mcp_url or settings.translator_mcp_url
        self.timeout = 60.0
        self._request_id = 1
        
        if not self.mcp_url:
            logger.warning("Translator MCP URL not configured. Translation features will be unavailable.")
    
    def is_configured(self) -> bool:
        """Check if Translator MCP is properly configured."""
        return bool(self.mcp_url)
    
    async def health_check(self) -> Dict[str, Any]:
        """Check if translator service is available."""
        if not self.is_configured():
            raise HTTPException(
                status_code=503,
                detail="Translator MCP is not configured"
            )
        
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.get(f"{self.mcp_url}/health")
                response.raise_for_status()
                return response.json()
        except Exception as e:
            logger.error(f"Translator MCP health check failed: {str(e)}")
            raise HTTPException(
                status_code=503,
                detail=f"Translator MCP service unavailable: {str(e)}"
            )
    
    async def _call_tool(self, tool_name: str, tool_input: Dict[str, Any]) -> Dict[str, Any]:
        """
        Call a Translator MCP tool via HTTP JSON-RPC.
        
        Args:
            tool_name: Name of the tool to call
            tool_input: Input parameters for the tool
            
        Returns:
            Tool result data
        """
        if not self.is_configured():
            raise HTTPException(
                status_code=503,
                detail="Translator MCP is not configured"
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
                logger.debug(f"Calling Translator MCP tool: {tool_name}")
                response = await client.post(f"{self.mcp_url}/mcp", json=payload)
                response.raise_for_status()
                result = response.json()
                
                # Check for JSON-RPC error
                if "error" in result:
                    error = result["error"]
                    logger.error(f"Translator MCP tool {tool_name} returned error: {error}")
                    raise HTTPException(
                        status_code=500,
                        detail=f"Translator MCP error: {error.get('message', 'Unknown error')}"
                    )
                
                # Extract the result
                if "result" not in result:
                    logger.error(f"Invalid Translator MCP response: {result}")
                    raise HTTPException(
                        status_code=500,
                        detail="Invalid Translator MCP response"
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
            logger.error(f"HTTP error calling Translator MCP: {str(e)}")
            raise HTTPException(
                status_code=503,
                detail=f"Translator MCP service error: {str(e)}"
            )
        except Exception as e:
            logger.error(f"Error calling Translator MCP tool {tool_name}: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail=f"Translator error: {str(e)}"
            )
    
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
        Translate a workflow from one platform to another.
        
        Args:
            workflow: Workflow JSON to translate
            source_platform: Source platform (n8n, make, zapier)
            target_platform: Target platform (n8n, make, zapier)
            optimize: Apply platform-specific optimizations
            preserve_names: Preserve original node names
            strict_mode: Fail on any translation issues
            
        Returns:
            Translation result with workflow, warnings, and metadata
        """
        return await self._call_tool("translate_workflow", {
            "workflow": workflow,
            "sourcePlatform": source_platform,
            "targetPlatform": target_platform,
            "optimize": optimize,
            "preserveNames": preserve_names,
            "strictMode": strict_mode
        })
    
    async def check_translation_feasibility(
        self,
        workflow: Dict[str, Any],
        source_platform: str,
        target_platform: str
    ) -> Dict[str, Any]:
        """
        Check if a workflow can be successfully translated.
        
        Args:
            workflow: Workflow JSON to analyze
            source_platform: Source platform
            target_platform: Target platform
            
        Returns:
            Feasibility analysis with blockers and warnings
        """
        return await self._call_tool("check_translation_feasibility", {
            "workflow": workflow,
            "sourcePlatform": source_platform,
            "targetPlatform": target_platform
        })
    
    async def get_platform_capabilities(
        self,
        platforms: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Get platform capabilities comparison.
        
        Args:
            platforms: List of platforms to compare (default: all)
            
        Returns:
            Platform capabilities matrix
        """
        return await self._call_tool("get_platform_capabilities", {
            "platforms": platforms or ["n8n", "make", "zapier"]
        })
    
    async def get_translation_complexity(
        self,
        source_platform: str,
        target_platform: str
    ) -> Dict[str, Any]:
        """
        Get complexity information for a translation path.
        
        Args:
            source_platform: Source platform
            target_platform: Target platform
            
        Returns:
            Complexity info including difficulty and success rate
        """
        return await self._call_tool("get_translation_complexity", {
            "sourcePlatform": source_platform,
            "targetPlatform": target_platform
        })


# Global instance
_translator_client: Optional[TranslatorClient] = None


def get_translator_client() -> TranslatorClient:
    """Get or create the global Translator client instance."""
    global _translator_client
    
    if _translator_client is None:
        _translator_client = TranslatorClient()
    
    return _translator_client
