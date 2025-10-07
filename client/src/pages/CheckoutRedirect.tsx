import { useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function CheckoutRedirect() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const params = new URLSearchParams(window.location.search);
  const planKey = params.get('plan');

  // Convert plan key (pro_250, scale_500) to price lookup key based on default term (monthly)
  function getPriceLookupKey(planKey: string): string {
    const cap = planKey.split('_')[1];
    return `cap_${cap}_m`;
  }

  const checkoutMutation = useMutation({
    mutationFn: async () => {
      if (!planKey) {
        throw new Error('No plan selected');
      }
      const priceLookupKey = getPriceLookupKey(planKey);
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
    if (!planKey) {
      toast({
        variant: "destructive",
        title: "No plan selected",
        description: "Redirecting to dashboard...",
      });
      setLocation('/admin/get-started');
      return;
    }
    
    checkoutMutation.mutate();
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
