/**
 * Template Service
 * Business logic for template operations
 * Based on n8n-mcp's template-service
 */

import { MakeTemplate, MakeScenario } from '../types/index';
import { Logger } from '../utils/logger';
import { TemplateFetcher, TemplateSearchFilters } from './template-fetcher';
import { TemplateRepository, TemplateSearchOptions } from './template-repository';
import { ValidationError } from '../errors/make-errors';

const logger = new Logger({ prefix: '[TemplateService]' });

/**
 * Template retrieval mode
 */
export type TemplateRetrievalMode = 'full' | 'metadata' | 'modules';

/**
 * Template Service
 */
export class TemplateService {
  private fetcher: TemplateFetcher;
  private repository: TemplateRepository;

  constructor(repository: TemplateRepository, fetcher?: TemplateFetcher) {
    this.repository = repository;
    this.fetcher = fetcher || new TemplateFetcher();
  }

  /**
   * Search templates (local database)
   */
  async searchTemplates(options: TemplateSearchOptions): Promise<MakeTemplate[]> {
    try {
      logger.debug('Searching templates', options);

      const templates = this.repository.searchTemplates(options);

      logger.debug('Found templates', { count: templates.length });

      return templates;
    } catch (error: any) {
      logger.error('Failed to search templates', { error: error.message });
      throw error;
    }
  }

  /**
   * Get template by ID
   */
  async getTemplate(
    templateId: string,
    mode: TemplateRetrievalMode = 'full'
  ): Promise<MakeTemplate | null> {
    try {
      logger.debug('Getting template', { templateId, mode });

      let template = this.repository.getTemplateById(templateId);

      // If not found in database, try fetching from Make.com
      if (!template) {
        logger.debug('Template not in database, fetching from Make.com', { templateId });
        template = await this.fetcher.fetchTemplate(templateId);

        if (template) {
          // Save to database for future use
          this.repository.upsertTemplate(template);
        }
      }

      if (!template) {
        return null;
      }

      // Filter based on mode
      return this.filterTemplateByMode(template, mode);
    } catch (error: any) {
      logger.error('Failed to get template', {
        templateId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Get popular templates
   */
  async getPopularTemplates(limit: number = 10): Promise<MakeTemplate[]> {
    try {
      logger.debug('Getting popular templates', { limit });

      const templates = this.repository.getPopularTemplates(limit);

      logger.debug('Found popular templates', { count: templates.length });

      return templates;
    } catch (error: any) {
      logger.error('Failed to get popular templates', { error: error.message });
      throw error;
    }
  }

  /**
   * Get templates by category
   */
  async getTemplatesByCategory(
    category: string,
    limit: number = 10
  ): Promise<MakeTemplate[]> {
    try {
      logger.debug('Getting templates by category', { category, limit });

      const templates = this.repository.getTemplatesByCategory(category, limit);

      logger.debug('Found templates', { count: templates.length });

      return templates;
    } catch (error: any) {
      logger.error('Failed to get templates by category', {
        category,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Get all categories
   */
  async getCategories(): Promise<string[]> {
    try {
      logger.debug('Getting categories');

      const categories = this.repository.getAllCategories();

      logger.debug('Found categories', { count: categories.length });

      return categories;
    } catch (error: any) {
      logger.error('Failed to get categories', { error: error.message });
      throw error;
    }
  }

  /**
   * Convert template to scenario
   */
  async templateToScenario(templateId: string, name?: string): Promise<MakeScenario> {
    try {
      logger.debug('Converting template to scenario', { templateId, name });

      const template = await this.getTemplate(templateId, 'full');

      if (!template) {
        throw new ValidationError(`Template ${templateId} not found`);
      }

      if (!template.flow || template.flow.length === 0) {
        throw new ValidationError(`Template ${templateId} has no flow data`);
      }

      // Create scenario from template
      const scenario: MakeScenario = {
        name: name || template.name || 'Untitled Scenario',
        flow: template.flow,
        metadata: {
          ...template.metadata,
          templateId: template.template_id,
          createdFrom: 'template',
        },
      };

      logger.debug('Converted template to scenario', {
        templateId,
        scenarioName: scenario.name,
      });

      return scenario;
    } catch (error: any) {
      logger.error('Failed to convert template to scenario', {
        templateId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Sync templates from Make.com
   */
  async syncTemplatesFromMakeCom(filters?: TemplateSearchFilters): Promise<number> {
    try {
      logger.info('Syncing templates from Make.com', filters);

      const templateMetadataList = await this.fetcher.searchTemplates(filters || {});

      let syncedCount = 0;

      for (const metadata of templateMetadataList) {
        try {
          // Fetch full template
          const template = await this.fetcher.fetchTemplate(metadata.id);

          if (template) {
            // Save to database
            this.repository.upsertTemplate(template);
            syncedCount++;
          }
        } catch (error: any) {
          logger.warn('Failed to sync template', {
            templateId: metadata.id,
            error: error.message,
          });
        }
      }

      logger.info('Synced templates', { count: syncedCount });

      return syncedCount;
    } catch (error: any) {
      logger.error('Failed to sync templates', { error: error.message });
      throw error;
    }
  }

  /**
   * Get template statistics
   */
  async getStatistics(): Promise<{
    totalTemplates: number;
    totalCategories: number;
    averagePopularity: number;
  }> {
    try {
      return this.repository.getStatistics();
    } catch (error: any) {
      logger.error('Failed to get template statistics', { error: error.message });
      throw error;
    }
  }

  /**
   * Delete template
   */
  async deleteTemplate(templateId: string): Promise<boolean> {
    try {
      logger.debug('Deleting template', { templateId });

      const deleted = this.repository.deleteTemplate(templateId);

      if (deleted) {
        logger.info('Deleted template', { templateId });
      } else {
        logger.warn('Template not found for deletion', { templateId });
      }

      return deleted;
    } catch (error: any) {
      logger.error('Failed to delete template', {
        templateId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Filter template by retrieval mode
   */
  private filterTemplateByMode(
    template: MakeTemplate,
    mode: TemplateRetrievalMode
  ): MakeTemplate {
    switch (mode) {
      case 'metadata':
        // Return only metadata, no flow
        return {
          id: template.id,
          template_id: template.template_id,
          name: template.name,
          description: template.description,
          modules: template.modules,
          category: template.category,
          popularity_score: template.popularity_score,
          metadata: template.metadata,
        };

      case 'modules':
        // Return only module list
        return {
          id: template.id,
          template_id: template.template_id,
          name: template.name,
          modules: template.modules,
        };

      case 'full':
      default:
        // Return full template
        return template;
    }
  }

  /**
   * Count templates
   */
  async countTemplates(filters?: { query?: string; category?: string }): Promise<number> {
    try {
      return this.repository.countTemplates(filters);
    } catch (error: any) {
      logger.error('Failed to count templates', { error: error.message });
      throw error;
    }
  }

  /**
   * Validate template structure
   */
  validateTemplate(template: MakeTemplate): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!template.template_id) {
      errors.push('Template ID is required');
    }

    if (!template.name || template.name.trim().length === 0) {
      errors.push('Template name is required');
    }

    if (!template.flow || !Array.isArray(template.flow)) {
      errors.push('Template flow must be an array');
    }

    if (template.flow && template.flow.length === 0) {
      errors.push('Template flow cannot be empty');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

