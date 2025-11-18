/**
 * Make-MCP Server
 * Model Context Protocol server for Make.com
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { MAKE_TOOLS } from './tools-make.js';
import { ModuleRepository } from '../database/module-repository.js';
import { ModuleSearchService } from '../services/module-search.js';
import { MakeValidator } from '../services/make-validator.js';
import { ScenarioDiffEngine } from '../services/scenario-diff-engine.js';
import { MakeApiClient, createMakeApiClientFromEnv } from '../services/make-api-client.js';
import { ExpressionValidator } from '../services/expression-validator.js';
import { TemplateService } from '../templates/template-service.js';
import { Logger } from '../utils/logger.js';

export class MakeMCPServer {
    public server: Server; // Made public for HTTP transport
    private repository: ModuleRepository;
    private searchService: ModuleSearchService;
    private validator: MakeValidator;
    private diffEngine: ScenarioDiffEngine;
    private apiClient: MakeApiClient | null = null;
    private templateService: TemplateService | null = null;
    private logger: Logger;

    constructor() {
        this.repository = new ModuleRepository();
        this.searchService = new ModuleSearchService(this.repository);
        this.validator = new MakeValidator(this.repository);
        this.diffEngine = new ScenarioDiffEngine();
        this.logger = new Logger({ prefix: '[MakeMCPServer]' });
        
        // Initialize API client if environment variables are available
        this.apiClient = createMakeApiClientFromEnv();
        
        // Initialize template service - note: templates use separate repository
        // For now, template service is optional until template repository is configured
        this.templateService = null;

        this.server = new Server(
            {
                name: 'make-mcp',
                version: '1.0.0',
            },
            {
                capabilities: {
                    tools: {},
                },
            }
        );

        this.setupHandlers();
    }

    private setupHandlers(): void {
        // List available tools
        this.server.setRequestHandler(ListToolsRequestSchema, async () => {
            return {
                tools: MAKE_TOOLS,
            };
        });

        // Handle tool calls
        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            const { name, arguments: args } = request.params;

            try {
                const result = await this.handleToolCall(name, args || {});
                
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(result, null, 2),
                        },
                    ],
                };
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify({
                                error: errorMessage,
                                tool: name,
                                arguments: args
                            }, null, 2),
                        },
                    ],
                    isError: true,
                };
            }
        });
    }

    private async handleToolCall(name: string, args: any): Promise<any> {
        switch (name) {
            // Existing module/database tools
            case 'search_make_modules':
                return this.handleSearchModules(args);
            
            case 'get_module_essentials':
                return this.handleGetModuleEssentials(args);
            
            case 'validate_make_scenario':
                return this.handleValidateScenario(args);
            
            case 'autofix_make_scenario':
                return this.handleAutofixScenario(args);
            
            case 'list_make_templates':
                return this.handleListTemplates(args);
            
            case 'get_make_template':
                return this.handleGetTemplate(args);
            
            case 'get_modules_by_app':
                return this.handleGetModulesByApp(args);
            
            case 'get_database_statistics':
                return this.handleGetStatistics(args);
            
            case 'get_popular_modules':
                return this.handleGetPopularModules(args);
            
            case 'suggest_modules_for_intent':
                return this.handleSuggestModules(args);
            
            // Phase 6: Scenario Management Tools
            case 'make_create_scenario':
                return this.handleMakeCreateScenario(args);
            
            case 'make_update_partial_scenario':
                return this.handleMakeUpdatePartialScenario(args);
            
            case 'make_execute_scenario':
                return this.handleMakeExecuteScenario(args);
            
            case 'make_get_scenario':
                return this.handleMakeGetScenario(args);
            
            case 'make_list_scenarios':
                return this.handleMakeListScenarios(args);
            
            case 'make_delete_scenario':
                return this.handleMakeDeleteScenario(args);
            
            case 'make_clone_scenario':
                return this.handleMakeCloneScenario(args);
            
            case 'make_activate_scenario':
                return this.handleMakeActivateScenario(args);
            
            case 'make_deactivate_scenario':
                return this.handleMakeDeactivateScenario(args);
            
            // Phase 6: Template Management Tools
            case 'make_search_templates':
                return this.handleMakeSearchTemplates(args);
            
            case 'make_get_template_detail':
                return this.handleMakeGetTemplateDetail(args);
            
            case 'make_template_to_scenario':
                return this.handleMakeTemplateToScenario(args);
            
            // Documentation tool
            case 'tools_documentation':
                return this.handleToolsDocumentation(args);
            
            default:
                throw new Error(`Unknown tool: ${name}`);
        }
    }

    private async handleSearchModules(args: any): Promise<any> {
        const {
            query,
            limit = 10,
            category,
            module_type,
            include_examples = false
        } = args;

        const results = this.searchService.search({
            query,
            limit,
            category,
            module_type,
            include_examples
        });

        return {
            success: true,
            count: results.length,
            modules: results.map(module => ({
                name: module.module_name,
                type: module.module_type,
                app: module.app_name,
                description: module.description,
                category: module.category,
                parameters_count: module.parameters?.length || 0,
                has_examples: (module.examples?.length || 0) > 0
            }))
        };
    }

    private async handleGetModuleEssentials(args: any): Promise<any> {
        const { moduleName, includeExamples = true } = args;

        const essentials = this.searchService.getModuleEssentials(moduleName, includeExamples);

        return {
            success: true,
            module: essentials
        };
    }

    private async handleValidateScenario(args: any): Promise<any> {
        const { scenario, profile = 'balanced' } = args;

        const validation = this.validator.validateScenario(scenario, profile);

        return {
            success: true,
            validation: {
                valid: validation.valid,
                errors: validation.errors,
                warnings: validation.warnings,
                summary: {
                    total_errors: validation.errors.length,
                    total_warnings: validation.warnings.length
                }
            }
        };
    }

    private async handleAutofixScenario(args: any): Promise<any> {
        const { scenario, options } = args;

        // Use enhanced auto-fix with detailed reporting
        const result = await this.validator.autoFixScenarioEnhanced(scenario, options || {});

        return result;
    }

    private async handleListTemplates(args: any): Promise<any> {
        const { category, limit = 10 } = args;

        // For MVP, return empty list - templates will be added in Phase 2
        return {
            success: true,
            count: 0,
            templates: [],
            message: 'Template library coming soon in Phase 2'
        };
    }

    private async handleGetTemplate(args: any): Promise<any> {
        const { templateId, mode = 'full' } = args;

        const template = this.repository.getTemplateById(templateId);

        if (!template) {
            throw new Error(`Template '${templateId}' not found`);
        }

        return {
            success: true,
            template
        };
    }

    private async handleGetModulesByApp(args: any): Promise<any> {
        const { appName } = args;

        const modules = this.searchService.getModulesByApp(appName);

        return {
            success: true,
            app: appName,
            count: modules.length,
            modules: modules.map(m => ({
                name: m.module_name,
                type: m.module_type,
                description: m.description
            }))
        };
    }

    private async handleGetStatistics(args: any): Promise<any> {
        const stats = this.repository.getStats();

        return {
            success: true,
            statistics: stats
        };
    }

    private async handleGetPopularModules(args: any): Promise<any> {
        const { limit = 20 } = args;

        const modules = this.searchService.getPopularModules(limit);

        return {
            success: true,
            count: modules.length,
            modules: modules.map(m => ({
                name: m.module_name,
                type: m.module_type,
                app: m.app_name,
                category: m.category,
                popularity_score: m.popularity_score
            }))
        };
    }

    private async handleSuggestModules(args: any): Promise<any> {
        const { intent } = args;

        const suggestions = this.searchService.getSuggestedModules(intent);

        return {
            success: true,
            intent,
            count: suggestions.length,
            suggested_modules: suggestions.map(m => ({
                name: m.module_name,
                type: m.module_type,
                app: m.app_name,
                description: m.description,
                relevance_reason: `Matches intent keywords`
            }))
        };
    }

    // ============================================================
    // Phase 6: Scenario Management Handlers
    // ============================================================

    private getApiClient(): MakeApiClient {
        if (!this.apiClient) {
            throw new Error('Make.com API client not configured. Please set MAKE_API_URL and MAKE_API_TOKEN environment variables.');
        }
        return this.apiClient;
    }

    private async handleMakeCreateScenario(args: any): Promise<any> {
        const { scenario, teamId, folderId } = args;
        const client = this.getApiClient();

        this.logger.info('Creating scenario...', { teamId, folderId });

        const result = await client.createScenario(scenario, {
            teamId,
            folderId
        });

        return {
            success: true,
            message: 'Scenario created successfully',
            scenario: result
        };
    }

    private async handleMakeUpdatePartialScenario(args: any): Promise<any> {
        const { scenarioId, operations, continueOnError = false } = args;
        const client = this.getApiClient();

        this.logger.info('Updating scenario with diff operations...', { scenarioId, operationCount: operations.length });

        // Get current scenario
        const currentScenario = await client.getScenario(scenarioId);

        // Apply diff operations
        const diffResult = await this.diffEngine.applyDiff(currentScenario, {
            operations,
            continueOnError
        });

        if (!diffResult.success || !diffResult.scenario) {
            return {
                success: false,
                message: 'Failed to apply diff operations',
                errors: diffResult.errors,
                applied: diffResult.operationsApplied || 0,
                total: operations.length
            };
        }

        // Validate expressions in the updated scenario
        const exprValidation = ExpressionValidator.validateScenarioExpressions(
            diffResult.scenario
        );

        if (exprValidation.errors.length > 0) {
            this.logger.warn('Expression validation issues found', { errorCount: exprValidation.errors.length });
        }

        // Save updated scenario to Make.com
        const updated = await client.updateScenario(scenarioId, diffResult.scenario);

        return {
            success: true,
            message: 'Scenario updated successfully',
            scenario: updated,
            diff_summary: {
                operations_applied: diffResult.operationsApplied,
                operations_total: operations.length,
                errors: diffResult.errors || []
            },
            expression_validation: {
                errors: exprValidation.errors,
                warnings: exprValidation.warnings,
                statistics: exprValidation.statistics
            }
        };
    }

    private async handleMakeExecuteScenario(args: any): Promise<any> {
        const { scenarioId, data } = args;
        const client = this.getApiClient();

        this.logger.info('Executing scenario...', { scenarioId });

        const result = await client.executeScenario(scenarioId, data);

        return {
            success: true,
            message: 'Scenario execution initiated',
            execution: result
        };
    }

    private async handleMakeGetScenario(args: any): Promise<any> {
        const { scenarioId } = args;
        const client = this.getApiClient();

        this.logger.info('Fetching scenario...', { scenarioId });

        const scenario = await client.getScenario(scenarioId);

        // Optionally validate expressions
        const exprValidation = ExpressionValidator.validateScenarioExpressions(scenario);

        return {
            success: true,
            scenario,
            expression_validation: {
                error_count: exprValidation.errors.length,
                warning_count: exprValidation.warnings.length,
                errors: exprValidation.errors,
                warnings: exprValidation.warnings
            }
        };
    }

    private async handleMakeListScenarios(args: any): Promise<any> {
        const { teamId, folderId, limit } = args;
        const client = this.getApiClient();

        this.logger.info('Listing scenarios...', { teamId, folderId, limit });

        const result = await client.listScenarios({
            teamId,
            folderId,
            limit
        });

        return {
            success: true,
            count: result.scenarios.length,
            scenarios: result.scenarios.map(s => ({
                id: s.id,
                name: s.name,
                teamId: s.teamId,
                folderId: s.folderId,
                scheduling: s.scheduling,
                isLinked: s.isLinked
            }))
        };
    }

    private async handleMakeDeleteScenario(args: any): Promise<any> {
        const { scenarioId } = args;
        const client = this.getApiClient();

        this.logger.info('Deleting scenario...', { scenarioId });

        await client.deleteScenario(scenarioId);

        return {
            success: true,
            message: 'Scenario deleted successfully',
            scenarioId
        };
    }

    private async handleMakeCloneScenario(args: any): Promise<any> {
        const { scenarioId, newName } = args;
        const client = this.getApiClient();

        this.logger.info('Cloning scenario...', { scenarioId, newName });

        const cloned = await client.cloneScenario(scenarioId, newName);

        return {
            success: true,
            message: 'Scenario cloned successfully',
            original_scenario_id: scenarioId,
            new_scenario: cloned
        };
    }

    private async handleMakeActivateScenario(args: any): Promise<any> {
        const { scenarioId } = args;
        const client = this.getApiClient();

        this.logger.info('Activating scenario...', { scenarioId });

        await client.activateScenario(scenarioId);

        return {
            success: true,
            message: 'Scenario activated successfully',
            scenarioId
        };
    }

    private async handleMakeDeactivateScenario(args: any): Promise<any> {
        const { scenarioId } = args;
        const client = this.getApiClient();

        this.logger.info('Deactivating scenario...', { scenarioId });

        await client.deactivateScenario(scenarioId);

        return {
            success: true,
            message: 'Scenario deactivated successfully',
            scenarioId
        };
    }

    // ============================================================
    // Phase 6: Template Management Handlers
    // ============================================================

    private getTemplateService(): TemplateService {
        if (!this.templateService) {
            throw new Error('Template service not configured. Database connection may be unavailable.');
        }
        return this.templateService;
    }

    private async handleMakeSearchTemplates(args: any): Promise<any> {
        const { query, category, apps, limit = 20 } = args;
        const service = this.getTemplateService();

        this.logger.info('Searching templates...', { query, category, limit });

        const results = await service.searchTemplates({
            query,
            category,
            limit
        });

        return {
            success: true,
            count: results.length,
            templates: results.map(t => ({
                id: t.id,
                name: t.name,
                description: t.description,
                category: t.category,
                popularity_score: t.popularity_score
            }))
        };
    }

    private async handleMakeGetTemplateDetail(args: any): Promise<any> {
        const { templateId, mode = 'full' } = args;
        const service = this.getTemplateService();

        this.logger.info('Fetching template detail...', { templateId, mode });

        const template = await service.getTemplate(templateId, mode);

        if (!template) {
            throw new Error(`Template '${templateId}' not found`);
        }

        return {
            success: true,
            template
        };
    }

    private async handleMakeTemplateToScenario(args: any): Promise<any> {
        const { templateId, scenarioName } = args;
        const service = this.getTemplateService();

        this.logger.info('Converting template to scenario...', { templateId, scenarioName });

        const scenario = await service.templateToScenario(templateId, scenarioName);

        // Validate the converted scenario
        const validation = this.validator.validateScenario(scenario, 'balanced');

        return {
            success: true,
            message: 'Template converted to scenario successfully',
            scenario,
            validation: {
                valid: validation.valid,
                error_count: validation.errors.length,
                warning_count: validation.warnings.length
            }
        };
    }

    // ============================================================
    // Documentation Handler
    // ============================================================

    private async handleToolsDocumentation(args: any): Promise<any> {
        const { toolName } = args;

        if (toolName) {
            // Get documentation for specific tool
            const tool = MAKE_TOOLS.find(t => t.name === toolName);
            
            if (!tool) {
                throw new Error(`Tool '${toolName}' not found`);
            }

            return {
                success: true,
                tool: {
                    name: tool.name,
                    description: tool.description,
                    input_schema: tool.inputSchema,
                    examples: this.getToolExamples(tool.name)
                }
            };
        }

        // Return documentation for all tools
        return {
            success: true,
            overview: 'Make-MCP provides comprehensive tools for working with Make.com workflow automation',
            version: '1.0.0',
            categories: {
                'Module & Database Tools': MAKE_TOOLS.filter(t => 
                    ['search_make_modules', 'get_module_essentials', 'get_modules_by_app', 
                     'get_database_statistics', 'get_popular_modules', 'suggest_modules_for_intent'].includes(t.name)
                ).map(t => t.name),
                'Scenario Validation Tools': MAKE_TOOLS.filter(t => 
                    ['validate_make_scenario', 'autofix_make_scenario'].includes(t.name)
                ).map(t => t.name),
                'Scenario Management Tools': MAKE_TOOLS.filter(t => 
                    t.name.startsWith('make_') && !t.name.includes('template')
                ).map(t => t.name),
                'Template Tools': MAKE_TOOLS.filter(t => 
                    ['list_make_templates', 'get_make_template', 'make_search_templates', 
                     'make_get_template_detail', 'make_template_to_scenario'].includes(t.name)
                ).map(t => t.name)
            },
            total_tools: MAKE_TOOLS.length,
            tools: MAKE_TOOLS.map(t => ({
                name: t.name,
                description: t.description
            }))
        };
    }

    private getToolExamples(toolName: string): string[] {
        const examples: Record<string, string[]> = {
            make_create_scenario: [
                '{"scenario": {...}, "teamId": "123", "folderId": "456"}',
                '{"scenario": {"name": "My Workflow", "flow": [...]}}'
            ],
            make_update_partial_scenario: [
                '{"scenarioId": "123", "operations": [{"type": "updateName", "name": "New Name"}]}',
                '{"scenarioId": "123", "operations": [{"type": "addModule", "module": {...}}], "continueOnError": true}'
            ],
            make_execute_scenario: [
                '{"scenarioId": "123"}',
                '{"scenarioId": "123", "data": {"key": "value"}}'
            ],
            make_get_scenario: [
                '{"scenarioId": "123"}'
            ],
            make_list_scenarios: [
                '{"teamId": "123", "limit": 50}',
                '{"folderId": "456"}'
            ],
            make_search_templates: [
                '{"query": "slack notification", "limit": 10}',
                '{"category": "Communication", "apps": ["slack", "email"]}'
            ],
            make_template_to_scenario: [
                '{"templateId": "template-123", "scenarioName": "My Custom Workflow"}'
            ]
        };

        return examples[toolName] || [];
    }

    async run(): Promise<void> {
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
        
        console.error('Make-MCP server running on stdio');
    }

    async shutdown(): Promise<void> {
        this.repository.close();
        this.searchService.close();
        this.validator.close();
        await this.server.close();
    }
}

