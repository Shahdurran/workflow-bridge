import { useState, useEffect, useRef } from "react";
import MessageBubble from "./message-bubble";
import InputField from "./input-field";
import QuickActions from "./quick-actions";
import { WorkflowNode } from "@/types/api";
import { Platform } from "@/pages/home";
import { Bot, Wrench } from "lucide-react";
import { streamN8nChat } from "@/services/api";

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  workflow?: any;
}

interface ChatContainerProps {
  onWorkflowUpdate: (node: WorkflowNode) => void;
  onConnectionUpdate: (connection: { source: string; target: string }) => void;
  onClearWorkflow?: () => void;
  currentPlatform: Platform;
}

export default function ChatContainer({ 
  onWorkflowUpdate, 
  onConnectionUpdate,
  onClearWorkflow, 
  currentPlatform 
}: ChatContainerProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: '👋 Hi! I\'m your AI workflow assistant powered by Claude and n8n-mcp. I can help you create n8n workflows through natural conversation. Just describe what you want to automate!',
      timestamp: new Date(),
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [currentTool, setCurrentTool] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isGeneratingWorkflow, setIsGeneratingWorkflow] = useState(false);
  const [workflowProgress, setWorkflowProgress] = useState({ current: 0, total: 0 });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const accumulatedTextRef = useRef('');
  const currentMessageIdRef = useRef<string | null>(null);
  const workflowNodesRef = useRef<any[]>([]);

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSendMessage = async (content: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);
    
    // Reset accumulated text
    accumulatedTextRef.current = '';
    currentMessageIdRef.current = `assistant-${Date.now()}`;

    try {
      // Route to appropriate endpoint based on platform
      const streamFunction = currentPlatform === 'make' 
        ? (await import('@/services/api')).streamMakeChat
        : (await import('@/services/api')).streamN8nChat;
      
      await streamFunction(content, conversationId || undefined, async (event) => {
        const { event: eventType, data } = event;

        switch (eventType) {
          case 'start':
            if (data.conversation_id) {
              setConversationId(data.conversation_id);
            }
            break;

          case 'message':
            const text = data.text || '';
            accumulatedTextRef.current += text;
            
            setMessages(prev => {
              const lastMessage = prev[prev.length - 1];
              if (lastMessage && lastMessage.id === currentMessageIdRef.current) {
                return [
                  ...prev.slice(0, -1),
                  { ...lastMessage, content: accumulatedTextRef.current }
                ];
              } else {
                return [
                  ...prev,
                  {
                    id: currentMessageIdRef.current!,
                    role: 'assistant' as const,
                    content: accumulatedTextRef.current,
                    timestamp: new Date(),
                  }
                ];
              }
            });
            break;

          case 'tool_use':
            setIsThinking(true);
            setCurrentTool(data.tool_name || 'Processing...');
            break;

          case 'tool_result':
            setIsThinking(false);
            setCurrentTool(null);
            break;

          case 'workflow_clear':
            // Clear existing workflow nodes when new workflow generation starts
            console.log('🧹 Clearing canvas for new workflow');
            setIsGeneratingWorkflow(true);
            setWorkflowProgress({ current: 0, total: 0 });
            workflowNodesRef.current = [];
            
            // Clear the canvas by calling parent's clear function
            if (onClearWorkflow) {
              onClearWorkflow();
              console.log('✅ Canvas cleared');
            }
            break;

          case 'workflow_node':
            // Handle incremental node streaming
            const nodeData = data.node;
            const nodeIndex = data.index;
            const nodeTotal = data.total;
            
            console.log(`📥 Received node ${nodeIndex + 1}/${nodeTotal}:`, nodeData.name);
            setWorkflowProgress({ current: nodeIndex + 1, total: nodeTotal });
            
            // Store node for later connection building
            workflowNodesRef.current.push(nodeData);
            
            // Transform and add node to canvas immediately
            try {
              const { transformN8nToCanvas } = await import('@/utils/workflow-transformer');
              // Transform just this one node with temporary workflow structure
              const tempWorkflow = {
                name: 'Temp',
                nodes: [nodeData],
                connections: {}
              };
              const { nodes } = transformN8nToCanvas(tempWorkflow);
              if (nodes.length > 0) {
                onWorkflowUpdate(nodes[0]);
              }
            } catch (error) {
              console.error('❌ Error transforming node:', error);
            }
            break;

          case 'workflow':
            // Update the current message with workflow
            setMessages(prev => {
              const lastMessage = prev[prev.length - 1];
              if (lastMessage && lastMessage.id === currentMessageIdRef.current) {
                return [
                  ...prev.slice(0, -1),
                  { ...lastMessage, workflow: data.workflow }
                ];
              }
              return prev;
            });
            
            // Extract nodes and connections for the canvas
            if (data.workflow) {
              console.log('🔄 Transforming workflow for canvas:', {
                platform: data.platform || currentPlatform,
                hasNodes: !!data.workflow.nodes,
                hasFlow: !!data.workflow.flow,
                hasSteps: !!data.workflow.steps,
                workflow: data.workflow
              });
              
              try {
                // Use the universal transformer with auto-detection
                const transformer = await import('@/utils/workflow-transformer');
                const platform = data.platform || currentPlatform;
                
                // Let transformToCanvas auto-detect the format
                const transformedData = transformer.transformToCanvas(data.workflow, platform);
                
                const { nodes, connections } = transformedData;
                
                console.log('✅ Transformed workflow:', {
                  nodes: nodes.length,
                  connections: connections.length,
                  nodesList: nodes.map(n => ({ id: n.id, app: n.app, action: n.action }))
                });
                
                // Only update if we got valid nodes
                if (nodes.length > 0) {
                  // Update canvas with transformed nodes
                  nodes.forEach(node => {
                    onWorkflowUpdate(node);
                  });
                  
                  // Update canvas with connections
                  connections.forEach(connection => {
                    onConnectionUpdate(connection);
                  });
                } else {
                  console.warn('⚠️ No nodes transformed from workflow');
                }
              } catch (error) {
                console.error('❌ Error transforming workflow:', error);
                // Fallback to original nodes if transformation fails
                data.workflow.nodes.forEach((node: any, index: number) => {
                  const workflowNode: WorkflowNode = {
                    id: node.id || `node-${index}`,
                    type: index === 0 ? 'trigger' : 'action',
                    app: node.type?.split('.').pop() || 'unknown',
                    action: node.name || `Node ${index + 1}`,
                    position: Array.isArray(node.position) 
                      ? { x: node.position[0], y: node.position[1] }
                      : node.position || { x: 100 + index * 300, y: 100 },
                    parameters: node.parameters,
                    nodeType: node.type,
                    typeVersion: node.typeVersion,
                  };
                  onWorkflowUpdate(workflowNode);
                });
              }
            }
            break;

          case 'done':
            setIsTyping(false);
            setIsThinking(false);
            setCurrentTool(null);
            setIsGeneratingWorkflow(false);
            setWorkflowProgress({ current: 0, total: 0 });
            workflowNodesRef.current = [];
            break;

          case 'error':
            setIsTyping(false);
            setIsThinking(false);
            setMessages(prev => [...prev, {
              id: Date.now().toString(),
              role: 'assistant',
              content: `Sorry, I encountered an error: ${data.message}`,
              timestamp: new Date(),
            }]);
            break;
        }
      });
    } catch (error) {
      setIsTyping(false);
      setIsThinking(false);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
      }]);
    }
  };

  const handleQuickAction = (action: string) => {
    const quickMessages = {
      'build': 'I want to build a new automation',
      'migrate': 'I need to migrate an existing workflow',
      'templates': 'Show me workflow templates'
    };
    
    if (quickMessages[action as keyof typeof quickMessages]) {
      handleSendMessage(quickMessages[action as keyof typeof quickMessages]);
    }
  };

  return (
    <div className="flex flex-col h-full" data-testid="chat-container">
      {/* Chat Header */}
      <div className="border-b border-gray-200 p-4 bg-gradient-to-r from-workflow-blue to-blue-600">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <Bot className="text-white" size={20} />
          </div>
          <div>
            <h3 className="font-semibold text-white">AI Workflow Assistant</h3>
            <p className="text-blue-100 text-sm">Powered by Claude AI & n8n-mcp</p>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4" 
        data-testid="chat-messages"
      >
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}

        {/* Quick Actions after first message */}
        {messages.length === 1 && (
          <QuickActions onAction={handleQuickAction} />
        )}

        {/* Thinking Indicator (Tool Use) */}
        {isThinking && (
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
              <Bot className="text-white" size={16} />
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg rounded-tl-none p-3">
              <div className="flex items-center gap-2 text-blue-800">
                <Wrench className="h-4 w-4 animate-pulse" />
                <span className="text-sm font-medium">{currentTool}</span>
              </div>
            </div>
          </div>
        )}

        {/* Workflow Generation Indicator */}
        {isGeneratingWorkflow && workflowProgress.total > 0 && (
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-workflow-blue rounded-full flex items-center justify-center flex-shrink-0">
              <Bot className="text-white" size={16} />
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg rounded-tl-none p-3 min-w-[200px]">
              <div className="flex items-center gap-2 text-blue-800 mb-2">
                <Wrench className="h-4 w-4 animate-pulse" />
                <span className="text-sm font-medium">Building workflow...</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-blue-200 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-workflow-blue h-full transition-all duration-300"
                    style={{ width: `${(workflowProgress.current / workflowProgress.total) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-blue-600 font-mono">
                  {workflowProgress.current}/{workflowProgress.total}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Typing Indicator */}
        {isTyping && !isThinking && (
          <div className="flex items-start space-x-3" data-testid="typing-indicator">
            <div className="w-8 h-8 bg-workflow-blue rounded-full flex items-center justify-center flex-shrink-0">
              <Bot className="text-white" size={16} />
            </div>
            <div className="bg-gray-100 rounded-lg rounded-tl-none p-3">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full typing-dots"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full typing-dots"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full typing-dots"></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input */}
      <InputField onSendMessage={handleSendMessage} />
    </div>
  );
}
