/**
 * Type definitions for Make-MCP
 */

export type ModuleType = 'trigger' | 'action' | 'search' | 'instant_trigger' | 'aggregator' | 'router' | 'transformer' | 'iterator' | 'repeater';

export interface MakeModule {
    id?: number;
    module_name: string;
    module_type: ModuleType;
    app_name: string;
    app_slug: string;
    description?: string;
    documentation?: string;
    parameters?: ModuleParameter[];
    examples?: any[];
    category?: string;
    popularity_score?: number;
    is_premium?: boolean;
}

export interface ModuleParameter {
    parameter_name: string;
    parameter_type: string;
    is_required: boolean;
    description?: string;
    default_value?: string;
    options?: any[];
    validation_rules?: any;
}

export interface MakeTemplate {
    id?: number;
    template_id: string;
    name: string;
    description?: string;
    modules?: string[];
    flow?: any;
    metadata?: any;
    category?: string;
    popularity_score?: number;
}

export interface ValidationResult {
    valid: boolean;
    errors: ValidationError[];
    warnings: ValidationWarning[];
}

export interface ValidationError {
    code: string;
    message: string;
    path?: string;
    severity: 'error';
    autoFixable?: boolean;
    fixConfidence?: FixConfidenceLevel;
    fixType?: FixType;
}

export interface ValidationWarning {
    code: string;
    message: string;
    path?: string;
    severity: 'warning';
    autoFixable?: boolean;
    fixConfidence?: FixConfidenceLevel;
    fixType?: FixType;
}

export interface MakeScenario {
    name: string;
    flow: MakeFlow[];
    metadata?: {
        instant?: boolean;
        version?: number;
        scenario?: {
            roundtrips?: number;
            maxErrors?: number;
            autoCommit?: boolean;
            autoCommitTriggerLast?: boolean;
            sequential?: boolean;
            slots?: number | null;
            confidential?: boolean;
            dataloss?: boolean;
            dlq?: boolean;
            freshVariables?: boolean;
        };
        designer?: {
            orphans?: any[];
        };
        zone?: string;
        notes?: any[];
        description?: string;
        created_at?: string;
        created_by?: string;
        [key: string]: any;
    };
}

export interface MakeFlow {
    id: number;
    module: string;
    version?: number;
    parameters?: Record<string, any>;
    mapper?: Record<string, any>;
    metadata?: {
        designer?: {
            x: number;
            y: number;
            messages?: Array<{
                category: string;
                severity: string;
                message: string;
            }>;
        };
        restore?: any;
        parameters?: any[];
        [key: string]: any;
    };
    routes?: Array<{
        flow: MakeFlow[];
        filter?: any;
    }>;
}

export interface SearchOptions {
    query: string;
    limit?: number;
    offset?: number;
    category?: string;
    module_type?: ModuleType;
    include_examples?: boolean;
}

export interface DatabaseStats {
    total_modules: number;
    total_templates: number;
    total_categories: number;
    total_apps: number;
    database_size: string;
}

// ==================== Enhanced Auto-Fix Types ====================

export type FixConfidenceLevel = 'high' | 'medium' | 'low';

export type FixType =
    | 'metadata'
    | 'mapper'
    | 'module-ids'
    | 'coordinates'
    | 'version'
    | 'scenario-settings'
    | 'router-routes'
    | 'parameters'
    | 'zone';

export interface FixOperation {
    module: string;
    moduleIndex: number;
    field: string;
    type: FixType;
    before: any;
    after: any;
    confidence: FixConfidenceLevel;
    description: string;
}

export interface AutoFixOptions {
    applyFixes?: boolean;
    confidenceThreshold?: FixConfidenceLevel;
    maxFixes?: number;
    fixTypes?: FixType[];
}

export interface FixReport {
    summary: string;
    totalFixes: number;
    fixesByType: Record<FixType, number>;
    fixesByConfidence: Record<FixConfidenceLevel, number>;
    fixes: FixOperation[];
}

export interface AutoFixResult {
    success: boolean;
    fixedScenario?: MakeScenario;
    originalValidation: ValidationResult;
    validationResult?: ValidationResult;
    fixReport: FixReport;
    error?: string;
}

