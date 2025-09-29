import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slack } from "lucide-react";

export default function SlackSettings() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-semibold mb-2" data-testid="text-slack-settings-title">Slack Settings</h1>
      <p className="text-muted-foreground mb-8" data-testid="text-slack-settings-subtitle">
        Configure your Slack integration and slash commands
      </p>

      <div className="max-w-2xl space-y-6">
        <div className="p-6 rounded-md border bg-card">
          <div className="flex items-center gap-3 mb-4">
            <Slack className="w-6 h-6" />
            <div>
              <h3 className="font-semibold">Workspace Connected</h3>
              <p className="text-sm text-muted-foreground">acme-corp.slack.com</p>
            </div>
          </div>
          <Button variant="outline" size="sm" data-testid="button-reconnect">Reconnect</Button>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Enable Slash Commands</Label>
              <p className="text-sm text-muted-foreground">Allow /teammato command</p>
            </div>
            <Switch defaultChecked data-testid="switch-slash-commands" />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Enable Event Subscriptions</Label>
              <p className="text-sm text-muted-foreground">React to messages</p>
            </div>
            <Switch defaultChecked data-testid="switch-events" />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Daily Digest</Label>
              <p className="text-sm text-muted-foreground">Send summary to #general</p>
            </div>
            <Switch data-testid="switch-digest" />
          </div>
        </div>

        <div>
          <Label htmlFor="digest-channel">Digest Channel</Label>
          <Input 
            id="digest-channel" 
            placeholder="#general" 
            className="mt-2"
            data-testid="input-digest-channel"
          />
        </div>

        <Button data-testid="button-save-settings">Save Settings</Button>
      </div>
    </div>
  );
}
