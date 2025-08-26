import { getAppIcon } from "@/data/integrations";

interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  apps: string[];
  nodes: any[];
  connections: any[];
  complexity: 'Beginner' | 'Advanced';
}

interface TemplateCardProps {
  template: Template;
  onLoad: () => void;
}

export default function TemplateCard({ template, onLoad }: TemplateCardProps) {
  const getGradientColor = () => {
    switch (template.category) {
      case 'Marketing':
        return 'from-green-400 to-green-600';
      case 'Sales':
        return 'from-blue-400 to-blue-600';
      case 'Productivity':
        return 'from-purple-400 to-purple-600';
      case 'E-commerce':
        return 'from-orange-400 to-orange-600';
      default:
        return 'from-gray-400 to-gray-600';
    }
  };

  return (
    <div 
      className="bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors cursor-pointer"
      onClick={onLoad}
      data-testid={`template-card-${template.id}`}
    >
      <div className="flex items-start space-x-3">
        <div className={`w-10 h-10 bg-gradient-to-br ${getGradientColor()} rounded-lg flex items-center justify-center flex-shrink-0`}>
          {template.category === 'Marketing' && <span className="text-white">📧</span>}
          {template.category === 'Sales' && <span className="text-white">💼</span>}
          {template.category === 'Productivity' && <span className="text-white">⚡</span>}
          {template.category === 'E-commerce' && <span className="text-white">🛒</span>}
        </div>
        
        <div className="flex-1 min-w-0">
          <h5 className="font-medium text-gray-900 text-sm truncate">
            {template.name}
          </h5>
          <p className="text-xs text-gray-500 mb-2">{template.description}</p>
          
          <div className="flex items-center space-x-1 mb-2">
            {template.apps.slice(0, 3).map((app, index) => {
              const AppIcon = getAppIcon(app);
              const colors = ['bg-orange-100', 'bg-blue-100', 'bg-purple-100'];
              const textColors = ['text-orange-600', 'text-blue-600', 'text-purple-600'];
              
              return (
                <span 
                  key={app}
                  className={`inline-flex items-center justify-center w-4 h-4 ${colors[index % 3]} rounded`}
                >
                  <AppIcon className={`text-xs ${textColors[index % 3]}`} />
                </span>
              );
            })}
          </div>
          
          <div className="flex items-center justify-between">
            <span className={`text-xs px-2 py-1 rounded-full ${
              template.complexity === 'Beginner' 
                ? 'bg-green-100 text-green-600' 
                : 'bg-yellow-100 text-yellow-600'
            }`}>
              {template.complexity}
            </span>
            <span className="text-xs text-gray-400">{template.apps.length} apps</span>
          </div>
        </div>
      </div>
    </div>
  );
}
