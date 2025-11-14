# Workflow Validation System - Quick Start Guide

## 🚀 Quick Start

### Installation

1. Install dependencies:
```bash
pip install -r requirements.txt
```

Required packages:
- `jsonschema==4.20.0` - For JSON schema validation
- `pyyaml==6.0.1` - For YAML export support (optional)

### Basic Usage

#### 1. Validate a Workflow

```python
from app.services.validator import WorkflowValidator

# Initialize validator
validator = WorkflowValidator()

# Your workflow JSON
workflow = {
    "name": "My Workflow",
    "nodes": [...],
    "connections": {...}
}

# Validate
result = await validator.validate_workflow(
    workflow_json=workflow,
    platform="n8n"  # or "make", "zapier"
)

# Check results
if result.is_valid:
    print("✅ Valid!")
else:
    print("❌ Errors:", result.errors)
    print("⚠️ Warnings:", result.warnings)
```

#### 2. Use the REST API

**Validate Endpoint:**
```bash
POST /api/workflows/validate
Content-Type: application/json

{
  "workflow_json": { ... },
  "platform": "n8n",
  "strict": false
}
```

**Export Endpoint:**
```bash
POST /api/workflows/{workflow_id}/export?platform=n8n&format=json
```

Downloads a file with your validated workflow.

---

## 📋 Validation Checklist

The validator checks for:

### Required Fields
- ✅ Workflow name/title present
- ✅ Nodes/modules/steps array exists and not empty
- ✅ Connections/metadata present (platform-specific)

### Structure Validation
- ✅ Valid JSON structure
- ✅ Correct data types
- ✅ Required node/module/step fields
- ✅ Valid position arrays (n8n)
- ✅ Sequential IDs (Make.com)
- ✅ First step is trigger (Zapier)

### Content Validation
- ⚠️ Unreplaced placeholders detected
- ⚠️ Disconnected nodes/modules
- ⚠️ Missing trigger nodes
- ⚠️ Large workflow warnings

### Security & Performance
- ⚠️ Hardcoded credentials detected
- ⚠️ Workflow size warnings

---

## 🎯 Common Validation Issues

### Issue 1: Missing Required Fields

**Error:**
```
❌ Missing required field: connections
```

**Solution:**
Add the missing field to your workflow JSON.

---

### Issue 2: Invalid Node Structure

**Error:**
```
❌ Node 0: Missing required field 'id'
```

**Solution:**
Ensure all nodes have required fields: `id`, `name`, `type`, `typeVersion`, `position`.

---

### Issue 3: Schema Validation Failed

**Error:**
```
❌ Schema validation failed: 'metadata' is a required property
```

**Solution:**
Check the platform-specific schema requirements and add the missing property.

---

### Issue 4: Placeholders Not Replaced

**Warning:**
```
⚠️ Found 3 unreplaced placeholders: webhook_path, api_endpoint, auth_method
```

**Solution:**
Replace `{{placeholder}}` values with actual configuration before deployment.
This is a warning and won't block export.

---

## 📝 Platform-Specific Requirements

### n8n
- ✅ Required: `name`, `nodes`, `connections`
- ✅ Each node needs: `id`, `name`, `type`, `typeVersion`, `position`
- ✅ Position must be array of 2 numbers: `[x, y]`

### Make.com
- ✅ Required: `name`, `flow`, `metadata`
- ✅ Each module needs: `id`, `module`, `version`, `parameters`
- ✅ IDs should be sequential integers starting from 1

### Zapier
- ✅ Required: `title`, `steps`
- ✅ Each step needs: `id`, `type`, `app`, `event`
- ✅ First step MUST be type `trigger`
- ✅ Step type must be either `trigger` or `action`

---

## 🔧 Advanced Features

### Strict Mode

Enable strict validation for additional checks:

```python
result = await validator.validate_workflow(
    workflow_json=workflow,
    platform="n8n",
    strict=True  # Enables performance and security checks
)
```

### Export with Validation

The export endpoint automatically validates before exporting:

```python
# Validation happens automatically
# Export is blocked only on errors, not warnings
response = await export_workflow_endpoint(
    workflow_id="12345",
    platform="n8n",
    format="json"
)
```

### Helper Functions

```python
from app.services.validator import check_placeholder_values, check_node_connections

# Check for placeholders
placeholders = check_placeholder_values(workflow)
# Returns: ['webhook_path', 'api_endpoint']

# Check for disconnected nodes
disconnected = check_node_connections(workflow, "n8n")
# Returns: ['Node3', 'Node5']
```

---

## 📊 Response Format

### ValidationResult

```python
@dataclass
class ValidationResult:
    is_valid: bool              # Overall validation status
    errors: List[str]           # Blocking errors
    warnings: List[str]         # Non-blocking warnings
    suggestions: List[str]      # Improvement suggestions
    platform_specific: Dict     # Platform metadata
```

### Example Response

```json
{
  "is_valid": true,
  "errors": [],
  "warnings": [
    "Found 2 unreplaced placeholders: api_key, endpoint"
  ],
  "suggestions": [
    "Replace placeholder values before deployment"
  ],
  "platform_specific": {
    "platform": "n8n",
    "node_count": 3,
    "connection_count": 2,
    "has_trigger": true
  }
}
```

---

## 🧪 Testing

Run the test suite to see validation in action:

```bash
cd automation-chatbot-backend
python test_validation_system.py
```

Tests include:
- ✅ Valid workflows for all platforms
- ❌ Invalid workflows with various errors
- ⚠️ Workflows with warnings
- Platform-specific rule violations

---

## 💡 Tips

1. **Warnings Don't Block Export** - Warnings are informational only. Your workflow can still be exported.

2. **Check Suggestions** - The `suggestions` field provides actionable advice for fixing issues.

3. **Use Strict Mode in Development** - Enable strict mode during development to catch potential issues early.

4. **Validate Before Deployment** - Always validate workflows before deploying to production.

5. **Replace Placeholders** - Don't deploy workflows with unreplaced placeholders like `{{api_key}}`.

---

## 📚 Full Documentation

For complete examples and detailed validation results, see:
- [VALIDATION_SYSTEM_DEMO.md](VALIDATION_SYSTEM_DEMO.md) - Full demonstration with examples
- [test_validation_system.py](test_validation_system.py) - Test suite with sample workflows

---

## 🆘 Support

If you encounter validation issues:

1. Check the error message and suggestions
2. Review platform-specific requirements
3. Verify your workflow structure matches the schema
4. Check the example workflows in the demo file

For platform schema details, see `app/utils/constants.py`.

