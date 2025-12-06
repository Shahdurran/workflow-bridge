import { Button } from "@/components/ui/button";
import { Platform } from "@/pages/home";
import { Zap, Cog, GitBranch } from "lucide-react";

interface PlatformSelectorProps {
  currentPlatform: Platform;
  onPlatformChange: (platform: Platform) => void;
}

export default function PlatformSelector({ 
  currentPlatform, 
  onPlatformChange 
}: PlatformSelectorProps) {
  const platforms = [
    // NOTE: Zapier support temporarily disabled for beta phase
    // {
    //   id: 'zapier' as Platform,
    //   name: 'Zapier',
    //   icon: Zap,
    //   className: 'text-zapier hover:text-zapier',
    //   activeClassName: 'bg-white text-zapier',
    // },
    {
      id: 'make' as Platform,
      name: 'Make',
      icon: Cog,
      className: 'text-make hover:text-make',
      activeClassName: 'bg-white text-make',
    },
    {
      id: 'n8n' as Platform,
      name: 'n8n',
      icon: GitBranch,
      className: 'text-n8n hover:text-n8n',
      activeClassName: 'bg-white text-n8n',
    },
  ];

  return (
    <div className="bg-white border-b border-gray-200 p-4" data-testid="platform-selector">
      <div className="flex space-x-1 bg-gray-100 rounded-lg p-1 w-fit">
        {platforms.map((platform) => {
          const Icon = platform.icon;
          const isActive = currentPlatform === platform.id;
          
          return (
            <Button
              key={platform.id}
              variant="ghost"
              className={`px-4 py-2 rounded-md font-medium transition-all ${
                isActive 
                  ? platform.activeClassName 
                  : `text-gray-600 ${platform.className}`
              }`}
              onClick={() => onPlatformChange(platform.id)}
              data-testid={`button-platform-${platform.id}`}
            >
              <Icon size={16} className="mr-2" />
              {platform.name}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
