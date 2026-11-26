import Link from "next/link";
import { Logo } from "@/components/site/logo";
import { MobileNav } from "@/components/site/mobile-nav";
import { ThemeToggle } from "@/components/site/theme-toggle";
import { getActiveAdLinks } from "@/lib/data/ad-links";
import { getSiteText } from "@/lib/content/site-text";

const MAX_AD_LINKS_IN_NAV = 2;

// Deliberately session-free: reading auth cookies here would make every
// public page dynamic and uncacheable. Accounts live under /dashboard.
export async function SiteHeader() {
  const [allAdLinks, text] = await Promise.all([getActiveAdLinks(), getSiteText()]);
  const adLinks = allAdLinks.slice(0, MAX_AD_LINKS_IN_NAV);
  // Labels are edited in Admin > Site Content > Header & menu.
  const navLinks = [
    { href: "/", label: text.t("nav.today") },
    { href: "/predictions", label: text.t("nav.tomorrow") },
    { href: "/tips", label: text.t("nav.tips") },
    { href: "/competitions", label: text.t("nav.competitions") },
    { href: "/previous-results", label: text.t("nav.results") },
    { href: "/blog", label: text.t("nav.blog") },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Logo />

        <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
          {navLinks.map((link) => (
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
          <MobileNav links={navLinks} contactLabel={text.t("nav.contact")} sponsoredLabel={text.t("nav.sponsored")} adLinks={adLinks} />
        </div>
      </div>
    </header>
  );
}
