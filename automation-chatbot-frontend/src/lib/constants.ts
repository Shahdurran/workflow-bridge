/**
 * Application Constants
 * 
 * Reusable constants, copy, and configuration values.
 */

import { branding } from '@/config/branding';

// Re-export branding for convenience
export const APP_NAME = branding.app.name;
export const APP_TAGLINE = branding.app.tagline;
export const APP_DESCRIPTION = branding.app.description;

// Platform information
export const PLATFORMS = [
  {
    id: 'zapier' as const,
    name: 'Zapier',
    icon: '⚡',
    color: '#ff4a00',
    lightColor: '#fff5f0',
    description: 'Connect 5,000+ apps with powerful workflows',
    url: 'https://zapier.com',
  },
  {
    id: 'make' as const,
    name: 'Make',
    icon: '🔮',
    color: '#a855f7',
    lightColor: '#faf5ff',
    description: 'Visual automation platform for creative workflows',
    url: 'https://make.com',
  },
  {
    id: 'n8n' as const,
    name: 'n8n',
    icon: '🎯',
    color: '#ec4899',
    lightColor: '#fdf2f8',
    description: 'Open-source workflow automation, self-hostable',
    url: 'https://n8n.io',
  },
] as const;

// Feature highlights
export const FEATURES = [
  {
    id: 'ai-powered',
    icon: '🤖',
    title: 'AI-Powered',
    description: 'Describe workflows in plain English and watch AI build them for you',
    benefit: 'Save hours of manual configuration',
  },
  {
    id: 'instant-export',
    icon: '⚡',
    title: 'Instant Export',
    description: 'Download ready-to-use JSON files that import directly into your platform',
    benefit: 'No manual copying or setup required',
  },
  {
    id: 'validated',
    icon: '✅',
    title: 'Auto-Validated',
    description: 'Every workflow is validated against platform requirements before export',
    benefit: 'Zero errors, guaranteed compatibility',
  },
  {
    id: 'templates',
    icon: '📚',
    title: '50+ Templates',
    description: 'Pre-built workflow templates for common automation scenarios',
    benefit: 'Start from proven solutions',
  },
  {
    id: 'multi-platform',
    icon: '🔗',
    title: 'Multi-Platform',
    description: 'One interface for Zapier, Make, and n8n',
    benefit: 'Learn once, use everywhere',
  },
  {
    id: 'no-code',
    icon: '🎨',
    title: 'No Code Required',
    description: 'Visual drag-and-drop interface with AI assistance',
    benefit: 'Perfect for non-developers',
  },
] as const;

// Use cases / Example scenarios
export const USE_CASES = [
  {
    id: 'lead-generation',
    category: 'Marketing',
    title: 'Lead Generation Automation',
    description: 'Form submissions → Email marketing → CRM',
    apps: ['Google Forms', 'Mailchimp', 'HubSpot'],
    timesSaved: '2 hours/week',
  },
  {
    id: 'support-tickets',
    category: 'Customer Support',
    title: 'Support Ticket Routing',
    description: 'Email → Slack notification → Ticketing system',
    apps: ['Gmail', 'Slack', 'Zendesk'],
    timesSaved: '5 hours/week',
  },
  {
    id: 'social-media',
    category: 'Content Marketing',
    title: 'Social Media Automation',
    description: 'Blog post → Auto-share to social platforms',
    apps: ['WordPress', 'Twitter', 'LinkedIn'],
    timesSaved: '3 hours/week',
  },
  {
    id: 'ecommerce',
    category: 'E-commerce',
    title: 'Order Processing',
    description: 'New order → Inventory update → Shipping label',
    apps: ['Shopify', 'Airtable', 'ShipStation'],
    timesSaved: '10 hours/week',
  },
] as const;

// Template categories
export const TEMPLATE_CATEGORIES = [
  { id: 'marketing', name: 'Marketing', icon: '📣' },
  { id: 'sales', name: 'Sales', icon: '💼' },
  { id: 'productivity', name: 'Productivity', icon: '⚡' },
  { id: 'ecommerce', name: 'E-commerce', icon: '🛍️' },
  { id: 'support', name: 'Customer Support', icon: '💬' },
  { id: 'hr', name: 'HR & Recruiting', icon: '👥' },
  { id: 'finance', name: 'Finance', icon: '💰' },
  { id: 'operations', name: 'Operations', icon: '⚙️' },
] as const;

// Navigation links
export const NAV_LINKS = {
  main: [
    { label: 'Features', href: '/features' },
    { label: 'Templates', href: '/templates' },
    { label: 'Pricing', href: '/pricing' },
    { label: 'Docs', href: '/docs' },
  ],
  footer: {
    product: [
      { label: 'Features', href: '/features' },
      { label: 'Templates', href: '/templates' },
      { label: 'Migration', href: '/migrate' },
      { label: 'API', href: '/api' },
      { label: 'Changelog', href: '/changelog' },
    ],
    support: [
      { label: 'Documentation', href: '/docs' },
      { label: 'Help Center', href: '/help' },
      { label: 'Contact', href: '/contact' },
      { label: 'Status', href: '/status' },
    ],
    company: [
      { label: 'About', href: '/about' },
      { label: 'Blog', href: '/blog' },
      { label: 'Careers', href: '/careers' },
      { label: 'Privacy', href: '/privacy' },
      { label: 'Terms', href: '/terms' },
    ],
  },
} as const;

// Call-to-action copy
export const CTA_COPY = {
  primary: 'Get Started Free',
  secondary: 'View Demo',
  login: 'Sign In',
  signup: 'Sign Up',
  trial: 'Start Free Trial',
  demo: 'Book a Demo',
} as const;

// Social proof (example numbers - update with real data)
export const SOCIAL_PROOF = {
  users: '10,000+',
  workflows: '50,000+',
  integrations: '1,000+',
  timesSaved: '100,000 hours',
  rating: '4.9/5',
  reviewCount: '500+',
} as const;

// Pricing tiers (placeholder - will be in separate pricing config)
export const PRICING_TIERS = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Perfect for trying out WorkflowBridge',
    features: [
      '5 workflows per month',
      'All platforms supported',
      'Basic templates',
      'Community support',
    ],
    cta: 'Start Free',
    popular: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$29',
    period: 'per month',
    description: 'For professionals and growing teams',
    features: [
      'Unlimited workflows',
      'Advanced templates',
      'Priority support',
      'Workflow history',
      'Team collaboration',
    ],
    cta: 'Start Free Trial',
    popular: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 'Custom',
    period: 'contact us',
    description: 'For large organizations',
    features: [
      'Everything in Pro',
      'Dedicated support',
      'Custom integrations',
      'SLA guarantee',
      'On-premise option',
    ],
    cta: 'Contact Sales',
    popular: false,
  },
] as const;

// Status messages
export const STATUS_MESSAGES = {
  loading: 'Loading...',
  saving: 'Saving...',
  success: 'Success!',
  error: 'Something went wrong',
  noResults: 'No results found',
  emptyState: 'Nothing here yet',
} as const;

// API endpoints (re-export from api service if needed)
export const API_ROUTES = {
  chat: '/api/chat',
  workflows: '/api/workflows',
  templates: '/api/workflow/templates',
  platforms: '/api/platforms',
  health: '/health',
} as const;

