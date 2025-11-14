/**
 * Custom React hook for n8n chat with Claude AI streaming.
 * 
 * Provides:
 * - Streaming chat messages
 * - Conversation history management
 * - Workflow extraction
 * - Loading states
 */

import { useState, useCallback, useRef } from 'react';
import { streamN8nChat, StreamEvent } from '@/services/api';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  workflow?: any;
  timestamp: Date;
}

export interface WorkflowData {
  workflow: any;
  validated: boolean;
  errors?: string[];
  warnings?: string[];
}

export interface UseN8nChatReturn {
  messages: ChatMessage[];
  isStreaming: boolean;
  isThinking: boolean;
  currentTool: string | null;
  workflow: WorkflowData | null;
  conversationId: string | null;
  sendMessage: (message: string) => Promise<void>;
  clearChat: () => void;
  error: string | null;
}

export const useN8nChat = (): UseN8nChatReturn => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [currentTool, setCurrentTool] = useState<string | null>(null);
  const [workflow, setWorkflow] = useState<WorkflowData | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const accumulatedTextRef = useRef('');
  const currentMessageIdRef = useRef<string | null>(null);

  const sendMessage = useCallback(async (message: string) => {
    try {
      setError(null);
      setIsStreaming(true);
      setIsThinking(false);
      
      // Add user message
      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: message,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, userMessage]);
      
      // Reset accumulated text
      accumulatedTextRef.current = '';
      currentMessageIdRef.current = `assistant-${Date.now()}`;
      
      // Start streaming
      await streamN8nChat(
        message,
        conversationId || undefined,
        (event: StreamEvent) => {
          handleStreamEvent(event);
        }
      );
      
    } catch (err) {
      console.error('Chat error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsStreaming(false);
      setIsThinking(false);
      setCurrentTool(null);
    }
  }, [conversationId]);

  const handleStreamEvent = useCallback((event: StreamEvent) => {
    const { event: eventType, data } = event;

    switch (eventType) {
      case 'start':
        // Stream started
        if (data.conversation_id) {
          setConversationId(data.conversation_id);
        }
        break;

      case 'message':
        // Text chunk received
        const text = data.text || '';
        accumulatedTextRef.current += text;
        
        // Update or create assistant message
        setMessages(prev => {
          const lastMessage = prev[prev.length - 1];
          
          if (lastMessage && lastMessage.id === currentMessageIdRef.current) {
            // Update existing message
            return [
              ...prev.slice(0, -1),
              {
                ...lastMessage,
                content: accumulatedTextRef.current,
              },
            ];
          } else {
            // Create new assistant message
            return [
              ...prev,
              {
                id: currentMessageIdRef.current!,
                role: 'assistant' as const,
                content: accumulatedTextRef.current,
                timestamp: new Date(),
              },
            ];
          }
        });
        break;

      case 'tool_use':
        // Claude is calling a tool
        setIsThinking(true);
        setCurrentTool(data.tool_name || 'Processing...');
        break;

      case 'tool_result':
        // Tool completed
        setIsThinking(false);
        setCurrentTool(null);
        break;

      case 'workflow':
        // Workflow extracted
        console.log('🔥 useN8nChat - Workflow event received:', data.workflow);
        console.log('🔥 useN8nChat - Workflow nodes:', data.workflow?.nodes);
        
        setWorkflow({
          workflow: data.workflow,
          validated: false,
        });
        
        // Add workflow to the current message
        setMessages(prev => {
          const lastMessage = prev[prev.length - 1];
          
          if (lastMessage && lastMessage.id === currentMessageIdRef.current) {
            console.log('🔥 useN8nChat - Adding workflow to message');
            return [
              ...prev.slice(0, -1),
              {
                ...lastMessage,
                workflow: data.workflow,
              },
            ];
          }
          
          console.log('🔥 useN8nChat - Could not find message to attach workflow');
          return prev;
        });
        break;

      case 'done':
        // Stream completed
        setIsStreaming(false);
        setIsThinking(false);
        setCurrentTool(null);
        break;

      case 'error':
        // Error occurred
        setError(data.message || 'An error occurred');
        setIsStreaming(false);
        setIsThinking(false);
        break;

      default:
        console.log('Unknown event type:', eventType);
    }
  }, []);

  const clearChat = useCallback(() => {
    setMessages([]);
    setWorkflow(null);
    setConversationId(null);
    setError(null);
    setIsStreaming(false);
    setIsThinking(false);
    setCurrentTool(null);
    accumulatedTextRef.current = '';
    currentMessageIdRef.current = null;
  }, []);

  return {
    messages,
    isStreaming,
    isThinking,
    currentTool,
    workflow,
    conversationId,
    sendMessage,
    clearChat,
    error,
  };
};

