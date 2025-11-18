# 🚀 Quick Import Guide - 3 Steps Only!

## Step 1: Add Your Modules to JSON

Edit `make-mcp/data/modules-input.json` and add your modules:

```json
{
  "modules": [
    {
      "id": "google-sheets:addRow",
      "name": "Add a Row",
      "app": "Google Sheets",
      "type": "action",
      "description": "Adds a new row to a spreadsheet",
      "category": "Data & Storage",
      "parameters": [
        {
          "name": "spreadsheetId",
          "type": "text",
          "required": true,
          "description": "The spreadsheet ID"
        },
        {
          "name": "values",
          "type": "array",
          "required": true,
          "description": "Values to add"
        }
      ]
    }
  ]
}
```

## Step 2: Run Import

**Option A: Python (Recommended for Windows)**
```bash
cd make-mcp
python scripts/import_modules.py
```

**Option B: Node.js (Requires Node v20/v22 or Visual Studio Build Tools)**
```bash
cd make-mcp
npm run import-modules
```

## Step 3: Done! ✅

Your modules are now in the database and ready to use!

---

## What You Need for Each Module

**Minimum Required:**
```json
{
  "id": "app:moduleName",           // Unique ID
  "name": "Display Name",            // Human-readable name
  "app": "App Name",                 // Which app (Google Sheets, Gmail, etc)
  "type": "action",                  // trigger, action, search, router, aggregator
  "description": "What it does",     // Clear description
  "category": "Category",            // Core, Communication, Data & Storage, etc
  "parameters": []                   // List of parameters (can be empty array)
}
```

**For Each Parameter:**
```json
{
  "name": "paramName",               // Parameter name
  "type": "text",                    // text, number, boolean, array, object, select
  "required": true,                  // true or false
  "description": "What this is for"  // Optional but helpful
}
```

---

## Module Types

- **`trigger`** = Starts workflows (watches for events)
- **`action`** = Does something (sends email, adds row, etc)
- **`search`** = Finds data
- **`router`** = Conditional branching
- **`aggregator`** = Combines data

---

## Parameter Types

- **`text`** = String/text input
- **`number`** = Numeric value
- **`boolean`** = True/false
- **`array`** = List of items
- **`object`** = JSON object
- **`select`** = Dropdown (add `options` array)

---

## Example with Everything

```json
{
  "id": "http:makeRequest",
  "name": "Make an HTTP Request",
  "app": "HTTP",
  "type": "action",
  "description": "Makes an HTTP request to any URL",
  "category": "Core",
  "parameters": [
    {
      "name": "url",
      "type": "text",
      "required": true,
      "description": "URL to call"
    },
    {
      "name": "method",
      "type": "select",
      "required": true,
      "description": "HTTP method",
      "options": ["GET", "POST", "PUT", "DELETE"],
      "default_value": "GET"
    },
    {
      "name": "headers",
      "type": "array",
      "required": false,
      "description": "Request headers"
    }
  ]
}
```

---

## Troubleshooting

**❌ "Module ID is required"**
→ Add an `id` field

**❌ "Invalid module type"**
→ Use: trigger, action, search, router, or aggregator

**❌ "File not found"**
→ Make sure file is at `make-mcp/data/modules-input.json`

**❌ "Failed to parse"**
→ Check JSON syntax at jsonlint.com

---

## After Import

Test your modules:

```bash
# Start the MCP server
npm start

# Or test in Claude Desktop by adding to config
```

Your modules are now searchable and usable by AI!

```
AI: search_make_modules("add row")
→ Finds your "google-sheets:addRow" module

AI: get_module_essentials("google-sheets:addRow")
→ Gets all parameters you defined

AI: Builds workflow dynamically!
```

---

**That's it!** 🎉

See `IMPORT_GUIDE.md` for advanced options and complete documentation.

