"""
Workflow Validator Service for JSON schema validation.

This module provides validation functionality for workflow JSON configurations
against platform-specific schemas and requirements.
"""

from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass
import json
import re
import jsonschema
from jsonschema import validate, ValidationError, Draft7Validator
import logging

from app.utils.constants import (
    PLATFORM_SCHEMAS,
    N8N_WORKFLOW_SCHEMA,
    MAKE_WORKFLOW_SCHEMA,
    ZAPIER_ZAP_SCHEMA
)

logger = logging.getLogger(__name__)


@dataclass
class ValidationResult:
    """Result of workflow validation."""
    is_valid: bool
    errors: List[str]
    warnings: List[str]
    suggestions: List[str]
    platform_specific: Optional[Dict[str, Any]] = None


@dataclass
class FieldValidationResult:
    """Result of individual field validation."""
    field_name: str
    is_valid: bool
    error_message: Optional[str] = None
    suggestion: Optional[str] = None


class WorkflowValidator:
    """
    Service for validating workflow JSON configurations.
    
    This service validates workflow configurations against platform-specific
    schemas and provides detailed feedback for corrections.
    """
    
    def __init__(self):
        """Initialize workflow validator with platform schemas."""
        self.platform_schemas = PLATFORM_SCHEMAS
        self.supported_platforms = ["n8n", "make", "zapier"]
        logger.info("Workflow Validator initialized")
    
    async def validate_workflow(
        self,
        workflow_json: Dict[str, Any],
        platform: str,
        strict: bool = False
    ) -> ValidationResult:
        """
        Validate workflow JSON against platform schema.
        
        This method performs comprehensive validation of workflow JSON
        against the specified platform's schema and requirements.
        
        Args:
            workflow_json: Workflow JSON to validate
            platform: Target platform (n8n, make, zapier)
            strict: Enable strict validation mode
            
        Returns:
            ValidationResult: Comprehensive validation results
            
        TODO: Implement comprehensive schema validation
        TODO: Add platform-specific validation rules
        TODO: Provide actionable error messages
        TODO: Add performance validation
        TODO: Implement security checks
        """
        try:
            logger.info(f"Validating workflow for platform: {platform}")
            
            # Validate platform support
            if platform not in self.supported_platforms:
                return ValidationResult(
                    is_valid=False,
                    errors=[f"Unsupported platform: {platform}"],
                    warnings=[],
                    suggestions=[f"Supported platforms: {', '.join(self.supported_platforms)}"]
                )
            
            errors = []
            warnings = []
            suggestions = []
            
            # Basic JSON structure validation
            if not isinstance(workflow_json, dict):
                errors.append("Workflow must be a valid JSON object")
                return ValidationResult(
                    is_valid=False,
                    errors=errors,
                    warnings=warnings,
                    suggestions=["Ensure the workflow is a valid JSON object"]
                )
            
            # Platform-specific validation
            if platform == "n8n":
                platform_result = await self._validate_n8n_workflow(workflow_json, strict)
            elif platform == "make":
                platform_result = await self._validate_make_workflow(workflow_json, strict)
            elif platform == "zapier":
                platform_result = await self._validate_zapier_workflow(workflow_json, strict)
            else:
                platform_result = ValidationResult(
                    is_valid=False,
                    errors=[f"Validation not implemented for platform: {platform}"],
                    warnings=[],
                    suggestions=[]
                )
            
            # Combine results
            errors.extend(platform_result.errors)
            warnings.extend(platform_result.warnings)
            suggestions.extend(platform_result.suggestions)
            
            # Additional validations
            security_result = await self._validate_security(workflow_json, platform)
            warnings.extend(security_result.warnings)
            suggestions.extend(security_result.suggestions)
            
            if strict:
                performance_result = await self._validate_performance(workflow_json, platform)
                warnings.extend(performance_result.warnings)
                suggestions.extend(performance_result.suggestions)
            
            is_valid = len(errors) == 0
            
            return ValidationResult(
                is_valid=is_valid,
                errors=errors,
                warnings=warnings,
                suggestions=suggestions,
                platform_specific=platform_result.platform_specific
            )
            
        except Exception as e:
            logger.error(f"Failed to validate workflow: {str(e)}")
            return ValidationResult(
                is_valid=False,
                errors=[f"Validation failed: {str(e)}"],
                warnings=[],
                suggestions=["Check workflow JSON format and try again"]
            )
    
    async def _validate_n8n_workflow(
        self,
        workflow_json: Dict[str, Any],
        strict: bool = False
    ) -> ValidationResult:
        """
        Validate n8n-specific workflow structure.
        
        Args:
            workflow_json: n8n workflow JSON
            strict: Enable strict validation
            
        Returns:
            ValidationResult: n8n-specific validation results
        """
        try:
            errors = []
            warnings = []
            suggestions = []
            
            # Schema validation
            try:
                validate(instance=workflow_json, schema=N8N_WORKFLOW_SCHEMA)
            except ValidationError as e:
                errors.append(f"Schema validation failed: {e.message}")
                suggestions.append(f"Check field at path: {' -> '.join(str(p) for p in e.path)}")
                return ValidationResult(
                    is_valid=False,
                    errors=errors,
                    warnings=warnings,
                    suggestions=suggestions
                )
            
            # Check required fields
            required_fields = ["name", "nodes", "connections"]
            for field in required_fields:
                if field not in workflow_json:
                    errors.append(f"Missing required field: {field}")
                    suggestions.append(f"Add '{field}' field to workflow JSON")
            
            if errors:
                return ValidationResult(is_valid=False, errors=errors, warnings=warnings, suggestions=suggestions)
            
            # Validate workflow name
            if not workflow_json.get("name", "").strip():
                errors.append("Workflow name cannot be empty")
                suggestions.append("Provide a meaningful workflow name")
            
            # Validate nodes structure
            nodes = workflow_json.get("nodes", [])
            if len(nodes) == 0:
                errors.append("Workflow must have at least one node")
                suggestions.append("Add trigger and action nodes to the workflow")
            elif len(nodes) < 2:
                warnings.append("Workflow should have at least 2 nodes (trigger + action)")
                suggestions.append("Consider adding more nodes to create a functional workflow")
            
            if nodes:
                nodes_result = await self._validate_n8n_nodes(nodes)
                errors.extend(nodes_result.errors)
                warnings.extend(nodes_result.warnings)
                suggestions.extend(nodes_result.suggestions)
            
            # Validate connections
            if "connections" in workflow_json and nodes:
                connections_result = await self._validate_n8n_connections(
                    workflow_json["connections"],
                    nodes
                )
                errors.extend(connections_result.errors)
                warnings.extend(connections_result.warnings)
                suggestions.extend(connections_result.suggestions)
            
            # Check for placeholder values
            placeholders = check_placeholder_values(workflow_json)
            if placeholders:
                warnings.append(f"Found {len(placeholders)} unreplaced placeholders: {', '.join(set(placeholders[:5]))}")
                suggestions.append("Replace placeholder values with actual configuration before deployment")
            
            # Check for disconnected nodes
            disconnected = check_node_connections(workflow_json, "n8n")
            if disconnected:
                warnings.append(f"Found {len(disconnected)} potentially disconnected nodes")
                suggestions.append("Ensure all nodes are properly connected in the workflow")
            
            return ValidationResult(
                is_valid=len(errors) == 0,
                errors=errors,
                warnings=warnings,
                suggestions=suggestions,
                platform_specific={
                    "platform": "n8n",
                    "node_count": len(nodes),
                    "connection_count": len(workflow_json.get("connections", {})),
                    "has_trigger": any(node.get("type", "").endswith("Trigger") for node in nodes)
                }
            )
            
        except Exception as e:
            logger.error(f"n8n validation failed: {str(e)}")
            return ValidationResult(
                is_valid=False,
                errors=[f"n8n validation error: {str(e)}"],
                warnings=[],
                suggestions=["Check workflow JSON format and try again"]
            )
    
    async def _validate_make_workflow(
        self,
        workflow_json: Dict[str, Any],
        strict: bool = False
    ) -> ValidationResult:
        """
        Validate Make.com-specific workflow structure.
        
        Args:
            workflow_json: Make.com scenario JSON
            strict: Enable strict validation
            
        Returns:
            ValidationResult: Make.com-specific validation results
        """
        try:
            errors = []
            warnings = []
            suggestions = []
            
            # Schema validation
            try:
                validate(instance=workflow_json, schema=MAKE_WORKFLOW_SCHEMA)
            except ValidationError as e:
                errors.append(f"Schema validation failed: {e.message}")
                suggestions.append(f"Check field at path: {' -> '.join(str(p) for p in e.path)}")
                return ValidationResult(
                    is_valid=False,
                    errors=errors,
                    warnings=warnings,
                    suggestions=suggestions
                )
            
            # Check required fields
            required_fields = ["name", "flow", "metadata"]
            for field in required_fields:
                if field not in workflow_json:
                    errors.append(f"Missing required field: {field}")
                    suggestions.append(f"Add '{field}' field to scenario JSON")
            
            if errors:
                return ValidationResult(is_valid=False, errors=errors, warnings=warnings, suggestions=suggestions)
            
            # Validate scenario name
            if not workflow_json.get("name", "").strip():
                errors.append("Scenario name cannot be empty")
                suggestions.append("Provide a meaningful scenario name")
            
            # Validate flow structure
            flow = workflow_json.get("flow", [])
            if len(flow) == 0:
                errors.append("Scenario must have at least one module")
                suggestions.append("Add trigger and action modules to the scenario")
            elif len(flow) < 2:
                warnings.append("Scenario should have at least 2 modules (trigger + action)")
                suggestions.append("Consider adding more modules to create a functional scenario")
            
            if flow:
                flow_result = await self._validate_make_flow(flow)
                errors.extend(flow_result.errors)
                warnings.extend(flow_result.warnings)
                suggestions.extend(flow_result.suggestions)
            
            # Check for placeholder values
            placeholders = check_placeholder_values(workflow_json)
            if placeholders:
                warnings.append(f"Found {len(placeholders)} unreplaced placeholders: {', '.join(set(placeholders[:5]))}")
                suggestions.append("Replace placeholder values with actual configuration before deployment")
            
            # Validate metadata
            if "metadata" in workflow_json:
                if not isinstance(workflow_json["metadata"], dict):
                    errors.append("Metadata must be an object")
            
            return ValidationResult(
                is_valid=len(errors) == 0,
                errors=errors,
                warnings=warnings,
                suggestions=suggestions,
                platform_specific={
                    "platform": "make",
                    "module_count": len(flow),
                    "scenario_name": workflow_json.get("name", ""),
                    "has_metadata": "metadata" in workflow_json
                }
            )
            
        except Exception as e:
            logger.error(f"Make.com validation failed: {str(e)}")
            return ValidationResult(
                is_valid=False,
                errors=[f"Make.com validation error: {str(e)}"],
                warnings=[],
                suggestions=["Check scenario JSON format and try again"]
            )
    
    async def _validate_zapier_workflow(
        self,
        workflow_json: Dict[str, Any],
        strict: bool = False
    ) -> ValidationResult:
        """
        Validate Zapier-specific workflow structure.
        
        Args:
            workflow_json: Zapier zap JSON
            strict: Enable strict validation
            
        Returns:
            ValidationResult: Zapier-specific validation results
        """
        try:
            errors = []
            warnings = []
            suggestions = []
            
            # Schema validation
            try:
                validate(instance=workflow_json, schema=ZAPIER_ZAP_SCHEMA)
            except ValidationError as e:
                errors.append(f"Schema validation failed: {e.message}")
                suggestions.append(f"Check field at path: {' -> '.join(str(p) for p in e.path)}")
                return ValidationResult(
                    is_valid=False,
                    errors=errors,
                    warnings=warnings,
                    suggestions=suggestions
                )
            
            # Check required fields
            required_fields = ["title", "steps"]
            for field in required_fields:
                if field not in workflow_json:
                    errors.append(f"Missing required field: {field}")
                    suggestions.append(f"Add '{field}' field to zap JSON")
            
            if errors:
                return ValidationResult(is_valid=False, errors=errors, warnings=warnings, suggestions=suggestions)
            
            # Validate zap title
            if not workflow_json.get("title", "").strip():
                errors.append("Zap title cannot be empty")
                suggestions.append("Provide a meaningful zap title")
            
            # Validate steps structure
            steps = workflow_json.get("steps", [])
            if len(steps) == 0:
                errors.append("Zap must have at least one step")
                suggestions.append("Add trigger and action steps to the zap")
            elif len(steps) < 2:
                warnings.append("Zap should have at least 2 steps (trigger + action)")
                suggestions.append("Consider adding more action steps to create a functional zap")
            
            if steps:
                steps_result = await self._validate_zapier_steps(steps)
                errors.extend(steps_result.errors)
                warnings.extend(steps_result.warnings)
                suggestions.extend(steps_result.suggestions)
            
            # Check for placeholder values
            placeholders = check_placeholder_values(workflow_json)
            if placeholders:
                warnings.append(f"Found {len(placeholders)} unreplaced placeholders: {', '.join(set(placeholders[:5]))}")
                suggestions.append("Replace placeholder values with actual configuration before deployment")
            
            # Zapier-specific validation: first step must be trigger
            if steps and len(steps) > 0:
                first_step = steps[0]
                if first_step.get("type") != "trigger":
                    errors.append("First step must be a trigger")
                    suggestions.append("Change the first step type to 'trigger'")
            
            return ValidationResult(
                is_valid=len(errors) == 0,
                errors=errors,
                warnings=warnings,
                suggestions=suggestions,
                platform_specific={
                    "platform": "zapier",
                    "step_count": len(steps),
                    "zap_title": workflow_json.get("title", ""),
                    "trigger_count": sum(1 for s in steps if s.get("type") == "trigger"),
                    "action_count": sum(1 for s in steps if s.get("type") == "action")
                }
            )
            
        except Exception as e:
            logger.error(f"Zapier validation failed: {str(e)}")
            return ValidationResult(
                is_valid=False,
                errors=[f"Zapier validation error: {str(e)}"],
                warnings=[],
                suggestions=["Check zap JSON format and try again"]
            )
    
    async def check_required_fields(
        self,
        workflow_json: Dict[str, Any],
        required_fields: List[str]
    ) -> List[FieldValidationResult]:
        """
        Check if all required fields are present and valid.
        
        Args:
            workflow_json: Workflow JSON to check
            required_fields: List of required field names
            
        Returns:
            List[FieldValidationResult]: Validation results for each field
            
        TODO: Implement comprehensive field validation
        TODO: Add field type checking
        TODO: Validate field value constraints
        TODO: Provide specific error messages
        """
        try:
            results = []
            
            for field in required_fields:
                if field not in workflow_json:
                    results.append(FieldValidationResult(
                        field_name=field,
                        is_valid=False,
                        error_message=f"Required field '{field}' is missing",
                        suggestion=f"Add '{field}' field to the workflow JSON"
                    ))
                elif workflow_json[field] is None:
                    results.append(FieldValidationResult(
                        field_name=field,
                        is_valid=False,
                        error_message=f"Required field '{field}' cannot be null",
                        suggestion=f"Provide a valid value for '{field}'"
                    ))
                else:
                    results.append(FieldValidationResult(
                        field_name=field,
                        is_valid=True
                    ))
            
            return results
            
        except Exception as e:
            logger.error(f"Failed to check required fields: {str(e)}")
            return [FieldValidationResult(
                field_name="validation_error",
                is_valid=False,
                error_message=f"Field validation failed: {str(e)}"
            )]
    
    async def _validate_n8n_nodes(self, nodes: List[Dict[str, Any]]) -> ValidationResult:
        """Validate n8n nodes structure."""
        errors = []
        warnings = []
        suggestions = []
        
        node_ids = set()
        has_trigger = False
        
        for i, node in enumerate(nodes):
            # Check required node fields
            required_fields = ["name", "type", "typeVersion", "position", "id"]
            for field in required_fields:
                if field not in node:
                    errors.append(f"Node {i}: Missing required field '{field}'")
            
            # Check for duplicate node IDs
            node_id = node.get("id")
            if node_id:
                if node_id in node_ids:
                    errors.append(f"Duplicate node ID: {node_id}")
                node_ids.add(node_id)
            
            # Check if node is a trigger
            if node.get("type", "").endswith("Trigger"):
                has_trigger = True
            
            # Validate position format
            position = node.get("position")
            if position:
                if not isinstance(position, list) or len(position) != 2:
                    errors.append(f"Node {node.get('name', i)}: Position must be array of 2 numbers")
                elif not all(isinstance(p, (int, float)) for p in position):
                    errors.append(f"Node {node.get('name', i)}: Position values must be numbers")
        
        if not has_trigger:
            warnings.append("No trigger node found in workflow")
            suggestions.append("Add a trigger node to start the workflow")
        
        return ValidationResult(
            is_valid=len(errors) == 0,
            errors=errors,
            warnings=warnings,
            suggestions=suggestions
        )
    
    async def _validate_n8n_connections(
        self,
        connections: Dict[str, Any],
        nodes: List[Dict[str, Any]]
    ) -> ValidationResult:
        """Validate n8n connections structure."""
        errors = []
        warnings = []
        suggestions = []
        
        # Get all node names
        node_names = {node.get("name") for node in nodes if "name" in node}
        
        # Validate connection references
        for source_node, connection_data in connections.items():
            if source_node not in node_names:
                errors.append(f"Connection references non-existent node: {source_node}")
            
            if isinstance(connection_data, dict):
                for output_type, targets in connection_data.items():
                    if isinstance(targets, list):
                        for target_list in targets:
                            if isinstance(target_list, list):
                                for target in target_list:
                                    if isinstance(target, dict):
                                        target_node = target.get("node")
                                        if target_node and target_node not in node_names:
                                            errors.append(f"Connection targets non-existent node: {target_node}")
        
        return ValidationResult(
            is_valid=len(errors) == 0,
            errors=errors,
            warnings=warnings,
            suggestions=suggestions
        )
    
    async def _validate_make_flow(self, flow: List[Dict[str, Any]]) -> ValidationResult:
        """Validate Make.com flow structure."""
        errors = []
        warnings = []
        suggestions = []
        
        module_ids = set()
        expected_id = 1
        
        for i, module in enumerate(flow):
            # Check required module fields
            required_fields = ["id", "module", "version", "parameters"]
            for field in required_fields:
                if field not in module:
                    errors.append(f"Module {i}: Missing required field '{field}'")
            
            # Check for duplicate module IDs
            module_id = module.get("id")
            if module_id is not None:
                if module_id in module_ids:
                    errors.append(f"Duplicate module ID: {module_id}")
                module_ids.add(module_id)
                
                # Check sequential IDs
                if module_id != expected_id:
                    warnings.append(f"Module ID {module_id} is not sequential (expected {expected_id})")
                expected_id = module_id + 1
            
            # Validate module name format
            module_name = module.get("module", "")
            if module_name and ":" not in module_name:
                warnings.append(f"Module {i}: Module name '{module_name}' should include app:action format")
        
        return ValidationResult(
            is_valid=len(errors) == 0,
            errors=errors,
            warnings=warnings,
            suggestions=suggestions
        )
    
    async def _validate_zapier_steps(self, steps: List[Dict[str, Any]]) -> ValidationResult:
        """Validate Zapier steps structure."""
        errors = []
        warnings = []
        suggestions = []
        
        step_ids = set()
        trigger_count = 0
        
        for i, step in enumerate(steps):
            # Check required step fields
            required_fields = ["id", "type", "app", "event"]
            for field in required_fields:
                if field not in step:
                    errors.append(f"Step {i}: Missing required field '{field}'")
            
            # Check for duplicate step IDs
            step_id = step.get("id")
            if step_id:
                if step_id in step_ids:
                    errors.append(f"Duplicate step ID: {step_id}")
                step_ids.add(step_id)
            
            # Validate step type
            step_type = step.get("type")
            if step_type == "trigger":
                trigger_count += 1
                if i != 0:
                    warnings.append(f"Step {i}: Trigger should be the first step")
            elif step_type not in ["trigger", "action"]:
                errors.append(f"Step {i}: Invalid step type '{step_type}' (must be 'trigger' or 'action')")
        
        # Check trigger count
        if trigger_count == 0:
            errors.append("Zap must have at least one trigger step")
        elif trigger_count > 1:
            warnings.append(f"Zap has {trigger_count} triggers, typically should have only one")
        
        return ValidationResult(
            is_valid=len(errors) == 0,
            errors=errors,
            warnings=warnings,
            suggestions=suggestions
        )
    
    async def _validate_security(
        self,
        workflow_json: Dict[str, Any],
        platform: str
    ) -> ValidationResult:
        """Validate workflow security aspects."""
        warnings = []
        suggestions = []
        
        # Check for hardcoded credentials or sensitive data
        workflow_str = json.dumps(workflow_json).lower()
        
        sensitive_patterns = [
            ("password", "Potential hardcoded password found"),
            ("api_key", "Potential hardcoded API key found"),
            ("secret", "Potential hardcoded secret found"),
            ("token", "Potential hardcoded token found"),
        ]
        
        for pattern, message in sensitive_patterns:
            if pattern in workflow_str and not f"{{{{{pattern}" in workflow_str:
                warnings.append(message)
                suggestions.append(f"Use environment variables or secure credential storage for {pattern}s")
        
        return ValidationResult(is_valid=True, errors=[], warnings=warnings, suggestions=suggestions)
    
    async def _validate_performance(
        self,
        workflow_json: Dict[str, Any],
        platform: str
    ) -> ValidationResult:
        """Validate workflow performance aspects."""
        warnings = []
        suggestions = []
        
        # Check workflow size
        if platform == "n8n":
            node_count = len(workflow_json.get("nodes", []))
            if node_count > 50:
                warnings.append(f"Large workflow with {node_count} nodes may impact performance")
                suggestions.append("Consider breaking down into smaller workflows")
        elif platform == "make":
            module_count = len(workflow_json.get("flow", []))
            if module_count > 100:
                warnings.append(f"Large scenario with {module_count} modules may impact performance")
                suggestions.append("Consider optimizing or splitting the scenario")
        elif platform == "zapier":
            step_count = len(workflow_json.get("steps", []))
            if step_count > 20:
                warnings.append(f"Large zap with {step_count} steps may impact performance")
                suggestions.append("Consider simplifying the zap or using fewer steps")
        
        return ValidationResult(is_valid=True, errors=[], warnings=warnings, suggestions=suggestions)


# Helper functions for validation

def check_placeholder_values(workflow: Dict[str, Any]) -> List[str]:
    """
    Check for unreplaced placeholder values like {{placeholder}}.
    Returns list of found placeholders.
    """
    placeholders = []
    
    def find_placeholders(obj, path=""):
        if isinstance(obj, dict):
            for k, v in obj.items():
                find_placeholders(v, f"{path}.{k}" if path else k)
        elif isinstance(obj, list):
            for i, item in enumerate(obj):
                find_placeholders(item, f"{path}[{i}]")
        elif isinstance(obj, str):
            # Find {{placeholder}} patterns
            found = re.findall(r'\{\{([^}]+)\}\}', obj)
            for placeholder in found:
                placeholders.append(placeholder.strip())
    
    find_placeholders(workflow)
    return placeholders


def check_node_connections(workflow: Dict[str, Any], platform: str) -> List[str]:
    """
    Verify all nodes are properly connected.
    Returns list of disconnected node IDs/names.
    """
    disconnected = []
    
    try:
        if platform == "n8n":
            nodes = workflow.get("nodes", [])
            connections = workflow.get("connections", {})
            
            if not nodes:
                return disconnected
            
            # Get all node names
            node_names = {node.get("name") for node in nodes if "name" in node}
            
            # Track which nodes are connected
            connected_nodes = set()
            
            # Add all source nodes (nodes that have outgoing connections)
            for source_node in connections.keys():
                connected_nodes.add(source_node)
            
            # Add all target nodes
            for connection_data in connections.values():
                if isinstance(connection_data, dict):
                    for targets in connection_data.values():
                        if isinstance(targets, list):
                            for target_list in targets:
                                if isinstance(target_list, list):
                                    for target in target_list:
                                        if isinstance(target, dict):
                                            target_node = target.get("node")
                                            if target_node:
                                                connected_nodes.add(target_node)
            
            # Find disconnected nodes (excluding triggers which may not have incoming connections)
            for node in nodes:
                node_name = node.get("name")
                node_type = node.get("type", "")
                
                # Skip trigger nodes as they don't need incoming connections
                if node_type.endswith("Trigger"):
                    continue
                
                if node_name and node_name not in connected_nodes:
                    disconnected.append(node_name)
        
        elif platform == "make":
            flow = workflow.get("flow", [])
            # For Make, check if modules reference each other properly
            # This is a simplified check
            if len(flow) > 1:
                # Typically Make modules are connected via mappers
                for module in flow[1:]:  # Skip first module (trigger)
                    if "mapper" not in module or not module.get("mapper"):
                        module_id = module.get("id", "unknown")
                        disconnected.append(str(module_id))
        
        elif platform == "zapier":
            # Zapier steps are linear, so no disconnection issues
            # unless there's only one step
            steps = workflow.get("steps", [])
            if len(steps) == 1:
                disconnected.append(steps[0].get("id", "step-1"))
    
    except Exception as e:
        logger.error(f"Error checking node connections: {str(e)}")
    
    return disconnected
