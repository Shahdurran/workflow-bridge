# 🗄️ Supabase MCP Server Setup Guide

The Supabase MCP (Model Context Protocol) server has been added to your Cursor configuration, allowing AI assistants to interact directly with your Supabase database.

---

## ✅ What's Been Configured

The Supabase MCP server has been added to `C:\Users\shahd\.cursor\mcp.json` with the following configuration:

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-supabase"],
      "env": {
        "SUPABASE_URL": "https://ebteahoeajlqpcbfxihl.supabase.co",
        "SUPABASE_SERVICE_ROLE_KEY": "YOUR_SERVICE_ROLE_KEY_HERE"
      }
    }
  }
}
```

---

## 🔑 Required: Add Your Service Role Key

**IMPORTANT:** You need to replace `YOUR_SERVICE_ROLE_KEY_HERE` with your actual Supabase service role key.

### How to Get Your Service Role Key:

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: **ebteahoeajlqpcbfxihl**
3. Go to **Settings** → **API**
4. Look for **Project API keys** section
5. Copy the **service_role** key (⚠️ Keep this secret!)

### Update Your Configuration:

1. Open `C:\Users\shahd\.cursor\mcp.json`
2. Replace `YOUR_SERVICE_ROLE_KEY_HERE` with your actual service role key
3. Save the file
4. Restart Cursor

---

## 🎯 What Can Supabase MCP Do?

Once configured, the Supabase MCP server allows AI to:

### Database Operations:
- ✅ **Query tables** - Read data from any table
- ✅ **Insert records** - Add new data
- ✅ **Update records** - Modify existing data
- ✅ **Delete records** - Remove data
- ✅ **Create tables** - Define new table schemas
- ✅ **Alter tables** - Modify table structure
- ✅ **Execute raw SQL** - Run custom queries

### Schema Management:
- 📊 List all tables
- 📋 Get table schemas
- 🔍 Inspect column definitions
- 🔗 View relationships

### Real-time Features:
- 🔔 Query realtime subscriptions
- 📡 Check connection status

---

## 💡 Example Usage in Cursor

Once configured, you can ask Cursor's AI to interact with your database:

### Query Data:
```
"Show me all users from the users table"
"Get the last 10 conversations from the conversations table"
"Find all workflows created today"
```

### Insert Data:
```
"Add a new user with email test@example.com"
"Create a new conversation for user_id 123"
```

### Schema Inspection:
```
"What tables exist in my database?"
"Show me the schema for the workflows table"
"What columns are in the messages table?"
```

### Analytics:
```
"How many workflows were created this week?"
"Show me user activity statistics"
"Count messages by conversation"
```

---

## 🔒 Security Considerations

### ⚠️ Important Security Notes:

1. **Service Role Key** - This key has **full access** to your database, bypassing Row Level Security (RLS)
2. **Never commit** `mcp.json` to public repositories
3. **Keep it local** - This is your personal Cursor configuration
4. **Rotate regularly** - Change your service role key periodically

### Best Practices:

- ✅ Only use service role key locally for development
- ✅ Enable Row Level Security (RLS) on production tables
- ✅ Use environment variables for production deployments
- ✅ Monitor API usage in Supabase dashboard
- ❌ Never share your service role key
- ❌ Don't use it in client-side code

---

## 🧪 Testing the Configuration

After adding your service role key and restarting Cursor, test it:

1. **Open Cursor's AI chat**
2. Try this command:
   ```
   "Using Supabase MCP, list all tables in my database"
   ```
3. The AI should connect to your Supabase instance and return the table list

### Troubleshooting:

**Problem:** "Supabase MCP server not responding"
- Ensure you've added the correct service role key
- Restart Cursor completely
- Check internet connection

**Problem:** "Permission denied"
- Verify the service role key is correct
- Check if tables exist in your database
- Ensure Supabase project is active

**Problem:** "Command not found: npx"
- Ensure Node.js is installed
- Add Node.js to your PATH
- Restart terminal/Cursor

---

## 📚 Available MCP Tools

The Supabase MCP server provides these tools:

| Tool | Description |
|------|-------------|
| `supabase_select` | Query data from tables |
| `supabase_insert` | Insert new records |
| `supabase_update` | Update existing records |
| `supabase_delete` | Delete records |
| `supabase_rpc` | Call stored procedures |
| `supabase_storage_upload` | Upload files to storage |
| `supabase_storage_list` | List files in storage |

---

## 🔄 Integration with Your Project

Your Workflow Bridge project uses Supabase for:

### Existing Tables:
- `users` - User accounts
- `conversations` - Chat sessions
- `messages` - Chat messages
- `workflows` - Generated workflows
- `workflow_executions` - Execution history
- `templates` - Workflow templates
- `feedback` - User feedback

### With Supabase MCP, you can:

1. **Debug faster** - Query data without leaving Cursor
2. **Test queries** - Try SQL before adding to code
3. **Inspect data** - Check what's in tables
4. **Quick fixes** - Update data directly
5. **Schema updates** - Modify tables on the fly

---

## 📖 Additional Resources

- **Supabase MCP GitHub:** https://github.com/modelcontextprotocol/servers/tree/main/src/supabase
- **MCP Documentation:** https://modelcontextprotocol.io/
- **Supabase API Docs:** https://supabase.com/docs/reference/javascript/introduction
- **Your Supabase Dashboard:** https://supabase.com/dashboard/project/ebteahoeajlqpcbfxihl

---

## 🎯 Quick Reference

### Your Supabase Configuration:

```
Project Reference: ebteahoeajlqpcbfxihl
Supabase URL: https://ebteahoeajlqpcbfxihl.supabase.co
Region: [Check your dashboard]
```

### Configuration File Location:

```
C:\Users\shahd\.cursor\mcp.json
```

### To Enable:

1. Add service role key to `mcp.json`
2. Save file
3. Restart Cursor
4. Test with: "List my Supabase tables"

---

## ✅ Checklist

- [ ] Service role key added to `mcp.json`
- [ ] File saved
- [ ] Cursor restarted
- [ ] Test query successful
- [ ] Tables visible to MCP
- [ ] Can query data

---

**Need Help?** 

- Check Cursor's MCP status in settings
- View logs in Cursor's developer console
- Verify credentials in Supabase dashboard

**Happy querying! 🚀**

