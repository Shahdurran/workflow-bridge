/**
 * Translation Engine
 * Core logic for translating workflows between platforms
 */

import {
    Platform,
    TranslationRequest,
    TranslationResult,
    TranslationWarning,
    TranslationError,
    TranslationContext,
    N8nWorkflow,
    MakeScenario,
    ZapierZap
} from '../types';
import fs from 'fs';
import path from 'path';

export class TranslationEngine {
    private mappingRules: any;
    private platformCapabilities: any;

    constructor() {
        // Load mapping rules and capabilities
        const mappingPath = path.join(__dirname, '../../data/mapping-rules.json');
        const capabilitiesPath = path.join(__dirname, '../../data/platform-capabilities.json');
        
        this.mappingRules = JSON.parse(fs.readFileSync(mappingPath, 'utf-8'));
        this.platformCapabilities = JSON.parse(fs.readFileSync(capabilitiesPath, 'utf-8'));
    }

    /**
     * Main translation method
     */
    async translate(request: TranslationRequest): Promise<TranslationResult> {
        const startTime = Date.now();
        const { workflow, sourcePlatform, targetPlatform, options = {} } = request;

        // Validate platforms
        if (sourcePlatform === targetPlatform) {
            throw new Error('Source and target platforms must be different');
        }

        const warnings: TranslationWarning[] = [];
        const errors: TranslationError[] = [];

        try {
            // Create translation context
            const context: TranslationContext = {
                sourcePlatform,
                targetPlatform,
                availableNodes: [],
                mappingRules: this.mappingRules,
                capabilities: this.platformCapabilities
            };

            // Parse source workflow
            const parsedWorkflow = this.parseSourceWorkflow(workflow, sourcePlatform);

            // Translate based on platform combination
            let translatedWorkflow: any;
            
            if (sourcePlatform === 'n8n' && targetPlatform === 'make') {
                translatedWorkflow = await this.translateN8nToMake(parsedWorkflow, context, options);
            } else if (sourcePlatform === 'n8n' && targetPlatform === 'zapier') {
                translatedWorkflow = await this.translateN8nToZapier(parsedWorkflow, context, options);
            } else if (sourcePlatform === 'make' && targetPlatform === 'n8n') {
                translatedWorkflow = await this.translateMakeToN8n(parsedWorkflow, context, options);
            } else if (sourcePlatform === 'make' && targetPlatform === 'zapier') {
                translatedWorkflow = await this.translateMakeToZapier(parsedWorkflow, context, options);
            } else if (sourcePlatform === 'zapier' && targetPlatform === 'n8n') {
                translatedWorkflow = await this.translateZapierToN8n(parsedWorkflow, context, options);
            } else if (sourcePlatform === 'zapier' && targetPlatform === 'make') {
                translatedWorkflow = await this.translateZapierToMake(parsedWorkflow, context, options);
            } else {
                throw new Error(`Unsupported translation: ${sourcePlatform} to ${targetPlatform}`);
            }

            // Apply optimizations if requested
            if (options.optimize) {
                translatedWorkflow = this.optimizeForPlatform(translatedWorkflow, targetPlatform);
            }

            // Calculate metadata
            const translationTime = Date.now() - startTime;

            return {
                success: true,
                workflow: translatedWorkflow,
                sourcePlatform,
                targetPlatform,
                warnings,
                errors,
                metadata: {
                    translated_nodes: this.countNodes(translatedWorkflow, targetPlatform),
                    skipped_nodes: 0,
                    optimizations_applied: options.optimize ? ['platform_specific'] : [],
                    accuracy_score: this.calculateAccuracyScore(warnings, errors),
                    feasibility_score: this.calculateFeasibilityScore(sourcePlatform, targetPlatform),
                    translation_time_ms: translationTime
                }
            };

        } catch (error) {
            errors.push({
                code: 'TRANSLATION_FAILED',
                message: error instanceof Error ? error.message : 'Unknown error',
                severity: 'critical'
            });

            return {
                success: false,
                workflow: null,
                sourcePlatform,
                targetPlatform,
                warnings,
                errors,
                metadata: {
                    translated_nodes: 0,
                    skipped_nodes: 0,
                    optimizations_applied: [],
                    accuracy_score: 0,
                    feasibility_score: 0,
                    translation_time_ms: Date.now() - startTime
                }
            };
        }
    }

    /**
     * Parse source workflow into standardized format
     */
    private parseSourceWorkflow(workflow: any, platform: Platform): any {
        // Validate basic structure
        if (!workflow) {
            throw new Error('Workflow is null or undefined');
        }

        if (platform === 'n8n') {
            if (!workflow.nodes || !Array.isArray(workflow.nodes)) {
                throw new Error('Invalid n8n workflow: missing nodes array');
            }
        } else if (platform === 'make') {
            if (!workflow.flow || !Array.isArray(workflow.flow)) {
                throw new Error('Invalid Make scenario: missing flow array');
            }
        } else if (platform === 'zapier') {
            if (!workflow.steps || !Array.isArray(workflow.steps)) {
                throw new Error('Invalid Zapier zap: missing steps array');
            }
        }

        return workflow;
    }

    /**
     * Translate n8n workflow to Make scenario
     */
    private async translateN8nToMake(
        workflow: N8nWorkflow,
        context: TranslationContext,
        options: any
    ): Promise<MakeScenario> {
        const scenario: MakeScenario = {
            name: workflow.name || 'Translated from n8n',
            flow: [],
            metadata: {
                created_by: 'workflow-translator',
                created_at: new Date().toISOString(),
                source_platform: 'n8n'
            }
        };

        // Translate each node to Make module
        let moduleId = 1;
        for (const node of workflow.nodes) {
            const makeModule = this.translateN8nNodeToMakeModule(node, moduleId, context);
            if (makeModule) {
                scenario.flow.push(makeModule);
                moduleId++;
            }
        }

        return scenario;
    }

    /**
     * Translate n8n node to Make module
     */
    private translateN8nNodeToMakeModule(node: any, moduleId: number, context: TranslationContext): any {
        // Find mapping rule
        const mapping = this.findMapping(node.type, 'n8n', 'make');
        
        if (!mapping) {
            console.warn(`No mapping found for n8n node: ${node.type}`);
            return null;
        }

        return {
            id: moduleId,
            module: mapping.targetType,
            version: 1,
            parameters: this.translateParameters(node.parameters, mapping.parameterMappings || []),
            metadata: {
                designer: {
                    x: node.position?.[0] || moduleId * 150,
                    y: node.position?.[1] || 300
                },
                original_node_name: node.name,
                translated_from: 'n8n'
            }
        };
    }

    /**
     * Translate n8n workflow to Zapier zap
     */
    private async translateN8nToZapier(
        workflow: N8nWorkflow,
        context: TranslationContext,
        options: any
    ): Promise<ZapierZap> {
        const zap: ZapierZap = {
            title: workflow.name || 'Translated from n8n',
            steps: [],
            status: 'draft',
            created_at: new Date().toISOString(),
            created_by: 'workflow-translator'
        };

        // Zapier only supports linear flows, so flatten n8n workflow
        for (let i = 0; i < workflow.nodes.length; i++) {
            const node = workflow.nodes[i];
            const zapierStep = this.translateN8nNodeToZapierStep(node, i, context);
            if (zapierStep) {
                zap.steps.push(zapierStep);
            }
        }

        return zap;
    }

    /**
     * Translate n8n node to Zapier step
     */
    private translateN8nNodeToZapierStep(node: any, index: number, context: TranslationContext): any {
        const mapping = this.findMapping(node.type, 'n8n', 'zapier');
        
        if (!mapping) {
            console.warn(`No mapping found for n8n node: ${node.type}`);
            return null;
        }

        return {
            id: index === 0 ? 'trigger_1' : `action_${index}`,
            type: index === 0 ? 'trigger' : 'action',
            app: mapping.app,
            event: mapping.event,
            parameters: this.translateParameters(node.parameters, mapping.parameterMappings || [])
        };
    }

    /**
     * Translate Make scenario to n8n workflow
     */
    private async translateMakeToN8n(
        scenario: MakeScenario,
        context: TranslationContext,
        options: any
    ): Promise<N8nWorkflow> {
        const workflow: N8nWorkflow = {
            name: scenario.name || 'Translated from Make',
            nodes: [],
            connections: {},
            settings: {},
            tags: ['translated', 'from-make']
        };

        // Translate each Make module to n8n node
        for (let i = 0; i < scenario.flow.length; i++) {
            const module = scenario.flow[i];
            const n8nNode = this.translateMakeModuleToN8nNode(module, i, context);
            if (n8nNode) {
                workflow.nodes.push(n8nNode);
                
                // Create connections
                if (i > 0) {
                    const prevNode = workflow.nodes[i - 1];
                    workflow.connections[prevNode.name] = {
                        main: [[{
                            node: n8nNode.name,
                            type: 'main',
                            index: 0
                        }]]
                    };
                }
            }
        }

        return workflow;
    }

    /**
     * Translate Make module to n8n node
     */
    private translateMakeModuleToN8nNode(module: any, index: number, context: TranslationContext): any {
        const mapping = this.findMapping(module.module, 'make', 'n8n');
        
        if (!mapping) {
            console.warn(`No mapping found for Make module: ${module.module}`);
            return null;
        }

        return {
            id: this.generateNodeId(),
            name: `Module ${index + 1}`,
            type: mapping.targetType,
            typeVersion: 1,
            position: [
                module.metadata?.designer?.x || (index + 1) * 250,
                module.metadata?.designer?.y || 300
            ],
            parameters: this.translateParameters(module.parameters || {}, mapping.parameterMappings || [])
        };
    }

    /**
     * Translate Make scenario to Zapier zap
     */
    private async translateMakeToZapier(
        scenario: MakeScenario,
        context: TranslationContext,
        options: any
    ): Promise<ZapierZap> {
        // Similar to n8n to Zapier
        const zap: ZapierZap = {
            title: scenario.name || 'Translated from Make',
            steps: [],
            status: 'draft'
        };

        for (let i = 0; i < scenario.flow.length; i++) {
            const module = scenario.flow[i];
            const mapping = this.findMapping(module.module, 'make', 'zapier');
            
            if (mapping) {
                zap.steps.push({
                    id: i === 0 ? 'trigger_1' : `action_${i}`,
                    type: i === 0 ? 'trigger' : 'action',
                    app: mapping.app,
                    event: mapping.event,
                    parameters: this.translateParameters(module.parameters || {}, mapping.parameterMappings || [])
                });
            }
        }

        return zap;
    }

    /**
     * Translate Zapier zap to n8n workflow
     */
    private async translateZapierToN8n(
        zap: ZapierZap,
        context: TranslationContext,
        options: any
    ): Promise<N8nWorkflow> {
        const workflow: N8nWorkflow = {
            name: zap.title || 'Translated from Zapier',
            nodes: [],
            connections: {},
            tags: ['translated', 'from-zapier']
        };

        for (let i = 0; i < zap.steps.length; i++) {
            const step = zap.steps[i];
            const mapping = this.findMapping(`${step.app}:${step.event}`, 'zapier', 'n8n');
            
            if (mapping) {
                const node = {
                    id: this.generateNodeId(),
                    name: `${step.app} ${i + 1}`,
                    type: mapping.targetType,
                    typeVersion: 1,
                    position: [(i + 1) * 250, 300],
                    parameters: this.translateParameters(step.parameters, mapping.parameterMappings || [])
                };
                
                workflow.nodes.push(node);
                
                if (i > 0) {
                    const prevNode = workflow.nodes[i - 1];
                    workflow.connections[prevNode.name] = {
                        main: [[{
                            node: node.name,
                            type: 'main',
                            index: 0
                        }]]
                    };
                }
            }
        }

        return workflow;
    }

    /**
     * Translate Zapier zap to Make scenario
     */
    private async translateZapierToMake(
        zap: ZapierZap,
        context: TranslationContext,
        options: any
    ): Promise<MakeScenario> {
        const scenario: MakeScenario = {
            name: zap.title || 'Translated from Zapier',
            flow: [],
            metadata: {
                created_by: 'workflow-translator',
                source_platform: 'zapier'
            }
        };

        for (let i = 0; i < zap.steps.length; i++) {
            const step = zap.steps[i];
            const mapping = this.findMapping(`${step.app}:${step.event}`, 'zapier', 'make');
            
            if (mapping) {
                scenario.flow.push({
                    id: i + 1,
                    module: mapping.targetType,
                    version: 1,
                    parameters: this.translateParameters(step.parameters, mapping.parameterMappings || {}),
                    metadata: {
                        designer: {
                            x: (i + 1) * 150,
                            y: 300
                        }
                    }
                });
            }
        }

        return scenario;
    }

    /**
     * Find mapping between platforms
     */
    private findMapping(sourceType: string, sourcePlatform: Platform, targetPlatform: Platform): any {
        // Search in triggers
        for (const [key, trigger] of Object.entries(this.mappingRules.triggers)) {
            const sourceTrigger = (trigger as any)[sourcePlatform];
            if (sourceTrigger && (sourceTrigger.node_type === sourceType || sourceTrigger.module_type === sourceType)) {
                const targetTrigger = (trigger as any)[targetPlatform];
                return {
                    targetType: targetTrigger.node_type || targetTrigger.module_type || targetTrigger.app,
                    app: targetTrigger.app,
                    event: targetTrigger.event,
                    parameterMappings: []
                };
            }
        }

        // Search in actions
        for (const [key, action] of Object.entries(this.mappingRules.actions)) {
            const sourceAction = (action as any)[sourcePlatform];
            if (sourceAction && (sourceAction.node_type === sourceType || sourceAction.module_type === sourceType)) {
                const targetAction = (action as any)[targetPlatform];
                return {
                    targetType: targetAction.node_type || targetAction.module_type || targetAction.app,
                    app: targetAction.app,
                    event: targetAction.action,
                    parameterMappings: []
                };
            }
        }

        return null;
    }

    /**
     * Translate parameters between platforms
     */
    private translateParameters(sourceParams: Record<string, any>, mappings: any[]): Record<string, any> {
        const translatedParams: Record<string, any> = {};
        
        for (const [key, value] of Object.entries(sourceParams)) {
            // Try to find direct mapping
            const mapping = mappings.find((m: any) => m.sourceParam === key);
            
            if (mapping) {
                translatedParams[mapping.targetParam] = mapping.transform ? mapping.transform(value) : value;
            } else {
                // Keep original if no mapping found
                translatedParams[key] = value;
            }
        }

        return translatedParams;
    }

    /**
     * Optimize workflow for target platform
     */
    private optimizeForPlatform(workflow: any, platform: Platform): any {
        // Platform-specific optimizations
        // This is a simplified version - real implementation would be more sophisticated
        return workflow;
    }

    /**
     * Helper methods
     */
    private countNodes(workflow: any, platform: Platform): number {
        if (platform === 'n8n') return workflow.nodes?.length || 0;
        if (platform === 'make') return workflow.flow?.length || 0;
        if (platform === 'zapier') return workflow.steps?.length || 0;
        return 0;
    }

    private calculateAccuracyScore(warnings: any[], errors: any[]): number {
        const totalIssues = warnings.length + (errors.length * 2);
        return Math.max(0, 100 - (totalIssues * 5));
    }

    private calculateFeasibilityScore(source: Platform, target: Platform): number {
        const complexity = this.platformCapabilities.translation_complexity;
        const key = `${source}_to_${target}`;
        return complexity[key]?.success_rate || 80;
    }

    private generateNodeId(): string {
        return `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}

