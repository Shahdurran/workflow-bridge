import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  getTrainingStats, 
  exportTrainingData,
  triggerArchive 
} from '@/services/api';
import { TrainingReadiness } from '@/components/Admin/TrainingReadiness';
import {
  Database,
  Download,
  Archive,
  TrendingUp,
  DollarSign,
  ThumbsUp,
  ThumbsDown,
  CheckCircle,
  XCircle,
  HardDrive,
  Cloud,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { TrainingStats } from '@/types/workflow.types';
import { 
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { cn } from '@/lib/utils';

const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444'];

export default function TrainingDataPage() {
  const [stats, setStats] = useState<TrainingStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState<string | null>(null);
  const [isArchiving, setIsArchiving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const data = await getTrainingStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      toast({
        title: 'Error',
        description: 'Failed to load training statistics',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async (platform: string) => {
    setIsExporting(platform);
    try {
      const blob = await exportTrainingData(platform);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `training_data_${platform}_${new Date().toISOString().split('T')[0]}.jsonl`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: 'Export successful',
        description: `Training data for ${platform} has been downloaded`,
      });
    } catch (error) {
      console.error('Failed to export:', error);
      toast({
        title: 'Export failed',
        description: 'Failed to export training data',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(null);
    }
  };

  const handleArchive = async () => {
    setIsArchiving(true);
    try {
      const result = await triggerArchive(30, false);
      
      toast({
        title: 'Archive complete',
        description: `Archived ${result.archived_count} records`,
      });
      
      // Refresh stats
      await fetchStats();
    } catch (error) {
      console.error('Failed to archive:', error);
      toast({
        title: 'Archive failed',
        description: 'Failed to archive old data',
        variant: 'destructive',
      });
    } finally {
      setIsArchiving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center space-y-4">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
              <p className="text-muted-foreground">Failed to load training data statistics</p>
              <Button onClick={fetchStats}>Try Again</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Prepare chart data
  const platformData = Object.entries(stats.by_platform || {}).map(([platform, data]) => ({
    name: platform.toUpperCase(),
    total: data.total_interactions,
    successful: data.successful_interactions,
    failed: data.failed_interactions,
    feedback: data.total_feedback_count,
  }));

  const feedbackData = Object.entries(stats.by_platform || {}).map(([platform, data]) => ({
    name: platform.toUpperCase(),
    thumbsUp: data.thumbs_up_count,
    thumbsDown: data.thumbs_down_count,
    edited: data.edited_count,
  }));

  const storageData = [
    { name: 'Supabase', value: stats.storage.supabase_size_bytes, display: stats.storage.supabase_size_display },
    { name: 'Archived (R2)', value: stats.storage.archived_size_bytes, display: stats.storage.archived_size_display },
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Training Data Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Monitor AI training data collection and storage costs
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleArchive}
            disabled={isArchiving}
            variant="outline"
          >
            {isArchiving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Archiving...
              </>
            ) : (
              <>
                <Archive className="mr-2 h-4 w-4" />
                Archive Old Data
              </>
            )}
          </Button>
          <Button onClick={fetchStats} variant="outline">
            Refresh
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Records</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.overview.total_records.toLocaleString()}</div>
            <div className="flex gap-2 mt-2 text-xs text-muted-foreground">
              <span>{stats.overview.active_records} active</span>
              <span>•</span>
              <span>{stats.overview.archived_records} archived</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">With Feedback</CardTitle>
            <ThumbsUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.overview.records_with_feedback}</div>
            <div className="text-xs text-muted-foreground mt-2">
              {((stats.overview.records_with_feedback / stats.overview.total_records) * 100).toFixed(1)}% feedback rate
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Storage Usage</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.storage.total_size_display}</div>
            <div className="text-xs text-muted-foreground mt-2">
              {stats.storage.supabase_size_display} in Supabase
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.costs.total_monthly_usd.toFixed(2)}</div>
            {stats.costs.savings_monthly_usd > 0 && (
              <div className="text-xs text-green-600 dark:text-green-400 mt-2">
                Saving ${stats.costs.savings_monthly_usd.toFixed(2)}/mo ({stats.costs.savings_percentage.toFixed(1)}%)
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Training Readiness */}
      <TrainingReadiness />

      {/* Platform Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Platform Statistics</CardTitle>
          <CardDescription>Interaction counts and success rates by platform</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={platformData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="successful" fill="#10b981" name="Successful" />
              <Bar dataKey="failed" fill="#ef4444" name="Failed" />
              <Bar dataKey="feedback" fill="#3b82f6" name="With Feedback" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Feedback Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Feedback Distribution</CardTitle>
          <CardDescription>User feedback breakdown by platform</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={feedbackData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="thumbsUp" fill="#10b981" name="👍 Thumbs Up" />
              <Bar dataKey="thumbsDown" fill="#ef4444" name="👎 Thumbs Down" />
              <Bar dataKey="edited" fill="#f59e0b" name="✏️ Edited" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Storage Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Storage Distribution</CardTitle>
            <CardDescription>Data location breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={storageData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, display }) => `${name}: ${display}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {storageData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cost Breakdown</CardTitle>
            <CardDescription>Monthly storage costs</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <HardDrive className="h-4 w-4 text-blue-500" />
                  <span className="text-sm">Supabase Storage</span>
                </div>
                <span className="font-semibold">${stats.costs.supabase_monthly_usd.toFixed(2)}/mo</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Cloud className="h-4 w-4 text-green-500" />
                  <span className="text-sm">R2 Storage</span>
                </div>
                <span className="font-semibold">${stats.costs.r2_monthly_usd.toFixed(2)}/mo</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t">
                <span className="text-sm font-medium">Total</span>
                <span className="font-bold">${stats.costs.total_monthly_usd.toFixed(2)}/mo</span>
              </div>
              {stats.costs.savings_monthly_usd > 0 && (
                <div className="flex items-center justify-between text-green-600 dark:text-green-400">
                  <span className="text-sm">Savings vs No Archiving</span>
                  <span className="font-semibold">${stats.costs.savings_monthly_usd.toFixed(2)}/mo</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Export Section */}
      <Card>
        <CardHeader>
          <CardTitle>Export Training Data</CardTitle>
          <CardDescription>
            Download training data in OpenAI fine-tuning format (JSONL)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(stats.by_platform || {}).map(([platform, data]) => (
              <Card key={platform}>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold uppercase">{platform}</h3>
                      <Badge variant="outline">{data.total_interactions} examples</Badge>
                    </div>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div className="flex justify-between">
                        <span>Success Rate:</span>
                        <span className="font-medium">{data.success_rate.toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>With Feedback:</span>
                        <span className="font-medium">{data.total_feedback_count}</span>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleExport(platform)}
                      disabled={isExporting === platform}
                      className="w-full"
                      variant="outline"
                    >
                      {isExporting === platform ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Exporting...
                        </>
                      ) : (
                        <>
                          <Download className="mr-2 h-4 w-4" />
                          Export {platform.toUpperCase()}
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      {stats.recommendations && stats.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recommendations</CardTitle>
            <CardDescription>Suggestions to improve your training data</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {stats.recommendations.map((rec, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <span className="mt-0.5">{rec.startsWith('✅') ? '✅' : rec.startsWith('⚠️') || rec.startsWith('❌') ? '⚠️' : '💡'}</span>
                  <span>{rec.replace(/^[✅⚠️❌💡]\s*/, '')}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

