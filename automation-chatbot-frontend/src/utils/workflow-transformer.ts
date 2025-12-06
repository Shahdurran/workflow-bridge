/**
 * Workflow Transformer Utilities
 * 
 * Transforms workflows between different platform formats and canvas representation
 */

import { WorkflowNode, WorkflowConnection, Platform } from '@/types/api';

// ============================================================================
// Type Definitions
// ============================================================================

export interface N8nNode {
  id: string;
  name: string;
  type: string;
  typeVersion: number;
  position: [number, number];
  parameters: Record<string, any>;
  credentials?: Record<string, any>;
  disabled?: boolean;
  notes?: string;
  continueOnFail?: boolean;
  retryOnFail?: boolean;
  maxTries?: number;
  waitBetweenTries?: number;
}

export interface N8nWorkflow {
  name: string;
  nodes: N8nNode[];
  connections: Record<string, any>;
  settings?: Record<string, any>;
  active?: boolean;
  tags?: string[];
}

export interface MakeModule {
  id: number;
  module: string;
  version: number;
  parameters: Record<string, any>;
  mapper?: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface MakeScenario {
  name: string;
  flow: MakeModule[];
  metadata?: Record<string, any>;
}

export interface ZapierStep {
  id: string;
  app: string;
  event: string;
  params: Record<string, any>;
}

export interface ZapierZap {
  title: string;
  steps: ZapierStep[];
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Extract app name from n8n node type
 * e.g., "n8n-nodes-base.webhook" -> "webhook"
 * e.g., "n8n-nodes-base.gmailTrigger" -> "gmail"
 */
export function extractNodeApp(nodeType: string): string {
  if (!nodeType) return 'unknown';
  
  // Remove n8n-nodes-base prefix
  const parts = nodeType.split('.');
  const nodeShort = parts[parts.length - 1] || 'unknown';
  
  // Remove "Trigger" suffix if present
  const appName = nodeShort.replace(/Trigger$/i, '');
  
  // Convert camelCase to kebab-case
  return appName
    .replace(/([A-Z])/g, '-$1')
    .toLowerCase()
    .replace(/^-/, '');
}

/**
 * Determine if a node is a trigger based on type
 */
export function isTriggerNode(nodeType: string, name: string, index: number): boolean {
  // First node is usually a trigger
  if (index === 0) return true;
  
  // Check if type contains "trigger"
  if (nodeType.toLowerCase().includes('trigger')) return true;
  
  // Check if name contains "trigger"
  if (name.toLowerCase().includes('trigger')) return true;
  
  // Check for webhook nodes (also triggers)
  if (nodeType.toLowerCase().includes('webhook')) return true;
  
  return false;
}

/**
 * Normalize position to {x, y} format
 */
export function normalizePosition(position: { x: number; y: number } | [number, number]): { x: number; y: number } {
  if (Array.isArray(position)) {
    return { x: position[0], y: position[1] };
  }
  return position;
}

/**
 * Convert position to array format [x, y]
 */
export function positionToArray(position: { x: number; y: number } | [number, number]): [number, number] {
  if (Array.isArray(position)) {
    return position;
  }
  return [position.x, position.y];
}

// ============================================================================
// n8n Transformations
// ============================================================================

/**
 * Transform n8n workflow nodes to canvas format
 */
export function transformN8nToCanvas(workflow: N8nWorkflow): {
  nodes: WorkflowNode[];
  connections: WorkflowConnection[];
} {
  const nodes: WorkflowNode[] = [];
  const connections: WorkflowConnection[] = [];
  
  // Transform nodes
  workflow.nodes.forEach((node, index) => {
    const appName = extractNodeApp(node.type);
    const isTrigger = isTriggerNode(node.type, node.name, index);
    
    const canvasNode: WorkflowNode = {
      id: node.id,
      type: isTrigger ? 'trigger' : 'action',
      app: appName,
      action: node.name,
      position: normalizePosition(node.position),
      nodeType: node.type,
      parameters: node.parameters,
      credentials: node.credentials,
      typeVersion: node.typeVersion,
      disabled: node.disabled,
      notes: node.notes,
      continueOnFail: node.continueOnFail,
      retryOnFail: node.retryOnFail,
      maxTries: node.maxTries,
      waitBetweenTries: node.waitBetweenTries,
    };
    
    nodes.push(canvasNode);
  });
  
  // Transform connections
  // n8n connections format: { "Node1": { "main": [[{ "node": "Node2", "type": "main", "index": 0 }]] } }
  Object.entries(workflow.connections).forEach(([sourceNodeName, outputs]) => {
    // Find source node by name
    const sourceNode = workflow.nodes.find(n => n.name === sourceNodeName);
    if (!sourceNode) return;
    
    // Process all output connections
    Object.values(outputs as Record<string, any>).forEach((connectionArrays: any) => {
      if (!Array.isArray(connectionArrays)) return;
      
      connectionArrays.forEach((connectionArray: any) => {
        if (!Array.isArray(connectionArray)) return;
        
        connectionArray.forEach((conn: any) => {
          // Find target node by name
          const targetNode = workflow.nodes.find(n => n.name === conn.node);
          if (!targetNode) return;
          
          connections.push({
            source: sourceNode.id,
            target: targetNode.id,
          });
        });
      });
    });
  });
  
  return { nodes, connections };
}

/**
 * Transform canvas nodes back to n8n format
 */
export function transformCanvasToN8n(
  nodes: WorkflowNode[],
  connections: WorkflowConnection[],
  workflowName: string = 'Workflow'
): N8nWorkflow {
  const n8nNodes: N8nNode[] = nodes.map(node => ({
    id: node.id,
    name: node.action,
    type: node.nodeType || `n8n-nodes-base.${node.app}`,
    typeVersion: node.typeVersion || 1,
    position: positionToArray(node.position),
    parameters: node.parameters || {},
    credentials: node.credentials,
    disabled: node.disabled,
    notes: node.notes,
    continueOnFail: node.continueOnFail,
    retryOnFail: node.retryOnFail,
    maxTries: node.maxTries,
    waitBetweenTries: node.waitBetweenTries,
  }));
  
  // Build n8n connections format
  const n8nConnections: Record<string, any> = {};
  
  connections.forEach(conn => {
    const sourceNode = nodes.find(n => n.id === conn.source);
    const targetNode = nodes.find(n => n.id === conn.target);
    
    if (!sourceNode || !targetNode) return;
    
    const sourceName = sourceNode.action;
    
    if (!n8nConnections[sourceName]) {
      n8nConnections[sourceName] = { main: [[]] };
    }
    
    n8nConnections[sourceName].main[0].push({
      node: targetNode.action,
      type: 'main',
      index: 0,
    });
  });
  
  return {
    name: workflowName,
    nodes: n8nNodes,
    connections: n8nConnections,
    active: false,
  };
}

// ============================================================================
// Make.com Transformations
// ============================================================================

/**
 * Transform Make scenario to canvas format
 */
export function transformMakeToCanvas(scenario: MakeScenario | any): {
  nodes: WorkflowNode[];
  connections: WorkflowConnection[];
} {
  const nodes: WorkflowNode[] = [];
  const connections: WorkflowConnection[] = [];
  
  // Validate that we have flow array
  if (!scenario.flow || !Array.isArray(scenario.flow)) {
    console.warn('⚠️ Invalid Make format: missing or invalid flow array', scenario);
    
    // Fallback: try to handle if it's actually n8n format
    if (scenario.nodes && Array.isArray(scenario.nodes)) {
      console.log('🔄 Detected n8n format, using n8n transformer instead');
      return transformN8nToCanvas(scenario as N8nWorkflow);
    }
    
    return { nodes: [], connections: [] };
  }
  
  // Transform modules to nodes
  scenario.flow.forEach((module, index) => {
    const appName = module.module.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const isTrigger = index === 0; // First module is usually trigger
    
    const canvasNode: WorkflowNode = {
      id: module.id.toString(),
      type: isTrigger ? 'trigger' : 'action',
      app: appName,
      action: module.module,
      position: { x: 100 + index * 300, y: 100 },
      parameters: module.parameters,
      data: module.mapper,
    };
    
    nodes.push(canvasNode);
  });
  
  // Create sequential connections
  for (let i = 0; i < nodes.length - 1; i++) {
    connections.push({
      source: nodes[i].id,
      target: nodes[i + 1].id,
    });
  }
  
  return { nodes, connections };
}

/**
 * Transform canvas nodes to Make scenario format
 */
export function transformCanvasToMake(
  nodes: WorkflowNode[],
  connections: WorkflowConnection[],
  scenarioName: string = 'Scenario'
): MakeScenario {
  const modules: MakeModule[] = nodes.map((node, index) => ({
    id: parseInt(node.id) || index + 1,
    module: node.app,
    version: 1,
    parameters: node.parameters || {},
    mapper: node.data,
  }));
  
  return {
    name: scenarioName,
    flow: modules,
  };
}

// ============================================================================
// Zapier Transformations
// ============================================================================

/**
 * Transform Zapier zap to canvas format
 */
export function transformZapierToCanvas(zap: ZapierZap | any): {
  nodes: WorkflowNode[];
  connections: WorkflowConnection[];
} {
  const nodes: WorkflowNode[] = [];
  const connections: WorkflowConnection[] = [];
  
  // Validate that we have steps array
  if (!zap.steps || !Array.isArray(zap.steps)) {
    console.warn('⚠️ Invalid Zapier format: missing or invalid steps array', zap);
    
    // Fallback: try to handle if it's actually n8n format
    if (zap.nodes && Array.isArray(zap.nodes)) {
      console.log('🔄 Detected n8n format, using n8n transformer instead');
      return transformN8nToCanvas(zap as N8nWorkflow);
    }
    
    return { nodes: [], connections: [] };
  }
  
  // Transform steps to nodes
  zap.steps.forEach((step, index) => {
    const isTrigger = index === 0;
    
    const canvasNode: WorkflowNode = {
      id: step.id,
      type: isTrigger ? 'trigger' : 'action',
      app: step.app,
      action: step.event,
      position: { x: 100 + index * 300, y: 100 },
      parameters: step.params,
    };
    
    nodes.push(canvasNode);
  });
  
  // Create sequential connections
  for (let i = 0; i < nodes.length - 1; i++) {
    connections.push({
      source: nodes[i].id,
      target: nodes[i + 1].id,
    });
  }
  
  return { nodes, connections };
}

/**
 * Transform canvas nodes to Zapier zap format
 */
export function transformCanvasToZapier(
  nodes: WorkflowNode[],
  connections: WorkflowConnection[],
  zapTitle: string = 'Zap'
): ZapierZap {
  const steps: ZapierStep[] = nodes.map(node => ({
    id: node.id,
    app: node.app,
    event: node.action,
    params: node.parameters || {},
  }));
  
  return {
    title: zapTitle,
    steps,
  };
}

// ============================================================================
// Universal Transformer
// ============================================================================

/**
 * Auto-detect workflow format based on structure
 */
export function detectWorkflowFormat(workflow: any): Platform | null {
  if (!workflow || typeof workflow !== 'object') {
    return null;
  }
  
  // Check for n8n format (has nodes array and connections object)
  if (workflow.nodes && Array.isArray(workflow.nodes) && workflow.connections) {
    return 'n8n';
  }
  
  // Check for Make format (has flow array with modules)
  if (workflow.flow && Array.isArray(workflow.flow)) {
    return 'make';
  }
  
  // Check for Zapier format (has steps array)
  if (workflow.steps && Array.isArray(workflow.steps)) {
    return 'zapier';
  }
  
  return null;
}

/**
 * Transform any workflow format to canvas format
 */
export function transformToCanvas(
  workflow: any,
  platform?: Platform
): { nodes: WorkflowNode[]; connections: WorkflowConnection[] } {
  // Auto-detect format if not specified or if specified format doesn't match
  const detectedFormat = detectWorkflowFormat(workflow);
  const actualPlatform = detectedFormat || platform || 'n8n';
  
  if (platform && detectedFormat && platform !== detectedFormat) {
    console.warn(`⚠️ Platform mismatch: specified '${platform}' but detected '${detectedFormat}'. Using detected format.`);
  }
  
  switch (actualPlatform) {
    case 'n8n':
      return transformN8nToCanvas(workflow as N8nWorkflow);
    case 'make':
      return transformMakeToCanvas(workflow as MakeScenario);
    case 'zapier':
      return transformZapierToCanvas(workflow as ZapierZap);
    default:
      console.error('❌ Unable to detect workflow format:', workflow);
      return { nodes: [], connections: [] };
  }
}

/**
 * Transform canvas format to target platform format
 */
export function transformFromCanvas(
  nodes: WorkflowNode[],
  connections: WorkflowConnection[],
  platform: Platform,
  workflowName: string = 'Workflow'
): any {
  switch (platform) {
    case 'n8n':
      return transformCanvasToN8n(nodes, connections, workflowName);
    case 'make':
      return transformCanvasToMake(nodes, connections, workflowName);
    case 'zapier':
      return transformCanvasToZapier(nodes, connections, workflowName);
    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }
}

