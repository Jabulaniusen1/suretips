import Link from "next/link";
import { Logo } from "@/components/site/logo";
import { MobileNav } from "@/components/site/mobile-nav";
import { ThemeToggle } from "@/components/site/theme-toggle";
import { getActiveAdLinks } from "@/lib/data/ad-links";

export const NAV_LINKS = [
  { href: "/", label: "Today" },
  { href: "/predictions", label: "Tomorrow" },
  { href: "/tips", label: "Tips by Market" },
  { href: "/competitions", label: "Competitions" },
  { href: "/previous-results", label: "Results" },
  { href: "/blog", label: "Blog" },
];

const MAX_AD_LINKS_IN_NAV = 2;

// Deliberately session-free: reading auth cookies here would make every
// public page dynamic and uncacheable. Accounts live under /dashboard.
export async function SiteHeader() {
  const adLinks = (await getActiveAdLinks()).slice(0, MAX_AD_LINKS_IN_NAV);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Logo />

        <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {adLinks.length > 0 && (
            <div className="hidden items-center gap-2 xl:flex">
              {adLinks.map((link) => (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer sponsored"
                  title={link.description ?? undefined}
                  className="rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  {link.title}
                  <span className="sr-only"> (advertisement, opens in a new tab)</span>
                </a>
              ))}
            </div>
          )}
          <div className="hidden lg:block">
            <ThemeToggle />
          </div>
          <MobileNav links={NAV_LINKS} adLinks={adLinks} />
        </div>
      </div>
    </header>
  );
}
