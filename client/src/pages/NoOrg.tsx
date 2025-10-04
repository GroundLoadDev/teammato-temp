import { Button } from "@/components/ui/button";
import { buildSlackAuthorizeUrl } from "@/lib/slackInstall";
import { Plus } from "lucide-react";

function WhiteSlackLogo({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 127 127" className={className} aria-hidden fill="white">
      <path d="M27.2 80c0 7.3-5.9 13.2-13.2 13.2C6.7 93.2.8 87.3.8 80c0-7.3 5.9-13.2 13.2-13.2h13.2V80zm6.6 0c0-7.3 5.9-13.2 13.2-13.2 7.3 0 13.2 5.9 13.2 13.2v33c0 7.3-5.9 13.2-13.2 13.2-7.3 0-13.2-5.9-13.2-13.2V80z"/>
      <path d="M47 27c-7.3 0-13.2-5.9-13.2-13.2C33.8 6.5 39.7.6 47 .6c7.3 0 13.2 5.9 13.2 13.2V27H47zm0 6.7c7.3 0 13.2 5.9 13.2 13.2 0 7.3-5.9 13.2-13.2 13.2H13.9C6.6 60.1.7 54.2.7 46.9c0-7.3 5.9-13.2 13.2-13.2H47z"/>
      <path d="M99.9 46.9c0-7.3 5.9-13.2 13.2-13.2 7.3 0 13.2 5.9 13.2 13.2 0 7.3-5.9 13.2-13.2 13.2H99.9V46.9zm-6.6 0c0 7.3-5.9 13.2-13.2 13.2-7.3 0-13.2-5.9-13.2-13.2V13.8C66.9 6.5 72.8.6 80.1.6c7.3 0 13.2 5.9 13.2 13.2v33.1z"/>
      <path d="M80.1 99.8c7.3 0 13.2 5.9 13.2 13.2 0 7.3-5.9 13.2-13.2 13.2-7.3 0-13.2-5.9-13.2-13.2V99.8h13.2zm0-6.6c-7.3 0-13.2-5.9-13.2-13.2 0-7.3 5.9-13.2 13.2-13.2h33.1c7.3 0 13.2 5.9 13.2 13.2 0 7.3-5.9 13.2-13.2 13.2H80.1z"/>
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
