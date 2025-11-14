import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Zap, 
  TrendingUp, 
  Clock, 
  ArrowRight,
  Plus,
  Settings,
  Crown,
  BarChart3
} from 'lucide-react';
import { getWorkflows, checkHealth } from '@/services/api';
import { useLocation } from 'wouter';
import { PRICING_TIERS } from '@/config/pricing';
import { Logo } from '@/components/Brand/Logo';

interface DashboardStats {
  totalWorkflows: number;
  workflowsThisMonth: number;
  lastWorkflowDate: string | null;
  subscriptionTier: string;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [stats, setStats] = useState<DashboardStats>({
    totalWorkflows: 0,
    workflowsThisMonth: 0,
    lastWorkflowDate: null,
    subscriptionTier: 'free'
  });
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [workflowsData, healthData] = await Promise.all([
        getWorkflows(),
        checkHealth()
      ]);

      setWorkflows(workflowsData);
      
      // Calculate stats
      const now = new Date();
      const thisMonth = workflowsData.filter((w: any) => {
        const created = new Date(w.created_at);
        return created.getMonth() === now.getMonth() && 
               created.getFullYear() === now.getFullYear();
      }).length;

      setStats({
        totalWorkflows: workflowsData.length,
        workflowsThisMonth: thisMonth,
        lastWorkflowDate: workflowsData[0]?.created_at || null,
        subscriptionTier: user?.user_metadata?.subscription_tier || 'free'
      });
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const tierConfig = PRICING_TIERS[stats.subscriptionTier as keyof typeof PRICING_TIERS];
  const monthlyLimit = tierConfig?.limits.workflows_per_month || 5;
  const usagePercent = monthlyLimit === -1 
    ? 0 
    : (stats.workflowsThisMonth / monthlyLimit) * 100;

  const shouldShowUpgrade = stats.subscriptionTier === 'free' && 
                            stats.workflowsThisMonth >= monthlyLimit - 1;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Logo />
            <div className="flex items-center gap-4">
              <Badge variant={stats.subscriptionTier === 'free' ? 'secondary' : 'default'}>
                {tierConfig?.name || 'Free'}
              </Badge>
              <Button variant="ghost" size="sm" onClick={() => setLocation('/settings')}>
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Welcome back, {user?.email?.split('@')[0]}! 👋
          </h1>
          <p className="text-gray-600">
            Here's what's happening with your workflows today.
          </p>
        </div>

        {/* Upgrade Banner - Show if nearing limit */}
        {shouldShowUpgrade && (
          <Card className="mb-8 border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Crown className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">You're almost at your limit!</h3>
                    <p className="text-sm text-gray-600">
                      Upgrade to Pro for unlimited workflows and advanced features.
                    </p>
                  </div>
                </div>
                <Button onClick={() => setLocation('/pricing')}>
                  Upgrade Now
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Workflows
              </CardTitle>
              <Zap className="w-4 h-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalWorkflows}</div>
              <p className="text-xs text-gray-500 mt-1">
                All time
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                This Month
              </CardTitle>
              <TrendingUp className="w-4 h-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.workflowsThisMonth}</div>
              <p className="text-xs text-gray-500 mt-1">
                {monthlyLimit === -1 ? 'Unlimited' : `of ${monthlyLimit} used`}
              </p>
              {monthlyLimit !== -1 && (
                <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-600 transition-all"
                    style={{ width: `${Math.min(usagePercent, 100)}%` }}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Last Activity
              </CardTitle>
              <Clock className="w-4 h-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.lastWorkflowDate 
                  ? new Date(stats.lastWorkflowDate).toLocaleDateString()
                  : 'Never'
                }
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Most recent workflow
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Plan Status
              </CardTitle>
              <BarChart3 className="w-4 h-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold capitalize">
                {stats.subscriptionTier}
              </div>
              <Button 
                variant="link" 
                className="p-0 h-auto text-xs mt-1"
                onClick={() => setLocation('/pricing')}
              >
                View plans
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card className="border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors cursor-pointer"
                onClick={() => setLocation('/')}>
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Plus className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Create New Workflow</h3>
                <p className="text-gray-600">
                  Start building your automation with AI assistance
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-dashed border-gray-300 hover:border-purple-400 transition-colors cursor-pointer"
                onClick={() => setLocation('/templates')}>
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Zap className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Browse Templates</h3>
                <p className="text-gray-600">
                  Start from 50+ pre-built workflow templates
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Workflows */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Workflows</CardTitle>
                <CardDescription>Your most recently created workflows</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => setLocation('/workflows')}>
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {workflows.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 mb-4">No workflows yet</p>
                <Button onClick={() => setLocation('/')}>
                  Create Your First Workflow
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {workflows.slice(0, 5).map((workflow) => (
                  <div 
                    key={workflow.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => setLocation(`/workflows/${workflow.id}`)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Zap className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold">{workflow.name}</h4>
                        <p className="text-sm text-gray-500">
                          {workflow.platform} • Created {new Date(workflow.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Badge variant={workflow.status === 'active' ? 'default' : 'secondary'}>
                      {workflow.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

