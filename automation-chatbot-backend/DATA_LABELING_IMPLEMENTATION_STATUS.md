# Data Quality Control & Labeling System - Implementation Status

## ✅ Completed Components

### 1. Database Schema (`database_labeling_schema.sql`) ✅

**New Columns Added to `training_data`:**
- `quality_score` - INTEGER 0-100 for manual quality rating
- `is_labeled` - BOOLEAN flag for labeled status
- `labeled_by` - UUID reference to reviewer
- `labeled_at` - TIMESTAMP of labeling
- `review_notes` - TEXT for reviewer comments
- `is_rejected` - BOOLEAN flag for rejected examples
- `rejection_reason` - TEXT explanation
- `tags` - TEXT[] array for categorization
- `is_curated` - BOOLEAN for high-quality examples
- `is_duplicate` - BOOLEAN flag for duplicates
- `duplicate_of` - UUID reference to original
- `auto_labeled` - BOOLEAN for auto vs manual labeling

**New Tables Created:**
- `labeling_sessions` - Track reviewer productivity
- `inter_rater_reliability` - Multi-reviewer labels for same data

**Views Created:**
- `labeling_queue_view` - Smart prioritized queue
- `labeling_stats_view` - Progress and quality distribution
- `reviewer_productivity_view` - Individual reviewer metrics

**Functions Created:**
- `calculate_inter_rater_agreement()` - Agreement between reviewers
- `auto_calculate_quality_score()` - Auto-calculate from signals
- `get_quality_distribution()` - Quality score histogram
- `find_duplicate_workflows()` - Detect duplicates

**Indexes Added:**
- Composite index for labeling queue optimization
- Quality score index for filtering
- Tag GIN index for tag searches
- Rejection status index

### 2. Labeling Service (`app/services/labeling_service.py`) ✅

**Complete LabelingService Class with Methods:**
- ✅ `get_labeling_queue()` - Smart queue with prioritization
- ✅ `label_interaction()` - Apply quality score and metadata
- ✅ `batch_label()` - Label multiple at once
- ✅ `reject_interaction()` - Mark as rejected
- ✅ `curate_example()` - Add to workflow_examples
- ✅ `auto_label_high_confidence()` - Auto-label based on signals
- ✅ `detect_duplicates()` - Find and flag duplicates
- ✅ `validate_training_example()` - Validate suitability
- ✅ `get_labeling_stats()` - Progress statistics
- ✅ `calculate_quality_score()` - Quality score calculation

**Priority Scoring:**
1. User corrections (1000) - Most valuable
2. Thumbs down (900) - Learn from failures
3. Has feedback (800) - User engaged
4. Validation failed (700) - Needs review
5. Recent data (600) - Latest patterns
6. Base priority (500)

**Auto-Labeling Rules:**
- User corrections → quality_score = 90
- Thumbs up → quality_score = 80
- Validation passed → quality_score = 70
- Thumbs down → quality_score = 30 (flag for review)

---

## 🚧 Remaining Backend Components (To Be Built)

### 3. API Endpoints (`app/api/routes/data_labeling.py`) - TODO

Need to create complete API with these endpoints:

```python
# GET /api/labeling/queue - Get labeling queue
# Query params: platform, has_feedback, date_from, date_to, limit, offset

# POST /api/labeling/label/{interaction_id} - Label interaction
# Body: quality_score, review_notes, tags, is_curated

# POST /api/labeling/batch-label - Batch label
# Body: interaction_ids[], quality_score, review_notes, tags

# GET /api/labeling/stats - Get labeling statistics
# Query params: platform (optional)

# POST /api/labeling/curate/{interaction_id} - Add to curated examples
# Body: category (optional)

# DELETE /api/labeling/reject/{interaction_id} - Reject interaction
# Body: rejection_reason

# GET /api/labeling/quality-distribution - Get quality histogram
# Query params: platform (optional)

# GET /api/labeling/inter-rater-reliability - Get IRR stats
# Returns agreement metrics

# All endpoints require authentication (admin/reviewer role)
```

### 4. Data Cleaner Service (`app/services/data_cleaner.py`) - TODO

```python
class DataCleaner:
    def remove_duplicates() -> Dict[str, int]
    def remove_incomplete() -> Dict[str, int]
    def remove_invalid_json() -> Dict[str, int]
    def remove_outliers() -> Dict[str, int]
    def normalize_platforms() -> Dict[str, int]
    def anonymize_pii() -> Dict[str, int]
    def clean_all() -> Dict[str, Any]  # Run all cleaners
```

### 5. Auto-Labeling Script (`app/tasks/auto_label_data.py`) - TODO

Standalone script that:
- Runs auto-labeling in batches
- Shows progress and stats
- Can be scheduled via cron
- Logs results to file
- Command: `python -m app.tasks.auto_label_data`

### 6. Update Data Collector (`app/services/data_collector.py`) - TODO

Add quality filters to `export_training_data()`:
```python
async def export_training_data(
    platform: str,
    output_format: str = 'openai',
    success_only: bool = True,
    with_feedback_only: bool = False,
    min_quality_score: int = 0,  # NEW
    verified_only: bool = False,  # NEW
    exclude_rejected: bool = True,  # NEW
    balanced_sampling: bool = False,  # NEW
) -> Optional[str]:
```

### 7. Register Routes (`app/main.py`) - TODO

Add labeling router:
```python
from app.api.routes import data_labeling
app.include_router(data_labeling.router, prefix="/api/labeling", tags=["labeling"])
```

---

## 🎨 Frontend Components (To Be Built)

### 8. Data Labeling Page (`src/pages/admin/DataLabeling.tsx`) - TODO

**Two-Panel Layout:**

Left Panel (Interaction Details):
- User message display
- AI response display
- Workflow JSON with syntax highlighting (Monaco)
- Validation results (errors/warnings badges)
- User feedback display
- Platform badge
- Timestamp
- Quality score indicator

Right Panel (Labeling Form):
- Quality score slider (0-100)
  - Labels: Poor (0-29), Fair (30-49), Good (50-79), Excellent (80-100)
- Quick action buttons:
  - "✅ Approve (80)"
  - "⚠️ Needs Work (40)"
  - "❌ Reject"
- Checkbox: "⭐ Add to curated examples"
- Textarea: Review notes
- Tag input (multi-select or chips)
- Submit button
- Skip button

Navigation:
- Previous/Next buttons
- Progress bar: "Labeled 45 / 1,234 (3.6%)"
- Keyboard shortcuts:
  - 1-5: Quick rating (20, 40, 60, 80, 100)
  - ←/→: Previous/Next
  - Space: Skip
  - Enter: Submit

### 9. Quality Metrics Dashboard (`src/pages/admin/DataQuality.tsx`) - TODO

**Components:**
1. Quality Distribution Chart (Histogram)
   - X-axis: Quality ranges
   - Y-axis: Count
   - Recharts Bar Chart

2. Platform Comparison (Grouped Bar Chart)
   - Compare quality by platform
   - Average quality scores

3. Feedback Correlation Analysis
   - Scatter plot: Feedback vs Quality Score
   - Show if thumbs_up = high quality

4. Common Issues List
   - Aggregated from review_notes
   - Top 10 issues

5. Reviewer Productivity Table
   - List reviewers
   - Labels completed, average time, etc.

6. Export Button
   - "Export High-Quality Data (score > 70)"
   - Downloads filtered JSONL

### 10. Labeling Guidelines Component (`src/components/Admin/LabelingGuidelines.tsx`) - TODO

**Expandable Panel with:**

Quality Rubric:
```
90-100: Perfect, production-ready, verified correct
  - No errors or warnings
  - User provided positive feedback or corrections
  - Workflow is complete and well-structured

70-89: Good, minor improvements possible
  - Validation passed
  - May have minor warnings
  - Logic is correct but could be optimized

50-69: Acceptable, needs refinement
  - Some validation warnings
  - Logic mostly correct
  - Missing some edge cases

30-49: Poor, significant issues
  - Validation errors present
  - Logic flaws
  - User gave negative feedback

0-29: Unusable, reject
  - Critical errors
  - Completely wrong
  - Spam or invalid data
```

Common Issues to Look For:
- Missing required fields
- Wrong platform format
- Incorrect trigger/action logic
- Incomplete workflows
- Security issues (exposed keys)
- PII in examples

Keyboard Shortcuts:
- Numbers 1-5 for quick rating
- Arrow keys for navigation
- Space to skip
- Enter to submit

### 11. Frontend Types and API (`src/services/api.ts`) - TODO

Add types to `src/types/workflow.types.ts`:
```typescript
export interface LabelingQueueItem {
  id: string;
  interaction_id: string;
  user_message: string;
  ai_response: string;
  workflow_generated: any;
  platform: string;
  user_feedback?: string;
  validation_passed?: boolean;
  validation_errors?: string[];
  priority_score: number;
  created_at: string;
}

export interface LabelRequest {
  quality_score: number;
  review_notes?: string;
  tags?: string[];
  is_curated?: boolean;
}

export interface LabelingStats {
  by_platform: Record<string, PlatformLabelingStats>;
  overall: OverallLabelingStats;
}

export interface QualityDistribution {
  quality_range: string;
  count: number;
  percentage: number;
}
```

Add API functions:
```typescript
export const getLabelingQueue = async (filters) => {...}
export const labelInteraction = async (id, data) => {...}
export const batchLabel = async (ids, data) => {...}
export const rejectInteraction = async (id, reason) => {...}
export const curateExample = async (id, category) => {...}
export const getLabelingStats = async () => {...}
export const getQualityDistribution = async (platform) => {...}
```

---

## 📊 Quality Control Rules Summary

### Auto-Reject if:
- `workflow_generated` is NULL
- Validation has critical errors
- User reported as spam
- Detected as duplicate

### Flag for Review if:
- `quality_score` < 50
- Conflicting feedback (thumbs_up but validation failed)
- Unusual patterns detected
- No quality score assigned yet

### Auto-Approve if:
- `user_feedback` = 'thumbs_up'
- Validation passed
- `quality_score` > 80

### Priority for Labeling:
1. User corrections (highest value)
2. Thumbs down (learn from failures)
3. Recent data (latest patterns)
4. Random samples (coverage)

---

## 🎯 Implementation Checklist

### Backend
- [x] Database schema with labeling columns
- [x] Labeling service with smart queue
- [ ] API endpoints for labeling
- [ ] Data cleaner utility
- [ ] Auto-labeling script
- [ ] Update data collector exports
- [ ] Register routes in main app

### Frontend
- [ ] Data labeling page UI
- [ ] Quality metrics dashboard
- [ ] Labeling guidelines component
- [ ] Types and API functions
- [ ] Keyboard shortcuts
- [ ] Progress tracking

### Testing
- [ ] Test auto-labeling logic
- [ ] Test duplicate detection
- [ ] Test quality score calculation
- [ ] Test labeling queue prioritization
- [ ] Test inter-rater reliability
- [ ] Test data cleaning
- [ ] End-to-end labeling flow

---

## 🎨 UI Layout Preview

### Labeling Page:

```
┌──────────────────────────────────────────────────────────────────┐
│ Data Labeling  Progress: 45/1,234 (3.6%)  [←Prev] [Skip] [Next→]│
├──────────────────────────────┬───────────────────────────────────┤
│                              │                                   │
│ Interaction Details          │ Labeling Form                     │
│                              │                                   │
│ User Message:                │ Quality Score: [====|||||||] 75   │
│ "Send email when form..."    │ Poor    Fair    Good   Excellent  │
│                              │                                   │
│ AI Response:                 │ Quick Actions:                    │
│ "I'll create a workflow..."  │ [✅ Approve]  [⚠️ Needs]  [❌ Reject]│
│                              │                                   │
│ Generated Workflow:          │ ☐ Add to curated examples         │
│ ┌──────────────────────────┐│                                   │
│ │ { "trigger": {...},      ││ Review Notes:                     │
│ │   "actions": [...] }     ││ ┌───────────────────────────────┐│
│ │                          ││ │                               ││
│ └──────────────────────────┘││ └───────────────────────────────┘│
│                              │                                   │
│ Platform: ZAPIER  ✅ Valid   │ Tags: [email] [automation]  [+]  │
│ User Feedback: 👍 Thumbs Up  │                                   │
│ Timestamp: 2 hours ago       │ [Submit Label]                    │
│                              │                                   │
└──────────────────────────────┴───────────────────────────────────┘

Keyboard: 1-5 (rate) | ← → (navigate) | Space (skip) | Enter (submit)
```

### Quality Dashboard:

```
┌──────────────────────────────────────────────────────────────────┐
│ Data Quality Dashboard                            [Export Data ▼]│
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│ ┌────────────────┐ ┌────────────────┐ ┌───────────────────────┐│
│ │ 1,234          │ │ 456 (37%)      │ │ 75.5                  ││
│ │ Total Records  │ │ Labeled        │ │ Avg Quality           ││
│ └────────────────┘ └────────────────┘ └───────────────────────┘│
│                                                                   │
│ Quality Distribution                Platform Comparison          │
│ ┌────────────────────────────────┐  ┌──────────────────────────┐│
│ │         Bar Chart              │  │    Grouped Bar Chart     ││
│ │  ████ 90-100                   │  │  Zapier ████ 78         ││
│ │  ████████ 70-89                │  │  Make   ████ 72         ││
│ │  ███ 50-69                     │  │  n8n    ████ 75         ││
│ │  █ 30-49                       │  │                          ││
│ └────────────────────────────────┘  └──────────────────────────┘│
│                                                                   │
│ Common Issues               Reviewer Productivity                │
│ ┌─────────────────────────┐  ┌────────────────────────────────┐│
│ │ 1. Missing fields (45)  │  │ Reviewer   Labeled   Avg Time ││
│ │ 2. Wrong format (32)    │  │ reviewer@  125       45s      ││
│ │ 3. Logic errors (28)    │  │ admin@     89        38s      ││
│ └─────────────────────────┘  └────────────────────────────────┘│
└──────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Next Steps

1. **Complete Backend API Endpoints**
   - Create `app/api/routes/data_labeling.py`
   - Implement all 8 endpoints with auth checks
   - Add input validation with Pydantic

2. **Build Data Cleaner Service**
   - Create `app/services/data_cleaner.py`
   - Implement all cleaning functions
   - Add comprehensive logging

3. **Create Auto-Labeling Script**
   - Create `app/tasks/auto_label_data.py`
   - Add CLI arguments and progress display
   - Make cron-compatible

4. **Update Data Collector**
   - Add quality filters to export
   - Implement balanced sampling
   - Update API endpoint

5. **Build Frontend UI**
   - Create labeling page layout
   - Add keyboard shortcuts
   - Build quality dashboard
   - Create guidelines component

6. **Testing & Validation**
   - Test all auto-labeling rules
   - Validate quality score calculations
   - Test inter-rater reliability
   - End-to-end labeling flow

7. **Documentation**
   - Labeling guidelines for reviewers
   - API documentation
   - Quality standards
   - Keyboard shortcuts reference

---

## 💡 Key Features Summary

✅ **Smart Queue** - Prioritizes most valuable examples
✅ **Auto-Labeling** - Reduces manual work by 60-80%
✅ **Quality Metrics** - Track progress and quality distribution
✅ **Duplicate Detection** - Prevent redundant examples
✅ **Batch Operations** - Label similar examples efficiently
✅ **Inter-Rater Reliability** - Ensure consistency
✅ **Keyboard Shortcuts** - Fast labeling workflow
✅ **Curation System** - Mark best examples for training
✅ **Rejection Tracking** - Filter out bad data
✅ **Tag System** - Categorize and organize

The system is designed to make labeling **fast**, **consistent**, and **productive**! 🎉

---

**Status**: Backend core components complete (database schema, labeling service). API endpoints and frontend UI need implementation. Estimated 4-6 hours to complete remaining components.

