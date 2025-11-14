/**
 * Workflow Preview Component
 * 
 * Displays n8n workflow with:
 * - Node list view
 * - Validation status
 * - Deploy button
 * - Visual node cards
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Loader2, 
  ExternalLink,
  Download,
  Play,
  Code
} from 'lucide-react';
import { validateN8nWorkflow, deployN8nWorkflow } from '@/services/api';
import { SimpleWorkflowVisualizer } from './SimpleWorkflowVisualizer';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

export interface WorkflowPreviewProps {
  workflow: any;
  conversationId?: string;
  onDeploy?: (workflowId: string, workflowUrl: string) => void;
}

export const WorkflowPreview = ({ 
  workflow, 
  conversationId,
  onDeploy 
}: WorkflowPreviewProps) => {
  const [isValidating, setIsValidating] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [validation, setValidation] = useState<any>(null);
  const [deployResult, setDeployResult] = useState<any>(null);
  const [showJSON, setShowJSON] = useState(false);

  const workflowName = workflow?.name || 'Untitled Workflow';
  const nodes = workflow?.nodes || [];
  const connections = workflow?.connections || {};
  
  // DEBUG: Log what WorkflowPreview receives
  console.log('💎 WorkflowPreview received workflow:', workflow);
  console.log('💎 WorkflowPreview nodes:', nodes);
  console.log('💎 WorkflowPreview node[0]:', nodes[0]);

  const handleValidate = async () => {
    setIsValidating(true);
    try {
      const result = await validateN8nWorkflow(workflow, 'balanced');
      setValidation(result);
    } catch (error) {
      console.error('Validation error:', error);
      setValidation({
        valid: false,
        errors: [error instanceof Error ? error.message : 'Validation failed'],
        warnings: [],
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleDeploy = async () => {
    // Validate first if not already validated
    if (!validation) {
      await handleValidate();
    }

    if (validation && !validation.valid) {
      return; // Don't deploy if invalid
    }

    setIsDeploying(true);
    try {
      const result = await deployN8nWorkflow(workflow, conversationId);
      setDeployResult(result);
      
      if (onDeploy && result.workflow_id) {
        onDeploy(result.workflow_id, result.workflow_url);
      }
    } catch (error) {
      console.error('Deployment error:', error);
    } finally {
      setIsDeploying(false);
    }
  };

  const handleDownload = () => {
    const dataStr = JSON.stringify(workflow, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${workflowName.replace(/\s+/g, '_').toLowerCase()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Play className="h-5 w-5 text-blue-600" />
              {workflowName}
            </CardTitle>
            <CardDescription>
              {nodes.length} node{nodes.length !== 1 ? 's' : ''}
            </CardDescription>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              title="Download workflow JSON"
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Validation Status */}
        {validation && (
          <div className="p-3 border rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              {validation.valid ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-green-900">Valid Workflow</span>
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-red-600" />
                  <span className="font-medium text-red-900">Invalid Workflow</span>
                </>
              )}
            </div>

            {validation.errors && validation.errors.length > 0 && (
              <div className="mt-2">
                <p className="text-sm font-medium text-red-800 mb-1">Errors:</p>
                <ul className="text-sm text-red-700 space-y-1">
                  {validation.errors.map((error: string, idx: number) => (
                    <li key={idx}>• {error}</li>
                  ))}
                </ul>
              </div>
            )}

            {validation.warnings && validation.warnings.length > 0 && (
              <div className="mt-2">
                <p className="text-sm font-medium text-yellow-800 mb-1">Warnings:</p>
                <ul className="text-sm text-yellow-700 space-y-1">
                  {validation.warnings.map((warning: string, idx: number) => (
                    <li key={idx}>• {warning}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Deployment Result */}
        {deployResult && (
          <div className="p-3 border border-green-200 bg-green-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <span className="font-medium text-green-900">Successfully Deployed!</span>
            </div>
            {deployResult.workflow_url && (
              <a
                href={deployResult.workflow_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                Open in n8n <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        )}

        {/* Visual Workflow Canvas */}
        <div>
          <h4 className="text-sm font-semibold mb-3 text-gray-700 flex items-center gap-2">
            <Play className="h-4 w-4 text-blue-600" />
            Workflow Visualization ({nodes.length} nodes)
          </h4>
          
          {/* Node List - Simple readable format */}
          {nodes.length > 0 ? (
            <div className="space-y-3">
              {nodes.map((node: any, idx: number) => {
                const nodeType = node.type?.split('.').pop() || 'Unknown';
                const isFirst = idx === 0;
                
                return (
                  <div key={idx}>
                    {!isFirst && (
                      <div className="flex justify-center my-2">
                        <div className="text-gray-400">↓</div>
                      </div>
                    )}
                    <div className="p-4 border-2 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                          {idx + 1}
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900">{node.name || 'Unnamed Node'}</div>
                          <div className="text-sm text-gray-600">{nodeType}</div>
                        </div>
                      </div>
                      
                      {node.parameters && Object.keys(node.parameters).length > 0 && (
                        <div className="mt-3 pt-3 border-t border-blue-200">
                          <div className="text-xs text-gray-600">
                            {Object.keys(node.parameters).length} parameter(s) configured
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500 text-sm border rounded-lg bg-gray-50">
              <AlertCircle className="h-12 w-12 mx-auto mb-3 text-gray-400" />
              <p className="font-medium">No nodes in workflow</p>
              <p className="text-xs mt-1">The workflow will appear here once nodes are added</p>
            </div>
          )}
        </div>

        {/* Collapsible JSON Viewer */}
        <Collapsible open={showJSON} onOpenChange={setShowJSON}>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="w-full flex items-center justify-between hover:bg-gray-100"
            >
              <span className="flex items-center gap-2 text-sm text-gray-700">
                <Code className="h-4 w-4" />
                {showJSON ? 'Hide' : 'View'} Workflow JSON
              </span>
              <Badge variant="outline" className="text-xs">
                Advanced
              </Badge>
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2">
            <div className="border rounded-lg bg-gray-900 p-4 max-h-96 overflow-auto">
              <pre className="text-xs text-green-400 font-mono">
                {JSON.stringify(workflow, null, 2)}
              </pre>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4">
          <Button
            onClick={handleValidate}
            disabled={isValidating || isDeploying}
            variant="outline"
            className="flex-1"
          >
            {isValidating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Validating...
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Validate
              </>
            )}
          </Button>

          <Button
            onClick={handleDeploy}
            disabled={isDeploying || isValidating || (validation && !validation.valid)}
            className="flex-1 bg-green-600 hover:bg-green-700"
          >
            {isDeploying ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deploying...
              </>
            ) : (
              <>
                <ExternalLink className="mr-2 h-4 w-4" />
                Deploy to n8n
              </>
            )}
          </Button>
        </div>

        {validation && !validation.valid && (
          <p className="text-xs text-center text-red-600">
            Please fix validation errors before deploying
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default WorkflowPreview;

