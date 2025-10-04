import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  CheckCircle2, Circle, MessageSquare, FileText, Tag, CheckCheck, 
  Slack, ArrowRight, Info, Download, History, AlertTriangle, Clock,
  Send, ChevronRight, Copy
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

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

interface SlackSettings {
  digestChannel: string | null;
  digestEnabled: boolean;
}

interface BillingUsage {
  detectedMembers: number;
  seatCap: number;
  plan: string;
  trialDaysLeft: number | null;
  usagePercent: number;
  isOverCap: boolean;
  isNearCap: boolean;
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
  const { toast } = useToast();
  const [copiedCommand, setCopiedCommand] = useState<string | null>(null);

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ['/api/dashboard/stats'],
  });

  const { data: slackStatus, isLoading: slackLoading } = useQuery<SlackStatus>({
    queryKey: ['/api/dashboard/slack-status'],
  });

  const { data: slackSettings, isLoading: settingsLoading } = useQuery<SlackSettings>({
    queryKey: ['/api/slack-settings'],
  });

  const { data: billingUsage, isLoading: billingLoading } = useQuery<BillingUsage>({
    queryKey: ['/api/billing/usage'],
  });

  const { data: recentThreads, isLoading: threadsLoading } = useQuery<FeedbackThread[]>({
    queryKey: ['/api/dashboard/recent-threads'],
  });

  const sendDigestMutation = useMutation({
    mutationFn: async () => apiRequest('POST', '/api/slack/digest-preview', {}),
    onSuccess: () => {
      toast({ title: "Sample digest sent!", description: "Check your configured Slack channel." });
    },
    onError: () => {
      toast({ title: "Failed to send digest", variant: "destructive" });
    },
  });

  const copyCommand = (cmd: string) => {
    navigator.clipboard.writeText(cmd);
    setCopiedCommand(cmd);
    setTimeout(() => setCopiedCommand(null), 2000);
  };

  // Get plan display name
  const getPlanName = (plan: string) => {
    if (plan === 'trial') return 'Trial';
    if (plan === 'pro_250') return 'Pro';
    if (plan.startsWith('scale_')) return 'Scale';
    return 'Trial';
  };

  // Get plan badge variant
  const getPlanBadge = (plan: string, trialDaysLeft: number | null) => {
    if (plan === 'trial') {
      if (trialDaysLeft !== null && trialDaysLeft <= 3) {
        return { variant: 'destructive' as const, text: `Trial: ${trialDaysLeft}d left` };
      }
      return { variant: 'secondary' as const, text: trialDaysLeft ? `Trial: ${trialDaysLeft}d left` : 'Trial' };
    }
    return { variant: 'default' as const, text: getPlanName(plan) };
  };

  return (
    <div className="p-8 space-y-6">
      {/* Top Ribbon - Plan Status & Usage */}
      {!billingLoading && billingUsage && (
        <div className="rounded-2xl border bg-gradient-to-r from-emerald-50 to-background dark:from-emerald-950/20 p-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <Badge {...getPlanBadge(billingUsage.plan, billingUsage.trialDaysLeft)} data-testid="badge-plan-status">
                {getPlanBadge(billingUsage.plan, billingUsage.trialDaysLeft).text}
              </Badge>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Workspace members:</span>
                <span className="font-semibold" data-testid="text-member-count">
                  {billingUsage.detectedMembers} / {billingUsage.seatCap}
                </span>
                {billingUsage.isOverCap && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <AlertTriangle className="w-4 h-4 text-destructive" />
                      </TooltipTrigger>
                      <TooltipContent>Over capacity - upgrade needed</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
              <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className={`h-full ${billingUsage.isOverCap ? 'bg-destructive' : billingUsage.isNearCap ? 'bg-yellow-500' : 'bg-emerald-600'}`}
                  style={{ width: `${Math.min(billingUsage.usagePercent, 100)}%` }}
                  data-testid="meter-usage"
                />
              </div>
            </div>
            {billingUsage.plan === 'trial' && (
              <Link href="/admin/billing">
                <Button size="sm" data-testid="button-upgrade">
                  Upgrade Plan
                </Button>
              </Link>
            )}
          </div>
          {billingUsage.isOverCap && (
            <div className="mt-3 text-sm text-destructive flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              You've exceeded your seat limit. Upgrade to continue.
            </div>
          )}
          {billingUsage.isNearCap && !billingUsage.isOverCap && (
            <div className="mt-3 text-sm text-yellow-700 dark:text-yellow-500 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Approaching seat limit. Consider upgrading soon.
            </div>
          )}
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold mb-2" data-testid="text-get-started-title">Dashboard</h1>
        <p className="text-muted-foreground" data-testid="text-get-started-subtitle">
          Overview of your anonymous feedback platform
        </p>
      </div>

      {/* Quick Actions Strip */}
      <div className="flex items-center gap-2 flex-wrap">
        <Link href="/admin/export">
          <Button variant="outline" size="sm" className="gap-2" data-testid="button-export">
            <Download className="w-4 h-4" />
            Export Data
          </Button>
        </Link>
        <Button variant="outline" size="sm" className="gap-2" data-testid="button-audit">
          <History className="w-4 h-4" />
          View Audit Log
        </Button>
        <Link href="/admin/retention">
          <Button variant="outline" size="sm" className="gap-2" data-testid="button-retention">
            <Clock className="w-4 h-4" />
            Retention: 365d
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/admin/feedback">
          <Card className="hover-elevate cursor-pointer" data-testid="card-stat-threads">
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
        </Link>

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

        <Link href="/admin/topics">
          <Card className="hover-elevate cursor-pointer" data-testid="card-stat-topics">
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
        </Link>

        <Link href="/admin/feedback">
          <Card className="hover-elevate cursor-pointer" data-testid="card-stat-ready">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                Ready Threads
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-3.5 h-3.5 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="font-semibold mb-1">K-anonymity threshold: k=5</p>
                      <p className="text-xs">Threads with fewer than 5 participants are hidden until the threshold is met. This protects anonymity.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </CardTitle>
              <CheckCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-ready-threads">
                {statsLoading ? '...' : stats?.readyThreads || 0}
              </div>
              <p className="text-xs text-muted-foreground">Met k-anonymity threshold</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Digest Status Card */}
      {!settingsLoading && slackSettings && (
        <Card data-testid="card-digest-status">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="w-5 h-5" />
              Daily Digest
            </CardTitle>
          </CardHeader>
          <CardContent>
            {slackSettings.digestChannel ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Channel:</span>
                  <code className="px-2 py-1 rounded bg-muted text-xs">{slackSettings.digestChannel}</code>
                  <Badge variant={slackSettings.digestEnabled ? 'default' : 'secondary'}>
                    {slackSettings.digestEnabled ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => sendDigestMutation.mutate()}
                    disabled={sendDigestMutation.isPending}
                    data-testid="button-send-sample"
                  >
                    {sendDigestMutation.isPending ? 'Sending...' : 'Send sample now'}
                  </Button>
                  <Link href="/admin/slack-settings">
                    <Button size="sm" variant="ghost">Configure</Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground mb-3">No digest channel configured</p>
                <Link href="/admin/slack-settings">
                  <Button size="sm" data-testid="button-setup-digest">
                    Setup digest <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Stateful Post-Install Checklist */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Getting Started</h2>
        <div className="max-w-3xl space-y-3">
          {/* Step 1: Slack Connected */}
          <Card className={slackStatus?.connected ? 'border-emerald-200 dark:border-emerald-900' : ''}>
            <CardContent className="p-4 flex items-center gap-4">
              {slackStatus?.connected ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0" data-testid="icon-step-1-done" />
              ) : (
                <Circle className="w-6 h-6 text-muted-foreground flex-shrink-0" />
              )}
              <div className="flex-1">
                <h3 className="font-semibold">Slack connected</h3>
                <p className="text-sm text-muted-foreground">
                  {slackStatus?.connected ? 'Your workspace is linked' : 'Connect your Slack workspace'}
                </p>
              </div>
              {slackStatus?.connected ? (
                <Link href="/admin/slack-settings">
                  <Button size="sm" variant="ghost">Settings</Button>
                </Link>
              ) : (
                <Button size="sm">Connect</Button>
              )}
            </CardContent>
          </Card>

          {/* Step 2: Pick digest channel */}
          <Card className={slackSettings?.digestChannel ? 'border-emerald-200 dark:border-emerald-900' : ''}>
            <CardContent className="p-4 flex items-center gap-4">
              {slackSettings?.digestChannel ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0" data-testid="icon-step-2-done" />
              ) : (
                <Circle className="w-6 h-6 text-muted-foreground flex-shrink-0" />
              )}
              <div className="flex-1">
                <h3 className="font-semibold">Pick digest channel</h3>
                <p className="text-sm text-muted-foreground">
                  {slackSettings?.digestChannel ? `Configured: ${slackSettings.digestChannel}` : 'Set where daily digests are sent'}
                </p>
              </div>
              <Link href="/admin/slack-settings">
                <Button size="sm" variant={slackSettings?.digestChannel ? 'ghost' : 'default'}>
                  {slackSettings?.digestChannel ? 'Change' : 'Setup'}
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Step 3: Seed topics */}
          <Card className={(stats?.totalTopics || 0) > 0 ? 'border-emerald-200 dark:border-emerald-900' : ''}>
            <CardContent className="p-4 flex items-center gap-4">
              {(stats?.totalTopics || 0) > 0 ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0" data-testid="icon-step-3-done" />
              ) : (
                <Circle className="w-6 h-6 text-muted-foreground flex-shrink-0" />
              )}
              <div className="flex-1">
                <h3 className="font-semibold">Seed topics (1-3)</h3>
                <p className="text-sm text-muted-foreground">
                  {(stats?.totalTopics || 0) > 0 ? `${stats?.totalTopics} topics created` : 'Create feedback categories to organize responses'}
                </p>
              </div>
              <Link href="/admin/topics">
                <Button size="sm" variant={(stats?.totalTopics || 0) > 0 ? 'ghost' : 'default'}>
                  {(stats?.totalTopics || 0) > 0 ? 'Manage' : 'Create topics'}
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Step 4: Submit test */}
          <Card className={(stats?.totalFeedbackItems || 0) > 0 ? 'border-emerald-200 dark:border-emerald-900' : ''}>
            <CardContent className="p-4 flex items-center gap-4">
              {(stats?.totalFeedbackItems || 0) > 0 ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0" data-testid="icon-step-4-done" />
              ) : (
                <Circle className="w-6 h-6 text-muted-foreground flex-shrink-0" />
              )}
              <div className="flex-1">
                <h3 className="font-semibold">Submit a test via /teammato</h3>
                <p className="text-sm text-muted-foreground">
                  {(stats?.totalFeedbackItems || 0) > 0 ? 'Test submitted successfully' : 'Try the feedback flow in Slack'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Step 5: Schedule digest */}
          <Card className={slackSettings?.digestEnabled ? 'border-emerald-200 dark:border-emerald-900' : ''}>
            <CardContent className="p-4 flex items-center gap-4">
              {slackSettings?.digestEnabled ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0" data-testid="icon-step-5-done" />
              ) : (
                <Circle className="w-6 h-6 text-muted-foreground flex-shrink-0" />
              )}
              <div className="flex-1">
                <h3 className="font-semibold">Schedule digest</h3>
                <p className="text-sm text-muted-foreground">
                  {slackSettings?.digestEnabled ? 'Daily digest enabled' : 'Enable automated daily summaries'}
                </p>
              </div>
              <Link href="/admin/slack-settings">
                <Button size="sm" variant={slackSettings?.digestEnabled ? 'ghost' : 'default'}>
                  {slackSettings?.digestEnabled ? 'Configure' : 'Enable'}
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Step 6: Invite moderator */}
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <Circle className="w-6 h-6 text-muted-foreground flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-semibold">Invite a moderator</h3>
                <p className="text-sm text-muted-foreground">Add team members to help review feedback</p>
              </div>
              <Link href="/admin/users">
                <Button size="sm" variant="default">Invite</Button>
              </Link>
            </CardContent>
          </Card>

          {/* Step 7: Review analytics */}
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <Circle className="w-6 h-6 text-muted-foreground flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-semibold">Review analytics</h3>
                <p className="text-sm text-muted-foreground">Explore privacy-preserving insights</p>
              </div>
              <Link href="/admin/analytics">
                <Button size="sm" variant="default">View analytics</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Inline Slack Tips */}
      <Card data-testid="card-slack-tips">
        <CardHeader>
          <CardTitle className="text-lg">How to use Teammato in Slack</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="p-3 rounded-lg bg-muted">
              <p className="text-sm text-muted-foreground mb-2">Submit feedback</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 px-2 py-1.5 rounded bg-background text-xs font-mono">/teammato Your feedback here</code>
                <Button 
                  size="sm" 
                  variant="ghost"
                  onClick={() => copyCommand('/teammato Your feedback here')}
                  data-testid="button-copy-command-1"
                >
                  {copiedCommand === '/teammato Your feedback here' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
            <div className="p-3 rounded-lg bg-muted">
              <p className="text-sm text-muted-foreground mb-2">Get help</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 px-2 py-1.5 rounded bg-background text-xs font-mono">/teammato help</code>
                <Button 
                  size="sm" 
                  variant="ghost"
                  onClick={() => copyCommand('/teammato help')}
                  data-testid="button-copy-command-2"
                >
                  {copiedCommand === '/teammato help' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Recent Feedback</h2>
        {threadsLoading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : !recentThreads || recentThreads.length === 0 ? (
          <Card className="p-8 text-center" data-testid="card-no-activity">
            <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="font-medium mb-2">No feedback yet</p>
            <p className="text-sm text-muted-foreground mb-4">
              Try submitting your first feedback using <code className="px-1.5 py-0.5 rounded bg-muted text-xs">/teammato</code> in Slack
            </p>
            <Link href="/admin/topics">
              <Button size="sm" variant="outline">Create your first topic</Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-3">
            {recentThreads.map((thread) => (
              <Card key={thread.id} className="p-4 hover-elevate" data-testid={`card-thread-${thread.id}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-medium" data-testid={`text-thread-topic-${thread.id}`}>
                        {thread.topicName || 'General'}
                      </h3>
                      {thread.topicName && (
                        <Badge variant="outline" className="text-xs">{thread.topicName}</Badge>
                      )}
                      {thread.participantCount >= thread.kThreshold ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <Circle className="w-4 h-4 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              Below k-threshold ({thread.participantCount}/{thread.kThreshold})
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {thread.participantCount} participant{thread.participantCount !== 1 ? 's' : ''}
                      {' • '}
                      {new Date(thread.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Link href="/admin/feedback">
                    <Button variant="outline" size="sm" data-testid={`button-view-${thread.id}`}>
                      View <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
