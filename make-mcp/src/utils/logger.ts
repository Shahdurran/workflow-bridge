/**
 * Logger - Structured logging for Make-MCP
 * Based on n8n-mcp logger but simplified for Make.com
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerOptions {
  prefix?: string;
  minLevel?: LogLevel;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

export class Logger {
  private prefix: string;
  private minLevel: number;

  constructor(options: LoggerOptions = {}) {
    this.prefix = options.prefix || '[Make-MCP]';
    const envLevel = (process.env.LOG_LEVEL || 'info').toLowerCase() as LogLevel;
    this.minLevel = LOG_LEVELS[options.minLevel || envLevel] || LOG_LEVELS.info;
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= this.minLevel;
  }

  private formatMessage(level: LogLevel, message: string, ...args: any[]): string {
    const timestamp = new Date().toISOString();
    const levelStr = level.toUpperCase().padEnd(5);
    return `${timestamp} ${levelStr} ${this.prefix} ${message}`;
  }

  private log(level: LogLevel, message: string, ...args: any[]): void {
    if (!this.shouldLog(level)) return;

    const formatted = this.formatMessage(level, message);
    
    // In stdio mode, only log errors to stderr to avoid corrupting MCP protocol
    if (process.env.MCP_MODE === 'stdio') {
      if (level === 'error') {
        console.error(formatted, ...args);
      }
      return;
    }

    // In HTTP mode or other modes, log to stderr
    switch (level) {
      case 'error':
        console.error(formatted, ...args);
        break;
      case 'warn':
        console.warn(formatted, ...args);
        break;
      default:
        console.error(formatted, ...args); // Use stderr for all logs
    }
  }

  debug(message: string, ...args: any[]): void {
    this.log('debug', message, ...args);
  }

  info(message: string, ...args: any[]): void {
    this.log('info', message, ...args);
  }

  warn(message: string, ...args: any[]): void {
    this.log('warn', message, ...args);
  }

  error(message: string, ...args: any[]): void {
    this.log('error', message, ...args);
  }
}

// Default logger instance
export const logger = new Logger();

