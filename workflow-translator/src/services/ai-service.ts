/**
 * AI-Enhanced Translation Service
 * Uses Claude API for complex node mappings and code translation
 */

import Anthropic from '@anthropic-ai/sdk';
import { Platform, TranslationContext } from '../types';

export class AITranslationService {
    private anthropic: Anthropic;
    private readonly model = 'claude-sonnet-4-20250514';
    private readonly maxTokens = 4096;

    constructor(apiKey?: string) {
        const key = apiKey || process.env.ANTHROPIC_API_KEY;
        if (!key) {
            throw new Error('ANTHROPIC_API_KEY is required for AI translation service');
        }
        this.anthropic = new Anthropic({ apiKey: key });
    }

    /**
     * Translate a complex node that has no direct mapping
     */
    async translateComplexNode(
        sourceNode: any,
        sourcePlatform: Platform,
        targetPlatform: Platform,
        context: TranslationContext
    ): Promise<any> {
        const prompt = this.buildNodeTranslationPrompt(
            sourceNode,
            sourcePlatform,
            targetPlatform,
            context
        );

        try {
            const response = await this.anthropic.messages.create({
                model: this.model,
                max_tokens: this.maxTokens,
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ]
            });

            const content = response.content[0];
            if (content.type === 'text') {
                // Parse JSON response
                const jsonMatch = content.text.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    return JSON.parse(jsonMatch[0]);
                }
            }

            throw new Error('Failed to parse AI response');
        } catch (error) {
            console.error('AI translation failed:', error);
            throw new Error(`AI translation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Translate custom code between platforms
     */
    async translateCode(
        code: string,
        sourcePlatform: Platform,
        targetPlatform: Platform,
        codeType: 'javascript' | 'python' | 'function'
    ): Promise<string> {
        const prompt = `
You are translating automation workflow code from ${sourcePlatform} to ${targetPlatform}.

Source platform: ${sourcePlatform}
Target platform: ${targetPlatform}
Code type: ${codeType}

Original code:
\`\`\`${codeType}
${code}
\`\`\`

Platform-specific notes:
${this.getPlatformCodeNotes(sourcePlatform, targetPlatform)}

Please translate this code to work in ${targetPlatform}. Provide ONLY the translated code without explanation.

Translated code:`;

        try {
            const response = await this.anthropic.messages.create({
                model: this.model,
                max_tokens: 2000,
                messages: [{ role: 'user', content: prompt }]
            });

            const content = response.content[0];
            if (content.type === 'text') {
                // Extract code from response
                const codeMatch = content.text.match(/```[\w]*\n([\s\S]*?)\n```/);
                return codeMatch ? codeMatch[1].trim() : content.text.trim();
            }

            throw new Error('Failed to parse AI response');
        } catch (error) {
            console.error('Code translation failed:', error);
            throw new Error(`Code translation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Translate expressions between platform syntaxes
     */
    async translateExpression(
        expression: string,
        sourcePlatform: Platform,
        targetPlatform: Platform,
        context?: any
    ): Promise<string> {
        const prompt = `
Translate this workflow expression from ${sourcePlatform} to ${targetPlatform}:

Source expression: ${expression}

Platform syntax:
- n8n: Uses {{$json.field}} and {{$node["NodeName"].json.field}}
- Make: Uses {{1.field}} (module number notation) and functions like {{formatDate(now; "YYYY-MM-DD")}}
- Zapier: Uses step output references like "1. Field Name" from dropdown selections

Context: ${context ? JSON.stringify(context) : 'None'}

Provide ONLY the translated expression without explanation.

Translated expression:`;

        try {
            const response = await this.anthropic.messages.create({
                model: this.model,
                max_tokens: 500,
                messages: [{ role: 'user', content: prompt }]
            });

            const content = response.content[0];
            if (content.type === 'text') {
                return content.text.trim();
            }

            throw new Error('Failed to parse AI response');
        } catch (error) {
            console.error('Expression translation failed:', error);
            // Return original expression as fallback
            return expression;
        }
    }

    /**
     * Get suggested modules for unmapped functionality
     */
    async suggestModuleMapping(
        sourceModule: any,
        sourcePlatform: Platform,
        targetPlatform: Platform,
        availableModules: any[]
    ): Promise<any> {
        const prompt = `
Find the best matching module in ${targetPlatform} for this ${sourcePlatform} module:

Source module:
${JSON.stringify(sourceModule, null, 2)}

Available ${targetPlatform} modules (top 20):
${JSON.stringify(availableModules.slice(0, 20), null, 2)}

Return JSON in this format:
{
  "best_match": {
    "module_name": "target_module_name",
    "confidence": 0.85,
    "reasoning": "why this is the best match"
  },
  "parameter_mappings": [
    {"source": "param1", "target": "target_param1"}
  ],
  "notes": "any important translation notes"
}

Provide ONLY valid JSON, no additional text.`;

        try {
            const response = await this.anthropic.messages.create({
                model: this.model,
                max_tokens: 1500,
                messages: [{ role: 'user', content: prompt }]
            });

            const content = response.content[0];
            if (content.type === 'text') {
                const jsonMatch = content.text.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    return JSON.parse(jsonMatch[0]);
                }
            }

            throw new Error('Failed to parse AI response');
        } catch (error) {
            console.error('Module suggestion failed:', error);
            return {
                best_match: null,
                parameter_mappings: [],
                notes: 'AI suggestion failed, manual mapping required'
            };
        }
    }

    /**
     * Analyze workflow complexity and provide optimization suggestions
     */
    async analyzeWorkflow(
        workflow: any,
        platform: Platform
    ): Promise<{
        complexity_score: number;
        suggestions: string[];
        potential_issues: string[];
    }> {
        const prompt = `
Analyze this ${platform} workflow for complexity and optimization opportunities:

Workflow:
${JSON.stringify(workflow, null, 2)}

Provide analysis in JSON format:
{
  "complexity_score": 0-100,
  "suggestions": ["suggestion 1", "suggestion 2"],
  "potential_issues": ["issue 1", "issue 2"]
}

Consider:
- Number of nodes/modules/steps
- Branching and conditional logic
- Error handling
- Performance optimization opportunities
- Best practices for ${platform}

Provide ONLY valid JSON.`;

        try {
            const response = await this.anthropic.messages.create({
                model: this.model,
                max_tokens: 2000,
                messages: [{ role: 'user', content: prompt }]
            });

            const content = response.content[0];
            if (content.type === 'text') {
                const jsonMatch = content.text.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    return JSON.parse(jsonMatch[0]);
                }
            }

            throw new Error('Failed to parse AI response');
        } catch (error) {
            console.error('Workflow analysis failed:', error);
            return {
                complexity_score: 50,
                suggestions: [],
                potential_issues: ['Analysis failed']
            };
        }
    }

    /**
     * Build node translation prompt
     */
    private buildNodeTranslationPrompt(
        sourceNode: any,
        sourcePlatform: Platform,
        targetPlatform: Platform,
        context: TranslationContext
    ): string {
        return `
You are an expert in workflow automation platforms (n8n, Make.com, Zapier).

Task: Translate this ${sourcePlatform} node to ${targetPlatform}.

Source node:
${JSON.stringify(sourceNode, null, 2)}

Target platform capabilities:
${JSON.stringify(context.capabilities[targetPlatform], null, 2)}

Available ${targetPlatform} modules (sample):
${context.availableNodes.length > 0 ? JSON.stringify(context.availableNodes.slice(0, 10), null, 2) : 'None provided'}

Requirements:
1. Find the closest equivalent module/node in ${targetPlatform}
2. Map parameters appropriately
3. Handle any platform-specific differences
4. If exact match isn't possible, provide best alternative

Return JSON in this format:
{
  "node_type": "target_platform_node_type",
  "parameters": {
    "param1": "value1",
    "param2": "value2"
  },
  "notes": "any important notes about the translation",
  "confidence": 0.85,
  "requires_manual_review": false
}

Provide ONLY valid JSON, no additional text.`;
    }

    /**
     * Get platform-specific code translation notes
     */
    private getPlatformCodeNotes(source: Platform, target: Platform): string {
        const notes: Record<string, string> = {
            'n8n-make': 'n8n uses $json for data, Make uses numbered module references like {{1.field}}',
            'n8n-zapier': 'n8n has full JavaScript, Zapier requires Code by Zapier with limited libraries',
            'make-n8n': 'Make uses {{module.field}} syntax, n8n uses {{$json.field}}',
            'make-zapier': 'Both are limited in code capabilities, focus on data mapping',
            'zapier-n8n': 'Zapier Code can be converted to n8n Function nodes with full Node.js',
            'zapier-make': 'Both platforms prefer no-code approaches, convert logic to modules'
        };

        return notes[`${source}-${target}`] || 'No specific notes';
    }
}

