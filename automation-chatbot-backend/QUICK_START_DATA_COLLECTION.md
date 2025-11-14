# Quick Start: Data Collection System

Get your cost-optimized data collection system running in 5 minutes! 🚀

## Step 1: Install Dependencies

```bash
cd automation-chatbot-backend
pip install -r requirements.txt
```

The `boto3` package is now included for S3-compatible storage.

## Step 2: Set Up Database

Run the schema to create training data tables:

```bash
# If using Supabase SQL Editor:
# 1. Go to Supabase Dashboard → SQL Editor
# 2. Copy contents of database_training_schema.sql
# 3. Run the script

# Or via command line:
psql $SUPABASE_URL -f database_training_schema.sql
```

This creates 6 tables, views, functions, and indexes for optimal performance.

## Step 3: Configure Environment

Add to your `.env` file:

```bash
# Enable data collection (no S3 required yet)
ENABLE_DATA_COLLECTION=true
ENABLE_DATA_ARCHIVING=false  # Enable later when you set up S3/R2
DATA_RETENTION_DAYS=30
COMPRESSION_THRESHOLD_KB=10

# S3/R2 Configuration (Optional - set up later)
S3_ENDPOINT=
S3_ACCESS_KEY=
S3_SECRET_KEY=
S3_BUCKET_NAME=workflowbridge-training-data
S3_REGION=auto
```

## Step 4: Start Collecting Data

That's it! Data collection is now automatic. Every AI interaction is logged:

✅ User messages and AI responses
✅ Intent extraction results
✅ Generated workflows (auto-compressed if >10KB)
✅ Validation results
✅ User feedback
✅ Processing times

## Step 5: Monitor Your Data

Check storage and training readiness:

```bash
# View current stats
python -m app.tasks.archive_training_data --stats-only
```

Or via API:
```bash
curl https://your-api.com/api/feedback/stats
```

## Optional: Set Up Cost-Saving Archiving

When you're ready to save costs with S3/R2 archiving:

### Option A: Cloudflare R2 (Recommended - Cheapest)

1. Create Cloudflare R2 bucket
2. Generate API tokens
3. Update `.env`:
   ```bash
   ENABLE_DATA_ARCHIVING=true
   S3_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
   S3_ACCESS_KEY=your_access_key
   S3_SECRET_KEY=your_secret_key
   S3_BUCKET_NAME=workflowbridge-training-data
   S3_REGION=auto
   ```

### Option B: AWS S3

1. Create S3 bucket
2. Create IAM user with S3 access
3. Update `.env`:
   ```bash
   ENABLE_DATA_ARCHIVING=true
   S3_ENDPOINT=https://s3.us-east-1.amazonaws.com
   S3_ACCESS_KEY=your_aws_access_key
   S3_SECRET_KEY=your_aws_secret_key
   S3_BUCKET_NAME=workflowbridge-training-data
   S3_REGION=us-east-1
   ```

### Test Archiving

```bash
# Dry run to preview
python -m app.tasks.archive_training_data --dry-run

# Actually archive data older than 30 days
python -m app.tasks.archive_training_data
```

### Set Up Automated Archiving

Add to crontab (run daily at 2 AM):
```bash
0 2 * * * cd /path/to/automation-chatbot-backend && python -m app.tasks.archive_training_data
```

## API Endpoints

### Submit User Feedback
```bash
POST /api/feedback/submit
{
  "interaction_id": "uuid",
  "feedback_type": "thumbs_up",
  "feedback_text": "Great workflow!"
}
```

### Get Storage Stats
```bash
GET /api/feedback/stats
```

### Check Training Readiness
```bash
GET /api/feedback/readiness/zapier
```

### Export Training Data (Admin)
```bash
GET /api/feedback/export/zapier?success_only=true
```

### Manually Archive (Admin)
```bash
POST /api/feedback/archive
{
  "days_old": 30,
  "dry_run": false
}
```

## Training Readiness Checklist

Your platform is ready for training when:
- ✅ **50+ total examples** collected
- ✅ **30+ successful** interactions
- ✅ **10+ with user feedback** (thumbs up/down, edits)
- ✅ **20+ quality examples** (positive feedback or edited)
- ✅ **Readiness score ≥ 70**

Check readiness:
```bash
curl https://your-api.com/api/feedback/readiness/zapier
```

## Cost Savings Example

With 100GB of training data:

| Storage | Monthly Cost | Yearly Cost |
|---------|--------------|-------------|
| Supabase Only | $12.50 | $150.00 |
| **With R2 Archiving** | **$1.50** | **$18.00** |
| **Savings** | **$11.00 (88%)** | **$132.00** |

## Storage Stats Output Format

When you run `--stats-only` or call `/api/feedback/stats`, you'll see:

```
================================================================================
  Training Data Archiving Tool
  WorkflowBridge Data Collection System
================================================================================

📈 Current Storage Statistics
==============================================================

📊 Overview:
  Total Records:     1,250
  Active Records:    850
  Archived Records:  400
  With Feedback:     215

💾 Storage:
  Supabase Size:     50.00 MB
  Archived Size:     10.00 MB
  Total Size:        60.00 MB

💰 Cost Estimates:
  Supabase:          $6.25/month
  R2 Storage:        $0.15/month
  Total:             $6.40/month
  Savings:           $1.10/month (14.7%)

🔧 By Platform:
  ZAPIER:
    Total: 450 | Success Rate: 94.4% | With Feedback: 105
  MAKE:
    Total: 350 | Success Rate: 94.3% | With Feedback: 78
  N8N:
    Total: 450 | Success Rate: 92.2% | With Feedback: 32

💡 Recommendations:
  1. ✅ zapier: Ready for training with 450 examples
  2. 💡 Low feedback rate. Encourage users to rate workflows
  3. 💰 Archiving can save significant costs
==============================================================
```

## Troubleshooting

### Data Not Being Collected?

1. Check `ENABLE_DATA_COLLECTION=true` in `.env`
2. Restart your application
3. Check logs for errors
4. Verify database schema is installed

### S3/R2 Connection Issues?

1. Test credentials:
   ```bash
   python -c "
   import boto3
   from app.core.config import settings
   client = boto3.client('s3', 
       endpoint_url=settings.s3_endpoint,
       aws_access_key_id=settings.s3_access_key,
       aws_secret_access_key=settings.s3_secret_key
   )
   print('Connection successful!')
   print(client.list_buckets())
   "
   ```

2. Verify bucket exists
3. Check IAM/token permissions

## Next Steps

1. ✅ Collect data for 1-2 weeks
2. ✅ Monitor feedback rates (aim for >10%)
3. ✅ Check readiness scores weekly
4. ✅ Enable archiving to save costs
5. ✅ Export data when readiness score ≥ 70
6. ✅ Train your custom model!

## Learn More

- **Full Documentation**: See `DATA_COLLECTION_GUIDE.md`
- **Database Schema**: See `database_training_schema.sql`
- **API Reference**: Check `/docs` endpoint (FastAPI Swagger)

---

**Questions?** Open an issue or check the full guide for detailed troubleshooting.

🎉 **You're now collecting valuable training data automatically!**

