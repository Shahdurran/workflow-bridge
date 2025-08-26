import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { WorkflowNode, WorkflowConnection } from "@shared/schema";
import { Upload, FileCode, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ImportSectionProps {
  onImportWorkflow: (nodes: WorkflowNode[], connections: WorkflowConnection[]) => void;
  onClearWorkflow: () => void;
}

export default function ImportSection({ onImportWorkflow, onClearWorkflow }: ImportSectionProps) {
  const [dragActive, setDragActive] = useState(false);
  const { toast } = useToast();

  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        // Convert imported JSON to workflow format
        const nodes = convertToWorkflowNodes(json);
        const connections = convertToWorkflowConnections(json);
        
        onImportWorkflow(nodes, connections);
        toast({
          title: "Import Successful",
          description: `Workflow imported with ${nodes.length} nodes`,
        });
      } catch (error) {
        toast({
          title: "Import Failed",
          description: "Invalid JSON file format",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    
    const file = e.dataTransfer.files[0];
    if (file && file.type === 'application/json') {
      handleFileUpload(file);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const loadSampleFile = (platform: string) => {
    // Generate sample workflow based on platform
    const sampleWorkflows = {
      zapier: {
        nodes: [
          {
            id: 'sample-trigger',
            type: 'trigger' as const,
            app: 'google-forms',
            action: 'New Response',
            position: { x: 100, y: 100 },
          },
          {
            id: 'sample-action',
            type: 'action' as const,
            app: 'mailchimp',
            action: 'Add Subscriber',
            position: { x: 400, y: 100 },
          },
        ],
        connections: [{ source: 'sample-trigger', target: 'sample-action' }],
      },
      make: {
        nodes: [
          {
            id: 'make-trigger',
            type: 'trigger' as const,
            app: 'shopify',
            action: 'New Order',
            position: { x: 100, y: 100 },
          },
          {
            id: 'make-action',
            type: 'action' as const,
            app: 'slack',
            action: 'Send Message',
            position: { x: 400, y: 100 },
          },
        ],
        connections: [{ source: 'make-trigger', target: 'make-action' }],
      },
      n8n: {
        nodes: [
          {
            id: 'n8n-trigger',
            type: 'trigger' as const,
            app: 'webhook',
            action: 'Webhook Received',
            position: { x: 100, y: 100 },
          },
          {
            id: 'n8n-action',
            type: 'action' as const,
            app: 'notion',
            action: 'Create Page',
            position: { x: 400, y: 100 },
          },
        ],
        connections: [{ source: 'n8n-trigger', target: 'n8n-action' }],
      },
    };

    const sample = sampleWorkflows[platform as keyof typeof sampleWorkflows];
    if (sample) {
      onImportWorkflow(sample.nodes, sample.connections);
      toast({
        title: "Sample Loaded",
        description: `${platform} sample workflow loaded`,
      });
    }
  };

  return (
    <div className="p-4" data-testid="import-section">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-medium text-gray-900">Migration Tools</h4>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearWorkflow}
          className="text-gray-500 hover:text-red-600"
          data-testid="button-clear-workflow"
        >
          <Trash2 size={14} />
        </Button>
      </div>

      {/* File Upload Area */}
      <Card
        className={`border-2 border-dashed p-6 text-center mb-4 cursor-pointer transition-colors ${
          dragActive 
            ? 'border-workflow-blue bg-blue-50' 
            : 'border-gray-300 hover:border-workflow-blue'
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        onClick={() => document.getElementById('fileInput')?.click()}
        data-testid="file-upload-area"
      >
        <CardContent className="p-0">
          <Upload className="text-gray-400 text-2xl mx-auto mb-2" size={32} />
          <p className="text-sm text-gray-600 mb-1">Upload existing workflow</p>
          <p className="text-xs text-gray-500">JSON files from any platform</p>
          <Input
            id="fileInput"
            type="file"
            accept=".json"
            onChange={handleFileInputChange}
            className="hidden"
            data-testid="input-file-upload"
          />
        </CardContent>
      </Card>

      {/* Sample Migration Files */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-gray-700 mb-2">Try with sample files:</p>
        
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start text-left bg-zapier-light border-zapier/20 hover:bg-zapier-light/80"
          onClick={() => loadSampleFile('zapier')}
          data-testid="button-load-zapier-sample"
        >
          <FileCode className="text-zapier mr-2" size={16} />
          <div className="flex-1">
            <div className="font-medium text-sm">Zapier Sample</div>
            <div className="text-gray-500 text-xs">Lead generation workflow</div>
          </div>
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start text-left bg-make-light border-make/20 hover:bg-make-light/80"
          onClick={() => loadSampleFile('make')}
          data-testid="button-load-make-sample"
        >
          <FileCode className="text-make mr-2" size={16} />
          <div className="flex-1">
            <div className="font-medium text-sm">Make Sample</div>
            <div className="text-gray-500 text-xs">E-commerce automation</div>
          </div>
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start text-left bg-n8n-light border-n8n/20 hover:bg-n8n-light/80"
          onClick={() => loadSampleFile('n8n')}
          data-testid="button-load-n8n-sample"
        >
          <FileCode className="text-n8n mr-2" size={16} />
          <div className="flex-1">
            <div className="font-medium text-sm">n8n Sample</div>
            <div className="text-gray-500 text-xs">Customer support flow</div>
          </div>
        </Button>
      </div>
    </div>
  );
}

// Helper functions to convert imported JSON to workflow format
function convertToWorkflowNodes(json: any): WorkflowNode[] {
  // This is a simplified converter - in a real app, you'd have more sophisticated parsing
  if (json.nodes) {
    // n8n format
    return json.nodes.map((node: any, index: number) => ({
      id: node.id || `node-${index}`,
      type: (index === 0 ? 'trigger' : 'action') as 'trigger' | 'action',
      app: node.type?.split('.').pop() || 'unknown',
      action: node.name || 'Unknown Action',
      position: node.position || { x: 100 + index * 300, y: 100 },
    }));
  } else if (json.trigger && json.actions) {
    // Zapier format
    const nodes = [
      {
        id: 'trigger',
        type: 'trigger' as const,
        app: json.trigger.app,
        action: json.trigger.event,
        position: { x: 100, y: 100 },
      }
    ];
    
    json.actions.forEach((actionItem: any, index: number) => {
      nodes.push({
        id: `action-${index}`,
        type: 'action' as const,
        app: actionItem.app,
        action: actionItem.action,
        position: { x: 100 + (index + 1) * 300, y: 100 },
      });
    });
    
    return nodes;
  } else if (json.scenario?.modules) {
    // Make format
    return json.scenario.modules.map((module: any, index: number) => ({
      id: `module-${index}`,
      type: (index === 0 ? 'trigger' : 'action') as 'trigger' | 'action',
      app: module.service,
      action: module.operation,
      position: { x: 100 + index * 300, y: 100 },
    }));
  }
  
  return [];
}

function convertToWorkflowConnections(json: any): WorkflowConnection[] {
  // This is a simplified converter
  if (json.connections && typeof json.connections === 'object') {
    // n8n format
    const connections: WorkflowConnection[] = [];
    Object.keys(json.connections).forEach(source => {
      const targets = json.connections[source].main?.[0] || [];
      targets.forEach((target: any) => {
        connections.push({
          source: source,
          target: target.node,
        });
      });
    });
    return connections;
  } else if (json.trigger && json.actions) {
    // Zapier format - create linear connections
    const connections: WorkflowConnection[] = [];
    let previousId = 'trigger';
    
    json.actions.forEach((_: any, index: number) => {
      const currentId = `action-${index}`;
      connections.push({
        source: previousId,
        target: currentId,
      });
      previousId = currentId;
    });
    
    return connections;
  } else if (json.scenario?.modules) {
    // Make format - create linear connections
    const connections: WorkflowConnection[] = [];
    for (let i = 0; i < json.scenario.modules.length - 1; i++) {
      connections.push({
        source: `module-${i}`,
        target: `module-${i + 1}`,
      });
    }
    return connections;
  }
  
  return [];
}
