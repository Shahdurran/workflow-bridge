import { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { submitFeedback } from '@/services/api';
import { Edit, Save, X, Check, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface WorkflowEditorProps {
  interactionId: string;
  workflowData: Record<string, any>;
  platform: string;
  readOnly?: boolean;
  onSaveCorrection?: () => void;
  className?: string;
}

export function WorkflowEditor({
  interactionId,
  workflowData,
  platform,
  readOnly = true,
  onSaveCorrection,
  className,
}: WorkflowEditorProps) {
  const [isEditing, setIsEditing] = useState(!readOnly);
  const [editedWorkflow, setEditedWorkflow] = useState<string>(
    JSON.stringify(workflowData, null, 2)
  );
  const [originalWorkflow] = useState<string>(
    JSON.stringify(workflowData, null, 2)
  );
  const [isValid, setIsValid] = useState(true);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setHasChanges(editedWorkflow !== originalWorkflow);
  }, [editedWorkflow, originalWorkflow]);

  const validateJSON = (value: string): boolean => {
    try {
      JSON.parse(value);
      setIsValid(true);
      setValidationError(null);
      return true;
    } catch (error) {
      setIsValid(false);
      setValidationError((error as Error).message);
      return false;
    }
  };

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      setEditedWorkflow(value);
      validateJSON(value);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setEditedWorkflow(originalWorkflow);
    setIsEditing(false);
    setIsValid(true);
    setValidationError(null);
  };

  const handleSave = async () => {
    if (!isValid) {
      toast({
        title: 'Invalid JSON',
        description: 'Please fix the JSON errors before saving.',
        variant: 'destructive',
      });
      return;
    }

    if (!hasChanges) {
      toast({
        title: 'No changes',
        description: 'You haven\'t made any changes to save.',
      });
      return;
    }

    setIsSaving(true);
    try {
      const correctedWorkflowObj = JSON.parse(editedWorkflow);
      const originalWorkflowObj = JSON.parse(originalWorkflow);

      await submitFeedback(
        interactionId,
        'edit',
        'User corrected the workflow',
        correctedWorkflowObj,
        'User manually edited the workflow JSON',
        undefined,
        3 // Neutral sentiment
      );

      toast({
        title: 'Correction saved',
        description: 'Thank you! Your corrections will help improve our AI.',
      });

      setIsEditing(false);
      onSaveCorrection?.();
    } catch (error) {
      console.error('Failed to save correction:', error);
      toast({
        title: 'Error',
        description: 'Failed to save your corrections. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Calculate differences for display
  const getDiffSummary = (): string | null => {
    if (!hasChanges) return null;
    
    try {
      const original = JSON.parse(originalWorkflow);
      const edited = JSON.parse(editedWorkflow);
      
      const originalKeys = Object.keys(original);
      const editedKeys = Object.keys(edited);
      
      const added = editedKeys.filter(k => !originalKeys.includes(k)).length;
      const removed = originalKeys.filter(k => !editedKeys.includes(k)).length;
      const modified = originalKeys.filter(k => 
        editedKeys.includes(k) && JSON.stringify(original[k]) !== JSON.stringify(edited[k])
      ).length;
      
      const parts: string[] = [];
      if (added > 0) parts.push(`${added} added`);
      if (removed > 0) parts.push(`${removed} removed`);
      if (modified > 0) parts.push(`${modified} modified`);
      
      return parts.join(', ');
    } catch {
      return null;
    }
  };

  const diffSummary = getDiffSummary();

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              Workflow JSON
              <Badge variant="outline" className="text-xs">
                {platform.toUpperCase()}
              </Badge>
            </CardTitle>
            <CardDescription>
              {isEditing
                ? 'Edit the workflow JSON to correct any issues'
                : 'View the generated workflow JSON'}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            {!isEditing && readOnly && (
              <Button onClick={handleEdit} size="sm" variant="outline">
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </Button>
            )}
            {isEditing && (
              <>
                <Button
                  onClick={handleCancel}
                  size="sm"
                  variant="outline"
                  disabled={isSaving}
                >
                  <X className="h-4 w-4 mr-1" />
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  size="sm"
                  disabled={!isValid || !hasChanges || isSaving}
                >
                  {isSaving ? (
                    <>Saving...</>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-1" />
                      Save Correction
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
        </div>
        
        {/* Status indicators */}
        <div className="flex flex-wrap gap-2 mt-2">
          {isValid ? (
            <Badge variant="outline" className="text-green-600 border-green-600">
              <Check className="h-3 w-3 mr-1" />
              Valid JSON
            </Badge>
          ) : (
            <Badge variant="outline" className="text-red-600 border-red-600">
              <AlertCircle className="h-3 w-3 mr-1" />
              Invalid JSON
            </Badge>
          )}
          
          {hasChanges && (
            <Badge variant="outline" className="text-orange-600 border-orange-600">
              Unsaved changes
            </Badge>
          )}
          
          {diffSummary && (
            <Badge variant="outline" className="text-blue-600 border-blue-600">
              {diffSummary}
            </Badge>
          )}
        </div>
        
        {validationError && (
          <div className="mt-2 p-2 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded text-sm text-red-600 dark:text-red-400">
            <AlertCircle className="h-4 w-4 inline mr-1" />
            {validationError}
          </div>
        )}
      </CardHeader>
      
      <CardContent>
        <div className="border rounded-md overflow-hidden">
          <Editor
            height="400px"
            defaultLanguage="json"
            value={editedWorkflow}
            onChange={handleEditorChange}
            options={{
              readOnly: !isEditing,
              minimap: { enabled: false },
              fontSize: 13,
              lineNumbers: 'on',
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 2,
              formatOnPaste: true,
              formatOnType: true,
              wordWrap: 'on',
            }}
            theme="vs-dark"
          />
        </div>
        
        {isEditing && (
          <p className="text-xs text-muted-foreground mt-2">
            💡 Tip: Make your corrections and click "Save Correction" to help improve our AI
          </p>
        )}
      </CardContent>
    </Card>
  );
}

