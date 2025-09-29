import { Button } from "@/components/ui/button";
import { buildSlackAuthorizeUrl } from "@/lib/slackInstall";
import { Shield, Lock, BarChart3, Users } from "lucide-react";
import { SiSlack } from "react-icons/si";

export default function Landing() {
  const handleAddToSlack = () => {
    window.location.href = buildSlackAuthorizeUrl();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-background" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-6xl font-bold tracking-tight mb-6" data-testid="text-hero-title">
            Anonymous Feedback for Your Team
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto" data-testid="text-hero-subtitle">
            Enable honest, anonymous conversations in your organization with privacy-first feedback powered by k-anonymity and end-to-end encryption.
          </p>
          <Button 
            size="lg" 
            className="gap-2" 
            onClick={handleAddToSlack}
            data-testid="button-add-to-slack"
          >
            <SiSlack className="w-5 h-5" />
            Add to Slack
          </Button>
        </div>
      </div>

      {/* Features Grid */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-semibold text-center mb-12" data-testid="text-features-title">
          Enterprise-Grade Privacy
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: Shield, title: "K-Anonymity", desc: "Content hidden until k≥5 participants" },
            { icon: Lock, title: "Encrypted", desc: "Per-org AEAD encryption" },
            { icon: BarChart3, title: "Analytics", desc: "Privacy-preserving insights" },
            { icon: Users, title: "Multi-Tenant", desc: "Complete org isolation with RLS" }
          ].map((feature, i) => (
            <div key={i} className="p-6 rounded-md border bg-card hover-elevate" data-testid={`card-feature-${i}`}>
              <feature.icon className="w-8 h-8 text-primary mb-4" />
              <h3 className="font-semibold mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
