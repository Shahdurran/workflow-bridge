# Database Setup Guide

## 📚 Overview

This guide will walk you through setting up the Supabase database for the Workflow Automation Platform.

---

## 🚀 Supabase Setup

### Step 1: Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Click "Start your project"
3. Sign in with GitHub or create an account
4. Click "New Project"
5. Fill in the project details:
   - **Name**: workflow-automation-platform (or your choice)
   - **Database Password**: Generate a strong password and save it
   - **Region**: Choose the closest region to your users
   - **Pricing Plan**: Free tier is sufficient for development

### Step 2: Get Your Credentials

Once your project is created:

1. Go to **Project Settings** (gear icon in sidebar)
2. Navigate to **API** section
3. Copy these values:
   - **Project URL**: `https://your-project.supabase.co`
   - **anon public**: This is your `SUPABASE_ANON_KEY`
   - **service_role**: This is your `SUPABASE_SERVICE_KEY` (keep this secret!)

---

## 🗄️ Database Schema Setup

### Step 3: Run the SQL Schema

1. In your Supabase project, click on **SQL Editor** in the sidebar
2. Click **New Query**
3. Copy the entire contents of `database_schema.sql` from the project root
4. Paste it into the SQL editor
5. Click **Run** or press `Ctrl+Enter`

You should see a success message. The schema includes:
- ✅ 3 main tables (workflows, conversations, workflow_templates)
- ✅ Indexes for performance
- ✅ Triggers for auto-updating timestamps
- ✅ Helper functions for searching and stats
- ✅ Views for analytics

### Step 4: Verify the Schema

Run this query to verify tables were created:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('workflows', 'conversations', 'workflow_templates');
```

You should see all three tables listed.

---

## ⚙️ Environment Configuration

### Step 5: Update Your .env File

Create or update the `.env` file in the `automation-chatbot-backend` directory:

```bash
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_KEY=your-service-key-here

# OpenAI Configuration (for AI features)
OPENAI_API_KEY=your-openai-api-key

# Server Configuration
API_HOST=0.0.0.0
API_PORT=8000
DEBUG=True
ENVIRONMENT=development

# CORS Configuration
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
```

**Important Security Notes:**
- ⚠️ Never commit `.env` files to version control
- ⚠️ Keep `SUPABASE_SERVICE_KEY` secret
- ⚠️ Use `SUPABASE_ANON_KEY` for client-side operations
- ⚠️ Use `SUPABASE_SERVICE_KEY` for backend operations

---

## 🔒 Security Configuration (Optional but Recommended)

### Enable Row Level Security (RLS)

If you want user-level data isolation, uncomment and customize the RLS policies in `database_schema.sql`:

```sql
-- Enable RLS
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_templates ENABLE ROW LEVEL SECURITY;

-- Example: Users can only see their own workflows
CREATE POLICY "Users can view their own workflows"
    ON workflows FOR SELECT
    USING (created_by = auth.uid());
```

Then run these statements in the SQL Editor.

### Set Up Authentication (Optional)

If you want user authentication:

1. Enable **Auth** in Supabase (it's enabled by default)
2. Configure authentication providers (Email, Google, GitHub, etc.)
3. Update the RLS policies to use `auth.uid()`

---

## 🌱 Seed Data (Optional)

### Step 6: Populate with Sample Templates

Run the seed script to add common workflow templates:

```bash
cd automation-chatbot-backend
python seed_templates.py
```

This will create sample templates for:
- ✅ Form to Email notifications
- ✅ Slack to Database logging
- ✅ E-commerce order processing
- ✅ Social media automation
- ✅ CRM integrations

---

## 🧪 Testing the Connection

### Step 7: Test Database Connection

Start your backend server:

```bash
cd automation-chatbot-backend
uvicorn app.main:app --reload
```

Visit the health check endpoint:

```bash
curl http://localhost:8000/health
```

You should see:

```json
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2025-01-10T12:00:00.000Z"
}
```

### Step 8: Test CRUD Operations

Create a workflow:

```bash
curl -X POST http://localhost:8000/api/workflows/generate-and-save \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "n8n",
    "intent": {
      "trigger": {"app": "webhook", "event": "POST"},
      "actions": [{"app": "gmail", "event": "send_email"}]
    },
    "workflow_name": "Test Workflow"
  }'
```

List workflows:

```bash
curl http://localhost:8000/api/workflows/workflows
```

---

## 📊 Database Tables Reference

### workflows

Stores generated workflows for automation platforms.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| name | VARCHAR(255) | Workflow name |
| description | TEXT | Optional description |
| platform | VARCHAR(50) | Platform (n8n, make, zapier) |
| workflow_json | JSONB | Platform-specific JSON |
| status | VARCHAR(50) | draft, active, or archived |
| created_at | TIMESTAMP | Auto-generated |
| updated_at | TIMESTAMP | Auto-updated |
| created_by | UUID | User ID (optional) |
| tags | TEXT[] | Tags array |
| metadata | JSONB | Additional metadata |

### conversations

Stores chat conversations and workflow generation sessions.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| session_id | VARCHAR(255) | Unique session identifier |
| workflow_id | UUID | Linked workflow (optional) |
| messages | JSONB | Array of chat messages |
| platform | VARCHAR(50) | Target platform |
| status | VARCHAR(50) | active, completed, abandoned |
| metadata | JSONB | Additional metadata |
| created_at | TIMESTAMP | Auto-generated |
| updated_at | TIMESTAMP | Auto-updated |

### workflow_templates

Stores reusable workflow templates.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| name | VARCHAR(255) | Template name |
| description | TEXT | Template description |
| platform | VARCHAR(50) | Platform (n8n, make, zapier) |
| trigger_type | VARCHAR(100) | Trigger type |
| action_types | TEXT[] | Action types array |
| json_template | JSONB | Template JSON |
| usage_count | INTEGER | Times used |
| tags | TEXT[] | Tags array |
| category | VARCHAR(100) | Category |
| is_public | BOOLEAN | Public/private flag |
| created_at | TIMESTAMP | Auto-generated |
| updated_at | TIMESTAMP | Auto-updated |

---

## 🛠️ Maintenance

### Regular Maintenance Tasks

#### Cleanup Old Conversations

Run periodically (e.g., monthly):

```sql
DELETE FROM conversations 
WHERE status = 'abandoned' 
AND updated_at < NOW() - INTERVAL '30 days';
```

#### Archive Old Workflows

Run periodically (e.g., quarterly):

```sql
UPDATE workflows 
SET status = 'archived' 
WHERE status = 'draft' 
AND updated_at < NOW() - INTERVAL '90 days';
```

#### View Database Statistics

```sql
SELECT * FROM workflow_stats;
```

Or use the API:

```bash
curl http://localhost:8000/health
```

---

## 🐛 Troubleshooting

### Connection Issues

**Problem**: Can't connect to Supabase

**Solutions**:
1. Verify your `SUPABASE_URL` and `SUPABASE_KEY` in `.env`
2. Check that your Supabase project is active
3. Ensure your IP isn't blocked (Supabase has IP allow listing)
4. Check Supabase project status on their dashboard

### Schema Errors

**Problem**: Tables not created or errors in schema

**Solutions**:
1. Check the SQL Editor for error messages
2. Ensure you copied the entire `database_schema.sql` file
3. Try running the schema in smaller sections
4. Check for any existing tables with the same names

### Permission Errors

**Problem**: "permission denied" errors

**Solutions**:
1. Ensure you're using `SUPABASE_SERVICE_KEY` for backend operations
2. Check RLS policies if enabled
3. Verify your API key hasn't expired

### Data Not Showing

**Problem**: Data created but not appearing

**Solutions**:
1. Check if RLS is enabled (it might be filtering data)
2. Verify the correct database/project is selected
3. Check for any failed inserts in logs
4. Try querying directly in SQL Editor

---

## 📈 Performance Optimization

### Indexes

The schema includes optimized indexes for:
- ✅ Platform filtering
- ✅ Status filtering
- ✅ Date-based queries
- ✅ Full-text search on names
- ✅ Tag-based queries

### Connection Pooling

For production, consider:
- Using Supabase connection pooling
- Setting appropriate pool sizes
- Monitoring connection usage

---

## 🔄 Migrations

### Future Schema Changes

When you need to update the schema:

1. Create a new migration file: `migration_YYYYMMDD.sql`
2. Test in development first
3. Run in Supabase SQL Editor
4. Update `database_schema.sql` to reflect changes
5. Document breaking changes

### Version Control

- Keep `database_schema.sql` in version control
- Track migrations separately
- Document schema version in comments

---

## 📞 Support

### Resources

- 📖 [Supabase Documentation](https://supabase.com/docs)
- 💬 [Supabase Discord](https://discord.supabase.com)
- 🐛 [Report Issues](https://github.com/your-repo/issues)

### Common Questions

**Q: Do I need to pay for Supabase?**  
A: The free tier is sufficient for development and small projects. Upgrade for production.

**Q: Can I use PostgreSQL directly instead of Supabase?**  
A: Yes! The schema is standard PostgreSQL. Just update `DATABASE_URL` in `.env`.

**Q: How do I backup my data?**  
A: Supabase provides automatic backups. You can also export via SQL or their CLI.

**Q: Can I run this locally?**  
A: Yes! Use Docker with PostgreSQL and run the schema file.

---

## ✅ Setup Checklist

- [ ] Created Supabase project
- [ ] Copied Project URL and API keys
- [ ] Ran `database_schema.sql` in SQL Editor
- [ ] Verified tables were created
- [ ] Updated `.env` file with credentials
- [ ] Tested health check endpoint
- [ ] Created test workflow
- [ ] (Optional) Enabled RLS
- [ ] (Optional) Seeded template data
- [ ] (Optional) Configured authentication

---

## 🎉 Next Steps

Once your database is set up:

1. **Test API Endpoints**: Try all CRUD operations
2. **Generate Workflows**: Use the chatbot to generate workflows
3. **Explore Templates**: Browse and use workflow templates
4. **Monitor Performance**: Check database stats regularly
5. **Deploy**: Ready for production!

---

**Database setup complete!** 🚀 You're ready to start building workflow automations.

