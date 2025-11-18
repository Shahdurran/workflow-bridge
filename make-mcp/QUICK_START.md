# Make-MCP Quick Start Guide

This guide will help you get Make-MCP up and running in minutes.

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- TypeScript knowledge (basic)

## Installation

```bash
# 1. Navigate to make-mcp directory
cd make-mcp

# 2. Install dependencies
npm install

# 3. Build TypeScript
npm run build

# 4. Initialize database with priority modules
npm run rebuild
```

Expected output from rebuild:
```
🔨 Rebuilding Make-MCP database...

Starting module scraping...
Scraping HTTP...
  ✓ Scraped 3 modules
Scraping Webhooks...
  ✓ Scraped 2 modules
...

✅ Scraping complete! Total modules: 120

Final database state:
  Modules: 120
  Apps: 20
  Categories: 10
```

## Running the Server

### Option 1: Stdio Mode (for Claude Desktop)

```bash
npm start
```

### Option 2: Test the Database

```bash
# Open Node REPL
node

# Then run:
const { ModuleRepository } = require('./dist/database/module-repository.js');
const repo = new ModuleRepository();
console.log(repo.getStats());
console.log(repo.searchModules('http request', 5));
```

## Claude Desktop Configuration

Add to your Claude Desktop config file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "make-mcp": {
      "command": "node",
      "args": ["D:/workflow bridge/workflow-bridge/make-mcp/dist/index.js"],
      "env": {
        "MCP_MODE": "stdio",
        "LOG_LEVEL": "error"
      }
    }
  }
}
```

**Important**: Update the path to match your actual make-mcp location!

## Testing the MCP Tools

Once connected to Claude, try these commands:

1. **Search for modules**:
   ```
   Search for Google Sheets modules in make-mcp
   ```

2. **Get module details**:
   ```
   Get details for the http:ActionSendData module
   ```

3. **Validate a scenario**:
   ```
   Validate this Make scenario: {"name": "Test", "flow": [...]}
   ```

4. **Get statistics**:
   ```
   Show me make-mcp database statistics
   ```

## Common Issues

### Issue: "Cannot find module"
**Solution**: Run `npm run build` to compile TypeScript

### Issue: "Database not found"
**Solution**: Run `npm run rebuild` to initialize the database

### Issue: "better-sqlite3 compilation error"
**Solution**: 
```bash
npm rebuild better-sqlite3
# or
npm install --build-from-source better-sqlite3
```

### Issue: Claude Desktop doesn't see the server
**Solution**: 
1. Check the path in claude_desktop_config.json
2. Restart Claude Desktop
3. Check Claude Desktop logs for errors

## Next Steps

1. **Phase 1 Complete** ✅ Make-MCP is now functional with 100+ modules
2. **Phase 2 Next**: Build the Universal Translator service
3. **Phase 3**: Integrate with your Python backend

## Development

```bash
# Watch mode for development
npm run dev

# Run tests (coming soon)
npm test

# Update modules
npm run scrape
```

## Architecture Overview

```
make-mcp/
├── src/
│   ├── database/        # SQLite database and repository
│   ├── scrapers/        # Module documentation scrapers
│   ├── services/        # Business logic
│   ├── mcp/             # MCP server and tools
│   └── index.ts         # Entry point
├── data/
│   └── make-modules.db  # SQLite database (generated)
└── dist/                # Compiled JavaScript (generated)
```

## Support

- Check README.md for detailed documentation
- Review the execution plan for Phase 2 details
- Open issues for bugs or feature requests

---

**Status**: ✅ Make-MCP MVP Ready
**Next**: Universal Translator (Week 3-4)

