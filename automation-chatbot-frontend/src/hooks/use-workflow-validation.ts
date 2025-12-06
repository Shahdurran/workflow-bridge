import { useState, useEffect, useRef } from 'react';
import { WorkflowNode, WorkflowConnection, Platform } from '@/types/api';
import { transformFromCanvas } from '@/utils/workflow-transformer';
import { validateN8nWorkflow } from '@/services/api';

interface ValidationResult {
  isValid: boolean;
  errors: Array<{
    message: string;
    nodeId?: string;
    field?: string;
  }>;
  warnings: Array<{
    message: string;
    nodeId?: string;
    field?: string;
  }>;
  isValidating: boolean;
}

/**
 * Hook for real-time workflow validation with debouncing
 * 
 * Validates workflow structure and configuration based on platform.
 * Caches results to avoid redundant API calls.
 */
export function useWorkflowValidation(
  nodes: WorkflowNode[],
  connections: WorkflowConnection[],
  platform: Platform,
  debounceMs: number = 500
): ValidationResult {
  const [validationResult, setValidationResult] = useState<ValidationResult>({
    isValid: true,
    errors: [],
    warnings: [],
    isValidating: false,
  });

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const cacheRef = useRef<Map<string, ValidationResult>>(new Map());

  useEffect(() => {
    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Don't validate empty workflows
    if (nodes.length === 0) {
      setValidationResult({
        isValid: true,
        errors: [],
        warnings: [],
        isValidating: false,
      });
      return;
    }

    // Generate cache key based on workflow content
    const cacheKey = generateCacheKey(nodes, connections, platform);

    // Check cache first
    const cached = cacheRef.current.get(cacheKey);
    if (cached) {
      setValidationResult(cached);
      return;
    }

    // Set validating state
    setValidationResult(prev => ({
      ...prev,
      isValidating: true,
    }));

    // Debounce validation
    debounceTimerRef.current = setTimeout(async () => {
      try {
        const result = await validateWorkflow(nodes, connections, platform);
        
        // Cache the result
        cacheRef.current.set(cacheKey, result);

        // Limit cache size to prevent memory leaks
        if (cacheRef.current.size > 10) {
          const firstKey = cacheRef.current.keys().next().value;
          cacheRef.current.delete(firstKey);
        }

        setValidationResult(result);
      } catch (error) {
        console.error('Validation error:', error);
        setValidationResult({
          isValid: false,
          errors: [{ message: 'Validation service unavailable' }],
          warnings: [],
          isValidating: false,
        });
      }
    }, debounceMs);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [nodes, connections, platform, debounceMs]);

  return validationResult;
}

/**
 * Generate a cache key from workflow data
 */
function generateCacheKey(
  nodes: WorkflowNode[],
  connections: WorkflowConnection[],
  platform: Platform
): string {
  const nodeIds = nodes.map(n => n.id).sort().join(',');
  const connectionStr = connections
    .map(c => `${c.source}-${c.target}`)
    .sort()
    .join(',');
  return `${platform}:${nodeIds}:${connectionStr}:${nodes.length}`;
}

/**
 * Validate workflow based on platform
 */
async function validateWorkflow(
  nodes: WorkflowNode[],
  connections: WorkflowConnection[],
  platform: Platform
): Promise<ValidationResult> {
  const errors: Array<{ message: string; nodeId?: string; field?: string }> = [];
  const warnings: Array<{ message: string; nodeId?: string; field?: string }> = [];

  // Basic structural validation (applies to all platforms)
  const structuralValidation = validateStructure(nodes, connections);
  errors.push(...structuralValidation.errors);
  warnings.push(...structuralValidation.warnings);

  // Platform-specific validation
  try {
    if (platform === 'n8n') {
      try {
        const workflow = transformFromCanvas(nodes, connections, platform);
        
        // Only call backend validation if workflow has valid structure
        if (workflow && workflow.nodes && workflow.nodes.length > 0) {
          const result = await validateN8nWorkflow(workflow, 'balanced');
          
          if (result.errors) {
            errors.push(...result.errors.map((e: any) => ({
              message: typeof e === 'string' ? e : (e.message || 'Unknown error'),
              nodeId: e.nodeId,
              field: e.field,
            })));
          }
          
          if (result.warnings) {
            warnings.push(...result.warnings.map((w: any) => ({
              message: typeof w === 'string' ? w : (w.message || 'Unknown warning'),
              nodeId: w.nodeId,
              field: w.field,
            })));
          }
        }
      } catch (transformError) {
        console.error('Error transforming workflow for validation:', transformError);
        // Don't add error - structural validation already covers this
      }
    } else if (platform === 'make') {
      // Make-specific validation
      const makeValidation = validateMakeScenario(nodes, connections);
      errors.push(...makeValidation.errors);
      warnings.push(...makeValidation.warnings);
    } else if (platform === 'zapier') {
      // Zapier-specific validation
      const zapierValidation = validateZapierZap(nodes, connections);
      errors.push(...zapierValidation.errors);
      warnings.push(...zapierValidation.warnings);
    }
  } catch (error) {
    console.error('Platform validation error:', error);
    // Only add warning if no structural errors already present
    if (errors.length === 0) {
      warnings.push({
        message: 'Could not complete platform-specific validation',
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    isValidating: false,
  };
}

/**
 * Validate basic workflow structure
 */
function validateStructure(
  nodes: WorkflowNode[],
  connections: WorkflowConnection[]
): { errors: Array<{ message: string; nodeId?: string }>; warnings: Array<{ message: string; nodeId?: string }> } {
  const errors: Array<{ message: string; nodeId?: string }> = [];
  const warnings: Array<{ message: string; nodeId?: string }> = [];

  // Check for at least one trigger
  const triggers = nodes.filter(n => n.type === 'trigger');
  if (triggers.length === 0) {
    errors.push({ message: 'Workflow must have at least one trigger node' });
  }

  // Check for duplicate node IDs
  const nodeIds = new Set<string>();
  for (const node of nodes) {
    if (nodeIds.has(node.id)) {
      errors.push({
        message: `Duplicate node ID: ${node.id}`,
        nodeId: node.id,
      });
    }
    nodeIds.add(node.id);
  }

  // Check for orphaned nodes (nodes with no connections)
  if (nodes.length > 1) {
    const connectedNodes = new Set<string>();
    connections.forEach(c => {
      connectedNodes.add(c.source);
      connectedNodes.add(c.target);
    });

    for (const node of nodes) {
      if (!connectedNodes.has(node.id) && node.type !== 'trigger') {
        warnings.push({
          message: `Node "${node.action}" is not connected to the workflow`,
          nodeId: node.id,
        });
      }
    }
  }

  // Check for invalid connections (non-existent nodes)
  for (const connection of connections) {
    const sourceExists = nodes.some(n => n.id === connection.source);
    const targetExists = nodes.some(n => n.id === connection.target);

    if (!sourceExists) {
      errors.push({
        message: `Connection references non-existent source node: ${connection.source}`,
      });
    }

    if (!targetExists) {
      errors.push({
        message: `Connection references non-existent target node: ${connection.target}`,
      });
    }
  }

  // Check for circular dependencies (basic check)
  const circularCheck = detectCircularDependencies(nodes, connections);
  if (circularCheck.hasCircular) {
    warnings.push({
      message: 'Potential circular dependency detected in workflow',
    });
  }

  return { errors, warnings };
}

/**
 * Detect circular dependencies
 */
function detectCircularDependencies(
  nodes: WorkflowNode[],
  connections: WorkflowConnection[]
): { hasCircular: boolean } {
  const graph = new Map<string, string[]>();
  
  // Build adjacency list
  nodes.forEach(n => graph.set(n.id, []));
  connections.forEach(c => {
    const neighbors = graph.get(c.source) || [];
    neighbors.push(c.target);
    graph.set(c.source, neighbors);
  });

  const visited = new Set<string>();
  const recStack = new Set<string>();

  function hasCycle(nodeId: string): boolean {
    visited.add(nodeId);
    recStack.add(nodeId);

    const neighbors = graph.get(nodeId) || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        if (hasCycle(neighbor)) {
          return true;
        }
      } else if (recStack.has(neighbor)) {
        return true;
      }
    }

    recStack.delete(nodeId);
    return false;
  }

  for (const nodeId of graph.keys()) {
    if (!visited.has(nodeId)) {
      if (hasCycle(nodeId)) {
        return { hasCircular: true };
      }
    }
  }

  return { hasCircular: false };
}

/**
 * Validate Make scenario structure
 */
function validateMakeScenario(
  nodes: WorkflowNode[],
  connections: WorkflowConnection[]
): { errors: Array<{ message: string; nodeId?: string }>; warnings: Array<{ message: string; nodeId?: string }> } {
  const errors: Array<{ message: string; nodeId?: string }> = [];
  const warnings: Array<{ message: string; nodeId?: string }> = [];

  // Make requires sequential flow (mostly)
  // Check if connections form a proper sequence
  const nodeConnections = new Map<string, { inCount: number; outCount: number }>();
  
  nodes.forEach(n => {
    nodeConnections.set(n.id, { inCount: 0, outCount: 0 });
  });

  connections.forEach(c => {
    const source = nodeConnections.get(c.source);
    const target = nodeConnections.get(c.target);
    
    if (source) source.outCount++;
    if (target) target.inCount++;
  });

  // Check for nodes with multiple inputs (not always supported in Make)
  nodes.forEach(node => {
    const conns = nodeConnections.get(node.id);
    if (conns && conns.inCount > 1) {
      warnings.push({
        message: `Node "${node.action}" has multiple inputs - may require manual adjustment in Make`,
        nodeId: node.id,
      });
    }
  });

  return { errors, warnings };
}

/**
 * Validate Zapier zap structure
 */
function validateZapierZap(
  nodes: WorkflowNode[],
  connections: WorkflowConnection[]
): { errors: Array<{ message: string; nodeId?: string }>; warnings: Array<{ message: string; nodeId?: string }> } {
  const errors: Array<{ message: string; nodeId?: string }> = [];
  const warnings: Array<{ message: string; nodeId?: string }> = [];

  // Zapier only supports linear workflows
  // Check if workflow is linear
  const nodeConnections = new Map<string, { inCount: number; outCount: number }>();
  
  nodes.forEach(n => {
    nodeConnections.set(n.id, { inCount: 0, outCount: 0 });
  });

  connections.forEach(c => {
    const source = nodeConnections.get(c.source);
    const target = nodeConnections.get(c.target);
    
    if (source) source.outCount++;
    if (target) target.inCount++;
  });

  // Check for branching
  nodes.forEach(node => {
    const conns = nodeConnections.get(node.id);
    if (conns) {
      if (conns.outCount > 1) {
        errors.push({
          message: `Node "${node.action}" branches to multiple nodes - Zapier only supports linear workflows`,
          nodeId: node.id,
        });
      }
      if (conns.inCount > 1) {
        errors.push({
          message: `Node "${node.action}" has multiple inputs - Zapier only supports linear workflows`,
          nodeId: node.id,
        });
      }
    }
  });

  // Warn about complex logic
  const hasLogicNodes = nodes.some(n => n.type === 'logic');
  if (hasLogicNodes) {
    warnings.push({
      message: 'Zapier has limited support for complex logic nodes',
    });
  }

  return { errors, warnings };
}

