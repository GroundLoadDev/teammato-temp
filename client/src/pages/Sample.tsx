import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle2, Shield, Lock, Users, MessageSquare, TrendingUp, Eye, Zap } from "lucide-react";
import { useState } from "react";

export default function Sample() {
  const [activeRole, setActiveRole] = useState("hr");

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="font-serif text-xl font-semibold text-foreground">Teammato</div>
            <Badge variant="secondary" className="text-xs">Design Gallery</Badge>
          </div>
          <Button size="sm" variant="ghost">Close Preview</Button>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-12 space-y-20">

        {/* Typography Showcase */}
        <section className="space-y-6">
          <div className="space-y-2">
            <Badge variant="secondary">Typography</Badge>
            <h2 className="text-2xl font-serif font-semibold text-foreground">Type Scale & Hierarchy</h2>
          </div>
          
          <Card>
            <CardContent className="p-8 space-y-6">
              <div className="space-y-2">
                <div className="text-5xl font-serif tracking-tight text-foreground leading-tight">
                  Hear the truth at work—safely, in Slack.
                </div>
                <p className="text-lg text-muted-foreground">
                  Anonymous by default. Behavior-focused by design. Built for action.
                </p>
              </div>

              <div className="border-t pt-6 space-y-4">
                <div className="text-3xl font-serif text-foreground">Section Heading (H2)</div>
                <div className="text-2xl font-serif text-foreground">Subsection Heading (H3)</div>
                <div className="text-xl font-semibold text-foreground">Card Title / H4</div>
                <p className="text-base text-foreground">Body text paragraph at base size. Inter font family for readability and modern aesthetic.</p>
                <p className="text-sm text-muted-foreground">Secondary / muted text at small size for less emphasis.</p>
                <code className="inline-block rounded bg-muted px-2 py-1 text-sm font-mono text-muted-foreground">
                  JetBrains Mono for code snippets
                </code>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Hero Patterns */}
        <section className="space-y-6">
          <div className="space-y-2">
            <Badge variant="secondary">Hero Patterns</Badge>
            <h2 className="text-2xl font-serif font-semibold text-foreground">Landing Page Hero Options</h2>
          </div>

          {/* Hero Option 1: Clean */}
          <Card>
            <CardContent className="p-12 text-center space-y-6">
              <div className="space-y-4 max-w-3xl mx-auto">
                <h1 className="text-5xl font-serif tracking-tight text-foreground leading-tight">
                  Hear the truth at work—safely, in Slack.
                </h1>
                <p className="text-xl text-muted-foreground">
                  Anonymous by default. Behavior-focused by design. Built for action.
                </p>
              </div>
              <div className="flex items-center justify-center gap-4 flex-wrap">
                <Button size="lg" data-testid="button-add-to-slack">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Add to Slack
                </Button>
                <Button size="lg" variant="outline" data-testid="button-see-how-it-works">
                  See how it works
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">Free 14-day trial · No credit card required</p>
            </CardContent>
          </Card>

          {/* Hero Option 2: With Accent Background */}
          <Card className="bg-accent border-accent-border">
            <CardContent className="p-12 text-center space-y-6">
              <div className="space-y-4 max-w-3xl mx-auto">
                <h1 className="text-5xl font-serif tracking-tight text-accent-foreground leading-tight">
                  Hear the truth at work—safely, in Slack.
                </h1>
                <p className="text-xl text-accent-foreground/80">
                  Anonymous by default. Behavior-focused by design. Built for action.
                </p>
              </div>
              <div className="flex items-center justify-center gap-4 flex-wrap">
                <Button size="lg" data-testid="button-add-to-slack-2">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Add to Slack
                </Button>
                <Button size="lg" variant="outline" data-testid="button-see-how-it-works-2">
                  See how it works
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* How It Works - 4 Steps */}
        <section className="space-y-6">
          <div className="space-y-2">
            <Badge variant="secondary">Feature Section</Badge>
            <h2 className="text-2xl font-serif font-semibold text-foreground">How It Works (4-Step)</h2>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: MessageSquare,
                step: "1",
                title: "Submit in Slack",
                description: "Employee uses /feedback command, fills SBI-guided modal, submits anonymously"
              },
              {
                icon: Shield,
                step: "2",
                title: "K-anonymous aggregation",
                description: "System waits for minimum submissions, aggregates with pseudonymous handles"
              },
              {
                icon: Eye,
                step: "3",
                title: "Review & moderate",
                description: "Admins see summaries, flag inappropriate content, never individual IDs"
              },
              {
                icon: TrendingUp,
                step: "4",
                title: "Action & close loop",
                description: "Post 'You said → We did' updates, lock topic, measure engagement"
              }
            ].map((item) => (
              <Card key={item.step} className="hover-elevate">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                      <item.icon className="h-5 w-5" />
                    </div>
                    <Badge variant="outline">{item.step}</Badge>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-foreground">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Why It's Safe - 3 Columns */}
        <section className="space-y-6">
          <div className="space-y-2">
            <Badge variant="secondary">Trust Section</Badge>
            <h2 className="text-2xl font-serif font-semibold text-foreground">Why It's Safe (3 Proof Points)</h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Shield className="h-6 w-6" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-serif font-semibold text-foreground">K-anonymity enforced</h3>
                  <p className="text-sm text-muted-foreground">
                    Never release individual submissions. Aggregate only when minimum threshold met. No @mentions, no names in open feedback.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Lock className="h-6 w-6" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-serif font-semibold text-foreground">Encryption & isolation</h3>
                  <p className="text-sm text-muted-foreground">
                    AEAD encryption with per-org keys. Row-level security. No IP/user-agent logged. Audit trails for all moderation.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-serif font-semibold text-foreground">Data minimization</h3>
                  <p className="text-sm text-muted-foreground">
                    Coarsen details, 365-day retention default. Only pseudonymous hashes for rate-limiting. Clear legal hold support.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Role-Based Benefits Tabs */}
        <section className="space-y-6">
          <div className="space-y-2">
            <Badge variant="secondary">Segmented Messaging</Badge>
            <h2 className="text-2xl font-serif font-semibold text-foreground">Benefits by Role (Tabs)</h2>
          </div>

          <Card>
            <CardContent className="p-6">
              <Tabs value={activeRole} onValueChange={setActiveRole}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="hr" data-testid="tab-hr">For HR Leaders</TabsTrigger>
                  <TabsTrigger value="managers" data-testid="tab-managers">For Managers</TabsTrigger>
                  <TabsTrigger value="security" data-testid="tab-security">For Security</TabsTrigger>
                </TabsList>
                
                <TabsContent value="hr" className="space-y-4 mt-6">
                  <div className="space-y-2">
                    <h3 className="text-xl font-serif font-semibold text-foreground">Drive retention & engagement</h3>
                    <p className="text-muted-foreground">
                      Get actionable signal without surveys. Anonymous intake in Slack = higher completion rates. SBI framework produces behavior-focused feedback you can actually use.
                    </p>
                  </div>
                  <ul className="space-y-2">
                    {[
                      "Track manager quality through aggregated feedback",
                      "Identify ER issues before they escalate",
                      "Close the loop with 'You said → We did' posts",
                      "Measure engagement with built-in analytics"
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                        <span className="text-muted-foreground">{item}</span>
                      </li>
                    ))}
                  </ul>
                </TabsContent>

                <TabsContent value="managers" className="space-y-4 mt-6">
                  <div className="space-y-2">
                    <h3 className="text-xl font-serif font-semibold text-foreground">Get fast, actionable signal</h3>
                    <p className="text-muted-foreground">
                      No more wondering what your team really thinks. Slack-native feedback appears where you work. Behavior-focused prompts prevent venting, produce clear actions.
                    </p>
                  </div>
                  <ul className="space-y-2">
                    {[
                      "See aggregated themes, not individual complaints",
                      "Respond with actions, build trust with transparency",
                      "No portal to check—digest arrives in Slack",
                      "Light-touch integration with existing workflows"
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                        <span className="text-muted-foreground">{item}</span>
                      </li>
                    ))}
                  </ul>
                </TabsContent>

                <TabsContent value="security" className="space-y-4 mt-6">
                  <div className="space-y-2">
                    <h3 className="text-xl font-serif font-semibold text-foreground">Privacy-first architecture</h3>
                    <p className="text-muted-foreground">
                      Built for compliance and serious concerns routing. K-anonymity isn't optional—it's enforced. AEAD encryption, RLS, audit trails, pen-tested.
                    </p>
                  </div>
                  <ul className="space-y-2">
                    {[
                      "SOC 2 compliant, 24/7 monitoring",
                      "Per-org encryption keys, tenant isolation via RLS",
                      "No IP/UA logging, pseudonymous rate-limiting only",
                      "GDPR/CCPA ready, configurable retention policies"
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                        <span className="text-muted-foreground">{item}</span>
                      </li>
                    ))}
                  </ul>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </section>

        {/* Component Library */}
        <section className="space-y-6">
          <div className="space-y-2">
            <Badge variant="secondary">Component Library</Badge>
            <h2 className="text-2xl font-serif font-semibold text-foreground">Base Components</h2>
          </div>

          {/* Buttons */}
          <Card>
            <CardHeader>
              <CardTitle>Buttons</CardTitle>
              <CardDescription>All variants with hover states built-in</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <Button data-testid="button-default">Default</Button>
              <Button variant="secondary" data-testid="button-secondary">Secondary</Button>
              <Button variant="outline" data-testid="button-outline">Outline</Button>
              <Button variant="ghost" data-testid="button-ghost">Ghost</Button>
              <Button variant="destructive" data-testid="button-destructive">Destructive</Button>
              <Button size="sm" data-testid="button-small">Small</Button>
              <Button size="lg" data-testid="button-large">Large</Button>
              <Button size="icon" data-testid="button-icon">
                <Zap className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          {/* Badges */}
          <Card>
            <CardHeader>
              <CardTitle>Badges</CardTitle>
              <CardDescription>For status, labels, and categories</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <Badge>Default</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="outline">Outline</Badge>
              <Badge variant="destructive">Destructive</Badge>
            </CardContent>
          </Card>

          {/* Form Elements */}
          <Card>
            <CardHeader>
              <CardTitle>Form Elements</CardTitle>
              <CardDescription>Inputs with proper focus states</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 max-w-md">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Email address</label>
                <Input 
                  type="email" 
                  placeholder="you@company.com"
                  data-testid="input-email"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Message</label>
                <Textarea 
                  placeholder="Tell us more about your needs..."
                  rows={4}
                  data-testid="textarea-message"
                />
              </div>
              <Button data-testid="button-submit-form">Submit</Button>
            </CardContent>
          </Card>

          {/* Cards */}
          <Card>
            <CardHeader>
              <CardTitle>Card Variants</CardTitle>
              <CardDescription>Container patterns for content grouping</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle>Basic Card</CardTitle>
                  <CardDescription>With header and content</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Card body content goes here.</p>
                </CardContent>
              </Card>

              <Card className="bg-accent border-accent-border">
                <CardHeader>
                  <CardTitle className="text-accent-foreground">Accent Card</CardTitle>
                  <CardDescription className="text-accent-foreground/80">For highlights</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-accent-foreground/80">Use for soft emphasis and callouts.</p>
                </CardContent>
              </Card>

              <Card className="hover-elevate cursor-pointer">
                <CardHeader>
                  <CardTitle>Hoverable Card</CardTitle>
                  <CardDescription>With hover-elevate class</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Subtle elevation on hover.</p>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </section>

        {/* CTA Patterns */}
        <section className="space-y-6">
          <div className="space-y-2">
            <Badge variant="secondary">CTA Patterns</Badge>
            <h2 className="text-2xl font-serif font-semibold text-foreground">Call-to-Action Sections</h2>
          </div>

          {/* Simple CTA */}
          <Card>
            <CardContent className="p-12 text-center space-y-6">
              <div className="space-y-2 max-w-2xl mx-auto">
                <h3 className="text-3xl font-serif font-semibold text-foreground">Ready to hear the truth?</h3>
                <p className="text-lg text-muted-foreground">
                  Start your free 14-day trial. No credit card required.
                </p>
              </div>
              <div className="flex items-center justify-center gap-4 flex-wrap">
                <Button size="lg" data-testid="button-cta-primary">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Add to Slack
                </Button>
                <Button size="lg" variant="outline" data-testid="button-cta-secondary">
                  Talk to sales
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Contact Form CTA */}
          <Card>
            <CardContent className="p-8">
              <div className="grid gap-8 md:grid-cols-2">
                <div className="space-y-4">
                  <h3 className="text-2xl font-serif font-semibold text-foreground">Talk to our team</h3>
                  <p className="text-muted-foreground">
                    See how Teammato can help your organization hear feedback safely and act on it transparently.
                  </p>
                  <ul className="space-y-2">
                    {[
                      "Free 14-day trial",
                      "Custom onboarding support",
                      "Dedicated security review",
                      "Volume pricing available"
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                        <span className="text-muted-foreground">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Work email</label>
                    <Input type="email" placeholder="you@company.com" data-testid="input-contact-email" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Company size</label>
                    <Input placeholder="e.g. 200 employees" data-testid="input-company-size" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">How can we help?</label>
                    <Textarea placeholder="Optional: tell us about your needs" rows={4} data-testid="textarea-help" />
                  </div>
                  <Button className="w-full" data-testid="button-contact-submit">Request demo</Button>
                  <p className="text-xs text-muted-foreground text-center">
                    We'll respond within 1 business day
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Social Proof */}
        <section className="space-y-6">
          <div className="space-y-2">
            <Badge variant="secondary">Social Proof</Badge>
            <h2 className="text-2xl font-serif font-semibold text-foreground">Trust Signals</h2>
          </div>

          <Card>
            <CardContent className="p-8 space-y-8">
              <div className="text-center space-y-2">
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Trusted by teams at</p>
                <div className="flex items-center justify-center gap-8 flex-wrap">
                  {["Company A", "Company B", "Company C", "Company D"].map((name) => (
                    <div key={name} className="text-lg font-semibold text-muted-foreground">{name}</div>
                  ))}
                </div>
              </div>

              <div className="border-t pt-8">
                <div className="grid gap-6 md:grid-cols-2">
                  <Card>
                    <CardContent className="p-6 space-y-4">
                      <p className="text-sm text-muted-foreground italic">
                        "We needed anonymous feedback that employees would actually use. Teammato delivered—completion rates tripled and the signal is actionable."
                      </p>
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
                          JS
                        </div>
                        <div className="text-sm">
                          <div className="font-medium text-foreground">Jane Smith</div>
                          <div className="text-muted-foreground">Head of People, TechCorp</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6 space-y-4">
                      <p className="text-sm text-muted-foreground italic">
                        "The k-anonymity enforcement and encryption gave our CISO confidence. It's the only tool we found that takes privacy seriously."
                      </p>
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
                          MJ
                        </div>
                        <div className="text-sm">
                          <div className="font-medium text-foreground">Mike Johnson</div>
                          <div className="text-muted-foreground">VP Engineering, StartupCo</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Color Swatches (from provided example) */}
        <section className="space-y-6">
          <div className="space-y-2">
            <Badge variant="secondary">Theme Tokens</Badge>
            <h2 className="text-2xl font-serif font-semibold text-foreground">Live Theme Colors</h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {[
              { name: "Primary", var: "--primary" },
              { name: "Secondary", var: "--secondary" },
              { name: "Accent", var: "--accent" },
              { name: "Destructive", var: "--destructive" },
              { name: "Muted", var: "--muted" },
              { name: "Card", var: "--card" },
              { name: "Border", var: "--border" },
              { name: "Background", var: "--background" }
            ].map((color) => (
              <Card key={color.name}>
                <CardContent className="p-4 space-y-3">
                  <div className="h-16 rounded-lg" style={{ background: `hsl(var(${color.var}))` }} />
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-foreground">{color.name}</div>
                    <div className="text-xs font-mono text-muted-foreground">{color.var}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

      </div>

      {/* Footer Note */}
      <footer className="border-t mt-20">
        <div className="mx-auto max-w-7xl px-6 py-8 text-center text-sm text-muted-foreground">
          <p>Design Gallery · All components use live theme tokens and can be deleted after review</p>
        </div>
      </footer>
    </div>
  );
}
