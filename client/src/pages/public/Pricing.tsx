import { useMemo, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

type Term = "monthly" | "annual";

type BandKey =
  | "pro_250"
  | "scale_500"
  | "scale_1000"
  | "scale_2500"
  | "scale_5000";

type Band = {
  key: BandKey;
  name: string;
  cap: number;
  monthly: number;
  annual: number;
  blurb: string;
};

const BANDS: Band[] = [
  { key: "pro_250",     name: "Pro",   cap: 250,  monthly: 99,  annual: 999,  blurb: "For most teams" },
  { key: "scale_500",   name: "Scale", cap: 500,  monthly: 149, annual: 1490, blurb: "Bigger workspace" },
  { key: "scale_1000",  name: "Scale", cap: 1000, monthly: 199, annual: 1990, blurb: "Growing fast" },
  { key: "scale_2500",  name: "Scale", cap: 2500, monthly: 299, annual: 2990, blurb: "Large orgs" },
  { key: "scale_5000",  name: "Scale", cap: 5000, monthly: 399, annual: 3990, blurb: "Very large orgs" },
];

function pickBandBySeats(seats: number): Band {
  if (seats <= 250) return BANDS[0];
  if (seats <= 500) return BANDS[1];
  if (seats <= 1000) return BANDS[2];
  if (seats <= 2500) return BANDS[3];
  return BANDS[4];
}

function formatUSD(n: number) {
  return `$${n.toLocaleString()}`;
}

export default function PricingPage() {
  const [term, setTerm] = useState<Term>("annual");
  const [seats, setSeats] = useState(240);

  const recommended = useMemo(() => pickBandBySeats(seats), [seats]);

  return (
    <>
      <Header />
      <main id="main">
        <PricingHero term={term} onTermChange={setTerm} />
        <SeatSizer seats={seats} setSeats={setSeats} recommended={recommended} term={term} />
        <PlansChooser term={term} />
        <FeatureParity />
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
      <div className="mx-auto max-w-6xl px-6 pb-10 pt-16 text-center md:pt-20">
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

  const handleStartTrial = () => {
    // Redirect to Slack OAuth with plan parameter
    window.location.href = `/api/slack/install?plan=${recommended.key}`;
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
              max={5000}
              step={10}
              value={seats}
              onChange={(e) => setSeats(parseInt(e.target.value, 10))}
              className="w-full accent-emerald-600"
              aria-label="Workspace members"
              data-testid="input-seats-slider"
            />
            <div className="mt-2 flex items-center justify-between text-sm text-muted-foreground">
              <span data-testid="text-min-seats">50</span>
              <span data-testid="text-current-seats">{seats} members</span>
              <span data-testid="text-max-seats">5,000</span>
            </div>
          </div>
        </div>

        <div className="md:col-span-5">
          <div className="rounded-2xl border p-5" data-testid="card-recommended-plan">
            <div className="text-sm text-muted-foreground">Recommended</div>
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
            <button
              onClick={handleStartTrial}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
              data-testid="button-start-trial"
            >
              Start free trial
            </button>
            <p className="mt-3 text-xs text-muted-foreground" data-testid="text-trial-info">
              14-day trial. Card added after install. You won't be charged until trial ends.
            </p>
            <div className="mt-4 space-y-1.5 text-xs text-muted-foreground" data-testid="section-trust-bullets">
              <div className="flex items-start gap-2">
                <span className="text-emerald-600 shrink-0">✓</span>
                <span>K-anonymity enforced: 5+ participants required before visibility</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-emerald-600 shrink-0">✓</span>
                <span>End-to-end encrypted per-org with isolated data</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-emerald-600 shrink-0">✓</span>
                <span>Anti-retaliation policy protection built-in</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function PlansChooser({ term }: { term: Term }) {
  const PRO = { key: "pro_250", cap: 250, monthly: 99, annual: 999 };

  type ScaleBand = {
    key: string;
    cap: number;
    monthly: number;
    annual: number;
    label: string;
  };

  const SCALE: ScaleBand[] = [
    { key: "scale_500",    cap: 500,    monthly: 149,  annual: 1490,  label: "Up to 500" },
    { key: "scale_1000",   cap: 1000,   monthly: 199,  annual: 1990,  label: "Up to 1k" },
    { key: "scale_2500",   cap: 2500,   monthly: 299,  annual: 2990,  label: "Up to 2.5k" },
    { key: "scale_5000",   cap: 5000,   monthly: 399,  annual: 3990,  label: "Up to 5k" },
    { key: "scale_10000",  cap: 10000,  monthly: 599,  annual: 5990,  label: "Up to 10k" },
    { key: "scale_25000",  cap: 25000,  monthly: 999,  annual: 9990,  label: "Up to 25k" },
    { key: "scale_50000",  cap: 50000,  monthly: 1499, annual: 14990, label: "Up to 50k" },
    { key: "scale_100000", cap: 100000, monthly: 2499, annual: 24990, label: "Up to 100k" },
  ];

  const [sel, setSel] = useState<string>("scale_500");
  const active = SCALE.find(b => b.key === sel)!;

  const scalePrice = term === "annual" ? active.annual : active.monthly;
  const scaleSuffix = term === "annual" ? "/yr" : "/mo";

  const handleChoosePlan = (planKey: string) => {
    // Redirect to Slack OAuth with plan parameter
    window.location.href = `/api/slack/install?plan=${planKey}`;
  };

  return (
    <section className="mx-auto max-w-6xl px-6 py-8">
      <div className="grid gap-6 md:grid-cols-2">
        {/* PRO */}
        <article className="rounded-2xl border bg-background p-6 shadow-[0_1px_0_rgba(0,0,0,0.06)]" data-testid="card-plan-pro">
          <header className="flex items-center justify-between">
            <h3 className="text-lg font-semibold" data-testid="text-plan-name-pro">Pro</h3>
            <span className="rounded-full bg-foreground/5 px-2 py-1 text-xs text-foreground/70">For most teams</span>
          </header>
          <div className="mt-2 text-3xl font-semibold" data-testid="text-plan-price-pro">
            {formatUSD(term === "annual" ? PRO.annual : PRO.monthly)}
            <span className="ml-1 text-sm font-normal text-muted-foreground">{scaleSuffix}</span>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Free today. Card added after install.
          </p>
          <ul className="mt-4 space-y-2 text-sm">
            <li className="flex items-center justify-between">
              <span>Max workspace users</span>
              <span className="rounded-lg bg-foreground/5 px-2 py-0.5 text-xs text-foreground/70" data-testid="text-plan-cap-pro">{PRO.cap.toLocaleString()}</span>
            </li>
            <li className="text-muted-foreground">Anonymous posts & comments</li>
            <li className="text-muted-foreground">Weekly digests & analytics</li>
            <li className="text-muted-foreground">K-anonymity & retention controls</li>
            <li className="text-muted-foreground">Email support</li>
          </ul>
          <button
            onClick={() => handleChoosePlan(PRO.key)}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
            data-testid="button-choose-pro"
          >
            Choose Pro
          </button>
          <p className="mt-2 text-xs text-center text-muted-foreground">Secure checkout via Stripe</p>
          <div className="mt-4 pt-4 border-t space-y-1.5 text-xs text-muted-foreground" data-testid="section-trust-bullets-pro">
            <div className="flex items-start gap-1.5">
              <span className="text-emerald-600 shrink-0 text-xs">✓</span>
              <span>K-anonymity: 5+ required</span>
            </div>
            <div className="flex items-start gap-1.5">
              <span className="text-emerald-600 shrink-0 text-xs">✓</span>
              <span>Per-org encryption</span>
            </div>
            <div className="flex items-start gap-1.5">
              <span className="text-emerald-600 shrink-0 text-xs">✓</span>
              <span>Anti-retaliation protection</span>
            </div>
          </div>
        </article>

        {/* SCALE with band rail */}
        <article className="rounded-2xl border bg-background p-6 shadow-[0_1px_0_rgba(0,0,0,0.06)]" data-testid="card-plan-scale">
          <header className="flex items-center justify-between">
            <h3 className="text-lg font-semibold" data-testid="text-plan-name-scale">Scale</h3>
            <span className="rounded-full bg-foreground/5 px-2 py-1 text-xs text-foreground/70">Larger workspaces</span>
          </header>

          {/* Grid of band chips */}
          <div className="mt-3">
            <p className="text-sm text-muted-foreground">Pick your seat cap</p>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
              {SCALE.map((b) => {
                const activeChip = sel === b.key;
                return (
                  <button
                    key={b.key}
                    onClick={() => setSel(b.key)}
                    aria-pressed={activeChip}
                    className={[
                      "w-full rounded-lg px-3 py-2 text-left text-sm ring-1 ring-black/5 transition",
                      activeChip ? "bg-emerald-600 text-white" : "bg-muted hover:bg-muted/70",
                    ].join(" ")}
                    data-testid={`button-scale-${b.key}`}
                  >
                    {b.label}
                  </button>
                );
              })}
              <a
                href="/contact"
                className="w-full rounded-lg px-3 py-2 text-left text-sm ring-1 ring-black/5 hover:bg-muted"
                data-testid="link-contact-enterprise"
              >
                100k+? Contact us
              </a>
            </div>
          </div>

          {/* Live price/cap */}
          <div className="mt-4 flex items-baseline justify-between">
            <div className="text-3xl font-semibold" data-testid="text-plan-price-scale">
              {formatUSD(scalePrice)} <span className="ml-1 text-sm font-normal text-muted-foreground">{scaleSuffix}</span>
            </div>
            <div className="rounded-lg bg-foreground/5 px-2 py-1 text-xs text-foreground/70" data-testid="text-plan-cap-scale">
              Max {active.cap.toLocaleString()} users
            </div>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Free today. Card added after install.
          </p>

          <ul className="mt-4 space-y-2 text-sm">
            <li className="text-muted-foreground">Anonymous posts & comments</li>
            <li className="text-muted-foreground">Weekly digests & analytics</li>
            <li className="text-muted-foreground">K-anonymity & retention controls</li>
            <li className="text-muted-foreground">Email support</li>
          </ul>

          <button
            onClick={() => handleChoosePlan(active.key)}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
            data-testid="button-choose-scale"
          >
            Choose Scale
          </button>
          <p className="mt-2 text-xs text-center text-muted-foreground">Secure checkout via Stripe</p>
          <div className="mt-4 pt-4 border-t space-y-1.5 text-xs text-muted-foreground" data-testid="section-trust-bullets-scale">
            <div className="flex items-start gap-1.5">
              <span className="text-emerald-600 shrink-0 text-xs">✓</span>
              <span>K-anonymity: 5+ required</span>
            </div>
            <div className="flex items-start gap-1.5">
              <span className="text-emerald-600 shrink-0 text-xs">✓</span>
              <span>Per-org encryption</span>
            </div>
            <div className="flex items-start gap-1.5">
              <span className="text-emerald-600 shrink-0 text-xs">✓</span>
              <span>Anti-retaliation protection</span>
            </div>
          </div>
        </article>
      </div>

      <p className="mx-auto mt-4 max-w-3xl text-center text-sm text-muted-foreground">
        Same product on every plan. Choose a cap now—change size anytime in the Billing Portal.
        For 100k+ workspaces, <a href="/contact" className="underline underline-offset-4">contact us</a>.
      </p>

      <details className="mx-auto mt-3 w-full max-w-md text-sm text-muted-foreground">
        <summary className="cursor-pointer text-center underline underline-offset-4">See all published bands</summary>
        <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 rounded-xl border bg-background p-4">
          {[{cap:250, m:99, a:999},{cap:500,m:149,a:1490},{cap:1000,m:199,a:1990},
            {cap:2500,m:299,a:2990},{cap:5000,m:399,a:3990},{cap:10000,m:599,a:5990},
            {cap:25000,m:999,a:9990},{cap:50000,m:1499,a:14990},{cap:100000,m:2499,a:24990}]
            .map(r => (
              <li key={r.cap} className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2">
                <span>{r.cap.toLocaleString()}</span>
                <span>${r.m}/mo · ${r.a}/yr</span>
              </li>
            ))}
        </ul>
      </details>
    </section>
  );
}

function FeatureParity() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-10">
      <div className="rounded-3xl border bg-muted/40 p-6 md:p-8">
        <h3 className="text-xl font-semibold" data-testid="text-parity-title">Same product on every plan</h3>
        <p className="mt-1 text-sm text-muted-foreground" data-testid="text-parity-subtitle">
          We scale price with workspace size—not with features or support tiers.
        </p>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {[
            "Anonymous feedback in Slack",
            "Weekly, k-anonymous digests",
            "Moderation flags & analytics",
            "Retention controls & exports",
            "Org-scoped isolation & encryption",
            "Email support on all plans",
          ].map((item, i) => (
            <div key={item} className="rounded-2xl border bg-background p-4 text-sm" data-testid={`text-feature-${i}`}>{item}</div>
          ))}
        </div>
      </div>
    </section>
  );
}

function BillingExplainer() {
  return (
    <section className="mx-auto max-w-6xl px-6 pb-16">
      <h3 className="text-center text-2xl font-semibold" data-testid="text-billing-title">How billing works</h3>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {[
          {
            title: "Start 14-day trial",
            desc: "Full features, card required. You won't be charged until the trial ends.",
          },
          {
            title: "Upgrade in Checkout",
            desc: "Pick your band and term. Stripe handles payment and we update your seat cap automatically.",
          },
          {
            title: "Manage in Portal",
            desc: "Change plan or term anytime. Downgrades apply caps; if you go over, you'll get a friendly prompt.",
          },
        ].map((c, i) => (
          <div key={c.title} className="rounded-2xl border bg-background p-5" data-testid={`card-billing-step-${i}`}>
            <div className="text-lg font-medium" data-testid={`text-billing-step-title-${i}`}>{c.title}</div>
            <p className="mt-1 text-sm text-muted-foreground" data-testid={`text-billing-step-desc-${i}`}>{c.desc}</p>
          </div>
        ))}
      </div>

      <p className="mt-4 text-center text-xs text-muted-foreground" data-testid="text-billing-grace">
        If your workspace exceeds its cap we'll warn at 90%, allow a short grace window to 110% for 7 days, then pause new submissions until you upgrade. Reading digests and analytics remains available.
      </p>
    </section>
  );
}

function PricingFAQ() {
  const qas = [
    {
      q: "Do I need a card to start?",
      a: "Yes — after you connect Slack, you'll add a card to begin your 14-day trial. You won't be charged until the trial ends.",
    },
    {
      q: "Can I pay now?",
      a: "Yes — choose 'Charge today' to start billing immediately and skip the trial.",
    },
    {
      q: "Can I cancel before billing?",
      a: "Any time during the trial. No questions asked.",
    },
    {
      q: "What if we exceed our seat cap?",
      a: "You'll get a 7-day grace period with clear upgrade prompts.",
    },
    {
      q: "Do higher plans include better support?",
      a: "No. All plans include email support. The product is fully self-serve and identical across plans.",
    },
    {
      q: "Do you offer discounts?",
      a: "Annual billing includes 2 months free. We don't offer custom discounts or contracts.",
    },
    {
      q: "Do you support Slack Enterprise Grid?",
      a: "Yes—choose a Scale band large enough for your workspace. Same product, just a higher seat cap.",
    },
  ];

  return (
    <section className="mx-auto max-w-4xl px-6 pb-24">
      <h3 className="text-center text-2xl font-semibold" data-testid="text-faq-title">Pricing FAQ</h3>
      <div className="mt-6 divide-y rounded-2xl border bg-background">
        {qas.map((qa, i) => (
          <details key={i} className="group" data-testid={`details-faq-${i}`}>
            <summary className="cursor-pointer list-none px-5 py-4 text-left hover:bg-muted/50">
              <span className="text-base font-medium" data-testid={`text-faq-question-${i}`}>{qa.q}</span>
            </summary>
            <div className="px-5 pb-5 text-sm text-muted-foreground" data-testid={`text-faq-answer-${i}`}>{qa.a}</div>
          </details>
        ))}
      </div>
    </section>
  );
}
