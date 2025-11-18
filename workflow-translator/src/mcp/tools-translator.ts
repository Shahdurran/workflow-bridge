/**
 * MCP Tools for Workflow Translator
 * Defines the tools available through the MCP protocol
 */

export const TRANSLATOR_TOOLS = [
    {
        name: "translate_workflow",
        description: "Translate a workflow from one platform to another with optional optimization",
        inputSchema: {
            type: "object" as const,
            properties: {
                workflow: {
                    type: "object",
                    description: "The workflow JSON to translate"
                },
                sourcePlatform: {
                    type: "string",
                    description: "Source platform",
                    enum: ["n8n", "make", "zapier"]
                },
                targetPlatform: {
                    type: "string",
                    description: "Target platform",
                    enum: ["n8n", "make", "zapier"]
                },
                optimize: {
                    type: "boolean",
                    description: "Apply platform-specific optimizations (default: true)",
                    default: true
                },
                preserveNames: {
                    type: "boolean",
                    description: "Preserve original node/module names (default: false)",
                    default: false
                },
                strictMode: {
                    type: "boolean",
                    description: "Fail on any translation issues (default: false)",
                    default: false
                }
            },
            required: ["workflow", "sourcePlatform", "targetPlatform"]
        }
    },
    {
        name: "check_translation_feasibility",
        description: "Check if a workflow can be successfully translated to target platform",
        inputSchema: {
            type: "object" as const,
            properties: {
                workflow: {
                    type: "object",
                    description: "The workflow JSON to analyze"
                },
                sourcePlatform: {
                    type: "string",
                    description: "Source platform",
                    enum: ["n8n", "make", "zapier"]
                },
                targetPlatform: {
                    type: "string",
                    description: "Target platform",
                    enum: ["n8n", "make", "zapier"]
                }
            },
            required: ["workflow", "sourcePlatform", "targetPlatform"]
        }
    },
    {
        name: "get_platform_capabilities",
        description: "Get detailed capabilities and feature comparison for platforms",
        inputSchema: {
            type: "object" as const,
            properties: {
                platforms: {
                    type: "array",
                    description: "Platforms to compare (default: all three)",
                    items: {
                        type: "string",
                        enum: ["n8n", "make", "zapier"]
                    },
                    default: ["n8n", "make", "zapier"]
                }
            },
            required: []
        }
    },
    {
        name: "get_translation_complexity",
        description: "Get difficulty and success rate information for a translation path",
        inputSchema: {
            type: "object" as const,
            properties: {
                sourcePlatform: {
                    type: "string",
                    enum: ["n8n", "make", "zapier"]
                },
                targetPlatform: {
                    type: "string",
                    enum: ["n8n", "make", "zapier"]
                }
            },
            required: ["sourcePlatform", "targetPlatform"]
        }
    },
    {
        name: "suggest_best_platform",
        description: "Suggest the best target platform based on workflow requirements",
        inputSchema: {
            type: "object" as const,
            properties: {
                requirements: {
                    type: "object",
                    description: "Workflow requirements",
                    properties: {
                        needs_custom_code: { type: "boolean" },
                        needs_loops: { type: "boolean" },
                        needs_complex_logic: { type: "boolean" },
                        team_technical_level: { 
                            type: "string",
                            enum: ["beginner", "intermediate", "advanced"]
                        },
                        self_hosting_preferred: { type: "boolean" },
                        budget_level: {
                            type: "string",
                            enum: ["low", "medium", "high"]
                        }
                    }
                }
            },
            required: ["requirements"]
        }
    },
    {
        name: "translate_expression",
        description: "Translate a single expression between platform syntaxes",
        inputSchema: {
            type: "object" as const,
            properties: {
                expression: {
                    type: "string",
                    description: "The expression to translate"
                },
                sourcePlatform: {
                    type: "string",
                    enum: ["n8n", "make", "zapier"]
                },
                targetPlatform: {
                    type: "string",
                    enum: ["n8n", "make", "zapier"]
                },
                context: {
                    type: "object",
                    description: "Additional context (field types, available data, etc.)"
                }
            },
            required: ["expression", "sourcePlatform", "targetPlatform"]
        }
    },
    {
        name: "analyze_workflow_complexity",
        description: "Analyze workflow complexity and get optimization suggestions",
        inputSchema: {
            type: "object" as const,
            properties: {
                workflow: {
                    type: "object",
                    description: "The workflow to analyze"
                },
                platform: {
                    type: "string",
                    enum: ["n8n", "make", "zapier"]
                }
            },
            required: ["workflow", "platform"]
        }
    },
    {
        name: "batch_translate_workflows",
        description: "Translate multiple workflows at once",
        inputSchema: {
            type: "object" as const,
            properties: {
                workflows: {
                    type: "array",
                    description: "Array of workflow objects to translate",
                    items: {
                        type: "object"
                    }
                },
                sourcePlatform: {
                    type: "string",
                    enum: ["n8n", "make", "zapier"]
                },
                targetPlatform: {
                    type: "string",
                    enum: ["n8n", "make", "zapier"]
                },
                optimize: {
                    type: "boolean",
                    default: true
                }
            },
            required: ["workflows", "sourcePlatform", "targetPlatform"]
        }
    }
];

/**
 * Tool documentation
 */
export const TRANSLATOR_TOOLS_DOCUMENTATION = {
    overview: "Workflow Translator provides bidirectional translation between n8n, Make.com, and Zapier",
    tools: TRANSLATOR_TOOLS.map(tool => ({
        name: tool.name,
        description: tool.description,
        parameters: tool.inputSchema.properties,
        examples: getToolExamples(tool.name)
    }))
};

function getToolExamples(toolName: string): string[] {
    const examples: Record<string, string[]> = {
        translate_workflow: [
            'Translate n8n to Make: {"workflow": {...}, "sourcePlatform": "n8n", "targetPlatform": "make", "optimize": true}',
            'Convert Zapier to n8n: {"workflow": {...}, "sourcePlatform": "zapier", "targetPlatform": "n8n"}'
        ],
        check_translation_feasibility: [
            'Check if complex n8n workflow can go to Zapier: {"workflow": {...}, "sourcePlatform": "n8n", "targetPlatform": "zapier"}',
            'Verify Make to n8n translation: {"workflow": {...}, "sourcePlatform": "make", "targetPlatform": "n8n"}'
        ],
        get_platform_capabilities: [
            'Compare all platforms: {}',
            'Compare n8n and Make: {"platforms": ["n8n", "make"]}'
        ],
        translate_expression: [
            'Convert n8n expression to Make: {"expression": "{{$json.email}}", "sourcePlatform": "n8n", "targetPlatform": "make"}',
            'Translate Make to Zapier: {"expression": "{{1.name}}", "sourcePlatform": "make", "targetPlatform": "zapier"}'
        ]
    };

    return examples[toolName] || [];
}

