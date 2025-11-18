/**
 * MCP Tools for Make.com
 * Defines the tools available through the MCP protocol
 */

export const MAKE_TOOLS = [
    {
        name: "search_make_modules",
        description: "Search Make.com modules by name, functionality, or app. Returns matching modules with their documentation.",
        inputSchema: {
            type: "object" as const,
            properties: {
                query: {
                    type: "string",
                    description: "Search query (e.g., 'send email', 'google sheets', 'webhook')"
                },
                limit: {
                    type: "number",
                    description: "Maximum number of results to return (default: 10)",
                    default: 10
                },
                category: {
                    type: "string",
                    description: "Filter by category (optional)",
                    enum: [
                        "Communication",
                        "Productivity",
                        "CRM",
                        "E-commerce",
                        "Social Media",
                        "Developer Tools",
                        "Data & Storage",
                        "Marketing",
                        "Finance",
                        "HTTP & Webhooks"
                    ]
                },
                module_type: {
                    type: "string",
                    description: "Filter by module type (optional)",
                    enum: ["trigger", "action", "search", "instant_trigger", "aggregator", "router"]
                },
                include_examples: {
                    type: "boolean",
                    description: "Include example configurations (default: false)",
                    default: false
                }
            },
            required: ["query"]
        }
    },
    {
        name: "get_module_essentials",
        description: "Get detailed information about a specific Make module including parameters, documentation, and examples.",
        inputSchema: {
            type: "object" as const,
            properties: {
                moduleName: {
                    type: "string",
                    description: "The module identifier (e.g., 'http:ActionSendData', 'google-sheets:AddARow')"
                },
                includeExamples: {
                    type: "boolean",
                    description: "Include example configurations from templates (default: true)",
                    default: true
                }
            },
            required: ["moduleName"]
        }
    },
    {
        name: "validate_make_scenario",
        description: "Validate a Make scenario JSON structure. Checks for required fields, module connections, and parameter completeness.",
        inputSchema: {
            type: "object" as const,
            properties: {
                scenario: {
                    type: "object",
                    description: "The Make scenario JSON to validate"
                },
                profile: {
                    type: "string",
                    description: "Validation strictness level",
                    enum: ["strict", "balanced", "permissive"],
                    default: "balanced"
                }
            },
            required: ["scenario"]
        }
    },
    {
        name: "autofix_make_scenario",
        description: "Automatically fix common errors in a Make scenario JSON structure with detailed reporting. Returns fixed scenario + comprehensive fix report with confidence levels and statistics.",
        inputSchema: {
            type: "object" as const,
            properties: {
                scenario: {
                    type: "object",
                    description: "The Make scenario JSON to fix"
                },
                options: {
                    type: "object",
                    description: "Auto-fix options for granular control",
                    properties: {
                        applyFixes: {
                            type: "boolean",
                            description: "Whether to apply fixes to scenario (default: true)",
                            default: true
                        },
                        confidenceThreshold: {
                            type: "string",
                            enum: ["high", "medium", "low"],
                            description: "Minimum confidence level for fixes (default: medium)",
                            default: "medium"
                        },
                        maxFixes: {
                            type: "number",
                            description: "Maximum number of fixes to apply (default: 50)",
                            default: 50
                        },
                        fixTypes: {
                            type: "array",
                            items: {
                                type: "string",
                                enum: [
                                    "metadata",
                                    "mapper",
                                    "module-ids",
                                    "coordinates",
                                    "version",
                                    "scenario-settings",
                                    "router-routes",
                                    "parameters",
                                    "zone"
                                ]
                            },
                            description: "Specific fix types to apply (default: all)"
                        }
                    }
                }
            },
            required: ["scenario"]
        }
    },
    {
        name: "list_make_templates",
        description: "List available Make scenario templates with filtering options.",
        inputSchema: {
            type: "object" as const,
            properties: {
                category: {
                    type: "string",
                    description: "Filter by category (optional)"
                },
                limit: {
                    type: "number",
                    description: "Maximum number of templates to return (default: 10)",
                    default: 10
                }
            },
            required: []
        }
    },
    {
        name: "get_make_template",
        description: "Get a specific Make scenario template by ID.",
        inputSchema: {
            type: "object" as const,
            properties: {
                templateId: {
                    type: "string",
                    description: "The template ID"
                },
                mode: {
                    type: "string",
                    description: "Return mode: 'full' (complete scenario), 'metadata' (info only), or 'modules' (module list)",
                    enum: ["full", "metadata", "modules"],
                    default: "full"
                }
            },
            required: ["templateId"]
        }
    },
    {
        name: "get_modules_by_app",
        description: "Get all modules available for a specific app/service.",
        inputSchema: {
            type: "object" as const,
            properties: {
                appName: {
                    type: "string",
                    description: "The app name (e.g., 'Google Sheets', 'Slack', 'HTTP')"
                }
            },
            required: ["appName"]
        }
    },
    {
        name: "get_database_statistics",
        description: "Get statistics about the Make modules database including coverage and module counts.",
        inputSchema: {
            type: "object" as const,
            properties: {},
            required: []
        }
    },
    {
        name: "get_popular_modules",
        description: "Get the most popular/frequently used Make modules.",
        inputSchema: {
            type: "object" as const,
            properties: {
                limit: {
                    type: "number",
                    description: "Maximum number of modules to return (default: 20)",
                    default: 20
                }
            },
            required: []
        }
    },
    {
        name: "suggest_modules_for_intent",
        description: "Get suggested modules based on a workflow intent description.",
        inputSchema: {
            type: "object" as const,
            properties: {
                intent: {
                    type: "string",
                    description: "Description of what you want to automate (e.g., 'send email when form submitted')"
                }
            },
            required: ["intent"]
        }
    },
    // ============================================================
    // Phase 6: Scenario Management Tools
    // ============================================================
    {
        name: "make_create_scenario",
        description: "Create a new scenario in Make.com via API. Requires MAKE_API_TOKEN and MAKE_API_URL environment variables.",
        inputSchema: {
            type: "object" as const,
            properties: {
                scenario: {
                    type: "object",
                    description: "The complete scenario JSON structure to create"
                },
                teamId: {
                    type: "string",
                    description: "The team ID to create the scenario in (optional)"
                },
                folderId: {
                    type: "string",
                    description: "The folder ID to place the scenario in (optional)"
                }
            },
            required: ["scenario"]
        }
    },
    {
        name: "make_update_partial_scenario",
        description: "Update a scenario using diff operations. Applies incremental changes without replacing the entire scenario. Uses ScenarioDiffEngine for safe, validated updates.",
        inputSchema: {
            type: "object" as const,
            properties: {
                scenarioId: {
                    type: "string",
                    description: "The ID of the scenario to update"
                },
                operations: {
                    type: "array",
                    description: "Array of diff operations to apply",
                    items: {
                        type: "object",
                        properties: {
                            type: {
                                type: "string",
                                enum: ["addModule", "removeModule", "updateModule", "moveModule", "reorderModules", "updateMetadata", "updateName", "addRoute", "removeRoute", "updateRoute"],
                                description: "Type of operation to perform"
                            }
                        }
                    }
                },
                continueOnError: {
                    type: "boolean",
                    description: "Whether to continue applying operations if one fails (default: false)",
                    default: false
                }
            },
            required: ["scenarioId", "operations"]
        }
    },
    {
        name: "make_execute_scenario",
        description: "Execute a scenario immediately via Make.com API. Optionally pass data to the first module.",
        inputSchema: {
            type: "object" as const,
            properties: {
                scenarioId: {
                    type: "string",
                    description: "The ID of the scenario to execute"
                },
                data: {
                    type: "object",
                    description: "Optional data to pass to the scenario execution"
                }
            },
            required: ["scenarioId"]
        }
    },
    {
        name: "make_get_scenario",
        description: "Fetch a scenario from Make.com by ID. Returns the complete scenario structure with expression validation.",
        inputSchema: {
            type: "object" as const,
            properties: {
                scenarioId: {
                    type: "string",
                    description: "The ID of the scenario to retrieve"
                }
            },
            required: ["scenarioId"]
        }
    },
    {
        name: "make_list_scenarios",
        description: "List scenarios from Make.com with optional filtering by team or folder.",
        inputSchema: {
            type: "object" as const,
            properties: {
                teamId: {
                    type: "string",
                    description: "Filter by team ID (optional)"
                },
                folderId: {
                    type: "string",
                    description: "Filter by folder ID (optional)"
                },
                limit: {
                    type: "number",
                    description: "Maximum number of scenarios to return (optional)",
                    default: 100
                }
            },
            required: []
        }
    },
    {
        name: "make_delete_scenario",
        description: "Delete a scenario from Make.com. This action cannot be undone.",
        inputSchema: {
            type: "object" as const,
            properties: {
                scenarioId: {
                    type: "string",
                    description: "The ID of the scenario to delete"
                }
            },
            required: ["scenarioId"]
        }
    },
    {
        name: "make_clone_scenario",
        description: "Clone an existing scenario with a new name.",
        inputSchema: {
            type: "object" as const,
            properties: {
                scenarioId: {
                    type: "string",
                    description: "The ID of the scenario to clone"
                },
                newName: {
                    type: "string",
                    description: "Name for the cloned scenario (optional)"
                }
            },
            required: ["scenarioId"]
        }
    },
    {
        name: "make_activate_scenario",
        description: "Activate a scenario to start processing data according to its schedule or triggers.",
        inputSchema: {
            type: "object" as const,
            properties: {
                scenarioId: {
                    type: "string",
                    description: "The ID of the scenario to activate"
                }
            },
            required: ["scenarioId"]
        }
    },
    {
        name: "make_deactivate_scenario",
        description: "Deactivate a scenario to stop it from processing data.",
        inputSchema: {
            type: "object" as const,
            properties: {
                scenarioId: {
                    type: "string",
                    description: "The ID of the scenario to deactivate"
                }
            },
            required: ["scenarioId"]
        }
    },
    // ============================================================
    // Phase 6: Template Management Tools
    // ============================================================
    {
        name: "make_search_templates",
        description: "Search the Make.com template library. Find pre-built workflows by query, category, or apps.",
        inputSchema: {
            type: "object" as const,
            properties: {
                query: {
                    type: "string",
                    description: "Search query for template name or description (optional)"
                },
                category: {
                    type: "string",
                    description: "Filter by category (optional)"
                },
                apps: {
                    type: "array",
                    description: "Filter by apps used in template (optional)",
                    items: {
                        type: "string"
                    }
                },
                limit: {
                    type: "number",
                    description: "Maximum number of templates to return (default: 20)",
                    default: 20
                }
            },
            required: []
        }
    },
    {
        name: "make_get_template_detail",
        description: "Get detailed information about a specific template including full scenario structure.",
        inputSchema: {
            type: "object" as const,
            properties: {
                templateId: {
                    type: "string",
                    description: "The template ID"
                },
                mode: {
                    type: "string",
                    description: "Return mode: 'full' (complete scenario), 'metadata' (info only), or 'modules' (module list)",
                    enum: ["full", "metadata", "modules"],
                    default: "full"
                }
            },
            required: ["templateId"]
        }
    },
    {
        name: "make_template_to_scenario",
        description: "Convert a template to a ready-to-deploy scenario. Validates the scenario and provides fix suggestions if needed.",
        inputSchema: {
            type: "object" as const,
            properties: {
                templateId: {
                    type: "string",
                    description: "The template ID to convert"
                },
                scenarioName: {
                    type: "string",
                    description: "Name for the new scenario (optional)"
                }
            },
            required: ["templateId"]
        }
    },
    // ============================================================
    // Documentation Tool
    // ============================================================
    {
        name: "tools_documentation",
        description: "Get comprehensive documentation for all available MCP tools or a specific tool. Self-documenting API with examples.",
        inputSchema: {
            type: "object" as const,
            properties: {
                toolName: {
                    type: "string",
                    description: "Name of specific tool to get documentation for (optional). If not provided, returns documentation for all tools."
                }
            },
            required: []
        }
    }
];

/**
 * Tool documentation for the tools_documentation MCP method
 */
export const MAKE_TOOLS_DOCUMENTATION = {
    overview: "Make-MCP provides tools for working with Make.com (Integromat) workflow automation",
    tools: MAKE_TOOLS.map(tool => ({
        name: tool.name,
        description: tool.description,
        parameters: tool.inputSchema.properties,
        examples: getToolExamples(tool.name)
    }))
};

function getToolExamples(toolName: string): string[] {
    const examples: Record<string, string[]> = {
        search_make_modules: [
            'Search for HTTP modules: {"query": "http request"}',
            'Find Gmail actions: {"query": "gmail send", "module_type": "action"}',
            'Search in Communication category: {"query": "send message", "category": "Communication"}'
        ],
        get_module_essentials: [
            'Get details for HTTP module: {"moduleName": "http:ActionSendData", "includeExamples": true}',
            'Get Google Sheets module info: {"moduleName": "google-sheets:AddARow"}'
        ],
        validate_make_scenario: [
            'Validate scenario with balanced strictness: {"scenario": {...}, "profile": "balanced"}',
            'Strict validation: {"scenario": {...}, "profile": "strict"}'
        ],
        autofix_make_scenario: [
            'Auto-fix common errors: {"scenario": {...}}',
            'Fix with validation result: {"scenario": {...}, "validationResult": {...}}'
        ],
        list_make_templates: [
            'List all templates: {}',
            'List Communication templates: {"category": "Communication", "limit": 5}'
        ]
    };

    return examples[toolName] || [];
}

