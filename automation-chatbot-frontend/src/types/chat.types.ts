// Chat-related types for FastAPI backend integration

export interface ChatMessage {
  id: string;
  workflow_id?: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface ChatMessageCreate {
  role: 'user' | 'assistant';
  content: string;
  workflow_id?: string;
}

export interface ChatMessageRequest {
  message: string;
  session_id?: string;
  context?: Record<string, any>;
}

export interface ChatMessageResponse {
  message: string;
  session_id: string;
  intent?: string;
  clarifying_questions?: string[];
  workflow_ready: boolean;
}

export interface ConversationHistory {
  session_id: string;
  messages: ChatMessage[];
  created_at: string;
  updated_at: string;
}

export interface ConversationSession {
  id: string;
  created_at: string;
  updated_at: string;
  message_count: number;
  last_activity: string;
  workflow_ready: boolean;
}

// Local chat state types (for UI)
export interface LocalMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isTyping?: boolean;
}

export interface ChatState {
  messages: LocalMessage[];
  isTyping: boolean;
  sessionId?: string;
  error?: string;
}

export interface AIResponse {
  message: string;
  nodes?: any[];
  connections?: any[];
}
