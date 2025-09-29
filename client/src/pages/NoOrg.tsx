import { Button } from "@/components/ui/button";
import { buildSlackAuthorizeUrl } from "@/lib/slackInstall";
import { SiSlack } from "react-icons/si";
import { Plus } from "lucide-react";

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
            <SiSlack className="w-5 h-5" />
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
