import { useEffect, useMemo, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

type Topic =
  | "getting-started"
  | "product"
  | "privacy"
  | "security"
  | "exports"
  | "roles"
  | "billing"
  | "retention"
  | "grid"
  | "threshold"
  | "troubleshooting";

type QA = {
  id: string;
  q: string;
  a: string;
  topics: Topic[];
};

const TOPIC_LABEL: Record<Topic, string> = {
  "getting-started": "Getting started",
  product: "Product",
  privacy: "Privacy",
  security: "Security",
  exports: "Exports",
  roles: "Roles",
  billing: "Billing",
  retention: "Retention",
  grid: "Slack Grid",
  threshold: "K-threshold",
  troubleshooting: "Troubleshooting",
};

const QAS: QA[] = [
  {
    id: "install",
    q: "How do we install Teammato?",
    a: "Click \"Add to Slack,\" approve the requested scopes, then choose the workspace. You can post anonymously in any channel immediately with /teammato.",
    topics: ["getting-started", "product"],
  },
  {
    id: "scopes",
    q: "Which Slack scopes do you request?",
    a: "We use commands and chat:write. We do not request channel history or user identity scopes.",
    topics: ["getting-started", "privacy", "security"],
  },
  {
    id: "firstpost",
    q: "How do people post anonymously?",
    a: "Type /teammato in Slack, write your message, and submit. We store ciphertext and remove identity before analyzing.",
    topics: ["getting-started", "product", "privacy"],
  },
  {
    id: "themes",
    q: "What shows up in weekly digests?",
    a: "Only k-anonymous themes (topics that meet the minimum count). No names, no raw messages. You'll see trending themes and counts.",
    topics: ["product", "threshold"],
  },
  {
    id: "moderation",
    q: "How do you prevent harmful posts?",
    a: "We apply in-flow hints for phrasing, small-n warnings, and admin moderation tools. Topics that don't meet k are suppressed.",
    topics: ["product", "threshold"],
  },
  {
    id: "analytics",
    q: "Do you track individuals over time?",
    a: "No. Analytics are theme-level only. We do not expose identity or allow individual-level timelines.",
    topics: ["product", "privacy"],
  },
  {
    id: "plaintext",
    q: "Do you store plaintext anywhere?",
    a: "No. Payloads are encrypted at rest. Operational logs exclude message content and PII.",
    topics: ["privacy", "security"],
  },
  {
    id: "pii",
    q: "Do logs contain PII?",
    a: "No. We scrub PII at ingestion. Request/response logs are metadata-only.",
    topics: ["privacy", "security"],
  },
  {
    id: "org-rls",
    q: "How is data isolated between customers?",
    a: "Row-level security bounds every query by org_id. Each workspace's data is isolated at the database level.",
    topics: ["security"],
  },
  {
    id: "k-what",
    q: "What is the k-threshold?",
    a: "K is the minimum number of posts required for a topic to appear in UI or exports. Topics with count less than k are hidden everywhere.",
    topics: ["threshold", "privacy"],
  },
  {
    id: "k-custom",
    q: "Can we change the k-threshold?",
    a: "Yes. Admins can set k based on risk tolerance. The value applies consistently across UI and exports.",
    topics: ["threshold", "product"],
  },
  {
    id: "retention",
    q: "How do retention and legal hold work?",
    a: "Admins can set 30/90/365 or custom retention. Legal hold freezes deletion. Threshold rules still apply during hold.",
    topics: ["retention", "security"],
  },
  {
    id: "exports",
    q: "Can we export data?",
    a: "Yes - all exports (threads, comments, audit logs) respect the same k-threshold and exclude suppressed topics.",
    topics: ["exports", "threshold"],
  },
  {
    id: "export-technical",
    q: "How do you technically enforce k-anonymity in exports?",
    a: "Database views calculate a renderState field based on participant count vs k-threshold. Export endpoints query these views and filter WHERE renderState='visible', ensuring only k-safe data is exported. This provides belt-and-suspenders protection at the database level.",
    topics: ["exports", "security", "threshold"],
  },
  {
    id: "roles",
    q: "Who can see what?",
    a: "Owner/Admin manage settings and exports; Analysts view themes. No role can access identities.",
    topics: ["roles", "product"],
  },
  {
    id: "install",
    q: "How do we install?",
    a: "Click Add to Slack; after install, you'll start your 14-day trial.",
    topics: ["getting-started"],
  },
  {
    id: "trial",
    q: "Do we need a card?",
    a: "Yes—added after install; no charge until trial ends.",
    topics: ["billing"],
  },
  {
    id: "seatcap",
    q: "How do seat caps work?",
    a: "We price by Slack workspace members. We warn at 90% of your cap, allow a 7-day grace window up to 110%, then pause new submissions until you upgrade.",
    topics: ["billing"],
  },
  {
    id: "security-privacy",
    q: "Security & privacy?",
    a: "K-anonymity protection, XChaCha20 encryption, no plaintext storage. See our Trust page for full details.",
    topics: ["security", "privacy"],
  },
  {
    id: "clutter-slack",
    q: "Will this clutter Slack?",
    a: "No—anonymous posts are lightweight; weekly digests summarize activity.",
    topics: ["product", "getting-started"],
  },
  {
    id: "what-counts-seats",
    q: "What counts toward seats?",
    a: "Slack workspace members; we'll warn at 90% and give a 7-day grace if you go over.",
    topics: ["billing"],
  },
  {
    id: "annual",
    q: "Do you offer annual billing?",
    a: "Yes - annual is 10× monthly (2 months free). You can change term in the billing portal anytime.",
    topics: ["billing"],
  },
  {
    id: "grid",
    q: "Do you support Slack Enterprise Grid?",
    a: "Yes - install per workspace and pick an appropriate cap. Org-wide billing can be arranged case-by-case for very large deployments.",
    topics: ["grid", "billing"],
  },
  {
    id: "slash-not-found",
    q: "Slack says the slash command isn't available.",
    a: "Confirm the app is installed to that workspace and channel. If the issue persists, re-authorize via \"Add to Slack.\"",
    topics: ["troubleshooting", "getting-started"],
  },
  {
    id: "no-digest",
    q: "We aren't receiving digests.",
    a: "Check that your digest schedule is enabled and the channel target exists. Also ensure k greater than 0 themes exist during the period.",
    topics: ["troubleshooting", "product"],
  },
  {
    id: "export-empty",
    q: "Exports are empty or missing topics.",
    a: "Exports observe the same k-threshold. If topics don't meet k, they won't appear in CSV.",
    topics: ["troubleshooting", "exports", "threshold"],
  },
];

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header authorizeUrl="/api/slack/install" signinUrl="/api/slack/install" transparent={false} />
      <main id="main">
        <Hero />
        <FAQSearch />
        <ContactStrip />
      </main>
      <Footer />
    </div>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(1100px_360px_at_50%_-60px,rgba(16,185,129,0.10),transparent)]" />
      <div className="mx-auto max-w-6xl px-6 pb-10 pt-16 md:pt-20">
        <h1 className="text-4xl font-semibold tracking-tight md:text-5xl" data-testid="text-faq-title">
          Frequently asked questions
        </h1>
        <p className="mt-3 max-w-2xl text-lg text-muted-foreground" data-testid="text-faq-subtitle">
          Straight answers on install, privacy, k-thresholds, exports, billing, and more. Can't find it? Ping us—no sales pitch.
        </p>
      </div>
    </section>
  );
}

function FAQSearch() {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<Topic[]>([]);

  useEffect(() => {
    const url = new URL(window.location.href);
    const needle = url.searchParams.get("id") || url.searchParams.get("open") || window.location.hash.replace("#", "");
    if (!needle) return;
    const el = document.getElementById(`faq-${needle}`);
    if (el) {
      el.setAttribute("open", "true");
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return QAS.filter((item) => {
      const matchesQ =
        !q ||
        item.q.toLowerCase().includes(q) ||
        item.a.toLowerCase().includes(q) ||
        item.topics.some((t) => TOPIC_LABEL[t].toLowerCase().includes(q));
      const matchesTopic = active.length === 0 || active.every((t) => item.topics.includes(t));
      return matchesQ && matchesTopic;
    });
  }, [query, active]);

  const grouped = useMemo(() => {
    const map = new Map<Topic, QA[]>();
    for (const qa of results) {
      const key = qa.topics[0];
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(qa);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [results]);

  const toggle = (t: Topic) =>
    setActive((curr) => (curr.includes(t) ? curr.filter((x) => x !== t) : [...curr, t]));

  return (
    <section className="mx-auto max-w-6xl px-6 pb-16">
      <div className="mb-6 grid gap-4 md:grid-cols-12">
        <div className="md:col-span-7">
          <div className="relative">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search privacy, exports, uninstall, billing…"
              className="w-full rounded-xl border bg-background py-3 pl-3 pr-3 text-base shadow-[0_1px_0_rgba(0,0,0,0.06)] focus:outline-none focus:ring-2 focus:ring-emerald-500"
              aria-label="Search FAQs"
              data-testid="input-faq-search"
            />
          </div>
        </div>
        <div className="md:col-span-5">
          <div className="flex flex-wrap gap-2">
            {(Object.keys(TOPIC_LABEL) as Topic[]).map((t) => {
              const activeChip = active.includes(t);
              return (
                <button
                  key={t}
                  onClick={() => toggle(t)}
                  className={[
                    "rounded-full px-3 py-1.5 text-sm ring-1 transition",
                    activeChip
                      ? "bg-emerald-600 text-white ring-emerald-600"
                      : "bg-muted text-foreground/80 ring-black/10 hover:bg-muted/70",
                  ].join(" ")}
                  aria-pressed={activeChip}
                  data-testid={`button-topic-${t}`}
                >
                  {TOPIC_LABEL[t]}
                </button>
              );
            })}
            {active.length > 0 && (
              <button
                onClick={() => setActive([])}
                className="rounded-full px-3 py-1.5 text-sm text-foreground/70 underline underline-offset-4"
                data-testid="button-clear-filters"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {results.length === 0 ? (
        <div className="rounded-2xl border bg-background p-6 text-center text-muted-foreground" data-testid="text-no-results">
          Nothing found. Try another term or clear filters.
        </div>
      ) : (
        <div className="space-y-8">
          {grouped.map(([topic, items]) => (
            <section key={topic} aria-labelledby={`sec-${topic}`}>
              <h2 id={`sec-${topic}`} className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground" data-testid={`text-section-${topic}`}>
                {TOPIC_LABEL[topic]}
              </h2>
              <div className="divide-y rounded-2xl border bg-background">
                {items.map((qa) => (
                  <details key={qa.id} id={`faq-${qa.id}`} className="group">
                    <summary className="flex cursor-pointer list-none items-start justify-between gap-4 px-5 py-4 text-left hover:bg-muted/50 focus:bg-muted/50" data-testid={`summary-${qa.id}`}>
                      <div className="flex-1">
                        <h3 className="text-base font-medium leading-tight">{qa.q}</h3>
                        <div className="mt-1 flex flex-wrap gap-2">
                          {qa.topics.map((t) => (
                            <span key={t} className="rounded-full bg-foreground/5 px-2.5 py-1 text-xs text-foreground/70">
                              {TOPIC_LABEL[t]}
                            </span>
                          ))}
                        </div>
                      </div>
                      <span aria-hidden className="ml-2 h-5 w-5 rounded-full bg-foreground/10 transition group-open:rotate-45" />
                    </summary>
                    <div className="px-5 pb-5 text-sm text-muted-foreground" data-testid={`content-${qa.id}`}>
                      <p className="max-w-prose leading-relaxed">{qa.a}</p>
                    </div>
                  </details>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </section>
  );
}

function ContactStrip() {
  return (
    <section className="mx-auto max-w-6xl px-6 pb-24">
      <div className="grid items-center gap-4 rounded-3xl border bg-muted/40 p-6 md:grid-cols-12 md:p-8">
        <div className="md:col-span-8">
          <h3 className="text-xl font-semibold" data-testid="text-contact-title">Didn't find what you need?</h3>
          <p className="mt-1 text-sm text-muted-foreground" data-testid="text-contact-subtitle">
            We keep FAQs short—no sales pitch. If you've got a unique setup or a security review, we'll help.
          </p>
        </div>
        <div className="md:col-span-4">
          <div className="flex gap-2 md:justify-end">
            <a href="/contact" className="inline-flex items-center justify-center rounded-xl border px-4 py-2 text-sm hover:bg-muted" data-testid="button-contact">
              Contact us
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
