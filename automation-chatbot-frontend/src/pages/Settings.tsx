import { useState } from 'react';
import { useAuth, supabase } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import { Logo } from '@/components/Brand/Logo';
import { 
  User, 
  CreditCard, 
  Bell, 
  Shield,
  Trash2,
  ExternalLink
} from 'lucide-react';
import { apiClient } from '@/services/api';

export default function Settings() {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [loading, setLoading] = useState(false);

  const handleManageSubscription = async () => {
    try {
      const response = await apiClient.post('/api/subscriptions/portal');
      window.location.href = response.data.portal_url;
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to open subscription portal',
        variant: 'destructive'
      });
    }
  };

  const handleSignOut = async () => {
    await signOut();
    setLocation('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Logo />
            <Button variant="ghost" onClick={() => setLocation('/dashboard')}>
              Back to Dashboard
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-8">Account Settings</h1>

        {/* Profile Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Profile Information
            </CardTitle>
            <CardDescription>
              Manage your account details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Email Address</Label>
              <Input value={user?.email || ''} disabled className="mt-1" />
              <p className="text-sm text-gray-500 mt-1">
                Your email address cannot be changed
              </p>
            </div>
            
            <div>
              <Label>User ID</Label>
              <Input value={user?.id || ''} disabled className="mt-1 font-mono text-sm" />
            </div>
          </CardContent>
        </Card>

        {/* Subscription Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Subscription & Billing
            </CardTitle>
            <CardDescription>
              Manage your subscription and payment methods
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-semibold capitalize">
                  {user?.user_metadata?.subscription_tier || 'Free'} Plan
                </p>
                <p className="text-sm text-gray-600">
                  {user?.user_metadata?.subscription_tier === 'free' 
                    ? '5 workflows per month'
                    : 'Unlimited workflows'
                  }
                </p>
              </div>
              <div className="flex gap-2">
                {user?.user_metadata?.subscription_tier === 'free' ? (
                  <Button onClick={() => setLocation('/pricing')}>
                    Upgrade Plan
                  </Button>
                ) : (
                  <Button variant="outline" onClick={handleManageSubscription}>
                    Manage Subscription
                    <ExternalLink className="w-4 h-4 ml-2" />
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Security
            </CardTitle>
            <CardDescription>
              Manage your password and security settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              variant="outline"
              onClick={async () => {
                try {
                  await supabase.auth.resetPasswordForEmail(user?.email || '');
                  toast({
                    title: 'Password reset email sent',
                    description: 'Check your email for reset instructions'
                  });
                } catch (error) {
                  toast({
                    title: 'Error',
                    description: 'Failed to send reset email',
                    variant: 'destructive'
                  });
                }
              }}
            >
              Change Password
            </Button>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="w-5 h-5" />
              Danger Zone
            </CardTitle>
            <CardDescription>
              Irreversible actions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg">
              <div>
                <p className="font-semibold text-red-600">Delete Account</p>
                <p className="text-sm text-gray-600">
                  Permanently delete your account and all workflows
                </p>
              </div>
              <Button variant="destructive">
                Delete Account
              </Button>
            </div>
            
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-semibold">Sign Out</p>
                <p className="text-sm text-gray-600">
                  Sign out of your account
                </p>
              </div>
              <Button variant="outline" onClick={handleSignOut}>
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

