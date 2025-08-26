import { memo } from "react";
import { Handle, Position } from "reactflow";
import { getAppIcon } from "@/data/integrations";

interface WorkflowNodeProps {
  data: {
    app: string;
    action: string;
    type: 'trigger' | 'action' | 'logic';
    platform: 'zapier' | 'make' | 'n8n';
  };
}

function WorkflowNodeComponent({ data }: WorkflowNodeProps) {
  const { app, action, type, platform } = data;
  const AppIcon = getAppIcon(app);

  const getNodeColor = () => {
    switch (type) {
      case 'trigger':
        return 'border-green-200 bg-green-50';
      case 'action':
        return 'border-blue-200 bg-blue-50';
      case 'logic':
        return 'border-purple-200 bg-purple-50';
      default:
        return 'border-gray-200 bg-white';
    }
  };

  const getStatusColor = () => {
    switch (type) {
      case 'trigger':
        return 'bg-green-500';
      case 'action':
        return 'bg-blue-500';
      case 'logic':
        return 'bg-purple-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getPlatformTheme = () => {
    switch (platform) {
      case 'zapier':
        return 'hover:shadow-zapier/20';
      case 'make':
        return 'hover:shadow-make/20';
      case 'n8n':
        return 'hover:shadow-n8n/20';
      default:
        return 'hover:shadow-blue-500/20';
    }
  };

  return (
    <div 
      className={`workflow-node bg-white rounded-xl shadow-lg border-2 p-4 w-48 text-center ${getNodeColor()} ${getPlatformTheme()}`}
      data-testid={`workflow-node-${app}`}
    >
      <Handle
        type="target"
        position={Position.Left}
        style={{
          background: platform === 'zapier' ? '#FF4A00' : platform === 'make' ? '#6366F1' : '#EA4B71',
          width: 12,
          height: 12,
          left: -6,
        }}
      />
      
      <div className="w-12 h-12 mx-auto mb-3 flex items-center justify-center bg-gray-100 rounded-lg">
        <AppIcon className="text-2xl" />
      </div>
      
      <h4 className="font-semibold text-gray-900 mb-1 text-sm">{action}</h4>
      <p className="text-xs text-gray-500 capitalize">{app.replace('-', ' ')}</p>
      
      <div className="mt-2 flex items-center justify-center space-x-1">
        <span className={`inline-block w-2 h-2 rounded-full ${getStatusColor()}`}></span>
        <span className="text-xs text-gray-600 capitalize">{type}</span>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        style={{
          background: platform === 'zapier' ? '#FF4A00' : platform === 'make' ? '#6366F1' : '#EA4B71',
          width: 12,
          height: 12,
          right: -6,
        }}
      />
    </div>
  );
}

export default memo(WorkflowNodeComponent);
