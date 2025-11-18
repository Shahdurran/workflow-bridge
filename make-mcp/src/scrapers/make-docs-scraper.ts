/**
 * Make.com Documentation Scraper
 * Scrapes module information from Make.com's help documentation
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';
import { MakeModule, ModuleParameter } from '../types';
import { ModuleRepository } from '../database/module-repository';

interface PriorityApp {
    app_name: string;
    app_slug: string;
    category: string;
    popularity_score: number;
    modules: string[];
}

export class MakeDocsScraper {
    private repository: ModuleRepository;
    private baseUrl = 'https://www.make.com/en/help';
    private rateLimit = 2000; // 2 seconds between requests

    constructor(repository?: ModuleRepository) {
        this.repository = repository || new ModuleRepository();
    }

    /**
     * Scrape all priority modules from priority-modules.json
     */
    async scrapePriorityModules(): Promise<void> {
        const priorityFilePath = path.join(__dirname, '../../data/priority-modules.json');
        const priorityData = JSON.parse(fs.readFileSync(priorityFilePath, 'utf-8'));
        
        console.log(`Starting scrape of ${priorityData.priority_apps.length} apps...`);
        
        let totalModules = 0;
        
        for (const app of priorityData.priority_apps) {
            console.log(`\nScraping ${app.app_name}...`);
            
            try {
                const modules = await this.scrapeApp(app);
                totalModules += modules.length;
                console.log(`  ✓ Scraped ${modules.length} modules`);
            } catch (error) {
                console.error(`  ✗ Failed to scrape ${app.app_name}:`, error);
            }
            
            // Rate limiting
            await this.sleep(this.rateLimit);
        }
        
        console.log(`\n✅ Scraping complete! Total modules: ${totalModules}`);
        console.log(this.repository.getStats());
    }

    /**
     * Scrape all modules for a specific app
     */
    async scrapeApp(app: PriorityApp): Promise<MakeModule[]> {
        const modules: MakeModule[] = [];
        
        for (const moduleName of app.modules) {
            try {
                const module = await this.scrapeModule(
                    app.app_slug,
                    app.app_name,
                    moduleName,
                    app.category,
                    app.popularity_score
                );
                
                if (module) {
                    const moduleId = this.repository.upsertModule(module);
                    modules.push({ ...module, id: moduleId });
                }
            } catch (error) {
                console.error(`    Failed to scrape ${moduleName}:`, error);
            }
        }
        
        return modules;
    }

    /**
     * Scrape a single module
     * This is a simplified scraper - in production, you'd parse real Make.com docs
     */
    async scrapeModule(
        appSlug: string,
        appName: string,
        moduleName: string,
        category: string,
        popularityScore: number
    ): Promise<MakeModule | null> {
        // For MVP, we'll create synthetic data based on common patterns
        // In production, you would:
        // 1. Fetch from https://www.make.com/en/help/app/${appSlug}
        // 2. Parse HTML with cheerio
        // 3. Extract module details, parameters, examples
        
        const moduleType = this.inferModuleType(moduleName);
        const parameters = this.generateSyntheticParameters(moduleName, moduleType);
        
        const module: MakeModule = {
            module_name: `${appSlug}:${this.slugify(moduleName)}`,
            module_type: moduleType,
            app_name: appName,
            app_slug: appSlug,
            description: `${moduleName} in ${appName}`,
            documentation: this.generateSyntheticDocumentation(appName, moduleName),
            parameters,
            examples: this.generateSyntheticExamples(moduleName, parameters),
            category,
            popularity_score: popularityScore,
            is_premium: false
        };
        
        return module;
    }

    /**
     * Fetch and parse actual Make.com documentation (real implementation)
     * This would be used in production instead of synthetic data
     */
    private async fetchModuleDocs(appSlug: string, moduleSlug: string): Promise<string> {
        try {
            const url = `${this.baseUrl}/app/${appSlug}/${moduleSlug}`;
            const response = await axios.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (compatible; MakeMCP/1.0)'
                },
                timeout: 10000
            });
            
            return response.data;
        } catch (error) {
            console.error(`Failed to fetch ${appSlug}/${moduleSlug}`);
            throw error;
        }
    }

    /**
     * Parse HTML documentation (real implementation)
     */
    private parseDocumentation(html: string): { description: string; parameters: ModuleParameter[] } {
        const $ = cheerio.load(html);
        
        // This would extract real data from Make's documentation
        // Example selectors (adjust based on actual Make.com HTML structure):
        const description = $('.module-description').text().trim();
        
        const parameters: ModuleParameter[] = [];
        $('.parameter-row').each((_, element) => {
            const $el = $(element);
            parameters.push({
                parameter_name: $el.find('.param-name').text().trim(),
                parameter_type: $el.find('.param-type').text().trim(),
                is_required: $el.find('.param-required').length > 0,
                description: $el.find('.param-description').text().trim()
            });
        });
        
        return { description, parameters };
    }

    /**
     * Infer module type from name
     */
    private inferModuleType(moduleName: string): MakeModule['module_type'] {
        const lowerName = moduleName.toLowerCase();
        
        if (lowerName.includes('watch') || lowerName.includes('trigger')) {
            return 'trigger';
        } else if (lowerName.includes('search')) {
            return 'search';
        } else if (lowerName.includes('router')) {
            return 'router';
        } else if (lowerName.includes('aggregator')) {
            return 'aggregator';
        } else {
            return 'action';
        }
    }

    /**
     * Generate synthetic parameters for testing
     */
    private generateSyntheticParameters(moduleName: string, moduleType: string): ModuleParameter[] {
        const baseParams: ModuleParameter[] = [];
        
        // Common parameters based on module type
        if (moduleType === 'trigger') {
            baseParams.push({
                parameter_name: 'limit',
                parameter_type: 'number',
                is_required: false,
                description: 'Maximum number of items to return',
                default_value: '10'
            });
        }
        
        // Add app-specific parameters
        if (moduleName.toLowerCase().includes('email') || moduleName.toLowerCase().includes('message')) {
            baseParams.push(
                {
                    parameter_name: 'to',
                    parameter_type: 'text',
                    is_required: true,
                    description: 'Recipient email or identifier'
                },
                {
                    parameter_name: 'subject',
                    parameter_type: 'text',
                    is_required: true,
                    description: 'Message subject'
                },
                {
                    parameter_name: 'body',
                    parameter_type: 'text',
                    is_required: true,
                    description: 'Message body content'
                }
            );
        } else if (moduleName.toLowerCase().includes('row') || moduleName.toLowerCase().includes('record')) {
            baseParams.push(
                {
                    parameter_name: 'spreadsheet_id',
                    parameter_type: 'text',
                    is_required: true,
                    description: 'ID of the spreadsheet or table'
                },
                {
                    parameter_name: 'values',
                    parameter_type: 'array',
                    is_required: true,
                    description: 'Values to insert or update'
                }
            );
        }
        
        return baseParams;
    }

    /**
     * Generate synthetic documentation
     */
    private generateSyntheticDocumentation(appName: string, moduleName: string): string {
        return `
# ${moduleName}

## Description
This module allows you to ${moduleName.toLowerCase()} in ${appName}.

## Use Cases
- Automate ${moduleName.toLowerCase()} workflows
- Integrate ${appName} with other services
- Build custom automation scenarios

## Connection Requirements
You need to connect your ${appName} account to use this module.

## Rate Limits
Follows standard ${appName} API rate limits.

## Notes
- Ensure you have the necessary permissions
- Test in a development environment first
        `.trim();
    }

    /**
     * Generate synthetic examples
     */
    private generateSyntheticExamples(moduleName: string, parameters: ModuleParameter[]): any[] {
        const example: any = {
            description: `Example: ${moduleName}`,
            parameters: {}
        };
        
        parameters.forEach(param => {
            if (param.is_required) {
                example.parameters[param.parameter_name] = param.default_value || `example_${param.parameter_name}`;
            }
        });
        
        return [example];
    }

    /**
     * Slugify string
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
     * Sleep helper for rate limiting
     */
    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Close repository connection
     */
    close(): void {
        this.repository.close();
    }
}

// CLI execution
if (require.main === module) {
    const scraper = new MakeDocsScraper();
    
    scraper.scrapePriorityModules()
        .then(() => {
            console.log('\n✅ Scraping completed successfully');
            scraper.close();
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n❌ Scraping failed:', error);
            scraper.close();
            process.exit(1);
        });
}

