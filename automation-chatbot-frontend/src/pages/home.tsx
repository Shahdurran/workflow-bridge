import { useState, useEffect, useCallback } from "react";
import Header from "@/components/common/Header";
import Footer from "@/components/common/Footer";
import ChatContainer from "@/components/chat/chat-container";
import WorkflowCanvas from "@/components/workflow/workflow-canvas";
import RightPanel from "@/components/layout/right-panel";
import { WorkflowNode, WorkflowConnection, Platform } from "@/types/api";
import { useWorkflowState, exportWorkflowToFile } from "@/hooks/use-workflow-state";
import { useToast } from "@/hooks/use-toast";
import { Undo2, Redo2, Save, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  const [isRightPanelCollapsed, setIsRightPanelCollapsed] = useState(false);
  const [chatWidth, setChatWidth] = useState(40); // Percentage
  const [rightPanelWidth, setRightPanelWidth] = useState(320); // Pixels
  const [isDraggingChat, setIsDraggingChat] = useState(false);
  const [isDraggingRight, setIsDraggingRight] = useState(false);
  const { toast } = useToast();
  
  // Use centralized workflow state with undo/redo and persistence
  const { nodes, connections, platform, actions, lastSaved } = useWorkflowState('n8n');

  // Handle chat panel resize
  const handleChatResize = useCallback((e: MouseEvent) => {
    if (!isDraggingChat) return;
    
    const container = document.querySelector('[data-main-container]') as HTMLElement;
    if (!container) return;
    
    const containerRect = container.getBoundingClientRect();
    const newWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;
    
    // Constrain between 20% and 60%
    if (newWidth >= 20 && newWidth <= 60) {
      setChatWidth(newWidth);
    }
  }, [isDraggingChat]);

  // Handle right panel resize
  const handleRightPanelResize = useCallback((e: MouseEvent) => {
    if (!isDraggingRight) return;
    
    const container = document.querySelector('[data-main-container]') as HTMLElement;
    if (!container) return;
    
    const containerRect = container.getBoundingClientRect();
    const newWidth = containerRect.right - e.clientX;
    
    // Constrain between 200px and 500px
    if (newWidth >= 200 && newWidth <= 500) {
      setRightPanelWidth(newWidth);
    }
  }, [isDraggingRight]);

  // Mouse move and up handlers
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingChat) {
        handleChatResize(e);
      } else if (isDraggingRight) {
        handleRightPanelResize(e);
      }
    };

    const handleMouseUp = () => {
      setIsDraggingChat(false);
      setIsDraggingRight(false);
    };

    if (isDraggingChat || isDraggingRight) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDraggingChat, isDraggingRight, handleChatResize, handleRightPanelResize]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + Z - Undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (actions.canUndo) {
          actions.undo();
          toast({ title: "Undone", description: "Action undone" });
        }
      }
      
      // Ctrl/Cmd + Shift + Z or Ctrl/Cmd + Y - Redo
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        if (actions.canRedo) {
          actions.redo();
          toast({ title: "Redone", description: "Action redone" });
        }
      }
      
      // Ctrl/Cmd + S - Save workflow
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSaveWorkflow();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [actions, toast]);

  const addWorkflowNode = (node: WorkflowNode) => {
    console.log('📌 Adding workflow node:', node);
    actions.addNode(node);
  };

  const addWorkflowConnection = (connection: WorkflowConnection) => {
    actions.addConnection(connection);
  };

  const clearWorkflow = () => {
    console.log('🧹 Clearing workflow - current nodes:', nodes.length);
    actions.clearWorkflow();
    console.log('✅ Workflow cleared');
  };

  const loadWorkflow = (newNodes: WorkflowNode[], newConnections: WorkflowConnection[]) => {
    actions.loadWorkflow(newNodes, newConnections);
  };

  const handleSaveWorkflow = () => {
    if (nodes.length === 0) {
      toast({
        title: "Nothing to save",
        description: "Workflow is empty",
        variant: "destructive",
      });
      return;
    }

    exportWorkflowToFile(nodes, connections, platform, `workflow-${Date.now()}.json`);
    toast({
      title: "Workflow Saved",
      description: "Workflow exported successfully",
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col" data-testid="home-page">
      <Header />
      
      {/* Toolbar with Undo/Redo/Save */}
      <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={actions.undo}
            disabled={!actions.canUndo}
            title="Undo (Ctrl+Z)"
          >
            <Undo2 size={16} className="mr-1" />
            Undo
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={actions.redo}
            disabled={!actions.canRedo}
            title="Redo (Ctrl+Y)"
          >
            <Redo2 size={16} className="mr-1" />
            Redo
          </Button>
        </div>
        
        <div className="flex items-center gap-3">
          {lastSaved && (
            <span className="text-xs text-gray-500">
              Last saved: {lastSaved.toLocaleTimeString()}
            </span>
          )}
          <Button
            variant="default"
            size="sm"
            onClick={handleSaveWorkflow}
            disabled={nodes.length === 0}
            title="Save Workflow (Ctrl+S)"
          >
            <Save size={16} className="mr-1" />
            Save Workflow
          </Button>
        </div>
      </div>

      <div className="flex-1 flex" style={{ maxHeight: 'calc(100vh - 180px)' }} data-main-container>
        {/* Chat Interface Panel (Resizable) */}
        <div 
          className="flex-shrink-0 bg-white border-r border-gray-200 overflow-y-auto"
          style={{ width: `${chatWidth}%` }}
        >
          <ChatContainer 
            onWorkflowUpdate={addWorkflowNode}
            onConnectionUpdate={addWorkflowConnection}
            onClearWorkflow={clearWorkflow}
            currentPlatform={platform}
          />
        </div>

        {/* Chat Resize Handle */}
        <div
          className="w-1 bg-gray-200 hover:bg-blue-400 cursor-col-resize flex-shrink-0 group relative"
          onMouseDown={() => setIsDraggingChat(true)}
          title="Drag to resize chat panel"
        >
          <div className="absolute inset-y-0 -left-1 -right-1" />
        </div>

        {/* Workflow Canvas Panel (Flexible) */}
        <div className="flex-1 overflow-y-auto relative min-w-0">
          <WorkflowCanvas
            nodes={nodes}
            connections={connections}
            platform={platform}
            onPlatformChange={actions.setPlatform}
            onNodesChange={(newNodes) => {
              // Batch update nodes
              actions.loadWorkflow(newNodes, connections);
            }}
            onConnectionsChange={(newConnections) => {
              // Batch update connections
              actions.loadWorkflow(nodes, newConnections);
            }}
          />
          
          {/* Floating button to open collapsed right panel */}
          {isRightPanelCollapsed && (
            <Button
              onClick={() => setIsRightPanelCollapsed(false)}
              className="absolute top-4 right-4 z-50 bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 shadow-lg"
              size="icon"
              title="Show Templates & Migration"
            >
              <ChevronLeft size={20} />
            </Button>
          )}
        </div>

        {/* Right Panel Resize Handle (only visible when panel is open) */}
        {!isRightPanelCollapsed && (
          <div
            className="w-1 bg-gray-200 hover:bg-blue-400 cursor-col-resize flex-shrink-0 group relative"
            onMouseDown={() => setIsDraggingRight(true)}
            title="Drag to resize templates panel"
          >
            <div className="absolute inset-y-0 -left-1 -right-1" />
          </div>
        )}

        {/* Right Panel (Collapsible & Resizable) */}
        <div 
          className={`flex-shrink-0 overflow-y-auto transition-all duration-300 ${
            isRightPanelCollapsed ? 'w-0' : ''
          }`}
          style={{ width: isRightPanelCollapsed ? 0 : `${rightPanelWidth}px` }}
        >
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
