import { buildSlackAuthorizeUrl } from "@/lib/slackInstall";
import { 
  Plug, 
  MessageSquareText, 
  LineChart, 
  ShieldCheck, 
  Lock, 
  EyeOff, 
  CheckCircle2,
  MailCheck,
  BarChart3,
  Settings2,
  Ban,
  Inbox
} from "lucide-react";
import { useState } from "react";

const STEPS = [
  {
    id: 1,
    title: "Install to Slack",
    body:
      "One click. Scopes: commands, chat:write. You're ready in minutes.",
    icon: Plug,
    meta: "60s setup",
  },
  {
    id: 2,
    title: "Post anonymously",
    body:
      "Anyone types /teammato in any channel. We handle the rest.",
    icon: MessageSquareText,
    meta: "works anywhere",
    command: "/teammato Your message…",
  },
  {
    id: 3,
    title: "Get weekly themes",
    body:
      "We group related posts and send a digest that drives action.",
    icon: LineChart,
    meta: "auto digests",
  },
];

type Theme = { id: number; label: string; count: number };

const THEMES: Theme[] = [
  { id: 1, label: "Workload & scope creep", count: 12 },
  { id: 2, label: "Decision clarity", count: 9 },
  { id: 3, label: "Release coordination", count: 7 },
  { id: 4, label: "On-call burnout", count: 2 }, // small-n example
];

type TabKey = "digests" | "moderation" | "analytics" | "admin";

const TABS: {
  key: TabKey;
  icon: React.ElementType;
  title: string;
  blurb: string;
}[] = [
  {
    key: "digests",
    icon: MailCheck,
    title: "Weekly digests that drive action",
    blurb:
      "We group related posts and send a clean summary—only if it meets the k-threshold.",
  },
  {
    key: "moderation",
    icon: ShieldCheck,
    title: "Moderation that protects people",
    blurb:
      "Flag risky phrasing, auto-hide small-n topics, and keep things constructive.",
  },
  {
    key: "analytics",
    icon: BarChart3,
    title: "Theme analytics, not people analytics",
    blurb:
      "Track topics and movement over time—without identity or guesswork.",
  },
  {
    key: "admin",
    icon: Settings2,
    title: "Admin controls that fit your policies",
    blurb:
      "Retention windows, legal hold, and exports that honor the same thresholds.",
  },
];

export default function Landing() {
  const [k, setK] = useState<number>(5);
  const [enforceK, setEnforceK] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<TabKey>("digests");

  const visible = (t: Theme) => !enforceK || t.count >= k;
  const slackAuthUrl = buildSlackAuthorizeUrl();

  return (
    <div className="min-h-screen bg-background">
      {/* HERO */}
      <section className="relative">
        <div className="mx-auto max-w-6xl px-6 py-24 lg:py-28">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            {/* Left copy */}
            <div>
              <p className="font-mono text-sm uppercase tracking-wide text-muted-foreground">
                Slack-first feedback
              </p>
              <h1 className="mt-3 text-5xl font-semibold tracking-tight sm:text-6xl">
                Make it safe to speak up—right in Slack.
              </h1>
              <p className="mt-5 max-w-xl text-lg text-muted-foreground">
                Post with <span className="font-mono">/teammato</span>. We store ciphertext
                and enforce k-anonymity by default—so people share and teams act.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <a
                  href={slackAuthUrl}
                  className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-6 py-3 text-white shadow hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
                  data-testid="button-add-to-slack"
                >
                  Add to Slack
                </a>
                <a
                  href="/demo"
                  className="inline-flex items-center justify-center rounded-xl border px-6 py-3 text-base hover:bg-muted"
                  data-testid="button-demo"
                >
                  See admin demo
                </a>
              </div>

              <p className="mt-4 text-sm text-muted-foreground">
                Scopes: <span className="font-mono">commands, chat:write</span>
              </p>
            </div>

            {/* Right visual */}
            <div className="relative">
              <div className="mx-auto w-full max-w-[520px] rounded-2xl border bg-background p-5 shadow-[0_1px_0_rgba(0,0,0,0.06),0_20px_40px_-20px_rgba(0,0,0,0.12)]">
                <div className="rounded-xl bg-neutral-900 p-5 text-neutral-50">
                  <div className="flex items-center gap-2 text-xs text-neutral-400">
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                    # team-general
                  </div>
                  <div className="mt-4 font-mono text-sm">
                    <span className="opacity-70">/teammato</span> It's hard to ask for help when deadlines pile up…
                  </div>

                  {/* tiny "system" replies */}
                  <div className="mt-5 space-y-2 text-xs text-neutral-300">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      Anonymity on · meets k-threshold
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-neutral-500" />
                      Added to weekly digest
                    </div>
                  </div>
                </div>
              </div>

              {/* subtle background shape */}
              <div className="pointer-events-none absolute -inset-x-10 -bottom-10 -top-10 -z-10 rounded-[3rem] bg-gradient-to-b from-emerald-50 to-transparent dark:from-emerald-950/20" />
            </div>
          </div>
        </div>
      </section>

      {/* STEPS */}
      <section className="relative">
        {/* subtle background tint that echoes the hero */}
        <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-emerald-50/40 to-transparent dark:from-emerald-950/20" />

        <div className="mx-auto max-w-6xl px-6 py-24 lg:py-28">
          <header className="mb-12 text-center">
            <p className="font-mono text-sm uppercase tracking-wide text-muted-foreground">
              How it works
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
              Three simple steps—no new app to learn
            </h2>
          </header>

          {/* Steps rail */}
          <ol className="grid gap-6 md:grid-cols-3">
            {STEPS.map((step, idx) => (
              <li key={step.id} className="group relative">
                {/* connecting rail on desktop */}
                {idx < STEPS.length - 1 && (
                  <span
                    aria-hidden
                    className="pointer-events-none absolute left-[calc(50%+2rem)] top-12 hidden h-[2px] w-[calc(100%-4rem)] bg-gradient-to-r from-foreground/20 to-transparent md:block"
                  />
                )}

                <div className="h-full rounded-2xl bg-background p-6 shadow-[0_1px_0_rgba(0,0,0,0.06),0_20px_40px_-20px_rgba(0,0,0,0.12)] ring-1 ring-black/5 transition-[transform,box-shadow] group-hover:-translate-y-0.5 group-hover:shadow-[0_1px_0_rgba(0,0,0,0.06),0_28px_60px_-28px_rgba(0,0,0,0.25)]">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-foreground/5">
                      <step.icon className="h-6 w-6 text-foreground/80" />
                    </div>
                    <span className="rounded-full bg-foreground/5 px-3 py-1 text-xs font-medium text-foreground/70">
                      {step.meta}
                    </span>
                  </div>

                  <h3 className="mt-4 text-xl font-medium">{step.title}</h3>
                  <p className="mt-2 text-base text-muted-foreground">
                    {step.body}
                  </p>

                  {/* risky-but-fun: inline slash-command chip for step 2 */}
                  {step.command && (
                    <div className="mt-4 inline-flex items-center gap-2 rounded-xl border bg-muted px-3 py-2 font-mono text-sm text-foreground/80">
                      <span className="opacity-70">{step.command}</span>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ol>

          {/* small note under the rail */}
          <p className="mt-8 text-center text-sm text-muted-foreground">
            Don't change how you work—keep everything in Slack.
          </p>
        </div>
      </section>

      {/* SPLIT PROOF */}
      <section className="relative isolate">
        {/* soft background shape */}
        <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-emerald-50/40 to-transparent dark:from-emerald-950/20" />

        <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-6 py-24 lg:grid-cols-2 lg:py-28">
          {/* LEFT: copy */}
          <div>
            <p className="font-mono text-sm uppercase tracking-wide text-muted-foreground">
              Why it's safe
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
              We show <span className="underline decoration-emerald-400">themes</span>, not people.
            </h2>
            <p className="mt-4 max-w-prose text-lg text-muted-foreground">
              Posts are stored as ciphertext and summarized into k-anonymous themes. Views and exports
              suppress any topic with fewer than <span className="font-mono">k</span> posts—so nobody can "read between the lines."
            </p>

            <ul className="mt-6 space-y-3 text-base">
              <li className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 text-emerald-600" />
                <span><strong>k-anonymous by default</strong> — small-n topics stay hidden.</span>
              </li>
              <li className="flex items-start gap-3">
                <Lock className="mt-0.5 h-5 w-5 text-emerald-600" />
                <span><strong>Ciphertext storage</strong> — plaintext is never stored.</span>
              </li>
              <li className="flex items-start gap-3">
                <EyeOff className="mt-0.5 h-5 w-5 text-emerald-600" />
                <span><strong>No PII in logs</strong> — scrubbed at ingestion.</span>
              </li>
            </ul>

            {/* controls */}
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  className="size-4 accent-emerald-600"
                  checked={enforceK}
                  onChange={() => setEnforceK((v) => !v)}
                />
                <span className="text-sm">Enforce k-anonymity</span>
              </label>

              <div className="flex items-center gap-3 rounded-xl border bg-background px-3 py-2">
                <span className="text-sm text-muted-foreground">k threshold</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setK((n) => Math.max(2, n - 1))}
                    className="rounded-lg border px-2 py-1 text-sm hover:bg-muted"
                  >
                    −
                  </button>
                  <span className="w-6 text-center font-mono">{k}</span>
                  <button
                    onClick={() => setK((n) => Math.min(12, n + 1))}
                    className="rounded-lg border px-2 py-1 text-sm hover:bg-muted"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: ThemeSummaryCard */}
          <div className="relative">
            <div className="rounded-3xl border bg-background p-6 shadow-[0_1px_0_rgba(0,0,0,0.06),0_28px_60px_-28px_rgba(0,0,0,0.25)]">
              <header className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-medium">Weekly digest</h3>
                  <p className="text-sm text-muted-foreground">Top themes for #team-general</p>
                </div>
                <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:ring-emerald-800">
                  <CheckCircle2 className="h-4 w-4" /> Meets k-threshold
                </span>
              </header>

              <div className="mt-5 grid gap-3">
                {THEMES.map((t) => (
                  <div
                    key={t.id}
                    className={`group rounded-2xl border p-4 transition-colors ${
                      visible(t) ? "bg-white dark:bg-neutral-900" : "bg-muted"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-base font-medium">
                        {visible(t) ? t.label : "Hidden until it meets k"}
                      </div>
                      <div className="inline-flex items-center gap-2">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs ${
                            visible(t)
                              ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:ring-emerald-800"
                              : "bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-400"
                          }`}
                        >
                          {visible(t) ? `${t.count} posts` : `needs ≥ ${k}`}
                        </span>
                      </div>
                    </div>

                    {/* hint row */}
                    <div className="mt-2 text-xs text-muted-foreground">
                      {visible(t)
                        ? "Included in analytics and exports."
                        : "Suppressed from views and exports to protect contributors."}
                    </div>
                  </div>
                ))}
              </div>

              <footer className="mt-5 text-xs text-muted-foreground">
                Exported data respects the same threshold.
              </footer>
            </div>

            {/* decorative glow */}
            <div className="pointer-events-none absolute -inset-6 -z-10 rounded-[2rem] bg-gradient-to-tr from-emerald-200/30 via-transparent to-transparent blur-2xl dark:from-emerald-900/20" />
          </div>
        </div>
      </section>

      {/* FEATURE SHOWCASE */}
      <section className="relative">
        <div className="mx-auto grid max-w-6xl grid-cols-1 items-start gap-10 px-6 py-24 md:grid-cols-12 lg:py-28">
          {/* LEFT: Big tabs */}
          <aside className="md:col-span-5">
            <header className="mb-6">
              <p className="font-mono text-sm uppercase tracking-wide text-muted-foreground">
                What you get
              </p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
                The essentials—done right
              </h2>
            </header>

            <nav className="space-y-2">
              {TABS.map(({ key, icon: Icon, title, blurb }) => {
                const isActive = activeTab === key;
                return (
                  <button
                    key={key}
                    onClick={() => setActiveTab(key)}
                    className={[
                      "w-full rounded-2xl p-5 text-left transition-all",
                      "ring-1 ring-black/5 shadow-[0_1px_0_rgba(0,0,0,0.06),0_20px_40px_-20px_rgba(0,0,0,0.12)]",
                      isActive ? "bg-background" : "bg-muted hover:bg-muted/70",
                    ].join(" ")}
                    aria-pressed={isActive}
                  >
                    <div className="flex items-start gap-4">
                      <span
                        className={[
                          "flex h-11 w-11 flex-none items-center justify-center rounded-xl",
                          isActive ? "bg-emerald-600 text-white" : "bg-foreground/10 text-foreground/80",
                        ].join(" ")}
                      >
                        <Icon className="h-6 w-6" />
                      </span>
                      <div>
                        <h3 className="text-lg font-semibold leading-tight">{title}</h3>
                        <p className="mt-1 text-sm text-muted-foreground">{blurb}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </nav>
          </aside>

          {/* RIGHT: Preview panel */}
          <div className="md:col-span-7">
            <div className="relative overflow-hidden rounded-3xl border bg-background p-6 shadow-[0_1px_0_rgba(0,0,0,0.06),0_28px_60px_-28px_rgba(0,0,0,0.25)]">
              {activeTab === "digests" && <PreviewDigests />}
              {activeTab === "moderation" && <PreviewModeration />}
              {activeTab === "analytics" && <PreviewAnalytics />}
              {activeTab === "admin" && <PreviewAdmin />}

              {/* decorative glow */}
              <div className="pointer-events-none absolute -inset-8 -z-10 rounded-[2rem] bg-gradient-to-tr from-emerald-200/30 via-transparent to-transparent blur-2xl dark:from-emerald-900/20" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

/* ---------- Preview Components ---------- */

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:ring-emerald-800">
      {children}
    </span>
  );
}

function PreviewDigests() {
  return (
    <div>
      <header className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Inbox className="h-4 w-4" />
          Weekly digest · #team-general
        </div>
        <Tag>Meets k-threshold</Tag>
      </header>

      <div className="grid gap-3">
        {[
          { title: "Workload & scope creep", posts: 14 },
          { title: "Decision clarity", posts: 9 },
          { title: "Release coordination", posts: 7 },
        ].map((t) => (
          <div key={t.title} className="rounded-2xl border p-4">
            <div className="flex items-center justify-between">
              <div className="text-base font-medium">{t.title}</div>
              <span className="rounded-full bg-foreground/5 px-2.5 py-1 text-xs">
                {t.posts} posts
              </span>
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              Sent Mondays at 9am · Reply to comment in Slack
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PreviewModeration() {
  return (
    <div>
      <header className="mb-4 flex items-center justify-between">
        <div className="text-sm text-muted-foreground">Moderation rules</div>
        <Tag>Protects people</Tag>
      </header>

      <ul className="space-y-3">
        <li className="flex items-center justify-between rounded-2xl border p-4">
          <div>
            <div className="font-medium">Enforce k-anonymity</div>
            <p className="text-xs text-muted-foreground">Hide topics with <span className="font-mono">n &lt; k</span></p>
          </div>
          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
        </li>
        <li className="flex items-center justify-between rounded-2xl border p-4">
          <div>
            <div className="font-medium">Sensitive phrase detector</div>
            <p className="text-xs text-muted-foreground">Flag risky language for review</p>
          </div>
          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
        </li>
        <li className="flex items-center justify-between rounded-2xl border p-4">
          <div>
            <div className="font-medium">No small-n exports</div>
            <p className="text-xs text-muted-foreground">Suppress low counts in CSVs</p>
          </div>
          <Ban className="h-5 w-5 text-rose-600" />
        </li>
      </ul>
    </div>
  );
}

function PreviewAnalytics() {
  return (
    <div>
      <header className="mb-4 flex items-center justify-between">
        <div className="text-sm text-muted-foreground">Theme analytics</div>
        <Tag>Identity-free</Tag>
      </header>

      <div className="rounded-2xl border p-4">
        {/* lightweight faux chart */}
        <div className="h-40 w-full rounded-xl bg-gradient-to-b from-foreground/10 to-transparent" />
        <div className="mt-3 grid grid-cols-3 gap-3 text-xs">
          {["Workload", "Clarity", "Release"].map((l) => (
            <div key={l} className="rounded-lg bg-foreground/5 px-2 py-1 text-center">
              {l}
            </div>
          ))}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Track topics over time—never individuals.
        </p>
      </div>
    </div>
  );
}

function PreviewAdmin() {
  return (
    <div>
      <header className="mb-4 flex items-center justify-between">
        <div className="text-sm text-muted-foreground">Admin controls</div>
        <Tag>Policy-ready</Tag>
      </header>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-2xl border p-4">
          <div className="font-medium">Retention</div>
          <p className="mt-1 text-xs text-muted-foreground">30/90/365 days or custom</p>
        </div>
        <div className="rounded-2xl border p-4">
          <div className="font-medium">Legal hold</div>
          <p className="mt-1 text-xs text-muted-foreground">Freeze digests & posts</p>
        </div>
        <div className="rounded-2xl border p-4">
          <div className="font-medium">Exports</div>
          <p className="mt-1 text-xs text-muted-foreground">CSV respects thresholds</p>
        </div>
        <div className="rounded-2xl border p-4">
          <div className="font-medium">Workspace roles</div>
          <p className="mt-1 text-xs text-muted-foreground">Owner, admin, analyst</p>
        </div>
      </div>
    </div>
  );
}
