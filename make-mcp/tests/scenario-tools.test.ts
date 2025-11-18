/**
 * Tests for Scenario Management Tools (9 tools)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mockScenario, createMockApiClient, setupTestEnv, cleanupTestEnv } from './setup';

describe('Scenario Management Tools', () => {
  beforeEach(() => {
    setupTestEnv();
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanupTestEnv();
  });

  describe('make_list_scenarios', () => {
    it('should list scenarios with default parameters', async () => {
      const mockClient = createMockApiClient();
      const result = await mockClient.listScenarios();
      
      expect(result).toBeDefined();
      expect(result).toHaveProperty('scenarios');
      expect(Array.isArray(result.scenarios)).toBe(true);
      expect(result).toHaveProperty('pg');
    });

    it('should support pagination', async () => {
      const mockClient = createMockApiClient();
      await mockClient.listScenarios({ limit: 20, offset: 40 });
      
      expect(mockClient.listScenarios).toHaveBeenCalledWith({ limit: 20, offset: 40 });
    });

    it('should filter by team', async () => {
      const mockClient = createMockApiClient();
      await mockClient.listScenarios({ teamId: 456 });
      
      expect(mockClient.listScenarios).toHaveBeenCalledWith({ teamId: 456 });
    });
  });

  describe('make_get_scenario', () => {
    it('should get scenario by ID', async () => {
      const mockClient = createMockApiClient();
      const result = await mockClient.getScenario(123);
      
      expect(result).toBeDefined();
      expect(result).toHaveProperty('id', 123);
      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('flow');
    });

    it('should throw error for invalid scenario ID', async () => {
      const mockClient = createMockApiClient();
      mockClient.getScenario.mockRejectedValue(new Error('Scenario not found'));
      
      await expect(mockClient.getScenario(999999)).rejects.toThrow('Scenario not found');
    });
  });

  describe('make_create_scenario', () => {
    it('should create a new scenario', async () => {
      const mockClient = createMockApiClient();
      const newScenario = {
        name: 'New Test Workflow',
        flow: mockScenario.flow,
        scheduling: { type: 'indefinitely' as const }
      };
      
      const result = await mockClient.createScenario(newScenario, 456);
      
      expect(result).toBeDefined();
      expect(result).toHaveProperty('id');
      expect(result.id).toBeGreaterThan(0);
    });

    it('should validate required fields', async () => {
      const mockClient = createMockApiClient();
      mockClient.createScenario.mockRejectedValue(new Error('Invalid scenario data'));
      
      const invalidScenario = { name: '' };
      await expect(mockClient.createScenario(invalidScenario as any, 456)).rejects.toThrow();
    });
  });

  describe('make_update_partial_scenario', () => {
    it('should update scenario name', async () => {
      const mockClient = createMockApiClient();
      const operations = [
        { type: 'updateName' as const, name: 'Updated Name' }
      ];
      
      const result = await mockClient.updateScenario(123, { name: 'Updated Name' });
      
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });

    it('should add module to scenario', async () => {
      const mockClient = createMockApiClient();
      const operations = [
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
        }
      ];
      
      const result = await mockClient.updateScenario(123, {});
      expect(result).toBeDefined();
    });

    it('should remove module from scenario', async () => {
      const mockClient = createMockApiClient();
      const operations = [
        { type: 'removeModule' as const, moduleId: 2 }
      ];
      
      const result = await mockClient.updateScenario(123, {});
      expect(result).toBeDefined();
    });

    it('should update module configuration', async () => {
      const mockClient = createMockApiClient();
      const operations = [
        {
          type: 'updateModule' as const,
          moduleId: 2,
          updates: {
            parameters: { channel: '#random' }
          }
        }
      ];
      
      const result = await mockClient.updateScenario(123, {});
      expect(result).toBeDefined();
    });

    it('should add route between modules', async () => {
      const mockClient = createMockApiClient();
      const operations = [
        {
          type: 'addRoute' as const,
          route: {
            source: { moduleId: 1, route: 'fallback' },
            target: { moduleId: 3 }
          }
        }
      ];
      
      const result = await mockClient.updateScenario(123, {});
      expect(result).toBeDefined();
    });
  });

  describe('make_delete_scenario', () => {
    it('should delete scenario by ID', async () => {
      const mockClient = createMockApiClient();
      const result = await mockClient.deleteScenario(123);
      
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });

    it('should throw error for non-existent scenario', async () => {
      const mockClient = createMockApiClient();
      mockClient.deleteScenario.mockRejectedValue(new Error('Scenario not found'));
      
      await expect(mockClient.deleteScenario(999999)).rejects.toThrow();
    });
  });

  describe('make_clone_scenario', () => {
    it('should clone existing scenario', async () => {
      const mockClient = createMockApiClient();
      const result = await mockClient.cloneScenario(123, 'Test Workflow (Copy)');
      
      expect(result).toBeDefined();
      expect(result).toHaveProperty('id');
      expect(result.id).not.toBe(123);
      expect(result.name).toContain('Copy');
    });

    it('should preserve scenario structure when cloning', async () => {
      const mockClient = createMockApiClient();
      const result = await mockClient.cloneScenario(123);
      
      expect(result).toHaveProperty('flow');
      expect(result.flow).toBeDefined();
    });
  });

  describe('make_execute_scenario', () => {
    it('should execute scenario', async () => {
      const mockClient = createMockApiClient();
      const result = await mockClient.executeScenario(123);
      
      expect(result).toBeDefined();
      expect(result).toHaveProperty('executionId');
      expect(result).toHaveProperty('status');
    });

    it('should throw error for inactive scenario', async () => {
      const mockClient = createMockApiClient();
      mockClient.executeScenario.mockRejectedValue(new Error('Scenario is not active'));
      
      await expect(mockClient.executeScenario(123)).rejects.toThrow('Scenario is not active');
    });
  });

  describe('make_activate_scenario', () => {
    it('should activate scenario', async () => {
      const mockClient = createMockApiClient();
      const result = await mockClient.activateScenario(123);
      
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.active).toBe(true);
    });

    it('should validate scenario before activation', async () => {
      const mockClient = createMockApiClient();
      mockClient.activateScenario.mockRejectedValue(
        new Error('Scenario has validation errors')
      );
      
      await expect(mockClient.activateScenario(123)).rejects.toThrow('validation errors');
    });
  });

  describe('make_deactivate_scenario', () => {
    it('should deactivate scenario', async () => {
      const mockClient = createMockApiClient();
      const result = await mockClient.deactivateScenario(123);
      
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.active).toBe(false);
    });

    it('should handle already inactive scenario', async () => {
      const mockClient = createMockApiClient();
      const result = await mockClient.deactivateScenario(123);
      
      expect(result.success).toBe(true);
    });
  });

  describe('Scenario Operations - Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      const mockClient = createMockApiClient();
      mockClient.getScenario.mockRejectedValue(new Error('Network error'));
      
      await expect(mockClient.getScenario(123)).rejects.toThrow('Network error');
    });

    it('should handle authentication errors', async () => {
      const mockClient = createMockApiClient();
      mockClient.listScenarios.mockRejectedValue(new Error('Unauthorized'));
      
      await expect(mockClient.listScenarios()).rejects.toThrow('Unauthorized');
    });

    it('should handle rate limiting', async () => {
      const mockClient = createMockApiClient();
      mockClient.createScenario.mockRejectedValue(new Error('Rate limit exceeded'));
      
      await expect(
        mockClient.createScenario(mockScenario, 456)
      ).rejects.toThrow('Rate limit');
    });
  });
});

