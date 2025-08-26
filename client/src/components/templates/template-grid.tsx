import TemplateCard from "./template-card";
import { getTemplates } from "@/data/templates";
import { WorkflowNode, WorkflowConnection } from "@shared/schema";

interface TemplateGridProps {
  onLoadTemplate: (nodes: WorkflowNode[], connections: WorkflowConnection[]) => void;
}

export default function TemplateGrid({ onLoadTemplate }: TemplateGridProps) {
  const templates = getTemplates();

  return (
    <div className="p-4" data-testid="template-grid">
      <h4 className="font-medium text-gray-900 mb-3">Popular Templates</h4>
      <div className="space-y-3">
        {templates.map((template) => (
          <TemplateCard
            key={template.id}
            template={template}
            onLoad={() => onLoadTemplate(template.nodes, template.connections)}
          />
        ))}
      </div>
    </div>
  );
}
