/**
 * SSRF Protection - Prevent Server-Side Request Forgery attacks
 * Blocks requests to private networks and sensitive endpoints
 */

import { URL } from 'url';
import { SSRFError } from '../errors/make-errors.js';
import { logger } from './logger.js';

/**
 * Security modes for webhook/URL validation
 */
export type SecurityMode = 'strict' | 'moderate' | 'permissive';

/**
 * Private IP ranges (RFC 1918, RFC 4193, etc.)
 */
const PRIVATE_IP_RANGES = [
  /^10\./,                    // 10.0.0.0/8
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./,  // 172.16.0.0/12
  /^192\.168\./,              // 192.168.0.0/16
  /^127\./,                   // 127.0.0.0/8 (localhost)
  /^169\.254\./,              // 169.254.0.0/16 (link-local)
  /^fc00:/i,                  // fc00::/7 (IPv6 ULA)
  /^fe80:/i,                  // fe80::/10 (IPv6 link-local)
  /^::1$/,                    // ::1 (IPv6 localhost)
  /^::ffff:127\./,            // IPv4-mapped IPv6 localhost
  /^localhost$/i,             // localhost
];

/**
 * Cloud metadata endpoints
 */
const CLOUD_METADATA_DOMAINS = [
  'metadata.google.internal',
  '169.254.169.254',          // AWS, Azure, GCP, etc.
  '100.100.100.200',          // Alibaba Cloud
  'metadata.tencentyun.com',
];

/**
 * Check if hostname is a private IP or localhost
 */
function isPrivateHost(hostname: string): boolean {
  // Remove brackets from IPv6
  const host = hostname.replace(/^\[|\]$/g, '');

  return PRIVATE_IP_RANGES.some(pattern => pattern.test(host));
}

/**
 * Check if hostname is a cloud metadata endpoint
 */
function isCloudMetadata(hostname: string): boolean {
  return CLOUD_METADATA_DOMAINS.some(domain => 
    hostname.toLowerCase() === domain.toLowerCase()
  );
}

/**
 * Validate URL against SSRF protection rules
 */
export function validateUrl(
  url: string,
  mode: SecurityMode = 'strict'
): { valid: boolean; error?: string } {
  try {
    const parsed = new URL(url);

    // Check protocol
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return {
        valid: false,
        error: `Protocol '${parsed.protocol}' not allowed. Only http: and https: are supported.`,
      };
    }

    const hostname = parsed.hostname;

    // Always block cloud metadata endpoints (all modes)
    if (isCloudMetadata(hostname)) {
      return {
        valid: false,
        error: `Cloud metadata endpoints are not allowed: ${hostname}`,
      };
    }

    // Strict mode: Block all private IPs
    if (mode === 'strict') {
      if (isPrivateHost(hostname)) {
        return {
          valid: false,
          error: `Private IP addresses and localhost are not allowed in strict mode: ${hostname}`,
        };
      }
    }

    // Moderate mode: Allow localhost but block other private IPs
    if (mode === 'moderate') {
      const isLocalhost = /^(localhost|127\.|::1$|::ffff:127\.)/i.test(hostname);
      if (!isLocalhost && isPrivateHost(hostname)) {
        return {
          valid: false,
          error: `Private IP addresses are not allowed in moderate mode: ${hostname}`,
        };
      }
    }

    // Permissive mode: Allow everything except cloud metadata
    // (already checked above)

    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: `Invalid URL format: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Assert URL is safe or throw SSRFError
 */
export function assertSafeUrl(url: string, mode: SecurityMode = 'strict'): void {
  const result = validateUrl(url, mode);
  if (!result.valid) {
    logger.warn('SSRF protection blocked URL', { url, reason: result.error, mode });
    throw new SSRFError(url, result.error || 'URL validation failed');
  }
}

/**
 * Get security mode from environment
 */
export function getSecurityMode(): SecurityMode {
  const mode = process.env.WEBHOOK_SECURITY_MODE?.toLowerCase();
  
  switch (mode) {
    case 'strict':
      return 'strict';
    case 'moderate':
      return 'moderate';
    case 'permissive':
      return 'permissive';
    default:
      return 'strict'; // Default to most secure
  }
}

/**
 * Validate and sanitize URL
 */
export function sanitizeUrl(url: string, mode?: SecurityMode): string {
  const securityMode = mode || getSecurityMode();
  assertSafeUrl(url, securityMode);
  
  // Return normalized URL
  try {
    const parsed = new URL(url);
    return parsed.toString();
  } catch {
    throw new SSRFError(url, 'Invalid URL format');
  }
}

/**
 * Check if URL is safe without throwing
 */
export function isSafeUrl(url: string, mode?: SecurityMode): boolean {
  const securityMode = mode || getSecurityMode();
  const result = validateUrl(url, securityMode);
  return result.valid;
}

