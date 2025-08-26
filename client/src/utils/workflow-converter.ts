import { WorkflowNode, WorkflowConnection } from "@shared/schema";

export interface ConversionResult {
  nodes: WorkflowNode[];
  connections: WorkflowConnection[];
  warnings: string[];
}

// Convert between different platform formats
export const convertWorkflow = (
  nodes: WorkflowNode[],
  connections: WorkflowConnection[],
  fromPlatform: 'zapier' | 'make' | 'n8n',
  toPlatform: 'zapier' | 'make' | 'n8n'
): ConversionResult => {
  const warnings: string[] = [];
  
  // Platform-specific conversion mappings
  const appMappings = getPlatformAppMappings();
  const actionMappings = getPlatformActionMappings();
  
  const convertedNodes = nodes.map(node => {
    const convertedApp = convertAppName(node.app, fromPlatform, toPlatform, appMappings);
    const convertedAction = convertActionName(node.action, fromPlatform, toPlatform, actionMappings);
    
    // Add warnings for incompatible features
    if (convertedApp !== node.app) {
      warnings.push(`App "${node.app}" converted to "${convertedApp}" for ${toPlatform}`);
    }
    
    if (convertedAction !== node.action) {
      warnings.push(`Action "${node.action}" converted to "${convertedAction}" for ${toPlatform}`);
    }
    
    return {
      ...node,
      app: convertedApp,
      action: convertedAction,
    };
  });
  
  return {
    nodes: convertedNodes,
    connections, // Connections typically don't need platform-specific conversion
    warnings,
  };
};

// Platform-specific app name mappings
const getPlatformAppMappings = (): Record<string, Record<string, string>> => ({
  zapier: {
    'google-forms': 'google-forms',
    'slack': 'slack',
    'mailchimp': 'mailchimp',
    'hubspot': 'hubspot',
    'gmail': 'gmail',
  },
  make: {
    'google-forms': 'google-forms',
    'slack': 'slack',
    'mailchimp': 'mailchimp', 
    'hubspot': 'hubspot',
    'gmail': 'gmail',
  },
  n8n: {
    'google-forms': 'googleFormsTrigger',
    'slack': 'slack',
    'mailchimp': 'mailchimp',
    'hubspot': 'hubspot',
    'gmail': 'gmail',
  },
});

// Platform-specific action mappings
const getPlatformActionMappings = (): Record<string, Record<string, string>> => ({
  zapier: {
    'New Response': 'new_response',
    'Send Message': 'send_channel_message',
    'Add Subscriber': 'add_update_subscriber',
    'Create Contact': 'create_contact',
    'New Email': 'new_email',
  },
  make: {
    'New Response': 'watch-responses',
    'Send Message': 'create-a-message',
    'Add Subscriber': 'add-update-subscriber',
    'Create Contact': 'create-a-contact',
    'New Email': 'watch-emails',
  },
  n8n: {
    'New Response': 'Form Response',
    'Send Message': 'Send Message',
    'Add Subscriber': 'Add/Update Subscriber',
    'Create Contact': 'Create Contact',
    'New Email': 'New Email',
  },
});

const convertAppName = (
  appName: string,
  fromPlatform: string,
  toPlatform: string,
  mappings: Record<string, Record<string, string>>
): string => {
  const targetMapping = mappings[toPlatform];
  return targetMapping?.[appName] || appName;
};

const convertActionName = (
  actionName: string,
  fromPlatform: string,
  toPlatform: string,
  mappings: Record<string, Record<string, string>>
): string => {
  const targetMapping = mappings[toPlatform];
  return targetMapping?.[actionName] || actionName;
};

// Get platform-specific styling and terminology
export const getPlatformStyling = (platform: 'zapier' | 'make' | 'n8n') => {
  const styles = {
    zapier: {
      primaryColor: '#FF4A00',
      secondaryColor: '#FFF7ED',
      nodeBorderRadius: '8px',
      terminology: {
        workflow: 'Zap',
        trigger: 'Trigger',
        action: 'Action',
        connection: 'Step',
      },
    },
    make: {
      primaryColor: '#6366F1',
      secondaryColor: '#F0F0FF',
      nodeBorderRadius: '12px',
      terminology: {
        workflow: 'Scenario',
        trigger: 'Module',
        action: 'Module',
        connection: 'Route',
      },
    },
    n8n: {
      primaryColor: '#EA4B71',
      secondaryColor: '#FFF0F3',
      nodeBorderRadius: '6px',
      terminology: {
        workflow: 'Workflow',
        trigger: 'Trigger',
        action: 'Node',
        connection: 'Connection',
      },
    },
  };
  
  return styles[platform];
};

// Check compatibility between platforms
export const checkPlatformCompatibility = (
  nodes: WorkflowNode[],
  targetPlatform: 'zapier' | 'make' | 'n8n'
): { compatible: boolean; issues: string[] } => {
  const issues: string[] = [];
  
  // Platform-specific limitations
  const limitations = {
    zapier: {
      maxNodes: 100,
      maxConnections: 100,
      unsupportedApps: [] as string[],
    },
    make: {
      maxNodes: 1000,
      maxConnections: 1000,
      unsupportedApps: [] as string[],
    },
    n8n: {
      maxNodes: Infinity,
      maxConnections: Infinity,
      unsupportedApps: [] as string[],
    },
  };
  
  const limits = limitations[targetPlatform];
  
  if (nodes.length > limits.maxNodes) {
    issues.push(`Too many nodes (${nodes.length}). ${targetPlatform} supports max ${limits.maxNodes}`);
  }
  
  // Check for unsupported apps
  const unsupportedApps = nodes
    .map(n => n.app)
    .filter(app => limits.unsupportedApps.includes(app));
  
  if (unsupportedApps.length > 0) {
    issues.push(`Unsupported apps for ${targetPlatform}: ${unsupportedApps.join(', ')}`);
  }
  
  return {
    compatible: issues.length === 0,
    issues,
  };
};
