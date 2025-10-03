import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Play, Link2, Lock, CheckCircle2, ArrowRight, Shield, Globe, Database, Clock, FileText, Award, BookOpen, Check, Edit3, BarChart3, EyeOff, Layers, Activity, Eye, Scale } from "lucide-react";
import { useEffect, useState, useRef } from "react";

// Quad motif SVG - rounded cross shape
const QuadMotif = ({ 
  className = "", 
  opacity = 0.06,
  size = 240 
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

// Hero Quad Field with parallax
const HeroQuadField = () => {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (!prefersReducedMotion) {
        setScrollY(window.scrollY);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const quads = [
    { top: '15%', left: '8%', size: 280 },
    { top: '55%', left: '75%', size: 320 },
    { top: '78%', left: '15%', size: 260 },
    { top: '25%', left: '-8%', size: 300 }, // Peeks off-canvas
  ];

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {quads.map((quad, i) => (
        <div
          key={i}
          className="absolute text-primary transition-transform duration-700 ease-out"
          style={{
            top: quad.top,
            left: quad.left,
            transform: `translate(-50%, -50%) translateY(${scrollY * (0.008 + i * 0.002)}px)`,
          }}
        >
          <QuadMotif size={quad.size} opacity={0.065} />
        </div>
      ))}
    </div>
  );
};

// Aggregation meter - 4 quads that fill sequentially
const AggregationMeter = () => {
  const quads = [
    { delay: 0, size: 12 },
    { delay: 80, size: 11 },
    { delay: 160, size: 10 },
    { delay: 240, size: 9 },
  ];

  return (
    <div className="flex items-center gap-1.5">
      {quads.map((quad, i) => (
        <div
          key={i}
          className="rounded-sm bg-primary animate-in fade-in slide-in-from-top-2"
          style={{
            width: `${quad.size}px`,
            height: `${quad.size}px`,
            animationDelay: `${quad.delay}ms`,
            animationDuration: '500ms',
            animationFillMode: 'both',
          }}
        >
          <QuadMotif size={quad.size} opacity={0.3} className="text-primary-foreground" />
        </div>
      ))}
    </div>
  );
};

// Cohort dots for Aggregate Summary - stagger left to right
const CohortDots = () => {
  const [isVisible, setIsVisible] = useState(false);
  const dotsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.3 }
    );

    if (dotsRef.current) {
      observer.observe(dotsRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const dots = 8;
  const seafoamTones = [
    'hsl(var(--seafoam))',
    'hsl(var(--seafoam-foreground) / 0.3)',
    'hsl(var(--seafoam-foreground) / 0.5)',
  ];

  return (
    <div ref={dotsRef} className="flex items-center gap-1.5" data-testid="cohort-dots">
      {Array.from({ length: dots }).map((_, i) => {
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        return (
          <div
            key={i}
            className="w-2 h-2 rounded-full"
            style={{
              backgroundColor: seafoamTones[i % seafoamTones.length],
              opacity: isVisible || prefersReducedMotion ? 1 : 0,
              transform: isVisible || prefersReducedMotion ? 'scale(1)' : 'scale(0)',
              transition: prefersReducedMotion ? 'none' : `opacity 300ms ease ${i * 80}ms, transform 300ms ease ${i * 80}ms`,
            }}
          />
        );
      })}
    </div>
  );
};

export default function Landing() {
  const handleAddToSlack = () => {
    window.location.href = '/api/slack/install';
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Subtle grain texture */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-[0.015] mix-blend-overlay z-0"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* HERO SECTION */}
      <section className="relative pt-24 pb-16 overflow-visible">
        <HeroQuadField />
        <div className="mx-auto max-w-7xl px-6 relative z-10">
          <div className="grid lg:grid-cols-[58fr_42fr] gap-12 lg:gap-16 items-center">
            {/* Left column: Copy + CTAs */}
            <div className="space-y-8 order-2 lg:order-1">
              <div className="space-y-6">
                <h1 
                  className="text-5xl lg:text-6xl font-serif tracking-tight text-foreground leading-[1.1]"
                  data-testid="text-hero-title"
                >
                  Make it safe to speak up—right in Slack.
                </h1>
                <p 
                  className="text-xl text-muted-foreground leading-relaxed max-w-2xl"
                  data-testid="text-hero-subtitle"
                >
                  Anonymous by default with behavior-focused prompts and aggregate summaries your leaders can act on.
                </p>
              </div>

              {/* CTAs */}
              <div className="flex flex-wrap gap-4">
                <Button 
                  size="lg"
                  onClick={handleAddToSlack}
                  data-testid="button-add-to-slack"
                  className="active:translate-y-[1px] active:shadow-sm transition-all focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <MessageSquare className="w-5 h-5 mr-2" strokeWidth={1.75} />
                  Add to Slack
                </Button>
                <Button 
                  size="lg"
                  variant="ghost"
                  data-testid="button-see-how-it-works"
                  className="active:translate-y-[1px] transition-all focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  style={{
                    ['--hover-bg' as string]: 'hsl(var(--seafoam))',
                    ['--hover-text' as string]: 'hsl(var(--seafoam-foreground))',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'hsl(var(--seafoam))';
                    (e.currentTarget as HTMLButtonElement).style.color = 'hsl(var(--seafoam-foreground))';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = '';
                    (e.currentTarget as HTMLButtonElement).style.color = '';
                  }}
                >
                  <Play className="w-5 h-5 mr-2" strokeWidth={1.75} />
                  See how it works
                </Button>
              </div>

              {/* Proof chips */}
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <Badge 
                  variant="secondary" 
                  className="font-normal"
                  data-testid="badge-proof-anonymous"
                >
                  Anonymous by default
                </Badge>
                <span className="text-muted-foreground/40">·</span>
                <Badge 
                  variant="secondary" 
                  className="font-normal"
                  data-testid="badge-proof-summaries"
                >
                  Aggregate summaries (not names)
                </Badge>
                <span className="text-muted-foreground/40">·</span>
                <Badge 
                  variant="secondary" 
                  className="font-normal"
                  data-testid="badge-proof-install"
                >
                  Install in minutes
                </Badge>
              </div>
            </div>

            {/* Right column: Product proof - hero card */}
            <div className="relative order-1 lg:order-2 lg:translate-y-14">
              <div 
                className="relative bg-card rounded-xl p-6 border-0"
                data-testid="card-hero-product"
                style={{
                  boxShadow: '0 24px 56px -12px rgba(15, 79, 73, 0.12)',
                  borderTop: '1px solid hsl(var(--primary))',
                  borderLeft: '1px solid hsl(var(--primary))',
                }}
              >
                {/* Tomato notification bead */}
                <div 
                  className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full"
                  style={{ background: 'hsl(9, 75%, 61%)' }}
                  data-testid="dot-notification"
                />

                {/* Aggregation meter at top */}
                <div className="flex items-center justify-between mb-6">
                  <AggregationMeter />
                  <Badge 
                    data-testid="badge-anonymous"
                    style={{
                      backgroundColor: 'hsl(var(--seafoam))',
                      color: 'hsl(var(--seafoam-foreground))',
                      borderColor: 'hsl(var(--seafoam-foreground) / 0.2)',
                    }}
                  >
                    Anonymous
                  </Badge>
                </div>

                {/* SBI fields mockup */}
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Situation (optional)
                    </label>
                    <div className="mt-2 text-sm text-foreground bg-muted/50 rounded-lg px-4 py-3">
                      Sprint planning, last Tuesday
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Behavior
                    </label>
                    <div className="mt-2 text-sm text-foreground bg-muted/50 rounded-lg px-4 py-3">
                      Demo scope wasn't clear to QA
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Impact
                    </label>
                    <div className="mt-2 text-sm text-foreground bg-muted/50 rounded-lg px-4 py-3">
                      Extra back-and-forth delayed release
                    </div>
                  </div>
                </div>

                <Button 
                  className="w-full mt-6 active:translate-y-[1px] active:shadow-sm transition-all"
                  data-testid="button-submit-anonymous"
                >
                  Submit anonymously
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* INSTALL MOMENTS STRIP */}
      <section className="relative py-16 bg-background">
        <div className="mx-auto max-w-7xl px-6">
          {/* Asymmetric 45/27.5/27.5 grid */}
          <div className="grid md:grid-cols-[45%_27.5%_27.5%] gap-6">
            
            {/* Tile 1: Install - Support Blue side rail */}
            <div 
              className="relative bg-card rounded-xl overflow-hidden group"
              data-testid="tile-install"
              style={{
                boxShadow: '0 12px 32px -8px rgba(0, 0, 0, 0.08)',
              }}
            >
              {/* Support Blue side rail */}
              <div 
                className="absolute left-0 top-0 bottom-0 w-2 transition-all duration-500 group-hover:w-2.5"
                style={{ backgroundColor: 'hsl(var(--support-blue))' }}
              />

              {/* Tiny quad watermark */}
              <div className="absolute top-4 right-4 opacity-[0.04]">
                <QuadMotif size={48} opacity={1} className="text-foreground" />
              </div>

              <div className="p-8 pl-10">
                <div className="space-y-4">
                  <div 
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
                    style={{ 
                      backgroundColor: 'hsl(var(--support-blue))',
                      color: 'hsl(var(--support-blue-foreground))'
                    }}
                  >
                    <Link2 className="w-6 h-6" strokeWidth={1.75} />
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-xl font-serif font-semibold text-foreground">
                      Connect in seconds
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      OAuth flow installs directly to your workspace—no IT required.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tile 2: Capture - Seafoam header strip + Quad Field */}
            <div 
              className="relative bg-card rounded-xl overflow-hidden"
              data-testid="tile-capture"
              style={{
                boxShadow: '0 12px 32px -8px rgba(0, 0, 0, 0.08)',
              }}
            >
              {/* Quad Field background (only behind this tile) */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div 
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary"
                >
                  <QuadMotif size={120} opacity={0.025} />
                </div>
              </div>

              {/* Seafoam header strip */}
              <div 
                className="p-4 flex items-center justify-between"
                style={{ backgroundColor: 'hsl(var(--seafoam))' }}
              >
                <div className="flex items-center gap-2">
                  {/* Static aggregation meter */}
                  <div className="flex items-center gap-1">
                    {[10, 9, 8, 7].map((size, i) => (
                      <div
                        key={i}
                        className="rounded-sm"
                        style={{
                          width: `${size}px`,
                          height: `${size}px`,
                          backgroundColor: 'hsl(var(--seafoam-foreground))',
                        }}
                      />
                    ))}
                  </div>
                </div>
                <Badge 
                  className="text-xs"
                  style={{ 
                    backgroundColor: 'hsl(var(--seafoam-foreground))',
                    color: 'hsl(var(--seafoam))'
                  }}
                >
                  Safe
                </Badge>
              </div>

              <div className="p-6 relative z-10">
                <div className="space-y-4">
                  <div 
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
                    style={{ backgroundColor: 'hsl(var(--seafoam))' }}
                  >
                    <Lock className="w-6 h-6" strokeWidth={1.75} style={{ color: 'hsl(var(--seafoam-foreground))' }} />
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-lg font-serif font-semibold text-foreground">
                      Behavior & Impact—Situation optional
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Guided SBI prompts in Slack. No portals.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tile 3: Publish - Lilac corner lift */}
            <div 
              className="relative bg-card rounded-xl overflow-hidden"
              data-testid="tile-publish"
              style={{
                boxShadow: '0 12px 32px -8px rgba(0, 0, 0, 0.08)',
              }}
            >
              {/* Lilac corner lift (top-right) - shadow backplate only */}
              <div 
                className="absolute top-0 right-0 w-20 h-20 pointer-events-none rounded-tr-xl"
                style={{
                  backgroundColor: 'hsl(var(--support-lilac))',
                  boxShadow: '-4px 4px 12px -4px rgba(62, 42, 120, 0.15)',
                }}
              />

              <div className="p-6 relative z-10">
                <div className="space-y-4">
                  <div 
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl relative"
                    style={{ 
                      backgroundColor: 'hsl(var(--support-lilac))',
                      color: 'hsl(var(--support-lilac-foreground))'
                    }}
                  >
                    <CheckCircle2 className="w-6 h-6" strokeWidth={1.75} />
                    {/* Tomato dot on action icon */}
                    <div 
                      className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full"
                      style={{ background: 'hsl(9, 75%, 61%)' }}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-lg font-serif font-semibold text-foreground">
                      Share actions—without exposing anyone
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      "You said → We did" posts close the loop transparently.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: AGGREGATE SUMMARY POSTER */}
      <section className="relative pt-40 pb-36 mt-28 bg-background">
        <div className="mx-auto max-w-7xl px-6">
          {/* Section heading */}
          <div className="mx-auto max-w-[920px] mb-12">
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-4">
              Themes at a glance.
            </h2>
            <p className="text-lg text-muted-foreground">
              When enough teammates weigh in, Teammato delivers a single, anonymized summary you can act on.
            </p>
          </div>

          {/* Wide poster card - centered */}
          <div className="mx-auto max-w-[920px]">
            <div 
              className="relative bg-card rounded-xl overflow-visible"
              data-testid="card-aggregate-summary"
              style={{
                boxShadow: '0 20px 60px -30px rgba(15, 79, 73, 0.15)',
                borderTop: '1px solid hsl(var(--primary))',
                borderLeft: '1px solid hsl(var(--primary))',
              }}
            >
              {/* Seafoam header strip */}
              <div 
                className="flex items-center justify-between px-8 py-4"
                style={{ backgroundColor: 'hsl(var(--seafoam))' }}
                data-testid="header-aggregate"
              >
                <div className="space-y-0.5">
                  <h3 
                    className="text-base font-bold"
                    style={{ color: 'hsl(var(--seafoam-foreground))' }}
                  >
                    Aggregate summary
                  </h3>
                  <p 
                    className="text-xs"
                    style={{ color: 'hsl(var(--seafoam-foreground) / 0.6)' }}
                  >
                    Topic · Roadmap clarity
                  </p>
                </div>
                <CohortDots />
              </div>

              {/* Body */}
              <div className="p-8 space-y-6">
                {/* Label */}
                <p className="text-sm font-medium text-muted-foreground">
                  Anonymized themes
                </p>

                {/* Theme chips - simple one-liners */}
                <div className="space-y-2.5">
                  <div className="text-sm text-foreground" data-testid="theme-chip-1">
                    Clarify scope before demos
                  </div>
                  <div className="text-sm text-foreground" data-testid="theme-chip-2">
                    Share sprint goals earlier
                  </div>
                  <div className="text-sm text-foreground" data-testid="theme-chip-3">
                    Add QA sign-off checklist
                  </div>
                </div>

                {/* Action bar */}
                <div className="pt-6 border-t border-border">
                  <div className="flex items-start gap-4">
                    <div 
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg relative"
                      style={{ 
                        backgroundColor: 'hsl(142 71% 45% / 0.1)',
                      }}
                    >
                      <ArrowRight className="w-5 h-5" style={{ color: 'hsl(142 71% 45%)' }} />
                      {/* Tomato micro-dot */}
                      <div 
                        className="absolute top-0 right-0 w-1.5 h-1.5 rounded-full"
                        style={{ background: 'hsl(9, 75%, 61%)' }}
                        data-testid="dot-action-tomato"
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-muted-foreground">
                          You said → We did
                        </span>
                      </div>
                      <p className="text-sm text-foreground">
                        Added QA sign-off to Friday release checklist
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Optional micro-note */}
              <div className="px-8 pb-6">
                <p className="text-xs text-muted-foreground text-right">
                  Individual comments are never shown
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: SECURITY FACT STRIP */}
      <section className="relative pt-16 pb-16 md:pt-16 md:pb-16" style={{ marginTop: '72px' }}>
        <div className="mx-auto max-w-7xl px-6">
          {/* Section heading */}
          <div className="mx-auto max-w-4xl mb-5">
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-3">
              Why it's safe
            </h2>
            <p className="text-lg text-muted-foreground">
              Privacy is enforced in the product—not promised in policy.
            </p>
          </div>

          {/* Security rail */}
          <div className="mx-auto max-w-4xl">
            <div 
              className="bg-card border border-border rounded-xl px-5 py-4"
              style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)' }}
              data-testid="rail-security"
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                {/* Pills container - wraps on desktop, scrolls on mobile */}
                <div className="flex items-center gap-3 overflow-x-auto md:overflow-visible md:flex-wrap scrollbar-hide snap-x md:snap-none snap-mandatory">
                  {/* Pill 1: Encrypt */}
                  <button
                    className="group flex items-center gap-2.5 px-4 py-2 rounded-lg border border-border bg-transparent hover:bg-[hsl(var(--seafoam)/0.08)] transition-all duration-200 hover:translate-y-[-1px] active:translate-y-0 snap-start shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    data-testid="pill-encrypt"
                  >
                    <Shield 
                      className="w-4 h-4 shrink-0" 
                      strokeWidth={1.75}
                      style={{ color: 'hsl(var(--primary))' }}
                    />
                    <span className="text-sm font-medium text-foreground whitespace-nowrap">
                      Encrypt per org (AEAD)
                    </span>
                  </button>

                  {/* Pill 2: Don't log IPs */}
                  <button
                    className="group flex items-center gap-2.5 px-4 py-2 rounded-lg border border-border bg-transparent hover:bg-[hsl(var(--seafoam)/0.08)] transition-all duration-200 hover:translate-y-[-1px] active:translate-y-0 snap-start shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    data-testid="pill-ip-logging"
                  >
                    <Globe 
                      className="w-4 h-4 shrink-0" 
                      strokeWidth={1.75}
                      style={{ color: 'hsl(var(--primary))' }}
                    />
                    <span className="text-sm font-medium text-foreground whitespace-nowrap">
                      Don't log IPs in feedback tables
                    </span>
                  </button>

                  {/* Pill 3: Isolate by tenant */}
                  <button
                    className="group flex items-center gap-2.5 px-4 py-2 rounded-lg border border-border bg-transparent hover:bg-[hsl(var(--seafoam)/0.08)] transition-all duration-200 hover:translate-y-[-1px] active:translate-y-0 snap-start shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    data-testid="pill-tenant-isolation"
                  >
                    <Database 
                      className="w-4 h-4 shrink-0" 
                      strokeWidth={1.75}
                      style={{ color: 'hsl(var(--primary))' }}
                    />
                    <span className="text-sm font-medium text-foreground whitespace-nowrap">
                      Isolate by tenant (RLS)
                    </span>
                  </button>

                  {/* Pill 4: Control retention */}
                  <button
                    className="group flex items-center gap-2.5 px-4 py-2 rounded-lg border border-border bg-transparent hover:bg-[hsl(var(--seafoam)/0.08)] transition-all duration-200 hover:translate-y-[-1px] active:translate-y-0 snap-start shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    data-testid="pill-retention"
                  >
                    <Clock 
                      className="w-4 h-4 shrink-0" 
                      strokeWidth={1.75}
                      style={{ color: 'hsl(var(--primary))' }}
                    />
                    <span className="text-sm font-medium text-foreground whitespace-nowrap">
                      Control retention & legal hold
                    </span>
                  </button>

                  {/* Pill 5: GDPR/CCPA */}
                  <button
                    className="group flex items-center gap-2.5 px-4 py-2 rounded-lg border border-border bg-transparent hover:bg-[hsl(var(--seafoam)/0.08)] transition-all duration-200 hover:translate-y-[-1px] active:translate-y-0 snap-start shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    data-testid="pill-gdpr"
                  >
                    <FileText 
                      className="w-4 h-4 shrink-0" 
                      strokeWidth={1.75}
                      style={{ color: 'hsl(var(--primary))' }}
                    />
                    <span className="text-sm font-medium text-foreground whitespace-nowrap">
                      GDPR/CCPA export & deletion
                    </span>
                  </button>

                  {/* Pill 6: SOC 2 */}
                  <button
                    className="group flex items-center gap-2.5 px-4 py-2 rounded-lg border border-border bg-transparent hover:bg-[hsl(var(--seafoam)/0.08)] transition-all duration-200 hover:translate-y-[-1px] active:translate-y-0 snap-start shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    data-testid="pill-soc2"
                  >
                    <Award 
                      className="w-4 h-4 shrink-0" 
                      strokeWidth={1.75}
                      style={{ color: 'hsl(var(--primary))' }}
                    />
                    <span className="text-sm font-medium text-foreground whitespace-nowrap">
                      SOC 2 audited annually
                    </span>
                  </button>
                </div>

                {/* Right-aligned link */}
                <a
                  href="/trust#security"
                  className="text-sm font-medium shrink-0 flex items-center gap-1.5 group hover:underline"
                  style={{ color: 'hsl(var(--primary))' }}
                  data-testid="link-trust-security"
                >
                  <span>Read the details</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" strokeWidth={1.75} />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: WHY IT WORKS */}
      <section className="relative pt-28 pb-36 md:pt-28 md:pb-36" style={{ marginTop: '72px' }}>
        <div className="mx-auto max-w-7xl px-6">
          {/* Section heading */}
          <div className="mb-6">
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-3">
              Why it works
            </h2>
            <p className="text-lg text-muted-foreground">
              Lower risk, clearer input, and in-flow capture—so feedback turns into action.
            </p>
          </div>

          {/* ROW A: Three mechanism tiles (45/27.5/27.5) */}
          <div className="grid grid-cols-1 lg:grid-cols-[45%_27.5%_27.5%] gap-5 mt-6">
            {/* Tile 1: Lower risk */}
            <div 
              className="relative bg-card rounded-xl p-6 border border-border overflow-hidden"
              data-testid="tile-lower-risk"
              style={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)' }}
            >
              {/* Seafoam side rail */}
              <div 
                className="absolute left-0 top-0 bottom-0 w-2"
                style={{ backgroundColor: 'hsl(var(--seafoam))' }}
              />
              
              <div className="relative pl-3">
                <h3 className="text-base font-bold text-foreground mb-4">
                  Anonymous by default → more people speak up
                </h3>
                
                <AggregationMeter />
                
                <p className="text-xs text-muted-foreground mt-4">
                  Individual comments remain hidden until there's enough input.
                </p>
              </div>
            </div>

            {/* Tile 2: Clearer input */}
            <div 
              className="relative bg-card rounded-xl overflow-hidden border border-border"
              data-testid="tile-clearer-input"
              style={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)' }}
            >
              {/* Support Blue header strip */}
              <div 
                className="h-2"
                style={{ backgroundColor: 'hsl(var(--support-blue))' }}
              />
              
              <div className="p-6">
                <h3 className="text-base font-bold text-foreground mb-4">
                  SBI prompts → behavior, not blame
                </h3>
                
                {/* Mini SBI card */}
                <div className="space-y-2">
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Behavior
                  </div>
                  <div className="text-xs text-foreground bg-muted/30 rounded px-3 py-2">
                    Demo scope wasn't clear
                  </div>
                  
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mt-3">
                    Impact
                  </div>
                  <div className="text-xs text-foreground bg-muted/30 rounded px-3 py-2">
                    Extra rework delayed release
                  </div>
                </div>
                
                <div className="mt-4">
                  <Badge variant="outline" className="text-xs">
                    No names/@
                  </Badge>
                </div>
              </div>
            </div>

            {/* Tile 3: In-flow capture */}
            <div 
              className="relative bg-card rounded-xl p-6 border border-border overflow-hidden"
              data-testid="tile-in-flow"
              style={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)' }}
            >
              {/* Lilac corner lift (shadow backplate) */}
              <div 
                className="absolute top-0 right-0 w-16 h-16 rounded-tr-xl pointer-events-none"
                style={{
                  backgroundColor: 'hsl(var(--support-lilac))',
                  boxShadow: '-3px 3px 10px -3px rgba(62, 42, 120, 0.12)',
                }}
              />
              
              <div className="relative z-10">
                <h3 className="text-base font-bold text-foreground mb-4">
                  Slack-native → higher completion
                </h3>
                
                {/* Three-step flow */}
                <div className="flex items-center gap-2 justify-center py-4">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Link2 className="w-4 h-4" style={{ color: 'hsl(var(--primary))' }} strokeWidth={1.75} />
                    </div>
                    <span className="text-xs text-muted-foreground mt-1">Install</span>
                  </div>
                  
                  <ArrowRight className="w-3 h-3 text-muted-foreground" strokeWidth={1.5} />
                  
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <MessageSquare className="w-4 h-4" style={{ color: 'hsl(var(--primary))' }} strokeWidth={1.75} />
                    </div>
                    <span className="text-xs text-muted-foreground mt-1">Modal</span>
                  </div>
                  
                  <ArrowRight className="w-3 h-3 text-muted-foreground" strokeWidth={1.5} />
                  
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4" style={{ color: 'hsl(var(--primary))' }} strokeWidth={1.75} />
                    </div>
                    <span className="text-xs text-muted-foreground mt-1">Submit</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ROW B: Before/After transformation */}
          <div className="mt-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
              {/* Before card */}
              <div 
                className="bg-card rounded-xl p-6 border border-border"
                data-testid="card-before"
                style={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)' }}
              >
                <div className="text-sm font-medium text-muted-foreground mb-3">
                  Before
                </div>
                <p className="text-sm text-foreground">
                  "The launch was bad and stressful."
                </p>
              </div>

              {/* After card */}
              <div 
                className="bg-card rounded-xl overflow-hidden border border-border"
                data-testid="card-after"
                style={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)' }}
              >
                <div 
                  className="px-6 py-3 flex items-center justify-between"
                  style={{ backgroundColor: 'hsl(var(--seafoam))' }}
                >
                  <span className="text-sm font-medium" style={{ color: 'hsl(var(--seafoam-foreground))' }}>
                    After (behavior + impact)
                  </span>
                </div>
                <div className="p-6">
                  <p className="text-sm text-foreground">
                    "Rescheduling the handoff <span className="underline decoration-primary/40 decoration-2">twice</span> caused rework; QA <span className="underline decoration-primary/40 decoration-2">rushed fixes late Friday</span>."
                  </p>
                </div>
              </div>
            </div>

            {/* Prompt nudges applied chip */}
            <div className="flex justify-center mt-6">
              <div className="inline-flex items-center gap-3 px-4 py-2.5 rounded-lg border border-border bg-card">
                <span className="text-sm font-medium text-foreground">Prompt nudges applied</span>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Check className="w-3 h-3" style={{ color: 'hsl(var(--primary))' }} strokeWidth={2} />
                    <span>Start with a verb</span>
                  </div>
                  <span>·</span>
                  <div className="flex items-center gap-1">
                    <Check className="w-3 h-3" style={{ color: 'hsl(var(--primary))' }} strokeWidth={2} />
                    <span>Describe the behavior</span>
                  </div>
                  <span>·</span>
                  <div className="flex items-center gap-1">
                    <Check className="w-3 h-3" style={{ color: 'hsl(var(--primary))' }} strokeWidth={2} />
                    <span>Include the impact</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Guardrails inline checklist */}
            <div className="flex justify-center mt-6">
              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" style={{ color: 'hsl(var(--primary))' }} strokeWidth={1.75} />
                  <span>Block @mentions</span>
                </div>
                <span>·</span>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" style={{ color: 'hsl(var(--primary))' }} strokeWidth={1.75} />
                  <span>Coarsen dates/places</span>
                </div>
                <span>·</span>
                <div className="flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5" style={{ color: 'hsl(var(--primary))' }} strokeWidth={1.75} />
                  <span>Aggregate before release</span>
                </div>
              </div>
            </div>
          </div>

          {/* ROW C: Research receipts */}
          <div className="mt-8 max-w-5xl mx-auto">
            <div 
              className="bg-card border border-border rounded-xl px-5 py-4"
              style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)' }}
              data-testid="rail-research"
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                {/* Receipts - wraps on desktop, scrolls on mobile */}
                <div className="flex items-center gap-4 overflow-x-auto md:overflow-visible md:flex-wrap scrollbar-hide snap-x md:snap-none snap-mandatory">
                  <div className="flex items-center gap-2 snap-start shrink-0">
                    <BookOpen className="w-4 h-4" style={{ color: 'hsl(var(--primary))' }} strokeWidth={1.75} />
                    <span className="text-sm text-foreground whitespace-nowrap">
                      Lower perceived risk → higher disclosure
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 snap-start shrink-0">
                    <BookOpen className="w-4 h-4" style={{ color: 'hsl(var(--primary))' }} strokeWidth={1.75} />
                    <span className="text-sm text-foreground whitespace-nowrap">
                      Behavior-focused input → more action taken
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 snap-start shrink-0">
                    <BookOpen className="w-4 h-4" style={{ color: 'hsl(var(--primary))' }} strokeWidth={1.75} />
                    <span className="text-sm text-foreground whitespace-nowrap">
                      In-flow capture → higher completion than portals
                    </span>
                  </div>
                </div>

                {/* Right-aligned link */}
                <a
                  href="/trust#research"
                  className="text-sm font-medium shrink-0 flex items-center gap-1.5 group hover:underline"
                  style={{ color: 'hsl(var(--primary))' }}
                  data-testid="link-trust-research"
                >
                  <span>Read the research</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" strokeWidth={1.75} />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5: ROLE TABS (HR / Managers / Security) */}
      <section className="relative pt-28 pb-36" style={{ marginTop: '72px' }}>
        <div className="mx-auto max-w-7xl px-6">
          {/* Section heading */}
          <div className="mb-6 text-center">
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-3">
              Built for your team
            </h2>
            <p className="text-lg text-muted-foreground">
              The same safe capture—tailored outcomes for HR, managers, and security.
            </p>
          </div>

          {/* Tabs */}
          <RoleTabs />
        </div>
      </section>

      {/* SECTION 6: HOW IT WORKS (4-step) */}
      <section className="relative pt-24 pb-28" style={{ marginTop: '72px' }}>
        <div className="mx-auto max-w-7xl px-6">
          {/* Section heading */}
          <div className="mb-5 text-center">
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-3">
              How it works
            </h2>
            <p className="text-lg text-muted-foreground">
              Capture in Slack, release in aggregate, share actions—done.
            </p>
          </div>

          {/* 4-step cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mt-5 max-w-6xl mx-auto">
            {/* Step 1: Open in Slack */}
            <div 
              className="relative bg-card border border-border rounded-xl overflow-hidden"
              style={{ 
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                minHeight: '160px' 
              }}
              data-testid="card-step-open"
            >
              {/* Support Blue header strip */}
              <div 
                className="h-2"
                style={{ backgroundColor: 'hsl(var(--support-blue))' }}
              />
              
              <div className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <MessageSquare 
                      className="w-5 h-5" 
                      style={{ color: 'hsl(var(--primary))' }} 
                      strokeWidth={1.75}
                    />
                  </div>
                  <h3 className="text-base font-bold text-foreground">
                    Open in Slack
                  </h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Launch the feedback modal from App Home or /teammato.
                </p>
              </div>
            </div>

            {/* Step 2: Write Behavior & Impact */}
            <div 
              className="relative bg-card border border-border rounded-xl overflow-hidden"
              style={{ 
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                minHeight: '160px' 
              }}
              data-testid="card-step-write"
            >
              {/* Seafoam side rail */}
              <div 
                className="absolute left-0 top-0 bottom-0 w-2"
                style={{ backgroundColor: 'hsl(var(--seafoam))' }}
              />
              
              <div className="p-6 pl-8">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Edit3 
                      className="w-5 h-5" 
                      style={{ color: 'hsl(var(--primary))' }} 
                      strokeWidth={1.75}
                    />
                  </div>
                  <h3 className="text-base font-bold text-foreground">
                    Write Behavior & Impact
                  </h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Guided SBI prompts keep it specific and constructive.
                </p>
              </div>
            </div>

            {/* Step 3: We aggregate when safe */}
            <div 
              className="relative bg-card border border-border rounded-xl overflow-hidden"
              style={{ 
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                minHeight: '160px' 
              }}
              data-testid="card-step-aggregate"
            >
              {/* Quad-corner lift (shadow only) */}
              <div 
                className="absolute top-0 right-0 w-16 h-16 rounded-tr-xl pointer-events-none"
                style={{
                  backgroundColor: 'transparent',
                  boxShadow: '-3px 3px 10px -3px rgba(0, 0, 0, 0.12)',
                }}
              />
              
              <div className="p-6 relative z-10">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <BarChart3 
                      className="w-5 h-5" 
                      style={{ color: 'hsl(var(--primary))' }} 
                      strokeWidth={1.75}
                    />
                  </div>
                  <h3 className="text-base font-bold text-foreground">
                    We aggregate when safe
                  </h3>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Individual comments stay hidden until enough teammates weigh in.
                </p>
                {/* Mini aggregation meter */}
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="w-5 h-5 rounded"
                      style={{ backgroundColor: 'hsl(var(--seafoam))' }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Step 4: Publish "You said → We did" */}
            <div 
              className="relative bg-card border border-border rounded-xl overflow-hidden"
              style={{ 
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                minHeight: '160px' 
              }}
              data-testid="card-step-publish"
            >
              <div className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  {/* Icon with lilac backplate and tomato dot */}
                  <div className="relative">
                    {/* Lilac corner backplate */}
                    <div 
                      className="absolute -top-1 -right-1 w-12 h-12 rounded-lg"
                      style={{ backgroundColor: 'hsl(var(--support-lilac))' }}
                    />
                    <div className="relative w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <CheckCircle2 
                        className="w-5 h-5" 
                        style={{ color: 'hsl(var(--primary))' }} 
                        strokeWidth={1.75}
                      />
                      {/* Tomato micro-accent dot */}
                      <div 
                        className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: 'hsl(var(--tomato))' }}
                      />
                    </div>
                  </div>
                  <h3 className="text-base font-bold text-foreground">
                    Publish "You said → We did"
                  </h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Share outcomes in Slack; build trust with visible follow-through.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 7: ANONYMITY PROMISE (Brand Ribbon) */}
      <section className="relative pt-20 pb-20" style={{ marginTop: '72px' }}>
        <div className="mx-auto max-w-7xl px-6">
          {/* Visually hidden H2 for a11y */}
          <h2 className="sr-only">Anonymity promise</h2>
          
          {/* Promise ribbon */}
          <div 
            className="relative mx-auto max-w-[940px] rounded-full border overflow-hidden"
            style={{
              backgroundColor: 'hsl(var(--accent) / 0.12)',
              borderColor: 'hsl(var(--border))',
              height: 'clamp(80px, 15vw, 104px)',
              boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.04)',
            }}
            data-testid="ribbon-anonymity-promise"
          >
            {/* Faint quad watermark - far right */}
            <div className="absolute right-8 top-1/2 -translate-y-1/2 pointer-events-none">
              <QuadMotif 
                size={140} 
                opacity={0.045} 
                className="text-[hsl(var(--seafoam))]" 
              />
            </div>

            {/* Content */}
            <div className="relative h-full flex items-center px-6 md:px-12 gap-3 md:gap-4">
              {/* Quad-lock icon */}
              <div 
                className="flex-shrink-0 w-5 h-5 md:w-7 md:h-7 relative"
                aria-hidden="true"
              >
                {/* Quad-lock: lock inside rounded cross */}
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 28 28"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-full h-full"
                  style={{ color: 'hsl(var(--accent-foreground))' }}
                >
                  {/* Rounded cross outline */}
                  <path
                    d="M11 2H17C18.1046 2 19 2.89543 19 4V9H24C25.1046 9 26 9.89543 26 11V17C26 18.1046 25.1046 19 24 19H19V24C19 25.1046 18.1046 26 17 26H11C9.89543 26 9 25.1046 9 24V19H4C2.89543 19 2 18.1046 2 17V11C2 9.89543 2.89543 9 4 9H9V4C9 2.89543 9.89543 2 11 2Z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    fill="none"
                  />
                  {/* Lock in center */}
                  <path
                    d="M14 10.5C12.6193 10.5 11.5 11.6193 11.5 13V13.5H16.5V13C16.5 11.6193 15.3807 10.5 14 10.5Z"
                    fill="currentColor"
                  />
                  <rect
                    x="11"
                    y="13.5"
                    width="6"
                    height="4.5"
                    rx="0.5"
                    fill="currentColor"
                  />
                </svg>
              </div>

              {/* Promise text */}
              <p 
                className="text-base md:text-lg font-medium leading-relaxed"
                style={{ 
                  color: 'hsl(var(--accent-foreground))',
                  maxWidth: '64ch'
                }}
              >
                We show themes, not people. Individual comments remain hidden until there's enough input.
              </p>
            </div>
          </div>

          {/* Optional privacy link (outside ribbon, below) */}
          <div className="text-center mt-4">
            <a 
              href="#"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-[hsl(var(--accent-foreground))] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--accent-foreground))] focus-visible:ring-offset-2 rounded"
              data-testid="link-privacy-details"
            >
              <span>Privacy details</span>
              <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.75} />
            </a>
          </div>
        </div>
      </section>

      {/* SECTION 8: FEATURE GRID (6 tiles) */}
      <section className="relative pt-24 pb-32" style={{ marginTop: '72px' }}>
        <div className="mx-auto max-w-7xl px-6">
          {/* Section heading */}
          <div className="mb-5 text-center">
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-3">
              What you get
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              The essentials for safe capture, clear input, and visible follow-through—built for Slack.
            </p>
          </div>

          {/* 6-tile grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mt-5 max-w-6xl mx-auto">
            
            {/* Tile 1: Slack-native capture (Blue header strip) */}
            <div 
              className="relative bg-card border border-border rounded-xl overflow-hidden"
              style={{ 
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                minHeight: '175px'
              }}
              data-testid="tile-slack-capture"
            >
              {/* Support Blue header strip */}
              <div 
                className="h-2"
                style={{ backgroundColor: 'hsl(var(--support-blue))' }}
              />
              
              <div className="p-6">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <MessageSquare 
                      className="w-5 h-5" 
                      style={{ color: 'hsl(var(--primary))' }} 
                      strokeWidth={1.75}
                    />
                  </div>
                  <h3 className="text-base font-bold text-foreground leading-tight">
                    Slack-native capture
                  </h3>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  Open the modal from App Home or /teammato—no extra portal.
                </p>
              </div>
            </div>

            {/* Tile 2: Anonymous by default (Seafoam side rail) */}
            <div 
              className="relative bg-card border border-border rounded-xl overflow-hidden"
              style={{ 
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                minHeight: '175px'
              }}
              data-testid="tile-anonymous"
            >
              {/* Seafoam side rail */}
              <div 
                className="absolute left-0 top-0 bottom-0 w-2"
                style={{ backgroundColor: 'hsl(var(--seafoam))' }}
              />
              
              <div className="p-6 pl-8">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <EyeOff 
                      className="w-5 h-5" 
                      style={{ color: 'hsl(var(--primary))' }} 
                      strokeWidth={1.75}
                    />
                  </div>
                  <h3 className="text-base font-bold text-foreground leading-tight">
                    Anonymous by default
                  </h3>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  You see themes—not people. Individual comments aren't exposed.
                </p>
              </div>
            </div>

            {/* Tile 3: SBI prompts (Quad-corner lift) */}
            <div 
              className="relative bg-card border border-border rounded-xl overflow-hidden"
              style={{ 
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                minHeight: '175px'
              }}
              data-testid="tile-sbi"
            >
              {/* Quad-corner lift (shadow only) */}
              <div 
                className="absolute top-0 right-0 w-16 h-16 rounded-tr-xl pointer-events-none"
                style={{
                  backgroundColor: 'transparent',
                  boxShadow: '-3px 3px 10px -3px rgba(0, 0, 0, 0.12)',
                }}
              />
              
              <div className="p-6 relative z-10">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <FileText 
                      className="w-5 h-5" 
                      style={{ color: 'hsl(var(--primary))' }} 
                      strokeWidth={1.75}
                    />
                  </div>
                  <h3 className="text-base font-bold text-foreground leading-tight">
                    SBI prompts for clarity
                  </h3>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  Behavior & Impact required; fewer rants, more signal.
                </p>
              </div>
            </div>

            {/* Tile 4: Aggregate summaries (Mini aggregation meter) */}
            <div 
              className="relative bg-card border border-border rounded-xl overflow-hidden"
              style={{ 
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                minHeight: '175px'
              }}
              data-testid="tile-aggregate"
            >
              <div className="p-6">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <BarChart3 
                      className="w-5 h-5" 
                      style={{ color: 'hsl(var(--primary))' }} 
                      strokeWidth={1.75}
                    />
                  </div>
                  <h3 className="text-base font-bold text-foreground leading-tight">
                    Aggregate summaries only
                  </h3>
                </div>
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                  Results release when there's enough input—no one stands out.
                </p>
                {/* Mini aggregation meter (4 quads inline, static) */}
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="w-5 h-5 rounded"
                      style={{ backgroundColor: 'hsl(var(--seafoam))' }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Tile 5: Topics & rolling General (Lilac corner backplate) */}
            <div 
              className="relative bg-card border border-border rounded-xl overflow-hidden"
              style={{ 
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                minHeight: '175px'
              }}
              data-testid="tile-topics"
            >
              <div className="p-6">
                <div className="flex items-start gap-3 mb-3">
                  {/* Icon with lilac corner backplate */}
                  <div className="relative flex-shrink-0">
                    <div 
                      className="absolute -top-1 -right-1 w-12 h-12 rounded-lg"
                      style={{ backgroundColor: 'hsl(var(--support-lilac))' }}
                    />
                    <div className="relative w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Layers 
                        className="w-5 h-5" 
                        style={{ color: 'hsl(var(--primary))' }} 
                        strokeWidth={1.75}
                      />
                    </div>
                  </div>
                  <h3 className="text-base font-bold text-foreground leading-tight">
                    Topics & rolling 'General'
                  </h3>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  Run time-boxed topics and a persistent 'General feedback' stream.
                </p>
              </div>
            </div>

            {/* Tile 6: Actions in Slack (Clean, tomato micro-dot) */}
            <div 
              className="relative bg-card border border-border rounded-xl overflow-hidden"
              style={{ 
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                minHeight: '175px'
              }}
              data-testid="tile-actions"
            >
              <div className="p-6">
                <div className="flex items-start gap-3 mb-3">
                  <div className="relative w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 
                      className="w-5 h-5" 
                      style={{ color: 'hsl(var(--primary))' }} 
                      strokeWidth={1.75}
                    />
                    {/* Tomato micro-accent dot (only one in this section) */}
                    <div 
                      className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: 'hsl(var(--tomato))' }}
                    />
                  </div>
                  <h3 className="text-base font-bold text-foreground leading-tight">
                    Actions in Slack
                  </h3>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  Publish 'You said → We did' updates to close the loop.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* SECTION 9: TRUST & SECURITY (Preview) */}
      <section className="relative pt-24 pb-32" style={{ marginTop: '72px' }}>
        <div className="mx-auto max-w-7xl px-6">
          {/* Section heading */}
          <div className="mb-5 text-center">
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-3">
              Trust & security
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Privacy is enforced in the product—and verified by audits.
            </p>
          </div>

          {/* Block A: Audit & compliance strip */}
          <div 
            className="relative mx-auto max-w-5xl mt-8 rounded-xl border bg-card"
            style={{ 
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
              padding: '20px 24px'
            }}
            data-testid="strip-audit-compliance"
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              {/* Pills container */}
              <div className="flex flex-wrap gap-2 md:gap-3">
                {/* SOC 2 pill */}
                <button 
                  className="flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-transparent hover:bg-[hsl(var(--accent)/0.1)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--accent-foreground))] focus-visible:ring-offset-2"
                  data-testid="pill-soc2"
                >
                  <Shield 
                    className="w-4 h-4" 
                    style={{ color: 'hsl(var(--accent-foreground))' }}
                    strokeWidth={1.75}
                  />
                  <span className="text-sm font-medium text-foreground whitespace-nowrap">
                    SOC 2 audited annually
                  </span>
                </button>

                {/* Pen testing pill */}
                <button 
                  className="flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-transparent hover:bg-[hsl(var(--accent)/0.1)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--accent-foreground))] focus-visible:ring-offset-2"
                  data-testid="pill-pentest"
                >
                  <Activity 
                    className="w-4 h-4" 
                    style={{ color: 'hsl(var(--accent-foreground))' }}
                    strokeWidth={1.75}
                  />
                  <span className="text-sm font-medium text-foreground whitespace-nowrap">
                    Regular pen testing
                  </span>
                </button>

                {/* 24/7 monitoring pill */}
                <button 
                  className="flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-transparent hover:bg-[hsl(var(--accent)/0.1)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--accent-foreground))] focus-visible:ring-offset-2"
                  data-testid="pill-monitoring"
                >
                  <Eye 
                    className="w-4 h-4" 
                    style={{ color: 'hsl(var(--accent-foreground))' }}
                    strokeWidth={1.75}
                  />
                  <span className="text-sm font-medium text-foreground whitespace-nowrap">
                    24/7 monitoring
                  </span>
                </button>

                {/* GDPR/CCPA pill */}
                <button 
                  className="flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-transparent hover:bg-[hsl(var(--accent)/0.1)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--accent-foreground))] focus-visible:ring-offset-2"
                  data-testid="pill-gdpr"
                >
                  <Scale 
                    className="w-4 h-4" 
                    style={{ color: 'hsl(var(--accent-foreground))' }}
                    strokeWidth={1.75}
                  />
                  <span className="text-sm font-medium text-foreground whitespace-nowrap">
                    GDPR/CCPA-ready controls
                  </span>
                </button>
              </div>

              {/* Right-aligned link */}
              <a 
                href="/trust#security"
                className="inline-flex items-center gap-1.5 text-sm font-medium hover:text-[hsl(var(--accent-foreground))] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--accent-foreground))] focus-visible:ring-offset-2 rounded whitespace-nowrap"
                style={{ color: 'hsl(var(--accent-foreground))' }}
                data-testid="link-trust-details"
              >
                <span>Read the details</span>
                <ArrowRight className="w-4 h-4" strokeWidth={1.75} />
              </a>
            </div>
          </div>

          {/* Block B: How privacy is enforced (mini diagram) */}
          <div 
            className="relative mx-auto max-w-[920px] rounded-xl border bg-card overflow-hidden"
            style={{ 
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
              marginTop: '48px',
              padding: '24px'
            }}
            data-testid="card-privacy-diagram"
          >
            {/* Faint quad watermark in corner */}
            <div className="absolute top-4 right-4 pointer-events-none">
              <QuadMotif 
                size={100} 
                opacity={0.045} 
                className="text-[hsl(var(--seafoam))]" 
              />
            </div>

            {/* Diagram title */}
            <h3 className="text-sm font-bold text-foreground mb-6">
              How privacy is enforced
            </h3>

            {/* Diagram flow (left to right) */}
            <div 
              className="relative flex items-center justify-between gap-4 md:gap-6"
              style={{ minHeight: '240px' }}
              aria-label="How privacy is enforced"
            >
              {/* 1. Topic instance */}
              <div className="flex flex-col items-center gap-2 flex-1">
                <div 
                  className="w-20 h-20 rounded-lg border-2 flex items-center justify-center"
                  style={{ borderColor: 'hsl(var(--border))' }}
                >
                  <span className="text-sm font-mono font-bold text-muted-foreground">
                    W##
                  </span>
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  Topic instance
                </p>
              </div>

              {/* Arrow */}
              <ArrowRight 
                className="w-5 h-5 text-muted-foreground flex-shrink-0" 
                strokeWidth={1.75}
              />

              {/* 2. Submissions (multiple small quads) */}
              <div className="flex flex-col items-center gap-2 flex-1">
                <div className="flex flex-wrap gap-1.5 justify-center max-w-[100px]">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div
                      key={i}
                      className="w-6 h-6 rounded"
                      style={{ backgroundColor: 'hsl(var(--primary))' }}
                    />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  Submissions
                </p>
              </div>

              {/* Arrow */}
              <ArrowRight 
                className="w-5 h-5 text-muted-foreground flex-shrink-0" 
                strokeWidth={1.75}
              />

              {/* 3. Threshold gate (lock + meter) - Seafoam signal */}
              <div className="flex flex-col items-center gap-2 flex-1">
                <div 
                  className="relative w-20 h-20 rounded-lg border-2 flex flex-col items-center justify-center gap-1.5 p-2"
                  style={{ 
                    borderColor: 'hsl(var(--seafoam-foreground))',
                    backgroundColor: 'hsl(var(--seafoam) / 0.15)'
                  }}
                >
                  {/* Lock icon */}
                  <Lock 
                    className="w-6 h-6" 
                    style={{ color: 'hsl(var(--seafoam-foreground))' }}
                    strokeWidth={2}
                  />
                  {/* Mini meter */}
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="w-2.5 h-2.5 rounded-sm"
                        style={{ backgroundColor: 'hsl(var(--seafoam-foreground))' }}
                      />
                    ))}
                  </div>
                </div>
                <p 
                  className="text-xs font-medium text-center"
                  style={{ color: 'hsl(var(--seafoam-foreground))' }}
                >
                  Threshold gate
                </p>
              </div>

              {/* Arrow */}
              <ArrowRight 
                className="w-5 h-5 text-muted-foreground flex-shrink-0" 
                strokeWidth={1.75}
              />

              {/* 4. Aggregate summary */}
              <div className="flex flex-col items-center gap-2 flex-1">
                <div 
                  className="w-20 h-20 rounded-lg border-2 flex items-center justify-center p-2"
                  style={{ borderColor: 'hsl(var(--border))' }}
                >
                  <BarChart3 
                    className="w-6 h-6" 
                    style={{ color: 'hsl(var(--primary))' }}
                    strokeWidth={1.75}
                  />
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  Aggregate summary
                </p>
              </div>
            </div>

            {/* Caption */}
            <p className="text-sm text-muted-foreground text-center mt-6">
              Themes release in aggregate once the minimum threshold is met.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 10: CONVERSION STRIP (Final CTA) */}
      <section className="relative pt-28 pb-36" style={{ marginTop: '72px' }}>
        <div className="mx-auto max-w-7xl px-6">
          
          {/* CTA Card */}
          <div 
            className="relative mx-auto max-w-[920px] rounded-xl border bg-card"
            style={{ 
              boxShadow: '0 12px 24px rgba(0, 0, 0, 0.08)',
              padding: '28px'
            }}
            data-testid="card-final-cta"
          >
            {/* Headline & Subhead */}
            <div className="text-center mb-6">
              <h2 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-3">
                Start free in Slack
                {/* Optional seafoam underline accent */}
                <div 
                  className="mx-auto mt-2 h-0.5 rounded-full"
                  style={{ 
                    width: '80px',
                    backgroundColor: 'hsl(var(--seafoam-foreground))' 
                  }}
                />
              </h2>
              <p className="text-lg text-muted-foreground">
                Install in minutes. Anonymous by default. Built for action.
              </p>
            </div>

            {/* Primary CTA Button */}
            <div className="flex justify-center mb-5">
              <Button
                size="lg"
                className="gap-2 active:translate-y-[1px] transition-transform"
                data-testid="button-add-to-slack"
              >
                <MessageSquare className="w-5 h-5" strokeWidth={1.75} />
                <span>Add to Slack</span>
              </Button>
            </div>

            {/* Secondary actions (inline, muted) */}
            <div className="flex items-center justify-center gap-4 mb-4">
              <a 
                href="/pricing"
                className="text-sm text-muted-foreground hover:text-foreground hover:underline transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--accent-foreground))] focus-visible:ring-offset-2 rounded"
                data-testid="link-view-pricing"
              >
                View pricing
              </a>
              <span className="text-muted-foreground">·</span>
              <a 
                href="/contact"
                className="text-sm text-muted-foreground hover:text-foreground hover:underline transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--accent-foreground))] focus-visible:ring-offset-2 rounded"
                data-testid="link-talk-to-sales"
              >
                Talk to sales
              </a>
            </div>

            {/* Mini reassurance row */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-3 border-t border-border">
              <div className="flex items-center gap-1.5">
                <EyeOff 
                  className="w-3.5 h-3.5 text-muted-foreground" 
                  strokeWidth={1.75}
                />
                <span className="text-xs text-muted-foreground">
                  Anonymous by default
                </span>
              </div>
              <span className="text-muted-foreground">·</span>
              <div className="flex items-center gap-1.5">
                <Shield 
                  className="w-3.5 h-3.5 text-muted-foreground" 
                  strokeWidth={1.75}
                />
                <span className="text-xs text-muted-foreground">
                  SOC 2 audited
                </span>
              </div>
              <span className="text-muted-foreground">·</span>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 
                  className="w-3.5 h-3.5 text-muted-foreground" 
                  strokeWidth={1.75}
                />
                <span className="text-xs text-muted-foreground">
                  Remove anytime
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

// Role Tabs Component
function RoleTabs() {
  const [activeTab, setActiveTab] = useState<'hr' | 'managers' | 'security'>('hr');

  const tabs = [
    { id: 'hr' as const, label: 'HR' },
    { id: 'managers' as const, label: 'Managers' },
    { id: 'security' as const, label: 'Security' },
  ];

  return (
    <div className="mt-8 max-w-[980px] mx-auto">
      {/* Tab buttons */}
      <div 
        role="tablist" 
        className="flex items-center justify-center gap-2 mb-5"
        aria-label="Role perspectives"
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`panel-${tab.id}`}
            onClick={() => setActiveTab(tab.id)}
            className="relative px-5 py-2.5 rounded-full text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            style={{
              color: activeTab === tab.id ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))',
            }}
            data-testid={`tab-${tab.id}`}
          >
            <span className="flex items-center gap-2">
              {activeTab === tab.id && (
                <QuadMotif size={12} className="text-[hsl(var(--seafoam))]" />
              )}
              <span>{tab.label}</span>
            </span>
            {activeTab === tab.id && (
              <div 
                className="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 rounded-full transition-all duration-200"
                style={{ 
                  width: '60%',
                  backgroundColor: 'hsl(var(--seafoam))' 
                }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Panels */}
      <div className="relative">
        {/* HR Panel */}
        <div
          role="tabpanel"
          id="panel-hr"
          aria-labelledby="tab-hr"
          className={`transition-opacity duration-150 ${
            activeTab === 'hr' ? 'opacity-100' : 'opacity-0 absolute inset-0 pointer-events-none'
          }`}
          data-testid="panel-hr"
        >
          <div className="space-y-6">
            {/* Lead statement */}
            <p className="text-lg font-medium text-foreground text-center">
              Raise participation and retention—without risky open comments.
            </p>

            {/* Proof module: Aggregate Summary Mini */}
            <div className="bg-card border border-border rounded-xl overflow-hidden" style={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)' }}>
              <div 
                className="px-5 py-3"
                style={{ backgroundColor: 'hsl(var(--seafoam))' }}
              >
                <h4 className="text-sm font-bold" style={{ color: 'hsl(var(--seafoam-foreground))' }}>
                  Weekly themes
                </h4>
              </div>
              <div className="p-5 space-y-3">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="text-xs">
                    Meeting prep efficiency
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    Async communication clarity
                  </Badge>
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <ArrowRight className="w-3 h-3" style={{ color: 'hsl(var(--primary))' }} strokeWidth={2} />
                    <span>You said → We did</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Micro-list */}
            <ul className="space-y-2 text-sm text-foreground">
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 mt-0.5 shrink-0" style={{ color: 'hsl(var(--primary))' }} strokeWidth={2} />
                <span>Anonymous by default (themes, not names)</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 mt-0.5 shrink-0" style={{ color: 'hsl(var(--primary))' }} strokeWidth={2} />
                <span>Clearer, behavior-focused input</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 mt-0.5 shrink-0" style={{ color: 'hsl(var(--primary))' }} strokeWidth={2} />
                <span>Action loop builds trust</span>
              </li>
            </ul>

            {/* CTA link */}
            <div className="text-center pt-2">
              <a
                href="/faq#hr"
                className="inline-flex items-center gap-1.5 text-sm font-medium group hover:underline"
                style={{ color: 'hsl(var(--primary))' }}
                data-testid="link-hr-faq"
              >
                <span>See HR FAQ</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" strokeWidth={1.75} />
              </a>
            </div>
          </div>
        </div>

        {/* Managers Panel */}
        <div
          role="tabpanel"
          id="panel-managers"
          aria-labelledby="tab-managers"
          className={`transition-opacity duration-150 ${
            activeTab === 'managers' ? 'opacity-100' : 'opacity-0 absolute inset-0 pointer-events-none'
          }`}
          data-testid="panel-managers"
        >
          <div className="space-y-6">
            {/* Lead statement */}
            <p className="text-lg font-medium text-foreground text-center">
              Fewer surprises, faster fixes—right in Slack.
            </p>

            {/* Proof module: Action Post Card */}
            <div className="relative bg-card border border-border rounded-xl p-5 overflow-hidden" style={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)' }}>
              {/* Support Blue side rail */}
              <div 
                className="absolute left-0 top-0 bottom-0 w-2"
                style={{ backgroundColor: 'hsl(var(--support-blue))' }}
              />
              
              <div className="pl-3">
                <div className="flex items-center gap-2 mb-3">
                  <ArrowRight className="w-4 h-4" style={{ color: 'hsl(var(--primary))' }} strokeWidth={2} />
                  <span className="text-sm font-bold text-foreground">You said → We did</span>
                </div>
                <p className="text-sm text-foreground">
                  Adopted 25-min meeting default; added 5-min buffer slots in shared calendar.
                </p>
              </div>
            </div>

            {/* Micro-list */}
            <ul className="space-y-2 text-sm text-foreground">
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 mt-0.5 shrink-0" style={{ color: 'hsl(var(--primary))' }} strokeWidth={2} />
                <span>Capture in Slack, &lt;60s from intent to submit</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 mt-0.5 shrink-0" style={{ color: 'hsl(var(--primary))' }} strokeWidth={2} />
                <span>Themes in one place—no hunting in threads</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 mt-0.5 shrink-0" style={{ color: 'hsl(var(--primary))' }} strokeWidth={2} />
                <span>Share outcomes in-channel</span>
              </li>
            </ul>

            {/* CTA link */}
            <div className="text-center pt-2">
              <a
                href="#how-it-works"
                className="inline-flex items-center gap-1.5 text-sm font-medium group hover:underline"
                style={{ color: 'hsl(var(--primary))' }}
                data-testid="link-how-it-works"
              >
                <span>See how it works</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" strokeWidth={1.75} />
              </a>
            </div>
          </div>
        </div>

        {/* Security Panel */}
        <div
          role="tabpanel"
          id="panel-security"
          aria-labelledby="tab-security"
          className={`transition-opacity duration-150 ${
            activeTab === 'security' ? 'opacity-100' : 'opacity-0 absolute inset-0 pointer-events-none'
          }`}
          data-testid="panel-security"
        >
          <div className="space-y-6">
            {/* Lead statement */}
            <p className="text-lg font-medium text-foreground text-center">
              Privacy is enforced in the product—not promised in policy.
            </p>

            {/* Proof module: Security Fact Strip Mini */}
            <div className="relative">
              {/* Lilac corner lift backplate */}
              <div 
                className="absolute top-0 right-0 w-20 h-20 rounded-tr-xl pointer-events-none"
                style={{
                  backgroundColor: 'hsl(var(--support-lilac))',
                  boxShadow: '-4px 4px 12px -4px rgba(62, 42, 120, 0.15)',
                }}
              />
              
              <div className="relative bg-card border border-border rounded-xl px-5 py-4" style={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)' }}>
                <div className="flex flex-wrap items-center gap-3 justify-center text-xs text-foreground">
                  <div className="flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5" style={{ color: 'hsl(var(--primary))' }} strokeWidth={1.75} />
                    <span>Encrypt per org (AEAD)</span>
                  </div>
                  <span className="text-muted-foreground">·</span>
                  <div className="flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5" style={{ color: 'hsl(var(--primary))' }} strokeWidth={1.75} />
                    <span>Don't log IPs in feedback tables</span>
                  </div>
                  <span className="text-muted-foreground">·</span>
                  <div className="flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5" style={{ color: 'hsl(var(--primary))' }} strokeWidth={1.75} />
                    <span>Isolate by tenant (RLS)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Micro-list */}
            <ul className="space-y-2 text-sm text-foreground">
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 mt-0.5 shrink-0" style={{ color: 'hsl(var(--primary))' }} strokeWidth={2} />
                <span>Per-org keys; tenant isolation (RLS)</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 mt-0.5 shrink-0" style={{ color: 'hsl(var(--primary))' }} strokeWidth={2} />
                <span>No IPs/UA in feedback tables</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 mt-0.5 shrink-0" style={{ color: 'hsl(var(--primary))' }} strokeWidth={2} />
                <span>SOC 2 audits + pen tests</span>
              </li>
            </ul>

            {/* CTA link */}
            <div className="text-center pt-2">
              <a
                href="/trust#security"
                className="inline-flex items-center gap-1.5 text-sm font-medium group hover:underline"
                style={{ color: 'hsl(var(--primary))' }}
                data-testid="link-trust-security-panel"
              >
                <span>Read the details</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" strokeWidth={1.75} />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
