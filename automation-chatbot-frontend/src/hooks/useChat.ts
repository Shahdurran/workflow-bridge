import { useState, useCallback, useEffect } from 'react';
import { sendChatMessage, getChatHistory } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

export const useChat = (sessionId: string) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [platform, setPlatform] = useState<string | null>(null);
  const { toast } = useToast();

  // Load chat history on mount
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const history = await getChatHistory(sessionId);
        setMessages(history.messages || []);
        setPlatform(history.platform);
      } catch (err) {
        // New session, no history yet
        console.log('No existing history');
      }
    };
    loadHistory();
  }, [sessionId]);

  const sendMessage = useCallback(
    async (content: string) => {
      setIsLoading(true);
      setError(null);

      // Optimistically add user message
      const userMessage = {
        role: 'user',
        content,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMessage]);

      try {
        const response = await sendChatMessage(sessionId, content, platform || undefined);
        
        // Add assistant response
        const assistantMessage = {
          role: 'assistant',
          content: response.message,
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, assistantMessage]);

        return response;
      } catch (err: any) {
        const errorMessage = err.response?.data?.detail || 'Failed to send message';
        setError(errorMessage);
        
        // Show error toast
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
        
        // Remove optimistic user message on error
        setMessages((prev) => prev.slice(0, -1));
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [sessionId, platform, toast]
  );

  const clearChat = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearChat,
    setPlatform,
    platform,
  };
};
