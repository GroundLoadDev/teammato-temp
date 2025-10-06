import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Check, AlertTriangle, AlertCircle, CreditCard, Download, ExternalLink, Sparkles, Shield, TrendingUp, Users, ChevronDown, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

interface BillingStatus {
  orgId: number;
  status: 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid' | 'incomplete' | 'paused' | 'grace_period';
  seatCap: number;
  period: 'monthly' | 'annual';
  price: number;
  trialEnd: string | null;
  cancelsAt: string | null;
  graceEndsAt: string | null;
  eligibleCount: number;
  percent: number;
  customerEmail: string | null;
  invoices: Array<{
    id: string;
    number: string;
    date: string;
    amount: number;
    status: string;
    hostedInvoiceUrl: string | null;
    pdfUrl: string | null;
  }>;
  audience: {
    mode: 'workspace' | 'user_group' | 'channels';
    eligibleCount: number;
    lastSynced?: string;
  };
  prices: Array<{
    cap: number;
    monthly: number;
    annual: number;
    monthlyLookup: string;
    annualLookup: string;
  }>;
}

export default function Billing() {
  const { toast } = useToast();
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly');
  const [selectedPlan, setSelectedPlan] = useState<number | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);

  const { data: authData } = useQuery<{ user: { id: string; email: string; role: string } }>({
    queryKey: ['/api/auth/me'],
  });

  const { data: billing, isLoading, refetch } = useQuery<BillingStatus>({
    queryKey: ['/api/billing/status'],
  });
  
  const isOwner = authData?.user?.role === 'owner';

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('success') === '1') {
      setShowSuccessBanner(true);
      refetch();
      window.history.replaceState({}, '', '/admin/billing');
    }
  }, [refetch]);

  const checkoutMutation = useMutation({
    mutationFn: async (priceLookupKey: string) => {
      const result = await apiRequest('POST', '/api/billing/checkout', { priceLookupKey });
      return result as { url: string };
    },
    onSuccess: (data) => {
      window.location.href = data.url;
    },
    onError: (error: any) => {
      const errorMessage = error?.message || '';
      
      let title = "Checkout failed";
      let description = "Unable to start checkout. Please try again.";
      
      if (errorMessage.includes('Stripe') || errorMessage.includes('payment')) {
        title = "Payment service error";
        description = "There was an issue connecting to the payment service. Please try again in a few moments.";
      } else if (errorMessage.includes('session') || errorMessage.includes('expired')) {
        title = "Session expired";
        description = "Your session has expired. Please refresh the page and try again.";
      } else if (errorMessage.includes('plan') || errorMessage.includes('price')) {
        title = "Plan unavailable";
        description = "The selected plan is currently unavailable. Please contact support.";
      } else if (errorMessage.includes('subscription') || errorMessage.includes('already')) {
        title = "Existing subscription";
        description = "You already have an active subscription. Use the billing portal to make changes.";
      }
      
      toast({
        variant: "destructive",
        title,
        description,
      });
    },
  });

  const portalMutation = useMutation({
    mutationFn: async () => {
      const result = await apiRequest('POST', '/api/billing/portal', {});
      return result as { url: string };
    },
    onSuccess: (data) => {
      window.location.href = data.url;
    },
    onError: (error: any) => {
      const errorMessage = error?.message || '';
      
      let title = "Portal access failed";
      let description = "Unable to open billing portal. Please try again.";
      
      if (errorMessage.includes('customer') || errorMessage.includes('not found')) {
        title = "No billing account";
        description = "No billing account found. Please subscribe to a plan first.";
      } else if (errorMessage.includes('Stripe') || errorMessage.includes('service')) {
        title = "Service unavailable";
        description = "The billing portal is temporarily unavailable. Please try again shortly.";
      } else if (errorMessage.includes('session') || errorMessage.includes('expired')) {
        title = "Session expired";
        description = "Your session has expired. Please refresh the page and try again.";
      }
      
      toast({
        variant: "destructive",
        title,
        description,
      });
    },
  });

  if (isLoading || !billing) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-32 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  const currentPlanData = billing.prices.find(p => p.cap === billing.seatCap);
  const isTrialing = billing.status === 'trialing';
  const isActive = billing.status === 'active';
  const isGrace = billing.status === 'grace_period';
  const isPastDue = billing.status === 'past_due';
  const isCanceled = billing.status === 'canceled';
  const isOverCap = billing.eligibleCount > billing.seatCap;
  const isNearCap = billing.percent >= 90;

  const trialDaysLeft = billing.trialEnd ? Math.max(0, Math.ceil((new Date(billing.trialEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : 0;
  const graceDaysLeft = billing.graceEndsAt ? Math.max(0, Math.ceil((new Date(billing.graceEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : 0;

  const handleSelectPlan = (cap: number) => {
    setSelectedPlan(cap);
    setShowUpgradeModal(true);
  };

  const handleConfirmUpgrade = () => {
    if (!selectedPlan) return;
    const plan = billing.prices.find(p => p.cap === selectedPlan);
    if (!plan) return;
    
    const lookupKey = billingPeriod === 'monthly' ? plan.monthlyLookup : plan.annualLookup;
    checkoutMutation.mutate(lookupKey);
  };

  const selectedPlanData = selectedPlan ? billing.prices.find(p => p.cap === selectedPlan) : null;

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-semibold mb-2" data-testid="text-billing-title">Billing & Plans</h1>
        <p className="text-muted-foreground">Manage your subscription and view usage</p>
      </div>

      {/* Owner-Only Warning */}
      {!isOwner && (
        <Alert className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900" data-testid="alert-owner-only">
          <Lock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <AlertDescription className="text-blue-800 dark:text-blue-200">
            Billing changes can only be made by organization owners. Contact your owner to upgrade or modify your subscription.
          </AlertDescription>
        </Alert>
      )}

      {/* Success Banner */}
      {showSuccessBanner && (
        <Alert className="bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900" data-testid="alert-success">
          <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <AlertDescription className="text-emerald-800 dark:text-emerald-200">
            Your subscription has been successfully updated!
          </AlertDescription>
        </Alert>
      )}

      {/* Trial Warning Banner */}
      {isTrialing && trialDaysLeft <= 7 && (
        <Alert className="bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-900" data-testid="alert-trial-warning">
          <Sparkles className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
          <AlertDescription className="text-yellow-800 dark:text-yellow-200">
            Your trial ends in {trialDaysLeft} day{trialDaysLeft !== 1 ? 's' : ''}. Upgrade now to keep your feedback flowing.
          </AlertDescription>
        </Alert>
      )}

      {/* Over-Cap Warning */}
      {isOverCap && (
        <Alert variant="destructive" data-testid="alert-over-cap">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            You've exceeded your seat cap ({billing.eligibleCount} of {billing.seatCap} seats used). 
            {isGrace ? ` Grace period ends in ${graceDaysLeft} day${graceDaysLeft !== 1 ? 's' : ''}.` : ' Upgrade now to restore full access.'}
          </AlertDescription>
        </Alert>
      )}

      {/* Near-Cap Warning */}
      {isNearCap && !isOverCap && (
        <Alert className="bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-900" data-testid="alert-near-cap">
          <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
          <AlertDescription className="text-yellow-800 dark:text-yellow-200">
            Approaching your seat limit ({billing.eligibleCount} of {billing.seatCap} seats). Consider upgrading to avoid service interruption.
          </AlertDescription>
        </Alert>
      )}

      {/* Past Due Warning */}
      {isPastDue && (
        <Alert variant="destructive" data-testid="alert-past-due">
          <CreditCard className="h-4 w-4" />
          <AlertDescription>
            Payment required. Please update your payment method to continue service.
            <button 
              className="ml-2 text-destructive hover:text-destructive/80 underline font-medium"
              onClick={() => isOwner && portalMutation.mutate()}
              disabled={!isOwner}
              data-testid="button-update-payment"
              style={{ cursor: isOwner ? 'pointer' : 'not-allowed', opacity: isOwner ? 1 : 0.6 }}
            >
              Update Payment
            </button>
          </AlertDescription>
        </Alert>
      )}

      {/* Canceled Warning */}
      {isCanceled && billing.cancelsAt && (
        <Alert className="bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-900" data-testid="alert-canceled">
          <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
          <AlertDescription className="text-orange-800 dark:text-orange-200">
            Your subscription will end on {new Date(billing.cancelsAt).toLocaleDateString()}. Reactivate to continue service.
          </AlertDescription>
        </Alert>
      )}

      {/* Current Plan & Usage */}
      <Card data-testid="card-current-plan">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Current Plan: {billing.seatCap.toLocaleString()} Seats
              </CardTitle>
              <CardDescription>
                {isTrialing ? `Trial • ${trialDaysLeft} days remaining` : 
                 isActive ? `Active • ${billing.period === 'monthly' ? 'Monthly' : 'Annual'} billing` :
                 billing.status.replace('_', ' ')}
              </CardDescription>
            </div>
            {isActive && (
              <Button 
                variant="outline" 
                onClick={() => portalMutation.mutate()}
                disabled={!isOwner || portalMutation.isPending}
                data-testid="button-manage-billing"
              >
                {!isOwner && <Lock className="w-4 h-4 mr-2" />}
                {isOwner && <ExternalLink className="w-4 h-4 mr-2" />}
                Manage Billing
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Eligible Members</span>
              <span className="text-sm text-muted-foreground">
                {billing.eligibleCount.toLocaleString()} / {billing.seatCap.toLocaleString()}
              </span>
            </div>
            <Progress 
              value={Math.min(billing.percent, 100)} 
              className="h-2" 
              data-testid="progress-usage" 
            />
            <div className="mt-2 flex items-center justify-between">
              <Link href="/admin/audience">
                <button className="text-xs text-primary hover:underline" data-testid="link-audience-settings">
                  Based on Audience settings ({billing.audience.mode})
                </button>
              </Link>
              {billing.audience.lastSynced && (
                <span className="text-xs text-muted-foreground">
                  Updated {new Date(billing.audience.lastSynced).toLocaleTimeString()}
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Plan Selection */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold">Available Plans</h2>
          <div className="flex items-center gap-2 bg-muted rounded-lg p-1">
            <Button
              variant={billingPeriod === 'monthly' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setBillingPeriod('monthly')}
              data-testid="button-monthly"
            >
              Monthly
            </Button>
            <Button
              variant={billingPeriod === 'annual' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setBillingPeriod('annual')}
              data-testid="button-annual"
            >
              Annual
              <Badge variant="secondary" className="ml-2">Save 17%</Badge>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {billing.prices.map((plan) => {
            const price = billingPeriod === 'monthly' ? plan.monthly : plan.annual;
            const perMonth = billingPeriod === 'annual' ? Math.round(plan.annual / 12) : plan.monthly;
            const isCurrentPlan = plan.cap === billing.seatCap && billing.period === billingPeriod;
            const isPopular = plan.cap === 500;

            return (
              <Card 
                key={plan.cap}
                className={isPopular ? 'border-primary shadow-lg' : ''}
                data-testid={`card-plan-${plan.cap}`}
              >
                <CardHeader className="pb-4">
                  {isPopular && (
                    <Badge className="w-fit mb-2" data-testid="badge-popular">Popular</Badge>
                  )}
                  <CardTitle className="text-lg">{plan.cap.toLocaleString()} Seats</CardTitle>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold">${price.toLocaleString()}</span>
                    <span className="text-muted-foreground text-sm">/{billingPeriod === 'monthly' ? 'mo' : 'yr'}</span>
                  </div>
                  {billingPeriod === 'annual' && (
                    <p className="text-xs text-muted-foreground">${perMonth}/mo billed annually</p>
                  )}
                </CardHeader>
                <CardContent className="pt-0">
                  <ul className="space-y-2 mb-4 text-sm">
                    <li className="flex items-start gap-2">
                      <Users className="w-4 h-4 mt-0.5 flex-shrink-0 text-primary" />
                      <span>Up to {plan.cap.toLocaleString()} members</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <TrendingUp className="w-4 h-4 mt-0.5 flex-shrink-0 text-primary" />
                      <span>Unlimited feedback topics</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Shield className="w-4 h-4 mt-0.5 flex-shrink-0 text-primary" />
                      <span>K-anonymity protection</span>
                    </li>
                  </ul>
                  {isCurrentPlan ? (
                    <Button variant="outline" className="w-full" disabled data-testid={`button-current-${plan.cap}`}>
                      Current Plan
                    </Button>
                  ) : (
                    <Button 
                      variant={isPopular ? 'default' : 'outline'}
                      className="w-full"
                      onClick={() => handleSelectPlan(plan.cap)}
                      disabled={!isOwner}
                      data-testid={`button-select-${plan.cap}`}
                    >
                      {!isOwner && <Lock className="w-4 h-4 mr-2" />}
                      {plan.cap > billing.seatCap ? 'Upgrade' : 'Switch Plan'}
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Invoice History */}
      {billing.invoices.length > 0 && (
        <Card data-testid="card-billing-history">
          <CardHeader>
            <CardTitle>Invoice History</CardTitle>
            <CardDescription>View and download past invoices</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {billing.invoices.map((invoice) => (
                  <TableRow key={invoice.id} data-testid={`row-invoice-${invoice.id}`}>
                    <TableCell className="font-medium">{invoice.number}</TableCell>
                    <TableCell>{new Date(invoice.date).toLocaleDateString()}</TableCell>
                    <TableCell>${(invoice.amount / 100).toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge 
                        variant={invoice.status === 'paid' ? 'default' : 'secondary'}
                        data-testid={`badge-status-${invoice.id}`}
                      >
                        {invoice.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {invoice.pdfUrl && (
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                          data-testid={`button-download-${invoice.id}`}
                        >
                          <a href={invoice.pdfUrl} target="_blank" rel="noopener noreferrer">
                            <Download className="w-4 h-4" />
                          </a>
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Enterprise CTA */}
      <Card className="bg-gradient-to-r from-primary/5 to-background">
        <CardContent className="p-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h3 className="font-semibold text-lg mb-1">Need more than 25,000 seats?</h3>
              <p className="text-sm text-muted-foreground">
                Contact us for custom Enterprise pricing and dedicated support.
              </p>
            </div>
            <Button variant="outline" data-testid="button-contact-sales">
              Contact Sales
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Upgrade Confirmation Modal */}
      <Dialog open={showUpgradeModal} onOpenChange={setShowUpgradeModal}>
        <DialogContent data-testid="dialog-upgrade">
          <DialogHeader>
            <DialogTitle>Confirm Plan Change</DialogTitle>
            <DialogDescription>
              You're about to {selectedPlan && selectedPlan > billing.seatCap ? 'upgrade' : 'change'} to the {selectedPlanData?.cap.toLocaleString()} seat plan.
            </DialogDescription>
          </DialogHeader>
          {selectedPlanData && (
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">New Plan</span>
                  <span className="text-2xl font-bold">
                    ${(billingPeriod === 'monthly' ? selectedPlanData.monthly : selectedPlanData.annual).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {billingPeriod === 'monthly' ? 'Billed monthly' : `$${Math.round(selectedPlanData.annual / 12)}/mo billed annually`}
                </p>
              </div>
              <div className="text-sm text-muted-foreground">
                <p>• Up to {selectedPlanData.cap.toLocaleString()} eligible members</p>
                <p>• Unlimited feedback topics</p>
                <p>• Full k-anonymity protection</p>
              </div>
              
              <div className="pt-4 mt-4 border-t space-y-1.5 text-xs text-muted-foreground" data-testid="section-trust-bullets-upgrade">
                <p className="font-medium text-foreground mb-2">Privacy Guarantees:</p>
                <div className="flex items-start gap-2">
                  <span className="text-emerald-600 shrink-0">✓</span>
                  <span>K-anonymity: 5+ participants required before visibility</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-emerald-600 shrink-0">✓</span>
                  <span>Per-org encryption with isolated data</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-emerald-600 shrink-0">✓</span>
                  <span>Anti-retaliation protection built-in</span>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowUpgradeModal(false)}
              data-testid="button-cancel-upgrade"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmUpgrade}
              disabled={checkoutMutation.isPending}
              data-testid="button-confirm-upgrade"
            >
              {checkoutMutation.isPending ? 'Processing...' : 'Continue to Checkout'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
