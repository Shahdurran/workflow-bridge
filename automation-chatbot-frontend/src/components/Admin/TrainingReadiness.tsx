import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { getTrainingReadiness } from '@/services/api';
import { AlertCircle, CheckCircle, TrendingUp, Loader2 } from 'lucide-react';
import { TrainingReadiness as TrainingReadinessType } from '@/types/workflow.types';
import { cn } from '@/lib/utils';

const PLATFORMS = ['zapier', 'make', 'n8n'];

interface TrainingReadinessWidgetProps {
  className?: string;
}

export function TrainingReadiness({ className }: TrainingReadinessWidgetProps) {
  const [readinessData, setReadinessData] = useState<Record<string, TrainingReadinessType>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReadiness = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const results: Record<string, TrainingReadinessType> = {};
        
        for (const platform of PLATFORMS) {
          try {
            const data = await getTrainingReadiness(platform);
            results[platform] = data;
          } catch (err) {
            console.error(`Failed to fetch readiness for ${platform}:`, err);
          }
        }
        
        setReadinessData(results);
      } catch (err) {
        console.error('Failed to fetch training readiness:', err);
        setError('Failed to load training readiness data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchReadiness();
  }, []);

  const getScoreColor = (score: number): string => {
    if (score >= 85) return 'text-green-600 dark:text-green-400';
    if (score >= 70) return 'text-green-600 dark:text-green-400';
    if (score >= 50) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getScoreBadge = (score: number): { variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode } => {
    if (score >= 70) {
      return { variant: 'default', icon: <CheckCircle className="h-3 w-3 mr-1" /> };
    }
    if (score >= 50) {
      return { variant: 'secondary', icon: <TrendingUp className="h-3 w-3 mr-1" /> };
    }
    return { variant: 'destructive', icon: <AlertCircle className="h-3 w-3 mr-1" /> };
  };

  const getProgressColor = (score: number): string => {
    if (score >= 70) return 'bg-green-500';
    if (score >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Training Readiness</CardTitle>
          <CardDescription>Loading readiness data...</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Training Readiness</CardTitle>
          <CardDescription>Error loading data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Training Readiness
        </CardTitle>
        <CardDescription>
          Check if you have enough quality data to train custom models
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {PLATFORMS.map((platform) => {
          const data = readinessData[platform];
          
          if (!data) {
            return (
              <div key={platform} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium uppercase">{platform}</span>
                  <Badge variant="outline">No data</Badge>
                </div>
              </div>
            );
          }

          const badge = getScoreBadge(data.readiness_score);

          return (
            <div key={platform} className="space-y-3">
              {/* Platform header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold uppercase">{platform}</span>
                  <Badge variant={badge.variant} className="text-xs">
                    {badge.icon}
                    {data.is_ready ? 'Ready' : 'Not Ready'}
                  </Badge>
                </div>
                <span className={cn('text-2xl font-bold', getScoreColor(data.readiness_score))}>
                  {data.readiness_score}
                </span>
              </div>

              {/* Progress bar */}
              <div className="space-y-1">
                <Progress 
                  value={data.readiness_score} 
                  className="h-2"
                  indicatorClassName={getProgressColor(data.readiness_score)}
                />
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Total Examples</div>
                  <div className="text-lg font-semibold">{data.total_examples}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Successful</div>
                  <div className="text-lg font-semibold text-green-600 dark:text-green-400">
                    {data.successful_examples}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Quality</div>
                  <div className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                    {data.quality_examples}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">With Feedback</div>
                  <div className="text-lg font-semibold text-purple-600 dark:text-purple-400">
                    {data.examples_with_feedback}
                  </div>
                </div>
              </div>

              {/* Recommendation */}
              <div className={cn(
                "rounded-lg p-3 text-sm",
                data.is_ready
                  ? "bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200"
                  : "bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200"
              )}>
                {data.recommendation}
              </div>
            </div>
          );
        })}

        {/* Overall summary */}
        {Object.keys(readinessData).length > 0 && (
          <div className="pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              {Object.values(readinessData).filter(d => d.is_ready).length} of {PLATFORMS.length} platforms ready for training
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

