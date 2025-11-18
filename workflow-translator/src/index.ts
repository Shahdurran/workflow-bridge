#!/usr/bin/env node

/**
 * Workflow Translator Entry Point
 */

import { WorkflowTranslatorServer } from './mcp/server.js';
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
            console.error('HTTP mode coming in future release');
            console.error('For now, use stdio mode');
            process.exit(1);
        } else {
            // Stdio mode - for local usage
            const server = new WorkflowTranslatorServer();

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
        console.error('Failed to start Workflow Translator server:', error);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    main().catch(console.error);
}

export { WorkflowTranslatorServer };

