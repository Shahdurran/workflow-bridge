# Storage Statistics Output Format

This document shows the exact format and structure of storage statistics returned by the data collection system.

## Command Line Output

When running `python -m app.tasks.archive_training_data --stats-only`, you'll see:

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
  Compressed Records: 320
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
  3. 💰 Archiving can save significant costs. Potential savings: ~$1.10 USD/month
==============================================================
```

## API Response Format

### Endpoint: `GET /api/feedback/stats`

**Response Structure:**

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
      "platform": "zapier",
      "total_interactions": 450,
      "successful_interactions": 425,
      "failed_interactions": 25,
      "success_rate": 94.44,
      "thumbs_up_count": 85,
      "thumbs_down_count": 12,
      "edited_count": 8,
      "total_feedback_count": 105,
      "avg_size_bytes": 45056,
      "total_size_bytes": 20275200,
      "compressed_count": 120,
      "avg_processing_time_ms": 1450,
      "archived_count": 150,
      "active_count": 300,
      "earliest_interaction": "2024-01-01T00:00:00Z",
      "latest_interaction": "2024-10-15T12:34:56Z"
    },
    "make": {
      "platform": "make",
      "total_interactions": 350,
      "successful_interactions": 330,
      "failed_interactions": 20,
      "success_rate": 94.29,
      "thumbs_up_count": 60,
      "thumbs_down_count": 10,
      "edited_count": 8,
      "total_feedback_count": 78,
      "avg_size_bytes": 38912,
      "total_size_bytes": 13619200,
      "compressed_count": 95,
      "avg_processing_time_ms": 1280,
      "archived_count": 125,
      "active_count": 225,
      "earliest_interaction": "2024-01-15T00:00:00Z",
      "latest_interaction": "2024-10-15T11:20:30Z"
    },
    "n8n": {
      "platform": "n8n",
      "total_interactions": 450,
      "successful_interactions": 415,
      "failed_interactions": 35,
      "success_rate": 92.22,
      "thumbs_up_count": 25,
      "thumbs_down_count": 5,
      "edited_count": 2,
      "total_feedback_count": 32,
      "avg_size_bytes": 52224,
      "total_size_bytes": 23500800,
      "compressed_count": 105,
      "avg_processing_time_ms": 1620,
      "archived_count": 125,
      "active_count": 325,
      "earliest_interaction": "2024-02-01T00:00:00Z",
      "latest_interaction": "2024-10-15T13:45:20Z"
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
      "recommendation": "Ready for training",
      "is_ready": true
    },
    "make": {
      "platform": "make",
      "total_examples": 350,
      "successful_examples": 330,
      "quality_examples": 68,
      "examples_with_feedback": 78,
      "readiness_score": 75,
      "recommendation": "Ready for training",
      "is_ready": true
    },
    "n8n": {
      "platform": "n8n",
      "total_examples": 450,
      "successful_examples": 415,
      "quality_examples": 27,
      "examples_with_feedback": 32,
      "readiness_score": 65,
      "recommendation": "Need more feedback - encourage users to rate workflows",
      "is_ready": false
    }
  },
  "recommendations": [
    "✅ zapier: Ready for training with 450 examples",
    "✅ make: Ready for training with 350 examples",
    "📊 n8n: Need more feedback - encourage users to rate workflows",
    "💡 Low feedback rate. Encourage users to rate workflows for better training data.",
    "💰 Archiving can save significant costs. Potential savings: ~$1.10 USD/month"
  ]
}
```

## Field Descriptions

### Overview Section
- `total_records`: Total number of training interactions ever collected
- `active_records`: Records currently in Supabase (not archived)
- `archived_records`: Records moved to S3/R2 storage
- `compressed_records`: Records with gzip-compressed workflows
- `records_with_feedback`: Records with user feedback (thumbs up/down/edit)

### Storage Section
- `supabase_size_bytes`: Current data size in Supabase (raw bytes)
- `supabase_size_display`: Human-readable format (e.g., "50.00 MB")
- `archived_size_bytes`: Compressed size of archived data in S3/R2
- `archived_size_display`: Human-readable archived size
- `total_size_bytes`: Combined total storage
- `total_size_display`: Human-readable total

### Costs Section
- `supabase_monthly_usd`: Estimated Supabase storage cost per month
- `r2_monthly_usd`: Estimated R2/S3 storage cost per month
- `total_monthly_usd`: Combined monthly cost
- `cost_without_archiving_usd`: What it would cost without archiving
- `savings_monthly_usd`: Monthly savings from archiving
- `savings_percentage`: Percentage saved (typically 80-90%)

**Cost Formula:**
- Supabase: `(bytes / 1GB) * $0.125/month`
- R2: `(bytes / 1GB) * $0.015/month`

### By Platform Section
Each platform includes:
- `total_interactions`: Total workflows generated
- `successful_interactions`: Successfully generated workflows
- `failed_interactions`: Failed attempts
- `success_rate`: Success percentage
- `thumbs_up_count`: Positive feedback count
- `thumbs_down_count`: Negative feedback count
- `edited_count`: User-edited workflows
- `total_feedback_count`: All feedback combined
- `avg_size_bytes`: Average workflow size
- `total_size_bytes`: Total storage for this platform
- `compressed_count`: Compressed workflows
- `avg_processing_time_ms`: Average generation time
- `archived_count`: Archived workflows
- `active_count`: Active (non-archived) workflows
- `earliest_interaction`: Oldest workflow timestamp
- `latest_interaction`: Newest workflow timestamp

### Training Readiness Section
- `total_examples`: Total examples available
- `successful_examples`: Successfully generated workflows
- `quality_examples`: High-quality examples (positive feedback or edited)
- `examples_with_feedback`: Examples with any feedback
- `readiness_score`: 0-100 score indicating training readiness
- `recommendation`: Human-readable recommendation
- `is_ready`: Boolean - true if score ≥ 70

**Readiness Score Formula:**
```
score = (successful * 40 / max(100, total)) +
        (quality * 40 / max(50, total)) +
        (with_feedback * 20 / max(20, total))
```

### Recommendations Section
Dynamic list of actionable recommendations based on:
- Storage size and potential savings
- Feedback rates
- Training readiness per platform
- Data collection quality

## Example: Complete Real-World Response

```json
{
  "overview": {
    "total_records": 2847,
    "active_records": 1923,
    "archived_records": 924,
    "compressed_records": 748,
    "records_with_feedback": 512
  },
  "storage": {
    "supabase_size_bytes": 156237824,
    "supabase_size_display": "149.00 MB",
    "archived_size_bytes": 18874368,
    "archived_size_display": "18.00 MB",
    "total_size_bytes": 175112192,
    "total_size_display": "167.00 MB"
  },
  "costs": {
    "supabase_monthly_usd": 18.63,
    "r2_monthly_usd": 0.27,
    "total_monthly_usd": 18.90,
    "cost_without_archiving_usd": 20.86,
    "savings_monthly_usd": 1.96,
    "savings_percentage": 9.4
  },
  "by_platform": {
    "zapier": {
      "platform": "zapier",
      "total_interactions": 1050,
      "successful_interactions": 998,
      "failed_interactions": 52,
      "success_rate": 95.05,
      "thumbs_up_count": 215,
      "thumbs_down_count": 28,
      "edited_count": 15,
      "total_feedback_count": 258,
      "avg_size_bytes": 48128,
      "total_size_bytes": 50534400,
      "compressed_count": 285,
      "avg_processing_time_ms": 1523,
      "archived_count": 350,
      "active_count": 700,
      "earliest_interaction": "2024-06-01T00:00:00Z",
      "latest_interaction": "2024-10-15T14:23:45Z"
    },
    "make": {
      "platform": "make",
      "total_interactions": 875,
      "successful_interactions": 831,
      "failed_interactions": 44,
      "success_rate": 94.97,
      "thumbs_up_count": 142,
      "thumbs_down_count": 22,
      "edited_count": 18,
      "total_feedback_count": 182,
      "avg_size_bytes": 42496,
      "total_size_bytes": 37184000,
      "compressed_count": 225,
      "avg_processing_time_ms": 1398,
      "archived_count": 292,
      "active_count": 583,
      "earliest_interaction": "2024-06-15T00:00:00Z",
      "latest_interaction": "2024-10-15T13:52:18Z"
    },
    "n8n": {
      "platform": "n8n",
      "total_interactions": 922,
      "successful_interactions": 865,
      "failed_interactions": 57,
      "success_rate": 93.82,
      "thumbs_up_count": 58,
      "thumbs_down_count": 12,
      "edited_count": 2,
      "total_feedback_count": 72,
      "avg_size_bytes": 55296,
      "total_size_bytes": 50982912,
      "compressed_count": 238,
      "avg_processing_time_ms": 1687,
      "archived_count": 282,
      "active_count": 640,
      "earliest_interaction": "2024-07-01T00:00:00Z",
      "latest_interaction": "2024-10-15T15:10:33Z"
    }
  },
  "training_readiness": {
    "zapier": {
      "platform": "zapier",
      "total_examples": 1050,
      "successful_examples": 998,
      "quality_examples": 230,
      "examples_with_feedback": 258,
      "readiness_score": 92,
      "recommendation": "Ready for training",
      "is_ready": true
    },
    "make": {
      "platform": "make",
      "total_examples": 875,
      "successful_examples": 831,
      "quality_examples": 160,
      "examples_with_feedback": 182,
      "readiness_score": 88,
      "recommendation": "Ready for training",
      "is_ready": true
    },
    "n8n": {
      "platform": "n8n",
      "total_examples": 922,
      "successful_examples": 865,
      "quality_examples": 60,
      "examples_with_feedback": 72,
      "readiness_score": 71,
      "recommendation": "Ready for training",
      "is_ready": true
    }
  },
  "recommendations": [
    "✅ zapier: Ready for training with 1050 examples",
    "✅ make: Ready for training with 875 examples",
    "✅ n8n: Ready for training with 922 examples",
    "💰 Excellent archiving setup! Saving $1.96/month (9.4%)",
    "📈 High feedback rate (18%) - Great quality data!",
    "🎯 All platforms ready for model training"
  ]
}
```

## Interpreting the Data

### Health Indicators

**Good Signs:**
- ✅ Success rate > 90%
- ✅ Feedback rate > 10% (`records_with_feedback / total_records`)
- ✅ Readiness score ≥ 70
- ✅ Active archiving with savings > 80%

**Warning Signs:**
- ⚠️ Success rate < 85%
- ⚠️ Feedback rate < 5%
- ⚠️ Readiness score < 50
- ⚠️ Supabase size > 1GB without archiving

**Action Required:**
- ❌ No feedback being collected
- ❌ All interactions failing
- ❌ No data being collected at all

### Cost Optimization Metrics

| Storage Size | Without Archiving | With R2 | Savings/Month | Savings/Year |
|--------------|-------------------|---------|---------------|--------------|
| 100 MB | $1.25 | $0.15 | $1.10 | $13.20 |
| 1 GB | $12.50 | $1.50 | $11.00 | $132.00 |
| 10 GB | $125.00 | $15.00 | $110.00 | $1,320.00 |
| 100 GB | $1,250.00 | $150.00 | $1,100.00 | $13,200.00 |

### Training Readiness Thresholds

| Score | Status | Recommendation |
|-------|--------|----------------|
| 0-40 | ❌ Not Ready | Collect more data (target: 100+ examples) |
| 41-69 | ⚠️ Insufficient | Need more feedback and quality examples |
| 70-84 | ✅ Ready | Sufficient for initial training |
| 85-100 | ⭐ Excellent | High-quality dataset, train now! |

## Usage Examples

### Check if Ready to Train

```python
import requests

response = requests.get('https://api.example.com/api/feedback/stats')
stats = response.json()

for platform, readiness in stats['training_readiness'].items():
    if readiness['is_ready']:
        print(f"✅ {platform}: Ready to train!")
        print(f"   Examples: {readiness['total_examples']}")
        print(f"   Score: {readiness['readiness_score']}")
    else:
        print(f"⏳ {platform}: {readiness['recommendation']}")
```

### Monitor Storage Costs

```python
stats = get_storage_stats()
costs = stats['costs']

if costs['supabase_monthly_usd'] > 10:
    if not costs.get('r2_monthly_usd'):
        print("⚠️ Consider enabling archiving to reduce costs!")
    else:
        savings_pct = costs['savings_percentage']
        print(f"💰 Saving {savings_pct:.1f}% with archiving")
```

### Alert on Low Feedback

```python
overview = stats['overview']
feedback_rate = overview['records_with_feedback'] / overview['total_records']

if feedback_rate < 0.1:  # Less than 10%
    print("⚠️ Low feedback rate! Encourage users to rate workflows.")
```

---

This format is consistent across all interfaces (API, CLI, monitoring) for easy integration and automation.

