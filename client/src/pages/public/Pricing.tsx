import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

export default function Pricing() {
  const plans = [
    {
      name: "Trial",
      price: "Free",
      period: "14 days",
      features: ["Up to 50 members", "Basic analytics", "K-anonymity protection", "Slack integration"],
    },
    {
      name: "Pro",
      price: "$99",
      period: "per month",
      features: ["Unlimited members", "Advanced analytics", "OIDC SSO", "Priority support", "CSV exports", "Custom retention"],
      highlighted: true,
    },
    {
      name: "Enterprise",
      price: "Custom",
      period: "contact us",
      features: ["SAML SSO", "SCIM provisioning", "Legal hold", "Dedicated support", "SLA guarantee", "Custom integrations"],
    },
  ];

  return (
    <div className="min-h-screen bg-background py-16 px-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-semibold text-center mb-4" data-testid="text-pricing-title">Pricing</h1>
        <p className="text-center text-muted-foreground mb-12" data-testid="text-pricing-subtitle">
          Choose the plan that works for your team
        </p>
        
        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan, i) => (
            <div 
              key={i} 
              className={`p-8 rounded-md border bg-card ${plan.highlighted ? 'border-primary shadow-lg scale-105' : ''}`}
              data-testid={`card-plan-${i}`}
            >
              <h3 className="text-2xl font-semibold mb-2">{plan.name}</h3>
              <div className="mb-6">
                <span className="text-3xl font-bold">{plan.price}</span>
                <span className="text-muted-foreground ml-2">/ {plan.period}</span>
              </div>
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, j) => (
                  <li key={j} className="flex items-center gap-2" data-testid={`text-feature-${i}-${j}`}>
                    <Check className="w-5 h-5 text-primary" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              <Button className="w-full" variant={plan.highlighted ? "default" : "outline"} data-testid={`button-select-${i}`}>
                {plan.name === "Enterprise" ? "Contact Sales" : "Get Started"}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
