# ✅ Python Import Script - No Build Tools Required!

## Why Python?

The Node.js version requires compiling `better-sqlite3`, which needs:
- Visual Studio Build Tools on Windows
- Compatible Node.js version (v20 or v22)

**The Python script works everywhere with zero compilation!**

---

## Usage

### Basic Import

```bash
cd make-mcp
python scripts/import_modules.py
```

This reads from `data/modules-input.json` by default.

### Custom File

```bash
python scripts/import_modules.py path/to/your-modules.json
```

---

## Requirements

- Python 3.7+
- No additional packages needed (uses standard library only!)

Check your Python version:
```bash
python --version
```

---

## What It Does

1. ✅ Creates SQLite database at `database/make.db`
2. ✅ Creates tables and FTS5 search index
3. ✅ Imports all modules from JSON
4. ✅ Updates existing modules (safe to run multiple times)
5. ✅ Shows detailed progress and summary

---

## Example Output

```
🔄 Starting module import from: D:\...\modules-input.json

📊 Found 7 modules to import

[1/7] Processing: Get a File (http:ActionGetFile)
  📝 Imported 1 parameters
  ✅ Imported successfully

[2/7] Processing: Make a Request (Basic Auth) (http:ActionSendDataBasicAuth)
  📝 Imported 6 parameters
  ✅ Imported successfully

...

============================================================
📊 IMPORT SUMMARY
============================================================
Total modules:     7
✅ Imported:       7
🔄 Updated:        0
❌ Failed:         0
============================================================

✨ Import complete!

📈 DATABASE STATISTICS:
  Total modules:   7
  Total apps:      1
  Total params:    27
```

---

## After Import

Your database is ready! You can now:

### Start the MCP server
```bash
npm start
```

### Use with Docker
```bash
docker build -t make-mcp .
docker run -p 3002:3002 make-mcp
```

### Query the database directly
```bash
sqlite3 database/make.db
```

```sql
-- List all modules
SELECT module_name, app_name, module_type FROM make_modules;

-- Search modules
SELECT module_name FROM make_modules_fts WHERE make_modules_fts MATCH 'http request';

-- Get parameters for a module
SELECT m.module_name, p.parameter_name, p.parameter_type, p.is_required
FROM make_modules m
JOIN make_parameters p ON m.id = p.module_id
WHERE m.module_name = 'http:ActionSendData';
```

---

## Advantages of Python Script

✅ Works on Windows without Visual Studio  
✅ Works with any Node.js version (even v24!)  
✅ No compilation or build tools needed  
✅ Same database format as Node.js version  
✅ Can run even if npm install failed  

---

## Database Compatibility

The Python script creates the **exact same database structure** as the Node.js version:

- ✅ Same schema
- ✅ Same FTS5 indexes
- ✅ Same triggers
- ✅ Compatible with Node.js MCP server

You can use Python to populate the database, then run the Node.js MCP server!

---

## Workflow

```
1. Edit data/modules-input.json (add your modules)
2. Run: python scripts/import_modules.py
3. Database created at database/make.db
4. Start MCP server: npm start (or Docker)
5. AI can now use your modules!
```

---

## Need to Add More Modules?

Just edit `data/modules-input.json` and run the script again. It will:
- Add new modules
- Update existing modules
- Never delete anything

Safe to run as many times as you want!

---

**That's it! No build tools, no compilation, just works!** 🚀

