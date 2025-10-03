import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, Shield, Lock, MessageSquare, Eye, Zap } from "lucide-react";

// Quad motif SVG component - rounded cross shape
const QuadMotif = ({ className = "", opacity = 0.04 }: { className?: string; opacity?: number }) => (
  <svg
    className={className}
    width="200"
    height="200"
    viewBox="0 0 200 200"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ opacity }}
  >
    <path
      d="M80 0H120C130 0 140 10 140 20V80H180C190 80 200 90 200 100V100C200 110 190 120 180 120H140V180C140 190 130 200 120 200H80C70 200 60 190 60 180V120H20C10 120 0 110 0 100V100C0 90 10 80 20 80H60V20C60 10 70 0 80 0Z"
      fill="currentColor"
    />
  </svg>
);

export default function Sample() {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Header with Quad watermark */}
      <header className="border-b relative">
        <div className="absolute top-0 right-0 text-primary">
          <QuadMotif className="w-96 h-96" opacity={0.04} />
        </div>
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between relative z-10">
          <div className="font-serif text-2xl font-semibold text-foreground">Teammato</div>
          <Badge variant="secondary" className="text-xs">Reading live theme tokens</Badge>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 space-y-16 py-16">

        {/* Type & Hierarchy - Editorial look with Quad watermark */}
        <section className="space-y-8 relative">
          <div className="absolute left-0 top-0 text-primary pointer-events-none">
            <QuadMotif className="w-64 h-64" opacity={0.06} />
          </div>
          <div className="space-y-4 relative z-10 max-w-4xl">
            <h1 className="text-6xl font-serif tracking-tight text-foreground leading-[1.1]">
              Hear the truth at work—safely, in Slack.
            </h1>
            <p className="text-2xl text-muted-foreground leading-relaxed">
              Anonymous by default. Behavior-focused by design. Built for action.
            </p>
          </div>
          
          {/* Typography samples */}
          <div className="space-y-4 max-w-3xl relative z-10">
            <h2 className="text-4xl font-serif text-foreground">Section Heading (H2)</h2>
            <h3 className="text-3xl font-serif text-foreground">Subsection Heading (H3)</h3>
            <div className="text-xl font-semibold text-foreground">Card Title / H4</div>
            <p className="text-base text-foreground leading-relaxed">
              Body text paragraph at base size. Inter font family for readability and modern aesthetic. We prioritize clarity and trust-first communication.
            </p>
            <p className="text-sm text-muted-foreground">
              Secondary / muted text at small size for less emphasis. Used for metadata and supporting details.
            </p>
            <code className="inline-block rounded-lg bg-muted px-3 py-1.5 text-sm font-mono text-muted-foreground">
              JetBrains Mono for code snippets
            </code>
          </div>
        </section>

        {/* HERO SHOT 1: Hero with Quad mask + modal crop breaking frame */}
        <section className="space-y-4">
          <div className="space-y-2">
            <Badge variant="secondary">Hero Shot</Badge>
            <h2 className="text-2xl font-serif font-semibold text-foreground">Quad Mask + Modal Crop</h2>
          </div>
          
          <Card className="overflow-visible relative">
            <div className="absolute right-8 top-0 text-primary pointer-events-none">
              <QuadMotif className="w-48 h-48" opacity={0.08} />
            </div>
            <CardContent className="p-12 relative z-10">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div className="space-y-6">
                  <h3 className="text-4xl font-serif tracking-tight text-foreground leading-tight">
                    Submit feedback in seconds
                  </h3>
                  <p className="text-lg text-muted-foreground">
                    Use /feedback in any Slack channel. Our SBI-guided modal keeps input focused on behavior and impact—not venting.
                  </p>
                  <div className="flex gap-3">
                    <Button size="lg" data-testid="button-add-to-slack-hero">
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Add to Slack
                    </Button>
                    <Button size="lg" variant="outline" data-testid="button-learn-more">
                      Learn more
                    </Button>
                  </div>
                </div>
                
                {/* Modal crop breaking the frame */}
                <div className="relative -mr-12 -mb-12 -mt-4">
                  <div className="bg-card border border-border rounded-xl shadow-lg p-6 space-y-4 transform translate-y-4">
                    <div className="flex items-center justify-between">
                      <div className="font-semibold text-foreground">Submit feedback</div>
                      <Badge className="bg-[#E6FAF6] text-[#0F4F49] border-[#0F4F49]/20">Anonymous</Badge>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Situation (optional)</label>
                        <div className="mt-1 text-sm text-foreground bg-muted/50 rounded px-3 py-2">Sprint planning, last Tuesday</div>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Behavior</label>
                        <div className="mt-1 text-sm text-foreground bg-muted/50 rounded px-3 py-2">Demo scope wasn't clear to QA</div>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Impact</label>
                        <div className="mt-1 text-sm text-foreground bg-muted/50 rounded px-3 py-2">Extra back-and-forth delayed release</div>
                      </div>
                    </div>
                    <Button className="w-full" size="sm" data-testid="button-submit-modal">Submit anonymously</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* HERO SHOT 2: Aggregate Summary Card with Quad header dots + "You said → We did" chip */}
        <section className="space-y-4">
          <div className="space-y-2">
            <Badge variant="secondary">Hero Shot</Badge>
            <h2 className="text-2xl font-serif font-semibold text-foreground">Aggregate Summary Card</h2>
          </div>
          
          <Card className="relative overflow-hidden">
            {/* Seafoam accent strip with Quad dots */}
            <div className="bg-[#E6FAF6] border-b border-[#0F4F49]/10 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* Quad header dots */}
                  <div className="grid grid-cols-2 gap-1">
                    <div className="w-2 h-2 rounded-sm bg-[#0F4F49]/40"></div>
                    <div className="w-2 h-2 rounded-sm bg-[#0F4F49]/40"></div>
                    <div className="w-2 h-2 rounded-sm bg-[#0F4F49]/40"></div>
                    <div className="w-2 h-2 rounded-sm bg-[#0F4F49]/40"></div>
                  </div>
                  <h3 className="text-xl font-serif font-semibold text-[#0F4F49]">Sprint Planning Topic</h3>
                </div>
                <Badge className="bg-[#0F4F49] text-white border-[#0F4F49]">
                  You said → We did
                </Badge>
              </div>
            </div>
            
            <CardContent className="p-6 space-y-4">
              <p className="text-sm text-muted-foreground">
                Based on 12 anonymous submissions (k=5 minimum met)
              </p>
              <div className="space-y-3">
                {[
                  "Clarify scope before demos",
                  "Share sprint goals earlier",
                  "Add QA sign-off checklist"
                ].map((theme, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover-elevate transition-all">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-primary/10 text-primary mt-0.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                    </div>
                    <div className="text-sm text-foreground">{theme}</div>
                  </div>
                ))}
              </div>
              <div className="pt-4 border-t">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <div className="text-sm font-semibold text-foreground">Action taken</div>
                    <div className="text-sm text-muted-foreground">
                      We've added a scope review step to our planning template and will share goals 48h before each sprint.
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* HERO SHOT 3: Anonymity Promise Banner (seafoam, no yellow) */}
        <section className="space-y-4">
          <div className="space-y-2">
            <Badge variant="secondary">Hero Shot</Badge>
            <h2 className="text-2xl font-serif font-semibold text-foreground">Anonymity Promise</h2>
          </div>
          
          <div className="bg-[#E6FAF6] border border-[#0F4F49]/20 rounded-xl p-8 relative overflow-hidden">
            <div className="absolute right-0 bottom-0 text-[#0F4F49]/10">
              <QuadMotif className="w-64 h-64" opacity={0.3} />
            </div>
            <div className="relative z-10 flex items-start gap-4 max-w-4xl">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#0F4F49] text-white">
                <Shield className="w-6 h-6" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-serif font-semibold text-[#0F4F49]">
                  We show themes, not people.
                </h3>
                <p className="text-lg text-[#0F4F49]/80 leading-relaxed">
                  Individual comments remain hidden until there's enough input. K-anonymity isn't optional—it's enforced by design.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* HERO SHOT 4: Security Fact Bar */}
        <section className="space-y-4">
          <div className="space-y-2">
            <Badge variant="secondary">Hero Shot</Badge>
            <h2 className="text-2xl font-serif font-semibold text-foreground">Security Fact Bar</h2>
          </div>
          
          <Card>
            <CardContent className="p-8">
              <div className="grid md:grid-cols-3 gap-8">
                <div className="text-center space-y-3">
                  <div className="flex justify-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Lock className="w-7 h-7" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-2xl font-serif font-semibold text-foreground">Per-org keys</div>
                    <p className="text-sm text-muted-foreground">AEAD encryption with isolated key management</p>
                  </div>
                </div>
                
                <div className="text-center space-y-3">
                  <div className="flex justify-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Eye className="w-7 h-7" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-2xl font-serif font-semibold text-foreground">No IPs logged</div>
                    <p className="text-sm text-muted-foreground">Zero metadata in feedback tables</p>
                  </div>
                </div>
                
                <div className="text-center space-y-3">
                  <div className="flex justify-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Shield className="w-7 h-7" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-2xl font-serif font-semibold text-foreground">Row-level isolation</div>
                    <p className="text-sm text-muted-foreground">Multi-tenant RLS enforced at DB layer</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* HERO SHOT 5: Bento Trio - Asymmetric layout with different Quad placements */}
        <section className="space-y-4">
          <div className="space-y-2">
            <Badge variant="secondary">Hero Shot</Badge>
            <h2 className="text-2xl font-serif font-semibold text-foreground">Bento Trio: Capture / Anonymous / Publish</h2>
          </div>
          
          {/* Asymmetric grid */}
          <div className="grid md:grid-cols-3 gap-6">
            {/* Capture - tall */}
            <Card className="md:col-span-1 md:row-span-2 relative overflow-hidden hover-elevate transition-all">
              <div className="absolute top-4 right-4 text-primary">
                <QuadMotif className="w-24 h-24" opacity={0.08} />
              </div>
              <CardContent className="p-8 space-y-4 relative z-10 h-full flex flex-col">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <div className="space-y-2 flex-1">
                  <h3 className="text-2xl font-serif font-semibold text-foreground">Capture in Slack</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    SBI-guided modal appears instantly. No portal, no email, no friction. Submit in under 60 seconds.
                  </p>
                </div>
                <div className="pt-4 border-t space-y-2">
                  <div className="text-xs font-medium text-muted-foreground">QUICK PROMPTS</div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="text-xs">Situation</Badge>
                    <Badge variant="outline" className="text-xs">Behavior</Badge>
                    <Badge variant="outline" className="text-xs">Impact</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Anonymous - wide */}
            <Card className="md:col-span-2 relative overflow-hidden hover-elevate transition-all">
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-primary">
                <QuadMotif className="w-32 h-32" opacity={0.06} />
              </div>
              <CardContent className="p-8 space-y-4 relative z-10">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#E6FAF6] text-[#0F4F49]">
                    <Lock className="w-6 h-6" />
                  </div>
                  <div className="space-y-2 flex-1">
                    <h3 className="text-2xl font-serif font-semibold text-foreground">Anonymous by default</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      K-anonymity enforced. No @mentions, no names, no identifiable metadata. Pseudonymous handles for rate-limiting only.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  <span className="text-xs text-muted-foreground">Minimum k=5 submissions before aggregation</span>
                </div>
              </CardContent>
            </Card>
            
            {/* Publish - wide */}
            <Card className="md:col-span-2 relative overflow-hidden hover-elevate transition-all">
              <div className="absolute top-4 left-4 text-primary">
                <QuadMotif className="w-28 h-28" opacity={0.08} />
              </div>
              <CardContent className="p-8 space-y-4 relative z-10">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                    <Zap className="w-6 h-6" />
                  </div>
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-2xl font-serif font-semibold text-foreground">You said → We did</h3>
                      <Badge className="bg-[#E6FAF6] text-[#0F4F49] border-[#0F4F49]/20">Action loop</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Close the loop with transparent action posts. Show themes, announce changes, build trust through visible follow-through.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Button Sampler */}
        <section className="space-y-4">
          <div className="space-y-2">
            <Badge variant="secondary">Component Library</Badge>
            <h2 className="text-2xl font-serif font-semibold text-foreground">Buttons</h2>
          </div>
          
          <Card>
            <CardContent className="p-8 flex flex-wrap gap-4">
              <Button data-testid="button-primary">Primary (Teal)</Button>
              <Button variant="secondary" data-testid="button-secondary" className="bg-[#E6FAF6] text-[#0F4F49] border-[#0F4F49]/20 hover:bg-[#E6FAF6]">
                Accent (Seafoam)
              </Button>
              <Button variant="ghost" data-testid="button-ghost">Ghost</Button>
              <Button variant="destructive" data-testid="button-destructive">Destructive</Button>
              <Button variant="outline" data-testid="button-outline">Outline</Button>
              <Button size="sm" data-testid="button-small">Small</Button>
              <Button size="lg" data-testid="button-large">Large</Button>
              <Button size="icon" data-testid="button-icon">
                <MessageSquare className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </section>

        {/* Input Sampler with SBI microcopy */}
        <section className="space-y-4">
          <div className="space-y-2">
            <Badge variant="secondary">Component Library</Badge>
            <h2 className="text-2xl font-serif font-semibold text-foreground">Form Inputs (SBI Framework)</h2>
          </div>
          
          <Card>
            <CardContent className="p-8 space-y-6 max-w-2xl">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Situation (optional)</label>
                <Input 
                  placeholder="When and where did this happen? (e.g., last sprint retro)"
                  data-testid="input-situation"
                  className="focus:ring-2 focus:ring-primary"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Behavior (required)</label>
                <Textarea 
                  placeholder="What specific behavior or action did you observe?"
                  rows={3}
                  data-testid="textarea-behavior"
                  className="focus:ring-2 focus:ring-primary"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Impact (required)</label>
                <Textarea 
                  placeholder="How did this affect you, the team, or the work?"
                  rows={3}
                  data-testid="textarea-impact"
                  className="focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Select (mock)</label>
                <div className="flex items-center justify-between rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus-within:ring-2 focus-within:ring-primary cursor-pointer">
                  <span className="text-muted-foreground">Choose topic...</span>
                  <span className="text-muted-foreground">▾</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Card Variants with Quad-corner */}
        <section className="space-y-4">
          <div className="space-y-2">
            <Badge variant="secondary">Component Library</Badge>
            <h2 className="text-2xl font-serif font-semibold text-foreground">Card Variants</h2>
          </div>
          
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="hover-elevate transition-all">
              <CardContent className="p-6 space-y-3">
                <h3 className="text-lg font-semibold text-foreground">Basic Card</h3>
                <p className="text-sm text-muted-foreground">Neutral background with subtle hover elevation.</p>
              </CardContent>
            </Card>
            
            <Card className="bg-[#E6FAF6] border-[#0F4F49]/20 hover-elevate transition-all relative overflow-hidden">
              <div className="absolute bottom-0 right-0 text-[#0F4F49]/10">
                <QuadMotif className="w-24 h-24" opacity={0.3} />
              </div>
              <CardContent className="p-6 space-y-3 relative z-10">
                <h3 className="text-lg font-semibold text-[#0F4F49]">Seafoam Accent</h3>
                <p className="text-sm text-[#0F4F49]/80">For highlights and special emphasis with Quad motif.</p>
              </CardContent>
            </Card>
            
            <Card className="hover-elevate transition-all shadow-sm hover:shadow-md">
              <CardContent className="p-6 space-y-3">
                <h3 className="text-lg font-semibold text-foreground">Elevated Card</h3>
                <p className="text-sm text-muted-foreground">Subtle shadow increase on hover. No scale transforms.</p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Charts Palette */}
        <section className="space-y-4">
          <div className="space-y-2">
            <Badge variant="secondary">Color System</Badge>
            <h2 className="text-2xl font-serif font-semibold text-foreground">Charts Palette</h2>
          </div>
          
          <div className="grid grid-cols-5 gap-4">
            {['--chart-1', '--chart-2', '--chart-3', '--chart-4', '--chart-5'].map((varName) => (
              <Card key={varName}>
                <CardContent className="p-4 space-y-3">
                  <div 
                    className="h-16 rounded-lg" 
                    style={{ background: `hsl(var(${varName}, 220 13% 91%))` }}
                  />
                  <div className="text-xs font-mono text-muted-foreground">{varName}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

      </div>

      {/* Footer */}
      <footer className="border-t mt-20">
        <div className="mx-auto max-w-7xl px-6 py-8 text-center text-sm text-muted-foreground">
          <p>Design Gallery · All components read live theme tokens</p>
        </div>
      </footer>
    </div>
  );
}
