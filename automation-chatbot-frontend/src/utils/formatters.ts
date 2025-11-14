// Formatting utilities specific to workflow automation

import { Platform } from '@/types/workflow.types';

export function formatPlatformName(platform: Platform): string {
  const platformNames = {
    zapier: 'Zapier',
    make: 'Make.com',
    n8n: 'n8n',
  };
  return platformNames[platform] || platform;
}

export function formatAppName(appName: string): string {
  const appDisplayNames: Record<string, string> = {
    'google-forms': 'Google Forms',
    'google-sheets': 'Google Sheets',
    'google-drive': 'Google Drive',
    'gmail': 'Gmail',
    'slack': 'Slack',
    'discord': 'Discord',
    'hubspot': 'HubSpot',
    'mailchimp': 'Mailchimp',
    'zendesk': 'Zendesk',
    'twitter': 'X (Twitter)',
    'linkedin': 'LinkedIn',
    'facebook': 'Facebook',
    'shopify': 'Shopify',
    'stripe': 'Stripe',
    'paypal': 'PayPal',
    'notion': 'Notion',
    'airtable': 'Airtable',
    'trello': 'Trello',
    'asana': 'Asana',
    'webhook': 'Webhook',
    'rss': 'RSS Feed',
    'shipstation': 'ShipStation',
    'microsoft-teams': 'Microsoft Teams',
    'microsoft-365': 'Microsoft 365',
    'google-workspace': 'Google Workspace',
  };
  
  return appDisplayNames[appName.toLowerCase()] || 
    appName.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
}

export function formatNodeType(type: 'trigger' | 'action' | 'logic'): string {
  const typeNames = {
    trigger: 'Trigger',
    action: 'Action',
    logic: 'Logic',
  };
  return typeNames[type] || type;
}

export function formatComplexity(complexity: 'Beginner' | 'Advanced'): string {
  return complexity;
}

export function formatCategory(category: string): string {
  const categoryNames: Record<string, string> = {
    'marketing': 'Marketing',
    'sales': 'Sales',
    'productivity': 'Productivity',
    'e-commerce': 'E-commerce',
    'communication': 'Communication',
    'crm': 'CRM',
    'forms': 'Forms & Surveys',
    'payments': 'Payments',
    'social-media': 'Social Media',
    'developer': 'Developer Tools',
    'storage': 'File Storage',
  };
  
  return categoryNames[category.toLowerCase()] || 
    category.charAt(0).toUpperCase() + category.slice(1);
}

export function formatWorkflowDescription(
  triggerApp: string,
  actionApps: string[]
): string {
  const trigger = formatAppName(triggerApp);
  const actions = actionApps.map(formatAppName);
  
  if (actions.length === 1) {
    return `${trigger} → ${actions[0]}`;
  } else if (actions.length === 2) {
    return `${trigger} → ${actions.join(' & ')}`;
  } else {
    return `${trigger} → ${actions.slice(0, -1).join(', ')} & ${actions[actions.length - 1]}`;
  }
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const remainingMinutes = Math.floor((seconds % 3600) / 60);
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  }
}

export function formatFileSize(bytes: number): string {
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 Bytes';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
}

export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

export function formatPercentage(value: number, total: number): string {
  if (total === 0) return '0%';
  return Math.round((value / total) * 100) + '%';
}

export function formatRelativeTime(timestamp: string | Date): string {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return 'just now';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 2592000) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  } else {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }
}

export function formatValidationMessage(
  errors: string[],
  warnings: string[]
): string {
  const messages: string[] = [];
  
  if (errors.length > 0) {
    messages.push(`${errors.length} error${errors.length > 1 ? 's' : ''}`);
  }
  
  if (warnings.length > 0) {
    messages.push(`${warnings.length} warning${warnings.length > 1 ? 's' : ''}`);
  }
  
  if (messages.length === 0) {
    return 'Valid';
  }
  
  return messages.join(', ');
}

export function formatPlatformColor(platform: Platform): string {
  const colors = {
    zapier: '#FF4A00',
    make: '#6366F1',
    n8n: '#EA4B71',
  };
  return colors[platform] || '#6366F1';
}

export function formatPlatformLightColor(platform: Platform): string {
  const colors = {
    zapier: '#FFF5F0',
    make: '#F0F0FF',
    n8n: '#FFF0F5',
  };
  return colors[platform] || '#F0F0FF';
}

export function formatJsonPreview(json: any, maxLines: number = 10): string {
  const jsonString = JSON.stringify(json, null, 2);
  const lines = jsonString.split('\n');
  
  if (lines.length <= maxLines) {
    return jsonString;
  }
  
  return lines.slice(0, maxLines).join('\n') + '\n...';
}

export function formatErrorMessage(error: any): string {
  if (typeof error === 'string') {
    return error;
  }
  
  if (error?.message) {
    return error.message;
  }
  
  if (error?.detail) {
    return error.detail;
  }
  
  return 'An unexpected error occurred';
}
