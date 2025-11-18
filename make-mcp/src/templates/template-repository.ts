/**
 * Template Repository
 * Database operations for Make.com templates
 * Based on n8n-mcp's template-repository
 */

import Database from 'better-sqlite3';
import { MakeTemplate } from '../types/index';
import { Logger } from '../utils/logger';
import { DatabaseError } from '../errors/make-errors';

const logger = new Logger({ prefix: '[TemplateRepository]' });

/**
 * Template search options
 */
export interface TemplateSearchOptions {
  query?: string;
  category?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'popularity' | 'name' | 'created_at';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Template Repository
 */
export class TemplateRepository {
  private db: Database.Database;

  constructor(db: Database.Database) {
    this.db = db;
  }

  /**
   * Insert or update a template
   */
  upsertTemplate(template: MakeTemplate): number {
    try {
      const stmt = this.db.prepare(`
        INSERT INTO make_templates (
          template_id, name, description, modules, flow, metadata, category, popularity_score
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(template_id) DO UPDATE SET
          name = excluded.name,
          description = excluded.description,
          modules = excluded.modules,
          flow = excluded.flow,
          metadata = excluded.metadata,
          category = excluded.category,
          popularity_score = excluded.popularity_score,
          updated_at = CURRENT_TIMESTAMP
      `);

      const result = stmt.run(
        template.template_id,
        template.name,
        template.description || null,
        template.modules ? JSON.stringify(template.modules) : null,
        template.flow ? JSON.stringify(template.flow) : null,
        template.metadata ? JSON.stringify(template.metadata) : null,
        template.category || null,
        template.popularity_score || 0
      );

      logger.debug('Upserted template', {
        templateId: template.template_id,
        id: result.lastInsertRowid,
      });

      return Number(result.lastInsertRowid);
    } catch (error: any) {
      logger.error('Failed to upsert template', {
        templateId: template.template_id,
        error: error.message,
      });
      throw new DatabaseError('Failed to upsert template', { error: error.message });
    }
  }

  /**
   * Get template by ID
   */
  getTemplateById(templateId: string): MakeTemplate | null {
    try {
      const stmt = this.db.prepare(`
        SELECT * FROM make_templates
        WHERE template_id = ?
      `);

      const row = stmt.get(templateId) as any;

      if (!row) {
        return null;
      }

      return this.rowToTemplate(row);
    } catch (error: any) {
      logger.error('Failed to get template by ID', {
        templateId,
        error: error.message,
      });
      throw new DatabaseError('Failed to get template', { error: error.message });
    }
  }

  /**
   * Search templates
   */
  searchTemplates(options: TemplateSearchOptions): MakeTemplate[] {
    try {
      const {
        query,
        category,
        limit = 10,
        offset = 0,
        sortBy = 'popularity',
        sortOrder = 'desc',
      } = options;

      let sql = `SELECT * FROM make_templates WHERE 1=1`;
      const params: any[] = [];

      // Add query filter
      if (query) {
        sql += ` AND (
          name LIKE ? OR 
          description LIKE ? OR
          category LIKE ?
        )`;
        const searchPattern = `%${query}%`;
        params.push(searchPattern, searchPattern, searchPattern);
      }

      // Add category filter
      if (category) {
        sql += ` AND category = ?`;
        params.push(category);
      }

      // Add sorting
      const sortColumn = sortBy === 'popularity' ? 'popularity_score' : sortBy;
      sql += ` ORDER BY ${sortColumn} ${sortOrder.toUpperCase()}`;

      // Add pagination
      sql += ` LIMIT ? OFFSET ?`;
      params.push(limit, offset);

      const stmt = this.db.prepare(sql);
      const rows = stmt.all(...params) as any[];

      return rows.map(row => this.rowToTemplate(row));
    } catch (error: any) {
      logger.error('Failed to search templates', {
        options,
        error: error.message,
      });
      throw new DatabaseError('Failed to search templates', { error: error.message });
    }
  }

  /**
   * Get templates by category
   */
  getTemplatesByCategory(category: string, limit: number = 10): MakeTemplate[] {
    return this.searchTemplates({ category, limit });
  }

  /**
   * Get popular templates
   */
  getPopularTemplates(limit: number = 10): MakeTemplate[] {
    return this.searchTemplates({
      limit,
      sortBy: 'popularity',
      sortOrder: 'desc',
    });
  }

  /**
   * Get all categories
   */
  getAllCategories(): string[] {
    try {
      const stmt = this.db.prepare(`
        SELECT DISTINCT category 
        FROM make_templates 
        WHERE category IS NOT NULL
        ORDER BY category
      `);

      const rows = stmt.all() as Array<{ category: string }>;
      return rows.map(row => row.category);
    } catch (error: any) {
      logger.error('Failed to get categories', { error: error.message });
      throw new DatabaseError('Failed to get categories', { error: error.message });
    }
  }

  /**
   * Count templates
   */
  countTemplates(filters?: { query?: string; category?: string }): number {
    try {
      let sql = `SELECT COUNT(*) as count FROM make_templates WHERE 1=1`;
      const params: any[] = [];

      if (filters?.query) {
        sql += ` AND (name LIKE ? OR description LIKE ?)`;
        const searchPattern = `%${filters.query}%`;
        params.push(searchPattern, searchPattern);
      }

      if (filters?.category) {
        sql += ` AND category = ?`;
        params.push(filters.category);
      }

      const stmt = this.db.prepare(sql);
      const result = stmt.get(...params) as { count: number };

      return result.count;
    } catch (error: any) {
      logger.error('Failed to count templates', { error: error.message });
      throw new DatabaseError('Failed to count templates', { error: error.message });
    }
  }

  /**
   * Delete template
   */
  deleteTemplate(templateId: string): boolean {
    try {
      const stmt = this.db.prepare(`
        DELETE FROM make_templates WHERE template_id = ?
      `);

      const result = stmt.run(templateId);

      logger.debug('Deleted template', {
        templateId,
        changes: result.changes,
      });

      return result.changes > 0;
    } catch (error: any) {
      logger.error('Failed to delete template', {
        templateId,
        error: error.message,
      });
      throw new DatabaseError('Failed to delete template', { error: error.message });
    }
  }

  /**
   * Get template statistics
   */
  getStatistics(): {
    totalTemplates: number;
    totalCategories: number;
    averagePopularity: number;
  } {
    try {
      const stmt = this.db.prepare(`
        SELECT 
          COUNT(*) as totalTemplates,
          COUNT(DISTINCT category) as totalCategories,
          AVG(popularity_score) as averagePopularity
        FROM make_templates
      `);

      const result = stmt.get() as any;

      return {
        totalTemplates: result.totalTemplates || 0,
        totalCategories: result.totalCategories || 0,
        averagePopularity: result.averagePopularity || 0,
      };
    } catch (error: any) {
      logger.error('Failed to get template statistics', { error: error.message });
      throw new DatabaseError('Failed to get template statistics', {
        error: error.message,
      });
    }
  }

  /**
   * Convert database row to MakeTemplate
   */
  private rowToTemplate(row: any): MakeTemplate {
    return {
      id: row.id,
      template_id: row.template_id,
      name: row.name,
      description: row.description,
      modules: row.modules ? JSON.parse(row.modules) : undefined,
      flow: row.flow ? JSON.parse(row.flow) : undefined,
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
      category: row.category,
      popularity_score: row.popularity_score,
    };
  }

  /**
   * Bulk insert templates
   */
  bulkInsertTemplates(templates: MakeTemplate[]): number {
    try {
      const insertedCount = this.db.transaction(() => {
        let count = 0;
        for (const template of templates) {
          this.upsertTemplate(template);
          count++;
        }
        return count;
      })();

      logger.info('Bulk inserted templates', { count: insertedCount });

      return insertedCount;
    } catch (error: any) {
      logger.error('Failed to bulk insert templates', { error: error.message });
      throw new DatabaseError('Failed to bulk insert templates', {
        error: error.message,
      });
    }
  }
}

