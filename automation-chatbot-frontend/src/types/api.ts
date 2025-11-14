// API Response Types for the FastAPI backend

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

export type Platform = 'zapier' | 'make' | 'n8n';
