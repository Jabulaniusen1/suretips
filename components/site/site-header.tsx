import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/site/logo";
import { MobileNav } from "@/components/site/mobile-nav";
import { ThemeToggle } from "@/components/site/theme-toggle";
import { getActiveAdLinks } from "@/lib/data/ad-links";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/competitions", label: "Competitions" },
  { href: "/previous-results", label: "Previous Results" },
  { href: "/blog", label: "Blog" },
];

const MAX_AD_LINKS_IN_NAV = 3;

export async function SiteHeader() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const isLoggedIn = Boolean(data.user);
  const adLinks = (await getActiveAdLinks()).slice(0, MAX_AD_LINKS_IN_NAV);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-18 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Logo />

        <nav className="hidden items-center gap-1 rounded-full border border-border bg-muted/50 p-1 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full px-4 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {adLinks.length > 0 && (
          <div className="hidden items-center gap-3 xl:flex">
            {adLinks.map((link) => (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer sponsored"
                title={link.description ?? undefined}
                className="rounded-full border border-brand/30 bg-accent px-3 py-1 text-xs font-semibold text-brand transition-colors hover:bg-accent/70"
              >
                {link.title}
              </a>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2">
          <div className="hidden md:block">
            <ThemeToggle />
          </div>
          <div className="hidden items-center gap-2 md:flex">
            {isLoggedIn ? (
              <Button render={<Link href="/dashboard" />}>Dashboard</Button>
            ) : (
              <>
                <Button variant="ghost" render={<Link href="/login" />}>
                  Log In
                </Button>
                <Button render={<Link href="/signup" />}>Sign Up</Button>
              </>
            )}
          </div>
          <MobileNav isLoggedIn={isLoggedIn} adLinks={adLinks} />
        </div>
      </div>
    </header>
  );
}
