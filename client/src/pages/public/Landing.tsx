import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Play, Link2, Lock, CheckCircle2, ArrowRight } from "lucide-react";
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
    </div>
  );
}
