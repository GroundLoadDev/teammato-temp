import { Button } from "@/components/ui/button";
import { buildSlackAuthorizeUrl } from "@/lib/slackInstall";
import { Plus } from "lucide-react";

function WhiteSlackLogo({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <rect x="5" y="10" width="5" height="3" rx="1.5" fill="white" opacity="0.9" />
      <rect x="14" y="10" width="5" height="3" rx="1.5" fill="white" opacity="0.9" />
      <rect x="10" y="5" width="3" height="5" rx="1.5" fill="white" opacity="0.9" />
      <rect x="10" y="14" width="3" height="5" rx="1.5" fill="white" opacity="0.9" />
    </svg>
  );
}

export default function NoOrg() {
  const handleAddToSlack = () => {
    window.location.href = buildSlackAuthorizeUrl();
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <h1 className="text-3xl font-semibold mb-4" data-testid="text-no-org-title">
          No Organization Found
        </h1>
        <p className="text-muted-foreground mb-8" data-testid="text-no-org-subtitle">
          You're signed in but not connected to an organization. Choose an option below to get started.
        </p>

        <div className="space-y-4">
          <Button 
            size="lg" 
            className="w-full gap-2" 
            onClick={handleAddToSlack}
            data-testid="button-add-to-slack-primary"
          >
            <WhiteSlackLogo className="w-5 h-5" />
            Add to Slack
          </Button>
          
          <Button 
            size="lg" 
            variant="outline" 
            className="w-full gap-2"
            data-testid="button-create-workspace"
          >
            <Plus className="w-5 h-5" />
            Create Workspace
          </Button>
        </div>

        <p className="text-sm text-muted-foreground mt-8">
          Primary method is Slack OAuth. Create Workspace is a secondary option for non-Slack users.
        </p>
      </div>
    </div>
  );
}
