import { useState, useCallback } from 'react';
import { 
  generateWorkflow,
  validateWorkflow,
  exportWorkflow,
  getWorkflows,
} from '@/services/api';
import { useToast } from '@/hooks/use-toast';

export const useWorkflow = () => {
  const [currentWorkflow, setCurrentWorkflow] = useState<any>(null);
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const generate = useCallback(
    async (platform: string, intent: any, parameters: any, name?: string) => {
      setIsGenerating(true);
      setError(null);

      try {
        const response = await generateWorkflow(platform, intent, parameters, name);
        setCurrentWorkflow(response.workflow);
        
        toast({
          title: 'Success',
          description: 'Workflow generated successfully!',
        });
        
        return response;
      } catch (err: any) {
        const errorMessage = err.response?.data?.detail || 'Failed to generate workflow';
        setError(errorMessage);
        
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
        
        throw err;
      } finally {
        setIsGenerating(false);
      }
    },
    [toast]
  );

  const validate = useCallback(async (workflow: any, platform: string) => {
    try {
      const result = await validateWorkflow(workflow, platform);
      
      if (result.valid) {
        toast({
          title: 'Validation Success',
          description: 'Workflow is valid!',
        });
      } else {
        toast({
          title: 'Validation Failed',
          description: `Found ${result.errors.length} error(s)`,
          variant: 'destructive',
        });
      }
      
      return result;
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Failed to validate workflow';
      setError(errorMessage);
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      
      throw err;
    }
  }, [toast]);

  const exportFile = useCallback(async (workflowId: string) => {
    try {
      const blob = await exportWorkflow(workflowId);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `workflow_${workflowId.slice(0, 8)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: 'Success',
        description: 'Workflow exported successfully!',
      });
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Failed to export workflow';
      setError(errorMessage);
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      
      throw err;
    }
  }, [toast]);

  const loadWorkflows = useCallback(async (platform?: string) => {
    setIsLoading(true);
    try {
      const data = await getWorkflows(platform);
      setWorkflows(data);
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Failed to load workflows';
      setError(errorMessage);
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  return {
    currentWorkflow,
    workflows,
    isGenerating,
    isLoading,
    error,
    generate,
    validate,
    exportFile,
    loadWorkflows,
    setCurrentWorkflow,
  };
};
