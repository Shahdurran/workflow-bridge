/**
 * Expression Validator for Make.com
 * Validates Make.com expressions like {{moduleId.field}}
 * Based on n8n-mcp's ExpressionValidator
 */

import { MakeScenario, MakeFlow, ValidationError as ValidationErrorType, ValidationWarning } from '../types/index';
import { Logger } from '../utils/logger';

const logger = new Logger({ prefix: '[ExpressionValidator]' });

/**
 * Expression context for validation
 */
export interface ExpressionContext {
  availableModules: Array<{ id: number; module: string }>;
  currentModuleId?: number;
  isInRoute?: boolean;
  hasInputData?: boolean;
}

/**
 * Expression validation result
 */
export interface ExpressionValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  usedModules: Set<number>;
  usedFields: Set<string>;
}

/**
 * Expression Validator
 */
export class ExpressionValidator {
  // Make.com expression pattern: {{moduleId.field.subfield}}
  private static readonly EXPRESSION_PATTERN = /\{\{(\d+)\.([a-zA-Z_][\w.[\]'"]*)\}\}/g;
  
  // Function call pattern: {{functionName(args)}}
  private static readonly FUNCTION_PATTERN = /\{\{([a-zA-Z_][\w]*)\((.*?)\)\}\}/g;
  
  // Built-in variables pattern
  private static readonly BUILTIN_PATTERN = /\{\{(now|timestamp|date|random|math\.[a-zA-Z_][\w]*)\}\}/g;

  /**
   * Validate a single expression string
   */
  static validateExpression(
    expression: string,
    context: ExpressionContext
  ): ExpressionValidationResult {
    const result: ExpressionValidationResult = {
      valid: true,
      errors: [],
      warnings: [],
      usedModules: new Set(),
      usedFields: new Set(),
    };

    if (!expression || typeof expression !== 'string') {
      return result;
    }

    // Extract all expressions
    const expressions = this.extractExpressions(expression);

    for (const expr of expressions) {
      this.validateSingleExpression(expr, context, result);
    }

    result.valid = result.errors.length === 0;
    return result;
  }

  /**
   * Extract all expressions from a string
   */
  private static extractExpressions(text: string): string[] {
    const expressions: string[] = [];
    const regex = /\{\{[^}]+\}\}/g;
    let match;

    while ((match = regex.exec(text)) !== null) {
      expressions.push(match[0]);
    }

    return expressions;
  }

  /**
   * Validate a single expression
   */
  private static validateSingleExpression(
    expr: string,
    context: ExpressionContext,
    result: ExpressionValidationResult
  ): void {
    // Remove {{ }} wrapper
    const innerExpr = expr.slice(2, -2).trim();

    // Check for empty expression
    if (!innerExpr) {
      result.errors.push('Empty expression: {{}}');
      return;
    }

    // Check for built-in variables
    if (this.isBuiltInExpression(innerExpr)) {
      return; // Built-in expressions are always valid
    }

    // Check for function calls
    if (this.isFunctionCall(innerExpr)) {
      this.validateFunctionCall(innerExpr, context, result);
      return;
    }

    // Check for module reference: moduleId.field
    const moduleRefMatch = /^(\d+)\.(.+)$/.exec(innerExpr);
    if (moduleRefMatch) {
      const moduleId = parseInt(moduleRefMatch[1], 10);
      const fieldPath = moduleRefMatch[2];

      // Track used module
      result.usedModules.add(moduleId);
      result.usedFields.add(`${moduleId}.${fieldPath}`);

      // Check if module exists
      const moduleExists = context.availableModules.some(m => m.id === moduleId);
      if (!moduleExists) {
        result.errors.push(
          `Module ${moduleId} not found. Expression: ${expr}`
        );
        return;
      }

      // Check if referencing self (which may cause issues)
      if (moduleId === context.currentModuleId) {
        result.warnings.push(
          `Module ${moduleId} references itself. This may cause issues. Expression: ${expr}`
        );
      }

      // Validate field path syntax
      this.validateFieldPath(fieldPath, result, expr);

      return;
    }

    // Unknown expression format
    result.warnings.push(
      `Unknown expression format: ${expr}. Expected {{moduleId.field}} or {{function()}}`
    );
  }

  /**
   * Check if expression is a built-in variable
   */
  private static isBuiltInExpression(expr: string): boolean {
    const builtIns = [
      'now',
      'timestamp',
      'date',
      'random',
      'uuid',
    ];

    // Check exact matches
    if (builtIns.includes(expr)) {
      return true;
    }

    // Check math functions
    if (expr.startsWith('math.')) {
      return true;
    }

    // Check date functions
    if (expr.startsWith('date.')) {
      return true;
    }

    return false;
  }

  /**
   * Check if expression is a function call
   */
  private static isFunctionCall(expr: string): boolean {
    return /^[a-zA-Z_][\w]*\(.*\)$/.test(expr);
  }

  /**
   * Validate function call
   */
  private static validateFunctionCall(
    expr: string,
    context: ExpressionContext,
    result: ExpressionValidationResult
  ): void {
    const match = /^([a-zA-Z_][\w]*)\((.*)\)$/.exec(expr);
    if (!match) {
      result.errors.push(`Invalid function call syntax: {{${expr}}}`);
      return;
    }

    const functionName = match[1];
    const args = match[2];

    // List of known Make.com functions
    const knownFunctions = [
      'formatDate',
      'parseDate',
      'addDays',
      'addHours',
      'addMinutes',
      'substring',
      'replace',
      'trim',
      'upper',
      'lower',
      'length',
      'contains',
      'split',
      'join',
      'toString',
      'toNumber',
      'round',
      'ceil',
      'floor',
      'abs',
      'min',
      'max',
      'if',
      'ifempty',
      'get',
      'set',
      'omit',
      'pick',
    ];

    if (!knownFunctions.includes(functionName)) {
      result.warnings.push(
        `Unknown function '${functionName}'. It may not be supported by Make.com.`
      );
    }

    // Check if arguments reference modules
    if (args) {
      const argExpressions = this.extractExpressions(args);
      for (const argExpr of argExpressions) {
        this.validateSingleExpression(argExpr, context, result);
      }
    }
  }

  /**
   * Validate field path syntax
   */
  private static validateFieldPath(
    fieldPath: string,
    result: ExpressionValidationResult,
    originalExpr: string
  ): void {
    // Check for invalid characters
    if (!/^[a-zA-Z_][\w.[\]'"]*$/.test(fieldPath)) {
      result.errors.push(
        `Invalid field path syntax: ${fieldPath} in ${originalExpr}`
      );
      return;
    }

    // Check for empty array access
    if (fieldPath.includes('[]')) {
      result.warnings.push(
        `Empty array accessor in field path: ${fieldPath} in ${originalExpr}`
      );
    }

    // Check for consecutive dots
    if (fieldPath.includes('..')) {
      result.errors.push(
        `Invalid consecutive dots in field path: ${fieldPath} in ${originalExpr}`
      );
    }

    // Check for unmatched brackets
    const openBrackets = (fieldPath.match(/\[/g) || []).length;
    const closeBrackets = (fieldPath.match(/\]/g) || []).length;
    if (openBrackets !== closeBrackets) {
      result.errors.push(
        `Unmatched brackets in field path: ${fieldPath} in ${originalExpr}`
      );
    }
  }

  /**
   * Validate all expressions in a module's parameters
   */
  static validateModuleExpressions(
    parameters: Record<string, any>,
    context: ExpressionContext
  ): ExpressionValidationResult {
    const result: ExpressionValidationResult = {
      valid: true,
      errors: [],
      warnings: [],
      usedModules: new Set(),
      usedFields: new Set(),
    };

    this.validateObjectExpressions(parameters, context, result);

    result.valid = result.errors.length === 0;
    return result;
  }

  /**
   * Recursively validate expressions in an object
   */
  private static validateObjectExpressions(
    obj: any,
    context: ExpressionContext,
    result: ExpressionValidationResult
  ): void {
    if (obj === null || obj === undefined) {
      return;
    }

    if (typeof obj === 'string') {
      const exprResult = this.validateExpression(obj, context);
      result.errors.push(...exprResult.errors);
      result.warnings.push(...exprResult.warnings);
      exprResult.usedModules.forEach(id => result.usedModules.add(id));
      exprResult.usedFields.forEach(field => result.usedFields.add(field));
      return;
    }

    if (Array.isArray(obj)) {
      for (const item of obj) {
        this.validateObjectExpressions(item, context, result);
      }
      return;
    }

    if (typeof obj === 'object') {
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          this.validateObjectExpressions(obj[key], context, result);
        }
      }
    }
  }

  /**
   * Validate all expressions in a scenario
   */
  static validateScenarioExpressions(scenario: MakeScenario): {
    errors: ValidationErrorType[];
    warnings: ValidationWarning[];
    statistics: {
      totalModules: number;
      modulesWithExpressions: number;
      totalExpressions: number;
      modulesValidated: number;
    };
  } {
    const errors: ValidationErrorType[] = [];
    const warnings: ValidationWarning[] = [];
    const statistics = {
      totalModules: scenario.flow.length,
      modulesWithExpressions: 0,
      totalExpressions: 0,
      modulesValidated: 0,
    };

    // Build module context
    const availableModules = scenario.flow.map(m => ({
      id: m.id,
      module: m.module,
    }));

    // Validate each module
    for (const module of scenario.flow) {
      const context: ExpressionContext = {
        availableModules,
        currentModuleId: module.id,
        hasInputData: true,
      };

      // Validate parameters
      if (module.parameters) {
        const result = this.validateModuleExpressions(module.parameters, context);
        statistics.modulesValidated++;

        if (result.usedModules.size > 0) {
          statistics.modulesWithExpressions++;
          statistics.totalExpressions += result.usedFields.size;
        }

        // Add errors
        for (const error of result.errors) {
          errors.push({
            code: 'EXPRESSION_ERROR',
            message: error,
            path: `flow[${module.id}].parameters`,
            severity: 'error',
            autoFixable: false,
          });
        }

        // Add warnings
        for (const warning of result.warnings) {
          warnings.push({
            code: 'EXPRESSION_WARNING',
            message: warning,
            path: `flow[${module.id}].parameters`,
            severity: 'warning',
            autoFixable: false,
          });
        }
      }

      // Validate mapper
      if (module.mapper) {
        const result = this.validateModuleExpressions(module.mapper, context);

        if (result.usedModules.size > 0) {
          statistics.modulesWithExpressions++;
          statistics.totalExpressions += result.usedFields.size;
        }

        // Add errors
        for (const error of result.errors) {
          errors.push({
            code: 'EXPRESSION_ERROR',
            message: error,
            path: `flow[${module.id}].mapper`,
            severity: 'error',
            autoFixable: false,
          });
        }

        // Add warnings
        for (const warning of result.warnings) {
          warnings.push({
            code: 'EXPRESSION_WARNING',
            message: warning,
            path: `flow[${module.id}].mapper`,
            severity: 'warning',
            autoFixable: false,
          });
        }
      }

      // Validate routes (for router modules)
      if (module.routes) {
        for (let routeIndex = 0; routeIndex < module.routes.length; routeIndex++) {
          const route = module.routes[routeIndex];

          if (route.filter) {
            const result = this.validateModuleExpressions(route.filter, context);

            // Add errors
            for (const error of result.errors) {
              errors.push({
                code: 'EXPRESSION_ERROR',
                message: error,
                path: `flow[${module.id}].routes[${routeIndex}].filter`,
                severity: 'error',
                autoFixable: false,
              });
            }

            // Add warnings
            for (const warning of result.warnings) {
              warnings.push({
                code: 'EXPRESSION_WARNING',
                message: warning,
                path: `flow[${module.id}].routes[${routeIndex}].filter`,
                severity: 'warning',
                autoFixable: false,
              });
            }
          }
        }
      }
    }

    logger.debug('Scenario expression validation complete', statistics);

    return { errors, warnings, statistics };
  }

  /**
   * Find all module references in an expression
   */
  static findModuleReferences(expression: string): number[] {
    const moduleIds: number[] = [];
    const regex = /\{\{(\d+)\.[^}]+\}\}/g;
    let match;

    while ((match = regex.exec(expression)) !== null) {
      const moduleId = parseInt(match[1], 10);
      if (!moduleIds.includes(moduleId)) {
        moduleIds.push(moduleId);
      }
    }

    return moduleIds;
  }

  /**
   * Replace module references in expressions (useful for module ID changes)
   */
  static replaceModuleReferences(
    expression: string,
    oldModuleId: number,
    newModuleId: number
  ): string {
    const regex = new RegExp(`\\{\\{${oldModuleId}\\.([^}]+)\\}\\}`, 'g');
    return expression.replace(regex, `{{${newModuleId}.$1}}`);
  }

  /**
   * Check if a string contains expressions
   */
  static hasExpressions(text: string): boolean {
    if (!text || typeof text !== 'string') {
      return false;
    }
    return /\{\{[^}]+\}\}/.test(text);
  }

  /**
   * Count expressions in a string
   */
  static countExpressions(text: string): number {
    if (!text || typeof text !== 'string') {
      return 0;
    }
    const matches = text.match(/\{\{[^}]+\}\}/g);
    return matches ? matches.length : 0;
  }

  /**
   * Extract field name from expression
   */
  static extractFieldName(expression: string): string | null {
    const match = /\{\{\d+\.([a-zA-Z_][\w]*)\b/.exec(expression);
    return match ? match[1] : null;
  }

  /**
   * Check if expression references a specific module
   */
  static referencesModule(expression: string, moduleId: number): boolean {
    const regex = new RegExp(`\\{\\{${moduleId}\\.`);
    return regex.test(expression);
  }
}

