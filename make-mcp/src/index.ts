#!/usr/bin/env node

/**
 * Make-MCP Entry Point
 */

import { MakeMCPServer } from './mcp/server.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Handle uncaught errors
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

async function main() {
    const mode = process.env.MCP_MODE || 'stdio';

    try {
        if (mode === 'http') {
            // HTTP mode - for remote deployment
            const { SingleSessionHTTPServer } = await import('./http-server-single-session.js');
            const httpServer = new SingleSessionHTTPServer();

            // Graceful shutdown handlers
            const shutdown = async () => {
                await httpServer.shutdown();
                process.exit(0);
            };

            process.on('SIGTERM', shutdown);
            process.on('SIGINT', shutdown);

            await httpServer.start();
        } else {
            // Stdio mode - for local Claude Desktop
            const server = new MakeMCPServer();

            // Graceful shutdown handler
            let isShuttingDown = false;
            const shutdown = async (signal: string = 'UNKNOWN') => {
                if (isShuttingDown) return;
                isShuttingDown = true;

                console.error(`Shutdown initiated by: ${signal}`);
                await server.shutdown();

                setTimeout(() => {
                    console.error('Shutdown timeout exceeded, forcing exit');
                    process.exit(0);
                }, 1000);
            };

            // Handle termination signals
            process.on('SIGTERM', () => shutdown('SIGTERM'));
            process.on('SIGINT', () => shutdown('SIGINT'));
            process.on('SIGHUP', () => shutdown('SIGHUP'));

            // Handle stdio disconnect
            if (process.stdin.readable && !process.stdin.destroyed) {
                process.stdin.on('end', () => shutdown('STDIN_END'));
                process.stdin.on('close', () => shutdown('STDIN_CLOSE'));
            }

            await server.run();
        }
    } catch (error) {
        console.error('Failed to start MCP server:', error);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    main().catch(console.error);
}

// Engine exports for service integration
export { MakeMCPEngine, EngineHealth, EngineOptions } from './mcp-engine.js';
export { SingleSessionHTTPServer } from './http-server-single-session.js';
export { ConsoleManager } from './utils/console-manager.js';
export { MakeMCPServer } from './mcp/server.js';

// Type exports for multi-tenant and library usage
export type { InstanceContext } from './types/instance-context.js';
export {
  validateInstanceContext,
  isInstanceContext,
  mergeInstanceContext,
} from './types/instance-context.js';

// Service exports
export { ScenarioDiffEngine } from './services/scenario-diff-engine.js';
export type {
  ScenarioDiffOperation,
  ScenarioDiffRequest,
  ScenarioDiffResult,
  AddModuleOperation,
  RemoveModuleOperation,
  UpdateModuleOperation,
  MoveModuleOperation,
  ReorderModulesOperation,
  UpdateMetadataOperation,
  UpdateNameOperation,
} from './services/scenario-diff-engine.js';

export { MakeApiClient, createMakeApiClientFromEnv } from './services/make-api-client.js';
export type {
  MakeApiClientConfig,
  HealthCheckResponse,
  ScenarioListResponse,
  ScenarioExecutionResponse,
  OrganizationInfo,
} from './services/make-api-client.js';

export { ExpressionValidator } from './services/expression-validator.js';
export type {
  ExpressionContext,
  ExpressionValidationResult,
} from './services/expression-validator.js';

export { TemplateService } from './templates/template-service.js';
export { TemplateFetcher } from './templates/template-fetcher.js';
export { TemplateRepository } from './templates/template-repository.js';
export type { TemplateSearchFilters, MakeTemplateMetadata } from './templates/template-fetcher.js';
export type { TemplateSearchOptions } from './templates/template-repository.js';

// Error exports
export {
  MakeMCPError,
  ValidationError,
  ModuleNotFoundError,
  ScenarioError,
  MakeAPIError,
  AuthenticationError,
  AuthorizationError,
  RateLimitError,
  SessionError,
  DatabaseError,
  ConfigurationError,
  SSRFError,
} from './errors/make-errors.js';

// Validation exports
export { Validator } from './utils/validation-schemas.js';
export {
  MakeModuleSchema,
  MakeScenarioSchema,
  ValidationProfileSchema,
  AutoFixOptionsSchema,
  InstanceContextSchema,
} from './utils/validation-schemas.js';

// SSRF protection exports
export { assertSafeUrl, validateUrl } from './utils/ssrf-protection.js';

// Logger export
export { Logger } from './utils/logger.js';

// Re-export MCP SDK types for convenience
export type {
  Tool,
  CallToolResult,
  ListToolsResult,
} from '@modelcontextprotocol/sdk/types.js';

// Default export for convenience
import MakeMCPEngine from './mcp-engine.js';
export default MakeMCPEngine;

