import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Shield, MessageSquare, BarChart3, Lock, Key, Database } from "lucide-react";

export default function About() {
  return (
    <div className="min-h-screen bg-background">
      <Header authorizeUrl="/api/slack/install?plan=pro_250" signinUrl="/api/slack/install?plan=pro_250" transparent={false} />
      <main id="main">
        <Hero />
        <MacroContext />
        <HowItWorks />
        <WhatYouGet />
        <PrivacyEnforced />
        <LowTouchOps />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(1100px_360px_at_50%_-60px,rgba(16,185,129,0.10),transparent)]" />
      <div className="mx-auto max-w-6xl px-6 pb-16 pt-16 md:pt-20 text-center">
        <div className="mx-auto max-w-4xl">
          <h1 className="text-5xl font-semibold tracking-tight md:text-6xl" data-testid="text-hero-title">
            We make it safe to tell the truth at work.
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-3xl mx-auto" data-testid="text-hero-subtitle">
            Anonymous feedback in Slack, released only in aggregate, so leaders see themes—not people.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <a 
              href="/api/slack/install?plan=pro_250" 
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-medium text-white hover:bg-emerald-700"
              data-testid="button-add-to-slack"
            >
              <WhiteSlackLogo className="h-4 w-4" />
              Add to Slack
            </a>
            <a 
              href="/how-it-works" 
              className="rounded-xl border px-6 py-3 text-sm text-muted-foreground hover:bg-muted"
              data-testid="button-how-it-works"
            >
              Read how anonymity works
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

function MacroContext() {
  const chips = [
    "Anonymous capture in Slack",
    "Clear, behavior-focused input",
    "Actionable roll-ups, not one-offs"
  ];

  return (
    <section className="mx-auto max-w-6xl px-6 py-14">
      <div className="rounded-3xl border bg-muted/40 p-6 md:p-8">
        <h2 className="text-2xl font-semibold" data-testid="text-context-title">Why Teammato exists</h2>
        <p className="mt-3 text-muted-foreground leading-relaxed max-w-4xl" data-testid="text-context-description">
          Modern teams are distributed, overloaded, and cautious. People won't speak if it risks targeting or performative listening. Teammato reduces risk (anonymous by default), makes input clearer (behavior → impact), and keeps it in-flow (Slack), so feedback turns into action—consistently.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          {chips.map((chip, i) => (
            <div 
              key={i}
              className="rounded-full border bg-background px-4 py-2 text-sm"
              data-testid={`chip-context-${i}`}
            >
              {chip}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    { icon: MessageSquare, text: "Install in Slack and pick your channel." },
    { icon: Lock, text: "Teammates submit via modal; we never log message plaintext in logs." },
    { icon: BarChart3, text: "Results release only when a minimum cohort contributes (k-anonymity); leaders see aggregate themes and trends." }
  ];

  return (
    <section className="mx-auto max-w-6xl px-6 py-14">
      <h2 className="text-2xl font-semibold mb-6" data-testid="text-how-title">What happens under the hood</h2>
      
      <div className="grid gap-4 md:grid-cols-3">
        {steps.map((step, i) => (
          <div 
            key={i}
            className="rounded-2xl border bg-background p-6"
            data-testid={`card-step-${i}`}
          >
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
                <step.icon className="h-5 w-5" />
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed flex-1">
                {step.text}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 text-center">
        <a 
          href="/how-it-works" 
          className="text-sm text-emerald-600 hover:underline underline-offset-4"
          data-testid="link-full-loop"
        >
          See the full loop
        </a>
      </div>
    </section>
  );
}

function WhatYouGet() {
  const features = [
    {
      title: "Slack-native capture",
      description: "Open from App Home or /teammato."
    },
    {
      title: "Anonymous by default",
      description: "Views and exports respect k-anonymity."
    },
    {
      title: "SBI-guided clarity",
      description: "Behavior & Impact required; fewer rants, more signal."
    },
    {
      title: "Weekly digests",
      description: "Scheduled summaries in Slack; \"Send Sample Now\" for kickoffs."
    },
    {
      title: "K-safe analytics",
      description: "Daily aggregates; no plaintext message fields."
    },
    {
      title: "Retention & legal hold",
      description: "Purge by policy; freeze for compliance; export without ciphertext fields."
    }
  ];

  return (
    <section className="mx-auto max-w-6xl px-6 py-14">
      <h2 className="text-2xl font-semibold mb-6" data-testid="text-product-title">What you get with Teammato</h2>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {features.map((feature, i) => (
          <div 
            key={i}
            className="rounded-2xl border bg-background p-5"
            data-testid={`card-feature-${i}`}
          >
            <div className="font-medium text-base" data-testid={`text-feature-title-${i}`}>
              {feature.title}
            </div>
            <div className="mt-1 text-sm text-muted-foreground" data-testid={`text-feature-desc-${i}`}>
              {feature.description}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function PrivacyEnforced() {
  const facts = [
    "Encrypt per org (AEAD) at rest; TLS in transit.",
    "Don't log IPs/UA in feedback tables; never log plaintext message text.",
    "Isolate by tenant (RLS) across all content.",
    "Control retention & legal hold; export without ciphertext."
  ];

  return (
    <section className="mx-auto max-w-6xl px-6 py-14">
      <h2 className="text-2xl font-semibold mb-6" data-testid="text-privacy-title">How we protect people</h2>
      
      <div className="flex flex-wrap gap-3">
        {facts.map((fact, i) => (
          <div 
            key={i}
            className="rounded-full border bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900 px-4 py-2 text-sm text-emerald-700 dark:text-emerald-400"
            data-testid={`pill-privacy-${i}`}
          >
            {fact}
          </div>
        ))}
      </div>

      <p className="mt-4 text-xs text-muted-foreground" data-testid="text-privacy-note">
        We also auto-flag risky content (PII/harassment) before release.
      </p>
    </section>
  );
}

function LowTouchOps() {
  const chips = [
    "14-day full-feature trial; read-only after expiry until upgrade.",
    "Pro at $99/mo or $999/yr; Scale bands for larger workspaces.",
    "Email support; no custom SLAs or on-prem."
  ];

  return (
    <section className="mx-auto max-w-6xl px-6 py-14">
      <div className="rounded-3xl border bg-muted/40 p-6 md:p-8">
        <h2 className="text-2xl font-semibold" data-testid="text-ops-title">Simple to buy, simple to run</h2>
        <p className="mt-3 text-muted-foreground leading-relaxed" data-testid="text-ops-description">
          Self-serve install, trial-first, and one product for everyone. We scale by seat bands—features stay the same, operations stay lean.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          {chips.map((chip, i) => (
            <div 
              key={i}
              className="rounded-full border bg-background px-4 py-2 text-sm"
              data-testid={`chip-ops-${i}`}
            >
              {chip}
            </div>
          ))}
        </div>

        <div className="mt-6">
          <a 
            href="/pricing" 
            className="text-sm text-emerald-600 hover:underline underline-offset-4"
            data-testid="link-view-pricing"
          >
            View pricing
          </a>
        </div>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section className="mx-auto max-w-6xl px-6 pb-20 pt-14">
      <div className="text-center">
        <div className="flex flex-wrap items-center justify-center gap-3">
          <a 
            href="/api/slack/install?plan=pro_250" 
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-medium text-white hover:bg-emerald-700"
            data-testid="button-cta-add-to-slack"
          >
            <WhiteSlackLogo className="h-4 w-4" />
            Add to Slack
          </a>
          <a 
            href="/pricing" 
            className="rounded-xl border px-6 py-3 text-sm text-muted-foreground hover:bg-muted"
            data-testid="button-cta-pricing"
          >
            View pricing
          </a>
          <span className="text-muted-foreground">·</span>
          <a 
            href="/trust" 
            className="rounded-xl border px-6 py-3 text-sm text-muted-foreground hover:bg-muted"
            data-testid="button-cta-trust"
          >
            Read the Trust page
          </a>
        </div>
      </div>
    </section>
  );
}

function WhiteSlackLogo({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 127 127" className={className} aria-hidden fill="currentColor">
      <path d="M27.2 80c0 7.3-5.9 13.2-13.2 13.2C6.7 93.2.8 87.3.8 80c0-7.3 5.9-13.2 13.2-13.2h13.2V80zm6.6 0c0-7.3 5.9-13.2 13.2-13.2 7.3 0 13.2 5.9 13.2 13.2v33c0 7.3-5.9 13.2-13.2 13.2-7.3 0-13.2-5.9-13.2-13.2V80z"/>
      <path d="M47 27c-7.3 0-13.2-5.9-13.2-13.2C33.8 6.5 39.7.6 47 .6c7.3 0 13.2 5.9 13.2 13.2V27H47zm0 6.7c7.3 0 13.2 5.9 13.2 13.2 0 7.3-5.9 13.2-13.2 13.2H13.9C6.6 60.1.7 54.2.7 46.9c0-7.3 5.9-13.2 13.2-13.2H47z"/>
      <path d="M99.9 46.9c0-7.3 5.9-13.2 13.2-13.2 7.3 0 13.2 5.9 13.2 13.2 0 7.3-5.9 13.2-13.2 13.2H99.9V46.9zm-6.6 0c0 7.3-5.9 13.2-13.2 13.2-7.3 0-13.2-5.9-13.2-13.2V13.8C66.9 6.5 72.8.6 80.1.6c7.3 0 13.2 5.9 13.2 13.2v33.1z"/>
      <path d="M80.1 99.8c7.3 0 13.2 5.9 13.2 13.2 0 7.3-5.9 13.2-13.2 13.2-7.3 0-13.2-5.9-13.2-13.2V99.8h13.2zm0-6.6c-7.3 0-13.2-5.9-13.2-13.2 0-7.3 5.9-13.2 13.2-13.2h33.1c7.3 0 13.2 5.9 13.2 13.2 0 7.3-5.9 13.2-13.2 13.2H80.1z"/>
    </svg>
  );
}
