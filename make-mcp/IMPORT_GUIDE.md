# Module Import Guide

## Quick Start

### 1. Prepare Your Modules JSON

Create a file with your modules (or edit `data/modules-input.json`):

```json
{
  "modules": [
    {
      "id": "app:ModuleName",
      "name": "Module Display Name",
      "app": "App Name",
      "type": "action",
      "description": "What this module does",
      "category": "Category",
      "parameters": [
        {
          "name": "parameterName",
          "type": "text",
          "required": true,
          "description": "Parameter description"
        }
      ]
    }
  ]
}
```

### 2. Run Import

```bash
# Install dependencies (if not already done)
npm install

# Import modules from default file (data/modules-input.json)
npm run import-modules

# Or import from custom file
npm run import-modules path/to/your-modules.json
```

### 3. Verify

```bash
# Start the MCP server
npm start

# The modules are now available via MCP tools!
```

---

## Module Object Schema

### Required Fields

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `id` | string | Unique module identifier | `"google-sheets:addRow"` |
| `name` | string | Display name | `"Add a Row"` |
| `app` | string | App/service name | `"Google Sheets"` |
| `type` | string | Module type | `"action"`, `"trigger"`, `"search"` |
| `description` | string | What the module does | `"Adds a new row..."` |
| `category` | string | Module category | `"Data & Storage"` |
| `parameters` | array | Parameter definitions | `[{...}]` |

### Optional Fields

| Field | Type | Description |
|-------|------|-------------|
| `icon_url` | string | URL to module icon |
| `documentation_url` | string | Link to docs |
| `is_premium` | boolean | Premium/paid module |

---

## Parameter Object Schema

### Required Fields

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `name` | string | Parameter name | `"spreadsheetId"` |
| `type` | string | Data type | `"text"`, `"number"`, `"boolean"`, `"array"`, `"object"`, `"select"` |
| `required` | boolean | Is required | `true` or `false` |

### Optional Fields

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `description` | string | Parameter description | `"The ID of the spreadsheet"` |
| `options` | array | For select types | `["GET", "POST", "PUT"]` |
| `default_value` | any | Default value | `"Sheet1"` |

---

## Module Types

- **`trigger`** - Starts a workflow (watches for events)
- **`action`** - Performs an action
- **`search`** - Searches for data
- **`router`** - Conditional branching
- **`aggregator`** - Combines multiple items

---

## Categories

Suggested categories:
- Core
- Communication
- Data & Storage
- Productivity
- CRM
- E-commerce
- Developer Tools
- Marketing
- Finance
- AI & ML

---

## Complete Example

```json
{
  "modules": [
    {
      "id": "http:ActionSendData",
      "name": "Make an HTTP Request",
      "app": "HTTP",
      "type": "action",
      "description": "Makes an HTTP request to any URL with custom headers and body",
      "category": "Core",
      "icon_url": "https://example.com/http-icon.png",
      "documentation_url": "https://make.com/help/http",
      "parameters": [
        {
          "name": "url",
          "type": "text",
          "required": true,
          "description": "The URL to send the request to"
        },
        {
          "name": "method",
          "type": "select",
          "required": true,
          "description": "HTTP method to use",
          "options": ["GET", "POST", "PUT", "PATCH", "DELETE"],
          "default_value": "GET"
        },
        {
          "name": "headers",
          "type": "array",
          "required": false,
          "description": "Custom HTTP headers"
        },
        {
          "name": "body",
          "type": "text",
          "required": false,
          "description": "Request body (for POST, PUT, PATCH)"
        },
        {
          "name": "timeout",
          "type": "number",
          "required": false,
          "description": "Request timeout in seconds",
          "default_value": 30
        }
      ]
    },
    {
      "id": "gateway:CustomWebhook",
      "name": "Custom Webhook",
      "app": "Webhooks",
      "type": "trigger",
      "description": "Receives data from external webhooks",
      "category": "Core",
      "parameters": [
        {
          "name": "webhookName",
          "type": "text",
          "required": false,
          "description": "Optional name for the webhook"
        }
      ]
    },
    {
      "id": "google-sheets:ActionAddRow",
      "name": "Add a Row",
      "app": "Google Sheets",
      "type": "action",
      "description": "Adds a new row to a Google Sheets spreadsheet",
      "category": "Data & Storage",
      "parameters": [
        {
          "name": "spreadsheetId",
          "type": "text",
          "required": true,
          "description": "The ID of the spreadsheet"
        },
        {
          "name": "sheetName",
          "type": "text",
          "required": true,
          "description": "Name of the sheet to add the row to",
          "default_value": "Sheet1"
        },
        {
          "name": "values",
          "type": "array",
          "required": true,
          "description": "Array of values for the new row"
        },
        {
          "name": "insertMode",
          "type": "select",
          "required": false,
          "description": "Where to insert the row",
          "options": ["append", "prepend"],
          "default_value": "append"
        }
      ]
    }
  ]
}
```

---

## Tips for Building Your Module List

### 1. Start with Core Modules (10-15 modules)
- HTTP Request
- Webhooks
- JSON Parser
- Text Parser
- Router
- Iterator
- Aggregator

### 2. Add Popular Apps (30-40 modules)
- Google Sheets (5-6 modules)
- Gmail (3-4 modules)
- Slack (3-4 modules)
- Airtable (4-5 modules)
- Google Drive (4-5 modules)

### 3. Add Your Most-Used Apps (20-30 modules)
- Apps you or your users work with frequently

### 4. Gradually Expand
- Add more modules as needed
- Can import multiple times (will update existing)

---

## How to Find Module Information

### Method 1: Make.com UI
1. Go to Make.com
2. Create a new scenario
3. Click "Add module"
4. Browse apps and modules
5. Click on a module to see its parameters
6. Document what you see

### Method 2: Make.com Help Center
- Visit: https://www.make.com/en/help
- Search for app (e.g., "Google Sheets")
- Documentation shows available modules

### Method 3: Export Existing Scenarios
1. Create scenarios using modules you need
2. Export the scenario JSON
3. Look at the `flow` array to see module structure
4. Extract module IDs and parameters

---

## Import Process

The import script will:

1. ✅ Read your JSON file
2. ✅ Validate each module
3. ✅ Insert into SQLite database
4. ✅ Create FTS5 search index
5. ✅ Generate documentation
6. ✅ Create example configurations
7. ✅ Calculate popularity scores
8. ✅ Print detailed summary

**Safe to run multiple times!** Will update existing modules.

---

## After Import

Your modules are now available via MCP tools:

```javascript
// Search for modules
search_make_modules("send email")
// Returns: [{id: "gmail:ActionSendEmail", name: "Send an Email", ...}]

// Get module details
get_module_essentials("gmail:ActionSendEmail")
// Returns: {parameters: [...], description: "..."}

// AI can now build scenarios dynamically!
```

---

## Troubleshooting

### "Module ID is required"
- Make sure each module has an `id` field
- Format: `"app:ModuleName"` (no spaces)

### "Invalid module type"
- Must be one of: `trigger`, `action`, `search`, `router`, `aggregator`

### "Failed to parse file"
- Check JSON syntax (use jsonlint.com)
- Ensure proper quotes and commas

### "File not found"
- Check file path
- Default location: `make-mcp/data/modules-input.json`

---

## Need Help?

1. Check the example file: `data/modules-input.json`
2. Run with `--help`: `npm run import-modules -- --help`
3. Review import output for specific errors

