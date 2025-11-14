export const PRICING_TIERS = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    billingPeriod: null,
    description: 'Perfect for trying out WorkflowBridge',
    features: [
      '5 workflow generations per month',
      'All 3 platforms (Zapier, Make, n8n)',
      'Basic templates library',
      'Community support',
      'Export to JSON',
    ],
    limits: {
      workflows_per_month: 5,
      templates_access: 'basic',
      support: 'community',
    },
    cta: 'Get Started Free',
    popular: false,
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 29,
    billingPeriod: 'month',
    priceYearly: 290,
    description: 'For professionals and small teams',
    features: [
      'Unlimited workflow generations',
      'All 3 platforms (Zapier, Make, n8n)',
      'Full template library (50+ templates)',
      'Priority email support',
      'Workflow validation & debugging',
      'Advanced AI suggestions',
      'Workflow version history',
    ],
    limits: {
      workflows_per_month: -1, // unlimited
      templates_access: 'full',
      support: 'priority',
    },
    cta: 'Start Pro Trial',
    popular: true,
    stripeMonthlyPriceId: 'price_monthly_xxx', // Replace with actual Stripe price ID
    stripeYearlyPriceId: 'price_yearly_xxx',
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    price: 99,
    billingPeriod: 'month',
    priceYearly: 990,
    description: 'For large teams and organizations',
    features: [
      'Everything in Pro',
      'Team collaboration (unlimited members)',
      'SSO / SAML authentication',
      'Custom workflow templates',
      'Dedicated account manager',
      'SLA guarantee (99.9% uptime)',
      'Custom integrations',
      'Advanced analytics',
      'API access',
    ],
    limits: {
      workflows_per_month: -1,
      templates_access: 'full',
      support: 'dedicated',
      team_members: -1,
    },
    cta: 'Contact Sales',
    popular: false,
    stripeMonthlyPriceId: 'price_monthly_ent_xxx',
    stripeYearlyPriceId: 'price_yearly_ent_xxx',
  },
} as const;

export type SubscriptionTier = keyof typeof PRICING_TIERS;

export const FEATURE_COMPARISON = [
  {
    category: 'Workflow Generation',
    features: [
      { name: 'Monthly workflows', free: '5', pro: 'Unlimited', enterprise: 'Unlimited' },
      { name: 'Platforms supported', free: '3', pro: '3', enterprise: '3' },
      { name: 'AI-powered generation', free: true, pro: true, enterprise: true },
      { name: 'Advanced AI suggestions', free: false, pro: true, enterprise: true },
    ],
  },
  {
    category: 'Templates & Resources',
    features: [
      { name: 'Template library access', free: 'Basic', pro: 'Full (50+)', enterprise: 'Full + Custom' },
      { name: 'Custom templates', free: false, pro: false, enterprise: true },
    ],
  },
  {
    category: 'Features',
    features: [
      { name: 'Workflow validation', free: true, pro: true, enterprise: true },
      { name: 'Export to JSON', free: true, pro: true, enterprise: true },
      { name: 'Version history', free: false, pro: true, enterprise: true },
      { name: 'Workflow debugging', free: false, pro: true, enterprise: true },
      { name: 'Team collaboration', free: false, pro: false, enterprise: true },
      { name: 'API access', free: false, pro: false, enterprise: true },
    ],
  },
  {
    category: 'Support',
    features: [
      { name: 'Support type', free: 'Community', pro: 'Priority Email', enterprise: 'Dedicated Manager' },
      { name: 'Response time', free: '48 hours', pro: '24 hours', enterprise: '4 hours' },
      { name: 'SLA guarantee', free: false, pro: false, enterprise: '99.9%' },
    ],
  },
];


