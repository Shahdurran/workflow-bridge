# Workflow Validation and Export System - Demonstration

## Overview

This document demonstrates the complete workflow validation and export system for all three automation platforms: **n8n**, **Make.com**, and **Zapier**.

## Features Implemented

### ✅ Core Validation Features

1. **JSON Schema Validation** - Validates workflow structure against platform-specific JSON schemas
2. **Required Fields Checking** - Ensures all required fields are present
3. **Data Type Validation** - Verifies correct data types for all fields
4. **Node/Module/Step Validation** - Validates individual workflow components
5. **Connection Validation** - Checks proper connections between nodes
6. **Placeholder Detection** - Identifies unreplaced placeholder values like `{{placeholder}}`
7. **Platform-Specific Rules** - Enforces platform-specific requirements
8. **Security Validation** - Detects potential hardcoded credentials
9. **Performance Validation** - Warns about large workflows

### ✅ Export Features

1. **Downloadable Files** - Export workflows as downloadable JSON/YAML files
2. **Pre-Export Validation** - Validates workflows before export
3. **Multiple Formats** - Supports JSON and YAML export formats
4. **Timestamped Filenames** - Unique filenames with timestamps
5. **Validation Status Headers** - Includes validation status in response headers

## API Endpoints

### 1. Validate Workflow

**Endpoint:** `POST /api/workflows/validate`

**Request:**
```json
{
  "workflow_json": { ... },
  "platform": "n8n",
  "strict": false
}
```

**Response:**
```json
{
  "is_valid": true,
  "errors": [],
  "warnings": ["Found 3 unreplaced placeholders: webhook_path, api_endpoint, auth_method"],
  "suggestions": ["Replace placeholder values with actual configuration before deployment"],
  "platform_specific": {
    "platform": "n8n",
    "node_count": 2,
    "connection_count": 1,
    "has_trigger": true
  }
}
```

### 2. Export Workflow

**Endpoint:** `POST /api/workflows/{workflow_id}/export?platform=n8n&format=json`

**Response:** Downloads a file named `n8n_workflow_12345678_20250109_143022.json`

**Headers:**
- `Content-Disposition: attachment; filename="n8n_workflow_12345678_20250109_143022.json"`
- `X-Workflow-ID: 12345678`
- `X-Platform: n8n`
- `X-Validation-Status: valid`

## Example Validation Results

### Example 1: Valid n8n Workflow ✅

**Input:**
```json
{
  "name": "Gmail Alert Workflow",
  "nodes": [
    {
      "id": "webhook-1",
      "name": "Webhook Trigger",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 1,
      "position": [250, 300],
      "parameters": {
        "path": "alert-webhook"
      }
    },
    {
      "id": "gmail-1",
      "name": "Send Email",
      "type": "n8n-nodes-base.gmail",
      "typeVersion": 1,
      "position": [450, 300],
      "parameters": {
        "to": "admin@example.com",
        "subject": "Alert",
        "message": "This is an alert"
      }
    }
  ],
  "connections": {
    "Webhook Trigger": {
      "main": [[{"node": "Send Email", "type": "main", "index": 0}]]
    }
  },
  "active": false,
  "settings": {},
  "tags": []
}
```

**Validation Result:**
```
✅ Valid: true

📊 Platform-Specific Info:
   - platform: n8n
   - node_count: 2
   - connection_count: 1
   - has_trigger: true
```

---

### Example 2: Invalid n8n Workflow (Missing Required Fields) ❌

**Input:**
```json
{
  "name": "Invalid Workflow",
  "nodes": [
    {
      "name": "Test Node",
      "type": "n8n-nodes-base.webhook"
    }
  ]
}
```

**Validation Result:**
```
❌ Valid: false

❌ Errors (5):
   - Schema validation failed: 'connections' is a required property
   - Node 0: Missing required field 'id'
   - Node 0: Missing required field 'typeVersion'
   - Node 0: Missing required field 'position'
   - Missing required field: connections

💡 Suggestions (2):
   - Check field at path: 
   - Add 'connections' field to workflow JSON
```

---

### Example 3: n8n Workflow with Placeholders ⚠️

**Input:**
```json
{
  "name": "Workflow with Placeholders",
  "nodes": [
    {
      "id": "trigger-1",
      "name": "Trigger",
      "type": "n8n-nodes-base.webhookTrigger",
      "typeVersion": 1,
      "position": [250, 300],
      "parameters": {
        "path": "{{webhook_path}}",
        "httpMethod": "POST"
      }
    },
    {
      "id": "action-1",
      "name": "Action",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 1,
      "position": [450, 300],
      "parameters": {
        "url": "{{api_endpoint}}",
        "authentication": "{{auth_method}}"
      }
    }
  ],
  "connections": {
    "Trigger": {
      "main": [[{"node": "Action", "type": "main", "index": 0}]]
    }
  },
  "active": false,
  "settings": {},
  "tags": []
}
```

**Validation Result:**
```
✅ Valid: true

⚠️  Warnings (1):
   - Found 3 unreplaced placeholders: webhook_path, api_endpoint, auth_method

💡 Suggestions (1):
   - Replace placeholder values with actual configuration before deployment

📊 Platform-Specific Info:
   - platform: n8n
   - node_count: 2
   - connection_count: 1
   - has_trigger: true
```

---

### Example 4: Valid Make.com Scenario ✅

**Input:**
```json
{
  "name": "Email Alert Scenario",
  "flow": [
    {
      "id": 1,
      "module": "webhook:webhook",
      "version": 1,
      "parameters": {
        "hook": "alert-hook"
      },
      "metadata": {
        "designer": {"x": 0, "y": 0}
      }
    },
    {
      "id": 2,
      "module": "gmail:sendEmail",
      "version": 1,
      "parameters": {
        "to": "admin@example.com",
        "subject": "Alert"
      },
      "mapper": {
        "to": "{{1.email}}"
      },
      "metadata": {
        "designer": {"x": 300, "y": 0}
      }
    }
  ],
  "metadata": {
    "version": 1,
    "scenario": {
      "roundtrips": 1,
      "maxErrors": 3
    }
  }
}
```

**Validation Result:**
```
✅ Valid: true

📊 Platform-Specific Info:
   - platform: make
   - module_count: 2
   - scenario_name: Email Alert Scenario
   - has_metadata: true
```

---

### Example 5: Invalid Make.com Scenario (Missing Metadata) ❌

**Input:**
```json
{
  "name": "Invalid Scenario",
  "flow": [
    {
      "id": 1,
      "module": "webhook:webhook",
      "version": 1,
      "parameters": {}
    }
  ]
}
```

**Validation Result:**
```
❌ Valid: false

❌ Errors (1):
   - Schema validation failed: 'metadata' is a required property

💡 Suggestions (2):
   - Check field at path: 
   - Add 'metadata' field to scenario JSON
```

---

### Example 6: Valid Zapier Zap ✅

**Input:**
```json
{
  "title": "Email Alert Zap",
  "steps": [
    {
      "id": "trigger-step",
      "type": "trigger",
      "app": "webhook",
      "event": "catch_hook",
      "parameters": {
        "url": "https://hooks.zapier.com/alert"
      }
    },
    {
      "id": "action-step",
      "type": "action",
      "app": "gmail",
      "event": "send_email",
      "parameters": {
        "to": "admin@example.com",
        "subject": "Alert"
      }
    }
  ],
  "status": "draft"
}
```

**Validation Result:**
```
✅ Valid: true

📊 Platform-Specific Info:
   - platform: zapier
   - step_count: 2
   - zap_title: Email Alert Zap
   - trigger_count: 1
   - action_count: 1
```

---

### Example 7: Invalid Zapier Zap (Action as First Step) ❌

**Input:**
```json
{
  "title": "Invalid Zap",
  "steps": [
    {
      "id": "action-first",
      "type": "action",
      "app": "gmail",
      "event": "send_email",
      "parameters": {}
    }
  ],
  "status": "draft"
}
```

**Validation Result:**
```
❌ Valid: false

❌ Errors (2):
   - First step must be a trigger
   - Zap must have at least one trigger step

⚠️  Warnings (1):
   - Zap should have at least 2 steps (trigger + action)

💡 Suggestions (3):
   - Change the first step type to 'trigger'
   - Add trigger and action steps to the zap
   - Consider adding more action steps to create a functional zap
```

---

## Validation Schemas

### n8n Workflow Schema

```python
N8N_WORKFLOW_SCHEMA = {
    "type": "object",
    "required": ["name", "nodes", "connections"],
    "properties": {
        "name": {"type": "string", "minLength": 1},
        "nodes": {
            "type": "array",
            "minItems": 1,
            "items": {
                "type": "object",
                "required": ["name", "type", "typeVersion", "position", "id"],
                "properties": {
                    "name": {"type": "string"},
                    "type": {"type": "string"},
                    "typeVersion": {"type": "number"},
                    "position": {
                        "type": "array",
                        "items": {"type": "number"},
                        "minItems": 2,
                        "maxItems": 2
                    },
                    "id": {"type": "string"},
                    "parameters": {"type": "object"}
                }
            }
        },
        "connections": {"type": "object"},
        "active": {"type": "boolean"},
        "settings": {"type": "object"},
        "tags": {"type": "array"}
    }
}
```

### Make.com Workflow Schema

```python
MAKE_WORKFLOW_SCHEMA = {
    "type": "object",
    "required": ["name", "flow", "metadata"],
    "properties": {
        "name": {"type": "string", "minLength": 1},
        "flow": {
            "type": "array",
            "minItems": 1,
            "items": {
                "type": "object",
                "required": ["id", "module", "version", "parameters"],
                "properties": {
                    "id": {"type": "number"},
                    "module": {"type": "string"},
                    "version": {"type": "number"},
                    "parameters": {"type": "object"},
                    "mapper": {"type": "object"},
                    "metadata": {"type": "object"}
                }
            }
        },
        "metadata": {"type": "object"}
    }
}
```

### Zapier Zap Schema

```python
ZAPIER_ZAP_SCHEMA = {
    "type": "object",
    "required": ["title", "steps"],
    "properties": {
        "title": {"type": "string", "minLength": 1},
        "steps": {
            "type": "array",
            "minItems": 1,
            "items": {
                "type": "object",
                "required": ["id", "type", "app", "event"],
                "properties": {
                    "id": {"type": "string"},
                    "type": {"type": "string", "enum": ["trigger", "action"]},
                    "app": {"type": "string"},
                    "event": {"type": "string"},
                    "parameters": {"type": "object"}
                }
            }
        },
        "status": {"type": "string"}
    }
}
```

---

## Helper Functions

### check_placeholder_values()

Recursively scans workflow JSON for unreplaced placeholder values in the format `{{placeholder}}`.

**Example:**
```python
placeholders = check_placeholder_values(workflow)
# Returns: ['webhook_path', 'api_endpoint', 'auth_method']
```

### check_node_connections()

Verifies all nodes are properly connected. Returns list of disconnected node IDs/names.

**Platform-specific logic:**
- **n8n**: Checks connections object references valid node names
- **Make.com**: Checks if modules have proper mappers
- **Zapier**: Linear workflow, checks if there's more than one step

---

## Implementation Details

### Files Modified/Created

1. **app/utils/constants.py** - Added JSON schemas for all platforms
2. **app/services/validator.py** - Complete validation implementation
3. **app/api/routes/workflow.py** - Added validation and export endpoints
4. **app/api/dependencies.py** - Added WorkflowValidator dependency injection
5. **requirements.txt** - Added `jsonschema==4.20.0` and `pyyaml==6.0.1`

### Key Classes

#### WorkflowValidator

Main validation class with methods:
- `validate_workflow()` - Main validation entry point
- `_validate_n8n_workflow()` - n8n-specific validation
- `_validate_make_workflow()` - Make.com-specific validation
- `_validate_zapier_workflow()` - Zapier-specific validation
- `_validate_n8n_nodes()` - Validate n8n node structure
- `_validate_n8n_connections()` - Validate n8n connections
- `_validate_make_flow()` - Validate Make.com flow
- `_validate_zapier_steps()` - Validate Zapier steps
- `_validate_security()` - Security checks
- `_validate_performance()` - Performance checks

#### ValidationResult

Dataclass containing:
- `is_valid: bool` - Overall validation status
- `errors: List[str]` - Blocking errors
- `warnings: List[str]` - Non-blocking warnings
- `suggestions: List[str]` - Improvement suggestions
- `platform_specific: Optional[Dict]` - Platform-specific metadata

---

## Usage Examples

### Python Client

```python
from app.services.validator import WorkflowValidator

validator = WorkflowValidator()

# Validate workflow
result = await validator.validate_workflow(
    workflow_json=my_workflow,
    platform="n8n",
    strict=False
)

if result.is_valid:
    print("✅ Workflow is valid!")
else:
    print("❌ Validation failed:")
    for error in result.errors:
        print(f"  - {error}")
```

### HTTP API

```bash
# Validate workflow
curl -X POST http://localhost:8000/api/workflows/validate \
  -H "Content-Type: application/json" \
  -d '{
    "workflow_json": {...},
    "platform": "n8n",
    "strict": false
  }'

# Export workflow
curl -X POST "http://localhost:8000/api/workflows/12345/export?platform=n8n&format=json" \
  -o workflow.json
```

---

## Testing

Run the test suite:

```bash
cd automation-chatbot-backend
python test_validation_system.py
```

The test suite includes:
- ✅ Valid workflow for each platform
- ❌ Invalid workflows (missing required fields)
- ⚠️ Workflows with warnings (placeholders, disconnected nodes)
- Platform-specific rule violations

---

## Future Enhancements

- [ ] Database integration for storing/loading workflows
- [ ] Circular dependency detection
- [ ] Advanced security scanning
- [ ] Performance profiling
- [ ] Visual diff between workflow versions
- [ ] Batch validation for multiple workflows
- [ ] Custom validation rules via configuration

---

## Conclusion

The Workflow Validation and Export System provides comprehensive validation for all three major automation platforms with:

✅ **Complete schema validation** using jsonschema  
✅ **Platform-specific rules** enforcement  
✅ **Detailed error reporting** with actionable suggestions  
✅ **Warning vs. error distinction** (warnings don't block export)  
✅ **Export functionality** with validation pre-check  
✅ **Multiple format support** (JSON, YAML)  
✅ **Security and performance checks**  

The system is production-ready and can be easily extended with additional validation rules and platform support.

