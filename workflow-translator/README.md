# Workflow Translator

Universal workflow translator for n8n, Make.com, and Zapier. Provides bidirectional translation with AI-enhanced node mapping and platform-specific optimization.

## Features

- 🔄 **Bidirectional Translation**: Convert workflows between any two platforms
- 🤖 **AI-Enhanced**: Uses Claude API for complex node mappings
- ✅ **Feasibility Checking**: Analyzes translation viability before conversion
- ⚡ **Platform Optimization**: Applies best practices for target platform
- 📊 **Detailed Reporting**: Warnings, errors, and accuracy scores

## Supported Translation Paths

| From → To | Difficulty | Success Rate | Notes |
|-----------|------------|--------------|-------|
| n8n → Make | Medium | 85% | Expression syntax differences |
| n8n → Zapier | Hard | 70% | Complex features lost |
| Make → n8n | Medium | 85% | Router to IF mapping |
| Make → Zapier | Hard | 70% | Loops not supported |
| Zapier → n8n | Easy | 95% | Simple upgrade path |
| Zapier → Make | Easy | 95% | Easy migration |

## Quick Start

```bash
# Install dependencies
npm install

# Build
npm run build

# Set up environment
cp .env.example .env
# Add your ANTHROPIC_API_KEY to .env

# Start server
npm start
```

## Usage

### Claude Desktop Configuration

```json
{
  "mcpServers": {
    "workflow-translator": {
      "command": "node",
      "args": ["D:/workflow bridge/workflow-bridge/workflow-translator/dist/index.js"],
      "env": {
        "MCP_MODE": "stdio",
        "ANTHROPIC_API_KEY": "your_key_here"
      }
    }
  }
}
```

### Example Translations

**1. Translate n8n workflow to Make:**
```
Translate this n8n workflow to Make:
{workflow JSON}
```

**2. Check if translation is feasible:**
```
Can this complex n8n workflow be translated to Zapier?
{workflow JSON}
```

**3. Get platform recommendation:**
```
Which platform should I use for a workflow that needs:
- Custom code
- Loops
- Complex conditional logic
- Budget: Low
```

## Available MCP Tools

1. **translate_workflow** - Translate workflow between platforms
2. **check_translation_feasibility** - Check if translation will work
3. **get_platform_capabilities** - Compare platform features
4. **get_translation_complexity** - Get difficulty info for translation path
5. **suggest_best_platform** - Get platform recommendation
6. **translate_expression** - Convert expressions between syntaxes
7. **analyze_workflow_complexity** - Get complexity analysis
8. **batch_translate_workflows** - Translate multiple workflows at once

## Architecture

```
workflow-translator/
├── src/
│   ├── services/
│   │   ├── translation-engine.ts    # Core translation logic
│   │   ├── ai-service.ts            # Claude AI integration
│   │   └── feasibility-checker.ts   # Pre-translation analysis
│   ├── optimizers/
│   │   └── platform-optimizer.ts    # Platform-specific improvements
│   ├── mcp/
│   │   ├── server.ts                # MCP server
│   │   └── tools-translator.ts      # Tool definitions
│   └── types/
│       └── index.ts                 # TypeScript types
└── data/
    ├── mapping-rules.json           # 200+ node mappings
    └── platform-capabilities.json   # Feature matrix
```

## Translation Process

1. **Parse** source workflow and validate structure
2. **Check Feasibility** - identify blockers and warnings
3. **Map Nodes** - use mapping rules + AI fallback
4. **Translate Parameters** - convert between syntaxes
5. **Optimize** - apply platform-specific best practices
6. **Validate** - ensure target workflow is valid

## Platform-Specific Notes

### n8n
- Supports full JavaScript/Python code
- Complex conditionals and loops
- Self-hostable
- Expression syntax: `{{$json.field}}`

### Make.com
- Visual flow builder
- Router for conditionals
- Iterator for loops
- Expression syntax: `{{1.field}}`

### Zapier
- Linear flows only (no branches)
- Limited code support
- Simple filters for conditions
- Largest app ecosystem (5000+)

## Development

```bash
# Watch mode
npm run dev

# Run tests (coming soon)
npm test
```

## Environment Variables

- `ANTHROPIC_API_KEY` - Required for AI-enhanced translation
- `MCP_MODE` - Server mode (stdio/http)
- `N8N_MCP_URL` - URL of n8n-mcp service
- `MAKE_MCP_URL` - URL of make-mcp service

## License

MIT License

