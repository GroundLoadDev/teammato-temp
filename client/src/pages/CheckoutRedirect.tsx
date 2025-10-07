import { useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Valid plan configurations
const VALID_PLANS = new Set([
  'pro_250',
  'scale_500',
  'scale_1000',
  'scale_2500',
  'scale_5000',
  'scale_10000',
  'scale_25000',
]);

export default function CheckoutRedirect() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const params = new URLSearchParams(window.location.search);
  const planKey = params.get('plan');

  // Convert plan key (pro_250, scale_500) to price lookup key based on default term (monthly)
  function getPriceLookupKey(planKey: string): string | null {
    if (!VALID_PLANS.has(planKey)) {
      return null;
    }
    const cap = planKey.split('_')[1];
    return `cap_${cap}_m`;
  }

  const checkoutMutation = useMutation({
    mutationFn: async () => {
      if (!planKey || !VALID_PLANS.has(planKey)) {
        throw new Error('Invalid or missing plan selection');
      }
      const priceLookupKey = getPriceLookupKey(planKey);
      if (!priceLookupKey) {
        throw new Error('Unable to determine pricing');
      }
      const result = await apiRequest('POST', '/api/billing/checkout', { 
        priceLookupKey, 
        chargeToday: false 
      });
      return await result.json() as { url: string };
    },
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: (error: any) => {
      console.error('Checkout redirect error:', error);
      toast({
        variant: "destructive",
        title: "Checkout failed",
        description: error.message || "Unable to start checkout. Please try again.",
      });
      // Redirect to admin dashboard on error
      setTimeout(() => setLocation('/admin/get-started'), 2000);
    },
  });

  useEffect(() => {
    if (!planKey || !VALID_PLANS.has(planKey)) {
      toast({
        variant: "destructive",
        title: "Invalid plan selection",
        description: "Redirecting to dashboard...",
      });
      setLocation('/admin/get-started');
      return;
    }
    
    // Small delay to ensure session is established after OAuth
    const timer = setTimeout(() => {
      checkoutMutation.mutate();
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        <p className="text-muted-foreground">Redirecting to checkout...</p>
      </div>
    </div>
  );
}
