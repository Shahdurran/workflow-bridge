import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { WorkflowNode, WorkflowConnection, Platform } from "@/types/api";
import { transformFromCanvas } from "@/utils/workflow-transformer";
import { translateWorkflow } from "@/services/api";
import { Download, X, Copy, Check, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ExportPanelProps {
  nodes: WorkflowNode[];
  connections: WorkflowConnection[];
  platform: Platform;
  onClose: () => void;
}

export default function ExportPanel({ 
  nodes, 
  connections, 
  platform, 
  onClose 
}: ExportPanelProps) {
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [previewPlatform, setPreviewPlatform] = useState<Platform>('zapier');
  const [copied, setCopied] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const { toast } = useToast();

  const exportWorkflow = async (targetPlatform: Platform) => {
    setIsTranslating(true);
    
    try {
      let jsonData;
      
      // If exporting to same platform, no translation needed
      if (targetPlatform === platform) {
        jsonData = transformFromCanvas(nodes, connections, platform);
      } else {
        // Use workflow-translator for cross-platform export
        const sourceWorkflow = transformFromCanvas(nodes, connections, platform);
        
        toast({
          title: "Translating...",
          description: `Converting from ${platform} to ${targetPlatform}`,
        });
        
        const result = await translateWorkflow(sourceWorkflow, platform, targetPlatform);
        
        if (result.success) {
          jsonData = result.translated_workflow;
          
          if (result.warnings && result.warnings.length > 0) {
            toast({
              title: "Translation completed with warnings",
              description: `${result.warnings.length} warning(s). Check preview for details.`,
              variant: "default",
            });
          }
        } else {
          throw new Error('Translation failed');
        }
      }
      
      const filename = `${targetPlatform}-workflow.json`;
      
      // Download the JSON file
      const blob = new Blob([JSON.stringify(jsonData, null, 2)], { 
        type: 'application/json' 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);

      toast({
        title: "Export Successful",
        description: `Workflow exported for ${targetPlatform}`,
      });
    } catch (error) {
      console.error('Export failed:', error);
      toast({
        title: "Export Failed",
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive",
      });
    } finally {
      setIsTranslating(false);
    }
  };

  const previewWorkflow = (targetPlatform: Platform) => {
    let jsonData;

    switch (targetPlatform) {
      case 'zapier':
        jsonData = generateZapierJSON(nodes, connections);
        break;
      case 'make':
        jsonData = generateMakeJSON(nodes, connections);
        break;
      case 'n8n':
        jsonData = generateN8nJSON(nodes, connections);
        break;
    }

    setPreviewData(jsonData);
    setPreviewPlatform(targetPlatform);
    setShowPreview(true);
  };

  const copyToClipboard = async () => {
    if (previewData) {
      await navigator.clipboard.writeText(JSON.stringify(previewData, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Copied to Clipboard",
        description: "JSON data has been copied to your clipboard",
      });
    }
  };

  return (
    <>
      <Card className="absolute top-4 right-4 w-64 shadow-lg" data-testid="export-panel">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold">Export Workflow</CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-6 w-6"
              data-testid="button-close-export"
            >
              <X size={14} />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button
            className="w-full bg-zapier text-white hover:opacity-90 text-sm"
            onClick={() => exportWorkflow('zapier')}
            disabled={isTranslating}
            data-testid="button-export-zapier"
          >
            {isTranslating ? <Loader2 size={14} className="mr-2 animate-spin" /> : <Download size={14} className="mr-2" />}
            Export to Zapier
          </Button>
          
          <Button
            className="w-full bg-make text-white hover:opacity-90 text-sm"
            onClick={() => exportWorkflow('make')}
            disabled={isTranslating}
            data-testid="button-export-make"
          >
            {isTranslating ? <Loader2 size={14} className="mr-2 animate-spin" /> : <Download size={14} className="mr-2" />}
            Export to Make
          </Button>
          
          <Button
            className="w-full bg-n8n text-white hover:opacity-90 text-sm"
            onClick={() => exportWorkflow('n8n')}
            disabled={isTranslating}
            data-testid="button-export-n8n"
          >
            {isTranslating ? <Loader2 size={14} className="mr-2 animate-spin" /> : <Download size={14} className="mr-2" />}
            Export to n8n
          </Button>

          <div className="pt-2 border-t">
            <p className="text-xs text-gray-500 mb-2">Preview JSON:</p>
            <div className="space-y-1">
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs"
                onClick={() => previewWorkflow('zapier')}
                data-testid="button-preview-zapier"
              >
                Preview Zapier JSON
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs"
                onClick={() => previewWorkflow('make')}
                data-testid="button-preview-make"
              >
                Preview Make JSON
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs"
                onClick={() => previewWorkflow('n8n')}
                data-testid="button-preview-n8n"
              >
                Preview n8n JSON
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preview Modal */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="capitalize">
                {previewPlatform} Workflow JSON
              </DialogTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={copyToClipboard}
                data-testid="button-copy-json"
              >
                {copied ? (
                  <>
                    <Check size={14} className="mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy size={14} className="mr-2" />
                    Copy
                  </>
                )}
              </Button>
            </div>
          </DialogHeader>
          <div className="mt-4 overflow-auto bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm">
            <pre data-testid="json-preview">{JSON.stringify(previewData, null, 2)}</pre>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
