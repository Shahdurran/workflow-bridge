import { useState, useEffect, useRef } from "react";
import MessageBubble from "./message-bubble";
import InputField from "./input-field";
import QuickActions from "./quick-actions";
import { simulateAIResponse, getInitialMessage } from "@/utils/ai-simulator";
import { WorkflowNode } from "@shared/schema";
import { Platform } from "@/pages/home";
import { Bot, User } from "lucide-react";

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
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
      content: getInitialMessage(),
      timestamp: new Date(),
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

    // Simulate AI response delay
    await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000));

    const aiResponse = await simulateAIResponse(content, messages, currentPlatform);
    
    setIsTyping(false);
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      role: 'assistant',
      content: aiResponse.message,
      timestamp: new Date(),
    }]);

    // Handle workflow updates based on AI response
    if (aiResponse.nodes) {
      aiResponse.nodes.forEach(node => onWorkflowUpdate(node));
    }
    if (aiResponse.connections) {
      aiResponse.connections.forEach(connection => onConnectionUpdate(connection));
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
            <p className="text-blue-100 text-sm">Ready to build automations</p>
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

        {/* Typing Indicator */}
        {isTyping && (
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
