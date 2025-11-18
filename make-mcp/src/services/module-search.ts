/**
 * Module Search Service
 * Provides search and filtering capabilities for Make modules
 */

import { MakeModule, SearchOptions } from '../types';
import { ModuleRepository } from '../database/module-repository';

export class ModuleSearchService {
    private repository: ModuleRepository;

    constructor(repository?: ModuleRepository) {
        this.repository = repository || new ModuleRepository();
    }

    /**
     * Search modules with full-text search
     */
    search(options: SearchOptions): MakeModule[] {
        const { query, limit = 10, category, module_type } = options;

        // Use full-text search if query provided
        if (query && query.trim()) {
            let results = this.repository.searchModules(query, limit * 2); // Get more for filtering

            // Apply additional filters
            if (category) {
                results = results.filter(m => m.category === category);
            }

            if (module_type) {
                results = results.filter(m => m.module_type === module_type);
            }

            // Apply limit
            return results.slice(0, limit);
        }

        // No query, use filters
        if (category) {
            return this.repository.getModulesByCategory(category, limit);
        }

        if (module_type) {
            return this.repository.getModulesByType(module_type).slice(0, limit);
        }

        // Return all with pagination
        return this.repository.getAllModules(0, limit);
    }

    /**
     * Get module essentials - detailed information about a specific module
     */
    getModuleEssentials(moduleName: string, includeExamples: boolean = false): any {
        const module = this.repository.getModuleByName(moduleName);

        if (!module) {
            throw new Error(`Module '${moduleName}' not found`);
        }

        const essentials: any = {
            name: module.module_name,
            type: module.module_type,
            app: module.app_name,
            description: module.description,
            documentation: module.documentation,
            parameters: module.parameters || [],
            category: module.category,
            is_premium: module.is_premium
        };

        if (includeExamples && module.examples && module.examples.length > 0) {
            essentials.examples = module.examples;
        }

        // Calculate completeness score
        essentials.completeness_score = this.calculateCompletenessScore(module);

        return essentials;
    }

    /**
     * Get modules by app name
     */
    getModulesByApp(appName: string): MakeModule[] {
        return this.repository.getModulesByApp(appName);
    }

    /**
     * Get popular modules
     */
    getPopularModules(limit: number = 20): MakeModule[] {
        return this.repository.getAllModules(0, limit);
    }

    /**
     * Get all categories
     */
    getCategories(): string[] {
        const modules = this.repository.getAllModules(0, 1000);
        const categories = new Set<string>();
        
        modules.forEach(module => {
            if (module.category) {
                categories.add(module.category);
            }
        });

        return Array.from(categories).sort();
    }

    /**
     * Get suggested modules based on query intent
     */
    getSuggestedModules(intent: string): MakeModule[] {
        // Extract keywords from intent
        const keywords = this.extractKeywords(intent);
        
        // Search for each keyword and combine results
        const results = new Map<string, MakeModule>();
        
        for (const keyword of keywords) {
            const modules = this.repository.searchModules(keyword, 5);
            modules.forEach(module => {
                if (!results.has(module.module_name)) {
                    results.set(module.module_name, module);
                }
            });
        }

        return Array.from(results.values()).slice(0, 10);
    }

    /**
     * Calculate completeness score for a module
     */
    private calculateCompletenessScore(module: MakeModule): number {
        let score = 0;
        let maxScore = 5;

        // Check for description
        if (module.description && module.description.length > 20) score++;

        // Check for documentation
        if (module.documentation && module.documentation.length > 50) score++;

        // Check for parameters
        if (module.parameters && module.parameters.length > 0) score++;

        // Check for examples
        if (module.examples && module.examples.length > 0) score++;

        // Check for category
        if (module.category) score++;

        return Math.round((score / maxScore) * 100);
    }

    /**
     * Extract keywords from intent
     */
    private extractKeywords(intent: string): string[] {
        // Simple keyword extraction
        const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
        
        const words = intent
            .toLowerCase()
            .replace(/[^\w\s]/g, '')
            .split(/\s+/)
            .filter(word => word.length > 2 && !stopWords.includes(word));

        return [...new Set(words)];
    }

    /**
     * Close repository connection
     */
    close(): void {
        this.repository.close();
    }
}

