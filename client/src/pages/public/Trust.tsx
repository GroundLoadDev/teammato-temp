import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function TrustPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header authorizeUrl="/api/slack/install" signinUrl="/api/slack/install" transparent={false} />
      <main id="main">
        <TrustHero />
        <AtAGlance />
        <ControlsGrid />
        <DataFlow />
        <KAnon />
        <Compliance />
        <ContactStrip />
      </main>
      <Footer />
    </div>
  );
}

function TrustHero() {
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(1100px_360px_at_50%_-60px,rgba(16,185,129,0.10),transparent)]" />
      <div className="mx-auto max-w-6xl px-6 pb-8 pt-16 md:pt-20">
        <h1 className="text-4xl font-semibold tracking-tight md:text-5xl" data-testid="text-trust-title">Trust &amp; Security</h1>
        <p className="mt-3 max-w-2xl text-lg text-muted-foreground" data-testid="text-trust-subtitle">
          Privacy by default. Ciphertext at rest with per-org keys (XChaCha20-Poly1305). K-anonymity (k=5) across UI and exports. Built for audits and peace of mind.
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          <Badge>k-anonymous by default</Badge>
          <Badge>ciphertext at rest</Badge>
          <Badge>no PII in logs</Badge>
          <Badge>org-scoped isolation</Badge>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <a href="/dpa" className="rounded-xl border px-4 py-2 text-sm hover:bg-muted" data-testid="link-dpa">View DPA</a>
        </div>
      </div>
    </section>
  );
}

function AtAGlance() {
  const items = [
    {
      title: "Ciphertext at rest",
      sub: "Per-org 256-bit keys (XChaCha20-Poly1305 AEAD); message content never stored in plaintext. Encryption is mandatory with monitoring.",
      icon: Lock,
    },
    {
      title: "K+2 buffer protection",
      sub: "Topics visible only at k+2 participants (not k) with differential privacy noise (ε=0.5) to prevent exact-k attribution.",
      icon: Shield,
    },
    {
      title: "Timing attack defense",
      sub: "All notifications delayed 5-30s random jitter. Per-thread hashing eliminates cross-topic correlation.",
      icon: Clock,
    },
    {
      title: "Population enforcement",
      sub: "Minimum 10 active users required before feedback submission to prevent small-org re-identification.",
      icon: Users,
    },
    {
      title: "Multi-tenant isolation",
      sub: "Row-level security (RLS) bounds queries by org_id. No cross-org data access.",
      icon: Isolate,
    },
    {
      title: "Export safety",
      sub: "Exports use k-safe views; timestamps rounded to day-level; only summaries and metadata.",
      icon: FileShield,
    },
  ];
  return (
    <section className="mx-auto max-w-6xl px-6 py-10">
      <div className="grid gap-4 md:grid-cols-3">
        {items.map((i) => (
          <div key={i.title} className="rounded-2xl border bg-background p-6" data-testid={`card-${i.title.toLowerCase().replace(/\s+/g, '-')}`}>
            <i.icon className="h-6 w-6 text-emerald-600" />
            <div className="mt-3 text-base font-semibold">{i.title}</div>
            <div className="mt-1 text-sm text-muted-foreground">{i.sub}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function ControlsGrid() {
  const cards = [
    { title: "Retention controls", sub: "30/90/365 or custom; Admin-controlled retention. Legal hold freezes deletion if required." },
    { title: "Roles & access", sub: "Owner/Admin/Analyst; least privilege; no one sees identities." },
    { title: "Audit logging", sub: "Admin activity & export events logged with timestamp and actor role." },
    { title: "Secret management", sub: "App credentials and keys stored in a managed KMS; rotation policy applied." },
    { title: "Vuln management", sub: "Automated scanning and regular third-party penetration testing." },
    { title: "SRE monitoring", sub: "Continuous monitoring and a documented incident-response program." },
  ];
  return (
    <section className="mx-auto max-w-6xl px-6 pb-4">
      <h2 className="mb-4 text-xl font-semibold" data-testid="text-controls-title">Security controls</h2>
      <div className="grid gap-3 md:grid-cols-3">
        {cards.map((c) => (
          <div key={c.title} className="rounded-2xl border bg-background p-5" data-testid={`card-${c.title.toLowerCase().replace(/\s+/g, '-')}`}>
            <div className="text-base font-medium">{c.title}</div>
            <div className="mt-1 text-sm text-muted-foreground">{c.sub}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function DataFlow() {
  const steps = [
    { h: "1) Post in Slack", s: "User types /teammato; identity never leaves Slack." },
    { h: "2) Process & encrypt", s: "Filter message PII, then encrypt at rest (per-org DEKs; XChaCha20-Poly1305 AEAD)." },
    { h: "3) Theme only", s: "Topics aggregated; items below k are suppressed." },
    { h: "4) Digest & analytics", s: "Weekly summaries and charts—no identities, ever." },
  ];
  return (
    <section className="mx-auto max-w-6xl px-6 py-10">
      <div className="rounded-3xl border bg-muted/40 p-6 md:p-8">
        <h2 className="text-xl font-semibold" data-testid="text-dataflow-title">How data flows</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          {steps.map((x, i) => (
            <div key={x.h} className="relative rounded-2xl border bg-background p-4" data-testid={`step-${i + 1}`}>
              <div className="text-sm font-medium">{x.h}</div>
              <div className="mt-1 text-sm text-muted-foreground">{x.s}</div>
              {i < steps.length - 1 && (
                <span className="pointer-events-none absolute right-[-14px] top-1/2 hidden h-6 w-6 -translate-y-1/2 rotate-45 border-r border-t md:block" />
              )}
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          Note: Slack Enterprise Grid installs are per-workspace. Org-wide billing is available by arrangement.
        </p>
      </div>
    </section>
  );
}

function KAnon() {
  const rows = [
    { label: "K+2 Buffer", rule: "Topics visible only when participant count ≥ k+2 (not just k) to prevent exact-k attribution in small teams." },
    { label: "Differential Privacy", rule: "Statistical noise (Laplace, ε=0.5) added to all participant counts to prevent exact inference." },
    { label: "Population Floor", rule: "Minimum 10 active users required before feedback submission to prevent small-org re-identification." },
    { label: "UI views", rule: "Topics with count < k+2 are hidden across all dashboards." },
    { label: "Exports", rule: "Database views calculate renderState; only k-safe data (threads, comments, audit logs) can be exported. Timestamps rounded to day-level." },
    { label: "Timing Protection", rule: "All notifications delayed 5-30s random jitter to prevent timing-based correlation attacks." },
  ];
  return (
    <section className="mx-auto max-w-6xl px-6 py-10">
      <div className="grid gap-6 md:grid-cols-12">
        <div className="md:col-span-6">
          <h2 className="text-xl font-semibold" data-testid="text-kanon-title">Multi-Layered Anonymity Protection (k=5 minimum, k+2 visibility)</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            We use multiple privacy techniques to protect anonymity. Beyond k-anonymity, we apply a k+2 buffer threshold, differential privacy noise, timing jitter, and per-thread hashing to prevent re-identification attacks. Users should still avoid self-identifying details in submissions.
          </p>
          <ul className="mt-4 space-y-2 text-sm">
            {rows.map((r) => (
              <li key={r.label} className="rounded-2xl border bg-background p-3" data-testid={`rule-${r.label.toLowerCase().replace(/\s+/g, '-')}`}>
                <div className="font-medium">{r.label}</div>
                <div className="text-muted-foreground">{r.rule}</div>
              </li>
            ))}
          </ul>
        </div>
        <div className="md:col-span-6">
          <div className="rounded-3xl border bg-background p-6 shadow-[0_1px_0_rgba(0,0,0,0.06),0_28px_60px_-28px_rgba(0,0,0,0.25)]" data-testid="card-kanon-example">
            <div className="text-sm text-muted-foreground">Example · #team-general</div>
            <div className="mt-3 space-y-2 text-sm">
              {[
                { t: "Workload & scope creep", n: 14, ok: true },
                { t: "Decision clarity", n: 9, ok: true },
                { t: "On-call burnout", n: 2, ok: false },
              ].map((x) => (
                <div key={x.t} className="flex items-center justify-between rounded-2xl border p-3" data-testid={`example-topic-${x.ok ? 'visible' : 'hidden'}`}>
                  <div className="font-medium">{x.ok ? x.t : "Hidden until it meets k"}</div>
                  <span className={`rounded-full px-2 py-0.5 text-xs ${x.ok ? "bg-foreground/5" : "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"}`}>
                    {x.ok ? `${x.n} posts` : "needs ≥ k"}
                  </span>
                </div>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">Exports mirror the same rule.</p>
          </div>
        </div>
      </div>
      <div className="mt-8 text-center">
        <p className="text-sm text-muted-foreground mb-3">
          Want to see how privacy protection works in practice?
        </p>
        <a
          href="/simulator"
          className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm hover:bg-muted"
          data-testid="link-simulator"
        >
          <Shield className="h-4 w-4" />
          Try the Anonymous Simulator
        </a>
      </div>
    </section>
  );
}

function Compliance() {
  const items = [
    {
      title: "SOC 2 controls",
      copy:
        "Designed to meet SOC 2 controls (independent audit planned). Controls implemented and continuously monitored.",
    },
    {
      title: "GDPR/CCPA compliance",
      copy:
        "Supports GDPR/CCPA compliance (DPA & SCCs available). Data subject request process and regional data residency options on request.",
    },
    {
      title: "Incident response",
      copy:
        "Documented runbooks, continuous monitoring, customer notification policy aligned with regulatory timelines.",
    },
    {
      title: "Business continuity",
      copy:
        "Automated backups, immutability windows, and periodic recovery tests in place.",
    },
  ];
  return (
    <section className="mx-auto max-w-6xl px-6 pb-12">
      <h2 className="mb-4 text-xl font-semibold" data-testid="text-compliance-title">Compliance posture</h2>
      <div className="divide-y rounded-2xl border bg-background">
        {items.map((it, i) => (
          <details key={it.title} className="group" data-testid={`compliance-${it.title.toLowerCase().replace(/\s+/g, '-')}`}>
            <summary className="cursor-pointer list-none px-5 py-4 hover:bg-muted/50">
              <span className="text-base font-medium">{it.title}</span>
            </summary>
            <div className="px-5 pb-5 text-sm text-muted-foreground">{it.copy}</div>
          </details>
        ))}
      </div>
    </section>
  );
}

function ContactStrip() {
  return (
    <section className="mx-auto max-w-6xl px-6 pb-20">
      <div className="grid items-center gap-4 rounded-3xl border bg-muted/40 p-6 md:grid-cols-12 md:p-8">
        <div className="md:col-span-8">
          <h3 className="text-xl font-semibold" data-testid="text-contact-title">Security questions or a review?</h3>
          <p className="mt-1 text-sm text-muted-foreground" data-testid="text-contact-subtitle">
            No sales pitches. Transparency over gatekeeping: all security documents are published here. Contact teammato if you need something custom. Note: Not designed for PHI, PCI primary account numbers, or other highly regulated data types.
          </p>
        </div>
        <div className="md:col-span-4">
          <div className="flex gap-2 md:justify-end">
            <a href="/contact" className="inline-flex items-center justify-center rounded-xl border px-4 py-2 text-sm hover:bg-muted" data-testid="button-contact">
              Contact security
            </a>
            <a href="/api/slack/install" className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700" data-testid="button-install">
              Add to Slack
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs text-foreground/80">
      <span className="h-2 w-2 rounded-full bg-emerald-500" />
      {children}
    </span>
  );
}

function Lock(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <rect x="4" y="10" width="16" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 10V8a4 4 0 1 1 8 0v2" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function Isolate(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <rect x="3" y="3" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <rect x="13" y="13" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M11 7h2M7 11v2" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function Shield(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <path d="M12 3l7 3v5c0 5-3.5 8.5-7 10C8.5 19.5 5 16 5 11V6l7-3z" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 12l2.5 2.5L16 9" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function FileShield(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9l-5-6z" stroke="currentColor" strokeWidth="1.5" />
      <path d="M14 3v6h6" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12 12l3 2v2c0 2-2 3-3 3s-3-1-3-3v-2l3-2z" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function Clock(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function Users(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <circle cx="9" cy="7" r="3" stroke="currentColor" strokeWidth="1.5" />
      <path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75M21 21v-2a4 4 0 0 0-3-3.85" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}
