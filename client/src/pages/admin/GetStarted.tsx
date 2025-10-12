import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  CheckCircle2, Circle, MessageSquare, FileText, Tag, CheckCheck, 
  Slack, ArrowRight, Info, Download, History, AlertTriangle, Clock,
  Send, ChevronRight, Copy, TrendingUp, Users, Sparkles, X, HelpCircle, Lightbulb
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

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

interface User {
  id: string;
  email: string;
  role: string;
}

export default function GetStarted() {
  const { toast } = useToast();
  const [copiedCommand, setCopiedCommand] = useState<string | null>(null);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showMilestone, setShowMilestone] = useState<string | null>(null);
  const [showSlackDialog, setShowSlackDialog] = useState<string | null>(null);

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

  const { data: users, isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ['/api/users'],
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

  // Calculate onboarding completion
  const onboardingSteps = {
    slackConnected: slackStatus?.connected || false,
    digestChannel: !!slackSettings?.digestChannel,
    topicsCreated: (stats?.totalTopics || 0) > 0,
    testSubmitted: (stats?.totalFeedbackItems || 0) > 0,
    digestEnabled: slackSettings?.digestEnabled || false,
    moderatorInvited: (users?.length || 0) > 1,
    analyticsVisited: !!localStorage.getItem('teammato_analytics_visited'),
  };

  const completedSteps = Object.values(onboardingSteps).filter(Boolean).length;
  const totalSteps = Object.keys(onboardingSteps).length;
  const onboardingComplete = completedSteps === totalSteps;

  // Check if user has manually dismissed onboarding
  const hasManuallyDismissed = localStorage.getItem('teammato_onboarding_dismissed') === 'true';
  const shouldShowOnboarding = !onboardingComplete && !hasManuallyDismissed;

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
      {shouldShowOnboarding && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Getting Started</h2>
            <Badge variant="secondary" data-testid="badge-onboarding-progress">
              {completedSteps}/{totalSteps} completed
            </Badge>
          </div>
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
            <Card className={onboardingSteps.moderatorInvited ? 'border-emerald-200 dark:border-emerald-900' : ''}>
              <CardContent className="p-4 flex items-center gap-4">
                {onboardingSteps.moderatorInvited ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0" data-testid="icon-step-6-done" />
                ) : (
                  <Circle className="w-6 h-6 text-muted-foreground flex-shrink-0" />
                )}
                <div className="flex-1">
                  <h3 className="font-semibold">Invite a moderator</h3>
                  <p className="text-sm text-muted-foreground">
                    {onboardingSteps.moderatorInvited ? 'Team members invited' : 'Add team members to help review feedback'}
                  </p>
                </div>
                <Link href="/admin/users">
                  <Button size="sm" variant={onboardingSteps.moderatorInvited ? 'ghost' : 'default'}>Invite</Button>
                </Link>
              </CardContent>
            </Card>

            {/* Step 7: Review analytics */}
            <Card className={onboardingSteps.analyticsVisited ? 'border-emerald-200 dark:border-emerald-900' : ''}>
              <CardContent className="p-4 flex items-center gap-4">
                {onboardingSteps.analyticsVisited ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0" data-testid="icon-step-7-done" />
                ) : (
                  <Circle className="w-6 h-6 text-muted-foreground flex-shrink-0" />
                )}
                <div className="flex-1">
                  <h3 className="font-semibold">Review analytics</h3>
                  <p className="text-sm text-muted-foreground">
                    {onboardingSteps.analyticsVisited ? 'Analytics reviewed' : 'Explore privacy-preserving insights'}
                  </p>
                </div>
                <Link href="/admin/analytics">
                  <Button size="sm" variant={onboardingSteps.analyticsVisited ? 'ghost' : 'default'}>View analytics</Button>
                </Link>
              </CardContent>
            </Card>
        </div>
        </div>
      )}

      {/* Slack Commands Guide */}
      <Card data-testid="card-slack-tips">
        <CardHeader>
          <CardTitle className="text-lg">How to use Teammato in Slack</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 md:grid-cols-2">
            {/* General Feedback */}
            <button
              onClick={() => setShowSlackDialog('general')}
              className="p-3 rounded-lg bg-muted hover-elevate text-left transition-all"
              data-testid="button-slack-general"
            >
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="w-4 h-4 text-primary" />
                <p className="text-sm font-medium">General Feedback</p>
              </div>
              <code className="block px-2 py-1.5 rounded bg-background text-xs font-mono mb-2">/teammato Your feedback</code>
              <p className="text-xs text-muted-foreground">Click to learn more →</p>
            </button>

            {/* Topic-specific */}
            <button
              onClick={() => setShowSlackDialog('topic')}
              className="p-3 rounded-lg bg-muted hover-elevate text-left transition-all"
              data-testid="button-slack-topic"
            >
              <div className="flex items-center gap-2 mb-2">
                <Tag className="w-4 h-4 text-primary" />
                <p className="text-sm font-medium">Topic Feedback</p>
              </div>
              <code className="block px-2 py-1.5 rounded bg-background text-xs font-mono mb-2">/teammato [slug] message</code>
              <p className="text-xs text-muted-foreground">Click to learn more →</p>
            </button>

            {/* Suggest */}
            <button
              onClick={() => setShowSlackDialog('suggest')}
              className="p-3 rounded-lg bg-muted hover-elevate text-left transition-all"
              data-testid="button-slack-suggest"
            >
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb className="w-4 h-4 text-primary" />
                <p className="text-sm font-medium">Suggest Topic</p>
              </div>
              <code className="block px-2 py-1.5 rounded bg-background text-xs font-mono mb-2">/teammato suggest "Topic"</code>
              <p className="text-xs text-muted-foreground">Click to learn more →</p>
            </button>

            {/* Help */}
            <button
              onClick={() => setShowSlackDialog('help')}
              className="p-3 rounded-lg bg-muted hover-elevate text-left transition-all"
              data-testid="button-slack-help"
            >
              <div className="flex items-center gap-2 mb-2">
                <HelpCircle className="w-4 h-4 text-primary" />
                <p className="text-sm font-medium">Get Help</p>
              </div>
              <code className="block px-2 py-1.5 rounded bg-background text-xs font-mono mb-2">/teammato help</code>
              <p className="text-xs text-muted-foreground">Click to learn more →</p>
            </button>
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
                <li>Share the <code className="px-1.5 py-0.5 rounded bg-muted text-xs">/teammato</code> command with your team in Slack</li>
                <li>Invite at least 5 team members to ensure k-anonymity protection</li>
                <li>Create your first topic to organize feedback campaigns</li>
                <li>Configure the daily digest to stay updated on new feedback</li>
              </ul>
              
              <div className="pt-3 mt-3 border-t space-y-1.5 text-xs" data-testid="section-trust-bullets-welcome">
                <p className="font-medium text-foreground mb-2">Privacy Guarantees:</p>
                <div className="flex items-start gap-2 text-muted-foreground">
                  <span className="text-emerald-600 shrink-0">✓</span>
                  <span><strong>K-anonymity enforced:</strong> Feedback needs 5+ participants before visibility</span>
                </div>
                <div className="flex items-start gap-2 text-muted-foreground">
                  <span className="text-emerald-600 shrink-0">✓</span>
                  <span><strong>End-to-end encrypted:</strong> Per-org encryption with isolated data</span>
                </div>
                <div className="flex items-start gap-2 text-muted-foreground">
                  <span className="text-emerald-600 shrink-0">✓</span>
                  <span><strong>Anti-retaliation protection:</strong> Built into platform design</span>
                </div>
              </div>
              
              <p className="text-xs text-muted-foreground pt-2">
                Follow the checklist above to complete your setup.
              </p>
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button onClick={dismissWelcome} data-testid="button-welcome-dismiss">
              Get Started
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Milestone Celebration Modals */}
      <Dialog open={showMilestone === 'first_feedback'} onOpenChange={() => setShowMilestone(null)}>
        <DialogContent className="sm:max-w-md" data-testid="dialog-first-feedback">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-600" />
              First Feedback Received! 🎉
            </DialogTitle>
            <DialogDescription className="pt-4">
              <p>Congratulations! Your team has submitted their first feedback. Your anonymous feedback loop is now active.</p>
              <p className="mt-3 text-sm text-muted-foreground">
                Remember: Feedback threads need at least 5 participants before they're visible to protect anonymity.
              </p>
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end">
            <Button onClick={() => setShowMilestone(null)} data-testid="button-milestone-dismiss">
              Continue
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showMilestone === 'k_reached'} onOpenChange={() => setShowMilestone(null)}>
        <DialogContent className="sm:max-w-md" data-testid="dialog-k-reached">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCheck className="w-5 h-5 text-emerald-600" />
              K-Anonymity Threshold Reached! 🔒
            </DialogTitle>
            <DialogDescription className="pt-4">
              <p>Excellent! Your first feedback thread has reached the k-anonymity threshold with 5+ participants.</p>
              <p className="mt-3 text-sm text-muted-foreground">
                This feedback is now visible and ready for review while protecting contributor anonymity.
              </p>
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end">
            <Link href="/admin/feedback">
              <Button onClick={() => setShowMilestone(null)} data-testid="button-view-feedback">
                View Feedback
              </Button>
            </Link>
          </div>
        </DialogContent>
      </Dialog>

      {/* Slack Command Dialogs */}
      <Dialog open={showSlackDialog === 'general'} onOpenChange={() => setShowSlackDialog(null)}>
        <DialogContent className="sm:max-w-lg" data-testid="dialog-slack-general">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              General Feedback
            </DialogTitle>
            <DialogDescription className="pt-4 space-y-3">
              <p>Submit anonymous feedback on any topic without specifying a category.</p>
              
              <div className="rounded-lg bg-muted p-3">
                <p className="text-sm font-medium mb-2">Command:</p>
                <code className="block px-3 py-2 rounded bg-background text-sm font-mono">/teammato Your feedback message here</code>
              </div>

              <div>
                <p className="text-sm font-medium mb-2">Examples:</p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• <code className="px-1 py-0.5 rounded bg-muted text-xs">/teammato The parking situation needs attention</code></li>
                  <li>• <code className="px-1 py-0.5 rounded bg-muted text-xs">/teammato Love the new office hours policy</code></li>
                </ul>
              </div>

              <div className="pt-3 border-t">
                <p className="text-sm font-medium mb-2">Privacy Tips:</p>
                <ul className="space-y-1 text-xs text-muted-foreground">
                  <li>• Avoid names, dates, or specific identifiers</li>
                  <li>• Use general language to maintain anonymity</li>
                  <li>• Feedback is encrypted and requires 5+ participants to be visible</li>
                </ul>
              </div>
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => copyCommand('/teammato ')}>Copy Command</Button>
            <Button onClick={() => setShowSlackDialog(null)}>Got it</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showSlackDialog === 'topic'} onOpenChange={() => setShowSlackDialog(null)}>
        <DialogContent className="sm:max-w-lg" data-testid="dialog-slack-topic">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Tag className="w-5 h-5 text-primary" />
              Topic-Specific Feedback
            </DialogTitle>
            <DialogDescription className="pt-4 space-y-3">
              <p>Submit feedback to a specific topic using its slug (short identifier).</p>
              
              <div className="rounded-lg bg-muted p-3">
                <p className="text-sm font-medium mb-2">Command:</p>
                <code className="block px-3 py-2 rounded bg-background text-sm font-mono">/teammato [topic-slug] Your feedback</code>
              </div>

              <div>
                <p className="text-sm font-medium mb-2">Examples:</p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• <code className="px-1 py-0.5 rounded bg-muted text-xs">/teammato benefits The dental plan needs improvement</code></li>
                  <li>• <code className="px-1 py-0.5 rounded bg-muted text-xs">/teammato remote-work More flexible hours would help</code></li>
                </ul>
              </div>

              <div className="pt-3 border-t">
                <p className="text-sm font-medium mb-2">Finding Topic Slugs:</p>
                <ul className="space-y-1 text-xs text-muted-foreground">
                  <li>• Topic slugs are shown in the Topics page</li>
                  <li>• Slugs are case-insensitive (BENEFITS = benefits)</li>
                  <li>• If slug doesn't match a topic, feedback goes to General</li>
                </ul>
              </div>
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Link href="/admin/topics">
              <Button variant="outline" onClick={() => setShowSlackDialog(null)}>View Topics</Button>
            </Link>
            <Button onClick={() => setShowSlackDialog(null)}>Got it</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showSlackDialog === 'suggest'} onOpenChange={() => setShowSlackDialog(null)}>
        <DialogContent className="sm:max-w-lg" data-testid="dialog-slack-suggest">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-primary" />
              Suggest a Topic
            </DialogTitle>
            <DialogDescription className="pt-4 space-y-3">
              <p>Suggest a new feedback topic for admins to consider creating.</p>
              
              <div className="rounded-lg bg-muted p-3">
                <p className="text-sm font-medium mb-2">Command:</p>
                <code className="block px-3 py-2 rounded bg-background text-sm font-mono">/teammato suggest "Topic Name"</code>
              </div>

              <div>
                <p className="text-sm font-medium mb-2">Examples:</p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• <code className="px-1 py-0.5 rounded bg-muted text-xs">/teammato suggest "Remote Work Policy"</code></li>
                  <li>• <code className="px-1 py-0.5 rounded bg-muted text-xs">/teammato suggest "Employee Wellness Programs"</code></li>
                </ul>
              </div>

              <div className="pt-3 border-t">
                <p className="text-sm font-medium mb-2">What Happens Next:</p>
                <ul className="space-y-1 text-xs text-muted-foreground">
                  <li>• Admins review all suggestions in the admin dashboard</li>
                  <li>• If approved, the topic becomes available for feedback</li>
                  <li>• Your identity as the suggester is visible to admins only</li>
                </ul>
              </div>
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => copyCommand('/teammato suggest "')}>Copy Command</Button>
            <Button onClick={() => setShowSlackDialog(null)}>Got it</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showSlackDialog === 'help'} onOpenChange={() => setShowSlackDialog(null)}>
        <DialogContent className="sm:max-w-lg" data-testid="dialog-slack-help">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-primary" />
              Get Help
            </DialogTitle>
            <DialogDescription className="pt-4 space-y-3">
              <p>View all available Teammato commands directly in Slack.</p>
              
              <div className="rounded-lg bg-muted p-3">
                <p className="text-sm font-medium mb-2">Command:</p>
                <code className="block px-3 py-2 rounded bg-background text-sm font-mono">/teammato help</code>
              </div>

              <div>
                <p className="text-sm font-medium mb-2">What You'll See:</p>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• All available Teammato commands</li>
                  <li>• Quick examples and usage tips</li>
                  <li>• Privacy best practices</li>
                  <li>• Links to documentation</li>
                </ul>
              </div>

              <div className="pt-3 border-t">
                <p className="text-sm font-medium mb-2">All Available Commands:</p>
                <ul className="space-y-1 text-xs font-mono text-muted-foreground">
                  <li>• <code className="px-1 py-0.5 rounded bg-muted">/teammato [message]</code> - Submit general feedback</li>
                  <li>• <code className="px-1 py-0.5 rounded bg-muted">/teammato [slug] [message]</code> - Submit to topic</li>
                  <li>• <code className="px-1 py-0.5 rounded bg-muted">/teammato suggest "name"</code> - Suggest topic</li>
                  <li>• <code className="px-1 py-0.5 rounded bg-muted">/teammato help</code> - Show help</li>
                </ul>
              </div>
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => copyCommand('/teammato help')}>Copy Command</Button>
            <Button onClick={() => setShowSlackDialog(null)}>Got it</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
