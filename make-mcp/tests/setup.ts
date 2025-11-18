/**
 * Test setup file
 * 
 * This file provides mock data and utilities for testing make-mcp tools
 */

import type { MakeModule, MakeScenario, MakeTemplate } from '../src/types';

/**
 * Mock Make.com module data
 */
export const mockModule: MakeModule = {
  id: 1,
  label: 'Slack',
  value: 'slack',
  name: 'slack',
  description: 'Connect and automate Slack workflows',
  category: 'Communication',
  icon: 'slack',
  version: 1,
  crud_operations: JSON.stringify(['create', 'read', 'update', 'delete']),
  common_use_cases: JSON.stringify(['Send messages', 'Create channels', 'Manage users']),
  parameters: JSON.stringify({
    connection: { type: 'connection', required: true },
    channel: { type: 'text', required: true },
    message: { type: 'text', required: true }
  }),
  api_endpoint: '/slack',
  connection_type: 'oauth2',
};

/**
 * Mock scenario data
 */
export const mockScenario: MakeScenario = {
  id: 123,
  name: 'Test Workflow',
  teamId: 456,
  folderId: null,
  flow: [
    {
      id: 1,
      module: 'gateway:CustomWebHook',
      version: 1,
      parameters: {},
      mapper: {},
      metadata: {
        designer: { x: 0, y: 0 }
      }
    },
    {
      id: 2,
      module: 'slack:ActionSendMessage',
      version: 1,
      parameters: {
        channel: '#general'
      },
      mapper: {
        text: '{{1.message}}'
      },
      metadata: {
        designer: { x: 300, y: 0 }
      }
    }
  ],
  scheduling: {
    type: 'indefinitely'
  }
};

/**
 * Mock template data
 */
export const mockTemplate: MakeTemplate = {
  id: 'template-123',
  name: 'Slack Notification Template',
  description: 'Send notifications to Slack',
  category: 'Communication',
  tags: ['slack', 'notification'],
  modules: ['slack', 'webhook'],
  popularity: 85,
  lastUpdated: '2024-01-01',
  thumbnail: 'https://example.com/template.png',
  scenario: mockScenario
};

/**
 * Mock environment variables for testing
 */
export const mockEnv = {
  MAKE_API_URL: 'https://us1.make.com',
  MAKE_API_TOKEN: 'test-token-123',
  MAKE_ORGANIZATION_ID: 'org-123',
  MAKE_TEAM_ID: 'team-456',
  NODE_ENV: 'test',
};

/**
 * Setup test environment variables
 */
export function setupTestEnv() {
  Object.entries(mockEnv).forEach(([key, value]) => {
    process.env[key] = value;
  });
}

/**
 * Clean up test environment
 */
export function cleanupTestEnv() {
  Object.keys(mockEnv).forEach(key => {
    delete process.env[key];
  });
}

/**
 * Mock API responses
 */
export const mockApiResponses = {
  listScenarios: {
    scenarios: [mockScenario],
    pg: { offset: 0, limit: 10, total: 1 }
  },
  getScenario: mockScenario,
  createScenario: { ...mockScenario, id: 789 },
  updateScenario: { success: true },
  deleteScenario: { success: true },
  cloneScenario: { ...mockScenario, id: 999, name: 'Test Workflow (Copy)' },
  executeScenario: { executionId: 'exec-123', status: 'running' },
  activateScenario: { success: true, active: true },
  deactivateScenario: { success: true, active: false },
  getOrganization: { id: 'org-123', name: 'Test Org' },
  getTeams: [{ id: 'team-456', name: 'Test Team' }],
  searchTemplates: [mockTemplate],
  getTemplate: mockTemplate,
};

/**
 * Create mock MakeApiClient
 */
export function createMockApiClient() {
  return {
    listScenarios: vi.fn().mockResolvedValue(mockApiResponses.listScenarios),
    getScenario: vi.fn().mockResolvedValue(mockApiResponses.getScenario),
    createScenario: vi.fn().mockResolvedValue(mockApiResponses.createScenario),
    updateScenario: vi.fn().mockResolvedValue(mockApiResponses.updateScenario),
    deleteScenario: vi.fn().mockResolvedValue(mockApiResponses.deleteScenario),
    cloneScenario: vi.fn().mockResolvedValue(mockApiResponses.cloneScenario),
    executeScenario: vi.fn().mockResolvedValue(mockApiResponses.executeScenario),
    activateScenario: vi.fn().mockResolvedValue(mockApiResponses.activateScenario),
    deactivateScenario: vi.fn().mockResolvedValue(mockApiResponses.deactivateScenario),
    getOrganization: vi.fn().mockResolvedValue(mockApiResponses.getOrganization),
    getTeams: vi.fn().mockResolvedValue(mockApiResponses.getTeams),
    healthCheck: vi.fn().mockResolvedValue({ status: 'ok' }),
  };
}

/**
 * Create mock TemplateService
 */
export function createMockTemplateService() {
  return {
    searchTemplates: vi.fn().mockResolvedValue(mockApiResponses.searchTemplates),
    getTemplateDetail: vi.fn().mockResolvedValue(mockApiResponses.getTemplate),
    templateToScenario: vi.fn().mockResolvedValue(mockScenario),
  };
}

/**
 * Create mock ModuleRepository
 */
export function createMockModuleRepository() {
  return {
    searchModules: vi.fn().mockResolvedValue([mockModule]),
    getModuleByName: vi.fn().mockResolvedValue(mockModule),
    getAllCategories: vi.fn().mockResolvedValue(['Communication', 'Productivity']),
    getModulesByCategory: vi.fn().mockResolvedValue([mockModule]),
    getTotalModules: vi.fn().mockResolvedValue(100),
    getModulesByIds: vi.fn().mockResolvedValue([mockModule]),
  };
}

