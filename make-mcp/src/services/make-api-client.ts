/**
 * Make.com API Client
 * Handles all interactions with Make.com API
 * Based on n8n-mcp's N8nApiClient
 */

import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { MakeScenario } from '../types/index';
import { Logger } from '../utils/logger';
import { MakeAPIError, AuthenticationError } from '../errors/make-errors';

const logger = new Logger({ prefix: '[MakeApiClient]' });

/**
 * API Client Configuration
 */
export interface MakeApiClientConfig {
  baseUrl: string; // Make.com API URL (e.g., https://us1.make.com or https://eu1.make.com)
  apiToken: string; // Make.com API token
  organizationId?: string; // Organization ID
  teamId?: string; // Team ID
  timeout?: number; // Request timeout in ms
  maxRetries?: number; // Max retry attempts
}

/**
 * Health Check Response
 */
export interface HealthCheckResponse {
  status: 'ok' | 'error';
  message?: string;
  timestamp: string;
  details?: any;
}

/**
 * Scenario List Response
 */
export interface ScenarioListResponse {
  scenarios: Array<{
    id: string;
    name: string;
    teamId: string;
    folderId?: string;
    scheduling?: {
      type: string;
      interval?: number;
    };
    isLinked: boolean;
    isPaused: boolean;
    isWaitingForOthers: boolean;
    lastRun?: string;
    isLocked: boolean;
    dlq: boolean;
  }>;
  pg?: {
    limit: number;
    offset: number;
    sortBy?: string;
    sortDir?: 'asc' | 'desc';
  };
}

/**
 * Scenario Execution Response
 */
export interface ScenarioExecutionResponse {
  executionId: string;
  status: 'running' | 'success' | 'error';
  startedAt: string;
  message?: string;
}

/**
 * Organization Info
 */
export interface OrganizationInfo {
  id: string;
  name: string;
  teams: Array<{
    id: string;
    name: string;
  }>;
}

/**
 * Make.com API Client
 */
export class MakeApiClient {
  private client: AxiosInstance;
  private maxRetries: number;
  private config: MakeApiClientConfig;

  constructor(config: MakeApiClientConfig) {
    this.config = config;
    const { baseUrl, apiToken, timeout = 30000, maxRetries = 3 } = config;

    this.maxRetries = maxRetries;

    // Ensure baseUrl format
    const apiUrl = baseUrl.endsWith('/api/v2')
      ? baseUrl
      : `${baseUrl.replace(/\/$/, '')}/api/v2`;

    this.client = axios.create({
      baseURL: apiUrl,
      timeout,
      headers: {
        'Authorization': `Token ${apiToken}`,
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor for logging
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        logger.debug(`Make API Request: ${config.method?.toUpperCase()} ${config.url}`, {
          params: config.params,
          hasData: !!config.data,
        });
        return config;
      },
      (error: unknown) => {
        logger.error('Make API Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor for logging and error handling
    this.client.interceptors.response.use(
      (response: any) => {
        logger.debug(`Make API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error: unknown) => {
        const makeError = this.handleApiError(error);
        logger.error('Make API Response Error', {
          statusCode: makeError.statusCode,
          message: makeError.message,
        });
        return Promise.reject(makeError);
      }
    );
  }

  /**
   * Handle API errors
   */
  private handleApiError(error: unknown): MakeAPIError {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;

      // Authentication error
      if (axiosError.response?.status === 401) {
        return new AuthenticationError('Invalid API token or authentication failed');
      }

      // Rate limiting
      if (axiosError.response?.status === 429) {
        return new MakeAPIError('Rate limit exceeded', 429, {
          retryAfter: axiosError.response.headers['retry-after'],
        });
      }

      // Server errors
      if (axiosError.response?.status && axiosError.response.status >= 500) {
        return new MakeAPIError(
          'Make.com API server error',
          axiosError.response.status,
          { response: axiosError.response.data }
        );
      }

      // Client errors
      if (axiosError.response?.status && axiosError.response.status >= 400) {
        const message = (axiosError.response.data as any)?.message || axiosError.message;
        return new MakeAPIError(message, axiosError.response.status, {
          response: axiosError.response.data,
        });
      }

      // Network errors
      if (axiosError.code === 'ECONNABORTED') {
        return new MakeAPIError('Request timeout', 408);
      }

      return new MakeAPIError(axiosError.message, 500);
    }

    // Unknown errors
    return new MakeAPIError(
      error instanceof Error ? error.message : 'Unknown error',
      500
    );
  }

  /**
   * Health check - verify API connectivity
   */
  async healthCheck(): Promise<HealthCheckResponse> {
    try {
      // Try to get organization info as a health check
      await this.getOrganization();

      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        message: 'Make.com API is accessible',
      };
    } catch (error: any) {
      return {
        status: 'error',
        timestamp: new Date().toISOString(),
        message: error.message || 'Failed to connect to Make.com API',
        details: error.details,
      };
    }
  }

  // ==================== Scenario Operations ====================

  /**
   * List scenarios
   */
  async listScenarios(options?: {
    teamId?: string;
    folderId?: string;
    limit?: number;
    offset?: number;
  }): Promise<ScenarioListResponse> {
    try {
      const params: any = {};

      if (options?.teamId) params.teamId = options.teamId;
      if (options?.folderId) params.folderId = options.folderId;
      if (options?.limit) params['pg[limit]'] = options.limit;
      if (options?.offset) params['pg[offset]'] = options.offset;

      const response = await this.client.get('/scenarios', { params });
      return response.data;
    } catch (error) {
      throw this.handleApiError(error);
    }
  }

  /**
   * Get a specific scenario by ID
   */
  async getScenario(scenarioId: string): Promise<MakeScenario> {
    try {
      const response = await this.client.get(`/scenarios/${scenarioId}`);
      const data = response.data;

      // Transform Make.com API response to our internal format
      const scenario: MakeScenario = {
        name: data.scenario.name,
        flow: data.scenario.flow || [],
        metadata: {
          ...data.scenario,
          created_at: data.scenario.createdDate,
          version: data.scenario.version,
        },
      };

      return scenario;
    } catch (error) {
      throw this.handleApiError(error);
    }
  }

  /**
   * Create a new scenario
   */
  async createScenario(
    scenario: MakeScenario,
    options?: {
      teamId?: string;
      folderId?: string;
    }
  ): Promise<{ id: string; scenario: MakeScenario }> {
    try {
      const payload: any = {
        scenario: {
          name: scenario.name,
          flow: scenario.flow,
          ...scenario.metadata,
        },
      };

      if (options?.teamId) payload.scenario.teamId = options.teamId;
      if (options?.folderId) payload.scenario.folderId = options.folderId;

      const response = await this.client.post('/scenarios', payload);
      const data = response.data;

      logger.info('Created scenario', {
        scenarioId: data.scenario.id,
        name: scenario.name,
      });

      return {
        id: data.scenario.id,
        scenario: {
          name: data.scenario.name,
          flow: data.scenario.flow || [],
          metadata: {
            ...data.scenario,
          },
        },
      };
    } catch (error) {
      throw this.handleApiError(error);
    }
  }

  /**
   * Update an existing scenario
   */
  async updateScenario(scenarioId: string, scenario: Partial<MakeScenario>): Promise<MakeScenario> {
    try {
      const payload: any = {
        scenario: {},
      };

      if (scenario.name) payload.scenario.name = scenario.name;
      if (scenario.flow) payload.scenario.flow = scenario.flow;
      if (scenario.metadata) {
        Object.assign(payload.scenario, scenario.metadata);
      }

      const response = await this.client.patch(`/scenarios/${scenarioId}`, payload);
      const data = response.data;

      logger.info('Updated scenario', { scenarioId, name: scenario.name });

      return {
        name: data.scenario.name,
        flow: data.scenario.flow || [],
        metadata: {
          ...data.scenario,
        },
      };
    } catch (error) {
      throw this.handleApiError(error);
    }
  }

  /**
   * Delete a scenario
   */
  async deleteScenario(scenarioId: string): Promise<void> {
    try {
      await this.client.delete(`/scenarios/${scenarioId}`);
      logger.info('Deleted scenario', { scenarioId });
    } catch (error) {
      throw this.handleApiError(error);
    }
  }

  /**
   * Clone a scenario
   */
  async cloneScenario(
    scenarioId: string,
    newName?: string
  ): Promise<{ id: string; scenario: MakeScenario }> {
    try {
      // Get the original scenario
      const originalScenario = await this.getScenario(scenarioId);

      // Create a clone with a new name
      const clonedScenario: MakeScenario = {
        ...originalScenario,
        name: newName || `${originalScenario.name} (Copy)`,
      };

      // Create the cloned scenario
      const result = await this.createScenario(clonedScenario);

      logger.info('Cloned scenario', {
        originalId: scenarioId,
        clonedId: result.id,
      });

      return result;
    } catch (error) {
      throw this.handleApiError(error);
    }
  }

  // ==================== Scenario Execution ====================

  /**
   * Execute a scenario (run once)
   */
  async executeScenario(scenarioId: string, data?: any): Promise<ScenarioExecutionResponse> {
    try {
      const payload = data ? { data } : undefined;

      const response = await this.client.post(
        `/scenarios/${scenarioId}/run`,
        payload
      );

      logger.info('Executed scenario', { scenarioId });

      return {
        executionId: response.data.executionId,
        status: 'running',
        startedAt: new Date().toISOString(),
      };
    } catch (error) {
      throw this.handleApiError(error);
    }
  }

  /**
   * Activate a scenario (enable scheduling)
   */
  async activateScenario(scenarioId: string): Promise<void> {
    try {
      await this.client.patch(`/scenarios/${scenarioId}`, {
        scenario: { isPaused: false },
      });

      logger.info('Activated scenario', { scenarioId });
    } catch (error) {
      throw this.handleApiError(error);
    }
  }

  /**
   * Deactivate a scenario (disable scheduling)
   */
  async deactivateScenario(scenarioId: string): Promise<void> {
    try {
      await this.client.patch(`/scenarios/${scenarioId}`, {
        scenario: { isPaused: true },
      });

      logger.info('Deactivated scenario', { scenarioId });
    } catch (error) {
      throw this.handleApiError(error);
    }
  }

  // ==================== Organization & Team Management ====================

  /**
   * Get organization information
   */
  async getOrganization(): Promise<OrganizationInfo> {
    try {
      const response = await this.client.get('/organizations/me');
      const data = response.data;

      return {
        id: data.organization.id,
        name: data.organization.name,
        teams: data.organization.teams || [],
      };
    } catch (error) {
      throw this.handleApiError(error);
    }
  }

  /**
   * Get teams in organization
   */
  async getTeams(): Promise<Array<{ id: string; name: string }>> {
    try {
      const org = await this.getOrganization();
      return org.teams;
    } catch (error) {
      throw this.handleApiError(error);
    }
  }

  /**
   * Get team by ID
   */
  async getTeam(teamId: string): Promise<{ id: string; name: string }> {
    try {
      const response = await this.client.get(`/teams/${teamId}`);
      const data = response.data;

      return {
        id: data.team.id,
        name: data.team.name,
      };
    } catch (error) {
      throw this.handleApiError(error);
    }
  }

  // ==================== Webhooks ====================

  /**
   * Get webhook URL for a scenario
   */
  async getWebhookUrl(scenarioId: string, webhookName: string): Promise<string> {
    try {
      const scenario = await this.getScenario(scenarioId);

      // Find webhook module in the scenario
      const webhookModule = scenario.flow.find(
        (module) =>
          module.module.toLowerCase().includes('webhook') &&
          module.parameters?.hookName === webhookName
      );

      if (!webhookModule) {
        throw new MakeAPIError(`Webhook '${webhookName}' not found in scenario`, 404);
      }

      // Extract webhook URL from module parameters
      const webhookUrl = webhookModule.parameters?.url;
      if (!webhookUrl) {
        throw new MakeAPIError('Webhook URL not found in module parameters', 404);
      }

      return webhookUrl as string;
    } catch (error) {
      throw this.handleApiError(error);
    }
  }

  // ==================== Utility Methods ====================

  /**
   * Test API connection
   */
  async testConnection(): Promise<boolean> {
    try {
      const health = await this.healthCheck();
      return health.status === 'ok';
    } catch (error) {
      return false;
    }
  }

  /**
   * Get API base URL
   */
  getBaseUrl(): string {
    return this.client.defaults.baseURL || '';
  }

  /**
   * Get configuration (without sensitive data)
   */
  getConfig(): Omit<MakeApiClientConfig, 'apiToken'> {
    return {
      baseUrl: this.config.baseUrl,
      organizationId: this.config.organizationId,
      teamId: this.config.teamId,
      timeout: this.config.timeout,
      maxRetries: this.config.maxRetries,
    };
  }
}

/**
 * Helper function to create API client from environment variables
 */
export function createMakeApiClientFromEnv(): MakeApiClient | null {
  const baseUrl = process.env.MAKE_API_URL;
  const apiToken = process.env.MAKE_API_TOKEN;

  if (!baseUrl || !apiToken) {
    logger.warn('Make.com API not configured. Set MAKE_API_URL and MAKE_API_TOKEN environment variables.');
    return null;
  }

  return new MakeApiClient({
    baseUrl,
    apiToken,
    organizationId: process.env.MAKE_ORGANIZATION_ID,
    teamId: process.env.MAKE_TEAM_ID,
  });
}

