"""
Platform-specific workflow generators for n8n, Make.com, and Zapier.

This module provides comprehensive workflow generation capabilities for all major
automation platforms, converting extracted intents into valid platform-specific JSON.
"""

import uuid
import logging
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime
from copy import deepcopy

from app.utils.constants import (
    N8N_WORKFLOW_TEMPLATE,
    MAKE_WORKFLOW_TEMPLATE,
    ZAPIER_ZAP_TEMPLATE,
    COMMON_TRIGGERS,
    COMMON_ACTIONS,
    DEFAULT_PARAMETERS,
    N8N_NODE_SPACING,
    N8N_START_POSITION,
    MAKE_NODE_SPACING,
    MAKE_START_POSITION,
    PLATFORM_LIMITATIONS,
    get_app_mapping,
    get_event_mapping,
    get_platform_node_type,
    get_default_parameters
)

logger = logging.getLogger(__name__)

class WorkflowGenerationError(Exception):
    """Custom exception for workflow generation errors."""
    pass

class WorkflowGenerator:
    """
    Comprehensive workflow generator for multiple automation platforms.
    
    This class handles the conversion of extracted intents into valid,
    importable JSON workflows for n8n, Make.com, and Zapier.
    """
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.generated_workflows = []  # Track generated workflows for debugging
    
    async def generate_n8n_workflow(self, intent: Dict, parameters: Dict) -> Dict:
        """
        Generate n8n workflow JSON from extracted intent.
        
        n8n uses a node-based structure with explicit connections between nodes.
        Each node has a unique ID, type, parameters, and position.
        
        Args:
            intent: Extracted workflow intent with trigger and actions
            parameters: User-provided parameters and configuration
            
        Returns:
            Valid n8n workflow JSON
        """
        try:
            self.logger.info("Generating n8n workflow from intent")
            
            # Start with template
            workflow = deepcopy(N8N_WORKFLOW_TEMPLATE)
            
            # Set workflow name
            workflow["name"] = parameters.get("workflow_name", "Generated Workflow")
            workflow["updatedAt"] = datetime.utcnow().isoformat()
            
            # Generate nodes and connections
            nodes = []
            connections = {}
            node_positions = self._calculate_n8n_positions(intent)
            
            # Generate trigger node
            trigger_node = self._generate_n8n_trigger_node(
                intent.get("trigger", {}),
                parameters,
                node_positions[0]
            )
            nodes.append(trigger_node)
            
            # Generate action nodes
            actions = intent.get("actions", [])
            action_nodes = []
            
            for i, action in enumerate(actions):
                action_node = self._generate_n8n_action_node(
                    action,
                    parameters,
                    node_positions[i + 1],
                    index=i
                )
                action_nodes.append(action_node)
                nodes.append(action_node)
            
            # Generate connections
            connections = self._generate_n8n_connections(trigger_node, action_nodes)
            
            # Assemble workflow
            workflow["nodes"] = nodes
            workflow["connections"] = connections
            workflow["triggerCount"] = 1
            workflow["tags"] = parameters.get("tags", ["generated", "workflow-bridge"])
            
            # Validate workflow
            self._validate_n8n_workflow(workflow)
            
            self.logger.info("Successfully generated n8n workflow with %d nodes", len(nodes))
            return workflow
            
        except Exception as e:
            self.logger.error("Failed to generate n8n workflow: %s", str(e))
            raise WorkflowGenerationError(f"n8n workflow generation failed: {str(e)}")
    
    async def generate_make_workflow(self, intent: Dict, parameters: Dict) -> Dict:
        """
        Generate Make.com workflow JSON from extracted intent.
        
        Make.com uses a flow-based structure with sequential module IDs
        and designer positioning for the visual interface.
        
        Args:
            intent: Extracted workflow intent with trigger and actions
            parameters: User-provided parameters and configuration
            
        Returns:
            Valid Make.com workflow JSON
        """
        try:
            self.logger.info("Generating Make.com workflow from intent")
            
            # Start with template
            workflow = deepcopy(MAKE_WORKFLOW_TEMPLATE)
            
            # Set workflow name
            workflow["name"] = parameters.get("workflow_name", "Generated Scenario")
            
            # Generate flow modules
            flow = []
            module_positions = self._calculate_make_positions(intent)
            
            # Generate trigger module
            trigger_module = self._generate_make_trigger_module(
                intent.get("trigger", {}),
                parameters,
                module_positions[0],
                module_id=1
            )
            flow.append(trigger_module)
            
            # Generate action modules
            actions = intent.get("actions", [])
            
            for i, action in enumerate(actions):
                action_module = self._generate_make_action_module(
                    action,
                    parameters,
                    module_positions[i + 1],
                    module_id=i + 2
                )
                flow.append(action_module)
            
            # Assemble workflow
            workflow["flow"] = flow
            workflow["metadata"]["scenario"]["roundtrips"] = len(flow)
            
            # Add creation metadata
            workflow["metadata"]["created_at"] = datetime.utcnow().isoformat()
            workflow["metadata"]["created_by"] = "WorkflowBridge"
            
            # Validate workflow
            self._validate_make_workflow(workflow)
            
            self.logger.info("Successfully generated Make.com workflow with %d modules", len(flow))
            return workflow
            
        except Exception as e:
            self.logger.error("Failed to generate Make.com workflow: %s", str(e))
            raise WorkflowGenerationError(f"Make.com workflow generation failed: {str(e)}")
    
    async def generate_zapier_workflow(self, intent: Dict, parameters: Dict) -> Dict:
        """
        Generate Zapier workflow JSON from extracted intent.
        
        Zapier uses a simple step-based structure with triggers and actions
        in a linear sequence. Each step has an ID, type, app, and event.
        
        Args:
            intent: Extracted workflow intent with trigger and actions
            parameters: User-provided parameters and configuration
            
        Returns:
            Valid Zapier workflow JSON
        """
        try:
            self.logger.info("Generating Zapier workflow from intent")
            
            # Start with template
            workflow = deepcopy(ZAPIER_ZAP_TEMPLATE)
            
            # Set workflow title
            workflow["title"] = parameters.get("workflow_name", "Generated Zap")
            
            # Generate steps
            steps = []
            
            # Generate trigger step
            trigger_step = self._generate_zapier_trigger_step(
                intent.get("trigger", {}),
                parameters
            )
            steps.append(trigger_step)
            
            # Generate action steps
            actions = intent.get("actions", [])
            
            for i, action in enumerate(actions):
                action_step = self._generate_zapier_action_step(
                    action,
                    parameters,
                    step_index=i + 1
                )
                steps.append(action_step)
            
            # Assemble workflow
            workflow["steps"] = steps
            workflow["status"] = parameters.get("status", "draft")
            
            # Add metadata
            workflow["created_at"] = datetime.utcnow().isoformat()
            workflow["created_by"] = "WorkflowBridge"
            
            # Validate workflow
            self._validate_zapier_workflow(workflow)
            
            self.logger.info("Successfully generated Zapier workflow with %d steps", len(steps))
            return workflow
            
        except Exception as e:
            self.logger.error("Failed to generate Zapier workflow: %s", str(e))
            raise WorkflowGenerationError(f"Zapier workflow generation failed: {str(e)}")
    
    # Helper functions for node generation
    
    def _generate_node_id(self) -> str:
        """Generate unique node ID."""
        return str(uuid.uuid4())
    
    def _generate_webhook_id(self) -> str:
        """Generate unique webhook ID for n8n."""
        return str(uuid.uuid4())
    
    def _calculate_n8n_positions(self, intent: Dict) -> List[List[int]]:
        """
        Calculate node positions for n8n workflow.
        
        n8n uses [x, y] coordinates for node positioning.
        """
        trigger_count = 1
        action_count = len(intent.get("actions", []))
        total_nodes = trigger_count + action_count
        
        positions = []
        
        # Start position for trigger
        x, y = N8N_START_POSITION
        positions.append([x, y])
        
        # Calculate action positions
        for i in range(action_count):
            x += N8N_NODE_SPACING
            positions.append([x, y])
        
        return positions
    
    def _calculate_make_positions(self, intent: Dict) -> List[Dict[str, int]]:
        """
        Calculate module positions for Make.com workflow.
        
        Make.com uses {"x": x, "y": y} coordinates for module positioning.
        """
        trigger_count = 1
        action_count = len(intent.get("actions", []))
        total_modules = trigger_count + action_count
        
        positions = []
        
        # Start position for trigger
        x, y = MAKE_START_POSITION["x"], MAKE_START_POSITION["y"]
        positions.append({"x": x, "y": y})
        
        # Calculate action positions
        for i in range(action_count):
            x += MAKE_NODE_SPACING
            positions.append({"x": x, "y": y})
        
        return positions
    
    def _generate_n8n_trigger_node(
        self, 
        trigger: Dict, 
        parameters: Dict, 
        position: List[int]
    ) -> Dict:
        """Generate n8n trigger node."""
        app_name = get_app_mapping(trigger.get("app", "webhook"))
        event_name = get_event_mapping(trigger.get("event", "incoming"))
        
        node_id = self._generate_node_id()
        node_type = get_platform_node_type(app_name, "n8n", is_trigger=True)
        
        # Get default parameters and merge with user parameters
        default_params = get_default_parameters(app_name, event_name)
        node_parameters = {**default_params, **parameters.get("trigger_params", {})}
        
        # Special handling for webhook triggers
        if "webhook" in node_type.lower():
            node_parameters["httpMethod"] = "POST"
            node_parameters["path"] = parameters.get("webhook_path", f"/webhook/{node_id[:8]}")
            node_parameters["responseMode"] = "onReceived"
        
        node = {
            "parameters": node_parameters,
            "name": f"{trigger.get('app', 'Webhook')} Trigger",
            "type": node_type,
            "typeVersion": 1,
            "position": position,
            "id": node_id
        }
        
        # Add webhook ID for webhook triggers
        if "webhook" in node_type.lower():
            node["webhookId"] = self._generate_webhook_id()
        
        return node
    
    def _generate_n8n_action_node(
        self, 
        action: Dict, 
        parameters: Dict, 
        position: List[int],
        index: int = 0
    ) -> Dict:
        """Generate n8n action node."""
        app_name = get_app_mapping(action.get("app", "webhook"))
        event_name = get_event_mapping(action.get("event", "send"))
        
        node_id = self._generate_node_id()
        node_type = get_platform_node_type(app_name, "n8n", is_trigger=False)
        
        # Get default parameters and merge with user parameters
        default_params = get_default_parameters(app_name, event_name)
        action_params_key = f"action_{index}_params"
        node_parameters = {**default_params, **parameters.get(action_params_key, {})}
        
        # Special parameter handling for common actions
        if "gmail" in app_name and "send" in event_name.lower():
            node_parameters.update({
                "to": parameters.get("email_recipient", "{{$json.email}}"),
                "subject": parameters.get("email_subject", "{{$json.subject}}"),
                "message": parameters.get("email_body", "{{$json.message}}")
            })
        elif "slack" in app_name:
            node_parameters.update({
                "channel": parameters.get("slack_channel", "{{$json.channel}}"),
                "text": parameters.get("message_text", "{{$json.text}}")
            })
        
        return {
            "parameters": node_parameters,
            "name": f"{action.get('app', 'Action')} {index + 1}",
            "type": node_type,
            "typeVersion": 1,
            "position": position,
            "id": node_id
        }
    
    def _generate_n8n_connections(
        self, 
        trigger_node: Dict, 
        action_nodes: List[Dict]
    ) -> Dict:
        """Generate n8n connections between nodes."""
        connections = {}
        
        if not action_nodes:
            return connections
        
        # Connect trigger to first action
        trigger_name = trigger_node["name"]
        connections[trigger_name] = {
            "main": [[{"node": action_nodes[0]["name"], "type": "main", "index": 0}]]
        }
        
        # Connect actions in sequence
        for i in range(len(action_nodes) - 1):
            current_action = action_nodes[i]
            next_action = action_nodes[i + 1]
            
            connections[current_action["name"]] = {
                "main": [[{"node": next_action["name"], "type": "main", "index": 0}]]
            }
        
        return connections
    
    def _generate_make_trigger_module(
        self, 
        trigger: Dict, 
        parameters: Dict, 
        position: Dict[str, int],
        module_id: int
    ) -> Dict:
        """Generate Make.com trigger module."""
        app_name = get_app_mapping(trigger.get("app", "webhook"))
        event_name = get_event_mapping(trigger.get("event", "incoming"))
        
        module_type = get_platform_node_type(app_name, "make", is_trigger=True)
        
        # Get default parameters and merge with user parameters
        default_params = get_default_parameters(app_name, event_name)
        module_parameters = {**default_params, **parameters.get("trigger_params", {})}
        
        return {
            "id": module_id,
            "module": module_type,
            "version": 1,
            "parameters": module_parameters,
            "mapper": {},
            "metadata": {
                "designer": position,
                "restore": {},
                "parameters": [
                    {
                        "name": param_name,
                        "type": "text",
                        "label": param_name.replace("_", " ").title(),
                        "required": False
                    }
                    for param_name in module_parameters.keys()
                ]
            }
        }
    
    def _generate_make_action_module(
        self, 
        action: Dict, 
        parameters: Dict, 
        position: Dict[str, int],
        module_id: int
    ) -> Dict:
        """Generate Make.com action module."""
        app_name = get_app_mapping(action.get("app", "webhook"))
        event_name = get_event_mapping(action.get("event", "send"))
        
        module_type = get_platform_node_type(app_name, "make", is_trigger=False)
        
        # Get default parameters and merge with user parameters
        default_params = get_default_parameters(app_name, event_name)
        action_params_key = f"action_{module_id - 2}_params"
        module_parameters = {**default_params, **parameters.get(action_params_key, {})}
        
        return {
            "id": module_id,
            "module": module_type,
            "version": 1,
            "parameters": module_parameters,
            "mapper": {},
            "metadata": {
                "designer": position,
                "restore": {},
                "parameters": [
                    {
                        "name": param_name,
                        "type": "text",
                        "label": param_name.replace("_", " ").title(),
                        "required": False
                    }
                    for param_name in module_parameters.keys()
                ]
            }
        }
    
    def _generate_zapier_trigger_step(self, trigger: Dict, parameters: Dict) -> Dict:
        """Generate Zapier trigger step."""
        app_name = get_app_mapping(trigger.get("app", "webhook"))
        event_name = get_event_mapping(trigger.get("event", "incoming"))
        
        zapier_app = get_platform_node_type(app_name, "zapier", is_trigger=True)
        zapier_event = event_name.lower().replace(" ", "_")
        
        # Get default parameters and merge with user parameters
        default_params = get_default_parameters(app_name, event_name)
        step_parameters = {**default_params, **parameters.get("trigger_params", {})}
        
        return {
            "id": "trigger_1",
            "type": "trigger",
            "app": zapier_app,
            "event": zapier_event,
            "parameters": step_parameters
        }
    
    def _generate_zapier_action_step(
        self, 
        action: Dict, 
        parameters: Dict, 
        step_index: int
    ) -> Dict:
        """Generate Zapier action step."""
        app_name = get_app_mapping(action.get("app", "webhook"))
        event_name = get_event_mapping(action.get("event", "send"))
        
        zapier_app = get_platform_node_type(app_name, "zapier", is_trigger=False)
        zapier_event = event_name.lower().replace(" ", "_")
        
        # Get default parameters and merge with user parameters
        default_params = get_default_parameters(app_name, event_name)
        action_params_key = f"action_{step_index - 1}_params"
        step_parameters = {**default_params, **parameters.get(action_params_key, {})}
        
        return {
            "id": f"action_{step_index}",
            "type": "action",
            "app": zapier_app,
            "event": zapier_event,
            "parameters": step_parameters
        }
    
    # Validation functions
    
    def _validate_n8n_workflow(self, workflow: Dict) -> None:
        """Validate n8n workflow structure."""
        required_fields = ["name", "nodes", "connections"]
        
        for field in required_fields:
            if field not in workflow:
                raise WorkflowGenerationError(f"Missing required field: {field}")
        
        # Validate nodes
        for node in workflow["nodes"]:
            node_required = ["name", "type", "typeVersion", "position", "id"]
            for field in node_required:
                if field not in node:
                    raise WorkflowGenerationError(f"Node missing required field: {field}")
        
        # Check node count limits
        if len(workflow["nodes"]) > PLATFORM_LIMITATIONS["n8n"]["max_nodes"]:
            raise WorkflowGenerationError("Too many nodes for n8n platform")
    
    def _validate_make_workflow(self, workflow: Dict) -> None:
        """Validate Make.com workflow structure."""
        required_fields = ["name", "flow", "metadata"]
        
        for field in required_fields:
            if field not in workflow:
                raise WorkflowGenerationError(f"Missing required field: {field}")
        
        # Validate modules
        for module in workflow["flow"]:
            module_required = ["id", "module", "version", "parameters", "metadata"]
            for field in module_required:
                if field not in module:
                    raise WorkflowGenerationError(f"Module missing required field: {field}")
        
        # Check module count limits
        if len(workflow["flow"]) > PLATFORM_LIMITATIONS["make"]["max_modules"]:
            raise WorkflowGenerationError("Too many modules for Make.com platform")
    
    def _validate_zapier_workflow(self, workflow: Dict) -> None:
        """Validate Zapier workflow structure."""
        required_fields = ["title", "steps", "status"]
        
        for field in required_fields:
            if field not in workflow:
                raise WorkflowGenerationError(f"Missing required field: {field}")
        
        # Validate steps
        for step in workflow["steps"]:
            step_required = ["id", "type", "app", "event", "parameters"]
            for field in step_required:
                if field not in step:
                    raise WorkflowGenerationError(f"Step missing required field: {field}")
        
        # Check step count limits
        if len(workflow["steps"]) > PLATFORM_LIMITATIONS["zapier"]["max_steps"]:
            raise WorkflowGenerationError("Too many steps for Zapier platform")
        
        # Validate step types
        valid_types = ["trigger", "action"]
        for step in workflow["steps"]:
            if step["type"] not in valid_types:
                raise WorkflowGenerationError(f"Invalid step type: {step['type']}")
    
    def get_generation_stats(self) -> Dict:
        """Get statistics about generated workflows."""
        return {
            "total_generated": len(self.generated_workflows),
            "platforms": {
                "n8n": len([w for w in self.generated_workflows if "nodes" in w]),
                "make": len([w for w in self.generated_workflows if "flow" in w]),
                "zapier": len([w for w in self.generated_workflows if "steps" in w])
            }
        }


# Example usage and testing functions
async def test_workflow_generation():
    """
    Test function to demonstrate workflow generation for all platforms.
    
    TODO: Test n8n workflow generation with Google Forms → Gmail
    TODO: Test Make workflow generation with Webhook → Slack  
    TODO: Test Zapier workflow generation with Form → Airtable
    TODO: Validate generated JSON against platform schemas
    TODO: Test with multiple actions (1 trigger, 2 actions)
    TODO: Test parameter replacement ({{placeholders}})
    """
    generator = WorkflowGenerator()
    
    # Sample intent for testing
    sample_intent = {
        "trigger": {"app": "Google Forms", "event": "New Response"},
        "actions": [
            {"app": "Gmail", "event": "Send Email"},
            {"app": "Slack", "event": "Send Message"}
        ]
    }
    
    sample_parameters = {
        "workflow_name": "Form to Email and Slack",
        "email_recipient": "admin@company.com",
        "email_subject": "New Form Response",
        "slack_channel": "#notifications"
    }
    
    # Test all platforms
    platforms = ["n8n", "make", "zapier"]
    
    for platform in platforms:
        try:
            if platform == "n8n":
                workflow = await generator.generate_n8n_workflow(sample_intent, sample_parameters)
            elif platform == "make":
                workflow = await generator.generate_make_workflow(sample_intent, sample_parameters)
            elif platform == "zapier":
                workflow = await generator.generate_zapier_workflow(sample_intent, sample_parameters)
            
            print(f"✅ {platform.upper()} workflow generated successfully")
            print(f"   Nodes/Steps: {len(workflow.get('nodes', workflow.get('flow', workflow.get('steps', []))))}")
            
        except Exception as e:
            print(f"❌ {platform.upper()} workflow generation failed: {e}")
    
    return generator.get_generation_stats()