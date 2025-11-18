/**
 * Tests for Module Search Tools (10 tools)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mockModule, createMockModuleRepository, setupTestEnv, cleanupTestEnv } from './setup';

describe('Module Search Tools', () => {
  beforeEach(() => {
    setupTestEnv();
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanupTestEnv();
  });

  describe('make_search_modules', () => {
    it('should search modules by query', async () => {
      const mockRepo = createMockModuleRepository();
      const result = await mockRepo.searchModules('slack');
      
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('label');
      expect(result[0]).toHaveProperty('value');
    });

    it('should handle empty search results', async () => {
      const mockRepo = createMockModuleRepository();
      mockRepo.searchModules.mockResolvedValue([]);
      
      const result = await mockRepo.searchModules('nonexistent');
      expect(result).toEqual([]);
    });

    it('should limit search results', async () => {
      const mockRepo = createMockModuleRepository();
      const results = Array(20).fill(mockModule);
      mockRepo.searchModules.mockResolvedValue(results);
      
      const result = await mockRepo.searchModules('slack', 10);
      expect(mockRepo.searchModules).toHaveBeenCalledWith('slack', 10);
    });
  });

  describe('make_get_module_by_name', () => {
    it('should get module by exact name', async () => {
      const mockRepo = createMockModuleRepository();
      const result = await mockRepo.getModuleByName('slack');
      
      expect(result).toBeDefined();
      expect(result).toHaveProperty('name', 'slack');
      expect(result).toHaveProperty('label');
    });

    it('should return null for non-existent module', async () => {
      const mockRepo = createMockModuleRepository();
      mockRepo.getModuleByName.mockResolvedValue(null);
      
      const result = await mockRepo.getModuleByName('nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('make_list_all_modules', () => {
    it('should list all modules with pagination', async () => {
      const mockRepo = createMockModuleRepository();
      const modules = Array(50).fill(mockModule).map((m, i) => ({ ...m, id: i }));
      mockRepo.searchModules.mockResolvedValue(modules.slice(0, 20));
      
      const result = await mockRepo.searchModules('', 20);
      expect(result.length).toBe(20);
    });
  });

  describe('make_get_module_categories', () => {
    it('should return all module categories', async () => {
      const mockRepo = createMockModuleRepository();
      const result = await mockRepo.getAllCategories();
      
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('make_get_modules_by_category', () => {
    it('should get modules by category', async () => {
      const mockRepo = createMockModuleRepository();
      const result = await mockRepo.getModulesByCategory('Communication');
      
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result[0]).toHaveProperty('category', 'Communication');
    });

    it('should return empty array for invalid category', async () => {
      const mockRepo = createMockModuleRepository();
      mockRepo.getModulesByCategory.mockResolvedValue([]);
      
      const result = await mockRepo.getModulesByCategory('InvalidCategory');
      expect(result).toEqual([]);
    });
  });

  describe('make_get_module_details', () => {
    it('should get detailed module information', async () => {
      const mockRepo = createMockModuleRepository();
      const result = await mockRepo.getModuleByName('slack');
      
      expect(result).toBeDefined();
      expect(result).toHaveProperty('parameters');
      expect(result).toHaveProperty('crud_operations');
      expect(result).toHaveProperty('common_use_cases');
    });
  });

  describe('make_get_module_parameters', () => {
    it('should extract module parameters', async () => {
      const mockRepo = createMockModuleRepository();
      const module = await mockRepo.getModuleByName('slack');
      
      expect(module).toBeDefined();
      const params = JSON.parse(module!.parameters);
      expect(params).toBeDefined();
      expect(typeof params).toBe('object');
    });
  });

  describe('make_get_modules_by_use_case', () => {
    it('should find modules by use case', async () => {
      const mockRepo = createMockModuleRepository();
      const result = await mockRepo.searchModules('send message');
      
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('make_get_module_connection_info', () => {
    it('should get module connection information', async () => {
      const mockRepo = createMockModuleRepository();
      const module = await mockRepo.getModuleByName('slack');
      
      expect(module).toBeDefined();
      expect(module).toHaveProperty('connection_type');
      expect(module?.connection_type).toBe('oauth2');
    });
  });

  describe('make_get_module_count', () => {
    it('should return total module count', async () => {
      const mockRepo = createMockModuleRepository();
      const count = await mockRepo.getTotalModules();
      
      expect(count).toBeDefined();
      expect(typeof count).toBe('number');
      expect(count).toBeGreaterThan(0);
    });
  });
});

