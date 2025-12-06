import axios from 'axios';
import { supabase } from '@/contexts/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add interceptor to include auth token in requests
apiClient.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Add response interceptor to handle auth errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Clear session and redirect to login
      await supabase.auth.signOut();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Chat API
export const sendChatMessage = async (
  sessionId: string,
  message: string,
  platform?: string
) => {
  const response = await apiClient.post('/api/chat/message', {
    session_id: sessionId,
    message,
    platform,
  });
  return response.data;
};

export const getChatHistory = async (sessionId: string) => {
  const response = await apiClient.get(`/api/chat/history/${sessionId}`);
  return response.data;
};

// Workflow API
export const generateWorkflow = async (
  platform: string,
  intent: any,
  parameters: any,
  workflowName?: string
) => {
  const response = await apiClient.post('/api/workflows/generate', {
    platform,
    intent,
    parameters,
    workflow_name: workflowName,
  });
  return response.data;
};

export const validateWorkflow = async (workflow: any, platform: string) => {
  const response = await apiClient.post('/api/workflows/validate', {
    workflow,
    platform,
  });
  return response.data;
};

export const exportWorkflow = async (workflowId: string) => {
  const response = await apiClient.post(
    `/api/workflows/${workflowId}/export`,
    {},
    { responseType: 'blob' }
  );
  return response.data;
};

export const getWorkflows = async (
  platform?: string,
  limit: number = 50,
  offset: number = 0
) => {
  const response = await apiClient.get('/api/workflows', {
    params: { platform, limit, offset },
  });
  return response.data;
};

export const getWorkflowById = async (workflowId: string) => {
  const response = await apiClient.get(`/api/workflows/${workflowId}`);
  return response.data;
};

export const updateWorkflow = async (
  workflowId: string,
  updates: any
) => {
  const response = await apiClient.put(`/api/workflows/${workflowId}`, updates);
  return response.data;
};

export const deleteWorkflow = async (workflowId: string) => {
  await apiClient.delete(`/api/workflows/${workflowId}`);
};

// Platform API
export const getPlatforms = async () => {
  const response = await apiClient.get('/api/platforms');
  return response.data;
};

export const getPlatformCapabilities = async (platform: string) => {
  const response = await apiClient.get(`/api/platforms/${platform}/capabilities`);
  return response.data;
};

// Templates API
export const getTemplates = async (platform?: string) => {
  const response = await apiClient.get('/api/workflow/templates', {
    params: { platform },
  });
  return response.data;
};

// Health Check
export const checkHealth = async () => {
  const response = await apiClient.get('/health');
  return response.data;
};

// ============================================================================
// n8n Chat API with Streaming (Claude + n8n-mcp)
// ============================================================================

export interface N8nChatMessage {
  message: string;
  conversation_id?: string;
}

export interface StreamEvent {
  event: string;
  data: any;
}

/**
 * Stream chat messages from Claude AI with n8n-mcp integration.
 * Uses Server-Sent Events (SSE) for real-time streaming.
 */
export const streamN8nChat = async (
  message: string,
  conversationId?: string,
  onEvent?: (event: StreamEvent) => void
): Promise<void> => {
  return streamChat('/api/n8n/chat', message, conversationId, onEvent);
};

/**
 * Stream chat messages from Claude AI with make-mcp integration.
 * Uses Server-Sent Events (SSE) for real-time streaming.
 */
export const streamMakeChat = async (
  message: string,
  conversationId?: string,
  onEvent?: (event: StreamEvent) => void
): Promise<void> => {
  return streamChat('/api/make/chat', message, conversationId, onEvent);
};

/**
 * Generic stream chat function for platform-specific endpoints.
 */
const streamChat = async (
  endpoint: string,
  message: string,
  conversationId?: string,
  onEvent?: (event: StreamEvent) => void
): Promise<void> => {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  const url = `${API_BASE_URL}${endpoint}`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
    },
    body: JSON.stringify({
      message,
      conversation_id: conversationId,
    }),
  });

  if (!response.ok) {
    throw new Error(`Chat request failed: ${response.statusText}`);
  }

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();

  if (!reader) {
    throw new Error('Response body is not readable');
  }

  try {
    while (true) {
      const { done, value } = await reader.read();
      
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n\n');

      for (const line of lines) {
        if (!line.trim()) continue;

        // Parse SSE format: "event: eventName\ndata: jsonData"
        const eventMatch = line.match(/event: (.+)\ndata: (.+)/s);
        
        if (eventMatch) {
          const [, eventType, dataStr] = eventMatch;
          
          try {
            const data = JSON.parse(dataStr);
            
            if (onEvent) {
              onEvent({ event: eventType, data });
            }
          } catch (e) {
            console.error('Failed to parse SSE data:', e);
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
};

/**
 * Validate a workflow using n8n-mcp.
 */
export const validateN8nWorkflow = async (
  workflow: any,
  profile: 'strict' | 'balanced' | 'permissive' = 'balanced'
) => {
  const response = await apiClient.post('/api/n8n/validate-workflow', {
    workflow,
    profile,
  });
  return response.data;
};

/**
 * Deploy a workflow to n8n.
 */
export const deployN8nWorkflow = async (
  workflow: any,
  conversationId?: string
) => {
  const response = await apiClient.post('/api/n8n/deploy-workflow', {
    workflow,
    conversation_id: conversationId,
  });
  return response.data;
};

/**
 * Get list of user's conversations.
 */
export const getN8nConversations = async (
  limit: number = 50,
  offset: number = 0
) => {
  const response = await apiClient.get('/api/n8n/conversations', {
    params: { limit, offset },
  });
  return response.data;
};

/**
 * Get a specific conversation with messages.
 */
export const getN8nConversation = async (conversationId: string) => {
  const response = await apiClient.get(`/api/n8n/conversations/${conversationId}`);
  return response.data;
};

/**
 * Delete a conversation.
 */
export const deleteN8nConversation = async (conversationId: string) => {
  await apiClient.delete(`/api/n8n/conversations/${conversationId}`);
};

// ============================================================================
// Translation API
// ============================================================================

/**
 * Translate a workflow from one platform to another.
 */
export const translateWorkflow = async (
  workflow: any,
  sourcePlatform: string,
  targetPlatform: string,
  optimize: boolean = true
) => {
  const response = await apiClient.post('/api/translate/workflow', {
    workflow,
    source_platform: sourcePlatform,
    target_platform: targetPlatform,
    optimize,
    preserve_names: false,
    strict_mode: false,
    validate_result: false
  });
  return response.data;
};

/**
 * Translate a workflow to all supported platforms.
 */
export const translateWorkflowToAll = async (
  workflow: any,
  sourcePlatform: string
) => {
  const platforms = ['n8n', 'make', 'zapier'].filter(p => p !== sourcePlatform);
  const translations = await Promise.all(
    platforms.map(target => 
      translateWorkflow(workflow, sourcePlatform, target)
    )
  );
  
  return {
    [platforms[0]]: translations[0],
    [platforms[1]]: translations[1]
  };
};

/**
 * Check if a workflow translation is feasible.
 */
export const checkTranslationFeasibility = async (
  workflow: any,
  sourcePlatform: string,
  targetPlatform: string
) => {
  const response = await apiClient.post('/api/translate/feasibility', {
    workflow,
    source_platform: sourcePlatform,
    target_platform: targetPlatform
  });
  return response.data;
};

// Auth API
export const getUserProfile = async () => {
  const response = await apiClient.get('/api/auth/me');
  return response.data;
};

export const refreshToken = async () => {
  const response = await apiClient.post('/api/auth/refresh');
  return response.data;
};

// Feedback API
export const submitFeedback = async (
  interactionId: string,
  feedbackType: 'thumbs_up' | 'thumbs_down' | 'edit' | 'report',
  feedbackText?: string,
  correctedWorkflow?: any,
  correctionNotes?: string,
  issueCategory?: string,
  sentimentScore?: number
) => {
  const response = await apiClient.post('/api/feedback/submit', {
    interaction_id: interactionId,
    feedback_type: feedbackType,
    feedback_text: feedbackText,
    corrected_workflow: correctedWorkflow,
    correction_notes: correctionNotes,
    issue_category: issueCategory,
    sentiment_score: sentimentScore,
  });
  return response.data;
};

export const getTrainingStats = async () => {
  const response = await apiClient.get('/api/feedback/stats');
  return response.data;
};

export const getTrainingReadiness = async (platform: string) => {
  const response = await apiClient.get(`/api/feedback/readiness/${platform}`);
  return response.data;
};

export const triggerArchive = async (daysOld: number = 30, dryRun: boolean = false) => {
  const response = await apiClient.post('/api/feedback/archive', {
    days_old: daysOld,
    dry_run: dryRun,
  });
  return response.data;
};

export const exportTrainingData = async (
  platform: string,
  successOnly: boolean = true,
  withFeedbackOnly: boolean = false
) => {
  const response = await apiClient.get(`/api/feedback/export/${platform}`, {
    params: {
      success_only: successOnly,
      with_feedback_only: withFeedbackOnly,
      output_format: 'openai',
    },
    responseType: 'blob',
  });
  return response.data;
};

export const deleteInteractionData = async (interactionId: string) => {
  await apiClient.delete(`/api/feedback/data/${interactionId}`);
};
