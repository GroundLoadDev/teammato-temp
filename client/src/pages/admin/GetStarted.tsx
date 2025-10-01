import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Circle, MessageSquare, FileText, Tag, CheckCheck, Slack } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface DashboardStats {
  totalThreads: number;
  totalFeedbackItems: number;
  totalTopics: number;
  readyThreads: number;
}

interface SlackStatus {
  connected: boolean;
  teamId?: string;
  botUserId?: string;
}

interface FeedbackThread {
  id: string;
  title: string;
  topicName: string | null;
  status: string;
  participantCount: number;
  kThreshold: number;
  createdAt: string;
}

export default function GetStarted() {
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ['/api/dashboard/stats'],
  });

  const { data: slackStatus, isLoading: slackLoading } = useQuery<SlackStatus>({
    queryKey: ['/api/dashboard/slack-status'],
  });

  const { data: recentThreads, isLoading: threadsLoading } = useQuery<FeedbackThread[]>({
    queryKey: ['/api/dashboard/recent-threads'],
  });

  const steps = [
    { 
      title: "Slack Integration Connected", 
      desc: "Your workspace is linked", 
      done: slackStatus?.connected || false,
      loading: slackLoading
    },
    { title: "Configure Topics", desc: "Set up feedback categories", done: (stats?.totalTopics || 0) > 0, loading: statsLoading },
    { title: "Test Feedback Flow", desc: "Submit test feedback via Slack", done: (stats?.totalFeedbackItems || 0) > 0, loading: statsLoading },
    { title: "Review Analytics", desc: "Check your dashboard", done: false, loading: false },
  ];

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-semibold mb-2" data-testid="text-get-started-title">Dashboard</h1>
        <p className="text-muted-foreground" data-testid="text-get-started-subtitle">
          Overview of your feedback platform
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card data-testid="card-stat-threads">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Threads</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-threads">
              {statsLoading ? '...' : stats?.totalThreads || 0}
            </div>
            <p className="text-xs text-muted-foreground">Feedback discussions</p>
          </CardContent>
        </Card>

        <Card data-testid="card-stat-items">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Feedback Items</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-items">
              {statsLoading ? '...' : stats?.totalFeedbackItems || 0}
            </div>
            <p className="text-xs text-muted-foreground">Individual submissions</p>
          </CardContent>
        </Card>

        <Card data-testid="card-stat-topics">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Topics</CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-topics">
              {statsLoading ? '...' : stats?.totalTopics || 0}
            </div>
            <p className="text-xs text-muted-foreground">Feedback categories</p>
          </CardContent>
        </Card>

        <Card data-testid="card-stat-ready">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ready Threads</CardTitle>
            <CheckCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-ready-threads">
              {statsLoading ? '...' : stats?.readyThreads || 0}
            </div>
            <p className="text-xs text-muted-foreground">Met k-anonymity threshold</p>
          </CardContent>
        </Card>
      </div>

      {/* Setup Steps */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Setup Progress</h2>
        <div className="max-w-2xl space-y-4">
          {steps.map((step, i) => (
            <div 
              key={i} 
              className="flex items-start gap-4 p-4 rounded-md border bg-card"
              data-testid={`card-step-${i}`}
            >
              {step.loading ? (
                <Circle className="w-6 h-6 text-muted-foreground flex-shrink-0 animate-pulse" />
              ) : step.done ? (
                <CheckCircle2 className="w-6 h-6 text-primary flex-shrink-0" data-testid={`icon-step-done-${i}`} />
              ) : (
                <Circle className="w-6 h-6 text-muted-foreground flex-shrink-0" />
              )}
              <div className="flex-1">
                <h3 className="font-semibold mb-1">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.desc}</p>
              </div>
              {!step.done && !step.loading && (
                <Button size="sm" variant="outline" data-testid={`button-step-${i}`}>
                  Start
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Recent Feedback</h2>
        {threadsLoading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : !recentThreads || recentThreads.length === 0 ? (
          <Card className="p-8 text-center" data-testid="card-no-activity">
            <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-2">No feedback yet</p>
            <p className="text-sm text-muted-foreground">
              Users can submit feedback using <code className="px-1.5 py-0.5 rounded bg-muted text-xs">/teammato</code> in Slack
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {recentThreads.map((thread) => (
              <Card key={thread.id} className="p-4" data-testid={`card-thread-${thread.id}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium truncate" data-testid={`text-thread-topic-${thread.id}`}>
                        {thread.topicName || thread.title || 'Untitled'}
                      </h3>
                      <Badge variant={thread.status === 'ready' ? 'default' : 'secondary'} data-testid={`badge-status-${thread.id}`}>
                        {thread.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {thread.participantCount} participant{thread.participantCount !== 1 ? 's' : ''} • 
                      K-threshold: {thread.kThreshold}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" data-testid={`button-view-${thread.id}`}>
                    View
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Slack Status */}
      {slackStatus && (
        <Card data-testid="card-slack-status">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Slack className="w-5 h-5" />
              Slack Connection
            </CardTitle>
          </CardHeader>
          <CardContent>
            {slackStatus.connected ? (
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-500" data-testid="icon-slack-connected" />
                <span>Connected to workspace</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Circle className="w-5 h-5 text-muted-foreground" />
                <span className="text-muted-foreground">Not connected</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
