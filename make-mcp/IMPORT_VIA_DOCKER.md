# Import Modules via Docker (Windows Workaround)

## Problem
`better-sqlite3` requires Visual Studio Build Tools on Windows, and Node v24 doesn't have prebuilt binaries.

## Solution: Use Docker

### Step 1: Make sure Docker is installed and running

```bash
docker --version
```

### Step 2: Build the Docker image

```bash
cd make-mcp
docker build -t make-mcp .
```

### Step 3: Run the import in Docker

```bash
docker run --rm -v "${PWD}/data:/app/data" -v "${PWD}/database:/app/database" make-mcp node dist/scripts/import-modules.js
```

This will:
- Run the import script inside Docker (which has the correct build tools)
- Mount your `data/modules-input.json` file
- Mount your `database/` folder to save the result
- The database will be available on your host machine after import

### Step 4: Use the database

The database is now at `make-mcp/database/make.db` and can be used by the MCP server running in Docker or locally.

---

## Alternative: Use Node v20 or v22

If you don't want to use Docker, downgrade to Node v20 or v22:

### Install NVM for Windows
https://github.com/coreybutler/nvm-windows

### Switch Node version

```bash
nvm install 20
nvm use 20
cd make-mcp
npm install
npm run import-modules
```

Then switch back to Node v24 if needed:

```bash
nvm use 24
```

The database will work with any Node version once created!

