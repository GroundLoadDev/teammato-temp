import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  CheckCircle2, Circle, MessageSquare, FileText, Tag, CheckCheck, 
  Slack, ArrowRight, Info, Download, History, AlertTriangle, Clock,
  Send, ChevronRight, Copy, TrendingUp, Users, Sparkles, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { statusBadge, type CanonicalStatus } from "@/lib/billingStatus";

interface DashboardStats {
  totalThreads: number;
  totalFeedbackItems: number;
  totalTopics: number;
  readyThreads: number;
  newThisWeek: number;
  activeParticipants: number;
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

interface BillingStatus {
  orgId: string;
  status: CanonicalStatus;
  seatCap: number;
  period: 'monthly' | 'annual';
  price: number;
  trialEnd: string | null;
  cancelsAt: string | null;
  graceEndsAt: string | null;
  grandfatheredUntil: string | null;
  eligibleCount: number;
  percent: number;
  customerEmail: string | null;
  hasSubscription: boolean;
  subscriptionId: string | null;
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

export default function Dashboard() {
  const { toast } = useToast();
  const [copiedCommand, setCopiedCommand] = useState<string | null>(null);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showMilestone, setShowMilestone] = useState<string | null>(null);
  const [commandDialog, setCommandDialog] = useState<'general' | 'topic' | 'suggest' | 'help' | null>(null);

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ['/api/dashboard/stats'],
  });

  const { data: slackStatus, isLoading: slackLoading } = useQuery<SlackStatus>({
    queryKey: ['/api/dashboard/slack-status'],
  });

  const { data: slackSettings, isLoading: settingsLoading } = useQuery<SlackSettings>({
    queryKey: ['/api/slack-settings'],
  });

  const { data: billing, isLoading: billingLoading } = useQuery<BillingStatus>({
    queryKey: ['/api/billing/status'],
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

  // First-run detection and milestone tracking
  useEffect(() => {
    if (!statsLoading && !slackLoading && stats && slackStatus) {
      const hasSeenWelcome = localStorage.getItem('teammato_welcomed');
      const lastFeedbackCount = parseInt(localStorage.getItem('teammato_last_feedback') || '0');
      const hasReachedK = localStorage.getItem('teammato_k_reached');
      
      // Show welcome for first-time users
      if (!hasSeenWelcome && slackStatus.connected && stats.totalFeedbackItems === 0) {
        setShowWelcome(true);
      }
      
      // Milestone: First feedback received
      if (stats.totalFeedbackItems > 0 && lastFeedbackCount === 0) {
        const hasSeenFirstFeedback = sessionStorage.getItem('teammato_first_feedback_celebrated');
        if (!hasSeenFirstFeedback) {
          setShowMilestone('first_feedback');
          sessionStorage.setItem('teammato_first_feedback_celebrated', 'true');
        }
      }
      
      // Milestone: K-anonymity threshold reached
      if (stats.readyThreads > 0 && !hasReachedK) {
        const hasSeenKReached = sessionStorage.getItem('teammato_k_celebrated');
        if (!hasSeenKReached) {
          setShowMilestone('k_reached');
          sessionStorage.setItem('teammato_k_celebrated', 'true');
          localStorage.setItem('teammato_k_reached', 'true');
        }
      }
      
      localStorage.setItem('teammato_last_feedback', stats.totalFeedbackItems.toString());
    }
  }, [stats, statsLoading, slackStatus, slackLoading]);

  const dismissWelcome = () => {
    setShowWelcome(false);
    localStorage.setItem('teammato_welcomed', 'true');
  };

  return (
    <div className="p-8 space-y-6">
      {/* Top Ribbon - Plan Status & Usage */}
      {!billingLoading && billing && (
        <div className="rounded-2xl border bg-gradient-to-r from-emerald-50 to-background dark:from-emerald-950/20 p-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <Badge {...statusBadge(billing.status, billing.trialEnd)} data-testid="badge-plan-status">
                {statusBadge(billing.status, billing.trialEnd).text}
              </Badge>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Workspace members:</span>
                <span className="font-semibold" data-testid="text-member-count">
                  {billing.eligibleCount} / {billing.seatCap}
                </span>
                {billing.eligibleCount > billing.seatCap && (
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
                  className={`h-full ${billing.eligibleCount > billing.seatCap ? 'bg-destructive' : billing.percent >= 90 ? 'bg-yellow-500' : 'bg-emerald-600'}`}
                  style={{ width: `${Math.min(billing.percent, 100)}%` }}
                  data-testid="meter-usage"
                />
              </div>
            </div>
            {(billing.status === 'trialing' || !billing.hasSubscription) && (
              <Link href="/admin/billing">
                <Button size="sm" data-testid="button-upgrade">
                  {billing.status === 'trialing' ? 'Manage Plan' : 'Start Free Trial'}
                </Button>
              </Link>
            )}
          </div>
          {billing.eligibleCount > billing.seatCap && (
            <div className="mt-3 text-sm text-destructive flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              You've exceeded your seat limit. Upgrade to continue.
            </div>
          )}
          {billing.percent >= 90 && billing.eligibleCount <= billing.seatCap && (
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
            {!statsLoading && stats?.totalFeedbackItems === 0 ? (
              <p className="text-xs text-muted-foreground">Invite team to submit feedback via Slack</p>
            ) : (
              <p className="text-xs text-muted-foreground">Individual submissions</p>
            )}
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
              {!statsLoading && stats?.readyThreads === 0 ? (
                <p className="text-xs text-muted-foreground">Need 5+ participants to unlock</p>
              ) : (
                <p className="text-xs text-muted-foreground">Met k-anonymity threshold</p>
              )}
            </CardContent>
          </Card>
        </Link>

        <Card data-testid="card-stat-new-week">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New This Week</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-new-week">
              {statsLoading ? '...' : stats?.newThisWeek || 0}
            </div>
            {!statsLoading && stats?.newThisWeek === 0 ? (
              <p className="text-xs text-muted-foreground">Share Slack commands to activate</p>
            ) : (
              <p className="text-xs text-muted-foreground">Items in last 7 days</p>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-stat-participants">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Participants</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-participants">
              {statsLoading ? '...' : stats?.activeParticipants || 0}
            </div>
            {!statsLoading && stats?.activeParticipants === 0 ? (
              <p className="text-xs text-muted-foreground">Waiting for first contributors</p>
            ) : (
              <p className="text-xs text-muted-foreground">K-safe unique contributors</p>
            )}
          </CardContent>
        </Card>
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
                <h3 className="font-semibold flex items-center gap-2">
                  Pick digest channel
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="w-3.5 h-3.5 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p className="text-xs">Daily digests summarize new feedback and send to your chosen channel, keeping everyone informed without spamming.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </h3>
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
            <Card 
              className="p-4 cursor-pointer hover-elevate" 
              onClick={() => setCommandDialog('general')}
              data-testid="card-command-general"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <p className="font-medium mb-1">General Feedback</p>
                  <code className="text-xs text-muted-foreground">/teammato</code>
                  <p className="text-xs text-muted-foreground mt-2">Submit anonymous feedback via modal</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" />
              </div>
            </Card>

            <Card 
              className="p-4 cursor-pointer hover-elevate" 
              onClick={() => setCommandDialog('topic')}
              data-testid="card-command-topic"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <p className="font-medium mb-1">Topic-Specific Feedback</p>
                  <code className="text-xs text-muted-foreground">/teammato &lt;topic-slug&gt;</code>
                  <p className="text-xs text-muted-foreground mt-2">Submit to a specific topic</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" />
              </div>
            </Card>

            <Card 
              className="p-4 cursor-pointer hover-elevate" 
              onClick={() => setCommandDialog('suggest')}
              data-testid="card-command-suggest"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <p className="font-medium mb-1">Suggest Topic</p>
                  <code className="text-xs text-muted-foreground">/teammato suggest</code>
                  <p className="text-xs text-muted-foreground mt-2">Propose a new feedback topic</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" />
              </div>
            </Card>

            <Card 
              className="p-4 cursor-pointer hover-elevate" 
              onClick={() => setCommandDialog('help')}
              data-testid="card-command-help"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <p className="font-medium mb-1">Get Help</p>
                  <code className="text-xs text-muted-foreground">/teammato help</code>
                  <p className="text-xs text-muted-foreground mt-2">View all commands and privacy tips</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" />
              </div>
            </Card>
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

      {/* Welcome Modal for First-Time Users */}
      <Dialog open={showWelcome} onOpenChange={setShowWelcome}>
        <DialogContent className="sm:max-w-md" data-testid="dialog-welcome">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-600" />
              Welcome to Teammato!
            </DialogTitle>
            <DialogDescription className="pt-4 space-y-3">
              <p>Your anonymous feedback platform is ready. Here's how to get started:</p>
              <ul className="list-disc pl-5 space-y-2 text-sm">
                <li>Create 1-3 topics to organize feedback</li>
                <li>Configure your digest channel</li>
                <li>Try submitting feedback using <code className="px-1 py-0.5 rounded bg-muted">/teammato</code></li>
                <li>Invite team members as moderators</li>
              </ul>
              <p className="text-xs text-muted-foreground pt-2">
                Tip: Feedback is hidden until 5+ unique participants contribute to maintain anonymity.
              </p>
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 justify-end pt-4">
            <Button variant="outline" onClick={dismissWelcome}>Got it</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Milestone Modals */}
      <Dialog open={showMilestone === 'first_feedback'} onOpenChange={(open) => !open && setShowMilestone(null)}>
        <DialogContent className="sm:max-w-md" data-testid="dialog-first-feedback">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-600" />
              First Feedback Received!
            </DialogTitle>
            <DialogDescription className="pt-4">
              <p>Congratulations! Your team has started sharing feedback anonymously.</p>
              <p className="text-xs text-muted-foreground mt-3">
                Remember: Feedback remains hidden until 5+ unique contributors participate in a thread.
              </p>
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 justify-end pt-4">
            <Button onClick={() => setShowMilestone(null)}>Continue</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showMilestone === 'k_reached'} onOpenChange={(open) => !open && setShowMilestone(null)}>
        <DialogContent className="sm:max-w-md" data-testid="dialog-k-reached">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-600" />
              K-Anonymity Threshold Reached!
            </DialogTitle>
            <DialogDescription className="pt-4">
              <p>Your first feedback thread has met the k=5 threshold and is now visible!</p>
              <p className="text-xs text-muted-foreground mt-3">
                This milestone means your team is actively participating in anonymous feedback.
              </p>
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 justify-end pt-4">
            <Link href="/admin/feedback">
              <Button>View Feedback</Button>
            </Link>
          </div>
        </DialogContent>
      </Dialog>

      {/* Command Dialogs */}
      <Dialog open={commandDialog === 'general'} onOpenChange={(open) => !open && setCommandDialog(null)}>
        <DialogContent className="sm:max-w-lg" data-testid="dialog-command-general">
          <DialogHeader>
            <DialogTitle>General Feedback</DialogTitle>
            <DialogDescription className="pt-4 space-y-4">
              <div>
                <p className="font-medium mb-2">Command:</p>
                <code className="px-3 py-2 rounded bg-muted text-sm block">/teammato</code>
              </div>
              <div>
                <p className="font-medium mb-2">How it works:</p>
                <ol className="list-decimal pl-5 space-y-2 text-sm">
                  <li>Type <code className="px-1 py-0.5 rounded bg-muted">/teammato</code> in any Slack channel</li>
                  <li>A two-step modal opens for anonymous submission</li>
                  <li>Step 1: Enter your feedback title (becomes thread title)</li>
                  <li>Step 2: Add detailed feedback and optional topic selection</li>
                  <li>Your feedback is encrypted, posted to the digest channel, and you receive a DM receipt</li>
                </ol>
              </div>
              <div className="bg-muted/50 p-3 rounded-md">
                <p className="text-xs text-muted-foreground">
                  <strong>Privacy:</strong> Your identity is protected through k-anonymity (k=5). Feedback stays hidden until at least 5 people contribute.
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 justify-end pt-4">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                copyCommand('/teammato');
                toast({ title: "Command copied!" });
              }}
              data-testid="button-copy-general"
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy Command
            </Button>
            <Button size="sm" onClick={() => setCommandDialog(null)}>Got it</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={commandDialog === 'topic'} onOpenChange={(open) => !open && setCommandDialog(null)}>
        <DialogContent className="sm:max-w-lg" data-testid="dialog-command-topic">
          <DialogHeader>
            <DialogTitle>Topic-Specific Feedback</DialogTitle>
            <DialogDescription className="pt-4 space-y-4">
              <div>
                <p className="font-medium mb-2">Command:</p>
                <code className="px-3 py-2 rounded bg-muted text-sm block">/teammato &lt;topic-slug&gt;</code>
              </div>
              <div>
                <p className="font-medium mb-2">Examples:</p>
                <div className="space-y-2">
                  <code className="px-3 py-2 rounded bg-muted text-sm block">/teammato benefits</code>
                  <code className="px-3 py-2 rounded bg-muted text-sm block">/teammato remote-work</code>
                  <code className="px-3 py-2 rounded bg-muted text-sm block">/teammato company-culture</code>
                </div>
              </div>
              <div>
                <p className="font-medium mb-2">How it works:</p>
                <ul className="list-disc pl-5 space-y-1 text-sm">
                  <li>Topic slugs are case-insensitive (BENEFITS = benefits)</li>
                  <li>Opens modal pre-selected to that specific topic</li>
                  <li>Streamlines feedback for focused discussions</li>
                  <li>Find topic slugs in the Topics page</li>
                </ul>
              </div>
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 justify-end pt-4">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                copyCommand('/teammato <topic-slug>');
                toast({ title: "Command copied!" });
              }}
              data-testid="button-copy-topic"
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy Command
            </Button>
            <Button size="sm" onClick={() => setCommandDialog(null)}>Got it</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={commandDialog === 'suggest'} onOpenChange={(open) => !open && setCommandDialog(null)}>
        <DialogContent className="sm:max-w-lg" data-testid="dialog-command-suggest">
          <DialogHeader>
            <DialogTitle>Suggest a Topic</DialogTitle>
            <DialogDescription className="pt-4 space-y-4">
              <div>
                <p className="font-medium mb-2">Command:</p>
                <code className="px-3 py-2 rounded bg-muted text-sm block">/teammato suggest</code>
              </div>
              <div>
                <p className="font-medium mb-2">How it works:</p>
                <ol className="list-decimal pl-5 space-y-2 text-sm">
                  <li>Type <code className="px-1 py-0.5 rounded bg-muted">/teammato suggest</code> in Slack</li>
                  <li>A modal opens for topic suggestion</li>
                  <li>Enter topic name, slug, and description</li>
                  <li>Admins/Owners review suggestions in the Topics page</li>
                  <li>If approved, the topic becomes available for feedback</li>
                </ol>
              </div>
              <div className="bg-muted/50 p-3 rounded-md">
                <p className="text-xs text-muted-foreground">
                  <strong>Tip:</strong> Suggestions are anonymous and tracked. Once approved, the topic shows who suggested and approved it.
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 justify-end pt-4">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                copyCommand('/teammato suggest');
                toast({ title: "Command copied!" });
              }}
              data-testid="button-copy-suggest"
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy Command
            </Button>
            <Button size="sm" onClick={() => setCommandDialog(null)}>Got it</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={commandDialog === 'help'} onOpenChange={(open) => !open && setCommandDialog(null)}>
        <DialogContent className="sm:max-w-lg" data-testid="dialog-command-help">
          <DialogHeader>
            <DialogTitle>Get Help</DialogTitle>
            <DialogDescription className="pt-4 space-y-4">
              <div>
                <p className="font-medium mb-2">Command:</p>
                <code className="px-3 py-2 rounded bg-muted text-sm block">/teammato help</code>
              </div>
              <div>
                <p className="font-medium mb-2">What you'll see:</p>
                <ul className="list-disc pl-5 space-y-1 text-sm">
                  <li>Complete list of all available commands</li>
                  <li>Privacy and anonymity tips</li>
                  <li>K-anonymity explanation (k=5 threshold)</li>
                  <li>How to use topic slugs (case-insensitive)</li>
                  <li>Suggestion workflow details</li>
                </ul>
              </div>
              <div className="bg-muted/50 p-3 rounded-md">
                <p className="text-xs text-muted-foreground">
                  <strong>Privacy reminder:</strong> Your feedback is anonymous. It's encrypted, uses rotating hashes, and remains hidden until 5+ unique contributors participate.
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 justify-end pt-4">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                copyCommand('/teammato help');
                toast({ title: "Command copied!" });
              }}
              data-testid="button-copy-help"
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy Command
            </Button>
            <Button size="sm" onClick={() => setCommandDialog(null)}>Got it</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
