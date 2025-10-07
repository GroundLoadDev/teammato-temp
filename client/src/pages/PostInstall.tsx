import { Button } from "@/components/ui/button";
import { Check, CreditCard, XCircle, Loader2 } from "lucide-react";
import { Link } from "wouter";
import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type Org = {
  id: string;
  name: string;
  billingStatus: string | null;
  seatCap: number | null;
};

export default function PostInstall() {
  const [installStatus, setInstallStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const { toast } = useToast();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const error = params.get('error');

    if (error) {
      setInstallStatus('error');
      setErrorMessage(error === 'access_denied' ? 'Installation was cancelled' : `Error: ${error}`);
    } else {
      setInstallStatus('success');
    }
  }, []);

  // Fetch org data after successful install
  const { data: org, isLoading: orgLoading } = useQuery<Org>({
    queryKey: ['/api/org'],
    enabled: installStatus === 'success',
  });

  const startTrialMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          priceLookupKey: 'cap_250_m', // Default to smallest plan
          chargeToday: false 
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create checkout');
      }
      return response.json();
    },
    onSuccess: (data: any) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to start checkout",
        variant: "destructive",
      });
    },
  });

  if (installStatus === 'loading') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Setting up your workspace...</p>
        </div>
      </div>
    );
  }

  if (installStatus === 'error') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-destructive" />
          </div>
          <h1 className="text-3xl font-semibold mb-2" data-testid="text-error-title">
            Installation Failed
          </h1>
          <p className="text-muted-foreground mb-6" data-testid="text-error-message">
            {errorMessage}
          </p>
          <Button asChild data-testid="button-retry">
            <Link href="/">Try Again</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (orgLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading organization...</p>
        </div>
      </div>
    );
  }

  const hasActiveSubscription = org?.billingStatus === 'trialing' || org?.billingStatus === 'active';
  const isGrace = org?.billingStatus === 'grace_period';
  const isPastDue = org?.billingStatus === 'past_due';
  const isCanceled = org?.billingStatus === 'canceled';
  
  const needsSubscription = !org?.billingStatus || org.billingStatus === 'incomplete';

  if (needsSubscription) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="max-w-2xl w-full">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <CreditCard className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl font-semibold mb-2" data-testid="text-setup-title">
              Start your 14-day free trial
            </h1>
            <p className="text-muted-foreground max-w-md mx-auto" data-testid="text-setup-subtitle">
              Free today. Renews $99/mo on {new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString()} unless canceled.
            </p>
          </div>

          <div className="rounded-md border bg-card p-8 mb-6">
            <div className="space-y-4 mb-6">
              <div className="flex gap-3">
                <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">14-day free trial</p>
                  <p className="text-sm text-muted-foreground">Full access to all features - cancel anytime</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Card required</p>
                  <p className="text-sm text-muted-foreground">You won't be charged until the trial ends</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">K-anonymity protection</p>
                  <p className="text-sm text-muted-foreground">Enterprise-grade privacy with XChaCha20 encryption</p>
                </div>
              </div>
            </div>

            <Button 
              className="w-full gap-2" 
              size="lg"
              onClick={() => startTrialMutation.mutate()}
              disabled={startTrialMutation.isPending}
              data-testid="button-start-trial"
            >
              {startTrialMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Starting checkout...
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4" />
                  Start trial
                </>
              )}
            </Button>
            <p className="mt-3 text-xs text-muted-foreground">
              Secure checkout via Stripe
            </p>
          </div>

          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-3">
              We'll add your card now; you won't be charged until {new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString()}.
            </p>
            <p className="text-sm text-muted-foreground">
              By continuing, you agree to our{' '}
              <Link href="/terms" className="underline hover:text-foreground">
                Terms of Service
              </Link>
              {' '}and{' '}
              <Link href="/privacy" className="underline hover:text-foreground">
                Privacy Policy
              </Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Special handling for problematic subscription states
  if (isPastDue) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="max-w-2xl w-full text-center">
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <CreditCard className="w-8 h-8 text-destructive" />
          </div>
          <h1 className="text-3xl font-semibold mb-2" data-testid="text-past-due-title">
            Payment Required
          </h1>
          <p className="text-muted-foreground mb-6" data-testid="text-past-due-subtitle">
            Your subscription payment failed. Please update your payment method to restore access.
          </p>
          <div className="flex gap-3 justify-center">
            <Button asChild variant="default" size="lg" data-testid="button-update-payment">
              <Link href="/admin/billing">Update Payment Method</Link>
            </Button>
            <Button asChild variant="outline" size="lg" data-testid="button-go-to-dashboard">
              <Link href="/admin">Go to Dashboard</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (isGrace || isCanceled) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="max-w-2xl w-full text-center">
          <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
          </div>
          <h1 className="text-3xl font-semibold mb-2" data-testid="text-subscription-status-title">
            {isGrace ? 'Subscription in Grace Period' : 'Subscription Canceled'}
          </h1>
          <p className="text-muted-foreground mb-6" data-testid="text-subscription-status-subtitle">
            {isGrace 
              ? 'You have exceeded your seat cap. Please upgrade or adjust your audience to restore full access.'
              : 'Your subscription has been canceled. Reactivate to continue using Teammato.'}
          </p>
          <div className="flex gap-3 justify-center">
            <Button asChild variant="default" size="lg" data-testid="button-manage-billing">
              <Link href="/admin/billing">Manage Billing</Link>
            </Button>
            <Button asChild variant="outline" size="lg" data-testid="button-go-to-dashboard">
              <Link href="/admin">Go to Dashboard</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-2xl w-full text-center">
        <div className="mb-8">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-semibold mb-2" data-testid="text-success-title">
            You're All Set! 🎉
          </h1>
          <p className="text-muted-foreground" data-testid="text-success-subtitle">
            {org?.name} is ready to collect anonymous feedback
          </p>
        </div>

        <div className="p-6 rounded-md border bg-card text-left mb-6">
          <h3 className="font-semibold mb-3">Quick Start Guide</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Use <code className="bg-muted px-1 rounded">/teammato</code> in Slack to submit anonymous feedback</li>
            <li>• Visit the <Link href="/admin" className="underline hover:text-foreground">admin dashboard</Link> to create topics</li>
            <li>• Configure k-anonymity thresholds and moderation workflows</li>
            <li>• Invite team admins and moderators</li>
          </ul>
        </div>

        <Button asChild size="lg" data-testid="button-go-to-dashboard">
          <Link href="/admin">
            Go to Dashboard
          </Link>
        </Button>
      </div>
    </div>
  );
}
