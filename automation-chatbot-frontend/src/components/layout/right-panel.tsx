import TemplateGrid from "@/components/templates/template-grid";
import ImportSection from "@/components/migration/import-section";
import { Button } from "@/components/ui/button";
import { WorkflowNode, WorkflowConnection } from "@/types/api";
import { ChevronRight, ChevronLeft } from "lucide-react";

interface RightPanelProps {
  isCollapsed: boolean;
  onToggle: () => void;
  onLoadTemplate: (nodes: WorkflowNode[], connections: WorkflowConnection[]) => void;
  onClearWorkflow: () => void;
}

export default function RightPanel({ 
  isCollapsed, 
  onToggle, 
  onLoadTemplate, 
  onClearWorkflow 
}: RightPanelProps) {
  return (
    <div 
      className={`bg-white border-l border-gray-200 flex flex-col transition-all duration-300 ${
        isCollapsed ? 'overflow-hidden' : ''
      }`}
      style={{ width: isCollapsed ? '0px' : '320px' }}
      data-testid="right-panel"
    >
      {/* Panel Header */}
      <div className="border-b border-gray-200 p-4 flex items-center justify-between flex-shrink-0">
        <h3 className="font-semibold text-gray-900 whitespace-nowrap">
          Templates & Migration
        </h3>
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className="h-6 w-6 flex-shrink-0"
          data-testid="button-toggle-panel"
        >
          {isCollapsed ? (
            <ChevronLeft size={16} />
          ) : (
            <ChevronRight size={16} />
          )}
        </Button>
      </div>

      {/* Panel Content */}
      {!isCollapsed && (
        <div className="flex-1 overflow-y-auto">
          {/* Templates Section */}
          <div className="border-b border-gray-200">
            <TemplateGrid onLoadTemplate={onLoadTemplate} />
          </div>

          {/* Migration Section */}
          <ImportSection 
            onImportWorkflow={onLoadTemplate}
            onClearWorkflow={onClearWorkflow}
          />
        </div>
      )}
    </div>
  );
}
