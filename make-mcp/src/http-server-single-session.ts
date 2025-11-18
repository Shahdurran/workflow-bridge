#!/usr/bin/env node
/**
 * Single-Session HTTP server for Make-MCP
 * Based on n8n-mcp architecture but adapted for Make.com
 */

import express, { Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { MakeMCPServer } from './mcp/server.js';
import { ConsoleManager } from './utils/console-manager.js';
import { logger } from './utils/logger.js';
import { AuthManager } from './utils/auth.js';
import dotenv from 'dotenv';
import { getStartupBaseUrl, formatEndpointUrls, detectBaseUrl } from './utils/url-detector.js';
import { v4 as uuidv4 } from 'uuid';
import { InstanceContext, validateInstanceContext } from './types/instance-context.js';

dotenv.config();

// Session management constants
const MAX_SESSIONS = 100;
const SESSION_CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutes
const DEFAULT_SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

interface Session {
  server: MakeMCPServer;
  transport: StreamableHTTPServerTransport;
  lastAccess: Date;
  sessionId: string;
  initialized: boolean;
  context?: InstanceContext;
}

interface MultiTenantHeaders {
  'x-make-url'?: string;
  'x-make-token'?: string;
  'x-instance-id'?: string;
  'x-session-id'?: string;
}

/**
 * Extract multi-tenant headers from request
 */
function extractMultiTenantHeaders(req: Request): MultiTenantHeaders {
  return {
    'x-make-url': req.headers['x-make-url'] as string | undefined,
    'x-make-token': req.headers['x-make-token'] as string | undefined,
    'x-instance-id': req.headers['x-instance-id'] as string | undefined,
    'x-session-id': req.headers['x-session-id'] as string | undefined,
  };
}

export class SingleSessionHTTPServer {
  private transports: { [sessionId: string]: StreamableHTTPServerTransport } = {};
  private servers: { [sessionId: string]: MakeMCPServer } = {};
  private sessionMetadata: { [sessionId: string]: { lastAccess: Date; createdAt: Date } } = {};
  private sessionContexts: { [sessionId: string]: InstanceContext | undefined } = {};
  private consoleManager = new ConsoleManager();
  private expressServer: any;
  private sessionTimeout: number;
  private authManager: AuthManager;
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.sessionTimeout = parseInt(process.env.SESSION_TIMEOUT || String(DEFAULT_SESSION_TIMEOUT));
    this.authManager = new AuthManager();
    this.consoleManager.configure();
    this.startSessionCleanup();
  }

  /**
   * Start periodic session cleanup
   */
  private startSessionCleanup(): void {
    this.cleanupTimer = setInterval(async () => {
      try {
        await this.cleanupExpiredSessions();
      } catch (error) {
        logger.error('Error during session cleanup', error);
      }
    }, SESSION_CLEANUP_INTERVAL);

    logger.info('Session cleanup started', {
      interval: SESSION_CLEANUP_INTERVAL / 1000 / 60,
      maxSessions: MAX_SESSIONS,
      sessionTimeout: this.sessionTimeout / 1000 / 60,
    });
  }

  /**
   * Clean up expired sessions
   */
  private async cleanupExpiredSessions(): Promise<void> {
    const now = Date.now();
    const expiredSessions: string[] = [];

    for (const sessionId in this.sessionMetadata) {
      const metadata = this.sessionMetadata[sessionId];
      if (now - metadata.lastAccess.getTime() > this.sessionTimeout) {
        expiredSessions.push(sessionId);
      }
    }

    // Clean orphaned contexts
    for (const sessionId in this.sessionContexts) {
      if (!this.sessionMetadata[sessionId]) {
        delete this.sessionContexts[sessionId];
      }
    }

    // Remove expired sessions
    for (const sessionId of expiredSessions) {
      await this.removeSession(sessionId, 'expired');
    }

    if (expiredSessions.length > 0) {
      logger.info('Cleaned up expired sessions', {
        removed: expiredSessions.length,
        remaining: this.getActiveSessionCount(),
      });
    }
  }

  /**
   * Remove a session
   */
  private async removeSession(sessionId: string, reason: string): Promise<void> {
    try {
      if (this.transports[sessionId]) {
        await this.transports[sessionId].close();
        delete this.transports[sessionId];
      }

      if (this.servers[sessionId]) {
        await this.servers[sessionId].shutdown();
        delete this.servers[sessionId];
      }

      delete this.sessionMetadata[sessionId];
      delete this.sessionContexts[sessionId];

      logger.info('Session removed', { sessionId, reason });
    } catch (error) {
      logger.warn('Error removing session', { sessionId, reason, error });
    }
  }

  /**
   * Get active session count
   */
  private getActiveSessionCount(): number {
    return Object.keys(this.transports).length;
  }

  /**
   * Can create new session
   */
  private canCreateSession(): boolean {
    return this.getActiveSessionCount() < MAX_SESSIONS;
  }

  /**
   * Get or create session
   */
  private async getOrCreateSession(
    sessionId: string,
    instanceContext?: InstanceContext
  ): Promise<Session> {
    // Check if session exists
    if (this.transports[sessionId]) {
      // Update last access
      this.sessionMetadata[sessionId].lastAccess = new Date();

      return {
        server: this.servers[sessionId],
        transport: this.transports[sessionId],
        lastAccess: this.sessionMetadata[sessionId].lastAccess,
        sessionId,
        initialized: true,
        context: this.sessionContexts[sessionId],
      };
    }

    // Create new session
    if (!this.canCreateSession()) {
      throw new Error('Maximum session limit reached');
    }

    const server = new MakeMCPServer();
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => sessionId
    });

    // Connect server to transport
    await server.server.connect(transport);

    this.transports[sessionId] = transport;
    this.servers[sessionId] = server;
    this.sessionMetadata[sessionId] = {
      lastAccess: new Date(),
      createdAt: new Date(),
    };
    this.sessionContexts[sessionId] = instanceContext;

    logger.info('Session created', {
      sessionId,
      hasContext: !!instanceContext,
      activeSessions: this.getActiveSessionCount(),
    });

    return {
      server,
      transport,
      lastAccess: new Date(),
      sessionId,
      initialized: true,
      context: instanceContext,
    };
  }

  /**
   * Handle MCP request
   */
  async handleRequest(
    req: Request,
    res: Response,
    instanceContext?: InstanceContext
  ): Promise<void> {
    try {
      // Check authentication
      const token = this.authManager.extractToken(req.headers as Record<string, string | string[] | undefined>);
      if (!this.authManager.validateToken(token)) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      // Extract session ID from headers or generate new one
      const headers = extractMultiTenantHeaders(req);
      const sessionId = headers['x-session-id'] || uuidv4();

      // Build instance context from headers if provided
      let context = instanceContext;
      if (!context && (headers['x-make-url'] || headers['x-instance-id'])) {
        context = {
          makeApiUrl: headers['x-make-url'],
          makeApiToken: headers['x-make-token'],
          instanceId: headers['x-instance-id'],
        };

        if (validateInstanceContext(context)) {
          logger.debug('Instance context created from headers', { sessionId });
        } else {
          logger.warn('Invalid instance context in headers', { sessionId });
          context = undefined;
        }
      }

      // Get or create session
      const session = await this.getOrCreateSession(sessionId, context);

      // Add session ID to response headers
      res.setHeader('X-Session-ID', sessionId);

      // Handle the request through transport
      await session.transport.handleRequest(req, res);
    } catch (error) {
      logger.error('Error handling request', error);
      if (!res.headersSent) {
        res.status(500).json({
          error: 'Internal Server Error',
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  }

  /**
   * Get session info
   */
  getSessionInfo(): { active: boolean; sessionId?: string; age?: number } {
    const sessionIds = Object.keys(this.transports);
    if (sessionIds.length === 0) {
      return { active: false };
    }

    // Return info about first session (for backward compatibility)
    const sessionId = sessionIds[0];
    const metadata = this.sessionMetadata[sessionId];

    return {
      active: true,
      sessionId,
      age: metadata ? Date.now() - metadata.createdAt.getTime() : 0,
    };
  }

  /**
   * Start HTTP server
   */
  async start(): Promise<void> {
    const app = express();
    const port = parseInt(process.env.PORT || '3002');

    // Middleware
    app.use(express.json({ limit: '50mb' }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 1000, // Limit each IP to 1000 requests per window
      message: 'Too many requests from this IP, please try again later.',
    });
    app.use('/mcp', limiter);

    // Health check endpoint
    app.get('/health', (req, res) => {
      const memoryUsage = process.memoryUsage();
      res.json({
        status: 'healthy',
        uptime: process.uptime(),
        sessions: {
          active: this.getActiveSessionCount(),
          max: MAX_SESSIONS,
        },
        memory: {
          used: Math.round(memoryUsage.heapUsed / 1024 / 1024),
          total: Math.round(memoryUsage.heapTotal / 1024 / 1024),
          unit: 'MB',
        },
        version: '1.0.0',
      });
    });

    // Session info endpoint
    app.get('/session', (req, res) => {
      // Check authentication
      const token = this.authManager.extractToken(req.headers as Record<string, string | string[] | undefined>);
      if (!this.authManager.validateToken(token)) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const sessions = Object.keys(this.sessionMetadata).map((sessionId) => ({
        sessionId,
        lastAccess: this.sessionMetadata[sessionId].lastAccess,
        createdAt: this.sessionMetadata[sessionId].createdAt,
        hasContext: !!this.sessionContexts[sessionId],
      }));

      res.json({
        totalSessions: sessions.length,
        maxSessions: MAX_SESSIONS,
        sessions,
      });
    });

    // MCP endpoint
    app.use('/mcp', async (req, res) => {
      await this.handleRequest(req, res);
    });

    // Start server
    this.expressServer = app.listen(port, '0.0.0.0', () => {
      const baseUrl = getStartupBaseUrl();
      const urls = formatEndpointUrls(baseUrl.replace('0.0.0.0', 'localhost'));

      logger.info('Make-MCP HTTP server started', {
        port,
        endpoints: urls,
        authRequired: this.authManager.isAuthRequired(),
      });

      if (this.authManager.isAuthRequired()) {
        logger.info('Authentication enabled', {
          token: this.authManager.getToken(),
        });
      }
    });
  }

  /**
   * Shutdown server
   */
  async shutdown(): Promise<void> {
    logger.info('Shutting down Make-MCP HTTP server...');

    // Stop cleanup timer
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }

    // Close all sessions
    const sessionIds = Object.keys(this.transports);
    for (const sessionId of sessionIds) {
      await this.removeSession(sessionId, 'shutdown');
    }

    // Close Express server
    if (this.expressServer) {
      await new Promise<void>((resolve) => {
        this.expressServer.close(() => {
          logger.info('HTTP server closed');
          resolve();
        });
      });
    }
  }
}

