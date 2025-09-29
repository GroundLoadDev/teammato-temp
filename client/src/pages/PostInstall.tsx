import { Button } from "@/components/ui/button";
import { Check, Slack, Settings, BarChart } from "lucide-react";
import { Link } from "wouter";

export default function PostInstall() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-2xl w-full text-center">
        <div className="mb-8">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-semibold mb-2" data-testid="text-success-title">
            Connected to Slack ✓
          </h1>
          <p className="text-muted-foreground" data-testid="text-success-subtitle">
            Your organization has been successfully set up with Teammato
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <Link href="/admin/slack-settings">
            <Button variant="outline" className="w-full gap-2 h-auto py-4 flex-col" data-testid="button-slack-settings">
              <Settings className="w-6 h-6 mb-1" />
              <span>Slack Settings</span>
              <span className="text-xs text-muted-foreground">Configure commands</span>
            </Button>
          </Link>
          <Button variant="outline" className="w-full gap-2 h-auto py-4 flex-col" data-testid="button-sample-digest">
            <Slack className="w-6 h-6 mb-1" />
            <span>Sample Digest</span>
            <span className="text-xs text-muted-foreground">See what it looks like</span>
          </Button>
          <Link href="/admin/get-started">
            <Button variant="outline" className="w-full gap-2 h-auto py-4 flex-col" data-testid="button-get-started">
              <BarChart className="w-6 h-6 mb-1" />
              <span>Get Started</span>
              <span className="text-xs text-muted-foreground">Setup guide</span>
            </Button>
          </Link>
        </div>

        <div className="p-6 rounded-md border bg-card text-left">
          <h3 className="font-semibold mb-3">Next Steps</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Use <code className="bg-muted px-1 rounded">/teammato</code> command in Slack to submit feedback</li>
            <li>• Optionally link your email for magic link auth</li>
            <li>• Configure topics and moderation settings in admin panel</li>
            <li>• Invite team admins and moderators</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
