import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/site/logo";
import { MobileNav } from "@/components/site/mobile-nav";
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
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Logo />
        <nav className="hidden items-center gap-6 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
          {adLinks.length > 0 && <span className="h-4 w-px bg-border" aria-hidden />}
          {adLinks.map((link) => (
            <a
              key={link.id}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer sponsored"
              title={link.description ?? undefined}
              className="text-sm font-medium text-brand transition-colors hover:text-brand/80"
            >
              {link.title}
            </a>
          ))}
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          {isLoggedIn ? (
            <Button render={<Link href="/dashboard" />}>Dashboard</Button>
          ) : (
            <Button render={<Link href="/pricing" />}>View Pricing</Button>
          )}
        </div>
        <MobileNav isLoggedIn={isLoggedIn} adLinks={adLinks} />
      </div>
    </header>
  );
}
