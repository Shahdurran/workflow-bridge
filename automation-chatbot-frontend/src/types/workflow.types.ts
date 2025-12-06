// Workflow-related types for FastAPI backend integration

export interface WorkflowNode {
  id: string;
  type: 'trigger' | 'action' | 'logic';
  app: string;
  action: string;
  position: { x: number; y: number };
  data?: Record<string, any>;
}

export interface WorkflowConnection {
  source: string;
  target: string;
}

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  platform: string;
  nodes: WorkflowNode[];
  connections: WorkflowConnection[];
  created_at: string;
  updated_at: string;
}

export interface WorkflowCreate {
  name: string;
  description?: string;
  platform: string;
  nodes: WorkflowNode[];
  connections: WorkflowConnection[];
}

export interface WorkflowUpdate {
  name?: string;
  description?: string;
  platform?: string;
  nodes?: WorkflowNode[];
  connections?: WorkflowConnection[];
}

export interface WorkflowGenerationRequest {
  session_id: string;
  platform: string;
  requirements?: Record<string, any>;
  template_id?: string;
}

export interface WorkflowGenerationResponse {
  workflow_json: Record<string, any>;
  platform: string;
  validation_status: string;
  warnings?: string[];
  metadata?: Record<string, any>;
}

export interface WorkflowValidationRequest {
  workflow_json: Record<string, any>;
  platform: string;
  strict?: boolean;
}

export interface WorkflowValidationResponse {
  is_valid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
  platform_specific?: Record<string, any>;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  category: 'Marketing' | 'Sales' | 'Productivity' | 'E-commerce';
  apps: string[];
  nodes: WorkflowNode[];
  connections: WorkflowConnection[];
  complexity: 'Beginner' | 'Advanced';
}

// Platform-related types
// Beta phase: Only Make and n8n supported
// 'zapier' type kept for future use but disabled in UI
export type Platform = 'make' | 'n8n' | 'zapier';

export interface PlatformInfo {
  id: string;
  name: string;
  description: string;
  website: string;
  documentation: string;
  pricing_model: string;
  supported_features: string[];
  integration_count: number;
}

export interface PlatformCapabilities {
  platform_id: string;
  triggers: Array<Record<string, any>>;
  actions: Array<Record<string, any>>;
  data_types: string[];
  authentication_methods: string[];
  limitations: Record<string, any>;
  advanced_features: string[];
}

export interface IntegrationInfo {
  id: string;
  name: string;
  category: string;
  description: string;
  icon_url?: string;
  supported_platforms: string[];
  triggers: string[];
  actions: string[];
  authentication_required: boolean;
}

// Export formats
export interface ExportData {
  workflow_id: string;
  platform: string;
  format: string;
  exported_at: string;
  data: Record<string, any>;
}

// Local workflow state types (for UI)
export interface WorkflowState {
  nodes: WorkflowNode[];
  connections: WorkflowConnection[];
  platform: Platform;
  isLoading: boolean;
  error?: string;
}

export interface WorkflowCanvasState {
  selectedNode?: string;
  selectedConnection?: string;
  isExporting: boolean;
  exportFormat?: Platform;
}

// Feedback and Training Data types
export type FeedbackType = 'thumbs_up' | 'thumbs_down' | 'edit' | 'report';

export type IssueCategoryType = 'incorrect_workflow' | 'missing_steps' | 'wrong_platform' | 'other';

export interface FeedbackRequest {
  interaction_id: string;
  feedback_type: FeedbackType;
  feedback_text?: string;
  sentiment_score?: number; // 1-5
  corrected_workflow?: Record<string, any>;
  correction_notes?: string;
  issue_category?: IssueCategoryType;
  session_id?: string;
}

export interface FeedbackResponse {
  success: boolean;
  feedback_id?: string;
  message: string;
}

export interface TrainingStats {
  overview: {
    total_records: number;
    active_records: number;
    archived_records: number;
    compressed_records: number;
    records_with_feedback: number;
  };
  storage: {
    supabase_size_bytes: number;
    supabase_size_display: string;
    archived_size_bytes: number;
    archived_size_display: string;
    total_size_bytes: number;
    total_size_display: string;
  };
  costs: {
    supabase_monthly_usd: number;
    r2_monthly_usd: number;
    total_monthly_usd: number;
    cost_without_archiving_usd: number;
    savings_monthly_usd: number;
    savings_percentage: number;
  };
  by_platform: Record<string, PlatformStats>;
  training_readiness: Record<string, TrainingReadiness>;
  recommendations: string[];
}

export interface PlatformStats {
  platform: string;
  total_interactions: number;
  successful_interactions: number;
  failed_interactions: number;
  success_rate: number;
  thumbs_up_count: number;
  thumbs_down_count: number;
  edited_count: number;
  total_feedback_count: number;
  avg_size_bytes: number;
  total_size_bytes: number;
  compressed_count: number;
  avg_processing_time_ms: number;
  archived_count: number;
  active_count: number;
  earliest_interaction: string;
  latest_interaction: string;
}

export interface TrainingReadiness {
  platform: string;
  total_examples: number;
  successful_examples: number;
  quality_examples: number;
  examples_with_feedback: number;
  readiness_score: number;
  recommendation: string;
  is_ready: boolean;
}

export interface ArchiveRequest {
  days_old: number;
  dry_run: boolean;
}

export interface ArchiveResponse {
  success: boolean;
  archived_count: number;
  archives?: Array<{
    platform: string;
    date: string;
    records_count: number;
    uncompressed_size: number;
    compressed_size: number;
    compression_ratio: number;
    s3_key: string;
  }>;
  message: string;
}

// Extended workflow response with interaction_id for feedback
export interface WorkflowGenerationResponseWithFeedback extends WorkflowGenerationResponse {
  interaction_id?: string;
}