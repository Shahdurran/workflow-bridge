/**
 * Type definitions for Workflow Translator
 */

export type Platform = 'n8n' | 'make' | 'zapier';

// n8n Types
export interface N8nWorkflow {
    name: string;
    nodes: N8nNode[];
    connections: N8nConnections;
    settings?: any;
    staticData?: any;
    tags?: string[];
    triggerCount?: number;
}

export interface N8nNode {
    id: string;
    name: string;
    type: string;
    typeVersion: number;
    position: [number, number];
    parameters: Record<string, any>;
    credentials?: Record<string, any>;
    webhookId?: string;
}

export interface N8nConnections {
    [nodeName: string]: {
        main: Array<Array<{
            node: string;
            type: string;
            index: number;
        }>>;
    };
}

// Make Types
export interface MakeScenario {
    name: string;
    flow: MakeModule[];
    metadata?: {
        description?: string;
        created_at?: string;
        created_by?: string;
        [key: string]: any;
    };
}

export interface MakeModule {
    id: number;
    module: string;
    version?: number;
    parameters?: Record<string, any>;
    mapper?: Record<string, any>;
    metadata?: {
        designer?: {
            x: number;
            y: number;
        };
        [key: string]: any;
    };
}

// Zapier Types
export interface ZapierZap {
    title: string;
    steps: ZapierStep[];
    status?: 'draft' | 'active' | 'paused';
    created_at?: string;
    created_by?: string;
}

export interface ZapierStep {
    id: string;
    type: 'trigger' | 'action';
    app: string;
    event: string;
    parameters: Record<string, any>;
}

// Translation Types
export interface TranslationRequest {
    workflow: any;
    sourcePlatform: Platform;
    targetPlatform: Platform;
    options?: TranslationOptions;
}

export interface TranslationOptions {
    optimize?: boolean;
    preserveNames?: boolean;
    addComments?: boolean;
    strictMode?: boolean;
}

export interface TranslationResult {
    success: boolean;
    workflow: any;
    sourcePlatform: Platform;
    targetPlatform: Platform;
    warnings: TranslationWarning[];
    errors: TranslationError[];
    metadata: TranslationMetadata;
}

export interface TranslationWarning {
    code: string;
    message: string;
    path?: string;
    suggestion?: string;
}

export interface TranslationError {
    code: string;
    message: string;
    path?: string;
    severity: 'error' | 'critical';
}

export interface TranslationMetadata {
    translated_nodes: number;
    skipped_nodes: number;
    optimizations_applied: string[];
    accuracy_score: number;
    feasibility_score: number;
    translation_time_ms: number;
}

// Mapping Types
export interface NodeMapping {
    sourceType: string;
    targetType: string;
    parameterMappings: ParameterMapping[];
    requiresAI?: boolean;
    notes?: string;
}

export interface ParameterMapping {
    sourceParam: string;
    targetParam: string;
    transform?: (value: any) => any;
    required?: boolean;
}

export interface TranslationContext {
    sourcePlatform: Platform;
    targetPlatform: Platform;
    availableNodes: any[];
    mappingRules: any;
    capabilities: any;
}

// Feasibility Types
export interface FeasibilityCheck {
    feasible: boolean;
    score: number;
    issues: FeasibilityIssue[];
    suggestions: string[];
}

export interface FeasibilityIssue {
    severity: 'blocker' | 'warning' | 'info';
    feature: string;
    message: string;
    workaround?: string;
}

