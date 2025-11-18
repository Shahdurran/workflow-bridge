/**
 * Platform-Specific Optimizers
 * Apply best practices and optimizations for each target platform
 */

import { N8nWorkflow, MakeScenario, ZapierZap, Platform } from '../types';

export class PlatformOptimizer {
    /**
     * Optimize workflow for target platform
     */
    optimize(workflow: any, platform: Platform): any {
        switch (platform) {
            case 'n8n':
                return this.optimizeForN8n(workflow);
            case 'make':
                return this.optimizeForMake(workflow);
            case 'zapier':
                return this.optimizeForZapier(workflow);
            default:
                return workflow;
        }
    }

    /**
     * Optimize for n8n
     */
    private optimizeForN8n(workflow: N8nWorkflow): N8nWorkflow {
        const optimized = JSON.parse(JSON.stringify(workflow)); // Deep clone

        // 1. Use built-in nodes instead of HTTP where possible
        optimized.nodes = optimized.nodes.map(node => {
            if (node.type === 'n8n-nodes-base.httpRequest') {
                // Check if there's a native node available
                const nativeNode = this.findNativeN8nNode(node.parameters);
                if (nativeNode) {
                    return {
                        ...node,
                        type: nativeNode.type,
                        parameters: nativeNode.parameters
                    };
                }
            }
            return node;
        });

        // 2. Add error handling if not present
        const hasErrorWorkflow = optimized.nodes.some(n => 
            n.type === 'n8n-nodes-base.errorTrigger'
        );
        if (!hasErrorWorkflow && optimized.nodes.length > 3) {
            // Suggest error handling for complex workflows
            optimized.settings = optimized.settings || {};
            optimized.settings.errorWorkflow = 'suggest_creation';
        }

        // 3. Optimize node positioning for better visualization
        optimized.nodes = this.optimizeN8nNodePositions(optimized.nodes);

        // 4. Add sticky notes for documentation
        if (optimized.nodes.length > 5) {
            optimized.nodes.push(this.createN8nStickyNote(
                'Translated Workflow',
                'This workflow was automatically translated. Review all nodes and test thoroughly.',
                [50, 50]
            ));
        }

        // 5. Enable expression resolution
        optimized.nodes = optimized.nodes.map(node => ({
            ...node,
            parameters: this.optimizeN8nExpressions(node.parameters)
        }));

        return optimized;
    }

    /**
     * Optimize for Make
     */
    private optimizeForMake(scenario: MakeScenario): MakeScenario {
        const optimized = JSON.parse(JSON.stringify(scenario)); // Deep clone

        // 1. Add routers for conditional logic optimization
        optimized.flow = this.optimizeMakeFlow(optimized.flow);

        // 2. Optimize module positions for visual clarity
        optimized.flow = optimized.flow.map((module, index) => ({
            ...module,
            metadata: {
                ...module.metadata,
                designer: {
                    x: 150 + (index * 200),
                    y: 300
                }
            }
        }));

        // 3. Add error handlers for important modules
        const criticalModules = optimized.flow.filter(m => 
            m.module.includes('Action') || m.module.includes('Create')
        );
        if (criticalModules.length > 0) {
            // Add note about error handling
            optimized.metadata = optimized.metadata || {};
            optimized.metadata.optimization_notes = 'Consider adding error handlers to critical modules';
        }

        // 4. Optimize data mapping
        optimized.flow = optimized.flow.map(module => ({
            ...module,
            mapper: this.optimizeMakeDataMapping(module.mapper || {})
        }));

        // 5. Add scenario-level settings
        optimized.metadata = {
            ...optimized.metadata,
            scheduling: 'immediate',
            max_results: 1,
            sequential_processing: false
        };

        return optimized;
    }

    /**
     * Optimize for Zapier
     */
    private optimizeForZapier(zap: ZapierZap): ZapierZap {
        const optimized = JSON.parse(JSON.stringify(zap)); // Deep clone

        // 1. Simplify to linear flow (Zapier requirement)
        optimized.steps = this.simplifyToLinearFlow(optimized.steps);

        // 2. Add filters for conditional logic
        optimized.steps = this.addZapierFilters(optimized.steps);

        // 3. Optimize field mappings
        optimized.steps = optimized.steps.map(step => ({
            ...step,
            parameters: this.optimizeZapierParameters(step.parameters)
        }));

        // 4. Add delays where needed
        optimized.steps = this.addZapierDelays(optimized.steps);

        // 5. Set appropriate status
        optimized.status = 'draft'; // Always start as draft for testing

        return optimized;
    }

    /**
     * Find native n8n node alternatives
     */
    private findNativeN8nNode(httpParams: any): { type: string; parameters: any } | null {
        const url = httpParams.url || '';

        // Check for common services
        if (url.includes('slack.com/api')) {
            return {
                type: 'n8n-nodes-base.slack',
                parameters: {
                    resource: 'message',
                    operation: 'post'
                }
            };
        } else if (url.includes('api.github.com')) {
            return {
                type: 'n8n-nodes-base.github',
                parameters: {}
            };
        } else if (url.includes('sheets.googleapis.com')) {
            return {
                type: 'n8n-nodes-base.googleSheets',
                parameters: {}
            };
        }

        return null;
    }

    /**
     * Optimize n8n node positions
     */
    private optimizeN8nNodePositions(nodes: any[]): any[] {
        return nodes.map((node, index) => ({
            ...node,
            position: [250 + (index * 250), 300]
        }));
    }

    /**
     * Create n8n sticky note
     */
    private createN8nStickyNote(title: string, content: string, position: [number, number]): any {
        return {
            id: `sticky_${Date.now()}`,
            name: 'Note',
            type: 'n8n-nodes-base.stickyNote',
            typeVersion: 1,
            position,
            parameters: {
                content: `## ${title}\n\n${content}`,
                height: 160,
                width: 240
            }
        };
    }

    /**
     * Optimize n8n expressions
     */
    private optimizeN8nExpressions(parameters: any): any {
        // Convert any plain text that looks like it should be an expression
        const optimized = { ...parameters };
        
        for (const [key, value] of Object.entries(parameters)) {
            if (typeof value === 'string' && value.includes('{{') && !value.includes('$json')) {
                // Convert to proper n8n expression format
                optimized[key] = value.replace(/\{\{(\w+)\}\}/g, '{{$json.$1}}');
            }
        }

        return optimized;
    }

    /**
     * Optimize Make flow structure
     */
    private optimizeMakeFlow(flow: any[]): any[] {
        // Group sequential actions that could be combined
        return flow; // Simplified for MVP
    }

    /**
     * Optimize Make data mapping
     */
    private optimizeMakeDataMapping(mapper: any): any {
        // Add proper data references
        return mapper; // Simplified for MVP
    }

    /**
     * Simplify to linear flow for Zapier
     */
    private simplifyToLinearFlow(steps: any[]): any[] {
        // Remove any branching - Zapier only supports linear flows
        // If there were branches, they need to be separate Zaps
        return steps.filter(step => step.type === 'trigger' || step.type === 'action');
    }

    /**
     * Add Zapier filters
     */
    private addZapierFilters(steps: any[]): any[] {
        // Add filter steps for conditional logic
        const optimized = [...steps];
        
        // Check if any step needs filtering
        steps.forEach((step, index) => {
            if (step.parameters.condition) {
                // Insert filter before this step
                optimized.splice(index, 0, {
                    id: `filter_${index}`,
                    type: 'filter',
                    app: 'filter',
                    event: 'continue_if',
                    parameters: {
                        condition: step.parameters.condition
                    }
                });
            }
        });

        return optimized;
    }

    /**
     * Optimize Zapier parameters
     */
    private optimizeZapierParameters(parameters: any): any {
        // Simplify complex parameters for Zapier
        const optimized = { ...parameters };

        // Remove any code or complex logic
        delete optimized.code;
        delete optimized.custom_logic;

        return optimized;
    }

    /**
     * Add delays where needed for Zapier
     */
    private addZapierDelays(steps: any[]): any[] {
        // Add delay steps if rapid API calls are detected
        const optimized = [...steps];
        let apiCallCount = 0;

        steps.forEach((step, index) => {
            if (step.type === 'action' && step.app !== 'delay') {
                apiCallCount++;
                
                // Add delay after every 3rd API call
                if (apiCallCount % 3 === 0 && index < steps.length - 1) {
                    optimized.splice(index + 1, 0, {
                        id: `delay_${index}`,
                        type: 'action',
                        app: 'delay',
                        event: 'delay_for',
                        parameters: {
                            time_unit: 'seconds',
                            delay_for: 1
                        }
                    });
                }
            }
        });

        return optimized;
    }
}

