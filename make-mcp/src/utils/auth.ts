/**
 * Authentication Manager for HTTP mode
 */

import { createHash, randomBytes } from 'crypto';
import { logger } from './logger';

export class AuthManager {
  private authToken: string | null;

  constructor() {
    this.authToken = process.env.AUTH_TOKEN || null;
    
    if (!this.authToken && process.env.MCP_MODE === 'http') {
      // Generate a random token for HTTP mode if none provided
      this.authToken = this.generateToken();
      logger.warn('No AUTH_TOKEN set, generated random token');
      logger.warn(`Generated AUTH_TOKEN: ${this.authToken}`);
      logger.warn('Set AUTH_TOKEN environment variable to use a custom token');
    }
  }

  /**
   * Generate a secure random token
   */
  private generateToken(): string {
    return randomBytes(32).toString('hex');
  }

  /**
   * Check if authentication is required
   */
  isAuthRequired(): boolean {
    return process.env.MCP_MODE === 'http' && this.authToken !== null;
  }

  /**
   * Validate authentication token
   */
  validateToken(token: string | undefined): boolean {
    if (!this.isAuthRequired()) {
      return true; // No auth required
    }

    if (!token) {
      logger.warn('Authentication required but no token provided');
      return false;
    }

    // Use timing-safe comparison to prevent timing attacks
    const expectedHash = createHash('sha256').update(this.authToken!).digest('hex');
    const providedHash = createHash('sha256').update(token).digest('hex');

    const isValid = expectedHash === providedHash;
    
    if (!isValid) {
      logger.warn('Invalid authentication token provided');
    }

    return isValid;
  }

  /**
   * Get the current auth token (for display purposes)
   */
  getToken(): string | null {
    return this.authToken;
  }

  /**
   * Extract auth token from request headers
   */
  extractToken(headers: Record<string, string | string[] | undefined>): string | undefined {
    const authHeader = headers.authorization;
    
    if (!authHeader) {
      return undefined;
    }

    if (typeof authHeader !== 'string') {
      return undefined;
    }

    // Support Bearer token format
    if (authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    // Support direct token
    return authHeader;
  }
}

