import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, X } from 'lucide-react';
import { PRICING_TIERS, FEATURE_COMPARISON } from '@/config/pricing';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from 'wouter';
import { cn } from '@/lib/utils';

export default function Pricing() {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const handleSelectPlan = (tierId: string) => {
    if (!user) {
      setLocation('/signup');
      return;
    }
    
    if (tierId === 'free') {
      setLocation('/');
      return;
    }
    
    if (tierId === 'enterprise') {
      window.location.href = 'mailto:sales@workflowbridge.com?subject=Enterprise Plan Inquiry';
      return;
    }
    
    // Navigate to checkout
    setLocation(`/checkout/${tierId}?billing=${billingPeriod}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <div className="pt-20 pb-12 text-center">
        <h1 className="text-5xl font-bold mb-4">
          Simple, transparent pricing
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Choose the plan that's right for you
        </p>
        
        {/* Billing Toggle */}
        <div className="flex items-center justify-center gap-4 mb-12">
          <span className={cn(
            'text-sm font-medium',
            billingPeriod === 'monthly' ? 'text-gray-900' : 'text-gray-500'
          )}>
            Monthly
          </span>
          <button
            onClick={() => setBillingPeriod(billingPeriod === 'monthly' ? 'yearly' : 'monthly')}
            className="relative inline-flex h-6 w-11 items-center rounded-full bg-blue-600"
          >
            <span className={cn(
              'inline-block h-4 w-4 transform rounded-full bg-white transition',
              billingPeriod === 'yearly' ? 'translate-x-6' : 'translate-x-1'
            )} />
          </button>
          <span className={cn(
            'text-sm font-medium',
            billingPeriod === 'yearly' ? 'text-gray-900' : 'text-gray-500'
          )}>
            Yearly
            <span className="ml-1.5 text-xs text-green-600 font-semibold">
              Save 17%
            </span>
          </span>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="container mx-auto px-4 pb-20">
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {Object.values(PRICING_TIERS).map((tier) => {
            const price = billingPeriod === 'yearly' && tier.priceYearly 
              ? tier.priceYearly 
              : tier.price;
            
            return (
              <Card 
                key={tier.id}
                className={cn(
                  'relative',
                  tier.popular && 'border-blue-500 border-2 shadow-xl scale-105'
                )}
              >
                {tier.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="bg-gradient-to-r from-blue-600 to-blue-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                      Most Popular
                    </span>
                  </div>
                )}
                
                <CardHeader className="text-center pb-8">
                  <CardTitle className="text-2xl mb-2">{tier.name}</CardTitle>
                  <CardDescription className="text-sm">
                    {tier.description}
                  </CardDescription>
                  <div className="mt-4">
                    <span className="text-5xl font-bold">
                      ${price}
                    </span>
                    {tier.billingPeriod && (
                      <span className="text-gray-600 ml-2">
                        /{billingPeriod === 'yearly' ? 'year' : 'month'}
                      </span>
                    )}
                  </div>
                </CardHeader>
                
                <CardContent>
                  <ul className="space-y-3">
                    {tier.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-600">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                
                <CardFooter>
                  <Button
                    onClick={() => handleSelectPlan(tier.id)}
                    className="w-full"
                    variant={tier.popular ? 'default' : 'outline'}
                    size="lg"
                  >
                    {tier.cta}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>

        {/* Feature Comparison Table */}
        <div className="mt-24 max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Compare all features
          </h2>
          
          <div className="bg-white rounded-lg border overflow-hidden">
            {FEATURE_COMPARISON.map((category, idx) => (
              <div key={idx}>
                <div className="bg-gray-50 px-6 py-3 border-b">
                  <h3 className="font-semibold text-lg">{category.category}</h3>
                </div>
                
                {category.features.map((feature, i) => (
                  <div 
                    key={i}
                    className="grid grid-cols-4 gap-4 px-6 py-4 border-b last:border-b-0"
                  >
                    <div className="col-span-1 font-medium text-gray-900">
                      {feature.name}
                    </div>
                    <div className="text-center text-gray-600">
                      {typeof feature.free === 'boolean' ? (
                        feature.free ? <Check className="w-5 h-5 text-green-500 mx-auto" /> : <X className="w-5 h-5 text-gray-300 mx-auto" />
                      ) : (
                        feature.free
                      )}
                    </div>
                    <div className="text-center text-gray-600">
                      {typeof feature.pro === 'boolean' ? (
                        feature.pro ? <Check className="w-5 h-5 text-green-500 mx-auto" /> : <X className="w-5 h-5 text-gray-300 mx-auto" />
                      ) : (
                        feature.pro
                      )}
                    </div>
                    <div className="text-center text-gray-600">
                      {typeof feature.enterprise === 'boolean' ? (
                        feature.enterprise ? <Check className="w-5 h-5 text-green-500 mx-auto" /> : <X className="w-5 h-5 text-gray-300 mx-auto" />
                      ) : (
                        feature.enterprise
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-24 max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Frequently asked questions
          </h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-lg mb-2">Can I change plans later?</h3>
              <p className="text-gray-600">
                Yes! You can upgrade or downgrade your plan at any time. Changes will be reflected in your next billing cycle.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold text-lg mb-2">What happens when I reach my workflow limit?</h3>
              <p className="text-gray-600">
                On the free plan, you'll be prompted to upgrade. Pro and Enterprise plans have unlimited workflows.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold text-lg mb-2">Do you offer refunds?</h3>
              <p className="text-gray-600">
                Yes, we offer a 14-day money-back guarantee on all paid plans. No questions asked.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold text-lg mb-2">Is my data secure?</h3>
              <p className="text-gray-600">
                Absolutely. We use industry-standard encryption and never share your data. All workflows are stored securely in your private account.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


