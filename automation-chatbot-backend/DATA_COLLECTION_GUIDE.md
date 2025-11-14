# Cost-Optimized Data Collection System Guide

## Overview

This guide covers the comprehensive data collection system for training custom AI models. The system implements a hybrid storage approach:

- **Recent data (30 days)**: Stored in Supabase for fast access and real-time queries
- **Old data**: Archived to Cloudflare R2 / AWS S3 for cost-effective long-term storage (up to 90% cost savings)

## Features

✅ **Automatic Data Collection**: All AI interactions logged with compression for large workflows
✅ **Validation Tracking**: Monitor workflow validation results and user corrections
✅ **User Feedback**: Capture thumbs up/down, edits, and detailed feedback
✅ **Smart Archiving**: Automatic migration to S3/R2 after configurable retention period
✅ **Training Export**: Export data in OpenAI fine-tuning format (JSONL)
✅ **Cost Monitoring**: Real-time cost estimates and savings tracking
✅ **Training Readiness**: Check if you have enough quality data to train

## Configuration

### Environment Variables

Add these to your `.env` file:

```bash
# Data Collection
ENABLE_DATA_COLLECTION=true
ENABLE_DATA_ARCHIVING=false  # Enable when ready to use S3/R2
DATA_RETENTION_DAYS=30
COMPRESSION_THRESHOLD_KB=10

# S3/R2 Configuration (Cloudflare R2 or AWS S3)
S3_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
S3_ACCESS_KEY=your_access_key_here
S3_SECRET_KEY=your_secret_key_here
S3_BUCKET_NAME=workflowbridge-training-data
S3_REGION=auto  # Use 'auto' for Cloudflare R2
```

### Cloudflare R2 Setup

1. Go to Cloudflare Dashboard → R2
2. Create a new bucket: `workflowbridge-training-data`
3. Create API tokens:
   - Click "Manage R2 API Tokens"
   - Create token with "Edit" permissions
   - Copy Access Key ID and Secret Access Key
4. Get your account ID from the R2 dashboard
5. Your endpoint will be: `https://<account-id>.r2.cloudflarestorage.com`

**Cost**: ~$0.015/GB/month (vs Supabase ~$0.125/GB/month = ~90% savings!)

## Database Setup

Run the schema to create all necessary tables:

```bash
# Connect to your Supabase database and run:
psql $DATABASE_URL -f database_training_schema.sql
```

This creates:
- `training_data` - Main interaction logs
- `validation_logs` - Validation results
- `user_feedback` - User feedback and corrections
- `workflow_examples` - Curated high-quality examples
- `training_metrics` - Model performance tracking
- `archive_metadata` - Archive inventory

## API Endpoints

### Submit Feedback

```bash
POST /api/feedback/submit
```

**Request:**
```json
{
  "interaction_id": "uuid-here",
  "feedback_type": "thumbs_up",  // thumbs_up, thumbs_down, edit, report
  "feedback_text": "Great workflow!",
  "sentiment_score": 5,
  "corrected_workflow": {...},  // If user edited the workflow
  "correction_notes": "Fixed the email template"
}
```

**Response:**
```json
{
  "success": true,
  "feedback_id": "uuid-here",
  "message": "Thank you for your feedback!"
}
```

### Get Storage Statistics

```bash
GET /api/feedback/stats
```

**Response Example:**
```json
{
  "overview": {
    "total_records": 1250,
    "active_records": 850,
    "archived_records": 400,
    "compressed_records": 320,
    "records_with_feedback": 215
  },
  "storage": {
    "supabase_size_bytes": 52428800,
    "supabase_size_display": "50.00 MB",
    "archived_size_bytes": 10485760,
    "archived_size_display": "10.00 MB",
    "total_size_bytes": 62914560,
    "total_size_display": "60.00 MB"
  },
  "costs": {
    "supabase_monthly_usd": 6.25,
    "r2_monthly_usd": 0.15,
    "total_monthly_usd": 6.40,
    "cost_without_archiving_usd": 7.50,
    "savings_monthly_usd": 1.10,
    "savings_percentage": 14.7
  },
  "by_platform": {
    "zapier": {
      "total_interactions": 450,
      "successful_interactions": 425,
      "success_rate": 94.44,
      "thumbs_up_count": 85,
      "thumbs_down_count": 12,
      "edited_count": 8,
      "total_feedback_count": 105
    },
    "make": {
      "total_interactions": 350,
      "successful_interactions": 330,
      "success_rate": 94.29
    },
    "n8n": {
      "total_interactions": 450,
      "successful_interactions": 415,
      "success_rate": 92.22
    }
  },
  "training_readiness": {
    "zapier": {
      "platform": "zapier",
      "total_examples": 450,
      "successful_examples": 425,
      "quality_examples": 93,
      "examples_with_feedback": 105,
      "readiness_score": 85,
      "recommendation": "Ready for training"
    },
    "make": {
      "readiness_score": 65,
      "recommendation": "Need more feedback - encourage users to rate workflows"
    },
    "n8n": {
      "readiness_score": 72,
      "recommendation": "Continue collecting data"
    }
  },
  "recommendations": [
    "✅ zapier: Ready for training with 450 examples",
    "💡 Low feedback rate. Encourage users to rate workflows for better training data.",
    "💰 Archiving can save significant costs. Potential savings: ~$1.10 USD/month"
  ]
}
```

### Archive Old Data (Admin Only)

```bash
POST /api/feedback/archive
```

**Request:**
```json
{
  "days_old": 30,
  "dry_run": false
}
```

**Response:**
```json
{
  "success": true,
  "archived_count": 400,
  "archives": [
    {
      "platform": "zapier",
      "date": "2024-01-15",
      "records_count": 150,
      "uncompressed_size": 15728640,
      "compressed_size": 3145728,
      "compression_ratio": 80.0,
      "s3_key": "archives/zapier/2024/01/2024-01-15.jsonl.gz"
    }
  ],
  "message": "Successfully archived 400 records"
}
```

### Export Training Data (Admin Only)

```bash
GET /api/feedback/export/{platform}?success_only=true&with_feedback_only=false&output_format=openai
```

Downloads a JSONL file ready for OpenAI fine-tuning:

```jsonl
{"messages":[{"role":"system","content":"You are an expert zapier workflow generator..."},{"role":"user","content":"Send email when form submitted"},{"role":"assistant","content":"{...workflow json...}"}]}
{"messages":[{"role":"system","content":"You are an expert zapier workflow generator..."},{"role":"user","content":"Create task in Asana from Slack message"},{"role":"assistant","content":"{...workflow json...}"}]}
```

### Check Training Readiness

```bash
GET /api/feedback/readiness/{platform}
```

**Response:**
```json
{
  "platform": "zapier",
  "total_examples": 450,
  "successful_examples": 425,
  "quality_examples": 93,
  "examples_with_feedback": 105,
  "readiness_score": 85,
  "recommendation": "Ready for training",
  "is_ready": true
}
```

### Delete User Data (GDPR)

```bash
DELETE /api/feedback/data/{interaction_id}
```

Allows users to delete their own data or admins to delete any data.

## Command-Line Archiving

Run the standalone archiving script:

```bash
# Archive data older than 30 days
python -m app.tasks.archive_training_data

# Archive data older than 60 days
python -m app.tasks.archive_training_data --days-old 60

# Preview what would be archived (dry run)
python -m app.tasks.archive_training_data --dry-run

# Show current statistics only
python -m app.tasks.archive_training_data --stats-only

# Verbose output
python -m app.tasks.archive_training_data --verbose
```

### Example Output

```
================================================================================
  Training Data Archiving Tool
  WorkflowBridge Data Collection System
================================================================================

📊 Analyzing data to archive...

Data Eligible for Archiving
------------------------------------------------------------
  Total Records: 400
  Total Size: 15.00 MB
  Cutoff Date: 2024-10-15T00:00:00Z
  By Platform:
    zapier:
      count: 150
      size: 6291456
    make:
      count: 125
      size: 5242880
    n8n:
      count: 125
      size: 3670016
------------------------------------------------------------

📦 Initializing archiving service...

🚀 Archiving data older than 30 days to S3/R2...
This may take a few minutes depending on data volume...

✅ Successfully archived 400 records!

Archives Created
------------------------------------------------------------
  Archive 1:
    Platform: zapier
    Date: 2024-01-15
    Records: 150
    Original Size: 6.00 MB
    Compressed Size: 1.20 MB
    Compression Ratio: 80.0%
    S3 Key: archives/zapier/2024/01/2024-01-15.jsonl.gz
------------------------------------------------------------

💰 Cost Savings Estimate:
  Before (Supabase): $1.88/month
  After (R2):        $0.23/month
  Monthly Savings:   $1.65 (~88% reduction)
  Yearly Savings:    $19.80
```

### Set Up Cron Job

Add to your crontab to run daily at 2 AM:

```bash
crontab -e

# Add this line:
0 2 * * * cd /path/to/automation-chatbot-backend && python -m app.tasks.archive_training_data >> logs/archive.log 2>&1
```

## Integration in Your Code

### Collecting Conversation Data

Data collection is automatically integrated into `AIService`. The service logs:

- Every conversation interaction
- Intent extraction results
- Generated workflows (with compression for large ones)
- Processing time and token usage
- Success/failure status

**The interaction_id is returned in the response metadata** for user feedback.

### Logging Validation Results

When validating workflows, include the `interaction_id` in your validation request:

```python
validation_request = {
    "workflow_json": workflow,
    "platform": "zapier",
    "interaction_id": interaction_id,  # From AI response
    "user_edited": True,  # If user modified the workflow
    "original_workflow": original_workflow  # Before edits
}
```

### Collecting User Feedback

In your frontend, add feedback buttons:

```javascript
async function submitFeedback(interactionId, feedbackType) {
  const response = await fetch('/api/feedback/submit', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      interaction_id: interactionId,
      feedback_type: feedbackType,  // 'thumbs_up', 'thumbs_down', 'edit', 'report'
      feedback_text: userComment,
      sentiment_score: 5,
      corrected_workflow: editedWorkflow  // If user edited
    })
  });
}
```

## Training Readiness Guidelines

| Score | Status | Recommendation |
|-------|--------|----------------|
| 0-40 | ❌ Not Ready | Need more data - aim for 100+ examples |
| 41-69 | ⚠️ Insufficient | Need more feedback and quality examples |
| 70-84 | ✅ Ready | Sufficient data for initial training |
| 85-100 | ⭐ Excellent | High-quality dataset ready for training |

**Minimum Requirements:**
- 50+ total examples
- 30+ successful examples
- 10+ examples with feedback
- 20+ quality examples (thumbs up or edited)

## Cost Optimization

### Storage Costs Comparison

| Storage | Cost per GB/month | 100 GB Cost | 1 TB Cost |
|---------|-------------------|-------------|-----------|
| Supabase | $0.125 | $12.50 | $125.00 |
| Cloudflare R2 | $0.015 | $1.50 | $15.00 |
| **Savings** | **88%** | **$11.00** | **$110.00** |

### Compression Benefits

- Workflows >10KB automatically compressed with gzip
- Typical compression ratio: 70-85%
- Archives compressed at 9 (maximum) compression level
- Example: 1MB workflow → ~200KB compressed

### Best Practices

1. **Enable archiving** after first month of data collection
2. **Set retention to 30 days** for most use cases
3. **Run archiving script daily** via cron
4. **Monitor storage stats** weekly
5. **Export data before training** to ensure you have everything

## Monitoring and Alerts

### Check Storage Health

```bash
# Quick check
curl https://your-api.com/api/feedback/stats

# Detailed check with archiving script
python -m app.tasks.archive_training_data --stats-only
```

### Set Up Alerts

Monitor these metrics:
- `storage.supabase_size_bytes` > 1GB → Consider archiving
- `overview.records_with_feedback` / `overview.active_records` < 0.1 → Low feedback rate
- `training_readiness.readiness_score` for each platform

## Troubleshooting

### S3/R2 Connection Issues

```bash
# Test connection
python -c "
import boto3
client = boto3.client('s3', 
    endpoint_url='your-endpoint',
    aws_access_key_id='your-key',
    aws_secret_access_key='your-secret'
)
print(client.list_buckets())
"
```

### Archiving Fails

1. Check S3 credentials in `.env`
2. Verify bucket exists and is accessible
3. Check ENABLE_DATA_ARCHIVING=true
4. Review logs: `logs/archive.log`

### Data Not Being Collected

1. Check ENABLE_DATA_COLLECTION=true
2. Verify database schema is installed
3. Check application logs for errors
4. Ensure Supabase connection is working

## Security & Privacy

### Data Privacy

- User data tied to user_id for GDPR compliance
- Users can delete their own data via DELETE endpoint
- Archived data maintains same privacy protections
- No personal information in training exports

### Access Control

- All endpoints require authentication
- Admin-only endpoints: archive, export
- Users can only view/delete their own data
- RLS policies enforce data isolation

### Data Retention

- Active data: Configurable (default 30 days)
- Archived data: Indefinite (for training)
- User can request deletion anytime (GDPR)

## Next Steps

1. ✅ Install dependencies: `pip install boto3>=1.34.0`
2. ✅ Run database schema: `database_training_schema.sql`
3. ✅ Configure environment variables in `.env`
4. ✅ Set up Cloudflare R2 or AWS S3
5. ✅ Enable data collection: `ENABLE_DATA_COLLECTION=true`
6. ✅ Start collecting data (automatic)
7. ✅ Monitor feedback rates and storage
8. ✅ Enable archiving when ready: `ENABLE_DATA_ARCHIVING=true`
9. ✅ Set up cron job for automated archiving
10. ✅ Export and train when readiness score > 70

## Support

For issues or questions:
- Check logs in `logs/` directory
- Review database with `get_storage_stats()` function
- Run dry-run archiving to preview operations
- Check Supabase dashboard for data integrity

---

**Note**: This system is production-ready and handles:
- High-volume data collection
- Automatic compression
- Cost-optimized archiving
- GDPR compliance
- Training dataset export

Start collecting data today and train your custom model when ready! 🚀

