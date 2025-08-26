import { 
  SiGoogleforms,
  SiMailchimp,
  SiHubspot,
  SiSlack,
  SiGmail,
  SiZendesk,
  SiX,
  SiLinkedin,
  SiShopify,
  SiAirtable,
  SiNotion,
  SiDiscord,
  SiTrello,
  SiAsana,
  SiGooglesheets,
  SiFacebook,
  SiStripe,
  SiPaypal,
} from 'react-icons/si';
import { 
  Mail,
  Rss,
  Webhook,
  FileSpreadsheet,
  Calendar,
  Database,
  Globe,
  User,
  MessageSquare,
  Phone,
  Video,
  Camera,
  Music,
  Image,
  File,
  Clock,
  Star,
  Heart,
  Share,
  Settings,
  Zap,
} from 'lucide-react';

// Map of app names to their corresponding icons
const appIconMap: Record<string, any> = {
  // Google services
  'google-forms': SiGoogleforms,
  'google-sheets': SiGooglesheets,
  'gmail': SiGmail,
  
  // Communication
  'slack': SiSlack,
  'discord': SiDiscord,
  'email': Mail,
  
  // CRM & Sales
  'hubspot': SiHubspot,
  'mailchimp': SiMailchimp,
  
  // Support
  'zendesk': SiZendesk,
  
  // Social Media
  'twitter': SiX,
  'linkedin': SiLinkedin,
  'facebook': SiFacebook,
  
  // E-commerce
  'shopify': SiShopify,
  'stripe': SiStripe,
  'paypal': SiPaypal,
  
  // Productivity
  'notion': SiNotion,
  'airtable': SiAirtable,
  'trello': SiTrello,
  'asana': SiAsana,
  
  // Technical
  'webhook': Webhook,
  'rss': Rss,
  'database': Database,
  'api': Globe,
  
  // Default/Generic
  'unknown': Settings,
  'user': User,
  'message': MessageSquare,
  'file': File,
  'calendar': Calendar,
  'clock': Clock,
  'star': Star,
  'heart': Heart,
  'share': Share,
  'zap': Zap,
};

export const getAppIcon = (appName: string) => {
  const normalizedName = appName.toLowerCase().replace(/[^a-z0-9-]/g, '-');
  return appIconMap[normalizedName] || appIconMap['unknown'] || Settings;
};

export const getAppDisplayName = (appName: string): string => {
  const displayNames: Record<string, string> = {
    'google-forms': 'Google Forms',
    'google-sheets': 'Google Sheets',
    'gmail': 'Gmail',
    'slack': 'Slack',
    'discord': 'Discord',
    'hubspot': 'HubSpot',
    'mailchimp': 'Mailchimp',
    'zendesk': 'Zendesk',
    'twitter': 'Twitter',
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
  };
  
  return displayNames[appName.toLowerCase()] || appName.split('-').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
};

export const getIntegrations = () => [
  // Communication
  { name: 'slack', displayName: 'Slack', category: 'Communication' },
  { name: 'discord', displayName: 'Discord', category: 'Communication' },
  { name: 'gmail', displayName: 'Gmail', category: 'Communication' },
  
  // CRM & Sales
  { name: 'hubspot', displayName: 'HubSpot', category: 'CRM' },
  { name: 'mailchimp', displayName: 'Mailchimp', category: 'Marketing' },
  
  // Forms & Surveys
  { name: 'google-forms', displayName: 'Google Forms', category: 'Forms' },
  
  // Productivity
  { name: 'notion', displayName: 'Notion', category: 'Productivity' },
  { name: 'airtable', displayName: 'Airtable', category: 'Productivity' },
  { name: 'trello', displayName: 'Trello', category: 'Productivity' },
  { name: 'asana', displayName: 'Asana', category: 'Productivity' },
  { name: 'google-sheets', displayName: 'Google Sheets', category: 'Productivity' },
  
  // E-commerce
  { name: 'shopify', displayName: 'Shopify', category: 'E-commerce' },
  { name: 'stripe', displayName: 'Stripe', category: 'Payments' },
  { name: 'paypal', displayName: 'PayPal', category: 'Payments' },
  
  // Social Media
  { name: 'twitter', displayName: 'X (Twitter)', category: 'Social Media' },
  { name: 'linkedin', displayName: 'LinkedIn', category: 'Social Media' },
  { name: 'facebook', displayName: 'Facebook', category: 'Social Media' },
  
  // Technical
  { name: 'webhook', displayName: 'Webhook', category: 'Developer' },
  { name: 'rss', displayName: 'RSS Feed', category: 'Developer' },
];
