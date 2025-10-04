import { useQuery } from "@tanstack/react-query";
import { Check, Zap, Building2, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Link } from "wouter";

interface BillingUsage {
  detectedMembers: number;
  seatCap: number;
  plan: string;
  trialDaysLeft: number | null;
  usagePercent: number;
  isOverCap: boolean;
  isNearCap: boolean;
}

interface PlanFeature {
  name: string;
  included: boolean;
}

interface Plan {
  id: string;
  name: string;
  price: string;
  period: string;
  description: string;
  seatCap: number;
  features: PlanFeature[];
  highlight?: boolean;
}

const plans: Plan[] = [
  {
    id: 'trial',
    name: 'Trial',
    price: 'Free',
    period: '14 days',
    description: 'Test Teammato with your team',
    seatCap: 50,
    features: [
      { name: 'Up to 50 members', included: true },
      { name: 'Unlimited topics', included: true },
      { name: 'K-anonymity protection', included: true },
      { name: 'Daily digest', included: true },
      { name: 'Basic analytics', included: true },
      { name: 'Email support', included: false },
      { name: 'DPA signing', included: false },
    ],
  },
  {
    id: 'pro_250',
    name: 'Pro',
    price: '$99',
    period: '/month',
    description: 'For growing teams',
    seatCap: 250,
    features: [
      { name: 'Up to 250 members', included: true },
      { name: 'Unlimited topics', included: true },
      { name: 'K-anonymity protection', included: true },
      { name: 'Daily digest', included: true },
      { name: 'Advanced analytics', included: true },
      { name: 'Email support', included: true },
      { name: 'DPA signing', included: true },
    ],
    highlight: true,
  },
  {
    id: 'scale_500',
    name: 'Scale',
    price: '$149',
    period: '/month',
    description: 'For larger organizations',
    seatCap: 500,
    features: [
      { name: '500+ members (customizable)', included: true },
      { name: 'Unlimited topics', included: true },
      { name: 'K-anonymity protection', included: true },
      { name: 'Daily digest', included: true },
      { name: 'Enterprise analytics', included: true },
      { name: 'Priority support', included: true },
      { name: 'DPA signing', included: true },
      { name: 'Custom integrations', included: true },
    ],
  },
];

export default function Billing() {
  const { data: billingUsage, isLoading } = useQuery<BillingUsage>({
    queryKey: ['/api/billing/usage'],
  });

  const currentPlan = plans.find(p => p.id === billingUsage?.plan) || plans[0];

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-semibold mb-2" data-testid="text-billing-title">Billing & Plans</h1>
        <p className="text-muted-foreground">Manage your subscription and view usage</p>
      </div>

      {/* Current Plan Card */}
      {!isLoading && billingUsage && (
        <Card data-testid="card-current-plan">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {currentPlan.id === 'trial' && <Zap className="w-5 h-5 text-yellow-500" />}
              {currentPlan.id === 'pro_250' && <TrendingUp className="w-5 h-5 text-emerald-600" />}
              {currentPlan.id.startsWith('scale_') && <Building2 className="w-5 h-5 text-blue-600" />}
              Current Plan: {currentPlan.name}
            </CardTitle>
            <CardDescription>
              {billingUsage.plan === 'trial' && billingUsage.trialDaysLeft !== null
                ? `${billingUsage.trialDaysLeft} days remaining in trial`
                : currentPlan.description}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Workspace Members</span>
                <span className="text-sm text-muted-foreground">
                  {billingUsage.detectedMembers} / {billingUsage.seatCap}
                </span>
              </div>
              <Progress value={billingUsage.usagePercent} className="h-2" data-testid="progress-usage" />
              {billingUsage.isOverCap && (
                <p className="text-sm text-destructive mt-2">
                  You've exceeded your seat limit. Upgrade to continue using Teammato.
                </p>
              )}
              {billingUsage.isNearCap && !billingUsage.isOverCap && (
                <p className="text-sm text-yellow-700 dark:text-yellow-500 mt-2">
                  Approaching seat limit. Consider upgrading soon.
                </p>
              )}
            </div>
            
            {billingUsage.plan === 'trial' && (
              <div className="flex gap-2">
                <Button data-testid="button-upgrade-to-pro">
                  Upgrade to Pro
                </Button>
                <Button variant="outline" data-testid="button-explore-scale">
                  Explore Scale
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Plan Comparison */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Available Plans</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <Card 
              key={plan.id}
              className={plan.highlight ? 'border-emerald-600 shadow-lg' : ''}
              data-testid={`card-plan-${plan.id}`}
            >
              <CardHeader>
                {plan.highlight && (
                  <Badge className="w-fit mb-2" data-testid="badge-popular">Most Popular</Badge>
                )}
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <Check className={`w-4 h-4 mt-0.5 flex-shrink-0 ${feature.included ? 'text-emerald-600' : 'text-muted-foreground opacity-30'}`} />
                      <span className={feature.included ? '' : 'text-muted-foreground line-through'}>
                        {feature.name}
                      </span>
                    </li>
                  ))}
                </ul>
                {billingUsage?.plan === plan.id ? (
                  <Button variant="outline" className="w-full" disabled>
                    Current Plan
                  </Button>
                ) : (
                  <Button 
                    variant={plan.highlight ? 'default' : 'outline'}
                    className="w-full"
                    data-testid={`button-select-${plan.id}`}
                  >
                    {billingUsage?.plan === 'trial' ? 'Upgrade' : 'Switch Plan'}
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Billing History Placeholder */}
      <Card data-testid="card-billing-history">
        <CardHeader>
          <CardTitle>Billing History</CardTitle>
          <CardDescription>View and download past invoices</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground text-sm">
              {billingUsage?.plan === 'trial' 
                ? 'No billing history yet. Upgrade to a paid plan to see invoices here.' 
                : 'No invoices yet. Your billing history will appear here.'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Contact for Enterprise */}
      <Card className="bg-gradient-to-r from-emerald-50 to-background dark:from-emerald-950/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h3 className="font-semibold text-lg mb-1">Need more than 5,000 seats?</h3>
              <p className="text-sm text-muted-foreground">
                Contact us for custom Enterprise pricing and dedicated support.
              </p>
            </div>
            <Link href="/contact">
              <Button variant="outline" data-testid="button-contact-sales">
                Contact Sales
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
