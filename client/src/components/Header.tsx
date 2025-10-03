import { useEffect, useState } from "react";

type NavItem = { label: string; href: string };

const NAV: NavItem[] = [
  { label: "Features", href: "/#features" },
  { label: "Pricing", href: "/pricing" },
  { label: "FAQ", href: "/#faq" },
  { label: "Trust", href: "/trust" },
  { label: "Contact", href: "/contact" },
];

export default function Header({
  authorizeUrl = "/api/slack/install",
  signinUrl = "/api/slack/install",
  installed = false,
  transparent = true,
}: {
  authorizeUrl?: string;
  signinUrl?: string;
  installed?: boolean;
  transparent?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [solid, setSolid] = useState(!transparent);

  useEffect(() => {
    if (!transparent) return;
    const onScroll = () => setSolid(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, [transparent]);

  return (
    <header
      className={[
        "sticky top-0 z-50 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        solid ? "bg-background/80 shadow-[0_1px_0_rgba(0,0,0,0.06)]" : "bg-transparent",
      ].join(" ")}
      role="banner"
    >
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-emerald-600 focus:px-3 focus:py-2 focus:text-white"
      >
        Skip to content
      </a>

      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <a href="/" className="group inline-flex items-center gap-2" aria-label="Teammato home">
          <Logo />
          <span className="text-[15px] font-semibold tracking-tight group-hover:opacity-90">Teammato</span>
        </a>

        <nav className="hidden items-center gap-6 md:flex">
          {NAV.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <a
            href={signinUrl}
            className="inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-sm hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            aria-label="Sign in with Slack"
          >
            <SlackGlyph className="h-4 w-4" />
            <span>Sign in with Slack</span>
          </a>
          <a
            href={installed ? "slack://open" : authorizeUrl}
            className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
          >
            {installed ? "Open in Slack" : "Add to Slack"}
          </a>
        </div>

        <button
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center justify-center rounded-lg border px-2.5 py-2 md:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label="Toggle menu"
        >
          <span className="sr-only">Menu</span>
          <Burger open={open} />
        </button>
      </div>

      <div
        id="mobile-nav"
        className={[
          "md:hidden",
          open ? "block" : "hidden",
        ].join(" ")}
      >
        <div className="border-t bg-background px-4 py-4 sm:px-6">
          <nav className="flex flex-col gap-3">
            {NAV.map((item) => (
              <a
                key={item.label}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-2 py-2 text-base text-foreground hover:bg-muted"
              >
                {item.label}
              </a>
            ))}
          </nav>
          <div className="mt-4 flex flex-col gap-2">
            <a
              href={signinUrl}
              className="inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2 text-sm hover:bg-muted"
            >
              <SlackGlyph className="h-4 w-4" />
              <span>Sign in with Slack</span>
            </a>
            <a
              href={installed ? "slack://open" : authorizeUrl}
              className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-emerald-700"
            >
              {installed ? "Open in Slack" : "Add to Slack"}
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}

function Logo() {
  return (
    <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-xl bg-foreground/10">
      <img
        src="/logo.svg"
        alt=""
        className="h-8 w-8 object-contain"
        onError={(e) => ((e.currentTarget.style.display = "none"))}
      />
      <span className="text-sm font-semibold">T</span>
    </span>
  );
}

function SlackGlyph({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <rect x="5" y="10" width="5" height="3" rx="1.5" className="fill-current opacity-80" />
      <rect x="14" y="10" width="5" height="3" rx="1.5" className="fill-current opacity-80" />
      <rect x="10" y="5" width="3" height="5" rx="1.5" className="fill-current opacity-80" />
      <rect x="10" y="14" width="3" height="5" rx="1.5" className="fill-current opacity-80" />
    </svg>
  );
}

function Burger({ open }: { open: boolean }) {
  return (
    <span
      className={[
        "relative block h-4 w-5",
        "before:absolute before:left-0 before:top-0 before:h-0.5 before:w-5 before:bg-foreground before:transition",
        "after:absolute after:left-0 after:bottom-0 after:h-0.5 after:w-5 after:bg-foreground after:transition",
        open ? "before:translate-y-1.5 before:rotate-45 after:-translate-y-1.5 after:-rotate-45" : "",
      ].join(" ")}
    >
      <span className="absolute left-0 top-1.5 h-0.5 w-5 bg-foreground transition opacity-100" style={{ opacity: open ? 0 : 1 }} />
    </span>
  );
}
