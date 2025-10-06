import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Slack, AlertCircle, Bell, BellOff, CheckCircle2 } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface SlackStatus {
  connected: boolean;
  teamId?: string;
  botUserId?: string;
}

interface SlackSettings {
  id?: string;
  orgId: string;
  digestChannel: string | null;
  digestEnabled: boolean;
}

export default function SlackSettings() {
  const { toast } = useToast();
  const [digestChannel, setDigestChannel] = useState("");
  const [digestEnabled, setDigestEnabled] = useState(false);

  const { data: slackStatus, isLoading: isLoadingStatus } = useQuery<SlackStatus>({
    queryKey: ['/api/dashboard/slack-status'],
  });

  const { data: settings, isLoading: isLoadingSettings } = useQuery<SlackSettings>({
    queryKey: ['/api/slack-settings'],
  });

  useEffect(() => {
    if (settings) {
      setDigestChannel(settings.digestChannel || "");
      setDigestEnabled(settings.digestEnabled || false);
    }
  }, [settings]);

  const updateSettings = useMutation({
    mutationFn: async (data: { digestChannel: string | null; digestEnabled: boolean }) => {
      return await apiRequest('POST', '/api/slack-settings', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/slack-settings'] });
      toast({
        title: "Settings saved",
        description: "Your Slack settings have been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save Slack settings. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    updateSettings.mutate({
      digestChannel: digestChannel.trim() || null,
      digestEnabled,
    });
  };

  const isLoading = isLoadingStatus || isLoadingSettings;

  return (
    <div className="p-8">
      <h1 className="text-3xl font-semibold mb-2" data-testid="text-slack-settings-title">Slack Settings</h1>
      <p className="text-muted-foreground mb-8" data-testid="text-slack-settings-subtitle">
        Configure your Slack integration and notifications
      </p>

      <div className="max-w-2xl space-y-6">
        {isLoading ? (
          <>
            <Skeleton className="h-32" />
            <Skeleton className="h-48" />
          </>
        ) : (
          <>
            <Card className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Slack className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">Workspace Connection</h3>
                  {slackStatus?.connected ? (
                    <>
                      <p className="text-sm text-muted-foreground mb-3">
                        Connected to Slack workspace
                      </p>
                      <div className="flex items-center gap-2 text-sm">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        <span className="text-muted-foreground">Team ID: {slackStatus.teamId}</span>
                      </div>
                      {slackStatus.botUserId && (
                        <div className="text-sm text-muted-foreground mt-1">
                          Bot User ID: {slackStatus.botUserId}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex items-start gap-2 p-3 rounded-md bg-destructive/10 text-destructive">
                      <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <div className="text-sm">
                        <p className="font-medium">Not connected</p>
                        <p className="mt-1">Your Slack workspace is not connected. Please reinstall the app.</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Notification Settings</h3>
                {digestEnabled ? (
                  <Badge variant="default" className="flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Active
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <BellOff className="w-3 h-3" />
                    Inactive
                  </Badge>
                )}
              </div>
              
              <div className="space-y-6">
                <div className={`flex items-start justify-between gap-4 p-4 rounded-lg border-2 transition-colors ${
                  digestEnabled 
                    ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900' 
                    : 'bg-muted/50 border-muted'
                }`}>
                  <div className="flex items-start gap-3 flex-1">
                    {digestEnabled ? (
                      <Bell className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                    ) : (
                      <BellOff className="w-5 h-5 text-muted-foreground mt-0.5" />
                    )}
                    <div className="flex-1">
                      <Label htmlFor="digest-enabled" className={`text-base cursor-pointer ${digestEnabled ? 'text-emerald-900 dark:text-emerald-100' : ''}`}>
                        Daily Digest
                      </Label>
                      <p className={`text-sm mt-1 ${digestEnabled ? 'text-emerald-800 dark:text-emerald-200' : 'text-muted-foreground'}`}>
                        {digestEnabled 
                          ? 'Daily summaries are being sent to your configured channel'
                          : 'Send a daily summary of new feedback to a Slack channel'}
                      </p>
                    </div>
                  </div>
                  <Switch 
                    id="digest-enabled"
                    checked={digestEnabled}
                    onCheckedChange={setDigestEnabled}
                    data-testid="switch-digest"
                  />
                </div>

                {digestEnabled && (
                  <div>
                    <Label htmlFor="digest-channel">Digest Channel</Label>
                    <p className="text-sm text-muted-foreground mt-1 mb-2">
                      Enter the channel ID where digest notifications should be posted
                    </p>
                    <Input 
                      id="digest-channel" 
                      placeholder="C1234567890" 
                      value={digestChannel}
                      onChange={(e) => setDigestChannel(e.target.value)}
                      data-testid="input-digest-channel"
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      Tip: Right-click a channel in Slack → View channel details → Copy channel ID
                    </p>
                  </div>
                )}

                <div className="pt-4 border-t">
                  <Button 
                    onClick={handleSave}
                    disabled={updateSettings.isPending}
                    data-testid="button-save-settings"
                  >
                    {updateSettings.isPending ? "Saving..." : "Save Settings"}
                  </Button>
                </div>
              </div>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
