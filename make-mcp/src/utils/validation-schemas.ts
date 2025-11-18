/**
 * Validation Schemas using Zod
 * Type-safe validation for Make-MCP data structures
 */

import { z } from 'zod';

/**
 * Module Type Schema
 */
export const ModuleTypeSchema = z.enum([
  'trigger',
  'action',
  'search',
  'instant_trigger',
  'aggregator',
  'router',
  'transformer',
  'iterator',
  'repeater',
]);

/**
 * Module Parameter Schema
 */
export const ModuleParameterSchema = z.object({
  parameter_name: z.string(),
  parameter_type: z.string(),
  is_required: z.boolean(),
  description: z.string().optional(),
  default_value: z.string().optional(),
  options: z.array(z.any()).optional(),
  validation_rules: z.any().optional(),
});

/**
 * Make Module Schema
 */
export const MakeModuleSchema = z.object({
  id: z.number().optional(),
  module_name: z.string().min(1),
  module_type: ModuleTypeSchema,
  app_name: z.string().min(1),
  app_slug: z.string().min(1),
  description: z.string().optional(),
  documentation: z.string().optional(),
  parameters: z.array(ModuleParameterSchema).optional(),
  examples: z.array(z.any()).optional(),
  category: z.string().optional(),
  popularity_score: z.number().min(0).optional(),
  is_premium: z.boolean().optional(),
});

/**
 * Make Scenario Module Schema
 */
export const ScenarioModuleSchema = z.object({
  id: z.number(),
  module: z.string(),
  version: z.number().optional(),
  parameters: z.record(z.any()).optional(),
  mapper: z.record(z.any()).optional(),
  metadata: z.object({
    designer: z.object({
      x: z.number(),
      y: z.number(),
    }).optional(),
  }).optional(),
  routes: z.array(z.any()).optional(), // For router modules
});

/**
 * Make Scenario Schema
 */
export const MakeScenarioSchema = z.object({
  name: z.string().min(1),
  flow: z.array(ScenarioModuleSchema).min(1),
  metadata: z.object({
    instant: z.boolean().optional(),
    version: z.number().optional(),
    scenario: z.record(z.any()).optional(),
    designer: z.object({
      orphans: z.array(z.any()).optional(),
    }).optional(),
    zone: z.string().optional(),
    notes: z.array(z.any()).optional(),
    created_by: z.string().optional(),
    created_at: z.string().optional(),
  }).optional(),
});

/**
 * Validation Profile Schema
 */
export const ValidationProfileSchema = z.enum(['strict', 'balanced', 'permissive']);

/**
 * Auto-Fix Options Schema
 */
export const AutoFixOptionsSchema = z.object({
  applyFixes: z.boolean().default(true),
  confidenceThreshold: z.enum(['high', 'medium', 'low']).default('medium'),
  maxFixes: z.number().min(1).max(1000).default(50),
  fixTypes: z.array(z.enum([
    'metadata',
    'mapper',
    'module-ids',
    'coordinates',
    'version',
    'scenario-settings',
    'router-routes',
    'parameters',
    'zone',
  ])).optional(),
});

/**
 * Instance Context Schema
 */
export const InstanceContextSchema = z.object({
  makeApiUrl: z.string().url().optional(),
  makeApiToken: z.string().optional(),
  instanceId: z.string().optional(),
  organizationId: z.string().optional(),
  teamId: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

/**
 * Search Options Schema
 */
export const SearchOptionsSchema = z.object({
  query: z.string(),
  limit: z.number().min(1).max(100).default(10),
  category: z.string().optional(),
  module_type: ModuleTypeSchema.optional(),
  include_examples: z.boolean().default(false),
});

/**
 * Template Request Schema
 */
export const TemplateRequestSchema = z.object({
  templateId: z.string(),
  mode: z.enum(['full', 'metadata', 'modules']).default('full'),
});

/**
 * Validation helper functions
 */
export class Validator {
  /**
   * Validate data against schema
   */
  static validate<T>(schema: z.ZodSchema<T>, data: unknown): T {
    return schema.parse(data);
  }

  /**
   * Safe validate - returns result instead of throwing
   */
  static safeParse<T>(
    schema: z.ZodSchema<T>,
    data: unknown
  ): { success: true; data: T } | { success: false; error: z.ZodError } {
    const result = schema.safeParse(data);
    if (result.success) {
      return { success: true, data: result.data };
    }
    return { success: false, error: result.error };
  }

  /**
   * Get validation errors as string array
   */
  static getErrors(error: z.ZodError): string[] {
    return error.errors.map(err => {
      const path = err.path.join('.');
      return path ? `${path}: ${err.message}` : err.message;
    });
  }
}

/**
 * Type exports
 */
export type ModuleType = z.infer<typeof ModuleTypeSchema>;
export type ModuleParameter = z.infer<typeof ModuleParameterSchema>;
export type MakeModule = z.infer<typeof MakeModuleSchema>;
export type ScenarioModule = z.infer<typeof ScenarioModuleSchema>;
export type MakeScenario = z.infer<typeof MakeScenarioSchema>;
export type ValidationProfile = z.infer<typeof ValidationProfileSchema>;
export type AutoFixOptions = z.infer<typeof AutoFixOptionsSchema>;
export type InstanceContext = z.infer<typeof InstanceContextSchema>;
export type SearchOptions = z.infer<typeof SearchOptionsSchema>;
export type TemplateRequest = z.infer<typeof TemplateRequestSchema>;

