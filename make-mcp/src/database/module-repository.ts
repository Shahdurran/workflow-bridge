/**
 * Module Repository - Data access layer for Make modules
 */

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

export interface MakeModule {
    id?: number;
    module_name: string;
    module_type: 'trigger' | 'action' | 'search' | 'instant_trigger' | 'aggregator' | 'router' | 'transformer' | 'iterator' | 'repeater';
    app_name: string;
    app_slug: string;
    description?: string;
    documentation?: string;
    parameters?: ModuleParameter[];
    examples?: any[];
    category?: string;
    popularity_score?: number;
    is_premium?: boolean;
}

export interface ModuleParameter {
    parameter_name: string;
    parameter_type: string;
    is_required: boolean;
    description?: string;
    default_value?: string;
    options?: any[];
    validation_rules?: any;
}

export interface MakeTemplate {
    id?: number;
    template_id: string;
    name: string;
    description?: string;
    modules?: string[];
    flow?: any;
    metadata?: any;
    category?: string;
    popularity_score?: number;
}

export class ModuleRepository {
    private db: Database.Database;
    private dbPath: string;

    constructor(dbPath?: string) {
        this.dbPath = dbPath || path.join(__dirname, '../../data/make-modules.db');
        
        // Ensure data directory exists
        const dataDir = path.dirname(this.dbPath);
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }

        // Initialize database
        this.db = new Database(this.dbPath);
        this.db.pragma('journal_mode = WAL');
        this.initializeSchema();
    }

    private initializeSchema(): void {
        const schemaPath = path.join(__dirname, 'schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf-8');
        this.db.exec(schema);
    }

    /**
     * Insert or update a module
     */
    upsertModule(module: MakeModule): number {
        const stmt = this.db.prepare(`
            INSERT INTO make_modules (
                module_name, module_type, app_name, app_slug, 
                description, documentation, parameters, examples,
                category, popularity_score, is_premium
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(module_name) DO UPDATE SET
                module_type = excluded.module_type,
                app_name = excluded.app_name,
                app_slug = excluded.app_slug,
                description = excluded.description,
                documentation = excluded.documentation,
                parameters = excluded.parameters,
                examples = excluded.examples,
                category = excluded.category,
                popularity_score = excluded.popularity_score,
                is_premium = excluded.is_premium,
                updated_at = CURRENT_TIMESTAMP
        `);

        const result = stmt.run(
            module.module_name,
            module.module_type,
            module.app_name,
            module.app_slug,
            module.description || null,
            module.documentation || null,
            module.parameters ? JSON.stringify(module.parameters) : null,
            module.examples ? JSON.stringify(module.examples) : null,
            module.category || null,
            module.popularity_score || 0,
            module.is_premium ? 1 : 0
        );

        return result.lastInsertRowid as number;
    }

    /**
     * Search modules using full-text search
     */
    searchModules(query: string, limit: number = 10): MakeModule[] {
        const stmt = this.db.prepare(`
            SELECT m.* 
            FROM make_modules m
            JOIN make_modules_fts fts ON m.id = fts.rowid
            WHERE make_modules_fts MATCH ?
            ORDER BY rank, m.popularity_score DESC
            LIMIT ?
        `);

        const rows = stmt.all(query, limit) as any[];
        return rows.map(this.rowToModule);
    }

    /**
     * Get module by name
     */
    getModuleByName(moduleName: string): MakeModule | null {
        const stmt = this.db.prepare(`
            SELECT * FROM make_modules WHERE module_name = ?
        `);
        
        const row = stmt.get(moduleName) as any;
        return row ? this.rowToModule(row) : null;
    }

    /**
     * Get modules by app name
     */
    getModulesByApp(appName: string): MakeModule[] {
        const stmt = this.db.prepare(`
            SELECT * FROM make_modules 
            WHERE app_name = ?
            ORDER BY module_type, module_name
        `);

        const rows = stmt.all(appName) as any[];
        return rows.map(this.rowToModule);
    }

    /**
     * Get modules by type
     */
    getModulesByType(moduleType: string): MakeModule[] {
        const stmt = this.db.prepare(`
            SELECT * FROM make_modules 
            WHERE module_type = ?
            ORDER BY popularity_score DESC, app_name
        `);

        const rows = stmt.all(moduleType) as any[];
        return rows.map(this.rowToModule);
    }

    /**
     * Get modules by category
     */
    getModulesByCategory(category: string, limit?: number): MakeModule[] {
        let query = `
            SELECT * FROM make_modules 
            WHERE category = ?
            ORDER BY popularity_score DESC, app_name
        `;
        
        if (limit) {
            query += ` LIMIT ${limit}`;
        }

        const stmt = this.db.prepare(query);
        const rows = stmt.all(category) as any[];
        return rows.map(this.rowToModule);
    }

    /**
     * Get all modules with pagination
     */
    getAllModules(offset: number = 0, limit: number = 100): MakeModule[] {
        const stmt = this.db.prepare(`
            SELECT * FROM make_modules
            ORDER BY popularity_score DESC, app_name, module_name
            LIMIT ? OFFSET ?
        `);

        const rows = stmt.all(limit, offset) as any[];
        return rows.map(this.rowToModule);
    }

    /**
     * Get module count
     */
    getModuleCount(): number {
        const stmt = this.db.prepare('SELECT COUNT(*) as count FROM make_modules');
        const result = stmt.get() as { count: number };
        return result.count;
    }

    /**
     * Insert template
     */
    insertTemplate(template: MakeTemplate): number {
        const stmt = this.db.prepare(`
            INSERT INTO make_templates (
                template_id, name, description, modules, flow,
                metadata, category, popularity_score
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
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

        return result.lastInsertRowid as number;
    }

    /**
     * Get template by ID
     */
    getTemplateById(templateId: string): MakeTemplate | null {
        const stmt = this.db.prepare(`
            SELECT * FROM make_templates WHERE template_id = ?
        `);

        const row = stmt.get(templateId) as any;
        return row ? this.rowToTemplate(row) : null;
    }

    /**
     * Get database statistics
     */
    getStats(): any {
        const moduleCount = this.db.prepare('SELECT COUNT(*) as count FROM make_modules').get() as { count: number };
        const templateCount = this.db.prepare('SELECT COUNT(*) as count FROM make_templates').get() as { count: number };
        const categoryCount = this.db.prepare('SELECT COUNT(DISTINCT category) as count FROM make_modules WHERE category IS NOT NULL').get() as { count: number };
        const appCount = this.db.prepare('SELECT COUNT(DISTINCT app_name) as count FROM make_modules').get() as { count: number };

        return {
            total_modules: moduleCount.count,
            total_templates: templateCount.count,
            total_categories: categoryCount.count,
            total_apps: appCount.count,
            database_size: this.getDatabaseSize()
        };
    }

    private getDatabaseSize(): string {
        try {
            const stats = fs.statSync(this.dbPath);
            const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
            return `${sizeInMB} MB`;
        } catch (error) {
            return 'Unknown';
        }
    }

    /**
     * Convert database row to MakeModule
     */
    private rowToModule(row: any): MakeModule {
        return {
            id: row.id,
            module_name: row.module_name,
            module_type: row.module_type,
            app_name: row.app_name,
            app_slug: row.app_slug,
            description: row.description,
            documentation: row.documentation,
            parameters: row.parameters ? JSON.parse(row.parameters) : [],
            examples: row.examples ? JSON.parse(row.examples) : [],
            category: row.category,
            popularity_score: row.popularity_score,
            is_premium: row.is_premium === 1
        };
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
            modules: row.modules ? JSON.parse(row.modules) : [],
            flow: row.flow ? JSON.parse(row.flow) : null,
            metadata: row.metadata ? JSON.parse(row.metadata) : null,
            category: row.category,
            popularity_score: row.popularity_score
        };
    }

    /**
     * Close database connection
     */
    close(): void {
        this.db.close();
    }
}

