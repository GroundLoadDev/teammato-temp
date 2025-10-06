import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Download } from "lucide-react";

export default function BillingSettings() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-semibold mb-2" data-testid="text-billing-title">Billing</h1>
      <p className="text-muted-foreground mb-8" data-testid="text-billing-subtitle">
        Manage your subscription and billing details
      </p>

      <div className="max-w-2xl space-y-6">
        <div className="p-6 rounded-md border bg-card">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h3 className="font-semibold mb-1">Current Plan</h3>
              <Badge className="mb-2" data-testid="badge-plan">Trial</Badge>
              <p className="text-sm text-muted-foreground">11 days remaining</p>
              
              <div className="mt-4 pt-4 border-t space-y-1.5 text-xs text-muted-foreground" data-testid="section-trust-bullets-billing">
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
            <Button data-testid="button-upgrade">Upgrade to Pro</Button>
          </div>
          <div className="grid grid-cols-3 gap-4 pt-4 border-t">
            <div>
              <p className="text-2xl font-bold">32</p>
              <p className="text-sm text-muted-foreground">Members</p>
            </div>
            <div>
              <p className="text-2xl font-bold">127</p>
              <p className="text-sm text-muted-foreground">Threads</p>
            </div>
            <div>
              <p className="text-2xl font-bold">8.3k</p>
              <p className="text-sm text-muted-foreground">Reactions</p>
            </div>
          </div>
        </div>

        <div>
          <h3 className="font-semibold mb-4">Payment Method</h3>
          <div className="flex items-center justify-between p-4 rounded-md border bg-card">
            <div className="flex items-center gap-3">
              <CreditCard className="w-5 h-5" />
              <div>
                <p className="font-mono">•••• 4242</p>
                <p className="text-sm text-muted-foreground">Expires 12/2026</p>
              </div>
            </div>
            <Button variant="outline" size="sm" data-testid="button-update-card">Update</Button>
          </div>
        </div>

        <div>
          <h3 className="font-semibold mb-4">Billing History</h3>
          <div className="space-y-2">
            {[
              { date: "Sep 1, 2025", amount: "$99.00", status: "Paid" },
              { date: "Aug 1, 2025", amount: "$99.00", status: "Paid" },
            ].map((invoice, i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-md border bg-card" data-testid={`invoice-${i}`}>
                <div>
                  <p className="font-medium">{invoice.date}</p>
                  <p className="text-sm text-muted-foreground">{invoice.amount}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{invoice.status}</Badge>
                  <Button variant="ghost" size="sm" data-testid={`button-download-${i}`}>
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
