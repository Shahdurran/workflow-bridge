/**
 * Feasibility Checker
 * Analyzes if a workflow can be successfully translated between platforms
 */

import { Platform, FeasibilityCheck, FeasibilityIssue } from '../types';
import fs from 'fs';
import path from 'path';

export class FeasibilityChecker {
    private platformCapabilities: any;

    constructor() {
        const capabilitiesPath = path.join(__dirname, '../../data/platform-capabilities.json');
        this.platformCapabilities = JSON.parse(fs.readFileSync(capabilitiesPath, 'utf-8'));
    }

    /**
     * Check if workflow translation is feasible
     */
    checkFeasibility(
        workflow: any,
        sourcePlatform: Platform,
        targetPlatform: Platform
    ): FeasibilityCheck {
        const issues: FeasibilityIssue[] = [];
        const suggestions: string[] = [];

        // Get platform capabilities
        const sourceCapabilities = this.platformCapabilities[sourcePlatform].capabilities;
        const targetCapabilities = this.platformCapabilities[targetPlatform].capabilities;

        // Analyze workflow structure
        const workflowFeatures = this.detectWorkflowFeatures(workflow, sourcePlatform);

        // Check custom code
        if (workflowFeatures.has_custom_code && !targetCapabilities.custom_code) {
            issues.push({
                severity: 'blocker',
                feature: 'custom_code',
                message: `${targetPlatform} does not support custom code`,
                workaround: targetPlatform === 'zapier' 
                    ? 'Use Code by Zapier (premium addon) or convert logic to standard actions'
                    : 'Convert code logic to standard modules'
            });
        }

        // Check loops
        if (workflowFeatures.has_loops && !targetCapabilities.loops) {
            issues.push({
                severity: targetPlatform === 'zapier' ? 'blocker' : 'warning',
                feature: 'loops',
                message: `${targetPlatform} does not support loops`,
                workaround: targetPlatform === 'zapier'
                    ? 'Use Looping by Zapier (premium) or create separate Zaps for each iteration'
                    : 'Restructure workflow to avoid loops'
            });
        }

        // Check conditional logic
        if (workflowFeatures.has_complex_conditionals && !targetCapabilities.conditional_logic) {
            issues.push({
                severity: 'warning',
                feature: 'conditional_logic',
                message: `${targetPlatform} has limited conditional logic`,
                workaround: 'Use filters for simple conditions or create separate Zaps'
            });
        }

        // Check parallel execution
        if (workflowFeatures.has_parallel_branches && !targetCapabilities.parallel_execution) {
            issues.push({
                severity: 'warning',
                feature: 'parallel_execution',
                message: `${targetPlatform} does not support parallel execution`,
                workaround: 'Execute branches sequentially'
            });
        }

        // Check sub-workflows
        if (workflowFeatures.has_sub_workflows && !targetCapabilities.sub_workflows) {
            issues.push({
                severity: 'warning',
                feature: 'sub_workflows',
                message: `${targetPlatform} does not support sub-workflows`,
                workaround: 'Flatten into single workflow or create separate workflows'
            });
        }

        // Check error handling
        if (workflowFeatures.has_error_handling && !targetCapabilities.error_handling) {
            issues.push({
                severity: 'info',
                feature: 'error_handling',
                message: `${targetPlatform} has limited error handling`,
                workaround: 'Use platform-specific error notifications'
            });
        }

        // Check workflow size limits
        const nodeCount = this.getNodeCount(workflow, sourcePlatform);
        const targetLimit = this.platformCapabilities[targetPlatform].max_nodes || 
                           this.platformCapabilities[targetPlatform].max_modules ||
                           this.platformCapabilities[targetPlatform].max_steps;

        if (nodeCount > targetLimit) {
            issues.push({
                severity: 'blocker',
                feature: 'workflow_size',
                message: `Workflow has ${nodeCount} nodes but ${targetPlatform} supports max ${targetLimit}`,
                workaround: 'Split into multiple workflows'
            });
        }

        // Generate suggestions
        if (issues.length === 0) {
            suggestions.push(`Workflow can be fully translated from ${sourcePlatform} to ${targetPlatform}`);
        } else {
            const blockers = issues.filter(i => i.severity === 'blocker');
            if (blockers.length > 0) {
                suggestions.push(`Translation blocked by ${blockers.length} critical issue(s)`);
                suggestions.push('Consider using a different target platform or simplifying the workflow');
            } else {
                suggestions.push('Translation is possible with some modifications');
                suggestions.push('Review warnings and apply suggested workarounds');
            }
        }

        // Add platform-specific suggestions
        if (targetPlatform === 'zapier') {
            suggestions.push('Zapier works best for simple, linear workflows');
            if (workflowFeatures.has_complex_conditionals || workflowFeatures.has_loops) {
                suggestions.push('Consider Make.com for complex logic and loops');
            }
        } else if (targetPlatform === 'make') {
            suggestions.push('Make.com supports advanced features like routers and iterators');
            suggestions.push('Take advantage of Make\'s visual debugging capabilities');
        } else if (targetPlatform === 'n8n') {
            suggestions.push('n8n supports complex workflows with full code capabilities');
            suggestions.push('Consider self-hosting for enterprise use cases');
        }

        // Calculate feasibility score
        const score = this.calculateFeasibilityScore(issues, nodeCount, targetLimit);

        return {
            feasible: issues.filter(i => i.severity === 'blocker').length === 0,
            score,
            issues,
            suggestions
        };
    }

    /**
     * Detect features used in workflow
     */
    private detectWorkflowFeatures(workflow: any, platform: Platform): {
        has_custom_code: boolean;
        has_loops: boolean;
        has_complex_conditionals: boolean;
        has_parallel_branches: boolean;
        has_sub_workflows: boolean;
        has_error_handling: boolean;
    } {
        const features = {
            has_custom_code: false,
            has_loops: false,
            has_complex_conditionals: false,
            has_parallel_branches: false,
            has_sub_workflows: false,
            has_error_handling: false
        };

        if (platform === 'n8n') {
            const nodes = workflow.nodes || [];
            features.has_custom_code = nodes.some((n: any) => 
                n.type === 'n8n-nodes-base.code' || 
                n.type === 'n8n-nodes-base.function'
            );
            features.has_loops = nodes.some((n: any) => 
                n.type === 'n8n-nodes-base.splitInBatches' ||
                n.type === 'n8n-nodes-base.loop'
            );
            features.has_complex_conditionals = nodes.some((n: any) => 
                n.type === 'n8n-nodes-base.if' ||
                n.type === 'n8n-nodes-base.switch'
            );
            features.has_sub_workflows = nodes.some((n: any) => 
                n.type === 'n8n-nodes-base.executeWorkflow'
            );
            // Check for parallel branches in connections
            if (workflow.connections) {
                features.has_parallel_branches = Object.values(workflow.connections).some((conn: any) => 
                    conn.main?.[0]?.length > 1
                );
            }
        } else if (platform === 'make') {
            const modules = workflow.flow || [];
            features.has_custom_code = modules.some((m: any) => 
                m.module?.includes('builtin:CustomCode')
            );
            features.has_loops = modules.some((m: any) => 
                m.module?.includes('builtin:Iterator') ||
                m.module?.includes('builtin:Aggregator')
            );
            features.has_complex_conditionals = modules.some((m: any) => 
                m.module?.includes('builtin:Router')
            );
            features.has_error_handling = modules.some((m: any) => 
                m.module?.includes('builtin:ErrorHandler')
            );
        } else if (platform === 'zapier') {
            const steps = workflow.steps || [];
            features.has_custom_code = steps.some((s: any) => 
                s.app === 'code' || s.app === 'code_by_zapier'
            );
            features.has_loops = steps.some((s: any) => 
                s.app === 'looping'
            );
            // Zapier has very limited conditionals
            features.has_complex_conditionals = false;
        }

        return features;
    }

    /**
     * Get node count from workflow
     */
    private getNodeCount(workflow: any, platform: Platform): number {
        if (platform === 'n8n') return workflow.nodes?.length || 0;
        if (platform === 'make') return workflow.flow?.length || 0;
        if (platform === 'zapier') return workflow.steps?.length || 0;
        return 0;
    }

    /**
     * Calculate feasibility score (0-100)
     */
    private calculateFeasibilityScore(
        issues: FeasibilityIssue[],
        nodeCount: number,
        targetLimit: number
    ): number {
        let score = 100;

        // Deduct points for issues
        issues.forEach(issue => {
            if (issue.severity === 'blocker') score -= 30;
            else if (issue.severity === 'warning') score -= 10;
            else if (issue.severity === 'info') score -= 5;
        });

        // Deduct points for workflow size
        if (nodeCount > targetLimit * 0.8) {
            score -= 15; // Getting close to limit
        }

        return Math.max(0, Math.min(100, score));
    }

    /**
     * Get translation complexity info
     */
    getTranslationComplexity(
        sourcePlatform: Platform,
        targetPlatform: Platform
    ): {
        difficulty: string;
        success_rate: number;
        common_issues: string[];
    } {
        const complexity = this.platformCapabilities.translation_complexity;
        const key = `${sourcePlatform}_to_${targetPlatform}`;
        
        return complexity[key] || {
            difficulty: 'unknown',
            success_rate: 50,
            common_issues: ['Unknown translation path']
        };
    }
}

