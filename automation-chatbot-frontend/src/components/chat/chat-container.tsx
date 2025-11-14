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
  currentPlatform: Platform;
}

export default function ChatContainer({ 
  onWorkflowUpdate, 
  onConnectionUpdate, 
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const accumulatedTextRef = useRef('');
  const currentMessageIdRef = useRef<string | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
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
      await streamN8nChat(content, conversationId || undefined, (event) => {
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
            if (data.workflow && data.workflow.nodes) {
              console.log('🔄 Transforming n8n workflow nodes for WorkflowCanvas');
              
              data.workflow.nodes.forEach((node: any, index: number) => {
                // Transform n8n node structure to WorkflowCanvas format
                // n8n node type is like "n8n-nodes-base.gmailTrigger"
                const nodeTypeParts = node.type?.split('.') || [];
                const nodeTypeShort = nodeTypeParts[nodeTypeParts.length - 1] || 'unknown';
                
                // Determine if it's a trigger or action (first node is usually trigger)
                const isTrigger = index === 0 || nodeTypeShort.toLowerCase().includes('trigger');
                
                // Extract app name from node type
                const appName = nodeTypeShort
                  .replace(/Trigger$/i, '')
                  .replace(/([A-Z])/g, '-$1')
                  .toLowerCase()
                  .replace(/^-/, '');
                
                const workflowNode: WorkflowNode = {
                  id: node.id || `node-${index}`,
                  type: isTrigger ? 'trigger' : 'action',
                  app: appName,
                  action: node.name || `Node ${index + 1}`,
                  platform: currentPlatform,
                  position: node.position 
                    ? { x: node.position[0], y: node.position[1] }
                    : { x: 100 + index * 300, y: 100 }
                };
                
                console.log('🔄 Transformed node:', nodeTypeShort, '→', workflowNode);
                onWorkflowUpdate(workflowNode);
              });
              
              // Create connections between sequential nodes
              if (data.workflow.connections) {
                Object.entries(data.workflow.connections).forEach(([sourceNodeName, outputs]: [string, any]) => {
                  Object.values(outputs).forEach((connections: any) => {
                    connections.forEach((conn: any) => {
                      // Find node IDs by name
                      const sourceNode = data.workflow.nodes.find((n: any) => n.name === sourceNodeName);
                      const targetNode = data.workflow.nodes.find((n: any) => n.name === conn.node);
                      
                      if (sourceNode && targetNode) {
                        onConnectionUpdate({
                          source: sourceNode.id,
                          target: targetNode.id
                        });
                      }
                    });
                  });
                });
              }
            }
            break;

          case 'done':
            setIsTyping(false);
            setIsThinking(false);
            setCurrentTool(null);
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
      <div className="flex-1 overflow-y-auto p-4 space-y-4" data-testid="chat-messages">
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
