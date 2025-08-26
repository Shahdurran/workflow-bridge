import { WorkflowNode, WorkflowConnection } from "@shared/schema";

export interface Template {
  id: string;
  name: string;
  description: string;
  category: 'Marketing' | 'Sales' | 'Productivity' | 'E-commerce';
  apps: string[];
  nodes: WorkflowNode[];
  connections: WorkflowConnection[];
  complexity: 'Beginner' | 'Advanced';
}

export const getTemplates = (): Template[] => [
  {
    id: 'lead-magnet',
    name: 'Lead Magnet Automation',
    description: 'Form → Email → CRM',
    category: 'Marketing',
    apps: ['google-forms', 'mailchimp', 'hubspot'],
    complexity: 'Beginner',
    nodes: [
      {
        id: 'trigger-form',
        type: 'trigger',
        app: 'google-forms',
        action: 'New Response',
        position: { x: 100, y: 100 },
      },
      {
        id: 'action-email',
        type: 'action',
        app: 'mailchimp',
        action: 'Add Subscriber',
        position: { x: 400, y: 100 },
      },
      {
        id: 'action-crm',
        type: 'action',
        app: 'hubspot',
        action: 'Create Contact',
        position: { x: 700, y: 100 },
      },
    ],
    connections: [
      { source: 'trigger-form', target: 'action-email' },
      { source: 'action-email', target: 'action-crm' },
    ],
  },
  {
    id: 'support-ticket',
    name: 'Support Ticket Router',
    description: 'Email → Slack → Helpdesk',
    category: 'Productivity',
    apps: ['gmail', 'slack', 'zendesk'],
    complexity: 'Advanced',
    nodes: [
      {
        id: 'trigger-email',
        type: 'trigger',
        app: 'gmail',
        action: 'New Email',
        position: { x: 100, y: 100 },
      },
      {
        id: 'action-slack',
        type: 'action',
        app: 'slack',
        action: 'Send Message',
        position: { x: 400, y: 100 },
      },
      {
        id: 'action-ticket',
        type: 'action',
        app: 'zendesk',
        action: 'Create Ticket',
        position: { x: 700, y: 100 },
      },
    ],
    connections: [
      { source: 'trigger-email', target: 'action-slack' },
      { source: 'action-slack', target: 'action-ticket' },
    ],
  },
  {
    id: 'social-media',
    name: 'Social Media Cross-post',
    description: 'Blog → Twitter/LinkedIn',
    category: 'Marketing',
    apps: ['rss', 'twitter', 'linkedin'],
    complexity: 'Beginner',
    nodes: [
      {
        id: 'trigger-rss',
        type: 'trigger',
        app: 'rss',
        action: 'New Item',
        position: { x: 100, y: 100 },
      },
      {
        id: 'action-twitter',
        type: 'action',
        app: 'twitter',
        action: 'Post Tweet',
        position: { x: 400, y: 50 },
      },
      {
        id: 'action-linkedin',
        type: 'action',
        app: 'linkedin',
        action: 'Share Post',
        position: { x: 400, y: 150 },
      },
    ],
    connections: [
      { source: 'trigger-rss', target: 'action-twitter' },
      { source: 'trigger-rss', target: 'action-linkedin' },
    ],
  },
  {
    id: 'ecommerce-order',
    name: 'E-commerce Order Processing',
    description: 'Store → Inventory → Shipping',
    category: 'E-commerce',
    apps: ['shopify', 'airtable', 'shipstation'],
    complexity: 'Advanced',
    nodes: [
      {
        id: 'trigger-order',
        type: 'trigger',
        app: 'shopify',
        action: 'New Order',
        position: { x: 100, y: 100 },
      },
      {
        id: 'action-inventory',
        type: 'action',
        app: 'airtable',
        action: 'Update Record',
        position: { x: 400, y: 100 },
      },
      {
        id: 'action-shipping',
        type: 'action',
        app: 'shipstation',
        action: 'Create Label',
        position: { x: 700, y: 100 },
      },
    ],
    connections: [
      { source: 'trigger-order', target: 'action-inventory' },
      { source: 'action-inventory', target: 'action-shipping' },
    ],
  },
];
