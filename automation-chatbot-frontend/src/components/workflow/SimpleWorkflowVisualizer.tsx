import { Network, Zap, ArrowDown, Settings } from 'lucide-react';

interface SimpleWorkflowVisualizerProps {
  workflow: any;
}

export const SimpleWorkflowVisualizer = ({ workflow }: SimpleWorkflowVisualizerProps) => {
  const nodes = workflow?.nodes || [];
  const connections = workflow?.connections || {};

  if (nodes.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <Network className="h-12 w-12 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No workflow nodes to display</p>
      </div>
    );
  }

  const getNodeIcon = (index: number, nodeType: string) => {
    const isFirst = index === 0;
    const isTrigger = isFirst || nodeType.toLowerCase().includes('trigger');
    return isTrigger ? '⚡' : '⚙️';
  };

  const getNodeColor = (index: number, nodeType: string) => {
    const isFirst = index === 0;
    const isTrigger = isFirst || nodeType.toLowerCase().includes('trigger');
    return isTrigger 
      ? 'from-green-500 to-emerald-600 border-green-400' 
      : 'from-blue-500 to-indigo-600 border-blue-400';
  };

  const getNodeLabel = (nodeType: string) => {
    // Extract readable name from "n8n-nodes-base.gmailTrigger" -> "Gmail Trigger"
    const parts = nodeType.split('.');
    const typeName = parts[parts.length - 1] || nodeType;
    
    // Convert camelCase to Title Case
    return typeName
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  };

  return (
    <div className="workflow-visualizer py-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-1">
            {workflow.name || 'Workflow'}
          </h3>
          <p className="text-sm text-gray-500">
            {nodes.length} node{nodes.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Nodes */}
        <div className="space-y-4">
          {nodes.map((node: any, idx: number) => {
            const nodeTypeShort = getNodeLabel(node.type || 'Unknown');
            const isFirst = idx === 0;
            
            return (
              <div key={node.id || idx} className="relative">
                {/* Connection Arrow */}
                {!isFirst && (
                  <div className="flex justify-center -mb-2 -mt-2">
                    <div className="w-12 h-8 flex items-center justify-center">
                      <ArrowDown className="h-6 w-6 text-gray-400" strokeWidth={2} />
                    </div>
                  </div>
                )}

                {/* Node Card */}
                <div 
                  className={`
                    relative group
                    bg-gradient-to-br ${getNodeColor(idx, node.type)}
                    border-2 rounded-2xl shadow-lg hover:shadow-xl
                    transition-all duration-200 hover:scale-[1.02]
                    p-5
                  `}
                >
                  {/* Node Header */}
                  <div className="flex items-center gap-4 mb-3">
                    {/* Icon */}
                    <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-3xl flex-shrink-0">
                      {getNodeIcon(idx, node.type)}
                    </div>

                    {/* Node Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="inline-flex items-center justify-center w-6 h-6 bg-white/30 rounded-full text-white text-xs font-bold">
                          {idx + 1}
                        </span>
                        <h4 className="font-bold text-white text-base truncate">
                          {node.name}
                        </h4>
                      </div>
                      <p className="text-white/90 text-sm font-medium">
                        {nodeTypeShort}
                      </p>
                    </div>

                    {/* Settings Icon */}
                    {node.parameters && Object.keys(node.parameters).length > 0 && (
                      <div className="flex-shrink-0">
                        <Settings className="h-5 w-5 text-white/70" />
                      </div>
                    )}
                  </div>

                  {/* Node Details - Show on hover or if parameters exist */}
                  {node.parameters && Object.keys(node.parameters).length > 0 && (
                    <div className="mt-3 pt-3 border-t border-white/20">
                      <div className="flex items-center gap-2 text-white/80 text-xs">
                        <Zap className="h-3 w-3" />
                        <span>
                          {Object.keys(node.parameters).length} parameter{Object.keys(node.parameters).length !== 1 ? 's' : ''} configured
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Hover Effect Glow */}
                  <div className="absolute inset-0 rounded-2xl bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Connection Summary */}
        {connections && Object.keys(connections).length > 0 && (
          <div className="mt-6 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full text-sm text-gray-600">
              <Network className="h-4 w-4" />
              <span>{Object.keys(connections).length} connection{Object.keys(connections).length !== 1 ? 's' : ''}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};



