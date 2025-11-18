/**
 * Error Handler - Centralized error handling and logging
 */

import { logger } from './logger.js';
import { MakeMCPError } from '../errors/make-errors.js';

/**
 * Handle error and return standardized response
 */
export function handleError(error: unknown): {
  error: string;
  code: string;
  message: string;
  statusCode: number;
  details?: any;
} {
  // Log the error
  logger.error('Error occurred', error);

  // Handle MakeMCPError
  if (error instanceof MakeMCPError) {
    return {
      error: error.name,
      code: error.code,
      message: error.message,
      statusCode: error.statusCode,
      details: error.details,
    };
  }

  // Handle standard Error
  if (error instanceof Error) {
    return {
      error: 'Error',
      code: 'INTERNAL_ERROR',
      message: error.message,
      statusCode: 500,
    };
  }

  // Handle unknown errors
  return {
    error: 'UnknownError',
    code: 'UNKNOWN_ERROR',
    message: 'An unknown error occurred',
    statusCode: 500,
    details: error,
  };
}

/**
 * Wrap async function with error handling
 */
export function wrapAsync<T extends (...args: any[]) => Promise<any>>(
  fn: T
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  return async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    try {
      return await fn(...args);
    } catch (error) {
      throw handleError(error);
    }
  };
}

/**
 * Safely execute function with error handling
 */
export async function safeExecute<T>(
  fn: () => Promise<T>,
  defaultValue: T,
  errorMessage?: string
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (errorMessage) {
      logger.error(errorMessage, error);
    }
    return defaultValue;
  }
}

/**
 * Assert condition or throw error
 */
export function assert(
  condition: boolean,
  message: string,
  errorClass: typeof MakeMCPError = MakeMCPError
): asserts condition {
  if (!condition) {
    throw new errorClass(message, 'ASSERTION_FAILED', 400);
  }
}

/**
 * Sanitize error for client response (remove sensitive data)
 */
export function sanitizeError(error: unknown): any {
  const handled = handleError(error);

  // Remove stack traces in production
  if (process.env.NODE_ENV === 'production') {
    delete handled.details?.stack;
  }

  return handled;
}

