import { Button } from "@/components/ui/button";
import { SiSlack } from "react-icons/si";

export default function Auth() {
  const handleSlackLogin = () => {
    window.location.href = '/api/slack/install';
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <h1 className="text-3xl font-semibold mb-2 text-center" data-testid="text-auth-title">
          Sign In to Teammato
        </h1>
        <p className="text-muted-foreground mb-8 text-center" data-testid="text-auth-subtitle">
          Connect your Slack workspace to get started
        </p>

        <Button 
          onClick={handleSlackLogin} 
          className="w-full gap-2" 
          size="lg"
          data-testid="button-slack-login"
        >
          <SiSlack className="w-5 h-5" />
          Sign In with Slack
        </Button>

        <p className="text-sm text-muted-foreground text-center mt-8">
          Your workspace admin can install Teammato to enable anonymous feedback with k-anonymity privacy protection.
        </p>
      </div>
    </div>
  );
}
