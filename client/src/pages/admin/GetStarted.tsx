import { CheckCircle2, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GetStarted() {
  const steps = [
    { title: "Slack Integration Connected", desc: "Your workspace is linked", done: true },
    { title: "Configure Topics", desc: "Set up feedback categories", done: false },
    { title: "Invite Team Admins", desc: "Add moderators and admins", done: false },
    { title: "Test Feedback Flow", desc: "Submit test feedback via Slack", done: false },
    { title: "Review Analytics", desc: "Check your dashboard", done: false },
  ];

  return (
    <div className="p-8">
      <h1 className="text-3xl font-semibold mb-2" data-testid="text-get-started-title">Get Started</h1>
      <p className="text-muted-foreground mb-8" data-testid="text-get-started-subtitle">
        Complete these steps to set up Teammato for your organization
      </p>

      <div className="max-w-2xl space-y-4">
        {steps.map((step, i) => (
          <div 
            key={i} 
            className="flex items-start gap-4 p-4 rounded-md border bg-card"
            data-testid={`card-step-${i}`}
          >
            {step.done ? (
              <CheckCircle2 className="w-6 h-6 text-primary flex-shrink-0" />
            ) : (
              <Circle className="w-6 h-6 text-muted-foreground flex-shrink-0" />
            )}
            <div className="flex-1">
              <h3 className="font-semibold mb-1">{step.title}</h3>
              <p className="text-sm text-muted-foreground">{step.desc}</p>
            </div>
            {!step.done && (
              <Button size="sm" variant="outline" data-testid={`button-step-${i}`}>
                Start
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
