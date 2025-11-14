/**
 * Centralized Branding Configuration
 * 
 * This file contains all branding-related constants for WorkflowBridge.
 * Update this file to change app-wide branding.
 */

export const branding = {
  app: {
    name: 'WorkflowBridge',
    tagline: 'AI-Powered Automation Builder',
    description: 'Build automation workflows 10x faster with AI. Generate workflows for n8n, Make, and Zapier in minutes.',
    shortDescription: 'Turn conversations into automations',
  },
  
  logo: {
    // Lightning bolt SVG icon
    icon: `<svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M13 2L3 14h8l-1 8 10-12h-8l1-8z"/>
    </svg>`,
    // Alternative: Workflow/connection icon
    iconAlt: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="18" cy="5" r="3"/>
      <circle cx="6" cy="12" r="3"/>
      <circle cx="18" cy="19" r="3"/>
      <path d="M8.59 13.51l6.83 3.98"/>
      <path d="M15.41 6.51l-6.82 3.98"/>
    </svg>`,
  },
  
  colors: {
    // Primary brand color (Blue)
    primary: {
      DEFAULT: '#3b82f6',  // blue-500
      light: '#60a5fa',     // blue-400
      dark: '#2563eb',      // blue-600
      lighter: '#93c5fd',   // blue-300
      lightest: '#dbeafe',  // blue-100
    },
    
    // Secondary color (Green - success/growth)
    secondary: {
      DEFAULT: '#10b981',  // green-500
      light: '#34d399',     // green-400
      dark: '#059669',      // green-600
    },
    
    // Accent color (Purple - premium/ai)
    accent: {
      DEFAULT: '#8b5cf6',  // violet-500
      light: '#a78bfa',     // violet-400
      dark: '#7c3aed',      // violet-600
    },
    
    // Neutral colors
    neutral: {
      white: '#ffffff',
      black: '#000000',
      gray: {
        50: '#f9fafb',
        100: '#f3f4f6',
        200: '#e5e7eb',
        300: '#d1d5db',
        400: '#9ca3af',
        500: '#6b7280',
        600: '#4b5563',
        700: '#374151',
        800: '#1f2937',
        900: '#111827',
      },
    },
  },
  
  platforms: {
    zapier: {
      name: 'Zapier',
      color: '#ff4a00',
      lightColor: '#fff5f0',
      icon: '⚡',
      description: 'Connect 5,000+ apps',
    },
    make: {
      name: 'Make',
      color: '#a855f7',  // purple-500
      lightColor: '#faf5ff',
      icon: '🔮',
      description: 'Visual automation builder',
    },
    n8n: {
      name: 'n8n',
      color: '#ec4899',  // pink-500
      lightColor: '#fdf2f8',
      icon: '🎯',
      description: 'Open-source & self-hosted',
    },
  },
  
  features: {
    aiPowered: {
      icon: '🤖',
      title: 'AI-Powered Generation',
      description: 'Describe workflows in plain English, AI does the rest',
    },
    instantExport: {
      icon: '⚡',
      title: 'Instant Export',
      description: 'Download ready-to-use JSON files for any platform',
    },
    validated: {
      icon: '✅',
      title: 'Auto-Validated',
      description: 'Every workflow is validated before export',
    },
    templates: {
      icon: '📚',
      title: '50+ Templates',
      description: 'Pre-built templates for common automation scenarios',
    },
    multiPlatform: {
      icon: '🔗',
      title: 'Multi-Platform',
      description: 'Works with Zapier, Make, and n8n',
    },
    noCode: {
      icon: '🎨',
      title: 'No Code Required',
      description: 'Visual interface, no programming knowledge needed',
    },
  },
  
  social: {
    twitter: {
      url: 'https://twitter.com/workflowbridge',
      handle: '@workflowbridge',
    },
    github: {
      url: 'https://github.com/workflowbridge',
      username: 'workflowbridge',
    },
    discord: {
      url: 'https://discord.gg/workflowbridge',
      invite: 'workflowbridge',
    },
  },
  
  meta: {
    url: 'https://workflowbridge.com',
    email: 'hello@workflowbridge.com',
    support: 'support@workflowbridge.com',
  },
} as const;

// Export individual constants for convenience
export const APP_NAME = branding.app.name;
export const APP_TAGLINE = branding.app.tagline;
export const APP_DESCRIPTION = branding.app.description;
export const PLATFORMS = Object.values(branding.platforms);
export const FEATURES = Object.values(branding.features);

