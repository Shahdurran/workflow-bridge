// API Response Types for the FastAPI backend

export interface WorkflowNode {
  id: string;
  type: 'trigger' | 'action' | 'logic';
  app: string;
  action: string;
  position: { x: number; y: number } | [number, number];
  data?: Record<string, any>;
  // n8n-specific fields
  parameters?: Record<string, any>;
  credentials?: Record<string, any>;
  typeVersion?: number;
  nodeType?: string; // Full node type like "n8n-nodes-base.webhook"
  disabled?: boolean;
  notes?: string;
  continueOnFail?: boolean;
  retryOnFail?: boolean;
  maxTries?: number;
  waitBetweenTries?: number;
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

// Beta phase: Only Make and n8n supported
// 'zapier' type kept for future use but disabled in UI
export type Platform = 'make' | 'n8n' | 'zapier';
