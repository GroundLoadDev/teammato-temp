import { ShieldCheck } from "lucide-react";
import logoImage from "@assets/teammato_logo_transparent_1759614481870.png";

const nav = {
  product: [
    { label: "How It Works", href: "/how-it-works" },
    { label: "Features", href: "/features" },
    { label: "Pricing", href: "/pricing" },
    { label: "FAQ", href: "/faq" },
  ],
  company: [
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" },
  ],
  resources: [
    { label: "Docs", href: "/docs" },
    { label: "Trust & Security", href: "/trust" },
    { label: "Status", href: "/status" },
  ],
  legal: [
    { label: "Privacy", href: "/privacy" },
    { label: "Terms", href: "/terms" },
    { label: "DPA", href: "/dpa" },
  ],
};

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="relative border-t bg-background">
      <div className="mx-auto max-w-6xl px-6 py-16 lg:py-20">
        <div className="grid gap-12 md:grid-cols-12">
          <div className="md:col-span-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl">
                <img
                  src={logoImage}
                  alt="Teammato"
                  className="h-9 w-9 object-contain"
                />
              </div>
              <span className="text-lg font-semibold tracking-tight" style={{ color: '#0f172a' }}>Teammato</span>
            </div>

            <p className="mt-3 max-w-sm text-sm text-muted-foreground">
              Anonymous feedback for Slack teams. We store ciphertext, enforce k-anonymity, and keep PII out of logs.
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs text-foreground/80">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                k-anonymous by default
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs text-foreground/80">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                ciphertext at rest
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs text-foreground/80">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                no PII in logs
              </span>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <a
                href="https://medium.com/@teammato"
                className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm text-foreground/80 hover:bg-muted"
              >
                <MediumLogo className="h-4 w-4" />
                Medium
              </a>
              <a
                href="#"
                className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm text-foreground/80 hover:bg-muted"
              >
                <SlackGlyph className="h-4 w-4" />
                Slack App Directory
              </a>
            </div>
          </div>

          <nav className="grid grid-cols-2 gap-8 md:col-span-8 md:grid-cols-4">
            <Column title="Product" items={nav.product} />
            <Column title="Company" items={nav.company} />
            <Column title="Resources" items={nav.resources} />
            <Column title="Legal" items={nav.legal} />
          </nav>
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t pt-6 text-sm text-muted-foreground md:flex-row">
          <p>© {year} Teammato. All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-4">
            <a href="/privacy" className="hover:text-foreground">Privacy</a>
            <span className="opacity-30">•</span>
            <a href="/terms" className="hover:text-foreground">Terms</a>
            <span className="opacity-30">•</span>
            <a href="/cookies" className="hover:text-foreground">Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

function Column({ title, items }: { title: string; items: { label: string; href: string }[] }) {
  return (
    <div>
      <h4 className="text-sm font-semibold tracking-wide">{title}</h4>
      <ul className="mt-3 space-y-2">
        {items.map((i) => (
          <li key={i.label}>
            <a href={i.href} className="text-sm text-muted-foreground hover:text-foreground">
              {i.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

function MediumLogo({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <circle cx="12" cy="12" r="10" className="fill-foreground/20" />
      <path
        d="M7.5 8.5v7l3-4.2 3 4.2v-7l-3 4.2-3-4.2z"
        className="fill-foreground/80"
      />
    </svg>
  );
}

function SlackGlyph({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <rect x="5" y="10" width="5" height="3" rx="1.5" className="fill-foreground/80" />
      <rect x="14" y="10" width="5" height="3" rx="1.5" className="fill-foreground/80" />
      <rect x="10" y="5" width="3" height="5" rx="1.5" className="fill-foreground/80" />
      <rect x="10" y="14" width="3" height="5" rx="1.5" className="fill-foreground/80" />
    </svg>
  );
}
