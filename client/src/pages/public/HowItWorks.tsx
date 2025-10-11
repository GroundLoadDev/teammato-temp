import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function HowItWorksPage() {
  const [mode, setMode] = useState<"human" | "tech">("human");

  return (
    <>
      <Header />
      <main id="main">
        <Hero mode={mode} setMode={setMode} />
        <StorySteps mode={mode} />
        <FlowRail mode={mode} />
        <PrivacyPoster mode={mode} />
        <UnderTheHood mode={mode} />
        <NotWhatWeDo mode={mode} />
        <CTA />
      </main>
      <Footer />
    </>
  );
}

/* ----------------------------- HERO ----------------------------- */

function Hero({ mode, setMode }: { mode: "human" | "tech"; setMode: (m: "human" | "tech") => void }) {
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(1200px_380px_at_50%_-80px,rgba(16,185,129,0.12),transparent)]" />
      <div className="mx-auto max-w-6xl px-6 pb-12 pt-16 md:pt-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">How Teammato works</h1>
            <p className="mt-3 max-w-2xl text-lg text-muted-foreground">
              A gentle way to speak up—and a safe way to listen. Built inside Slack, designed for privacy, and tuned for signal over noise.
            </p>
          </div>

          <div className="rounded-xl border bg-background p-1">
            <div className="flex">
              <button
                onClick={() => setMode("human")}
                className={`rounded-lg px-3 py-1.5 text-sm ${mode === "human" ? "bg-emerald-600 text-white" : "text-foreground/80 hover:bg-muted"}`}
                data-testid="button-mode-human"
              >
                For humans
              </button>
              <button
                onClick={() => setMode("tech")}
                className={`rounded-lg px-3 py-1.5 text-sm ${mode === "tech" ? "bg-emerald-600 text-white" : "text-foreground/80 hover:bg-muted"}`}
                data-testid="button-mode-tech"
              >
                For engineers
              </button>
            </div>
          </div>
        </div>

        {mode === "human" ? (
          <div className="mt-6 grid gap-3 md:grid-cols-3">
            {[
              { h: "Post in Slack", p: "Use /teammato when something's hard to say out loud. Share context; no names are shown anywhere." },
              { h: "Protected by design", p: "We scrub PII, encrypt message bodies, and hide small-n topics. No one can 'read between the lines.'" },
              { h: "Themes, not people", p: "Leaders see patterns and trends—never individuals. Actions follow the signal, not the speaker." },
            ].map((x) => (
              <div key={x.h} className="rounded-2xl border bg-background p-5">
                <div className="text-base font-semibold">{x.h}</div>
                <div className="mt-1 text-sm text-muted-foreground">{x.p}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-6 grid gap-3 md:grid-cols-3">
            {[
              { h: "Ingestion", p: "Slash command payload → PII scrub → AEAD encrypt (XChaCha20-Poly1305) with per-org 256-bit keys." },
              { h: "K-anonymity", p: "Database views enforce renderState='visible' only when participantCount ≥ k. No plaintext stored." },
              { h: "Signals", p: "Open-source embeddings + clustering (no LLM) produce weekly themes. Quotes shown only when ≥ k." },
            ].map((x) => (
              <div key={x.h} className="rounded-2xl border bg-background p-5">
                <div className="text-base font-semibold">{x.h}</div>
                <div className="mt-1 text-sm text-muted-foreground">{x.p}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

/* ----------------------------- STORY STEPS ----------------------------- */

function StorySteps({ mode }: { mode: "human" | "tech" }) {
  const humanItems = [
    {
      k: "1",
      h: "Post",
      sub: "A safe place to start",
      p: "People type /teammato in Slack. We nudge for clarity and tone, then accept the post anonymously.",
    },
    {
      k: "2",
      h: "Protect",
      sub: "Privacy is a feature",
      p: "We scrub PII, then encrypt message bodies at rest. Topics with fewer than k posts stay hidden in the UI and all exports.",
    },
    {
      k: "3",
      h: "Share",
      sub: "Themes over time",
      p: "Open-source embeddings group similar posts into themes—no LLM required. Leaders see patterns, but exports only include k-safe data.",
    },
  ];

  const techItems = [
    {
      k: "1",
      h: "Ingest",
      sub: "Slack → Database",
      p: "Slash command → PII regex scrub → XChaCha20-Poly1305 AEAD encryption → PostgreSQL with org-scoped RLS.",
    },
    {
      k: "2",
      h: "Enforce k",
      sub: "View-based filtering",
      p: "v_threads and v_comments calculate renderState based on participantCount. Exports query these views and filter WHERE renderState='visible'.",
    },
    {
      k: "3",
      h: "Export & Cluster",
      sub: "K-safe throughout",
      p: "All exports (threads, comments, audit) enforce k-anonymity at database level. Clustering uses MiniLM embeddings with c-TF-IDF keywording.",
    },
  ];

  const items = mode === "human" ? humanItems : techItems;

  return (
    <section className="mx-auto max-w-6xl px-6 py-10">
      <div className="grid gap-4 md:grid-cols-3">
        {items.map((s) => (
          <div key={s.k} className="group relative rounded-3xl border bg-background p-6">
            <div className="absolute -left-3 -top-3 grid h-8 w-8 place-items-center rounded-xl bg-emerald-600 text-sm font-medium text-white shadow">{s.k}</div>
            <div className="text-xl font-semibold">{s.h}</div>
            <div className="text-sm text-emerald-700">{s.sub}</div>
            <p className="mt-2 text-sm text-muted-foreground">{s.p}</p>
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-8 translate-y-1 rounded-b-3xl bg-gradient-to-t from-emerald-50/40 opacity-0 transition group-hover:opacity-100" />
          </div>
        ))}
      </div>
    </section>
  );
}

/* ----------------------------- FLOW RAIL ----------------------------- */

function FlowRail({ mode }: { mode: "human" | "tech" }) {
  const humanSteps = [
    { title: "Slack", text: "User posts via /teammato", hint: "identity stays in Slack" },
    { title: "Scrub", text: "PII filters at ingestion", hint: "no emails, IDs, @mentions" },
    { title: "Encrypt", text: "Bodies locked down", hint: "XChaCha20-Poly1305 AEAD" },
    { title: "Cluster", text: "Embeddings → themes", hint: "no LLM in the loop" },
    { title: "Digest", text: "Weekly themes & trends", hint: "quotes only when ≥ k" },
  ];

  const techSteps = [
    { title: "Slack API", text: "Slash command payload", hint: "OAuth v2 + Events API" },
    { title: "PII Scrub", text: "Regex + heuristics", hint: "emails · IDs · @mentions" },
    { title: "AEAD Encrypt", text: "XChaCha20-Poly1305", hint: "per-org 256-bit DEKs" },
    { title: "Embeddings", text: "MiniLM all-MiniLM-L6-v2", hint: "cosine clustering locally" },
    { title: "K-safe Export", text: "v_threads/v_comments views", hint: "renderState='visible' only" },
  ];

  const steps = mode === "human" ? humanSteps : techSteps;

  return (
    <section className="mx-auto max-w-6xl px-6 py-6">
      <div className="rounded-3xl border bg-muted/40 p-6 md:p-8">
        <h2 className="text-xl font-semibold">Data flow, at a glance</h2>
        <div className="mt-5 grid items-stretch gap-3 md:grid-cols-5">
          {steps.map((s, i) => (
            <div key={s.title} className="relative rounded-2xl border bg-background p-4">
              <div className="text-sm font-medium">{s.title}</div>
              <div className="text-sm text-muted-foreground">{s.text}</div>
              <div className="mt-2 rounded-lg bg-foreground/5 px-2 py-1 text-xs text-foreground/70">{s.hint}</div>
              {i < steps.length - 1 && (
                <span className="pointer-events-none absolute -right-2 top-1/2 hidden h-4 w-4 -translate-y-1/2 rotate-45 border-r border-t md:block" />
              )}
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          {mode === "human"
            ? "Plaintext bodies are never stored. k-anonymity enforced across UI and exports."
            : "Database views calculate renderState; exports filter WHERE renderState='visible' for belt-and-suspenders k-safety."}
        </p>
      </div>
    </section>
  );
}

/* ----------------------------- PRIVACY POSTER ----------------------------- */

function PrivacyPoster({ mode }: { mode: "human" | "tech" }) {
  const humanBadges = [
    { h: "K-anonymous by default", p: "Topics below k are hidden across dashboards. All exports (threads, comments, audit logs) respect the same k-threshold." },
    { h: "AEAD encryption at rest", p: "XChaCha20-Poly1305 with per-org 256-bit keys. Row-level isolation on queries." },
    { h: "Export safety guaranteed", p: "Database views calculate which data is k-safe. Exports filter at the database level to ensure only visible data is included." },
  ];

  const techBadges = [
    { h: "Database-level k-enforcement", p: "v_threads/v_comments calculate renderState. Export endpoints query views and filter WHERE renderState='visible' for belt-and-suspenders protection." },
    { h: "XChaCha20-Poly1305 AEAD", p: "Per-org 256-bit DEKs wrapped locally. Transient in-memory decryption for UI/exports only." },
    { h: "Three k-safe export types", p: "Threads, comments, and audit logs all enforce k-anonymity via database views. No bypass routes exist." },
  ];

  const badges = mode === "human" ? humanBadges : techBadges;

  return (
    <section className="mx-auto max-w-6xl px-6 py-10">
      <div className="rounded-3xl border bg-background p-6 md:p-8">
        <div className="grid gap-4 md:grid-cols-3">
          {badges.map((b) => (
            <div key={b.h} className="rounded-2xl border bg-muted/40 p-5">
              <div className="inline-flex items-center gap-2 text-sm">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className="font-medium">{b.h}</span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{b.p}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          Learn more on our <a className="underline underline-offset-4" href="/trust">Trust &amp; Security</a> page, or <a className="underline underline-offset-4" href="/simulator">try our interactive simulator</a> to see anonymity in action.
        </p>
      </div>
    </section>
  );
}

/* ----------------------------- UNDER THE HOOD ----------------------------- */

function UnderTheHood({ mode }: { mode: "human" | "tech" }) {
  const [open, setOpen] = useState(false);

  const humanRows = [
    { label: "Scrub & validate", detail: "We remove emails, phone numbers, Slack IDs, and @mentions before storage." },
    { label: "Encrypt bodies", detail: "Message bodies are encrypted at rest. Per-org keys are wrapped locally and cached briefly." },
    { label: "Cluster without LLM", detail: "Open-source embeddings group similar posts. Labels come from keyword analysis." },
    { label: "k-enforcement everywhere", detail: "Quotes and sub-themes only show when counts ≥ k in UI, exports, and digests—no exceptions." },
    { label: "Export safety", detail: "Database determines what's k-safe before any export. Threads, comments, and audit logs all respect k-threshold." },
  ];

  const techRows = [
    { label: "PII scrub", detail: "Regex + heuristics remove emails, phone numbers, Slack user IDs, and @mentions at ingestion." },
    { label: "XChaCha20-Poly1305", detail: "Message bodies encrypted with per-org 256-bit DEKs. Keys wrapped with master KEK, cached 5min." },
    { label: "MiniLM embeddings", detail: "@xenova/transformers (ONNX runtime) + agglomerative clustering. c-TF-IDF for keywording." },
    { label: "Database view enforcement", detail: "v_threads and v_comments calculate renderState based on participantCount vs k-threshold at query time." },
    { label: "K-safe export routes", detail: "All three export types (threads, comments, audit) query views and filter WHERE renderState='visible'. Belt-and-suspenders protection." },
  ];

  const rows = mode === "human" ? humanRows : techRows;

  return (
    <section className="mx-auto max-w-6xl px-6 py-6">
      <div className="rounded-3xl border bg-muted/40 p-6 md:p-8">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Under the hood</h2>
          <button
            onClick={() => setOpen((v) => !v)}
            className="rounded-lg border px-3 py-1.5 text-sm hover:bg-muted"
            data-testid="button-toggle-hood"
          >
            {open ? "Hide details" : "Show details"}
          </button>
        </div>
        {open && (
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {rows.map((r) => (
              <div key={r.label} className="rounded-2xl border bg-background p-5">
                <div className="text-sm font-medium">{r.label}</div>
                <div className="mt-1 text-sm text-muted-foreground">{r.detail}</div>
              </div>
            ))}
          </div>
        )}
        {!open && (
          <p className="mt-3 text-sm text-muted-foreground">
            {mode === "human"
              ? "Lightweight, open-source stack by default. No vendor LLMs required."
              : "CPU-based ML pipeline. Zero external API calls for theming. Database-level k-anonymity enforcement."}
          </p>
        )}
      </div>
    </section>
  );
}

/* ----------------------------- NOT WHAT WE DO ----------------------------- */

function NotWhatWeDo({ mode }: { mode: "human" | "tech" }) {
  const humanItems = [
    { h: "No people dashboards", p: "We never show individual timelines or identity traces—only themes." },
    { h: "No dark patterns", p: 'No "gotcha" surprises. Controls and exports reflect the same k-rules.' },
    { h: "No surprise vendors", p: "We keep third-party access limited. Encryption and theming run locally." },
  ];

  const techItems = [
    { h: "No identity linking", p: "Daily-rotating submitter hashes prevent cross-topic correlation. No identity graphs." },
    { h: "No k-bypass routes", p: "All exports (threads, comments, audit) enforce renderState='visible' at database level." },
    { h: "No external ML", p: "Embeddings and clustering run on CPU via ONNX runtime. Zero LLM API calls for theming." },
  ];

  const items = mode === "human" ? humanItems : techItems;

  return (
    <section className="mx-auto max-w-6xl px-6 py-8">
      <div className="grid gap-3 md:grid-cols-3">
        {items.map((x) => (
          <div key={x.h} className="rounded-2xl border bg-background p-5">
            <div className="text-base font-semibold">{x.h}</div>
            <div className="mt-1 text-sm text-muted-foreground">{x.p}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ----------------------------- CTA ----------------------------- */

function WhiteSlackLogo({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 127 127" className={className} aria-hidden fill="white">
      <path d="M27.2 80c0 7.3-5.9 13.2-13.2 13.2C6.7 93.2.8 87.3.8 80c0-7.3 5.9-13.2 13.2-13.2h13.2V80zm6.6 0c0-7.3 5.9-13.2 13.2-13.2 7.3 0 13.2 5.9 13.2 13.2v33c0 7.3-5.9 13.2-13.2 13.2-7.3 0-13.2-5.9-13.2-13.2V80z"/>
      <path d="M47 27c-7.3 0-13.2-5.9-13.2-13.2C33.8 6.5 39.7.6 47 .6c7.3 0 13.2 5.9 13.2 13.2V27H47zm0 6.7c7.3 0 13.2 5.9 13.2 13.2 0 7.3-5.9 13.2-13.2 13.2H13.9C6.6 60.1.7 54.2.7 46.9c0-7.3 5.9-13.2 13.2-13.2H47z"/>
      <path d="M99.9 46.9c0-7.3 5.9-13.2 13.2-13.2 7.3 0 13.2 5.9 13.2 13.2 0 7.3-5.9 13.2-13.2 13.2H99.9V46.9zm-6.6 0c0 7.3-5.9 13.2-13.2 13.2-7.3 0-13.2-5.9-13.2-13.2V13.8C66.9 6.5 72.8.6 80.1.6c7.3 0 13.2 5.9 13.2 13.2v33.1z"/>
      <path d="M80.1 99.8c7.3 0 13.2 5.9 13.2 13.2 0 7.3-5.9 13.2-13.2 13.2-7.3 0-13.2-5.9-13.2-13.2V99.8h13.2zm0-6.6c-7.3 0-13.2-5.9-13.2-13.2 0-7.3 5.9-13.2 13.2-13.2h33.1c7.3 0 13.2 5.9 13.2 13.2 0 7.3-5.9 13.2-13.2 13.2H80.1z"/>
    </svg>
  );
}

function CTA() {
  return (
    <section className="mx-auto max-w-6xl px-6 pb-20">
      <div className="grid items-center gap-5 rounded-3xl border bg-gradient-to-br from-emerald-600 to-emerald-700 p-6 text-white md:grid-cols-12 md:p-10">
        <div className="md:col-span-8">
          <h3 className="text-2xl font-semibold">Ready to try Teammato in Slack?</h3>
          <p className="mt-1 text-sm text-emerald-50">
            Anonymous feedback, encrypted at rest. Themes without the noise. k-anonymity enforced everywhere.
          </p>
        </div>
        <div className="md:col-span-4">
          <div className="flex gap-2 md:justify-end">
            <a
              href="/pricing"
              className="inline-flex items-center justify-center rounded-xl bg-white px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-50"
              data-testid="button-cta-pricing"
            >
              See pricing
            </a>
            <a
              href="/api/slack/install"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/40 bg-emerald-700/20 px-4 py-2 text-sm font-medium backdrop-blur hover:bg-emerald-700/30"
              data-testid="button-cta-slack"
            >
              <WhiteSlackLogo className="h-4 w-4" />
              Add to Slack
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
