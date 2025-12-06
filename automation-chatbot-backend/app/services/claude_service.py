"""
Claude AI Service with n8n-mcp Tool Integration

This service provides conversational AI capabilities using Claude,
with seamless integration to n8n-mcp for workflow automation.
"""

import json
import logging
import asyncio
from typing import Dict, Any, List, Optional, AsyncGenerator
from anthropic import Anthropic, AsyncAnthropic, RateLimitError
from anthropic.types import Message, ContentBlock, TextBlock, ToolUseBlock

from app.core.config import settings
from app.services.n8n_mcp_client import get_mcp_client

logger = logging.getLogger(__name__)


# System prompts optimized for visual workflow display
N8N_SYSTEM_PROMPT = """You are an n8n workflow assistant with tools to search nodes/templates, get node details, validate and deploy workflows.

CRITICAL RESPONSE FORMAT:
When you create a workflow, you MUST output the workflow JSON in this exact format at the end of your response:

```json
{
  "name": "Workflow Name",
  "nodes": [...],
  "connections": {...}
}
```

WORKFLOW PRESENTATION RULES:
1. After building/finding a workflow, ALWAYS output the complete workflow JSON in a ```json code block
2. Provide a brief explanation (2-3 sentences) about what the workflow does
3. Include setup instructions if credentials are needed
4. DO NOT ask if user wants to deploy or see JSON - the visual builder will handle that automatically
5. DO NOT offer multiple options - present the workflow immediately

PROCESS:
1. Search templates first using search_templates
2. If template found, use get_template to retrieve it
3. If no template fits, build workflow using search_nodes and get_node_info
4. Validate the workflow using validate_workflow
5. Output the workflow JSON immediately

TOOL USAGE:
- Always set includeExamples: true when searching nodes
- Use validate_workflow before presenting the workflow
- Be concise and friendly

Example Response:
"I've created a Gmail to Google Sheets workflow for you. It monitors your Gmail inbox and automatically logs new emails to Google Sheets with sender, subject, body, and date.

Setup: Connect your Gmail and Google Sheets OAuth credentials in n8n.

```json
{
  "name": "Gmail to Sheets",
  "nodes": [...]
}
```
"
"""

MAKE_SYSTEM_PROMPT = """You are a Make.com scenario assistant with tools to search modules/templates, get module details, validate and deploy scenarios.

CRITICAL RESPONSE FORMAT:
When you create a scenario, you MUST output the scenario JSON in this exact format at the end of your response:

```json
{
  "name": "Scenario Name",
  "flow": [...],
  "metadata": {...}
}
```

WORKFLOW PRESENTATION RULES:
1. After building/finding a scenario, ALWAYS output the complete scenario JSON in a ```json code block
2. Provide a brief explanation (2-3 sentences) about what the scenario does
3. Include setup instructions if API keys are needed
4. DO NOT ask if user wants to deploy or see JSON - the visual builder will handle that automatically
5. DO NOT offer multiple options - present the scenario immediately

PROCESS:
1. Search templates first using search_templates
2. If template found, use get_template to retrieve it
3. If no template fits, build scenario using search_modules and get_module_info
4. Validate the scenario using validate_scenario
5. Output the scenario JSON immediately

TOOL USAGE:
- Always set includeExamples: true when searching modules
- Use validate_scenario before presenting the scenario
- Be concise and friendly

Example Response:
"I've created a Google Sheets to Slack scenario for you. It monitors a Google Sheet for new rows and sends a Slack notification with the row data.

Setup: Connect your Google Sheets and Slack accounts in Make.com.

```json
{
  "name": "Sheets to Slack",
  "flow": [...]
}
```
"
"""


class ClaudeService:
    """
    Service for interacting with Claude AI with n8n-mcp tool integration.
    
    This service handles:
    - Conversational interactions with Claude
    - Tool use loop for MCP tools
    - Streaming responses
    - Workflow extraction and handling
    """
    
    def __init__(self):
        """Initialize Claude service with API client."""
        if not settings.claude_configured:
            raise ValueError("Claude AI is not configured. Set ANTHROPIC_API_KEY in environment.")
        
        self.client = AsyncAnthropic(api_key=settings.anthropic_api_key)
        self.mcp_client = get_mcp_client()
        self.model = settings.claude_model
        self.max_tokens = settings.claude_max_tokens
        self.temperature = settings.claude_temperature
        
        logger.info(f"ClaudeService initialized with model: {self.model}")
    
    def _build_mcp_tools(self) -> List[Dict[str, Any]]:
        """
        Build the tool definitions for Claude to use n8n-mcp.
        
        Returns:
            List of tool definitions in Anthropic's format
        """
        return [
            {
                "name": "search_nodes",
                "description": "Search for n8n nodes by query. Use this to find nodes that can perform specific tasks (e.g., 'send email', 'http request', 'database'). Always set includeExamples to true to get usage examples.",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "query": {
                            "type": "string",
                            "description": "Search query describing the functionality needed"
                        },
                        "includeExamples": {
                            "type": "boolean",
                            "description": "Whether to include usage examples (recommended: true)",
                            "default": True
                        },
                        "limit": {
                            "type": "integer",
                            "description": "Maximum number of results",
                            "default": 10
                        }
                    },
                    "required": ["query"]
                }
            },
            {
                "name": "get_node_essentials",
                "description": "Get comprehensive information about a specific n8n node including properties, configuration options, and examples. Use this after finding a node to understand how to configure it.",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "nodeType": {
                            "type": "string",
                            "description": "The node type identifier (e.g., 'n8n-nodes-base.httpRequest')"
                        },
                        "includeExamples": {
                            "type": "boolean",
                            "description": "Whether to include usage examples (recommended: true)",
                            "default": True
                        }
                    },
                    "required": ["nodeType"]
                }
            },
            {
                "name": "validate_workflow",
                "description": "Validate a workflow structure before deployment. This checks for errors, missing configurations, and provides warnings. Always validate workflows before presenting them to users.",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "workflow": {
                            "type": "object",
                            "description": "The workflow JSON object to validate"
                        },
                        "profile": {
                            "type": "string",
                            "description": "Validation strictness: 'strict', 'balanced', or 'permissive'",
                            "enum": ["strict", "balanced", "permissive"],
                            "default": "balanced"
                        }
                    },
                    "required": ["workflow"]
                }
            },
            {
                "name": "search_templates",
                "description": "Search n8n's template gallery for pre-built workflows. Use this FIRST before building workflows from scratch. Templates are proven, tested solutions.",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "query": {
                            "type": "string",
                            "description": "Search query for templates"
                        },
                        "limit": {
                            "type": "integer",
                            "description": "Maximum number of templates",
                            "default": 10
                        }
                    },
                    "required": ["query"]
                }
            },
            {
                "name": "get_template",
                "description": "Retrieve a complete workflow template by ID. Use this after finding a relevant template from search_templates.",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "templateId": {
                            "type": "string",
                            "description": "The template ID from n8n"
                        },
                        "mode": {
                            "type": "string",
                            "description": "Retrieval mode: 'full', 'metadata', or 'workflow'",
                            "enum": ["full", "metadata", "workflow"],
                            "default": "full"
                        }
                    },
                    "required": ["templateId"]
                }
            },
            {
                "name": "n8n_create_workflow",
                "description": "Create a new workflow in n8n. Only use this after validating the workflow and getting user confirmation.",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "workflow": {
                            "type": "object",
                            "description": "The workflow JSON object to create"
                        }
                    },
                    "required": ["workflow"]
                }
            },
            {
                "name": "n8n_list_workflows",
                "description": "List existing workflows in n8n. Useful for showing users their workflows or checking if a workflow already exists.",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "limit": {
                            "type": "integer",
                            "description": "Maximum number of workflows",
                            "default": 10
                        },
                        "active": {
                            "type": "boolean",
                            "description": "Filter by active status"
                        }
                    }
                }
            },
            {
                "name": "n8n_get_workflow",
                "description": "Get a specific workflow from n8n by ID.",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "workflowId": {
                            "type": "string",
                            "description": "The n8n workflow ID"
                        }
                    },
                    "required": ["workflowId"]
                }
            },
            {
                "name": "n8n_execute_workflow",
                "description": "Manually execute a workflow in n8n.",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "workflowId": {
                            "type": "string",
                            "description": "The n8n workflow ID"
                        },
                        "data": {
                            "type": "object",
                            "description": "Input data for the workflow"
                        }
                    },
                    "required": ["workflowId"]
                }
            }
        ]
    
    async def _execute_tool(self, tool_name: str, tool_input: Dict[str, Any]) -> str:
        """
        Execute an MCP tool and return the result as a string.
        
        Args:
            tool_name: Name of the tool to execute
            tool_input: Input parameters for the tool
            
        Returns:
            String representation of the tool result
        """
        try:
            logger.info(f"Executing tool: {tool_name}")
            
            # Map tool names to MCP client methods
            method_map = {
                "search_nodes": self.mcp_client.search_nodes,
                "get_node_essentials": self.mcp_client.get_node_essentials,
                "validate_workflow": self.mcp_client.validate_workflow,
                "search_templates": self.mcp_client.search_templates,
                "get_template": self.mcp_client.get_template,
                "n8n_create_workflow": self.mcp_client.create_workflow,
                "n8n_list_workflows": self.mcp_client.list_workflows,
                "n8n_get_workflow": self.mcp_client.get_workflow,
                "n8n_execute_workflow": self.mcp_client.execute_workflow,
            }
            
            if tool_name not in method_map:
                return json.dumps({"error": f"Unknown tool: {tool_name}"})
            
            # Convert camelCase keys to snake_case for Python methods
            python_input = self._convert_keys_to_snake_case(tool_input)
            
            # Call the appropriate MCP method
            result = await method_map[tool_name](**python_input)
            
            logger.info(f"Tool {tool_name} executed successfully")
            return json.dumps(result)
            
        except Exception as e:
            logger.error(f"Error executing tool {tool_name}: {str(e)}")
            return json.dumps({"error": str(e)})
    
    def _convert_keys_to_snake_case(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Convert camelCase keys to snake_case for Python methods."""
        key_map = {
            "includeExamples": "include_examples",
            "nodeType": "node_type",
            "templateId": "template_id",
            "workflowId": "workflow_id",
        }
        
        result = {}
        for key, value in data.items():
            new_key = key_map.get(key, key)
            result[new_key] = value
        return result
    
    async def chat(
        self,
        user_message: str,
        conversation_history: Optional[List[Dict[str, Any]]] = None,
        system_prompt: Optional[str] = None
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """
        Chat with Claude AI with streaming support and tool use loop.
        
        This method handles the complete conversation flow:
        1. Send user message to Claude
        2. If Claude requests tools, execute them
        3. Return results to Claude
        4. Continue until Claude provides final response
        5. Stream response chunks to caller
        
        Args:
            user_message: The user's message
            conversation_history: Previous messages in the conversation
            system_prompt: Optional custom system prompt (uses default if None)
            
        Yields:
            Dict chunks containing:
                - type: "message" (text chunk), "tool_use" (tool being called), 
                        "tool_result" (tool completed), "workflow" (workflow detected)
                - content: The content for this chunk type
        """
        # Build message history
        messages = conversation_history or []
        messages.append({
            "role": "user",
            "content": user_message
        })
        
        # Use default or custom system prompt
        system = system_prompt or N8N_SYSTEM_PROMPT
        
        # Tool definitions
        tools = self._build_mcp_tools()
        
        # Track accumulated response
        accumulated_text = ""
        
        # Tool use loop
        max_iterations = 15  # Prevent infinite loops (increased to account for retries)
        iteration = 0
        
        while iteration < max_iterations:
            logger.debug(f"Chat iteration {iteration + 1}")
            
            # Call Claude API with retry logic for rate limits
            max_retries = 3
            retry_delay = 2  # Start with 2 seconds
            
            for retry in range(max_retries):
                try:
                    response: Message = await self.client.messages.create(
                        model=self.model,
                        max_tokens=self.max_tokens,
                        temperature=self.temperature,
                        system=system,
                        messages=messages,
                        tools=tools
                    )
                    # Only increment iteration counter on successful response
                    iteration += 1
                    break  # Success, exit retry loop
                    
                except RateLimitError as e:
                    if retry < max_retries - 1:
                        logger.warning(f"Rate limit hit, retrying in {retry_delay}s (attempt {retry + 1}/{max_retries})")
                        yield {
                            "type": "message",
                            "content": f"\n\n_Experiencing high demand, retrying in {retry_delay} seconds..._\n\n"
                        }
                        await asyncio.sleep(retry_delay)
                        retry_delay *= 2  # Exponential backoff
                    else:
                        logger.error(f"Rate limit exceeded after {max_retries} retries")
                        yield {
                            "type": "error",
                            "content": "⚠️ Rate limit exceeded. Please wait a moment and try again. The API is experiencing high demand."
                        }
                        return
                        
                except Exception as e:
                    logger.error(f"Error calling Claude API: {str(e)}")
                    yield {
                        "type": "error",
                        "content": f"Error communicating with Claude: {str(e)}"
                    }
                    return
            
            # Process response content
            assistant_content = []
            
            for block in response.content:
                if isinstance(block, TextBlock):
                    # Text response - stream it
                    text = block.text
                    accumulated_text += text
                    
                    yield {
                        "type": "message",
                        "content": text
                    }
                    
                    assistant_content.append({
                        "type": "text",
                        "text": text
                    })
                
                elif isinstance(block, ToolUseBlock):
                    # Tool use request
                    tool_name = block.name
                    tool_input = block.input
                    tool_use_id = block.id
                    
                    logger.info(f"Claude requested tool: {tool_name}")
                    
                    # Notify that we're calling a tool
                    yield {
                        "type": "tool_use",
                        "tool_name": tool_name,
                        "tool_input": tool_input
                    }
                    
                    # Add tool use to assistant content
                    assistant_content.append({
                        "type": "tool_use",
                        "id": tool_use_id,
                        "name": tool_name,
                        "input": tool_input
                    })
                    
                    # Execute the tool
                    tool_result = await self._execute_tool(tool_name, tool_input)
                    
                    # Notify tool completed
                    yield {
                        "type": "tool_result",
                        "tool_name": tool_name,
                        "result": tool_result
                    }
                    
                    # Add assistant message with tool use
                    messages.append({
                        "role": "assistant",
                        "content": assistant_content
                    })
                    
                    # Add tool result as user message
                    messages.append({
                        "role": "user",
                        "content": [{
                            "type": "tool_result",
                            "tool_use_id": tool_use_id,
                            "content": tool_result
                        }]
                    })
                    
                    # Reset for next iteration
                    assistant_content = []
            
            # Check stop reason
            if response.stop_reason == "end_turn":
                # Claude is done - extract workflow if present
                logger.info(f"🔍 Attempting to extract workflow from {len(accumulated_text)} chars of text")
                logger.debug(f"🔍 Text preview: {accumulated_text[:500]}...")
                
                workflow = self._extract_workflow(accumulated_text)
                
                if workflow:
                    logger.info(f"✅ Successfully extracted workflow with {len(workflow.get('nodes', []))} nodes")
                    
                    # Send workflow_clear event to reset canvas
                    yield {
                        "type": "workflow_clear",
                        "content": {}
                    }
                    
                    # Stream individual nodes for real-time visualization
                    nodes = workflow.get('nodes', [])
                    for index, node in enumerate(nodes):
                        logger.info(f"📤 Streaming node {index + 1}/{len(nodes)}: {node.get('name')}")
                        yield {
                            "type": "workflow_node",
                            "content": {
                                "node": node,
                                "index": index,
                                "total": len(nodes)
                            }
                        }
                        # Small delay for visual effect (optional)
                        await asyncio.sleep(0.05)
                    
                    # Send complete workflow at the end
                    yield {
                        "type": "workflow",
                        "content": workflow
                    }
                else:
                    logger.warning("⚠️ No workflow found in Claude's response")
                    logger.debug(f"⚠️ Full text: {accumulated_text}")
                
                # Done!
                logger.info("Chat completed successfully")
                return
            
            elif response.stop_reason == "tool_use":
                # Continue loop to process tool results
                continue
            
            elif response.stop_reason == "max_tokens":
                # Token limit reached
                yield {
                    "type": "message",
                    "content": "\n\n[Response truncated - maximum length reached]"
                }
                return
            
            else:
                # Unknown stop reason
                logger.warning(f"Unexpected stop reason: {response.stop_reason}")
                return
        
        # Max iterations reached
        yield {
            "type": "error",
            "content": "Maximum conversation iterations reached. Please try rephrasing your request."
        }
    
    def _extract_workflow(self, text: str) -> Optional[Dict[str, Any]]:
        """
        Extract workflow JSON from Claude's response.
        
        Args:
            text: The text to search for workflow JSON
            
        Returns:
            Workflow dict if found, None otherwise
        """
        try:
            # Look for JSON code blocks (most reliable)
            if "```json" in text:
                start = text.find("```json") + 7
                end = text.find("```", start)
                if end == -1:
                    end = len(text)
                json_str = text[start:end].strip()
                
                try:
                    workflow = json.loads(json_str)
                    
                    # Validate it looks like a workflow
                    if isinstance(workflow, dict) and "nodes" in workflow:
                        logger.info(f"Extracted workflow with {len(workflow.get('nodes', []))} nodes")
                        return workflow
                except json.JSONDecodeError as e:
                    logger.warning(f"Failed to parse JSON from code block: {str(e)}")
            
            # Look for plain JSON objects (fallback)
            if "{" in text and "}" in text and "nodes" in text:
                # Find the largest JSON object that contains "nodes"
                import re
                
                # Try to find JSON objects
                for match in re.finditer(r'\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}', text, re.DOTALL):
                    json_str = match.group(0)
                    try:
                        workflow = json.loads(json_str)
                        if isinstance(workflow, dict) and "nodes" in workflow:
                            logger.info(f"Extracted workflow from plain JSON with {len(workflow.get('nodes', []))} nodes")
                            return workflow
                    except json.JSONDecodeError:
                        continue
            
        except Exception as e:
            logger.warning(f"Could not extract workflow: {str(e)}")
        
        return None


# Global service instance
_claude_service: Optional[ClaudeService] = None


def get_claude_service() -> ClaudeService:
    """
    Get or create the global Claude service instance.
    
    Returns:
        ClaudeService: The Claude service instance
    """
    global _claude_service
    if _claude_service is None:
        _claude_service = ClaudeService()
    return _claude_service

