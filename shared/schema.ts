import { sql } from "drizzle-orm";
import { pgTable, text, varchar, json, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const workflows = pgTable("workflows", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  platform: text("platform").notNull(), // zapier, make, n8n
  nodes: json("nodes").notNull(),
  connections: json("connections").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const chatMessages = pgTable("chat_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workflowId: varchar("workflow_id").references(() => workflows.id),
  role: text("role").notNull(), // user, assistant
  content: text("content").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const insertWorkflowSchema = createInsertSchema(workflows).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  timestamp: true,
});

export type InsertWorkflow = z.infer<typeof insertWorkflowSchema>;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type Workflow = typeof workflows.$inferSelect;
export type ChatMessage = typeof chatMessages.$inferSelect;

// Workflow node types
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

// Platform-specific export formats
export interface ZapierExport {
  trigger: {
    app: string;
    event: string;
  };
  actions: Array<{
    app: string;
    action: string;
  }>;
}

export interface MakeExport {
  scenario: {
    name: string;
    modules: Array<{
      service: string;
      operation: string;
    }>;
  };
}

export interface N8nExport {
  nodes: Array<{
    type: string;
    name: string;
  }>;
  connections: Record<string, any>;
}
