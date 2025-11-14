import { WorkflowNode, WorkflowConnection } from "@/types/api";
import { Platform } from "@/pages/home";

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface AIResponse {
  message: string;
  nodes?: WorkflowNode[];
  connections?: WorkflowConnection[];
}

export const getInitialMessage = (): string => {
  return "Hi! I'm here to help you build workflow automations. What would you like to automate today?";
};

export const simulateAIResponse = async (
  userMessage: string,
  conversationHistory: Message[],
  currentPlatform: Platform
): Promise<AIResponse> => {
  const message = userMessage.toLowerCase();
  
  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 500));

  // Pattern matching for different types of requests
  if (message.includes('form') && message.includes('slack')) {
    return handleFormToSlackRequest(message, currentPlatform);
  }
  
  if (message.includes('email') && message.includes('crm')) {
    return handleEmailToCRMRequest(message, currentPlatform);
  }
  
  if (message.includes('shopify') || message.includes('ecommerce') || message.includes('order')) {
    return handleEcommerceRequest(message, currentPlatform);
  }
  
  if (message.includes('social media') || message.includes('twitter') || message.includes('linkedin')) {
    return handleSocialMediaRequest(message, currentPlatform);
  }
  
  if (message.includes('migrate') || message.includes('migration')) {
    return {
      message: "I can help you migrate your existing workflow! Please upload your JSON file using the migration panel on the right, or try one of our sample files to see how migration works.",
    };
  }
  
  if (message.includes('template')) {
    return {
      message: "Great! I've highlighted some popular templates in the panel on the right. You can click on any template to load it and see how it works. Would you like me to recommend one based on your needs?",
    };
  }
  
  if (message.includes('build') || message.includes('automation') || message.includes('workflow')) {
    return {
      message: "Perfect! I'd love to help you build an automation. Can you tell me:\n\n1. What should trigger this automation? (e.g., new email, form submission, webhook)\n2. What action should happen? (e.g., send message, create record, notify team)\n3. Which apps do you want to connect?",
    };
  }

  // Default responses based on conversation context
  return getContextualResponse(userMessage, conversationHistory);
};

const handleFormToSlackRequest = (message: string, platform: Platform): AIResponse => {
  const nodes: WorkflowNode[] = [
    {
      id: 'form-trigger',
      type: 'trigger',
      app: 'google-forms',
      action: 'New Response',
      position: { x: 100, y: 100 },
    },
    {
      id: 'slack-action',
      type: 'action',
      app: 'slack',
      action: 'Send Message',
      position: { x: 400, y: 100 },
    },
  ];
  
  const connections: WorkflowConnection[] = [
    { source: 'form-trigger', target: 'slack-action' },
  ];

  return {
    message: `Perfect! I'll create a form-to-Slack automation for you. This workflow will send a Slack message whenever someone submits your form.\n\n✅ Form submission trigger\n✅ Slack message action\n\nYou can see the workflow building on the canvas. Would you like to add more steps or export it to ${platform}?`,
    nodes,
    connections,
  };
};

const handleEmailToCRMRequest = (message: string, platform: Platform): AIResponse => {
  const nodes: WorkflowNode[] = [
    {
      id: 'email-trigger',
      type: 'trigger',
      app: 'gmail',
      action: 'New Email',
      position: { x: 100, y: 100 },
    },
    {
      id: 'crm-action',
      type: 'action',
      app: 'hubspot',
      action: 'Create Contact',
      position: { x: 400, y: 100 },
    },
  ];
  
  const connections: WorkflowConnection[] = [
    { source: 'email-trigger', target: 'crm-action' },
  ];

  return {
    message: `Great choice! I'll set up an email-to-CRM automation that creates a new contact in HubSpot whenever you receive an important email.\n\n✅ Email trigger configured\n✅ CRM contact creation ready\n\nThis workflow will help you never miss a potential lead!`,
    nodes,
    connections,
  };
};

const handleEcommerceRequest = (message: string, platform: Platform): AIResponse => {
  const nodes: WorkflowNode[] = [
    {
      id: 'order-trigger',
      type: 'trigger',
      app: 'shopify',
      action: 'New Order',
      position: { x: 100, y: 100 },
    },
    {
      id: 'inventory-action',
      type: 'action',
      app: 'airtable',
      action: 'Update Record',
      position: { x: 400, y: 100 },
    },
    {
      id: 'notification-action',
      type: 'action',
      app: 'slack',
      action: 'Send Message',
      position: { x: 700, y: 100 },
    },
  ];
  
  const connections: WorkflowConnection[] = [
    { source: 'order-trigger', target: 'inventory-action' },
    { source: 'inventory-action', target: 'notification-action' },
  ];

  return {
    message: `Excellent! I've created an e-commerce order processing automation:\n\n✅ Shopify order trigger\n✅ Inventory update in Airtable\n✅ Team notification via Slack\n\nThis will streamline your order fulfillment process automatically!`,
    nodes,
    connections,
  };
};

const handleSocialMediaRequest = (message: string, platform: Platform): AIResponse => {
  const nodes: WorkflowNode[] = [
    {
      id: 'rss-trigger',
      type: 'trigger',
      app: 'rss',
      action: 'New Item',
      position: { x: 100, y: 100 },
    },
    {
      id: 'twitter-action',
      type: 'action',
      app: 'twitter',
      action: 'Post Tweet',
      position: { x: 400, y: 50 },
    },
    {
      id: 'linkedin-action',
      type: 'action',
      app: 'linkedin',
      action: 'Share Post',
      position: { x: 400, y: 150 },
    },
  ];
  
  const connections: WorkflowConnection[] = [
    { source: 'rss-trigger', target: 'twitter-action' },
    { source: 'rss-trigger', target: 'linkedin-action' },
  ];

  return {
    message: `Perfect for content creators! I've built a social media cross-posting automation:\n\n✅ RSS feed monitor\n✅ Auto-post to Twitter\n✅ Auto-post to LinkedIn\n\nNow your blog posts will automatically share across all your social channels!`,
    nodes,
    connections,
  };
};

const getContextualResponse = (userMessage: string, history: Message[]): AIResponse => {
  const responses = [
    "I understand you want to create an automation. Could you be more specific about what you'd like to connect? For example: 'When someone fills out a form, send me a Slack message.'",
    "That sounds like a great automation idea! To help you better, I need to know:\n• What should trigger the automation?\n• What apps do you want to connect?\n• What should happen when it triggers?",
    "I'm here to help you build that workflow! Can you describe it step by step? Like: 'When X happens, do Y, then Z.'",
    "Let me help you create that automation. The more details you provide about your workflow, the better I can assist you in building it.",
  ];

  return {
    message: responses[Math.floor(Math.random() * responses.length)],
  };
};

// Simulate typing delays for more realistic AI feel
export const getTypingDelay = (messageLength: number): number => {
  // Simulate realistic typing speed (50-100 chars per second)
  const baseDelay = 1000; // Base 1 second
  const typingSpeed = 75; // chars per second
  const calculatedDelay = (messageLength / typingSpeed) * 1000;
  
  return Math.min(Math.max(baseDelay, calculatedDelay), 4000); // Between 1-4 seconds
};
