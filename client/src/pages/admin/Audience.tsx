import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Users, RefreshCw, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

type AudienceMode = "workspace" | "user_group" | "channels";

interface AudienceSettings {
  mode: AudienceMode;
  usergroupId: string | null;
  channelIds: string[];
  excludeGuests: boolean;
  preview: {
    eligibleCount: number;
    lastSynced: string;
  };
}

export default function Audience() {
  const { toast } = useToast();
  const [selectedMode, setSelectedMode] = useState<AudienceMode>("workspace");
  const [excludeGuests, setExcludeGuests] = useState(true);

  const { data: settings, isLoading } = useQuery<AudienceSettings>({
    queryKey: ['/api/audience'],
  });

  useEffect(() => {
    if (settings) {
      setSelectedMode(settings.mode);
      setExcludeGuests(settings.excludeGuests);
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async (data: Partial<AudienceSettings>) => {
      return apiRequest('PUT', '/api/audience', {
        mode: data.mode || selectedMode,
        usergroupId: data.usergroupId || null,
        channelIds: data.channelIds || [],
        excludeGuests,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/audience'] });
      queryClient.invalidateQueries({ queryKey: ['/api/billing/usage'] });
      toast({
        title: "Audience settings saved",
        description: "Eligible count has been recalculated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to save settings",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  const recountMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', '/api/audience/recount', {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/audience'] });
      queryClient.invalidateQueries({ queryKey: ['/api/billing/usage'] });
      toast({
        title: "Recount complete",
        description: "Eligible count has been updated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Recount failed",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    saveMutation.mutate({
      mode: selectedMode,
      usergroupId: null,
      channelIds: [],
    });
  };

  const getTimeSince = (dateString: string) => {
    const date = new Date(dateString);
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-semibold mb-2" data-testid="text-audience-title">
          Audience
        </h1>
        <p className="text-muted-foreground">
          Choose who counts toward your seat cap
        </p>
      </div>

      {/* Preview Card */}
      {!isLoading && settings && (
        <Card data-testid="card-audience-preview">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-600" />
              Current Eligible Members
            </CardTitle>
            <CardDescription>
              Last synced {getTimeSince(settings.preview.lastSynced)}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold" data-testid="text-eligible-count">
                  {settings.preview.eligibleCount.toLocaleString()}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  members based on your current settings
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => recountMutation.mutate()}
                disabled={recountMutation.isPending}
                data-testid="button-recount"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${recountMutation.isPending ? 'animate-spin' : ''}`} />
                Recalculate
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mode Selector Card */}
      <Card data-testid="card-audience-mode">
        <CardHeader>
          <CardTitle>Audience Mode</CardTitle>
          <CardDescription>
            Select which members should count toward your seat cap
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Mode Options */}
          <div className="space-y-3">
            <button
              onClick={() => setSelectedMode('workspace')}
              className={`w-full p-4 rounded-lg border-2 text-left transition hover-elevate active-elevate-2 ${
                selectedMode === 'workspace'
                  ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950'
                  : 'border-border'
              }`}
              data-testid="button-mode-workspace"
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  {selectedMode === 'workspace' ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-muted-foreground" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-semibold mb-1">Workspace</div>
                  <p className="text-sm text-muted-foreground">
                    Count all active human members in the Slack workspace
                  </p>
                  <Badge variant="secondary" className="mt-2">Default</Badge>
                </div>
              </div>
            </button>

            <button
              onClick={() => setSelectedMode('user_group')}
              className={`w-full p-4 rounded-lg border-2 text-left transition hover-elevate active-elevate-2 ${
                selectedMode === 'user_group'
                  ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950'
                  : 'border-border'
              }`}
              data-testid="button-mode-usergroup"
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  {selectedMode === 'user_group' ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-muted-foreground" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-semibold mb-1">Slack User Group</div>
                  <p className="text-sm text-muted-foreground">
                    Count only members of a specific user group (e.g., @feedback-enabled)
                  </p>
                  <Badge variant="secondary" className="mt-2">Coming Soon</Badge>
                </div>
              </div>
            </button>

            <button
              onClick={() => setSelectedMode('channels')}
              className={`w-full p-4 rounded-lg border-2 text-left transition hover-elevate active-elevate-2 ${
                selectedMode === 'channels'
                  ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950'
                  : 'border-border'
              }`}
              data-testid="button-mode-channels"
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  {selectedMode === 'channels' ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-muted-foreground" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-semibold mb-1">Selected Channels</div>
                  <p className="text-sm text-muted-foreground">
                    Count unique members across specific channels
                  </p>
                  <Badge variant="secondary" className="mt-2">Coming Soon</Badge>
                </div>
              </div>
            </button>
          </div>

          {/* Exclude Guests Toggle */}
          <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
            <div className="space-y-0.5">
              <Label htmlFor="exclude-guests" className="text-base font-medium">
                Exclude Guests
              </Label>
              <p className="text-sm text-muted-foreground">
                Don't count Slack guest users (single/multi-channel guests)
              </p>
            </div>
            <Switch
              id="exclude-guests"
              checked={excludeGuests}
              onCheckedChange={setExcludeGuests}
              data-testid="switch-exclude-guests"
            />
          </div>

          {/* Help Text */}
          <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
            <AlertCircle className="w-5 h-5 text-muted-foreground mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium mb-1">Over your cap?</p>
              <p className="text-sm text-muted-foreground">
                Shrink your audience by switching to a user group or selected channels, or upgrade to a higher tier.
              </p>
            </div>
          </div>

          {/* Save Button */}
          <Button
            onClick={handleSave}
            disabled={saveMutation.isPending || (selectedMode === settings?.mode && excludeGuests === settings?.excludeGuests)}
            className="w-full"
            data-testid="button-save-audience"
          >
            {saveMutation.isPending ? 'Saving...' : 'Save Settings'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
