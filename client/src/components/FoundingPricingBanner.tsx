import { useState, useEffect } from "react";
import { X, Shield } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function FoundingPricingBanner() {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const isDismissed = localStorage.getItem("founding-banner-dismissed");
    if (isDismissed === "true") {
      setDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem("founding-banner-dismissed", "true");
    setDismissed(true);
  };

  if (dismissed) return null;

  return (
    <div className="relative bg-emerald-600/10 border-b border-emerald-600/20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex items-center justify-between gap-4 py-2.5">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Shield className="h-4 w-4 text-emerald-600 shrink-0" />
            <p className="text-sm text-foreground">
              <span className="font-medium">Founding pricing</span>
              <span className="hidden sm:inline"> — lock in today's rate for 24 months when you start before GA.</span>
            </p>
          </div>
          
          <div className="flex items-center gap-2 shrink-0">
            <a
              href="/pricing"
              className="text-sm text-emerald-600 hover:text-emerald-700 font-medium whitespace-nowrap"
              data-testid="link-founding-pricing"
            >
              See pricing
            </a>
            
            <Dialog>
              <DialogTrigger asChild>
                <button
                  className="text-sm text-emerald-600 hover:text-emerald-700 font-medium whitespace-nowrap"
                  data-testid="button-founding-details"
                >
                  Details
                </button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md" data-testid="dialog-founding-details">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-emerald-600" />
                    Founding Pricing
                  </DialogTitle>
                  <DialogDescription className="sr-only">
                    Details about founding pricing protection
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 text-sm">
                  <p className="text-foreground">
                    Founding pricing means your workspace keeps today's rate for <strong>24 months from signup</strong>. After that, you'll renew at our then-current list price.
                  </p>
                  <p className="text-muted-foreground">
                    <strong>Seat-cap changes?</strong> No problem—you'll pay the founding price for the new cap within your 24-month window.
                  </p>
                  <p className="text-muted-foreground">
                    <strong>Cancel anytime.</strong> Re-activations after GA follow current pricing.
                  </p>
                  <a
                    href="/pricing#faq"
                    className="inline-flex text-emerald-600 hover:text-emerald-700 underline underline-offset-4"
                    data-testid="link-founding-faq"
                  >
                    Read full FAQ →
                  </a>
                </div>
              </DialogContent>
            </Dialog>

            <button
              onClick={handleDismiss}
              className="p-1 hover:bg-emerald-600/10 rounded-md transition-colors"
              aria-label="Dismiss banner"
              data-testid="button-dismiss-banner"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
