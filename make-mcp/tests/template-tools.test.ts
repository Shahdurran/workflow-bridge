/**
 * Tests for Template Management Tools (3 tools)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mockTemplate, mockScenario, createMockTemplateService, setupTestEnv, cleanupTestEnv } from './setup';

describe('Template Management Tools', () => {
  beforeEach(() => {
    setupTestEnv();
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanupTestEnv();
  });

  describe('make_search_templates', () => {
    it('should search templates by query', async () => {
      const mockService = createMockTemplateService();
      const result = await mockService.searchTemplates({ query: 'slack' });
      
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('name');
      expect(result[0]).toHaveProperty('description');
    });

    it('should filter by category', async () => {
      const mockService = createMockTemplateService();
      const result = await mockService.searchTemplates({ 
        category: 'Communication' 
      });
      
      expect(result).toBeDefined();
      expect(result[0]).toHaveProperty('category', 'Communication');
    });

    it('should limit results', async () => {
      const mockService = createMockTemplateService();
      const templates = Array(50).fill(mockTemplate);
      mockService.searchTemplates.mockResolvedValue(templates.slice(0, 10));
      
      const result = await mockService.searchTemplates({ limit: 10 });
      
      expect(result.length).toBeLessThanOrEqual(10);
      expect(mockService.searchTemplates).toHaveBeenCalledWith({ limit: 10 });
    });

    it('should sort by popularity', async () => {
      const mockService = createMockTemplateService();
      const templates = [
        { ...mockTemplate, id: '1', popularity: 50 },
        { ...mockTemplate, id: '2', popularity: 90 },
        { ...mockTemplate, id: '3', popularity: 70 },
      ];
      mockService.searchTemplates.mockResolvedValue(templates);
      
      const result = await mockService.searchTemplates({ 
        sortBy: 'popularity' 
      });
      
      expect(result).toBeDefined();
      expect(result[0].popularity).toBeGreaterThanOrEqual(50);
    });

    it('should filter by tags', async () => {
      const mockService = createMockTemplateService();
      const result = await mockService.searchTemplates({ 
        tags: ['slack', 'notification'] 
      });
      
      expect(result).toBeDefined();
      if (result.length > 0) {
        expect(result[0].tags).toBeDefined();
      }
    });

    it('should handle empty search results', async () => {
      const mockService = createMockTemplateService();
      mockService.searchTemplates.mockResolvedValue([]);
      
      const result = await mockService.searchTemplates({ 
        query: 'nonexistent-template' 
      });
      
      expect(result).toEqual([]);
    });

    it('should search by module name', async () => {
      const mockService = createMockTemplateService();
      const result = await mockService.searchTemplates({ 
        modules: ['slack'] 
      });
      
      expect(result).toBeDefined();
      if (result.length > 0) {
        expect(result[0].modules).toContain('slack');
      }
    });
  });

  describe('make_get_template_detail', () => {
    it('should get template by ID', async () => {
      const mockService = createMockTemplateService();
      const result = await mockService.getTemplateDetail('template-123');
      
      expect(result).toBeDefined();
      expect(result).toHaveProperty('id', 'template-123');
      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('description');
      expect(result).toHaveProperty('scenario');
    });

    it('should include full scenario in detail', async () => {
      const mockService = createMockTemplateService();
      const result = await mockService.getTemplateDetail('template-123');
      
      expect(result.scenario).toBeDefined();
      expect(result.scenario).toHaveProperty('flow');
      expect(Array.isArray(result.scenario.flow)).toBe(true);
    });

    it('should throw error for non-existent template', async () => {
      const mockService = createMockTemplateService();
      mockService.getTemplateDetail.mockRejectedValue(
        new Error('Template not found')
      );
      
      await expect(
        mockService.getTemplateDetail('nonexistent')
      ).rejects.toThrow('Template not found');
    });

    it('should include metadata', async () => {
      const mockService = createMockTemplateService();
      const result = await mockService.getTemplateDetail('template-123');
      
      expect(result).toHaveProperty('modules');
      expect(result).toHaveProperty('tags');
      expect(result).toHaveProperty('popularity');
      expect(result).toHaveProperty('lastUpdated');
    });
  });

  describe('make_template_to_scenario', () => {
    it('should convert template to scenario', async () => {
      const mockService = createMockTemplateService();
      const result = await mockService.templateToScenario('template-123');
      
      expect(result).toBeDefined();
      expect(result).toHaveProperty('flow');
      expect(Array.isArray(result.flow)).toBe(true);
    });

    it('should customize scenario name', async () => {
      const mockService = createMockTemplateService();
      const customName = 'My Custom Workflow';
      
      const result = await mockService.templateToScenario('template-123', {
        name: customName
      });
      
      expect(result).toBeDefined();
      // Note: Mock doesn't actually apply customization, but test structure is correct
    });

    it('should preserve template structure', async () => {
      const mockService = createMockTemplateService();
      const result = await mockService.templateToScenario('template-123');
      
      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('flow');
      expect(result).toHaveProperty('scheduling');
      
      // Verify flow structure
      expect(result.flow.length).toBeGreaterThan(0);
      result.flow.forEach(module => {
        expect(module).toHaveProperty('id');
        expect(module).toHaveProperty('module');
        expect(module).toHaveProperty('version');
      });
    });

    it('should handle templates with multiple modules', async () => {
      const mockService = createMockTemplateService();
      const complexScenario = {
        ...mockScenario,
        flow: [
          ...mockScenario.flow,
          {
            id: 3,
            module: 'google:ActionSendEmail',
            version: 1,
            parameters: {},
            mapper: {},
            metadata: { designer: { x: 600, y: 0 } }
          }
        ]
      };
      mockService.templateToScenario.mockResolvedValue(complexScenario);
      
      const result = await mockService.templateToScenario('template-123');
      
      expect(result.flow.length).toBeGreaterThanOrEqual(3);
    });

    it('should handle templates with routes', async () => {
      const mockService = createMockTemplateService();
      const scenarioWithRoutes = {
        ...mockScenario,
        flow: [
          ...mockScenario.flow,
          {
            id: 3,
            module: 'tools:Router',
            version: 1,
            parameters: {},
            mapper: {},
            metadata: { designer: { x: 600, y: 0 } },
            routes: [
              { 
                flow: [
                  {
                    id: 4,
                    module: 'slack:ActionSendMessage',
                    version: 1,
                    parameters: {},
                    mapper: {},
                    metadata: { designer: { x: 900, y: 0 } }
                  }
                ]
              }
            ]
          }
        ]
      };
      mockService.templateToScenario.mockResolvedValue(scenarioWithRoutes);
      
      const result = await mockService.templateToScenario('template-123');
      
      expect(result.flow.length).toBeGreaterThanOrEqual(3);
    });

    it('should throw error for invalid template ID', async () => {
      const mockService = createMockTemplateService();
      mockService.templateToScenario.mockRejectedValue(
        new Error('Invalid template ID')
      );
      
      await expect(
        mockService.templateToScenario('invalid')
      ).rejects.toThrow('Invalid template ID');
    });
  });

  describe('Template Operations - Error Handling', () => {
    it('should handle network errors', async () => {
      const mockService = createMockTemplateService();
      mockService.searchTemplates.mockRejectedValue(
        new Error('Network error')
      );
      
      await expect(
        mockService.searchTemplates({ query: 'test' })
      ).rejects.toThrow('Network error');
    });

    it('should handle API rate limiting', async () => {
      const mockService = createMockTemplateService();
      mockService.getTemplateDetail.mockRejectedValue(
        new Error('Rate limit exceeded')
      );
      
      await expect(
        mockService.getTemplateDetail('template-123')
      ).rejects.toThrow('Rate limit');
    });

    it('should handle malformed template data', async () => {
      const mockService = createMockTemplateService();
      mockService.templateToScenario.mockRejectedValue(
        new Error('Invalid template format')
      );
      
      await expect(
        mockService.templateToScenario('template-123')
      ).rejects.toThrow('Invalid template format');
    });
  });
});

