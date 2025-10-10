import { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { Shield, Lock, EyeOff, Eye, Hash, Check, ArrowRight, Sparkles, Quote, BarChart3, Terminal, LockKeyhole, Share2, Users, LayersIcon as Layers } from "lucide-react";

/**
 * Teammato Anonymity Simulator – Marketing Page
 * - Entirely client-side. No API calls. No persistence.
 * - Uses shadcn/ui + Tailwind + Framer Motion.
 * - Accessible copy and concise technical hints.
 * - Bold visual rhythm: hero → flow chips → interactive steps → sticky admin rail → FAQ.
 */

// --- Utility helpers (client-only, deterministic during a session) ---
function fnv1aHex(str: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

function pseudoHandle(name: string) {
  const cleaned = (name || "teammate").trim().toLowerCase();
  return `user-${fnv1aHex(cleaned).slice(0, 6)}`;
}

// Simple on-page scrub (demo only)
function scrubPII(text: string) {
  if (!text) return "";
  let t = text;
  // emails → [email]
  t = t.replace(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[A-Za-z]{2,})/g, "[email]");
  // @handles → [@redacted]
  t = t.replace(/(^|\s)@([A-Za-z0-9_\.\-]+)/g, "$1[@redacted]");
  // phone numbers (very basic) → [phone]
  t = t.replace(/(\+?\d[\d\s().-]{7,}\d)/g, "[phone]");
  // 6–10 digit IDs → [id]
  t = t.replace(/\b\d{6,10}\b/g, "[id]");
  // URLs → [link]
  t = t.replace(/https?:\/\/\S+/g, "[link]");
  return t;
}

// Fake ciphertext preview (demo only)
function fakeCipherPreview(plaintext: string) {
  const ct = fnv1aHex("ct::" + plaintext + Math.random().toString(36));
  const nonce = fnv1aHex("nonce::" + plaintext + Date.now());
  const aad = fnv1aHex("aad::demo-org|topic");
  return { ct, nonce, aad };
}

// Hash-to-theme buckets (deterministic-ish per message)
const THEME_LABELS = [
  "Meetings",
  "Tooling",
  "Career Growth",
  "Documentation",
  "Strategy",
  "Process",
  "Culture",
  "Team Health",
  "Product Quality",
  "Roadmap",
  "Velocity",
  "Other",
];

function themeFor(text: string) {
  const n = parseInt(fnv1aHex(text).slice(0, 6), 16);
  return THEME_LABELS[n % THEME_LABELS.length];
}

export default function Simulator() {
  // Form inputs
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [simulatedSignals, setSimulatedSignals] = useState(3); // signals in the same theme
  const [k, setK] = useState(5);
  const [privacyMode, setPrivacyMode] = useState(true);
  const [step, setStep] = useState<0 | 1 | 2 | 3 | 4>(0); // 0 slack, 1 scrub, 2 encrypt, 3 cluster, 4 digest

  const handle = useMemo(() => pseudoHandle(name), [name]);
  const scrubbed = useMemo(() => scrubPII(message), [message]);
  const cipher = useMemo(() => fakeCipherPreview(scrubbed || message), [scrubbed, message]);
  const theme = useMemo(() => themeFor(scrubbed || message || "_"), [scrubbed, message]);

  const eligible = simulatedSignals >= k && (scrubbed || message).length > 0;

  // Accessible announcements
  useEffect(() => {
    const live = document.getElementById("aria-live");
    if (!live) return;
    live.textContent = `Step ${step + 1} of 5`;
  }, [step]);

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-b from-white to-slate-50">
        {/* Hero */}
        <section className="px-5 sm:px-8 pt-10 pb-6">
          <div className="max-w-6xl mx-auto flex flex-col gap-8 md:gap-10">
            <div className="flex flex-col items-start gap-4">
              <Badge className="rounded-2xl" variant="secondary">
                No LLM in the loop · k-anonymous by default
              </Badge>
              <h1 className="text-4xl md:text-5xl font-semibold tracking-tight">
                Speak up. <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">Stay safe.</span>
              </h1>
              <p className="text-slate-600 max-w-2xl">
                Try the <code className="px-1 py-0.5 rounded bg-slate-100">/teammato</code> flow. Type a message and step through how
                we protect identity, scrub sensitive bits, encrypt content, group themes, and only quote when it's safe.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              {/* Input Card */}
              <Card className="lg:col-span-2 shadow-sm border-slate-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5" /> Try it yourself
                  </CardTitle>
                  <CardDescription>All in your browser. Nothing leaves this page.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm text-slate-600">Your name (stays in Slack)</label>
                      <Input
                        aria-label="Your name"
                        placeholder="e.g., Alex from Product"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </div>
                    <div className="flex items-center justify-between gap-3 mt-1 sm:mt-6">
                      <div className="flex items-center gap-2">
                        <Switch id="privacy" checked={privacyMode} onCheckedChange={setPrivacyMode} />
                        <label htmlFor="privacy" className="text-sm text-slate-600">
                          Privacy mode (no console logs, no network)
                        </label>
                      </div>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Badge variant="outline" className="cursor-default">
                            <EyeOff className="h-4 w-4 mr-1" /> local-only
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent>Everything stays in your browser in this demo.</TooltipContent>
                      </Tooltip>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm text-slate-600">Your feedback</label>
                    <Textarea
                      aria-label="Your feedback"
                      placeholder="What's one thing we should improve?"
                      rows={5}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <Button size="lg" onClick={() => setStep(1)} disabled={!message.trim()}>
                      Simulate <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                    <div className="text-sm text-slate-500">We'll walk you through each protection layer.</div>
                  </div>
                </CardContent>
              </Card>

              {/* Sticky Admin Rail */}
              <Card className="sticky top-6 shadow-sm border-slate-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5 text-emerald-600"/> Admin view</CardTitle>
                  <CardDescription>What admins see at a glance</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-xs text-slate-500">Pseudonymous handle</div>
                  <div className="flex items-center gap-2">
                    <Hash className="h-4 w-4" />
                    <code className="text-sm bg-slate-100 rounded px-2 py-1">{handle}</code>
                  </div>

                  <Separator />

                  <div className="text-xs text-slate-500">Stored content (demo)</div>
                  <div className="rounded-lg border bg-slate-50 p-3 text-xs font-mono">
                    <div>ct: <span className="select-all">{cipher.ct}</span></div>
                    <div>nonce: <span className="select-all">{cipher.nonce}</span></div>
                    <div>aad: <span className="select-all">{cipher.aad}</span></div>
                  </div>

                  <Separator />

                  <div className="text-xs text-slate-500">Theme</div>
                  <Badge variant="secondary" className="text-sm">{theme}</Badge>

                  <Separator />

                  <div className="text-xs text-slate-500">Quote eligibility</div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Signals in theme</span>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4"/>
                        <span className="font-medium">{simulatedSignals}</span>
                      </div>
                    </div>
                    <Progress value={Math.min(100, (simulatedSignals / Math.max(1, k)) * 100)} />
                    <div className="flex items-center justify-between text-sm">
                      <span>k-threshold</span>
                      <span className="font-medium">{k}</span>
                    </div>
                    <div className={cn("text-sm font-medium", eligible ? "text-emerald-700" : "text-slate-600")}> 
                      {eligible ? "Eligible to quote (scrubbed only)" : "Held back to protect anonymity"}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Flow Chips */}
        <section className="px-5 sm:px-8 pb-4">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-wrap gap-2">
              <Badge variant={step === 0 ? "default" : "secondary"}>Slack</Badge>
              <Badge variant={step === 1 ? "default" : "secondary"}>Scrub</Badge>
              <Badge variant={step === 2 ? "default" : "secondary"}>Encrypt</Badge>
              <Badge variant={step === 3 ? "default" : "secondary"}>Cluster</Badge>
              <Badge variant={step === 4 ? "default" : "secondary"}>Digest</Badge>
            </div>
          </div>
        </section>

        {/* Interactive Steps */}
        <section className="px-5 sm:px-8 pb-16">
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Step Panels */}
            <div className="lg:col-span-2 space-y-6">
              {/* Step 0: Slack */}
              <AnimatePresence mode="wait">
                {step === 0 && (
                  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Terminal className="h-5 w-5"/> Step 1 · Slack</CardTitle>
                        <CardDescription>Identity stays in Slack. We never receive your name or handle.</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <div className="text-xs text-slate-500 mb-1">You type</div>
                            <div className="rounded-lg border p-3 bg-white">
                              <div className="text-sm text-slate-500">@{name || "your-name"}</div>
                              <div className="mt-2 text-slate-800 whitespace-pre-wrap">{message || "(your feedback)"}</div>
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-slate-500 mb-1">What we receive</div>
                            <div className="rounded-lg border p-3 bg-white">
                              <div className="text-sm text-slate-500">identity: <span className="font-mono">(not sent)</span></div>
                              <div className="mt-2 text-slate-800 whitespace-pre-wrap">{message ? message : "(message body only)"}</div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Button onClick={() => setStep(1)}>Next: Scrub <ArrowRight className="ml-2 h-4 w-4"/></Button>
                          <div className="text-sm text-slate-500">We strip identity **before** storage or logs.</div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}

                {/* Step 1: Scrub */}
                {step === 1 && (
                  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2"><EyeOff className="h-5 w-5"/> Step 2 · Scrub</CardTitle>
                        <CardDescription>We filter emails, @mentions, IDs, phone numbers, and links on ingestion.</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <div className="text-xs text-slate-500 mb-1">Before</div>
                            <div className="rounded-lg border p-3 bg-white text-slate-800 whitespace-pre-wrap">{message || "(your feedback)"}</div>
                          </div>
                          <div>
                            <div className="text-xs text-slate-500 mb-1">After</div>
                            <div className="rounded-lg border p-3 bg-white text-slate-800 whitespace-pre-wrap">{scrubbed || "(scrubbed preview)"}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Button onClick={() => setStep(2)}>Next: Encrypt <ArrowRight className="ml-2 h-4 w-4"/></Button>
                          <div className="text-sm text-slate-500">PII is replaced **before** persistence.</div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}

                {/* Step 2: Encrypt */}
                {step === 2 && (
                  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2"><LockKeyhole className="h-5 w-5"/> Step 3 · Encrypt</CardTitle>
                        <CardDescription>We lock bodies at rest (XChaCha20-Poly1305 AEAD). Admins don't query raw text.</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <div className="text-xs text-slate-500 mb-1">Input to encrypt</div>
                            <div className="rounded-lg border p-3 bg-white text-slate-800 whitespace-pre-wrap">{(scrubbed || message) || "(scrubbed text)"}</div>
                          </div>
                          <div>
                            <div className="text-xs text-slate-500 mb-1">Stored preview (demo)</div>
                            <div className="rounded-lg border p-3 bg-slate-50 text-xs font-mono">
                              ct: {cipher.ct}\n<br/>nonce: {cipher.nonce}\n<br/>aad: {cipher.aad}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Button onClick={() => setStep(3)}>Next: Cluster <ArrowRight className="ml-2 h-4 w-4"/></Button>
                          <div className="text-sm text-slate-500">Plaintext is not stored in databases or logs.</div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}

                {/* Step 3: Cluster */}
                {step === 3 && (
                  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5"/> Step 4 · Cluster</CardTitle>
                        <CardDescription>We group similar feedback into themes. No LLM involved.</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-5">
                        <div className="grid sm:grid-cols-3 gap-4">
                          <div className="col-span-2">
                            <div className="text-xs text-slate-500 mb-1">Detected theme</div>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary">{theme}</Badge>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span>k-threshold</span>
                              <span className="font-medium">{k}</span>
                            </div>
                            <Slider value={[k]} min={3} max={10} step={1} onValueChange={(v) => setK(v[0])}/>
                          </div>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-4">
                          <div>
                            <div className="flex items-center justify-between text-sm mb-1">
                              <span>Signals in theme</span>
                              <span className="font-medium">{simulatedSignals}</span>
                            </div>
                            <Slider value={[simulatedSignals]} min={0} max={12} step={1} onValueChange={(v) => setSimulatedSignals(v[0])}/>
                          </div>
                          <div className="text-sm text-slate-600">
                            We surface aggregates. Quotes appear only when signals in this theme meet or exceed <span className="font-medium">k</span>.
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <Button onClick={() => setStep(4)}>Next: Digest <ArrowRight className="ml-2 h-4 w-4"/></Button>
                          <div className="text-sm text-slate-500">No chatbot reads your words—just math for grouping.</div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}

                {/* Step 4: Digest */}
                {step === 4 && (
                  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Quote className="h-5 w-5"/> Step 5 · Digest</CardTitle>
                        <CardDescription>Weekly themes & trends. Quotes appear only when it's safe (≥ k).</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-5">
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="rounded-lg border p-4 bg-white">
                            <div className="text-xs text-slate-500 mb-1">Digest preview</div>
                            <div className="text-sm font-medium">Theme: {theme} — <span className="text-slate-500">{simulatedSignals} signals</span></div>
                            <ul className="mt-2 list-disc pl-5 text-sm text-slate-700 space-y-1">
                              <li>Change week-over-week: <span className="font-medium">+2</span></li>
                              <li>Top related theme: <span className="font-medium">Process</span></li>
                            </ul>
                            <Separator className="my-3" />
                            <div className="text-xs text-slate-500 mb-1">Quotes</div>
                            {eligible ? (
                              <blockquote className="text-slate-800 italic whitespace-pre-wrap">{scrubbed}</blockquote>
                            ) : (
                              <div className="text-slate-600">Held back to protect anonymity (need ≥ k signals).</div>
                            )}
                          </div>
                          <div className="rounded-lg border p-4 bg-slate-50">
                            <div className="text-xs text-slate-500 mb-1">Why this protects you</div>
                            <ul className="list-disc pl-5 text-sm text-slate-700 space-y-2">
                              <li>Identity remains in Slack — not stored here.</li>
                              <li>We scrub PII before persistence.</li>
                              <li>Bodies are encrypted at rest.</li>
                              <li>We group by theme; no LLM sifts through text.</li>
                              <li>Quotes appear only at or above k.</li>
                            </ul>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                          <Button variant="secondary" onClick={() => setStep(0)}>Start over</Button>
                          <Button>
                            Install to Slack <ArrowRight className="ml-2 h-4 w-4"/>
                          </Button>
                          <Button variant="ghost" className="gap-2">
                            <Share2 className="h-4 w-4"/> Share this demo
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>

              <div id="aria-live" className="sr-only" aria-live="polite" />
            </div>

            {/* Right: Trust Mini-FAQ */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Trust, at a glance</CardTitle>
                  <CardDescription>Clear answers to the common questions.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-slate-700">
                  <details className="group">
                    <summary className="cursor-pointer font-medium">Can admins figure out it was me?</summary>
                    <p className="mt-2 text-slate-600">We keep identity in Slack, scrub PII, and gate quotes behind a k-threshold so individuals aren't singled out.</p>
                  </details>
                  <Separator/>
                  <details className="group">
                    <summary className="cursor-pointer font-medium">Do you store my words in plaintext?</summary>
                    <p className="mt-2 text-slate-600">No. Bodies are encrypted at rest. This demo shows a ciphertext preview, not your raw text.</p>
                  </details>
                  <Separator/>
                  <details className="group">
                    <summary className="cursor-pointer font-medium">Do you use AI to read messages?</summary>
                    <p className="mt-2 text-slate-600">No LLM reads your text. We use embeddings to cluster themes—simple math, not a chatbot.</p>
                  </details>
                  <Separator/>
                  <details className="group">
                    <summary className="cursor-pointer font-medium">What if my team is small?</summary>
                    <p className="mt-2 text-slate-600">We withhold quotes below k. Even strong opinions don't surface as quotes until it's safe to do so.</p>
                  </details>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Implementation notes (demo)</CardTitle>
                  <CardDescription>All client-side. Zero network calls.</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm text-slate-700 list-disc pl-5 space-y-2">
                    <li>No analytics by default in demo mode.</li>
                    <li>Regex-based scrub preview (emails, @mentions, IDs, phones, links).</li>
                    <li>Fake ciphertext (nonce/AAD) for visual realism—no keys stored.</li>
                    <li>Hash-to-theme bucket for instant clustering preview.</li>
                    <li>k-threshold & signals sliders to show anonymity gating.</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="px-5 sm:px-8 pb-10">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <p className="text-sm text-slate-500">This page is a client-side simulation for demonstration. In production, encryption occurs server-side; identity remains in Slack; quotes appear only ≥ k.</p>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="rounded-full">Accessible</Badge>
              <Badge variant="outline" className="rounded-full">Client‑side</Badge>
              <Badge variant="outline" className="rounded-full">Zero‑compute</Badge>
            </div>
          </div>
        </footer>
      </div>
    </TooltipProvider>
  );
}
