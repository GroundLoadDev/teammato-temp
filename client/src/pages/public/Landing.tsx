import { buildSlackAuthorizeUrl } from "@/lib/slackInstall";

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
    </div>
  );
}
