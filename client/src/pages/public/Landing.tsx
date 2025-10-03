import { buildSlackAuthorizeUrl } from "@/lib/slackInstall";
import { Plug, MessageSquareText, LineChart } from "lucide-react";

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

export default function Landing() {
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
    </div>
  );
}
