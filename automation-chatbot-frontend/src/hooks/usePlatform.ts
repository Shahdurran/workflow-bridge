import { useQuery } from '@tanstack/react-query';
import { 
  PlatformInfo, 
  PlatformCapabilities, 
  IntegrationInfo,
  Platform 
} from '@/types/workflow.types';
import { getPlatforms, getPlatformCapabilities } from '@/services/api';

// Platform API wrapper
const platformApi = {
  getPlatforms: async (): Promise<PlatformInfo[]> => {
    const data = await getPlatforms();
    return data;
  },
  
  getPlatformCapabilities: async (platformId: string): Promise<PlatformCapabilities> => {
    const data = await getPlatformCapabilities(platformId);
    return data;
  },
  
  getPlatformIntegrations: async (
    platformId: string, 
    category?: string, 
    search?: string
  ): Promise<any> => {
    // This would need a backend endpoint - for now return mock
    return { integrations: [] };
  },
  
  getIntegrationDetails: async (integrationId: string): Promise<IntegrationInfo> => {
    // This would need a backend endpoint - for now return mock
    return {} as IntegrationInfo;
  },
  
  comparePlatforms: async (platforms: string[], feature?: string): Promise<any> => {
    // This would need a backend endpoint - for now return mock
    return { comparison: [] };
  },
};

export function usePlatforms() {
  return useQuery({
    queryKey: ['platforms'],
    queryFn: platformApi.getPlatforms,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function usePlatformCapabilities(platformId: Platform) {
  return useQuery({
    queryKey: ['platform-capabilities', platformId],
    queryFn: () => platformApi.getPlatformCapabilities(platformId),
    enabled: !!platformId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function usePlatformIntegrations(
  platformId: Platform, 
  category?: string, 
  search?: string
) {
  return useQuery({
    queryKey: ['platform-integrations', platformId, category, search],
    queryFn: () => platformApi.getPlatformIntegrations(platformId, category, search),
    enabled: !!platformId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useIntegrationDetails(integrationId: string) {
  return useQuery({
    queryKey: ['integration-details', integrationId],
    queryFn: () => platformApi.getIntegrationDetails(integrationId),
    enabled: !!integrationId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function usePlatformComparison(platforms: Platform[], feature?: string) {
  return useQuery({
    queryKey: ['platform-comparison', platforms, feature],
    queryFn: () => platformApi.comparePlatforms(platforms, feature),
    enabled: platforms.length > 1,
    staleTime: 15 * 60 * 1000, // 15 minutes
  });
}

// Helper hook for platform-specific UI logic
export function usePlatformConfig(platform: Platform) {
  const platformConfigs = {
    zapier: {
      name: 'Zapier',
      color: '#FF4A00',
      lightColor: '#FFF5F0',
      icon: '⚡',
      description: 'Connect your apps and automate workflows',
    },
    make: {
      name: 'Make',
      color: '#6366F1',
      lightColor: '#F0F0FF',
      icon: '⚙️',
      description: 'Visual platform for creating, building and automating workflows',
    },
    n8n: {
      name: 'n8n',
      color: '#EA4B71',
      lightColor: '#FFF0F5',
      icon: '🔀',
      description: 'Free and open-source workflow automation tool',
    },
  };

  return platformConfigs[platform] || platformConfigs.zapier;
}

// Helper hook for getting platform-specific styling
export function usePlatformStyles(platform: Platform) {
  const config = usePlatformConfig(platform);
  
  return {
    primaryColor: config.color,
    lightColor: config.lightColor,
    buttonClass: `bg-[${config.color}] hover:bg-[${config.color}]/90 text-white`,
    borderClass: `border-[${config.color}]`,
    textClass: `text-[${config.color}]`,
    bgClass: `bg-[${config.lightColor}]`,
  };
}
