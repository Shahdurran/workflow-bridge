/**
 * Make-MCP Engine - Clean interface for service integration
 *
 * This class provides a simple API for integrating the Make-MCP server
 * into larger services. The wrapping service handles authentication,
 * multi-tenancy, rate limiting, etc.
 */

import { Request, Response } from 'express';
import { SingleSessionHTTPServer } from './http-server-single-session.js';
import { logger } from './utils/logger.js';
import { InstanceContext } from './types/instance-context.js';

export interface EngineHealth {
  status: 'healthy' | 'unhealthy';
  uptime: number;
  sessionActive: boolean;
  memoryUsage: {
    used: number;
    total: number;
    unit: string;
  };
  version: string;
}

export interface EngineOptions {
  sessionTimeout?: number;
  logLevel?: 'error' | 'warn' | 'info' | 'debug';
}

export class MakeMCPEngine {
  private server: SingleSessionHTTPServer;
  private startTime: Date;

  constructor(options: EngineOptions = {}) {
    this.server = new SingleSessionHTTPServer();
    this.startTime = new Date();

    if (options.logLevel) {
      process.env.LOG_LEVEL = options.logLevel;
    }

    if (options.sessionTimeout) {
      process.env.SESSION_TIMEOUT = String(options.sessionTimeout);
    }
  }

  /**
   * Process a single MCP request with optional instance context
   * The wrapping service handles authentication, multi-tenancy, etc.
   *
   * @param req - Express request object
   * @param res - Express response object
   * @param instanceContext - Optional instance-specific configuration
   *
   * @example
   * // Basic usage (backward compatible)
   * await engine.processRequest(req, res);
   *
   * @example
   * // With instance context
   * const context: InstanceContext = {
   *   makeApiUrl: 'https://eu2.make.com',
   *   makeApiToken: 'instance1-key',
   *   instanceId: 'tenant-123'
   * };
   * await engine.processRequest(req, res, context);
   */
  async processRequest(
    req: Request,
    res: Response,
    instanceContext?: InstanceContext
  ): Promise<void> {
    try {
      await this.server.handleRequest(req, res, instanceContext);
    } catch (error) {
      logger.error('Engine processRequest error:', error);
      throw error;
    }
  }

  /**
   * Health check for service monitoring
   *
   * @example
   * app.get('/health', async (req, res) => {
   *   const health = await engine.healthCheck();
   *   res.status(health.status === 'healthy' ? 200 : 503).json(health);
   * });
   */
  async healthCheck(): Promise<EngineHealth> {
    try {
      const sessionInfo = this.server.getSessionInfo();
      const memoryUsage = process.memoryUsage();

      return {
        status: 'healthy',
        uptime: Math.floor((Date.now() - this.startTime.getTime()) / 1000),
        sessionActive: sessionInfo.active,
        memoryUsage: {
          used: Math.round(memoryUsage.heapUsed / 1024 / 1024),
          total: Math.round(memoryUsage.heapTotal / 1024 / 1024),
          unit: 'MB',
        },
        version: '1.0.0',
      };
    } catch (error) {
      logger.error('Health check failed:', error);
      return {
        status: 'unhealthy',
        uptime: 0,
        sessionActive: false,
        memoryUsage: { used: 0, total: 0, unit: 'MB' },
        version: '1.0.0',
      };
    }
  }

  /**
   * Get current session information
   * Useful for monitoring and debugging
   */
  getSessionInfo(): { active: boolean; sessionId?: string; age?: number } {
    return this.server.getSessionInfo();
  }

  /**
   * Graceful shutdown for service lifecycle
   *
   * @example
   * process.on('SIGTERM', async () => {
   *   await engine.shutdown();
   *   process.exit(0);
   * });
   */
  async shutdown(): Promise<void> {
    logger.info('Shutting down Make-MCP Engine...');
    await this.server.shutdown();
  }

  /**
   * Start the engine (if using standalone mode)
   * For embedded use, this is not necessary
   */
  async start(): Promise<void> {
    await this.server.start();
  }
}

/**
 * Example usage with flexible instance configuration:
 *
 * ```typescript
 * import { MakeMCPEngine, InstanceContext } from 'make-mcp';
 * import express from 'express';
 *
 * const app = express();
 * const engine = new MakeMCPEngine();
 *
 * // Middleware for authentication
 * const authenticate = (req, res, next) => {
 *   // Your auth logic
 *   req.userId = 'user123';
 *   next();
 * };
 *
 * // MCP endpoint with flexible instance support
 * app.post('/api/instances/:instanceId/mcp', authenticate, async (req, res) => {
 *   // Get instance configuration from your database
 *   const instance = await getInstanceConfig(req.params.instanceId);
 *
 *   // Create instance context
 *   const context: InstanceContext = {
 *     makeApiUrl: instance.makeUrl,
 *     makeApiToken: instance.apiToken,
 *     instanceId: instance.id,
 *     metadata: { userId: req.userId }
 *   };
 *
 *   // Process request with instance context
 *   await engine.processRequest(req, res, context);
 * });
 *
 * // Health endpoint
 * app.get('/health', async (req, res) => {
 *   const health = await engine.healthCheck();
 *   res.json(health);
 * });
 * ```
 */
export default MakeMCPEngine;

