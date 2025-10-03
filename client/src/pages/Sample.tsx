import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, Shield, Lock, MessageSquare, Eye, Zap, AlertCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";

// Quad motif SVG - rounded cross shape
const QuadMotif = ({ 
  className = "", 
  opacity = 0.04,
  size = 200 
}: { 
  className?: string; 
  opacity?: number;
  size?: number;
}) => (
  <svg
    className={className}
    width={size}
    height={size}
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

// Quad Field - generative background system
const QuadField = ({ density = "sparse" }: { density?: "sparse" | "dense" }) => {
  const quads = density === "sparse" 
    ? [
        { top: '10%', left: '15%', size: 180, opacity: 0.03 },
        { top: '45%', left: '75%', size: 220, opacity: 0.04 },
        { top: '70%', left: '25%', size: 160, opacity: 0.025 },
      ]
    : [
        { top: '5%', left: '10%', size: 80, opacity: 0.02 },
        { top: '15%', left: '70%', size: 100, opacity: 0.03 },
        { top: '40%', left: '30%', size: 90, opacity: 0.025 },
        { top: '50%', left: '85%', size: 70, opacity: 0.02 },
        { top: '75%', left: '15%', size: 95, opacity: 0.03 },
        { top: '85%', left: '60%', size: 85, opacity: 0.025 },
      ];

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {quads.map((quad, i) => (
        <div
          key={i}
          className="absolute text-primary transition-all duration-700"
          style={{
            top: quad.top,
            left: quad.left,
            transform: 'translate(-50%, -50%)',
          }}
        >
          <QuadMotif size={quad.size} opacity={quad.opacity} />
        </div>
      ))}
    </div>
  );
};

// Aggregation Meter - visual metaphor for k-anonymity
const AggregationMeter = ({ filled = 4 }: { filled?: number }) => (
  <div className="flex items-center gap-1.5">
    {[1, 2, 3, 4].map((i) => (
      <div
        key={i}
        className={`w-8 h-8 rounded transition-all duration-300 ${
          i <= filled 
            ? 'bg-[#0F4F49] opacity-100' 
            : 'bg-[#0F4F49] opacity-10'
        }`}
        style={{
          transitionDelay: `${i * 80}ms`
        }}
      >
        <QuadMotif size={32} opacity={i <= filled ? 0.8 : 0.3} className="text-[#E6FAF6]" />
      </div>
    ))}
  </div>
);

export default function Sample() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Subtle grain texture */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-[0.015] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Header */}
      <header className="border-b relative z-50 bg-background/80 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <div className="font-serif text-2xl font-semibold text-foreground">Teammato</div>
          <Badge variant="secondary" className="text-xs">Reading live theme tokens</Badge>
        </div>
      </header>

      {/* HERO - One strong scene with overlap */}
      <section className="relative pt-20 pb-32 overflow-visible">
        <QuadField density="sparse" />
        <div 
          className="mx-auto max-w-7xl px-6"
          style={{
            transform: `translateY(${scrollY * 0.015}px)`,
          }}
        >
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Editorial headline */}
            <div className="space-y-6">
              <h1 className="text-6xl lg:text-7xl font-serif tracking-tight text-foreground leading-[1.05]">
                Hear the truth at work—safely, in Slack.
              </h1>
              <p className="text-2xl text-muted-foreground leading-relaxed">
                Anonymous by default. Behavior-focused by design. Built for action.
              </p>
              <div className="flex gap-4 pt-4">
                <Button 
                  size="lg" 
                  data-testid="button-add-to-slack-hero"
                  className="active:translate-y-[1px] active:shadow-sm transition-all"
                >
                  <MessageSquare className="w-5 h-5 mr-2" />
                  Add to Slack
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  data-testid="button-see-demo"
                  className="active:translate-y-[1px] active:shadow-sm transition-all"
                >
                  See how it works
                </Button>
              </div>
            </div>

            {/* Right: Hero card that overlaps into next section */}
            <div className="relative lg:translate-y-16">
              <div className="relative">
                {/* Overlap & Lift - card breaks section boundary */}
                <div 
                  className="bg-card rounded-xl p-8 space-y-6 border border-primary shadow-2xl relative z-10"
                  style={{
                    boxShadow: '0 20px 40px -12px rgba(15, 79, 73, 0.15), 0 0 0 1px hsl(var(--primary))',
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="font-semibold text-foreground text-lg">Submit feedback</div>
                    <Badge className="bg-[#E6FAF6] text-[#0F4F49] border-[#0F4F49]/20">Anonymous</Badge>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Situation (optional)</label>
                      <div className="mt-2 text-sm text-foreground bg-muted/50 rounded-lg px-4 py-3">Sprint planning, last Tuesday</div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Behavior</label>
                      <div className="mt-2 text-sm text-foreground bg-muted/50 rounded-lg px-4 py-3">Demo scope wasn't clear to QA</div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Impact</label>
                      <div className="mt-2 text-sm text-foreground bg-muted/50 rounded-lg px-4 py-3">Extra back-and-forth delayed release</div>
                    </div>
                  </div>
                  
                  <Button 
                    className="w-full active:translate-y-[1px] active:shadow-sm transition-all" 
                    data-testid="button-submit-modal"
                  >
                    Submit anonymously
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AGGREGATE SUMMARY - Poster child with aggregation meter, quad-corner, seafoam strip */}
      <section className="relative py-20 bg-muted/20">
        <div className="mx-auto max-w-5xl px-6">
          <div className="space-y-3 mb-8">
            <Badge variant="secondary">Signature Module</Badge>
            <h2 className="text-3xl font-serif font-semibold text-foreground">Aggregate Summary</h2>
          </div>

          {/* Quad-corner card with lift */}
          <div className="relative">
            <Card 
              className="relative overflow-hidden border-primary"
              style={{
                boxShadow: '0 24px 48px -16px rgba(15, 79, 73, 0.12), 0 0 0 1px hsl(var(--primary))',
              }}
            >
              {/* Aggregation meter on top */}
              <div className="absolute top-6 right-6 z-20">
                <AggregationMeter filled={4} />
              </div>

              {/* Seafoam header strip */}
              <div className="bg-[#E6FAF6] border-b border-[#0F4F49]/10 p-6">
                <div className="flex items-center gap-3">
                  <div className="grid grid-cols-2 gap-1">
                    <div className="w-2.5 h-2.5 rounded-sm bg-[#0F4F49]/50"></div>
                    <div className="w-2.5 h-2.5 rounded-sm bg-[#0F4F49]/50"></div>
                    <div className="w-2.5 h-2.5 rounded-sm bg-[#0F4F49]/50"></div>
                    <div className="w-2.5 h-2.5 rounded-sm bg-[#0F4F49]/50"></div>
                  </div>
                  <h3 className="text-xl font-serif font-semibold text-[#0F4F49]">Sprint Planning Topic</h3>
                </div>
              </div>

              <CardContent className="p-8 space-y-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Based on 12 anonymous submissions (k=5 minimum met)
                  </p>
                  <Badge className="bg-[#0F4F49] text-white">
                    You said → We did
                  </Badge>
                </div>

                <div className="space-y-3">
                  {[
                    "Clarify scope before demos",
                    "Share sprint goals earlier", 
                    "Add QA sign-off checklist"
                  ].map((theme, i) => (
                    <div 
                      key={i} 
                      className="flex items-start gap-3 p-4 rounded-lg bg-muted/30 hover-elevate transition-all"
                      style={{
                        animationDelay: `${i * 80}ms`
                      }}
                    >
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary mt-0.5">
                        <div className="w-2 h-2 rounded-full" style={{ background: 'hsl(9, 75%, 61%)' }}></div>
                      </div>
                      <div className="text-sm text-foreground font-medium">{theme}</div>
                    </div>
                  ))}
                </div>

                <div className="pt-6 border-t">
                  <div className="flex items-start gap-4">
                    <CheckCircle2 className="w-6 h-6 text-primary shrink-0 mt-0.5" />
                    <div className="space-y-2">
                      <div className="text-base font-semibold text-foreground">Action taken</div>
                      <div className="text-sm text-muted-foreground leading-relaxed">
                        We've added a scope review step to our planning template and will share goals 48h before each sprint.
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>

              {/* Quad-corner lift effect */}
              <div 
                className="absolute bottom-0 right-0 w-24 h-24 pointer-events-none"
                style={{
                  background: 'linear-gradient(135deg, transparent 50%, rgba(15, 79, 73, 0.03) 50%)',
                }}
              />
            </Card>
          </div>
        </div>
      </section>

      {/* ANONYMITY PROMISE - Full-width seafoam ribbon with rounded ends */}
      <section className="relative py-16">
        <div className="mx-auto max-w-6xl px-6">
          <div 
            className="relative overflow-hidden rounded-full bg-[#E6FAF6] border border-[#0F4F49]/20 p-8 md:p-12"
          >
            <div className="absolute left-8 top-1/2 -translate-y-1/2 text-[#0F4F49]">
              <div className="w-16 h-16 flex items-center justify-center rounded-full bg-[#0F4F49] text-[#E6FAF6]">
                <Shield className="w-8 h-8" />
              </div>
            </div>
            
            <div className="relative z-10 pl-24 md:pl-28 pr-8 space-y-3">
              <h3 className="text-2xl md:text-3xl font-serif font-semibold text-[#0F4F49]">
                We show themes, not people.
              </h3>
              <p className="text-base md:text-lg text-[#0F4F49]/80 leading-relaxed max-w-3xl">
                Individual comments remain hidden until there's enough input. K-anonymity isn't optional—it's enforced by design.
              </p>
            </div>

            <div className="absolute right-8 top-1/2 -translate-y-1/2 text-[#0F4F49]/5 pointer-events-none">
              <QuadMotif size={140} opacity={0.4} />
            </div>
          </div>
        </div>
      </section>

      {/* SECURITY FACT BAR - Pills with seafoam underlines */}
      <section className="relative py-12">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Lock, title: "Per-org keys", desc: "AEAD encryption with isolated key management" },
              { icon: Eye, title: "No IPs logged", desc: "Zero metadata in feedback tables" },
              { icon: Shield, title: "Row-level isolation", desc: "Multi-tenant RLS enforced at DB layer" }
            ].map((fact, i) => (
              <div 
                key={i} 
                className="text-center space-y-4 p-6 rounded-xl hover-elevate transition-all bg-card border border-border"
              >
                <div className="flex justify-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <fact.icon className="w-7 h-7" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="relative inline-block">
                    <div className="text-xl font-serif font-semibold text-foreground">{fact.title}</div>
                    <div 
                      className="absolute -bottom-1 left-0 right-0 h-1 bg-[#E6FAF6] rounded-full"
                      style={{ width: '60%', margin: '0 auto' }}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">{fact.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BENTO TRIO - Asymmetric 40/30/30 with unique shape cues */}
      <section className="relative py-20 bg-muted/20">
        <QuadField density="dense" />
        <div className="mx-auto max-w-7xl px-6 relative z-10">
          <div className="space-y-3 mb-8">
            <Badge variant="secondary">Signature Module</Badge>
            <h2 className="text-3xl font-serif font-semibold text-foreground">How It Works</h2>
          </div>

          {/* Asymmetric grid: 40% + 30% + 30% */}
          <div className="grid md:grid-cols-10 gap-6">
            {/* Capture - 40% width with header strip */}
            <Card className="md:col-span-4 hover-elevate transition-all relative overflow-hidden">
              {/* Seafoam header strip */}
              <div className="h-2 bg-[#E6FAF6]" />
              <CardContent className="p-8 space-y-6">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                  <MessageSquare className="w-7 h-7" />
                </div>
                <div className="space-y-3">
                  <h3 className="text-2xl font-serif font-semibold text-foreground">Capture in Slack</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    SBI-guided modal appears instantly. No portal, no email, no friction. Submit in under 60 seconds.
                  </p>
                </div>
                <div className="pt-4 space-y-2">
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Quick Prompts</div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="text-xs">Situation</Badge>
                    <Badge variant="outline" className="text-xs">Behavior</Badge>
                    <Badge variant="outline" className="text-xs">Impact</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Anonymous - 30% width with corner lift */}
            <Card className="md:col-span-3 hover-elevate transition-all relative overflow-hidden">
              <CardContent className="p-8 space-y-6">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[#E6FAF6] text-[#0F4F49]">
                  <Lock className="w-7 h-7" />
                </div>
                <div className="space-y-3">
                  <h3 className="text-2xl font-serif font-semibold text-foreground">Anonymous by default</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    K-anonymity enforced. No @mentions, no names, no metadata.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  <span className="text-xs text-muted-foreground">k=5 minimum</span>
                </div>
              </CardContent>
              {/* Corner lift */}
              <div 
                className="absolute top-0 right-0 w-20 h-20 pointer-events-none"
                style={{
                  background: 'linear-gradient(225deg, rgba(15, 79, 73, 0.03) 50%, transparent 50%)',
                }}
              />
            </Card>

            {/* Publish - 30% width with side rail */}
            <Card className="md:col-span-3 hover-elevate transition-all relative overflow-hidden">
              {/* Side rail */}
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#E6FAF6]" />
              <CardContent className="p-8 pl-10 space-y-6">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                  <Zap className="w-7 h-7" />
                </div>
                <div className="space-y-3">
                  <h3 className="text-2xl font-serif font-semibold text-foreground">You said → We did</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Close the loop with transparent action posts. Build trust through follow-through.
                  </p>
                </div>
                <Badge className="bg-[#E6FAF6] text-[#0F4F49] border-[#0F4F49]/20">
                  Action loop
                </Badge>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* BUTTONS - Press physics demo */}
      <section className="relative py-16">
        <div className="mx-auto max-w-5xl px-6">
          <div className="space-y-3 mb-8">
            <Badge variant="secondary">Component Library</Badge>
            <h2 className="text-3xl font-serif font-semibold text-foreground">Buttons with Press Physics</h2>
          </div>
          
          <Card>
            <CardContent className="p-8 flex flex-wrap gap-4">
              <Button 
                data-testid="button-primary"
                className="active:translate-y-[1px] active:shadow-sm transition-all"
              >
                Primary (Teal)
              </Button>
              <Button 
                variant="secondary" 
                data-testid="button-accent"
                className="bg-[#E6FAF6] text-[#0F4F49] border-[#0F4F49]/20 hover:bg-[#E6FAF6] active:translate-y-[1px] active:shadow-sm transition-all"
              >
                Accent (Seafoam)
              </Button>
              <Button 
                variant="ghost" 
                data-testid="button-ghost"
                className="active:translate-y-[1px] transition-all"
              >
                Ghost
              </Button>
              <Button 
                variant="destructive" 
                data-testid="button-destructive"
                className="active:translate-y-[1px] active:shadow-sm transition-all"
              >
                Destructive
              </Button>
              <Button 
                variant="outline" 
                data-testid="button-outline"
                className="active:translate-y-[1px] transition-all"
              >
                Outline
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* INPUTS - Teal focus with inline rule hint */}
      <section className="relative py-16">
        <div className="mx-auto max-w-5xl px-6">
          <div className="space-y-3 mb-8">
            <Badge variant="secondary">Component Library</Badge>
            <h2 className="text-3xl font-serif font-semibold text-foreground">Form Inputs (SBI Framework)</h2>
          </div>
          
          <Card>
            <CardContent className="p-8 space-y-6 max-w-2xl">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Behavior (required)</label>
                <Textarea 
                  placeholder="What specific behavior or action did you observe?"
                  rows={3}
                  data-testid="textarea-behavior"
                  className="focus:ring-2 focus:ring-primary transition-all"
                />
                <div className="flex items-start gap-2 text-xs text-muted-foreground">
                  <AlertCircle className="w-3 h-3 mt-0.5 shrink-0" />
                  <span>No @mentions allowed · Focus on actions, not people</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Impact (required)</label>
                <Textarea 
                  placeholder="How did this affect you, the team, or the work?"
                  rows={3}
                  data-testid="textarea-impact"
                  className="focus:ring-2 focus:ring-primary transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Situation (optional)</label>
                <Input 
                  placeholder="When and where did this happen?"
                  data-testid="input-situation"
                  className="focus:ring-2 focus:ring-primary transition-all"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t mt-20 bg-background/80 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-6 py-12 text-center space-y-4">
          <p className="text-sm text-muted-foreground">
            Design Gallery · All components read live theme tokens
          </p>
          <div className="flex items-center justify-center gap-8 text-xs text-muted-foreground">
            <span>✓ Quad Field system</span>
            <span>✓ Overlap & Lift</span>
            <span>✓ Seafoam discipline</span>
            <span>✓ Press physics</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
