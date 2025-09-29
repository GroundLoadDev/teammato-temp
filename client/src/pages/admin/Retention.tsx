import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { AlertTriangle, Shield } from "lucide-react";

export default function Retention() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-semibold mb-2" data-testid="text-retention-title">Data Retention</h1>
      <p className="text-muted-foreground mb-8" data-testid="text-retention-subtitle">
        Configure data retention policies and legal hold
      </p>

      <div className="max-w-2xl space-y-6">
        <div className="p-6 rounded-md border bg-card">
          <h3 className="font-semibold mb-4">Retention Period</h3>
          <div className="space-y-4">
            <div>
              <Label>Delete data after</Label>
              <Select defaultValue="365">
                <SelectTrigger className="mt-2" data-testid="select-retention-period">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="90">90 days</SelectItem>
                  <SelectItem value="180">180 days</SelectItem>
                  <SelectItem value="365">365 days (1 year)</SelectItem>
                  <SelectItem value="730">730 days (2 years)</SelectItem>
                  <SelectItem value="never">Never (retain forever)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground mt-2">
                Data older than this period will be permanently deleted
              </p>
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <div>
                <Label>Auto-purge enabled</Label>
                <p className="text-sm text-muted-foreground">Automatically delete old data</p>
              </div>
              <Switch defaultChecked data-testid="switch-auto-purge" />
            </div>
          </div>
        </div>

        <div className="p-6 rounded-md border border-destructive/50 bg-card">
          <div className="flex items-start gap-3 mb-4">
            <Shield className="w-6 h-6 text-destructive flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold mb-1">Legal Hold</h3>
              <p className="text-sm text-muted-foreground">
                Freeze all data retention and deletion. Used for litigation, investigations, or compliance audits.
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between pt-4 border-t">
            <div>
              <Label>Legal hold active</Label>
              <p className="text-sm text-muted-foreground">Data will not be deleted</p>
            </div>
            <Switch data-testid="switch-legal-hold" />
          </div>
        </div>

        <div className="p-4 rounded-md bg-destructive/10 border border-destructive/50">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0" />
            <div className="text-sm">
              <p className="font-semibold mb-1">Warning</p>
              <p className="text-muted-foreground">
                Enabling legal hold will prevent all automatic data deletion until manually disabled. 
                This may result in increased storage costs.
              </p>
            </div>
          </div>
        </div>

        <Button data-testid="button-save-retention">Save Settings</Button>
      </div>
    </div>
  );
}
