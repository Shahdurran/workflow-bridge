/**
 * Make Scenario Validator
 * Validates Make.com scenario JSON structures and provides auto-fix capabilities
 */

import { 
    MakeScenario, 
    MakeFlow, 
    ValidationResult, 
    ValidationError, 
    ValidationWarning,
    AutoFixResult,
    AutoFixOptions,
    FixOperation,
    FixReport,
    FixType,
    FixConfidenceLevel
} from '../types';
import { ModuleRepository } from '../database/module-repository';

export class MakeValidator {
    private repository: ModuleRepository;

    constructor(repository?: ModuleRepository) {
        this.repository = repository || new ModuleRepository();
    }

    /**
     * Validate a Make scenario
     */
    validateScenario(scenario: any, profile: 'strict' | 'balanced' | 'permissive' = 'balanced'): ValidationResult {
        const errors: ValidationError[] = [];
        const warnings: ValidationWarning[] = [];

        // Check required top-level fields
        if (!scenario.name || typeof scenario.name !== 'string') {
            errors.push({
                code: 'MISSING_NAME',
                message: 'Scenario must have a name',
                path: 'name',
                severity: 'error'
            });
        }

        if (!scenario.flow || !Array.isArray(scenario.flow)) {
            errors.push({
                code: 'MISSING_FLOW',
                message: 'Scenario must have a flow array',
                path: 'flow',
                severity: 'error'
            });
            return { valid: false, errors, warnings };
        }

        if (scenario.flow.length === 0) {
            errors.push({
                code: 'EMPTY_FLOW',
                message: 'Scenario flow cannot be empty',
                path: 'flow',
                severity: 'error'
            });
            return { valid: false, errors, warnings };
        }

        // Validate each module in flow
        scenario.flow.forEach((module: any, index: number) => {
            const moduleErrors = this.validateModule(module, index, profile);
            errors.push(...moduleErrors.errors);
            warnings.push(...moduleErrors.warnings);
        });

        // Validate module IDs are sequential
        const idErrors = this.validateModuleIds(scenario.flow);
        errors.push(...idErrors);

        // Check for trigger module (first module should be a trigger)
        const firstModule = scenario.flow[0];
        if (firstModule && !this.isTriggerModule(firstModule.module)) {
            if (profile === 'strict') {
                errors.push({
                    code: 'MISSING_TRIGGER',
                    message: 'First module should be a trigger',
                    path: 'flow[0]',
                    severity: 'error'
                });
            } else {
                warnings.push({
                    code: 'MISSING_TRIGGER',
                    message: 'First module should typically be a trigger',
                    path: 'flow[0]',
                    severity: 'warning'
                });
            }
        }

        // Check scenario complexity limits
        if (scenario.flow.length > 1000) {
            errors.push({
                code: 'TOO_MANY_MODULES',
                message: 'Scenario has too many modules (max 1000)',
                path: 'flow',
                severity: 'error'
            });
        } else if (scenario.flow.length > 100) {
            warnings.push({
                code: 'LARGE_SCENARIO',
                message: 'Scenario has many modules, consider breaking into smaller scenarios',
                path: 'flow',
                severity: 'warning'
            });
        }

        // Validate metadata structure (Make.com required fields)
        const metadataErrors = this.validateMetadata(scenario.metadata, profile);
        errors.push(...metadataErrors.errors);
        warnings.push(...metadataErrors.warnings);

        return {
            valid: errors.length === 0,
            errors,
            warnings
        };
    }

    /**
     * Validate scenario metadata
     */
    private validateMetadata(metadata: any, profile: string): { errors: ValidationError[]; warnings: ValidationWarning[] } {
        const errors: ValidationError[] = [];
        const warnings: ValidationWarning[] = [];

        if (!metadata) {
            if (profile === 'strict') {
                errors.push({
                    code: 'MISSING_METADATA',
                    message: 'Scenario must have metadata object',
                    path: 'metadata',
                    severity: 'error'
                });
            } else {
                warnings.push({
                    code: 'MISSING_METADATA',
                    message: 'Scenario should have metadata object',
                    path: 'metadata',
                    severity: 'warning'
                });
            }
            return { errors, warnings };
        }

        // Check for required Make.com metadata fields
        if (metadata.instant === undefined) {
            warnings.push({
                code: 'MISSING_INSTANT_FLAG',
                message: 'metadata.instant field is missing (will be auto-generated)',
                path: 'metadata.instant',
                severity: 'warning'
            });
        }

        if (!metadata.zone) {
            warnings.push({
                code: 'MISSING_ZONE',
                message: 'metadata.zone field is missing (will default to eu2.make.com)',
                path: 'metadata.zone',
                severity: 'warning'
            });
        }

        if (!metadata.notes) {
            warnings.push({
                code: 'MISSING_NOTES',
                message: 'metadata.notes array is missing (will be initialized as empty array)',
                path: 'metadata.notes',
                severity: 'warning'
            });
        }

        if (!metadata.designer || !metadata.designer.orphans) {
            warnings.push({
                code: 'MISSING_ORPHANS',
                message: 'metadata.designer.orphans array is missing (will be initialized as empty array)',
                path: 'metadata.designer.orphans',
                severity: 'warning'
            });
        }

        if (!metadata.scenario) {
            warnings.push({
                code: 'MISSING_SCENARIO_SETTINGS',
                message: 'metadata.scenario settings are missing (will use defaults)',
                path: 'metadata.scenario',
                severity: 'warning'
            });
        }

        return { errors, warnings };
    }

    /**
     * Validate a single module
     */
    private validateModule(module: any, index: number, profile: string): { errors: ValidationError[]; warnings: ValidationWarning[] } {
        const errors: ValidationError[] = [];
        const warnings: ValidationWarning[] = [];
        const path = `flow[${index}]`;

        // Check required fields
        if (!module.id || typeof module.id !== 'number') {
            errors.push({
                code: 'MISSING_MODULE_ID',
                message: 'Module must have a numeric id',
                path: `${path}.id`,
                severity: 'error'
            });
        }

        if (!module.module || typeof module.module !== 'string') {
            errors.push({
                code: 'MISSING_MODULE_TYPE',
                message: 'Module must have a module type string',
                path: `${path}.module`,
                severity: 'error'
            });
        }

        // Validate module exists in database
        if (module.module) {
            const moduleData = this.repository.getModuleByName(module.module);
            if (!moduleData) {
                if (profile === 'strict') {
                    errors.push({
                        code: 'UNKNOWN_MODULE',
                        message: `Module type '${module.module}' not found in database`,
                        path: `${path}.module`,
                        severity: 'error'
                    });
                } else {
                    warnings.push({
                        code: 'UNKNOWN_MODULE',
                        message: `Module type '${module.module}' not found in database`,
                        path: `${path}.module`,
                        severity: 'warning'
                    });
                }
            } else {
                // Validate required parameters
                const paramErrors = this.validateModuleParameters(module, moduleData, index, profile);
                errors.push(...paramErrors.errors);
                warnings.push(...paramErrors.warnings);
            }
        }

        // Check for metadata
        if (!module.metadata) {
            if (profile === 'strict') {
                errors.push({
                    code: 'MISSING_METADATA',
                    message: 'Module should have metadata with designer coordinates',
                    path: `${path}.metadata`,
                    severity: 'error'
                });
            } else {
                warnings.push({
                    code: 'MISSING_METADATA',
                    message: 'Module should have metadata with designer coordinates',
                    path: `${path}.metadata`,
                    severity: 'warning'
                });
            }
        } else if (!module.metadata.designer) {
            warnings.push({
                code: 'MISSING_DESIGNER_COORDS',
                message: 'Module metadata should include designer coordinates (x, y)',
                path: `${path}.metadata.designer`,
                severity: 'warning'
            });
        }

        // Validate router modules have routes
        if (this.isRouterModule(module.module)) {
            const routerErrors = this.validateRouterModule(module, index, profile);
            errors.push(...routerErrors.errors);
            warnings.push(...routerErrors.warnings);
        }

        return { errors, warnings };
    }

    /**
     * Check if module is a router type
     */
    private isRouterModule(moduleType: string): boolean {
        return moduleType.toLowerCase().includes('router');
    }

    /**
     * Validate router module structure
     */
    private validateRouterModule(module: any, index: number, profile: string): { errors: ValidationError[]; warnings: ValidationWarning[] } {
        const errors: ValidationError[] = [];
        const warnings: ValidationWarning[] = [];
        const path = `flow[${index}]`;

        if (!module.routes || !Array.isArray(module.routes)) {
            if (profile === 'strict' || profile === 'balanced') {
                errors.push({
                    code: 'MISSING_ROUTES',
                    message: 'Router module must have a routes array',
                    path: `${path}.routes`,
                    severity: 'error'
                });
            } else {
                warnings.push({
                    code: 'MISSING_ROUTES',
                    message: 'Router module should have a routes array',
                    path: `${path}.routes`,
                    severity: 'warning'
                });
            }
            return { errors, warnings };
        }

        if (module.routes.length === 0) {
            warnings.push({
                code: 'EMPTY_ROUTES',
                message: 'Router has no routes defined',
                path: `${path}.routes`,
                severity: 'warning'
            });
        }

        // Validate each route
        module.routes.forEach((route: any, routeIndex: number) => {
            if (!route.flow || !Array.isArray(route.flow)) {
                errors.push({
                    code: 'INVALID_ROUTE',
                    message: `Route ${routeIndex} must have a flow array`,
                    path: `${path}.routes[${routeIndex}].flow`,
                    severity: 'error'
                });
            }
        });

        return { errors, warnings };
    }

    /**
     * Validate module parameters against schema
     */
    private validateModuleParameters(
        module: any,
        moduleData: any,
        index: number,
        profile: string
    ): { errors: ValidationError[]; warnings: ValidationWarning[] } {
        const errors: ValidationError[] = [];
        const warnings: ValidationWarning[] = [];
        const path = `flow[${index}].parameters`;

        if (!moduleData.parameters || moduleData.parameters.length === 0) {
            return { errors, warnings };
        }

        const parameters = module.parameters || {};
        const requiredParams = moduleData.parameters.filter((p: any) => p.is_required);

        // Check required parameters
        for (const requiredParam of requiredParams) {
            if (!parameters[requiredParam.parameter_name]) {
                if (profile === 'strict' || profile === 'balanced') {
                    errors.push({
                        code: 'MISSING_REQUIRED_PARAMETER',
                        message: `Missing required parameter: ${requiredParam.parameter_name}`,
                        path: `${path}.${requiredParam.parameter_name}`,
                        severity: 'error'
                    });
                } else {
                    warnings.push({
                        code: 'MISSING_REQUIRED_PARAMETER',
                        message: `Missing required parameter: ${requiredParam.parameter_name}`,
                        path: `${path}.${requiredParam.parameter_name}`,
                        severity: 'warning'
                    });
                }
            }
        }

        return { errors, warnings };
    }

    /**
     * Validate module IDs are sequential starting from 1
     */
    private validateModuleIds(flow: MakeFlow[]): ValidationError[] {
        const errors: ValidationError[] = [];
        const ids = flow.map(m => m.id);
        
        // Check for duplicate IDs
        const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
        if (duplicates.length > 0) {
            errors.push({
                code: 'DUPLICATE_MODULE_IDS',
                message: `Duplicate module IDs found: ${[...new Set(duplicates)].join(', ')}`,
                path: 'flow',
                severity: 'error'
            });
        }

        // Check IDs start from 1 and are sequential
        const sortedIds = [...ids].sort((a, b) => a - b);
        if (sortedIds[0] !== 1) {
            errors.push({
                code: 'INVALID_MODULE_ID_START',
                message: 'Module IDs should start from 1',
                path: 'flow',
                severity: 'error'
            });
        }

        for (let i = 0; i < sortedIds.length - 1; i++) {
            if (sortedIds[i + 1] - sortedIds[i] !== 1) {
                errors.push({
                    code: 'NON_SEQUENTIAL_MODULE_IDS',
                    message: 'Module IDs should be sequential',
                    path: 'flow',
                    severity: 'error'
                });
                break;
            }
        }

        return errors;
    }

    /**
     * Check if module is a trigger type
     */
    private isTriggerModule(moduleType: string): boolean {
        const triggerKeywords = ['watch', 'trigger', 'webhook', 'schedule'];
        const lowerType = moduleType.toLowerCase();
        return triggerKeywords.some(keyword => lowerType.includes(keyword));
    }

    /**
     * Auto-fix common scenario errors
     */
    autoFixScenario(scenario: any, errors: ValidationError[]): MakeScenario {
        const fixed = JSON.parse(JSON.stringify(scenario)); // Deep clone

        // Fix missing name
        if (!fixed.name) {
            fixed.name = 'Untitled Scenario';
        }

        // Fix missing flow
        if (!fixed.flow) {
            fixed.flow = [];
        }

        // Fix module IDs
        if (fixed.flow && fixed.flow.length > 0) {
            fixed.flow = fixed.flow.map((module: any, index: number) => ({
                ...module,
                id: index + 1
            }));
        }

        // Add default metadata structure if missing
        if (!fixed.metadata) {
            fixed.metadata = {};
        }

        // Add metadata.instant field (required for Make.com)
        if (fixed.metadata.instant === undefined) {
            const firstModule = fixed.flow && fixed.flow[0];
            const isInstantTrigger = firstModule && (
                firstModule.module.includes('webhook') ||
                firstModule.module.includes('gateway') ||
                firstModule.module.includes('CustomWebHook')
            );
            fixed.metadata.instant = isInstantTrigger || false;
        }

        // Add metadata.version (required)
        if (!fixed.metadata.version) {
            fixed.metadata.version = 1;
        }

        // Add metadata.scenario with all required fields
        if (!fixed.metadata.scenario) {
            fixed.metadata.scenario = {};
        }
        const scenarioSettings = fixed.metadata.scenario;
        scenarioSettings.roundtrips = scenarioSettings.roundtrips || (fixed.flow ? fixed.flow.length : 1);
        scenarioSettings.maxErrors = scenarioSettings.maxErrors !== undefined ? scenarioSettings.maxErrors : 3;
        scenarioSettings.autoCommit = scenarioSettings.autoCommit !== undefined ? scenarioSettings.autoCommit : true;
        scenarioSettings.autoCommitTriggerLast = scenarioSettings.autoCommitTriggerLast !== undefined ? scenarioSettings.autoCommitTriggerLast : true;
        scenarioSettings.sequential = scenarioSettings.sequential !== undefined ? scenarioSettings.sequential : false;
        scenarioSettings.slots = scenarioSettings.slots !== undefined ? scenarioSettings.slots : null;
        scenarioSettings.confidential = scenarioSettings.confidential !== undefined ? scenarioSettings.confidential : false;
        scenarioSettings.dataloss = scenarioSettings.dataloss !== undefined ? scenarioSettings.dataloss : false;
        scenarioSettings.dlq = scenarioSettings.dlq !== undefined ? scenarioSettings.dlq : false;
        scenarioSettings.freshVariables = scenarioSettings.freshVariables !== undefined ? scenarioSettings.freshVariables : false;

        // Add metadata.designer with orphans array (required)
        if (!fixed.metadata.designer) {
            fixed.metadata.designer = {};
        }
        if (!fixed.metadata.designer.orphans) {
            fixed.metadata.designer.orphans = [];
        }

        // Add metadata.zone (required)
        if (!fixed.metadata.zone) {
            fixed.metadata.zone = 'eu2.make.com';
        }

        // Add metadata.notes array (required)
        if (!fixed.metadata.notes) {
            fixed.metadata.notes = [];
        }

        // Add creation metadata
        if (!fixed.metadata.created_by) {
            fixed.metadata.created_by = 'make-mcp';
        }
        if (!fixed.metadata.created_at) {
            fixed.metadata.created_at = new Date().toISOString();
        }

        // Fix flow modules
        if (fixed.flow) {
            fixed.flow = fixed.flow.map((module: any, index: number) => {
                // Add module metadata if missing
                if (!module.metadata) {
                    module.metadata = {};
                }

                // Add designer coordinates
                if (!module.metadata.designer) {
                    module.metadata.designer = {
                        x: 150 * index,
                        y: 0
                    };
                }

                // Add version if missing
                if (!module.version) {
                    module.version = 1;
                }

                // Generate mapper field with {{}} syntax for non-trigger modules
                if (index > 0 && !module.mapper) {
                    module.mapper = this.generateMapper(module, index, fixed.flow);
                } else if (index === 0 && !module.mapper) {
                    module.mapper = {}; // Triggers have empty mapper
                }

                // Initialize parameters if missing
                if (!module.parameters) {
                    module.parameters = {};
                }

                return module;
            });
        }

        return fixed as MakeScenario;
    }

    /**
     * Generate mapper field with Make.com {{moduleId.field}} syntax
     */
    private generateMapper(module: any, moduleIndex: number, flow: any[]): Record<string, any> {
        const mapper: Record<string, any> = {};
        
        if (!module.parameters) {
            return mapper;
        }

        // Get previous module for data reference
        const previousModuleId = moduleIndex; // Previous module's ID (1-indexed already)
        
        // For each parameter, generate appropriate mapper value
        Object.keys(module.parameters).forEach(key => {
            const value = module.parameters[key];
            
            // Check if this is a field that should reference previous module data
            if (this.shouldGenerateMapping(key, value)) {
                // Generate mapping like {{1.data}} or {{1.field_name}}
                mapper[key] = `{{${previousModuleId}.${this.inferFieldName(key, value)}}}`;
            } else {
                // Use the parameter value as-is
                mapper[key] = value;
            }
        });

        return mapper;
    }

    /**
     * Determine if a parameter should have a mapping generated
     */
    private shouldGenerateMapping(paramKey: string, paramValue: any): boolean {
        // Don't generate mappings for empty values or already mapped values
        if (!paramValue || (typeof paramValue === 'string' && paramValue.includes('{{'))) {
            return false;
        }

        // Generate mappings for common data-carrying parameters
        const dataMappingKeys = [
            'data', 'body', 'content', 'message', 'text', 'value',
            'input', 'payload', 'item', 'record', 'fields'
        ];

        return dataMappingKeys.some(key => paramKey.toLowerCase().includes(key));
    }

    /**
     * Infer field name from parameter key
     */
    private inferFieldName(paramKey: string, paramValue: any): string {
        // If value looks like a field path, use it
        if (typeof paramValue === 'string' && paramValue.includes('.')) {
            return paramValue;
        }

        // Default to 'data' for most cases
        return 'data';
    }

    /**
     * Enhanced auto-fix with detailed reporting and control
     */
    async autoFixScenarioEnhanced(
        scenario: any,
        options: AutoFixOptions = {}
    ): Promise<AutoFixResult> {
        const {
            applyFixes = true,
            confidenceThreshold = 'medium',
            maxFixes = 50,
            fixTypes
        } = options;

        // Step 1: Validate original scenario
        const originalValidation = this.validateScenario(scenario, 'balanced');

        // Step 2: Track all fixes
        const fixes: FixOperation[] = [];
        let fixed = JSON.parse(JSON.stringify(scenario)); // Deep clone

        try {
            // Fix missing name (HIGH confidence)
            if (!fixed.name) {
                fixes.push({
                    module: 'scenario',
                    moduleIndex: -1,
                    field: 'name',
                    type: 'metadata',
                    before: undefined,
                    after: 'Untitled Scenario',
                    confidence: 'high',
                    description: 'Added missing scenario name'
                });
                fixed.name = 'Untitled Scenario';
            }

            // Fix missing flow (HIGH confidence)
            if (!fixed.flow) {
                fixes.push({
                    module: 'scenario',
                    moduleIndex: -1,
                    field: 'flow',
                    type: 'metadata',
                    before: undefined,
                    after: [],
                    confidence: 'high',
                    description: 'Added missing flow array'
                });
                fixed.flow = [];
            }

            // Fix module IDs (HIGH confidence)
            if (fixed.flow && fixed.flow.length > 0) {
                const oldIds = fixed.flow.map((m: any) => m.id);
                fixed.flow = fixed.flow.map((module: any, index: number) => ({
                    ...module,
                    id: index + 1
                }));
                
                if (JSON.stringify(oldIds) !== JSON.stringify(fixed.flow.map((m: any) => m.id))) {
                    fixes.push({
                        module: 'flow',
                        moduleIndex: -1,
                        field: 'id',
                        type: 'module-ids',
                        before: oldIds,
                        after: fixed.flow.map((m: any) => m.id),
                        confidence: 'high',
                        description: 'Fixed module IDs to be sequential starting from 1'
                    });
                }
            }

            // Add/fix metadata structure (HIGH confidence)
            if (!fixed.metadata) {
                fixes.push({
                    module: 'scenario',
                    moduleIndex: -1,
                    field: 'metadata',
                    type: 'metadata',
                    before: undefined,
                    after: {},
                    confidence: 'high',
                    description: 'Added missing metadata object'
                });
                fixed.metadata = {};
            }

            // Fix metadata.instant (HIGH confidence)
            if (fixed.metadata.instant === undefined) {
                const firstModule = fixed.flow && fixed.flow[0];
                const isInstantTrigger = firstModule && (
                    firstModule.module.includes('webhook') ||
                    firstModule.module.includes('gateway') ||
                    firstModule.module.includes('CustomWebHook')
                );
                
                fixes.push({
                    module: 'scenario',
                    moduleIndex: -1,
                    field: 'metadata.instant',
                    type: 'metadata',
                    before: undefined,
                    after: isInstantTrigger || false,
                    confidence: 'high',
                    description: `Set instant flag to ${isInstantTrigger || false} based on trigger type`
                });
                fixed.metadata.instant = isInstantTrigger || false;
            }

            // Fix metadata.version (HIGH confidence)
            if (!fixed.metadata.version) {
                fixes.push({
                    module: 'scenario',
                    moduleIndex: -1,
                    field: 'metadata.version',
                    type: 'metadata',
                    before: undefined,
                    after: 1,
                    confidence: 'high',
                    description: 'Added scenario version'
                });
                fixed.metadata.version = 1;
            }

            // Fix metadata.scenario settings (HIGH confidence)
            if (!fixed.metadata.scenario) {
                fixed.metadata.scenario = {};
            }
            
            const scenarioDefaults = {
                roundtrips: fixed.flow ? fixed.flow.length : 1,
                maxErrors: 3,
                autoCommit: true,
                autoCommitTriggerLast: true,
                sequential: false,
                slots: null,
                confidential: false,
                dataloss: false,
                dlq: false,
                freshVariables: false
            };

            const settingsFixed: string[] = [];
            for (const [key, defaultValue] of Object.entries(scenarioDefaults)) {
                if (fixed.metadata.scenario[key] === undefined) {
                    fixed.metadata.scenario[key] = defaultValue;
                    settingsFixed.push(key);
                }
            }

            if (settingsFixed.length > 0) {
                fixes.push({
                    module: 'scenario',
                    moduleIndex: -1,
                    field: 'metadata.scenario',
                    type: 'scenario-settings',
                    before: undefined,
                    after: scenarioDefaults,
                    confidence: 'high',
                    description: `Added ${settingsFixed.length} scenario settings: ${settingsFixed.join(', ')}`
                });
            }

            // Fix metadata.designer.orphans (HIGH confidence)
            if (!fixed.metadata.designer) {
                fixed.metadata.designer = {};
            }
            if (!fixed.metadata.designer.orphans) {
                fixes.push({
                    module: 'scenario',
                    moduleIndex: -1,
                    field: 'metadata.designer.orphans',
                    type: 'metadata',
                    before: undefined,
                    after: [],
                    confidence: 'high',
                    description: 'Added designer orphans array'
                });
                fixed.metadata.designer.orphans = [];
            }

            // Fix metadata.zone (HIGH confidence)
            if (!fixed.metadata.zone) {
                fixes.push({
                    module: 'scenario',
                    moduleIndex: -1,
                    field: 'metadata.zone',
                    type: 'zone',
                    before: undefined,
                    after: 'eu2.make.com',
                    confidence: 'high',
                    description: 'Added default Make.com zone'
                });
                fixed.metadata.zone = 'eu2.make.com';
            }

            // Fix metadata.notes (HIGH confidence)
            if (!fixed.metadata.notes) {
                fixes.push({
                    module: 'scenario',
                    moduleIndex: -1,
                    field: 'metadata.notes',
                    type: 'metadata',
                    before: undefined,
                    after: [],
                    confidence: 'high',
                    description: 'Added notes array'
                });
                fixed.metadata.notes = [];
            }

            // Add creation metadata (HIGH confidence)
            if (!fixed.metadata.created_by) {
                fixed.metadata.created_by = 'make-mcp';
            }
            if (!fixed.metadata.created_at) {
                fixed.metadata.created_at = new Date().toISOString();
            }

            // Fix flow modules
            if (fixed.flow) {
                fixed.flow = fixed.flow.map((module: any, index: number) => {
                    const moduleFixes: string[] = [];

                    // Add module metadata (HIGH confidence)
                    if (!module.metadata) {
                        module.metadata = {};
                        moduleFixes.push('metadata');
                    }

                    // Add designer coordinates (HIGH confidence)
                    const oldCoords = module.metadata.designer ? { ...module.metadata.designer } : undefined;
                    if (!module.metadata.designer) {
                        module.metadata.designer = {
                            x: 150 * index,
                            y: 0
                        };
                        
                        fixes.push({
                            module: module.module || `Module ${index + 1}`,
                            moduleIndex: index,
                            field: 'metadata.designer',
                            type: 'coordinates',
                            before: oldCoords,
                            after: module.metadata.designer,
                            confidence: 'high',
                            description: `Added designer coordinates (${module.metadata.designer.x}, ${module.metadata.designer.y})`
                        });
                    }

                    // Add version (HIGH confidence)
                    if (!module.version) {
                        fixes.push({
                            module: module.module || `Module ${index + 1}`,
                            moduleIndex: index,
                            field: 'version',
                            type: 'version',
                            before: undefined,
                            after: 1,
                            confidence: 'high',
                            description: 'Added module version'
                        });
                        module.version = 1;
                    }

                    // Generate mapper (MEDIUM confidence for data mapping)
                    const oldMapper = module.mapper;
                    if (index > 0 && !module.mapper) {
                        module.mapper = this.generateMapper(module, index, fixed.flow);
                        
                        if (Object.keys(module.mapper).length > 0) {
                            fixes.push({
                                module: module.module || `Module ${index + 1}`,
                                moduleIndex: index,
                                field: 'mapper',
                                type: 'mapper',
                                before: oldMapper,
                                after: module.mapper,
                                confidence: 'medium',
                                description: 'Generated mapper with Make.com {{moduleId.field}} syntax'
                            });
                        }
                    } else if (index === 0 && !module.mapper) {
                        module.mapper = {};
                        
                        fixes.push({
                            module: module.module || `Module ${index + 1}`,
                            moduleIndex: index,
                            field: 'mapper',
                            type: 'mapper',
                            before: oldMapper,
                            after: {},
                            confidence: 'high',
                            description: 'Added empty mapper for trigger module'
                        });
                    }

                    // Initialize parameters (HIGH confidence)
                    if (!module.parameters) {
                        fixes.push({
                            module: module.module || `Module ${index + 1}`,
                            moduleIndex: index,
                            field: 'parameters',
                            type: 'parameters',
                            before: undefined,
                            after: {},
                            confidence: 'high',
                            description: 'Initialized parameters object'
                        });
                        module.parameters = {};
                    }

                    return module;
                });
            }

            // Filter fixes based on options
            let filteredFixes = fixes;

            // Filter by confidence threshold
            const confidenceLevels: FixConfidenceLevel[] = ['high', 'medium', 'low'];
            const thresholdIndex = confidenceLevels.indexOf(confidenceThreshold);
            filteredFixes = filteredFixes.filter(fix => {
                const fixIndex = confidenceLevels.indexOf(fix.confidence);
                return fixIndex <= thresholdIndex;
            });

            // Filter by fix types
            if (fixTypes && fixTypes.length > 0) {
                filteredFixes = filteredFixes.filter(fix => fixTypes.includes(fix.type));
            }

            // Apply max fixes limit
            filteredFixes = filteredFixes.slice(0, maxFixes);

            // Calculate statistics
            const stats = this.calculateFixStats(filteredFixes);

            // Step 3: Re-validate if fixes were applied
            let validationResult: ValidationResult | undefined;
            if (applyFixes) {
                validationResult = this.validateScenario(fixed, 'balanced');
            }

            return {
                success: true,
                fixedScenario: applyFixes ? fixed : undefined,
                originalValidation,
                validationResult,
                fixReport: {
                    summary: this.generateFixSummary(stats),
                    totalFixes: filteredFixes.length,
                    fixesByType: stats.byType,
                    fixesByConfidence: stats.byConfidence,
                    fixes: filteredFixes
                }
            };

        } catch (error) {
            return {
                success: false,
                originalValidation,
                fixReport: {
                    summary: 'Auto-fix failed',
                    totalFixes: 0,
                    fixesByType: {} as Record<FixType, number>,
                    fixesByConfidence: { high: 0, medium: 0, low: 0 },
                    fixes: []
                },
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    /**
     * Calculate fix statistics
     */
    private calculateFixStats(fixes: FixOperation[]): {
        byType: Record<FixType, number>;
        byConfidence: Record<FixConfidenceLevel, number>;
    } {
        const byType: Record<string, number> = {};
        const byConfidence: Record<string, number> = {
            high: 0,
            medium: 0,
            low: 0
        };

        for (const fix of fixes) {
            byType[fix.type] = (byType[fix.type] || 0) + 1;
            byConfidence[fix.confidence]++;
        }

        return {
            byType: byType as Record<FixType, number>,
            byConfidence: byConfidence as Record<FixConfidenceLevel, number>
        };
    }

    /**
     * Generate fix summary
     */
    private generateFixSummary(stats: {
        byType: Record<FixType, number>;
        byConfidence: Record<FixConfidenceLevel, number>;
    }): string {
        const total = Object.values(stats.byType).reduce((sum, count) => sum + count, 0);
        
        if (total === 0) {
            return 'No fixes needed';
        }

        const parts: string[] = [];
        
        for (const [type, count] of Object.entries(stats.byType)) {
            if (count > 0) {
                parts.push(`${count} ${type}`);
            }
        }

        if (parts.length === 0) {
            return `Fixed ${total} ${total === 1 ? 'issue' : 'issues'}`;
        }

        return `Fixed ${total} ${total === 1 ? 'issue' : 'issues'}: ${parts.join(', ')}`;
    }

    /**
     * Close repository connection
     */
    close(): void {
        this.repository.close();
    }
}

