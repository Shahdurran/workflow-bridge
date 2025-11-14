import { Button } from "@/components/ui/button";
import { Plus, ArrowLeftRight, Layers } from "lucide-react";

interface QuickActionsProps {
  onAction: (action: string) => void;
}

export default function QuickActions({ onAction }: QuickActionsProps) {
  return (
    <div className="flex flex-wrap gap-2 ml-11" data-testid="quick-actions">
      <Button
        variant="ghost"
        size="sm"
        className="bg-blue-50 text-workflow-blue hover:bg-blue-100 rounded-full"
        onClick={() => onAction('build')}
        data-testid="button-build-automation"
      >
        <Plus size={14} className="mr-1" />
        Build automation
      </Button>
      
      <Button
        variant="ghost"
        size="sm"
        className="bg-green-50 text-green-600 hover:bg-green-100 rounded-full"
        onClick={() => onAction('migrate')}
        data-testid="button-migrate-workflow"
      >
        <ArrowLeftRight size={14} className="mr-1" />
        Migrate workflow
      </Button>
      
      <Button
        variant="ghost"
        size="sm"
        className="bg-purple-50 text-purple-600 hover:bg-purple-100 rounded-full"
        onClick={() => onAction('templates')}
        data-testid="button-browse-templates"
      >
        <Layers size={14} className="mr-1" />
        Browse templates
      </Button>
    </div>
  );
}
