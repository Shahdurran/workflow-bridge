# Make-MCP

Model Context Protocol (MCP) server for Make.com workflow automation. Provides AI assistants with comprehensive access to Make.com module documentation, parameters, and templates.

## ✨ Latest Update: Complete Feature Parity with n8n-MCP! 🎉

**Make-MCP now has 100% feature parity with n8n-MCP including complete test coverage!** 

### What's New 🎉
- ✅ **23 Comprehensive MCP Tools** - Full scenario lifecycle management
- ✅ **Essential Services** - ScenarioDiffEngine, MakeApiClient, ExpressionValidator, Templates
- ✅ **Diff-Based Updates** - Safe, incremental scenario modifications
- ✅ **Template Management** - Search, convert, and deploy Make.com templates
- ✅ **Scenario Execution** - Trigger and manage scenario runs via API
- ✅ **83 Tests (100% passing)** - Comprehensive test suite with integration tests
- ✅ **Enhanced Auto-Fix** - Detailed reporting with confidence levels
- ✅ **Production Ready** - HTTP mode, auth, SSRF protection, rate limiting

📊 [Feature Parity Report →](./FEATURE_PARITY_REPORT.md)  
📖 [Complete Implementation →](./RESUME_FROM_HERE.md)  
🎯 [Test Suite Summary →](./TEST_SUITE_SUMMARY.md)  
🔧 [Phase 4 Services →](./PHASE4_ESSENTIAL_SERVICES_COMPLETE.md)

## Features

### Core Features
- 🔍 **Module Search**: Full-text search across Make.com modules
- 📖 **Module Documentation**: Detailed parameter schemas and descriptions
- ✅ **Scenario Validation**: Validate Make scenarios before deployment (20+ checks)
- 🔧 **Smart AutoFix**: Auto-fix scenarios to 100% Make.com compliance ⭐
- 🎯 **Template Library**: Access to curated Make scenario templates
- ⚡ **Fast Response**: SQLite-powered queries with <100ms response time
- 🗺️ **Data Mapping**: Auto-generates `{{moduleId.field}}` syntax for data flow

### Production Features ✨ NEW
- 🌐 **HTTP Mode**: Production-ready HTTP server with multi-session support
- 🔐 **Authentication**: Token-based authentication for secure access
- 🛡️ **SSRF Protection**: Built-in security with 3 protection modes
- 📊 **Health Checks**: Monitoring endpoints for production deployment
- 🏢 **Multi-Tenancy**: Support for multiple Make.com instances
- 📚 **Library Mode**: Embed as library in your Node.js applications
- 🔄 **Session Management**: Automatic cleanup and resource management
- ⚡ **Rate Limiting**: 1000 requests per 15 minutes per IP

## Quick Start

### Installation

```bash
npm install
npm run build
npm run rebuild  # Initialize database
```

### Running the Server

```bash
# Stdio mode (for local Claude Desktop)
npm start

# HTTP mode (for remote/production deployment) ✨ NEW
npm run start:http

# With environment variables
MCP_MODE=http PORT=3002 AUTH_TOKEN=your-secret npm start
```

### As a Library ✨ NEW

```typescript
import { MakeMCPEngine, InstanceContext } from 'make-mcp';

const engine = new MakeMCPEngine({
  logLevel: 'info',
  sessionTimeout: 30 * 60 * 1000,
});

// Embed in your Express app
app.post('/mcp', async (req, res) => {
  const context: InstanceContext = {
    makeApiUrl: 'https://eu2.make.com',
    makeApiToken: userApiToken,
    instanceId: userId,
  };
  await engine.processRequest(req, res, context);
});
```

## Project Structure

```
make-mcp/
├── src/
│   ├── database/           # Database schema and repository
│   ├── scrapers/           # Documentation scrapers
│   ├── services/           # Business logic (validation, search)
│   ├── mcp/                # MCP server and tools
│   └── index.ts            # Entry point
├── data/
│   ├── priority-modules.json  # Priority modules list
│   └── make-modules.db        # SQLite database (generated)
└── tests/                  # Test suite
```

## Available MCP Tools (23 Total)

### Module Discovery (10 tools)
- `search_make_modules` - Search modules by name or functionality
- `get_module_essentials` - Get detailed module information
- `get_modules_by_app` - List all modules for a specific app
- `get_popular_modules` - Get most frequently used modules
- `suggest_modules_for_intent` - AI-powered module recommendations
- `get_module_by_name` - Get module by exact name
- `get_module_parameters` - Get module parameter details
- `get_module_categories` - List module categories
- `search_by_category` - Search modules by category
- `get_database_statistics` - View module coverage statistics

### Scenario Management (9 tools) ✨ NEW
- `make_create_scenario` - Create new scenarios via API
- `make_update_partial_scenario` - Apply diff operations to scenarios
- `make_execute_scenario` - Trigger scenario executions
- `make_get_scenario` - Fetch scenario details with validation
- `make_list_scenarios` - List scenarios with filters
- `make_delete_scenario` - Remove scenarios
- `make_clone_scenario` - Clone existing scenarios
- `make_activate_scenario` - Activate scenarios
- `make_deactivate_scenario` - Deactivate scenarios

### Template Management (3 tools) ✨ NEW
- `make_search_templates` - Search template library
- `make_get_template_detail` - Get template details
- `make_template_to_scenario` - Convert template to scenario

### Documentation (1 tool) ✨ NEW
- `tools_documentation` - Self-documenting API with examples

## Why Make-MCP?

### 🎯 100% Make.com Compliant Output

Transform simple scenarios into production-ready Make.com JSON:

**Before (AI-generated):**
```json
{
  "name": "Webhook to HTTP",
  "flow": [
    { "id": 1, "module": "gateway:CustomWebHook" },
    { "id": 2, "module": "http:ActionSendData", 
      "parameters": { "url": "...", "body": "data" } }
  ]
}
```

**After AutoFix:**
```json
{
  "name": "Webhook to HTTP",
  "flow": [...with version, mapper, metadata...],
  "metadata": {
    "instant": true,              // ✅ Auto-detected
    "version": 1,                 // ✅ Added
    "scenario": {...},            // ✅ 10 settings
    "designer": {"orphans": []},  // ✅ Added
    "zone": "eu2.make.com",      // ✅ Added  
    "notes": []                   // ✅ Added
  }
}
```

**Result:** Ready to import into Make.com! 🎉

### 🎯 Enhanced Auto-Fix Example

```typescript
// Basic usage with detailed reporting
const result = await mcp.call_tool('autofix_make_scenario', {
  scenario: myScenario
});

console.log(result.fixReport.summary);
// "Fixed 8 issues: 6 metadata, 1 mapper, 1 coordinates"

// With options for granular control
const result = await mcp.call_tool('autofix_make_scenario', {
  scenario: myScenario,
  options: {
    confidenceThreshold: 'high',  // Only HIGH confidence fixes
    fixTypes: ['metadata', 'mapper'],  // Specific types
    applyFixes: true  // Apply or preview
  }
});

// See detailed fix report
result.fixReport.fixes.forEach(fix => {
  console.log(`${fix.module}.${fix.field}: ${fix.description}`);
  console.log(`  Confidence: ${fix.confidence}`);
  console.log(`  Before: ${fix.before}`);
  console.log(`  After: ${fix.after}`);
});
```

📖 [See Full Guide →](./ENHANCED_AUTOFIX_GUIDE.md)

## Development

```bash
# Watch mode
npm run dev

# Run tests (83 tests, 100% passing) ✨
npm test
npm run test:watch  # Watch mode
npm test -- --coverage  # With coverage report

# Scrape documentation
npm run scrape

# Rebuild database
npm run rebuild
```

## Configuration

### Claude Desktop Setup

Add to your Claude Desktop configuration file:

**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`  
**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`  
**Linux**: `~/.config/claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "make-mcp": {
      "command": "node",
      "args": ["C:\\path\\to\\make-mcp\\dist\\index.js"],
      "env": {
        "MCP_MODE": "stdio",
        "LOG_LEVEL": "info",
        "MAKE_API_URL": "https://us1.make.com",
        "MAKE_API_TOKEN": "your-make-api-token",
        "MAKE_ORGANIZATION_ID": "your-org-id",
        "MAKE_TEAM_ID": "your-team-id"
      }
    }
  }
}
```

See `claude-desktop-config.example.json` for a complete example.

### Environment Variables

Environment variables (see `.env.example`):

- `MCP_MODE`: Server mode (stdio/http)
- `PORT`: HTTP server port (default: 3002)
- `AUTH_TOKEN`: Authentication token for HTTP mode
- `LOG_LEVEL`: Logging level (debug/info/warn/error)
- `MAKE_API_URL`: Make.com API base URL (e.g., https://us1.make.com)
- `MAKE_API_TOKEN`: Your Make.com API token
- `MAKE_ORGANIZATION_ID`: Your Make.com organization ID
- `MAKE_TEAM_ID`: Your Make.com team ID
- `WEBHOOK_SECURITY_MODE`: SSRF protection (strict/moderate/permissive)
- `NODE_ENV`: Environment (production/development)

## Advanced Usage

### Using Services Programmatically ✨ NEW

```typescript
// Scenario Diff Engine - Apply incremental updates
import { ScenarioDiffEngine } from 'make-mcp';
const engine = new ScenarioDiffEngine();
const result = await engine.applyDiff(scenario, {
  operations: [
    { type: 'updateName', name: 'New Name' },
    { type: 'addModule', module: {...}, position: 2 },
    { type: 'updateModule', moduleId: 1, updates: {...} }
  ]
});

// Make API Client - Interact with Make.com API
import { MakeApiClient } from 'make-mcp';
const client = new MakeApiClient({
  baseUrl: 'https://us1.make.com',
  apiToken: process.env.MAKE_API_TOKEN
});
const scenarios = await client.listScenarios();
await client.executeScenario('scenario-123');

// Expression Validator - Validate {{moduleId.field}} syntax
import { ExpressionValidator } from 'make-mcp';
const result = ExpressionValidator.validateExpression('{{1.name}}', scenario);
console.log(result.valid, result.errors);

// Template Service - Search and convert templates
import { TemplateService } from 'make-mcp';
const templates = await templateService.searchTemplates({ 
  query: 'slack notification',
  category: 'Communication' 
});
const scenario = await templateService.templateToScenario('template-123');
```

### Complete Scenario Workflow Example

```typescript
// 1. Search for modules
const modules = await mcp.call_tool('search_make_modules', {
  query: 'slack webhook'
});

// 2. Create a scenario
const scenario = await mcp.call_tool('make_create_scenario', {
  scenario: { name: 'Slack Alert', flow: [...] },
  teamId: 'team-123'
});

// 3. Update scenario incrementally
await mcp.call_tool('make_update_partial_scenario', {
  scenarioId: scenario.id,
  operations: [
    { type: 'addModule', module: {...} },
    { type: 'updateMetadata', metadata: {...} }
  ]
});

// 4. Execute the scenario
await mcp.call_tool('make_execute_scenario', {
  scenarioId: scenario.id
});

// 5. Activate for production
await mcp.call_tool('make_activate_scenario', {
  scenarioId: scenario.id
});
```

## Database Schema

The SQLite database includes:

- `make_modules`: Core module information
- `make_templates`: Scenario templates
- `module_parameters`: Detailed parameter definitions
- `module_categories`: Organization categories
- Full-text search indexes for fast queries

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests
5. Submit a pull request

## License

MIT License

