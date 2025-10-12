import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Download, TrendingUp, Users, MessageSquare, Hash } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";

interface TopicActivity {
  topicId: string;
  topicName: string;
  threadCount: number;
  itemCount: number;
}

interface WeeklyTrend {
  date: string;
  count: number;
}

interface DashboardStats {
  totalThreads: number;
  totalFeedbackItems: number;
  totalTopics: number;
  readyThreads: number;
}

export default function Analytics() {
  const { data: topicActivity, isLoading: isLoadingTopics } = useQuery<TopicActivity[]>({
    queryKey: ['/api/analytics/topic-activity'],
  });

  const { data: weeklyTrend, isLoading: isLoadingTrend } = useQuery<WeeklyTrend[]>({
    queryKey: ['/api/analytics/weekly-trend'],
  });

  const { data: participantData, isLoading: isLoadingParticipants } = useQuery<{ count: number }>({
    queryKey: ['/api/analytics/participant-count'],
  });

  const { data: stats, isLoading: isLoadingStats } = useQuery<DashboardStats>({
    queryKey: ['/api/dashboard/stats'],
  });

  const isLoading = isLoadingTopics || isLoadingTrend || isLoadingParticipants || isLoadingStats;

  const maxActivity = topicActivity?.reduce((max, t) => Math.max(max, t.itemCount), 0) || 1;
  const maxTrendValue = weeklyTrend?.reduce((max, t) => Math.max(max, t.count), 0) || 1;

  // Mark analytics as visited for onboarding completion
  useEffect(() => {
    localStorage.setItem('teammato_analytics_visited', 'true');
  }, []);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-semibold mb-2" data-testid="text-analytics-title">Analytics</h1>
          <p className="text-muted-foreground" data-testid="text-analytics-subtitle">
            Privacy-preserving insights and trends
          </p>
        </div>
        <Button className="gap-2" data-testid="button-export">
          <Download className="w-4 h-4" />
          Export CSV
        </Button>
      </div>

      {isLoading ? (
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28" data-testid={`metric-skeleton-${i}`} />
          ))}
        </div>
      ) : (
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card className="p-4" data-testid="metric-threads">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground">Total Threads</p>
            </div>
            <p className="text-2xl font-bold">{stats?.totalThreads || 0}</p>
          </Card>

          <Card className="p-4" data-testid="metric-feedback">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center">
                <Hash className="w-5 h-5 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground">Total Feedback</p>
            </div>
            <p className="text-2xl font-bold">{stats?.totalFeedbackItems || 0}</p>
          </Card>

          <Card className="p-4" data-testid="metric-participants">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground">Unique Participants</p>
            </div>
            <p className="text-2xl font-bold">{participantData?.count || 0}</p>
          </Card>

          <Card className="p-4" data-testid="metric-ready">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground">Ready to View</p>
            </div>
            <p className="text-2xl font-bold">{stats?.readyThreads || 0}</p>
          </Card>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Activity by Topic</h3>
          {isLoadingTopics ? (
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-12" />
              ))}
            </div>
          ) : topicActivity && topicActivity.length > 0 ? (
            <div className="space-y-3">
              {topicActivity.map((item, i) => (
                <div key={item.topicId} data-testid={`topic-${i}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{item.topicName}</span>
                    <span className="text-sm text-muted-foreground">
                      {item.threadCount} threads, {item.itemCount} items
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary transition-all" 
                      style={{ width: `${(item.itemCount / maxActivity) * 100}%` }} 
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>No topic activity yet</p>
              <p className="text-sm mt-1">Create topics and start collecting feedback to see analytics</p>
            </div>
          )}
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold mb-4">Weekly Trend</h3>
          {isLoadingTrend ? (
            <Skeleton className="h-48" />
          ) : weeklyTrend && weeklyTrend.length > 0 ? (
            <div className="h-48 flex items-end justify-between gap-2">
              {weeklyTrend.map((item, i) => {
                const date = new Date(item.date);
                const dayLabel = date.toLocaleDateString('en-US', { weekday: 'short' });
                const height = maxTrendValue > 0 ? (item.count / maxTrendValue) * 100 : 0;
                
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2">
                    <div 
                      className="w-full bg-primary rounded-t transition-all" 
                      style={{ height: `${Math.max(height, 5)}%` }}
                      data-testid={`bar-${i}`}
                    />
                    <div className="text-center">
                      <div className="text-xs font-medium">{item.count}</div>
                      <div className="text-xs text-muted-foreground">{dayLabel}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-muted-foreground">
              <p className="text-sm">No activity data for the past week</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
