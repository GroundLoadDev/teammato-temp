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
          Privacy by default. Encryption at rest. K-anonymity applied across UI and exports. Built for audits and peace of mind.
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          <Badge>k-anonymous by default</Badge>
          <Badge>ciphertext at rest</Badge>
          <Badge>no PII in logs</Badge>
          <Badge>org-scoped isolation</Badge>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <a href="/Teammato_DPA.pdf" download className="rounded-xl border px-4 py-2 text-sm hover:bg-muted" data-testid="link-dpa">Download DPA</a>
        </div>
      </div>
    </section>
  );
}

function AtAGlance() {
  const items = [
    {
      title: "End-to-end encryption at rest",
      sub: "XChaCha20-Poly1305 AEAD with per-org 256-bit keys; plaintext never stored.",
      icon: Lock,
    },
    {
      title: "Multi-tenant isolation",
      sub: "Row-level security (RLS) bounds queries by org_id.",
      icon: Isolate,
    },
    {
      title: "No PII in logs",
      sub: "Request/response logs scrub content & identifiers.",
      icon: Shield,
    },
    {
      title: "Export safety",
      sub: "Threads, comments, and audit logs enforce k-anonymity at the database level via view-based filtering.",
      icon: FileShield,
    },
  ];
  return (
    <section className="mx-auto max-w-6xl px-6 py-10">
      <div className="grid gap-4 md:grid-cols-4">
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
    { title: "Retention controls", sub: "30/90/365 or custom; legal hold freezes deletion." },
    { title: "Roles & access", sub: "Owner/Admin/Analyst; least privilege; no one sees identities." },
    { title: "Audit logging", sub: "Admin activity & export events logged with timestamp and actor role." },
    { title: "Secret management", sub: "App credentials and keys stored in a managed KMS; rotation policy applied." },
    { title: "Vuln management", sub: "Automated scanning and regular third-party penetration testing." },
    { title: "SRE monitoring", sub: "24×7 uptime monitoring and incident response procedures." },
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
    { h: "2) Process & encrypt", s: "Content filtered for PII, then encrypted at rest (XChaCha20-Poly1305 AEAD)." },
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
    { label: "UI views", rule: "Topics with count < k are hidden across all dashboards." },
    { label: "Exports", rule: "Database views calculate renderState; only k-safe data (threads, comments, audit logs) can be exported." },
    { label: "Search", rule: "Autocomplete and filters exclude topics below k." },
    { label: "Config", rule: "Admins can set k based on risk tolerance (org-level)." },
  ];
  return (
    <section className="mx-auto max-w-6xl px-6 py-10">
      <div className="grid gap-6 md:grid-cols-12">
        <div className="md:col-span-6">
          <h2 className="text-xl font-semibold" data-testid="text-kanon-title">K-anonymity, enforced everywhere</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            The long tail is where re-identification risk lives. We apply a minimum topic count (<em>k</em>) across UI and exports to prevent
            small-n inference. No identities are stored or exposed.
          </p>
          <ul className="mt-4 space-y-2 text-sm">
            {rows.map((r) => (
              <li key={r.label} className="rounded-2xl border bg-background p-3" data-testid={`rule-${r.label.toLowerCase()}`}>
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
    </section>
  );
}

function Compliance() {
  const items = [
    {
      title: "SOC 2 readiness",
      copy:
        "Controls aligned to SOC 2; annual third-party testing and continuous monitoring. Reports available under NDA.",
    },
    {
      title: "GDPR/CCPA",
      copy:
        "DPA, SCCs, and data subject request process. Regional data residency options on request.",
    },
    {
      title: "Incident response",
      copy:
        "Documented runbooks, 24×7 paging, customer notification policy aligned with regulatory timelines.",
    },
    {
      title: "Business continuity",
      copy:
        "Automated backups, immutability windows, and periodic recovery tests.",
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
            No sales pitches. Transparency over gatekeeping: all security documents are published here. Contact teammato if you need something custom.
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
