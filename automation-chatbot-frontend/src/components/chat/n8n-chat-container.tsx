/**
 * n8n Chat Container with Claude AI Streaming
 * 
 * This component provides a chat interface for creating n8n workflows
 * using Claude AI with n8n-mcp integration.
 */

import { useRef, useEffect } from 'react';
import { Bot, User, Loader2, Wrench } from 'lucide-react';
import { useN8nChat } from '@/hooks/useN8nChat';
import MessageBubble from './message-bubble';
import InputField from './input-field';
import WorkflowPreview from '../workflow/WorkflowPreview';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const N8nChatContainer = () => {
  const {
    messages,
    isStreaming,
    isThinking,
    currentTool,
    workflow,
    conversationId,
    sendMessage,
    clearChat,
    error,
  } = useN8nChat();
  
  // Debug: Log when workflow changes
  useEffect(() => {
    if (workflow) {
      console.log('🎯 N8nChatContainer - Workflow received:', workflow);
      console.log('🎯 N8nChatContainer - Workflow nodes:', workflow.workflow?.nodes);
    }
  }, [workflow]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isThinking]);

  const handleSendMessage = async (message: string) => {
    await sendMessage(message);
  };

  const handleDeploy = (workflowId: string, workflowUrl: string) => {
    console.log('Workflow deployed:', { workflowId, workflowUrl });
    // Could show a success toast or navigate to n8n
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="border-b border-gray-200 p-4 bg-gradient-to-r from-blue-600 to-indigo-600">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <Bot className="text-white" size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">n8n Workflow Assistant</h2>
              <p className="text-sm text-white/80">Powered by Claude AI & n8n-mcp</p>
            </div>
          </div>

          {conversationId && (
            <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
              Session Active
            </Badge>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {/* Welcome Message */}
        {messages.length === 0 && (
          <Card className="p-6 border-blue-200 bg-blue-50">
            <div className="flex items-start gap-4">
              <Bot className="h-8 w-8 text-blue-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-blue-900 mb-2">
                  Welcome to n8n Workflow Assistant! 👋
                </h3>
                <p className="text-sm text-blue-800 mb-3">
                  I can help you create n8n workflows through natural conversation. Just tell me what you want to automate!
                </p>
                <div className="space-y-2">
                  <p className="text-xs font-medium text-blue-900">Try asking:</p>
                  <ul className="text-xs text-blue-700 space-y-1">
                    <li>• "Create a workflow that sends me an email when someone fills out my contact form"</li>
                    <li>• "I need to sync data between Airtable and Google Sheets"</li>
                    <li>• "Show me workflow templates for social media automation"</li>
                  </ul>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Chat Messages */}
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex items-start gap-3 ${
              message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
            }`}
          >
            {/* Avatar */}
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                message.role === 'user'
                  ? 'bg-gradient-to-br from-purple-500 to-pink-500'
                  : 'bg-gradient-to-br from-blue-500 to-indigo-600'
              }`}
            >
              {message.role === 'user' ? (
                <User className="text-white" size={16} />
              ) : (
                <Bot className="text-white" size={16} />
              )}
            </div>

            {/* Message Content */}
            <div
              className={`flex-1 max-w-3xl ${
                message.role === 'user' ? 'text-right' : 'text-left'
              }`}
            >
              <div
                className={`inline-block p-4 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white'
                    : 'bg-white border border-gray-200 text-gray-900'
                }`}
              >
                <div className="whitespace-pre-wrap text-sm">{message.content}</div>
                
                {message.workflow && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <WorkflowPreview
                      workflow={message.workflow}
                      conversationId={conversationId || undefined}
                      onDeploy={handleDeploy}
                    />
                  </div>
                )}
              </div>

              <div className="text-xs text-gray-500 mt-1">
                {message.timestamp.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            </div>
          </div>
        ))}

        {/* Thinking Indicator */}
        {isThinking && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
              <Bot className="text-white" size={16} />
            </div>

            <Card className="p-4 border-blue-200 bg-blue-50">
              <div className="flex items-center gap-2 text-blue-800">
                <Wrench className="h-4 w-4 animate-pulse" />
                <span className="text-sm font-medium">
                  {currentTool || 'Thinking...'}
                </span>
              </div>
            </Card>
          </div>
        )}

        {/* Streaming Indicator */}
        {isStreaming && !isThinking && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
              <Bot className="text-white" size={16} />
            </div>

            <Card className="p-4">
              <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
            </Card>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <Card className="p-4 border-red-200 bg-red-50">
            <div className="flex items-start gap-2">
              <span className="text-red-800 text-sm">
                <strong>Error:</strong> {error}
              </span>
            </div>
          </Card>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 p-4 bg-white">
        <InputField
          onSendMessage={handleSendMessage}
          disabled={isStreaming}
          placeholder={
            isStreaming
              ? 'Waiting for response...'
              : 'Describe the workflow you want to create...'
          }
        />

        <div className="mt-2 flex items-center justify-between">
          <p className="text-xs text-gray-500">
            Powered by Claude Sonnet 4 with n8n-mcp integration
          </p>
          
          {messages.length > 0 && (
            <button
              onClick={clearChat}
              className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
              disabled={isStreaming}
            >
              Clear chat
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default N8nChatContainer;

