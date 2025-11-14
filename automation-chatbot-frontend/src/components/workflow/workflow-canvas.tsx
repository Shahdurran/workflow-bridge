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
} from "reactflow";
import "reactflow/dist/style.css";
import PlatformSelector from "./platform-selector";
import WorkflowNode from "./workflow-node";
import ExportPanel from "./export-panel";
import { WorkflowNode as WNode, WorkflowConnection } from "@/types/api";
import { Platform } from "@/pages/home";
import { Play, ZoomIn, ZoomOut, Maximize } from "lucide-react";
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

  // Convert workflow nodes to ReactFlow nodes
  useEffect(() => {
    const flowNodes: Node[] = nodes.map((node) => ({
      id: node.id,
      type: 'workflowNode',
      position: node.position,
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
    const flowEdges: Edge[] = connections.map((connection, index) => ({
      id: `edge-${index}`,
      source: connection.source,
      target: connection.target,
      type: 'smoothstep',
      animated: true,
      style: {
        stroke: platform === 'zapier' ? '#FF4A00' : platform === 'make' ? '#6366F1' : '#EA4B71',
        strokeWidth: 2,
      },
    }));
    setReactFlowEdges(flowEdges);
  }, [connections, platform, setReactFlowEdges]);

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
          onNodesChange={onNodesChangeHandler}
          onEdgesChange={onEdgesChangeHandler}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          connectionMode={ConnectionMode.Loose}
          fitView
        >
          <Background color="#e5e7eb" size={1} />
          <Controls showInteractive={false} />
        </ReactFlow>

        {/* Empty State */}
        {nodes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center" data-testid="workflow-empty-state">
            <div className="text-center">
              <div className="w-32 h-32 mx-auto mb-6 bg-gradient-to-br from-workflow-blue to-blue-600 rounded-full flex items-center justify-center">
                <div className="text-white text-4xl">⚡</div>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Start building your workflow
              </h3>
              <p className="text-gray-500 mb-4">
                Describe your automation in the chat and watch it come to life
              </p>
              <Button
                onClick={showDemo}
                className="bg-workflow-blue text-white hover:bg-blue-700"
                data-testid="button-show-demo"
              >
                <Play size={16} className="mr-2" />
                See Demo
              </Button>
            </div>
          </div>
        )}

        {/* Canvas Controls */}
        <div className="absolute bottom-4 right-4 flex space-x-2">
          <Button
            variant="outline"
            size="icon"
            className="bg-white border border-gray-300 shadow hover:shadow-md"
            data-testid="button-zoom-in"
          >
            <ZoomIn size={16} />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="bg-white border border-gray-300 shadow hover:shadow-md"
            data-testid="button-zoom-out"
          >
            <ZoomOut size={16} />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="bg-white border border-gray-300 shadow hover:shadow-md"
            data-testid="button-fullscreen"
          >
            <Maximize size={16} />
          </Button>
        </div>

        {/* Export Panel */}
        {showExportPanel && nodes.length > 0 && (
          <ExportPanel
            nodes={nodes}
            connections={connections}
            platform={platform}
            onClose={() => setShowExportPanel(false)}
          />
        )}
      </div>
    </div>
  );
}
