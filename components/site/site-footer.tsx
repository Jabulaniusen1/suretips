import Link from "next/link";
import { Mail, Send } from "lucide-react";
import { Logo } from "@/components/site/logo";
import { FacebookIcon, InstagramIcon, XIcon, YoutubeIcon } from "@/components/site/social-icons";
import { getSiteConfig } from "@/lib/data/site-config";
import { getActiveCompetitions } from "@/lib/data/competitions";
import { getPublishedCustomPages } from "@/lib/data/custom-pages";
import { getMarketPage } from "@/lib/seo/market-pages";

const FOOTER_MARKETS = [
  "free",
  "safe-picks",
  "over-2-5",
  "over-1-5",
  "btts",
  "under-2-5",
  "home-win",
  "double-chance",
  // "correct-score", // DISABLED (correct score)
];

const TRUST_LINKS = [
  { href: "/about", label: "About us" },
  { href: "/methodology", label: "How our predictions work" },
  { href: "/editorial-standards", label: "Editorial standards" },
  { href: "/previous-results", label: "Previous results" },
  { href: "/responsible-betting", label: "Responsible betting" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
];

const LEGAL_LINKS = [
  { href: "/terms", label: "Terms" },
  { href: "/privacy", label: "Privacy" },
  { href: "/cookies", label: "Cookies" },
  { href: "/disclaimer", label: "Disclaimer" },
];

function SocialButton({ href, label, children }: { href: string; label: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      aria-label={label}
      target="_blank"
      rel="noopener noreferrer"
      className="flex size-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-zinc-400 transition-colors hover:border-brand/40 hover:text-brand"
    >
      {children}
    </a>
  );
}

function FooterColumn({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-sm font-semibold text-white">{title}</h2>
      <ul className="mt-4 space-y-2.5 text-sm text-zinc-400">{children}</ul>
    </div>
  );
}

export async function SiteFooter() {
  const [config, competitions, customPages] = await Promise.all([getSiteConfig(), getActiveCompetitions(), getPublishedCustomPages()]);
  const footerPages = customPages.filter((p) => p.show_in_footer);
  const socials = [
    { href: config.social_links.facebook, label: "Facebook", icon: FacebookIcon },
    { href: config.social_links.twitter, label: "X (Twitter)", icon: XIcon },
    { href: config.social_links.instagram, label: "Instagram", icon: InstagramIcon },
    { href: config.social_links.youtube, label: "YouTube", icon: YoutubeIcon },
  ].filter((s): s is typeof s & { href: string } => Boolean(s.href));

  return (
    <footer className="border-t border-border bg-ink text-ink-foreground">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-12 lg:px-8">
        <div className="lg:col-span-4">
          <Logo dark imgClassName="h-14 w-auto" />
          <p className="mt-4 max-w-sm text-sm text-zinc-400">
            Free football predictions, match data and a public record of every result we publish — wins and losses.
          </p>
          {(socials.length > 0 || config.telegram_url) && (
            <div className="mt-5 flex items-center gap-2.5">
              {socials.map(({ href, label, icon: Icon }) => (
                <SocialButton key={label} href={href} label={label}>
                  <Icon className="size-4" />
                </SocialButton>
              ))}
              {config.telegram_url && (
                <SocialButton href={config.telegram_url} label="Telegram">
                  <Send className="size-4" />
                </SocialButton>
              )}
            </div>
          )}
          <p className="mt-6 max-w-sm text-xs text-zinc-500">
            18+ only. Predictions are opinions based on data, not guarantees. Bet responsibly and within your means.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:col-span-8">
          <FooterColumn title="Predictions">
            <li>
              <Link href="/" className="hover:text-brand">Today&apos;s predictions</Link>
            </li>
            <li>
              <Link href="/predictions" className="hover:text-brand">Tomorrow&apos;s predictions</Link>
            </li>
            {FOOTER_MARKETS.map((slug) => {
              const page = getMarketPage(slug);
              return page ? (
                <li key={slug}>
                  <Link href={`/tips/${slug}`} className="hover:text-brand">
                    {page.tabLabel}
                  </Link>
                </li>
              ) : null;
            })}
            {footerPages.map((page) => (
              <li key={page.id}>
                <Link href={`/tips/${page.slug}`} className="hover:text-brand">
                  {page.footer_label || page.title}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/tips" className="font-medium text-zinc-300 hover:text-brand">All markets →</Link>
            </li>
          </FooterColumn>

          <FooterColumn title="Competitions">
            {competitions.slice(0, 9).map((comp) => (
              <li key={comp.id}>
                <Link href={`/competitions/${comp.slug}`} className="hover:text-brand">
                  {comp.name}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/competitions" className="font-medium text-zinc-300 hover:text-brand">All competitions →</Link>
            </li>
          </FooterColumn>

          <FooterColumn title="SureMatchContact">
            {TRUST_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="hover:text-brand">
                  {link.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/blog" className="hover:text-brand">Blog</Link>
            </li>
          </FooterColumn>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-6 text-xs text-zinc-400 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          {config.contact_email ? (
            <a href={`mailto:${config.contact_email}`} className="flex items-center gap-2 hover:text-brand">
              <Mail aria-hidden className="size-4" />
              {config.contact_email}
            </a>
          ) : (
            <span />
          )}
          <ul className="flex flex-wrap items-center gap-x-4 gap-y-2">
            {LEGAL_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="hover:text-brand">
                  {link.label}
                </Link>
              </li>
            ))}
            {/* User accounts are turned off; admins sign in at /login directly.
            <li>
              <Link href="/login" rel="nofollow" className="hover:text-brand">
                Account
              </Link>
            </li>
            */}
          </ul>
          <p className="text-zinc-500">© {new Date().getFullYear()} SureMatchContact</p>
        </div>
      </div>
    </footer>
  );
}
