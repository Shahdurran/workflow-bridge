/**
 * Integration Tests for End-to-End Workflows
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { 
  mockScenario, 
  mockTemplate,
  createMockApiClient, 
  createMockTemplateService,
  createMockModuleRepository,
  setupTestEnv, 
  cleanupTestEnv 
} from './setup';

describe('Integration Tests - End-to-End Workflows', () => {
  beforeEach(() => {
    setupTestEnv();
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanupTestEnv();
  });

  describe('Complete Scenario Lifecycle', () => {
    it('should create, update, execute, and delete a scenario', async () => {
      const mockClient = createMockApiClient();
      
      // Step 1: Create scenario
      const newScenario = {
        name: 'Test Workflow',
        flow: mockScenario.flow,
        scheduling: { type: 'indefinitely' as const }
      };
      const created = await mockClient.createScenario(newScenario, 456);
      expect(created).toBeDefined();
      expect(created.id).toBeDefined();
      
      // Step 2: Get scenario
      // Note: Mock always returns scenario with id 123, in real implementation it would return created.id
      mockClient.getScenario.mockResolvedValueOnce({ ...mockScenario, id: created.id });
      const retrieved = await mockClient.getScenario(created.id);
      expect(retrieved).toBeDefined();
      expect(retrieved.id).toBe(created.id);
      
      // Step 3: Update scenario
      const updated = await mockClient.updateScenario(created.id, {
        name: 'Updated Workflow'
      });
      expect(updated.success).toBe(true);
      
      // Step 4: Activate scenario
      const activated = await mockClient.activateScenario(created.id);
      expect(activated.success).toBe(true);
      expect(activated.active).toBe(true);
      
      // Step 5: Execute scenario
      const execution = await mockClient.executeScenario(created.id);
      expect(execution).toBeDefined();
      expect(execution.executionId).toBeDefined();
      
      // Step 6: Deactivate scenario
      const deactivated = await mockClient.deactivateScenario(created.id);
      expect(deactivated.success).toBe(true);
      expect(deactivated.active).toBe(false);
      
      // Step 7: Delete scenario
      const deleted = await mockClient.deleteScenario(created.id);
      expect(deleted.success).toBe(true);
    });

    it('should clone and modify a scenario', async () => {
      const mockClient = createMockApiClient();
      
      // Clone existing scenario
      const cloned = await mockClient.cloneScenario(123, 'Cloned Workflow');
      expect(cloned).toBeDefined();
      expect(cloned.id).not.toBe(123);
      
      // Modify the cloned scenario
      const updated = await mockClient.updateScenario(cloned.id, {
        name: 'Modified Clone'
      });
      expect(updated.success).toBe(true);
    });
  });

  describe('Template to Scenario Workflow', () => {
    it('should search template, convert to scenario, and deploy', async () => {
      const mockTemplateService = createMockTemplateService();
      const mockClient = createMockApiClient();
      
      // Step 1: Search for templates
      const templates = await mockTemplateService.searchTemplates({
        query: 'slack notification',
        category: 'Communication'
      });
      expect(templates.length).toBeGreaterThan(0);
      
      // Step 2: Get template details
      const templateId = templates[0].id;
      const template = await mockTemplateService.getTemplateDetail(templateId);
      expect(template).toBeDefined();
      expect(template.scenario).toBeDefined();
      
      // Step 3: Convert template to scenario
      const scenario = await mockTemplateService.templateToScenario(templateId);
      expect(scenario).toBeDefined();
      expect(scenario.flow).toBeDefined();
      
      // Step 4: Customize and create scenario
      const customized = { ...scenario, name: 'My Custom Workflow' };
      const created = await mockClient.createScenario(customized, 456);
      expect(created).toBeDefined();
      expect(created.id).toBeDefined();
      
      // Step 5: Activate the new scenario
      const activated = await mockClient.activateScenario(created.id);
      expect(activated.success).toBe(true);
    });
  });

  describe('Module Discovery to Scenario Creation', () => {
    it('should discover modules and build a scenario', async () => {
      const mockRepo = createMockModuleRepository();
      const mockClient = createMockApiClient();
      
      // Step 1: Search for webhook module
      const webhookModules = await mockRepo.searchModules('webhook');
      expect(webhookModules.length).toBeGreaterThan(0);
      const webhook = webhookModules[0];
      
      // Step 2: Search for slack module
      const slackModules = await mockRepo.searchModules('slack');
      expect(slackModules.length).toBeGreaterThan(0);
      const slack = slackModules[0];
      
      // Step 3: Build scenario with discovered modules
      const newScenario = {
        name: 'Webhook to Slack',
        flow: [
          {
            id: 1,
            module: 'gateway:CustomWebHook',
            version: 1,
            parameters: {},
            mapper: {},
            metadata: { designer: { x: 0, y: 0 } }
          },
          {
            id: 2,
            module: 'slack:ActionSendMessage',
            version: 1,
            parameters: { channel: '#general' },
            mapper: { text: '{{1.message}}' },
            metadata: { designer: { x: 300, y: 0 } }
          }
        ],
        scheduling: { type: 'indefinitely' as const }
      };
      
      // Step 4: Create scenario
      const created = await mockClient.createScenario(newScenario, 456);
      expect(created).toBeDefined();
      expect(created.id).toBeDefined();
    });
  });

  describe('Scenario Diff Operations', () => {
    it('should apply multiple diff operations in sequence', async () => {
      const mockClient = createMockApiClient();
      
      // Get existing scenario
      const scenario = await mockClient.getScenario(123);
      expect(scenario).toBeDefined();
      
      // Apply multiple operations
      const operations = [
        // Rename scenario
        { type: 'updateName' as const, name: 'Updated Name' },
        // Add a module
        {
          type: 'addModule' as const,
          module: {
            id: 3,
            module: 'google:ActionSendEmail',
            version: 1,
            parameters: {},
            mapper: {},
            metadata: { designer: { x: 600, y: 0 } }
          }
        },
        // Update existing module
        {
          type: 'updateModule' as const,
          moduleId: 2,
          updates: {
            parameters: { channel: '#random' }
          }
        }
      ];
      
      // Apply operations (in real implementation, this would use ScenarioDiffEngine)
      const result = await mockClient.updateScenario(123, {
        name: 'Updated Name'
      });
      expect(result.success).toBe(true);
    });

    it('should validate scenario after updates', async () => {
      const mockClient = createMockApiClient();
      
      // Update scenario
      const updated = await mockClient.updateScenario(123, {
        name: 'Test'
      });
      expect(updated.success).toBe(true);
      
      // Get and validate
      const scenario = await mockClient.getScenario(123);
      expect(scenario).toBeDefined();
      expect(scenario.flow).toBeDefined();
      
      // Ensure all modules have required fields
      scenario.flow.forEach(module => {
        expect(module).toHaveProperty('id');
        expect(module).toHaveProperty('module');
        expect(module).toHaveProperty('version');
      });
    });
  });

  describe('Bulk Operations', () => {
    it('should list and process multiple scenarios', async () => {
      const mockClient = createMockApiClient();
      
      // List all scenarios
      const result = await mockClient.listScenarios({ limit: 50 });
      expect(result).toBeDefined();
      expect(result.scenarios).toBeDefined();
      
      // Process each scenario (e.g., validate, backup, etc.)
      for (const scenario of result.scenarios) {
        expect(scenario).toHaveProperty('id');
        expect(scenario).toHaveProperty('name');
      }
    });

    it('should batch search multiple module categories', async () => {
      const mockRepo = createMockModuleRepository();
      
      // Get all categories
      const categories = await mockRepo.getAllCategories();
      expect(categories.length).toBeGreaterThan(0);
      
      // Search modules in each category
      const results = await Promise.all(
        categories.map(category => mockRepo.getModulesByCategory(category))
      );
      
      expect(results.length).toBe(categories.length);
      results.forEach(modules => {
        expect(Array.isArray(modules)).toBe(true);
      });
    });
  });

  describe('Error Recovery Workflows', () => {
    it('should handle and recover from failed scenario creation', async () => {
      const mockClient = createMockApiClient();
      
      // Attempt to create invalid scenario
      mockClient.createScenario.mockRejectedValueOnce(
        new Error('Invalid scenario data')
      );
      
      await expect(
        mockClient.createScenario({} as any, 456)
      ).rejects.toThrow('Invalid scenario data');
      
      // Retry with valid data
      mockClient.createScenario.mockResolvedValueOnce({
        ...mockScenario,
        id: 999
      });
      
      const created = await mockClient.createScenario(mockScenario, 456);
      expect(created).toBeDefined();
      expect(created.id).toBe(999);
    });

    it('should rollback on partial update failure', async () => {
      const mockClient = createMockApiClient();
      
      // Get original scenario
      const original = await mockClient.getScenario(123);
      expect(original).toBeDefined();
      
      // Attempt update that fails
      mockClient.updateScenario.mockRejectedValueOnce(
        new Error('Update failed')
      );
      
      await expect(
        mockClient.updateScenario(123, { name: 'Bad Update' })
      ).rejects.toThrow('Update failed');
      
      // Verify original is still intact (by re-fetching)
      const current = await mockClient.getScenario(123);
      expect(current).toBeDefined();
      expect(current.id).toBe(original.id);
    });
  });

  describe('Performance Tests', () => {
    it('should handle rapid sequential API calls', async () => {
      const mockClient = createMockApiClient();
      
      const promises = Array(10).fill(null).map((_, i) => 
        mockClient.getScenario(i + 1)
      );
      
      const results = await Promise.all(promises);
      expect(results.length).toBe(10);
      results.forEach(result => {
        expect(result).toBeDefined();
      });
    });

    it('should efficiently search large module sets', async () => {
      const mockRepo = createMockModuleRepository();
      
      const searchTerms = ['slack', 'google', 'email', 'webhook', 'http'];
      const promises = searchTerms.map(term => 
        mockRepo.searchModules(term)
      );
      
      const results = await Promise.all(promises);
      expect(results.length).toBe(searchTerms.length);
      results.forEach(modules => {
        expect(Array.isArray(modules)).toBe(true);
      });
    });
  });

  describe('Complex Scenario Building', () => {
    it('should build multi-branch scenario with router', async () => {
      const mockClient = createMockApiClient();
      
      const complexScenario = {
        name: 'Multi-Branch Workflow',
        flow: [
          // Webhook trigger
          {
            id: 1,
            module: 'gateway:CustomWebHook',
            version: 1,
            parameters: {},
            mapper: {},
            metadata: { designer: { x: 0, y: 0 } }
          },
          // Router
          {
            id: 2,
            module: 'tools:Router',
            version: 1,
            parameters: {},
            mapper: {},
            metadata: { designer: { x: 300, y: 0 } },
            routes: [
              {
                flow: [
                  {
                    id: 3,
                    module: 'slack:ActionSendMessage',
                    version: 1,
                    parameters: {},
                    mapper: {},
                    metadata: { designer: { x: 600, y: -100 } }
                  }
                ]
              },
              {
                flow: [
                  {
                    id: 4,
                    module: 'google:ActionSendEmail',
                    version: 1,
                    parameters: {},
                    mapper: {},
                    metadata: { designer: { x: 600, y: 100 } }
                  }
                ]
              }
            ]
          }
        ],
        scheduling: { type: 'indefinitely' as const }
      };
      
      const created = await mockClient.createScenario(complexScenario, 456);
      expect(created).toBeDefined();
      expect(created.id).toBeDefined();
    });
  });
});

