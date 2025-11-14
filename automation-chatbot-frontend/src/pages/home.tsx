import { useState } from "react";
import Header from "@/components/common/header";
import Footer from "@/components/common/footer";
import ChatContainer from "@/components/chat/chat-container";
import WorkflowCanvas from "@/components/workflow/workflow-canvas";
import RightPanel from "@/components/layout/right-panel";
import { WorkflowNode, WorkflowConnection, Platform } from "@/types/api";

export default function Home() {
  const [currentPlatform, setCurrentPlatform] = useState<Platform>('zapier');
  const [workflowNodes, setWorkflowNodes] = useState<WorkflowNode[]>([]);
  const [workflowConnections, setWorkflowConnections] = useState<WorkflowConnection[]>([]);
  const [isRightPanelCollapsed, setIsRightPanelCollapsed] = useState(false);

  const addWorkflowNode = (node: WorkflowNode) => {
    setWorkflowNodes(prev => [...prev, node]);
  };

  const addWorkflowConnection = (connection: WorkflowConnection) => {
    setWorkflowConnections(prev => [...prev, connection]);
  };

  const clearWorkflow = () => {
    setWorkflowNodes([]);
    setWorkflowConnections([]);
  };

  const loadWorkflow = (nodes: WorkflowNode[], connections: WorkflowConnection[]) => {
    setWorkflowNodes(nodes);
    setWorkflowConnections(connections);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col" data-testid="home-page">
      <Header />
      
      <div className="flex-1 flex overflow-hidden">
        {/* Chat Interface Panel (40%) */}
        <div className="w-2/5 flex-shrink-0 bg-white border-r border-gray-200">
          <ChatContainer 
            onWorkflowUpdate={addWorkflowNode}
            onConnectionUpdate={addWorkflowConnection}
            currentPlatform={currentPlatform}
          />
        </div>

        {/* Workflow Canvas Panel (60%) */}
        <div className="flex-1 flex flex-col">
          <WorkflowCanvas
            nodes={workflowNodes}
            connections={workflowConnections}
            platform={currentPlatform}
            onPlatformChange={setCurrentPlatform}
            onNodesChange={setWorkflowNodes}
            onConnectionsChange={setWorkflowConnections}
          />
        </div>

        {/* Right Panel (Collapsible) */}
        <div className={`transition-all duration-300 ${isRightPanelCollapsed ? 'w-0' : 'w-80'} flex-shrink-0`}>
          <RightPanel
            isCollapsed={isRightPanelCollapsed}
            onToggle={() => setIsRightPanelCollapsed(!isRightPanelCollapsed)}
            onLoadTemplate={loadWorkflow}
            onClearWorkflow={clearWorkflow}
          />
        </div>
      </div>

      <Footer />
    </div>
  );
}
