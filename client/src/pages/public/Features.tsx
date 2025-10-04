import { useState } from "react";
import SlackPreviewAnimated from "@/components/SlackPreviewAnimated";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header authorizeUrl="/api/slack/install" signinUrl="/api/slack/install" transparent={false} />
      <main id="main">
        <Hero />
        <Pillars />
        <ProductShowcase />
        <SafetyRow />
        <AdminStrip />
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
      <div className="mx-auto max-w-6xl px-6 pb-12 pt-16 md:pt-20">
        <header className="grid items-center gap-10 md:grid-cols-12">
          <div className="md:col-span-7">
            <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground" data-testid="text-hero-label">What you get</p>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight md:text-5xl" data-testid="text-hero-title">
              Anonymous feedback that leaders can act on
            </h1>
            <p className="mt-3 max-w-xl text-lg text-muted-foreground" data-testid="text-hero-subtitle">
              Slack-native prompts roll up into weekly, k-anonymous themes—so teams see patterns, not people.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <a href="/api/slack/install" className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-700" data-testid="button-add-to-slack">
                <WhiteSlackLogo className="h-4 w-4" />
                Add to Slack
              </a>
              <a href="/trust" className="rounded-xl border px-5 py-2.5 text-sm hover:bg-muted" data-testid="button-trust">Trust &amp; security</a>
            </div>
          </div>

          <div className="md:col-span-5">
            <SlackPreviewAnimated />
          </div>
        </header>
      </div>
    </section>
  );
}

function Pillars() {
  const data = [
    {
      title: "Post where work happens",
      blurb: "No new app. People type /teammato anywhere in Slack and keep moving.",
      tag: "frictionless",
    },
    {
      title: "Themes, not people",
      blurb: "We summarize to k-anonymous topics and suppress small-n across views & exports.",
      tag: "privacy by default",
    },
    {
      title: "Weekly decisions",
      blurb: "Monday digests show what's trending—so you can prioritize and close the loop.",
      tag: "drives action",
    },
  ];
  return (
    <section className="mx-auto max-w-6xl px-6 py-14">
      <div className="grid gap-4 md:grid-cols-3">
        {data.map((d, i) => (
          <article key={d.title} className="rounded-2xl border bg-background p-6 shadow-[0_1px_0_rgba(0,0,0,0.06)]" data-testid={`card-pillar-${i}`}>
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold" data-testid={`text-pillar-title-${i}`}>{d.title}</h3>
              <span className="rounded-full bg-foreground/5 px-2 py-1 text-xs text-foreground/70" data-testid={`text-pillar-tag-${i}`}>{d.tag}</span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground" data-testid={`text-pillar-blurb-${i}`}>{d.blurb}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function ProductShowcase() {
  const [active, setActive] = useState<"digests" | "moderation" | "analytics">("digests");
  return (
    <section className="relative">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <header className="mb-4 text-center">
          <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground" data-testid="text-showcase-label">See it in action</p>
          <h2 className="mt-1 text-3xl font-semibold tracking-tight md:text-4xl" data-testid="text-showcase-title">From posts → themes → decisions</h2>
        </header>

        <div className="grid items-start gap-8 md:grid-cols-12">
          <aside className="md:col-span-4">
            <nav className="grid gap-2">
              {[
                { key: "digests", title: "Weekly digests", blurb: "Clean summaries, sent on your cadence." },
                { key: "moderation", title: "Protective rails", blurb: "Small-n suppression + gentle phrasing tips." },
                { key: "analytics", title: "Theme analytics", blurb: "Track topics over time—never identities." },
              ].map((t) => {
                const is = active === (t.key as any);
                return (
                  <button
                    key={t.key}
                    onClick={() => setActive(t.key as any)}
                    className={[
                      "rounded-2xl p-4 text-left ring-1 ring-black/5 transition",
                      is ? "bg-background shadow" : "bg-muted hover:bg-muted/70",
                    ].join(" ")}
                    aria-pressed={is}
                    data-testid={`button-showcase-${t.key}`}
                  >
                    <div className="text-base font-semibold">{t.title}</div>
                    <div className="text-sm text-muted-foreground">{t.blurb}</div>
                  </button>
                );
              })}
            </nav>
          </aside>

          <div className="md:col-span-8">
            <div className="relative overflow-hidden rounded-3xl border bg-background p-6 shadow-[0_1px_0_rgba(0,0,0,0.06),0_24px_48px_-24px_rgba(0,0,0,0.25)]" data-testid="panel-showcase-preview">
              {active === "digests" && <PreviewDigests />}
              {active === "moderation" && <PreviewModeration />}
              {active === "analytics" && <PreviewAnalytics />}

              <div className="pointer-events-none absolute -inset-8 -z-10 rounded-[2rem] bg-gradient-to-tr from-emerald-200/30 via-transparent to-transparent blur-2xl" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function SafetyRow() {
  const items = [
    { title: "K-anonymous by default", sub: "No small-n views or exports." },
    { title: "Ciphertext at rest", sub: "Plaintext is never stored." },
    { title: "No PII in logs", sub: "Scrubbed at ingestion." },
    { title: "Org-scoped isolation", sub: "Strict row-level security." },
  ];
  return (
    <section className="mx-auto max-w-6xl px-6 py-12">
      <div className="rounded-3xl border bg-muted/40 p-6 md:p-8">
        <h3 className="text-xl font-semibold" data-testid="text-safety-title">Trust, built-in</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          {items.map((i, idx) => (
            <div key={i.title} className="rounded-2xl border bg-background p-4" data-testid={`card-safety-${idx}`}>
              <div className="text-base font-medium" data-testid={`text-safety-item-title-${idx}`}>{i.title}</div>
              <div className="mt-1 text-sm text-muted-foreground" data-testid={`text-safety-item-sub-${idx}`}>{i.sub}</div>
            </div>
          ))}
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          Need the longer version? See <a className="underline underline-offset-4" href="/trust" data-testid="link-trust">Trust &amp; Security</a>.
        </p>
      </div>
    </section>
  );
}

function AdminStrip() {
  const cards = [
    { title: "Retention controls", sub: "30/90/365 or custom; legal hold freezes deletion." },
    { title: "Exports (thresholded)", sub: "CSV obeys the same k rules as the UI." },
    { title: "Workspace roles", sub: "Owner/Admin/Analyst—no one can see identities." },
  ];
  return (
    <section className="mx-auto max-w-6xl px-6 pb-14">
      <div className="grid gap-3 md:grid-cols-3">
        {cards.map((c, i) => (
          <div key={c.title} className="rounded-2xl border bg-background p-5" data-testid={`card-admin-${i}`}>
            <div className="text-base font-semibold" data-testid={`text-admin-title-${i}`}>{c.title}</div>
            <div className="mt-1 text-sm text-muted-foreground" data-testid={`text-admin-sub-${i}`}>{c.sub}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section className="relative isolate overflow-hidden bg-neutral-950 text-neutral-50">
      <div className="mx-auto max-w-6xl px-6 py-16 md:py-20">
        <div className="grid items-center gap-8 md:grid-cols-12">
          <div className="md:col-span-7">
            <h2 className="text-4xl font-semibold tracking-tight sm:text-5xl" data-testid="text-cta-title">
              Turn anonymous feedback into weekly decisions.
            </h2>
            <p className="mt-3 max-w-xl text-lg text-neutral-300" data-testid="text-cta-subtitle">
              Install in Slack in minutes. K-anonymous digests your leaders can act on—no plaintext stored.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <a href="/api/slack/install" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-6 py-3 text-sm font-medium text-neutral-950 hover:bg-emerald-400" data-testid="button-cta-install">
                <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
                  <rect x="5" y="10" width="5" height="3" rx="1.5" fill="currentColor" opacity="0.9" />
                  <rect x="14" y="10" width="5" height="3" rx="1.5" fill="currentColor" opacity="0.9" />
                  <rect x="10" y="5" width="3" height="5" rx="1.5" fill="currentColor" opacity="0.9" />
                  <rect x="10" y="14" width="3" height="5" rx="1.5" fill="currentColor" opacity="0.9" />
                </svg>
                Add to Slack
              </a>
              <a href="/pricing" className="rounded-2xl border border-neutral-800 px-6 py-3 text-sm text-neutral-200 hover:bg-neutral-900" data-testid="button-cta-pricing">
                See pricing
              </a>
            </div>
          </div>
          <div className="md:col-span-5">
            <MiniDigestCard />
          </div>
        </div>
      </div>
    </section>
  );
}

function PreviewDigests() {
  const themes = [
    { t: "Workload & scope creep", posts: 14 },
    { t: "Decision clarity", posts: 9 },
    { t: "Release coordination", posts: 7 },
  ];
  return (
    <div>
      <header className="mb-3 text-sm text-muted-foreground">Weekly digest · #team-general</header>
      <div className="grid gap-3">
        {themes.map((x) => (
          <div key={x.t} className="rounded-2xl border p-4" data-testid={`item-digest-${x.posts}`}>
            <div className="flex items-center justify-between">
              <div className="text-base font-medium">{x.t}</div>
              <span className="rounded-full bg-foreground/5 px-2.5 py-1 text-xs">{x.posts} posts</span>
            </div>
            <div className="mt-1 text-xs text-muted-foreground">Meets k-threshold</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PreviewModeration() {
  return (
    <div>
      <header className="mb-3 text-sm text-muted-foreground">Protective rails</header>
      <ul className="grid gap-3 md:grid-cols-2">
        {[
          ["Enforce k-anonymity", "Hide topics with n < k"],
          ["Sensitive phrase hints", "Encourage constructive language"],
          ["No small-n exports", "Thresholds apply to CSV"],
          ["Channel-aware prompts", "Works anywhere in Slack"],
        ].map(([h, s], i) => (
          <li key={h} className="rounded-2xl border p-4" data-testid={`item-moderation-${i}`}>
            <div className="font-medium">{h}</div>
            <div className="text-xs text-muted-foreground">{s}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PreviewAnalytics() {
  return (
    <div>
      <header className="mb-3 text-sm text-muted-foreground">Theme analytics</header>
      <div className="rounded-2xl border p-4" data-testid="card-analytics-preview">
        <div className="h-40 w-full rounded-xl bg-gradient-to-b from-foreground/10 to-transparent" />
        <p className="mt-2 text-xs text-muted-foreground">Track topics over time—never individuals.</p>
      </div>
    </div>
  );
}

function MiniDigestCard() {
  return (
    <div className="rounded-3xl border border-neutral-800 bg-neutral-900/60 p-6 shadow-[0_1px_0_rgba(255,255,255,0.06),0_28px_60px_-28px_rgba(0,0,0,0.6)]" data-testid="card-mini-digest">
      <div className="text-sm text-neutral-400">Weekly digest · #team-general</div>
      <div className="mt-4 space-y-3">
        {[
          { title: "Workload & scope creep", posts: 14 },
          { title: "Decision clarity", posts: 9 },
          { title: "Release coordination", posts: 7 },
        ].map((t) => (
          <div key={t.title} className="rounded-2xl border border-neutral-800 bg-neutral-900 p-4">
            <div className="flex items-center justify-between">
              <div className="text-neutral-100">{t.title}</div>
              <span className="rounded-full bg-neutral-800 px-2.5 py-1 text-xs text-neutral-300">{t.posts} posts</span>
            </div>
            <div className="mt-1 text-xs text-neutral-500">Meets k-threshold</div>
          </div>
        ))}
      </div>
      <div className="mt-4 text-xs text-neutral-500">Exports respect the same threshold.</div>
    </div>
  );
}

function WhiteSlackLogo({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <rect x="5" y="10" width="5" height="3" rx="1.5" fill="white" opacity="0.9" />
      <rect x="14" y="10" width="5" height="3" rx="1.5" fill="white" opacity="0.9" />
      <rect x="10" y="5" width="3" height="5" rx="1.5" fill="white" opacity="0.9" />
      <rect x="10" y="14" width="3" height="5" rx="1.5" fill="white" opacity="0.9" />
    </svg>
  );
}
