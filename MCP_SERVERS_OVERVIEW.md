# 🔌 MCP Servers Overview - Workflow Bridge

This document provides an overview of all Model Context Protocol (MCP) servers configured or available for your Workflow Bridge project.

---

## 📊 Current MCP Configuration

Location: `C:\Users\shahd\.cursor\mcp.json`

### ✅ Configured MCP Servers:

#### 1. **Supabase MCP** ⭐ ACTIVE
- **Purpose:** Direct database access from Cursor AI
- **Status:** Configured (needs service role key)
- **Port:** N/A (uses npx)
- **Command:** `npx -y @modelcontextprotocol/server-supabase`

**Capabilities:**
- Query database tables
- Insert/Update/Delete records
- Schema inspection
- SQL execution
- Storage operations

**Setup Required:**
- Add your Supabase service role key to `mcp.json`
- See: `SUPABASE_MCP_SETUP.md`

---

## 🔮 Available MCP Servers (Not Yet Configured)

### 2. **n8n MCP** 
- **Purpose:** n8n workflow automation integration
- **Status:** Can be installed separately
- **Port:** 3001 (HTTP mode)
- **Location:** `D:\workflow bridge\n8n-mcp` (after setup)

**Capabilities:**
- Search n8n nodes
- Get node documentation
- Search workflow templates
- Validate workflows
- Create workflow JSON

**Setup:**
```powershell
.\SETUP_N8N_MCP.ps1
```
**See:** `QUICK_START_N8N.md`

---

### 3. **Filesystem MCP** (Recommended)
- **Purpose:** File operations from AI
- **Status:** Not configured
- **Built-in:** Part of MCP standard servers

**Capabilities:**
- Read/write files
- List directories
- Search file contents
- Move/rename files
- Get file metadata

**Configuration:**
```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "D:\\workflow bridge\\workflow-bridge"]
    }
  }
}
```

---

### 4. **GitHub MCP**
- **Purpose:** GitHub repository integration
- **Status:** Not configured
- **Built-in:** Part of MCP standard servers

**Capabilities:**
- Search repositories
- Read file contents
- Create issues/PRs
- Manage branches
- View commit history

**Configuration:**
```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "your_token_here"
      }
    }
  }
}
```

---

### 5. **PostgreSQL MCP**
- **Purpose:** Direct PostgreSQL database access
- **Status:** Not configured (Supabase already provides this)

**Note:** Since you're using Supabase (which is PostgreSQL), the Supabase MCP is preferred as it includes additional features like Storage and Auth.

---

### 6. **Web Search MCP**
- **Purpose:** Search the web from AI
- **Status:** Not configured

**Capabilities:**
- Brave Search integration
- Real-time web results
- Documentation lookup

**Configuration:**
```json
{
  "mcpServers": {
    "brave-search": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-brave-search"],
      "env": {
        "BRAVE_API_KEY": "your_api_key"
      }
    }
  }
}
```

---

### 7. **Slack MCP**
- **Purpose:** Slack workspace integration
- **Status:** Not configured

**Capabilities:**
- Send messages
- Read channels
- Search messages
- Manage users

---

## 🎯 Recommended Setup for Your Project

### Priority 1: Already Done! ✅
- **Supabase MCP** - For database operations

### Priority 2: Highly Recommended
- **n8n MCP** - For workflow automation (your core feature)
- **Filesystem MCP** - For file operations in your codebase

### Priority 3: Optional but Useful
- **GitHub MCP** - If you're pushing to GitHub
- **Web Search MCP** - For documentation lookups

---

## 📝 Complete MCP Configuration Example

Here's how your `mcp.json` could look with multiple servers:

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-supabase"],
      "env": {
        "SUPABASE_URL": "https://ebteahoeajlqpcbfxihl.supabase.co",
        "SUPABASE_SERVICE_ROLE_KEY": "your_service_role_key"
      }
    },
    "filesystem": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "D:\\workflow bridge\\workflow-bridge"
      ]
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "ghp_your_token"
      }
    }
  }
}
```

---

## 🔧 How to Add More MCP Servers

### Step 1: Edit Configuration
Open: `C:\Users\shahd\.cursor\mcp.json`

### Step 2: Add Server Config
Add new server entries under `mcpServers` object

### Step 3: Restart Cursor
Close and reopen Cursor completely

### Step 4: Test
Try asking: "Using [server name], do [action]"

---

## 🧪 Testing MCP Servers

### Test Supabase MCP:
```
"Using Supabase, show me all tables in my database"
"Query the users table from Supabase"
```

### Test Filesystem MCP (after setup):
```
"List all files in the src directory"
"Read the contents of package.json"
```

### Test n8n MCP (after setup):
```
"Search for email nodes in n8n"
"Show me a webhook workflow template"
```

---

## 📚 Resources

### Official MCP Documentation:
- **MCP Website:** https://modelcontextprotocol.io/
- **MCP Servers Repo:** https://github.com/modelcontextprotocol/servers
- **Cursor MCP Docs:** Check Cursor settings → MCP

### Server-Specific Docs:
- **Supabase MCP:** https://github.com/modelcontextprotocol/servers/tree/main/src/supabase
- **n8n MCP:** https://github.com/czlonkowski/n8n-mcp
- **Filesystem MCP:** https://github.com/modelcontextprotocol/servers/tree/main/src/filesystem

---

## 🔒 Security Best Practices

### ⚠️ Important:
1. **Never commit** `mcp.json` with real credentials
2. **Use environment variables** for sensitive data
3. **Rotate keys** regularly
4. **Limit permissions** - only give what's needed
5. **Monitor usage** - check logs for unusual activity

### Safe Credentials Storage:
- Keep `mcp.json` local only
- Use `.gitignore` to exclude it
- Consider using credential managers
- Use separate keys for development/production

---

## ✅ Current Status Checklist

- [x] Supabase MCP configured
- [ ] Supabase service role key added
- [ ] Cursor restarted
- [ ] Supabase MCP tested
- [ ] n8n MCP installed (optional)
- [ ] Filesystem MCP added (optional)
- [ ] Other MCP servers as needed

---

## 🎯 Quick Commands

### View Current Configuration:
```powershell
Get-Content "C:\Users\shahd\.cursor\mcp.json"
```

### Test MCP in Cursor:
1. Open Cursor AI chat
2. Type: "What MCP servers are available?"
3. Test each with specific commands

### Check MCP Logs:
- Open Cursor Developer Tools (Help → Toggle Developer Tools)
- Check Console for MCP-related messages

---

**Your Workflow Bridge project now has powerful MCP capabilities! 🚀**

*For detailed setup of individual MCP servers, see the respective documentation files.*

