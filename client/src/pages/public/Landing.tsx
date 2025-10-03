import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { 
  Shield, 
  Users, 
  Lock, 
  CheckCircle2,
  MessageSquare,
  ArrowRight,
  ChevronDown,
  Menu,
  X
} from "lucide-react";
import { useState } from "react";
import { buildSlackAuthorizeUrl } from "@/lib/slackInstall";

export default function Landing() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaqId, setOpenFaqId] = useState<number | null>(null);

  const slackAuthUrl = buildSlackAuthorizeUrl();

  return (
    <div className="min-h-screen bg-background">
      {/* TOP NAV */}
      <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-6 h-6 text-primary" strokeWidth={1.75} />
              <span className="text-xl font-bold">Teammato</span>
            </div>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-6">
              <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Features
              </a>
              <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Pricing
              </a>
              <a href="#faq" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                FAQ
              </a>
              <Button 
                size="sm" 
                asChild
                data-testid="nav-add-to-slack"
              >
                <a href={slackAuthUrl}>
                  Add to Slack
                </a>
              </Button>
            </div>

            {/* Mobile menu button */}
            <button
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              data-testid="button-mobile-menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile menu */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 space-y-3 border-t">
              <a href="#features" className="block text-sm text-muted-foreground hover:text-foreground">
                Features
              </a>
              <a href="#pricing" className="block text-sm text-muted-foreground hover:text-foreground">
                Pricing
              </a>
              <a href="#faq" className="block text-sm text-muted-foreground hover:text-foreground">
                FAQ
              </a>
              <Button size="sm" className="w-full" asChild>
                <a href={slackAuthUrl}>Add to Slack</a>
              </Button>
            </div>
          )}
        </div>
      </nav>

      {/* HERO */}
      <section className="relative py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-5xl font-bold text-foreground mb-6" data-testid="text-hero-headline">
              Hero Headline Goes Here
            </h1>
            <p className="text-xl text-muted-foreground mb-8" data-testid="text-hero-subhead">
              Subhead that explains the core value proposition in one clear sentence.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button 
                size="lg" 
                asChild
                data-testid="button-hero-cta"
              >
                <a href={slackAuthUrl}>
                  <MessageSquare className="w-5 h-5 mr-2" />
                  Add to Slack
                </a>
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                data-testid="button-hero-secondary"
              >
                Watch demo
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* LOGO CLOUD */}
      <section className="py-24 border-t">
        <div className="mx-auto max-w-7xl px-6">
          <p className="text-center text-sm text-muted-foreground mb-8">
            Trusted by teams at
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center justify-items-center">
            {[1, 2, 3, 4].map((i) => (
              <div 
                key={i} 
                className="w-32 h-12 rounded bg-muted flex items-center justify-center"
                data-testid={`logo-${i}`}
              >
                <span className="text-sm text-muted-foreground">Logo {i}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* STEPS (3) */}
      <section className="py-24" id="features">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              How It Works
            </h2>
            <p className="text-lg text-muted-foreground">
              Three simple steps to get started
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: MessageSquare, title: "Step 1", desc: "Description of first step" },
              { icon: Users, title: "Step 2", desc: "Description of second step" },
              { icon: CheckCircle2, title: "Step 3", desc: "Description of third step" }
            ].map((step, i) => (
              <Card key={i} className="p-6 rounded-2xl" data-testid={`card-step-${i + 1}`}>
                <div className="mb-4">
                  <step.icon className="w-8 h-8 text-primary" strokeWidth={1.75} />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-2">
                  {step.title}
                </h3>
                <p className="text-muted-foreground">
                  {step.desc}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURE GRID (4) */}
      <section className="py-24 bg-muted/30">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Key Features
            </h2>
            <p className="text-lg text-muted-foreground">
              Everything you need in one platform
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {[
              { icon: Shield, title: "Feature 1", desc: "Feature description goes here" },
              { icon: Lock, title: "Feature 2", desc: "Feature description goes here" },
              { icon: Users, title: "Feature 3", desc: "Feature description goes here" },
              { icon: MessageSquare, title: "Feature 4", desc: "Feature description goes here" }
            ].map((feature, i) => (
              <Card key={i} className="p-6 rounded-2xl" data-testid={`card-feature-${i + 1}`}>
                <feature.icon className="w-8 h-8 text-primary mb-4" strokeWidth={1.75} />
                <h3 className="text-2xl font-bold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground">
                  {feature.desc}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* SPLIT PROOF */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-4">
                Split Section Title
              </h2>
              <p className="text-lg text-muted-foreground mb-6">
                Compelling copy that builds trust and demonstrates value with social proof or data.
              </p>
              <ul className="space-y-3">
                {["Benefit one", "Benefit two", "Benefit three"].map((benefit, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" strokeWidth={1.75} />
                    <span className="text-muted-foreground">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div 
              className="aspect-video rounded-2xl bg-muted flex items-center justify-center"
              data-testid="image-proof"
            >
              <span className="text-muted-foreground">Image / Screenshot</span>
            </div>
          </div>
        </div>
      </section>

      {/* GUARANTEES (4) */}
      <section className="py-24 bg-muted/30">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Our Guarantees
            </h2>
            <p className="text-lg text-muted-foreground">
              Built on trust and security
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: Shield, title: "Guarantee 1" },
              { icon: Lock, title: "Guarantee 2" },
              { icon: CheckCircle2, title: "Guarantee 3" },
              { icon: Users, title: "Guarantee 4" }
            ].map((guarantee, i) => (
              <div key={i} className="text-center" data-testid={`guarantee-${i + 1}`}>
                <div className="mb-4 flex justify-center">
                  <guarantee.icon className="w-10 h-10 text-primary" strokeWidth={1.75} />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">
                  {guarantee.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  Short description
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ (6) */}
      <section className="py-24" id="faq">
        <div className="mx-auto max-w-3xl px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-muted-foreground">
              Everything you need to know
            </p>
          </div>

          <div className="space-y-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div 
                key={i} 
                className="border rounded-2xl"
                data-testid={`faq-${i}`}
              >
                <button
                  className="w-full p-6 text-left flex items-center justify-between hover-elevate"
                  onClick={() => setOpenFaqId(openFaqId === i ? null : i)}
                  data-testid={`button-faq-${i}`}
                >
                  <span className="font-medium text-foreground">
                    FAQ Question {i}
                  </span>
                  <ChevronDown 
                    className={`w-5 h-5 text-muted-foreground transition-transform ${
                      openFaqId === i ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {openFaqId === i && (
                  <div className="px-6 pb-6 text-muted-foreground">
                    Answer to question {i} goes here with helpful details.
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING TEASER */}
      <section className="py-24 bg-muted/30" id="pricing">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-lg text-muted-foreground">
              Choose the plan that's right for your team
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {["Starter", "Professional", "Enterprise"].map((plan, i) => (
              <Card key={i} className="p-6 rounded-2xl" data-testid={`card-pricing-${plan.toLowerCase()}`}>
                <h3 className="text-2xl font-bold text-foreground mb-2">
                  {plan}
                </h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold text-foreground">$XX</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <ul className="space-y-2 mb-6">
                  {[1, 2, 3].map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" strokeWidth={1.75} />
                      <span className="text-muted-foreground">Feature {feature}</span>
                    </li>
                  ))}
                </ul>
                <Button className="w-full" variant={i === 1 ? "default" : "outline"}>
                  Get started
                </Button>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA BAND */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-6">
          <Card className="p-6 rounded-2xl max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Join teams who are already using Teammato to build better feedback culture.
            </p>
            <Button 
              size="lg" 
              asChild
              data-testid="button-final-cta"
            >
              <a href={slackAuthUrl}>
                <MessageSquare className="w-5 h-5 mr-2" />
                Add to Slack - It's Free
              </a>
            </Button>
          </Card>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t py-12">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <MessageSquare className="w-5 h-5 text-primary" strokeWidth={1.75} />
                <span className="font-bold">Teammato</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Anonymous feedback for Slack teams
              </p>
            </div>
            <div>
              <h4 className="font-medium text-foreground mb-3">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#features" className="hover:text-foreground">Features</a></li>
                <li><a href="#pricing" className="hover:text-foreground">Pricing</a></li>
                <li><a href="#faq" className="hover:text-foreground">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-foreground mb-3">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="/about" className="hover:text-foreground">About</a></li>
                <li><a href="/contact" className="hover:text-foreground">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-foreground mb-3">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="/privacy" className="hover:text-foreground">Privacy</a></li>
                <li><a href="/terms" className="hover:text-foreground">Terms</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t text-center text-sm text-muted-foreground">
            © 2025 Teammato. All rights reserved.
          </div>
        </div>
      </footer>

      {/* STICKY INSTALL BAR */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background/95 backdrop-blur p-4 md:hidden">
        <Button 
          className="w-full" 
          asChild
          data-testid="button-install-bar"
        >
          <a href={slackAuthUrl}>
            <MessageSquare className="w-5 h-5 mr-2" />
            Add to Slack
          </a>
        </Button>
      </div>
    </div>
  );
}
