import * as React from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { apiRequest } from "@/lib/queryClient";

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header authorizeUrl="/api/slack/install" signinUrl="/api/slack/install" transparent={false} />
      <main id="main">
        <Hero />
        <SelfServe />
        <ContactForm />
        <FooterStrip />
      </main>
      <Footer />
    </div>
  );
}

/* ------------------------ HERO ------------------------ */

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(1100px_360px_at_50%_-60px,rgba(16,185,129,0.10),transparent)]" />
      <div className="mx-auto max-w-6xl px-6 pb-10 pt-16 md:pt-20">
        <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground" data-testid="text-contact-async">Async only</p>
        <h1 className="mt-1 text-4xl font-semibold tracking-tight md:text-5xl" data-testid="text-contact-title">
          Get answers—without a meeting
        </h1>
        <p className="mt-3 max-w-2xl text-lg text-muted-foreground" data-testid="text-contact-subtitle">
          We publish docs, artifacts, and pricing so you can move fast. Still stuck? Send us a note and we'll reply by email.
        </p>

        {/* quick search → /faq?query=... */}
        <SearchToFAQ />
      </div>
    </section>
  );
}

function SearchToFAQ() {
  const [q, setQ] = React.useState("");
  return (
    <form
      className="mt-6 max-w-xl"
      onSubmit={(e) => {
        e.preventDefault();
        const url = q.trim() ? `/faq?query=${encodeURIComponent(q.trim())}` : "/faq";
        window.location.href = url;
      }}
    >
      <div className="flex items-center gap-2">
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search privacy, pricing, exports, k-threshold, billing…"
          className="w-full rounded-xl border bg-background px-3 py-3 text-base shadow-[0_1px_0_rgba(0,0,0,0.06)] focus:outline-none focus:ring-2 focus:ring-emerald-500"
          aria-label="Search FAQs"
          data-testid="input-search-faq"
        />
        <button
          type="submit"
          className="rounded-xl bg-emerald-600 px-4 py-3 text-sm font-medium text-white hover:bg-emerald-700"
          data-testid="button-search-faq"
        >
          Search
        </button>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Tip: most questions are answered in our FAQ and Trust pages.
      </p>
    </form>
  );
}

/* ------------------------ SELF-SERVE ------------------------ */

function SelfServe() {
  const cards = [
    {
      title: "Trust & Security",
      sub: "K-anonymity, encryption, retention, exports—auditor-ready.",
      href: "/trust",
      tag: "security docs",
    },
    {
      title: "Pricing",
      sub: "Simple bands by workspace size. Annual saves 2 months.",
      href: "/pricing",
      tag: "plans & billing",
    },
    {
      title: "FAQ",
      sub: "Install, scopes, thresholds, roles, exports, troubleshooting.",
      href: "/faq",
      tag: "answers",
    },
    {
      title: "Status",
      sub: "Uptime and incidents in real time.",
      href: "https://status.teammato.com",
      tag: "availability",
    },
    {
      title: "DPA",
      sub: "Download our Data Processing Addendum.",
      href: "/Teammato_DPA.pdf",
      tag: "legal",
    },
    {
      title: "Subprocessors",
      sub: "Current list, notified on changes.",
      href: "/subprocessors",
      tag: "legal",
    },
  ];

  return (
    <section className="mx-auto max-w-6xl px-6 pb-8">
      <div className="rounded-3xl border bg-muted/40 p-6 md:p-8">
        <h2 className="text-xl font-semibold" data-testid="text-self-serve-title">Before you write us</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Most teams finish evaluation without contacting us. These links solve 90% of requests:
        </p>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {cards.map((c) => (
            <a
              key={c.title}
              href={c.href}
              className="group rounded-2xl border bg-background p-5 transition hover:shadow-sm"
              data-testid={`link-${c.title.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <div className="flex items-center justify-between">
                <div className="text-base font-medium">{c.title}</div>
                <span className="rounded-full bg-foreground/5 px-2 py-1 text-xs text-foreground/70">{c.tag}</span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{c.sub}</p>
            </a>
          ))}
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          We don't offer live demos or phone support. Everything is async and document-driven.
        </p>
      </div>
    </section>
  );
}

/* ------------------------ CONTACT FORM ------------------------ */

function ContactForm() {
  const [topic, setTopic] = React.useState<Topic>("security");
  const [email, setEmail] = React.useState("");
  const [msg, setMsg] = React.useState("");
  const [sent, setSent] = React.useState<"idle" | "ok" | "err">("idle");
  const [loading, setLoading] = React.useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await apiRequest("POST", "/api/contact", { topic, email, message: msg });
      setSent("ok");
      setMsg("");
    } catch {
      setSent("err");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mx-auto max-w-6xl px-6 pb-16">
      <div className="grid items-start gap-6 md:grid-cols-12">
        {/* Copy column */}
        <div className="md:col-span-5">
          <h2 className="text-xl font-semibold" data-testid="text-form-title">Still need help?</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            We reply by email—no meetings. If you prefer, write us directly:
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <a href="mailto:security@teammato.com" className="rounded-xl border px-3 py-1.5 text-sm hover:bg-muted" data-testid="link-email-security">
              security@teammato.com
            </a>
            <a href="mailto:privacy@teammato.com" className="rounded-xl border px-3 py-1.5 text-sm hover:bg-muted" data-testid="link-email-privacy">
              privacy@teammato.com
            </a>
            <a href="mailto:contact@teammato.com" className="rounded-xl border px-3 py-1.5 text-sm hover:bg-muted" data-testid="link-email-contact">
              contact@teammato.com
            </a>
          </div>

          <div className="mt-6 rounded-2xl border bg-background p-4 text-sm">
            <p className="font-medium">No meetings needed</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
              <li>Security artifacts and DPA are downloadable—no NDA required.</li>
              <li>Pricing and plans are public; upgrades/downgrades are self-serve.</li>
              <li>Most issues are answered in the FAQ. We'll point you to the exact doc if needed.</li>
            </ul>
          </div>
        </div>

        {/* Form column */}
        <div className="md:col-span-7">
          <form
            onSubmit={submit}
            className="rounded-3xl border bg-background p-6 shadow-[0_1px_0_rgba(0,0,0,0.06)]"
          >
            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-1">
                <label className="text-sm font-medium">Topic</label>
                <select
                  value={topic}
                  onChange={(e) => setTopic(e.target.value as Topic)}
                  className="mt-1 w-full rounded-xl border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  data-testid="select-topic"
                >
                  <option value="security">Security review / questionnaire</option>
                  <option value="privacy">Privacy / data rights</option>
                  <option value="billing">Billing / receipts</option>
                  <option value="incident">Report an incident</option>
                  <option value="product">Product feedback</option>
                  <option value="other">Other</option>
                </select>
                <TopicTip topic={topic} />
              </div>

              <div className="md:col-span-1">
                <label className="text-sm font-medium">Email</label>
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="mt-1 w-full rounded-xl border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  data-testid="input-email"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-sm font-medium">How can we help?</label>
                <textarea
                  required
                  value={msg}
                  onChange={(e) => setMsg(e.target.value)}
                  rows={6}
                  placeholder="Share context so we can get you the right doc or fix quickly—no zoom required."
                  className="mt-1 w-full resize-y rounded-xl border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  data-testid="textarea-message"
                />
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between">
              <div className="text-xs text-muted-foreground">
                We respond asynchronously by email. No calls or live chat.
              </div>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
                data-testid="button-submit"
              >
                {loading ? "Sending…" : "Send message"}
              </button>
            </div>

            {sent === "ok" && (
              <p className="mt-3 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700 ring-1 ring-emerald-200" data-testid="text-success">
                Thanks! We'll reply by email. In the meantime, the FAQ and Trust pages might have what you need.
              </p>
            )}
            {sent === "err" && (
              <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-200" data-testid="text-error">
                Something went wrong. Email us at contact@teammato.com and we'll help.
              </p>
            )}
          </form>
        </div>
      </div>
    </section>
  );
}

/* ------------------------ FOOTER STRIP ------------------------ */

function FooterStrip() {
  return (
    <section className="mx-auto max-w-6xl px-6 pb-20">
      <div className="grid items-center gap-4 rounded-3xl border bg-muted/40 p-6 md:grid-cols-12 md:p-8">
        <div className="md:col-span-8">
          <h3 className="text-xl font-semibold" data-testid="text-footer-title">Know before you contact</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            We don't schedule calls. Everything is designed to be self-serve and async. If you need something not covered, we'll help by email.
          </p>
        </div>
        <div className="md:col-span-4">
          <div className="flex gap-2 md:justify-end">
            <a href="/faq" className="inline-flex items-center justify-center rounded-xl border px-4 py-2 text-sm hover:bg-muted" data-testid="button-faq">
              Read FAQs
            </a>
            <a href="/trust" className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700" data-testid="button-trust">
              Trust &amp; Security
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------ HELPERS ------------------------ */

type Topic = "security" | "privacy" | "billing" | "incident" | "product" | "other";

function TopicTip({ topic }: { topic: Topic }) {
  const tip = {
    security:
      "Looking for SOC2-like artifacts, SCCs, or a DPA? You can download them on the Trust page—no NDA or meeting required.",
    privacy:
      "Data subject request? Email privacy@teammato.com. Most privacy answers are in the Trust and FAQ pages.",
    billing:
      "Invoices and plan changes are self-serve in the Billing Portal. If you're stuck, describe the issue and include your workspace name.",
    incident:
      "If you believe you've found a security issue, email security@teammato.com with steps to reproduce.",
    product:
      "Feature ideas and feedback are welcome. If something feels confusing, tell us where you were and what you expected.",
    other:
      "Share context so we can point you to the right doc or fix quickly—no meetings required.",
  }[topic];
  return <p className="mt-2 text-xs text-muted-foreground">{tip}</p>;
}
