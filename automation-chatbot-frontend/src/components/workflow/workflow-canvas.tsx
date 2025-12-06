import { useCallback, useState, useEffect } from "react";
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  Connection,
  ConnectionMode,
  MiniMap,
} from "reactflow";
import "reactflow/dist/style.css";
import PlatformSelector from "./platform-selector";
import WorkflowNode from "./workflow-node";
import ExportPanel from "./export-panel";
import NodeEditorPanel from "./node-editor-panel";
import ValidationIndicator from "./validation-indicator";
import { WorkflowNode as WNode, WorkflowConnection, Platform } from "@/types/api";
import { useWorkflowValidation } from "@/hooks/use-workflow-validation";
import { Play, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

const nodeTypes = {
  workflowNode: WorkflowNode,
};

interface WorkflowCanvasProps {
  nodes: WNode[];
  connections: WorkflowConnection[];
  platform: Platform;
  onPlatformChange: (platform: Platform) => void;
  onNodesChange: (nodes: WNode[]) => void;
  onConnectionsChange: (connections: WorkflowConnection[]) => void;
}

export default function WorkflowCanvas({
  nodes,
  connections,
  platform,
  onPlatformChange,
  onNodesChange,
  onConnectionsChange,
}: WorkflowCanvasProps) {
  const [reactFlowNodes, setReactFlowNodes, onNodesChangeHandler] = useNodesState([]);
  const [reactFlowEdges, setReactFlowEdges, onEdgesChangeHandler] = useEdgesState([]);
  const [showExportPanel, setShowExportPanel] = useState(false);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  // Real-time workflow validation
  const validation = useWorkflowValidation(nodes, connections, platform);

  // Convert workflow nodes to ReactFlow nodes
  useEffect(() => {
    const flowNodes: Node[] = nodes.map((node) => ({
      id: node.id,
      type: 'workflowNode',
      position: Array.isArray(node.position) 
        ? { x: node.position[0], y: node.position[1] }
        : node.position,
      data: {
        app: node.app,
        action: node.action,
        type: node.type,
        platform,
      },
    }));
    setReactFlowNodes(flowNodes);
  }, [nodes, platform, setReactFlowNodes]);

  // Convert workflow connections to ReactFlow edges
  useEffect(() => {
    const flowEdges: Edge[] = connections.map((connection, index) => {
      const sourceNode = nodes.find(n => n.id === connection.source);
      const targetNode = nodes.find(n => n.id === connection.target);
      
      return {
        id: `edge-${index}`,
        source: connection.source,
        target: connection.target,
        type: 'smoothstep',
        animated: true,
        label: sourceNode && targetNode ? undefined : undefined, // Can add labels here
        style: {
          stroke: platform === 'zapier' ? '#FF4A00' : platform === 'make' ? '#6366F1' : '#EA4B71',
          strokeWidth: 2,
        },
        labelStyle: {
          fill: '#6b7280',
          fontSize: 10,
        },
        labelBgStyle: {
          fill: 'white',
          fillOpacity: 0.9,
        },
      };
    });
    setReactFlowEdges(flowEdges);
  }, [connections, platform, nodes, setReactFlowEdges]);

  const onConnect = useCallback(
    (params: Connection) => {
      const newConnection: WorkflowConnection = {
        source: params.source!,
        target: params.target!,
      };
      onConnectionsChange([...connections, newConnection]);
      setReactFlowEdges((eds) => addEdge(params, eds));
    },
    [connections, onConnectionsChange, setReactFlowEdges]
  );

  // Handle node position changes
  const handleNodesChange = useCallback(
    (changes: any) => {
      onNodesChangeHandler(changes);
      
      // Update parent component with new positions
      const updatedNodes = nodes.map(node => {
        const change = changes.find((c: any) => c.id === node.id && c.type === 'position');
        if (change && change.position) {
          return { ...node, position: change.position };
        }
        return node;
      });
      
      onNodesChange(updatedNodes);
    },
    [nodes, onNodesChange, onNodesChangeHandler]
  );

  // Handle node selection
  const handleNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      setSelectedNode(node);
    },
    []
  );

  // Handle node update from editor
  const handleNodeUpdate = useCallback(
    (updatedNode: WNode) => {
      const updatedNodes = nodes.map(n => n.id === updatedNode.id ? updatedNode : n);
      onNodesChange(updatedNodes);
      setSelectedNode(null);
    },
    [nodes, onNodesChange]
  );

  // Get selected workflow node
  const selectedWorkflowNode = selectedNode 
    ? nodes.find(n => n.id === selectedNode.id) || null
    : null;

  // Handle node deletion
  const handleNodesDelete = useCallback(
    (deletedNodes: Node[]) => {
      const deletedIds = new Set(deletedNodes.map(n => n.id));
      const updatedNodes = nodes.filter(n => !deletedIds.has(n.id));
      const updatedConnections = connections.filter(
        c => !deletedIds.has(c.source) && !deletedIds.has(c.target)
      );
      
      onNodesChange(updatedNodes);
      onConnectionsChange(updatedConnections);
      setSelectedNode(null);
    },
    [nodes, connections, onNodesChange, onConnectionsChange]
  );

  // Handle edge deletion
  const handleEdgesDelete = useCallback(
    (deletedEdges: Edge[]) => {
      const deletedConnections = deletedEdges.map(e => ({ source: e.source, target: e.target }));
      const updatedConnections = connections.filter(
        c => !deletedConnections.some(dc => dc.source === c.source && dc.target === c.target)
      );
      
      onConnectionsChange(updatedConnections);
    },
    [connections, onConnectionsChange]
  );

  const showDemo = () => {
    const demoNodes: WNode[] = [
      {
        id: 'trigger-1',
        type: 'trigger',
        app: 'google-forms',
        action: 'Form Submitted',
        position: { x: 100, y: 100 },
      },
      {
        id: 'action-1',
        type: 'action',
        app: 'slack',
        action: 'Send Message',
        position: { x: 400, y: 100 },
      },
    ];

    const demoConnections: WorkflowConnection[] = [
      { source: 'trigger-1', target: 'action-1' },
    ];

    onNodesChange(demoNodes);
    onConnectionsChange(demoConnections);
    setShowExportPanel(true);
  };

  return (
    <div className="flex flex-col h-full" data-testid="workflow-canvas">
      {/* Platform Selector */}
      <PlatformSelector
        currentPlatform={platform}
        onPlatformChange={onPlatformChange}
      />

      {/* Canvas */}
      <div className="flex-1 relative workflow-canvas">
        <ReactFlow
          nodes={reactFlowNodes}
          edges={reactFlowEdges}
          onNodesChange={handleNodesChange}
          onEdgesChange={onEdgesChangeHandler}
          onConnect={onConnect}
          onNodeClick={handleNodeClick}
          onNodesDelete={handleNodesDelete}
          onEdgesDelete={handleEdgesDelete}
          nodeTypes={nodeTypes}
          connectionMode={ConnectionMode.Loose}
          fitView
          nodesDraggable={true}
          nodesConnectable={true}
          elementsSelectable={true}
          selectNodesOnDrag={false}
          panOnDrag={true}
          zoomOnScroll={true}
          deleteKeyCode="Delete"
        >
          <Background color="#e5e7eb" size={1} />
          <Controls showInteractive={true} />
          <MiniMap
            nodeColor={(node) => {
              // Color nodes based on type
              if (node.data?.type === 'trigger') return '#10b981'; // green
              if (node.data?.type === 'action') return '#3b82f6'; // blue
              return '#8b5cf6'; // purple
            }}
            className="bg-white border border-gray-200 rounded shadow-sm"
            pannable
            zoomable
          />
        </ReactFlow>

        {/* Empty State */}
        {nodes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center" data-testid="workflow-empty-state">
            <div className="text-center max-w-md">
              <div className="relative w-40 h-40 mx-auto mb-8">
                <div className="absolute inset-0 bg-gradient-to-br from-workflow-blue via-blue-500 to-purple-600 rounded-full opacity-20 animate-pulse" />
                <div className="absolute inset-4 bg-gradient-to-br from-workflow-blue to-blue-600 rounded-full flex items-center justify-center">
                  <div className="text-white text-5xl">⚡</div>
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Start Building Your Workflow
              </h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Describe your automation in the chat and watch it come to life on this canvas. 
                Or try our demo to see how it works.
              </p>
              <div className="flex flex-col gap-2 items-center">
                <Button
                  onClick={showDemo}
                  className="bg-workflow-blue text-white hover:bg-blue-700 shadow-lg"
                  data-testid="button-show-demo"
                >
                  <Play size={16} className="mr-2" />
                  See Demo Workflow
                </Button>
                <p className="text-xs text-gray-400 mt-2">
                  💡 Tip: Try saying "Create a workflow that sends Slack notifications when a form is submitted"
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Validation Indicator */}
        {nodes.length > 0 && (
          <div className="absolute top-4 left-4 z-10">
            <ValidationIndicator
              isValid={validation.isValid}
              errors={validation.errors}
              warnings={validation.warnings}
              isValidating={validation.isValidating}
              position="corner"
            />
          </div>
        )}

        {/* Workflow Header */}
        {nodes.length > 0 && (
          <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg border border-gray-200 px-4 py-2 z-10">
            <div className="flex items-center gap-4">
              <div className="text-sm">
                <span className="text-gray-500">Nodes:</span>{' '}
                <span className="font-semibold text-gray-900">{nodes.length}</span>
              </div>
              <div className="text-sm">
                <span className="text-gray-500">Connections:</span>{' '}
                <span className="font-semibold text-gray-900">{connections.length}</span>
              </div>
              <div className="h-4 w-px bg-gray-300" />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowExportPanel(!showExportPanel)}
                data-testid="button-export"
              >
                <Download size={14} className="mr-1" />
                Export
              </Button>
            </div>
          </div>
        )}

        {/* Export Panel */}
        {showExportPanel && nodes.length > 0 && (
          <ExportPanel
            nodes={nodes}
            connections={connections}
            platform={platform}
            onClose={() => setShowExportPanel(false)}
          />
        )}

        {/* Node Editor Panel */}
        {selectedWorkflowNode && (
          <NodeEditorPanel
            node={selectedWorkflowNode}
            onClose={() => setSelectedNode(null)}
            onUpdate={handleNodeUpdate}
          />
        )}
      </div>
    </div>
  );
}
