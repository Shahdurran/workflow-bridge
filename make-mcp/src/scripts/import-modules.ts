#!/usr/bin/env node
/**
 * Import Modules Script
 * 
 * Reads modules from data/modules-input.json and imports them into the database.
 * 
 * Usage:
 *   npm run import-modules
 *   
 * Or with custom file:
 *   node dist/scripts/import-modules.js path/to/your-modules.json
 */

import fs from 'fs';
import path from 'path';
import { ModuleRepository } from '../database/module-repository';

interface ModuleParameter {
    name: string;
    type: string;
    required: boolean;
    description?: string;
    options?: string[];
    default_value?: any;
}

interface ModuleInput {
    id: string;
    name: string;
    app: string;
    type: 'trigger' | 'action' | 'search' | 'router' | 'aggregator' | 'transformer' | 'iterator' | 'repeater';
    description: string;
    category: string;
    parameters: ModuleParameter[];
    icon_url?: string;
    documentation_url?: string;
    is_premium?: boolean;
}

interface ModulesInput {
    modules: ModuleInput[];
}

class ModuleImporter {
    private repository: ModuleRepository;
    private stats = {
        total: 0,
        imported: 0,
        updated: 0,
        failed: 0,
        errors: [] as string[]
    };

    constructor() {
        this.repository = new ModuleRepository();
    }

    /**
     * Import modules from JSON file
     */
    async importFromFile(filePath: string): Promise<void> {
        console.log(`\n🔄 Starting module import from: ${filePath}\n`);

        // Read and parse file
        let data: ModulesInput;
        try {
            const fileContent = fs.readFileSync(filePath, 'utf-8');
            data = JSON.parse(fileContent);
        } catch (error) {
            console.error('❌ Failed to read or parse file:', error);
            throw error;
        }

        if (!data.modules || !Array.isArray(data.modules)) {
            throw new Error('Invalid format: expected { modules: [...] }');
        }

        this.stats.total = data.modules.length;
        console.log(`📊 Found ${this.stats.total} modules to import\n`);

        // Import each module
        for (let i = 0; i < data.modules.length; i++) {
            const module = data.modules[i];
            console.log(`[${i + 1}/${this.stats.total}] Processing: ${module.name} (${module.id})`);

            try {
                await this.importModule(module);
                this.stats.imported++;
                console.log(`  ✅ Imported successfully\n`);
            } catch (error) {
                this.stats.failed++;
                const errorMsg = `Failed to import ${module.id}: ${error}`;
                this.stats.errors.push(errorMsg);
                console.error(`  ❌ ${errorMsg}\n`);
            }
        }

        // Print summary
        this.printSummary();
    }

    /**
     * Import a single module
     */
    private async importModule(moduleInput: ModuleInput): Promise<void> {
        // Validate required fields
        this.validateModule(moduleInput);

        // Check if module already exists
        const existingModule = this.repository.getModuleByName(moduleInput.id);
        const isUpdate = !!existingModule;

        // Insert or update module
        const moduleId = this.repository.upsertModule({
            module_name: moduleInput.id,
            module_type: moduleInput.type,
            app_name: moduleInput.app,
            app_slug: this.slugify(moduleInput.app),
            description: moduleInput.description,
            documentation: this.generateDocumentation(moduleInput),
            parameters: this.convertParameters(moduleInput.parameters),
            examples: this.generateExamples(moduleInput),
            category: moduleInput.category,
            popularity_score: this.calculatePopularityScore(moduleInput),
            is_premium: moduleInput.is_premium || false
        });

        if (isUpdate) {
            this.stats.updated++;
            console.log(`  ℹ️  Updated existing module`);
        }

        console.log(`  📝 Imported ${moduleInput.parameters.length} parameters`);
    }

    /**
     * Validate module input
     */
    private validateModule(module: ModuleInput): void {
        if (!module.id) throw new Error('Module ID is required');
        if (!module.name) throw new Error('Module name is required');
        if (!module.app) throw new Error('Module app is required');
        if (!module.type) throw new Error('Module type is required');
        if (!['trigger', 'action', 'search', 'router', 'aggregator', 'transformer', 'iterator', 'repeater'].includes(module.type)) {
            throw new Error(`Invalid module type: ${module.type}`);
        }
        if (!module.parameters) {
            module.parameters = [];
        }
        if (!Array.isArray(module.parameters)) {
            throw new Error('Parameters must be an array');
        }
    }

    /**
     * Convert parameters to repository format
     */
    private convertParameters(params: ModuleParameter[]): any[] {
        return params.map(param => ({
            name: param.name,
            type: param.type,
            required: param.required,
            description: param.description || '',
            default_value: param.default_value,
            options: param.options
        }));
    }

    /**
     * Generate documentation
     */
    private generateDocumentation(module: ModuleInput): string {
        const paramDocs = module.parameters
            .map(p => {
                const required = p.required ? '(required)' : '(optional)';
                const options = p.options ? ` Options: ${p.options.join(', ')}` : '';
                return `- **${p.name}** ${required}: ${p.description || 'No description'}${options}`;
            })
            .join('\n');

        return `
# ${module.name}

${module.description}

## App
${module.app}

## Type
${module.type}

## Parameters
${paramDocs || 'No parameters'}

## Category
${module.category}
        `.trim();
    }

    /**
     * Generate example configurations
     */
    private generateExamples(module: ModuleInput): any[] {
        const exampleParams: any = {};
        
        module.parameters.forEach(param => {
            if (param.required) {
                exampleParams[param.name] = param.default_value || this.getExampleValue(param);
            }
        });

        return [{
            description: `Example: ${module.name}`,
            parameters: exampleParams
        }];
    }

    /**
     * Get example value for parameter type
     */
    private getExampleValue(param: ModuleParameter): any {
        if (param.options && param.options.length > 0) {
            return param.options[0];
        }
        
        switch (param.type) {
            case 'text':
                return `example_${param.name}`;
            case 'number':
                return 1;
            case 'boolean':
                return true;
            case 'array':
                return [];
            case 'object':
                return {};
            case 'select':
                return param.options?.[0] || 'option1';
            default:
                return `example_${param.name}`;
        }
    }

    /**
     * Calculate popularity score based on heuristics
     */
    private calculatePopularityScore(module: ModuleInput): number {
        let score = 50; // Base score

        // Core modules get higher scores
        if (['HTTP', 'Webhooks', 'Tools'].includes(module.app)) {
            score += 30;
        }

        // Popular apps get bonus
        const popularApps = ['Google Sheets', 'Gmail', 'Slack', 'Airtable', 'Notion'];
        if (popularApps.includes(module.app)) {
            score += 20;
        }

        // Triggers are often more important than actions
        if (module.type === 'trigger') {
            score += 10;
        }

        return Math.min(100, score);
    }

    /**
     * Convert string to slug
     */
    private slugify(text: string): string {
        return text
            .toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim();
    }

    /**
     * Print import summary
     */
    private printSummary(): void {
        console.log('\n' + '='.repeat(60));
        console.log('📊 IMPORT SUMMARY');
        console.log('='.repeat(60));
        console.log(`Total modules:     ${this.stats.total}`);
        console.log(`✅ Imported:       ${this.stats.imported}`);
        console.log(`🔄 Updated:        ${this.stats.updated}`);
        console.log(`❌ Failed:         ${this.stats.failed}`);
        console.log('='.repeat(60));

        if (this.stats.errors.length > 0) {
            console.log('\n❌ ERRORS:');
            this.stats.errors.forEach(error => console.log(`  - ${error}`));
        }

        console.log('\n✨ Import complete!\n');

        // Print database statistics
        const dbStats = this.repository.getStats();
        console.log('📈 DATABASE STATISTICS:');
        console.log(`  Total modules:   ${dbStats.total_modules}`);
        console.log(`  Total apps:      ${dbStats.total_apps}`);
        console.log(`  Total params:    ${dbStats.total_parameters}`);
        console.log(`  Categories:      ${dbStats.categories.join(', ')}`);
        console.log();
    }

    /**
     * Close repository
     */
    close(): void {
        this.repository.close();
    }
}

// CLI execution
async function main() {
    const args = process.argv.slice(2);
    const inputFile = args[0] || path.join(__dirname, '../../data/modules-input.json');

    // Check if file exists
    if (!fs.existsSync(inputFile)) {
        console.error(`❌ File not found: ${inputFile}`);
        console.error('\nUsage: npm run import-modules [path/to/modules.json]');
        console.error('\nExpected JSON format:');
        console.error(JSON.stringify({
            modules: [
                {
                    id: "app:ModuleName",
                    name: "Module Name",
                    app: "App Name",
                    type: "action",
                    description: "What this module does",
                    category: "Category Name",
                    parameters: [
                        {
                            name: "param1",
                            type: "text",
                            required: true,
                            description: "Parameter description"
                        }
                    ]
                }
            ]
        }, null, 2));
        process.exit(1);
    }

    const importer = new ModuleImporter();

    try {
        await importer.importFromFile(inputFile);
        importer.close();
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Import failed:', error);
        importer.close();
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

export { ModuleImporter };
