/**
 * Custom Error Classes for Make-MCP
 */

/**
 * Base error class for Make-MCP errors
 */
export class MakeMCPError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: any;

  constructor(message: string, code: string, statusCode: number = 500, details?: any) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      error: this.name,
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
      details: this.details,
    };
  }
}

/**
 * Validation error
 */
export class ValidationError extends MakeMCPError {
  constructor(message: string, details?: any) {
    super(message, 'VALIDATION_ERROR', 400, details);
  }
}

/**
 * Module not found error
 */
export class ModuleNotFoundError extends MakeMCPError {
  constructor(moduleName: string) {
    super(
      `Module '${moduleName}' not found in database`,
      'MODULE_NOT_FOUND',
      404,
      { moduleName }
    );
  }
}

/**
 * Scenario error
 */
export class ScenarioError extends MakeMCPError {
  constructor(message: string, details?: any) {
    super(message, 'SCENARIO_ERROR', 400, details);
  }
}

/**
 * API error (Make.com API)
 */
export class MakeAPIError extends MakeMCPError {
  constructor(message: string, statusCode: number = 500, details?: any) {
    super(message, 'MAKE_API_ERROR', statusCode, details);
  }
}

/**
 * Authentication error
 */
export class AuthenticationError extends MakeMCPError {
  constructor(message: string = 'Authentication failed') {
    super(message, 'AUTHENTICATION_ERROR', 401);
  }
}

/**
 * Authorization error
 */
export class AuthorizationError extends MakeMCPError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 'AUTHORIZATION_ERROR', 403);
  }
}

/**
 * Rate limit error
 */
export class RateLimitError extends MakeMCPError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, 'RATE_LIMIT_ERROR', 429);
  }
}

/**
 * Session error
 */
export class SessionError extends MakeMCPError {
  constructor(message: string, details?: any) {
    super(message, 'SESSION_ERROR', 500, details);
  }
}

/**
 * Database error
 */
export class DatabaseError extends MakeMCPError {
  constructor(message: string, details?: any) {
    super(message, 'DATABASE_ERROR', 500, details);
  }
}

/**
 * Configuration error
 */
export class ConfigurationError extends MakeMCPError {
  constructor(message: string, details?: any) {
    super(message, 'CONFIGURATION_ERROR', 500, details);
  }
}

/**
 * SSRF Protection error
 */
export class SSRFError extends MakeMCPError {
  constructor(url: string, reason: string) {
    super(
      `SSRF protection: ${reason}`,
      'SSRF_BLOCKED',
      403,
      { url, reason }
    );
  }
}

