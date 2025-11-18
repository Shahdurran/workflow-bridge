/**
 * Instance Context for multi-tenancy support
 * Allows different Make.com instances to be managed through the same MCP server
 */

export interface InstanceContext {
  /**
   * Make.com API base URL for this instance
   * @example 'https://eu2.make.com'
   */
  makeApiUrl?: string;

  /**
   * Make.com API token for authentication
   */
  makeApiToken?: string;

  /**
   * Unique identifier for this instance
   * Used for session management and tracking
   */
  instanceId?: string;

  /**
   * Organization ID (for Make.com teams)
   */
  organizationId?: string;

  /**
   * Team ID (for Make.com teams)
   */
  teamId?: string;

  /**
   * Additional metadata
   */
  metadata?: Record<string, any>;
}

/**
 * Validate instance context structure
 */
export function validateInstanceContext(context: any): context is InstanceContext {
  if (!context || typeof context !== 'object') {
    return false;
  }

  // Optional fields validation
  if (context.makeApiUrl && typeof context.makeApiUrl !== 'string') {
    return false;
  }

  if (context.makeApiToken && typeof context.makeApiToken !== 'string') {
    return false;
  }

  if (context.instanceId && typeof context.instanceId !== 'string') {
    return false;
  }

  if (context.organizationId && typeof context.organizationId !== 'string') {
    return false;
  }

  if (context.teamId && typeof context.teamId !== 'string') {
    return false;
  }

  if (context.metadata && typeof context.metadata !== 'object') {
    return false;
  }

  return true;
}

/**
 * Check if context is an instance context
 */
export function isInstanceContext(value: any): value is InstanceContext {
  return validateInstanceContext(value);
}

/**
 * Merge instance context with defaults
 */
export function mergeInstanceContext(
  context: InstanceContext | undefined,
  defaults: Partial<InstanceContext>
): InstanceContext {
  return {
    ...defaults,
    ...context,
    metadata: {
      ...defaults.metadata,
      ...context?.metadata,
    },
  };
}

