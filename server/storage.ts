import { type Workflow, type ChatMessage, type InsertWorkflow, type InsertChatMessage } from "@shared/schema";
import { randomUUID } from "crypto";
import { getTemplates } from "../client/src/data/templates";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  // Workflow methods
  getAllWorkflows(): Promise<Workflow[]>;
  getWorkflow(id: string): Promise<Workflow | undefined>;
  createWorkflow(workflow: InsertWorkflow): Promise<Workflow>;
  updateWorkflow(id: string, workflow: InsertWorkflow): Promise<Workflow | undefined>;
  
  // Chat methods
  getChatMessages(workflowId: string): Promise<ChatMessage[]>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  
  // Template methods
  getTemplates(): Promise<any[]>;
  
  // Export methods
  exportWorkflow(workflow: Workflow, platform: 'zapier' | 'make' | 'n8n'): Promise<any>;
}

export class MemStorage implements IStorage {
  private workflows: Map<string, Workflow>;
  private chatMessages: Map<string, ChatMessage[]>;

  constructor() {
    this.workflows = new Map();
    this.chatMessages = new Map();
  }

  async getAllWorkflows(): Promise<Workflow[]> {
    return Array.from(this.workflows.values());
  }

  async getWorkflow(id: string): Promise<Workflow | undefined> {
    return this.workflows.get(id);
  }

  async createWorkflow(insertWorkflow: InsertWorkflow): Promise<Workflow> {
    const id = randomUUID();
    const now = new Date();
    const workflow: Workflow = {
      ...insertWorkflow,
      description: insertWorkflow.description || null,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.workflows.set(id, workflow);
    return workflow;
  }

  async updateWorkflow(id: string, insertWorkflow: InsertWorkflow): Promise<Workflow | undefined> {
    const existing = this.workflows.get(id);
    if (!existing) return undefined;
    
    const updated: Workflow = {
      ...insertWorkflow,
      description: insertWorkflow.description || null,
      id,
      createdAt: existing.createdAt,
      updatedAt: new Date(),
    };
    this.workflows.set(id, updated);
    return updated;
  }

  async getChatMessages(workflowId: string): Promise<ChatMessage[]> {
    return this.chatMessages.get(workflowId) || [];
  }

  async createChatMessage(insertMessage: InsertChatMessage): Promise<ChatMessage> {
    const id = randomUUID();
    const message: ChatMessage = {
      ...insertMessage,
      workflowId: insertMessage.workflowId || null,
      id,
      timestamp: new Date(),
    };
    
    const workflowId = insertMessage.workflowId || 'default';
    const messages = this.chatMessages.get(workflowId) || [];
    messages.push(message);
    this.chatMessages.set(workflowId, messages);
    
    return message;
  }

  async getTemplates(): Promise<any[]> {
    return getTemplates();
  }

  async exportWorkflow(workflow: Workflow, platform: 'zapier' | 'make' | 'n8n'): Promise<any> {
    // Simple export logic - in a real app this would be more sophisticated
    const nodes = workflow.nodes as any[];
    const connections = workflow.connections as any[];
    
    switch (platform) {
      case 'zapier':
        return {
          trigger: nodes.find(n => n.type === 'trigger'),
          actions: nodes.filter(n => n.type === 'action'),
        };
      case 'make':
        return {
          scenario: {
            name: workflow.name,
            modules: nodes,
          },
        };
      case 'n8n':
        return {
          name: workflow.name,
          nodes: nodes,
          connections: connections,
        };
      default:
        return { nodes, connections };
    }
  }
}

export const storage = new MemStorage();
