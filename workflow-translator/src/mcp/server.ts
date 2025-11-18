/**
 * Workflow Translator MCP Server
 * Model Context Protocol server for workflow translation
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { TRANSLATOR_TOOLS } from './tools-translator.js';
import { TranslationEngine } from '../services/translation-engine.js';
import { AITranslationService } from '../services/ai-service.js';
import { FeasibilityChecker } from '../services/feasibility-checker.js';
import { PlatformOptimizer } from '../optimizers/platform-optimizer.js';
import { Platform } from '../types/index.js';

export class WorkflowTranslatorServer {
    private server: Server;
    private translationEngine: TranslationEngine;
    private aiService: AITranslationService | null;
    private feasibilityChecker: FeasibilityChecker;
    private optimizer: PlatformOptimizer;

    constructor() {
        this.translationEngine = new TranslationEngine();
        this.feasibilityChecker = new FeasibilityChecker();
        this.optimizer = new PlatformOptimizer();

        // AI service is optional (requires API key)
        try {
            this.aiService = new AITranslationService();
        } catch (error) {
            console.error('AI service not available (ANTHROPIC_API_KEY missing)');
            this.aiService = null;
        }

        this.server = new Server(
            {
                name: 'workflow-translator',
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
                tools: TRANSLATOR_TOOLS,
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
            case 'translate_workflow':
                return this.handleTranslateWorkflow(args);
            
            case 'check_translation_feasibility':
                return this.handleCheckFeasibility(args);
            
            case 'get_platform_capabilities':
                return this.handleGetCapabilities(args);
            
            case 'get_translation_complexity':
                return this.handleGetComplexity(args);
            
            case 'suggest_best_platform':
                return this.handleSuggestPlatform(args);
            
            case 'translate_expression':
                return this.handleTranslateExpression(args);
            
            case 'analyze_workflow_complexity':
                return this.handleAnalyzeComplexity(args);
            
            case 'batch_translate_workflows':
                return this.handleBatchTranslate(args);
            
            default:
                throw new Error(`Unknown tool: ${name}`);
        }
    }

    private async handleTranslateWorkflow(args: any): Promise<any> {
        const {
            workflow,
            sourcePlatform,
            targetPlatform,
            optimize = true,
            preserveNames = false,
            strictMode = false
        } = args;

        const result = await this.translationEngine.translate({
            workflow,
            sourcePlatform: sourcePlatform as Platform,
            targetPlatform: targetPlatform as Platform,
            options: { optimize, preserveNames, strictMode }
        });

        return {
            success: result.success,
            translated_workflow: result.workflow,
            source_platform: result.sourcePlatform,
            target_platform: result.targetPlatform,
            warnings: result.warnings,
            errors: result.errors,
            metadata: result.metadata
        };
    }

    private async handleCheckFeasibility(args: any): Promise<any> {
        const { workflow, sourcePlatform, targetPlatform } = args;

        const feasibility = this.feasibilityChecker.checkFeasibility(
            workflow,
            sourcePlatform as Platform,
            targetPlatform as Platform
        );

        return {
            success: true,
            feasibility: {
                ...feasibility,
                translation_path: `${sourcePlatform} → ${targetPlatform}`
            }
        };
    }

    private async handleGetCapabilities(args: any): Promise<any> {
        const { platforms = ['n8n', 'make', 'zapier'] } = args;

        const capabilities: any = {};
        
        platforms.forEach((platform: string) => {
            capabilities[platform] = this.feasibilityChecker['platformCapabilities'][platform];
        });

        return {
            success: true,
            platforms: platforms,
            capabilities
        };
    }

    private async handleGetComplexity(args: any): Promise<any> {
        const { sourcePlatform, targetPlatform } = args;

        const complexity = this.feasibilityChecker.getTranslationComplexity(
            sourcePlatform as Platform,
            targetPlatform as Platform
        );

        return {
            success: true,
            translation_path: `${sourcePlatform} → ${targetPlatform}`,
            ...complexity
        };
    }

    private async handleSuggestPlatform(args: any): Promise<any> {
        const { requirements } = args;

        let scores = {
            n8n: 0,
            make: 0,
            zapier: 0
        };

        // Score based on requirements
        if (requirements.needs_custom_code) {
            scores.n8n += 30;
            scores.make += 20;
            scores.zapier += 0;
        }

        if (requirements.needs_loops) {
            scores.n8n += 25;
            scores.make += 25;
            scores.zapier += 0;
        }

        if (requirements.needs_complex_logic) {
            scores.n8n += 25;
            scores.make += 25;
            scores.zapier += 5;
        }

        if (requirements.self_hosting_preferred) {
            scores.n8n += 30;
            scores.make += 0;
            scores.zapier += 0;
        }

        if (requirements.team_technical_level === 'beginner') {
            scores.zapier += 30;
            scores.make += 15;
            scores.n8n += 5;
        } else if (requirements.team_technical_level === 'advanced') {
            scores.n8n += 20;
            scores.make += 15;
            scores.zapier += 5;
        }

        if (requirements.budget_level === 'low') {
            scores.n8n += 25;
            scores.make += 10;
            scores.zapier += 5;
        }

        // Find best platform
        const sorted = Object.entries(scores)
            .sort(([, a], [, b]) => b - a)
            .map(([platform, score]) => ({ platform, score }));

        return {
            success: true,
            recommended_platform: sorted[0].platform,
            scores: sorted,
            reasoning: this.generatePlatformRecommendationReasoning(requirements, sorted[0].platform)
        };
    }

    private async handleTranslateExpression(args: any): Promise<any> {
        const { expression, sourcePlatform, targetPlatform, context } = args;

        if (!this.aiService) {
            throw new Error('AI service not available for expression translation');
        }

        const translated = await this.aiService.translateExpression(
            expression,
            sourcePlatform as Platform,
            targetPlatform as Platform,
            context
        );

        return {
            success: true,
            original_expression: expression,
            translated_expression: translated,
            source_platform: sourcePlatform,
            target_platform: targetPlatform
        };
    }

    private async handleAnalyzeComplexity(args: any): Promise<any> {
        const { workflow, platform } = args;

        if (!this.aiService) {
            // Provide basic analysis without AI
            return {
                success: true,
                complexity_score: 50,
                suggestions: ['AI analysis not available'],
                potential_issues: [],
                note: 'Install ANTHROPIC_API_KEY for detailed analysis'
            };
        }

        const analysis = await this.aiService.analyzeWorkflow(workflow, platform as Platform);

        return {
            success: true,
            ...analysis,
            platform
        };
    }

    private async handleBatchTranslate(args: any): Promise<any> {
        const { workflows, sourcePlatform, targetPlatform, optimize = true } = args;

        const results = [];
        
        for (let i = 0; i < workflows.length; i++) {
            try {
                const result = await this.translationEngine.translate({
                    workflow: workflows[i],
                    sourcePlatform: sourcePlatform as Platform,
                    targetPlatform: targetPlatform as Platform,
                    options: { optimize }
                });

                results.push({
                    index: i,
                    success: result.success,
                    workflow: result.workflow,
                    metadata: result.metadata
                });
            } catch (error) {
                results.push({
                    index: i,
                    success: false,
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        }

        const successCount = results.filter(r => r.success).length;

        return {
            success: true,
            total: workflows.length,
            successful: successCount,
            failed: workflows.length - successCount,
            results
        };
    }

    private generatePlatformRecommendationReasoning(requirements: any, platform: string): string {
        const reasons: string[] = [];

        if (platform === 'n8n') {
            if (requirements.needs_custom_code) reasons.push('Full JavaScript/Python code support');
            if (requirements.needs_loops) reasons.push('Advanced loop and batch processing');
            if (requirements.self_hosting_preferred) reasons.push('Complete self-hosting control');
            if (requirements.budget_level === 'low') reasons.push('Open source with no usage fees');
        } else if (platform === 'make') {
            if (requirements.needs_complex_logic) reasons.push('Powerful routers and conditional logic');
            if (requirements.needs_loops) reasons.push('Built-in iterators and aggregators');
            reasons.push('Visual debugging and execution tracking');
        } else if (platform === 'zapier') {
            if (requirements.team_technical_level === 'beginner') reasons.push('Easiest to use interface');
            reasons.push('Largest app ecosystem (5000+ integrations)');
            reasons.push('Most reliable for simple workflows');
        }

        return reasons.join('. ') || 'Best overall match for your requirements';
    }

    async run(): Promise<void> {
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
        
        console.error('Workflow Translator MCP server running on stdio');
    }

    async shutdown(): Promise<void> {
        await this.server.close();
    }
}

