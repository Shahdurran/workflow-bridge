/**
 * Scenario Diff Engine
 * Applies diff operations to Make.com scenarios
 * Based on n8n-mcp's WorkflowDiffEngine
 */

import { v4 as uuidv4 } from 'uuid';
import { MakeScenario, MakeFlow } from '../types/index';
import { Logger } from '../utils/logger';
import { ValidationError, ScenarioError } from '../errors/make-errors';

const logger = new Logger({ prefix: '[ScenarioDiffEngine]' });

/**
 * Diff Operation Types
 */
export type ScenarioDiffOperationType =
  | 'addModule'
  | 'removeModule'
  | 'updateModule'
  | 'moveModule'
  | 'reorderModules'
  | 'updateMetadata'
  | 'updateName'
  | 'addRoute'
  | 'removeRoute'
  | 'updateRoute';

/**
 * Base Diff Operation
 */
export interface BaseScenarioDiffOperation {
  type: ScenarioDiffOperationType;
  description?: string;
}

/**
 * Add Module Operation
 */
export interface AddModuleOperation extends BaseScenarioDiffOperation {
  type: 'addModule';
  module: MakeFlow;
  position?: 'start' | 'end' | 'after' | 'before';
  referenceModuleId?: number; // For 'after' or 'before' position
}

/**
 * Remove Module Operation
 */
export interface RemoveModuleOperation extends BaseScenarioDiffOperation {
  type: 'removeModule';
  moduleId: number;
}

/**
 * Update Module Operation
 */
export interface UpdateModuleOperation extends BaseScenarioDiffOperation {
  type: 'updateModule';
  moduleId: number;
  updates: Partial<MakeFlow>;
}

/**
 * Move Module Operation
 */
export interface MoveModuleOperation extends BaseScenarioDiffOperation {
  type: 'moveModule';
  moduleId: number;
  x: number;
  y: number;
}

/**
 * Reorder Modules Operation
 */
export interface ReorderModulesOperation extends BaseScenarioDiffOperation {
  type: 'reorderModules';
  moduleIds: number[]; // New order of module IDs
}

/**
 * Update Metadata Operation
 */
export interface UpdateMetadataOperation extends BaseScenarioDiffOperation {
  type: 'updateMetadata';
  metadata: Partial<MakeScenario['metadata']>;
}

/**
 * Update Name Operation
 */
export interface UpdateNameOperation extends BaseScenarioDiffOperation {
  type: 'updateName';
  name: string;
}

/**
 * Add Route Operation (for router modules)
 */
export interface AddRouteOperation extends BaseScenarioDiffOperation {
  type: 'addRoute';
  moduleId: number;
  route: {
    flow: MakeFlow[];
    filter?: any;
  };
}

/**
 * Remove Route Operation
 */
export interface RemoveRouteOperation extends BaseScenarioDiffOperation {
  type: 'removeRoute';
  moduleId: number;
  routeIndex: number;
}

/**
 * Update Route Operation
 */
export interface UpdateRouteOperation extends BaseScenarioDiffOperation {
  type: 'updateRoute';
  moduleId: number;
  routeIndex: number;
  updates: {
    flow?: MakeFlow[];
    filter?: any;
  };
}

/**
 * Union of all operation types
 */
export type ScenarioDiffOperation =
  | AddModuleOperation
  | RemoveModuleOperation
  | UpdateModuleOperation
  | MoveModuleOperation
  | ReorderModulesOperation
  | UpdateMetadataOperation
  | UpdateNameOperation
  | AddRouteOperation
  | RemoveRouteOperation
  | UpdateRouteOperation;

/**
 * Diff Request
 */
export interface ScenarioDiffRequest {
  id?: string; // Scenario ID (for API operations)
  operations: ScenarioDiffOperation[];
  continueOnError?: boolean;
  validateOnly?: boolean;
  createBackup?: boolean;
  intent?: string; // Human-readable description of changes
}

/**
 * Validation Error
 */
export interface ScenarioDiffValidationError {
  operationIndex: number;
  operationType: ScenarioDiffOperationType;
  message: string;
  recoverable: boolean;
}

/**
 * Diff Result
 */
export interface ScenarioDiffResult {
  success: boolean;
  scenario?: MakeScenario;
  message: string;
  operationsApplied: number;
  operationsFailed: number;
  applied?: number[];
  failed?: number[];
  errors: ScenarioDiffValidationError[];
  warnings: ScenarioDiffValidationError[];
}

/**
 * Scenario Diff Engine
 */
export class ScenarioDiffEngine {
  private warnings: ScenarioDiffValidationError[] = [];

  /**
   * Apply diff operations to a scenario
   */
  async applyDiff(
    scenario: MakeScenario,
    request: ScenarioDiffRequest
  ): Promise<ScenarioDiffResult> {
    try {
      // Reset warnings
      this.warnings = [];

      // Clone scenario to avoid modifying original
      const scenarioCopy = JSON.parse(JSON.stringify(scenario)) as MakeScenario;

      const errors: ScenarioDiffValidationError[] = [];
      const appliedIndices: number[] = [];
      const failedIndices: number[] = [];

      // Process operations sequentially
      for (let i = 0; i < request.operations.length; i++) {
        const operation = request.operations[i];

        try {
          // Validate operation
          this.validateOperation(operation, scenarioCopy);

          // Apply operation
          this.applyOperation(operation, scenarioCopy);

          appliedIndices.push(i);
        } catch (error: any) {
          const validationError: ScenarioDiffValidationError = {
            operationIndex: i,
            operationType: operation.type,
            message: error.message || 'Unknown error',
            recoverable: request.continueOnError || false,
          };

          errors.push(validationError);
          failedIndices.push(i);

          // Stop if not continuing on error
          if (!request.continueOnError) {
            break;
          }
        }
      }

      // Build result
      const success = errors.length === 0;
      const operationsApplied = appliedIndices.length;
      const operationsFailed = failedIndices.length;

      const result: ScenarioDiffResult = {
        success,
        scenario: success || operationsApplied > 0 ? scenarioCopy : undefined,
        message: success
          ? `Successfully applied ${operationsApplied} operation(s)`
          : `Failed to apply ${operationsFailed} operation(s)`,
        operationsApplied,
        operationsFailed,
        applied: appliedIndices,
        failed: failedIndices,
        errors,
        warnings: this.warnings,
      };

      logger.debug('Diff result', {
        success,
        operationsApplied,
        operationsFailed,
        errorsCount: errors.length,
        warningsCount: this.warnings.length,
      });

      return result;
    } catch (error: any) {
      logger.error('Diff engine error', { error: error.message });
      throw new ScenarioError('Failed to apply diff operations', {
        error: error.message,
      });
    }
  }

  /**
   * Validate an operation
   */
  private validateOperation(
    operation: ScenarioDiffOperation,
    scenario: MakeScenario
  ): void {
    switch (operation.type) {
      case 'addModule':
        this.validateAddModule(operation, scenario);
        break;
      case 'removeModule':
        this.validateRemoveModule(operation, scenario);
        break;
      case 'updateModule':
        this.validateUpdateModule(operation, scenario);
        break;
      case 'moveModule':
        this.validateMoveModule(operation, scenario);
        break;
      case 'reorderModules':
        this.validateReorderModules(operation, scenario);
        break;
      case 'updateMetadata':
        this.validateUpdateMetadata(operation, scenario);
        break;
      case 'updateName':
        this.validateUpdateName(operation, scenario);
        break;
      case 'addRoute':
        this.validateAddRoute(operation, scenario);
        break;
      case 'removeRoute':
        this.validateRemoveRoute(operation, scenario);
        break;
      case 'updateRoute':
        this.validateUpdateRoute(operation, scenario);
        break;
      default:
        throw new ValidationError(`Unknown operation type: ${(operation as any).type}`);
    }
  }

  /**
   * Apply an operation
   */
  private applyOperation(
    operation: ScenarioDiffOperation,
    scenario: MakeScenario
  ): void {
    switch (operation.type) {
      case 'addModule':
        this.applyAddModule(operation, scenario);
        break;
      case 'removeModule':
        this.applyRemoveModule(operation, scenario);
        break;
      case 'updateModule':
        this.applyUpdateModule(operation, scenario);
        break;
      case 'moveModule':
        this.applyMoveModule(operation, scenario);
        break;
      case 'reorderModules':
        this.applyReorderModules(operation, scenario);
        break;
      case 'updateMetadata':
        this.applyUpdateMetadata(operation, scenario);
        break;
      case 'updateName':
        this.applyUpdateName(operation, scenario);
        break;
      case 'addRoute':
        this.applyAddRoute(operation, scenario);
        break;
      case 'removeRoute':
        this.applyRemoveRoute(operation, scenario);
        break;
      case 'updateRoute':
        this.applyUpdateRoute(operation, scenario);
        break;
    }
  }

  // ========== Add Module ==========

  private validateAddModule(operation: AddModuleOperation, scenario: MakeScenario): void {
    if (!operation.module) {
      throw new ValidationError('Module data is required');
    }

    if (!operation.module.module) {
      throw new ValidationError('Module name is required');
    }

    if (typeof operation.module.id !== 'number') {
      throw new ValidationError('Module ID must be a number');
    }

    // Check for duplicate module ID
    const existingModule = scenario.flow.find(m => m.id === operation.module.id);
    if (existingModule) {
      throw new ValidationError(`Module with ID ${operation.module.id} already exists`);
    }

    // Validate position
    if (operation.referenceModuleId !== undefined) {
      const refModule = scenario.flow.find(m => m.id === operation.referenceModuleId);
      if (!refModule) {
        throw new ValidationError(
          `Reference module with ID ${operation.referenceModuleId} not found`
        );
      }
    }
  }

  private applyAddModule(operation: AddModuleOperation, scenario: MakeScenario): void {
    const position = operation.position || 'end';

    switch (position) {
      case 'start':
        scenario.flow.unshift(operation.module);
        break;

      case 'end':
        scenario.flow.push(operation.module);
        break;

      case 'after':
      case 'before': {
        if (operation.referenceModuleId === undefined) {
          throw new ValidationError(`Reference module ID is required for '${position}' position`);
        }

        const refIndex = scenario.flow.findIndex(m => m.id === operation.referenceModuleId);
        const insertIndex = position === 'after' ? refIndex + 1 : refIndex;
        scenario.flow.splice(insertIndex, 0, operation.module);
        break;
      }

      default:
        throw new ValidationError(`Invalid position: ${position}`);
    }

    logger.debug('Added module', {
      moduleId: operation.module.id,
      moduleName: operation.module.module,
      position,
    });
  }

  // ========== Remove Module ==========

  private validateRemoveModule(operation: RemoveModuleOperation, scenario: MakeScenario): void {
    const module = scenario.flow.find(m => m.id === operation.moduleId);
    if (!module) {
      throw new ValidationError(`Module with ID ${operation.moduleId} not found`);
    }
  }

  private applyRemoveModule(operation: RemoveModuleOperation, scenario: MakeScenario): void {
    const index = scenario.flow.findIndex(m => m.id === operation.moduleId);
    scenario.flow.splice(index, 1);

    logger.debug('Removed module', { moduleId: operation.moduleId });
  }

  // ========== Update Module ==========

  private validateUpdateModule(operation: UpdateModuleOperation, scenario: MakeScenario): void {
    const module = scenario.flow.find(m => m.id === operation.moduleId);
    if (!module) {
      throw new ValidationError(`Module with ID ${operation.moduleId} not found`);
    }

    if (!operation.updates || Object.keys(operation.updates).length === 0) {
      throw new ValidationError('Updates object cannot be empty');
    }

    // Prevent changing module ID
    if ('id' in operation.updates && operation.updates.id !== operation.moduleId) {
      throw new ValidationError('Cannot change module ID through update operation');
    }
  }

  private applyUpdateModule(operation: UpdateModuleOperation, scenario: MakeScenario): void {
    const module = scenario.flow.find(m => m.id === operation.moduleId);
    if (!module) return;

    // Apply updates (deep merge)
    Object.assign(module, operation.updates);

    // Handle nested updates for metadata
    if (operation.updates.metadata) {
      module.metadata = {
        ...module.metadata,
        ...operation.updates.metadata,
      };
    }

    logger.debug('Updated module', {
      moduleId: operation.moduleId,
      updatedFields: Object.keys(operation.updates),
    });
  }

  // ========== Move Module ==========

  private validateMoveModule(operation: MoveModuleOperation, scenario: MakeScenario): void {
    const module = scenario.flow.find(m => m.id === operation.moduleId);
    if (!module) {
      throw new ValidationError(`Module with ID ${operation.moduleId} not found`);
    }

    if (typeof operation.x !== 'number' || typeof operation.y !== 'number') {
      throw new ValidationError('X and Y coordinates must be numbers');
    }
  }

  private applyMoveModule(operation: MoveModuleOperation, scenario: MakeScenario): void {
    const module = scenario.flow.find(m => m.id === operation.moduleId);
    if (!module) return;

    // Update designer metadata
    if (!module.metadata) {
      module.metadata = {};
    }
    if (!module.metadata.designer) {
      module.metadata.designer = { x: 0, y: 0 };
    }

    module.metadata.designer.x = operation.x;
    module.metadata.designer.y = operation.y;

    logger.debug('Moved module', {
      moduleId: operation.moduleId,
      x: operation.x,
      y: operation.y,
    });
  }

  // ========== Reorder Modules ==========

  private validateReorderModules(
    operation: ReorderModulesOperation,
    scenario: MakeScenario
  ): void {
    if (!Array.isArray(operation.moduleIds)) {
      throw new ValidationError('Module IDs must be an array');
    }

    if (operation.moduleIds.length !== scenario.flow.length) {
      throw new ValidationError(
        `Module IDs count (${operation.moduleIds.length}) does not match scenario modules count (${scenario.flow.length})`
      );
    }

    // Check all module IDs exist
    const existingIds = new Set(scenario.flow.map(m => m.id));
    const providedIds = new Set(operation.moduleIds);

    for (const id of operation.moduleIds) {
      if (!existingIds.has(id)) {
        throw new ValidationError(`Module with ID ${id} not found in scenario`);
      }
    }

    // Check for duplicates
    if (providedIds.size !== operation.moduleIds.length) {
      throw new ValidationError('Duplicate module IDs found in reorder operation');
    }
  }

  private applyReorderModules(
    operation: ReorderModulesOperation,
    scenario: MakeScenario
  ): void {
    const moduleMap = new Map(scenario.flow.map(m => [m.id, m]));
    scenario.flow = operation.moduleIds.map(id => moduleMap.get(id)!);

    logger.debug('Reordered modules', {
      newOrder: operation.moduleIds,
    });
  }

  // ========== Update Metadata ==========

  private validateUpdateMetadata(
    operation: UpdateMetadataOperation,
    scenario: MakeScenario
  ): void {
    if (!operation.metadata || Object.keys(operation.metadata).length === 0) {
      throw new ValidationError('Metadata updates cannot be empty');
    }
  }

  private applyUpdateMetadata(
    operation: UpdateMetadataOperation,
    scenario: MakeScenario
  ): void {
    if (!scenario.metadata) {
      scenario.metadata = {};
    }

    // Deep merge metadata
    scenario.metadata = {
      ...scenario.metadata,
      ...operation.metadata,
    };

    logger.debug('Updated metadata', {
      updatedFields: operation.metadata ? Object.keys(operation.metadata) : [],
    });
  }

  // ========== Update Name ==========

  private validateUpdateName(operation: UpdateNameOperation, scenario: MakeScenario): void {
    if (!operation.name || operation.name.trim().length === 0) {
      throw new ValidationError('Scenario name cannot be empty');
    }
  }

  private applyUpdateName(operation: UpdateNameOperation, scenario: MakeScenario): void {
    scenario.name = operation.name;

    logger.debug('Updated scenario name', { name: operation.name });
  }

  // ========== Add Route ==========

  private validateAddRoute(operation: AddRouteOperation, scenario: MakeScenario): void {
    const module = scenario.flow.find(m => m.id === operation.moduleId);
    if (!module) {
      throw new ValidationError(`Module with ID ${operation.moduleId} not found`);
    }

    // Check if module is a router
    if (!module.module.toLowerCase().includes('router')) {
      this.warnings.push({
        operationIndex: -1,
        operationType: 'addRoute',
        message: `Module ${operation.moduleId} may not be a router module`,
        recoverable: true,
      });
    }

    if (!operation.route || !operation.route.flow) {
      throw new ValidationError('Route must contain a flow array');
    }
  }

  private applyAddRoute(operation: AddRouteOperation, scenario: MakeScenario): void {
    const module = scenario.flow.find(m => m.id === operation.moduleId);
    if (!module) return;

    if (!module.routes) {
      module.routes = [];
    }

    module.routes.push(operation.route);

    logger.debug('Added route to module', {
      moduleId: operation.moduleId,
      routeIndex: module.routes.length - 1,
    });
  }

  // ========== Remove Route ==========

  private validateRemoveRoute(operation: RemoveRouteOperation, scenario: MakeScenario): void {
    const module = scenario.flow.find(m => m.id === operation.moduleId);
    if (!module) {
      throw new ValidationError(`Module with ID ${operation.moduleId} not found`);
    }

    if (!module.routes || module.routes.length === 0) {
      throw new ValidationError(`Module ${operation.moduleId} has no routes`);
    }

    if (operation.routeIndex < 0 || operation.routeIndex >= module.routes.length) {
      throw new ValidationError(
        `Route index ${operation.routeIndex} out of bounds (0-${module.routes.length - 1})`
      );
    }
  }

  private applyRemoveRoute(operation: RemoveRouteOperation, scenario: MakeScenario): void {
    const module = scenario.flow.find(m => m.id === operation.moduleId);
    if (!module || !module.routes) return;

    module.routes.splice(operation.routeIndex, 1);

    logger.debug('Removed route from module', {
      moduleId: operation.moduleId,
      routeIndex: operation.routeIndex,
    });
  }

  // ========== Update Route ==========

  private validateUpdateRoute(operation: UpdateRouteOperation, scenario: MakeScenario): void {
    const module = scenario.flow.find(m => m.id === operation.moduleId);
    if (!module) {
      throw new ValidationError(`Module with ID ${operation.moduleId} not found`);
    }

    if (!module.routes || module.routes.length === 0) {
      throw new ValidationError(`Module ${operation.moduleId} has no routes`);
    }

    if (operation.routeIndex < 0 || operation.routeIndex >= module.routes.length) {
      throw new ValidationError(
        `Route index ${operation.routeIndex} out of bounds (0-${module.routes.length - 1})`
      );
    }

    if (!operation.updates || Object.keys(operation.updates).length === 0) {
      throw new ValidationError('Route updates cannot be empty');
    }
  }

  private applyUpdateRoute(operation: UpdateRouteOperation, scenario: MakeScenario): void {
    const module = scenario.flow.find(m => m.id === operation.moduleId);
    if (!module || !module.routes) return;

    const route = module.routes[operation.routeIndex];
    Object.assign(route, operation.updates);

    logger.debug('Updated route in module', {
      moduleId: operation.moduleId,
      routeIndex: operation.routeIndex,
      updatedFields: Object.keys(operation.updates),
    });
  }

  /**
   * Generate diff from two scenarios
   */
  async generateDiff(
    oldScenario: MakeScenario,
    newScenario: MakeScenario
  ): Promise<ScenarioDiffOperation[]> {
    const operations: ScenarioDiffOperation[] = [];

    // Check name change
    if (oldScenario.name !== newScenario.name) {
      operations.push({
        type: 'updateName',
        name: newScenario.name,
        description: `Changed scenario name from "${oldScenario.name}" to "${newScenario.name}"`,
      });
    }

    // Compare modules
    const oldModuleIds = new Set(oldScenario.flow.map(m => m.id));
    const newModuleIds = new Set(newScenario.flow.map(m => m.id));

    // Find removed modules
    for (const oldModule of oldScenario.flow) {
      if (!newModuleIds.has(oldModule.id)) {
        operations.push({
          type: 'removeModule',
          moduleId: oldModule.id,
          description: `Removed module ${oldModule.module} (ID: ${oldModule.id})`,
        });
      }
    }

    // Find added modules
    for (const newModule of newScenario.flow) {
      if (!oldModuleIds.has(newModule.id)) {
        operations.push({
          type: 'addModule',
          module: newModule,
          description: `Added module ${newModule.module} (ID: ${newModule.id})`,
        });
      }
    }

    // Find updated modules
    for (const newModule of newScenario.flow) {
      const oldModule = oldScenario.flow.find(m => m.id === newModule.id);
      if (oldModule) {
        const updates = this.calculateModuleUpdates(oldModule, newModule);
        if (Object.keys(updates).length > 0) {
          operations.push({
            type: 'updateModule',
            moduleId: newModule.id,
            updates,
            description: `Updated module ${newModule.module} (ID: ${newModule.id})`,
          });
        }
      }
    }

    // Check if module order changed
    const oldOrder = oldScenario.flow.map(m => m.id).filter(id => newModuleIds.has(id));
    const newOrder = newScenario.flow.map(m => m.id).filter(id => oldModuleIds.has(id));

    if (JSON.stringify(oldOrder) !== JSON.stringify(newOrder)) {
      operations.push({
        type: 'reorderModules',
        moduleIds: newScenario.flow.map(m => m.id),
        description: 'Reordered modules',
      });
    }

    return operations;
  }

  /**
   * Calculate updates between two modules
   */
  private calculateModuleUpdates(oldModule: MakeFlow, newModule: MakeFlow): Partial<MakeFlow> {
    const updates: Partial<MakeFlow> = {};

    // Compare top-level properties
    if (oldModule.module !== newModule.module) {
      updates.module = newModule.module;
    }

    if (oldModule.version !== newModule.version) {
      updates.version = newModule.version;
    }

    // Compare parameters
    if (JSON.stringify(oldModule.parameters) !== JSON.stringify(newModule.parameters)) {
      updates.parameters = newModule.parameters;
    }

    // Compare mapper
    if (JSON.stringify(oldModule.mapper) !== JSON.stringify(newModule.mapper)) {
      updates.mapper = newModule.mapper;
    }

    // Compare metadata
    if (JSON.stringify(oldModule.metadata) !== JSON.stringify(newModule.metadata)) {
      updates.metadata = newModule.metadata;
    }

    // Compare routes
    if (JSON.stringify(oldModule.routes) !== JSON.stringify(newModule.routes)) {
      updates.routes = newModule.routes;
    }

    return updates;
  }
}

