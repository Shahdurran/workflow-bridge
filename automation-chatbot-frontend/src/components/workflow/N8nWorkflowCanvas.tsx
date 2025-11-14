/**
 * N8n Workflow Canvas Component
 * 
 * Visual node-based workflow representation with:
 * - Interactive node cards
 * - SVG connection lines
 * - Auto-layout algorithm
 * - Expandable node details
 */

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  ChevronDown, 
  ChevronUp, 
  Mail, 
  Database, 
  Webhook, 
  Zap,
  Clock,
  Code,
  FileText,
  Send,
  Globe
} from 'lucide-react';

interface N8nNode {
  id: string;
  name: string;
  type: string;
  parameters?: Record<string, any>;
  position?: [number, number];
  typeVersion?: number;
}

interface N8nConnection {
  [key: string]: {
    [key: string]: Array<{
      node: string;
      type: string;
      index: number;
    }>;
  };
}

interface N8nWorkflowCanvasProps {
  workflow: {
    name?: string;
    nodes: N8nNode[];
    connections?: N8nConnection;
    settings?: Record<string, any>;
  };
}

// Icon mapping for different node types
const getNodeIcon = (nodeType: string) => {
  const type = nodeType.toLowerCase();
  
  if (type.includes('gmail') || type.includes('email') || type.includes('mail')) {
    return <Mail className="h-5 w-5" />;
  }
  if (type.includes('sheet') || type.includes('excel') || type.includes('database') || type.includes('postgres') || type.includes('mysql')) {
    return <Database className="h-5 w-5" />;
  }
  if (type.includes('webhook') || type.includes('trigger')) {
    return <Webhook className="h-5 w-5" />;
  }
  if (type.includes('schedule') || type.includes('cron')) {
    return <Clock className="h-5 w-5" />;
  }
  if (type.includes('code') || type.includes('function')) {
    return <Code className="h-5 w-5" />;
  }
  if (type.includes('http') || type.includes('request')) {
    return <Globe className="h-5 w-5" />;
  }
  if (type.includes('slack') || type.includes('discord') || type.includes('telegram')) {
    return <Send className="h-5 w-5" />;
  }
  
  return <Zap className="h-5 w-5" />;
};

// Get node color based on type
const getNodeColor = (nodeType: string) => {
  const type = nodeType.toLowerCase();
  
  if (type.includes('trigger') || type.includes('webhook') || type.includes('schedule')) {
    return 'from-green-400 to-emerald-500';
  }
  if (type.includes('gmail') || type.includes('mail')) {
    return 'from-red-400 to-rose-500';
  }
  if (type.includes('sheet') || type.includes('database')) {
    return 'from-blue-400 to-indigo-500';
  }
  if (type.includes('slack') || type.includes('discord')) {
    return 'from-purple-400 to-violet-500';
  }
  if (type.includes('http')) {
    return 'from-orange-400 to-amber-500';
  }
  
  return 'from-gray-400 to-slate-500';
};

// Calculate node positions for auto-layout
const calculateNodePositions = (nodes: N8nNode[], connections: N8nConnection = {}): Map<string, { x: number; y: number }> => {
  const positions = new Map<string, { x: number; y: number }>();
  
  // Build a dependency graph
  const nodeMap = new Map<string, Set<string>>();
  nodes.forEach(node => {
    nodeMap.set(node.name, new Set());
  });
  
  // Fill in connections
  Object.entries(connections).forEach(([sourceNode, outputs]) => {
    Object.values(outputs).forEach(outputConnections => {
      outputConnections.forEach(conn => {
        nodeMap.get(conn.node)?.add(sourceNode);
      });
    });
  });
  
  // Topological sort to determine levels
  const levels: string[][] = [];
  const visited = new Set<string>();
  const inDegree = new Map<string, number>();
  
  nodes.forEach(node => {
    const deps = nodeMap.get(node.name) || new Set();
    inDegree.set(node.name, deps.size);
  });
  
  // BFS level assignment
  let currentLevel: string[] = [];
  nodes.forEach(node => {
    if (inDegree.get(node.name) === 0) {
      currentLevel.push(node.name);
      visited.add(node.name);
    }
  });
  
  while (currentLevel.length > 0) {
    levels.push([...currentLevel]);
    const nextLevel: string[] = [];
    
    currentLevel.forEach(nodeName => {
      // Find nodes that depend on this one
      Object.entries(connections).forEach(([sourceNode, outputs]) => {
        if (sourceNode === nodeName) {
          Object.values(outputs).forEach(outputConnections => {
            outputConnections.forEach(conn => {
              if (!visited.has(conn.node)) {
                const degree = inDegree.get(conn.node)! - 1;
                inDegree.set(conn.node, degree);
                
                if (degree === 0) {
                  nextLevel.push(conn.node);
                  visited.add(conn.node);
                }
              }
            });
          });
        }
      });
    });
    
    currentLevel = nextLevel;
  }
  
  // Add any remaining nodes (disconnected)
  nodes.forEach(node => {
    if (!visited.has(node.name)) {
      if (levels.length === 0) {
        levels.push([node.name]);
      } else {
        levels[levels.length - 1].push(node.name);
      }
    }
  });
  
  // Calculate positions
  const nodeWidth = 280;
  const nodeHeight = 100;
  const horizontalGap = 150;
  const verticalGap = 80;
  
  levels.forEach((level, levelIndex) => {
    const levelWidth = level.length * nodeWidth + (level.length - 1) * horizontalGap;
    const startX = Math.max(50, (800 - levelWidth) / 2);
    
    level.forEach((nodeName, nodeIndex) => {
      positions.set(nodeName, {
        x: startX + nodeIndex * (nodeWidth + horizontalGap),
        y: 50 + levelIndex * (nodeHeight + verticalGap)
      });
    });
  });
  
  return positions;
};

export const N8nWorkflowCanvas = ({ workflow }: N8nWorkflowCanvasProps) => {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  
  const nodes = workflow.nodes || [];
  const connections = workflow.connections || {};
  
  // Debug logging
  console.log('N8nWorkflowCanvas - Workflow:', workflow);
  console.log('N8nWorkflowCanvas - Nodes:', nodes);
  console.log('N8nWorkflowCanvas - Connections:', connections);
  
  // Calculate positions
  const positions = calculateNodePositions(nodes, connections);
  
  // Calculate canvas dimensions with fallback
  const positionValues = Array.from(positions.values());
  const maxX = positionValues.length > 0 ? Math.max(...positionValues.map(p => p.x)) + 350 : 800;
  const maxY = positionValues.length > 0 ? Math.max(...positionValues.map(p => p.y)) + 150 : 400;
  const canvasWidth = Math.max(800, maxX);
  const canvasHeight = Math.max(400, maxY);
  
  // Check if we have valid data
  if (!nodes || nodes.length === 0) {
    console.warn('⚠️ N8nWorkflowCanvas - No nodes to display');
    return (
      <div className="w-full bg-gradient-to-br from-slate-50 to-gray-100 rounded-lg border border-gray-200 p-12 text-center">
        <p className="text-gray-500 font-medium">No workflow nodes to display</p>
        <p className="text-gray-400 text-sm mt-2">The workflow data may not have been received yet</p>
      </div>
    );
  }
  
  const toggleNodeExpanded = (nodeId: string) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  };
  
  // Render connection lines
  const renderConnections = () => {
    const lines: JSX.Element[] = [];
    
    Object.entries(connections).forEach(([sourceNodeName, outputs]) => {
      const sourcePos = positions.get(sourceNodeName);
      if (!sourcePos) return;
      
      Object.values(outputs).forEach(outputConnections => {
        outputConnections.forEach((conn, idx) => {
          const targetPos = positions.get(conn.node);
          if (!targetPos) return;
          
          const x1 = sourcePos.x + 140; // Center of source node
          const y1 = sourcePos.y + 50;
          const x2 = targetPos.x + 140; // Center of target node
          const y2 = targetPos.y + 50;
          
          // Create curved path
          const midY = (y1 + y2) / 2;
          const path = `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`;
          
          lines.push(
            <g key={`${sourceNodeName}-${conn.node}-${idx}`}>
              <path
                d={path}
                stroke="#94a3b8"
                strokeWidth="2"
                fill="none"
                strokeDasharray="0"
                markerEnd="url(#arrowhead)"
              />
            </g>
          );
        });
      });
    });
    
    return lines;
  };
  
  return (
    <div className="w-full bg-gradient-to-br from-slate-50 to-gray-100 rounded-lg border border-gray-200 overflow-auto">
      <svg
        width={canvasWidth}
        height={canvasHeight}
        className="relative"
      >
        {/* Arrow marker definition */}
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="10"
            refX="9"
            refY="3"
            orient="auto"
          >
            <polygon points="0 0, 10 3, 0 6" fill="#94a3b8" />
          </marker>
        </defs>
        
        {/* Render connections */}
        {renderConnections()}
        
        {/* Render nodes */}
        {nodes.map((node, index) => {
          // Try multiple ways to get position
          const pos = positions.get(node.name) || 
                     positions.get(node.id) || 
                     { x: 100 + index * 300, y: 100 }; // Fallback to simple layout
          
          const isExpanded = expandedNodes.has(node.id);
          const nodeColor = getNodeColor(node.type);
          const icon = getNodeIcon(node.type);
          
          console.log(`Rendering node: ${node.name}, position:`, pos);
          
          return (
            <foreignObject
              key={node.id}
              x={pos.x}
              y={pos.y}
              width="280"
              height={isExpanded ? "auto" : "100"}
            >
              <Card className="shadow-lg hover:shadow-xl transition-shadow border-2 border-white">
                <div className={`p-3 bg-gradient-to-r ${nodeColor} text-white rounded-t-lg`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {icon}
                      <div>
                        <div className="font-semibold text-sm">{node.name}</div>
                        <div className="text-xs opacity-90">
                          {node.type.split('.').pop()}
                        </div>
                      </div>
                    </div>
                    
                    {node.parameters && Object.keys(node.parameters).length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleNodeExpanded(node.id)}
                        className="h-6 w-6 p-0 hover:bg-white/20 text-white"
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                  </div>
                </div>
                
                {isExpanded && node.parameters && (
                  <div className="p-3 bg-white space-y-2 max-h-48 overflow-y-auto">
                    <div className="text-xs font-semibold text-gray-700 mb-2">Parameters:</div>
                    {Object.entries(node.parameters).map(([key, value]) => (
                      <div key={key} className="text-xs">
                        <span className="font-medium text-gray-700">{key}:</span>{' '}
                        <span className="text-gray-600">
                          {typeof value === 'object' 
                            ? JSON.stringify(value).substring(0, 50) + '...'
                            : String(value).substring(0, 50)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </foreignObject>
          );
        })}
      </svg>
    </div>
  );
};

export default N8nWorkflowCanvas;

