/**
 * URL Detection and Configuration Utilities
 */

import { logger } from './logger';

/**
 * Detect base URL from environment or request
 */
export function detectBaseUrl(host?: string): string {
  // Check environment variable first
  if (process.env.BASE_URL) {
    return process.env.BASE_URL;
  }

  // Auto-detect from host header in HTTP mode
  if (host) {
    const protocol = process.env.USE_HTTPS === 'true' ? 'https' : 'http';
    return `${protocol}://${host}`;
  }

  // Default to localhost with PORT
  const port = process.env.PORT || 3002;
  return `http://localhost:${port}`;
}

/**
 * Get startup base URL
 */
export function getStartupBaseUrl(): string {
  const port = process.env.PORT || 3002;
  
  if (process.env.BASE_URL) {
    return process.env.BASE_URL;
  }

  // Check if we're likely behind a proxy
  if (process.env.RAILWAY_ENVIRONMENT || process.env.RENDER) {
    logger.info('Detected cloud platform, will auto-detect URL from first request');
    return `http://0.0.0.0:${port}`;
  }

  return `http://localhost:${port}`;
}

/**
 * Format endpoint URLs for display
 */
export function formatEndpointUrls(baseUrl: string): {
  mcp: string;
  health: string;
  session: string;
} {
  return {
    mcp: `${baseUrl}/mcp`,
    health: `${baseUrl}/health`,
    session: `${baseUrl}/session`,
  };
}

/**
 * Validate URL format
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

