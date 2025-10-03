import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Play } from "lucide-react";
import { useEffect, useState } from "react";

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
                  className="active:translate-y-[1px] transition-all hover:bg-[#E6FAF6] hover:text-[#0F4F49] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
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
                    className="bg-[#E6FAF6] text-[#0F4F49] border-[#0F4F49]/20"
                    data-testid="badge-anonymous"
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
    </div>
  );
}
