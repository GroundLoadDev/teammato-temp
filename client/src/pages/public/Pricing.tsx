import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Info, Shield } from "lucide-react";

type Term = "monthly" | "annual";

type BandKey =
  | "pro_250"
  | "scale_500"
  | "scale_1000"
  | "scale_2500"
  | "scale_5000"
  | "scale_10000"
  | "scale_25000"
  | "scale_50000"
  | "scale_100000";

type Band = {
  key: BandKey;
  name: string;
  cap: number;
  monthly: number;
  annual: number;
  blurb: string;
};

const BANDS: Band[] = [
  { key: "pro_250",      name: "Pro",   cap: 250,    monthly: 99,   annual: 999,   blurb: "For most teams" },
  { key: "scale_500",    name: "Scale", cap: 500,    monthly: 149,  annual: 1490,  blurb: "Bigger workspace" },
  { key: "scale_1000",   name: "Scale", cap: 1000,   monthly: 199,  annual: 1990,  blurb: "Growing fast" },
  { key: "scale_2500",   name: "Scale", cap: 2500,   monthly: 299,  annual: 2990,  blurb: "Large orgs" },
  { key: "scale_5000",   name: "Scale", cap: 5000,   monthly: 399,  annual: 3990,  blurb: "Very large orgs" },
  { key: "scale_10000",  name: "Scale", cap: 10000,  monthly: 599,  annual: 5990,  blurb: "Enterprise" },
  { key: "scale_25000",  name: "Scale", cap: 25000,  monthly: 999,  annual: 9990,  blurb: "Large enterprise" },
  { key: "scale_50000",  name: "Scale", cap: 50000,  monthly: 1499, annual: 14990, blurb: "Very large enterprise" },
  { key: "scale_100000", name: "Scale", cap: 100000, monthly: 2499, annual: 24990, blurb: "Enterprise Grid" },
];

function pickBandBySeats(seats: number): Band {
  if (seats <= 250) return BANDS[0];
  if (seats <= 500) return BANDS[1];
  if (seats <= 1000) return BANDS[2];
  if (seats <= 2500) return BANDS[3];
  if (seats <= 5000) return BANDS[4];
  if (seats <= 10000) return BANDS[5];
  if (seats <= 25000) return BANDS[6];
  if (seats <= 50000) return BANDS[7];
  return BANDS[8];
}

function formatUSD(n: number) {
  return `$${n.toLocaleString()}`;
}

export default function PricingPage() {
  const [term, setTerm] = useState<Term>("annual");
  const [seats, setSeats] = useState(500);

  const recommended = useMemo(() => pickBandBySeats(seats), [seats]);

  return (
    <>
      <Header />
      <main id="main">
        <PricingHero term={term} onTermChange={setTerm} />
        <SeatSizer seats={seats} setSeats={setSeats} recommended={recommended} term={term} />
        <FeaturesAccordion />
        <AudienceSegmentation />
        <BillingExplainer />
        <PricingFAQ />
      </main>
      <Footer />
    </>
  );
}

function PricingHero({
  term,
  onTermChange,
}: {
  term: Term;
  onTermChange: (t: Term) => void;
}) {
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(1100px_360px_at_50%_-60px,rgba(16,185,129,0.10),transparent)]" />
      
      {/* Founding Pricing Ribbon */}
      <div className="mx-auto max-w-6xl px-6 pt-6">
        <div className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-600/10 border border-emerald-600/20 px-4 py-2.5 text-sm">
          <Shield className="h-4 w-4 text-emerald-600" />
          <span className="font-medium text-foreground">Founding pricing</span>
          <span className="text-muted-foreground">— available during early access. Price-protected for 24 months. No hidden fees.</span>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 pb-10 pt-8 text-center md:pt-12">
        <h1 className="text-4xl font-semibold tracking-tight md:text-5xl" data-testid="text-pricing-title">
          Simple, self-serve pricing
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-muted-foreground" data-testid="text-pricing-subtitle">
          Same product for everyone. Just pick your workspace size.
        </p>

        <div className="mt-6 inline-flex items-center gap-2 rounded-2xl border bg-background p-2 text-sm">
          <button
            onClick={() => onTermChange("monthly")}
            className={`rounded-xl px-3 py-1.5 ${term === "monthly" ? "bg-muted" : "hover:bg-muted"}`}
            data-testid="button-term-monthly"
          >
            Monthly
          </button>
          <button
            onClick={() => onTermChange("annual")}
            className={`rounded-xl px-3 py-1.5 ${term === "annual" ? "bg-emerald-600 text-white" : "hover:bg-muted"}`}
            data-testid="button-term-annual"
          >
            Annual <span className="ml-1 text-xs opacity-90">(save 2 months)</span>
          </button>
        </div>
      </div>
    </section>
  );
}

function SeatSizer({
  seats,
  setSeats,
  recommended,
  term,
}: {
  seats: number;
  setSeats: (n: number) => void;
  recommended: Band;
  term: Term;
}) {
  const price = term === "annual" ? recommended.annual : recommended.monthly;

  const { data: authData } = useQuery<{ user: { id: string; email: string; role: string } }>({
    queryKey: ['/api/auth/me'],
    retry: false,
  });
  
  const isLoggedIn = !!authData?.user;

  const handleStartTrial = () => {
    if (isLoggedIn) {
      const priceLookupKey = term === 'annual' 
        ? `cap_${recommended.cap}_a` 
        : `cap_${recommended.cap}_m`;
      window.location.href = `/admin/billing?action=start_trial&price=${priceLookupKey}`;
    } else {
      window.location.href = `/api/slack/install?plan=${recommended.key}`;
    }
  };

  return (
    <section className="mx-auto max-w-6xl px-6 pb-10">
      <div className="grid items-center gap-8 rounded-3xl border bg-background p-6 md:grid-cols-12 md:p-8">
        <div className="md:col-span-7">
          <h2 className="text-xl font-semibold" data-testid="text-sizer-title">Estimate your workspace size</h2>
          <p className="mt-1 text-sm text-muted-foreground" data-testid="text-sizer-description">
            We price by Slack workspace members—features stay identical on all plans.
          </p>
          <div className="mt-4">
            <input
              type="range"
              min={50}
              max={100000}
              step={50}
              value={seats}
              onChange={(e) => setSeats(parseInt(e.target.value, 10))}
              className="w-full accent-emerald-600"
              aria-label="Workspace members"
              data-testid="input-seats-slider"
            />
            <div className="mt-2 flex items-center justify-between text-sm text-muted-foreground">
              <span data-testid="text-min-seats">50</span>
              <span data-testid="text-current-seats">{seats.toLocaleString()} members</span>
              <span data-testid="text-max-seats">100,000</span>
            </div>
          </div>
          <p className="mt-3 text-xs text-muted-foreground italic" data-testid="text-cap-change-note">
            Change caps anytime. During your 24-month window, you'll pay the matching founding price for the cap you choose.
          </p>
        </div>

        <div className="md:col-span-5">
          <div className="rounded-2xl border p-5" data-testid="card-recommended-plan">
            <div className="flex items-center gap-2">
              <div className="text-sm text-muted-foreground">Your Plan</div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600/10 px-2 py-0.5 text-xs font-medium text-emerald-700 cursor-help" data-testid="badge-founding-price">
                    <Shield className="h-3 w-3" />
                    Founding price
                  </span>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs" data-testid="tooltip-founding-price">
                  <p className="text-xs">Your workspace keeps this rate for 24 months from signup—even if our list price increases after GA.</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <div>
                <div className="text-lg font-medium" data-testid="text-recommended-name">{recommended.name}</div>
                <div className="text-sm text-muted-foreground" data-testid="text-recommended-cap">Up to {recommended.cap.toLocaleString()} users</div>
              </div>
              <div className="text-3xl font-semibold" data-testid="text-recommended-price">
                {formatUSD(price)}
                <span className="ml-1 text-sm font-normal text-muted-foreground">/{term === "annual" ? "yr" : "mo"}</span>
              </div>
            </div>
            <div className="mt-2 text-xs text-muted-foreground" data-testid="text-price-protection">
              Price-protected 24 months when you start before GA
            </div>
            <button
              onClick={handleStartTrial}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
              data-testid="button-start-trial"
            >
              Start free trial
            </button>
            <p className="mt-3 text-xs text-center text-muted-foreground" data-testid="text-trial-info">
              14-day trial. Card added after install. You won't be charged until trial ends.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function FeaturesAccordion() {
  const features = [
    {
      category: "Anonymous Feedback",
      items: [
        { name: "K-anonymity enforcement", tooltip: "Minimum 5 participants required before any feedback becomes visible. Prevents single-person identification." },
        { name: "Per-organization encryption", tooltip: "XChaCha20-Poly1305 AEAD encryption with isolated keys per workspace. We store ciphertext only." },
        { name: "Anonymous posts & comments", tooltip: "Submit feedback and engage in discussions without revealing your identity." },
        { name: "PII filtering", tooltip: "Automatic removal of personally identifiable information and @mentions from submissions." },
        { name: "Timing jitter (5-30s)", tooltip: "Randomized delivery delays prevent timing-based correlation attacks." },
        { name: "Differential privacy", tooltip: "Laplace noise (ε=0.5) added to analytics to protect individual contributions." },
      ]
    },
    {
      category: "Slack Integration",
      items: [
        { name: "Slash command feedback", tooltip: "Use /teammato [topic] in any channel to submit anonymous feedback instantly." },
        { name: "Interactive modals", tooltip: "Guided submission experience with real-time character counts and validation." },
        { name: "Daily digest notifications", tooltip: "Automated summaries delivered to designated channels with engagement metrics." },
        { name: "Thread invitations", tooltip: "Smart notifications when new feedback arrives on topics you care about." },
        { name: "OAuth v2 authentication", tooltip: "Secure, token-based authentication with automatic token refresh and revocation support." },
      ]
    },
    {
      category: "Topic Management",
      items: [
        { name: "Time-boxed campaigns", tooltip: "Create feedback windows with defined start/end dates. Auto-lock prevents late submissions." },
        { name: "K-threshold progress", tooltip: "Visual indicators show how close topics are to meeting anonymity requirements." },
        { name: "User-suggested topics", tooltip: "Team members can propose new feedback topics with built-in voting and approval workflow." },
        { name: "You Said / We Did loops", tooltip: "Document actions taken based on feedback to close the loop with your team." },
        { name: "Anti-gaming safeguards", tooltip: "Locked thresholds and collection windows prevent manipulation after creation." },
      ]
    },
    {
      category: "Moderation & Compliance",
      items: [
        { name: "Flag queue & bulk actions", tooltip: "Efficient moderation workflow with batch operations for flagged content." },
        { name: "Immutable audit trails", tooltip: "Every moderation action is logged with timestamps, actors, and reasons for compliance." },
        { name: "Role-based access control", tooltip: "Owner, Admin, Moderator, and Viewer roles with granular permissions." },
        { name: "Data retention policies", tooltip: "Configure retention periods up to 3 years with automated cleanup." },
        { name: "GDPR-ready exports", tooltip: "Privacy-preserving data exports that maintain k-anonymity guarantees." },
      ]
    },
    {
      category: "Analytics & Insights",
      items: [
        { name: "Privacy-preserving metrics", tooltip: "Aggregated analytics that maintain k-anonymity even in small populations." },
        { name: "AI theme detection", tooltip: "CPU-based ML pipeline identifies common themes using hierarchical clustering and c-TF-IDF." },
        { name: "K-safe export capabilities", tooltip: "Database views ensure exports never violate anonymity thresholds." },
        { name: "Engagement dashboards", tooltip: "Real-time statistics on participation, topics, and team health." },
        { name: "Trend analysis", tooltip: "Track sentiment and engagement patterns over time while preserving anonymity." },
      ]
    },
    {
      category: "Billing & Subscription",
      items: [
        { name: "Stripe integration", tooltip: "Secure payment processing with PCI compliance and automatic invoice generation." },
        { name: "7 pricing tiers", tooltip: "From 250 to 100k+ seats with transparent, predictable pricing." },
        { name: "Seat-based capacity", tooltip: "Pay only for active workspace members with automatic seat counting." },
        { name: "Flexible billing cycles", tooltip: "Choose monthly or annual billing with 2-month savings on annual plans." },
        { name: "Customer portal access", tooltip: "Self-service subscription management, invoice history, and payment method updates." },
        { name: "Audience segmentation", tooltip: "Control seat count by workspace, user groups, channels, or exclude guests." },
      ]
    },
    {
      category: "Security & Privacy",
      items: [
        { name: "Multi-tenant isolation", tooltip: "Row-level security ensures complete data isolation between organizations." },
        { name: "Session management", tooltip: "Secure session handling with regeneration on login and CSRF protection." },
        { name: "Encryption monitoring", tooltip: "Structured logging and metrics for all encryption operations with audit trails." },
        { name: "Key rotation support", tooltip: "Manual master key rotation with full audit trail. Recommended every 90 days." },
        { name: "10-user minimum population", tooltip: "Organizations must have at least 10 active users to prevent small-group de-anonymization." },
        { name: "K+2 buffer protection", tooltip: "Extra safety margin beyond k-threshold to account for edge cases and timing attacks." },
      ]
    },
    {
      category: "Support",
      items: [
        { name: "Email support", tooltip: "Responsive support team available on all plans with typical response within 24 hours." },
        { name: "Documentation", tooltip: "Comprehensive guides, API docs, and best practices for anonymous feedback programs." },
        { name: "Onboarding assistance", tooltip: "Setup guidance and configuration help to get your team started quickly." },
        { name: "Feature requests", tooltip: "Direct input into product roadmap with transparent prioritization." },
      ]
    },
  ];

  return (
    <section className="mx-auto max-w-6xl px-6 py-10">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-semibold" data-testid="text-features-title">Complete Feature Set</h2>
        <p className="mt-2 text-muted-foreground" data-testid="text-features-subtitle">
          Every feature available on every plan. No upsells, no hidden tiers.
        </p>
      </div>

      <Accordion type="multiple" className="space-y-3" defaultValue={["Anonymous Feedback", "Slack Integration"]}>
        {features.map((section) => (
          <AccordionItem 
            key={section.category} 
            value={section.category}
            className="rounded-2xl border bg-background px-6 data-[state=open]:bg-muted/20"
            data-testid={`accordion-${section.category.toLowerCase().replace(/\s+/g, '-')}`}
          >
            <AccordionTrigger className="text-left font-medium hover:no-underline py-4">
              {section.category}
            </AccordionTrigger>
            <AccordionContent className="pb-4">
              <div className="grid gap-3 md:grid-cols-2">
                {section.items.map((item) => (
                  <div key={item.name} className="flex items-start gap-2 text-sm">
                    <span className="text-emerald-600 shrink-0 mt-0.5">✓</span>
                    <div className="flex items-center gap-1.5 flex-1">
                      <span className="text-muted-foreground">{item.name}</span>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button className="shrink-0" aria-label={`Info about ${item.name}`}>
                            <Info className="h-3.5 w-3.5 text-muted-foreground/50 hover:text-muted-foreground" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs" data-testid={`tooltip-${item.name.toLowerCase().replace(/\s+/g, '-')}`}>
                          <p className="text-xs">{item.tooltip}</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      <p className="mx-auto mt-8 max-w-3xl text-center text-sm text-muted-foreground" data-testid="text-pricing-footer">
        Same product on every plan. Choose a cap now—change size anytime in the Billing Portal.
        For 100k+ workspaces, <a href="/contact" className="underline underline-offset-4">contact us</a>.
      </p>
    </section>
  );
}

function AudienceSegmentation() {
  const [selectedMode, setSelectedMode] = useState<"workspace" | "usergroup" | "channels" | "exclude">("workspace");

  const modes = [
    {
      id: "workspace" as const,
      title: "Workspace",
      subtitle: "Count all active human members",
      icon: (
        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M3 9h18M9 21V9" />
        </svg>
      ),
      example: "1,000 workspace members = 1,000 billable seats",
      description: "Simple and straightforward. Your entire Slack workspace counts toward your seat cap.",
    },
    {
      id: "usergroup" as const,
      title: "Slack User Group",
      subtitle: "Count only group members",
      icon: (
        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="9" cy="7" r="3" />
          <circle cx="15" cy="11" r="3" />
          <path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
          <path d="M12 17v4M16 19h6" />
        </svg>
      ),
      example: "@feedback-enabled with 250 members = 250 billable seats",
      description: "Perfect for limiting access to specific teams. Only members of your chosen user group count.",
    },
    {
      id: "channels" as const,
      title: "Selected Channels",
      subtitle: "Count unique members across channels",
      icon: (
        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          <path d="M8 10h.01M12 10h.01M16 10h.01" />
        </svg>
      ),
      example: "#engineering + #product = 180 unique members = 180 billable seats",
      description: "Target specific channels. We count each unique person across your selected channels only once.",
    },
    {
      id: "exclude" as const,
      title: "Exclude Guests",
      subtitle: "Don't count guest users",
      icon: (
        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="9" />
          <path d="M9 9l6 6M15 9l-6 6" />
        </svg>
      ),
      example: "1,000 members - 50 guests = 950 billable seats",
      description: "Automatically exclude single and multi-channel guests from your seat count.",
    },
  ];

  const currentMode = modes.find(m => m.id === selectedMode) || modes[0];

  return (
    <section className="mx-auto max-w-6xl px-6 py-10">
      <div className="text-center">
        <h3 className="text-2xl font-semibold" data-testid="text-audience-title">Pay only for who you need</h3>
        <p className="mx-auto mt-2 max-w-2xl text-muted-foreground" data-testid="text-audience-subtitle">
          Control your seat count by choosing exactly which Slack members should access Teammato. Your billable seats adjust automatically.
        </p>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <div className="space-y-3">
          {modes.map((mode) => (
            <button
              key={mode.id}
              onClick={() => setSelectedMode(mode.id)}
              className={[
                "group w-full rounded-2xl border p-4 text-left transition-all hover-elevate active-elevate-2",
                selectedMode === mode.id
                  ? "border-emerald-600 bg-emerald-600/5"
                  : "border-border bg-background"
              ].join(" ")}
              data-testid={`button-audience-${mode.id}`}
            >
              <div className="flex items-start gap-3">
                <div className={[
                  "shrink-0 rounded-lg p-2 transition-colors",
                  selectedMode === mode.id
                    ? "bg-emerald-600 text-white"
                    : "bg-muted text-foreground"
                ].join(" ")}>
                  {mode.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-medium" data-testid={`text-audience-${mode.id}-title`}>{mode.title}</div>
                    {selectedMode === mode.id && (
                      <span className="shrink-0 rounded-full bg-emerald-600 px-2 py-0.5 text-xs text-white">Selected</span>
                    )}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">{mode.subtitle}</div>
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="rounded-2xl border bg-background p-6">
          <div className="mb-4">
            <h4 className="font-medium" data-testid="text-audience-example-title">{currentMode.title}</h4>
            <p className="mt-1 text-sm text-muted-foreground" data-testid="text-audience-example-description">
              {currentMode.description}
            </p>
          </div>
          
          <div className="rounded-xl bg-muted/40 p-4">
            <div className="text-sm font-medium text-muted-foreground">Example</div>
            <div className="mt-2 font-mono text-sm" data-testid="text-audience-example">
              {currentMode.example}
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-emerald-600/20 bg-emerald-600/5 p-4">
            <div className="flex items-start gap-2">
              <span className="text-emerald-600 shrink-0 mt-0.5">💡</span>
              <p className="text-sm text-muted-foreground">
                Configure this in your Billing Portal after installation. Switch modes anytime without downtime.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function BillingExplainer() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-10">
      <div className="rounded-3xl border bg-muted/40 p-6 md:p-8">
        <h3 className="text-xl font-semibold" data-testid="text-billing-title">How billing works</h3>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border bg-background p-4">
            <div className="text-sm font-medium">1. Install & Configure</div>
            <p className="mt-1 text-sm text-muted-foreground" data-testid="text-billing-step1">
              Add to Slack, pick your workspace cap, and start your 14-day free trial.
            </p>
          </div>
          <div className="rounded-2xl border bg-background p-4">
            <div className="text-sm font-medium">2. Trial Period</div>
            <p className="mt-1 text-sm text-muted-foreground" data-testid="text-billing-step2">
              Full access to all features. Card required but not charged until trial ends.
            </p>
          </div>
          <div className="rounded-2xl border bg-background p-4">
            <div className="text-sm font-medium">3. Subscription Begins</div>
            <p className="mt-1 text-sm text-muted-foreground" data-testid="text-billing-step3">
              After 14 days, billing starts automatically. Change or cancel anytime.
            </p>
          </div>
        </div>
        <p className="mt-4 text-center text-xs text-muted-foreground" data-testid="text-billing-grace">
          Grace period: 7 days after failed payment before service interruption.
        </p>
      </div>
    </section>
  );
}

function PricingFAQ() {
  const faqs = [
    {
      q: "What happens if I exceed my seat cap?",
      a: "You'll receive automated alerts when approaching your cap. Access continues uninterrupted, but you'll need to upgrade within 7 days to stay compliant with your plan."
    },
    {
      q: "Can I change my plan after subscribing?",
      a: "Yes! Use the Billing Portal to upgrade or downgrade anytime. Changes are prorated automatically."
    },
    {
      q: "How does the 14-day trial work?",
      a: "Full access to all features with no restrictions. We require a payment method but won't charge until the trial ends. Cancel anytime during the trial with no charge."
    },
    {
      q: "What counts as a 'seat'?",
      a: "By default, all active human members in your Slack workspace. You can configure audience segmentation to count only specific user groups, channels, or exclude guests."
    },
    {
      q: "Is there a setup fee or contract?",
      a: "No setup fees, no contracts. Pay month-to-month or save with annual billing. Cancel anytime."
    },
    {
      q: "What payment methods do you accept?",
      a: "All major credit cards via Stripe. Annual plans also support ACH transfers and wire payments for invoices over $5,000."
    },
  ];

  return (
    <section className="mx-auto max-w-4xl px-6 py-16">
      <h2 className="text-center text-2xl font-semibold" data-testid="text-faq-title">Frequently Asked Questions</h2>
      <Accordion type="single" collapsible className="mt-8 space-y-3">
        {faqs.map((faq, i) => (
          <AccordionItem 
            key={i} 
            value={`faq-${i}`}
            className="rounded-2xl border bg-background px-6 data-[state=open]:bg-muted/20"
            data-testid={`accordion-faq-${i}`}
          >
            <AccordionTrigger className="text-left font-medium hover:no-underline py-4" data-testid={`trigger-faq-${i}`}>
              {faq.q}
            </AccordionTrigger>
            <AccordionContent className="pb-4 text-sm text-muted-foreground" data-testid={`content-faq-${i}`}>
              {faq.a}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
      
      <div className="mt-8 text-center">
        <p className="text-sm text-muted-foreground">
          Still have questions?{" "}
          <a href="/contact" className="text-emerald-600 underline underline-offset-4" data-testid="link-contact">
            Contact our team
          </a>
        </p>
      </div>
    </section>
  );
}
