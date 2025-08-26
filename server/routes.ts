import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertWorkflowSchema, insertChatMessageSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Workflow routes
  app.get("/api/workflows", async (req, res) => {
    try {
      const workflows = await storage.getAllWorkflows();
      res.json(workflows);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch workflows" });
    }
  });

  app.post("/api/workflows", async (req, res) => {
    try {
      const validatedData = insertWorkflowSchema.parse(req.body);
      const workflow = await storage.createWorkflow(validatedData);
      res.status(201).json(workflow);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid workflow data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create workflow" });
      }
    }
  });

  app.get("/api/workflows/:id", async (req, res) => {
    try {
      const workflow = await storage.getWorkflow(req.params.id);
      if (!workflow) {
        res.status(404).json({ error: "Workflow not found" });
        return;
      }
      res.json(workflow);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch workflow" });
    }
  });

  app.put("/api/workflows/:id", async (req, res) => {
    try {
      const validatedData = insertWorkflowSchema.parse(req.body);
      const workflow = await storage.updateWorkflow(req.params.id, validatedData);
      if (!workflow) {
        res.status(404).json({ error: "Workflow not found" });
        return;
      }
      res.json(workflow);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid workflow data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update workflow" });
      }
    }
  });

  // Chat routes
  app.get("/api/workflows/:id/messages", async (req, res) => {
    try {
      const messages = await storage.getChatMessages(req.params.id);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch chat messages" });
    }
  });

  app.post("/api/workflows/:id/messages", async (req, res) => {
    try {
      const validatedData = insertChatMessageSchema.parse({
        ...req.body,
        workflowId: req.params.id,
      });
      const message = await storage.createChatMessage(validatedData);
      res.status(201).json(message);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid message data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create message" });
      }
    }
  });

  // Template routes
  app.get("/api/templates", async (req, res) => {
    try {
      const templates = await storage.getTemplates();
      res.json(templates);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch templates" });
    }
  });

  // Export routes
  app.post("/api/workflows/:id/export/:platform", async (req, res) => {
    try {
      const { id, platform } = req.params;
      const workflow = await storage.getWorkflow(id);
      
      if (!workflow) {
        res.status(404).json({ error: "Workflow not found" });
        return;
      }

      const exportData = await storage.exportWorkflow(workflow, platform as 'zapier' | 'make' | 'n8n');
      res.json(exportData);
    } catch (error) {
      res.status(500).json({ error: "Failed to export workflow" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
