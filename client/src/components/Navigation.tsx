import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Home, Settings, BarChart, Download, Clock, Slack, FileText, MessageSquare } from "lucide-react";

export function Navigation() {
  const [location] = useLocation();
  
  const isAdmin = location.startsWith("/admin");
  
  const publicLinks = [
    { href: "/", label: "Home", icon: Home },
    { href: "/pricing", label: "Pricing" },
    { href: "/faq", label: "FAQ" },
    { href: "/contact", label: "Contact" },
    { href: "/privacy", label: "Privacy" },
    { href: "/trust", label: "Trust" },
    { href: "/terms", label: "Terms" },
  ];

  const adminLinks = [
    { href: "/admin/get-started", label: "Dashboard", icon: Home },
    { href: "/admin/feedback", label: "Feedback", icon: MessageSquare },
    { href: "/admin/slack-settings", label: "Slack", icon: Slack },
    { href: "/admin/billing", label: "Billing", icon: FileText },
    { href: "/admin/analytics", label: "Analytics", icon: BarChart },
    { href: "/admin/export", label: "Export", icon: Download },
    { href: "/admin/retention", label: "Retention", icon: Clock },
  ];

  return (
    <nav className="border-b bg-card sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/">
          <Button variant="ghost" className="font-bold text-lg" data-testid="link-logo">
            Teammato
          </Button>
        </Link>
        
        <div className="flex items-center gap-1">
          {isAdmin ? (
            adminLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                <Button
                  variant={location === link.href ? "default" : "ghost"}
                  size="sm"
                  className="gap-2"
                  data-testid={`link-${link.label.toLowerCase()}`}
                >
                  {link.icon && <link.icon className="w-4 h-4" />}
                  {link.label}
                </Button>
              </Link>
            ))
          ) : (
            publicLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                <Button
                  variant={location === link.href ? "default" : "ghost"}
                  size="sm"
                  data-testid={`link-${link.label.toLowerCase()}`}
                >
                  {link.icon && <link.icon className="w-4 h-4 mr-2" />}
                  {link.label}
                </Button>
              </Link>
            ))
          )}
        </div>

        <div className="flex items-center gap-2">
          {!isAdmin && (
            <Link href="/auth">
              <Button variant="outline" size="sm" data-testid="button-sign-in">
                Sign In
              </Button>
            </Link>
          )}
          {isAdmin && (
            <Link href="/">
              <Button variant="outline" size="sm" data-testid="button-back-to-site">
                Back to Site
              </Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
